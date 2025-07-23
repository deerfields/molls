/**
 * MallOS Enterprise - Auth Routes
 * User registration, login, password reset, MFA, and session APIs
 */

import express from 'express';
import { AuthService } from '@/services/AuthService';
import { User, UserStatus, UserRole } from '@/models/User';
import { database } from '@/config/database';
import { logger } from '@/utils/logger';

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, tenantId, role } = req.body;
    const userRepo = database.getRepository(User);
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
      tenantId,
      role: role || UserRole.TENANT_USER,
      status: UserStatus.PENDING_VERIFICATION
    });
    await userRepo.save(user);
    logger.info(`User registered: ${user.email}`);
    return res.status(201).json({ message: 'Registration successful', userId: user.id });
  } catch (err) {
    logger.error('Registration error', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRepo = database.getRepository(User);
    const user = await userRepo.findOne({ where: { email }, select: ['id', 'email', 'password', 'role', 'tenantId', 'status'] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!(await AuthService.comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({ message: 'Account not active' });
    }
    // MFA step (optional)
    // ...
    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);
    const sessionId = await AuthService.createSession(user.id, { role: user.role, tenantId: user.tenantId });
    res.cookie('sessionId', sessionId, { httpOnly: true, secure: true });
    return res.json({ accessToken, refreshToken, sessionId });
  } catch (err) {
    logger.error('Login error', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// Password reset request
router.post('/password-reset/request', async (req, res) => {
  try {
    const { email } = req.body;
    const userRepo = database.getRepository(User);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const token = await AuthService.initiatePasswordReset(user.id);
    // TODO: Send token via email
    logger.info(`Password reset requested for ${email}`);
    return res.json({ message: 'Password reset email sent', token });
  } catch (err) {
    logger.error('Password reset request error', err);
    return res.status(500).json({ message: 'Password reset request failed' });
  }
});

// Password reset confirm
router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const userId = await AuthService.verifyPasswordResetToken(token);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const userRepo = database.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = await AuthService.hashPassword(newPassword);
    await userRepo.save(user);
    await AuthService.invalidatePasswordResetToken(token);
    logger.info(`Password reset for user ${user.email}`);
    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    logger.error('Password reset confirm error', err);
    return res.status(500).json({ message: 'Password reset failed' });
  }
});

// MFA request
router.post('/mfa/request', async (req, res) => {
  try {
    const { userId } = req.body;
    const code = await AuthService.generateMfaCode(userId);
    // TODO: Send code via email/SMS
    logger.info(`MFA code generated for user ${userId}`);
    return res.json({ message: 'MFA code sent', code });
  } catch (err) {
    logger.error('MFA request error', err);
    return res.status(500).json({ message: 'MFA request failed' });
  }
});

// MFA verify
router.post('/mfa/verify', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const valid = await AuthService.verifyMfaCode(userId, code);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid MFA code' });
    }
    await AuthService.invalidateMfaCode(userId);
    logger.info(`MFA verified for user ${userId}`);
    return res.json({ message: 'MFA verified' });
  } catch (err) {
    logger.error('MFA verify error', err);
    return res.status(500).json({ message: 'MFA verification failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    if (sessionId) {
      await AuthService.destroySession(sessionId);
    }
    res.clearCookie('sessionId');
    return res.json({ message: 'Logged out' });
  } catch (err) {
    logger.error('Logout error', err);
    return res.status(500).json({ message: 'Logout failed' });
  }
});

export default router; 