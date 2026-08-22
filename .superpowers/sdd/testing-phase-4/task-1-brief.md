# Task 1 Brief: Dispatch Investigation Subagent

**Where this fits:** Phase 4 has two parallel tracks. Track 1 (investigation) diagnoses the EcosystemPage unit test blocker that crashed in Phase 3. This task dispatches a fresh investigation subagent to work async (1-2 weeks) while the main track (Tasks 2-10) executes independently.

**Your mission:** You are a coordinator. Do NOT implement code yourself. Instead, prepare a detailed investigation brief and dispatch a fresh subagent to perform a 1-2 week spike investigating the EcosystemPage blocker. The investigation runs async. This task completes when you have dispatched the investigation and documented that dispatch.

---

## Investigation Context

**Phase 3 Blocker (Task 5 Issue):**
- Symptom: `Error: Worker exited unexpectedly` when rendering `<EcosystemPage />` in unit tests
- Environment: Vitest worker crashes — not a test assertion failure, but process death
- Tested scenarios: default memory, 8GB memory, with/without mocks — ALL crash
- Status: Parked in Phase 3. E2E tests work (browser-based validation OK). Unit tests cannot proceed.
- Files: `packages/frontend/src/pages/EcosystemPage.tsx`, `packages/frontend/src/pages/EcosystemPage.test.tsx`

**Root Cause Unknown.** Hypotheses:
1. **Memory**: EcosystemPage renders D3/Vis graph with heavy dependencies?
2. **Imports**: Circular imports detected by Vitest?
3. **Component Complexity**: 50+ DOM nodes in JSDOM exceeds worker limits?
4. **Framework Conflict**: React Query + BrowserRouter + D3 wrapper nesting issue?

---

## Investigation Goals (1-2 weeks)

**Deliverables (when investigation completes):**

1. **Root Cause Diagnosis**
   - Which hypothesis is correct?
   - Exact evidence (error messages, stack traces, reproduction steps)

2. **2-3 Solution Proposals** with trade-offs:
   - **Option A: Lazy-load graph component**
     - Cost: ~2-3 hours implementation, ~1 hour testing
     - Benefit: Keeps unit tests, better UX on slow networks
     - Risk: Adds Suspense complexity
   
   - **Option B: Mock graph library completely**
     - Cost: ~1 hour implementation
     - Benefit: Fast fix, no component changes
     - Risk: Mocked tests less realistic
   
   - **Option C: Skip unit tests**
     - Cost: ~30 min (delete tests)
     - Benefit: Unblocks Phase 4 immediately
     - Risk: No unit-level validation; only E2E covers component

3. **Recommendation** — which option you (the investigator) believe is best, and why

4. **Final Report**
   - Save to: `.superpowers/phase-4/investigation-report.md` (in repo root)
   - Format: Diagnosis section (300-400 words), each option described with code sketch if applicable, recommendation with rationale

---

## Investigation Constraints

- **Timeline:** 1-2 weeks (this task dispatches you; main tasks continue in parallel)
- **Budget:** Spike-level investigation — use cheapest tools that work. No implementation commits needed yet.
- **Testing:** Write minimal reproduction code to isolate root cause, but do NOT commit test fixes to main repo (use `git stash` or scratch files)
- **Reporting:** Save final report to repo via commit (so main coordinator can read it during Task 8)

---

## Your Dispatch Report Contract

When investigation completes:

1. **Status:** DONE (report written and committed)
2. **Report path:** `.superpowers/phase-4/investigation-report.md`
3. **Commit message:** `spike: investigate EcosystemPage unit test blocker — root cause diagnosis + 3 solutions`
4. **One-liner summary:** e.g., "Root cause: circular imports in provider nesting. Recommended: Option A (lazy-load)."
5. **Any concerns or blockers?** List them (none expected for investigation)

---

## No Subagent Rule

You are the investigator subagent. Do NOT dispatch other subagents. Do NOT ask for code review until this investigation spike completes. Investigation is yours alone.

---

## Report Template

When ready to write the final report (`.superpowers/phase-4/investigation-report.md`), use this structure:

```markdown
# EcosystemPage Unit Test Blocker — Investigation Report

**Date:** 2026-08-21+  
**Investigator:** [Your name]  
**Status:** DIAGNOSED + SOLUTIONS PROPOSED

## Root Cause Diagnosis

[300-400 words on what you found]

### Evidence
- Error message: ...
- Stack trace: ...
- Reproduction: [steps to reproduce]

## Option A: Lazy-load Graph Component

[2-3 paragraphs + code sketch]

## Option B: Mock Graph Library

[2-3 paragraphs + code sketch]

## Option C: Skip Unit Tests

[2-3 paragraphs]

## Recommendation

[Why you recommend Option A/B/C with cost/benefit analysis]
```

---

**Next Step:** Dispatch this investigation (it runs async for 1-2 weeks while main track executes). Report back when investigation-report.md is committed.

