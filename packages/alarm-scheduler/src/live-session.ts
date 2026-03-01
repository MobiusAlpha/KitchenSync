import type { Schedule } from '@kitchensync/scheduler';
import type { AlarmConfiguration, LiveSession, LiveStepState } from './types.js';
import { generateId } from './utils.js';

/** Creates a new LiveSession from a computed Schedule. */
export function createLiveSession(
  schedule: Schedule,
  mealPlanId: string | null,
  nowMs: number,
  _globalConfig: AlarmConfiguration,
): LiveSession {
  const stepStates: LiveStepState[] = schedule.events.map(event => ({
    stepId: event.stepId,
    dishId: event.dishId,
    stepName: event.stepName,
    dishName: event.dishName,
    scheduledStart: event.startTime,
    status: 'pending' as const,
    confirmedAt: null,
    delayAppliedMinutes: 0,
  }));

  return {
    id: generateId(),
    mealPlanId,
    startedAt: nowMs,
    targetTime: schedule.targetTime,
    effectiveTargetTime: schedule.targetTime,
    stepStates,
    alarmOverrides: [],
    totalDelayMinutes: 0,
  };
}
