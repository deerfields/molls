import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { UserRole } from '../models/User';
import { StripeService } from '../services/integrations/StripeService';
import { body, param, query, validationResult } from 'express-validator';
import { CurrencyService } from '../services/CurrencyService';
import { VATService } from '../services/VATService';
import { getRepository } from 'typeorm';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';
import { Transaction } from '../models/Transaction';
import { AuditLog } from '../models/AuditLog';
import { Customer } from '../models/Customer';

const router = Router();
const stripeService = new StripeService();

// Helper: Secure error handler
function handlePaymentError(res: Response, error: any) {
  // Log error, mask sensitive details
  res.status(400).json({ success: false, error: error.message || 'Payment processing error' });
}

// Helper: Write audit log
async function writeAuditLog(req, action, resource, resourceId, success, errorMessage) {
  const repo = getRepository(AuditLog);
  await repo.save({
    userId: req.user?.id,
    userRole: req.user?.role,
    username: req.user?.username,
    tenantId: req.user?.tenantId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    endpoint: req.originalUrl,
    method: req.method,
    action,
    resource,
    resourceId,
    success,
    errorMessage,
    timestamp: new Date(),
  });
}

// POST /api/payments/stripe/create-payment-intent
router.post(
  '/stripe/create-payment-intent',
  authenticate,
  authorize([UserRole.SUPER_ADMIN, UserRole.MALL_ADMIN, UserRole.TENANT_ADMIN]),
  auditLog,
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('currency').isIn(['AED', 'USD', 'EUR', 'GBP']).withMessage('Invalid currency'),
  body('customerId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      let { amount, currency, customerId, metadata, tenantId } = req.body;
      tenantId = tenantId || req.user.tenantId;
      // Convert to AED if needed
      const amountAED = currency === 'AED' ? amount : await CurrencyService.convertAmount(amount, currency, 'AED');
      // Calculate VAT
      const vat = await VATService.calculateVAT(amountAED, tenantId);
      const totalAmount = +(amountAED + vat).toFixed(2);
      // Create payment intent in Stripe (amount in fils)
      const paymentIntent = await stripeService.createPaymentIntent({ amount: Math.round(totalAmount * 100), currency: 'AED', customerId, metadata: { ...metadata, vat, tenantId } });
      // Persist Payment
      const paymentRepo = getRepository(Payment);
      const payment = paymentRepo.create({
        stripePaymentId: paymentIntent.id,
        amount: totalAmount,
        currency: 'AED',
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method_types?.[0],
        customerId,
        tenantId,
        metadata: { ...metadata, vat },
      });
      await paymentRepo.save(payment);
      await writeAuditLog(req, 'create', 'payment', payment.id, true);
      // TODO: Trigger notification, update dashboard, monitoring
      res.json({ success: true, paymentIntent, payment });
    } catch (error) {
      await writeAuditLog(req, 'create', 'payment', null, false, error.message);
      handlePaymentError(res, error);
    }
  }
);

// POST /api/payments/stripe/create-subscription
router.post(
  '/stripe/create-subscription',
  authenticate,
  authorize([UserRole.SUPER_ADMIN, UserRole.MALL_ADMIN, UserRole.TENANT_ADMIN]),
  auditLog,
  body('customerId').isString().notEmpty(),
  body('priceId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      let { customerId, priceId, metadata, tenantId } = req.body;
      tenantId = tenantId || req.user.tenantId;
      // TODO: Plan validation, billing cycle, etc.
      const subscription = await stripeService.createSubscription({ customerId, priceId, metadata: { ...metadata, tenantId } });
      // Persist Subscription
      const subRepo = getRepository(Subscription);
      const sub = subRepo.create({
        stripeSubscriptionId: subscription.id,
        customerId,
        tenantId,
        planId: priceId,
        status: subscription.status,
        billingCycle: subscription.items.data[0]?.plan?.interval || 'monthly',
        amount: subscription.items.data[0]?.plan?.amount ? subscription.items.data[0].plan.amount / 100 : 0,
        currency: subscription.items.data[0]?.plan?.currency?.toUpperCase() || 'AED',
        startDate: new Date(subscription.start_date * 1000),
        endDate: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
        nextBillingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      });
      await subRepo.save(sub);
      await writeAuditLog(req, 'create', 'subscription', sub.id, true);
      // TODO: Notification, dashboard, monitoring
      res.json({ success: true, subscription, sub });
    } catch (error) {
      await writeAuditLog(req, 'create', 'subscription', null, false, error.message);
      handlePaymentError(res, error);
    }
  }
);

// POST /api/payments/stripe/capture-payment
router.post(
  '/stripe/capture-payment',
  authenticate,
  authorize([UserRole.SUPER_ADMIN, UserRole.MALL_ADMIN]),
  auditLog,
  body('paymentIntentId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { paymentIntentId } = req.body;
      const paymentIntent = await stripeService.capturePayment(paymentIntentId);
      // Update Payment status
      const paymentRepo = getRepository(Payment);
      const payment = await paymentRepo.findOne({ where: { stripePaymentId: paymentIntentId } });
      if (payment) {
        payment.status = paymentIntent.status;
        await paymentRepo.save(payment);
      }
      await writeAuditLog(req, 'capture', 'payment', payment?.id, true);
      // TODO: Notification, dashboard, monitoring
      res.json({ success: true, paymentIntent, payment });
    } catch (error) {
      await writeAuditLog(req, 'capture', 'payment', null, false, error.message);
      handlePaymentError(res, error);
    }
  }
);

