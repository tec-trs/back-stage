# Task 6 Brief: Search E2E Tests

**Where this fits:** Task 6 adds 3 end-to-end tests for search workflows in Playwright. These test the search feature from the user's perspective (UI → backend).

---

## What You're Building

**File to create:**
`e2e/tests/search.spec.ts`

**3 E2E Tests (Playwright):**
1. Global search from header
2. Filter results by type
3. Navigate to resource detail from search

**Framework:** Playwright (already configured from Phase 3)

**Test data:** Use Playwright UI to create test data (no API seeding needed for E2E)

---

## Test Specifications

### Test 1: Global search from header
```typescript
test('global search from header', async ({ page }) => {
  await page.goto('/dashboard');
  await page.fill('input[placeholder="Search..."]', 'postgres');
  await page.press('input[placeholder="Search..."]', 'Enter');
  
  await page.waitForURL('**/search?q=postgres');
  const results = page.locator('[data-testid="search-result"]');
  await expect(results).not.toHaveCount(0);
});
```

**Intent:** Verify search bar in header works.  
**Setup:** Navigate to dashboard  
**Act:** Type 'postgres' in search input and press Enter  
**Assert:** Page navigates to /search?q=postgres, results exist (count > 0)  
**Notes:**
- Adjust `[placeholder="Search..."]` selector if your app uses different placeholder
- Use `[data-testid="search-result"]` for result items (add if missing)

### Test 2: Filter results by type
```typescript
test('filter results by type', async ({ page }) => {
  await page.goto('/search?q=svc');
  await page.click('button:has-text("Applications")');
  
  const results = page.locator('[data-testid="search-result"]');
  // Verify all results are applications
  await expect(results.first()).toContainText(/Application|App/);
});
```

**Intent:** Verify type filtering works.  
**Setup:** Navigate to search results page with 'svc' query  
**Act:** Click "Applications" filter button  
**Assert:** Results show only applications (verify via type label)  
**Notes:**
- Adjust button selector based on your UI (might be 'Applications', 'Apps', etc.)
- Verify filter actually removes non-application results

### Test 3: Navigate to resource detail from search
```typescript
test('navigate to resource detail from search', async ({ page }) => {
  await page.goto('/search?q=prod-01');
  await page.click('[data-testid="search-result"]:first-child');
  
  await page.waitForURL('**/servers/** || **/applications/** || **/databases/**');
  await expect(page.locator('h1')).toContainText('prod-01');
});
```

**Intent:** Verify clicking a search result navigates to detail page.  
**Setup:** Search for 'prod-01'  
**Act:** Click the first result  
**Assert:** Navigates to detail page and page title contains 'prod-01'  
**Notes:**
- Adjust URL pattern based on your app's detail page routes
- Verify the resource name appears in page (h1 or other heading)

---

## Implementation Steps

1. **Create test file** `e2e/tests/search.spec.ts` with `test.describe` block
2. **Implement Test 1** — global search
   - Run: `npm run test:e2e -- search.spec.ts --grep "global search"`
   - Expected: PASS
3. **Implement Test 2** — filter by type
   - Run: `npm run test:e2e -- search.spec.ts --grep "filter results"`
   - Expected: PASS
4. **Implement Test 3** — navigate to detail
   - Run: `npm run test:e2e -- search.spec.ts --grep "navigate to resource"`
   - Expected: PASS
5. **Run all 3 tests:** `npm run test:e2e -- search.spec.ts`
   - Expected: 3/3 passing
6. **Verify no console errors** (Playwright captures these)
7. **Commit** with message: `test: add search E2E tests (3 tests)`

---

## Playwright Selectors

Common selectors for your app (adjust based on actual HTML):
- Input: `input[placeholder="..."]` or `input[aria-label="..."]`
- Button: `button:has-text("text")` or `[data-testid="..."]`
- List items: `[data-testid="search-result"]` (add to HTML if missing)
- Headings: `h1`, `h2`, etc.

**If selectors fail:** Use Playwright Inspector to find correct selectors:
```bash
npx playwright codegen http://localhost:3000
```

---

## Global Constraints

- No hardcoded URLs (use `/search?q=...` relative paths)
- No console.log in tests
- No test.skip, test.only, test.todo in committed code
- Use semantic selectors (data-testid preferred over brittle CSS selectors)
- Timeouts: let Playwright use defaults (30s)
- No polling loops — use page.waitForURL, page.waitForSelector, etc.

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] 3 E2E tests implemented and passing
- [ ] No console errors during test runs
- [ ] Playwright selectors verified (screenshots or logs if needed)
- [ ] Test data isolation (tests don't interfere with each other)
- [ ] Commit: [hash] with message

**One-liner:** "3 search E2E tests passing. Global search, type filtering, and detail navigation verified."

**Concerns (if any):** Flaky selectors, missing test-ids, data setup issues, etc.

