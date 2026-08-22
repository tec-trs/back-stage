# Task 8 Brief: Governance E2E Tests

**Phase:** 5  
**Module:** Governance (Frontend + Backend - RBAC)  
**Type:** E2E Tests (Playwright)  
**Target Tests:** 3 passing  
**Timeline:** 1 day

---

## What You're Building

**File to create:**  
`packages/e2e/tests/governance.spec.ts`

**3 E2E Tests (Playwright):**
1. User with viewer role sees filtered catalog resources
2. User with editor role can edit resource details
3. User without permission gets 403 on edit attempt

**Framework:** Playwright (same as Phase 4 Tasks 6-7, Task 4)  
**Pattern:** Semantic selectors, no hardcoded URLs, proper wait patterns  
**Test Data:** Create via Playwright UI (no API seeding needed for E2E)  
**Focus:** RBAC policy enforcement in UI

---

## Test Specifications

### Test 1: User with viewer role sees filtered catalog
```typescript
test('user with viewer role sees filtered catalog resources', async ({ page }) => {
  // Setup: Login as user with viewer role
  await login(page, 'viewer-user', 'password');
  
  // Navigate to catalog page
  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page.getByRole('heading', { name: /Catalog|Catálogo/i })).toBeVisible();
  
  // Act: View resource list (should be filtered by viewer role)
  const resourceTable = page.locator('table');
  
  // Assert: Resources visible but restricted based on role
  // Viewer can SEE resources but cannot EDIT them
  const editButtons = page.locator('button', { hasText: /Edit|Editar/i });
  const deleteButtons = page.locator('button', { hasText: /Delete|Deletar/i });
  
  // Should see resources (some filtered by policy)
  const resourceRows = page.locator('tr');
  expect(await resourceRows.count()).toBeGreaterThan(0);
  
  // Edit/delete buttons should be disabled or hidden
  const editCount = await editButtons.isVisible({ timeout: 2000 }).catch(() => false);
  const deleteCount = await deleteButtons.isVisible({ timeout: 2000 }).catch(() => false);
  
  // At least one should be disabled/hidden for viewer role
  expect(editCount || deleteCount).toBe(false);
});
```

**Intent:** Verify viewer role sees filtered catalog with no edit/delete permissions.

**Setup:** 
- Login with viewer role user (use testable credentials)
- Navigate to catalog page

**Act:**
- View catalog resource list
- Check for edit/delete action buttons

**Assert:**
- Resources visible in table (some may be filtered by policy)
- Edit/delete buttons hidden or disabled (viewer cannot edit)
- Read-only access enforced

**Notes:**
- Viewer role = READ-ONLY access
- Policy engine filters resources before display
- UI should hide/disable edit/delete for viewer
- No 403 errors (page still loads, just filtered)

---

### Test 2: User with editor role can edit resource details
```typescript
test('user with editor role can edit resource details', async ({ page }) => {
  // Setup: Login as user with editor role
  await login(page, 'editor-user', 'password');
  
  // Navigate to catalog page
  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page.getByRole('heading', { name: /Catalog|Catálogo/i })).toBeVisible();
  
  // Find a resource to edit
  const firstResourceRow = page.locator('tr').nth(1); // Skip header
  const resourceName = await firstResourceRow.locator('td').first().textContent();
  
  // Click edit button on resource row
  await firstResourceRow.getByRole('button', { name: /Edit|Editar/i }).click();
  
  // Wait for edit form/modal to appear
  await expect(page.getByRole('heading', { name: /Edit|Editar/i })).toBeVisible({ timeout: 5000 });
  
  // Act: Modify resource detail (e.g., description)
  const descriptionField = page.getByLabel(/Description|Descrição/i);
  const updatedDescription = `Updated by editor - ${Date.now()}`;
  
  await descriptionField.clear();
  await descriptionField.fill(updatedDescription);
  
  // Submit form
  await page.getByRole('button', { name: /Save|Salvar|Update|Atualizar/i }).click();
  
  // Assert: Edit successful, confirmation appears
  await expect(page.getByRole('heading', { name: /Edit|Editar/i })).not.toBeVisible({ timeout: 5000 });
  
  // Verify change persisted (re-open resource)
  await firstResourceRow.getByRole('button', { name: /Edit|Editar/i }).click();
  await expect(page.getByLabel(/Description|Descrição/i)).toHaveValue(updatedDescription);
});
```

