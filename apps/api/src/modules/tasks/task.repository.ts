import { prisma } from '../../lib/prisma.js';
import { TaskType, TaskStatus, AssigneeType } from '@prisma/client';

export class TaskRepository {
  public static async createTask(data: {
    organizationId: string;
    containerId?: string | null;
    title: string;
    description?: string;
    taskType: TaskType;
    assigneeType: AssigneeType;
    assignedUserId?: string | null;
    externalContactName?: string | null;
    externalContactEmail?: string | null;
    externalContactPhone?: string | null;
    pickupLocation?: string | null;
    scheduledDate?: Date | null;
    confirmationTokenHash?: string | null;
    tokenExpiresAt?: Date | null;
  }) {
    return prisma.task.create({
      data: {
        ...data,
        status: TaskStatus.PENDING
      },
      include: {
        container: true,
        assignedUser: true
      }
    });
  }

  public static async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        container: true,
        assignedUser: true
      }
    });
  }

  public static async findByTokenHash(tokenHash: string) {
    return prisma.task.findUnique({
      where: { confirmationTokenHash: tokenHash },
      include: {
        container: true
      }
    });
  }

  public static async findByContainerId(containerId: string) {
    return prisma.task.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: true
      }
    });
  }

  public static async confirmTask(id: string, confirmedAt: Date = new Date()) {
    return prisma.task.update({
      where: { id },
      data: {
        confirmedAt,
        status: TaskStatus.COMPLETED
      },
      include: {
        container: true
      }
    });
  }

  public static async revokeToken(id: string) {
    return prisma.task.update({
      where: { id },
      data: {
        tokenRevokedAt: new Date(),
        status: TaskStatus.CANCELLED
      }
    });
  }
}
