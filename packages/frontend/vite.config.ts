import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// Build-time identity, so the running app can always tell you exactly which
// build it is — critical when testing changes against a long-lived tab.
const APP_VERSION = pkg.version;
const APP_COMMIT = getGitCommit();
const APP_BUILD_TIME = new Date().toISOString();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_COMMIT__: JSON.stringify(APP_COMMIT),
    __APP_BUILD_TIME__: JSON.stringify(APP_BUILD_TIME),
  },
  server: {
    port: parseInt(process.env.FRONTEND_PORT ?? process.env.PORT ?? '5173'),
    host: true,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT ?? '4000'}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: parseInt(process.env.FRONTEND_PORT ?? process.env.PORT ?? '5173'),
    host: true,
  },
  optimizeDeps: {
    include: [
      'dagre',
      '@xyflow/react',
      'use-sync-external-store',
      'use-sync-external-store/shim',
      'use-sync-external-store/with-selector',
    ],
  },
});
