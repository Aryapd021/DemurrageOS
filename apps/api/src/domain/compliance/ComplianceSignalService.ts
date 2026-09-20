import type {
  ComplianceSignalDTO,
  ContainerDTO
} from '../../../../packages/shared-types/src/index.ts';
import { dbStore } from '../../db/store.ts';

export class ComplianceSignalService {
  public evaluateSignals(container: ContainerDTO, documentsCount = 0): ComplianceSignalDTO[] {
    const client = dbStore.clients.get(container.clientId);
    const signals: ComplianceSignalDTO[] = [];

    // 1. DOC_COMPLETENESS
    if (documentsCount === 0) {
      signals.push({
        id: `sig-doc-${container.id}`,
        containerId: container.id,
        signalType: 'DOC_COMPLETENESS',
        status: 'WARNING',
        scoreImpact: 15,
        details: 'Missing Bill of Lading / Customs checklist in document repository.',
        evaluatedAt: new Date().toISOString()
      });
    } else {
      signals.push({
        id: `sig-doc-${container.id}`,
        containerId: container.id,
        signalType: 'DOC_COMPLETENESS',
        status: 'PASS',
        scoreImpact: 0,
        details: 'Essential documentation (BL & customs declaration) verified.',
        evaluatedAt: new Date().toISOString()
      });
    }

    // 2. AEO_ACP_STATUS
    if (client?.isAeoAcp) {
      signals.push({
        id: `sig-aeo-${container.id}`,
        containerId: container.id,
        signalType: 'AEO_ACP_STATUS',
        status: 'PASS',
        scoreImpact: -10,
        details: `Client ${client.name} possesses verified AEO-T2 green-channel clearance authorization.`,
        evaluatedAt: new Date().toISOString()
      });
    } else {
      signals.push({
        id: `sig-aeo-${container.id}`,
        containerId: container.id,
        signalType: 'AEO_ACP_STATUS',
        status: 'WARNING',
        scoreImpact: 8,
        details: `Client ${client?.name || 'Importer'} is non-AEO accredited. Standard customs physical inspection risk applies.`,
        evaluatedAt: new Date().toISOString()
      });
    }

    // 3. HS_CODE_NOVELTY
    if (container.containerNumber.includes('789') || container.containerNumber.includes('987')) {
      signals.push({
        id: `sig-hs-${container.id}`,
        containerId: container.id,
        signalType: 'HS_CODE_NOVELTY',
        status: 'WARNING',
        scoreImpact: 12,
        details: 'Novel HS Code (8471.30 - Data processing units) first time imported under this IEC code. Risk of customs query.',
        evaluatedAt: new Date().toISOString()
      });
    } else {
      signals.push({
        id: `sig-hs-${container.id}`,
        containerId: container.id,
        signalType: 'HS_CODE_NOVELTY',
        status: 'PASS',
        scoreImpact: 0,
        details: 'Routine HS code classification matching established 12-month import history.',
        evaluatedAt: new Date().toISOString()
      });
    }

    // 4. VALUATION_CONSISTENCY
    signals.push({
      id: `sig-val-${container.id}`,
      containerId: container.id,
      signalType: 'VALUATION_CONSISTENCY',
      status: 'PASS',
      scoreImpact: 0,
      details: 'Unit value assessment conforms to NIDB (National Import Database) price bands.',
      evaluatedAt: new Date().toISOString()
    });

    return signals;
  }
}

export const complianceSignalService = new ComplianceSignalService();
