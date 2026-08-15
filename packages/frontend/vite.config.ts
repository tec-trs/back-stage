import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT ?? '5200'),
    host: true,
    strictPort: false,
  },
  preview: {
    port: parseInt(process.env.PORT ?? '5200'),
    host: true,
  },
});
