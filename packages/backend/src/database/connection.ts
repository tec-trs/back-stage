import knexFactory, { type Knex } from 'knex';

import { env } from '../config/env.js';
import { dbQueryDuration } from '../observability/metrics.js';

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: env.databaseUrl,
  pool: {
    min: 2,
    max: 10,
  },
};

export const db: Knex = knexFactory(knexConfig);

interface KnexQueryEvent {
  __knexQueryUid: string;
  method?: string;
}

const queryStartTimes = new Map<string, bigint>();

db.on('query', (query: KnexQueryEvent) => {
  queryStartTimes.set(query.__knexQueryUid, process.hrtime.bigint());
});

function recordQueryDuration(query: KnexQueryEvent): void {
  const startedAt = queryStartTimes.get(query.__knexQueryUid);
  if (startedAt === undefined) {
    return;
  }
  queryStartTimes.delete(query.__knexQueryUid);
  const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
  dbQueryDuration.observe({ operation: query.method ?? 'unknown' }, durationSeconds);
}

db.on('query-response', (_response: unknown, query: KnexQueryEvent) => {
  recordQueryDuration(query);
});

db.on('query-error', (_error: unknown, query: KnexQueryEvent) => {
  recordQueryDuration(query);
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.raw('select 1');
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await db.destroy();
}
