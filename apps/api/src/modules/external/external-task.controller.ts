import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { TaskRepository } from '../tasks/task.repository.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../common/errors/app-error.js';
import { AuditService } from '../audit/audit.service.js';
import { RiskService } from '../risk/risk.service.js';

export class ExternalTaskController {
  private static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  public static async getTaskSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = String(req.params.token);
      if (!rawToken || rawToken.length < 32) {
        throw new ValidationError('Invalid confirmation token format');
      }

      const tokenHash = ExternalTaskController.hashToken(rawToken);
      const task = await TaskRepository.findByTokenHash(tokenHash);

      if (!task) {
        throw new NotFoundError('Invalid or expired confirmation link');
      }

      const now = new Date();
      const isExpired = !!(task.tokenExpiresAt && task.tokenExpiresAt < now);
      const isRevoked = !!task.tokenRevokedAt;
      const alreadyConfirmed = !!task.confirmedAt;

      // Strictly minimal data payload - leaks ZERO internal tenant or financial data
      res.json({
        data: {
          taskId: task.id,
          title: task.title,
          containerNumber: task.container?.containerNumber || 'N/A',
          pickupLocation: task.pickupLocation,
          scheduledDate: task.scheduledDate?.toISOString() || null,
          confirmedAt: task.confirmedAt?.toISOString() || null,
          isExpired,
          isRevoked,
          alreadyConfirmed
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async confirmTask(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = String(req.params.token);
      if (!rawToken || rawToken.length < 32) {
        throw new ValidationError('Invalid confirmation token format');
      }

      const tokenHash = ExternalTaskController.hashToken(rawToken);
      const task = await TaskRepository.findByTokenHash(tokenHash);

      if (!task) {
        throw new NotFoundError('Invalid confirmation link');
      }

      const now = new Date();

      if (task.tokenRevokedAt) {
        throw new ForbiddenError('This task confirmation link has been revoked');
      }

      if (task.tokenExpiresAt && task.tokenExpiresAt < now) {
        throw new ForbiddenError('This confirmation link has expired (72-hour window elapsed)');
      }

      if (task.confirmedAt) {
        throw new ConflictError('This task has already been confirmed');
      }

      // Authoritative update
      const confirmedTask = await TaskRepository.confirmTask(task.id, now);

      // Record operational ContainerEvent
      if (task.containerId) {
        await prisma.containerEvent.create({
          data: {
            containerId: task.containerId,
            eventType: 'PICKUP_SCHEDULED_BY_EXTERNAL_PARTY',
            source: 'EXTERNAL_CONFIRMATION',
            location: task.pickupLocation || 'CFS / Port Terminal',
            metadata: {
              taskId: task.id,
              externalContactName: task.externalContactName
            }
          }
        });

        // Trigger risk recalculation
        try {
          const fakeUser = {
            id: 'external-system',
            organizationId: task.organizationId,
            email: 'external@demurrageos.local',
            role: 'EXTERNAL' as const
          };
          await RiskService.calculateContainerRisk(fakeUser, task.containerId);
        } catch (e) {
          // Non-blocking
        }
      }

      // Record audit records
      await prisma.externalTaskConfirmationAudit.create({
        data: {
          taskId: task.id,
          tokenHash,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'] || 'Unknown',
          action: 'CONFIRM_PICKUP',
          confirmedAt: now
        }
      });

      await AuditService.log({
        organizationId: task.organizationId,
        actorType: 'EXTERNAL',
        action: 'CONFIRM_EXTERNAL_TASK',
        targetType: 'TASK',
        targetId: task.id,
        metadata: {
          containerId: task.containerId,
          confirmedAt: now.toISOString()
        },
        ipAddress: req.ip
      });

      res.status(200).json({
        data: {
          success: true,
          confirmedAt: now.toISOString(),
          message: 'Pickup schedule confirmed successfully. DemurrageOS operational status updated.'
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