**Intent:** Verify editor role can modify resource details via UI.

**Setup:** 
- Login with editor role user
- Navigate to catalog
- Find an existing resource (or create one if empty)

**Act:**
- Click edit button on resource
- Fill form (e.g., update description)
- Submit changes

**Assert:**
- Edit form appears (timeout 5s)
- Changes persist when re-opened
- No 403 errors on edit

**Notes:**
- Editor role = READ + WRITE access
- Should be able to edit basic fields
- Test data: use Date.now() for description to make unique
- Verify persistence by re-opening

---

### Test 3: User without permission gets 403 on edit attempt
```typescript
test('user without permission gets 403 on edit attempt', async ({ page }) => {
  // Setup: Login as user with no edit permission
  await login(page, 'restricted-user', 'password');
  
  // Navigate to catalog page
  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page.getByRole('heading', { name: /Catalog|Catálogo/i })).toBeVisible();
  
  // Find a resource to try editing
  const firstResourceRow = page.locator('tr').nth(1); // Skip header
  const resourceId = firstResourceRow.getAttribute('data-resource-id');
  
  // Try to access edit via direct URL (simulates restricted user trying to edit)
  await page.goto(`/catalog/${resourceId}/edit`);
  
  // Act & Assert: Should get 403 Forbidden or be redirected
  
  // Option 1: Page shows 403 error
  const error403 = page.locator('text=/403|Forbidden|Acesso negado/i');
  const isError403 = await error403.isVisible({ timeout: 3000 }).catch(() => false);
  
  // Option 2: Redirected to unauthorized page or back to list
  const unauthorizedMsg = page.locator('text=/Você não tem permissão|You do not have permission/i');
  const isUnauthorized = await unauthorizedMsg.isVisible({ timeout: 3000 }).catch(() => false);
  
  // At least one should be true
  expect(isError403 || isUnauthorized || !page.url().includes('/edit')).toBe(true);
  
  // Verify no edit form appears
  const editForm = page.locator('form[data-form="edit-resource"]');
  expect(await editForm.isVisible({ timeout: 2000 }).catch(() => false)).toBe(false);
});
```

**Intent:** Verify permission denial is enforced for users without edit permission.

**Setup:** 
- Login with user who has no edit permission on this resource
- Navigate to catalog

**Act:**
- Try to access edit page directly (via URL)
- OR try to click edit button if visible

**Assert:**
- 403 Forbidden error OR redirect to unauthorized page
- Edit form does NOT appear
- Permission denied message visible

**Notes:**
- Restricted user = READ-ONLY or NO ACCESS
- Should not see edit form even if button is visible
- API should return 403 if trying to save
- URL redirection or error message expected

---

## Implementation Steps

1. **Create test file** `packages/e2e/tests/governance.spec.ts` with `test.describe` block
2. **Implement Test 1** — viewer role sees filtered catalog
   - Run: `npm run test:e2e -- governance.spec.ts --grep "viewer role"`
   - Expected: PASS
3. **Implement Test 2** — editor role can edit
   - Run: `npm run test:e2e -- governance.spec.ts --grep "editor role"`
   - Expected: PASS
4. **Implement Test 3** — restricted user gets 403
   - Run: `npm run test:e2e -- governance.spec.ts --grep "without permission"`
   - Expected: PASS
5. **Run all 3 tests:** `npm run test:e2e -- governance.spec.ts`
   - Expected: 3/3 passing
6. **Verify no console errors** (Playwright captures these)
7. **Commit** with message: `test: add governance E2E tests (3 tests)`

---

## Test Users & Roles

**Viewer Role User:**
- Username: `viewer-user` (or use existing test account with viewer role)
- Password: Standard test password
- Role: Viewer (READ-ONLY on all resources)
- Permission: Can see resources, cannot edit/delete

**Editor Role User:**
- Username: `editor-user` (or use existing test account with editor role)
- Password: Standard test password
- Role: Editor (READ + WRITE on assigned resources)
- Permission: Can see and edit resources

