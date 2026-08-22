# Task 7 Brief: Governance Integration Tests — Verification

**Phase:** 5  
**Type:** Verification (Code Review + Test Analysis)  
**Target:** Verify Task 6 deliverables  
**Timeline:** ~1-2 hours

---

## What You're Verifying

**File to verify:**  
`packages/backend/src/modules/governance/application/policy.service.integration.test.ts`

**Task 6 Deliverables:**
- 3 integration tests implemented
- Jest framework (not Vitest)
- Phase 1 fixtures + org isolation
- ESLint compliance

**From Task 6 Report:**
- Commit: 6d79403
- Lines: 192
- Tests: Create policy, invalid definition, duplicate slug

---

## Verification Steps

### Step 1: Structure Verification ✓

**Check:** Test file follows Jest + Phase 1 pattern

```typescript
// ✓ Correct pattern:
describe('PolicyService (Integration)', () => {
  const ctx: TestContext = { db: null, ... };
  
  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    // Create test organization
    const [org] = await ctx.db('organizations').insert(...).returning(['id']);
    ctx.orgId = org.id;
    const policyRepository = new PolicyRepository(ctx.db);
    ctx.policyService = new PolicyService(policyRepository);
  });
  
  afterEach(async () => {
    if (ctx.db) await resetTestDatabase(ctx.db);
  });
  
  afterAll(async () => {
    if (ctx.db) await teardownTestDatabase(ctx.db);
  }, 30000);
  
  it('creates policy and validates definition', async () => { ... });
  it('rejects policy with invalid JSON definition', async () => { ... });
  it('prevents creating policy with duplicate slug', async () => { ... });
});
```

**Verify:**
- [x] `describe` block: `'PolicyService (Integration)'`
- [x] TestContext interface defined
- [x] beforeEach: setupTestDatabase() called
- [x] Test organization created with unique slug
- [x] PolicyRepository + PolicyService initialized
- [x] afterEach: resetTestDatabase() called
- [x] afterAll: teardownTestDatabase() called with timeout
- [x] 3 test cases with `it()` statements

---

### Step 2: ESLint Compliance ✓

**Command:** `npx eslint src/modules/governance/application/policy.service.integration.test.ts`

**Expected:** Zero violations

**Verify:**
- [x] No import/order errors (imports grouped correctly)
- [x] No console.log statements
- [x] No skip/only/todo in test names
- [x] Proper async/await usage
- [x] No unused variables

---

### Step 3: Pattern Verification ✓

| Pattern | Status | Detalhes |
|---------|--------|----------|
| **Jest Framework** | ✅ VERIFY | Uses jest.setTimeout, describe, it, beforeEach, afterEach, afterAll |
| **Database Fixtures** | ✅ VERIFY | setupTestDatabase, resetTestDatabase, teardownTestDatabase imported correctly |
| **Organization Isolation** | ✅ VERIFY | orgContext.run() used for all service calls |
| **Test Data Isolation** | ✅ VERIFY | Date.now() in slug/org creation to prevent collisions |
| **Error Types** | ✅ VERIFY | ValidationError and ConflictError imported from @back-stage/shared |
| **No console.log** | ✅ VERIFY | All test output clean, no debugging logs |

---

### Step 4: Test Specifications ✓

#### Test 1: Creates policy and validates definition

**Verify:**
- [x] Creates test organization in beforeEach
- [x] Policy input has valid JSON definition with rules + combinator
- [x] Calls `policyService.create(policyInput, { actorUserId: 'test-user' })`
- [x] Asserts policy properties: id, name, slug, policyType, isActive
- [x] Parses definition JSON and verifies structure
- [x] Calls `policyService.getById()` to verify persistence
- [x] Asserts retrieved policy matches created policy

**Expected Behavior:**
- Policy created successfully
- Definition stored as JSON string
- Database persistence verified
- No errors thrown

---

#### Test 2: Rejects policy with invalid JSON definition

**Verify:**
- [x] Creates invalid policy input (malformed JSON)
- [x] Calls `policyService.create()` and expects ValidationError
- [x] Uses `await expect(...).rejects.toThrow(ValidationError)`
- [x] Verifies error message contains 'JSON malformado'
- [x] Asserts no policies created in database (count = 0)
- [x] Transaction rolled back (no data persisted)

**Expected Behavior:**
- ValidationError thrown
- Error message contains hint about JSON
- Database remains empty
- Transaction rolled back

---

#### Test 3: Prevents creating policy with duplicate slug

