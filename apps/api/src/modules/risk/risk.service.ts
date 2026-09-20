import { prisma } from '../../lib/prisma.js';
import { DeterministicRiskEngine } from './risk-engine.js';
import { AuthenticatedUser } from '../../middleware/auth.middleware.js';
import { assertClientScope, assertOrganizationScope } from '../../middleware/scope.middleware.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { StructuredRiskAssessment } from '@demurrageos/shared-types';
import { AuditService } from '../audit/audit.service.js';
import { config } from '../../config/index.js';

export class RiskService {
  public static async calculateContainerRisk(
    user: AuthenticatedUser,
    containerId: string
  ): Promise<StructuredRiskAssessment> {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        client: true,
        complianceSignals: true
      }
    });

    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    const assessment = DeterministicRiskEngine.evaluate(container, container.complianceSignals);

    // Advisory Predictive Integration (Graceful degradation: system continues if AI is offline)
    try {
      let hoursSinceDischarge = 0;
      if (container.dischargeDate) {
        hoursSinceDischarge = Math.max(0, (Date.now() - new Date(container.dischargeDate).getTime()) / (1000 * 60 * 60));
      }

      let freeDays = 3;
      if (container.freeTimeExpiresAt && container.dischargeDate) {
        freeDays = Math.max(1, Math.round((new Date(container.freeTimeExpiresAt).getTime() - new Date(container.dischargeDate).getTime()) / (1000 * 60 * 60 * 24)));
      }

      const confirmedTask = await prisma.task.findFirst({
        where: {
          containerId,
          confirmedAt: { not: null }
        }
      });

      // Authoritative potential exposure calculation from Prisma tariffs (Rule 13)
      let authoritativePotentialExposure: number | null = null;
      try {
        const cfsTariffs = await prisma.tariff.findMany({
          where: {
            organizationId: container.organizationId,
            chargeType: 'CFS_GROUND_RENT'
          }
        });
        const matchedTariff = cfsTariffs.find(t => !container.cfsId || t.cfsId === container.cfsId);
        if (matchedTariff) {
          const rate = container.size === 40 ? matchedTariff.ratePerDay40 : matchedTariff.ratePerDay20;
          authoritativePotentialExposure = rate * 3;
        }
      } catch {
        authoritativePotentialExposure = null;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.internalServiceKey) {
        headers['Authorization'] = `Bearer ${config.internalServiceKey}`;
      }

      const response = await fetch(`${config.aiServiceUrl}/api/ai/risk/evaluate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          org_id: container.organizationId,
          container_id: container.id,
          delivery_mode: container.deliveryMode,
          hours_since_discharge: hoursSinceDischarge,
          free_days: freeDays,
          is_trucker_confirmed: !!confirmedTask,
          customs_hold: container.status === 'CUSTOMS_HOLD',
          authoritative_potential_exposure: authoritativePotentialExposure
        }),
        signal: AbortSignal.timeout(2000)
      });

      if (response.ok) {
        const aiData: any = await response.json();
        assessment.advisory = {
          status: aiData.status,
          predictedFallback: aiData.predicted_fallback,
          fallbackProbability: aiData.fallback_probability,
          preventableExposureInr: aiData.preventable_exposure_inr ?? null,
          explanation: aiData.explanation
        };
      }
    } catch {
      // Non-blocking: AI is strictly advisory
    }

    // If risk is high/critical, ensure an active alert exists
    if (assessment.severity === 'HIGH' || assessment.severity === 'CRITICAL') {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          containerId,
          isRead: false
        }
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            organizationId: container.organizationId,
            containerId,
            severity: assessment.severity as any,
            title: `Elevated Demurrage Risk (${assessment.riskScore}/100) on ${container.containerNumber}`,
            message: assessment.reasons[0]?.explanation || 'Action required to prevent demurrage exposure'
          }
        });
      }
    }

    await AuditService.log({
      organizationId: container.organizationId,
      actorId: user.id,
      actorType: 'SYSTEM',
      action: 'RECALCULATE_RISK_ASSESSMENT',
      targetType: 'CONTAINER',
      targetId: containerId,
      metadata: {
        score: assessment.riskScore,
        severity: assessment.severity
      }
    });

    return assessment;
  }
}
