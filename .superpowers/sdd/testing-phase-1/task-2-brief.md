# Task 2: Set Up Test Database Connection & Seed Data

**Files:**
- Create: `packages/backend/src/test-fixtures/db-connection.ts`
- Create: `packages/backend/src/test-fixtures/seed-data.ts`
- Create: `packages/backend/src/test-fixtures/test-utils.ts`

**Interfaces:**
- Produces:
  - `setupTestDatabase(): Promise<Knex>` — returns isolated test DB with schema
  - `teardownTestDatabase(db: Knex): Promise<void>` — cleans up
  - `seedTestData(db: Knex): Promise<TestDataIds>` — returns org/server/app IDs
  - `TestDataIds = { orgId, serverId1, serverId2, serverId3, appId1, appId2, dbId }`
  - `expectEdgeCount(db, count, filters?)` — helper for graph tests
  - `getEdges(db, filters?)` — fetch edge details

**Context:** All integration and repository tests need a clean database. This task creates reusable setup/teardown logic and pre-populated demo data.

**From plan — exact code for 3 files:**

**File 1: db-connection.ts**
```typescript
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
```

**File 2: seed-data.ts** — implement `seedTestData()` that:
- Creates org "test-org"
- Creates 3 servers (test-server-1/2/3)
- Creates 2 apps (test-app-1/2)
- Creates 1 database (test-postgres)
- Returns `TestDataIds` with all IDs

Interface must match exactly:
```typescript
export interface TestDataIds {
  orgId: string;
  serverId1: string;
  serverId2: string;
  serverId3: string;
  appId1: string;
  appId2: string;
  dbId: string;
}

export async function seedTestData(db: Knex): Promise<TestDataIds>
```

**File 3: test-utils.ts** — implement helpers:
```typescript
export async function expectEdgeCount(
  db: Knex,
  count: number,
  filters?: { source_type?: string; relation_type?: string }
): Promise<void>

export async function getEdges(
  db: Knex,
  filters?: { source_id?: string; target_id?: string }
)
```

**Verification:**
- All 3 files created in `packages/backend/src/test-fixtures/`
- Run: `ls -la packages/backend/src/test-fixtures/`
- Expected: `db-connection.ts`, `seed-data.ts`, `test-utils.ts` present

**Commit message:** "test: add test database setup and seed utilities"

**Success criteria:**
- 3 files created with complete implementations
- TypeScript types match interfaces above exactly
- Functions are exported (no default exports)
- Fresh git commit
