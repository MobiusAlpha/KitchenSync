/**
 * @contract timing-engine
 * Package: @kitchensync/timing-engine
 *
 * Pure time-arithmetic functions. No I/O, no side effects, no external dependencies.
 * All operations are deterministic: identical inputs always produce identical outputs (SC-003).
 *
 * NOTE: WallClockTime is defined here (canonical home) because it is a pure time type
 * with no domain dependencies. @kitchensync/meal-model imports and re-exports it from
 * this package, making timing-engine the single source of truth for time representation.
 */

// ─── Primitive types ─────────────────────────────────────────────────────────

/**
 * A wall-clock time on the current or next calendar day (HH:MM, 24-hour).
 * Represents a point in time without a date component.
 * Multi-day planning is out of scope — this type covers [00:00, 23:59] only.
 */
export interface WallClockTime {
  /** Hour component: 0–23 */
  readonly hour: number;
  /** Minute component: 0–59 */
  readonly minute: number;
}

// ─── Core arithmetic ─────────────────────────────────────────────────────────

/**
 * Subtracts `minutes` from a WallClockTime, wrapping into the previous calendar day
 * if the result is negative (e.g., target 00:10 − 20 min = 23:50).
 *
 * @param time - The reference time to subtract from.
 * @param minutes - A positive integer number of minutes to subtract.
 * @returns The resulting WallClockTime after subtraction.
 */
export interface SubtractMinutes {
  (time: WallClockTime, minutes: number): WallClockTime;
}

/**
 * Adds `minutes` to a WallClockTime, wrapping into the next calendar day if needed.
 *
 * @param time - The reference time.
 * @param minutes - A positive integer number of minutes to add.
 * @returns The resulting WallClockTime.
 */
export interface AddMinutes {
  (time: WallClockTime, minutes: number): WallClockTime;
}

/**
 * Returns the signed difference in whole minutes: `a − b`.
 * Positive if `a` is later than `b` (same calendar day assumed unless span > 12 h,
 * in which case the shorter cross-midnight path is taken).
 *
 * @param a - The later time.
 * @param b - The earlier time.
 * @returns Signed integer minutes.
 */
export interface DifferenceMinutes {
  (a: WallClockTime, b: WallClockTime): number;
}

/**
 * Converts a WallClockTime to a display string in "HH:MM" 24-hour format.
 *
 * @param time - The time to format.
 * @returns Zero-padded string, e.g., "09:05".
 */
export interface FormatWallClockTime {
  (time: WallClockTime): string;
}

/**
 * Parses "HH:MM" into a WallClockTime.
 *
 * @param value - String in "HH:MM" format.
 * @returns Parsed time or null if the format is invalid.
 */
export interface ParseWallClockTime {
  (value: string): WallClockTime | null;
}

/**
 * Returns the current wall-clock time derived from the system clock.
 * Injected as a dependency to enable deterministic testing.
 */
export interface NowProvider {
  (): WallClockTime;
}

// ─── TimingEngine facade ──────────────────────────────────────────────────────

/**
 * The public surface of the @kitchensync/timing-engine library.
 * All operations are pure and stateless.
 */
export interface TimingEngine {
  subtractMinutes: SubtractMinutes;
  addMinutes: AddMinutes;
  differenceMinutes: DifferenceMinutes;
  formatWallClockTime: FormatWallClockTime;
  parseWallClockTime: ParseWallClockTime;
}
