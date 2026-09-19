import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { sendSuccess, handleErrorResponse } from '../../common/http';
import { NotFoundError } from '../../common/errors';

const router = Router();

// Get alerts for a container
router.get('/api/v1/containers/:containerId/alerts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const alerts = await prisma.alert.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, alerts);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Create alert
router.post('/api/v1/containers/:containerId/alerts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const { alertType, severity, message } = req.body;

    const alert = await prisma.alert.create({
      data: {
        containerId,
        alertType,
        severity: severity || 'MEDIUM',
        message,
      },
    });

    sendSuccess(res, alert, 201);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Resolve alert
router.patch('/api/v1/alerts/:alertId/resolve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    sendSuccess(res, alert);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get all alerts for organization
router.get('/api/v1/alerts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where: {
          container: {
            client: {
              organizationId: req.context!.organizationId!,
            },
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
            client: {
              organizationId: req.context!.organizationId!,
            },
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
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
