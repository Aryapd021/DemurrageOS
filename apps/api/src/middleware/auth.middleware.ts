import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../common/errors/app-error.js';

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  role: 'ADMIN' | 'CHA' | 'CLIENT' | 'EXTERNAL';
  visibleClientIds?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // Support X-Dev-Org-Id / X-Dev-User-Id in development/test if no bearer token
    if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-user-id']) {
      req.user = {
        id: String(req.headers['x-dev-user-id']),
        organizationId: String(req.headers['x-dev-org-id'] || '00000000-0000-0000-0000-000000000001'),
        email: String(req.headers['x-dev-email'] || 'cha@demurrageos.local'),
        role: (req.headers['x-dev-role'] as any) || 'CHA',
        visibleClientIds: req.headers['x-dev-client-ids'] ? String(req.headers['x-dev-client-ids']).split(',') : undefined
      };
      return next();
    }
    return next(new UnauthorizedError('No authentication credentials provided'));
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = payload;
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
}
