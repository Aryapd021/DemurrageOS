import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { sendSuccess, handleErrorResponse } from '../../common/http';
import { ExposureService } from '../../services/financial/charge-calculation';

const router = Router();

// Dashboard - all clients
router.get('/api/v1/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const [clients, containers, alerts, tasks] = await Promise.all([
      prisma.client.count({
        where: {
          organizationId: req.context!.organizationId!,
        },
      }),
      prisma.container.count({
        where: {
          client: {
            organizationId: req.context!.organizationId!,
          },
        },
      }),
      prisma.alert.count({
        where: {
          container: {
            client: {
              organizationId: req.context!.organizationId!,
            },
          },
          status: 'ACTIVE',
        },
      }),
      prisma.task.count({
        where: {
          container: {
            client: {
              organizationId: req.context!.organizationId!,
            },
          },
          status: 'PENDING',
        },
      }),
    ]);

    // Calculate total exposure
    const containerList = await prisma.container.findMany({
      where: {
        client: {
          organizationId: req.context!.organizationId!,
        },
      },
      include: {
        charges: true,
      },
    });

    let totalExposure = 0;
    let atRiskContainers = 0;

    for (const container of containerList) {
      const exposure = container.charges.reduce((sum, c) => sum + c.amount.toNumber(), 0);
      totalExposure += exposure;
      if (exposure > 0) {
        atRiskContainers++;
      }
    }

    // Get high-risk containers
    const highRiskContainers = await prisma.container.findMany({
      where: {
        client: {
          organizationId: req.context!.organizationId!,
        },
        riskLevel: { in: ['HIGH', 'CRITICAL'] },
      },
      take: 10,
      include: { client: true },
    });

    sendSuccess(res, {
      summary: {
        clients,
        containers,
        alerts,
        tasks,
        totalExposure,
        atRiskContainers,
      },
      highRiskContainers,
    });
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Dashboard - per client
router.get('/api/v1/clients/:clientId/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

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

    const [containers, alerts, tasks, charges] = await Promise.all([
      prisma.container.count({ where: { clientId } }),
      prisma.alert.count({
        where: {
          container: { clientId },
          status: 'ACTIVE',
        },
      }),
      prisma.task.count({
        where: {
          container: { clientId },
          status: 'PENDING',
        },
      }),
      prisma.charge.findMany({
        where: {
          container: { clientId },
        },
      }),
    ]);

    const totalExposure = charges.reduce((sum, c) => sum + c.amount.toNumber(), 0);

    // Risk distribution
    const riskDistribution = await prisma.container.groupBy({
      by: ['riskLevel'],
      where: { clientId },
      _count: true,
    });

    sendSuccess(res, {
      client,
      summary: {
        containers,
        alerts,
        tasks,
        totalExposure,
      },
      riskDistribution,
    });
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
