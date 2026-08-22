# Phase 5 Deep Dive — Research Findings

**Date:** 2026-08-22  
**Status:** ANALYSIS COMPLETE

---

## Question 1: Catalog Service Status

### Finding: ✅ IMPLEMENTED & READY FOR TESTING

**Location:** `packages/backend/src/modules/catalog/`

**Services:**
```
catalog-entity.service.ts      — Main CRUD service
catalog-entity-relation.service.ts — Relations between entities
dependency-graph.service.ts    — Compute dependency graph
```

**CatalogEntityService API:**
```typescript
public async list(
  filters: CatalogEntityFilters,
  pagination: Pagination,
): Promise<ListCatalogEntitiesResult>
```

**Entity Model:**
```typescript
interface CatalogEntityDto {
  id: string;
  kind: string;                 // 'server' | 'application' | 'database' | 'url' | 'vip'
  type: string;                 // e.g., 'compute', 'api', 'storage'
  name: string;                 // Unique name
  namespace: string;            // Organizational grouping
  title: string | null;         // Display name
  description: string | null;
  lifecycle: string;            // 'active', 'deprecated', 'experimental'
  ownerTeamId: string | null;
  systemId: string | null;
  repositoryUrl: string | null;
  metadata: Record<string, unknown>; // Custom fields
  createdAt: Date;
  updatedAt: Date;
}
```

**Integration Points:**
- ✅ Database: PostgreSQL (uses repository pattern)
- ✅ Organization isolation: Via orgContext (like Phase 4)
- ✅ Audit logging: Supported (pattern exists)
- ✅ Pagination: Built-in (page, pageSize, total)

**Test Data Available:**
- Phase 4 already created 5 test entities (servers, apps, databases, VIPs)
- Can reuse ecosystem test data pattern

---

## Question 2: Governance Framework Implementation

### Finding: ✅ IMPLEMENTED (RBAC) & PARTIALLY TESTED

**Location:** `packages/backend/src/modules/governance/`

**Framework Type:** RBAC (Role-Based Access Control) + Policy Engine

**Services:**
```
policy.service.ts              — CRUD + evaluation
policy-evaluation.service.ts   — Policy rule evaluation
policy-exemption.service.ts    — Handle exemptions
```

**Policy Model:**
```typescript
interface Policy {
  id: string;
  name: string;
  slug: string;                 // Unique identifier
  description: string | null;
  policy_type: string;          // e.g., 'quality', 'security', 'compliance'
  definition: string;           // JSON rule definition
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
```

**Policy Definition Example (from tests):**
```typescript
definition: JSON.stringify({
  rules: [...],
  combinator: 'AND'              // AND | OR logic
})
```

**Existing Unit Tests:**
✅ policy.service.test.ts (6 unit tests):
- ValidationError on invalid definition
- ConflictError on duplicate slug
- NotFoundError on missing policy
- Create, update, delete operations
- Audit logging

✅ policy-engine.test.ts (additional domain tests)

**Missing:**
❌ **Integration tests** (database + service together)  
❌ **E2E tests** (role-based access workflows)  

---

## Question 3: Test Data Sourcing Strategy

### Recommendation: Reuse Phase 4 Patterns + Extend

**Data Pyramid:**

```
┌─────────────────────────────────────┐
│ E2E Test Data (Real UI Workflows)   │  ← Create via Playwright
│ - User creates policy via UI         │
│ - User assigns roles to resources    │
└─────────────────────────────────────┘
            ↑
┌─────────────────────────────────────┐
│ Integration Test Data (Database)    │  ← Seed via fixtures
│ - 5-10 catalog entities (server,    │
│   app, database types)              │
│ - 3-5 policies (quality, security)  │
│ - 2-3 role assignments (admin,      │
│   viewer, editor)                   │
└─────────────────────────────────────┘
            ↑
┌─────────────────────────────────────┐
│ Unit Test Data (Mocks)              │  ← Build test doubles
│ - Factory builders (buildPolicy(),  │
│   buildCatalogEntity())             │
│ - Repository mocks                  │
└─────────────────────────────────────┘
```

**Fixtures to Create:**

```typescript
// packages/backend/src/test-fixtures/catalog-data.ts
async function seedCatalogData(db: Knex) {
  await db('catalog_entities').insert([
    {
      id: 'entity-1',
      kind: 'server',
      type: 'compute',
      name: 'prod-server-01',
      namespace: 'production',
      lifecycle: 'active',
      // ... more fields
    },
    // ... 5-10 entities total
  ]);
}

// packages/backend/src/test-fixtures/governance-data.ts
async function seedGovernanceData(db: Knex) {
  await db('policies').insert([
    {
      id: 'policy-1',
      name: 'Production Requires Owner',
      slug: 'production-requires-owner',
      policy_type: 'quality',
      definition: JSON.stringify({
        rules: [
          { field: 'environment', operator: 'equals', value: 'production' },
          { field: 'ownerTeamId', operator: 'is_not_null', value: null }
        ],
        combinator: 'AND'
      }),
      is_active: true,
    },
    // ... 3-5 policies total
  ]);
}
```

**Reuse from Phase 4:**
✅ setupTestDatabase()  
✅ resetTestDatabase()  
✅ teardownTestDatabase()  
✅ orgContext.run() for org isolation  

---

## Question 4: Cross-Module Testing Scope

### Finding: YES, Include Integration Tests

**Cross-Module Dependency Chain:**

```
EcosystemPage (UI)
    ↓
Ecosystem Service (API)
    ↓
Catalog Service (inventory) + Governance Service (permissions)
    ↓
Database
```

**Recommended Test:**

