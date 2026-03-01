import type { WallClockTime } from '@kitchensync/timing-engine';

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
  /** Total minutes of delay applied to this step. */
  readonly delayAppliedMinutes: number;
  /**
   * Step display name — stored here so SOUND_ALARM commands include it.
   * Always populated by createLiveSession from the schedule's StepEvent.
   */
  readonly stepName: string;
  /**
   * Dish display name — stored for SOUND_ALARM command display.
   * Always populated by createLiveSession from the schedule's StepEvent.
   */
  readonly dishName: string;
}

/** A live countdown timer session. Persisted to survive page reloads. */
export interface LiveSession {
  readonly id: string;
  /** UUID of source MealPlan; null for a single-dish session. */
  readonly mealPlanId: string | null;
  /** Unix epoch ms when the session was created. */
  readonly startedAt: number;
  /** The original target time before any delays. Never changes after session creation. */
  readonly targetTime: WallClockTime;
  /** The cook-confirmed effective target time. Updated only via acceptNewTargetTime. */
  readonly effectiveTargetTime: WallClockTime;
  readonly stepStates: readonly LiveStepState[];
  readonly alarmOverrides: readonly AlarmOverride[];
  /** Sum of all whole-meal delays applied so far. */
  readonly totalDelayMinutes: number;
}

/**
 * Commands emitted by state-transition functions. The PWA layer executes these.
 */
export type SessionCommand =
  | { readonly type: 'SOUND_ALARM'; readonly stepId: string; readonly dishName: string; readonly stepName: string }
  | { readonly type: 'DISMISS_ALARM'; readonly stepId: string }
  | { readonly type: 'SHOW_OVERDUE'; readonly stepId: string }
  | { readonly type: 'UPDATE_DISPLAY'; readonly effectiveMealEnd: WallClockTime };
