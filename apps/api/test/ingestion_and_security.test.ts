import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { csvIngestionService } from '../src/ingestion/CsvIngestionService.ts';
import { externalConfirmationService } from '../src/modules/tasks/externalConfirmationService.ts';
import { dbStore } from '../src/db/store.ts';
import { seedDatabase } from '../src/scripts/seed.ts';

describe('CSV Ingestion & External Task Security Tests', () => {
  beforeEach(() => {
    seedDatabase();
  });

  describe('CSV Ingestion Pipeline (Platform Plan §2)', () => {
    it('defaults blank delivery_mode conservatively to CFS to prevent understating risk', () => {
      const csv = `container_number,client_name,delivery_mode,carrier_name,port_of_discharge
MSKU5551234,Tata Motors Commercial Vehicles,,MAERSK,INNSA (Nhava Sheva)
MSKU5555678,Tata Motors Commercial Vehicles,DPD_DIRECT,MAERSK,INNSA (Nhava Sheva)`;

      const report = csvIngestionService.parseAndValidate(csv, 'org-apex');
      assert.strictEqual(report.totalRows, 2);
      assert.strictEqual(report.validRows, 2);

      const row1 = report.rows[0];
      assert.strictEqual(row1.deliveryMode, 'CFS');
      assert(row1.warnings.some(w => w.includes("defaulting conservatively to 'CFS'")));

      const row2 = report.rows[1];
      assert.strictEqual(row2.deliveryMode, 'DPD_DIRECT');
    });

    it('atomically commits staging batch to database and creates containers with events', async () => {
      const csv = `container_number,client_name,delivery_mode,carrier_name,port_of_discharge
MSKU9990001,Tata Motors Commercial Vehicles,CFS,MAERSK,INNSA (Nhava Sheva)`;

      const report = csvIngestionService.parseAndValidate(csv, 'org-apex');
      const commitResult = await csvIngestionService.commitBatch(report.batchId, 'org-apex');
      assert.strictEqual(commitResult.createdCount, 1);

      const created = Array.from(dbStore.containers.values()).find(c => c.containerNumber === 'MSKU9990001');
      assert(created, 'Container should exist in database store');
      assert.strictEqual(created?.deliveryMode, 'CFS');

      const events = dbStore.getEvents(created!.id);
      assert(events.length > 0, 'Discharge event should be created');
      assert.strictEqual(events[0].eventType, 'DISCHARGE');
    });
  });

  describe('External Token Security & Unauthenticated Confirmation (Platform Plan §7)', () => {
    it('generates a 64-character high-entropy hex token with 72h expiry', () => {
      const task = Array.from(dbStore.tasks.values())[0];
      const { rawToken, expiresAt } = externalConfirmationService.generateTokenForTask(task.id);

      assert.strictEqual(rawToken.length, 64, 'Token must be 64-character high-entropy hex string');
      assert(new Date(expiresAt).getTime() > Date.now() + 71 * 60 * 60 * 1000, 'Expiry must be 72 hours');
    });

    it('confirms task via unauthenticated endpoint and maintains idempotency', () => {
      const task = Array.from(dbStore.tasks.values())[0];
      const { rawToken } = externalConfirmationService.generateTokenForTask(task.id);

      // First confirmation
      const res1 = externalConfirmationService.confirmTask(rawToken);
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.task.status, 'CONFIRMED');

      const updatedTask = dbStore.tasks.get(task.id);
      assert.strictEqual(updatedTask?.status, 'CONFIRMED');
      assert(updatedTask?.confirmedAt);

      // Idempotency check: second confirmation returns success without duplicating
      const res2 = externalConfirmationService.confirmTask(rawToken);
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.task.confirmedAt, res1.task.confirmedAt);
    });

    it('rejects invalid token', () => {
      assert.throws(() => {
        externalConfirmationService.confirmTask('invalid_guessable_token_123');
      }, /Invalid or non-existent confirmation link/);
    });
  });
});
