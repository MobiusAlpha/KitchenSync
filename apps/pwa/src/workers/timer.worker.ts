/**
 * Drift-corrected Web Worker timer.
 * Sends {type:'tick', nowMs} to the main thread once per second.
 * Uses self-correcting loop based on performance.now() to minimize drift.
 */

type WorkerMessage = { type: 'start' } | { type: 'stop' };
type TickMessage = { type: 'tick'; nowMs: number };

let intervalId: ReturnType<typeof setTimeout> | null = null;
let nextTick = performance.now();

function tick() {
  const nowMs = Date.now();
  self.postMessage({ type: 'tick', nowMs } satisfies TickMessage);

  // Self-correcting: schedule next tick relative to the expected time
  nextTick += 1000;
  const delay = nextTick - performance.now();
  setTimeout(tick, Math.max(0, delay));
}

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type === 'start') {
    if (intervalId !== null) return; // already running
    nextTick = performance.now() + 1000;
    intervalId = setTimeout(tick, 1000);
  } else if (event.data.type === 'stop') {
    if (intervalId !== null) {
      clearTimeout(intervalId);
      intervalId = null;
    }
  }
});
