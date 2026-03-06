import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@kitchensync/timing-engine': new URL('../../packages/timing-engine/src/index.ts', import.meta.url).pathname,
      '@kitchensync/meal-model': new URL('../../packages/meal-model/src/index.ts', import.meta.url).pathname,
      '@kitchensync/scheduler': new URL('../../packages/scheduler/src/index.ts', import.meta.url).pathname,
      '@kitchensync/alarm-scheduler': new URL('../../packages/alarm-scheduler/src/index.ts', import.meta.url).pathname,
    },
  },
});
