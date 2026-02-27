/**
 * @contract alarm-scheduler
 * Package: @kitchensync/alarm-scheduler
 *
 * Live session state management: tracks step start confirmation, alarm hierarchy,
 * delay cascade, and effective meal completion time.
 *
 * This library manages state transitions but does NOT own I/O (no setTimeout,
 * no Web Audio calls). All side effects are expressed as commands returned from
 * pure transition functions, allowing them to be tested without a browser.
 *
 * Dependencies: @kitchensync/meal-model, @kitchensync/timing-engine, @kitchensync/scheduler.
 */

import type { WallClockTime } from './meal-model';
import type { Schedule, StepEvent } from './scheduler';

// ─── Alarm configuration ──────────────────────────────────────────────────────

/** Scope of an alarm override. */
export type AlarmScope = 'meal' | 'dish' | 'step';

/**
 * A session-level alarm override.
 * Overrides form an inheritance chain: step > dish > meal > global.
 */
export interface AlarmOverride {
  readonly scope: AlarmScope;
  /** dishId for 'dish' scope; stepId for 'step' scope; null for 'meal' scope. */
  readonly targetId: string | null;
  readonly enabled: boolean;
}

/** Global (app-wide) alarm default. Singleton, persisted in storage. */
export interface AlarmConfiguration {
  readonly id: 'global';
  /** Ships as true ("all on"). Changeable in app settings. */
  readonly defaultEnabled: boolean;
}

// ─── Live session state ───────────────────────────────────────────────────────

export type LiveStepStatus = 'pending' | 'started' | 'overdue';

/** Runtime state for one step within a LiveSession. */
export interface LiveStepState {
  readonly stepId: string;
  readonly dishId: string;
  /** Current scheduled start time — shifts forward with applied delays. */
  readonly scheduledStart: WallClockTime;
  readonly status: LiveStepStatus;
  /** Unix epoch ms when the cook confirmed the step started; null until confirmed. */
  readonly confirmedAt: number | null;
  /** Total minutes of delay applied to this step (from step- or dish-level delays). */
  readonly delayAppliedMinutes: number;
}

/** A live countdown timer session. Persisted to survive page reloads. */
export interface LiveSession {
  readonly id: string;
  /** UUID of source MealPlan; null for a single-dish session. */
  readonly mealPlanId: string | null;
  /** Unix epoch ms when the session was created. */
  readonly startedAt: number;
  /** The original target time before any delays. */
  readonly targetTime: WallClockTime;
  /** The current effective meal completion time (shifts with whole-meal delays). */
  readonly effectiveTargetTime: WallClockTime;
  readonly stepStates: readonly LiveStepState[];
  readonly alarmOverrides: readonly AlarmOverride[];
  /** Sum of all whole-meal delays applied so far. */
  readonly totalDelayMinutes: number;
}

// ─── Side-effect commands ─────────────────────────────────────────────────────

/**
 * Commands emitted by state-transition functions. The PWA layer executes these
 * (Web Audio, Notification API, etc.). Libraries never execute effects directly.
 */
export type SessionCommand =
  | { readonly type: 'SOUND_ALARM'; readonly stepId: string; readonly dishName: string; readonly stepName: string }
  | { readonly type: 'DISMISS_ALARM'; readonly stepId: string }
  | { readonly type: 'SHOW_OVERDUE'; readonly stepId: string }
  | { readonly type: 'UPDATE_DISPLAY'; readonly effectiveMealEnd: WallClockTime };

// ─── State-transition functions ───────────────────────────────────────────────

/**
 * Creates a new LiveSession from a computed Schedule.
 *
 * @param schedule - The schedule to run a live session against.
 * @param mealPlanId - Source MealPlan UUID, or null for single-dish.
 * @param now - Current epoch ms (injected for testability).
 * @param globalConfig - The global alarm configuration.
 * @returns A fresh LiveSession with all steps in 'pending' status.
 */
export interface CreateLiveSession {
  (
    schedule: Schedule,
    mealPlanId: string | null,
    nowMs: number,
    globalConfig: AlarmConfiguration,
  ): LiveSession;
}

/**
 * Advances the session based on the current wall-clock time.
 * Detects newly-due alarms and overdue steps.
 *
 * @param session - Current session state.
 * @param nowMs - Current epoch ms.
 * @param globalConfig - Global alarm config (for alarm resolution).
 * @returns Updated session + any commands to execute.
 */
export interface TickSession {
  (
    session: LiveSession,
    nowMs: number,
    globalConfig: AlarmConfiguration,
  ): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] };
}

/**
 * Confirms that a step has been started by the cook.
 * Transitions the step from 'pending'/'overdue' → 'started'.
 * No-op if the step is already 'started'.
 *
 * @param session - Current session state.
 * @param stepId - UUID of the step being confirmed.
 * @param nowMs - Current epoch ms.
 * @returns Updated session + DISMISS_ALARM command for the step.
 */
