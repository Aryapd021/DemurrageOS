import crypto from 'crypto';
import type { TaskDTO, TaskStatus, ExternalTaskConfirmationResponse } from '../../../../../packages/shared-types/src/index.ts';
import { dbStore } from '../../db/store.ts';
import { queueManager } from '../../queues/queueManager.ts';
import { logger } from '../../config/logger.ts';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class ExternalConfirmationService {
  private rateLimits: Map<string, RateLimitEntry> = new Map();

  public generateTokenForTask(taskId: string): { rawToken: string; expiresAt: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const task = dbStore.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.confirmationToken = rawToken;
    (task as any).confirmationTokenHash = tokenHash;
    task.tokenExpiresAt = expiresAt;
    task.status = 'ASSIGNED';

    dbStore.tasks.set(taskId, task);

    logger.info({ taskId, expiresAt }, 'High-entropy token generated for external task assignment');
    return { rawToken, expiresAt };
  }

  public confirmTask(rawToken: string): ExternalTaskConfirmationResponse {
    const now = Date.now();
    const rateKey = rawToken.substring(0, 16);
    const rate = this.rateLimits.get(rateKey) || { count: 0, resetTime: now + 60000 };

    if (now > rate.resetTime) {
      rate.count = 1;
      rate.resetTime = now + 60000;
    } else {
      rate.count++;
      if (rate.count > 10) {
        logger.warn({ rateKey }, 'Rate limit exceeded on unauthenticated task confirmation');
        throw new Error('Too many confirmation attempts. Please retry later.');
      }
    }
    this.rateLimits.set(rateKey, rate);

    const incomingHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const task = Array.from(dbStore.tasks.values()).find(
      t => (t as any).confirmationTokenHash === incomingHash || t.confirmationToken === rawToken
    );

    if (!task) {
      logger.warn({ tokenPrefix: rawToken.substring(0, 8) }, 'Invalid external confirmation token presented');
      throw new Error('Invalid or non-existent confirmation link.');
    }

    if (task.tokenExpiresAt && new Date(task.tokenExpiresAt).getTime() < now) {
      task.status = 'EXPIRED';
      logger.warn({ taskId: task.id }, 'Expired confirmation token presented');
      throw new Error('This confirmation link has expired (72-hour window lapsed). Please request a new dispatch link.');
    }

    if (task.status === 'CONFIRMED' && task.confirmedAt) {
      return {
        success: true,
        message: 'Task was already confirmed successfully.',
        task: {
          id: task.id,
          containerNumber: task.containerNumber,
          taskType: task.taskType,
          status: 'CONFIRMED',
          confirmedAt: task.confirmedAt
        }
      };
    }

    const confirmedAt = new Date().toISOString();
    task.status = 'CONFIRMED';
    task.confirmedAt = confirmedAt;
    dbStore.tasks.set(task.id, task);

    const container = dbStore.containers.get(task.containerId);
    if (container) {
      dbStore.addEvent({
        id: `evt-confirm-${Date.now()}`,
        containerId: container.id,
        eventType: 'DELIVERY_ORDER_ISSUED',
        eventTimestamp: confirmedAt,
        location: container.portOfDischarge,
        source: 'MANUAL',
        metadata: {
          action: 'EXTERNAL_TRUCKER_CONFIRMATION',
          taskId: task.id,
          driverName: task.assigneeName
        },
        createdAt: confirmedAt
      });

      queueManager.enqueue('calculate-container-risk', {
        containerId: container.id,
        trigger: 'EXTERNAL_TASK_CONFIRMATION'
      });
    }

    dbStore.recordAudit({
      organizationId: container?.organizationId || 'org-apex',
      action: 'EXTERNAL_TASK_CONFIRMED',
      entityType: 'TASK',
      entityId: task.id,
      actor: `EXTERNAL_${task.assigneeName}`,
      payload: { taskId: task.id, confirmedAt }
    });

    logger.info({ taskId: task.id, containerNumber: task.containerNumber }, 'Task successfully confirmed via external unauthenticated flow');

    return {
      success: true,
      message: `Pickup confirmed for container ${task.containerNumber}. CHA operational dashboard has been updated.`,
      task: {
        id: task.id,
        containerNumber: task.containerNumber,
        taskType: task.taskType,
        status: 'CONFIRMED',
        confirmedAt
      }
    };
  }
}

export const externalConfirmationService = new ExternalConfirmationService();
