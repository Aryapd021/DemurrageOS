import { prisma } from '../../lib/prisma.js';
import { ComplianceSignalType, SignalSource } from '@prisma/client';

export class ComplianceRepository {
  public static async findByContainerId(containerId: string) {
    return prisma.complianceSignal.findMany({
      where: { containerId },
      orderBy: { signalType: 'asc' }
    });
  }

  public static async upsertSignal(
    containerId: string,
    signalType: ComplianceSignalType,
    score: number,
    source: SignalSource,
    reason?: string | null,
    metadata?: any
  ) {
    return prisma.complianceSignal.upsert({
      where: {
        containerId_signalType: {
          containerId,
          signalType
        }
      },
      update: {
        score,
        source,
        reason,
        metadata: metadata ?? undefined,
        updatedAt: new Date()
      },
      create: {
        containerId,
        signalType,
        score,
        source,
        reason,
        metadata: metadata ?? undefined
      }
    });
  }

  public static async findContainerWithClient(containerId: string) {
    return prisma.container.findUnique({
      where: { id: containerId },
      include: {
        client: true,
        documents: true
      }
    });
  }

  public static async findClientHistoricalContainers(clientId: string, hsCode: string, excludeContainerId: string) {
    return prisma.container.findMany({
      where: {
        clientId,
        hsCode,
        id: { not: excludeContainerId }
      },
      select: {
        id: true,
        declaredValue: true,
        dischargeDate: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
