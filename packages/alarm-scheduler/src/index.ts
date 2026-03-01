/**
 * @kitchensync/alarm-scheduler
 *
 * Live session state management: tracks step start confirmation, alarm hierarchy,
 * delay cascade, and effective meal completion time.
 *
 * This library manages state transitions but does NOT own I/O.
 * All side effects are expressed as commands returned from pure transition functions.
 */

export type {
  AlarmScope,
  AlarmOverride,
  AlarmConfiguration,
  LiveStepStatus,
  LiveStepState,
  LiveSession,
  SessionCommand,
} from './types.js';

// Re-export scheduler types for consumers that import Schedule from alarm-scheduler
export type { Schedule, StepEvent } from '@kitchensync/scheduler';

export { createLiveSession } from './live-session.js';
export { tickSession } from './tick-session.js';
export { confirmStepStarted } from './confirm-step.js';
export { applyStepDelay, applyDishDelay, applyMealDelay } from './delay.js';
export { setAlarmOverride, resolveAlarmEnabled } from './alarm-resolution.js';
export { computeEffectiveMealEnd } from './effective-meal-end.js';
export { acceptNewTargetTime } from './accept-target-time.js';
export { deserializeLiveSession, deserializeAlarmConfig } from './deserialize.js';

import { createLiveSession } from './live-session.js';
import { tickSession } from './tick-session.js';
import { confirmStepStarted } from './confirm-step.js';
import { applyStepDelay, applyDishDelay, applyMealDelay } from './delay.js';
import { setAlarmOverride, resolveAlarmEnabled } from './alarm-resolution.js';
import { computeEffectiveMealEnd } from './effective-meal-end.js';
import { acceptNewTargetTime } from './accept-target-time.js';
import { deserializeLiveSession, deserializeAlarmConfig } from './deserialize.js';

/** AlarmScheduler facade — public surface of the library. */
export const alarmScheduler = {
  createLiveSession,
  tickSession,
  confirmStepStarted,
  applyStepDelay,
  applyDishDelay,
  applyMealDelay,
  acceptNewTargetTime,
  setAlarmOverride,
  resolveAlarmEnabled,
  computeEffectiveMealEnd,
  deserializeLiveSession,
  deserializeAlarmConfig,
} as const;

export type AlarmScheduler = typeof alarmScheduler;
