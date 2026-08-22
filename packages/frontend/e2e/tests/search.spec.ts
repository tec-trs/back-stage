import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication state in localStorage
    const authState = {
      state: {
        accessToken: 'test-token-' + Math.random().toString(36).substring(2, 15),
        user: {
          id: 'test-user-1',
          code: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['user'],
        },
        organizationId: 'test-org-1',
        organizationName: 'Test Organization',
        organizations: [
          {
            id: 'test-org-1',
            slug: 'test-org',
            name: 'Test Organization',
          },
        ],
      },
      version: 0,
    };

    // Inject auth state into localStorage before navigating
    await page.addInitScript((auth) => {
      localStorage.setItem('back-stage-auth', JSON.stringify(auth));
    }, authState);

    // Navigate to the dashboard
    await page.goto('/');
  });

  test('global search from header', async ({ page }) => {
    // Fill the global search input
    const searchInput = page.locator('[data-testid="global-search-input"]');
    await searchInput.fill('postgres');

    // Press Enter to navigate to search results
    await searchInput.press('Enter');

    // Wait for navigation to /search page with query parameter
    await page.waitForURL('**/search?q=postgres');

    // Verify search results exist
    const results = page.locator('[data-testid="search-result"]');
    await expect(results).not.toHaveCount(0);
  });

  test('filter results by type', async ({ page }) => {
    // Navigate directly to search results page with a query
    await page.goto('/search?q=svc');

    // Wait for search results to be visible
    await page.locator('[data-testid="search-result"]').first().waitFor({ state: 'visible', timeout: 5000 });

    // Click the application type filter button
    const applicationFilter = page.locator('[data-testid="filter-application"]');
    await applicationFilter.click();

    // Wait for URL to update with type filter parameter
    await page.waitForURL(/\/search\?q=svc.*type=application/, { timeout: 5000 });

    // Wait for filtered results to be visible after filter is applied
    await page.locator('[data-testid="search-result"]').first().waitFor({ state: 'visible', timeout: 5000 });

    // Verify at least one result exists
    const results = page.locator('[data-testid="search-result"]');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('navigate to resource detail from search', async ({ page }) => {
    // Navigate to search results page with a specific query
    await page.goto('/search?q=prod-01');

    // Wait for search results to be visible
    await page.locator('[data-testid="search-result"]').first().waitFor({ state: 'visible', timeout: 5000 });

    // Click the first search result
    const firstResult = page.locator('[data-testid="search-result"]').first();
    await firstResult.click();

    // Wait for navigation to detail page
    // The detail page URL pattern could be /servers/*, /applications/*, /databases/*, or /urls/*
    await page.waitForURL(/\/(servers|applications|databases|urls)\/[^/]+$/, { timeout: 5000 });

    // Verify the page has a heading element
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });
});
