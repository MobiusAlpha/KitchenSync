/** Generate a UUID v4-like ID compatible with both browser and Node 20+. */
export function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without Web Crypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Converts WallClockTime to total minutes from midnight. */
export function toMinutes(time: { hour: number; minute: number }): number {
  return time.hour * 60 + time.minute;
}

/** Converts epoch ms to WallClockTime (local time). */
export function epochMsToWallClock(epochMs: number): { hour: number; minute: number } {
  const d = new Date(epochMs);
  return { hour: d.getHours(), minute: d.getMinutes() };
}
