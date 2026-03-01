/**
 * Performance benchmark for scheduleMealPlan.
 * T073 — Validates that schedule recalculation stays under 16 ms (single animation frame).
 */
import { bench, describe } from 'vitest';
import type { Dish, MealPlan, WallClockTime } from '@kitchensync/meal-model';
import { scheduler } from '../src/index.js';

const now: WallClockTime = { hour: 12, minute: 0 };
const targetTime: WallClockTime = { hour: 19, minute: 0 };

// 10 dishes × 20 steps each
const dishes: Dish[] = Array.from({ length: 10 }, (_, dishIdx) => ({
  id: `dish-${String(dishIdx)}`,
  displayName: `Dish ${String(dishIdx)}`,
  sourceRecipeId: null,
  steps: Array.from({ length: 20 }, (_, stepIdx) => ({
    id: `dish-${String(dishIdx)}-step-${String(stepIdx)}`,
    name: `Step ${String(stepIdx)}`,
    type: 'cook' as const,
    durationMinutes: 3,
  })),
}));

const mealPlan: MealPlan = {
  id: 'bench-meal',
  name: 'Bench Test',
  targetTime,
  dishes,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('scheduleMealPlan performance', () => {
  bench('10 dishes × 20 steps should recalculate in < 16 ms', () => {
    scheduler.scheduleMealPlan(mealPlan, now);
  }, { time: 1000 });
});
