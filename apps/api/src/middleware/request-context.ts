import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface RequestContext {
  requestId: string;
  userId?: string;
  organizationId?: string;
  clientScope?: string[];
  permissions?: string[];
  ipAddress?: string;
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || uuidv4();

  req.context = {
    requestId,
    ipAddress: req.ip,
  };

  res.setHeader('x-request-id', requestId);

  next();
}

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        requestId: req.context?.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });

  next();
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.context?.requestId || 'unknown';

  logger.error(
    {
      requestId,
      error: err.message,
      stack: err.stack,
    },
    'Request error'
  );

  // Handle specific error types
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        requestId,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
      requestId,
    },
  });
}
