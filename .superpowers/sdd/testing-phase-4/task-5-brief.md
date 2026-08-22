# Task 5 Brief: URLs Integration Tests — Verification

**Where this fits:** Task 5 reviews Task 4's deliverable (same pattern as Task 3).

---

## What You're Reviewing

**Implementer completed:** `packages/backend/src/modules/urls/application/url.service.integration.test.ts` (3 tests)

**Your job:** Verify:
1. Test structure matches spec (3 tests with correct names)
2. Fixtures used correctly
3. TypeScript: `npm run typecheck` passes
4. ESLint: `npm run lint` passes
5. Tests pass: `npm run test -- url.service.integration.test.ts` shows 3/3

---

## Steps

- [ ] **Step 1: Verify test structure**

Read the test file:
- Has `describe('UrlService (Integration)', ...)`
- Has `beforeEach` with setupTestDatabase + seedTestData
- Has `afterEach` with resetTestDatabase
- Has `afterAll` with teardownTestDatabase
- Has 3 `it(...)` tests with correct names

- [ ] **Step 2: Run TypeScript check**

```bash
npm run typecheck
```

Expected: PASS

- [ ] **Step 3: Run ESLint**

```bash
npm run lint
```

Expected: PASS

- [ ] **Step 4: Run tests**

```bash
npm run test -- url.service.integration.test.ts
```

Expected: 3/3 passing

---

## Sign-Off

**Status:** Approved (if all steps pass) or NEEDS_FIX (if any fail)

**One-liner:** "URLs integration tests verified: 3/3 passing, TypeScript clean, ESLint clean."

