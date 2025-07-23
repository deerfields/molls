/**
 * MallOS Enterprise - Auth Middleware
 * Route protection, RBAC, session, and MFA enforcement
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { AuthService } from '@/services/AuthService';
import { UserRole } from '@/models/User';

// Enhanced Auth middleware for integrations
export function authenticate(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;
  // Support Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // Support HTTP-only cookie
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing authentication token' });
  }
  try {
    const payload = AuthService.verifyToken(token);
    // Extract user context: id, role, tenantId, permissions, integration access
    req.user = {
      id: payload.sub,
      role: payload.role,
      tenantId: payload.tenantId,
      status: payload.status,
      permissions: payload.permissions || [],
      integrationAccess: payload.integrationAccess || [], // e.g., list of integration IDs
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Token refresh endpoint (for web clients)
export function tokenRefreshEndpoint(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Missing refresh token' });
  }
  try {
    const payload = AuthService.verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      return res.status(400).json({ success: false, error: 'Invalid refresh token type' });
    }
    // Fetch user and issue new access token
    // (Assume getUserById is available on AuthService)
    AuthService.getUserById(payload.sub).then(user => {
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      const accessToken = AuthService.generateAccessToken(user);
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      res.json({ success: true, accessToken });
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
}

// RBAC middleware
export function authorize(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

// Session middleware
export async function requireSession(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  if (!sessionId) {
    return res.status(401).json({ message: 'Missing session' });
  }
  const session = await AuthService.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
  req.session = session;
  next();
}

// MFA middleware
export async function requireMfa(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.mfaVerified) {
    return res.status(401).json({ message: 'MFA required' });
  }
  next();
} 