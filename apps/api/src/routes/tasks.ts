import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess, handleErrorResponse } from '../common/http';
import { TaskService } from '../services/task/task-service';
import { NotFoundError, ConflictError } from '../common/errors';
import { logger } from '../config/logger';

const router = Router();

// Get tasks for a container
router.get('/api/v1/containers/:containerId/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundError('Container not found');
    }

    const tasks = await prisma.task.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, tasks);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Assign task
router.post('/api/v1/tasks/:id/external-assign', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { externalName, externalEmail, externalPhone } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const taskService = new TaskService();
    const { task: updatedTask, token } = await taskService.assignTask(task.containerId, {
      externalName,
      externalEmail,
      externalPhone,
      title: task.title,
      description: task.description,
    });

    if (!token) {
      throw new Error('Failed to generate confirmation token');
    }

    logger.info(
      {
        taskId: updatedTask.id,
        externalEmail,
        token: token.substring(0, 8) + '...',
      },
      'Task assigned externally'
    );

    sendSuccess(res, {
      task: updatedTask,
      confirmationUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v1/tasks/confirm/${token}`,
    });
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Confirm external task (unauthenticated)
router.post('/api/v1/tasks/confirm/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Hash token to find task
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const taskService = new TaskService();
    const task = await taskService.confirmExternalTask(tokenHash);

    logger.info(
      {
        taskId: task.id,
        containerId: task.containerId,
      },
      'External task confirmed via link'
    );

    sendSuccess(res, {
      task,
      message: 'Task confirmed successfully',
    });
  } catch (error: unknown) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      res.status(error instanceof ConflictError ? 409 : 404).json({
        error: {
          code: error.name,
          message: error.message,
          requestId: req.context?.requestId,
        },
      });
      return;
    }
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Get task
router.get('/api/v1/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { container: true, assignee: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    sendSuccess(res, task);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

// Update task
router.patch('/api/v1/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, title, description } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description && { description }),
      },
    });

    sendSuccess(res, task);
  } catch (error: unknown) {
    handleErrorResponse(error, res, req.context?.requestId);
  }
});

export default router;
