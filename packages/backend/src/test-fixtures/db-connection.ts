import type { Knex } from 'knex';
import knex from 'knex';

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'backstage_test';

export async function setupTestDatabase(): Promise<Knex> {
  const testDb = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: TEST_DB_NAME,
    },
    migrations: {
      directory: './src/database/migrations',
    },
  });

  try {
    await testDb.migrate.latest();
    return testDb;
  } catch (error) {
    await testDb.destroy();
    throw error;
  }
}

export async function teardownTestDatabase(db: Knex): Promise<void> {
  await db.destroy();
}

export async function resetTestDatabase(db: Knex): Promise<void> {
  const tables = await db.raw(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'knex_%'`
  );

  const tableNames = tables.rows.map((r: any) => r.tablename);

  for (const table of tableNames) {
    await db.raw(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}
