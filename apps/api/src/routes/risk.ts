import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess, handleErrorResponse } from '../common/http';
import { RiskEngine, ComplianceSignalService } from '../services/risk/risk-engine';
import { NotFoundError } from '../common/errors';

const router = Router();

// Get risk for a container
router.get('/api/v1/containers/:containerId/risk', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundError('Container not found');
    }

    const riskEngine = new RiskEngine();
    const risk = await riskEngine.calculateRiskScore(containerId);

    sendSuccess(res, risk);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Recalculate risk for a container
router.post('/api/v1/containers/:containerId/risk/recalculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const riskEngine = new RiskEngine();
    const risk = await riskEngine.recalculateForContainer(containerId);

    sendSuccess(res, risk);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get compliance signals for a container
router.get('/api/v1/containers/:containerId/signals', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const signals = await prisma.complianceSignal.findMany({
      where: { containerId },
    });

    sendSuccess(res, signals);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Derive historical signals
router.post('/api/v1/containers/:containerId/signals/derive', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const signalService = new ComplianceSignalService();
    await signalService.deriveHistoricalSignals(containerId);

    const signals = await prisma.complianceSignal.findMany({
      where: { containerId },
    });

    sendSuccess(res, signals);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
