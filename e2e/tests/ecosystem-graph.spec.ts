import { test, expect } from '@playwright/test';

test.describe('Ecosystem Graph', () => {
  test('should load ecosystem graph page', async ({ page }) => {
    await page.goto('/ecosystem');

    await expect(page).toHaveTitle(/ecosystem|graph/i);

    const graphContainer = page.locator('[data-testid="ecosystem-graph"]');
    await expect(graphContainer).toBeVisible();
  });

  test('should render server and application nodes', async ({ page }) => {
    await page.goto('/ecosystem');

    await page.waitForLoadState('networkidle');

    // Just verify nodes are present (exact node count varies based on test data)
    const nodes = page.locator('[data-testid="node"]');
    const nodeCount = await nodes.count();

    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should have graph canvas or SVG', async ({ page }) => {
    await page.goto('/ecosystem');

    await page.waitForLoadState('networkidle');

    // Check for either SVG or Canvas element used for graph rendering
    const svgPresent = await page.locator('svg').isVisible({ timeout: 5000 }).catch(() => false);
    const canvasPresent = await page.locator('canvas').isVisible({ timeout: 5000 }).catch(() => false);

    expect(svgPresent || canvasPresent).toBe(true);
  });
});
