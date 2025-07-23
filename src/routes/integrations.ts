import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { getRepository } from 'typeorm';
import { IntegrationConfig } from '../models/IntegrationConfig';
import { SyncLog } from '../models/SyncLog';
import { IntegrationError } from '../models/IntegrationError';
import { ExternalMapping } from '../models/ExternalMapping';
import { authenticate } from '../middleware/auth';
import { authorizeIntegration, tenantAccess } from '../middleware/rbac';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { auditLog, setAuditDetails } from '../middleware/audit';

const router = Router();

// --- Utility: Mask credentials in API responses ---
function maskCredentials(config: IntegrationConfig) {
  const { encryptedCredentials, accessToken, refreshToken, ...rest } = config;
  return { ...rest, credentials: '***MASKED***' };
}

// --- Security Middleware Config ---
const corsOptions = {
  origin: process.env.INTEGRATION_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
};
const limiterGet = rateLimit({ windowMs: 60 * 60 * 1000, max: 200, keyGenerator: req => req.user?.id || req.ip });
const limiterPost = rateLimit({ windowMs: 60 * 60 * 1000, max: 50, keyGenerator: req => req.user?.id || req.ip });
const limiterPut = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, keyGenerator: req => req.user?.id || req.ip });
const limiterDelete = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyGenerator: req => req.user?.id || req.ip });
const limiterSync = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, keyGenerator: req => req.user?.id || req.ip });
const limiterCred = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyGenerator: req => req.user?.id || req.ip });

function ipWhitelist(allowed: string[]) {
  return (req, res, next) => {
    if (!allowed.includes(req.ip)) {
      return res.status(403).json({ success: false, error: 'IP not allowed' });
    }
    next();
  };
}

// --- Apply global security middleware ---
router.use(helmet());
router.use(cors(corsOptions));
router.use(auditLog);

// --- GET /api/integrations (list with pagination, filtering, search) ---
router.get(
  '/',
  limiterGet,
  authenticate,
  authorizeIntegration('GET_/api/integrations'),
  async (req, res, next) => {
    try {
      // Tenant-based filtering: only show integrations for user's tenant unless SuperAdmin
      const user = req.user;
      const repo = getRepository(IntegrationConfig);
      let qb = repo.createQueryBuilder('integration');
      if (user.role !== 'SuperAdmin') {
        qb = qb.andWhere('integration.tenantId = :tenantId', { tenantId: user.tenantId });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const type = req.query.type as string;
      const sort = req.query.sort as string || 'createdAt:desc';
      if (search) qb = qb.andWhere('integration.name ILIKE :search', { search: `%${search}%` });
      if (type) qb = qb.andWhere('integration.type = :type', { type });
      const [sortField, sortDir] = sort.split(':');
      qb = qb.orderBy(`integration.${sortField}`, sortDir && sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');
      qb = qb.skip((page - 1) * limit).take(limit);
      const [items, total] = await qb.getManyAndCount();
      res.json({
        success: true,
        data: items.map(maskCredentials),
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
      setAuditDetails(res, { action: 'read', resource: 'integration', resourceType: 'integration' });
    } catch (err) { next(err); }
  }
);

// --- POST /api/integrations (create) ---
router.post(
  '/',
  limiterPost,
  authenticate,
  authorizeIntegration('POST_/api/integrations'),
  [
    body('name').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('credentials').isObject(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
      const repo = getRepository(IntegrationConfig);
      const { name, type, credentials } = req.body;
      const config = repo.create({ name, type, status: 'disconnected' });
      config.setCredentials(credentials);
      await repo.save(config);
      res.status(201).json({ success: true, data: maskCredentials(config) });
      setAuditDetails(res, { action: 'create', resource: 'integration', resourceType: 'integration', newValues: req.body });
    } catch (err) { next(err); }
  }
);

// --- GET /api/integrations/:id (details) ---
router.get(
  '/:id',
  limiterGet,
  authenticate,
  authorizeIntegration('GET_/api/integrations'),
  tenantAccess,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
      const repo = getRepository(IntegrationConfig);
      const config = await repo.findOne(req.params.id, { relations: ['syncLogs', 'mappings', 'errors'] });
      if (!config) return res.status(404).json({ success: false, error: 'Integration not found' });
      res.json({ success: true, data: maskCredentials(config) });
      setAuditDetails(res, { action: 'read', resource: 'integration', resourceId: req.params.id, resourceType: 'integration' });
    } catch (err) { next(err); }
  }
);

// --- PUT /api/integrations/:id (update config/credentials) ---
router.put(
  '/:id',
  limiterPut,
  authenticate,
  authorizeIntegration('PUT_/api/integrations/:id'),
  tenantAccess,
  [param('id').isUUID(), body('name').optional().isString(), body('type').optional().isString(), body('credentials').optional().isObject()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
      const repo = getRepository(IntegrationConfig);
      const config = await repo.findOne(req.params.id);
      if (!config) return res.status(404).json({ success: false, error: 'Integration not found' });
      if (req.body.name) config.name = req.body.name;
      if (req.body.type) config.type = req.body.type;
      if (req.body.credentials) config.setCredentials(req.body.credentials);
      await repo.save(config);
      res.json({ success: true, data: maskCredentials(config) });
      setAuditDetails(res, { action: 'update', resource: 'integration', resourceId: req.params.id, resourceType: 'integration', newValues: req.body });
    } catch (err) { next(err); }
  }
);

// --- DELETE /api/integrations/:id (delete) ---
router.delete(
  '/:id',
  limiterDelete,
  authenticate,
  authorizeIntegration('DELETE_/api/integrations/:id'),
  tenantAccess,
  ipWhitelist((process.env.INTEGRATION_ADMIN_IPS || '').split(',')),
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
      const repo = getRepository(IntegrationConfig);
      const config = await repo.findOne(req.params.id);
      if (!config) return res.status(404).json({ success: false, error: 'Integration not found' });
      await repo.remove(config);
      res.json({ success: true, message: 'Integration deleted' });
      setAuditDetails(res, { action: 'delete', resource: 'integration', resourceId: req.params.id, resourceType: 'integration' });
    } catch (err) { next(err); }
  }
);

