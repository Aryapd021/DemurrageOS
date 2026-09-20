import { prisma } from '../lib/prisma.js';
import { NotificationFactory } from '../modules/notifications/notification.provider.js';
import { logger } from '../common/logging/logger.js';
import { config } from '../config/index.js';

export interface TaskNotificationJobData {
  taskId: string;
  rawToken: string;
  recipientName: string;
  recipientContact: string;
}

export class TaskConfirmationProcessor {
  public static async process(data: TaskNotificationJobData): Promise<void> {
    const { taskId, rawToken, recipientName, recipientContact } = data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { container: true }
    });

    if (!task) {
      logger.error(`Task ${taskId} not found for notification dispatch`, null, { taskId });
      return;
    }

    const confirmationUrl = `${config.env === 'production' ? 'https://app.demurrageos.com' : 'http://localhost:3000'}/external/task-confirmations/${rawToken}`;

    const provider = NotificationFactory.getProvider();
    await provider.sendTaskConfirmation({
      recipientName,
      recipientContact,
      confirmationUrl,
      taskTitle: task.title,
      containerNumber: task.container?.containerNumber || 'N/A'
    });

    logger.info(`Task confirmation dispatched to ${recipientContact} for task ${taskId}`, { taskId });
  }
}
