/**
 * Confirms that a step has been started by the cook.
 * Transitions the step from 'pending'/'overdue' → 'started'.
 * No-op if the step is already 'started'.
 */
export function confirmStepStarted(session, stepId, nowMs) {
    const updatedStates = session.stepStates.map(state => {
        if (state.stepId !== stepId || state.status === 'started')
            return state;
        return { ...state, status: 'started', confirmedAt: nowMs };
    });
    const commands = [{ type: 'DISMISS_ALARM', stepId }];
    return { session: { ...session, stepStates: updatedStates }, commands };
}
//# sourceMappingURL=confirm-step.js.map