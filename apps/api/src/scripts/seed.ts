import { dbStore } from '../db/store.ts';
import { chargeCalculationService } from '../domain/financial/ChargeCalculationService.ts';
import { riskEngine } from '../domain/risk/RiskEngine.ts';
import { complianceSignalService } from '../domain/compliance/ComplianceSignalService.ts';
import { externalConfirmationService } from '../modules/tasks/externalConfirmationService.ts';
import { logger } from '../config/logger.ts';

export function seedDatabase() {
  logger.info({}, 'Starting synthetic seed data generation for DemurrageOS');
  dbStore.reset();

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // 1. Organization
  const orgId = 'org-apex';
  dbStore.organizations.set(orgId, {
    id: orgId,
    name: 'Apex Global Freight & Customs House Agency',
    chaLicenseNumber: 'CHA/BOM/2021/8892',
    createdAt: new Date(now - 30 * DAY_MS).toISOString()
  });

  // 2. Clients
  const clientTata = {
    id: 'client-tata',
    organizationId: orgId,
    name: 'Tata Motors Commercial Vehicles',
    iecCode: '0388012345',
    isAeoAcp: true,
    defaultDeliveryMode: 'DPD_DIRECT' as const,
    createdAt: new Date(now - 25 * DAY_MS).toISOString()
  };
  const clientReliance = {
    id: 'client-reliance',
    organizationId: orgId,
    name: 'Reliance Retail Logistics',
    iecCode: '0391098765',
    isAeoAcp: false,
    defaultDeliveryMode: 'CFS' as const,
    createdAt: new Date(now - 20 * DAY_MS).toISOString()
  };
  const clientSunPharma = {
    id: 'client-sunpharma',
    organizationId: orgId,
    name: 'Sun Pharma Advanced Logistics',
    iecCode: '0395045678',
    isAeoAcp: true,
    defaultDeliveryMode: 'DPD_CFS' as const,
    createdAt: new Date(now - 15 * DAY_MS).toISOString()
  };

  dbStore.clients.set(clientTata.id, clientTata);
  dbStore.clients.set(clientReliance.id, clientReliance);
  dbStore.clients.set(clientSunPharma.id, clientSunPharma);

  // 3. Containers
  // Container A: MSKU7890123 (Tata Motors) - DPD_CFS with FALLBACK TRIGGERED (Two-Clock Active)
  const discharged9DaysAgo = new Date(now - 9 * DAY_MS).toISOString();
  const fallback5DaysAgo = new Date(now - 5 * DAY_MS).toISOString();
  const cfsIn5DaysAgoA = new Date(now - 5 * DAY_MS + 2 * 3600 * 1000).toISOString();

  const containerA = {
    id: 'cnt-msku7890123',
    organizationId: orgId,
    clientId: clientTata.id,
    clientName: clientTata.name,
    containerNumber: 'MSKU7890123',
    sizeType: '40HC' as const,
    carrierName: 'MAERSK',
    portOfDischarge: 'INNSA (Nhava Sheva)',
    cfsName: 'Gateway Distriparks CFS',
    deliveryMode: 'DPD_CFS' as const,
    status: 'CFS_STORED' as const,
    dischargedAt: discharged9DaysAgo,
    cfsGateInAt: cfsIn5DaysAgoA,
    freeDaysGrantedCarrier: 5,
    freeDaysGrantedCfs: 3,
    createdAt: discharged9DaysAgo,
    updatedAt: new Date().toISOString()
  };
  dbStore.containers.set(containerA.id, containerA);

  dbStore.addEvent({
    id: 'evt-a-1',
    containerId: containerA.id,
    eventType: 'DISCHARGE',
    eventTimestamp: discharged9DaysAgo,
    location: 'BMCT Terminal, JNPT',
    source: 'PORT_SYSTEM',
    createdAt: discharged9DaysAgo
  });
  dbStore.addEvent({
    id: 'evt-a-2',
    containerId: containerA.id,
    eventType: 'DPD_TO_CFS_FALLBACK',
    eventTimestamp: fallback5DaysAgo,
    location: 'Port Gate 3',
    source: 'PORT_SYSTEM',
    metadata: { reason: 'DPD 48-hour evacuation window expired; terminal auto-shifted container to CFS' },
    createdAt: fallback5DaysAgo
  });
  dbStore.addEvent({
    id: 'evt-a-3',
    containerId: containerA.id,
    eventType: 'CFS_GATE_IN',
    eventTimestamp: cfsIn5DaysAgoA,
    location: 'Gateway Distriparks CFS',
    source: 'CFS_SYSTEM',
    createdAt: cfsIn5DaysAgoA
  });

  const discharged4DaysAgo = new Date(now - 4 * DAY_MS).toISOString();
  const containerB = {
    id: 'cnt-medu4567890',
    organizationId: orgId,
    clientId: clientSunPharma.id,
    clientName: clientSunPharma.name,
    containerNumber: 'MEDU4567890',
    sizeType: '40HC' as const,
    carrierName: 'MSC',
    portOfDischarge: 'INNSA (Nhava Sheva)',
    cfsName: 'Allcargo Logistics CFS',
    deliveryMode: 'DPD_CFS' as const,
    status: 'DISCHARGED' as const,
    dischargedAt: discharged4DaysAgo,
    freeDaysGrantedCarrier: 5,
    freeDaysGrantedCfs: 3,
    createdAt: discharged4DaysAgo,
    updatedAt: new Date().toISOString()
  };
  dbStore.containers.set(containerB.id, containerB);
  dbStore.addEvent({
    id: 'evt-b-1',
    containerId: containerB.id,
    eventType: 'DISCHARGE',
    eventTimestamp: discharged4DaysAgo,
    location: 'GTI Terminal, JNPT',
    source: 'PORT_SYSTEM',
    createdAt: discharged4DaysAgo
  });

  const discharged2DaysAgo = new Date(now - 2 * DAY_MS).toISOString();
  const oocYesterday = new Date(now - 1 * DAY_MS).toISOString();
  const containerC = {
    id: 'cnt-cmau1234567',
    organizationId: orgId,
    clientId: clientTata.id,
    clientName: clientTata.name,
    containerNumber: 'CMAU1234567',
    sizeType: '20GP' as const,
    carrierName: 'CMA CGM',
    portOfDischarge: 'INNSA (Nhava Sheva)',
    deliveryMode: 'DPD_DIRECT' as const,
    status: 'CUSTOMS_CLEARED' as const,
    dischargedAt: discharged2DaysAgo,
    freeDaysGrantedCarrier: 5,
    freeDaysGrantedCfs: 0,
    createdAt: discharged2DaysAgo,
    updatedAt: new Date().toISOString()
  };
  dbStore.containers.set(containerC.id, containerC);
  dbStore.addEvent({
    id: 'evt-c-1',
    containerId: containerC.id,
    eventType: 'DISCHARGE',
    eventTimestamp: discharged2DaysAgo,
    location: 'NSICT Terminal',
    source: 'PORT_SYSTEM',
    createdAt: discharged2DaysAgo
  });
  dbStore.addEvent({
    id: 'evt-c-2',
    containerId: containerC.id,
    eventType: 'CUSTOMS_OUT_OF_CHARGE',
    eventTimestamp: oocYesterday,
    location: 'Customs House, Nhava Sheva',
    source: 'MANUAL',
    createdAt: oocYesterday
  });

  const discharged7DaysAgo = new Date(now - 7 * DAY_MS).toISOString();
  const cfsIn5DaysAgoD = new Date(now - 5 * DAY_MS).toISOString();
  const containerD = {
    id: 'cnt-tcku9876543',
    organizationId: orgId,
    clientId: clientReliance.id,
    clientName: clientReliance.name,
    containerNumber: 'TCKU9876543',
    sizeType: '40HC' as const,
    carrierName: 'MAERSK',
    portOfDischarge: 'INNSA (Nhava Sheva)',
    cfsName: 'Allcargo Logistics CFS',
    deliveryMode: 'CFS' as const,
    status: 'CFS_STORED' as const,
    dischargedAt: discharged7DaysAgo,
    cfsGateInAt: cfsIn5DaysAgoD,
    freeDaysGrantedCarrier: 5,
    freeDaysGrantedCfs: 3,
    createdAt: discharged7DaysAgo,
    updatedAt: new Date().toISOString()
  };
  dbStore.containers.set(containerD.id, containerD);
  dbStore.addEvent({
    id: 'evt-d-1',
    containerId: containerD.id,
    eventType: 'DISCHARGE',
    eventTimestamp: discharged7DaysAgo,
    location: 'BMCT Terminal',
    source: 'PORT_SYSTEM',
    createdAt: discharged7DaysAgo
  });
  dbStore.addEvent({
    id: 'evt-d-2',
    containerId: containerD.id,
    eventType: 'CFS_GATE_IN',
    eventTimestamp: cfsIn5DaysAgoD,
    location: 'Allcargo Logistics CFS',
    source: 'CFS_SYSTEM',
    createdAt: cfsIn5DaysAgoD
  });

  // 4. Tasks
  const task1 = {
    id: 'task-pickup-a',
    containerId: containerA.id,
    containerNumber: containerA.containerNumber,
    clientName: clientTata.name,
    taskType: 'TRUCKER_PICKUP' as const,
    title: 'Urgent Container Evacuation from Gateway Distriparks CFS',
    status: 'ASSIGNED' as const,
    assigneeType: 'EXTERNAL_TRUCKER' as const,
    assigneeName: 'Rajesh Sharma (SpeedLine Transporters)',
    assigneeContact: '+91 98201 54321',
    createdAt: new Date(now - 12 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now - 12 * 3600 * 1000).toISOString()
  };
  dbStore.tasks.set(task1.id, task1);
  externalConfirmationService.generateTokenForTask(task1.id);

  const task2 = {
    id: 'task-pickup-b',
    containerId: containerB.id,
    containerNumber: containerB.containerNumber,
    clientName: clientSunPharma.name,
    taskType: 'TRUCKER_PICKUP' as const,
    title: 'Direct Port Gate-Out & Factory Delivery',
    status: 'PENDING' as const,
    assigneeType: 'EXTERNAL_TRUCKER' as const,
    assigneeName: 'Vikram Singh (Navkar Logistics)',
    assigneeContact: '+91 98190 67890',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  dbStore.tasks.set(task2.id, task2);

  // 5. Staged Documents
  dbStore.documents.set('doc-bl-1', {
    id: 'doc-bl-1',
    containerId: containerA.id,
    documentType: 'BILL_OF_LADING',
    fileName: 'MSKU_BL_7890123_SEAWAY.pdf',
    fileUrl: '/docs/MSKU_BL_7890123_SEAWAY.pdf',
    createdAt: discharged9DaysAgo,
    stagedExtraction: {
      id: 'ext-doc-1',
      documentId: 'doc-bl-1',
      extractedFields: {
        blNumber: 'MSKU-MUM-984321',
        shipper: 'Bosch Automotive Components Stuttgart GmbH',
        consignee: 'Tata Motors Commercial Vehicles Ltd',
        declaredWeightKg: 22400,
        hsCode: '8471.30',
        commodityDescription: 'Automotive Engine Sensors & Microcontrollers'
      },
      confidenceScore: 0.96,
      humanConfirmed: false,
      createdAt: discharged9DaysAgo
    }
  });

  // 6. Recalculate
  for (const container of dbStore.containers.values()) {
    const events = dbStore.getEvents(container.id);
    const docs = Array.from(dbStore.documents.values()).filter(d => d.containerId === container.id);
    
    const chargeBreakdown = chargeCalculationService.calculate({ container, events });
    container.chargeBreakdown = chargeBreakdown;

    const signals = complianceSignalService.evaluateSignals(container, docs.length);
    container.complianceSignals = signals;

    const risk = riskEngine.evaluate({ container, events, complianceSignals: signals });
    container.riskAssessment = risk;

    dbStore.containers.set(container.id, container);
  }

  logger.info({
    organizations: dbStore.organizations.size,
    clients: dbStore.clients.size,
    containers: dbStore.containers.size,
    eventsCount: Array.from(dbStore.events.values()).reduce((sum, ev) => sum + ev.length, 0),
    tasks: dbStore.tasks.size
  }, 'Synthetic seed data loaded successfully');
}
