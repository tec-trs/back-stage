# CI/CD Integration Guide - Testing Infrastructure

**Status:** Setup Guide  
**Date:** 2026-08-22  
**Target:** PostgreSQL 16 + Test Coverage Pipeline  

---

## Prerequisites

### Required Services
- PostgreSQL 16 (test database)
- Jest/Vitest configured
- ESLint + TypeScript strict mode
- Coverage reporting tools

### Environment Setup

```bash
# Install dependencies
npm install

# Test database setup
docker run -d \
  --name postgres-test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=back_stage_test \
  -p 5433:5432 \
  postgres:16

# Run all tests
npm test

# Generate coverage report
npm run test:coverage
```

---

## GitHub Actions Workflow

### File: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: back_stage_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build shared
        run: npm run build:shared
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/back_stage_test
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
```

---

## Local Development Setup

### 1. PostgreSQL Docker
```bash
docker-compose up -d postgres
```

### 2. Run Specific Test Suite
```bash
# Single module
npm test -- audit-log.service.integration

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

### 3. Coverage Thresholds

**Global Target:** 80%+

```javascript
// jest.config.cjs
module.exports = {
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  }
};
```

---

## Test Database Management

### Setup Phase 1 Fixtures

```bash
# Database migrations (if needed)
npm run db:migrate

# Seed test data
npm run db:seed:test

# Verify connection
npm run db:test:health
```

### Cleanup After Tests

- Phase 1 fixtures handle: `setupTestDatabase()`, `resetTestDatabase()`, `teardownTestDatabase()`
- Automatic isolation per test via `orgContext.run()`
- No manual cleanup needed

---

## Coverage Validation

### Local Check
```bash
npm run test:coverage
# Check coverage/index.html
```

### CI Pipeline Check
```bash
# Fails if below threshold
npm run test:coverage -- --fail-on-threshold
```

### Coverage Report
- Global: 80%+
- Per module: Minimum 70%
- Critical paths: 85%+

---

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check container
docker ps | grep postgres

# Check logs
docker logs postgres-test

# Restart
docker restart postgres-test
```

### Test Failures
```bash
# Run single test with verbose
npm test -- audit-log --verbose

# Check database state
npm run db:test:status

# Reset test database
npm run db:reset
```

### Coverage Not Updating
```bash
# Clear cache
npm test -- --clearCache

# Regenerate
npm run test:coverage
```

---

## Integration Checklist

- [ ] PostgreSQL 16 service running
- [ ] All tests passing locally
- [ ] Coverage at 80%+
- [ ] ESLint clean
- [ ] TypeScript strict mode
- [ ] GitHub Actions workflow configured
- [ ] Coverage reporting enabled
- [ ] Team trained on patterns

---

## Team Handoff

### Key Files to Review
1. `FINAL-TESTING-SUMMARY.md` - Overview
2. `PHASE-5-RESULTS.md` through `PHASE-9-RESULTS.md` - Details per phase
3. Test files in `/modules/*/application/*integration.test.ts`

### Patterns to Understand
- **Phase 1 Fixtures:** Database setup/reset/teardown
- **Organization Isolation:** orgContext.run()
- **Test Data:** Date.now() for uniqueness
- **Mocking:** jest.spyOn() for repository methods
- **Assertions:** Expect() patterns

### Getting Started
1. Read FINAL-TESTING-SUMMARY.md
2. Review Phase 5 tests (foundation)
3. Run local tests: `npm test`
4. Check coverage: `npm run test:coverage`
5. Ask questions on test patterns

---

## Next Phase (Phase 10)

**Planned:** Additional module coverage
- Target: 85%+
- Timeline: 2 weeks
- Modules: TBD based on gaps

---

**CI/CD Ready:** ✅  
**Local Development Ready:** ✅  
**Team Handoff Ready:** ✅

Next step: Deploy to CI/CD environment
