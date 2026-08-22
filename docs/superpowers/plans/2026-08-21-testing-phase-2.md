# Phase 2 Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive testing for Ecosystem module (19-20 tests) with unit, integration, and E2E layers, reaching 40-45% global coverage.

**Architecture:** Three-layer testing strategy — service layer unit tests (mocked repo), controller unit tests (mocked service), repository integration tests (real PostgreSQL), plus Playwright E2E tests for full-stack validation. Reuse Phase 1 fixtures and CI/CD infrastructure.

**Tech Stack:** Vitest (unit + integration), PostgreSQL 16 (test DB), Playwright (E2E), TypeScript strict mode

**Spec:** `docs/superpowers/specs/2026-08-21-testing-phase-2-design.md`

## Global Constraints

- TypeScript strict mode enabled for all test files
- No hardcoded test data — use factories and seed functions from Phase 1
- All test files must end with `.test.ts`
- No console.log statements in test code
- Tests must pass in GitHub Actions with PostgreSQL 16 service
- Coverage thresholds enforced: Service 90%+, Controller 85%+, Repository 75%+
- No skipped or pending tests in final commit
- E2E tests must pass 3 consecutive runs (no flakiness)

---

### Task 1: EcosystemGraphService Unit Tests

**Files:**
- Create: `packages/backend/src/modules/ecosystem/application/ecosystem-graph.service.test.ts`

**Interfaces:**
- Consumes: `EcosystemGraphService` from `ecosystem-graph.service.ts`, `EcosystemGraph` interface, mock repository pattern from Phase 1
- Produces: `ecosystem-graph.service.test.ts` with 5 passing tests validating service behavior

- [ ] **Step 1: Create test file with imports and setup**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EcosystemGraphService } from './ecosystem-graph.service.js';
import type { EcosystemGraph, IEcosystemGraphRepository } from '../infrastructure/ecosystem-graph.repository.js';

describe('EcosystemGraphService', () => {
  let service: EcosystemGraphService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      getGraph: vi.fn(),
    };
    service = new EcosystemGraphService(mockRepository);
  });

  // Tests go here
});
```

- [ ] **Step 2: Write test — Happy Path (returns full EcosystemGraph)**

```typescript
it('should return full EcosystemGraph from repository', async () => {
  const mockGraph: EcosystemGraph = {
    nodes: [
      { id: 'srv-1', kind: 'server', type: 'compute', name: 'prod-01', title: 'Prod', lifecycle: 'active' },
      { id: 'app-1', kind: 'application', type: 'api', name: 'user-svc', title: 'User Service', lifecycle: 'active' },
    ],
    edges: [
      { id: 'edge-1', source: 'srv-1', target: 'app-1', relationType: 'hosts' },
    ],
  };
  
  mockRepository.getGraph.mockResolvedValue(mockGraph);
  
  const result = await service.getGraph();
  
  expect(result).toEqual(mockGraph);
  expect(mockRepository.getGraph).toHaveBeenCalledOnce();
});
```

- [ ] **Step 3: Write test — Empty Graph Handling**

```typescript
it('should return empty graph when no resources exist', async () => {
  const emptyGraph: EcosystemGraph = { nodes: [], edges: [] };
  mockRepository.getGraph.mockResolvedValue(emptyGraph);
  
  const result = await service.getGraph();
  
  expect(result.nodes).toEqual([]);
  expect(result.edges).toEqual([]);
});
```

- [ ] **Step 4: Write test — Error Propagation**

```typescript
it('should propagate repository errors', async () => {
  mockRepository.getGraph.mockRejectedValue(new Error('DB connection failed'));
  
  await expect(service.getGraph()).rejects.toThrow('DB connection failed');
});
```

- [ ] **Step 5: Write test — Response Structure Integrity**

```typescript
it('should have nodes with required fields', async () => {
  const mockGraph: EcosystemGraph = {
    nodes: [
      { id: 'srv-1', kind: 'server', type: 'compute', name: 'prod-01', title: null, lifecycle: 'active' },
    ],
    edges: [],
  };
  mockRepository.getGraph.mockResolvedValue(mockGraph);
  
  const result = await service.getGraph();
  
  expect(result.nodes[0]).toHaveProperty('id');
  expect(result.nodes[0]).toHaveProperty('kind');
  expect(result.nodes[0]).toHaveProperty('type');
  expect(result.nodes[0]).toHaveProperty('name');
  expect(result.nodes[0]).toHaveProperty('lifecycle');
});

