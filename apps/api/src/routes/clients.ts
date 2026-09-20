import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess, handleErrorResponse } from '../common/http';
import { z } from 'zod';
import { ClientRepository } from '../repositories';
import { NotFoundError } from '../common/errors';

const router = Router();

// Get all clients for organization
router.get('/api/v1/clients', authMiddleware, async (req: Request, res: Response) => {
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
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Create client
router.post('/api/v1/clients', authMiddleware, async (req: Request, res: Response) => {
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
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) fields[path] = [];
        fields[path].push(err.message);
      });
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          requestId: req.context?.requestId,
          fields,
        },
      });
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get single client
router.get('/api/v1/clients/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const clientRepo = new ClientRepository();
    const client = await clientRepo.findById(req.params.id, req.context!.organizationId!);
    sendSuccess(res, client);
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
          requestId: req.context?.requestId,
        },
      });
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Update client
router.patch('/api/v1/clients/:id', authMiddleware, async (req: Request, res: Response) => {
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
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) fields[path] = [];
        fields[path].push(err.message);
      });
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          requestId: req.context?.requestId,
          fields,
        },
      });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
          requestId: req.context?.requestId,
        },
      });
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Delete client
router.delete('/api/v1/clients/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const clientRepo = new ClientRepository();
    await clientRepo.findById(req.params.id, req.context!.organizationId!);

    await prisma.client.delete({
      where: { id: req.params.id },
    });

    sendSuccess(res, { success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
          requestId: req.context?.requestId,
        },
      });
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get containers for a client
router.get('/api/v1/clients/:clientId/containers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    // Verify client belongs to organization
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.organizationId !== req.context!.organizationId!) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Client not accessible',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where: { clientId },
        include: { carrier: true, cfs: true },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.container.count({ where: { clientId } }),
    ]);

    res.json({
      data: containers,
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

export default router;
