import { expect, test } from '@playwright/test';

test('login com credenciais reais leva ao dashboard com dados do backend', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill('admin');
  await page.getByLabel('Senha').fill('ChangeMe123!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL('http://localhost:5173/');
  await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible();
  await expect(page.getByText('backend operacional')).toBeVisible();

  await page.getByRole('link', { name: 'Catalogo' }).click();
  await expect(page.getByRole('link', { name: 'Backend API' })).toBeVisible();
});
