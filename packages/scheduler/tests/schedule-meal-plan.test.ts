/**
 * Contract tests for scheduleMealPlan.
 * T040 — TDD: written before T043 implementation.
 */
import { describe, it, expect } from 'vitest';
import type { Dish, MealPlan, WallClockTime } from '@kitchensync/meal-model';
import type { Scheduler } from '../src/index.js';
import { scheduler } from '../src/index.js';

const s: Scheduler = scheduler;

const now: WallClockTime = { hour: 12, minute: 0 };
const targetTime: WallClockTime = { hour: 19, minute: 0 };

function makeDish(id: string, name: string, steps: { durationMinutes: number }[]): Dish {
  return {
    id,
    displayName: name,
    sourceRecipeId: null,
    steps: steps.map((step, i) => ({
      id: `${id}-step-${String(i)}`,
      name: `Step ${String(i)}`,
      type: 'cook' as const,
      durationMinutes: step.durationMinutes,
    })),
  };
}

function makeMealPlan(dishes: Dish[]): MealPlan {
  return {
    id: 'meal-1',
    name: 'Sunday Roast',
    targetTime,
    dishes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('scheduleMealPlan', () => {
  it('produces correct per-dish reverse-timed start times', () => {
    // Chicken: 90 min total → starts 17:30
    // Veg: 40 min total → starts 18:20
    const chicken = makeDish('d1', 'Roast Chicken', [{ durationMinutes: 90 }]);
    const veg = makeDish('d2', 'Roasted Vegetables', [{ durationMinutes: 40 }]);
    const mealPlan = makeMealPlan([chicken, veg]);
    const result = s.scheduleMealPlan(mealPlan, now);

    const chickenStep = result.events.find(e => e.dishId === 'd1');
    const vegStep = result.events.find(e => e.dishId === 'd2');
    expect(chickenStep?.startTime).toEqual<WallClockTime>({ hour: 17, minute: 30 });
    expect(vegStep?.startTime).toEqual<WallClockTime>({ hour: 18, minute: 20 });
  });

  it('returns events in ascending order by startTime', () => {
    const chicken = makeDish('d1', 'Chicken', [{ durationMinutes: 90 }]);
    const veg = makeDish('d2', 'Veg', [{ durationMinutes: 40 }]);
    const result = s.scheduleMealPlan(makeMealPlan([chicken, veg]), now);

    for (let i = 1; i < result.events.length; i++) {
      const prev = result.events[i - 1]!;
      const curr = result.events[i]!;
      const prevMins = prev.startTime.hour * 60 + prev.startTime.minute;
      const currMins = curr.startTime.hour * 60 + curr.startTime.minute;
      expect(currMins).toBeGreaterThanOrEqual(prevMins);
    }
  });

  it('flags isParallel=true for overlapping cross-dish steps', () => {
    // Both dishes have one step that starts at the same time
    const d1 = makeDish('d1', 'Dish 1', [{ durationMinutes: 30 }]);
    const d2 = makeDish('d2', 'Dish 2', [{ durationMinutes: 30 }]);
    const result = s.scheduleMealPlan(makeMealPlan([d1, d2]), now);
    // Both steps start at 18:30 — should be flagged parallel
    expect(result.events.every(e => e.isParallel === true)).toBe(true);
  });

  it('flags isParallel=false for non-overlapping steps', () => {
    const d1 = makeDish('d1', 'Dish 1', [{ durationMinutes: 90 }]); // starts 17:30
    const d2 = makeDish('d2', 'Dish 2', [{ durationMinutes: 40 }]); // starts 18:20
    const result = s.scheduleMealPlan(makeMealPlan([d1, d2]), now);
    expect(result.events.every(e => e.isParallel === false)).toBe(true);
  });

  it('produces same result as scheduleDish for a single-dish meal plan', () => {
    const dish = makeDish('d1', 'Chicken', [{ durationMinutes: 60 }, { durationMinutes: 30 }]);
    const mealPlan = makeMealPlan([dish]);
    const mealResult = s.scheduleMealPlan(mealPlan, now);
    const dishResult = s.scheduleDish(dish, targetTime, now);

    expect(mealResult.events.length).toBe(dishResult.events.length);
    mealResult.events.forEach((event, i) => {
      expect(event.startTime).toEqual(dishResult.events[i]?.startTime);
    });
  });
});
