import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { createApp } from './app.js';
import { closeDatabaseConnection, db } from './database/connection.js';
import { signAccessToken } from './shared/auth/jwt.js';
import type { AuthenticatedUser } from './shared/auth/auth.types.js';

const app = createApp();

afterAll(async () => {
  await closeDatabaseConnection();
});

describe('App HTTP layer (integration)', () => {
  it('GET /api/health responde 200 mesmo com o banco indisponivel', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(['ok', 'degraded']).toContain(response.body.status);
  });

  it('inclui o header x-request-id na resposta', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('propaga um x-request-id enviado pelo cliente', async () => {
    const response = await request(app).get('/api/health').set('x-request-id', 'test-request-id');
    expect(response.headers['x-request-id']).toBe('test-request-id');
  });

  it('inclui headers de seguranca do Helmet', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('retorna 404 com corpo padronizado para rota inexistente', async () => {
    const response = await request(app).get('/api/rota-que-nao-existe');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('exige autenticacao para criar um service', async () => {
    const response = await request(app).post('/api/services').send({});
    expect(response.status).toBe(401);
  });

  it('valida o corpo da requisicao de login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ code: '', password: '123' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exige autenticacao para aprovar uma exemption de governance', async () => {
    const response = await request(app).put(
      '/api/governance/exemptions/11111111-1111-1111-1111-111111111111/approve',
    );
    expect(response.status).toBe(401);
  });

  it('resolve /services/search corretamente e nao e capturado por /services/:id', async () => {
    const response = await request(app).get('/api/services/search').query({ q: 'api' });
    // Sem banco disponivel o handler falha com 500 (nao 400 de "uuid invalido"),
    // o que prova que a rota /search foi resolvida e nao /services/:id.
    expect(response.status).not.toBe(400);
  });

  it('serve a documentacao OpenAPI em /api/docs', async () => {
    const response = await request(app).get('/api/docs/');
    expect(response.status).toBe(200);
    expect(response.text.toLowerCase()).toContain('swagger');
  });

  it('rejeita webhook do GitHub com assinatura invalida', async () => {
    const response = await request(app)
      .post('/api/webhooks/github')
      .set('x-hub-signature-256', 'sha256=invalido')
      .send({ deployment_status: { id: 1, state: 'success', environment: 'production' } });
    expect(response.status).toBe(401);
  });

  it('expoe metricas Prometheus em /metrics', async () => {
    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toContain('backstage_http_request_duration_seconds');
  });
});

describe('Integration: Create VIP and Simulate Impact', () => {
  let token: string;
  let organizationId: string;
  let serverId: string;

  beforeAll(async () => {
    // Create test organization
    organizationId = randomUUID();
    const userId = randomUUID();
    serverId = randomUUID();

    // Insert test organization
    await db('organizations').insert({
      id: organizationId,
      slug: `test-vip-${randomUUID().slice(0, 8)}`,
      name: 'Test Organization for VIP',
      plan: 'enterprise',
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Insert test user
    await db('users').insert({
      id: userId,
      email: 'viptest@example.com',
      code: 'viptest',
      full_name: 'VIP Test User',
      is_active: true,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Insert test server
    await db('servers').insert({
      id: serverId,
      hostname: 'test-server-for-vip',
      organization_id: organizationId,
      server_type: 'vm',
      provider: 'on_premise',
      environment: 'production',
      status: 'active',
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create a valid JWT token with organization context
    const user: AuthenticatedUser = {
      id: userId,
      code: 'VIPTEST001',
      email: 'viptest@example.com',
      fullName: 'VIP Test User',
      roles: ['admin'],
      organizationId: organizationId,
      organizationName: 'Test Organization for VIP',
    };
    token = 'Bearer ' + signAccessToken(user);
  });

  afterAll(async () => {
    // Clean up test data
    await db('vip_servers').where({ organization_id: organizationId }).del();
    await db('vips').where({ organization_id: organizationId }).del();
    await db('resource_relationships').where({ organization_id: organizationId }).del();
    await db('servers').where({ organization_id: organizationId }).del();
    await db('users').where({ email: 'viptest@example.com' }).del();
    await db('organizations').where({ id: organizationId }).del();
  });

  it('should create VIP, add servers, and calculate impact', async () => {
    // Create VIP
    const createVipResponse = await request(app)
      .post('/api/vips')
      .set('Authorization', token)
      .send({
        hostname: 'test-vip.example.com',
        displayName: 'Test VIP',
        description: 'Test VIP for integration testing',
        status: 'active',
        criticality: 'high',
      });

    expect(createVipResponse.status).toBe(201);
    const vipId = createVipResponse.body.id;
    expect(vipId).toBeDefined();
    expect(createVipResponse.body.hostname).toBe('test-vip.example.com');

    // Add server to VIP
    const addServerResponse = await request(app)
      .post(`/api/vips/${vipId}/servers`)
      .set('Authorization', token)
      .send({
        serverId: serverId,
        order: 0,
      });

    expect(addServerResponse.status).toBe(201);

    // Get resource graph to verify VIP is there
    const graphResponse = await request(app)
      .get('/api/resource-graph')
      .set('Authorization', token)
      .query({ pageSize: 100 });

    expect(graphResponse.status).toBe(200);
    // Check that VIP exists in the graph
    const vipNode = graphResponse.body.nodes?.find((node: any) => node.id === vipId);
    expect(vipNode).toBeDefined();
    expect(vipNode.resourceType).toBe('vip');

    // Simulate impact
    const impactResponse = await request(app)
      .post('/api/resource-graph/simulate-impact')
      .set('Authorization', token)
      .send({
        resourceType: 'vip',
        resourceId: vipId,
        maxDepth: 10,
      });

    expect(impactResponse.status).toBe(200);
    expect(impactResponse.body.impactedResources).toBeDefined();
    expect(Array.isArray(impactResponse.body.impactedResources)).toBe(true);
  });

  it('should handle VIP deletion and cascade impact', async () => {
    // Create VIP
    const createVipResponse = await request(app)
      .post('/api/vips')
      .set('Authorization', token)
      .send({
        hostname: 'test-vip-delete.example.com',
        displayName: 'Test VIP for Deletion',
        status: 'active',
      });

    expect(createVipResponse.status).toBe(201);
    const vipId = createVipResponse.body.id;

    // Add server to VIP
    const addServerResponse = await request(app)
      .post(`/api/vips/${vipId}/servers`)
      .set('Authorization', token)
      .send({
        serverId: serverId,
      });

    expect(addServerResponse.status).toBe(201);

    // Delete VIP
    const deleteResponse = await request(app)
      .delete(`/api/vips/${vipId}`)
      .set('Authorization', token);

    expect(deleteResponse.status).toBe(204);

    // Verify VIP is not accessible (soft-deleted)
    const getDeletedVipResponse = await request(app)
      .get(`/api/vips/${vipId}`)
      .set('Authorization', token);

    expect(getDeletedVipResponse.status).toBe(404);

    // Verify VIP is not in resource graph
    const graphResponse = await request(app)
      .get('/api/resource-graph')
      .set('Authorization', token)
      .query({ pageSize: 100 });

    expect(graphResponse.status).toBe(200);
    const deletedVipNode = graphResponse.body.nodes?.find(
      (node: any) => node.id === vipId
    );
    expect(deletedVipNode).toBeUndefined();
  });
});
