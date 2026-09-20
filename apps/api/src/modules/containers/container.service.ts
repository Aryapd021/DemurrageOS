import { ContainerRepository } from './container.repository.js';
import { AuthenticatedUser } from '../../middleware/auth.middleware.js';
import { assertClientScope, assertOrganizationScope } from '../../middleware/scope.middleware.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../common/errors/app-error.js';
import { DeliveryMode, ContainerStatus } from '@prisma/client';
import { ComplianceService } from '../compliance/compliance.service.js';
import { RiskService } from '../risk/risk.service.js';
import { ChargeService } from '../charges/charge.service.js';
import { AuditService } from '../audit/audit.service.js';
import { prisma } from '../../lib/prisma.js';

export class ContainerService {
  public static async listContainers(user: AuthenticatedUser) {
    return ContainerRepository.findContainers(user.organizationId, user.visibleClientIds);
  }

  public static async getContainer(user: AuthenticatedUser, id: string) {
    const container = await ContainerRepository.findById(id);
    if (!container) {
      throw new NotFoundError(`Container ${id} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    return container;
  }

  public static async fallbackDpdToCfs(
    user: AuthenticatedUser,
    containerId: string,
    cfsId: string,
    reason: string = 'Port 48-hour DPD clearance window lapsed. Diverted to CFS.'
  ) {
    const container = await ContainerRepository.findById(containerId);
    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    if (container.deliveryMode !== DeliveryMode.DPD_CFS && container.deliveryMode !== DeliveryMode.DPD_DIRECT) {
      throw new ValidationError(`Container is already in ${container.deliveryMode} delivery mode`);
    }

    const cfs = await prisma.cFS.findUnique({
      where: { id: cfsId }
    });
    if (!cfs) {
      throw new NotFoundError(`CFS ${cfsId} not found`);
    }

    const now = new Date();

    // 1. Record immutable historical event
    await ContainerRepository.recordEvent({
      containerId,
      eventType: 'DPD_TO_CFS_FALLBACK',
      location: cfs.name,
      source: 'OPERATIONAL_TRANSITION',
      metadata: {
        previousMode: container.deliveryMode,
        targetCfs: cfs.name,
        reason
      },
      timestamp: now
    });

    // 2. Also record CFS Gate-In milestone event
    await ContainerRepository.recordEvent({
      containerId,
      eventType: 'CFS_GATE_IN',
      location: cfs.name,
      source: 'CFS_TERMINAL',
      metadata: { cfsCode: cfs.code },
      timestamp: now
    });

    // 3. Update container delivery mode & dates
    const updated = await ContainerRepository.updateContainer(containerId, {
      deliveryMode: DeliveryMode.CFS,
      cfsId,
      gateInDate: now
    });

    // 4. Recalculate two-clock charges
    await ChargeService.calculateAndSaveCharges(user, containerId, now);

    // 5. Recalculate compliance signals and risk
    await ComplianceService.recalculateAllDerivedSignals(containerId);
    await RiskService.calculateContainerRisk(user, containerId);

    // 6. Record audit log
    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      actorType: 'USER',
      action: 'DPD_TO_CFS_FALLBACK_TRIGGERED',
      targetType: 'CONTAINER',
      targetId: containerId,
      metadata: {
        previousMode: container.deliveryMode,
        cfsId,
        cfsName: cfs.name,
        reason
      }
    });

    return updated;
  }
}
