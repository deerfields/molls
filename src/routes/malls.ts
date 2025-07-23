/**
 * MallOS Enterprise - Mall Management Routes
 * Mall configuration, setup, and management APIs
 */

import express from 'express';
import { Request, Response } from 'express';
import { Mall, MallStatus, MallType, MallClass } from '@/models/Mall';
import { Tenant } from '@/models/Tenant';
import { database } from '@/config/database';
import { logger } from '@/utils/logger';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@/models/User';

const router = express.Router();

// Get all malls (with pagination and filtering)
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, type, class: mallClass, search } = req.query;
    const mallRepo = database.getRepository(Mall);
    
    const queryBuilder = mallRepo.createQueryBuilder('mall');
    
    // Apply filters
    if (status) queryBuilder.andWhere('mall.status = :status', { status });
    if (type) queryBuilder.andWhere('mall.type = :type', { type });
    if (mallClass) queryBuilder.andWhere('mall.class = :class', { class: mallClass });
    if (search) {
      queryBuilder.andWhere(
        '(mall.name ILIKE :search OR mall.tradingName ILIKE :search OR mall.mallCode ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));
    
    const [malls, total] = await queryBuilder.getManyAndCount();
    
    return res.json({
      malls: malls.map(mall => ({
        id: mall.id,
        mallCode: mall.mallCode,
        name: mall.name,
        tradingName: mall.tradingName,
        type: mall.type,
        class: mall.class,
        status: mall.status,
        location: mall.location,
        contact: mall.contact,
        facilityDetails: mall.facilityDetails,
        operatingHours: mall.operatingHours,
        createdAt: mall.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error('Get malls error', err);
    return res.status(500).json({ message: 'Failed to fetch malls' });
  }
});

// Get mall by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mallRepo = database.getRepository(Mall);
    const mall = await mallRepo.findOne({ where: { id } });
    
    if (!mall) {
      return res.status(404).json({ message: 'Mall not found' });
    }
    
    return res.json({
      id: mall.id,
      mallCode: mall.mallCode,
      name: mall.name,
      tradingName: mall.tradingName,
      type: mall.type,
      class: mall.class,
      status: mall.status,
      location: mall.location,
      contact: mall.contact,
      facilityDetails: mall.facilityDetails,
      operatingHours: mall.operatingHours,
      amenities: mall.amenities,
      tenantMix: mall.tenantMix,
      financial: mall.financial,
      performance: mall.performance,
      marketing: mall.marketing,
      compliance: mall.compliance,
      maintenance: mall.maintenance,
      security: mall.security,
      technology: mall.technology,
      sustainability: mall.sustainability,
      accessibility: mall.accessibility,
      settings: mall.settings,
      metadata: mall.metadata,
      createdAt: mall.createdAt,
      updatedAt: mall.updatedAt
    });
  } catch (err) {
    logger.error('Get mall error', err);
    return res.status(500).json({ message: 'Failed to fetch mall' });
  }
});

// Create new mall
router.post('/', authenticate, authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const {
      name,
      tradingName,
      type,
      class: mallClass,
      location,
      contact,
      facilityDetails,
      operatingHours,
      amenities,
      settings
    } = req.body;
    
    const mallRepo = database.getRepository(Mall);
    
    // Check if mall already exists
    const existing = await mallRepo.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ message: 'Mall already exists' });
    }
    
    const mall = mallRepo.create({
      name,
      tradingName,
      type: type || MallType.SHOPPING_CENTER,
      class: mallClass || MallClass.PREMIUM,
      location,
      contact,
      facilityDetails,
      operatingHours,
      amenities,
      settings,
      status: MallStatus.ACTIVE
    });
    
    await mallRepo.save(mall);
    logger.info(`Mall created: ${mall.name} by ${req.user.id}`);
    
    return res.status(201).json({
      message: 'Mall created successfully',
      mallId: mall.id,
      mallCode: mall.mallCode
    });
  } catch (err) {
    logger.error('Create mall error', err);
    return res.status(500).json({ message: 'Failed to create mall' });
  }
});

// Update mall
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const mallRepo = database.getRepository(Mall);
    
    const mall = await mallRepo.findOne({ where: { id } });
    if (!mall) {
      return res.status(404).json({ message: 'Mall not found' });
    }
    
    // Update allowed fields
    Object.assign(mall, updateData);
    
    await mallRepo.save(mall);
    logger.info(`Mall updated: ${mall.name} by ${req.user.id}`);
    
    return res.json({ message: 'Mall updated successfully' });
  } catch (err) {
    logger.error('Update mall error', err);
    return res.status(500).json({ message: 'Failed to update mall' });
  }
});

// Get mall tenants
router.get('/:id/tenants', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const tenantRepo = database.getRepository(Tenant);
    
    const queryBuilder = tenantRepo.createQueryBuilder('tenant')
      .where('tenant.mallId = :mallId', { mallId: id });
    
    if (status) {
      queryBuilder.andWhere('tenant.status = :status', { status });
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
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        leaseStartDate: tenant.leaseStartDate,
        leaseEndDate: tenant.leaseEndDate
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error('Get mall tenants error', err);
    return res.status(500).json({ message: 'Failed to fetch mall tenants' });
  }
});

// Get mall statistics
router.get('/:id/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantRepo = database.getRepository(Tenant);
    const mallRepo = database.getRepository(Mall);
    
    const mall = await mallRepo.findOne({ where: { id } });
    if (!mall) {
      return res.status(404).json({ message: 'Mall not found' });
    }
    
    const [totalTenants, activeTenants, pendingTenants] = await Promise.all([
      tenantRepo.count({ where: { mallId: id } }),
      tenantRepo.count({ where: { mallId: id, status: 'ACTIVE' } }),
      tenantRepo.count({ where: { mallId: id, status: 'PENDING_APPROVAL' } })
    ]);
    
    const categoryStats = await tenantRepo
      .createQueryBuilder('tenant')
      .select('tenant.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('tenant.mallId = :mallId', { mallId: id })
      .groupBy('tenant.category')
      .getRawMany();
    
    return res.json({
      mall: {
        id: mall.id,
        name: mall.name,
        status: mall.status
      },
      tenants: {
        total: totalTenants,
        active: activeTenants,
        pending: pendingTenants,
        occupancyRate: totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0
      },
      categoryStats
    });
  } catch (err) {
    logger.error('Get mall stats error', err);
    return res.status(500).json({ message: 'Failed to fetch mall statistics' });
  }
});

// Get mall overview statistics
router.get('/stats/overview', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const mallRepo = database.getRepository(Mall);
    const tenantRepo = database.getRepository(Tenant);
    
    const [totalMalls, activeMalls, underConstructionMalls] = await Promise.all([
      mallRepo.count(),
      mallRepo.count({ where: { status: MallStatus.ACTIVE } }),
      mallRepo.count({ where: { status: MallStatus.UNDER_CONSTRUCTION } })
    ]);
    
    const typeStats = await mallRepo
      .createQueryBuilder('mall')
      .select('mall.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('mall.type')
      .getRawMany();
    
    const totalTenants = await tenantRepo.count();
    
    return res.json({
      totalMalls,
      activeMalls,
      underConstructionMalls,
      totalTenants,
      typeStats
    });
  } catch (err) {
    logger.error('Get mall overview stats error', err);
    return res.status(500).json({ message: 'Failed to fetch mall overview statistics' });
  }
});

export default router; 