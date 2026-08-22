# Task 1: Configure Vitest with Coverage Thresholds

**Files:**
- Modify: `packages/backend/vitest.config.ts`
- Create: `packages/backend/tsconfig.test.json`

**Interfaces:**
- Produces: Vitest configured with per-file thresholds for Tier 1 modules (resource-graph 80%, auth 80%, vips 75%, etc)

**Context:** Phase 1 focuses on critical modules. Thresholds will be enforced in CI/CD to prevent coverage regression.

**Steps from plan:**

1. Read current vitest config and verify it exists
2. Create TypeScript config for tests (`tsconfig.test.json`)
3. Update `vitest.config.ts` with Phase 1 thresholds
4. Verify config syntax with `npx vitest list`
5. Commit changes

**Expected code (tsconfig.test.json):**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "node"],
    "target": "ES2020"
  },
  "include": ["src/**/*.test.ts", "src/**/*.spec.ts"]
}
```

**Expected vitest.config.ts update (coverage section):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'src/database/migrations/**',
        'src/database/seeds/**',
        'src/**/*.d.ts',
        'src/**/*.integration.test.ts',
        'src/index.ts',
        'src/server.ts',
        'src/observability/tracing.ts',
      ],
      // Phase 1: 25% global minimum
      lines: 25,
      functions: 25,
      branches: 15,
      statements: 25,
      // Per-file thresholds for Tier 1 (critical modules)
      perFile: true,
      all: {
        lines: 25,
      },
    },
  },
});
```

**Verification:**
- Run: `cd packages/backend && npx vitest list`
- Expected: No errors, shows Vitest ready to run tests

**Commit message:** "test: configure vitest with Phase 1 coverage thresholds"

**Success criteria:**
- vitest.config.ts has coverage thresholds (25% global)
- tsconfig.test.json created
- `npx vitest list` runs without errors
- Fresh git commit with task message
