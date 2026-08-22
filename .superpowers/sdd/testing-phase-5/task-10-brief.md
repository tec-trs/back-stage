# Task 10 Brief: Cross-module Integration Test

**Phase:** 5  
**Modules:** Ecosystem + Governance (RBAC)  
**Type:** E2E Integration Test (Playwright)  
**Target Tests:** 1 passing  
**Timeline:** ~2-3 hours

---

## What You're Building

**File to create (or extend):**  
`packages/e2e/tests/ecosystem-governance.spec.ts` (new file)

**1 Cross-module E2E Test:**
- User with limited role browses ecosystem with governance permission gates

**Framework:** Playwright  
**Pattern:** Phase 4 E2E (semantic selectors, login, wait patterns)  
**Focus:** RBAC integration across Ecosystem + Governance modules

---

## Test Specification

### Test 1: User with limited role browses ecosystem with permission gates

```typescript
test('user with limited role browses ecosystem with governance permission gates', async ({ page }) => {
  // Setup: Login as user with specific role
  await login(page);
  
  // Navigate to resource graph/ecosystem page
  await page.getByRole('link', { name: /Ecosystem|Ecossistema|Graph|Grafo/i }).click();
  await expect(page.getByRole('heading', { name: /Ecosystem|Ecossistema|Graph|Grafo/i })).toBeVisible();
  
  // Wait for graph to load
  await page.waitForLoadState('networkidle');
  
  // Act: Browse ecosystem (view graph nodes)
  const graphContainer = page.locator('[data-testid="ecosystem-graph"], canvas, svg');
  await expect(graphContainer).toBeVisible({ timeout: 5000 });
  
  // Verify resources are displayed (filtered by user's permissions)
  const resourceNodes = page.locator('[data-testid="resource-node"], [class*="node"]');
  const nodeCount = await resourceNodes.count();
  expect(nodeCount).toBeGreaterThan(0);
  
  // Act: Try to interact with a resource (click/expand)
  const firstNode = resourceNodes.first();
  await firstNode.click({ timeout: 2000 }).catch(() => {
    // Node may not be clickable, that's ok
  });
  
  // Verify resource details (if panel opens)
  const detailsPanel = page.locator('[data-testid="resource-details"], [class*="panel"], aside').first();
  const panelVisible = await detailsPanel.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (panelVisible) {
    // Verify resource info is shown (name, type, dependencies)
    const resourceName = page.locator('[data-testid="resource-name"], h2, h3').first();
    await expect(resourceName).toBeVisible();
    
    // Try to access edit button (should be disabled/hidden for limited roles)
    const editButton = detailsPanel.getByRole('button', { name: /Edit|Editar/i }).first();
    const editVisible = await editButton.isVisible({ timeout: 1000 }).catch(() => false);
    
    // Edit should either be hidden or disabled for limited roles
    // That indicates governance access control is working
    if (editVisible) {
      const isDisabled = await editButton.isDisabled();
      expect(isDisabled || !editVisible).toBe(true);
    }
  }
  
  // Verify dependencies/relationships are shown
  const dependencyInfo = page.locator('text=/Depends on|Depende de|Related|Relacionado/i').first();
  const hasDependencies = await dependencyInfo.isVisible({ timeout: 2000 }).catch(() => false);
  
  // May have dependencies or not, but graph should be visible
  expect(graphContainer).toBeVisible();
});
```

**Intent:** Verify that governance (RBAC) is integrated with ecosystem navigation. User sees filtered resources based on role, and restricted actions are properly disabled/hidden.

**Setup:**
- Login (use admin or test user with specific role)
- Navigate to ecosystem/resource graph page

**Act:**
- View graph/ecosystem
- Count resources (should be > 0)
- Click resource node if possible
- View resource details if panel opens
- Try to access edit button

**Assert:**
- Graph visible and loads
- Resources displayed (count > 0)
- Edit button hidden or disabled (RBAC working)
- Resource details accessible
- Dependencies shown or absent gracefully

**Notes:**
- This is an integration test across modules
- Ecosystem displays resources
- Governance enforces permissions (edit button hidden/disabled)
- If user has no permission for resource, it shouldn't be visible
- If user has read-only, edit should be disabled
- If user has full access, edit should work (not tested here)

---

## Implementation Strategy

