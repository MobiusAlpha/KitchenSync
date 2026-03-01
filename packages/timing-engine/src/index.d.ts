/**
 * @kitchensync/timing-engine
 *
 * Pure time-arithmetic functions. No I/O, no side effects, no external dependencies.
 * All operations are deterministic: identical inputs always produce identical outputs.
 */
export type { WallClockTime } from './types.js';
import type { WallClockTime } from './types.js';
/**
 * The public surface of the @kitchensync/timing-engine library.
 * All operations are pure and stateless.
 */
export interface TimingEngine {
    subtractMinutes: (time: WallClockTime, minutes: number) => WallClockTime;
    addMinutes: (time: WallClockTime, minutes: number) => WallClockTime;
    differenceMinutes: (a: WallClockTime, b: WallClockTime) => number;
    formatWallClockTime: (time: WallClockTime) => string;
    parseWallClockTime: (value: string) => WallClockTime | null;
}
/** Singleton TimingEngine facade. */
export declare const timingEngine: TimingEngine;
//# sourceMappingURL=index.d.ts.map