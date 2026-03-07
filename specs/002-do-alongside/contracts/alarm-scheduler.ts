/**
 * @contract alarm-scheduler (addendum: 002-do-alongside)
 * Package: @kitchensync/alarm-scheduler
 *
 * Additive extension to the alarm-scheduler contract from 001-reverse-timing.
 * Introduces parallelGroupId on LiveStepState and updates:
 *   - createLiveSession: populates parallelGroupId from StepEvent
 *   - applyStepDelay: cascade stops at group boundary for companion steps
 *
 * Unchanged functions: tickSession, confirmStepStarted, resolveAlarmEnabled,
 * setAlarmOverride, applyDishDelay, applyMealDelay, acceptNewTargetTime.
 */

import type { WallClockTime } from './timing-engine';

// ─── Extended LiveStepState ───────────────────────────────────────────────────

/**
 * Extended runtime state for one step, with parallel group membership.
 * All existing fields are unchanged.
 */
export interface LiveStepState {
  readonly stepId: string;
  readonly dishId: string;
  readonly stepName: string;
  readonly dishName: string;
  readonly scheduledStart: WallClockTime;
  readonly status: 'pending' | 'started' | 'overdue';
  readonly confirmedAt: number | null;
  readonly delayAppliedMinutes: number;
  /**
   * NEW. The anchor step's id if this step belongs to an intra-dish parallel
   * group; null otherwise. Mirrors StepEvent.parallelGroupId.
   *
   * Used by:
   *   1. TimerView: gate the join step's "Mark Started" button until all states
   *      sharing this parallelGroupId have confirmedAt !== null.
   *   2. applyStepDelay: determine cascade boundary (companion steps do not
   *      cascade beyond themselves).
   */
  readonly parallelGroupId: string | null;
}

// ─── Updated createLiveSession contract ───────────────────────────────────────

/**
 * Creates a LiveSession from a computed Schedule.
 *
 * Addendum: populates LiveStepState.parallelGroupId from StepEvent.parallelGroupId
 * for every event in the schedule.
 *
 * All other behaviour is unchanged from 001-reverse-timing.
 */
export interface CreateLiveSession {
  (
    schedule: import('./scheduler').Schedule,
    mealPlanId: string | null,
    nowMs: number,
    globalConfig: { readonly id: 'global'; readonly defaultEnabled: boolean },
  ): import('./alarm-scheduler').LiveSession;
}

// ─── Updated applyStepDelay contract ─────────────────────────────────────────

/**
 * Applies a delay to a specific step, with updated cascade rules for parallel groups.
 *
 * Cascade rules (extension of 001-reverse-timing rules):
 *
 * CASE 1 — Target step is NOT in a parallel group (parallelGroupId === null):
 *   Behaviour unchanged from 001-reverse-timing:
 *   - If step is started: cascade to all unstarted backbone steps after it in same dish.
 *   - If step is not started: cascade from this step forward through unstarted backbone
 *     steps in same dish.
 *
 * CASE 2 — Target step IS a companion (parallelGroupId !== null AND stepId !== parallelGroupId):
 *   - Shift scheduledStart of this companion step only.
 *   - Do NOT cascade further. A companion is the terminal node of its mini-track.
 *   - Rationale: cross-track delay propagation is out of scope (spec FR-011, Assumptions).
 *
 * CASE 3 — Target step IS an anchor (parallelGroupId !== null AND stepId === parallelGroupId):
 *   - Shift scheduledStart of this anchor step.
 *   - Cascade forward to unstarted backbone steps after this anchor (the join step and beyond).
 *   - Do NOT cascade to companion siblings (they are lateral, not downstream).
 *
 * In all cases:
 * - scheduledStart is monotonically non-decreasing (delays never move steps backward).
 * - started steps are always skipped.
 * - Dish boundaries are always respected.
 * - Emits UPDATE_DISPLAY command.
 *
 * @param session - Current LiveSession.
 * @param stepId - ID of the step to delay.
 * @param delayMinutes - Positive integer minutes to add.
 * @returns Updated session + commands tuple (same shape as 001-reverse-timing).
 */
export interface ApplyStepDelay {
  (
    session: import('./alarm-scheduler').LiveSession,
    stepId: string,
    delayMinutes: number,
  ): {
    session: import('./alarm-scheduler').LiveSession;
    commands: readonly import('./alarm-scheduler').SessionCommand[];
  };
}

// ─── Group completion helper ──────────────────────────────────────────────────

/**
 * Returns true if every LiveStepState in the given session that shares the
 * specified parallelGroupId has confirmedAt !== null.
 *
 * Used by TimerView to determine whether the join step's "Mark Started" button
 * should be enabled.
 *
 * Returns true if parallelGroupId is null (non-grouped steps are always unblocked).
 * Returns true if the group has no members (degenerate case, should not occur).
 *
 * Pure function — does not modify session state.
 *
 * @param session - Current LiveSession.
 * @param parallelGroupId - The group to check, or null.
 * @returns boolean indicating whether all group members are confirmed.
 */
export interface IsParallelGroupComplete {
  (
    session: import('./alarm-scheduler').LiveSession,
    parallelGroupId: string | null,
  ): boolean;
}
