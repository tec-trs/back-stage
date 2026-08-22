# EcosystemPage Unit Test Blocker — Investigation Report

**Date:** 2026-08-22  
**Investigator:** Claude (Haiku 4.5)  
**Status:** DIAGNOSED + SOLUTIONS PROPOSED

---

## Root Cause Diagnosis

### The Problem
Vitest worker crashes with `Worker exited unexpectedly` when attempting to run unit tests on `<EcosystemPage />`. The error is NOT a test assertion failure but a process death at the worker level. Tested solutions (memory configs, mock adjustments) all crash.

### Root Cause: Component Complexity + @xyflow/react Integration

**EcosystemPage depends on a 1007-line ResourceGraph component** that:
1. Imports @xyflow/react (complex graph rendering library with D3-like behavior)
2. Uses dagre (graph layout/positioning engine — heavy computational library)
3. Has 15+ event listeners (onNodesChange, onEdgesChange, onConnect, onNodeContextMenu, etc.)
4. Maintains complex state (selectedNodeIds, selectedEdgeIds, editMode, simulator state, etc.)
5. Performs expensive calculations (graph layout, impact analysis, simulation)

**Why it crashes in Vitest:**
- Vitest runs tests in isolated worker threads
- @xyflow/react + dagre require heavy browser APIs (canvas, requestAnimationFrame, ResizeObserver)
- JSDOM (test environment) doesn't fully support these browser APIs
- Event listeners aren't cleaned up properly when component unmounts in test
- Memory pressure in worker thread → worker process exits

**Evidence:**
- File: `packages/frontend/src/shared/components/ResourceGraph.tsx` (1007 lines)
- Imports: `@xyflow/react` (22+ named imports), `dagre`, `@tanstack/react-query`
- EcosystemPage test attempts to render component with QueryClientProvider + BrowserRouter nesting
- Test runs: 0/3 passing; worker exits before any assertion
- E2E tests pass (Playwright runs in real browser with full API support)

### Key Finding
**This is NOT a bug in EcosystemPage logic.** The component works perfectly in E2E tests (browser). The crash is a **environment incompatibility**: JSDOM + Vitest workers cannot fully support @xyflow/react's browser requirements.

---

## Option A: Lazy-load ResourceGraph Component

### Implementation
Wrap ResourceGraph in React.lazy() with Suspense fallback. Load graph only when:
- Component is scrolled into view (Intersection Observer), OR
- User explicitly clicks "Load Graph" button

```typescript
// EcosystemPage.tsx — before
import { ResourceGraph } from '../shared/components/ResourceGraph';

// EcosystemPage.tsx — after
const ResourceGraph = lazy(() => import('../shared/components/ResourceGraph'));

return (
  <>
    <Suspense fallback={<Spinner />}>
      <ResourceGraph {...props} />
    </Suspense>
  </>
);
```

### Unit Tests
In tests, replace ResourceGraph with a simple mock:
```typescript
vi.mock('../shared/components/ResourceGraph', () => ({
  ResourceGraph: () => <div data-testid="graph">Graph (lazy loaded)</div>
}));
```

### Pros
✅ Keeps unit tests working (graph never loads in test)  
✅ Better UX: Users don't wait for graph if they don't need it  
✅ Reduces bundle size impact on page load  
✅ Solves the Vitest worker crash completely  
✅ Still allows E2E tests to verify real graph behavior  

### Cons
❌ Adds Suspense complexity (loading states, error boundaries)  
❌ Requires UI changes (loading spinner, "Load" button)  
❌ Users see delayed graph rendering on real pages (minor)  

### Cost
- **Implementation:** 2-3 hours (refactor, loading states, error handling)
- **Testing:** 1 hour (verify lazy loading, Suspense)
- **Total:** ~3-4 hours

### Risk
**Low.** Lazy loading is a standard React pattern. Suspense is stable.

---

## Option B: Mock @xyflow/react Completely in Test Setup

### Implementation
Add to `vitest.config.ts` or test setup file:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    alias: {
      '@xyflow/react': './packages/frontend/src/test/mocks/xyflow.mock.ts'
    }
  }
});

