# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ecosystem-graph.spec.ts >> Ecosystem Graph >> should have graph canvas or SVG
- Location: tests\ecosystem-graph.spec.ts:25:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - heading "Platform Engineering Center" [level=1] [ref=e7]
    - paragraph [ref=e8]: Entre com suas credenciais para continuar
  - generic [ref=e9]:
    - generic [ref=e10]: Codigo de usuario
    - textbox "Codigo de usuario" [ref=e11]: admin
  - generic [ref=e12]:
    - generic [ref=e13]: Senha
    - textbox "Senha" [ref=e14]
  - button "Entrar" [ref=e15] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Ecosystem Graph', () => {
  4  |   test('should load ecosystem graph page', async ({ page }) => {
  5  |     await page.goto('/ecosystem');
  6  | 
  7  |     await expect(page).toHaveTitle(/ecosystem|graph/i);
  8  | 
  9  |     const graphContainer = page.locator('[data-testid="ecosystem-graph"]');
  10 |     await expect(graphContainer).toBeVisible();
  11 |   });
  12 | 
  13 |   test('should render server and application nodes', async ({ page }) => {
  14 |     await page.goto('/ecosystem');
  15 | 
  16 |     await page.waitForLoadState('networkidle');
  17 | 
  18 |     // Just verify nodes are present (exact node count varies based on test data)
  19 |     const nodes = page.locator('[data-testid="node"]');
  20 |     const nodeCount = await nodes.count();
  21 | 
  22 |     expect(nodeCount).toBeGreaterThan(0);
  23 |   });
  24 | 
  25 |   test('should have graph canvas or SVG', async ({ page }) => {
  26 |     await page.goto('/ecosystem');
  27 | 
  28 |     await page.waitForLoadState('networkidle');
  29 | 
  30 |     // Check for either SVG or Canvas element used for graph rendering
  31 |     const svgPresent = await page.locator('svg').isVisible({ timeout: 5000 }).catch(() => false);
  32 |     const canvasPresent = await page.locator('canvas').isVisible({ timeout: 5000 }).catch(() => false);
  33 | 
> 34 |     expect(svgPresent || canvasPresent).toBe(true);
     |                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  35 |   });
  36 | });
  37 | 
```