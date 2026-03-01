import type { WallClockTime } from '@kitchensync/timing-engine';
import type { MealPlan } from '@kitchensync/meal-model';
import type { Schedule, StepEvent } from './types.js';
import { scheduleDish } from './schedule-dish.js';

/**
 * Computes a unified reverse-timing Schedule across all Dishes in a MealPlan.
 * Each dish is scheduled independently against the shared targetTime.
 * Parallel events (same startTime, different dishes) are flagged.
 */
export function scheduleMealPlan(mealPlan: MealPlan, now: WallClockTime): Schedule {
  // Schedule each dish independently
  const allEvents: StepEvent[] = [];
  for (const dish of mealPlan.dishes) {
    const dishSchedule = scheduleDish(dish, mealPlan.targetTime, now);
    allEvents.push(...dishSchedule.events);
  }

  // Sort ascending by startTime, then by dishId for determinism
  allEvents.sort((a, b) => {
    const aMin = a.startTime.hour * 60 + a.startTime.minute;
    const bMin = b.startTime.hour * 60 + b.startTime.minute;
    if (aMin !== bMin) return aMin - bMin;
    return a.dishId.localeCompare(b.dishId);
  });

  // Detect parallel steps: same startTime, different dishes
  const startTimeToDishs = new Map<number, Set<string>>();
  for (const event of allEvents) {
    const key = event.startTime.hour * 60 + event.startTime.minute;
    const dishes = startTimeToDishs.get(key) ?? new Set<string>();
    dishes.add(event.dishId);
    startTimeToDishs.set(key, dishes);
  }

  const flaggedEvents: StepEvent[] = allEvents.map(event => {
    const key = event.startTime.hour * 60 + event.startTime.minute;
    const dishesAtTime = startTimeToDishs.get(key)!;
    return { ...event, isParallel: dishesAtTime.size > 1 };
  });

  // Calculate overrunMinutes
  const earliestStartMinutes =
    flaggedEvents.length > 0
      ? flaggedEvents[0]!.startTime.hour * 60 + flaggedEvents[0]!.startTime.minute
      : null;
  const nowMinutes = now.hour * 60 + now.minute;
  const overrunMinutes =
    earliestStartMinutes !== null && nowMinutes > earliestStartMinutes
      ? nowMinutes - earliestStartMinutes
      : null;

  return { targetTime: mealPlan.targetTime, events: flaggedEvents, overrunMinutes };
}
