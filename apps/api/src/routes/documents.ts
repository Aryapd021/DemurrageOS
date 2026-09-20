import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess, handleErrorResponse } from '../common/http';
import { z } from 'zod';

const router = Router();

// Get documents for a container
router.get('/api/v1/containers/:containerId/documents', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const documents = await prisma.document.findMany({
      where: { containerId },
      include: { extractions: true },
    });

    sendSuccess(res, documents);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Upload document
router.post('/api/v1/containers/:containerId/documents', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const { filename, mimeType, size, documentType, storagePath } = req.body;

    const document = await prisma.document.create({
      data: {
        containerId,
        filename,
        mimeType: mimeType || 'application/pdf',
        size: size || 0,
        documentType: documentType || 'UNKNOWN',
        storagePath: storagePath || `/documents/${containerId}/${filename}`,
        status: 'UPLOADED',
      },
    });

    sendSuccess(res, document, 201);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get document extractions
router.get('/api/v1/documents/:documentId/extractions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const extractions = await prisma.documentExtraction.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, extractions);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Approve/reject document extraction
router.post('/api/v1/documents/:documentId/extractions/:extractionId/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId, extractionId } = req.params;
    const { corrections } = req.body;

    const extraction = await prisma.documentExtraction.update({
      where: { id: extractionId },
      data: {
        status: 'ACCEPTED',
        correctedBy: req.context!.userId,
        correctedAt: new Date(),
        ...(corrections && {
          correctedFields: JSON.stringify(corrections),
        }),
      },
    });

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });

    sendSuccess(res, extraction);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
