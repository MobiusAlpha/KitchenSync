import { timingEngine } from '@kitchensync/timing-engine';
/**
 * Computes the current effective meal completion time.
 * = max of (scheduledStart + stepDuration) across all unstarted steps.
 */
export function computeEffectiveMealEnd(session, stepDurations) {
    let maxMinutes = -1;
    let result = session.effectiveTargetTime;
    for (const state of session.stepStates) {
        if (state.status === 'started')
            continue;
        const duration = stepDurations.get(state.stepId) ?? 0;
        const endTime = timingEngine.addMinutes(state.scheduledStart, duration);
        const endMinutes = endTime.hour * 60 + endTime.minute;
        if (endMinutes > maxMinutes) {
            maxMinutes = endMinutes;
            result = endTime;
        }
    }
    return result;
}
//# sourceMappingURL=effective-meal-end.js.map