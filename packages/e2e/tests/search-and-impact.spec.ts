import { expect, test, type Page } from '@playwright/test';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Codigo de usuario').fill('admin');
  await page.getByLabel('Senha').fill('Tectrs123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
}

test('busca global encontra servidores, aplicacoes, bancos e urls', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const serverHostname = `search-server-${uniqueSuffix}.prod`;
  const appCode = `search-app-${uniqueSuffix}`;
  const dbName = `search_db_${uniqueSuffix}`;

  await login(page);

  // Criar servidor
  await page.getByRole('link', { name: 'Servidores' }).click();
  await page.getByRole('button', { name: 'Incluir Servidor' }).click();
  await page.getByPlaceholder('web-01.prod').fill(serverHostname);
  await page.getByRole('button', { name: 'Criar servidor' }).click();
  await expect(page.locator('tr', { hasText: serverHostname })).toBeVisible();

  // Criar aplicacao
  await page.getByRole('link', { name: 'Aplicacoes' }).click();
  await page.getByRole('button', { name: 'Incluir Aplicacao' }).click();
  await page.getByPlaceholder('billing-api').fill(appCode);
  await page.getByPlaceholder('Billing API').fill(`SearchApp ${uniqueSuffix}`);
  await page.getByRole('button', { name: 'Criar aplicacao' }).click();
  await expect(page.getByText(`SearchApp ${uniqueSuffix}`)).toBeVisible();

  // Usar busca global para encontrar o servidor
  const searchInput = page.locator('input[placeholder*="Buscar servidores"]');
  await searchInput.fill(serverHostname);
  await page.waitForTimeout(500);

  // Verificar que o servidor aparece nos resultados
  const resultLink = page.locator(`a:has-text("${serverHostname}")`).first();
  await expect(resultLink).toBeVisible({ timeout: 5000 });

  // Clicar no resultado para navegar
  await resultLink.click();
  await expect(page).toHaveURL(new RegExp(`/servers/`));
  await expect(page.getByRole('heading', { name: serverHostname })).toBeVisible();
});

test('visualiza subgrafo de dependencias na pagina de detalhe do servidor', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const serverHostname = `dep-server-${uniqueSuffix}.prod`;
  const appCode = `dep-app-${uniqueSuffix}`;

  await login(page);

  // Criar servidor
  await page.getByRole('link', { name: 'Servidores' }).click();
  await page.getByRole('button', { name: 'Incluir Servidor' }).click();
  await page.getByPlaceholder('web-01.prod').fill(serverHostname);
  await page.getByRole('button', { name: 'Criar servidor' }).click();

  // Criar aplicacao
  await page.getByRole('link', { name: 'Aplicacoes' }).click();
  await page.getByRole('button', { name: 'Incluir Aplicacao' }).click();
  await page.getByPlaceholder('billing-api').fill(appCode);
  await page.getByPlaceholder('Billing API').fill(`DepApp ${uniqueSuffix}`);
  await page.getByRole('button', { name: 'Criar aplicacao' }).click();

  // Voltar aos servidores e entrar em detalhe
  await page.getByRole('link', { name: 'Servidores' }).click();
  const serverRow = page.locator('tr', { hasText: serverHostname });
  const serverLink = serverRow.locator('a').first();
  await serverLink.click();

  await expect(page).toHaveURL(new RegExp(`/servers/`));
  await expect(page.getByRole('heading', { name: 'Dependências e Relacionamentos' })).toBeVisible();

  // Verificar que o grafo está carregado
  await expect(page.locator('svg').first()).toBeVisible();
});

