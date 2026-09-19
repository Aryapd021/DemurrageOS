import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // For demo purposes, we'll use a simple token format: "user_id|org_id"
    // In production, use JWT with proper verification
    const [userId, organizationId] = token.split('|');

    if (!userId || !organizationId) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token format',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.organizationId !== organizationId) {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found or mismatched organization',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    if (!req.context) {
      req.context = { requestId: '' };
    }

    req.context.userId = userId;
    req.context.organizationId = organizationId;

    next();
  } catch (error) {
    logger.error(error, 'Auth middleware error');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
        requestId: req.context?.requestId,
      },
    });
  }
}

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
