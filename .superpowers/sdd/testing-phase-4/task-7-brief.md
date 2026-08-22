# Task 7 Brief: URLs E2E Tests

**Where this fits:** Task 7 adds 3 end-to-end tests for URLs workflows in Playwright. Same pattern as Task 6 (search E2E).

---

## What You're Building

**File to create:**
`e2e/tests/urls.spec.ts`

**3 E2E Tests (Playwright):**
1. Create URL from UI
2. Monitor health status changes
3. Export URL list

**Framework:** Playwright

---

## Test Specifications

### Test 1: Create URL from UI
```typescript
test('create URL from UI', async ({ page }) => {
  await page.goto('/urls');
  await page.click('button:has-text("Create URL")');
  
  // Fill form
  await page.fill('input[name="url"]', 'https://api.example.com/health');
  await page.fill('input[name="description"]', 'Health check endpoint');
  await page.click('button:has-text("Create")');
  
  // Verify
  await page.waitForSelector('[data-testid="urls-list"]');
  const list = page.locator('[data-testid="urls-list"]');
  await expect(list).toContainText('api.example.com');
});
```

**Intent:** Verify creating a URL through the UI works.  
**Setup:** Navigate to /urls page  
**Act:** Click Create button, fill form (URL + description), submit  
**Assert:** URL appears in the list  
**Notes:**
- Adjust form field names and selectors based on your app
- Use `data-testid="urls-list"` for the list container (add if missing)

### Test 2: Monitor health status changes
```typescript
test('monitor health status changes', async ({ page }) => {
  await page.goto('/urls');
  
  // Find a URL in the list
  const urlItem = page.locator('[data-testid="url-item"]').first();
  const statusBefore = await urlItem.locator('[data-testid="status"]').textContent();
  
  // Trigger health check
  await urlItem.locator('button:has-text("Check Health")').click();
  
  // Wait for status to update
  await page.waitForTimeout(2000); // Wait for health check to complete
  const statusAfter = await urlItem.locator('[data-testid="status"]').textContent();
  
  // Verify status changed
  expect(statusAfter).toMatch(/healthy|unhealthy/);
});
```

**Intent:** Verify health status updates in real-time.  
**Setup:** Navigate to URLs list  
**Act:** Click "Check Health" button on a URL  
**Assert:** Status updates (shows 'healthy' or 'unhealthy')  
**Notes:**
- Adjust timeout based on your health check API speed
- Status might not change if URL is cached as healthy

### Test 3: Export URL list
```typescript
test('export URL list', async ({ page }) => {
  await page.goto('/urls');
  
  // Click export button
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Export")');
  const download = await downloadPromise;
  
  // Verify download
  expect(download.suggestedFilename()).toMatch(/urls/i);
});
```

**Intent:** Verify export button works.  
**Setup:** Navigate to /urls  
**Act:** Click "Export" button  
**Assert:** File download triggered (CSV/JSON)  
**Notes:**
- Adjust button selector based on your UI
- Export format (CSV/JSON) is flexible; just verify filename

---

## Implementation Steps

1. **Create test file** `e2e/tests/urls.spec.ts` with `test.describe` block
2. **Implement Test 1** — create URL
   - Run: `npm run test:e2e -- urls.spec.ts --grep "create URL"`
   - Expected: PASS
3. **Implement Test 2** — health status
   - Run: `npm run test:e2e -- urls.spec.ts --grep "monitor health"`
   - Expected: PASS
4. **Implement Test 3** — export
   - Run: `npm run test:e2e -- urls.spec.ts --grep "export URL"`
   - Expected: PASS
5. **Run all 3 tests:** `npm run test:e2e -- urls.spec.ts`
   - Expected: 3/3 passing
6. **Commit** with message: `test: add urls E2E tests (3 tests)`

---

## Global Constraints

- No hardcoded URLs (use relative paths like `/urls`)
- No console.log in tests
- No test.skip, test.only, test.todo in committed code
- Use semantic selectors
- No polling loops (use waitForSelector, waitForEvent, etc.)
- Playwright timeout: 30s default

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] 3 E2E tests implemented and passing
- [ ] No console errors
- [ ] Playwright selectors verified
- [ ] Test data isolation
- [ ] Commit: [hash]

**One-liner:** "3 URLs E2E tests passing. Create, health monitoring, and export verified."

**Concerns (if any):** List any issues

