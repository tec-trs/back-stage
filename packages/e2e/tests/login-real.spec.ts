import { expect, test } from '@playwright/test';

test('login com credenciais reais leva ao dashboard com dados do backend', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@back-stage.dev');
  await page.getByLabel('Senha').fill('ChangeMe123!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL('http://localhost:5173/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('backend ok')).toBeVisible();

  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page.getByRole('link', { name: 'Backend API' })).toBeVisible();
});
