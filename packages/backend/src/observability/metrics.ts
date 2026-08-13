import client from 'prom-client';

export const metricsRegistry = new client.Registry();

client.collectDefaultMetrics({ register: metricsRegistry, prefix: 'backstage_' });

export const httpRequestDuration = new client.Histogram({
  name: 'backstage_http_request_duration_seconds',
  help: 'Duracao das requisicoes HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const httpRequestsTotal = new client.Counter({
  name: 'backstage_http_requests_total',
  help: 'Total de requisicoes HTTP recebidas',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

export const httpErrorsTotal = new client.Counter({
  name: 'backstage_http_errors_total',
  help: 'Total de respostas HTTP com status >= 500',
  labelNames: ['method', 'route'],
  registers: [metricsRegistry],
});

export const dbQueryDuration = new client.Histogram({
  name: 'backstage_db_query_duration_seconds',
  help: 'Duracao das queries ao banco de dados em segundos',
  labelNames: ['operation'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [metricsRegistry],
});

export const deploymentsTotal = new client.Counter({
  name: 'backstage_deployments_total',
  help: 'Total de deployments processados, por status',
  labelNames: ['status', 'environment'],
  registers: [metricsRegistry],
});
