import { logger } from '../../common/logging/logger.js';
import { config } from '../../config/index.js';

export interface SendTaskNotificationParams {
  recipientName: string;
  recipientContact: string; // phone or email
  confirmationUrl: string;
  taskTitle: string;
  containerNumber: string;
}

export interface NotificationProvider {
  sendTaskConfirmation(params: SendTaskNotificationParams): Promise<boolean>;
}

export class ConsoleNotificationProvider implements NotificationProvider {
  public async sendTaskConfirmation(params: SendTaskNotificationParams): Promise<boolean> {
    logger.info(`[NOTIFICATION - DISPATCH] To: ${params.recipientName} (${params.recipientContact})`, {
      recipient: params.recipientContact,
      container: params.containerNumber,
      url: params.confirmationUrl
    });
    console.log(`\n================== EXTERNAL NOTIFICATION ==================`);
    console.log(`To: ${params.recipientName} <${params.recipientContact}>`);
    console.log(`Subject: Action Required: Schedule Pickup for Container ${params.containerNumber}`);
    console.log(`Link: ${params.confirmationUrl}`);
    console.log(`===========================================================\n`);
    return true;
  }
}

export class NotificationFactory {
  private static instance: NotificationProvider;

  public static getProvider(): NotificationProvider {
    if (!this.instance) {
      // In production, instantiate SMS / Twilio / SendGrid / WhatsApp provider if configured
      this.instance = new ConsoleNotificationProvider();
    }
    return this.instance;
  }
}
