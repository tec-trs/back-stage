import { expect, test, type Page } from '@playwright/test';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill('admin');
  await page.getByLabel('Senha').fill('Tectrs123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/.*\/$/);
}

test.describe('URLs Workflows', () => {
  test('create URL from UI', async ({ page }) => {
    await login(page);

    // Navigate to URLs page
    await page.getByRole('link', { name: 'URLs' }).click();
    await expect(page.getByRole('heading', { name: 'URLs e Endpoints' })).toBeVisible();

    // Click "Incluir URL" button to open create form
    await page.getByRole('button', { name: 'Incluir URL' }).click();
    await expect(page.getByRole('heading', { name: 'Incluir URL' })).toBeVisible();

    // Fill form with unique data
    const uniqueSuffix = Date.now();
    const urlLabel = `Test URL ${uniqueSuffix}`;
    const urlValue = `https://api.example.com/health-${uniqueSuffix}`;
    const urlDescription = `Health check endpoint for test ${uniqueSuffix}`;

    // Fill identification tab fields
    await page.getByPlaceholder('API de Pagamentos — Producao').fill(urlLabel);
    await page.getByPlaceholder('lstotvs.unimedpoa.com.br ou https://api.example.com').fill(urlValue);

    // Fill description (textarea without placeholder)
    const descriptionTextarea = page.locator('textarea');
    await descriptionTextarea.fill(urlDescription);

    // Submit form
    await page.getByRole('button', { name: 'Criar URL' }).click();

    // Wait for dialog to close and URL to appear in list
    await expect(page.getByRole('heading', { name: 'Incluir URL' })).not.toBeVisible({ timeout: 5000 });

    // Verify URL appears in the list
    const urlTableRow = page.locator('tr', { hasText: urlLabel });
    await expect(urlTableRow).toBeVisible({ timeout: 5000 });
    await expect(urlTableRow).toContainText(urlValue);
  });

  test('monitor health status changes', async ({ page }) => {
    await login(page);

    // Navigate to URLs page
    await page.getByRole('link', { name: 'URLs' }).click();
    await expect(page.getByRole('heading', { name: 'URLs e Endpoints' })).toBeVisible();

    // Create a URL with healthcheck enabled
    await page.getByRole('button', { name: 'Incluir URL' }).click();
    await expect(page.getByRole('heading', { name: 'Incluir URL' })).toBeVisible();

    const uniqueSuffix = Date.now();
    const urlLabel = `Healthcheck URL ${uniqueSuffix}`;
    const urlValue = `https://api.example.com/status-${uniqueSuffix}`;
    const urlDescription = `URL for monitoring health status`;

    // Fill identification tab
    await page.getByPlaceholder('API de Pagamentos — Producao').fill(urlLabel);
    await page.getByPlaceholder('lstotvs.unimedpoa.com.br ou https://api.example.com').fill(urlValue);

    // Fill description (textarea without placeholder)
    const descriptionTextarea2 = page.locator('textarea');
    await descriptionTextarea2.fill(urlDescription);

    // Switch to HTTP & Auth tab and enable healthcheck
    await page.getByRole('tab', { name: 'HTTP & Auth' }).click();

    // Enable healthcheck checkbox
    const healthcheckCheckbox = page.locator('input[type="checkbox"][id="healthcheckEnabled"]');
    const isChecked = await healthcheckCheckbox.isChecked();
    if (!isChecked) {
      await healthcheckCheckbox.check();
    }

    // Submit form
    await page.getByRole('button', { name: 'Criar URL' }).click();

    // Wait for dialog to close
    await expect(page.getByRole('heading', { name: 'Incluir URL' })).not.toBeVisible({ timeout: 5000 });

    // Find the newly created URL in the list
    const urlTableRow = page.locator('tr', { hasText: urlLabel });
    await expect(urlTableRow).toBeVisible({ timeout: 5000 });

    // Check that healthcheck column exists and shows expected badge (ok, error, timeout, or pendente)
    const healthcheckCell = urlTableRow.locator('td').nth(4); // Healthcheck is 5th column
    await expect(healthcheckCell).toBeVisible();

    // Verify the healthcheck status shows a badge or pending indicator
    const healthcheckText = await healthcheckCell.textContent();
    expect(healthcheckText).toMatch(/ok|error|timeout|pendente|—/);
  });

  test('export URL list', async ({ page }) => {
    await login(page);

    // Navigate to URLs page
    await page.getByRole('link', { name: 'URLs' }).click();
    await expect(page.getByRole('heading', { name: 'URLs e Endpoints' })).toBeVisible();

    // Wait for table to load
    await page.waitForLoadState('networkidle');

    // Create at least one URL to export (if list is empty)
    const emptyState = page.locator('text=/Nenhuma URL cadastrada/');
    const isEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    if (isEmpty) {
      // Create a URL first
      await page.getByRole('button', { name: 'Incluir URL' }).click();
      await expect(page.getByRole('heading', { name: 'Incluir URL' })).toBeVisible();

      const uniqueSuffix = Date.now();
      const urlLabel = `Export Test URL ${uniqueSuffix}`;
      const urlValue = `https://api.example.com/export-test-${uniqueSuffix}`;

      await page.getByPlaceholder('API de Pagamentos — Producao').fill(urlLabel);
      await page.getByPlaceholder('lstotvs.unimedpoa.com.br ou https://api.example.com').fill(urlValue);

      // Fill description (textarea without placeholder)
      const descriptionTextarea3 = page.locator('textarea');
      await descriptionTextarea3.fill('Test URL for export functionality');

      await page.getByRole('button', { name: 'Criar URL' }).click();
      await expect(page.getByRole('heading', { name: 'Incluir URL' })).not.toBeVisible({ timeout: 5000 });

      // Wait for URL to appear in list
      await page.locator('tr', { hasText: urlLabel }).waitFor({ state: 'visible', timeout: 5000 });
    }

    // Click export button and wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    const download = await downloadPromise;

    // Verify the download filename contains 'urls'
    expect(download.suggestedFilename()).toMatch(/urls/i);
  });
});
