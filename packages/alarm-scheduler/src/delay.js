import { timingEngine } from '@kitchensync/timing-engine';
function addMinutesToState(state, delayMinutes) {
    return {
        ...state,
        scheduledStart: timingEngine.addMinutes(state.scheduledStart, delayMinutes),
        delayAppliedMinutes: state.delayAppliedMinutes + delayMinutes,
    };
}
function makeUpdateDisplay(effectiveMealEnd) {
    return { type: 'UPDATE_DISPLAY', effectiveMealEnd };
}
/** Compute rough effectiveMealEnd from current step states (no durations — uses scheduledStart as proxy). */
function computeApproxMealEnd(session) {
    let maxMinutes = -1;
    let result = session.effectiveTargetTime;
    for (const state of session.stepStates) {
        if (state.status === 'started')
            continue;
        const minutes = state.scheduledStart.hour * 60 + state.scheduledStart.minute;
        if (minutes > maxMinutes) {
            maxMinutes = minutes;
            result = state.scheduledStart;
        }
    }
    return result;
}
/**
 * Applies a delay to a specific step and cascades to all subsequent unstarted steps
 * in the same dish.
 */
export function applyStepDelay(session, stepId, delayMinutes) {
    // Find the index of the target step in the dish
    const targetIdx = session.stepStates.findIndex(s => s.stepId === stepId);
    if (targetIdx === -1)
        return { session, commands: [] };
    const targetState = session.stepStates[targetIdx];
    if (targetState.status === 'started') {
        // Target is started — cascade to subsequent steps only
        const dishId = targetState.dishId;
        const updatedStates = session.stepStates.map((state, idx) => {
            if (idx <= targetIdx)
                return state;
            if (state.dishId !== dishId || state.status === 'started')
                return state;
            return addMinutesToState(state, delayMinutes);
        });
        const updated = { ...session, stepStates: updatedStates };
        return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
    }
    const dishId = targetState.dishId;
    const updatedStates = session.stepStates.map((state, idx) => {
        if (idx < targetIdx)
            return state;
        if (state.dishId !== dishId || state.status === 'started')
            return state;
        return addMinutesToState(state, delayMinutes);
    });
    const updated = { ...session, stepStates: updatedStates };
    return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
}
/**
 * Applies a delay to all remaining unstarted steps in a specific dish.
 */
export function applyDishDelay(session, dishId, delayMinutes) {
    const updatedStates = session.stepStates.map(state => {
        if (state.dishId !== dishId || state.status === 'started')
            return state;
        return addMinutesToState(state, delayMinutes);
    });
    const updated = { ...session, stepStates: updatedStates };
    return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
}
/**
 * Applies a delay to all remaining unstarted steps across all dishes.
 */
export function applyMealDelay(session, delayMinutes) {
    const updatedStates = session.stepStates.map(state => {
        if (state.status === 'started')
            return state;
        return addMinutesToState(state, delayMinutes);
    });
    const updated = {
        ...session,
        stepStates: updatedStates,
        totalDelayMinutes: session.totalDelayMinutes + delayMinutes,
    };
    return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
}
//# sourceMappingURL=delay.js.map