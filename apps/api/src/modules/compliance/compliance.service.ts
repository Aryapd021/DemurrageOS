import { ComplianceSignalType, SignalSource, ReviewStatus } from '@prisma/client';
import { ComplianceRepository } from './compliance.repository.js';
import { AuthenticatedUser } from '../../middleware/auth.middleware.js';
import { assertClientScope, assertOrganizationScope } from '../../middleware/scope.middleware.js';
import { NotFoundError, ValidationError } from '../../common/errors/app-error.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateManualSignalDto } from '@demurrageos/shared-types';

export class ComplianceService {
  public static async getSignals(user: AuthenticatedUser, containerId: string) {
    const container = await ComplianceRepository.findContainerWithClient(containerId);
    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    return ComplianceRepository.findByContainerId(containerId);
  }

  public static async setManualSignal(user: AuthenticatedUser, containerId: string, dto: CreateManualSignalDto) {
    const container = await ComplianceRepository.findContainerWithClient(containerId);
    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    if (dto.score < 0 || dto.score > 100) {
      throw new ValidationError('Compliance signal score must be between 0 and 100');
    }

    const signal = await ComplianceRepository.upsertSignal(
      containerId,
      dto.signalType as ComplianceSignalType,
      dto.score,
      SignalSource.MANUAL,
      dto.reason,
      {
        setByUserId: user.id,
        setByEmail: user.email,
        timestamp: new Date().toISOString(),
        ...dto.metadata
      }
    );

    await AuditService.log({
      organizationId: container.organizationId,
      actorId: user.id,
      actorType: 'USER',
      action: 'SET_MANUAL_COMPLIANCE_SIGNAL',
      targetType: 'COMPLIANCE_SIGNAL',
      targetId: signal.id,
      metadata: {
        signalType: dto.signalType,
        score: dto.score,
        reason: dto.reason
      }
    });

    return signal;
  }

  public static async deriveHsCodeNovelty(containerId: string): Promise<number> {
    const container = await ComplianceRepository.findContainerWithClient(containerId);
    if (!container) return 50;

    const hsCode = container.hsCode;
    if (!hsCode) {
      // Missing HS code defaults to unknown/low-neutral
      await ComplianceRepository.upsertSignal(
        containerId,
        ComplianceSignalType.HS_CODE_NOVELTY,
        30,
        SignalSource.DERIVED,
        'No HS code specified for container',
        { status: 'MISSING_HS_CODE' }
      );
      return 30;
    }

    const history = await ComplianceRepository.findClientHistoricalContainers(container.clientId, hsCode, containerId);

    let score = 20; // Default: first-time filing for this client (high novelty)
    let explanation = `HS code ${hsCode} has never been filed previously by this client`;

    if (history.length > 0) {
      const mostRecent = history[0];
      const now = new Date().getTime();
      const lastFilingTime = new Date(mostRecent.dischargeDate || mostRecent.createdAt).getTime();
      const daysSinceLast = Math.max(0, Math.floor((now - lastFilingTime) / (1000 * 60 * 60 * 24)));

      if (daysSinceLast <= 30 || history.length >= 5) {
        score = 95;
        explanation = `Frequent routine filings for HS code ${hsCode} (${history.length} historical shipments, last ${daysSinceLast} days ago)`;
      } else if (daysSinceLast <= 90) {
        score = 80;
        explanation = `Regular filing for HS code ${hsCode} (last filed ${daysSinceLast} days ago)`;
      } else if (daysSinceLast <= 180) {
        score = 60;
        explanation = `Infrequent filing for HS code ${hsCode} (last filed ${daysSinceLast} days ago)`;
      } else {
        score = 40;
        explanation = `Stale HS code history (last filed ${daysSinceLast} days ago, >180 days)`;
      }
    }

    await ComplianceRepository.upsertSignal(
      containerId,
      ComplianceSignalType.HS_CODE_NOVELTY,
      score,
      SignalSource.DERIVED,
      explanation,
      { hsCode, historicalCount: history.length }
    );

    return score;
  }

