import type {
  ContainerDTO,
  ContainerEventDTO,
  RiskAssessmentDTO,
  RiskUrgency,
  RiskFactorDTO,
  ComplianceSignalDTO
} from '../../../../packages/shared-types/src/index.ts';
import { logger } from '../../config/logger.ts';

export interface RiskEngineInput {
  container: ContainerDTO;
  events: ContainerEventDTO[];
  complianceSignals?: ComplianceSignalDTO[];
}

export class RiskEngine {
  public evaluate(input: RiskEngineInput): RiskAssessmentDTO {
    const { container, events } = input;
    const signals = input.complianceSignals || container.complianceSignals || [];

    let score = 0;
    const factors: RiskFactorDTO[] = [];
    const reasons: string[] = [];

    // 1. DEADLINE URGENCY (0 - 35 points)
    const breakdown = container.chargeBreakdown;
    const carrierFreeRemaining = breakdown ? breakdown.freeDaysRemainingCarrier : 5;
    const cfsFreeRemaining = breakdown ? breakdown.freeDaysRemainingCfs : 3;

    if (carrierFreeRemaining === 0) {
      score += 35;
      factors.push({
        factor: 'Carrier Free-Time Expired',
        impact: 35,
        explanation: `Carrier free-time expired. Container is ${breakdown?.carrierDaysOverdue || 1} day(s) into demurrage.`
      });
      reasons.push(`Demurrage penalty accruing daily (${breakdown?.carrierDaysOverdue || 1} days overdue).`);
    } else if (carrierFreeRemaining <= 1) {
      score += 25;
      factors.push({
        factor: 'Imminent Free-Time Expiration',
        impact: 25,
        explanation: `Only ${carrierFreeRemaining} day(s) of carrier free-time remaining.`
      });
      reasons.push(`Carrier free-time expires within 24-48 hours.`);
    } else if (carrierFreeRemaining <= 3) {
      score += 15;
      factors.push({
        factor: 'Approaching Free-Time Expiration',
        impact: 15,
        explanation: `${carrierFreeRemaining} day(s) of carrier free-time remaining.`
      });
    }

    if (breakdown?.isTwoClockActive && cfsFreeRemaining <= 1) {
      score += 15;
      factors.push({
        factor: 'CFS Free-Time Expiration',
        impact: 15,
        explanation: `CFS ground rent clock active. ${cfsFreeRemaining} CFS free day(s) remaining.`
      });
      reasons.push('CFS ground rent clock active with minimal free-time remaining.');
    }

    // 2. CUSTOMS & OPERATIONAL TRANSITION STATUS (0 - 25 points)
    const hasCustomsOOC = events.some(e => e.eventType === 'CUSTOMS_OUT_OF_CHARGE');
    const hasFallback = events.some(e => e.eventType === 'DPD_TO_CFS_FALLBACK');

    if (hasFallback) {
      score += 20;
      factors.push({
        factor: 'DPD-to-CFS Fallback Occurred',
        impact: 20,
        explanation: 'Container failed DPD direct clearance window and moved to off-dock CFS. Both carrier and CFS clocks running.'
      });
      reasons.push('DPD fallback triggered: container moved to CFS, triggering secondary storage clock and shifting fees.');
    } else if (!hasCustomsOOC) {
      score += 15;
      factors.push({
        factor: 'Customs Out-of-Charge Pending',
        impact: 15,
        explanation: 'Customs clearance (OOC) has not yet been granted.'
      });
      reasons.push('Customs clearance pending examination / duty payment.');
    }

    // 3. COMPLIANCE & DOCUMENT SIGNALS (0 - 25 points)
    for (const sig of signals) {
      if (sig.status === 'FAIL') {
        score += sig.scoreImpact || 15;
        factors.push({
          factor: `Compliance Fail: ${sig.signalType}`,
          impact: sig.scoreImpact || 15,
          explanation: sig.details
        });
        reasons.push(sig.details);
      } else if (sig.status === 'WARNING') {
        score += sig.scoreImpact || 8;
        factors.push({
          factor: `Compliance Warning: ${sig.signalType}`,
          impact: sig.scoreImpact || 8,
          explanation: sig.details
        });
        reasons.push(sig.details);
      }
    }

    // 4. TASK & DISPATCH READINESS (0 - 15 points)
    const tasks = container.tasks || [];
    const pickupTask = tasks.find(t => t.taskType === 'TRUCKER_PICKUP');
    if (!pickupTask) {
      score += 10;
      factors.push({
        factor: 'No Trucker Assigned',
        impact: 10,
        explanation: 'No external transport task has been dispatched for container evacuation.'
      });
      reasons.push('Transport/trucker pickup task has not been created or dispatched.');
    } else if (pickupTask.status === 'PENDING' || pickupTask.status === 'ASSIGNED') {
      score += 5;
      factors.push({
        factor: 'Trucker Confirmation Awaiting',
        impact: 5,
        explanation: `Assigned to ${pickupTask.assigneeName} but confirmation token remains unacknowledged.`
      });
      reasons.push(`Awaiting confirmation from assigned driver (${pickupTask.assigneeName}).`);
    }

    const finalScore = Math.min(100, Math.max(0, score));

    let urgency: RiskUrgency = 'LOW';
    if (finalScore >= 75) urgency = 'CRITICAL';
    else if (finalScore >= 50) urgency = 'HIGH';
    else if (finalScore >= 25) urgency = 'MEDIUM';

    if (reasons.length === 0) {
      reasons.push('Normal container movement. All documents verified and free-time is healthy.');
    }

    const assessment: RiskAssessmentDTO = {
      score: finalScore,
      urgency,
      reasons,
      factors,
      calculatedAt: new Date().toISOString()
    };

    logger.info({
      module: 'RiskEngine',
      input: {
        containerId: container.id,
        containerNumber: container.containerNumber,
        deliveryMode: container.deliveryMode,
        eventsCount: events.length,
        signalsCount: signals.length,
        tasksCount: tasks.length
      },
      output: assessment
    }, `Deterministic risk evaluation completed for container ${container.containerNumber} (Score: ${finalScore}, Urgency: ${urgency})`);

    return assessment;
  }
}

export const riskEngine = new RiskEngine();
