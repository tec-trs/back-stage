# Task 8 Brief: Wait for Investigation Findings

**Where this fits:** Task 8 is a checkpoint/gate. It checks if the investigation (Task 1) has completed and collects the findings for Task 9.

---

## What You're Doing

**This is NOT implementation work.** This is a coordination step.

1. **Check if investigation-report.md exists:**
   - Path: `.superpowers/phase-4/investigation-report.md` (in repo root)
   - Run: `git log --oneline | grep "spike: investigate EcosystemPage"`
   - If commit exists → report has been delivered
   - If no commit yet → investigation still running (continue with Tasks 2-7 in parallel)

2. **If report exists, read it:**
   - Open `.superpowers/phase-4/investigation-report.md`
   - Extract:
     - Root cause (what was the problem?)
     - 3 solution options (A, B, C)
     - Recommendation (which option did investigator recommend?)

3. **Document findings in ledger:**
   - Record: `Task 8: Investigation complete — root cause: [X], recommended solution: [A/B/C]`
   - This becomes context for Task 9

4. **Decision:**
   - If recommendation is clear → proceed to Task 9 immediately
   - If findings are ambiguous → make ruling based on cost/benefit

---

## Expected Outputs from Investigation

**Investigation report should contain:**

### Root Cause (one of these)
- **Memory issue:** EcosystemPage graph rendering exceeds Vitest worker memory
- **Circular imports:** Provider nesting creates dependency cycle
- **DOM complexity:** 50+ nodes in JSDOM exceeds limits
- **Framework conflict:** React Query + BrowserRouter + D3 wrapper nesting

### Solution Options

**Option A: Lazy-load ResourceGraph**
- Wrap graph in React.lazy() + Suspense
- Cost: 2-3 hours implementation
- Benefit: Keeps unit tests, better UX
- Risk: Added complexity

**Option B: Mock graph library completely**
- Update test setup to mock @xyflow/react (or whichever graph lib)
- Cost: 1 hour implementation
- Benefit: Fast fix, minimal component changes
- Risk: Tests less realistic

**Option C: Skip unit tests**
- Delete EcosystemPage component unit tests
- Cost: 30 min (delete tests)
- Benefit: Unblocks Phase 4 immediately
- Risk: No unit-level validation

---

## Steps

- [ ] **Step 1: Check for investigation report**

```bash
ls -la .superpowers/phase-4/investigation-report.md 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
```

If NOT_FOUND:
- Record in ledger: `Task 8: WAITING — investigation still in progress (Task 1 async)`
- **Do not proceed to Task 9 yet.** Let Tasks 2-7 execute in parallel.
- Check back after Tasks 2-7 complete, or after ~1-2 weeks.

If FOUND:
- Continue to Step 2

- [ ] **Step 2: Read investigation report**

```bash
cat .superpowers/phase-4/investigation-report.md
```

- Extract root cause, 3 options, recommendation
- Note the commit hash: `git log --oneline --grep="spike: investigate" -1`

- [ ] **Step 3: Ledger the findings**

Record in progress.md:

```
Task 8: Investigation complete
  Root cause: [from report]
  Recommended solution: [Option A/B/C from report]
  Commit: [investigator's commit hash]
```

- [ ] **Step 4: Decision**

If investigator recommends Option A or B:
- Proceed to Task 9 with that solution
- Record ruling in ledger: `Ruling: Accepting investigator recommendation (Option A/B) — rationale from investigation report`

If investigator recommends Option C:
- Proceed to Task 9 with deletion (no remediation code needed)
- Record ruling: `Ruling: Accepting investigator recommendation (Option C) — proceed with test deletion only`

If report is ambiguous:
- Make your own call based on cost/benefit
- Record ruling: `Ruling: [choice] — [rationale] — cost if wrong: rework on next phase`

---

## Report Contract

**Status:** WAITING (if investigation not done) or COMPLETE (if done + analyzed)

**If WAITING:**
- Investigation commit: (none yet)
- One-liner: "Investigation still running (Task 1 async). Tasks 2-7 proceeding in parallel."

**If COMPLETE:**
- Investigation commit: [hash from git log]
- Root cause summary: [one-liner]
- Solution chosen: [A/B/C]
- One-liner: "Investigation complete. Proceeding with Option [A/B/C] remediation in Task 9."

---

## Timeline Notes

- Investigation was dispatched Week 1 with 1-2 week duration
- Expected completion: around Week 2 (2026-09-04+14 days ~= Sept 18)
- If not complete by then, check status with investigator
- Main tasks (2-7) can proceed in parallel without blocking

