import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
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
    },
  },
});
