import type { WallClockTime } from '@kitchensync/timing-engine';
import type { StepType } from '@kitchensync/meal-model';

/** A computed start-time event for a single step within a schedule. */
export interface StepEvent {
  readonly dishId: string;
  readonly dishName: string;
  readonly stepId: string;
  readonly stepName: string;
  readonly stepType: StepType;
  readonly startTime: WallClockTime;
  readonly durationMinutes: number;
  readonly isParallel: boolean;
}

/**
 * The computed schedule for one Dish or a full MealPlan.
 * Derived — never persisted to storage.
 */
export interface Schedule {
  readonly targetTime: WallClockTime;
  readonly events: readonly StepEvent[];
  readonly overrunMinutes: number | null;
}

/** The public surface of the @kitchensync/scheduler library. */
export interface Scheduler {
  scheduleDish: (dish: import('@kitchensync/meal-model').Dish, targetTime: WallClockTime, now: WallClockTime) => Schedule;
  scheduleMealPlan: (mealPlan: import('@kitchensync/meal-model').MealPlan, now: WallClockTime) => Schedule;
}
