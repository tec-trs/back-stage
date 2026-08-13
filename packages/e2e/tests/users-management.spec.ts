import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@back-stage.dev');
  await page.getByLabel('Senha').fill('ChangeMe123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
}

test('admin cria, edita e inativa um usuario pela tela de Usuarios', async ({ page }) => {
  const uniqueEmail = `qa.${Date.now()}@back-stage.dev`;

  await login(page);
  await page.getByRole('link', { name: 'Usuarios' }).click();
  await expect(page.getByRole('heading', { name: 'Usuarios' })).toBeVisible();

  // Criar usuario
  await page.getByRole('button', { name: '+ Novo Usuario' }).click();
  await expect(page.getByRole('heading', { name: 'Novo Usuario' })).toBeVisible();
  await page.getByPlaceholder('Maria Souza').fill('QA Tester');
  await page.getByPlaceholder('maria.souza@back-stage.dev').fill(uniqueEmail);
  await page.getByLabel('Senha (minimo 8 caracteres) *').fill('SenhaForte123!');
  await page.getByRole('button', { name: 'Criar usuario' }).click();

  await expect(page.getByRole('heading', { name: 'Novo Usuario' })).not.toBeVisible();
  const row = page.locator('tr', { hasText: uniqueEmail });
  await expect(row).toBeVisible();
  await expect(row.getByText('Visualizador')).toBeVisible();
  await expect(row.getByText('Ativo')).toBeVisible();

  // Editar usuario
  await row.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuario' })).toBeVisible();
  await page.getByPlaceholder('Maria Souza').fill('QA Tester Editado');
  await page.getByRole('button', { name: 'Salvar alteracoes' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuario' })).not.toBeVisible();
  await expect(page.locator('tr', { hasText: uniqueEmail })).toContainText('QA Tester Editado');

  // Inativar usuario
  const updatedRow = page.locator('tr', { hasText: uniqueEmail });
  await updatedRow.getByRole('button', { name: 'Inativar' }).click();
  await expect(updatedRow.getByText('Inativo')).toBeVisible();
  await expect(updatedRow.getByRole('button', { name: 'Ativar' })).toBeVisible();

  // Reativar usuario
  await updatedRow.getByRole('button', { name: 'Ativar' }).click();
  await expect(updatedRow.getByText('Ativo')).toBeVisible();
});

test('admin nao consegue inativar a propria conta', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Usuarios' }).click();

  const adminRow = page.locator('tr', { hasText: 'admin@back-stage.dev' });
  const deactivateButton = adminRow.getByRole('button', { name: 'Inativar' });
  await expect(deactivateButton).toBeDisabled();
});
