# Task 9 Brief: EcosystemPage Remediation (Based on Investigation)

**Where this fits:** Task 9 implements the solution chosen from the investigation (Task 1/Task 8). It remediates the EcosystemPage unit test blocker.

**BLOCKER:** This task cannot start until Task 8 (investigation findings) is complete. Do not dispatch this task until `.superpowers/phase-4/investigation-report.md` exists and has been read.

---

## Context: Three Solution Paths

Investigation (Task 1) will determine which path to take. This brief covers all three.

---

## Path A: Lazy-load ResourceGraph Component

**If investigation recommends Option A:**

### What You're Doing

Wrap the ResourceGraph component in `React.lazy()` + `Suspense`. This prevents the heavy graph library from loading in unit test environment.

### Files to modify:
- `packages/frontend/src/pages/EcosystemPage.tsx` (refactor to lazy-load)
- `packages/frontend/src/pages/EcosystemPage.test.tsx` (add tests with Suspense)

### Implementation steps:

```typescript
// In EcosystemPage.tsx
import React, { Suspense } from 'react';
const ResourceGraphLazy = React.lazy(() => import('../shared/components/ResourceGraph'));

// In render:
<Suspense fallback={<Spinner />}>
  <ResourceGraphLazy nodes={nodes} edges={edges} />
</Suspense>
```

### Tests to add:

```typescript
it('renders EcosystemPage with lazy graph', async () => {
  renderWithProviders(<EcosystemPage />);
  
  // Wait for Suspense to resolve
  await waitFor(() => {
    expect(screen.queryByTestId('resource-graph')).toBeInTheDocument();
  });
});
```

### Commit:
```bash
git commit -m "refactor: lazy-load ResourceGraph in EcosystemPage + add component tests"
```

---

## Path B: Mock Graph Library Completely

**If investigation recommends Option B:**

### What You're Doing

Update test setup to fully mock the graph library (@xyflow/react or equivalent). This prevents actual DOM rendering in tests.

### Files to modify:
- `packages/frontend/src/pages/EcosystemPage.test.tsx` (add mock setup)
- Possibly: `packages/frontend/vitest.config.ts` (if mock needs to be global)

### Implementation steps:

```typescript
// In EcosystemPage.test.tsx — beforeEach or at top of file:
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children, nodes, edges, onConnect }) => (
    <div data-testid="mocked-graph">
      <div>{nodes.length} nodes</div>
      <div>{edges.length} edges</div>
    </div>
  ),
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  Handle: ({ children }) => <div>{children}</div>,
}));

// Now EcosystemPage tests can render without crashing
it('renders EcosystemPage', async () => {
  renderWithProviders(<EcosystemPage />);
  expect(screen.getByTestId('mocked-graph')).toBeInTheDocument();
});
```

### Tests to add:

```typescript
it('renders with mocked graph', async () => {
  renderWithProviders(<EcosystemPage />);
  await waitFor(() => {
    expect(screen.getByTestId('mocked-graph')).toBeInTheDocument();
  });
});

it('passes nodes and edges to graph', async () => {
  renderWithProviders(<EcosystemPage />);
  const graph = await screen.findByTestId('mocked-graph');
  expect(graph).toHaveTextContent('5 nodes'); // or whatever seeded data has
});
```

### Commit:
```bash
git commit -m "test: mock graph library in EcosystemPage tests + add component tests"
```

---

## Path C: Skip Unit Tests

**If investigation recommends Option C:**

### What You're Doing

Accept that EcosystemPage cannot be unit-tested in this environment. Delete the parked test file and rely on E2E validation.

### Files to modify:
- Delete: `packages/frontend/src/pages/EcosystemPage.test.tsx` (or rename to .skip.tsx)

### Steps:

```bash
# Option 1: Delete
rm packages/frontend/src/pages/EcosystemPage.test.tsx

# Option 2: Rename to skip (preserve history)
git mv packages/frontend/src/pages/EcosystemPage.test.tsx packages/frontend/src/pages/EcosystemPage.test.skip.tsx
```

### Commit:
```bash
git commit -m "test: remove EcosystemPage unit tests — component validated via E2E"
```

---

## Universal Steps (All Paths)

1. **Read investigation report** at `.superpowers/phase-4/investigation-report.md`
2. **Understand the chosen solution** and its rationale
3. **Implement the solution** (Path A, B, or C based on report)
4. **Run full test suite:**
   ```bash
   npm run test
   ```
   Expected: All tests passing (or no change if Path C)
5. **Verify TypeScript:**
   ```bash
   npm run typecheck
   ```
   Expected: PASS
6. **Verify ESLint:**
   ```bash
   npm run lint
   ```
   Expected: PASS
7. **Commit** with appropriate message
8. **Report completion**

---

## Report Contract

**Status:** DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED

**Report contents:**
- [ ] Investigation report read and understood
- [ ] Solution implemented (Path A/B/C)
- [ ] Full test suite passing (or no change for Path C)
- [ ] TypeScript: no errors
- [ ] ESLint: no violations
- [ ] Commit: [hash] with message

**One-liner:** 
- Path A: "EcosystemPage lazy-loaded. Component tests added and passing."
- Path B: "Graph library mocked. Component tests added and passing."
- Path C: "EcosystemPage unit tests removed. E2E validation in place."

**Concerns (if any):** Any issues with the chosen solution, or gaps in investigation report

---

## Timing

- This task starts only when Task 8 (investigation) is complete
- Expected: Week 3-4 of Phase 4 timeline
- Unblocks documentation task (Task 10)

