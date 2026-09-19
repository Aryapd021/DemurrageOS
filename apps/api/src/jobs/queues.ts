import { Queue, Worker } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { ChargeCalculationService } from '../services/financial/charge-calculation';
import { RiskEngine, ComplianceSignalService } from '../services/risk/risk-engine';
import { AlertService } from '../services/alert/alert-service';

let queues: Record<string, Queue> = {};

export async function initializeQueues() {
  const redis = await getRedis();

  // Create queues
  const calculateChargesQueue = new Queue('calculate-charges', { connection: redis });
  const calculateRiskQueue = new Queue('calculate-risk', { connection: redis });
  const deriveSignalsQueue = new Queue('derive-signals', { connection: redis });
  const checkAlertsQueue = new Queue('check-alerts', { connection: redis });
  const processDocumentExtractionQueue = new Queue('process-document-extraction', { connection: redis });
  const sendNotificationQueue = new Queue('send-notification', { connection: redis });

  queues = {
    'calculate-charges': calculateChargesQueue,
    'calculate-risk': calculateRiskQueue,
    'derive-signals': deriveSignalsQueue,
    'check-alerts': checkAlertsQueue,
    'process-document-extraction': processDocumentExtractionQueue,
    'send-notification': sendNotificationQueue,
  };

  logger.info('Queues initialized');

  return queues;
}

export function getQueue(name: string): Queue | undefined {
  return queues[name];
}

export async function closeQueues() {
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
}

// ============================================================================
// Workers
// ============================================================================

export async function startWorkers() {
  const redis = await getRedis();

  // Calculate charges worker
  const chargesWorker = new Worker(
    'calculate-charges',
    async (job) => {
      logger.info({ jobId: job.id, containerId: job.data.containerId }, 'Processing charges calculation');

      try {
        const service = new ChargeCalculationService();
        const charges = await service.recalculateForContainer(job.data.containerId);
        return { success: true, chargesCount: charges.length };
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Charges calculation failed');
        throw error;
      }
    },
    { connection: redis }
  );

  // Calculate risk worker
  const riskWorker = new Worker(
    'calculate-risk',
    async (job) => {
      logger.info({ jobId: job.id, containerId: job.data.containerId }, 'Processing risk calculation');

      try {
        const engine = new RiskEngine();
        const risk = await engine.recalculateForContainer(job.data.containerId);
        return { success: true, riskLevel: risk.level };
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Risk calculation failed');
        throw error;
      }
    },
    { connection: redis }
  );

  // Derive signals worker
  const signalsWorker = new Worker(
    'derive-signals',
    async (job) => {
      logger.info({ jobId: job.id, containerId: job.data.containerId }, 'Deriving compliance signals');

      try {
        const service = new ComplianceSignalService();
        await service.deriveHistoricalSignals(job.data.containerId);
        return { success: true };
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Signal derivation failed');
        throw error;
      }
    },
    { connection: redis }
  );

  // Check alerts worker
  const alertsWorker = new Worker(
    'check-alerts',
    async (job) => {
      logger.info({ jobId: job.id, containerId: job.data.containerId }, 'Checking alerts');

      try {
        const container = await prisma.container.findUnique({
          where: { id: job.data.containerId },
          include: { charges: true },
        });

        if (!container) {
          throw new Error('Container not found');
        }

        const alertService = new AlertService();
        const charges = container.charges;

        // Check for financial exposure
        const totalExposure = charges.reduce((sum, c) => sum + c.amount.toNumber(), 0);
        if (totalExposure > 50000) {
          await alertService.createOrUpdateAlert(
            job.data.containerId,
            'FINANCIAL_EXPOSURE',
            'HIGH',
            `High financial exposure: ${totalExposure}`
          );
        }

        return { success: true };
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Alert check failed');
        throw error;
      }
    },
    { connection: redis }
  );

  chargesWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Charges calculation completed');
  });

  chargesWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Charges calculation failed');
  });

  riskWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Risk calculation completed');
  });

  riskWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Risk calculation failed');
  });

  logger.info('Workers started');

  return { chargesWorker, riskWorker, signalsWorker, alertsWorker };
}
