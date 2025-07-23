import Stripe from 'stripe';
import { logger } from '../../utils/logger';
// import { AuditLog } from '../../models/AuditLog'; // Uncomment if needed
// NOTE: For type safety, ensure you have installed @types/node and @types/stripe as dev dependencies.
// import type { Buffer } from 'node:buffer'; // Uncomment if needed for strict TS
// import process from 'process'; // Not needed in Node.js, but for TS type safety

const STRIPE_API_KEY = process.env.STRIPE_API_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export class StripeService {
  private stripe: Stripe;
  private logger: typeof logger;

  constructor() {
    this.stripe = new Stripe(STRIPE_API_KEY, { apiVersion: '2023-10-16' });
    this.logger = logger;
  }

  // Create a payment intent for one-time payments
  async createPaymentIntent({ amount, currency, customerId, metadata }: { amount: number; currency: string; customerId?: string; metadata?: any; }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: { enabled: true },
      });
      this.logger.info('Stripe payment intent created', { paymentIntent });
      // AuditLog.log(...)
      return paymentIntent;
    } catch (error) {
      this.logger.error('Stripe payment intent error', { error });
      throw error;
    }
  }

  // Create a subscription for recurring payments
  async createSubscription({ customerId, priceId, metadata }: { customerId: string; priceId: string; metadata?: any; }) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      this.logger.info('Stripe subscription created', { subscription });
      return subscription;
    } catch (error) {
      this.logger.error('Stripe subscription error', { error });
      throw error;
    }
  }

  // Capture a payment (confirm payment intent)
  async capturePayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId);
      this.logger.info('Stripe payment captured', { paymentIntent });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Stripe capture payment error', { error });
      throw error;
    }
  }

  // Refund a payment
  async refundPayment(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });
      this.logger.info('Stripe refund created', { refund });
      return refund;
    } catch (error) {
      this.logger.error('Stripe refund error', { error });
      throw error;
    }
  }

  // Get customer payment history
  async getPaymentHistory(customerId: string) {
    try {
      const payments = await this.stripe.paymentIntents.list({ customer: customerId, limit: 100 });
      this.logger.info('Stripe payment history fetched', { customerId });
      return payments.data;
    } catch (error) {
      this.logger.error('Stripe payment history error', { error });
      throw error;
    }
  }

  // Get customer details
  async getCustomer(customerId: string) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      this.logger.info('Stripe customer fetched', { customerId });
      return customer;
    } catch (error) {
      this.logger.error('Stripe get customer error', { error });
      throw error;
    }
  }

  // Create or update a customer
  async upsertCustomer({ email, name, metadata }: { email: string; name?: string; metadata?: any; }) {
    try {
      // Try to find existing customer by email (Stripe does not support direct search, so this is a placeholder)
      // In production, store Stripe customerId in your DB for lookup
      const customer = await this.stripe.customers.create({ email, name, metadata });
      this.logger.info('Stripe customer upserted', { customer });
      return customer;
    } catch (error) {
      this.logger.error('Stripe upsert customer error', { error });
      throw error;
    }
  }

  // Handle Stripe webhooks securely
  verifyAndHandleWebhook(signature: string, payload: Buffer, handler: (event: Stripe.Event) => Promise<void>) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
      this.logger.info('Stripe webhook verified', { eventType: event.type });
    } catch (err) {
      this.logger.error('Stripe webhook signature verification failed', { err });
      throw new Error('Invalid Stripe webhook signature');
    }
    return handler(event);
  }

  // Add more methods for payment method management, retry logic, etc.
} 