/**
 * @contract scheduler (addendum: 002-do-alongside)
 * Package: @kitchensync/scheduler
 *
 * Replaces the 001 scheduleDish algorithm with a Stage/Track-aware version.
 * StepEvent gains stageId, trackId, and isConcurrentWithOtherDish.
 * The isParallel field is redefined to mean intra-dish (Stage has > 1 Track).
 *
 * scheduleMealPlan is unchanged in signature; it delegates to the updated scheduleDish.
 */

import type { WallClockTime } from './timing-engine';
import type { StepType, Dish, MealPlan } from './meal-model';

// ─── Extended StepEvent ───────────────────────────────────────────────────────

/**
 * A computed start-time event for a single step within a schedule.
 *
 * Fields updated from 001-reverse-timing:
 *   - isParallel: semantics updated (see below)
 *   - stageId: new — intra-dish parallel group identifier
 *   - trackId: new — within-stage lane identifier
 *   - isConcurrentWithOtherDish: new — carries the old isParallel cross-dish meaning
 */
export interface StepEvent {
  readonly dishId: string;
  readonly dishName: string;
  /**
   * The step's own id. Unique within the schedule.
   */
  readonly stepId: string;
  readonly stepName: string;
  readonly stepType: StepType;
  /**
   * Calculated start time for this step.
   *
   * For steps in a multi-track Stage, each track is reverse-timed independently
   * from the shared stageEndTime. A step in a longer track will start earlier
   * than a step in a shorter track within the same Stage.
   */
  readonly startTime: WallClockTime;
  /**
   * Updated semantics (002-do-alongside):
   * true when this event's Stage has tracks.length > 1 (intra-dish parallelism).
   *
   * Previously (001): true when another event from a DIFFERENT dish shared the
   * same startTime. That signal is now carried by isConcurrentWithOtherDish.
   */
  readonly isParallel: boolean;
  /**
   * NEW. true when at least one event from a DIFFERENT dish has the same
   * startTime as this event. Carries the 001-reverse-timing meaning of isParallel.
   */
  readonly isConcurrentWithOtherDish: boolean;
  /**
   * NEW. The id of the Stage this step belongs to.
   *
   * All events in the same Stage share this id, regardless of which Track they
   * belong to. Used by the timer UI gate: the first step of Stage[i+1] cannot be
   * confirmed until all events in Stage[i] are confirmed (isStageComplete check).
   */
  readonly stageId: string;
  /**
   * NEW. The id of the Track within the Stage this step belongs to.
   *
   * Used by the UI to render events in the correct parallel lane (ScheduleView
   * groups by stageId, then renders separate rows per trackId within a stage).
   */
  readonly trackId: string;
}

// ─── Schedule output ──────────────────────────────────────────────────────────

/**
 * The computed schedule for one Dish or a full MealPlan.
 *
 * Events are ordered ascending by startTime, then dishId (stable, deterministic).
 * Within a multi-track Stage, events from different tracks interleave naturally
 * by startTime; consumers use stageId + trackId to group them for display.
 */
export interface Schedule {
  readonly targetTime: WallClockTime;
  readonly events: readonly StepEvent[];
  /**
   * Minutes by which the earliest event start time precedes the current time.
   * The earliest event is the first step of the earliest-starting Track across
   * all Stages. null if all events start in the future.
   */
  readonly overrunMinutes: number | null;
}

// ─── Updated scheduleDish contract ───────────────────────────────────────────

/**
 * Computes a reverse-timing Schedule for a single Dish using the Stage/Track model.
 *
 * Algorithm:
 *
 *   cursor = targetTime
 *   for i = stages.length - 1 downto 0:
 *     stage = stages[i]
 *     stageEndTime = cursor         // shared end time for all tracks in this stage
 *
 *     trackEarliestStarts = []
 *     for each track in stage.tracks:
 *       trackCursor = stageEndTime
 *       for j = track.steps.length - 1 downto 0:
 *         step = track.steps[j]
 *         trackCursor = trackCursor - step.durationMinutes
 *         emit StepEvent(
 *           step,
 *           startTime = trackCursor,
 *           stageId   = stage.id,
 *           trackId   = track.id,
 *           isParallel = stage.tracks.length > 1,
 *         )
 *       trackEarliestStarts.push(trackCursor)
 *
 *     cursor = min(trackEarliestStarts)  // stage start = earliest track start
 *
 *   Sort all events ascending by startTime, then dishId.
 *   Compute overrunMinutes from earliest event vs. now.
 *   Set isConcurrentWithOtherDish = false for single-dish schedules.
 *
 * Shared-end-time invariant (enforced by algorithm, not stored):
 *   For every Stage: all its tracks end at stageEndTime.
 *
 * @param dish - The Dish to schedule.
 * @param targetTime - The "ready by" wall-clock time.
 * @param now - Current wall-clock time (injected for testability).
 * @returns A fully computed Schedule.
 */
export interface ScheduleDish {
  (dish: Dish, targetTime: WallClockTime, now: WallClockTime): Schedule;
}

/**
 * Computes a unified Schedule across all Dishes in a MealPlan.
 *
 * Delegates to scheduleDish per dish, then merges and re-sorts all events.
 * Sets isConcurrentWithOtherDish = true on events from different dishes that
 * share the same startTime (the updated cross-dish signal).
 *
 * @param mealPlan - The MealPlan to schedule.
 * @param now - Current wall-clock time (injected for testability).
 * @returns A single unified Schedule spanning all dishes.
 */
export interface ScheduleMealPlan {
  (mealPlan: MealPlan, now: WallClockTime): Schedule;
}

/** The public surface of the @kitchensync/scheduler library. */
export interface Scheduler {
  scheduleDish: ScheduleDish;
  scheduleMealPlan: ScheduleMealPlan;
}
