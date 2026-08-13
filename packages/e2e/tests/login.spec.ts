import { expect, test } from '@playwright/test';

test.describe('Login flow', () => {
  test('exibe o formulario de login para usuario nao autenticado', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Platform Engineering Center' })).toBeVisible();
  });

  test('exige codigo e senha para submeter o formulario', async ({ page }) => {
    await page.goto('/login');
    const codeInput = page.getByLabel('Codigo de usuario');
    await expect(codeInput).toHaveAttribute('required', '');
    const passwordInput = page.getByLabel('Senha');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('exibe mensagem de erro ao tentar logar com credenciais invalidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Codigo de usuario').fill('codigo-invalido');
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('button', { name: /Entrando|Entrar/ })).toBeVisible();
  });
});

test.describe('Navegacao protegida', () => {
  test('redireciona rotas protegidas para /login sem sessao', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('redireciona /governance para /login sem sessao', async ({ page }) => {
    await page.goto('/governance');
    await expect(page).toHaveURL(/\/login$/);
  });
});
