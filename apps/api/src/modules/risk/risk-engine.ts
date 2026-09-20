import { ComplianceSignal, Container, ContainerStatus, DeliveryMode } from '@prisma/client';
import {
  RiskCategory,
  RiskReason,
  RiskSeverity,
  StructuredRiskAssessment
} from '@demurrageos/shared-types';

export class DeterministicRiskEngine {
  /**
   * Deterministic calculation: combines deadline exposure, compliance signals,
   * delivery mode bottlenecks, and status factors.
   * AI is never allowed to directly assign or overwrite the final risk score.
   */
  public static evaluate(
    container: Container,
    signals: ComplianceSignal[]
  ): StructuredRiskAssessment {
    const reasons: RiskReason[] = [];
    const recommendedActions: string[] = [];
    let riskScore = 15; // Base baseline risk

    const now = new Date().getTime();

    // 1. DEADLINE / FREE-TIME FACTOR
    if (container.freeTimeExpiresAt) {
      const expiryTime = new Date(container.freeTimeExpiresAt).getTime();
      const hoursRemaining = (expiryTime - now) / (1000 * 60 * 60);

      if (hoursRemaining <= 0) {
        // Already in demurrage!
        const daysOverdue = Math.ceil(Math.abs(hoursRemaining) / 24);
        const deadlineContribution = 50;
        riskScore += deadlineContribution;
        reasons.push({
          category: RiskCategory.DEADLINE,
          contribution: deadlineContribution,
          explanation: `Free time expired ${daysOverdue} day(s) ago. Demurrage charges currently accumulating.`
        });
        recommendedActions.push('Authorize expedited gate-out or delivery immediately to halt recurring charges.');
      } else if (hoursRemaining <= 24) {
        const deadlineContribution = 35;
        riskScore += deadlineContribution;
        reasons.push({
          category: RiskCategory.DEADLINE,
          contribution: deadlineContribution,
          explanation: `Critical deadline: Free time expires in ${Math.round(hoursRemaining)} hours.`
        });
        recommendedActions.push('Dispatch trucker immediately before the 24-hour free-time deadline.');
      } else if (hoursRemaining <= 72) {
        const deadlineContribution = 20;
        riskScore += deadlineContribution;
        reasons.push({
          category: RiskCategory.DEADLINE,
          contribution: deadlineContribution,
          explanation: `Free time expiring soon (${Math.round(hoursRemaining / 24)} days remaining).`
        });
        recommendedActions.push('Verify delivery order and confirm pickup schedule with transporter.');
      }
    } else {
      reasons.push({
        category: RiskCategory.OPERATIONAL,
        contribution: 10,
        explanation: 'Free time expiration timestamp is not yet determined.'
      });
    }

    // 2. COMPLIANCE SIGNALS FACTOR
    // Signals with score < 70 add risk; score >= 85 reduce risk
    for (const sig of signals) {
      if (sig.score < 50) {
        const penalty = Math.round((50 - sig.score) * 0.4);
        riskScore += penalty;
        reasons.push({
          category: RiskCategory.COMPLIANCE,
          signalType: sig.signalType as any,
          contribution: penalty,
          explanation: sig.reason || `Poor compliance readiness score for ${sig.signalType} (${sig.score}/100).`
        });
        if (sig.signalType === 'DOC_COMPLETENESS') {
          recommendedActions.push('Upload and review missing customs/shipping documents.');
        } else if (sig.signalType === 'HS_CODE_NOVELTY') {
          recommendedActions.push('Review first-time HS code classification prior to customs assessment.');
        } else if (sig.signalType === 'VALUATION_CONSISTENCY') {
          recommendedActions.push('Verify invoice valuation against historical declarations to prevent duty query.');
        }
      } else if (sig.score >= 85) {
        // High compliance lowers risk slightly
        riskScore = Math.max(0, riskScore - 5);
      }
    }

    // 3. DELIVERY MODE & CFS BOTTLENECK FACTOR
    if (container.deliveryMode === DeliveryMode.DPD_CFS) {
      riskScore += 10;
      reasons.push({
        category: RiskCategory.OPERATIONAL,
        contribution: 10,
        explanation: 'DPD-to-CFS mode: Subject to ground rent if not cleared from CFS within free window.'
      });
    }

    // 4. CONTAINER STATUS FACTOR
    if (container.status === ContainerStatus.CUSTOMS_HOLD) {
      riskScore += 30;
      reasons.push({
        category: RiskCategory.COMPLIANCE,
        contribution: 30,
        explanation: 'Customs hold active on container. Port removal blocked.'
      });
      recommendedActions.push('Resolve customs query or query reply letter with customs appraiser.');
    }

    // Clamp score between 0 and 100
    const finalScore = Math.min(100, Math.max(0, riskScore));

    // Determine severity
    let severity: RiskSeverity = RiskSeverity.LOW;
    if (finalScore >= 75) {
      severity = RiskSeverity.CRITICAL;
    } else if (finalScore >= 50) {
      severity = RiskSeverity.HIGH;
    } else if (finalScore >= 30) {
      severity = RiskSeverity.MEDIUM;
    }

    if (recommendedActions.length === 0) {
      recommendedActions.push('Monitor standard container milestones. No immediate intervention required.');
    }

    return {
      containerId: container.id,
      riskScore: finalScore,
      severity,
      reasons,
      recommendedActions: Array.from(new Set(recommendedActions)),
      calculatedAt: new Date().toISOString()
    };
  }
}
