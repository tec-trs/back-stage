# Task 4 Brief: Catalog E2E Tests

**Phase:** 5  
**Module:** Catalog (Frontend + Backend)  
**Type:** E2E Tests (Playwright)  
**Target Tests:** 3 passing  
**Timeline:** 1 day

---

## What You're Building

**File to create:**  
`packages/e2e/tests/catalog.spec.ts`

**3 E2E Tests (Playwright):**
1. User creates new resource in catalog UI
2. User exports catalog as CSV/JSON
3. User performs bulk tag management

**Framework:** Playwright (same as Phase 4 Tasks 6-7)  
**Pattern:** Semantic selectors, no hardcoded URLs, proper wait patterns  
**Test Data:** Create via Playwright UI (no API seeding needed for E2E)

---

## Test Specifications

### Test 1: Create resource in catalog UI
```typescript
test('user creates new resource in catalog', async ({ page }) => {
  // Setup: Login + navigate to /catalog
  await login(page);
  await page.getByRole('link', { name: 'Catalog' }).click();
  
  // Act: Click "Create Resource" button
  await page.getByRole('button', { name: 'Create Resource' }).click();
  
  // Fill form with unique data
  const uniqueName = `resource-${Date.now()}`;
  await page.getByLabel('Name').fill(uniqueName);
  await page.getByLabel('Kind').selectOption('application');
  await page.getByLabel('Type').fill('api');
  await page.getByLabel('Namespace').fill('production');
  
  // Submit
  await page.getByRole('button', { name: 'Create' }).click();
  
  // Assert: Verify resource appears in list
  await page.waitForURL('**/catalog**');
  const resourceRow = page.locator('tr', { hasText: uniqueName });
  await expect(resourceRow).toBeVisible();
  await expect(resourceRow).toContainText('application');
  await expect(resourceRow).toContainText('api');
});
```

**Intent:** Verify users can create catalog resources through the UI.

**Setup:** Login + navigate to catalog page

**Act:** 
- Click "Create Resource" button
- Fill form (name, kind, type, namespace)
- Submit

**Assert:**
- Page navigates to catalog list
- New resource appears in table
- Resource shows correct kind and type

**Notes:**
- Use `Date.now()` for unique test data (isolation)
- Verify all required fields work
- Test both happy path (success) flow

---

### Test 2: Export catalog as CSV/JSON
```typescript
test('user exports catalog as CSV', async ({ page }) => {
  // Setup: Login + navigate to catalog
  await login(page);
  await page.goto('/catalog');
  
  // Create at least one resource if list is empty
  const emptyState = page.locator('text=/Nenhum recurso cadastrado/');
  const isEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isEmpty) {
    // Quick create via form
    await page.getByRole('button', { name: 'Create Resource' }).click();
    await page.getByLabel('Name').fill(`export-test-${Date.now()}`);
    await page.getByLabel('Kind').selectOption('server');
    await page.getByLabel('Type').fill('compute');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForLoadState('networkidle');
  }
  
  // Act: Click export button and handle download
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export.*CSV/i }).click();
  const download = await downloadPromise;
  
  // Assert: Verify download filename
  expect(download.suggestedFilename()).toMatch(/catalog.*csv/i);
});
```

**Intent:** Verify catalog export to CSV/JSON works.

**Setup:** 
- Login + navigate to catalog
- Ensure at least one resource exists (create if needed)

**Act:**
- Click "Export CSV" button
- Capture download event

**Assert:**
- Download triggered
- Filename matches pattern (catalog*.csv)

**Notes:**
- Playwright `waitForEvent('download')` captures file download
- Test both CSV and JSON if time permits
- Verify filename reflects export format

---

### Test 3: Bulk tag management
```typescript
test('user performs bulk tag management', async ({ page }) => {
  // Setup: Login + navigate to catalog
  await login(page);
  await page.goto('/catalog');
  
  // Create 3 resources for bulk operation
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Create Resource' }).click();
    await page.getByLabel('Name').fill(`bulk-test-${Date.now()}-${i}`);
    await page.getByLabel('Kind').selectOption('application');
    await page.getByLabel('Type').fill('api');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForLoadState('networkidle');
  }
  
  // Act: Select multiple resources via checkboxes
  const checkboxes = page.locator('input[type="checkbox"]');
  for (let i = 0; i < Math.min(2, await checkboxes.count()); i++) {
    await checkboxes.nth(i).check();
  }
  
  // Click "Add Tags" button
  await page.getByRole('button', { name: /Add Tags|Bulk Actions/i }).click();
  
  // Add tags in modal/form
  await page.getByLabel('Tags').fill('prod, critical, monitored');
  await page.getByRole('button', { name: 'Apply' }).click();
  
  // Assert: Verify tags applied to selected resources
  await page.waitForLoadState('networkidle');
  const firstResource = page.locator('tr').nth(1); // Skip header
  await expect(firstResource).toContainText(/prod|critical/);
});
```

