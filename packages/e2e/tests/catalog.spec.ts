import { expect, test, type Page } from '@playwright/test';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill('admin');
  await page.getByLabel('Senha').fill('Tectrs123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/.*\/$/);
}

test.describe('Catalog Workflows', () => {
  test('user creates new resource in catalog', async ({ page }) => {
    await login(page);

    // Navigate to catalog page
    await page.getByRole('link', { name: 'Catalog' }).click();
    await expect(page.getByRole('heading', { name: /Catalog|Catálogo/i })).toBeVisible();

    // Click "Create Resource" button to open form
    await page.getByRole('button', { name: /Create Resource|Criar Recurso/i }).click();
    await expect(page.getByRole('heading', { name: /Create|Criar/i })).toBeVisible({ timeout: 5000 });

    // Generate unique resource name
    const uniqueName = `resource-${Date.now()}`;
    const resourceType = 'api';
    const resourceKind = 'application';

    // Fill form fields
    await page.getByLabel(/Name|Nome/i).fill(uniqueName);
    await page.getByLabel(/Kind|Tipo/i).selectOption(resourceKind);
    await page.getByLabel(/Type|Subtipo/i).fill(resourceType);
    await page.getByLabel(/Namespace|Namespace/i).fill('production');

    // Submit form
    await page.getByRole('button', { name: /Create|Criar/i }).click();

    // Wait for form to close and navigate back to list
    await expect(page.getByRole('heading', { name: /Create|Criar/i })).not.toBeVisible({ timeout: 5000 });

    // Verify resource appears in list
    const resourceRow = page.locator('tr', { hasText: uniqueName });
    await expect(resourceRow).toBeVisible({ timeout: 5000 });
    await expect(resourceRow).toContainText(resourceType);
  });

  test('user exports catalog as CSV', async ({ page }) => {
    await login(page);

    // Navigate to catalog page
    await page.getByRole('link', { name: 'Catalog' }).click();
    await expect(page.getByRole('heading', { name: /Catalog|Catálogo/i })).toBeVisible();

    // Wait for table to load
    await page.waitForLoadState('networkidle');

    // Check if catalog is empty
    const emptyState = page.locator('text=/Nenhum recurso|No resources/i');
    const isEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    // If empty, create a resource first
    if (isEmpty) {
      await page.getByRole('button', { name: /Create Resource|Criar Recurso/i }).click();
      await expect(page.getByRole('heading', { name: /Create|Criar/i })).toBeVisible();

      const uniqueName = `export-test-${Date.now()}`;
      await page.getByLabel(/Name|Nome/i).fill(uniqueName);
      await page.getByLabel(/Kind|Tipo/i).selectOption('server');
      await page.getByLabel(/Type|Subtipo/i).fill('compute');
      await page.getByRole('button', { name: /Create|Criar/i }).click();

      await page.waitForLoadState('networkidle');
    }

    // Click export button and capture download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export.*CSV|Exportar.*CSV/i }).click();
    const download = await downloadPromise;

    // Verify download filename matches pattern
    expect(download.suggestedFilename()).toMatch(/catalog.*\.csv/i);
  });

  test('user performs bulk tag management', async ({ page }) => {
    await login(page);

    // Navigate to catalog page
    await page.getByRole('link', { name: 'Catalog' }).click();
    await expect(page.getByRole('heading', { name: /Catalog|Catálogo/i })).toBeVisible();

    // Create 3 test resources
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Create Resource|Criar Recurso/i }).click();
      await expect(page.getByRole('heading', { name: /Create|Criar/i })).toBeVisible();

      const uniqueName = `bulk-test-${Date.now()}-${i}`;
      await page.getByLabel(/Name|Nome/i).fill(uniqueName);
      await page.getByLabel(/Kind|Tipo/i).selectOption('application');
      await page.getByLabel(/Type|Subtipo/i).fill('api');
      await page.getByRole('button', { name: /Create|Criar/i }).click();

      await page.waitForLoadState('networkidle');
    }

    // Select multiple resources via checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    // Select first 2 checkboxes (skip header if present)
    const selectCount = Math.min(2, checkboxCount);
    for (let i = 0; i < selectCount; i++) {
      await checkboxes.nth(i).check();
    }

    // Click bulk actions or "Add Tags" button
    await page.getByRole('button', { name: /Add Tags|Tags|Adicionar Tags/i }).click();

    // Fill tags field in modal or form
    const tagsInput = page.getByLabel(/Tags|Etiquetas/i).first();
    await tagsInput.fill('prod, critical, monitored');

    // Submit
    await page.getByRole('button', { name: /Apply|Save|Aplicar|Salvar/i }).click();

    // Wait for operation to complete
    await page.waitForLoadState('networkidle');

    // Verify tags appear on first selected resource
    const firstResourceRow = page.locator('tr').nth(1); // Skip header
    const hasTags = await firstResourceRow
      .locator('text=/prod|critical|monitored/i')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasTags).toBe(true);
  });
});
