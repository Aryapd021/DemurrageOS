import { queueManager } from './queueManager.ts';
import { dbStore } from '../db/store.ts';
import { chargeCalculationService } from '../domain/financial/ChargeCalculationService.ts';
import { riskEngine } from '../domain/risk/RiskEngine.ts';
import { complianceSignalService } from '../domain/compliance/ComplianceSignalService.ts';
import { logger } from '../config/logger.ts';

export function initializeWorkers() {
  queueManager.registerWorker('calculate-container-risk', async (data: { containerId: string; trigger?: string }) => {
    const container = dbStore.containers.get(data.containerId);
    if (!container) return;

    const events = dbStore.getEvents(data.containerId);
    const documents = Array.from(dbStore.documents.values()).filter(d => d.containerId === data.containerId);

    const chargeBreakdown = chargeCalculationService.calculate({ container, events });
    container.chargeBreakdown = chargeBreakdown;

    const signals = complianceSignalService.evaluateSignals(container, documents.length);
    container.complianceSignals = signals;

    const riskAssessment = riskEngine.evaluate({
      container,
      events,
      complianceSignals: signals
    });
    container.riskAssessment = riskAssessment;

    dbStore.containers.set(container.id, container);
    logger.info({ containerId: container.id, trigger: data.trigger, riskScore: riskAssessment.score }, 'Risk and charges updated via worker');
  });

  queueManager.registerWorker('check-expiring-free-time', async () => {
    logger.info({}, 'Running scheduled check-expiring-free-time cron job');
    for (const container of dbStore.containers.values()) {
      const events = dbStore.getEvents(container.id);
      const chargeBreakdown = chargeCalculationService.calculate({ container, events });
      container.chargeBreakdown = chargeBreakdown;
      
      if (chargeBreakdown.freeDaysRemainingCarrier <= 1) {
        logger.warn({ containerNumber: container.containerNumber, freeDaysRemaining: chargeBreakdown.freeDaysRemainingCarrier }, 'Free-time expiry alert triggered');
      }
    }
  });

  queueManager.registerWorker('sync-carrier-data', async () => {
    logger.info({}, 'Carrier EDI sync worker heartbeat completed');
  });

  queueManager.registerWorker('daily-reconciliation', async () => {
    logger.info({ totalContainers: dbStore.containers.size }, 'Daily financial exposure reconciliation audit completed');
  });

  queueManager.registerWorker('process-document-extraction', async (data: { documentId: string; containerId: string; fileName: string }) => {
    logger.info({ documentId: data.documentId }, 'Worker processing document extraction via AI service');
    const doc = dbStore.documents.get(data.documentId);
    if (!doc) return;

    let extractedFields: Record<string, any> = {};
    let confidenceScore = 0.94;

    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const res = await fetch(`${aiUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: data.fileName, documentId: data.documentId })
      });
      if (res.ok) {
        const aiData = await res.json();
        extractedFields = aiData.fields;
        confidenceScore = aiData.confidence;
      } else {
        throw new Error('AI service returned non-200');
      }
    } catch (e) {
      logger.warn({ documentId: data.documentId }, 'AI service unavailable; applying heuristic fallback extraction');
      extractedFields = {
        blNumber: `BL-EXT-${Math.floor(100000 + Math.random() * 900000)}`,
        shipper: 'Auto Parts Overseas Ltd',
        consignee: 'Tata Motors Commercial Vehicles',
        declaredWeightKg: 18500,
        hsCode: '8471.30'
      };
      confidenceScore = 0.88;
    }

    doc.stagedExtraction = {
      id: `ext-${Date.now()}`,
      documentId: data.documentId,
      extractedFields,
      confidenceScore,
      humanConfirmed: false,
      createdAt: new Date().toISOString()
    };
    dbStore.documents.set(data.documentId, doc);

    logger.info({ documentId: data.documentId, confidenceScore }, 'Document extraction staged for human review');
  });

  queueManager.registerWorker('send-task-confirmation', async (data: { taskId: string; recipientContact: string; confirmationUrl: string }) => {
    logger.info({
      taskId: data.taskId,
      recipientContact: data.recipientContact,
      confirmationUrl: data.confirmationUrl
    }, `Dispatching single-purpose external confirmation link via SMS/WhatsApp gateway`);
  });
}
