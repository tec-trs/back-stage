import { expect, test, type Page } from '@playwright/test';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill('admin');
  await page.getByLabel('Senha').fill('ChangeMe123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
}

async function selectRow(page: Page, hasText: string) {
  const row = page.locator('tr', { hasText });
  await row.getByRole('radio').click();
  return row;
}

test('admin cria, edita e inativa um usuario pela tela de Usuarios', async ({ page }) => {
  const uniqueCode = `qa.${Date.now()}`;
  const uniqueEmail = `${uniqueCode}@back-stage.dev`;

  await login(page);
  await page.getByRole('link', { name: 'Usuarios' }).click();
  await expect(page.getByRole('heading', { name: 'Usuarios' })).toBeVisible();

  // Criar usuario
  await page.getByRole('button', { name: '+ Novo Usuario' }).click();
  await expect(page.getByRole('heading', { name: 'Novo Usuario' })).toBeVisible();
  await page.getByPlaceholder('maria.souza', { exact: true }).fill(uniqueCode);
  await page.getByPlaceholder('Maria Souza').fill('QA Tester');
  await page.getByPlaceholder('maria.souza@back-stage.dev').fill(uniqueEmail);
  await page.getByLabel('Senha (minimo 8 caracteres) *').fill('SenhaForte123!');
  await page.getByRole('button', { name: 'Criar usuario' }).click();

  await expect(page.getByRole('heading', { name: 'Novo Usuario' })).not.toBeVisible();
  const row = page.locator('tr', { hasText: uniqueEmail });
  await expect(row).toBeVisible();
  await expect(row.getByText('Visualizador')).toBeVisible();
  await expect(row.getByText('Ativo')).toBeVisible();

  // Selecionar e editar usuario (codigo deve estar bloqueado)
  await selectRow(page, uniqueEmail);
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuario' })).toBeVisible();
  const codeInput = page.getByLabel('Codigo de usuario *');
  await expect(codeInput).toBeDisabled();
  await expect(codeInput).toHaveValue(uniqueCode);
  await page.getByPlaceholder('Maria Souza').fill('QA Tester Editado');
  await page.getByRole('button', { name: 'Salvar alteracoes' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuario' })).not.toBeVisible();
  await expect(page.locator('tr', { hasText: uniqueEmail })).toContainText('QA Tester Editado');

  // Inativar usuario selecionado
  await selectRow(page, uniqueEmail);
  await page.getByRole('button', { name: 'Inativar' }).click();
  const updatedRow = page.locator('tr', { hasText: uniqueEmail });
  await expect(updatedRow.getByText('Inativo')).toBeVisible();

  // Reativar usuario
  await selectRow(page, uniqueEmail);
  await page.getByRole('button', { name: 'Ativar' }).click();
  await expect(updatedRow.getByText('Ativo')).toBeVisible();
});

test('admin nao consegue inativar nem eliminar a propria conta', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Usuarios' }).click();

  await selectRow(page, 'admin@back-stage.dev');
  await expect(page.getByRole('button', { name: 'Inativar' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
});

test('admin redefine a senha de um usuario e o novo login funciona', async ({ page }) => {
  const uniqueCode = `qa.pwd.${Date.now()}`;
  const uniqueEmail = `${uniqueCode}@back-stage.dev`;

  await login(page);
  await page.getByRole('link', { name: 'Usuarios' }).click();

  await page.getByRole('button', { name: '+ Novo Usuario' }).click();
  await page.getByPlaceholder('maria.souza', { exact: true }).fill(uniqueCode);
  await page.getByPlaceholder('Maria Souza').fill('QA Password Tester');
  await page.getByPlaceholder('maria.souza@back-stage.dev').fill(uniqueEmail);
  await page.getByLabel('Senha (minimo 8 caracteres) *').fill('SenhaOriginal123!');
  await page.getByRole('button', { name: 'Criar usuario' }).click();
  await expect(page.getByRole('heading', { name: 'Novo Usuario' })).not.toBeVisible();

  await selectRow(page, uniqueEmail);
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuario' })).toBeVisible();
  await page.getByLabel('Nova senha (minimo 8 caracteres)').fill('SenhaNova456!');
  await page.getByRole('button', { name: 'Salvar alteracoes' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuario' })).not.toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Codigo de usuario').fill(uniqueCode);
  await page.getByLabel('Senha').fill('SenhaNova456!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
});

test('admin elimina um usuario e ele desaparece da lista', async ({ page }) => {
  const uniqueCode = `qa.del.${Date.now()}`;
  const uniqueEmail = `${uniqueCode}@back-stage.dev`;

  await login(page);
  await page.getByRole('link', { name: 'Usuarios' }).click();

  await page.getByRole('button', { name: '+ Novo Usuario' }).click();
  await page.getByPlaceholder('maria.souza', { exact: true }).fill(uniqueCode);
  await page.getByPlaceholder('Maria Souza').fill('QA Delete Tester');
  await page.getByPlaceholder('maria.souza@back-stage.dev').fill(uniqueEmail);
  await page.getByLabel('Senha (minimo 8 caracteres) *').fill('SenhaForte123!');
  await page.getByRole('button', { name: 'Criar usuario' }).click();
  await expect(page.getByRole('heading', { name: 'Novo Usuario' })).not.toBeVisible();

  await expect(page.locator('tr', { hasText: uniqueEmail })).toBeVisible();
  await selectRow(page, uniqueEmail);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Eliminar' }).click();

  await expect(page.locator('tr', { hasText: uniqueEmail })).toHaveCount(0);
});
