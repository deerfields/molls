/**
 * MallOS Enterprise - User Management Routes
 * CRUD operations for user management with RBAC
 */

import express from 'express';
import { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { User, UserRole, UserStatus, UserType } from '@/models/User';
import { database } from '@/config/database';
import { logger } from '@/utils/logger';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

// Get all users (with pagination and filtering)
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, role, status, tenantId, search } = req.query;
    const userRepo = database.getRepository(User);
    
    const queryBuilder = userRepo.createQueryBuilder('user');
    
    // Apply filters
    if (role) queryBuilder.andWhere('user.role = :role', { role });
    if (status) queryBuilder.andWhere('user.status = :status', { status });
    if (tenantId) queryBuilder.andWhere('user.tenantId = :tenantId', { tenantId });
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));
    
    const [users, total] = await queryBuilder.getManyAndCount();
    
    return res.json({
      users: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error('Get users error', err);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepo = database.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has permission to view this user
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    return res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      type: user.type,
      tenantId: user.tenantId,
      profile: user.profile,
      settings: user.settings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    logger.error('Get user error', err);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, username, password, phoneNumber, role, tenantId, type } = req.body;
    const userRepo = database.getRepository(User);
    
    // Check if user already exists
    const existing = await userRepo.findOne({ where: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    const user = userRepo.create({
      firstName,
      lastName,
      email,
      username,
      password: await AuthService.hashPassword(password),
      phoneNumber,
      role: role || UserRole.TENANT_USER,
      type: type || UserType.REGULAR,
      tenantId,
      status: UserStatus.PENDING_VERIFICATION
    });
    
    await userRepo.save(user);
    logger.info(`User created: ${user.email} by ${req.user.id}`);
    
    return res.status(201).json({
      message: 'User created successfully',
      userId: user.id
    });
  } catch (err) {
    logger.error('Create user error', err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, username, phoneNumber, role, status, profile, settings } = req.body;
    const userRepo = database.getRepository(User);
    
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (username) user.username = username;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (role && req.user.role === UserRole.ADMIN) user.role = role;
    if (status && req.user.role === UserRole.ADMIN) user.status = status;
    if (profile) user.profile = { ...user.profile, ...profile };
    if (settings) user.settings = { ...user.settings, ...settings };
    
    await userRepo.save(user);
    logger.info(`User updated: ${user.email} by ${req.user.id}`);
    
    return res.json({ message: 'User updated successfully' });
  } catch (err) {
    logger.error('Update user error', err);
    return res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepo = database.getRepository(User);
    
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await userRepo.remove(user);
    logger.info(`User deleted: ${user.email} by ${req.user.id}`);
    
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error('Delete user error', err);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Change password
router.post('/:id/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const userRepo = database.getRepository(User);
    
    const user = await userRepo.findOne({ where: { id }, select: ['id', 'password'] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Verify current password
    if (!(await AuthService.comparePassword(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = await AuthService.hashPassword(newPassword);
    await userRepo.save(user);
    
    logger.info(`Password changed for user: ${id} by ${req.user.id}`);
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error('Change password error', err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
});

// Get user statistics
router.get('/stats/overview', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const userRepo = database.getRepository(User);
    
    const [totalUsers, activeUsers, pendingUsers, lockedUsers] = await Promise.all([
      userRepo.count(),
      userRepo.count({ where: { status: UserStatus.ACTIVE } }),
      userRepo.count({ where: { status: UserStatus.PENDING_VERIFICATION } }),
      userRepo.count({ where: { status: UserStatus.LOCKED } })
    ]);
    
    const roleStats = await userRepo
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();
    
    return res.json({
      totalUsers,
      activeUsers,
      pendingUsers,
      lockedUsers,
      roleStats
    });
  } catch (err) {
    logger.error('Get user stats error', err);
    return res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

export default router; 