**E2E Scenario: "User browses ecosystem with limited permissions"**
```
1. Setup: Governance assigns 'viewer' role to user
2. EcosystemPage loads
3. User sees only nodes they have 'viewer' access to
4. User tries to edit → 403 Forbidden (governance check blocks)
5. Assert: Ecosystem respects governance policies
```

**Implementation:**
- Phase 5 E2E: Add 1 test for "Ecosystem + Governance" integration
- Verify: Permission checks work end-to-end
- Don't need full duplicate test, just one happy-path + one deny-path

**Where to Put It:**
- Option A: In EcosystemPage.spec.ts (add 1 test for permissions)
- Option B: In governance E2E tests (add 1 test with ecosystem)
- **Recommendation:** Option A (EcosystemPage is the user-facing integration point)

---

## Question 5: Performance Testing Requirements

### Finding: Optional, but Recommended Baseline

**Performance Concern from Investigation:**
- Catalog with 10K+ entities should search in <500ms (P95)
- EcosystemGraph with 1000+ relationships should render in <1s

**Recommendation for Phase 5:**

**Add 1 Performance Baseline Test (Integration):**
```typescript
it('lists 1000 catalog entities with pagination in <500ms', async () => {
  // Setup: Seed 1000 entities
  await seedLargeCatalog(1000);
  
  // Act & Assert
  const start = performance.now();
  const result = await catalogService.list(
    { kind: 'server' },
    { page: 1, pageSize: 100 }
  );
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(500);
  expect(result.items).toHaveLength(100);
});
```

**Why Baseline, Not Full Testing:**
- Phase 5 focus: Coverage (60%)
- Phase 6+ focus: Performance optimization
- Baseline allows future regression detection

**Cost:** 30-60 min implementation (low priority)

---

## Summary Table

| Question | Finding | Action | Priority |
|----------|---------|--------|----------|
| **Catalog Service?** | ✅ Implemented, ready | Proceed with integration tests | 🟢 High |
| **Governance Framework?** | ✅ Implemented (RBAC), unit tests exist | Add integration + E2E tests | 🟢 High |
| **Test Data?** | ✅ Can reuse Phase 4 pattern | Create catalog + governance fixtures | 🟢 High |
| **Cross-module?** | ✅ Opportunity for 1 integration test | Add "Ecosystem + Governance" E2E | 🟡 Medium |
| **Performance?** | ✅ Worth baseline | Add 1 performance baseline test | 🟡 Low |

---

## Revised Phase 5 Plan

### Tasks (13 Total)

**Main Track (10 tasks):**
- **Task 1:** Investigation (async, if blockers found during implementation)
- **Task 2-3:** Catalog Integration Tests (3 tests) + Verification
- **Task 4-5:** Catalog E2E Tests (3 tests) + Verification
- **Task 6-7:** Governance Integration Tests (3 tests) + Verification
- **Task 8-9:** Governance E2E Tests (3 tests, including "Ecosystem + Governance") + Verification
- **Task 10:** Cross-module Integration Test (Ecosystem + Governance)

**Validation Track (3 tasks):**
- **Task 11:** Coverage Validation (60%+ check)
- **Task 12:** Phase 5 Results Documentation
- **Task 13:** Performance Baseline Summary + Phase 6 Preview

### Key Implementation Details

**Catalog Integration Tests (Task 2):**
```typescript
it('lists catalog entities with pagination', async () => {
  // Setup: Seed 5 entities (server, app, database, url, vip)
  // Act: Call catalogService.list({ kind: 'server' }, pagination)
  // Assert: Returns 1 server, correct pagination metadata
});

it('filters entities by multiple attributes', async () => {
  // Setup: Seed mixed entities
  // Act: Filter by { kind: 'application', lifecycle: 'active' }
  // Assert: Returns only matching entities
});

it('preserves custom metadata during CRUD', async () => {
  // Setup: Create entity with metadata: { owner: 'team-a', tier: 'premium' }
  // Act: Retrieve and update
  // Assert: Metadata preserved across operations
});
```

**Governance Integration Tests (Task 6):**
```typescript
it('creates policy and checks validation', async () => {
  // Setup: Use policyService with real repository
  // Act: Create policy with valid JSON definition
  // Assert: Policy saved with correct structure
});

it('rejects policy with invalid definition', async () => {
  // Setup: Invalid JSON
  // Act: Try to create
  // Assert: ValidationError thrown
});

it('prevents duplicate policy slugs', async () => {
  // Setup: Create first policy
  // Act: Try to create second with same slug
  // Assert: ConflictError thrown
});
```

**Governance E2E Tests (Task 8, including cross-module):**
```typescript
it('user with viewer role sees filtered catalog', async () => {
  // Setup: Governance assigns 'viewer' role; governance filters catalog
  // Act: User browses EcosystemPage
  // Assert: Only visible entities appear in graph
});

it('user with editor role can edit catalog', async () => {
  // Setup: Governance assigns 'editor' role
  // Act: User modifies entity metadata
  // Assert: Change persists; governance audit logged
});

it('user without permission gets 403 on edit', async () => {
  // Setup: Governance denies 'edit' permission
  // Act: User tries to edit entity
  // Assert: 403 Forbidden response; no change made
});
```

---

## Go-Forward Recommendation

✅ **Proceed with Phase 5 as planned:**
- Catalog service: Ready for integration + E2E tests
- Governance service: Ready for integration + E2E tests
- Test data: Can reuse Phase 4 fixtures + extend
- Cross-module: Include 1 "Ecosystem + Governance" E2E test
- Performance: Optional baseline test (low priority)

**No blockers identified.**  
**Ready for Task 2 kickoff.**

---

**Deep Dive Complete.** Findings confirm Phase 5 plan is achievable with current implementation. 🟢
