import { getRepository } from 'typeorm';
import { IntegrationConfig } from '../../models/IntegrationConfig';
import { AuditLog } from '../../models/AuditLog';
import { ExternalMapping } from '../../models/ExternalMapping';
import { SyncLog } from '../../models/SyncLog';
import { User } from '../../models/User';

export async function seedSampleData() {
  // --- Users ---
  const userRepo = getRepository(User);
  const superAdmin = userRepo.create({ username: 'superadmin', role: 'SuperAdmin', tenantId: null });
  const mallAdmin = userRepo.create({ username: 'malladmin', role: 'MallAdmin', tenantId: 'mall-1' });
  const tenantAdmin = userRepo.create({ username: 'tenantadmin', role: 'TenantAdmin', tenantId: 'tenant-1' });
  const readOnly = userRepo.create({ username: 'readonly', role: 'ReadOnly', tenantId: 'tenant-1' });
  await userRepo.save([superAdmin, mallAdmin, tenantAdmin, readOnly]);

  // --- Integrations ---
  const integrationRepo = getRepository(IntegrationConfig);
  const sap = integrationRepo.create({ name: 'SAP ERP', type: 'SAP', tenantId: 'mall-1', status: 'connected' });
  const salesforce = integrationRepo.create({ name: 'Salesforce CRM', type: 'Salesforce', tenantId: 'mall-1', status: 'connected' });
  const dynamics = integrationRepo.create({ name: 'Dynamics365', type: 'Dynamics365', tenantId: 'mall-2', status: 'disconnected' });
  const oracle = integrationRepo.create({ name: 'Oracle Financial', type: 'Oracle', tenantId: 'mall-2', status: 'connected' });
  sap.setCredentials({ apiKey: 'sap_key' });
  salesforce.setCredentials({ clientId: 'sf_id', clientSecret: 'sf_secret' });
  dynamics.setCredentials({ endpoint: 'https://dynamics.example.com/api' });
  oracle.setCredentials({ user: 'oracle_user', password: 'oracle_pass', endpoint: 'https://oracle.example.com/api' });
  await integrationRepo.save([sap, salesforce, dynamics, oracle]);

  // --- External Mappings ---
  const mappingRepo = getRepository(ExternalMapping);
  await mappingRepo.save([
    mappingRepo.create({ integrationConfig: sap, mallField: 'invoiceId', externalField: 'SAP_INVOICE_ID' }),
    mappingRepo.create({ integrationConfig: salesforce, mallField: 'customerId', externalField: 'SF_CUSTOMER_ID' }),
  ]);

  // --- Sync Logs ---
  const syncRepo = getRepository(SyncLog);
  await syncRepo.save([
    syncRepo.create({ integrationConfig: sap, operation: 'sync', status: 'success', details: 'Initial sync', startedAt: new Date(), finishedAt: new Date() }),
    syncRepo.create({ integrationConfig: salesforce, operation: 'sync', status: 'failed', details: 'API error', startedAt: new Date(), finishedAt: new Date() }),
  ]);

  // --- Audit Logs ---
  const auditRepo = getRepository(AuditLog);
  await auditRepo.save([
    auditRepo.create({ userId: superAdmin.id, userRole: 'SuperAdmin', action: 'create', resource: 'integration', resourceId: sap.id, resourceType: 'integration', endpoint: '/api/integrations', method: 'POST', success: true, timestamp: new Date() }),
    auditRepo.create({ userId: mallAdmin.id, userRole: 'MallAdmin', action: 'sync', resource: 'integration', resourceId: salesforce.id, resourceType: 'integration', endpoint: '/api/integrations/sync', method: 'POST', success: false, errorMessage: 'API error', timestamp: new Date() }),
  ]);

  // --- Security Events (as audit logs) ---
  await auditRepo.save([
    auditRepo.create({ userId: readOnly.id, userRole: 'ReadOnly', action: 'unauthorized-access', resource: 'integration', resourceId: sap.id, resourceType: 'integration', endpoint: '/api/integrations', method: 'DELETE', success: false, errorMessage: 'Forbidden', timestamp: new Date() }),
  ]);

  console.log('✅ Sample data seeded successfully');
} 