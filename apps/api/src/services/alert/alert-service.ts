import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export class AlertService {
  /**
   * Create or update alert with deduplication logic
   */
  async createOrUpdateAlert(
    containerId: string,
    alertType: string,
    severity: string,
    message: string
  ) {
    // Check for existing active alert with same type and severity
    const existing = await prisma.alert.findFirst({
      where: {
        containerId,
        alertType,
        severity,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      logger.debug({ alertId: existing.id }, 'Alert already exists');
      return existing;
    }

    const alert = await prisma.alert.create({
      data: {
        containerId,
        alertType,
        severity,
        message,
      },
    });

    logger.info({ alertId: alert.id, containerId, alertType }, 'Alert created');
    return alert;
  }

  async resolveAlert(alertId: string) {
    return prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
  }

  async escalateAlert(alertId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    const severityMap: Record<string, string> = {
      LOW: 'MEDIUM',
      MEDIUM: 'HIGH',
      HIGH: 'CRITICAL',
      CRITICAL: 'CRITICAL',
    };

    return prisma.alert.update({
      where: { id: alertId },
      data: {
        severity: severityMap[alert.severity],
      },
    });
  }
}
