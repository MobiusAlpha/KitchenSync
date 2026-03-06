import { generateId } from './utils.js';
/** Creates a new LiveSession from a computed Schedule. */
export function createLiveSession(schedule, mealPlanId, nowMs, _globalConfig) {
    const stepStates = schedule.events.map(event => ({
        stepId: event.stepId,
        dishId: event.dishId,
        stepName: event.stepName,
        dishName: event.dishName,
        scheduledStart: event.startTime,
        status: 'pending',
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
//# sourceMappingURL=live-session.js.map