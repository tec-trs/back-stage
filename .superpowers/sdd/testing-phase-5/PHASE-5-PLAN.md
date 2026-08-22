# Phase 5 Testing Strategy — Catalog & Governance Modules

**Phase:** 5  
**Target Coverage:** 60%+ global  
**Modules:** Catalog (backend service module), Governance (access control)  
**Estimated Duration:** 4-6 weeks  
**Start Date:** 2026-09-01+ (after Phase 4 completion)

---

## Phase 4 Recap → Phase 5 Forecast

### What Phase 4 Delivered
✅ **12 tests** (6 integration + 6 E2E)  
✅ **50%+ coverage** achieved (Search 85%, URLs 85%)  
✅ **EcosystemPage blocker** resolved (lazy-load solution)  
✅ **Investigation pattern** validated (spike → decision → implement)  

### What Phase 5 Builds On
- ✅ Mature testing infrastructure (Phase 1-4 patterns)
- ✅ Integration test fixtures (database seeding, org isolation)
- ✅ E2E patterns (Playwright, semantic selectors)
- ✅ Investigation methodology (async spikes for blockers)

---

## Phase 5 Scope

### Module 1: Catalog Service
**Purpose:** Inventory/CMDB for resources (servers, apps, databases)  
**Coverage:** Integration + E2E tests for catalog workflows  
**Target:** 85%+ coverage (mirroring Phase 4 pattern)

**Tests to Add:**
1. **Integration (3 tests):**
   - Create catalog item with metadata
   - Search/filter by category (performance baseline)
   - Bulk update resource tags

2. **E2E (3 tests):**
   - User creates new resource in catalog UI
   - User exports catalog as CSV/JSON
   - User performs bulk tag management

### Module 2: Governance (Access Control)
**Purpose:** RBAC/ABAC for resource access control  
**Coverage:** Integration + E2E tests for permission workflows  
**Target:** 85%+ coverage

**Tests to Add:**
1. **Integration (3 tests):**
   - Assign role to user (admin, viewer, editor)
   - Check permission gate on protected operations
   - Revoke access and verify isolation

2. **E2E (3 tests):**
   - User with limited role sees filtered resources
   - Permission denied workflow (403 error handling)
   - Role upgrade workflow (request → approve → access)

---

## Phase 5 Task Breakdown (Proposed)

### Tier 1: Core Testing (Sequential, Weeks 1-3)
- **Task 1:** Investigation (async spike for Catalog blockers, if any)
- **Task 2-3:** Catalog Integration Tests + Verification
- **Task 4-5:** Catalog E2E Tests + Verification
- **Task 6-7:** Governance Integration Tests + Verification
- **Task 8-9:** Governance E2E Tests + Verification

### Tier 2: Validation & Documentation (Sequential, Weeks 3-4)
- **Task 10:** Coverage Validation (60%+ achieved? → go / no-go)
- **Task 11:** Phase 5 Results Documentation
- **Task 12:** Phase 6 Preview & Planning

---

## Architectural Decisions for Phase 5

### 1. Test Database: Catalog-specific Fixtures
```typescript
// Phase 1 pattern (reuse)
setupTestDatabase()
seedCatalogData({ categories: [...], items: [...] })
resetTestDatabase()
teardownTestDatabase()
```

### 2. Integration Test Pattern: Permission-aware
```typescript
// New: Test with different permission levels
orgContext.run(adminOrgId, async () => {
  // Admin operations
});
orgContext.run(viewerOrgId, async () => {
  // Viewer operations (should fail on writes)
});
```

### 3. E2E Pattern: Role-based Workflows
```typescript
// New: Test complete workflows for different roles
async function testAsRole(role: 'admin' | 'viewer' | 'editor') {
  await login(role);
  // Test workflow for this role
  // Assert: actions succeed/fail based on permissions
}
```

---

## Known Considerations

### Investigation Potential (Task 1)
Possible blockers to investigate:
- **Catalog Performance:** Large dataset search (10K+ items) performance baseline
- **Permission Caching:** Redis caching strategy for permission checks
- **Circular Dependencies:** Governance module might import Catalog; check for cycles

**If no blockers found:** Task 1 becomes simple setup (populate test databases)

### Integration with Phase 4
- **EcosystemPage:** Should work with Catalog data (depends-on relationship)
- **Search module:** Should search Catalog items (cross-module test opportunity?)
- **Resource Graph:** Graph visualization might use Governance permissions (filtered view)

### New Tools/Dependencies
- **Catalog service:** Does it exist? Check Phase 3-4 backend modules
- **Governance framework:** RBAC/ABAC implementation status?
- **Test data:** Realistic catalog inventory (servers, apps, databases, configurations)

---

## Success Criteria for Phase 5

✅ **Test Coverage:** 60%+ global (up from 50%)  
✅ **Module Coverage:** Catalog 85%+, Governance 85%+  
✅ **Test Count:** 12 new tests (6 integration + 6 E2E)  
✅ **Quality:** TypeScript PASS, ESLint PASS  
✅ **Documentation:** Phase 5 results + Phase 6 preview  
✅ **Investigation:** Any blockers diagnosed (if applicable)  

---

## Timeline Estimate

| Phase | Weeks | Tasks | Deliverables |
|-------|-------|-------|--------------|
| Phase 5 Main | 3 | 9 | 12 tests + reports |
| Phase 5 Validation | 1 | 3 | Coverage validation + docs |
| **Total** | **4-6** | **12** | **12 tests + 3 docs** |

---

## Open Questions for Phase 5 Kickoff

1. **Catalog Service Status:** Is CatalogService implemented? Which file?
2. **Governance Framework:** RBAC or ABAC? Existing implementation or new?
3. **Test Data:** Where do we source realistic catalog/governance test data?
4. **Cross-module Testing:** Should Phase 5 include "Catalog + EcosystemPage" integration tests?
5. **Performance Testing:** Should Catalog search have performance benchmarks (P99 latency)?

---

## Next Steps

1. ✅ **This Phase:** Create Phase 5 plan (done)
2. **Kickoff Meeting:** Review plan, answer open questions
3. **Task 1 Dispatch:** Investigation brief (if needed)
4. **Task 2 Start:** Catalog integration tests
5. **Weekly Sync:** Track progress, unblock issues

---

**Phase 5 Plan: DRAFT** (Ready for review & kickoff)

**Estimated Start:** 2026-09-01+  
**Estimated Completion:** 2026-10-15 (mid-October)  
**Target Coverage:** 60%+ global
