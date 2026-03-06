/**
 * @kitchensync/timing-engine
 *
 * Pure time-arithmetic functions. No I/O, no side effects, no external dependencies.
 * All operations are deterministic: identical inputs always produce identical outputs.
 */
/** Converts a WallClockTime to total minutes from midnight. */
function toMinutes(time) {
    return time.hour * 60 + time.minute;
}
/** Converts total minutes from midnight (mod 1440) to WallClockTime. */
function fromMinutes(totalMinutes) {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    return { hour: Math.floor(normalized / 60), minute: normalized % 60 };
}
/**
 * Subtracts `minutes` from a WallClockTime, wrapping into the previous calendar day
 * if the result is negative (e.g., target 00:10 − 20 min = 23:50).
 */
function subtractMinutes(time, minutes) {
    return fromMinutes(toMinutes(time) - minutes);
}
/**
 * Adds `minutes` to a WallClockTime, wrapping into the next calendar day if needed.
 */
function addMinutes(time, minutes) {
    return fromMinutes(toMinutes(time) + minutes);
}
/**
 * Returns the signed difference in whole minutes: `a − b`.
 * Positive if `a` is later than `b` (same calendar day assumed unless span > 12 h,
 * in which case the shorter cross-midnight path is taken).
 */
function differenceMinutes(a, b) {
    const rawDiff = toMinutes(a) - toMinutes(b);
    // Choose the shorter path across midnight when difference exceeds 12 hours
    if (rawDiff > 720)
        return rawDiff - 1440;
    if (rawDiff < -720)
        return rawDiff + 1440;
    return rawDiff;
}
/**
 * Converts a WallClockTime to a display string in "HH:MM" 24-hour format.
 */
function formatWallClockTime(time) {
    const h = String(time.hour).padStart(2, '0');
    const m = String(time.minute).padStart(2, '0');
    return `${h}:${m}`;
}
/**
 * Parses "HH:MM" into a WallClockTime.
 * Returns null if the format is invalid or out of range.
 */
function parseWallClockTime(value) {
    if (!/^\d{2}:\d{2}$/.test(value))
        return null;
    const [hourStr, minuteStr] = value.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59)
        return null;
    return { hour, minute };
}
/** Singleton TimingEngine facade. */
export const timingEngine = {
    subtractMinutes,
    addMinutes,
    differenceMinutes,
    formatWallClockTime,
    parseWallClockTime,
};
//# sourceMappingURL=index.js.map