import { timingEngine } from '@kitchensync/timing-engine';
import type { WallClockTime } from '@kitchensync/timing-engine';
import type { Dish } from '@kitchensync/meal-model';
import type { Schedule, StepEvent } from './types.js';

/**
 * Computes a reverse-timing Schedule for a single Dish.
 * Throws if the dish has no steps.
 */
export function scheduleDish(
  dish: Dish,
  targetTime: WallClockTime,
  now: WallClockTime,
): Schedule {
  if (dish.steps.length === 0) {
    throw new Error(`Dish "${dish.displayName}" has no steps`);
  }

  // Walk steps in reverse to calculate start times
  const events: StepEvent[] = [];
  let cursor = targetTime;

  for (let i = dish.steps.length - 1; i >= 0; i--) {
    const step = dish.steps[i]!;
    cursor = timingEngine.subtractMinutes(cursor, step.durationMinutes);
    events.unshift({
      dishId: dish.id,
      dishName: dish.displayName,
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      startTime: cursor,
      isParallel: false, // Single-dish: no parallel steps
    });
  }

  // Sort ascending by startTime (already in order, but ensure stability)
  events.sort((a, b) => {
    const aMin = a.startTime.hour * 60 + a.startTime.minute;
    const bMin = b.startTime.hour * 60 + b.startTime.minute;
    if (aMin !== bMin) return aMin - bMin;
    return a.dishId.localeCompare(b.dishId);
  });

  // Calculate overrunMinutes
  const earliestStartMinutes =
    events[0]!.startTime.hour * 60 + events[0]!.startTime.minute;
  const nowMinutes = now.hour * 60 + now.minute;
  const overrunMinutes =
    nowMinutes > earliestStartMinutes ? nowMinutes - earliestStartMinutes : null;

  return { targetTime, events, overrunMinutes };
}
