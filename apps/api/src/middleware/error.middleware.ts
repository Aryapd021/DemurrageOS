import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors/app-error.js';
import { logger } from '../common/logging/logger.js';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.requestId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      requestId,
      statusCode: err.statusCode,
      code: err.code,
      path: req.path
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId,
        details: err.details
      }
    });
  }

  // Handle unexpected programming errors
  logger.error(`Unhandled internal error: ${err.message}`, err, {
    requestId,
    path: req.path
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      requestId
    }
  });
}
