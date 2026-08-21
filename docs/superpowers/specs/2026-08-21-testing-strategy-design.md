# Testing Strategy & Coverage Design
**Back-Stage CMDB** — Hybrid Incremental Approach  
**Date**: August 21, 2026  
**Status**: Draft

---

## 1. Executive Summary

Implement a **3-phase incremental testing strategy** prioritizing by risk/impact, with automated coverage thresholds that enforce continuous improvement. Start with critical domain logic (resource-graph, auth, VIPs), expand to standard CRUD services, then to UI layer — all while maintaining CI/CD quality gates.

**Current state**: <2% coverage (23 test files for 8,900 LoC)  
**Target end state**: 50%+ global coverage with tier-based thresholds  
**Timeline**: 3 months, 1 month per phase  

---

## 2. Coverage Goals by Layer & Timeline

### Phase 1 (Weeks 1-4): Critical Path — 80%+ Coverage
**Focus**: Highest-risk, most-changed modules  
**Coverage target**: 30-35% global (concentrated in Tier 1)

| Module | Risk Level | Type | Target | Rationale |
|--------|-----------|------|--------|-----------|
| `resource-graph` | 🔴 CRITICAL | Simulation, impact analysis | 85%+ | Complex graph traversal, blast radius calculation |
| `auth` | 🔴 CRITICAL | JWT, RBAC, validation | 80%+ | Security-sensitive, easy to break |
| `vips` | 🟡 HIGH | New feature, relationships | 75%+ | Recently added, affects graph |
| `server-groups` | 🟡 HIGH | Relationship management | 75%+ | VIP dependency, polimorphic relationships |
| `deployments` | 🟡 HIGH | Webhook parsing, tracking | 70%+ | External integrations, failure-prone |
| `servers`, `applications`, `databases` | 🟢 MEDIUM | Core CRUD | 60% | Standard create/read/update/delete patterns |

**Tests to implement**: ~80-100 unit tests + 10-15 integration scenarios

### Phase 2 (Weeks 5-8): Standard Coverage — 60% Coverage
**Focus**: Mid-tier services and remaining domain logic  
**Coverage target**: 40-45% global

| Category | Modules | Target | Work |
|----------|---------|--------|------|
| **Tier 2 Services** | search, urls, ecosystems | 60% | Repository + query tests, edge cases |
| **Domain Logic** | policy-engine, payload parsers | 75%+ | Policy rules, webhook payload validation |
| **Integration Paths** | Server→App→DB chains | 50%+ | Multi-module end-to-end flows |

**Tests to implement**: ~60-80 unit + 15 integration tests

### Phase 3 (Weeks 9-12): UI & Completeness — 40% Coverage
**Focus**: Frontend, remaining services, polish  
**Coverage target**: 50%+ global

| Layer | Target | Focus |
|-------|--------|-------|
| **Frontend hooks** | 25-30% | useCreateUrl, useFetchGraphs, mutation handlers (happy path + error) |
| **Frontend components** | 15-20% | ResourceGraph, Modal, form logic (snapshots + interaction) |
| **Remaining backend** | 50%+ | health, governance, audit (lower priority) |
| **E2E scenarios** | 5-8 critical flows | Login → Create resource → Verify graph impact |

**Tests to implement**: ~40-50 unit + 5-8 E2E tests

---

## 3. Architecture: Test Structure & Patterns

### Directory Layout
```
packages/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── resource-graph/
│       │   │   ├── application/
│       │   │   │   ├── graph.service.ts
│       │   │   │   └── graph.service.test.ts         ← Vitest
│       │   │   ├── domain/
│       │   │   │   ├── graph.types.ts
│       │   │   │   └── graph-simulator.test.ts       ← Vitest, no mocks
│       │   │   └── infrastructure/
│       │   │       ├── graph.repository.ts
│       │   │       └── graph.repository.test.ts      ← Vitest + test DB
│       │   └── ...
│       ├── app.integration.test.ts                   ← Jest (E2E flows)
│       └── test-fixtures/
│           ├── db-connection.ts                       ← Shared test DB setup
│           ├── seed-data.ts                           ← Demo org, servers, etc
│           └── mock-factories.ts                      ← Factory functions
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── resource-graph/
│       │   │   ├── use-resource-graph.ts
│       │   │   └── use-resource-graph.test.ts        ← Vitest + mock API
│       │   ├── urls/
│       │   │   └── use-create-url.test.ts
│       │   └── ...
│       └── test-fixtures/
│           ├── mock-api.ts                           ← Mock queryClient, responses
│           └── test-utils.tsx                        ← renderWithProviders, etc
└── e2e/
    └── tests/
        ├── graph-impact.spec.ts                      ← Playwright
        ├── create-vip.spec.ts
        └── auth-flows.spec.ts
```

