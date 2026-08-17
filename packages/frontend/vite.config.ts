import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.FRONTEND_PORT ?? process.env.PORT ?? '5173'),
    host: true,
    strictPort: false,
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