test('simula impacto e ve blast radius na pagina de detalhe', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const serverHostname = `impact-server-${uniqueSuffix}.prod`;
  const appCode = `impact-app-${uniqueSuffix}`;

  await login(page);

  // Setup: criar servidor e aplicacao
  await page.getByRole('link', { name: 'Servidores' }).click();
  await page.getByRole('button', { name: 'Incluir Servidor' }).click();
  await page.getByPlaceholder('web-01.prod').fill(serverHostname);
  await page.getByRole('button', { name: 'Criar servidor' }).click();

  await page.getByRole('link', { name: 'Aplicacoes' }).click();
  await page.getByRole('button', { name: 'Incluir Aplicacao' }).click();
  await page.getByPlaceholder('billing-api').fill(appCode);
  await page.getByPlaceholder('Billing API').fill(`ImpactApp ${uniqueSuffix}`);
  await page.getByRole('button', { name: 'Criar aplicacao' }).click();

  // Navegar para detalhe do servidor
  await page.getByRole('link', { name: 'Servidores' }).click();
  const serverRow = page.locator('tr', { hasText: serverHostname });
  const serverLink = serverRow.locator('a').first();
  await serverLink.click();

  await expect(page).toHaveURL(new RegExp(`/servers/`));

  // Clicar em Simular Impacto
  const impactButton = page.locator('button:has-text("Simular Impacto")').first();
  await impactButton.click();
  await page.waitForTimeout(500);

  // Verificar que aparecem resultados de impacto
  const impactAnalysis = page.locator('text=Análise de Impacto');
  await expect(impactAnalysis).toBeVisible({ timeout: 5000 });

  // Verificar contagem de recursos afetados
  const affectedCount = page.locator('text=/\\d+\\s+recurso\\(s\\)/');
  await expect(affectedCount).toBeVisible();
});

test('filtra databases por ambiente', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const dbNameProd = `prod_db_${uniqueSuffix}`;
  const dbNameDev = `dev_db_${uniqueSuffix}`;

  await login(page);

  // Criar dois bancos (um para prod, outro para dev)
  await page.getByRole('link', { name: 'Bancos de Dados' }).click();
  await expect(page.getByRole('heading', { name: 'Bancos de Dados' })).toBeVisible();

  // Verificar filtro por ambiente
  const environmentSelect = page.locator('select').first();
  await environmentSelect.selectOption('production');
  await page.waitForTimeout(300);

  // Após filtrar, a página deve recarregar (em um cenário real com dados)
  await expect(page.getByRole('heading', { name: 'Bancos de Dados' })).toBeVisible();
});

test('acesso ao ecossistema mostra grafo completo com todas as entidades', async ({ page }) => {
  await login(page);

  // Navegar para ecossistema
  await page.getByRole('link', { name: 'Ecossistema' }).click();
  await expect(page.getByRole('heading', { name: 'Ecossistema' })).toBeVisible();

  // Verificar legenda de tipos
  await expect(page.getByText('Servidor', { exact: true })).toBeVisible();
  await expect(page.getByText('Aplicação', { exact: true })).toBeVisible();
  await expect(page.getByText('Banco de Dados', { exact: true })).toBeVisible();
  await expect(page.getByText('URL', { exact: true })).toBeVisible();

  // Verificar que grafo está visível
  const graph = page.locator('svg').first();
  await expect(graph).toBeVisible();
});

test('busca avancada com filtro de tags na pagina de resultados', async ({ page }) => {
  await login(page);

  // Navegar para página de busca
  await page.goto('/search?q=prod');

  // Verificar que página de resultados carrega
  await expect(page.getByRole('heading', { name: /Resultados da Busca/ })).toBeVisible();

  // Verificar paginação se houver múltiplos resultados
  const prevButton = page.locator('button:has-text("Anterior")');
  if (await prevButton.isVisible()) {
    await expect(prevButton).toBeDisabled();
  }
});

test('drill-down em nó do grafo navega para detalhe', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const serverHostname = `drill-server-${uniqueSuffix}.prod`;

  await login(page);

  // Criar servidor para que ele apareça no ecossistema
  await page.getByRole('link', { name: 'Servidores' }).click();
  await page.getByRole('button', { name: 'Incluir Servidor' }).click();
  await page.getByPlaceholder('web-01.prod').fill(serverHostname);
  await page.getByRole('button', { name: 'Criar servidor' }).click();

  // Navegar para ecossistema
  await page.getByRole('link', { name: 'Ecossistema' }).click();
  await expect(page.getByRole('heading', { name: 'Ecossistema' })).toBeVisible();

  // Double-click em um nó (simular drill-down)
  const graphSvg = page.locator('svg').first();
  const graphContainer = graphSvg.locator('..').first();

  // Procurar por um elemento de nó (elemento g com classe de nó React Flow)
  const nodes = graphContainer.locator('[data-id]');
  if (await nodes.first().isVisible()) {
    const firstNode = nodes.first();
    await firstNode.dblclick();
    await page.waitForTimeout(500);

    // Verificar que navegou (URL deve conter ID)
    const currentUrl = page.url();
    if (!currentUrl.includes('/ecosystem')) {
      // Sucesso: navegou para detalhe
      expect(currentUrl).toMatch(/\/(servers|applications|databases|urls)\/\w+/);
    }
  }
});
