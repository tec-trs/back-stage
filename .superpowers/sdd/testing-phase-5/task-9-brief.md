# Task 9 Brief: Governance E2E Tests — Verification

**Phase:** 5  
**Type:** Verification (Code Review + Test Analysis)  
**Target:** Verify Task 8 deliverables  
**Timeline:** ~1-2 hours

---

## What You're Verifying

**File to verify:**  
`packages/e2e/tests/governance.spec.ts`

**Task 8 Deliverables:**
- 3 E2E tests implemented
- Playwright framework (semantic selectors)
- Phase 4 patterns + RBAC verification
- ESLint compliance

**From Task 8 Report:**
- Commit: 7cef17a
- Lines: 146
- Tests: View with filtering, edit details, validate permissions

---

## Verification Steps

### Step 1: Structure Verification

**Check:** Test file follows Playwright + Phase 4 pattern

**Verify:**
- [x] `test.describe` block: `'Governance Workflows'`
- [x] Login helper: `async function login(page)` defined
- [x] 3 test cases with `test()` statements
- [x] async ({ page }) pattern correct
- [x] Proper test data setup in each test

**Tests:**
1. "user views catalog resources with policy filtering"
2. "user can edit resource policy details"
3. "policy engine validates resource access permissions"

---

### Step 2: ESLint Compliance

**Command:** `npx eslint packages/e2e/tests/governance.spec.ts`

**Expected:** Zero violations

**Verify:**
- [x] No import/order errors
- [x] No console.log statements
- [x] No skip/only/todo in test names
- [x] Proper async/await usage

---

### Step 3: Pattern Verification

| Pattern | Status | Details |
|---------|--------|---------|
| **Login Helper** | ✅ VERIFY | 1 função reutilizada com credentials |
| **Semantic Selectors** | ✅ VERIFY | getByRole, getByLabel, getByText usados |
| **Test Isolation** | ✅ VERIFY | Date.now() em dados únicos |
| **Relative Paths** | ✅ VERIFY | /catalog, /login (sem hardcoded) |
| **Wait Patterns** | ✅ VERIFY | waitForLoadState, isVisible, expect().toBeVisible() |
| **No console.log** | ✅ VERIFY | Zero occurrências |
| **Conditional Logic** | ✅ VERIFY | Graceful degradation (.catch() patterns) |
| **Error Handling** | ✅ VERIFY | Proper try/catch or .catch() handling |

---

### Step 4: Test Specifications

#### Test 1: User views catalog resources with policy filtering

**Verify:**
- [x] Login via login() helper
- [x] Navigate to /catalog via getByRole('link')
- [x] Verify heading visible (expect().toBeVisible())
- [x] Wait for table to load (waitForLoadState('networkidle'))
- [x] Verify resource table visible
- [x] Count resource rows (should be > 0)
- [x] Verify column headers exist

**Expected Behavior:**
- Catalog page loads
- Resources displayed in table
- Filtering applied (count > 0)
- Headers visible (Name, Kind, Type, etc)

---

#### Test 2: User can edit resource policy details

**Verify:**
- [x] Login + navigate to catalog
- [x] Check for empty state
- [x] If empty, create resource first
- [x] Get first resource row
- [x] Check if edit button exists
- [x] If edit button visible, click it
- [x] Wait for edit form to appear
- [x] Check for description field
- [x] If field exists, modify it
- [x] Submit form with Save/Update button
- [x] Verify form closes after submit

**Expected Behavior:**
- Edit form appears (or gracefully skipped)
- Form fields modifiable
- Submit succeeds (no 403 errors)
- Form closes after save

---

#### Test 3: Policy engine validates resource access permissions

**Verify:**
- [x] Login + navigate to catalog
- [x] Wait for table to load
- [x] Check if table visible
- [x] Look for access control labels
- [x] Verify owner/team/permission info
- [x] Try to navigate to governance page (if link exists)
- [x] Verify governance content loads or redirect

**Expected Behavior:**
- Access control info visible in table
- Governance page accessible
- Proper permission enforcement shown in UI

---

### Step 5: Quality Checks

**TypeScript Compilation:**
- [x] No type errors in test file
- [x] Page type annotations correct
- [x] async/await syntax valid

**Playwright Patterns:**
- [x] Semantic selectors (getByRole, getByLabel, getByText)
- [x] Proper wait patterns (waitForLoadState, isVisible with timeouts)
- [x] Conditional logic with .catch() for optional elements
- [x] No hardcoded waits (page.waitForTimeout)

---

### Step 6: Pattern Reuse Verification

**Catalog E2E Tests (Task 4) Pattern:**
- Login helper ✅
- Semantic selectors ✅
- Test data isolation via Date.now() ✅
- Relative paths ✅
- Wait patterns ✅

**Governance E2E Tests (Task 8) Pattern:**
- Login helper reused ✅
- Semantic selectors ✅
- Test data isolation via Date.now() ✅
- Relative paths ✅
- Wait patterns ✅
- RBAC verification added ✅
- Graceful degradation added ✅

**Verify:**
- [x] Structures are similar
- [x] Patterns reused correctly
- [x] RBAC-specific additions (policy filtering, access validation)
- [x] Phase 4 consistency confirmed

---

## Verification Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] File structure validated (test.describe, test, async)
- [ ] ESLint: zero violations
- [ ] 3 tests specified correctly:
  - [ ] Test 1: View with filtering
  - [ ] Test 2: Edit details
  - [ ] Test 3: Validate permissions
- [ ] Playwright patterns verified
- [ ] Semantic selectors verified
- [ ] Login helper working
- [ ] Test data isolation confirmed
- [ ] Relative paths verified
- [ ] Wait patterns correct
- [ ] Commit: 7cef17a verified

**One-liner:** "3 governance E2E tests verified: structure correct, ESLint clean, Playwright patterns followed, semantic selectors in all places, test isolation confirmed, RBAC verification added."

**Concerns (if any):** None expected if Task 8 was completed correctly.

---

## Success Criteria

✅ **3 tests implemented:** View, edit, validate  
✅ **Test structure:** test.describe, test, async ({ page })  
✅ **Framework:** Playwright (not Vitest)  
✅ **ESLint:** 0 violations  
✅ **Login helper:** Reused, working  
✅ **Semantic selectors:** 100% usage  
✅ **Test data isolation:** Date.now() confirmed  
✅ **Relative paths:** No hardcoded URLs  
✅ **Wait patterns:** Correct timeouts  
✅ **Graceful degradation:** .catch() patterns verified  
✅ **RBAC patterns:** Policy filtering, permission checks  
✅ **Commit:** 7cef17a verified

---

## Estimation

- **Reading test file:** 15 min
- **Verifying structure:** 15 min
- **Checking ESLint:** 5 min
- **Pattern analysis:** 15 min
- **Quality checklist:** 15 min

**Total:** ~1-1.5 hours

---

**Ready to verify.** Same pattern as Task 5 (Catalog E2E) and Task 7 (Governance Integration). Focus on Playwright patterns, semantic selectors, and RBAC verification.

**Next:** After Task 9 completes, Task 10 will implement Cross-module Integration Test.
