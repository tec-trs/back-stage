# Phase 2 Testing Strategy: Ecosystem Coverage

**Back-Stage CMDB** — Focused Expansion  
**Date**: August 21, 2026  
**Status**: Specification

---

## 1. Executive Summary

Phase 2 expands test coverage from 30% (Phase 1) to 40-45% global by implementing comprehensive testing of the **Ecosystem module** — a critical infrastructure visualization service. This phase introduces **E2E testing** (Playwright) alongside unit and integration tests, validating the full stack from database queries through HTTP API to browser rendering.

**Scope**: Ecosystem module only (focused depth over breadth)  
**Coverage target**: 60%+ ecosystem module, 40-45% global  
**Timeline**: 1 week (August 28 — September 3, 2026)  
**E2E Framework**: Playwright (modern, fast, cross-browser)

---

## 2. Ecosystem Module: Purpose & Architecture

### What It Does

The **Ecosystem module** provides a unified graph view of the infrastructure:
- **Nodes**: Servers and applications with metadata (type, name, lifecycle status)
- **Edges**: Two relationship types:
  - `hosts` — server hosts application (deployment)
  - `dependsOn` — application depends on another application
- **Organization-isolated**: Each org sees only their resources
- **Soft-delete aware**: Excludes deleted resources from graph

### Module Structure

```
packages/backend/src/modules/ecosystem/
├── application/
│   ├── ecosystem-graph.service.ts         (orchestration, repo interface)
│   └── ecosystem-graph.service.test.ts    ← NEW
├── infrastructure/
│   ├── ecosystem-graph.repository.ts      (DB queries, data mapping)
│   └── ecosystem-graph.repository.test.ts ← NEW
└── interfaces/http/
    ├── ecosystem-graph.controller.ts      (HTTP handler)
    ├── ecosystem-graph.controller.test.ts ← NEW
    └── ecosystem-graph.routes.ts          (routing)
```

### Data Flow

```
User Browser
    ↓
GET /api/ecosystem/graph
    ↓
EcosystemGraphController.getGraph()
    ↓
EcosystemGraphService.getGraph()
    ↓
EcosystemGraphRepository.getGraph()
    ↓ [4 parallel DB queries]
  - servers (with org + soft-delete filter)
  - applications (with org + soft-delete filter)
  - application_deployments (with org + soft-delete filter)
  - application_dependencies (with org + soft-delete filter)
    ↓ [data mapping + edge filtering]
EcosystemGraph { nodes: [], edges: [] }
    ↓
HTTP 200 + JSON
    ↓
Playwright test verifies graph renders
```

---

## 3. Test Strategy by Layer

### Layer 1: Service Unit Tests (EcosystemGraphService)

**Purpose**: Validate business logic and service contract (mocked repository)

**Test Cases** (5 tests):

1. **Happy Path: Returns full EcosystemGraph**
   - Mock: repository.getGraph() returns { nodes: [server, app], edges: [edge] }
   - Assert: service.getGraph() returns same structure
   - Assert: repository.getGraph() called exactly once

2. **Empty Graph Handling**
   - Mock: repository.getGraph() returns { nodes: [], edges: [] }
   - Assert: service returns empty graph (no errors)

3. **Error Propagation**
   - Mock: repository.getGraph() throws QueryError
   - Assert: service re-throws error (no swallowing)

4. **Response Structure Integrity**
   - Assert: response has `nodes: EcosystemNode[]` and `edges: EcosystemEdge[]`
   - Assert: all nodes have required fields (id, kind, type, name, lifecycle)
   - Assert: all edges have required fields (id, source, target, relationType)

5. **Repository Called Once Per Request**
   - Mock: track repository.getGraph() call count
   - Assert: called exactly once (no redundant queries)

**Mock Data**:
```typescript
mockRepository.getGraph = vi.fn(() => Promise.resolve({
  nodes: [
    { id: 'srv-1', kind: 'server', type: 'compute', name: 'prod-01', title: 'Prod', lifecycle: 'active' },
    { id: 'app-1', kind: 'application', type: 'api', name: 'user-svc', title: 'User Service', lifecycle: 'active' },
  ],
  edges: [
    { id: 'edge-1', source: 'srv-1', target: 'app-1', relationType: 'hosts' },
  ],
}))
```

---

### Layer 2: Controller Unit Tests (EcosystemGraphController)

**Purpose**: Validate HTTP contract and error handling (mocked service)

**Test Cases** (4 tests):

1. **HTTP 200 Success Response**
   - Mock: service.getGraph() returns valid EcosystemGraph
   - Act: GET /ecosystem/graph
   - Assert: response status 200
   - Assert: response.json() matches graph structure

2. **Service Called**
   - Assert: controller calls service.getGraph() exactly once

3. **Response Body Structure**
   - Assert: response JSON has top-level `nodes` and `edges` keys
   - Assert: Content-Type is application/json

