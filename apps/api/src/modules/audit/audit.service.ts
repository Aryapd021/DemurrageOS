import { prisma } from '../../lib/prisma.js';
import { logger } from '../../common/logging/logger.js';

export interface CreateAuditLogParams {
  organizationId: string;
  actorId?: string | null;
  actorType: 'USER' | 'SYSTEM' | 'EXTERNAL';
  action: string;
  targetType: 'CONTAINER' | 'DOCUMENT' | 'COMPLIANCE_SIGNAL' | 'TASK' | 'CHARGE';
  targetId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      // Sanitize metadata to guarantee no secrets/tokens are logged
      const sanitizedMetadata = params.metadata ? { ...params.metadata } : {};
      if (sanitizedMetadata.token) delete sanitizedMetadata.token;
      if (sanitizedMetadata.password) delete sanitizedMetadata.password;
      if (sanitizedMetadata.secret) delete sanitizedMetadata.secret;

      await prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          actorId: params.actorId,
          actorType: params.actorType,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          metadata: sanitizedMetadata,
          ipAddress: params.ipAddress
        }
      });

      logger.info(`[AUDIT] ${params.action} on ${params.targetType}:${params.targetId}`, {
        organizationId: params.organizationId,
        actorType: params.actorType,
        action: params.action
      });
    } catch (err: any) {
      logger.error(`Failed to record audit log: ${err.message}`, err);
      // Non-blocking: never let audit persistence failure crash primary business workflow
    }
  }
}