### Test Types & Frameworks

| Type | Framework | When | Example |
|------|-----------|------|---------|
| **Unit** (fast) | Vitest | Service logic, pure functions, no I/O | `graph.service.test.ts`: simulate impact with mock edges |
| **Repository/Query** | Vitest + test DB | Data access, SQL queries, constraints | `graph.repository.test.ts`: verify CTE recursive queries work |
| **Integration** | Jest (isolated env) | Multi-module flows, webhooks, end-to-end | `app.integration.test.ts`: create VIP → check relationships → verify graph |
| **E2E** (slow) | Playwright | Full user journey, UI → API → DB | `graph-impact.spec.ts`: login → create server → run simulation → check UI |
| **Frontend** | Vitest + @testing-library | Hook behavior, mutation handlers | `use-create-url.test.ts`: mock API, test refetch logic |

### Coverage Thresholds (Enforced by CI)

**Global thresholds** (block PR if not met):
```javascript
// vitest.config.ts
coverage: {
  provider: 'v8',
  // Phase 1 (month 1): 25% global, 80% in Tier 1
  // Phase 2 (month 2): 40% global, 70% in Tier 1-2
  // Phase 3 (month 3): 50% global, across all layers
  
  statements: 25,        // Adjust per phase
  branches: 15,          // Harder to achieve, lower bar
  functions: 25,
  lines: 25,
  
  // Per-file thresholds for critical modules
  perFile: true,
  all: {
    lines: 25,
    functions: 25,
  },
}
```

**Module-level thresholds**:
```javascript
// Enforced via coverage reporter, flagged in PR comments
module.exports = {
  thresholds: {
    'src/modules/resource-graph/**': { lines: 80 },
    'src/modules/auth/**': { lines: 80 },
    'src/modules/vips/**': { lines: 75 },
    'src/modules/deployments/**': { lines: 70 },
    'src/modules/*/application/**': { lines: 60 },
    'src/modules/*/infrastructure/**': { lines: 40 },
  }
}
```

---

## 4. Test Patterns & Best Practices

### Unit Tests: Service Layer

**Pattern**: Test business logic, mock external dependencies.
```typescript
// graph.service.test.ts
describe('GraphService.simulateImpact', () => {
  let service: GraphService;
  let mockRepo: MockGraphRepository;
  
  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new GraphService(mockRepo);
  });
  
  it('should identify direct dependents of deleted resource', () => {
    mockRepo.setEdges([
      { source: 'app1', target: 'db1', type: 'connects_to' },
      { source: 'app2', target: 'db1', type: 'connects_to' },
    ]);
    
    const impact = service.simulateImpact('database', 'db1');
    expect(impact.directlyImpacted).toEqual(['app1', 'app2']);
  });
  
  it('should calculate transitive impact (cascade)', () => {
    // app3 → app2 → db1
    mockRepo.setEdges([
      { source: 'app3', target: 'app2', type: 'depends_on' },
      { source: 'app2', target: 'db1', type: 'connects_to' },
    ]);
    
    const impact = service.simulateImpact('database', 'db1');
    expect(impact.transitivelyImpacted).toContain('app3');
  });
  
  it('should detect cycles and avoid infinite loops', () => {
    // app1 → app2 → app1 (cycle)
    mockRepo.setEdges([
      { source: 'app1', target: 'app2', type: 'depends_on' },
      { source: 'app2', target: 'app1', type: 'depends_on' },
    ]);
    
    expect(() => service.simulateImpact('application', 'app1')).not.toThrow();
  });
});
```

### Repository Tests: Real Database