  public static async deriveValuationConsistency(containerId: string): Promise<number> {
    const container = await ComplianceRepository.findContainerWithClient(containerId);
    if (!container) return 50;

    const currentVal = container.declaredValue;
    const hsCode = container.hsCode;

    if (!currentVal || currentVal <= 0 || !hsCode) {
      await ComplianceRepository.upsertSignal(
        containerId,
        ComplianceSignalType.VALUATION_CONSISTENCY,
        50,
        SignalSource.DERIVED,
        'Declared value or HS code not provided',
        { status: 'MISSING_DATA' }
      );
      return 50;
    }

    const history = await ComplianceRepository.findClientHistoricalContainers(container.clientId, hsCode, containerId);
    const validPastValues = history
      .map(c => c.declaredValue)
      .filter((v): v is number => typeof v === 'number' && v > 0);

    if (validPastValues.length < 2) {
      // Insufficient historical records: explicitly represent state rather than fabricating confidence
      await ComplianceRepository.upsertSignal(
        containerId,
        ComplianceSignalType.VALUATION_CONSISTENCY,
        50,
        SignalSource.DERIVED,
        `Insufficient historical shipments under HS ${hsCode} for statistical valuation comparison (${validPastValues.length} historical records)`,
        { status: 'INSUFFICIENT_HISTORICAL_DATA', sampleSize: validPastValues.length }
      );
      return 50;
    }

    // Deterministic mean and standard deviation
    const mean = validPastValues.reduce((sum, v) => sum + v, 0) / validPastValues.length;
    const variance = validPastValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validPastValues.length;
    const stdDev = Math.sqrt(variance);

    let score = 95;
    let explanation = `Declared value (₹${currentVal}) is consistent with historical average (₹${Math.round(mean)})`;

    if (stdDev > 0) {
      const zScore = Math.abs(currentVal - mean) / stdDev;
      if (zScore > 2.5) {
        score = 30;
        explanation = `Extreme valuation outlier: declared value deviates by ${zScore.toFixed(1)}σ from historical baseline`;
      } else if (zScore > 1.5) {
        score = 65;
        explanation = `Moderate valuation variance: declared value deviates by ${zScore.toFixed(1)}σ from historical baseline`;
      } else {
        score = 95;
        explanation = `Valuation within normal statistical range (${zScore.toFixed(1)}σ from mean)`;
      }
    }

    await ComplianceRepository.upsertSignal(
      containerId,
      ComplianceSignalType.VALUATION_CONSISTENCY,
      score,
      SignalSource.DERIVED,
      explanation,
      { mean, stdDev, sampleSize: validPastValues.length }
    );

    return score;
  }

  public static async deriveAeoAcpStatus(containerId: string): Promise<number> {
    const container = await ComplianceRepository.findContainerWithClient(containerId);
    if (!container) return 50;

    const { aeoStatus, acpStatus } = container.client;

    let score = 50;
    let explanation = 'Client has standard accreditation status';

    if (aeoStatus && acpStatus) {
      score = 100;
      explanation = 'Client is dual-accredited (AEO Certified & ACP Program enrolled)';
    } else if (aeoStatus) {
      score = 85;
      explanation = 'Client is AEO Certified';
    } else if (acpStatus) {
      score = 80;
      explanation = 'Client is ACP Program enrolled';
    }

    await ComplianceRepository.upsertSignal(
      containerId,
      ComplianceSignalType.AEO_ACP_STATUS,
      score,
      SignalSource.DERIVED,
      explanation,
      { aeoStatus, acpStatus }
    );

    return score;
  }

  public static async deriveDocumentCompleteness(containerId: string): Promise<number> {
    const container = await ComplianceRepository.findContainerWithClient(containerId);
    if (!container) return 50;

    // Required v1 documents for import containers:
    // 1. BILL_OF_LADING
    // 2. DELIVERY_ORDER
    // 3. BILL_OF_ENTRY
    const requiredTypes = ['BILL_OF_LADING', 'DELIVERY_ORDER', 'BILL_OF_ENTRY'];
    const docs = container.documents;

    let totalPoints = 0;
    const docBreakdown: Record<string, string> = {};

    for (const reqType of requiredTypes) {
      const match = docs.find(d => d.documentType === reqType);
      if (!match) {
        docBreakdown[reqType] = 'MISSING';
      } else if (match.reviewStatus === ReviewStatus.ACCEPTED || match.reviewStatus === ReviewStatus.CORRECTED) {
        docBreakdown[reqType] = 'VERIFIED';
        totalPoints += 100;
      } else if (match.reviewStatus === ReviewStatus.PENDING_REVIEW) {
        docBreakdown[reqType] = 'AWAITING_REVIEW';
        totalPoints += 70;
      } else {
        docBreakdown[reqType] = 'REJECTED_OR_FAILED';
        totalPoints += 0;
      }
    }

    const score = Math.round(totalPoints / requiredTypes.length);
    const missingDocs = Object.entries(docBreakdown)
      .filter(([_, status]) => status === 'MISSING')
      .map(([type]) => type.replace(/_/g, ' '));

    let explanation = missingDocs.length > 0
      ? `Documentation incomplete: missing ${missingDocs.join(', ')}`
      : 'All mandatory customs and shipping documents present and verified';

    await ComplianceRepository.upsertSignal(
      containerId,
      ComplianceSignalType.DOC_COMPLETENESS,
      score,
      SignalSource.DERIVED,
      explanation,
      { docBreakdown }
    );

    return score;
  }

  public static async recalculateAllDerivedSignals(containerId: string): Promise<void> {
    await Promise.all([
      this.deriveHsCodeNovelty(containerId),
      this.deriveValuationConsistency(containerId),
      this.deriveAeoAcpStatus(containerId),
      this.deriveDocumentCompleteness(containerId)
    ]);
  }
}
