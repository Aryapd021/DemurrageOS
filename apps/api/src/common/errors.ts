import { z } from 'zod';
import { Request, Response } from 'express';

const validationErrorSchema = z.object({
  code: z.literal('VALIDATION_ERROR'),
  message: z.string(),
  fields: z.record(z.array(z.string())),
  requestId: z.string(),
});

export class ValidationError extends Error {
  public readonly fields: Record<string, string[]>;

  constructor(fields: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export function sendError(res: Response, status: number, code: string, message: string, requestId?: string, fields?: Record<string, string[]>): void {
  const response: any = {
    error: {
      code,
      message,
      requestId,
    },
  };

  if (fields) {
    response.error.fields = fields;
  }

  res.status(status).json(response);
}

export function handleErrorResponse(err: unknown, res: Response, requestId?: string): void {
  if (err instanceof ValidationError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', requestId, err.fields);
  } else if (err instanceof NotFoundError) {
    sendError(res, 404, 'NOT_FOUND', err.message, requestId);
  } else if (err instanceof UnauthorizedError) {
    sendError(res, 401, 'UNAUTHORIZED', err.message, requestId);
  } else if (err instanceof ForbiddenError) {
    sendError(res, 403, 'FORBIDDEN', err.message, requestId);
  } else if (err instanceof ConflictError) {
    sendError(res, 409, 'CONFLICT', err.message, requestId);
  } else if (err instanceof Error) {
    sendError(res, 500, 'INTERNAL_ERROR', 'An internal error occurred', requestId);
  } else {
    sendError(res, 500, 'INTERNAL_ERROR', 'An internal error occurred', requestId);
  }
}
