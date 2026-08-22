# Task 3 Brief: Search Integration Tests — Verification

**Where this fits:** Task 3 reviews Task 2's deliverable. It is a review gate, not new implementation.

---

## What You're Reviewing

**Implementer completed:** `packages/backend/src/modules/search/application/search.service.integration.test.ts` (3 tests)

**Your job:** Verify:
1. Test structure matches spec (3 tests with correct names)
2. Fixtures (setupTestDatabase, seedTestData, resetTestDatabase) used correctly
3. TypeScript strict mode: `npm run typecheck` passes
4. ESLint compliance: `npm run lint` passes
5. Tests actually pass: `npm run test -- search.service.integration.test.ts` shows 3/3

---

## Steps

- [ ] **Step 1: Verify test structure**

Read `packages/backend/src/modules/search/application/search.service.integration.test.ts`:
- Has `describe('SearchService (Integration)', ...)`
- Has `beforeEach` with setupTestDatabase + seedTestData
- Has `afterEach` with resetTestDatabase
- Has `afterAll` with teardownTestDatabase
- Has 3 `it(...)` tests with correct names

- [ ] **Step 2: Run TypeScript check**

```bash
npm run typecheck
```

Expected: PASS (0 errors)

- [ ] **Step 3: Run ESLint**

```bash
npm run lint
```

Expected: PASS (no violations in the new test file)

- [ ] **Step 4: Run tests**

```bash
npm run test -- search.service.integration.test.ts
```

Expected: 3/3 passing

**If any fail:** Report which and why.

---

## Sign-Off

When all 4 steps pass:

**Status:** Approved

**One-liner:** "Search integration tests verified: 3/3 passing, TypeScript clean, ESLint clean."

If any step fails, report the failure and mark status as NEEDS_FIX.