it('should have edges with required fields', async () => {
  const mockGraph: EcosystemGraph = {
    nodes: [],
    edges: [
      { id: 'edge-1', source: 'srv-1', target: 'app-1', relationType: 'hosts' },
    ],
  };
  mockRepository.getGraph.mockResolvedValue(mockGraph);
  
  const result = await service.getGraph();
  
  expect(result.edges[0]).toHaveProperty('id');
  expect(result.edges[0]).toHaveProperty('source');
  expect(result.edges[0]).toHaveProperty('target');
  expect(result.edges[0]).toHaveProperty('relationType');
});
```

- [ ] **Step 6: Run tests to verify all 5 pass**

```bash
cd packages/backend
npm run test -- src/modules/ecosystem/application/ecosystem-graph.service.test.ts
```

Expected: 5 tests passing, ~50-60ms duration

- [ ] **Step 7: Commit**

```bash
git add src/modules/ecosystem/application/ecosystem-graph.service.test.ts
git commit -m "test: add unit tests for EcosystemGraphService (5 tests)"
```

---

### Task 2: EcosystemGraphController Unit Tests

**Files:**
- Create: `packages/backend/src/modules/ecosystem/interfaces/http/ecosystem-graph.controller.test.ts`

**Interfaces:**
- Consumes: `EcosystemGraphController` from `ecosystem-graph.controller.ts`, `EcosystemGraph` interface, Express Request/Response types
- Produces: 4 passing controller unit tests validating HTTP contract

- [ ] **Step 1: Create test file with Express mocks**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { EcosystemGraphController } from './ecosystem-graph.controller.js';
import type { EcosystemGraph } from '../../infrastructure/ecosystem-graph.repository.js';

describe('EcosystemGraphController', () => {
  let controller: EcosystemGraphController;
  let mockService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getGraph: vi.fn(),
    };
    controller = new EcosystemGraphController(mockService);
    
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  // Tests go here
});
```

- [ ] **Step 2: Write test — HTTP 200 Success Response**

```typescript
it('should return 200 with EcosystemGraph', async () => {
  const mockGraph: EcosystemGraph = {
    nodes: [{ id: 'srv-1', kind: 'server', type: 'compute', name: 'prod-01', title: null, lifecycle: 'active' }],
    edges: [],
  };
  
  mockService.getGraph.mockResolvedValue(mockGraph);
  
  await controller.getGraph(mockRequest as Request, mockResponse as Response);
  
  expect(mockResponse.status).toHaveBeenCalledWith(200);
  expect(mockResponse.json).toHaveBeenCalledWith(mockGraph);
});
```

- [ ] **Step 3: Write test — Service Called**

```typescript
it('should call service.getGraph() exactly once', async () => {
  mockService.getGraph.mockResolvedValue({ nodes: [], edges: [] });
  
  await controller.getGraph(mockRequest as Request, mockResponse as Response);
  
  expect(mockService.getGraph).toHaveBeenCalledOnce();
  expect(mockService.getGraph).toHaveBeenCalledWith();
});
```

- [ ] **Step 4: Write test — Response Body Structure**

```typescript
it('should return valid JSON with nodes and edges', async () => {
  const mockGraph: EcosystemGraph = {
    nodes: [],
    edges: [],
  };
  mockService.getGraph.mockResolvedValue(mockGraph);
  
  await controller.getGraph(mockRequest as Request, mockResponse as Response);
  
  const response = (mockResponse.json as any).mock.calls[0][0];
  expect(response).toHaveProperty('nodes');
  expect(response).toHaveProperty('edges');
});
```

- [ ] **Step 5: Write test — Error Handling**

```typescript
it('should handle service errors (relies on Express error middleware)', async () => {
  mockService.getGraph.mockRejectedValue(new Error('DB unavailable'));
  
  // In real code, Express error middleware catches this
  // Test verifies the error is thrown (not caught)
  await expect(controller.getGraph(mockRequest as Request, mockResponse as Response)).rejects.toThrow('DB unavailable');
});
```

- [ ] **Step 6: Run tests to verify 4 pass**

```bash
cd packages/backend
npm run test -- src/modules/ecosystem/interfaces/http/ecosystem-graph.controller.test.ts
```

Expected: 4 tests passing

- [ ] **Step 7: Commit**

```bash
git add src/modules/ecosystem/interfaces/http/ecosystem-graph.controller.test.ts
git commit -m "test: add unit tests for EcosystemGraphController (4 tests)"
```

