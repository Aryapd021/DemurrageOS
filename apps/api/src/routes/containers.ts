import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess, handleErrorResponse } from '../common/http';
import { ContainerRepository } from '../repositories';
import { NotFoundError } from '../common/errors';

const router = Router();

// Get all containers for an organization
router.get('/api/v1/containers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const clientId = req.query.clientId as string | undefined;

    const containerRepo = new ContainerRepository();
    let result;

    if (clientId) {
      result = await containerRepo.listByClient(clientId, req.context!.organizationId!, {
        limit,
        offset: (page - 1) * limit,
      });
    } else {
      result = await containerRepo.listByOrganization(req.context!.organizationId!, {
        limit,
        offset: (page - 1) * limit,
      });
    }

    res.json({
      data: result.containers,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get single container
router.get('/api/v1/containers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const containerRepo = new ContainerRepository();
    const container = await containerRepo.findById(req.params.id, req.context!.organizationId!);

    // Get charges
    const charges = await prisma.charge.findMany({
      where: { containerId: container.id },
    });

    // Get alerts
    const alerts = await prisma.alert.findMany({
      where: { containerId: container.id },
    });

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: { containerId: container.id },
    });

    // Get documents
    const documents = await prisma.document.findMany({
      where: { containerId: container.id },
    });

    // Get compliance signals
    const signals = await prisma.complianceSignal.findMany({
      where: { containerId: container.id },
    });

    sendSuccess(res, {
      ...container,
      charges,
      alerts,
      tasks,
      documents,
      complianceSignals: signals,
    });
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

// Create container
router.post('/api/v1/containers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId, containerNo, containerType, deliveryMode, carrierId, cfsId, dischargeDate, hsCode, goodsDescription, quantity } = req.body;

    if (!clientId || !containerNo) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'clientId and containerNo are required',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    const containerRepo = new ContainerRepository();
    const container = await containerRepo.create(clientId, req.context!.organizationId!, {
      containerNo,
      containerType: containerType || '20FT',
      deliveryMode: deliveryMode || 'CFS',
      carrierId,
      cfsId,
      dischargeDate: dischargeDate ? new Date(dischargeDate) : new Date(),
      hsCode,
      goodsDescription,
      quantity,
    });

    sendSuccess(res, container, 201);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
