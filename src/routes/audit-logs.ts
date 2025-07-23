import { Router } from 'express';
import { getRepository, Between, Like } from 'typeorm';
import { AuditLog } from '../models/AuditLog';
import { authenticate } from '../middleware/auth';
import { authorizeIntegration } from '../middleware/rbac';
import { parse } from 'json2csv';

const router = Router();

// RBAC: Only SuperAdmin and MallAdmin can access audit logs
const adminRoles = ['SuperAdmin', 'MallAdmin'];

// GET /api/audit-logs - List with filtering, pagination, search
router.get('/', authenticate, authorizeIntegration('GET_/api/audit-logs'), async (req, res, next) => {
  try {
    const repo = getRepository(AuditLog);
    const {
      userId, role, action, resource, resourceId, success, startDate, endDate, search, page = 1, limit = 25, exportType
    } = req.query;
    const where: any = {};
    if (userId) where.userId = userId;
    if (role) where.userRole = role;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (success !== undefined) where.success = success === 'true';
    if (startDate && endDate) where.timestamp = Between(new Date(startDate as string), new Date(endDate as string));
    if (search) {
      where.username = Like(`%${search}%`);
      // Optionally add more fields to search
    }
    const [logs, total] = await repo.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });
    // Export functionality
    if (exportType === 'csv') {
      const csv = parse(logs);
      res.header('Content-Type', 'text/csv');
      res.attachment('audit-logs.csv');
      return res.send(csv);
    }
    if (exportType === 'json') {
      return res.json({ success: true, data: logs });
    }
    // Default: paginated JSON
    res.json({
      success: true,
      data: logs,
      meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) { next(err); }
});

// GET /api/audit-logs/stats - Audit statistics
router.get('/stats', authenticate, authorizeIntegration('GET_/api/audit-logs'), async (req, res, next) => {
  try {
    const repo = getRepository(AuditLog);
    const total = await repo.count();
    const byAction = await repo.createQueryBuilder('log')
      .select('log.action, COUNT(*) as count')
      .groupBy('log.action').getRawMany();
    const byUser = await repo.createQueryBuilder('log')
      .select('log.userId, COUNT(*) as count')
      .groupBy('log.userId').getRawMany();
    res.json({ success: true, total, byAction, byUser });
  } catch (err) { next(err); }
});

// DELETE /api/audit-logs/cleanup - Retention cleanup
router.delete('/cleanup', authenticate, authorizeIntegration('DELETE_/api/audit-logs'), async (req, res, next) => {
  try {
    const repo = getRepository(AuditLog);
    const { beforeDate } = req.body;
    if (!beforeDate) return res.status(400).json({ success: false, error: 'Missing beforeDate' });
    const result = await repo.createQueryBuilder()
      .delete()
      .where('timestamp < :beforeDate', { beforeDate: new Date(beforeDate) })
      .execute();
    res.json({ success: true, deleted: result.affected });
  } catch (err) { next(err); }
});

export default router; 