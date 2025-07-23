import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { IntegrationConfig } from '../models/IntegrationConfig';

export type IntegrationRole = 'SuperAdmin' | 'MallAdmin' | 'TenantAdmin' | 'ReadOnly';

// Permission matrix for integration endpoints
const permissions = {
  'GET_/api/integrations': ['SuperAdmin', 'MallAdmin', 'TenantAdmin', 'ReadOnly'],
  'POST_/api/integrations': ['SuperAdmin', 'MallAdmin'],
  'PUT_/api/integrations/:id': ['SuperAdmin', 'MallAdmin'],
  'DELETE_/api/integrations/:id': ['SuperAdmin'],
  'POST_/api/integrations/:id/sync': ['SuperAdmin', 'MallAdmin'],
  'POST_/api/integrations/:id/test-connection': ['SuperAdmin', 'MallAdmin'],
  'PUT_/api/integrations/:id/credentials': ['SuperAdmin'],
  'GET_/api/integrations/:id/logs': ['SuperAdmin', 'MallAdmin', 'TenantAdmin', 'ReadOnly'],
  'GET_/api/integrations/:id/errors': ['SuperAdmin', 'MallAdmin'],
  'GET_/api/integrations/:id/status': ['SuperAdmin', 'MallAdmin', 'TenantAdmin', 'ReadOnly'],
};

// RBAC middleware for integration endpoints
export function authorizeIntegration(endpoint: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const allowedRoles = permissions[endpoint];
    if (!allowedRoles || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

// Tenant-based access control for integration resources
export async function tenantAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const integrationId = req.params.id;
  if (user.role === 'SuperAdmin') return next();
  const repo = getRepository(IntegrationConfig);
  const integration = await repo.findOne(integrationId);
  if (!integration) {
    return res.status(404).json({ success: false, error: 'Integration not found' });
  }
  // Assume integration has a tenantId field
  if (user.role === 'MallAdmin' || user.role === 'TenantAdmin' || user.role === 'ReadOnly') {
    if (integration['tenantId'] && integration['tenantId'] !== user.tenantId) {
      return res.status(403).json({ success: false, error: 'Forbidden: cross-tenant access denied' });
    }
  }
  // Attach integration to request for downstream use
  req.integration = integration;
  next();
} 