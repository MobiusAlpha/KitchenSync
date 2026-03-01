import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@kitchensync/timing-engine': new URL('../../packages/timing-engine/src/index.ts', import.meta.url).pathname,
      '@kitchensync/meal-model': new URL('../../packages/meal-model/src/index.ts', import.meta.url).pathname,
      '@kitchensync/scheduler': new URL('../../packages/scheduler/src/index.ts', import.meta.url).pathname,
    },
  },
});