---

### Task 3: EcosystemGraphRepository Integration Tests

**Files:**
- Create: `packages/backend/src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts`

**Interfaces:**
- Consumes: Phase 1 test fixtures (`db-connection.ts`, `seed-data.ts`), `EcosystemGraphRepository`, `EcosystemGraph` interface, `orgContext`
- Produces: 8 passing integration tests validating database queries, filtering, and data mapping

- [ ] **Step 1: Create test file with Phase 1 fixtures**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabase, orgContext } from '../../../shared/context/index.js';
import { setupTestDatabase, resetTestDatabase, teardownTestDatabase } from '../../../test-fixtures/index.js';
import { seedTestData } from '../../../test-fixtures/seed-data.js';
import { EcosystemGraphRepository } from './ecosystem-graph.repository.js';

describe('EcosystemGraphRepository', () => {
  let repository: EcosystemGraphRepository;
  let testOrgId: string;

  beforeEach(async () => {
    await setupTestDatabase();
    const db = getDatabase();
    repository = new EcosystemGraphRepository(db);
    
    const testData = await seedTestData();
    testOrgId = testData.orgId;
    orgContext.set(testOrgId);
  });

  afterEach(async () => {
    orgContext.clear();
    await resetTestDatabase();
    await teardownTestDatabase();
  });

  // Tests go here
});
```

- [ ] **Step 2: Write test — Fetches All Servers in Organization**

```typescript
it('should fetch all servers in organization', async () => {
  const graph = await repository.getGraph();
  
  // seedTestData creates 3 servers: serverId1, serverId2, serverId3
  const serverNodes = graph.nodes.filter(n => n.kind === 'server');
  
  expect(serverNodes.length).toBeGreaterThanOrEqual(3);
  expect(serverNodes.every(n => n.kind === 'server')).toBe(true);
});
```

- [ ] **Step 3: Write test — Fetches All Applications in Organization**

```typescript
it('should fetch all applications in organization', async () => {
  const graph = await repository.getGraph();
  
  // seedTestData creates 2 applications
  const appNodes = graph.nodes.filter(n => n.kind === 'application');
  
  expect(appNodes.length).toBeGreaterThanOrEqual(2);
  expect(appNodes.every(n => n.kind === 'application')).toBe(true);
});
```

- [ ] **Step 4: Write test — Soft-Delete Filtering**

```typescript
it('should exclude soft-deleted resources', async () => {
  const db = getDatabase();
  
  // Soft-delete a server
  const serverIds = (await db('servers').where('organization_id', testOrgId).select('id')).map(r => r.id);
  if (serverIds.length > 0) {
    await db('servers').where('id', serverIds[0]).update({ deleted_at: new Date() });
  }
  
  const graph = await repository.getGraph();
  const deletedServerInGraph = graph.nodes.find(n => n.id === serverIds[0]);
  
  expect(deletedServerInGraph).toBeUndefined();
});
```

- [ ] **Step 5: Write test — Deployments as Hosting Edges**

```typescript
it('should return deployments as hosts edges', async () => {
  const graph = await repository.getGraph();
  
  const hostEdges = graph.edges.filter(e => e.relationType === 'hosts');
  
  // seedTestData should create at least one deployment
  expect(hostEdges.length).toBeGreaterThan(0);
  expect(hostEdges[0]).toHaveProperty('source');
  expect(hostEdges[0]).toHaveProperty('target');
});
```

- [ ] **Step 6: Write test — Dependencies as DependsOn Edges**

```typescript
it('should return dependencies as dependsOn edges', async () => {
  const db = getDatabase();
  
  // Create a dependency for testing (if not in seedTestData)
  const apps = await db('applications').where('organization_id', testOrgId).limit(2).select('id');
  
  if (apps.length >= 2) {
    await db('application_dependencies').insert({
      id: `dep-test-${Date.now()}`,
      organization_id: testOrgId,
      application_id: apps[0].id,
      depends_on_application_id: apps[1].id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
  
  const graph = await repository.getGraph();
  const dependEdges = graph.edges.filter(e => e.relationType === 'dependsOn');
  
  expect(dependEdges.length).toBeGreaterThan(0);
});
```

- [ ] **Step 7: Write test — Orphaned Edge Filtering**

```typescript
it('should filter out edges with soft-deleted targets', async () => {
  const db = getDatabase();
  
  // Get a deployment edge, then soft-delete its target
  const graph1 = await repository.getGraph();
  const hostEdge = graph1.edges.find(e => e.relationType === 'hosts');
  
  if (hostEdge) {
    await db('applications').where('id', hostEdge.target).update({ deleted_at: new Date() });
    
    const graph2 = await repository.getGraph();
    const stillExists = graph2.edges.find(e => e.id === hostEdge.id);
    
    expect(stillExists).toBeUndefined();
  }
});
```

- [ ] **Step 8: Write test — Empty Organization Graph**

```typescript
it('should return empty graph for org with no resources', async () => {
  const db = getDatabase();
  
  // Create a new empty org
  const newOrgId = `test-org-empty-${Date.now()}`;
  orgContext.set(newOrgId);
  
  const graph = await repository.getGraph();
  
  expect(graph.nodes).toEqual([]);
  expect(graph.edges).toEqual([]);
});
```

- [ ] **Step 9: Write test — Mixed Soft-Delete State**

```typescript
it('should handle mixed soft-delete state correctly', async () => {
  const db = getDatabase();
  
  // Get current state
  const beforeGraph = await repository.getGraph();
  const initialNodes = beforeGraph.nodes.length;
  
  // Soft-delete one server
  const servers = await db('servers').where('organization_id', testOrgId).limit(1).select('id');
  if (servers.length > 0) {
    await db('servers').where('id', servers[0].id).update({ deleted_at: new Date() });
  }
  
  const afterGraph = await repository.getGraph();
  
  expect(afterGraph.nodes.length).toBeLessThan(initialNodes);
});
```

- [ ] **Step 10: Run tests to verify 8 pass**

```bash
cd packages/backend
npm run test -- src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts
```

Expected: 8 tests passing (may skip if PostgreSQL unavailable locally, will pass in CI/CD)

- [ ] **Step 11: Commit**

```bash
git add src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts
git commit -m "test: add integration tests for EcosystemGraphRepository (8 tests)"
```

---

### Task 4: Playwright E2E Setup & First Test

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/ecosystem-graph.spec.ts`

**Interfaces:**
- Consumes: Playwright configuration patterns, frontend running on port 5173, `/ecosystem` route exists
- Produces: Playwright setup + 2-3 E2E tests validating full-stack ecosystem graph

- [ ] **Step 1: Create Playwright configuration**

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev --workspace=@back-stage/frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 2: Create E2E test file with imports**

```typescript
// e2e/tests/ecosystem-graph.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ecosystem Graph', () => {
  test.beforeEach(async ({ page }) => {
    // Login if needed (depends on your auth flow)
    // For now, assume public or auth already done
    await page.goto('/');
  });

  // Tests go here
});
```

- [ ] **Step 3: Write test — Page Loads**

```typescript
test('should load ecosystem graph page', async ({ page }) => {
  await page.goto('/ecosystem');
  
  // Check page title
  await expect(page).toHaveTitle(/ecosystem|graph/i);
  
  // Check graph container exists
  const graphContainer = page.locator('[data-testid="ecosystem-graph"]');
  await expect(graphContainer).toBeVisible();
  
  // Check no console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`Console error: ${msg.text()}`);
    }
  });
});
```

- [ ] **Step 4: Write test — Graph Nodes Render**

```typescript
test('should render server and application nodes', async ({ page, request }) => {
  // Create test data via API
  const createServerResp = await request.post('/api/servers', {
    data: {
      hostname: 'e2e-test-server',
      server_type: 'compute',
      status: 'active',
    },
  });
  const server = await createServerResp.json();
  
  const createAppResp = await request.post('/api/applications', {
    data: {
      code: 'e2e-test-app',
      app_type: 'api',
      status: 'active',
    },
  });
  const app = await createAppResp.json();
  
  // Load page
  await page.goto('/ecosystem');
  
  // Wait for API request and nodes to render
  await page.waitForLoadState('networkidle');
  
  // Check server node
  const serverNode = page.locator('text=e2e-test-server');
  await expect(serverNode).toBeVisible();
  
  // Check app node
  const appNode = page.locator('text=e2e-test-app');
  await expect(appNode).toBeVisible();
  
  // Cleanup
  await request.delete(`/api/servers/${server.id}`);
  await request.delete(`/api/applications/${app.id}`);
});
```

- [ ] **Step 5: Write test — Graph Updates After Creating Resource (optional)**

```typescript
test('should update graph when new server is created', async ({ page, request }) => {
  await page.goto('/ecosystem');
  
  // Get initial node count
  const initialNodes = await page.locator('[data-testid="node"]').count();
  
  // Create a new server via API
  await request.post('/api/servers', {
    data: {
      hostname: 'new-server-' + Date.now(),
      server_type: 'compute',
      status: 'active',
    },
  });
  
  // Trigger graph refresh (via button or interval)
  const refreshButton = page.locator('button:has-text("Refresh")');
  if (await refreshButton.isVisible()) {
    await refreshButton.click();
  }
  
  // Wait for update and verify node count increased
  await page.waitForLoadState('networkidle');
  const updatedNodes = await page.locator('[data-testid="node"]').count();
  
  expect(updatedNodes).toBeGreaterThan(initialNodes);
});
```

- [ ] **Step 6: Install Playwright (if not already installed)**

```bash
npm install --save-dev @playwright/test
```

- [ ] **Step 7: Run E2E tests (local)**

```bash
cd e2e
npx playwright test
```

Expected: 2-3 tests passing (may require frontend running on port 5173)

- [ ] **Step 8: Commit**

```bash
git add e2e/playwright.config.ts e2e/tests/ecosystem-graph.spec.ts
git commit -m "test: add Playwright E2E tests for ecosystem graph (2-3 tests)"
```

---

### Task 5: Update CI/CD for E2E Tests

**Files:**
- Modify: `.github/workflows/test.yml`

**Interfaces:**
- Consumes: Phase 1 CI/CD workflow, Playwright tests, frontend server startup
- Produces: Updated workflow with E2E tests running after unit + integration tests

- [ ] **Step 1: Read current workflow**

```bash
cat .github/workflows/test.yml
```

Note the structure and environment setup.

- [ ] **Step 2: Add E2E test steps to workflow**

Add after the coverage step:

```yaml
      - name: Start frontend server
        run: npm run dev --workspace=@back-stage/frontend &
        working-directory: packages/frontend

      - name: Wait for frontend server
        run: npx wait-on http://localhost:5173 --timeout 30000

      - name: Run E2E tests
        run: npx playwright test
        working-directory: e2e
        
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

- [ ] **Step 3: Verify workflow syntax**

```bash
cat .github/workflows/test.yml
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add E2E test step to GitHub Actions workflow"
```

---

### Task 6: Coverage Verification & Phase 2 Results Documentation

**Files:**
- Create: `docs/TESTING-PHASE-2-RESULTS.md`

**Interfaces:**
- Consumes: Coverage reports from `npm run test:coverage`, test results from all 4 test suites
- Produces: Comprehensive results document with metrics and Phase 3 planning

- [ ] **Step 1: Run full test suite with coverage**

```bash
cd packages/backend
npm run test:coverage
```

Note the coverage percentages.

- [ ] **Step 2: Create results document**

```markdown
# Phase 2 Testing Results — Ecosystem Comprehensive Coverage

**Date:** 2026-08-21  
**Status:** ✅ COMPLETE

## Summary

Phase 2 testing implementation complete. All 19-20 tests passing.

### Coverage Achieved

| Module | Target | Achieved | Status |
|--------|--------|----------|--------|
| EcosystemGraphService | 90%+ | [actual]% | ✅/❌ |
| EcosystemGraphController | 85%+ | [actual]% | ✅/❌ |
| EcosystemGraphRepository | 75%+ | [actual]% | ✅/❌ |
| **Ecosystem Module Overall** | 60%+ | [actual]% | ✅/❌ |
| **Global Coverage** | 40-45% | [actual]% | ✅/❌ |

### Test Breakdown

- ✅ Service unit tests: 5 passing
- ✅ Controller unit tests: 4 passing
- ✅ Repository integration tests: 8 passing
- ✅ E2E tests (Playwright): 2-3 passing
- **Total: 19-20 tests**

## Phase 3 Planning

Focus on: Search module, URLs module, additional E2E workflows, frontend tests.
Target: 50%+ global coverage.
```

- [ ] **Step 3: Fill in actual coverage numbers**

- [ ] **Step 4: Commit**

```bash
git add docs/TESTING-PHASE-2-RESULTS.md
git commit -m "docs: phase 2 testing complete - ecosystem coverage results"
```

---

## Plan Summary

**Total Tasks:** 6  
**Total Tests:** 19-20  
**Duration:** 1 week  
**Target Coverage:** 60% ecosystem, 40-45% global

---

Now dispatching Task 1 with subagent-driven-development...