4. **Error Handling: Service Error → HTTP 500**
   - Mock: service.getGraph() throws Error("DB unavailable")
   - Act: GET /ecosystem/graph
   - Assert: response status 500 or error handler catches it

---

### Layer 3: Repository Integration Tests (EcosystemGraphRepository)

**Purpose**: Validate database queries, filtering, and data mapping (real PostgreSQL)

**Setup**: Use Phase 1 test fixtures
- `setupTestDatabase()` — Create test DB connection
- `seedTestData()` — Create org, servers, apps
- `resetTestDatabase()` — Clean between tests
- `teardownTestDatabase()` — Close connection

**Test Cases** (8 tests):

1. **Fetches All Servers in Organization**
   - Seed: 3 servers in org A, 2 servers in org B
   - Act: repository.getGraph() with org A context
   - Assert: nodes include only 3 servers from org A
   - Assert: servers correctly mapped (type, hostname, status)

2. **Fetches All Applications in Organization**
   - Seed: 4 apps in org A, 2 apps in org B
   - Act: repository.getGraph() with org A context
   - Assert: nodes include only 4 apps from org A
   - Assert: apps correctly mapped (type, code, status)

3. **Soft-Delete: Excludes Deleted Resources**
   - Seed: 2 active servers, 1 soft-deleted server (deleted_at != null)
   - Act: repository.getGraph()
   - Assert: only 2 active servers in nodes
   - Assert: deleted server absent

4. **Deployments as "Hosts" Edges**
   - Seed: server S1, app A1, deployment S1→A1
   - Act: repository.getGraph()
   - Assert: edges includes { source: S1, target: A1, relationType: 'hosts' }
   - Assert: edge.id matches deployment.id

5. **Dependencies as "DependsOn" Edges**
   - Seed: app A1, app A2, dependency A1→A2
   - Act: repository.getGraph()
   - Assert: edges includes { source: A1, target: A2, relationType: 'dependsOn' }

6. **Orphaned Edge Filtering (Soft-Deleted Target)**
   - Seed: app A1, app A2, dependency A1→A2, then soft-delete A2
   - Act: repository.getGraph()
   - Assert: dependency edge NOT in result (target node deleted)
   - Assert: A2 node NOT in result

7. **Empty Organization Graph**
   - Seed: new org with no resources
   - Act: repository.getGraph() for that org
   - Assert: nodes = [], edges = []
   - Assert: no errors, returns valid empty EcosystemGraph

8. **Mixed Soft-Delete State**
   - Seed: server S1, app A1, app A2 (deleted), dependency A1→A2
   - Act: repository.getGraph()
   - Assert: S1, A1 in nodes (active)
   - Assert: A2 NOT in nodes
   - Assert: A1→A2 dependency edge NOT in edges (orphaned)
   - Assert: only S1→A1 deployment edge (if exists) in edges

**Isolation**:
- Each test uses `beforeEach` → `resetTestDatabase()`
- Org context set via `orgContext.set(testOrgId)` before each test
- No cross-test data pollution

---

### Layer 4: E2E Tests (Playwright)

**Purpose**: Validate full stack — database through browser rendering

**Setup**: Playwright configuration in `e2e/playwright.config.ts`
- Base URL: `http://localhost:5173` (frontend dev server) or deployed URL
- Browsers: Chromium (minimum)
- Timeout: 30 seconds per test

**Test Cases** (2-3 tests):

1. **Ecosystem Graph Page Loads**
   - Act: Navigate to `/ecosystem`
   - Assert: Page title contains "Ecosystem"
   - Assert: Graph container visible
   - Assert: No console errors

2. **Graph Nodes Render**
   - Seed: 3 servers, 2 apps via API
   - Act: Load `/ecosystem` page
   - Assert: Page makes GET /api/ecosystem/graph request
   - Assert: Response 200 with nodes + edges
   - Assert: 3 server nodes visible (DOM check)
   - Assert: 2 app nodes visible (DOM check)
   - Assert: Nodes have correct labels

3. **Graph Edges Display Relationships** (optional)
   - Assert: SVG/canvas lines connect server→app (deployment edge)
   - Assert: Lines labeled with relationship type ("hosts", "dependsOn")

**Test Data**:
```typescript
// Use API to seed data before E2E test
const org = await createOrg('test-org');
const server = await createServer(org.id, { hostname: 'prod-01' });
const app = await createApplication(org.id, { code: 'user-svc' });
await createDeployment(server.id, app.id);

// Then navigate and verify
await page.goto('/ecosystem');
await expect(page.locator('text=prod-01')).toBeVisible();
await expect(page.locator('text=user-svc')).toBeVisible();
```

---

## 4. Test Infrastructure & Reuse from Phase 1

### Existing Fixtures (Phase 1)

All reusable, no changes needed:

