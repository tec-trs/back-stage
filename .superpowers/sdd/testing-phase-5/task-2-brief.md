# Task 2 Brief: Catalog Integration Tests — Part 1

**Phase:** 5  
**Module:** Catalog (Backend Service)  
**Type:** Integration Tests (database + service)  
**Target Tests:** 3 passing  
**Timeline:** 1 day

---

## What You're Building

**File to create:**  
`packages/backend/src/modules/catalog/application/catalog-entity.service.integration.test.ts`

**3 Integration Tests (Vitest + PostgreSQL):**
1. Lists catalog entities with pagination
2. Filters entities by multiple attributes
3. Preserves custom metadata during CRUD operations

**Framework:** Vitest (same as Phase 4)  
**Database:** PostgreSQL 16 (Phase 1 fixtures)  
**Pattern:** Follow Phase 4 integration test structure (search, URLs)

---

## Test Specifications

### Test 1: Lists catalog entities with pagination
```typescript
test('lists catalog entities with pagination', async () => {
  // Setup: Create 5 test entities (server, app, database, url, vip)
  //        All in same organization via orgContext
  // Act: Call catalogService.list(filters, pagination)
  // Assert: Returns paginated results with correct metadata
});
```

**Intent:** Verify list operation returns paginated catalog entities with correct structure.

**Setup:**
- Organization: Create unique org (orgContext isolation)
- Entities: Seed 5 entities (kinds: server, application, database, url, vip)
  - Each with: id, kind, type, name, namespace, lifecycle, metadata
- Pagination: Request page 1, pageSize 5

**Act:**
- Call `catalogService.list({ kind: 'server' }, { page: 1, pageSize: 5 })`

