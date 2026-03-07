/**
 * @contract scheduler
 * Package: @kitchensync/scheduler
 *
 * Reverse-timing scheduler: converts a Dish or MealPlan + a target time into
 * a chronologically-ordered Schedule of StepEvents.
 *
 * This library is stateless. Every call to a scheduling function is idempotent.
 * Dependencies: @kitchensync/meal-model, @kitchensync/timing-engine.
 */

import type { Dish, MealPlan, StepType } from './meal-model';
import type { WallClockTime } from './timing-engine';

// ─── Schedule output ──────────────────────────────────────────────────────────

/** A computed start-time event for a single step within a schedule. */
export interface StepEvent {
  readonly dishId: string;
  readonly dishName: string;
  readonly stepId: string;
  /**
   * Display name of the step. Undefined for auto-generated single-block steps
   * (created when a dish is entered as a total-duration block, FR-001b).
   */
  readonly stepName: string | undefined;
  /**
   * Step category. Undefined for auto-generated single-block steps.
   */
  readonly stepType: StepType | undefined;
  /** Calculated start time for this step. */
  readonly startTime: WallClockTime;
  /**
   * Duration of this step in minutes. Required by the Gantt view for
   * proportional block sizing (FR-012a).
   */
  readonly durationMinutes: number;
  /**
   * True when at least one other StepEvent from a DIFFERENT dish has the same
   * startTime — indicating parallel work is required.
   */
  readonly isParallel: boolean;
}

/**
 * The computed schedule for one Dish or a full MealPlan.
 * Derived — never persisted to storage.
 */
export interface Schedule {
  /** The target "ready by" time this schedule was computed against. */
  readonly targetTime: WallClockTime;
  /**
   * All step events, ordered ascending by startTime.
   * Events with identical startTime are ordered by dishId (stable, deterministic).
   */
  readonly events: readonly StepEvent[];
  /**
   * Minutes by which the earliest step start time falls before the current time.
   * Positive means preparation has already started (overrun). null if on time.
   */
  readonly overrunMinutes: number | null;
}

// ─── Scheduler contract ───────────────────────────────────────────────────────

/**
 * Computes a reverse-timing Schedule for a single Dish.
 *
 * @param dish - The Dish (steps must contain at least one entry).
 * @param targetTime - The "ready by" wall-clock time.
 * @param now - Current wall-clock time (injected for testability).
 * @returns A fully computed Schedule.
 */
export interface ScheduleDish {
  (dish: Dish, targetTime: WallClockTime, now: WallClockTime): Schedule;
}

/**
 * Computes a unified reverse-timing Schedule across all Dishes in a MealPlan.
 * Each dish is scheduled independently against the shared targetTime.
 * Parallel events are detected and flagged with isParallel = true.
 *
 * @param mealPlan - The MealPlan to schedule (must contain at least one Dish).
 * @param now - Current wall-clock time (injected for testability).
 * @returns A single unified Schedule spanning all dishes.
 */
export interface ScheduleMealPlan {
  (mealPlan: MealPlan, now: WallClockTime): Schedule;
}

/**
 * The public surface of the @kitchensync/scheduler library.
 */
export interface Scheduler {
  scheduleDish: ScheduleDish;
  scheduleMealPlan: ScheduleMealPlan;
}