**Pattern**: Use test database, verify actual queries work.
```typescript
// graph.repository.test.ts — with test DB
describe('GraphRepository.getTransitiveImpact', () => {
  let repo: GraphRepository;
  let testDb: Knex;
  
  beforeAll(async () => {
    testDb = await setupTestDatabase();
  });
  
  beforeEach(async () => {
    repo = new GraphRepository(testDb);
    await seedTestData(testDb);
  });
  
  afterEach(async () => {
    await testDb.raw('TRUNCATE TABLE resource_relationships CASCADE');
  });
  
  it('should return transitive closure via CTE query', async () => {
    // Insert: server1 → app1 → db1
    await testDb('resource_relationships').insert([
      { source_type: 'server', source_id: 's1', target_type: 'application', target_id: 'a1', relation_type: 'hosts' },
      { source_type: 'application', source_id: 'a1', target_type: 'database', target_id: 'd1', relation_type: 'connects_to' },
    ]);
    
    const impact = await repo.getTransitiveImpact('server', 's1');
    expect(impact.map(r => r.targetId)).toContain('d1'); // Via transitive closure
  });
});
```

### Integration Tests: End-to-End Flows

**Pattern**: Real app instance, real DB, verify side effects.
```typescript
// app.integration.test.ts
describe('VIP Creation Flow', () => {
  let app: Express.Application;
  let testDb: Knex;
  let token: string;
  
  beforeAll(async () => {
    testDb = await setupTestDatabase();
    app = createApp(testDb);
    token = await loginAsAdmin(app);
  });
  
  it('should create VIP, add servers, and update graph', async () => {
    // 1. Create VIP
    const vipRes = await request(app)
      .post('/api/vips')
      .set('Authorization', `Bearer ${token}`)
      .send({ hostname: 'vip-01', servers: ['s1', 's2'] });
    expect(vipRes.status).toBe(201);
    const vipId = vipRes.body.id;
    
    // 2. Verify relationships created
    const graphRes = await request(app)
      .get('/api/resource-graph')
      .set('Authorization', `Bearer ${token}`);
    const vipNode = graphRes.body.nodes.find(n => n.id === vipId);
    expect(vipNode).toBeDefined();
    
    // 3. Verify blast radius includes servers
    const impactRes = await request(app)
      .post('/api/resource-graph/simulate-impact')
      .set('Authorization', `Bearer ${token}`)
      .send({ resourceType: 'vip', resourceId: vipId });
    expect(impactRes.body.impactedResources).toContainEqual(
      expect.objectContaining({ id: 's1' }),
    );
  });
});
```

### Frontend Tests: Hooks & Mutations

**Pattern**: Mock API, test query invalidation and refetch.
```typescript
// use-create-url.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useCreateUrl } from './use-create-url';
import { mockQueryClient } from '../test-fixtures/mock-api';

describe('useCreateUrl', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = mockQueryClient();
  });
  
  it('should refetch resource-graph queries on success', async () => {
    const { result } = renderHook(() => useCreateUrl(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });
    
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');
    
    await act(async () => {
      await result.current.mutateAsync({
        label: 'Test URL',
        url: 'https://example.com',
        // ...
      });
    });
    
    await waitFor(() => {
      expect(refetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          predicate: expect.any(Function),
        }),
      );
    });
  });
});
```

---

## 5. CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Tests & Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: backstage_test
          POSTGRES_PASSWORD: test
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # Unit & integration tests
      - run: npm run test
      
      # Coverage report
      - run: npm run test:coverage
      
      # Upload to Codecov
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
      
      # Block PR if coverage drops
      - run: npm run coverage:check
        # Exits 1 if below thresholds