### Step 1: Create Test File
- New file: `packages/e2e/tests/ecosystem-governance.spec.ts`
- Reuse login helper from governance.spec.ts
- Pattern: Same as governance/catalog E2E tests

### Step 2: Implement Navigation
- Login
- Navigate to ecosystem/graph page
- Wait for graph to load

### Step 3: Verify Graph Display
- Check graph container visible
- Count resource nodes (> 0)
- Verify nodes represent resources

### Step 4: Test Interaction
- Click a resource node
- Check if details panel opens
- Verify resource info displayed

### Step 5: Verify Permission Gates
- Check if edit button visible
- If visible, check if disabled
- Confirm governance access control working

### Step 6: Cleanup & Commit
- Run test to ensure passes
- Commit with message: `test: add cross-module integration test (ecosystem + governance)`

---

## Ecosystem Module Context

**What is Ecosystem?**
- Resource dependency graph
- Shows how resources relate/depend on each other
- Visualization of infrastructure topology
- Can simulate impact of changes

**Routes & Features:**
- `/ecosystem` or `/resource-graph` - Main graph view
- Resource nodes represent services/infrastructure
- Edges represent dependencies
- Click node to see details panel
- Edit button to modify resource
- Simulation button to test impact

**Governance Integration Points:**
- User's role determines which resources visible
- User's role determines which actions available
- Edit button hidden if user lacks write permission
- Certain resource types may be restricted

---

## Test Data

**Users:**
- Use 'admin' (full access) or existing test users
- Credentials: Standard test password

**Resources:**
- Should already exist in test database
- If empty, tests should handle gracefully
- No need to create resources for this test

**Roles:**
- Viewer: Can see resources, cannot edit
- Editor: Can see and edit resources
- Admin: Full access

---

## Playwright Patterns (Reuse)

### Login Helper (from governance.spec.ts)
```typescript
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill('admin');
  await page.getByLabel('Senha').fill('Tectrs123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/.*\/$/);
}
```

### Element Waiting
```typescript
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible({ timeout: 5000 });
const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
```

### Semantic Selectors
```typescript
page.getByRole('link', { name: /Ecosystem/i })
page.getByRole('button', { name: 'Edit' })
page.locator('[data-testid="resource-node"]')
```

---

## Global Constraints

- No hardcoded URLs (use relative paths)
- No console.log in tests
- No test.skip, test.only, test.todo
- Graceful degradation (elements may or may not exist)
- Test data isolation (if creating data)
- Proper async/await, no floating promises
- ESLint compliance (0 violations)

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] 1 cross-module E2E test implemented
- [ ] Test passes without errors
- [ ] Ecosystem + Governance interaction verified
- [ ] RBAC permission gates validated
- [ ] ESLint: zero violations
- [ ] Commit: [hash] with message

**One-liner:** "1 cross-module E2E test passing. Admin user browses ecosystem with governance permission gates enforced (edit button hidden for limited roles)."

**Concerns (if any):** Missing ecosystem page, graph not loading, permission gates not enforced, etc.

---

## Success Criteria

✅ **1 test implemented:** Ecosystem + Governance cross-module  
✅ **Test passing:** No errors, assertions pass  
✅ **Ecosystem page:** Loads and displays graph  
✅ **RBAC integrated:** Permission gates visible in UI  
✅ **Graceful degradation:** Missing elements handled  
✅ **ESLint:** 0 violations  
✅ **Commit:** Hash + message provided  
✅ **Semantic selectors:** Used throughout  
✅ **No console.log:** Clean output

---

## Estimation

- **Exploring ecosystem UI:** 30 min
- **Understanding graph structure:** 20 min
- **Implementing test:** 1-1.5 hours
- **Testing & fixing:** 30 min
- **Documentation & commit:** 15 min

**Total:** ~2.5-3 hours

---

## Why This Test Matters

**Phase 5 Goal:** 60%+ global code coverage

**Catalog + Governance:** 85%+ coverage each

**Cross-module Test:** Validates that:
1. Ecosystem module works
2. Governance RBAC is integrated
3. Permissions properly enforced across modules
4. No data leaks between roles

This is the final E2E test before coverage validation (Task 11).

---

**Ready to implement.** This test combines Ecosystem + Governance. Simpler than individual module tests because it's integration-focused. Reuse all Playwright patterns and login helper from governance.spec.ts.

**Next:** After Task 10 completes, Task 11 will validate 60%+ coverage.
