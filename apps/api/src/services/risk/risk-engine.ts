import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export interface RiskSignal {
  type: string;
  score: number;
  weight: number;
}

export class RiskEngine {
  /**
   * Calculate operational risk based on multiple factors
   * Combines deterministic operational factors with compliance signals
   */
  async calculateRiskScore(containerId: string): Promise<{ score: number; level: string; reasons: string[] }> {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        events: true,
        charges: true,
        complianceSignals: true,
        alerts: true,
      },
    });

    if (!container) {
      throw new Error('Container not found');
    }

    let baseScore = 0;
    const reasons: string[] = [];

    // 1. Deadline urgency
    const freeTimeCharges = container.charges.filter((c) => c.chargeType === 'DEMURRAGE');
    if (freeTimeCharges.length > 0) {
      const daysOverdue = freeTimeCharges[0].daysOverdue || 0;
      if (daysOverdue > 20) {
        baseScore += 30;
        reasons.push('High deadline urgency (>20 days overdue)');
      } else if (daysOverdue > 10) {
        baseScore += 20;
        reasons.push('Medium deadline urgency (>10 days overdue)');
      } else if (daysOverdue > 0) {
        baseScore += 10;
        reasons.push('Low deadline urgency (overdue)');
      }
    }

    // 2. Financial exposure
    const totalExposure = container.charges.reduce((sum, c) => sum + c.amount.toNumber(), 0);
    if (totalExposure > 50000) {
      baseScore += 25;
      reasons.push(`High financial exposure (${totalExposure})`);
    } else if (totalExposure > 20000) {
      baseScore += 15;
      reasons.push(`Medium financial exposure (${totalExposure})`);
    } else if (totalExposure > 0) {
      baseScore += 5;
      reasons.push(`Financial exposure present (${totalExposure})`);
    }

    // 3. Compliance signals (AI-derived advisory)
    for (const signal of container.complianceSignals) {
      const signalScore = signal.score.toNumber();
      if (signal.signalType === 'HS_CODE_NOVELTY' && signalScore > 70) {
        baseScore += 10;
        reasons.push('Novel HS code detected');
      }
      if (signal.signalType === 'DOC_COMPLETENESS' && signalScore < 50) {
        baseScore += 10;
        reasons.push('Incomplete documentation');
      }
      if (signal.signalType === 'VALUATION_CONSISTENCY' && signalScore < 50) {
        baseScore += 5;
        reasons.push('Valuation consistency concerns');
      }
    }

    // 4. Operational uncertainty
    const events = container.events.filter((e) => e.eventType === 'DPD_TO_CFS_FALLBACK');
    if (events.length > 0) {
      baseScore += 15;
      reasons.push('Delivery mode fallback occurred');
    }

    // 5. AEO/ACP status
    const client = await prisma.client.findUnique({
      where: { id: container.clientId },
    });

    if (client && client.aeoStatus === 'SUSPENDED') {
      baseScore += 20;
      reasons.push('Client AEO status suspended');
    } else if (client && client.aeoStatus === 'NONE') {
      baseScore += 5;
      reasons.push('Client not AEO certified');
    }

    // Determine risk level
    let level = 'LOW';
    if (baseScore >= 70) {
      level = 'CRITICAL';
    } else if (baseScore >= 50) {
      level = 'HIGH';
    } else if (baseScore >= 30) {
      level = 'MEDIUM';
    }

    logger.info(
      {
        containerId,
        score: baseScore,
        level,
        reasons,
      },
      'Risk calculated'
    );

    return {
      score: baseScore,
      level,
      reasons,
    };
  }

  async recalculateForContainer(containerId: string) {
    const risk = await this.calculateRiskScore(containerId);

    await prisma.container.update({
      where: { id: containerId },
      data: {
        riskScore: risk.score,
        riskLevel: risk.level,
      },
    });

    return risk;
  }
}

export class ComplianceSignalService {
  /**
   * Derive historical compliance signals based on client patterns
   */
  async deriveHistoricalSignals(containerId: string): Promise<void> {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new Error('Container not found');
    }

    // HS Code novelty: check if client has used this HS code before
    if (container.hsCode) {
      const previousUse = await prisma.container.findFirst({
        where: {
          clientId: container.clientId,
          hsCode: container.hsCode,
          createdAt: { lt: container.createdAt },
        },
      });

      const score = previousUse ? 20 : 80; // Novel if not used before

      await prisma.complianceSignal.create({
        data: {
          containerId,
          signalType: 'HS_CODE_NOVELTY',
          score,
          source: 'DERIVED',
          metadata: JSON.stringify({ previousUseCount: previousUse ? 1 : 0 }),
        },
      });
    }

    // Valuation consistency: compare against historical patterns
    if (container.declaredValue && container.hsCode) {
      const historicalContainers = await prisma.container.findMany({
        where: {
          clientId: container.clientId,
          hsCode: container.hsCode,
          createdAt: { lt: container.createdAt },
          declaredValue: { not: null },
        },
        take: 10,
      });

      if (historicalContainers.length > 0) {
        const avgValue = historicalContainers.reduce((sum, c) => sum + c.declaredValue!.toNumber(), 0) / historicalContainers.length;
        const currentValue = container.declaredValue.toNumber();
        const deviation = Math.abs(currentValue - avgValue) / avgValue;

        // Score based on deviation from historical average
        const score = Math.min(100, Math.max(0, 100 - deviation * 100));

        await prisma.complianceSignal.create({
          data: {
            containerId,
            signalType: 'VALUATION_CONSISTENCY',
            score,
            source: 'DERIVED',
            metadata: JSON.stringify({ historicalAvg: avgValue, deviation }),
          },
        });
      }
    }

    // AEO/ACP status signal
    const client = await prisma.client.findUnique({
      where: { id: container.clientId },
    });

    if (client) {
      const score = (client.aeoStatus === 'CERTIFIED' ? 80 : 20) + (client.acpStatus === 'CERTIFIED' ? 20 : 0);

      await prisma.complianceSignal.create({
        data: {
          containerId,
          signalType: 'AEO_ACP_STATUS',
          score,
          source: 'DERIVED',
          metadata: JSON.stringify({ aeoStatus: client.aeoStatus, acpStatus: client.acpStatus }),
        },
      });
    }

    logger.info({ containerId }, 'Historical compliance signals derived');
  }
}