**Assert:**
- Result has items array (CatalogEntityDto[])
- Result has pagination: { page: 1, pageSize: 5, total: X }
- Each item has correct properties: id, kind, type, name, etc.
- Items are organization-isolated (only org's entities returned)

**Notes:**
- Seeds one of each entity type to test diverse catalog
- Pagination validates page boundaries work correctly
- Organization isolation ensures multi-tenant safety

---

### Test 2: Filters entities by multiple attributes
```typescript
test('filters entities by multiple attributes', async () => {
  // Setup: Create 10 mixed entities (different kinds, types, lifecycles)
  // Act: Filter by kind='application' AND lifecycle='active'
  // Assert: Returns only matching entities (subset of 10)
});
```

**Intent:** Verify filters correctly narrow results by multiple criteria.

**Setup:**
- Organization: Unique org for test
- Entities: Seed 10 diverse entities:
  - 5 servers (2 active, 3 deprecated)
  - 3 applications (2 active, 1 experimental)
  - 2 databases (all active)

**Act:**
- Call `catalogService.list(
    { kind: 'application', lifecycle: 'active' },
    { page: 1, pageSize: 100 }
  )`

**Assert:**
- Result.items.length === 2 (only active applications)
- All items have kind === 'application'
- All items have lifecycle === 'active'
- Servers and databases are NOT in results

**Notes:**
- Tests AND logic (multiple filters apply together)
- Validates filter correctness at database level
- Ensures query doesn't return false positives

---

### Test 3: Preserves custom metadata during CRUD operations
```typescript
test('preserves custom metadata during CRUD operations', async () => {
  // Setup: Create entity with custom metadata
  //        { owner: 'team-a', tier: 'premium', tags: ['prod', 'critical'] }
  // Act: Retrieve entity by ID
  // Assert: Metadata preserved exactly as stored
});
```

**Intent:** Verify metadata field persists through database round-trip without corruption.

**Setup:**
- Organization: Unique org
- Entity: Create single catalog entity with:
  ```json
  {
    "kind": "application",
    "type": "api",
    "name": "payment-svc",
    "namespace": "production",
    "metadata": {
      "owner": "team-payments",
      "tier": "premium",
      "tags": ["prod", "critical", "pci-compliant"],
      "slo": { "uptime": "99.99%", "latency_p99": "100ms" },
      "dependencies": ["postgres-main", "redis-cache"]
    }
  }
  ```

**Act:**
- Call `catalogService.getById(entityId)`

**Assert:**
- Returned entity.metadata matches original exactly
- Nested objects preserved: { slo: {...}, dependencies: [...] }
- No JSON serialization corruption
- Date fields (createdAt, updatedAt) are valid Date objects

**Notes:**
- Tests metadata is stored as JSON and retrieved correctly
- Validates complex nested structures survive storage
- Important for extensibility (custom fields per org)

---

## Implementation Steps

1. **Create test file** `catalog-entity.service.integration.test.ts` with `describe` block
2. **Implement Test 1** — list with pagination
   - Run: `npm run test -- catalog-entity.service.integration.test.ts --grep "lists catalog"`
   - Expected: PASS
3. **Implement Test 2** — filter by multiple attributes
   - Run: `npm run test -- catalog-entity.service.integration.test.ts --grep "filters entities"`
   - Expected: PASS
4. **Implement Test 3** — metadata preservation
   - Run: `npm run test -- catalog-entity.service.integration.test.ts --grep "preserves metadata"`
   - Expected: PASS
5. **Run all 3 tests:** `npm run test -- catalog-entity.service.integration.test.ts`
   - Expected: 3/3 passing
6. **Verify no console errors** (Vitest captures these)
7. **Commit** with message: `test: add catalog integration tests (3 tests)`

---

## Test Setup & Fixtures

### Database Fixtures (Reuse from Phase 1/4)
```typescript
import {
  setupTestDatabase,
  resetTestDatabase,
  teardownTestDatabase,
} from '../../../test-fixtures/db-connection.js';
```

### Organization Context (Reuse from Phase 4)
```typescript
import { orgContext } from '../../../shared/context/org-context.js';

// In test:
const org = await createTestOrganization(db);
await orgContext.run(org.id, async () => {
  // All service calls happen within this org
  const result = await catalogService.list(...);
});
```

### Catalog Entity Fixture Pattern
```typescript
// Helper to create test entities
async function createTestEntity(
  db: Knex,
  overrides: Partial<CatalogEntity> = {}
): Promise<CatalogEntity> {
  const entity = {
    id: `entity-${Date.now()}`,
    kind: 'server',
    type: 'compute',
    name: 'test-entity',
    namespace: 'test',
    title: 'Test Entity',
    description: 'A test entity',
    lifecycle: 'active',
    owner_team_id: null,
    system_id: null,
    repository_url: null,
    metadata: {},
    ...overrides,
  };
  
  await db('catalog_entities').insert(entity);
  return entity;
}
```

---

## Global Constraints

- No hardcoded URLs (use relative paths)
- No console.log in tests
- No test.skip, test.only, test.todo in committed code
- Use semantic selectors (data-testid not needed for backend tests)
- TypeScript strict mode compliance
- ESLint compliance (0 violations)
- Database must be clean after test (use afterEach/afterAll)
- Org isolation must be enforced (no cross-org data leaks)
- Proper async/await (no floating promises)

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] 3 integration tests implemented and passing
- [ ] No console errors or warnings
- [ ] Database fixtures working correctly
- [ ] Organization isolation verified
- [ ] Test data cleanup working (afterEach/afterAll)
- [ ] Commit: [hash] with message

**One-liner:** "3 catalog integration tests passing. List with pagination, filter by attributes, metadata preservation verified."

**Concerns (if any):** Database setup issues, fixture problems, cross-org data leaks, etc.

---

## Success Criteria

✅ **3 tests implemented:** List, filter, metadata  
✅ **All tests passing:** 3/3  
✅ **TypeScript:** No errors in test file  
✅ **ESLint:** 0 violations  
✅ **Database:** Clean state after tests  
✅ **Organization isolation:** Enforced (orgContext)  
✅ **No console.log:** Clean output  
✅ **Commit:** Hash + message provided  

---

## Estimation

- **Reading existing code:** 30 min
- **Understanding fixtures:** 30 min
- **Implementing 3 tests:** 1.5 hours
- **Testing & verification:** 30 min
- **Documentation & commit:** 15 min

**Total:** ~3.5 hours

---

**Ready to implement.** This task is the foundation for Phase 5 testing. Green field (no existing catalog tests) → fast start with clear patterns from Phase 4.

**Next:** After Task 2 completes, Task 3 will verify these tests (same pattern as Phase 4 Tasks 3, 5).
