import { expect, test, type Page } from '@playwright/test';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill('admin');
  await page.getByLabel('Senha').fill('Tectrs123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
}

async function selectRow(page: Page, hasText: string) {
  const row = page.locator('tr', { hasText });
  await row.getByRole('radio').click();
  return row;
}

test('admin cadastra servidor, aplicacao vinculada e ve o grafo do ecossistema', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const hostname = `web-${uniqueSuffix}.prod`;
  const appCode = `app-${uniqueSuffix}`;

  await login(page);

  // Criar servidor
  await page.getByRole('link', { name: 'Servidores' }).click();
  await expect(page.getByRole('heading', { name: 'Servidores' })).toBeVisible();
  await page.getByRole('button', { name: 'Incluir Servidor' }).click();
  await expect(page.getByRole('heading', { name: 'Incluir Servidor' })).toBeVisible();
  await page.getByPlaceholder('web-01.prod').fill(hostname);
  await page.getByRole('button', { name: 'Criar servidor' }).click();
  await expect(page.getByRole('heading', { name: 'Incluir Servidor' })).not.toBeVisible();
  await expect(page.locator('tr', { hasText: hostname })).toBeVisible();

  // Criar aplicacao
  await page.getByRole('link', { name: 'Aplicacoes' }).click();
  await expect(page.getByRole('heading', { name: 'Aplicacoes' })).toBeVisible();
  await page.getByRole('button', { name: 'Incluir Aplicacao' }).click();
  await expect(page.getByRole('heading', { name: 'Incluir Aplicacao' })).toBeVisible();
  await page.getByPlaceholder('billing-api').fill(appCode);
  await page.getByPlaceholder('Billing API').fill(`App ${uniqueSuffix}`);
  await page.getByRole('button', { name: 'Criar aplicacao' }).click();
  await expect(page.getByRole('heading', { name: 'Incluir Aplicacao' })).not.toBeVisible();
  await expect(page.getByText(`App ${uniqueSuffix}`)).toBeVisible();

  // Editar e inativar a aplicacao pela barra de acoes
  await selectRow(page, `App ${uniqueSuffix}`);
  await page.getByRole('button', { name: 'Desativar' }).click();
  await expect(page.locator('tr', { hasText: `App ${uniqueSuffix}` })).toContainText('Desativada');

  // Ver o grafo do ecossistema
  await page.getByRole('link', { name: 'Ecossistema' }).click();
  await expect(page.getByRole('heading', { name: 'Ecossistema' })).toBeVisible();
  await expect(page.getByText('Servidor', { exact: true })).toBeVisible();
  await expect(page.getByText('Aplicacao', { exact: true })).toBeVisible();
  await expect(page.locator('svg[aria-label="Grafo do ecossistema de servidores e aplicacoes"]')).toBeVisible();
});

test('admin bloqueia hostname na edicao de servidor', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const hostname = `edit-${uniqueSuffix}.prod`;

  await login(page);
  await page.getByRole('link', { name: 'Servidores' }).click();

  await page.getByRole('button', { name: 'Incluir Servidor' }).click();
  await page.getByPlaceholder('web-01.prod').fill(hostname);
  await page.getByRole('button', { name: 'Criar servidor' }).click();
  await expect(page.getByRole('heading', { name: 'Incluir Servidor' })).not.toBeVisible();

  await selectRow(page, hostname);
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Servidor' })).toBeVisible();
  await expect(page.getByLabel('Hostname *')).toBeDisabled();
  await expect(page.getByLabel('Hostname *')).toHaveValue(hostname);
});
