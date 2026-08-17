import type { Knex } from 'knex';

import { logger } from '../../../config/logger.js';

const TABLE = 'urls';
const TIMEOUT_MS = 10_000;
const INTERVAL_MS = 5 * 60 * 1_000;

interface UrlRow {
  id: string;
  url: string;
}

async function checkUrl(url: string): Promise<'ok' | 'error' | 'timeout'> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    return response.ok ? 'ok' : 'error';
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'timeout';
    return 'error';
  } finally {
    clearTimeout(timer);
  }
}

export async function runHealthchecks(db: Knex): Promise<void> {
  const urls: UrlRow[] = await db(TABLE)
    .whereNull('deleted_at')
    .where('healthcheck_enabled', true)
    .select('id', 'url');

  if (urls.length === 0) return;

  logger.info(`Healthcheck: verificando ${urls.length} URLs`);

  await Promise.allSettled(
    urls.map(async (row) => {
      const status = await checkUrl(row.url);
      await db(TABLE).where('id', row.id).update({
        last_check_status: status,
        last_checked_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    }),
  );

  logger.info('Healthcheck: concluido');
}

export function startHealthcheckWorker(db: Knex): NodeJS.Timeout {
  logger.info(`Healthcheck worker iniciado (intervalo: ${INTERVAL_MS / 1000}s)`);
  return setInterval(() => {
    runHealthchecks(db).catch((err) => {
      logger.error('Healthcheck worker: erro na execucao', { err });
    });
  }, INTERVAL_MS);
}
