import { randomBytes, createHash } from 'crypto';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ConflictError, NotFoundError } from '../../common/errors';

export class TaskService {
  /**
   * Generate high-entropy token for external task confirmation
   */
  private generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async assignTask(containerId: string, taskData: any) {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundError('Container not found');
    }

    if (taskData.assigneeType === 'EXTERNAL_CONTACT') {
      // Generate token for external confirmation
      const token = this.generateToken();
      const tokenHash = this.hashToken(token);

      const task = await prisma.task.create({
        data: {
          containerId,
          assigneeType: 'EXTERNAL_CONTACT',
          externalName: taskData.externalName,
          externalEmail: taskData.externalEmail,
          externalPhone: taskData.externalPhone,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority || 'MEDIUM',
          dueDate: taskData.dueDate,
          confirmationTokenHash: tokenHash,
          confirmationTokenExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
          status: 'PENDING',
        },
      });

      logger.info(
        {
          taskId: task.id,
          containerId,
          externalEmail: taskData.externalEmail,
        },
        'External task created'
      );

      // Return token to caller (will be used in confirmation link)
      return { task, token };
    }

    // Internal task
    const task = await prisma.task.create({
      data: {
        containerId,
        assigneeType: 'INTERNAL_USER',
        assigneeId: taskData.assigneeId,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 'MEDIUM',
        dueDate: taskData.dueDate,
        status: 'ASSIGNED',
      },
    });

    logger.info(
      {
        taskId: task.id,
        containerId,
        assigneeId: taskData.assigneeId,
      },
      'Internal task assigned'
    );

    return { task };
  }

  async confirmExternalTask(tokenHash: string): Promise<any> {
    const task = await prisma.task.findFirst({
      where: {
        confirmationTokenHash: tokenHash,
      },
      include: {
        container: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check expiry
    if (task.confirmationTokenExpiresAt && new Date() > task.confirmationTokenExpiresAt) {
      throw new ConflictError('Confirmation token has expired');
    }

    // Check if already confirmed
    if (task.confirmedAt) {
      throw new ConflictError('Task already confirmed');
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmationTokenHash: null, // Clear token after use
      },
    });

    logger.info(
      {
        taskId: task.id,
        containerId: task.containerId,
      },
      'External task confirmed'
    );

    return updated;
  }

  async getTask(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        container: true,
        assignee: true,
      },
    });
  }

  async updateTask(taskId: string, data: any) {
    return prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        container: true,
      },
    });
  }

  async listByContainer(containerId: string) {
    return prisma.task.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
