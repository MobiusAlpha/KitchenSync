/**
 * @contract scheduler (addendum: 002-do-alongside)
 * Package: @kitchensync/scheduler
 *
 * Additive extension to the scheduler contract from 001-reverse-timing.
 * Introduces parallelGroupId on StepEvent and updates scheduleDish to emit
 * StepEvents for companion steps.
 *
 * scheduleMealPlan is unchanged (it delegates to scheduleDish per dish).
 */

import type { WallClockTime } from './timing-engine';
import type { StepType } from './meal-model';

// ─── Extended StepEvent ───────────────────────────────────────────────────────

/**
 * Extended StepEvent with intra-dish parallel group membership.
 *
 * All existing fields are unchanged. One new field is added.
 */
export interface StepEvent {
  readonly dishId: string;
  readonly dishName: string;
  /**
   * For backbone (anchor) steps: the step's own id.
   * For companion steps: the companion's own id (NOT the anchor's id).
   */
  readonly stepId: string;
  readonly stepName: string;
  readonly stepType: StepType;
  /**
   * Calculated start time for this step.
   *
   * For companions: anchorEndTime − companion.durationMinutes.
   * May be earlier than the anchor's startTime if the companion is longer.
   */
  readonly startTime: WallClockTime;
  /**
   * True when at least one other StepEvent from a DIFFERENT dish has the same
   * startTime — unchanged from 001-reverse-timing semantics.
   */
  readonly isParallel: boolean;
  /**
   * NEW. The anchor step's id if this event belongs to an intra-dish parallel
   * group; null otherwise.
   *
   * Set on BOTH the anchor step's event AND all companion step events in the
   * same group. The anchor step's event has parallelGroupId === stepId.
   *
   * null for steps with no companions.
   */
  readonly parallelGroupId: string | null;
}

// ─── Schedule output ──────────────────────────────────────────────────────────

/**
 * Unchanged from 001-reverse-timing except that events may now include companion
 * StepEvents interleaved in startTime order.
 *
 * Ordering: ascending startTime; ties broken by dishId (stable, deterministic).
 * Within a parallel group, a companion with an earlier startTime appears before
 * the anchor.
 *
 * The shared-end-time invariant holds:
 *   For all events e in a parallel group G:
 *     e.startTime + e.durationMinutes === joinStep.startTime (or targetTime if last)
 *   This is guaranteed by the scheduler, not stored in the Schedule itself.
 */
export interface Schedule {
  readonly targetTime: WallClockTime;
  readonly events: readonly StepEvent[];
  readonly overrunMinutes: number | null;
}

// ─── Updated scheduleDish contract ───────────────────────────────────────────

/**
 * Computes a reverse-timing Schedule for a single Dish, including companion steps.
 *
 * Algorithm addendum for companions:
 *   For each backbone step s at position i (walked in reverse):
 *     stepEndTime = cursor (value before subtracting s.durationMinutes)
 *     cursor -= s.durationMinutes
 *     emit StepEvent(s, startTime=cursor, parallelGroupId = s.companions?.length ? s.id : null)
 *     for each companion c in s.companions:
 *       emit StepEvent(c, startTime = stepEndTime - c.durationMinutes, parallelGroupId = s.id)
 *
 * Invariants:
 * - The backbone walk is unchanged; companions are additive output per step.
 * - A step with companions.length === 0 (or undefined) emits exactly one event
 *   with parallelGroupId: null — identical to 001-reverse-timing behaviour.
 * - Companions may have startTime earlier than their anchor if their duration
 *   exceeds the anchor's duration. The schedule sorts all events by startTime.
 *
 * @param dish - Dish whose steps (and companions) are scheduled.
 * @param targetTime - The "ready by" wall-clock time.
 * @param now - Current wall-clock time (injected for testability).
 * @returns A fully computed Schedule including companion StepEvents.
 */
export interface ScheduleDish {
  (
    dish: import('./meal-model').Dish,
    targetTime: WallClockTime,
    now: WallClockTime,
  ): Schedule;
}