**Intent:** Verify bulk tag management workflow.

**Setup:**
- Login + navigate to catalog
- Create 3 test resources

**Act:**
- Select 2 resources via checkboxes
- Click "Add Tags" button
- Enter tags (prod, critical, monitored)
- Submit

**Assert:**
- Tags appear on selected resources
- Non-selected resources unaffected

**Notes:**
- Tests multi-select workflow
- Uses `Date.now()` for unique resource names
- Verifies bulk operations don't affect all records

---

## Implementation Steps

1. **Create test file** `packages/e2e/tests/catalog.spec.ts` with `test.describe` block
2. **Implement Test 1** — create resource
   - Run: `npm run test:e2e -- catalog.spec.ts --grep "creates new"`
   - Expected: PASS
3. **Implement Test 2** — export catalog
   - Run: `npm run test:e2e -- catalog.spec.ts --grep "exports catalog"`
   - Expected: PASS
4. **Implement Test 3** — bulk tags
   - Run: `npm run test:e2e -- catalog.spec.ts --grep "bulk tag"`
   - Expected: PASS
5. **Run all 3 tests:** `npm run test:e2e -- catalog.spec.ts`
   - Expected: 3/3 passing
6. **Verify no console errors** (Playwright captures these)
7. **Commit** with message: `test: add catalog E2E tests (3 tests)`

---

## Playwright Patterns (Reuse from Phase 4)

### Login Helper
```typescript
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('User Code').fill('admin');
  await page.getByLabel('Password').fill('TestPassword123');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page).toHaveURL(/.*\/$/);
}
```

### Semantic Selectors
```typescript
// ✅ Good: Accessible names
page.getByRole('button', { name: 'Create Resource' })
page.getByLabel('Name')
page.getByPlaceholder('Enter resource name')

// ❌ Avoid: CSS selectors
page.locator('.btn.btn-primary')
page.locator('#name-input')
```

### Wait Patterns
```typescript
// ✅ Good: Explicit waits
await page.waitForURL('**/catalog**');
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();

// ❌ Avoid: Sleep/polling
await page.waitForTimeout(1000);
```

### Test Data Isolation
```typescript
// ✅ Good: Unique data per test run
const uniqueName = `resource-${Date.now()}`;

// ❌ Avoid: Hardcoded names
const name = 'test-resource'; // Could collide
```

---

## Global Constraints

- No hardcoded URLs (use relative paths like `/catalog`)
- No console.log in tests
- No test.skip, test.only, test.todo in committed code
- Use semantic selectors (getByRole, getByLabel preferred)
- Playwright timeout: 30s default (let it work)
- No polling loops (use waitFor functions)
- Test isolation: Each test independent (Date.now() for uniqueness)

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] 3 E2E tests implemented and passing
- [ ] No console errors during test runs
- [ ] Playwright selectors verified (semantic, not CSS)
- [ ] Test data isolation working (Date.now() or equivalent)
- [ ] Login flow working correctly
- [ ] Commit: [hash] with message

**One-liner:** "3 catalog E2E tests passing. Create resource, export catalog, bulk tag management verified with semantic selectors and proper wait patterns."

**Concerns (if any):** Flaky selectors, missing UI elements, backend API issues, etc.

---

## Success Criteria

✅ **3 tests implemented:** Create, export, bulk tags  
✅ **All tests passing:** 3/3 in Playwright  
✅ **No console errors:** Clean browser console  
✅ **Semantic selectors:** getByRole, getByLabel used  
✅ **Test isolation:** Date.now() for unique data  
✅ **Relative paths:** No hardcoded URLs  
✅ **No skip/only:** Clean test code  
✅ **Commit:** Hash + message provided

---

## Estimation

- **Exploring catalog UI:** 30 min
- **Setting up Playwright config:** 15 min (reuse Phase 4)
- **Implementing 3 tests:** 1.5 hours
- **Testing & verification:** 30 min
- **Documentation & commit:** 15 min

**Total:** ~3 hours

---

**Ready to implement.** This task follows Phase 4 E2E patterns (Tasks 6-7). Reuse login helper and semantic selector patterns. Focus on test isolation (Date.now() for data).

**Next:** After Task 4 completes, Task 5 will verify these E2E tests (same pattern as Phase 4 Task 7 verification).