// --- Specialized Endpoints (with security middleware) ---
router.post('/:id/test-connection', limiterPost, authenticate, authorizeIntegration('POST_/api/integrations/:id/test-connection'), tenantAccess, (req, res) => { setAuditDetails(res, { action: 'test-connection', resource: 'integration', resourceId: req.params.id }); res.status(501).json({ success: false, error: 'Not implemented' }); });
router.post('/:id/sync', limiterSync, authenticate, authorizeIntegration('POST_/api/integrations/:id/sync'), tenantAccess, (req, res) => { setAuditDetails(res, { action: 'sync', resource: 'integration', resourceId: req.params.id }); res.status(501).json({ success: false, error: 'Not implemented' }); });
router.get('/:id/logs', limiterGet, authenticate, authorizeIntegration('GET_/api/integrations/:id/logs'), tenantAccess, (req, res) => { setAuditDetails(res, { action: 'read-logs', resource: 'integration', resourceId: req.params.id }); res.status(501).json({ success: false, error: 'Not implemented' }); });
router.get('/:id/errors', limiterGet, authenticate, authorizeIntegration('GET_/api/integrations/:id/errors'), tenantAccess, (req, res) => { setAuditDetails(res, { action: 'read-errors', resource: 'integration', resourceId: req.params.id }); res.status(501).json({ success: false, error: 'Not implemented' }); });
router.get('/:id/status', limiterGet, authenticate, authorizeIntegration('GET_/api/integrations/:id/status'), tenantAccess, (req, res) => { setAuditDetails(res, { action: 'read-status', resource: 'integration', resourceId: req.params.id }); res.status(501).json({ success: false, error: 'Not implemented' }); });
router.post('/:id/retry-sync', limiterSync, authenticate, authorizeIntegration('POST_/api/integrations/:id/sync'), tenantAccess, (req, res) => { setAuditDetails(res, { action: 'retry-sync', resource: 'integration', resourceId: req.params.id }); res.status(501).json({ success: false, error: 'Not implemented' }); });
router.put('/:id/credentials', limiterCred, authenticate, authorizeIntegration('PUT_/api/integrations/:id/credentials'), tenantAccess, ipWhitelist((process.env.INTEGRATION_ADMIN_IPS || '').split(',')), (req, res) => { setAuditDetails(res, { action: 'update-credentials', resource: 'integration', resourceId: req.params.id }); res.status(501).json({ success: false, error: 'Not implemented' }); });

// --- Centralized Error Handler for Integration Routes ---
router.use((err, req, res, next) => {
  console.error('[Integration API]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

export default router; 