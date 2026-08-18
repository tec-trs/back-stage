import 'dotenv/config';

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  redisUrl: string;
  kafkaBrokers: string[];
  logLevel: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  githubWebhookSecret: string;
  gitlabWebhookSecret: string;
}

function requireEnv(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value.length === 0) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

function parseNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Variavel de ambiente ${name} deve ser numerica, recebido: ${raw}`);
  }
  return parsed;
}

function parseNodeEnv(): EnvConfig['nodeEnv'] {
  const raw = process.env.NODE_ENV ?? 'development';
  if (raw === 'development' || raw === 'production' || raw === 'test') {
    return raw;
  }
  throw new Error(`NODE_ENV invalido: ${raw}`);
}

const DEV_INSECURE_JWT_SECRET = 'dev-insecure-secret-change-me';
const DEV_INSECURE_GITHUB_WEBHOOK_SECRET = 'dev-insecure-github-webhook-secret';
const DEV_INSECURE_GITLAB_WEBHOOK_SECRET = 'dev-insecure-gitlab-webhook-secret';

export const env: EnvConfig = {
  nodeEnv: parseNodeEnv(),
  port: parseNumber('PORT', 4000),
  databaseUrl: requireEnv(
    'DATABASE_URL',
    'postgres://backstage:backstage@localhost:5432/backstage',
  ),
  redisUrl: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  kafkaBrokers: requireEnv('KAFKA_BROKERS', 'localhost:29092').split(','),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  rateLimitWindowMs: parseNumber('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: parseNumber('RATE_LIMIT_MAX', 500),
  jwtSecret: requireEnv('JWT_SECRET', DEV_INSECURE_JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  githubWebhookSecret: requireEnv('GITHUB_WEBHOOK_SECRET', DEV_INSECURE_GITHUB_WEBHOOK_SECRET),
  gitlabWebhookSecret: requireEnv('GITLAB_WEBHOOK_SECRET', DEV_INSECURE_GITLAB_WEBHOOK_SECRET),
};

if (env.nodeEnv === 'production') {
  if (env.jwtSecret === DEV_INSECURE_JWT_SECRET) {
    throw new Error('JWT_SECRET deve ser definido explicitamente em producao');
  }
  if (env.githubWebhookSecret === DEV_INSECURE_GITHUB_WEBHOOK_SECRET) {
    throw new Error('GITHUB_WEBHOOK_SECRET deve ser definido explicitamente em producao');
  }
  if (env.gitlabWebhookSecret === DEV_INSECURE_GITLAB_WEBHOOK_SECRET) {
    throw new Error('GITLAB_WEBHOOK_SECRET deve ser definido explicitamente em producao');
  }
}
