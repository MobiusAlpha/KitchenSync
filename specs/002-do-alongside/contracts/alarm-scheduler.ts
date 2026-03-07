/**
 * @contract alarm-scheduler (addendum: 002-do-alongside)
 * Package: @kitchensync/alarm-scheduler
 *
 * Updates LiveStepState with stageId and trackId.
 * Introduces isStageComplete() (replaces the 001 group-completion concept).
 * Updates applyStepDelay with Stage/Track-aware cascade boundaries.
 *
 * Unchanged: tickSession, confirmStepStarted, resolveAlarmEnabled,
 * setAlarmOverride, applyDishDelay, applyMealDelay, acceptNewTargetTime.
 */

import type { WallClockTime } from './timing-engine';
import type { LiveSession, SessionCommand } from './alarm-scheduler';
import type { Schedule } from './scheduler';

// ─── Extended LiveStepState ───────────────────────────────────────────────────

/**
 * Runtime state for one step in a LiveSession.
 *
 * Two new fields are added. All existing fields are unchanged.
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
   * NEW. The Stage id this step belongs to. Mirrors StepEvent.stageId.
   *
   * Used by isStageComplete() to determine when all members of a parallel Stage
   * are confirmed, enabling the first step of the subsequent Stage.
   */
  readonly stageId: string;
  /**
   * NEW. The Track id this step belongs to within its Stage. Mirrors StepEvent.trackId.
   *
   * Used by applyStepDelay to enforce the per-track cascade boundary:
   * delays cascade within a Track only; they do not cross into sibling Tracks
   * within the same Stage.
   */
  readonly trackId: string;
}

// ─── Updated createLiveSession ────────────────────────────────────────────────

/**
 * Creates a LiveSession from a computed Schedule.
 *
 * Updated to populate stageId and trackId on each LiveStepState from the
 * corresponding StepEvent fields.
 *
 * All other behaviour is unchanged from 001-reverse-timing.
 */
export interface CreateLiveSession {
  (
    schedule: Schedule,
    mealPlanId: string | null,
    nowMs: number,
    globalConfig: { readonly id: 'global'; readonly defaultEnabled: boolean },
  ): LiveSession;
}

// ─── Stage completion helper ──────────────────────────────────────────────────

/**
 * Returns true when every LiveStepState in the session that shares the given
 * stageId has confirmedAt !== null (i.e., all parallel tracks in the Stage
 * have been individually confirmed by the cook).
 *
 * Used by TimerView to gate the "Mark Started" button on the first step of
 * the Stage that follows the specified Stage.
 *
 * Pure function — does not mutate session state.
 *
 * Edge cases:
 * - stageId not found in session: returns true (no members → trivially complete).
 * - All members started: returns true.
 * - Any member unconfirmed: returns false.
 *
 * @param session - Current LiveSession.
 * @param stageId - The Stage to check.
 * @returns boolean — whether all steps in the Stage are confirmed.
 */
export interface IsStageComplete {
  (session: LiveSession, stageId: string): boolean;
}

// ─── Updated applyStepDelay ───────────────────────────────────────────────────

/**
 * Applies a timed delay to a specific step with Stage/Track-aware cascade rules.
 *
 * CASE 1 — Step is in a single-track Stage (tracks.length === 1):
 *   Behaviour unchanged from 001-reverse-timing:
 *   Shift scheduledStart of the target step and all subsequent unstarted steps
 *   in the same Track (which is also the same Dish).
 *   Stop at Dish boundary.
 *
 * CASE 2 — Step is in a multi-track Stage:
 *   Shift scheduledStart of the target step and all subsequent unstarted steps
 *   in the SAME Track only.
 *   Do NOT cascade to:
 *     (a) Sibling Tracks in the same Stage — cross-track propagation is out of scope.
 *     (b) Subsequent Stages — the join point is fixed; the cook absorbs the wait.
 *   Rationale: the Stage's end time (join point) is a structural constraint.
 *   A delayed track starts earlier relative to the join; the join doesn't move.
 *
 * In all cases:
 * - scheduledStart is monotonically non-decreasing (delays never move events backward).
 * - Started steps (confirmedAt !== null) are always skipped.
 * - Dish and Session boundaries are respected.
 * - Emits UPDATE_DISPLAY command with the updated effective meal end time.
 *
 * Note: "Subsequent steps in the same Track" means steps with a higher index
 * in their Track's steps[] AND in subsequent Stages on the same Dish's timeline
 * (for single-track stages only, per CASE 1).
 *
 * @param session - Current LiveSession.
 * @param stepId - ID of the step to delay.
 * @param delayMinutes - Positive integer minutes to add.
 * @returns Updated session + commands tuple.
 */
export interface ApplyStepDelay {
  (
    session: LiveSession,
    stepId: string,
    delayMinutes: number,
  ): {
    readonly session: LiveSession;
    readonly commands: readonly SessionCommand[];
  };
}
