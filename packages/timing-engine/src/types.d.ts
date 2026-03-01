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
//# sourceMappingURL=types.d.ts.map