export interface ConfirmStepStarted {
  (
    session: LiveSession,
    stepId: string,
    nowMs: number,
  ): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] };
}

/**
 * Applies a delay to a specific step and cascades to all subsequent unstarted steps
 * in the same dish (FR-026).
 *
 * @param session - Current session state.
 * @param stepId - UUID of the step to delay.
 * @param delayMinutes - Must be 1, 5, or 10.
 * @returns Updated session with cascaded scheduledStart times + UPDATE_DISPLAY command.
 */
export interface ApplyStepDelay {
  (
    session: LiveSession,
    stepId: string,
    delayMinutes: 1 | 5 | 10,
  ): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] };
}

/**
 * Applies a delay to all remaining unstarted steps in a specific dish (FR-027).
 *
 * @param session - Current session state.
 * @param dishId - UUID of the dish to delay.
 * @param delayMinutes - Must be 1, 5, or 10.
 * @returns Updated session + UPDATE_DISPLAY command.
 */
export interface ApplyDishDelay {
  (
    session: LiveSession,
    dishId: string,
    delayMinutes: 1 | 5 | 10,
  ): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] };
}

/**
 * Applies a delay to all remaining unstarted steps across all dishes (FR-028).
 *
 * @param session - Current session state.
 * @param delayMinutes - Must be 1, 5, or 10.
 * @returns Updated session + UPDATE_DISPLAY command.
 */
export interface ApplyMealDelay {
  (
    session: LiveSession,
    delayMinutes: 1 | 5 | 10,
  ): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] };
}

/**
 * Sets the alarm override at the specified scope (FR-032).
 *
 * @param session - Current session state.
 * @param scope - 'meal', 'dish', or 'step'.
 * @param targetId - dishId for 'dish' scope; stepId for 'step' scope; null for 'meal'.
 * @param enabled - Whether alarms should be enabled for this scope.
 * @returns Updated session with the override applied (upsert behaviour).
 */
export interface SetAlarmOverride {
  (
    session: LiveSession,
    scope: AlarmScope,
    targetId: string | null,
    enabled: boolean,
  ): LiveSession;
}

/**
 * Resolves whether a specific step's alarm is currently enabled,
 * walking the override chain: step > dish > meal > global (FR-022, FR-032).
 *
 * @param stepId - UUID of the step.
 * @param dishId - UUID of the step's parent dish.
 * @param session - Current session (holds alarmOverrides).
 * @param globalConfig - Global alarm configuration.
 * @returns true if the alarm should fire; false otherwise.
 */
export interface ResolveAlarmEnabled {
  (
    stepId: string,
    dishId: string,
    session: LiveSession,
    globalConfig: AlarmConfiguration,
  ): boolean;
}

/**
 * Computes the current effective meal completion time (FR-030).
 * = latest (scheduledStart + stepDuration) across all unstarted steps.
 *
 * @param session - Current session state.
 * @param stepDurations - Map of stepId → durationMinutes (from original schedule).
 * @returns The effective wall-clock time at which the last step will complete.
 */
export interface ComputeEffectiveMealEnd {
  (
    session: LiveSession,
    stepDurations: ReadonlyMap<string, number>,
  ): WallClockTime;
}

/**
 * Deserializes and validates a LiveSession read from storage.
 * Guards against corrupted or schema-migrated data (Principle III).
 *
 * @param raw - Unknown data from storage.
 * @returns Validated LiveSession or a list of validation errors.
 */
export interface DeserializeLiveSession {
  (raw: unknown): { readonly ok: true; readonly value: LiveSession }
                 | { readonly ok: false; readonly errors: readonly string[] };
}

/**
 * Deserializes and validates an AlarmConfiguration read from storage.
 * Guards against corrupted or schema-migrated data (Principle III).
 * Called on every IndexedDB read of the global alarm config record.
 *
 * @param raw - Unknown data from storage.
 * @returns Validated AlarmConfiguration or a list of validation errors.
 */
export interface DeserializeAlarmConfig {
  (raw: unknown): { readonly ok: true; readonly value: AlarmConfiguration }
                 | { readonly ok: false; readonly errors: readonly string[] };
}

// ─── AlarmScheduler facade ────────────────────────────────────────────────────

/**
 * The public surface of the @kitchensync/alarm-scheduler library.
 */
export interface AlarmScheduler {
  createLiveSession: CreateLiveSession;
  tickSession: TickSession;
  confirmStepStarted: ConfirmStepStarted;
  applyStepDelay: ApplyStepDelay;
  applyDishDelay: ApplyDishDelay;
  applyMealDelay: ApplyMealDelay;
  setAlarmOverride: SetAlarmOverride;
  resolveAlarmEnabled: ResolveAlarmEnabled;
  computeEffectiveMealEnd: ComputeEffectiveMealEnd;
  deserializeLiveSession: DeserializeLiveSession;
  deserializeAlarmConfig: DeserializeAlarmConfig;
}
