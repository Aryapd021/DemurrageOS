import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { sendSuccess, handleErrorResponse } from '../../common/http';
import { z } from 'zod';

const router = Router();

// Get imports for organization
router.get('/api/v1/imports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [imports, total] = await Promise.all([
      prisma.import.findMany({
        where: { organizationId: req.context!.organizationId! },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.import.count({
        where: { organizationId: req.context!.organizationId! },
      }),
    ]);

    res.json({
      data: imports,
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

// Create import staging
router.post('/api/v1/imports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { filename, rows } = req.body;

    if (!filename || !rows || !Array.isArray(rows)) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'filename and rows array are required',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    const importRecord = await prisma.import.create({
      data: {
        organizationId: req.context!.organizationId!,
        filename,
        fileSize: 0,
        status: 'STAGED',
        totalRows: rows.length,
      },
    });

    // Create import rows
    for (let i = 0; i < rows.length; i++) {
      await prisma.importRow.create({
        data: {
          importId: importRecord.id,
          rowNumber: i + 1,
          data: rows[i],
          status: 'VALIDATED',
        },
      });
    }

    sendSuccess(res, { ...importRecord, rowsCount: rows.length }, 201);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get import preview
router.get('/api/v1/imports/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const importRecord = await prisma.import.findUnique({
      where: { id: req.params.id },
      include: {
        rows: {
          take: 100,
        },
      },
    });

    if (!importRecord) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Import not found',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    sendSuccess(res, importRecord);
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Confirm import
router.post('/api/v1/imports/:id/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const importRecord = await prisma.import.findUnique({
      where: { id: req.params.id },
      include: {
        rows: true,
      },
    });

    if (!importRecord) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Import not found',
          requestId: req.context?.requestId,
        },
      });
      return;
    }

    // Process rows in transaction
    let successCount = 0;
    let errorCount = 0;

    for (const row of importRecord.rows) {
      try {
        const data = row.data as any;

        // Get client
        const client = await prisma.client.findFirst({
          where: {
            organizationId: req.context!.organizationId!,
            iecCode: data.client_id || data.iec_code,
          },
        });

        if (!client) {
          errorCount++;
          continue;
        }

        // Create container
        const container = await prisma.container.create({
          data: {
            clientId: client.id,
            containerNo: data.container_no || `CONT-${Date.now()}-${Math.random()}`,
            containerType: data.container_type || '20FT',
            deliveryMode: data.delivery_mode || 'CFS',
            dischargeDate: data.discharge_date ? new Date(data.discharge_date) : new Date(),
            hsCode: data.hs_code,
            goodsDescription: data.goods_description,
            quantity: data.quantity ? parseInt(data.quantity) : undefined,
          },
        });

        // Create events if provided
        if (data.events) {
          for (const event of data.events) {
            await prisma.containerEvent.create({
              data: {
                containerId: container.id,
                eventType: event.type,
                source: 'CSV',
                eventTimestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
              },
            });
          }
        }

        // Update row with container ID
        await prisma.importRow.update({
          where: { id: row.id },
          data: {
            createdContainerId: container.id,
            status: 'VALIDATED',
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    // Update import status
    const updated = await prisma.import.update({
      where: { id: importRecord.id },
      data: {
        status: 'COMPLETED',
        successCount,
        errorCount,
        completedAt: new Date(),
      },
    });

    sendSuccess(res, {
      ...updated,
      summary: {
        total: importRecord.totalRows,
        success: successCount,
        failed: errorCount,
      },
    });
  } catch (error) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
