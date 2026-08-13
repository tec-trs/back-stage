import request from 'supertest';

import { createApp } from './app.js';
import { closeDatabaseConnection } from './database/connection.js';

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
