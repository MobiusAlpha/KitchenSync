/**
 * Contract tests for delay cascade functions.
 * T049
 */
import { describe, it, expect } from 'vitest';
import type { AlarmConfiguration, LiveSession, Schedule } from '../src/index.js';
import { alarmScheduler } from '../src/index.js';

const globalConfig: AlarmConfiguration = { id: 'global', defaultEnabled: true };

const schedule: Schedule = {
  targetTime: { hour: 19, minute: 0 },
  overrunMinutes: null,
  events: [
    { dishId: 'd1', dishName: 'Chicken', stepId: 's1', stepName: 'Prep', stepType: 'prep', startTime: { hour: 17, minute: 0 }, isParallel: false },
    { dishId: 'd1', dishName: 'Chicken', stepId: 's2', stepName: 'Cook', stepType: 'cook', startTime: { hour: 17, minute: 30 }, isParallel: false },
    { dishId: 'd1', dishName: 'Chicken', stepId: 's3', stepName: 'Rest', stepType: 'rest', startTime: { hour: 18, minute: 30 }, isParallel: false },
    { dishId: 'd2', dishName: 'Veg', stepId: 's4', stepName: 'Chop', stepType: 'prep', startTime: { hour: 18, minute: 0 }, isParallel: false },
    { dishId: 'd2', dishName: 'Veg', stepId: 's5', stepName: 'Roast', stepType: 'cook', startTime: { hour: 18, minute: 20 }, isParallel: false },
  ],
};

function makeSession(): LiveSession {
  return alarmScheduler.createLiveSession(schedule, 'meal-1', Date.now(), globalConfig);
}

describe('applyStepDelay', () => {
  it('shifts target step and all subsequent unstarted steps in same dish', () => {
    const session = makeSession();
    const { session: updated } = alarmScheduler.applyStepDelay(session, 's1', 5);
    const s1 = updated.stepStates.find(s => s.stepId === 's1')!;
    const s2 = updated.stepStates.find(s => s.stepId === 's2')!;
    const s3 = updated.stepStates.find(s => s.stepId === 's3')!;
    expect(s1.scheduledStart).toEqual({ hour: 17, minute: 5 });
    expect(s2.scheduledStart).toEqual({ hour: 17, minute: 35 });
    expect(s3.scheduledStart).toEqual({ hour: 18, minute: 35 });
  });

  it('does not affect started steps', () => {
    let session = makeSession();
    const { session: afterConfirm } = alarmScheduler.confirmStepStarted(session, 's1', Date.now());
    session = afterConfirm;
    const { session: updated } = alarmScheduler.applyStepDelay(session, 's1', 5);
    const s1 = updated.stepStates.find(s => s.stepId === 's1')!;
    // s1 is started — should NOT be shifted
    expect(s1.scheduledStart).toEqual({ hour: 17, minute: 0 });
    // s2 is after s1 in the dish but the delay was applied to s1 which is started — behavior depends on spec:
    // "applyStepDelay shifts target step and all subsequent unstarted steps in same dish"
    // Since s1 is started, the delay effectively applies only to subsequent unstarted steps
  });

  it('does not affect other dishes', () => {
    const session = makeSession();
    const { session: updated } = alarmScheduler.applyStepDelay(session, 's1', 5);
    const s4 = updated.stepStates.find(s => s.stepId === 's4')!;
    const s5 = updated.stepStates.find(s => s.stepId === 's5')!;
    // Other dish unaffected
    expect(s4.scheduledStart).toEqual({ hour: 18, minute: 0 });
    expect(s5.scheduledStart).toEqual({ hour: 18, minute: 20 });
  });

  it('returns UPDATE_DISPLAY command with effectiveMealEnd', () => {
    const session = makeSession();
    const stepDurations = new Map([['s1', 30], ['s2', 60], ['s3', 30], ['s4', 20], ['s5', 40]]);
    const { commands } = alarmScheduler.applyStepDelay(session, 's1', 5);
    const updateCmd = commands.find(c => c.type === 'UPDATE_DISPLAY');
    expect(updateCmd).toBeDefined();
    if (updateCmd?.type === 'UPDATE_DISPLAY') {
      expect(updateCmd.effectiveMealEnd).toBeDefined();
    }
    void stepDurations; // referenced to avoid unused variable
  });
});

describe('applyDishDelay', () => {
  it('shifts all unstarted steps in the dish', () => {
    const session = makeSession();
    const { session: updated } = alarmScheduler.applyDishDelay(session, 'd1', 10);
    const s1 = updated.stepStates.find(s => s.stepId === 's1')!;
    const s2 = updated.stepStates.find(s => s.stepId === 's2')!;
    const s3 = updated.stepStates.find(s => s.stepId === 's3')!;
    expect(s1.scheduledStart).toEqual({ hour: 17, minute: 10 });
    expect(s2.scheduledStart).toEqual({ hour: 17, minute: 40 });
    expect(s3.scheduledStart).toEqual({ hour: 18, minute: 40 });
  });

  it('does not affect other dishes', () => {
    const session = makeSession();
    const { session: updated } = alarmScheduler.applyDishDelay(session, 'd1', 10);
    const s4 = updated.stepStates.find(s => s.stepId === 's4')!;
    expect(s4.scheduledStart).toEqual({ hour: 18, minute: 0 });
  });
});

describe('applyMealDelay', () => {
  it('shifts all unstarted steps across all dishes', () => {
    const session = makeSession();
    const { session: updated } = alarmScheduler.applyMealDelay(session, 10);
    for (const stepState of updated.stepStates) {
      if (stepState.stepId === 's1') expect(stepState.scheduledStart).toEqual({ hour: 17, minute: 10 });
      if (stepState.stepId === 's2') expect(stepState.scheduledStart).toEqual({ hour: 17, minute: 40 });
      if (stepState.stepId === 's3') expect(stepState.scheduledStart).toEqual({ hour: 18, minute: 40 });
      if (stepState.stepId === 's4') expect(stepState.scheduledStart).toEqual({ hour: 18, minute: 10 });
      if (stepState.stepId === 's5') expect(stepState.scheduledStart).toEqual({ hour: 18, minute: 30 });
    }
  });

  it('does not affect started steps', () => {
    let session = makeSession();
    const { session: afterConfirm } = alarmScheduler.confirmStepStarted(session, 's1', Date.now());
    session = afterConfirm;
    const { session: updated } = alarmScheduler.applyMealDelay(session, 5);
    const s1 = updated.stepStates.find(s => s.stepId === 's1')!;
    expect(s1.scheduledStart).toEqual({ hour: 17, minute: 0 }); // started, not shifted
  });

  it('returns UPDATE_DISPLAY command', () => {
    const session = makeSession();
    const { commands } = alarmScheduler.applyMealDelay(session, 5);
    expect(commands.find(c => c.type === 'UPDATE_DISPLAY')).toBeDefined();
  });
});
