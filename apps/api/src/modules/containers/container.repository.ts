import { prisma } from '../../lib/prisma.js';
import { DeliveryMode, ContainerStatus } from '@prisma/client';

export class ContainerRepository {
  public static async findContainers(organizationId: string, allowedClientIds?: string[]) {
    const whereClause: any = { organizationId };
    if (allowedClientIds && allowedClientIds.length > 0) {
      whereClause.clientId = { in: allowedClientIds };
    }

    return prisma.container.findMany({
      where: whereClause,
      include: {
        client: true,
        complianceSignals: true,
        charges: true,
        documents: true,
        tasks: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async findById(id: string) {
    return prisma.container.findUnique({
      where: { id },
      include: {
        client: true,
        cfs: true,
        complianceSignals: true,
        charges: true,
        documents: {
          include: {
            provenanceRecords: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        tasks: true,
        events: {
          orderBy: { timestamp: 'desc' }
        },
        alerts: {
          where: { isRead: false }
        }
      }
    });
  }

  public static async createContainer(data: any) {
    return prisma.container.create({
      data,
      include: { client: true }
    });
  }

  public static async updateContainer(id: string, data: any) {
    return prisma.container.update({
      where: { id },
      data,
      include: { client: true }
    });
  }

  public static async recordEvent(data: {
    containerId: string;
    eventType: string;
    location?: string | null;
    source?: string;
    metadata?: any;
    timestamp?: Date;
  }) {
    return prisma.containerEvent.create({
      data: {
        containerId: data.containerId,
        eventType: data.eventType,
        location: data.location,
        source: data.source || 'SYSTEM',
        metadata: data.metadata,
        timestamp: data.timestamp || new Date()
      }
    });
  }
}