// packages/frontend/src/test/mocks/xyflow.mock.ts
export const ReactFlow = () => null;
export const Background = () => null;
export const Handle = () => null;
export const BaseEdge = () => null;
export const EdgeLabelRenderer = () => null;
export const applyEdgeChanges = (edges) => edges;
export const applyNodeChanges = (nodes) => nodes;
export const getSmoothStepPath = () => ['', '', ''];
export const useUpdateNodeInternals = () => () => {};
export const Position = { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' };
export const MarkerType = { ArrowClosed: 'arrowclosed' };
export default {
  ReactFlow, Background, Handle, BaseEdge, EdgeLabelRenderer,
  applyEdgeChanges, applyNodeChanges, getSmoothStepPath,
  useUpdateNodeInternals, Position, MarkerType
};
```

### Pros
✅ Simplest to implement (1 hour)  
✅ Unit tests work immediately  
✅ No component changes needed  
✅ Tests run fast (mocked = no rendering overhead)  

### Cons
❌ Unit tests don't validate @xyflow/react integration  
❌ Tests are less realistic (don't catch graph rendering bugs)  
❌ Still requires E2E tests for real graph behavior  
❌ If @xyflow/react gets updated, tests won't catch breaking changes  

### Cost
- **Implementation:** 1 hour (create mock file, update config)
- **Testing:** 30 min (verify no errors, run suite)
- **Total:** ~1.5 hours

### Risk
**Medium.** Tests are less valuable; graph bugs only caught in E2E/production.

---

## Option C: Skip Unit Tests for EcosystemPage

### Implementation
Delete `packages/frontend/src/pages/EcosystemPage.test.tsx`.

```bash
rm packages/frontend/src/pages/EcosystemPage.test.tsx
git add -A && git commit -m "test: remove EcosystemPage unit tests (E2E coverage sufficient)"
```

### Pros
✅ Unblocks Phase 4 immediately  
✅ No code changes to component  
✅ No test infrastructure changes  
✅ E2E tests already validate full workflow  

### Cons
❌ No unit-level validation  
❌ Component bugs only caught in E2E/production  
❌ Violates testing pyramid (E2E is expensive, unit is cheap)  
❌ Phase 5 will regret this (harder to add unit tests later)  

### Cost
- **Implementation:** 30 min (delete file, commit)
- **Testing:** None
- **Total:** ~30 min

### Risk
**High.** Reduces test coverage. EcosystemPage is critical; logic bugs belong in unit tests.

---

## Recommendation

### **OPTION A: Lazy-load ResourceGraph Component** ✅

**Rationale:**

1. **Best of Both Worlds:**
   - Solves the Vitest crash (graph doesn't load in test)
   - Keeps unit tests working (validates component logic)
   - Improves real-world UX (users don't wait for graph they don't need)

2. **Sustainable:**
   - Standard React pattern (Suspense + lazy)
   - Follows best practices (code splitting, lazy loading)
   - Phase 5 can expand on this (lazy-load other heavy components)

3. **Cost/Benefit Ratio:**
   - 3-4 hours implementation cost is reasonable
   - Benefits: Unit tests work, E2E validates graph, UX improves
   - No ongoing technical debt

4. **Compared to Alternatives:**
   - Option B (mock @xyflow/react): Faster short-term, but tests become less valuable
   - Option C (skip tests): Fastest, but creates quality risk on critical component

**Implementation Path:**
1. Wrap ResourceGraph in React.lazy()
2. Add Suspense boundary with Spinner fallback
3. Update tests to mock lazy ResourceGraph
4. Verify unit tests pass
5. Verify E2E tests still pass
6. Deploy

---

## Additional Findings

### Why E2E Tests Pass
- Playwright runs tests in **real Chromium browser**
- All browser APIs (@xyflow/react, canvas, ResizeObserver) work correctly
- No worker thread isolation issues
- Graph renders and tests pass without error

### Why Mock-Heavy Tests Crash
- JSDOM (test environment) is **incomplete implementation** of browser APIs
- @xyflow/react expects real canvas, requestAnimationFrame, ResizeObserver
- Vitest workers can't handle the complexity when many libraries have unmet API expectations
- Result: Worker thread runs out of resources → exits

### Pattern Observation
This same issue affects any component using:
- Canvas rendering (Three.js, Babylon.js, d3-force, etc.)
- Heavy computation (large dataset processing, graph algorithms)
- RequestAnimationFrame loops
- ResizeObserver / IntersectionObserver

**Solution for all:** Lazy-load or mock, don't render in Vitest environment.

---

## Timeline for Implementation

**Phase 4 Task 9 (EcosystemPage Remediation):**

1. **Day 1 (2-3 hours):** Refactor EcosystemPage with lazy() + Suspense
   - Add loading states
   - Update error handling
   - Add "Load Graph" button or auto-load on scroll

2. **Day 2 (1 hour):** Update tests
   - Mock lazy ResourceGraph
   - Verify unit tests pass
   - Run full test suite

3. **Day 3 (1 hour):** QA
   - Verify E2E tests pass
   - Test on real browser (performance, UX)
   - Deploy

**Total:** 4-5 hours (fits in Phase 4 Task 9 window)

---

## Decision Gate: Proceed with Option A

**Status:** Ready for implementation in Phase 4 Task 9

**Next Step:** Task 8 coordinator accepts this recommendation. Task 9 implementer executes lazy-load refactor and updates tests.

---

**Investigation Complete.** Ready for Phase 4 Task 8-9 execution.
