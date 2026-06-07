/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // Keep Vitest to the unit suite under src/; Playwright owns e2e/*.spec.ts.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