// POST /api/payments/stripe/refund
router.post(
  '/stripe/refund',
  authenticate,
  authorize([UserRole.SUPER_ADMIN, UserRole.MALL_ADMIN]),
  auditLog,
  body('paymentIntentId').isString().notEmpty(),
  body('amount').optional().isFloat({ gt: 0 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { paymentIntentId, amount } = req.body;
      const refund = await stripeService.refundPayment(paymentIntentId, amount ? Math.round(amount * 100) : undefined);
      // Update Payment/Transaction
      const paymentRepo = getRepository(Payment);
      const payment = await paymentRepo.findOne({ where: { stripePaymentId: paymentIntentId } });
      if (payment) {
        payment.status = 'refunded';
        await paymentRepo.save(payment);
      }
      const txRepo = getRepository(Transaction);
      const tx = txRepo.create({
        paymentId: payment?.id,
        type: 'refund',
        amount: amount || payment?.amount,
        currency: payment?.currency || 'AED',
        status: 'completed',
        stripeTransactionId: refund.id,
        description: 'Stripe refund',
        timestamp: new Date(),
      });
      await txRepo.save(tx);
      await writeAuditLog(req, 'refund', 'payment', payment?.id, true);
      // TODO: Notification, dashboard, monitoring
      res.json({ success: true, refund, payment });
    } catch (error) {
      await writeAuditLog(req, 'refund', 'payment', null, false, error.message);
      handlePaymentError(res, error);
    }
  }
);

// GET /api/payments/stripe/payment-history
router.get(
  '/stripe/payment-history',
  authenticate,
  authorize([UserRole.SUPER_ADMIN, UserRole.MALL_ADMIN, UserRole.TENANT_ADMIN, UserRole.TENANT_USER]),
  auditLog,
  query('customerId').optional().isString(),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { customerId, status, page = 1, limit = 20 } = req.query;
      const paymentRepo = getRepository(Payment);
      // Tenant isolation
      const where: any = { tenantId: req.user.tenantId };
      if (customerId) where.customerId = customerId;
      if (status) where.status = status;
      const [payments, total] = await paymentRepo.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: ((+page) - 1) * (+limit),
        take: +limit,
      });
      await writeAuditLog(req, 'list', 'payment', null, true);
      res.json({ success: true, payments, total, page: +page, limit: +limit });
    } catch (error) {
      await writeAuditLog(req, 'list', 'payment', null, false, error.message);
      handlePaymentError(res, error);
    }
  }
);

// GET /api/payments/stripe/customer/:id
router.get(
  '/stripe/customer/:id',
  authenticate,
  authorize([UserRole.SUPER_ADMIN, UserRole.MALL_ADMIN, UserRole.TENANT_ADMIN, UserRole.TENANT_USER]),
  auditLog,
  param('id').isString().notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      // Tenant/customer validation
      const customerRepo = getRepository(Customer);
      const customer = await customerRepo.findOne({ where: { stripeCustomerId: req.params.id, tenantId: req.user.tenantId } });
      if (!customer) throw new Error('Customer not found or access denied');
      // Optionally fetch from Stripe as well
      const stripeCustomer = await stripeService.getCustomer(req.params.id);
      await writeAuditLog(req, 'get', 'customer', customer.id, true);
      res.json({ success: true, customer, stripeCustomer });
    } catch (error) {
      await writeAuditLog(req, 'get', 'customer', null, false, error.message);
      handlePaymentError(res, error);
    }
  }
);

// PUT /api/payments/stripe/payment-method
router.put(
  '/stripe/payment-method',
  authenticate,
  authorize([UserRole.SUPER_ADMIN, UserRole.MALL_ADMIN, UserRole.TENANT_ADMIN]),
  auditLog,
  body('customerId').isString().notEmpty(),
  body('paymentMethodId').isString().notEmpty(),
  body('isDefault').optional().isBoolean(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      // TODO: Payment method update, security validation, set default
      // Example: await stripeService.updatePaymentMethod(...)
      await writeAuditLog(req, 'update', 'payment_method', req.body.paymentMethodId, true);
      res.json({ success: true, message: 'Payment method updated (stub)' });
    } catch (error) {
      await writeAuditLog(req, 'update', 'payment_method', null, false, error.message);
      handlePaymentError(res, error);
    }
  }
);

// POST /api/payments/stripe/webhook
router.post(
  '/stripe/webhook',
  auditLog,
  async (req: Request, res: Response) => {
    try {
      // Signature verification, idempotency, event processing
      const signature = req.headers['stripe-signature'];
      if (!signature) throw new Error('Missing Stripe signature');
      await stripeService.verifyAndHandleWebhook(signature as string, req.body, async (event) => {
        // TODO: Process event, update DB, audit log
        // Example: if (event.type === 'payment_intent.succeeded') { ... }
      });
      // Write audit log (webhook events may not have user context)
      const repo = getRepository(AuditLog);
      await repo.save({
        endpoint: req.originalUrl,
        method: req.method,
        action: 'webhook',
        resource: 'stripe_event',
        resourceId: null,
        success: true,
        timestamp: new Date(),
      });
      res.json({ success: true, message: 'Webhook received' });
    } catch (error) {
      const repo = getRepository(AuditLog);
      await repo.save({
        endpoint: req.originalUrl,
        method: req.method,
        action: 'webhook',
        resource: 'stripe_event',
        resourceId: null,
        success: false,
        errorMessage: error.message,
        timestamp: new Date(),
      });
      handlePaymentError(res, error);
    }
  }
);

export default router; 