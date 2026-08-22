# Task 5: Write GraphRepository Tests (Database-Backed)

**Files:**
- Create: `packages/backend/src/modules/resource-graph/infrastructure/graph.repository.test.ts`

**Interfaces:**
- Consumes:
  - `GraphRepository` from `graph.repository.ts`
  - `setupTestDatabase()`, `resetTestDatabase()`, `teardownTestDatabase()` from Task 2
  - `seedTestData()` from Task 2
  - `expectEdgeCount()`, `getEdges()` from Task 2
- Tests: `getEdgesBySourceId()`, `getTransitiveClosure()` (database queries)

**Context:** Repository tests use a real test database to verify SQL queries work. Critical for graph traversal (CTEs).

**From plan — exact test file structure:**

4 test cases:

1. **Test: getEdgesBySourceId returns direct edges**
   - Setup: Insert edge server1 → app1 via resource_relationships
   - Act: Call `repository.getEdgesBySourceId(serverId1, orgId)`
   - Assert: Returns 1 edge, targetId is appId1, relationType is 'hosts'

2. **Test: getTransitiveClosure traverses chain**
   - Setup: server1 → app1 → db1 (chain)
   - Act: Call `repository.getTransitiveClosure(serverId1, orgId)`
   - Assert: Returns closure including dbId (reachable via app1)

3. **Test: excludes soft-deleted relationships**
   - Setup: Insert edge, then soft-delete it (set deleted_at)
   - Act: Call `getEdgesBySourceId()`
   - Assert: Returns 0 edges (soft-deleted filtered out)

4. **Test: handles empty graph**
   - Setup: No edges in DB
   - Act: Call `getEdgesBySourceId(serverId1, orgId)`
   - Assert: Returns empty array

**Exact imports and structure from plan:**
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import { GraphRepository } from './graph.repository';
import { setupTestDatabase, resetTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection';
import { seedTestData } from '../../../test-fixtures/seed-data';
import { expectEdgeCount, getEdges } from '../../../test-fixtures/test-utils';

describe('GraphRepository', () => {
  let db: Knex;
  let repository: GraphRepository;
  let testData: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
    repository = new GraphRepository(db);
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  beforeEach(async () => {
    await resetTestDatabase(db);
    testData = await seedTestData(db);
  });

  // 4 tests here
});
```

**Verification:**
- Run: `cd packages/backend && npm run test -- src/modules/resource-graph/infrastructure/graph.repository.test.ts`
- Expected: Tests run (may fail if DB not available, that's OK)

**Commit message:** "test: add database-backed tests for GraphRepository"

**Note:** Requires test database running (PostgreSQL). Tests verify SQL queries work correctly.

**Success criteria:**
- Test file created with 4 test cases
- beforeAll/afterAll for DB setup/teardown
- beforeEach resets DB state
- Uses seedTestData to populate demo data
- Tests verify CTE queries, soft-delete filtering
- Fresh commit
