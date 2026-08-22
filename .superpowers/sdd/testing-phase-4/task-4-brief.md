# Task 4 Brief: URLs Integration Tests — Part 1

**Where this fits:** Task 4 adds 3 integration tests for the URLs service module. Same pattern as Task 2 (search), but for URLs.

---

## What You're Building

**File to create:**
`packages/backend/src/modules/urls/application/url.service.integration.test.ts`

**3 Integration Tests:**
1. Health check status updates
2. URL validation
3. Lifecycle: create, update, delete

**Fixtures to use:**
- `setupTestDatabase()` — from Phase 1 fixtures
- `resetTestDatabase()` — cleanup per-test
- `seedTestData()` — Phase 1 factory pattern
- `teardownTestDatabase()` — cleanup after suite

**Test framework:** Vitest

---

## Test Specifications

### Test 1: Health check status updates
```typescript
it('updates health check status', async () => {
  const url = await urlService.create({ url: 'https://example.com', organizationId: testDataIds.orgId });
  
  await urlService.checkHealth(url.id);
  const updated = await urlService.getUrl(url.id);
  
  expect(updated.status).toBe('healthy');
});
```

**Intent:** Verify health check updates status.  
**Setup:** Create URL in test database  
**Act:** Call checkHealth() on the URL  
**Assert:** Status updates to 'healthy' (assuming example.com is reachable)  
**Edge case:** If health check can't reach the URL, expect 'unhealthy' instead

### Test 2: URL validation
```typescript
it('validates URL format', async () => {
  await expect(
    urlService.create({ url: 'invalid', organizationId: testDataIds.orgId })
  ).rejects.toThrow('Invalid URL');
});
```

**Intent:** Verify invalid URLs are rejected.  
**Setup:** Database ready  
**Act:** Try to create with invalid URL format  
**Assert:** Throws error with 'Invalid URL' message  
**Valid examples:** 'https://example.com', 'http://test.org'  
**Invalid examples:** 'invalid', 'not-a-url', 'http://'

### Test 3: Lifecycle (create, update, delete)
```typescript
it('handles full lifecycle', async () => {
  const url = await urlService.create({ url: 'https://test.com', organizationId: testDataIds.orgId });
  expect(url).toBeDefined();
  
  await urlService.update(url.id, { description: 'Updated' });
  const updated = await urlService.getUrl(url.id);
  expect(updated.description).toBe('Updated');
  
  await urlService.delete(url.id);
  const deleted = await urlService.getUrl(url.id);
  expect(deleted).toBeNull();
});
```

**Intent:** Verify full CRUD cycle works.  
**Setup:** Database ready  
**Act:** Create URL → Update description → Delete  
**Assert:** Each step succeeds; getUrl returns null after delete (soft-delete or removed)  
**Note:** If soft-delete is used, expect { deletedAt: <timestamp> } instead of null

---

## Interfaces

**UrlService methods you'll call:**
- `urlService.create(input: { url: string, organizationId: string }): Promise<UrlResource>`
- `urlService.checkHealth(id: string): Promise<void>`
- `urlService.getUrl(id: string): Promise<UrlResource | null>`
- `urlService.update(id: string, changes: Partial<UrlResource>): Promise<UrlResource>`
- `urlService.delete(id: string): Promise<void>`

**Result shape:** `{ id, url, status, description?, createdAt, deletedAt? }`

---

## Implementation Steps

1. **Create test file** with describe block and beforeEach/afterEach/afterAll hooks
2. **Implement Test 1** — health check status
3. **Initialize UrlService** in beforeEach (inject or instantiate with db)
4. **Implement Test 2** — URL validation
5. **Implement Test 3** — lifecycle (CRUD)
6. **Run tests:** `npm run test -- url.service.integration.test.ts`
   - Expected: 3/3 passing
7. **Verify TypeScript:** `npm run typecheck` → PASS
8. **Verify ESLint:** `npm run lint` → PASS
9. **Commit** with message: `test: add urls integration tests (3 tests)`

---

## Global Constraints

- TypeScript strict mode enabled
- ESLint compliance required
- Fixtures reuse Phase 1 patterns
- PostgreSQL 16 for integration tests
- No console.log in tests
- No skip/only/.todo in committed tests
- Coverage thresholds: 80%+ per module
- Soft-delete filtering in all DB queries
- Organization isolation using orgContext

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] 3 tests implemented and passing
- [ ] TypeScript strict mode: no errors
- [ ] ESLint: no violations
- [ ] Fixtures working correctly
- [ ] Test database connected and seeded
- [ ] Commit: [hash] with message

**One-liner:** "3 URLs integration tests passing. Health check, validation, and CRUD lifecycle verified."

**Concerns (if any):** List any blockers or assumptions

