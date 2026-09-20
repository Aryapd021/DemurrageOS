import { Router, Request, Response } from 'express';
import { authMiddleware, requireAuth } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess, handleErrorResponse } from '../common/http';
import { ChargeCalculationService } from '../services/financial/charge-calculation';
import { ExposureService } from '../services/financial/charge-calculation';
import { NotFoundError } from '../common/errors';

const router = Router();

// Get all charges for a container
router.get('/api/v1/containers/:containerId/charges', requireAuth, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container || !container.clientId) {
      throw new NotFoundError('Container not found');
    }

    const client = await prisma.client.findUnique({
      where: { id: container.clientId },
    });
    if (!client || client.organizationId !== req.context!.organizationId!) {
      throw new NotFoundError('Container not found');
    }

    const charges = await prisma.charge.findMany({
      where: { containerId },
      include: { tariff: true },
    });

    sendSuccess(res, charges);
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

// Recalculate charges for a container
router.post('/api/v1/containers/:containerId/charges/recalculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundError('Container not found');
    }

    const client = await prisma.client.findUnique({
      where: { id: container.clientId },
    });

    if (!client || client.organizationId !== req.context!.organizationId!) {
      throw new NotFoundError('Container not found');
    }

    const service = new ChargeCalculationService();
    const charges = await service.recalculateForContainer(containerId);

    sendSuccess(res, { charges });
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

// Get exposure for a container
router.get('/api/v1/containers/:containerId/exposure', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundError('Container not found');
    }

    const client = await prisma.client.findUnique({
      where: { id: container.clientId },
    });

    if (!client || client.organizationId !== req.context!.organizationId!) {
      throw new NotFoundError('Container not found');
    }

    const exposureService = new ExposureService();
    const exposure = await exposureService.calculateExposureForContainer(containerId);

    sendSuccess(res, exposure);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get exposure for a client
router.get('/api/v1/clients/:clientId/exposure', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.organizationId !== req.context!.organizationId!) {
      throw new NotFoundError('Client not found');
    }

    const exposureService = new ExposureService();
    const exposure = await exposureService.calculateExposureForClient(clientId);

    sendSuccess(res, exposure);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
