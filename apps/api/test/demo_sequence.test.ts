import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'events';
import { server } from '../src/server.ts';
import { seedDatabase } from '../src/scripts/seed.ts';

// In-memory HTTP request dispatcher that tests the exact server request handler without requiring socket binding
function makeRequest(method: string, path: string, headers: Record<string, string> = {}, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter() as any;
    req.method = method;
    req.url = path;
    req.headers = { ...headers };

    const res = new EventEmitter() as any;
    res.headers = {};
    res.statusCode = 200;
    res.setHeader = (key: string, val: string) => { res.headers[key.toLowerCase()] = val; };
    res.writeHead = (code: number, headers?: any) => {
      res.statusCode = code;
      if (headers) {
        Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      }
    };

    let responseBody = '';
    res.write = (chunk: any) => { responseBody += chunk ? chunk.toString() : ''; };
    res.end = (chunk?: any) => {
      if (chunk) responseBody += chunk.toString();
      try {
        const json = responseBody ? JSON.parse(responseBody) : {};
        resolve({ status: res.statusCode, data: json });
      } catch (e) {
        resolve({ status: res.statusCode, data: responseBody });
      }
    };

    // Invoke server handler
    server.emit('request', req, res);

    if (body) {
      req.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
    }
    req.emit('end');
  });
}

describe('Appendix B Primary Demo Story Integration Test', () => {
  seedDatabase();

  it('Step 1: All Clients Dashboard - fetch clients list for CHA org', async () => {
    const res = await makeRequest('GET', '/api/v1/clients');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.clients.length >= 3, 'Should have at least 3 clients for CHA firm');
    assert(res.data.clients.some((c: any) => c.name.includes('Tata Motors')));
  });

  it('Step 2: Select Client Tata Motors - retrieve client-scoped containers', async () => {
    const res = await makeRequest('GET', '/api/v1/containers?clientId=client-tata');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.containers.every((c: any) => c.clientId === 'client-tata'), 'Must only return Tata Motors containers');
  });

  it('Step 3: Open At-Risk Container MSKU7890123 & inspect DPD/CFS status', async () => {
    const res = await makeRequest('GET', '/api/v1/containers/cnt-msku7890123');
    assert.strictEqual(res.status, 200);
    const container = res.data.container;
    assert.strictEqual(container.containerNumber, 'MSKU7890123');
    assert.strictEqual(container.deliveryMode, 'DPD_CFS');
    assert.strictEqual(container.chargeBreakdown.isTwoClockActive, true);
    assert(container.chargeBreakdown.cfsGroundRent > 0, 'CFS ground rent must be running');
    assert.strictEqual(container.chargeBreakdown.shiftingCharges, 4500, 'Shifting charge audit fee must be 4,500 INR');
  });

  it('Step 4 & 5: Trigger DPD_TO_CFS_FALLBACK on container MEDU4567890 and verify two-clock activation', async () => {
    // Check state before fallback
    const beforeRes = await makeRequest('GET', '/api/v1/containers/cnt-medu4567890');
    assert.strictEqual(beforeRes.data.container.chargeBreakdown.isTwoClockActive, false);
    assert.strictEqual(beforeRes.data.container.chargeBreakdown.cfsGroundRent, 0);

    // Trigger fallback
    const fallbackRes = await makeRequest('POST', '/api/v1/containers/cnt-medu4567890/trigger-fallback');
    assert.strictEqual(fallbackRes.status, 200);
    assert.strictEqual(fallbackRes.data.success, true);

    // Verify two-clock model activated
    const afterRes = await makeRequest('GET', '/api/v1/containers/cnt-medu4567890');
    const container = afterRes.data.container;
    assert.strictEqual(container.chargeBreakdown.isTwoClockActive, true);
    assert.strictEqual(container.chargeBreakdown.shiftingCharges, 4500, 'Terminal shifting charge added');
    assert(container.events.some((e: any) => e.eventType === 'DPD_TO_CFS_FALLBACK'), 'Historical fallback event preserved');
    assert(container.events.some((e: any) => e.eventType === 'CFS_GATE_IN'), 'CFS_GATE_IN event recorded');
  });

  it('Step 6 & 7: Assign pickup task to trucker & generate high-entropy token', async () => {
    const assignRes = await makeRequest('POST', '/api/v1/tasks/assign-external', {
      'content-type': 'application/json'
    }, {
      containerId: 'cnt-medu4567890',
      title: 'Emergency Factory Evacuation',
      assigneeName: 'Mohan Lal (Highway Express)',
      assigneeContact: '+91 98330 12345'
    });

    assert.strictEqual(assignRes.status, 201);
    assert.strictEqual(assignRes.data.success, true);
    assert.strictEqual(assignRes.data.rawToken.length, 64);
    assert(assignRes.data.confirmationUrl.includes(assignRes.data.rawToken));
  });

  it('Step 8 & 9: Confirm from unauthenticated context using single-purpose token', async () => {
    // Create task
    const assignRes = await makeRequest('POST', '/api/v1/tasks/assign-external', {
      'content-type': 'application/json'
    }, {
      containerId: 'cnt-cmau1234567',
      title: 'Direct Port Gate Out Dispatch',
      assigneeName: 'Sunil Verma',
      assigneeContact: '+91 98111 22233'
    });
    const token = assignRes.data.rawToken;

    // Unauthenticated token inspection
    const tokenInspectRes = await makeRequest('GET', `/api/v1/tasks/by-token/${token}`);
    assert.strictEqual(tokenInspectRes.status, 200);
    assert.strictEqual(tokenInspectRes.data.task.assigneeName, 'Sunil Verma');

    // Unauthenticated token confirmation
    const confirmRes = await makeRequest('POST', `/api/v1/tasks/confirm/${token}`);
    assert.strictEqual(confirmRes.status, 200);
    assert.strictEqual(confirmRes.data.success, true);
    assert.strictEqual(confirmRes.data.task.status, 'CONFIRMED');

    // Verify container detail updated with DELIVERY_ORDER_ISSUED event
    const containerRes = await makeRequest('GET', '/api/v1/containers/cnt-cmau1234567');
    assert(containerRes.data.container.events.some((e: any) => e.eventType === 'DELIVERY_ORDER_ISSUED'));
  });
});
