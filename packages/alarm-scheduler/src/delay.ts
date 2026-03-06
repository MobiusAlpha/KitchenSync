import type { WallClockTime } from '@kitchensync/timing-engine';
import { timingEngine } from '@kitchensync/timing-engine';
import type { LiveSession, LiveStepState, SessionCommand } from './types.js';

type DelayMinutes = 1 | 5 | 10;

function addMinutesToState(
  state: LiveStepState,
  delayMinutes: number,
): LiveStepState {
  return {
    ...state,
    scheduledStart: timingEngine.addMinutes(state.scheduledStart, delayMinutes),
    delayAppliedMinutes: state.delayAppliedMinutes + delayMinutes,
  };
}

function makeUpdateDisplay(effectiveMealEnd: WallClockTime): SessionCommand {
  return { type: 'UPDATE_DISPLAY', effectiveMealEnd };
}

/** Compute rough effectiveMealEnd from current step states (no durations — uses scheduledStart as proxy). */
function computeApproxMealEnd(session: LiveSession): WallClockTime {
  let maxMinutes = -1;
  let result: WallClockTime = session.effectiveTargetTime;
  for (const state of session.stepStates) {
    if (state.status === 'started') continue;
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
export function applyStepDelay(
  session: LiveSession,
  stepId: string,
  delayMinutes: DelayMinutes,
): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] } {
  // Find the index of the target step in the dish
  const targetIdx = session.stepStates.findIndex(s => s.stepId === stepId);
  if (targetIdx === -1) return { session, commands: [] };

  const targetState = session.stepStates[targetIdx]!;
  if (targetState.status === 'started') {
    // Target is started — cascade to subsequent steps only
    const dishId = targetState.dishId;
    const updatedStates = session.stepStates.map((state, idx) => {
      if (idx <= targetIdx) return state;
      if (state.dishId !== dishId || state.status === 'started') return state;
      return addMinutesToState(state, delayMinutes);
    });
    const updated = { ...session, stepStates: updatedStates };
    return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
  }

  const dishId = targetState.dishId;
  const updatedStates = session.stepStates.map((state, idx) => {
    if (idx < targetIdx) return state;
    if (state.dishId !== dishId || state.status === 'started') return state;
    return addMinutesToState(state, delayMinutes);
  });
  const updated = { ...session, stepStates: updatedStates };
  return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
}

/**
 * Applies a delay to all remaining unstarted steps in a specific dish.
 */
export function applyDishDelay(
  session: LiveSession,
  dishId: string,
  delayMinutes: DelayMinutes,
): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] } {
  const updatedStates = session.stepStates.map(state => {
    if (state.dishId !== dishId || state.status === 'started') return state;
    return addMinutesToState(state, delayMinutes);
  });
  const updated = { ...session, stepStates: updatedStates };
  return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
}

/**
 * Applies a delay to all remaining unstarted steps across all dishes.
 */
export function applyMealDelay(
  session: LiveSession,
  delayMinutes: DelayMinutes,
): { readonly session: LiveSession; readonly commands: readonly SessionCommand[] } {
  const updatedStates = session.stepStates.map(state => {
    if (state.status === 'started') return state;
    return addMinutesToState(state, delayMinutes);
  });
  const updated = {
    ...session,
    stepStates: updatedStates,
    totalDelayMinutes: session.totalDelayMinutes + delayMinutes,
  };
  return { session: updated, commands: [makeUpdateDisplay(computeApproxMealEnd(updated))] };
}
