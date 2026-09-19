import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authMiddleware, organizationScopeMiddleware } from '../../middleware/auth';
import { requestIdMiddleware, loggerMiddleware, errorHandler } from '../../middleware/request-context';
import { sendSuccess, sendError, handleErrorResponse } from '../../common/http';
import { ClientRepository } from '../../repositories';
import { ValidationError, NotFoundError } from '../../common/errors';

const router = Router();

// Middleware
router.use(requestIdMiddleware);
router.use(loggerMiddleware);

// ============================================================================
// HEALTH
// ============================================================================

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: 'database connection failed' });
  }
});

// ============================================================================
// AUTH ROUTES
// ============================================================================

router.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      sendError(res, 400, 'INVALID_REQUEST', 'Email is required', req.context?.requestId);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      sendError(res, 404, 'USER_NOT_FOUND', 'User not found', req.context?.requestId);
      return;
    }

    // Demo token format
    const token = `${user.id}|${user.organizationId}`;

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
    });
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

router.post('/api/v1/auth/logout', authMiddleware, (req: Request, res: Response) => {
  sendSuccess(res, { success: true });
});

router.get('/api/v1/auth/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.context?.userId },
      include: { organization: true },
    });

    if (!user) {
      sendError(res, 404, 'USER_NOT_FOUND', 'User not found', req.context?.requestId);
      return;
    }

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    });
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// ============================================================================
// CLIENT ROUTES
// ============================================================================

router.get('/api/v1/clients', authMiddleware, organizationScopeMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const clientRepo = new ClientRepository();
    const { clients, total } = await clientRepo.listByOrganization(req.context!.organizationId!, {
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

router.post('/api/v1/clients', authMiddleware, organizationScopeMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      iecCode: z.string().optional(),
      gstin: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      aeoStatus: z.enum(['NONE', 'CERTIFIED', 'SUSPENDED']).optional(),
      acpStatus: z.enum(['NONE', 'CERTIFIED', 'SUSPENDED']).optional(),
    });

    const data = schema.parse(req.body);

    const clientRepo = new ClientRepository();
    const client = await clientRepo.create(req.context!.organizationId!, data);

    sendSuccess(res, client, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) fields[path] = [];
        fields[path].push(err.message);
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', req.context?.requestId, fields);
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

router.get('/api/v1/clients/:id', authMiddleware, organizationScopeMiddleware, async (req: Request, res: Response) => {
  try {
    const clientRepo = new ClientRepository();
    const client = await clientRepo.findById(req.params.id, req.context!.organizationId!);
    sendSuccess(res, client);
  } catch (error) {
    if (error instanceof NotFoundError) {
      sendError(res, 404, 'NOT_FOUND', error.message, req.context?.requestId);
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

router.patch('/api/v1/clients/:id', authMiddleware, organizationScopeMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      aeoStatus: z.enum(['NONE', 'CERTIFIED', 'SUSPENDED']).optional(),
      acpStatus: z.enum(['NONE', 'CERTIFIED', 'SUSPENDED']).optional(),
    });

    const data = schema.parse(req.body);

    const clientRepo = new ClientRepository();
    const client = await clientRepo.update(req.params.id, req.context!.organizationId!, data);

    sendSuccess(res, client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) fields[path] = [];
        fields[path].push(err.message);
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', req.context?.requestId, fields);
      return;
    }
    if (error instanceof NotFoundError) {
      sendError(res, 404, 'NOT_FOUND', error.message, req.context?.requestId);
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// ============================================================================
// Error handling middleware
// ============================================================================

router.use(errorHandler);

export default router;
