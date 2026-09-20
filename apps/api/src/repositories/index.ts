import { prisma } from '../config/database';
import { NotFoundError } from '../common/errors';

export class ClientRepository {
  async findById(id: string, organizationId: string) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client || client.organizationId !== organizationId) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }

  async findByIdForOrganization(id: string, organizationId: string) {
    return prisma.client.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async listByOrganization(organizationId: string, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { organizationId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({
        where: { organizationId },
      }),
    ]);

    return { clients, total };
  }

  async create(organizationId: string, data: any) {
    return prisma.client.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const client = await this.findById(id, organizationId);
    return prisma.client.update({
      where: { id: client.id },
      data,
    });
  }
}

export class ContainerRepository {
  async findById(id: string, organizationId: string) {
    const container = await prisma.container.findUnique({
      where: { id },
      include: {
        client: true,
        carrier: true,
        cfs: true,
        events: { orderBy: { eventTimestamp: 'asc' } },
      },
    });

    if (!container || container.client.organizationId !== organizationId) {
      throw new NotFoundError('Container not found');
    }

    return container;
  }

  async listByClient(clientId: string, organizationId: string, options?: any) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where: {
          clientId,
          client: { organizationId },
        },
        include: {
          client: true,
          events: { take: 1, orderBy: { eventTimestamp: 'desc' } },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.container.count({
        where: {
          clientId,
          client: { organizationId },
        },
      }),
    ]);

    return { containers, total };
  }

  async listByOrganization(organizationId: string, options?: any) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where: {
          client: { organizationId },
        },
        include: {
          client: true,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.container.count({
        where: {
          client: { organizationId },
        },
      }),
    ]);

    return { containers, total };
  }

  async create(clientId: string, organizationId: string, data: any) {
    // Verify client belongs to organization
    await new ClientRepository().findById(clientId, organizationId);

    return prisma.container.create({
      data: {
        clientId,
        ...data,
      },
      include: {
        client: true,
        carrier: true,
        cfs: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const container = await this.findById(id, organizationId);
    return prisma.container.update({
      where: { id },
      data,
      include: {
        client: true,
        carrier: true,
        cfs: true,
      },
    });
  }
}

export class TariffRepository {
  async findById(id: string) {
    return prisma.tariff.findUnique({
      where: { id },
    });
  }

  async findEffectiveForDate(date: Date) {
    return prisma.tariff.findFirst({
      where: {
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async list() {
    return prisma.tariff.findMany({
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async create(data: any) {
    return prisma.tariff.create({
      data,
    });
  }
}

export class ChargeRepository {
  async findById(id: string) {
    return prisma.charge.findUnique({
      where: { id },
    });
  }

  async findByContainer(containerId: string) {
    return prisma.charge.findMany({
      where: { containerId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: any) {
    return prisma.charge.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return prisma.charge.update({
      where: { id },
      data,
    });
  }
}

export class ContainerEventRepository {
  async findByContainer(containerId: string) {
    return prisma.containerEvent.findMany({
      where: { containerId },
      orderBy: { eventTimestamp: 'asc' },
    });
  }

  async findOrCreate(data: any) {
    const existing = await prisma.containerEvent.findFirst({
      where: {
        containerId: data.containerId,
        eventType: data.eventType,
        eventTimestamp: data.eventTimestamp,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.containerEvent.create({
      data,
    });
  }

  async create(data: any) {
    return prisma.containerEvent.create({
      data,
    });
  }
}

export class AlertRepository {
  async findByContainer(containerId: string) {
    return prisma.alert.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDuplicate(containerId: string, alertType: string, severity: string) {
    return prisma.alert.findFirst({
      where: {
        containerId,
        alertType,
        severity,
        status: 'ACTIVE',
      },
    });
  }

  async create(data: any) {
    return prisma.alert.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return prisma.alert.update({
      where: { id },
      data,
    });
  }
}

export class TaskRepository {
  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
    });
  }

  async findByContainer(containerId: string) {
    return prisma.task.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByToken(tokenHash: string) {
    return prisma.task.findFirst({
      where: {
        confirmationTokenHash: tokenHash,
      },
      include: {
        container: true,
      },
    });
  }

  async create(data: any) {
    return prisma.task.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return prisma.task.update({
      where: { id },
      data,
    });
  }
}

export class ComplianceSignalRepository {
  async findByContainer(containerId: string) {
    return prisma.complianceSignal.findMany({
      where: { containerId },
    });
  }

  async create(data: any) {
    return prisma.complianceSignal.create({
      data,
    });
  }
}

export class DocumentRepository {
  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
    });
  }

  async findByContainer(containerId: string) {
    return prisma.document.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return prisma.document.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return prisma.document.update({
      where: { id },
      data,
    });
  }
}

export class AuditLogRepository {
  async create(data: any) {
    return prisma.auditLog.create({
      data,
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
