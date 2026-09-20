import http from 'http';
import url from 'url';
import { dbStore } from './db/store.ts';
import { seedDatabase } from './scripts/seed.ts';
import { initializeWorkers } from './queues/workers.ts';
import { queueManager } from './queues/queueManager.ts';
import { csvIngestionService } from './ingestion/CsvIngestionService.ts';
import { externalConfirmationService } from './modules/tasks/externalConfirmationService.ts';
import { chargeCalculationService } from './domain/financial/ChargeCalculationService.ts';
import { riskEngine } from './domain/risk/RiskEngine.ts';
import { complianceSignalService } from './domain/compliance/ComplianceSignalService.ts';
import { logger } from './config/logger.ts';

// Initialize workers & seed initial state
initializeWorkers();
seedDatabase();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-Id, X-Client-Id');
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({ rawText: body });
      }
    });
    req.on('error', err => reject(err));
  });
}

export const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  const method = req.method || 'GET';

  const orgId = (req.headers['x-organization-id'] as string) || (parsedUrl.query.organizationId as string) || 'org-apex';
  const clientId = (req.headers['x-client-id'] as string) || (parsedUrl.query.clientId as string);

  try {
    if (pathname === '/health' && method === 'GET') {
      sendJson(res, 200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'demurrageos-api',
        version: '1.0.0'
      });
      return;
    }

    if (pathname === '/api/v1/clients' && method === 'GET') {
      const clients = Array.from(dbStore.clients.values()).filter(c => c.organizationId === orgId);
      sendJson(res, 200, { success: true, clients });
      return;
    }

    if (pathname === '/api/v1/containers' && method === 'GET') {
      const clientIds = clientId ? [clientId] : undefined;
      const containers = dbStore.getContainersByScope(orgId, clientIds);
      sendJson(res, 200, { success: true, count: containers.length, containers });
      return;
    }

    if (pathname.startsWith('/api/v1/containers/') && !pathname.includes('trigger-fallback') && !pathname.includes('events') && method === 'GET') {
      const parts = pathname.split('/');
      const id = parts[4];
      const container = dbStore.getContainerById(id);
      if (!container) {
        sendJson(res, 404, { success: false, error: `Container ${id} not found` });
        return;
      }
      const documents = Array.from(dbStore.documents.values()).filter(d => d.containerId === container.id);
      sendJson(res, 200, { success: true, container, documents });
      return;
    }

    if (pathname.startsWith('/api/v1/containers/') && pathname.endsWith('/trigger-fallback') && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[4];
      const container = dbStore.getContainerById(id);
      if (!container) {
        sendJson(res, 404, { success: false, error: 'Container not found' });
        return;
      }

      const fallbackTimestamp = new Date().toISOString();
      const cfsGateInTimestamp = new Date(Date.now() + 1000).toISOString();

      dbStore.addEvent({
        id: `evt-fallback-${Date.now()}`,
        containerId: container.id,
        eventType: 'DPD_TO_CFS_FALLBACK',
        eventTimestamp: fallbackTimestamp,
        location: 'Port Gate Evacuation Terminal',
        source: 'PORT_SYSTEM',
        metadata: { reason: 'DPD window expired (48h limit). Shifted to CFS.' },
        createdAt: fallbackTimestamp
      });

      dbStore.addEvent({
        id: `evt-cfs-in-${Date.now()}`,
        containerId: container.id,
        eventType: 'CFS_GATE_IN',
        eventTimestamp: cfsGateInTimestamp,
        location: container.cfsName || 'Gateway Distriparks CFS',
        source: 'CFS_SYSTEM',
        createdAt: cfsGateInTimestamp
      });

      container.deliveryMode = 'DPD_CFS';
      container.cfsGateInAt = cfsGateInTimestamp;
      container.status = 'CFS_STORED';
      dbStore.containers.set(container.id, container);

      const events = dbStore.getEvents(container.id);
      const newCharges = chargeCalculationService.calculate({ container, events });
      container.chargeBreakdown = newCharges;

      const signals = complianceSignalService.evaluateSignals(container, 1);
      container.complianceSignals = signals;

      const newRisk = riskEngine.evaluate({ container, events, complianceSignals: signals });
      container.riskAssessment = newRisk;

      dbStore.containers.set(container.id, container);

      logger.info({ containerId: container.id, containerNumber: container.containerNumber }, 'DPD Fallback triggered; two-clock model activated');
      sendJson(res, 200, {
        success: true,
        message: 'DPD_TO_CFS_FALLBACK event logged. CFS Ground Rent clock started and Shifting Charge audit fee applied.',
        container: dbStore.getContainerById(container.id)
      });
      return;
    }

    if (pathname.startsWith('/api/v1/containers/') && pathname.endsWith('/events') && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[4];
      const container = dbStore.getContainerById(id);
      if (!container) {
        sendJson(res, 404, { success: false, error: 'Container not found' });
        return;
      }
      const body = await parseBody(req);
      const eventTimestamp = body.eventTimestamp || new Date().toISOString();
      const newEvent = {
        id: `evt-${Date.now()}`,
        containerId: container.id,
        eventType: body.eventType,
        eventTimestamp,
        location: body.location || container.portOfDischarge,
        source: body.source || 'MANUAL',
        metadata: body.metadata,
        createdAt: new Date().toISOString()
      };
      dbStore.addEvent(newEvent);

      await queueManager.enqueue('calculate-container-risk', {
        containerId: container.id,
        trigger: 'EVENT_INGESTION'
      });

      sendJson(res, 201, { success: true, event: newEvent });
      return;
    }

    if (pathname === '/api/v1/ingestion/preview' && method === 'POST') {
      const body = await parseBody(req);
      const csvText = body.csvContent || body.rawText || '';
      const previewReport = csvIngestionService.parseAndValidate(csvText, orgId);
      sendJson(res, 200, { success: true, report: previewReport });
      return;
    }

    if (pathname === '/api/v1/ingestion/confirm' && method === 'POST') {
      const body = await parseBody(req);
      const batchId = body.batchId;
      if (!batchId) {
        sendJson(res, 400, { success: false, error: 'Missing batchId in confirmation payload' });
        return;
      }
      const result = await csvIngestionService.commitBatch(batchId, orgId);
      sendJson(res, 200, { success: true, ...result });
      return;
    }

    if (pathname === '/api/v1/tasks/assign-external' && method === 'POST') {
      const body = await parseBody(req);
      const { containerId, title, assigneeName, assigneeContact } = body;
      const container = dbStore.getContainerById(containerId);
      if (!container) {
        sendJson(res, 404, { success: false, error: 'Container not found' });
        return;
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const task = {
        id: taskId,
        containerId: container.id,
        containerNumber: container.containerNumber,
        clientName: container.clientName,
        taskType: 'TRUCKER_PICKUP' as const,
        title: title || `Transport Pickup for ${container.containerNumber}`,
        status: 'ASSIGNED' as const,
        assigneeType: 'EXTERNAL_TRUCKER' as const,
        assigneeName: assigneeName || 'Assigned Driver',
        assigneeContact: assigneeContact || '+91 99999 00000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbStore.tasks.set(taskId, task);

      const { rawToken, expiresAt } = externalConfirmationService.generateTokenForTask(taskId);
      const confirmationUrl = `http://localhost:3000/tasks/confirm/${rawToken}`;

      await queueManager.enqueue('send-task-confirmation', {
        taskId,
        recipientContact: task.assigneeContact,
        confirmationUrl
      });

      sendJson(res, 201, {
        success: true,
        task,
        confirmationUrl,
        rawToken,
        expiresAt
      });
      return;
    }

    if (pathname.startsWith('/api/v1/tasks/by-token/') && method === 'GET') {
      const rawToken = pathname.split('/')[5];
      const task = Array.from(dbStore.tasks.values()).find(t => t.confirmationToken === rawToken);
      if (!task) {
        sendJson(res, 404, { success: false, error: 'Invalid confirmation token' });
        return;
      }
      const container = dbStore.getContainerById(task.containerId);
      sendJson(res, 200, {
        success: true,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          assigneeName: task.assigneeName,
          confirmedAt: task.confirmedAt,
          tokenExpiresAt: task.tokenExpiresAt
        },
        container: container ? {
          containerNumber: container.containerNumber,
          clientName: container.clientName,
          carrierName: container.carrierName,
          portOfDischarge: container.portOfDischarge,
          deliveryMode: container.deliveryMode,
          cfsName: container.cfsName
        } : null
      });
      return;
    }

    if (pathname.startsWith('/api/v1/tasks/confirm/') && method === 'POST') {
      const rawToken = pathname.split('/')[5];
      try {
        const result = externalConfirmationService.confirmTask(rawToken);
        sendJson(res, 200, result);
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
      }
      return;
    }

    if (pathname === '/api/v1/documents/upload' && method === 'POST') {
      const body = await parseBody(req);
      const { containerId, documentType, fileName } = body;
      const container = dbStore.getContainerById(containerId);
      if (!container) {
        sendJson(res, 404, { success: false, error: 'Container not found' });
        return;
      }

      const docId = `doc-${Date.now()}`;
      const doc = {
        id: docId,
        containerId,
        documentType: documentType || 'BILL_OF_LADING',
        fileName: fileName || 'document.pdf',
        fileUrl: `/uploads/${fileName}`,
        createdAt: new Date().toISOString()
      };
      dbStore.documents.set(docId, doc);

      await queueManager.enqueue('process-document-extraction', {
        documentId: docId,
        containerId,
        fileName: doc.fileName
      });

      sendJson(res, 201, { success: true, document: doc });
      return;
    }

    if (pathname.startsWith('/api/v1/documents/') && pathname.endsWith('/confirm-extraction') && method === 'POST') {
      const parts = pathname.split('/');
      const docId = parts[4];
      const doc = dbStore.documents.get(docId);
      if (!doc || !doc.stagedExtraction) {
        sendJson(res, 404, { success: false, error: 'Document or staged extraction not found' });
        return;
      }

      doc.stagedExtraction.humanConfirmed = true;
      dbStore.documents.set(docId, doc);

      await queueManager.enqueue('calculate-container-risk', {
        containerId: doc.containerId,
        trigger: 'DOCUMENT_CONFIRMED'
      });

      sendJson(res, 200, {
        success: true,
        message: 'Document extraction verified and accepted into authoritative record.',
        document: doc
      });
      return;
    }

    if (pathname === '/api/v1/analytics/exposure-summary' && method === 'GET') {
      const clientIds = clientId ? [clientId] : undefined;
      const containers = dbStore.getContainersByScope(orgId, clientIds);

      let totalCurrentExposure = 0;
      let totalProjectedExposure = 0;
      let totalCarrierDemurrage = 0;
      let totalCfsGroundRent = 0;
      let totalShiftingCharges = 0;
      let atRiskCount = 0;

      for (const c of containers) {
        if (c.chargeBreakdown) {
          totalCurrentExposure += c.chargeBreakdown.currentExposure;
          totalProjectedExposure += c.chargeBreakdown.projectedExposure;
          totalCarrierDemurrage += c.chargeBreakdown.carrierDemurrage;
          totalCfsGroundRent += c.chargeBreakdown.cfsGroundRent;
          totalShiftingCharges += c.chargeBreakdown.shiftingCharges;
        }
        if (c.riskAssessment && (c.riskAssessment.urgency === 'HIGH' || c.riskAssessment.urgency === 'CRITICAL')) {
          atRiskCount++;
        }
      }

      sendJson(res, 200, {
        success: true,
        summary: {
          currency: 'INR',
          totalContainers: containers.length,
          atRiskCount,
          totalCurrentExposure,
          totalProjectedExposure,
          totalCarrierDemurrage,
          totalCfsGroundRent,
          totalShiftingCharges
        }
      });
      return;
    }

    if (pathname === '/api/v1/queues/history' && method === 'GET') {
      sendJson(res, 200, {
        success: true,
        history: queueManager.getHistory(),
        audits: dbStore.auditLogs
      });
      return;
    }

    sendJson(res, 404, { success: false, error: `Endpoint ${method} ${pathname} not found` });
  } catch (err: any) {
    logger.error({ error: err.message, stack: err.stack }, 'Unhandled error in API server');
    sendJson(res, 500, { success: false, error: err.message });
  }
});

const isMainModule = process.argv[1] && process.argv[1].endsWith('server.ts');
if (isMainModule) {
  server.listen(PORT, () => {
    logger.info({ port: PORT }, `DemurrageOS Express API Server running at http://localhost:${PORT}`);
  });
}
