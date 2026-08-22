# Task 10: Setup GitHub Actions CI/CD for Testing

**Files:**
- Create: `.github/workflows/test.yml`

**Context:** Automate test runs on every PR. Block merges if coverage drops below thresholds.

**Steps:**
1. Create `.github/workflows/test.yml` workflow file
2. Configure to run on: push to main/develop, all PRs
3. Services: PostgreSQL 16 test database
4. Steps:
   - Checkout code
   - Setup Node 20 + npm cache
   - Install dependencies
   - Run: lint, typecheck, unit tests, integration tests, coverage
   - Upload coverage to Codecov (optional)
5. Commit: "ci: add GitHub Actions workflow for testing"

**Workflow steps (from plan):**
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run test` — Run all tests
- `npm run test:coverage` — Generate coverage report
- `npm run coverage:check` (if exists) — Verify thresholds

**Exact workflow structure from plan:**
```yaml
name: Tests & Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: backstage_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run test:coverage
```

**Report file:** `.superpowers/sdd/testing-phase-1/task-10-report.md`

**Success criteria:**
- .github/workflows/test.yml created
- Includes postgres service with health checks
- All build steps present
- Fresh commit
