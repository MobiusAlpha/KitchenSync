import type { LiveSession, LiveStepState, SessionCommand } from './types.js';

/**
 * Confirms that a step has been started by the cook.
 * Transitions the step from 'pending'/'overdue' → 'started'.
 * No-op if the step is already 'started'.
 */
export function confirmStepStarted(
  session: LiveSession,
  stepId: string,
  nowMs: number,
): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] } {
  const updatedStates: LiveStepState[] = session.stepStates.map(state => {
    if (state.stepId !== stepId || state.status === 'started') return state;
    return { ...state, status: 'started' as const, confirmedAt: nowMs };
  });

  const commands: SessionCommand[] = [{ type: 'DISMISS_ALARM', stepId }];
  return { session: { ...session, stepStates: updatedStates }, commands };
}
