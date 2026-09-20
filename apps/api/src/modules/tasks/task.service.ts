import crypto from 'crypto';
import { TaskRepository } from './task.repository.js';
import { AuthenticatedUser } from '../../middleware/auth.middleware.js';
import { assertClientScope, assertOrganizationScope } from '../../middleware/scope.middleware.js';
import { NotFoundError, ValidationError } from '../../common/errors/app-error.js';
import { CreateTaskDto } from '@demurrageos/shared-types';
import { AssigneeType, TaskType } from '@prisma/client';
import { getTaskNotificationQueue } from '../../jobs/queues.js';
import { TaskConfirmationProcessor } from '../../jobs/task-confirmation.worker.js';
import { AuditService } from '../audit/audit.service.js';
import { prisma } from '../../lib/prisma.js';

export class TaskService {
  public static async createTask(user: AuthenticatedUser, dto: CreateTaskDto) {
    const container = await prisma.container.findUnique({
      where: { id: dto.containerId }
    });
    if (!container) {
      throw new NotFoundError(`Container ${dto.containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    let confirmationTokenHash: string | undefined;
    let tokenExpiresAt: Date | undefined;
    let rawToken: string | undefined;

    if (dto.assigneeType === AssigneeType.EXTERNAL_CONTACT) {
      if (!dto.externalContactName || (!dto.externalContactEmail && !dto.externalContactPhone)) {
        throw new ValidationError('External contact name and either phone or email are required');
      }

      // Generate 256-bit cryptographic entropy token
      rawToken = crypto.randomBytes(32).toString('hex');
      confirmationTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      tokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    }

    const task = await TaskRepository.createTask({
      organizationId: user.organizationId,
      containerId: dto.containerId,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType as TaskType,
      assigneeType: dto.assigneeType as AssigneeType,
      assignedUserId: dto.assignedUserId,
      externalContactName: dto.externalContactName,
      externalContactEmail: dto.externalContactEmail,
      externalContactPhone: dto.externalContactPhone,
      pickupLocation: dto.pickupLocation,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
      confirmationTokenHash,
      tokenExpiresAt
    });

    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      actorType: 'USER',
      action: 'CREATE_TASK',
      targetType: 'TASK',
      targetId: task.id,
      metadata: {
        taskType: dto.taskType,
        assigneeType: dto.assigneeType,
        hasExternalToken: !!rawToken
      }
    });

    // Enqueue notification job if external
    if (rawToken && (dto.externalContactEmail || dto.externalContactPhone)) {
      const recipientContact = dto.externalContactEmail || dto.externalContactPhone!;
      const queue = getTaskNotificationQueue();

      if (queue) {
        await queue.add('send-notification', {
          taskId: task.id,
          rawToken,
          recipientName: dto.externalContactName || 'Transporter',
          recipientContact
        });
      } else {
        // Direct async fallback
        setImmediate(() => {
          TaskConfirmationProcessor.process({
            taskId: task.id,
            rawToken: rawToken!,
            recipientName: dto.externalContactName || 'Transporter',
            recipientContact
          }).catch(() => {});
        });
      }
    }

    return {
      task,
      rawConfirmationToken: rawToken // Returned once at creation for CHA UI convenience
    };
  }

  public static async getContainerTasks(user: AuthenticatedUser, containerId: string) {
    const container = await prisma.container.findUnique({
      where: { id: containerId }
    });
    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    return TaskRepository.findByContainerId(containerId);
  }

  public static async revokeToken(user: AuthenticatedUser, taskId: string) {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Task ${taskId} not found`);
    }

    assertOrganizationScope(user, task.organizationId);

    const updated = await TaskRepository.revokeToken(taskId);

    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      actorType: 'USER',
      action: 'REVOKE_TASK_TOKEN',
      targetType: 'TASK',
      targetId: taskId
    });

    return updated;
  }
}
