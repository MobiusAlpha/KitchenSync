/**
 * Contract tests for scheduleDish.
 * Tests target the ScheduleDish interface.
 * T022 — TDD: written before T025 implementation.
 */
import { describe, it, expect } from 'vitest';
import type { Dish, WallClockTime } from '@kitchensync/meal-model';
import type { Schedule, Scheduler } from '../src/index.js';
import { scheduler } from '../src/index.js';

const s: Scheduler = scheduler;

const targetTime: WallClockTime = { hour: 19, minute: 0 };
const now: WallClockTime = { hour: 12, minute: 0 };

function makeDish(steps: { name: string; durationMinutes: number }[]): Dish {
  return {
    id: 'dish-1',
    displayName: 'Chicken',
    sourceRecipeId: null,
    steps: steps.map((step, i) => ({
      id: `step-${String(i + 1)}`,
      name: step.name,
      type: 'cook' as const,
      durationMinutes: step.durationMinutes,
    })),
  };
}

describe('scheduleDish', () => {
  it('computes correct reverse-order start times', () => {
    // 3 steps: 20 min Prep, 45 min Cook, 10 min Rest → target 19:00
    // Rest:  19:00 - 10 = 18:50
    // Cook:  18:50 - 45 = 18:05
    // Prep:  18:05 - 20 = 17:45
    const dish = makeDish([
      { name: 'Prep', durationMinutes: 20 },
      { name: 'Cook', durationMinutes: 45 },
      { name: 'Rest', durationMinutes: 10 },
    ]);
    const result: Schedule = s.scheduleDish(dish, targetTime, now);
    expect(result.events).toHaveLength(3);
    expect(result.events[0]?.startTime).toEqual<WallClockTime>({ hour: 17, minute: 45 });
    expect(result.events[1]?.startTime).toEqual<WallClockTime>({ hour: 18, minute: 5 });
    expect(result.events[2]?.startTime).toEqual<WallClockTime>({ hour: 18, minute: 50 });
  });

  it('is deterministic (SC-003): same input produces same output', () => {
    const dish = makeDish([
      { name: 'Prep', durationMinutes: 30 },
      { name: 'Cook', durationMinutes: 60 },
    ]);
    const r1 = s.scheduleDish(dish, targetTime, now);
    const r2 = s.scheduleDish(dish, targetTime, now);
    expect(r1.events).toEqual(r2.events);
  });

  it('returns events sorted ascending by startTime', () => {
    const dish = makeDish([
      { name: 'Prep', durationMinutes: 20 },
      { name: 'Cook', durationMinutes: 45 },
      { name: 'Rest', durationMinutes: 10 },
    ]);
    const result = s.scheduleDish(dish, targetTime, now);
    for (let i = 1; i < result.events.length; i++) {
      const prev = result.events[i - 1]!;
      const curr = result.events[i]!;
      const prevMins = prev.startTime.hour * 60 + prev.startTime.minute;
      const currMins = curr.startTime.hour * 60 + curr.startTime.minute;
      expect(currMins).toBeGreaterThanOrEqual(prevMins);
    }
  });

  it('populates overrunMinutes when earliest start is in the past', () => {
    const lateNow: WallClockTime = { hour: 18, minute: 0 }; // after Prep would start at 17:45
    const dish = makeDish([
      { name: 'Prep', durationMinutes: 20 },
      { name: 'Cook', durationMinutes: 45 },
      { name: 'Rest', durationMinutes: 10 },
    ]);
    const result = s.scheduleDish(dish, targetTime, lateNow);
    expect(result.overrunMinutes).not.toBeNull();
    expect(result.overrunMinutes).toBeGreaterThan(0);
  });

  it('returns overrunMinutes null when on time', () => {
    const dish = makeDish([
      { name: 'Prep', durationMinutes: 20 },
    ]);
    const result = s.scheduleDish(dish, targetTime, now);
    expect(result.overrunMinutes).toBeNull();
  });

  it('rejects a zero-step dish (no events returned, or throws)', () => {
    const emptyDish: Dish = {
      id: 'dish-empty',
      displayName: 'Empty',
      sourceRecipeId: null,
      steps: [],
    };
    expect(() => s.scheduleDish(emptyDish, targetTime, now)).toThrow();
  });

  it('sets targetTime on the returned schedule', () => {
    const dish = makeDish([{ name: 'Cook', durationMinutes: 30 }]);
    const result = s.scheduleDish(dish, targetTime, now);
    expect(result.targetTime).toEqual(targetTime);
  });

  it('sets isParallel false for single-dish schedule', () => {
    const dish = makeDish([
      { name: 'Prep', durationMinutes: 20 },
      { name: 'Cook', durationMinutes: 40 },
    ]);
    const result = s.scheduleDish(dish, targetTime, now);
    expect(result.events.every(e => e.isParallel === false)).toBe(true);
  });

  it('recalculates correctly when prep changes to 30 min (spec US1 scenario)', () => {
    // Original: Prep=20, Cook=45, Rest=10 → Prep starts 17:45
    // After: Prep=30 → Prep starts 17:35
    const dish = makeDish([
      { name: 'Prep', durationMinutes: 30 },
      { name: 'Cook', durationMinutes: 45 },
      { name: 'Rest', durationMinutes: 10 },
    ]);
    const result = s.scheduleDish(dish, targetTime, now);
    expect(result.events[0]?.startTime).toEqual<WallClockTime>({ hour: 17, minute: 35 });
  });
});
