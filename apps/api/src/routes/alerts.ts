import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess, handleErrorResponse } from '../common/http';
import { NotFoundError } from '../common/errors';

const router = Router();

// Get alerts for a container - FIXED: now includes organization isolation
router.get('/api/v1/containers/:containerId/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    // First verify container belongs to user's organization
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container || container.organizationId !== req.context!.organizationId) {
      throw new NotFoundError('Container not found or not accessible');
    }

    const alerts = await prisma.alert.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, alerts);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Create alert
router.post('/api/v1/containers/:containerId/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const { alertType, severity, message } = req.body;

    // Verify container belongs to user's organization
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container || container.organizationId !== req.context!.organizationId) {
      throw new NotFoundError('Container not found or not accessible');
    }

    const alert = await prisma.alert.create({
      data: {
        containerId,
        alertType,
        severity: severity || 'MEDIUM',
        message,
      },
    });

    sendSuccess(res, alert, 201);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Resolve alert
router.patch('/api/v1/alerts/:alertId/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    // Verify alert belongs to user's organization (via container)
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: { container: true },
    });

    if (!alert || alert.container.organizationId !== req.context!.organizationId) {
      throw new NotFoundError('Alert not found or not accessible');
    }

    const resolved = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    sendSuccess(res, resolved);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get all alerts for organization
router.get('/api/v1/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where: {
          container: {
            organizationId: req.context!.organizationId!,
          },
        },
        include: { container: true },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.alert.count({
        where: {
          container: {
            organizationId: req.context!.organizationId!,
          },
        },
      }),
    ]);

    res.json({
      data: alerts,
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

export default router;