```

### Coverage Tracking

- **Codecov badge** in README
- **Per-PR comments** showing delta (e.g., "Coverage: 25% → 28% (+3%)")
- **Trend reports** (monthly coverage growth)

---

## 6. Tooling & Setup

### Dependencies to Add

```json
{
  "devDependencies": {
    "vitest": "^2.1.4",
    "@vitest/coverage-v8": "^2.1.4",
    "@testing-library/react": "^16.0.1",
    "@testing-library/react-hooks": "^8.0.1",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "msw": "^2.0.0",
    "factory.ts": "^1.2.0",
    "@faker-js/faker": "^8.4.1"
  }
}
```

### Test Fixtures & Factories

**Test database setup** (`packages/backend/src/test-fixtures/db-connection.ts`):
- Spin up test DB in-memory or Docker container
- Auto-migrate schema
- Auto-seed demo org/servers/apps

**Mock factories** (`packages/backend/src/test-fixtures/mock-factories.ts`):
- `createMockServer()` → { id, hostname, ... }
- `createMockVIP()` → populated VIP with relationships
- `createMockEdges()` → graph relationships array

**Mock API** (`packages/frontend/src/test-fixtures/mock-api.ts`):
- MSW (Mock Service Worker) for intercepting fetch
- Pre-configured responses for common queries
- `renderWithProviders()` helper for React tests

---

## 7. Success Criteria & Metrics

### Quantitative
- ✅ Phase 1 (week 4): 30%+ global coverage, 80%+ in Tier 1 modules
- ✅ Phase 2 (week 8): 40%+ global coverage, all Tier 1-2 at 70%+
- ✅ Phase 3 (week 12): 50%+ global coverage, maintained indefinitely
- ✅ CI/CD: 0 PRs merged below coverage threshold

### Qualitative
- ✅ Tests document expected behavior (readable, maintainable)
- ✅ New modules start with >60% coverage (TDD culture)
- ✅ Confidence to refactor without manual testing
- ✅ Catch regressions in integration tests (e.g., graph impact calculation changes)

### Team Impact
- ✅ Faster onboarding (tests = documentation)
- ✅ Fewer production bugs (integration tests catch edge cases)
- ✅ Sustainable pace (CI checks prevent coverage regressions)

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Test maintenance burden** | Tests become outdated, lose value | Keep tests focused on behavior, not implementation; refactor tests with code |
| **Slow CI/CD pipeline** | PRs block 10+ minutes | Run tests in parallel; use test sharding; skip E2E on every commit |
| **Tests flake (intermittent failures)** | False negatives, lose trust | Use test fixtures with deterministic seeds; avoid time-based assertions |
| **Hard to test existing code** | Can't reach 50% coverage | Don't retroactively test old code; focus on new features + critical paths |
| **Team resists writing tests** | Coverage goals not met | Start with critical modules only (Tier 1); celebrate wins; tie to code review process |

---

## 9. Alternative Approaches Considered & Rejected

### ❌ Approach A: Full Coverage First (100% target)
- **Why rejected**: Unrealistic for UI layer, wastes time on low-ROI tests, demoralizes team
- **Lesson**: Tier-based thresholds are more sustainable

### ❌ Approach B: Manual Coverage Review (no CI enforcement)
- **Why rejected**: Coverage decays over time as PRs skip tests; no accountability
- **Lesson**: CI/CD must be mandatory, not advisory

### ❌ Approach C: End-to-End Only (Playwright all flows)
- **Why rejected**: E2E is slow, brittle, doesn't catch logic errors; unit tests are faster ROI
- **Lesson**: Pyramid approach (many units, some integration, few E2E) is optimal

---

## 10. Implementation Roadmap

**Phase 1 (Weeks 1-4)**: Setup + Tier 1 tests
1. Week 1: Configure CI/CD, create test fixtures, write 20 resource-graph unit tests
2. Week 2: Add 20 auth tests, 15 VIP tests
3. Week 3: Integration tests for critical flows (create VIP → graph impact)
4. Week 4: Reach 30% coverage, Tier 1 at 80%+

**Phase 2 (Weeks 5-8)**: Tier 2 expansion
1. Week 5-6: Add 60-80 tests to services, repositories
2. Week 7: Domain logic (policy-engine, parsers)
3. Week 8: Reach 40% coverage, Tier 1-2 maintained at 70%+

**Phase 3 (Weeks 9-12)**: UI + E2E + completion
1. Week 9-10: Frontend hooks, 25-30 tests
2. Week 11: E2E scenarios (5-8 critical flows)
3. Week 12: Reach 50% coverage, close gaps

---

## 11. Notes & Open Questions

- **Question 1**: Should we run E2E tests on every PR or only on main/develop?
  - **Answer** (TBD after user review): Suggested — E2E only on main, unit+integration on PR
  
- **Question 2**: Database seeding strategy — fixed seed or random?
  - **Answer** (TBD): Use `@faker-js/faker` for realistic data, but seed Random for reproducibility

- **Question 3**: Should existing tests (15 files) be refactored or kept?
  - **Answer** (TBD): Keep and build on them; refactor only if blocking new tests

---

**Document Status**: Ready for user review and feedback.
