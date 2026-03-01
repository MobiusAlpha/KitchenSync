import { epochMsToWallClock, toMinutes } from './utils.js';
import { resolveAlarmEnabled } from './alarm-resolution.js';
/**
 * Advances the session based on the current wall-clock time.
 * Detects newly-due alarms and overdue steps. Emits SOUND_ALARM and SHOW_OVERDUE commands.
 */
export function tickSession(session, nowMs, globalConfig) {
    const nowWallClock = epochMsToWallClock(nowMs);
    const nowTotalMinutes = toMinutes(nowWallClock);
    const commands = [];
    const updatedStates = [];
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
                }
                else {
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
            }
            else if (state.status === 'overdue') {
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
//# sourceMappingURL=tick-session.js.map