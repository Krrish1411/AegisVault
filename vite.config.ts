import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  base: mode === 'android' || process.env.BUILD_TARGET === 'android' ? './' : (process.env.GITHUB_ACTIONS ? '/AegisVault/' : '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
}));
