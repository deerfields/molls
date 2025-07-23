/**
 * MallOS Enterprise - Dashboard Routes
 * Basic dashboard data endpoints for overview and metrics
 */

import express from 'express';
import { Request, Response } from 'express';
import { User, UserStatus } from '@/models/User';
import { Tenant, TenantStatus } from '@/models/Tenant';
import { Mall, MallStatus } from '@/models/Mall';
import { WorkPermit, WorkPermitStatus } from '@/models/WorkPermit';
import { Security } from '@/models/Security';
import { Financial } from '@/models/Financial';
import { Analytics } from '@/models/Analytics';
import { database } from '@/config/database';
import { logger } from '@/utils/logger';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@/models/User';

const router = express.Router();

// Get main dashboard overview
router.get('/overview', authenticate, async (req: Request, res: Response) => {
  try {
    const userRepo = database.getRepository(User);
    const tenantRepo = database.getRepository(Tenant);
    const mallRepo = database.getRepository(Mall);
    const workPermitRepo = database.getRepository(WorkPermit);
    const securityRepo = database.getRepository(Security);
    const financialRepo = database.getRepository(Financial);
    
    // Get basic counts
    const [totalUsers, totalTenants, totalMalls, totalWorkPermits] = await Promise.all([
      userRepo.count(),
      tenantRepo.count(),
      mallRepo.count(),
      workPermitRepo.count()
    ]);
    
    // Get active counts
    const [activeUsers, activeTenants, activeMalls, activeWorkPermits] = await Promise.all([
      userRepo.count({ where: { status: UserStatus.ACTIVE } }),
      tenantRepo.count({ where: { status: TenantStatus.ACTIVE } }),
      mallRepo.count({ where: { status: MallStatus.ACTIVE } }),
      workPermitRepo.count({ where: { status: WorkPermitStatus.ACTIVE } })
    ]);
    
    // Get pending counts
    const [pendingUsers, pendingTenants, pendingWorkPermits] = await Promise.all([
      userRepo.count({ where: { status: UserStatus.PENDING_VERIFICATION } }),
      tenantRepo.count({ where: { status: TenantStatus.PENDING_APPROVAL } }),
      workPermitRepo.count({ where: { status: WorkPermitStatus.PENDING_APPROVAL } })
    ]);
    
    // Get recent activities
    const recentWorkPermits = await workPermitRepo.find({
      order: { createdAt: 'DESC' },
      take: 5
    });
    
    const recentSecurityIncidents = await securityRepo.find({
      order: { incidentDate: 'DESC' },
      take: 5
    });
    
    return res.json({
      overview: {
        totalUsers,
        activeUsers,
        pendingUsers,
        totalTenants,
        activeTenants,
        pendingTenants,
        totalMalls,
        activeMalls,
        totalWorkPermits,
        activeWorkPermits,
        pendingWorkPermits
      },
      recentActivities: {
        workPermits: recentWorkPermits.map(permit => ({
          id: permit.id,
          permitNumber: permit.permitNumber,
          type: permit.type,
          status: permit.status,
          tenantId: permit.tenantId,
          startDate: permit.startDate,
          createdAt: permit.createdAt
        })),
        securityIncidents: recentSecurityIncidents.map(incident => ({
          id: incident.id,
          incidentNumber: incident.incidentNumber,
          type: incident.type,
          status: incident.status,
          severity: incident.severity,
          incidentDate: incident.incidentDate
        }))
      }
    });
  } catch (err) {
    logger.error('Get dashboard overview error', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard overview' });
  }
});

// Get financial overview
router.get('/financial', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const financialRepo = database.getRepository(Financial);
    
    // Get total revenue
    const totalRevenue = await financialRepo
      .createQueryBuilder('financial')
      .select('SUM(financial.amount)', 'total')
      .where('financial.status = :status', { status: 'COMPLETED' })
      .getRawOne();
    
    // Get monthly revenue (last 6 months)
    const monthlyRevenue = await financialRepo
      .createQueryBuilder('financial')
      .select('DATE_TRUNC(\'month\', financial.transactionDate)', 'month')
      .addSelect('SUM(financial.amount)', 'total')
      .where('financial.status = :status', { status: 'COMPLETED' })
      .andWhere('financial.transactionDate >= :startDate', { 
        startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) 
      })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
    
    // Get pending payments
    const pendingPayments = await financialRepo
      .createQueryBuilder('financial')
      .select('SUM(financial.amount)', 'total')
      .where('financial.status = :status', { status: 'PENDING' })
      .getRawOne();
    
    return res.json({
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
      pendingPayments: parseFloat(pendingPayments?.total || '0'),
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item.month,
        total: parseFloat(item.total || '0')
      }))
    });
  } catch (err) {
    logger.error('Get financial overview error', err);
    return res.status(500).json({ message: 'Failed to fetch financial overview' });
  }
});

// Get analytics data
router.get('/analytics', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const analyticsRepo = database.getRepository(Analytics);
    const { mallId, type, startDate, endDate } = req.query;
    
    const queryBuilder = analyticsRepo.createQueryBuilder('analytics');
    
    if (mallId) {
      queryBuilder.where('analytics.mallId = :mallId', { mallId });
    }
    
    if (type) {
      queryBuilder.andWhere('analytics.type = :type', { type });
    }
    
    if (startDate && endDate) {
      queryBuilder.andWhere('analytics.date BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate 
      });
    }
    
    const analytics = await queryBuilder
      .orderBy('analytics.date', 'DESC')
      .take(100)
      .getMany();
    
    return res.json({
      analytics: analytics.map(item => ({
        id: item.id,
        mallId: item.mallId,
        tenantId: item.tenantId,
        type: item.type,
        date: item.date,
        data: item.data
      }))
    });
  } catch (err) {
    logger.error('Get analytics error', err);
    return res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// Get user activity summary
router.get('/user-activity', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const userRepo = database.getRepository(User);
    
    // Get users by role
    const roleStats = await userRepo
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();
    
    // Get recent logins
    const recentLogins = await userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email', 'user.lastLogin'])
      .where('user.lastLogin IS NOT NULL')
      .orderBy('user.lastLogin', 'DESC')
      .take(10)
      .getMany();
    
    return res.json({
      roleStats: roleStats.map(item => ({
        role: item.role,
        count: parseInt(item.count)
      })),
      recentLogins: recentLogins.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        lastLogin: user.lastLogin
      }))
    });
  } catch (err) {
    logger.error('Get user activity error', err);
    return res.status(500).json({ message: 'Failed to fetch user activity' });
  }
});

// Get system health status
router.get('/health', authenticate, async (req: Request, res: Response) => {
  try {
    const userRepo = database.getRepository(User);
    const tenantRepo = database.getRepository(Tenant);
    const mallRepo = database.getRepository(Mall);
    
    // Check database connectivity
    const dbStatus = await database.query('SELECT 1');
    
    // Get system metrics
    const [totalUsers, totalTenants, totalMalls] = await Promise.all([
      userRepo.count(),
      tenantRepo.count(),
      mallRepo.count()
    ]);
    
    return res.json({
      status: 'healthy',
      database: dbStatus ? 'connected' : 'disconnected',
      metrics: {
        totalUsers,
        totalTenants,
        totalMalls
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Get system health error', err);
    return res.status(500).json({ 
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 