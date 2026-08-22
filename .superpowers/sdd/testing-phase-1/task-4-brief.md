# Task 4: Write Resource Graph Service Unit Tests

**Files:**
- Create: `packages/backend/src/modules/resource-graph/application/graph.service.test.ts`

**Interfaces (from plan):**
- Consumes:
  - `GraphService` from `graph.service.ts`
  - `createMockEdge()`, `createMockEdges()` from mock-factories (Task 3)
  - `createMockServer()`, `createMockApplication()`, `createMockDatabase()` from mock-factories
- Tests behavior of:
  - `simulateImpact(orgId, resourceType, resourceId)` — returns impact analysis
  - Graph service must handle: direct impact, transitive impact, cycle detection

**Context:** GraphService is the most complex module. Unit tests here don't need database—just mock the repository. Focus on business logic: impact simulation, transitive closure, cycle detection. Tests in plan use `vi.fn()` to mock repository.

**From plan — exact test file structure:**

Create file with 3 test suites:

1. **Suite 1: Direct Impact**
   - Test: "should identify direct dependents when a resource is deleted"
   - Setup: Create app1, app2, db1; both apps connect_to db1
   - Mock: `getEdgesByTargetId` returns edges
   - Act: `simulateImpact('database', 'db1')`
   - Assert: `impact.directlyImpacted` contains app1 and app2, length 2

2. **Suite 2: Transitive Impact**
   - Test: "should calculate transitive impact (cascade effect)"
   - Setup: server1 hosts app1, app1 depends_on db1 (chain)
   - Mock: `getTransitiveClosure` returns edges + transitive edges
   - Act: `simulateImpact('database', 'db1')`
   - Assert: `impact.transitivelyImpacted` contains server1

3. **Suite 3: Cycle Detection**
   - Test: "should handle cycles without infinite loops"
   - Setup: app1 → app2 → app1 (cycle)
   - Mock: edges with cycle
   - Act: `simulateImpact('application', 'app1')` (should NOT throw)
   - Assert: `impact` defined (successfully computed)

**Exact imports and test structure from plan:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphService } from './graph.service';
import { createMockEdge, createMockEdges, createMockServer, createMockApplication, createMockDatabase } from '../../../test-fixtures/mock-factories';

describe('GraphService.simulateImpact', () => {
  let service: GraphService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      getEdgesBySourceId: vi.fn().mockResolvedValue([]),
      getEdgesByTargetId: vi.fn().mockResolvedValue([]),
      getTransitiveClosure: vi.fn().mockResolvedValue([]),
    };
    service = new GraphService(mockRepository);
  });

  // 3 tests as described above
  it('should identify direct dependents...', async () => { /* test 1 code from plan */ });
  it('should calculate transitive impact...', async () => { /* test 2 code from plan */ });
  it('should handle cycles without infinite loops', async () => { /* test 3 code from plan */ });
});
```

**Verification:**
- File created: `packages/backend/src/modules/resource-graph/application/graph.service.test.ts`
- Run: `cd packages/backend && npm run test -- src/modules/resource-graph/application/graph.service.test.ts`
- Expected: 3 tests run (may pass or fail based on service implementation, but syntax must be valid)

**Commit message:** "test: add unit tests for GraphService.simulateImpact"

**Success criteria:**
- Test file created with 3 test cases
- All imports from vitest and mock-factories
- Each test follows Arrange-Act-Assert pattern
- Mock repository with vi.fn() for isolation
- Fresh git commit with descriptive message

**Note:** Tests may not pass yet if GraphService implementation is incomplete. That's expected — the plan is to establish the test structure, not necessarily green lights yet.
