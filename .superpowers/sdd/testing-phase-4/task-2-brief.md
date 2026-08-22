# Task 2 Brief: Search Integration Tests — Part 1

**Where this fits:** Task 2 is part of the main Tier 2 track. Phase 4 completes search and urls modules with integration + E2E tests. This task adds 3 integration tests for the search service (real PostgreSQL database).

---

## What You're Building

**File to create:**
`packages/backend/src/modules/search/application/search.service.integration.test.ts`

**3 Integration Tests:**
1. Returns resources matching search term
2. Filters by resource type
3. Returns empty array for no matches

**Fixtures to use:**
- `setupTestDatabase()` — from Phase 1 fixtures (`packages/backend/src/test-fixtures/db-connection.ts`)
- `resetTestDatabase()` — cleanup per-test
- `seedTestData()` — Phase 1 factory pattern
- `teardownTestDatabase()` — cleanup after suite

**Test framework:** Vitest (same as Phase 3)

---

## Test Specifications

### Test 1: Returns resources matching search term
```typescript
it('returns resources matching search term', async () => {
  db = await setupTestDatabase();
  testDataIds = await seedTestData();
  
  const results = await searchService.search('prod-01', {});
  
  expect(results.length).toBeGreaterThan(0);
  expect(results.some(r => r.name.includes('prod-01'))).toBe(true);
});
```

**Intent:** Verify search finds resources by partial name match.  
**Setup:** Database with seeded test data (includes 'prod-01' in some resource names)  
**Assert:** Results include resource with 'prod-01' in name  
**Cleanup:** resetTestDatabase() called in afterEach

### Test 2: Filters by resource type
```typescript
it('filters by resource type', async () => {
  const results = await searchService.search('svc', { resourceTypes: ['application'] });
  
  expect(results.every(r => r.type === 'application')).toBe(true);
});
```

**Intent:** Verify type filtering works.  
**Setup:** Database with mixed resource types (servers, apps, databases)  
**Assert:** All results have type === 'application'  
**Edge case:** If no 'svc' app exists, expect empty array (not error)

### Test 3: Returns empty array for no matches
```typescript
it('returns empty array for no matches', async () => {
  const results = await searchService.search('nonexistent-xyz-123', {});
  
  expect(results).toEqual([]);
});
```

**Intent:** Verify no error on empty results.  
**Setup:** Database with seeded data (no resource with 'nonexistent-xyz-123')  
**Assert:** Returns `[]`, not error  

---

## Interfaces

**SearchService methods you'll call:**
- `searchService.search(term: string, options?: { resourceTypes?: string[], page?: number, pageSize?: number }): Promise<SearchResult[]>`
- Result shape: `{ id, name, type, description }`

**Fixture return values:**
- `setupTestDatabase()` → database connection
- `seedTestData()` → `{ orgId, serverId, appId, ... }` (object with resource IDs)
- `resetTestDatabase(db)` → clears tables
- `teardownTestDatabase(db)` → closes connection

---

## Implementation Steps

1. **Create test file** with describe block and beforeEach/afterEach/afterAll hooks
2. **Implement Test 1** — search by term
3. **Initialize SearchService** in beforeEach (inject or instantiate with db)
4. **Implement Test 2** — filter by type
5. **Implement Test 3** — empty results
6. **Run tests:** `npm run test -- search.service.integration.test.ts`
   - Expected: 3/3 passing
7. **Verify TypeScript:** `npm run typecheck` → PASS
8. **Verify ESLint:** `npm run lint` → PASS
9. **Commit** with message: `test: add search integration tests (3 tests)`

---

## Global Constraints (From Phase 4 Spec)

- TypeScript strict mode enabled
- ESLint compliance required (no violations)
- Fixtures reuse Phase 1 patterns (db-connection, seed-data, mock-factories)
- PostgreSQL 16 for integration tests
- No console.log in tests
- No skip/only/.todo in committed tests
- Coverage thresholds: 50%+ global, 80%+ per module
- Soft-delete filtering in all DB queries
- Organization isolation using orgContext

---

## Report Contract

When complete:

**Status:** DONE or DONE_WITH_CONCERNS

**Report contents:**
- [ ] 3 tests implemented and passing
- [ ] TypeScript strict mode: no errors
- [ ] ESLint: no violations
- [ ] Fixtures (setupTestDatabase, seedTestData, resetTestDatabase) working correctly
- [ ] Test database (PostgreSQL 16) connected and seeded
- [ ] Commit: [hash] with message

**One-liner:** "3 search integration tests passing. Search service filters by term, type, and handles empty results."

**Concerns (if any):** List any blockers or assumptions made

---

## Files Touched

- Create: `packages/backend/src/modules/search/application/search.service.integration.test.ts` (~80-100 lines)
- Read: `packages/backend/src/modules/search/application/search.service.ts` (understand SearchService API)
- Read: `packages/backend/src/test-fixtures/db-connection.ts` (fixture patterns)
- Read: `packages/backend/src/test-fixtures/seed-data.ts` (test data factory)

