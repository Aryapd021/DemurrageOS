import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { sendSuccess, handleErrorResponse } from '../../common/http';

const router = Router();

// Get tariffs
router.get('/api/v1/tariffs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tariffs = await prisma.tariff.findMany({
      orderBy: { effectiveFrom: 'desc' },
    });

    sendSuccess(res, tariffs);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Create tariff
router.post('/api/v1/tariffs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      code,
      name,
      effectiveFrom,
      effectiveTo,
      demurrageRate,
      detentionRate,
      storageRate,
      groundRentRate,
      freeDays,
      currency,
    } = req.body;

    const tariff = await prisma.tariff.create({
      data: {
        code,
        name,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        demurrageRate,
        detentionRate,
        storageRate,
        groundRentRate,
        freeDays: freeDays || 5,
        currency: currency || 'INR',
      },
    });

    sendSuccess(res, tariff, 201);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get ports
router.get('/api/v1/ports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const ports = await prisma.port.findMany();
    sendSuccess(res, ports);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get CFS by port
router.get('/api/v1/cfs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { portId } = req.query;

    const where = portId ? { portId: portId as string } : {};

    const cfsList = await prisma.cfs.findMany({
      where,
      include: { port: true },
    });

    sendSuccess(res, cfsList);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