**Verify:**
- [x] Creates first policy with unique slug (succeeds)
- [x] Attempts to create second policy with same slug
- [x] Uses `await expect(...).rejects.toThrow(ConflictError)`
- [x] Verifies error message contains 'slug'
- [x] Asserts database contains exactly 1 policy
- [x] Verifies only first policy in database by name

**Expected Behavior:**
- First policy created successfully
- Second creation throws ConflictError
- Error message mentions slug uniqueness
- Only 1 policy exists in database

---

### Step 5: Quality Checks ✓

**TypeScript Compilation:**
```bash
npx tsc --noEmit src/modules/governance/application/policy.service.integration.test.ts
```
Expected: No errors related to this file

**Verify:**
- [x] No type errors in test file
- [x] Knex types imported correctly
- [x] ConflictError and ValidationError types available
- [x] PolicyService and PolicyRepository types correct

---

### Step 6: Patterns Reuse Verification ✓

**Catalog Integration Tests (Task 2) Pattern:**
```typescript
describe('CatalogEntityService (Integration)', () => {
  const ctx: TestContext = { db: null, catalogService: null, orgId: '' };
  
  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    const [org] = await ctx.db('organizations').insert({...}).returning(['id']);
    ctx.orgId = org.id;
    const catalogRepository = new CatalogEntityRepository(ctx.db);
    ctx.catalogService = new CatalogEntityService(catalogRepository);
  });
  // ... rest
});
```

**Governance Integration Tests (Task 6) Pattern:**
```typescript
describe('PolicyService (Integration)', () => {
  const ctx: TestContext = { db: null, policyService: null, orgId: '' };
  
  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    const [org] = await ctx.db('organizations').insert({...}).returning(['id']);
    ctx.orgId = org.id;
    const policyRepository = new PolicyRepository(ctx.db);
    ctx.policyService = new PolicyService(policyRepository);
  });
  // ... rest
});
```

**Verify:**
- [x] Structure is identical (reuse confirmed)
- [x] Fixtures used the same way
- [x] org isolation pattern follows Phase 1
- [x] Database cleanup logic matches

---

## Verification Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] File structure validated (describe, beforeEach, afterEach, afterAll)
- [ ] ESLint: zero violations
- [ ] 3 tests specified correctly:
  - [ ] Test 1: Creates policy and validates
  - [ ] Test 2: Rejects invalid definition
  - [ ] Test 3: Prevents duplicate slug
- [ ] Database fixtures pattern verified
- [ ] Organization isolation confirmed (orgContext.run)
- [ ] Error types validated (ValidationError, ConflictError)
- [ ] Jest framework confirmed (not Vitest)
- [ ] Phase 1 patterns followed exactly
- [ ] Test data isolation via Date.now()
- [ ] Commit: 6d79403 verified

**One-liner:** "3 governance integration tests verified: structure correct, ESLint clean, Jest framework confirmed, Phase 1 patterns followed, org isolation enforced, error handling validated."

**Concerns (if any):** None expected if Task 6 was completed correctly.

---

## Success Criteria

✅ **3 tests implemented:** Create, invalid definition, duplicate slug  
✅ **Test structure:** Describe block, beforeEach, afterEach, afterAll  
✅ **Framework:** Jest (not Vitest)  
✅ **ESLint:** 0 violations  
✅ **Database:** setupTestDatabase, resetTestDatabase, teardownTestDatabase  
✅ **Organization isolation:** orgContext.run() for all calls  
✅ **Error handling:** ValidationError, ConflictError verified  
✅ **Test data isolation:** Date.now() in slug/org creation  
✅ **No console.log:** Clean test output  
✅ **Phase 1 patterns:** Exact reuse from Catalog tests  
✅ **Commit:** 6d79403 + message verified

---

## Estimation

- **Reading test file:** 20 min
- **Verifying structure:** 15 min
- **Checking ESLint:** 5 min
- **Pattern comparison:** 10 min
- **Quality checklist:** 10 min

**Total:** ~1-1.5 hours

---

## Key Difference from Task 5 (Catalog E2E Verification)

**Task 5** verified:
- Playwright E2E tests
- Semantic selectors (33 uses)
- Browser automation patterns
- Download capture

**Task 7** verifies:
- Jest integration tests
- Database fixtures
- Organization isolation
- Error type handling
- Phase 1 pattern reuse

Same verification approach, different test type.

---

**Ready to verify.** This task is similar structure to Task 5 but for integration tests instead of E2E tests. Focus on structure, ESLint, patterns, and error handling validation.

**Next:** After Task 7 completes, Task 8 will implement Governance E2E Tests.
