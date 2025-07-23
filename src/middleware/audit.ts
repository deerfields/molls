import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { AuditLog } from '../models/AuditLog';

export async function auditLog(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', async () => {
    try {
      const user = req.user || {};
      const log = new AuditLog();
      log.userId = user.id;
      log.userRole = user.role;
      log.username = user.username;
      log.tenantId = user.tenantId;
      log.ipAddress = req.ip;
      log.userAgent = req.headers['user-agent'];
      log.requestId = req.headers['x-request-id'] as string;
      log.endpoint = req.originalUrl;
      log.method = req.method;
      log.action = res.locals.auditAction || req.method;
      log.resource = res.locals.auditResource;
      log.resourceId = res.locals.auditResourceId;
      log.resourceType = res.locals.auditResourceType;
      log.oldValues = res.locals.auditOldValues;
      log.newValues = res.locals.auditNewValues;
      log.duration = Date.now() - start;
      log.success = res.statusCode < 400;
      log.errorMessage = res.locals.auditError || (res.statusCode >= 400 ? res.statusMessage : undefined);
      await getRepository(AuditLog).save(log);
    } catch (err) {
      // Fail silently to avoid blocking response
      // Optionally log to external system
    }
  });
  next();
}

// Helper to set audit log details in route handlers
export function setAuditDetails(res: Response, details: Partial<AuditLog>) {
  Object.assign(res.locals, details);
} 