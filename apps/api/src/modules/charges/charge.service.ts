import { prisma } from '../../lib/prisma.js';
import { ChargeEngine, CalculatedCharge } from './charge.engine.js';
import { AuthenticatedUser } from '../../middleware/auth.middleware.js';
import { assertClientScope, assertOrganizationScope } from '../../middleware/scope.middleware.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { AuditService } from '../audit/audit.service.js';

export class ChargeService {
  public static async calculateAndSaveCharges(
    user: AuthenticatedUser,
    containerId: string,
    asOfDate?: Date
  ): Promise<CalculatedCharge[]> {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: { client: true }
    });

    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    // Fetch active tariffs for this carrier and CFS
    const tariffs = await prisma.tariff.findMany({
      where: {
        organizationId: container.organizationId
      }
    });

    const carrierTariffs = tariffs.filter(t => !container.carrier || t.carrier === container.carrier);
    const cfsTariffs = tariffs.filter(t => !container.cfsId || t.cfsId === container.cfsId);

    const calculatedCharges = ChargeEngine.calculate(
      container,
      carrierTariffs,
      cfsTariffs,
      asOfDate || new Date()
    );

    // Persist charges idempotently
    for (const charge of calculatedCharges) {
      const existing = await prisma.charge.findFirst({
        where: {
          containerId,
          chargeType: charge.chargeType
        }
      });

      if (existing) {
        await prisma.charge.update({
          where: { id: existing.id },
          data: {
            amount: charge.amount,
            daysCalculated: charge.daysCalculated,
            calculationBreakdown: charge.breakdown as any
          }
        });
      } else {
        await prisma.charge.create({
          data: {
            containerId,
            chargeType: charge.chargeType,
            amount: charge.amount,
            currency: charge.currency,
            daysCalculated: charge.daysCalculated,
            calculationBreakdown: charge.breakdown as any,
            isAuthoritative: true
          }
        });
      }
    }

    await AuditService.log({
      organizationId: container.organizationId,
      actorId: user.id,
      actorType: 'SYSTEM',
      action: 'CALCULATE_CHARGES',
      targetType: 'CONTAINER',
      targetId: containerId,
      metadata: {
        chargesCount: calculatedCharges.length,
        totalAmount: calculatedCharges.reduce((sum, c) => sum + c.amount, 0)
      }
    });

    return calculatedCharges;
  }

  public static async getContainerCharges(user: AuthenticatedUser, containerId: string) {
    const container = await prisma.container.findUnique({
      where: { id: containerId }
    });

    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    return prisma.charge.findMany({
      where: { containerId }
    });
  }
}
