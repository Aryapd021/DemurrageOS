import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/database';
import { Express } from 'express';

describe('API Routes', () => {
  let app: Express;
  let testToken: string;
  let testOrganizationId: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createApp();

    // Create test organization and user
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
      },
    });

    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
      },
    });

    testOrganizationId = org.id;
    testUserId = user.id;
    testToken = `${user.id}|${org.id}`;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
  });

  describe('Health Endpoints', () => {
    it('GET /health should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /ready should return ready', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
    });
  });

  describe('Auth Endpoints', () => {
    it('POST /api/v1/auth/login should return token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email');
    });

    it('GET /api/v1/auth/me should require auth', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/auth/me with token should return user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('test@example.com');
    });
  });

  describe('Client Routes', () => {
    let testClientId: string;

    it('POST /api/v1/clients should create client', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Test Client',
          iecCode: 'IEC123',
          contactEmail: 'client@example.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Test Client');
      testClientId = res.body.data.id;
    });

    it('GET /api/v1/clients should list clients', async () => {
      const res = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/clients/:id should get client', async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testClientId);
    });

    it('PATCH /api/v1/clients/:id should update client', async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Updated Client Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Client Name');
    });
  });
});
