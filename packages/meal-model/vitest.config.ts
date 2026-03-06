import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@kitchensync/timing-engine': new URL('../../packages/timing-engine/src/index.ts', import.meta.url).pathname,
    },
  },
});