**Database Connection** (`src/test-fixtures/db-connection.ts`)
```typescript
setupTestDatabase()     // Initialize test DB + run migrations
resetTestDatabase()     // Truncate tables (PostgreSQL CASCADE)
teardownTestDatabase()  // Close connection
```

**Seed Data** (`src/test-fixtures/seed-data.ts`)
```typescript
seedTestData() → TestDataIds {
  orgId, serverId1, serverId2, serverId3,
  applicationId1, applicationId2,
  databaseId,
}
```

**Mock Factories** (`src/test-fixtures/mock-factories.ts`)
```typescript
createMockServer(overrides)       // For unit tests
createMockApplication(overrides)  // For unit tests
createMockEdge(overrides)         // For unit tests
```

### New: Playwright Configuration

**File**: `e2e/playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### CI/CD Integration

**Existing**: `.github/workflows/test.yml` (Phase 1)

**Updates needed**:
- Add `npm run test:e2e` step after integration tests
- Start frontend dev server before E2E tests
- Frontend must be running on port 5173

---

## 5. Coverage Goals & Success Criteria

### Coverage Targets

| Module | Target | Metric |
|--------|--------|--------|
| **EcosystemGraphService** | 90%+ | Unit tests of all paths |
| **EcosystemGraphController** | 85%+ | Unit tests of success + error |
| **EcosystemGraphRepository** | 75%+ | Integration tests (DB queries complex) |
| **Ecosystem Module Overall** | 60%+ | All layers combined |
| **Global Coverage** | 40-45% | Includes Phase 1 baseline |

### Success Criteria

**Code Quality**:
- ✅ All 19-20 tests passing (unit + integration + E2E)
- ✅ No skipped or pending tests
- ✅ No console.log or debug statements in test code

**Coverage**:
- ✅ Ecosystem module: 60%+ statements
- ✅ Global: 40-45% statements (up from Phase 1's ~30%)
- ✅ Per-file thresholds: Service 90%, Controller 85%, Repository 75%

**E2E Quality**:
- ✅ Playwright tests stable (no flakiness after 3 runs)
- ✅ Tests pass in CI/CD with PostgreSQL + frontend server
- ✅ No timeout failures

**Documentation**:
- ✅ Test files include clear describe/it labels
- ✅ Complex assertions documented (why we assert)
- ✅ E2E test setup instructions in PHASE-2-RESULTS.md

**Maintainability**:
- ✅ Tests use Phase 1 fixtures (no duplication)
- ✅ Mock factories extended if needed for new types
- ✅ Test data organized and reusable

---

## 6. Global Constraints (from Phase 1)

### Testing Standards
- TypeScript strict mode enabled
- ESLint compliance required
- No hardcoded test data (all factory-based)
- Proper error assertion patterns (expect assertions, not just no-throw)
- Tests isolated: no shared state between test suites

### CI/CD Requirements
- Tests run on Ubuntu Linux (GitHub Actions)
- PostgreSQL 16 service available
- Test database: `backstage_test`, user: `postgres`, password: `postgres`
- Node.js 20, npm latest

### Code Quality
- No console.log statements in tests
- No `skip()`, `only()`, or `.todo()` in committed tests
- All test files end with `.test.ts`
- Coverage thresholds enforced: failure if below threshold

---

## 7. Timeline & Milestones

**Week of August 28, 2026**

| Day | Milestone | Output |
|-----|-----------|--------|
| Wed-Thu | Service + Controller unit tests | 9 tests passing |
| Thu-Fri | Repository integration tests | 8 tests passing |
| Fri | Playwright setup + 1st E2E test | 1-2 E2E tests |
| Mon | Polish, coverage report, documentation | Final report |

**Deliverables**:
1. 19-20 tests across 4 files (unit + integration + E2E)
2. Coverage metrics: 60% ecosystem, 40-45% global
3. `PHASE-2-RESULTS.md` with findings and Phase 3 planning
4. Updated CI/CD workflow (if E2E integration needed)

---

## 8. Known Constraints & Assumptions

### Constraints
- **One-week sprint**: Focused scope (ecosystem only), no exploration work
- **Playwright learning curve**: Minimal (team familiar with testing patterns)
- **E2E stability**: May require flake detection/retry logic if frontend UI unstable

### Assumptions
- Ecosystem module API stable (no breaking changes during sprint)
- Frontend has `/ecosystem` route and graph component ready
- Test database can be reset between tests without conflicts
- Org context injection works as implemented in Phase 1

---

## 9. Phase 3 Preview

Phase 3 (September) will expand to:
- **Tier 2 modules**: Search, URLs (if not completed)
- **E2E expansion**: 5-8 critical workflow tests
- **Frontend**: useEcosystemGraph hook tests, component snapshot tests
- **Target**: 50%+ global coverage

---

**Document Status**: Ready for review  
**Next Step**: User approval → Implementation plan via writing-plans skill
