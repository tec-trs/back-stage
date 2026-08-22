# Task 9: Verify Phase 1 Coverage Target (30%+)

**Files:**
- Read: `packages/backend/coverage/` (coverage reports)
- Modify: `packages/backend/package.json` (add coverage:report script)

**Context:** Verify Phase 1 target of 30% global coverage achieved. Generate HTML report for visibility.

**Steps:**
1. Run full test suite with coverage: `cd packages/backend && npm run test:coverage`
2. Expected output: Test results + coverage summary
3. Verify Phase 1 target met:
   - Global: 30%+
   - resource-graph: 80%+
   - auth: 80%+
   - vips: 75%+
4. Add coverage:report script to package.json if not present
5. Create docs/TESTING-PHASE-1-RESULTS.md documenting coverage results
6. Commit: "docs: phase 1 testing complete - 30% coverage achieved"

**Expected coverage output format:**
```
File                 | % Stmts | % Branch | % Funcs | % Lines |
------------------------------------------------------------------
resource-graph       |     85  |    82    |   87    |   85    |
auth                 |     82  |    80    |   84    |   82    |
vips                 |     78  |    76    |   80    |   78    |
------ Global -------|     30  |    25    |   32    |   30    |
```

**Report file:** `.superpowers/sdd/testing-phase-1/task-9-report.md`

**Commit message:** "docs: phase 1 testing complete - 30% coverage achieved"

**Success criteria:**
- Global coverage 30%+
- Tier 1 modules (resource-graph, auth, vips) at 75%+
- HTML coverage report generated
- Summary document created
- Fresh commit
