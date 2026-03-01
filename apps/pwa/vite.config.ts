import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'KitchenSync',
        short_name: 'KitchenSync',
        description: 'Reverse-timing cooking scheduler',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#198754',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@kitchensync/timing-engine': new URL('../../packages/timing-engine/src/index.ts', import.meta.url).pathname,
      '@kitchensync/meal-model': new URL('../../packages/meal-model/src/index.ts', import.meta.url).pathname,
      '@kitchensync/scheduler': new URL('../../packages/scheduler/src/index.ts', import.meta.url).pathname,
      '@kitchensync/alarm-scheduler': new URL('../../packages/alarm-scheduler/src/index.ts', import.meta.url).pathname,
    },
  },
});
