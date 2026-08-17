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
    exclude: ['@xyflow/react'],
    include: ['dagre'],
  },
  build: {
    commonjsOptions: {
      include: [/@xyflow/],
    },
  },
});
