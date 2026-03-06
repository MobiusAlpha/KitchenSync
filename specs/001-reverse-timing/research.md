# Phase 0 Research: PWA + Vite + React + TypeScript Stack

**Generated**: 2026-02-26 | **For**: `001-reverse-timing` | **Plan**: [plan.md](./plan.md)

---

## 1. vite-plugin-pwa — Offline Support, Manifest, Service Worker

**Decision: Use `generateSW` strategy with `registerType: 'autoUpdate'`.**

`generateSW` is the default and requires no custom service worker code — Workbox generates it
from config. `autoUpdate` silently installs new service worker versions.

**Key `vite.config.ts` configuration:**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
          },
        ],
      },
      manifest: { /* see section 7 */ },
    }),
  ],
})
```

**Workbox Caching Strategies:**
- `CacheFirst` — immutable static assets (fonts, versioned bundles)
- `NetworkFirst` — API responses where freshness matters
- `StaleWhileRevalidate` — semi-dynamic content
- `NetworkOnly` + Background Sync — POST/mutation endpoints

**TypeScript registration:** Add `"vite-plugin-pwa/client"` to `compilerOptions.types` in
`tsconfig.json` so `virtual:pwa-register` resolves without error.

---

## 2. Vite + React + TypeScript Project Setup

**Decision: Three-file tsconfig split with strict mode and `moduleResolution: "bundler"`.**

The Vite scaffold produces `tsconfig.json` (root), `tsconfig.app.json` (source), and
`tsconfig.node.json` (vite.config.ts). This split is the current standard.

**`tsconfig.app.json` essentials:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vite-plugin-pwa/client"]
  }
}
```

---

## 3. Service Worker Lifecycle for a Timer App

**Decision: Do NOT run the timer in a service worker.**

Service workers are short-lived event-driven processes. The browser can terminate them at any
time when idle — `setInterval`/`setTimeout` are explicitly unreliable inside a service worker
(W3C ServiceWorker spec issue #838).

**What the service worker IS used for:**
- Precaching app shell for offline load
- Responding to `push` events from a server
- Handling `notificationclick` events to focus the app window

**Lifecycle summary:**
1. `install` — precaches app shell assets
2. `activate` — claims clients, cleans old caches
3. Idle — browser may suspend at will; do not rely on it for timing

---

## 4. Web Workers for Accurate Timekeeping

**Decision: Run all timer logic inside a dedicated Web Worker using `setInterval` anchored to
`performance.now()` for drift correction.**

Main thread `setInterval` is throttled to ~1s when the tab is in the background. Web Workers
run on a separate OS thread and are NOT subject to background throttling.

**Architecture:**
```
Main Thread (React UI)  <--postMessage-->  Worker (timer.worker.ts)
```

**Worker (`timer.worker.ts`):**
```ts
let startTime: number
let expectedMs: number

function tick() {
  const drift = performance.now() - expectedMs
  self.postMessage({ type: 'tick', elapsed: performance.now() - startTime })
  expectedMs += 1000
  const nextDelay = Math.max(0, 1000 - drift)
  setTimeout(tick, nextDelay)
}

self.onmessage = (e) => {
  if (e.data.type === 'start') {
    startTime = performance.now()
    expectedMs = 1000
    setTimeout(tick, 1000)
  }
}
```

**Key principles:**
- Use `performance.now()` (monotonic), not `Date.now()` (wall clock, can be adjusted)
- Compute drift on every tick: `drift = actual_time - expected_time`
- Schedule next tick with `delay = nominal_interval - drift` for self-correction
- **Drop-in library option:** `worker-timers` (npm) does exactly this

---

## 5. Web Notifications API

**Decision: Use `ServiceWorkerRegistration.showNotification()` (not `new Notification()`)
for cross-platform reliability. Request permission on a deliberate user gesture only.**

**Permission flow:**
```ts
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()  // MUST be in a user gesture
  return result === 'granted'
}
```

**Showing a notification when tab is not focused:**
```ts
async function showTimerNotification(title: string, body: string) {
  const reg = await navigator.serviceWorker.ready
  reg.showNotification(title, {
    body,
    icon: '/icons/512.png',
    badge: '/icons/192.png',
    tag: 'timer-alert',
    requireInteraction: false,
  })
}
```

**Scope:**
- Tab open but not focused: works
- Tab minimized: works
- Tab fully closed: requires Push API + server (out of scope for v1)
- iOS caveat: Web Push only on iOS 16.4+ when PWA is installed to home screen

---

## 6. Web Audio API for Alarm Sounds

**Decision: Use `AudioContext` + `OscillatorNode` + `GainNode` to synthesize tones. Reuse
the context; create a new oscillator node per sound.**

**Key constraint — autoplay policy:** `AudioContext` starts in `"suspended"` state if created
before user interaction. Call `audioCtx.resume()` inside a click/tap handler.

```ts
const audioCtx = new AudioContext()

async function ensureAudioReady() {
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }
}

function playBeep(frequency = 880, durationMs = 200, volume = 0.4): Promise<void> {
  return new Promise((resolve) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime)
    gain.gain.setValueAtTime(volume, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + durationMs / 1000)
    osc.onended = () => resolve()
  })
}

async function playChime() {
  await playBeep(523, 150)  // C5
  await playBeep(659, 150)  // E5
  await playBeep(784, 250)  // G5
}
```

**Waveform guide:**
- `sine` — soft, smooth bell-like tone (best for cooking timer chime)
- `square` — classic 8-bit beep, more attention-grabbing
- Always use `exponentialRampToValueAtTime` to fade gain before `stop()` to prevent pops

---

## 7. PWA Installability Requirements

**Decision: `display: "standalone"` with separate icons for `any` and `maskable` purposes.
Minimum required icon sizes: 192×192 and 512×512 PNG.**

**Manifest fields for Chrome installability:**
```json
{
  "name": "KitchenSync",
  "short_name": "KitchenSync",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Icon purpose guidance:**
- Do NOT use `"purpose": "any maskable"` combined — Chrome warns against this
- `maskable` icons must have graphic within the inner 80% safe zone
- `any` icons used on Windows, older Android, and desktop OSes

**Display mode decision:**
- `standalone` is correct for KitchenSync — hides browser chrome, feels native
- `fullscreen` is Android-only, intended for games; not appropriate here

**Hard requirements:**
- Must be served over HTTPS
- Must have a registered service worker
- `prefer_related_applications` must NOT be `true`

**Tooling:** `@vite-pwa/assets-generator` can generate all icon variants from a single SVG.

---

## Summary Decision Table

| Area | Decision |
|---|---|
| SW strategy | `generateSW` (no custom SW needed) |
| Timer accuracy | Web Worker + `performance.now()` drift correction |
| Service worker + timers | Service worker does NOT hold timers; Web Worker does |
| Notifications (tab open) | `registration.showNotification()` on timer fire |
| Notifications (tab closed) | Requires Push API + server; out of scope for v1 |
| Alarm sound | `AudioContext` + `OscillatorNode`, resume after user gesture |
| Display mode | `standalone` |
| Icon strategy | Separate `any` and `maskable` entries; 192 + 512 minimum |
| tsconfig | Three-file split, `"moduleResolution": "bundler"`, strict |
