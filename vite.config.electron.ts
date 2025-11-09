import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite config for Electron renderer process
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  server: {
    port: 5000,
    strictPort: true,
  },
});
