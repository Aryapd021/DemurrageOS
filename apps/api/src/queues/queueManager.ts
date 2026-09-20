import { logger } from '../config/logger.ts';

export type JobName =
  | 'calculate-container-risk'
  | 'check-expiring-free-time'
  | 'sync-carrier-data'
  | 'daily-reconciliation'
  | 'process-document-extraction'
  | 'send-task-confirmation';

export interface EnqueuedJob {
  id: string;
  name: JobName;
  data: any;
  timestamp: string;
}

export type JobHandler = (data: any) => Promise<void>;

class QueueManager {
  private handlers: Map<JobName, JobHandler[]> = new Map();
  private jobHistory: EnqueuedJob[] = [];

  public registerWorker(jobName: JobName, handler: JobHandler): void {
    const list = this.handlers.get(jobName) || [];
    list.push(handler);
    this.handlers.set(jobName, list);
    logger.debug({ jobName }, `Worker registered for queue job`);
  }

  public async enqueue(jobName: JobName, data: any): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const jobRecord: EnqueuedJob = {
      id: jobId,
      name: jobName,
      data,
      timestamp: new Date().toISOString()
    };
    this.jobHistory.push(jobRecord);

    logger.info({ jobId, jobName, data }, `Job enqueued in BullMQ pipeline`);

    setImmediate(async () => {
      const workers = this.handlers.get(jobName) || [];
      for (const worker of workers) {
        try {
          await worker(data);
        } catch (err: any) {
          logger.error({ jobId, jobName, error: err.message }, `Worker failed processing job`);
        }
      }
    });

    return jobId;
  }

  public getHistory(): EnqueuedJob[] {
    return this.jobHistory;
  }
}

export const queueManager = new QueueManager();
