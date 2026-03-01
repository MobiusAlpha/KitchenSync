import type { AlarmConfiguration, LiveSession, LiveStepState, SessionCommand } from './types.js';
import { epochMsToWallClock, toMinutes } from './utils.js';
import { resolveAlarmEnabled } from './alarm-resolution.js';

/**
 * Advances the session based on the current wall-clock time.
 * Detects newly-due alarms and overdue steps. Emits SOUND_ALARM and SHOW_OVERDUE commands.
 */
export function tickSession(
  session: LiveSession,
  nowMs: number,
  globalConfig: AlarmConfiguration,
): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] } {
  const nowWallClock = epochMsToWallClock(nowMs);
  const nowTotalMinutes = toMinutes(nowWallClock);
  const commands: SessionCommand[] = [];
  const updatedStates: LiveStepState[] = [];

  for (const state of session.stepStates) {
    if (state.status === 'started') {
      updatedStates.push(state);
      continue;
    }

    const stepTotalMinutes = toMinutes(state.scheduledStart);
    let newState = state;

    if (nowTotalMinutes >= stepTotalMinutes) {
      const minutesLate = nowTotalMinutes - stepTotalMinutes;

      if (state.status === 'pending') {
        if (minutesLate > 1) {
          newState = { ...state, status: 'overdue' };
          commands.push({ type: 'SHOW_OVERDUE', stepId: state.stepId });
        } else {
          const alarmEnabled = resolveAlarmEnabled(state.stepId, state.dishId, session, globalConfig);
          if (alarmEnabled) {
            commands.push({
              type: 'SOUND_ALARM',
              stepId: state.stepId,
              dishName: state.dishName,
              stepName: state.stepName,
            });
          }
        }
      } else if (state.status === 'overdue') {
        commands.push({ type: 'SHOW_OVERDUE', stepId: state.stepId });
      }
    }

    updatedStates.push(newState);
  }

  return {
    session: { ...session, stepStates: updatedStates },
    commands,
  };
}
