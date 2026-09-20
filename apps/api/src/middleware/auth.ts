import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    orgId: string;
    role: string;
  };
}

// New JWT-based authentication middleware
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies["better-auth.session_token"] || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.BETTER_AUTH_SECRET!) as any;
    req.user = {
      id: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
    };

    // Also populate req.context for backward compatibility
    if (!req.context) {
      req.context = { requestId: '' };
    }
    req.context.userId = payload.userId;
    req.context.organizationId = payload.orgId;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}

// Backward compatibility alias for existing routes
export const authMiddleware = requireAuth;

export async function organizationScopeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.context?.organizationId) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Organization scope required',
        requestId: req.context?.requestId,
      },
    });
    return;
  }

  next();
}

export async function clientScopeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.query.clientId as string | undefined;

    if (!clientId) {
      res.status(400).json({
        error: {
          code: 'MISSING_CLIENT_ID',
          message: 'clientId query parameter is required',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    // Verify client belongs to organization
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.organizationId !== req.context?.organizationId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Client not accessible by this organization',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    if (!req.context) {
      req.context = { requestId: '' };
    }

    req.context.clientScope = [clientId];

    next();
  } catch (error) {
    logger.error(error, 'Client scope middleware error');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Client scope validation failed',
        requestId: req.context?.requestId,
      },
    });
  }
}