import { logger } from '../utils/logger';

const UAE_VAT_RATE = 0.05;

export class VATService {
  // In production, check tenant exemption from DB
  static async isTenantExempt(tenantId?: string): Promise<boolean> {
    // TODO: Replace with real DB check
    return false;
  }

  static async calculateVAT(amount: number, tenantId?: string): Promise<number> {
    const exempt = await this.isTenantExempt(tenantId);
    if (exempt) {
      logger.info('Tenant is VAT exempt', { tenantId });
      return 0;
    }
    const vat = +(amount * UAE_VAT_RATE).toFixed(2);
    logger.info('VAT calculated', { amount, vat, tenantId });
    return vat;
  }
} 