**Restricted User:**
- Username: `restricted-user` (or use account with explicit deny on resource)
- Password: Standard test password
- Role: No explicit permission on target resource
- Permission: Should get 403 on edit attempts

**Notes:**
- Use same login pattern as Task 4 (semantic selectors)
- If test users don't exist, create them via UI or API before tests
- Alternatively: Bypass login and use API token with restricted scopes

---

## Playwright Patterns (Reuse from Phase 4 & Task 4)

### Login Helper (Reuse from Task 4)
```typescript
async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill(username);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/.*\/$/);
}
```

### Semantic Selectors
```typescript
// ✅ Good: Accessible names
page.getByRole('button', { name: 'Edit' })
page.getByLabel('Description')
page.getByRole('link', { name: 'Catalog' })

// ❌ Avoid: CSS selectors
page.locator('.btn.btn-primary')
page.locator('#edit-button')
```

### Wait Patterns
```typescript
// ✅ Good: Explicit waits
await page.waitForURL('**/catalog**');
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible({ timeout: 5000 });

// ❌ Avoid: Sleep/polling
await page.waitForTimeout(1000);
```

### Test Data Isolation
```typescript
// ✅ Good: Unique data per test run
const updatedDescription = `Updated - ${Date.now()}`;

// ❌ Avoid: Hardcoded names
const description = 'Updated'; // Could collide
```

---

## Global Constraints

- No hardcoded URLs (use relative paths like `/catalog`)
- No console.log in tests
- No test.skip, test.only, test.todo in committed code
- Use semantic selectors (getByRole, getByLabel preferred)
- Playwright timeout: 30s default (let it work)
- No polling loops (use waitFor functions)
- Test isolation: Each test independent (create unique data if needed)
- No test data dependencies (don't rely on previous test's state)

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] 3 E2E tests implemented and passing
- [ ] No console errors during test runs
- [ ] Playwright selectors verified (semantic, not CSS)
- [ ] Test data isolation working (Date.now() or equivalent)
- [ ] Login flow working correctly (handles multiple roles)
- [ ] Role-based access control verified in UI
- [ ] Commit: [hash] with message

**One-liner:** "3 governance E2E tests passing. Viewer role filtered access, editor role edit capability, restricted user 403 denial verified with semantic selectors and proper wait patterns."

**Concerns (if any):** Missing test users, UI element mismatches, permission API issues, etc.

---

## Success Criteria

✅ **3 tests implemented:** Viewer, editor, restricted  
✅ **All tests passing:** 3/3 in Playwright  
✅ **No console errors:** Clean browser console  
✅ **Semantic selectors:** getByRole, getByLabel used  
✅ **Test isolation:** Date.now() for unique data  
✅ **Relative paths:** No hardcoded URLs  
✅ **No skip/only:** Clean test code  
✅ **Commit:** Hash + message provided  
✅ **Role verification:** RBAC enforced in UI  
✅ **Permission denial:** 403/redirect verified

---

## Estimation

- **Exploring governance UI:** 30 min (understand role-based sections)
- **Setting up Playwright:** 15 min (reuse Phase 4 config)
- **Implementing 3 tests:** 2 hours (role switching, permission checks)
- **Testing & verification:** 30 min
- **Documentation & commit:** 15 min

**Total:** ~3.5 hours

---

## Key Differences from Catalog E2E (Task 4)

**Catalog (Task 4):**
- Resource creation, export, bulk operations
- No role/permission checks
- Generic workflow tests

**Governance (Task 8):**
- Role-based access control (RBAC)
- Permission enforcement (403 handling)
- Multiple user personas (viewer, editor, restricted)
- UI restriction verification (hidden/disabled buttons)
- Filtered resource display based on policy

**Similarity:**
- Same Playwright framework
- Same semantic selector patterns
- Same login helper (extended for multiple roles)
- Same wait patterns

---

**Ready to implement.** This task follows Phase 4 E2E patterns (Tasks 6-7, Task 4). Reuse login helper and semantic selector patterns. Focus on role verification (RBAC in UI).

**Next:** After Task 8 completes, Task 9 will verify these governance E2E tests (same pattern as Phase 4 Task 9).
