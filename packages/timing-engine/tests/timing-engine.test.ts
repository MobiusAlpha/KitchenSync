/**
 * Contract tests for TimingEngine.
 * Tests target the TimingEngine interface, not any concrete implementation.
 * TDD: these tests are written BEFORE implementation (T017) and MUST fail first.
 */
import { describe, it, expect } from 'vitest';
import type { TimingEngine, WallClockTime } from '../src/index.js';
import { timingEngine } from '../src/index.js';

const engine: TimingEngine = timingEngine;

describe('TimingEngine.subtractMinutes', () => {
  it('subtracts minutes within the same hour', () => {
    const result = engine.subtractMinutes({ hour: 12, minute: 30 }, 15);
    expect(result).toEqual<WallClockTime>({ hour: 12, minute: 15 });
  });

  it('wraps back across midnight (00:10 - 20 min = 23:50)', () => {
    const result = engine.subtractMinutes({ hour: 0, minute: 10 }, 20);
    expect(result).toEqual<WallClockTime>({ hour: 23, minute: 50 });
  });

  it('subtracts across the hour boundary', () => {
    const result = engine.subtractMinutes({ hour: 14, minute: 5 }, 10);
    expect(result).toEqual<WallClockTime>({ hour: 13, minute: 55 });
  });

  it('subtracts exactly to midnight (00:00)', () => {
    const result = engine.subtractMinutes({ hour: 1, minute: 0 }, 60);
    expect(result).toEqual<WallClockTime>({ hour: 0, minute: 0 });
  });

  it('handles subtracting from 00:00 (wraps to 23:xx)', () => {
    const result = engine.subtractMinutes({ hour: 0, minute: 0 }, 1);
    expect(result).toEqual<WallClockTime>({ hour: 23, minute: 59 });
  });
});

describe('TimingEngine.addMinutes', () => {
  it('adds minutes within the same hour', () => {
    const result = engine.addMinutes({ hour: 12, minute: 30 }, 15);
    expect(result).toEqual<WallClockTime>({ hour: 12, minute: 45 });
  });

  it('wraps forward across midnight (23:50 + 20 min = 00:10)', () => {
    const result = engine.addMinutes({ hour: 23, minute: 50 }, 20);
    expect(result).toEqual<WallClockTime>({ hour: 0, minute: 10 });
  });

  it('adds across the hour boundary', () => {
    const result = engine.addMinutes({ hour: 13, minute: 55 }, 10);
    expect(result).toEqual<WallClockTime>({ hour: 14, minute: 5 });
  });

  it('adds exactly to midnight (23:00 + 60 = 00:00)', () => {
    const result = engine.addMinutes({ hour: 23, minute: 0 }, 60);
    expect(result).toEqual<WallClockTime>({ hour: 0, minute: 0 });
  });
});

describe('TimingEngine.differenceMinutes', () => {
  it('returns positive when a is after b on same day', () => {
    const a: WallClockTime = { hour: 14, minute: 30 };
    const b: WallClockTime = { hour: 12, minute: 0 };
    expect(engine.differenceMinutes(a, b)).toBe(150);
  });

  it('returns negative when a is before b', () => {
    const a: WallClockTime = { hour: 10, minute: 0 };
    const b: WallClockTime = { hour: 12, minute: 0 };
    expect(engine.differenceMinutes(a, b)).toBe(-120);
  });

  it('returns 0 when a equals b', () => {
    const t: WallClockTime = { hour: 10, minute: 0 };
    expect(engine.differenceMinutes(t, t)).toBe(0);
  });

  it('handles cross-midnight path (shorter path): 00:10 - 23:50 → +20', () => {
    // 00:10 is 20 minutes after 23:50 via cross-midnight path
    const a: WallClockTime = { hour: 0, minute: 10 };
    const b: WallClockTime = { hour: 23, minute: 50 };
    expect(engine.differenceMinutes(a, b)).toBe(20);
  });
});

describe('TimingEngine.formatWallClockTime', () => {
  it('formats a time with zero-padding', () => {
    expect(engine.formatWallClockTime({ hour: 9, minute: 5 })).toBe('09:05');
  });

  it('formats midnight', () => {
    expect(engine.formatWallClockTime({ hour: 0, minute: 0 })).toBe('00:00');
  });

  it('formats a two-digit hour and minute', () => {
    expect(engine.formatWallClockTime({ hour: 23, minute: 59 })).toBe('23:59');
  });
});

describe('TimingEngine.parseWallClockTime', () => {
  it('parses a valid HH:MM string', () => {
    expect(engine.parseWallClockTime('09:05')).toEqual<WallClockTime>({ hour: 9, minute: 5 });
  });

  it('parses midnight', () => {
    expect(engine.parseWallClockTime('00:00')).toEqual<WallClockTime>({ hour: 0, minute: 0 });
  });

  it('returns null for invalid format (no colon)', () => {
    expect(engine.parseWallClockTime('0905')).toBeNull();
  });

  it('returns null for out-of-range hour', () => {
    expect(engine.parseWallClockTime('24:00')).toBeNull();
  });

  it('returns null for out-of-range minute', () => {
    expect(engine.parseWallClockTime('12:60')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(engine.parseWallClockTime('')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(engine.parseWallClockTime('ab:cd')).toBeNull();
  });
});
