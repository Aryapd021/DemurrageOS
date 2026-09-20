import type {
  ContainerDTO,
  ContainerEventDTO,
  DeliveryMode,
  IngestionPreviewRow,
  IngestionStagingReportDTO
} from '../../../../packages/shared-types/src/index.ts';
import { dbStore } from '../db/store.ts';
import { queueManager } from '../queues/queueManager.ts';
import { logger } from '../config/logger.ts';

export class CsvIngestionService {
  private stagingBatches: Map<string, IngestionStagingReportDTO> = new Map();

  public parseAndValidate(csvText: string, organizationId: string): IngestionStagingReportDTO {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
      const emptyReport: IngestionStagingReportDTO = {
        batchId,
        totalRows: 0,
        validRows: 0,
        warningRows: 0,
        errorRows: 0,
        rows: []
      };
      this.stagingBatches.set(batchId, emptyReport);
      return emptyReport;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const containerIdx = headers.indexOf('container_number');
    const clientIdx = headers.includes('client_id') ? headers.indexOf('client_id') : headers.indexOf('client_name');
    const deliveryModeIdx = headers.indexOf('delivery_mode');
    const carrierIdx = headers.indexOf('carrier_name');
    const portIdx = headers.indexOf('port_of_discharge');
    const sizeIdx = headers.indexOf('size_type');

    const previewRows: IngestionPreviewRow[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    const existingClients = Array.from(dbStore.clients.values()).filter(c => c.organizationId === organizationId);

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(col => col.trim());
      const containerNumber = (containerIdx >= 0 ? row[containerIdx] : '') || `CONT${i}`;
      const clientIdentifier = (clientIdx >= 0 ? row[clientIdx] : '') || 'Default Client';
      let rawDeliveryMode = (deliveryModeIdx >= 0 ? row[deliveryModeIdx] : '').toUpperCase();
      const carrierName = (carrierIdx >= 0 ? row[carrierIdx] : '') || 'MAERSK';
      const portOfDischarge = (portIdx >= 0 ? row[portIdx] : '') || 'INNSA (Nhava Sheva)';
      const sizeType = (sizeIdx >= 0 ? row[sizeIdx] : '') || '40HC';

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!containerNumber || containerNumber.trim().length < 4) {
        errors.push('Missing container number.');
      } else if (!/^[A-Z]{4}\d{7}$/.test(containerNumber)) {
        warnings.push(`Container number '${containerNumber}' does not strictly match ISO 6346 format.`);
      }

      let resolvedClient = existingClients.find(
        c => c.id === clientIdentifier || c.name.toLowerCase() === clientIdentifier.toLowerCase()
      );

      if (!resolvedClient) {
        warnings.push(`Client '${clientIdentifier}' not found in registry. Will be auto-created on confirmation.`);
      }

      let deliveryMode: DeliveryMode = 'CFS';
      if (!rawDeliveryMode) {
        deliveryMode = 'CFS';
        warnings.push("Delivery mode blank: defaulting conservatively to 'CFS' to avoid understating demurrage risk.");
      } else if (['DPD_DIRECT', 'DPD_CFS', 'CFS'].includes(rawDeliveryMode)) {
        deliveryMode = rawDeliveryMode as DeliveryMode;
      } else {
        deliveryMode = 'CFS';
        warnings.push(`Unrecognized delivery mode '${rawDeliveryMode}': defaulting conservatively to 'CFS'.`);
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
        if (warnings.length > 0) warningCount++;
      } else {
        errorCount++;
      }

      previewRows.push({
        rowNumber: i,
        containerNumber,
        clientIdentifier,
        resolvedClientId: resolvedClient?.id,
        deliveryMode,
        carrierName,
        portOfDischarge,
        sizeType,
        errors,
        warnings,
        isValid
      });
    }

    const report: IngestionStagingReportDTO = {
      batchId,
      totalRows: lines.length - 1,
      validRows: validCount,
      warningRows: warningCount,
      errorRows: errorCount,
      rows: previewRows
    };

    this.stagingBatches.set(batchId, report);
    logger.info({ batchId, totalRows: report.totalRows, validRows: validCount, errorRows: errorCount }, 'CSV ingestion staging preview generated');
    return report;
  }

  public async commitBatch(batchId: string, organizationId: string): Promise<{ createdCount: number }> {
    const report = this.stagingBatches.get(batchId);
    if (!report) {
      throw new Error(`Staging batch ${batchId} not found or expired.`);
    }

    let createdCount = 0;
    const validRows = report.rows.filter(r => r.isValid);

    for (const row of validRows) {
      let clientId = row.resolvedClientId;
      if (!clientId) {
        const newClient = {
          id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organizationId,
          name: row.clientIdentifier,
          iecCode: `03${Math.floor(10000000 + Math.random() * 90000000)}`,
          isAeoAcp: false,
          defaultDeliveryMode: row.deliveryMode,
          createdAt: new Date().toISOString()
        };
        dbStore.clients.set(newClient.id, newClient);
        clientId = newClient.id;
      }

      const containerId = `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const container: ContainerDTO = {
        id: containerId,
        organizationId,
        clientId,
        clientName: row.clientIdentifier,
        containerNumber: row.containerNumber,
        sizeType: (row.sizeType as any) || '40HC',
        carrierName: row.carrierName,
        portOfDischarge: row.portOfDischarge,
        deliveryMode: row.deliveryMode,
        status: 'DISCHARGED',
        dischargedAt: new Date().toISOString(),
        freeDaysGrantedCarrier: 5,
        freeDaysGrantedCfs: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dbStore.containers.set(containerId, container);

      const dischargeEvent: ContainerEventDTO = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        containerId,
        eventType: 'DISCHARGE',
        eventTimestamp: new Date().toISOString(),
        location: row.portOfDischarge,
        source: 'CSV_IMPORT',
        createdAt: new Date().toISOString()
      };
      dbStore.addEvent(dischargeEvent);

      await queueManager.enqueue('calculate-container-risk', {
        containerId,
        organizationId,
        trigger: 'CSV_INGESTION'
      });

      createdCount++;
    }

    dbStore.recordAudit({
      organizationId,
      action: 'CSV_BATCH_COMMITTED',
      entityType: 'CONTAINER',
      entityId: batchId,
      actor: 'CHA_OPERATOR',
      payload: { batchId, createdCount }
    });

    this.stagingBatches.delete(batchId);
    return { createdCount };
  }
}

export const csvIngestionService = new CsvIngestionService();
