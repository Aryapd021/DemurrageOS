import { Response } from 'express';

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function parsePaginationQuery(query: any): PaginationQuery {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

  return { page, limit, sortBy, sortOrder };
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  pagination: PaginationQuery
): void {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const totalPages = Math.ceil(total / limit);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

export function sendSuccess<T>(res: Response, data: T, status: number = 200): void {
  res.status(status).json({ data });
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  requestId?: string,
  fields?: Record<string, string[]>
): void {
  res.status(status).json({
    error: {
      code,
      message,
      requestId,
      ...(fields && { fields }),
    },
  });
}

export function handleErrorResponse(error: unknown, res: Response, requestId?: string): void {
  if (error instanceof Error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
        requestId,
      },
    });
  } else {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    });
  }
}
