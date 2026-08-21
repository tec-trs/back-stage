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
