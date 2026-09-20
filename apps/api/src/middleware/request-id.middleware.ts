import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'];
  const requestId = (typeof existingId === 'string' && existingId) ? existingId : uuidv4();
  
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
