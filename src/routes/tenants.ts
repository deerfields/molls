/**
 * MallOS Enterprise - Tenant Management Routes
 * Tenant registration, onboarding, and management APIs
 */

import express from 'express';
import { Request, Response } from 'express';
import { Tenant, TenantStatus, TenantType, BusinessCategory } from '@/models/Tenant';
import { Mall } from '@/models/Mall';
import { database } from '@/config/database';
import { logger } from '@/utils/logger';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@/models/User';

const router = express.Router();

// Get all tenants (with pagination and filtering)
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, type, category, mallId, search } = req.query;
    const tenantRepo = database.getRepository(Tenant);
    
    const queryBuilder = tenantRepo.createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.mall', 'mall');
    
    // Apply filters
    if (status) queryBuilder.andWhere('tenant.status = :status', { status });
    if (type) queryBuilder.andWhere('tenant.type = :type', { type });
    if (category) queryBuilder.andWhere('tenant.category = :category', { category });
    if (mallId) queryBuilder.andWhere('tenant.mallId = :mallId', { mallId });
    if (search) {
      queryBuilder.andWhere(
        '(tenant.businessName ILIKE :search OR tenant.tradingName ILIKE :search OR tenant.tenantCode ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));
    
    const [tenants, total] = await queryBuilder.getManyAndCount();
    
    return res.json({
      tenants: tenants.map(tenant => ({
        id: tenant.id,
        tenantCode: tenant.tenantCode,
        businessName: tenant.businessName,
        tradingName: tenant.tradingName,
        type: tenant.type,
        category: tenant.category,
        status: tenant.status,
        mallId: tenant.mallId,
        mallName: tenant.mall?.name,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        leaseStartDate: tenant.leaseStartDate,
        leaseEndDate: tenant.leaseEndDate,
        createdAt: tenant.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error('Get tenants error', err);
    return res.status(500).json({ message: 'Failed to fetch tenants' });
  }
});

// Get tenant by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantRepo = database.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ 
      where: { id },
      relations: ['mall']
    });
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    return res.json({
      id: tenant.id,
      tenantCode: tenant.tenantCode,
      businessName: tenant.businessName,
      tradingName: tenant.tradingName,
      type: tenant.type,
      category: tenant.category,
      status: tenant.status,
      mallId: tenant.mallId,
      mall: tenant.mall,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      contactFax: tenant.contactFax,
      website: tenant.website,
      contactPerson: tenant.contactPerson,
      address: tenant.address,
      businessDetails: tenant.businessDetails,
      leaseDetails: tenant.leaseDetails,
      financialInfo: tenant.financialInfo,
      compliance: tenant.compliance,
      spaceDetails: tenant.spaceDetails,
      services: tenant.services,
      marketing: tenant.marketing,
      performance: tenant.performance,
      settings: tenant.settings,
      metadata: tenant.metadata,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    });
  } catch (err) {
    logger.error('Get tenant error', err);
    return res.status(500).json({ message: 'Failed to fetch tenant' });
  }
});

// Register new tenant
router.post('/register', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      mallId,
      businessName,
      tradingName,
      type,
      category,
      contactEmail,
      contactPhone,
      contactFax,
      website,
      contactPerson,
      address,
      businessDetails,
      leaseDetails
    } = req.body;
    
    const tenantRepo = database.getRepository(Tenant);
    const mallRepo = database.getRepository(Mall);
    
    // Verify mall exists
    const mall = await mallRepo.findOne({ where: { id: mallId } });
    if (!mall) {
      return res.status(404).json({ message: 'Mall not found' });
    }
    
    // Check if tenant already exists
    const existing = await tenantRepo.findOne({ 
      where: { businessName, mallId }
    });
    if (existing) {
      return res.status(409).json({ message: 'Tenant already exists in this mall' });
    }
    
    const tenant = tenantRepo.create({
      mallId,
      businessName,
      tradingName,
      type: type || TenantType.RETAIL,
      category: category || BusinessCategory.GENERAL_RETAIL,
      contactEmail,
      contactPhone,
      contactFax,
      website,
      contactPerson,
      address,
      businessDetails,
      leaseDetails,
      status: TenantStatus.PENDING_APPROVAL
    });
    
    await tenantRepo.save(tenant);
    logger.info(`Tenant registered: ${tenant.businessName} in mall ${mallId}`);
    
    return res.status(201).json({
      message: 'Tenant registration submitted successfully',
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode
    });
  } catch (err) {
    logger.error('Tenant registration error', err);
    return res.status(500).json({ message: 'Failed to register tenant' });
  }
});

// Update tenant
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const tenantRepo = database.getRepository(Tenant);
    
    const tenant = await tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Update allowed fields
    Object.assign(tenant, updateData);
    
    await tenantRepo.save(tenant);
    logger.info(`Tenant updated: ${tenant.businessName} by ${req.user.id}`);
    
    return res.json({ message: 'Tenant updated successfully' });
  } catch (err) {
    logger.error('Update tenant error', err);
    return res.status(500).json({ message: 'Failed to update tenant' });
  }
});

// Approve tenant
router.post('/:id/approve', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantRepo = database.getRepository(Tenant);
    
    const tenant = await tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    tenant.status = TenantStatus.ACTIVE;
    await tenantRepo.save(tenant);
    
    logger.info(`Tenant approved: ${tenant.businessName} by ${req.user.id}`);
    return res.json({ message: 'Tenant approved successfully' });
  } catch (err) {
    logger.error('Approve tenant error', err);
    return res.status(500).json({ message: 'Failed to approve tenant' });
  }
});

// Reject tenant
router.post('/:id/reject', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const tenantRepo = database.getRepository(Tenant);
    
    const tenant = await tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    tenant.status = TenantStatus.REJECTED;
    tenant.metadata = { ...tenant.metadata, rejectionReason: reason };
    await tenantRepo.save(tenant);
    
    logger.info(`Tenant rejected: ${tenant.businessName} by ${req.user.id}`);
    return res.json({ message: 'Tenant rejected successfully' });
  } catch (err) {
    logger.error('Reject tenant error', err);
    return res.status(500).json({ message: 'Failed to reject tenant' });
  }
});

// Get tenant statistics
router.get('/stats/overview', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const tenantRepo = database.getRepository(Tenant);
    
    const [totalTenants, activeTenants, pendingTenants, rejectedTenants] = await Promise.all([
      tenantRepo.count(),
      tenantRepo.count({ where: { status: TenantStatus.ACTIVE } }),
      tenantRepo.count({ where: { status: TenantStatus.PENDING_APPROVAL } }),
      tenantRepo.count({ where: { status: TenantStatus.REJECTED } })
    ]);
    
    const categoryStats = await tenantRepo
      .createQueryBuilder('tenant')
      .select('tenant.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tenant.category')
      .getRawMany();
    
    const typeStats = await tenantRepo
      .createQueryBuilder('tenant')
      .select('tenant.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tenant.type')
      .getRawMany();
    
    return res.json({
      totalTenants,
      activeTenants,
      pendingTenants,
      rejectedTenants,
      categoryStats,
      typeStats
    });
  } catch (err) {
    logger.error('Get tenant stats error', err);
    return res.status(500).json({ message: 'Failed to fetch tenant statistics' });
  }
});

export default router; 