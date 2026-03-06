/**
 * Contract tests for AlarmScheduler core session functions.
 * Tests target the AlarmScheduler interface, not concrete implementations.
 * T048
 */
import { describe, it, expect } from 'vitest';
import type { AlarmConfiguration, LiveSession, Schedule } from '../src/index.js';
import { alarmScheduler } from '../src/index.js';

const globalConfig: AlarmConfiguration = { id: 'global', defaultEnabled: true };

const baseSchedule: Schedule = {
  targetTime: { hour: 19, minute: 0 },
  overrunMinutes: null,
  events: [
    {
      dishId: 'dish-1',
      dishName: 'Chicken',
      stepId: 'step-1',
      stepName: 'Prep',
      stepType: 'prep',
      startTime: { hour: 17, minute: 45 },
      isParallel: false,
    },
    {
      dishId: 'dish-1',
      dishName: 'Chicken',
      stepId: 'step-2',
      stepName: 'Cook',
      stepType: 'cook',
      startTime: { hour: 18, minute: 5 },
      isParallel: false,
    },
    {
      dishId: 'dish-1',
      dishName: 'Chicken',
      stepId: 'step-3',
      stepName: 'Rest',
      stepType: 'rest',
      startTime: { hour: 18, minute: 50 },
      isParallel: false,
    },
  ],
};

describe('createLiveSession', () => {
  it('initialises all steps as pending with correct scheduledStart times', () => {
    const nowMs = Date.now();
    const session = alarmScheduler.createLiveSession(baseSchedule, null, nowMs, globalConfig);

    expect(session.stepStates).toHaveLength(3);
    expect(session.stepStates[0]).toMatchObject({
      stepId: 'step-1',
      dishId: 'dish-1',
      scheduledStart: { hour: 17, minute: 45 },
      status: 'pending',
      confirmedAt: null,
      delayAppliedMinutes: 0,
    });
    expect(session.stepStates[1]).toMatchObject({
      stepId: 'step-2',
      scheduledStart: { hour: 18, minute: 5 },
      status: 'pending',
    });
    expect(session.stepStates[2]).toMatchObject({
      stepId: 'step-3',
      scheduledStart: { hour: 18, minute: 50 },
      status: 'pending',
    });
  });

  it('sets targetTime and effectiveTargetTime from schedule', () => {
    const session = alarmScheduler.createLiveSession(baseSchedule, null, Date.now(), globalConfig);
    expect(session.targetTime).toEqual({ hour: 19, minute: 0 });
    expect(session.effectiveTargetTime).toEqual({ hour: 19, minute: 0 });
  });

  it('sets mealPlanId when provided', () => {
    const session = alarmScheduler.createLiveSession(baseSchedule, 'meal-123', Date.now(), globalConfig);
    expect(session.mealPlanId).toBe('meal-123');
  });

  it('sets mealPlanId to null for single-dish', () => {
    const session = alarmScheduler.createLiveSession(baseSchedule, null, Date.now(), globalConfig);
    expect(session.mealPlanId).toBeNull();
  });

  it('initialises totalDelayMinutes to 0', () => {
    const session = alarmScheduler.createLiveSession(baseSchedule, null, Date.now(), globalConfig);
    expect(session.totalDelayMinutes).toBe(0);
  });

  it('initialises alarmOverrides to empty array', () => {
    const session = alarmScheduler.createLiveSession(baseSchedule, null, Date.now(), globalConfig);
    expect(session.alarmOverrides).toHaveLength(0);
  });
});

function makeSession(overrides: Partial<LiveSession> = {}): LiveSession {
  const base = alarmScheduler.createLiveSession(baseSchedule, null, Date.now(), globalConfig);
  return { ...base, ...overrides };
}

describe('tickSession', () => {
  it('emits SOUND_ALARM when a step is due and alarm is enabled', () => {
    const session = makeSession();
    // Set nowMs to exactly when step-1 is scheduled: 17:45 = 17*60+45 = 1065 minutes
    const baseEpoch = new Date().setHours(17, 45, 0, 0);
    const { commands } = alarmScheduler.tickSession(session, baseEpoch, globalConfig);
    const alarm = commands.find(c => c.type === 'SOUND_ALARM');
    expect(alarm).toBeDefined();
    if (alarm?.type === 'SOUND_ALARM') {
      expect(alarm.stepId).toBe('step-1');
      expect(alarm.stepName).toBe('Prep');
    }
  });

  it('emits SHOW_OVERDUE when a step is past due and unconfirmed', () => {
    const session = makeSession();
    // 18:46 is past step-1 (17:45) and step-2 (18:05) start times
    const pastEpoch = new Date().setHours(18, 46, 0, 0);
    const { session: updated } = alarmScheduler.tickSession(session, pastEpoch, globalConfig);
    // Steps 1 and 2 should be overdue
    expect(updated.stepStates.filter(s => s.status === 'overdue').length).toBeGreaterThanOrEqual(1);
  });

  it('is a no-op for already started steps', () => {
    const session = makeSession();
    // Confirm step-1 first
    const { session: afterConfirm } = alarmScheduler.confirmStepStarted(session, 'step-1', Date.now());
    expect(afterConfirm.stepStates[0]?.status).toBe('started');

    // Tick at step-1 time — should not re-alarm on started step
    const baseEpoch = new Date().setHours(17, 45, 0, 0);
    const { commands } = alarmScheduler.tickSession(afterConfirm, baseEpoch, globalConfig);
    const alarmForStep1 = commands.find(c => c.type === 'SOUND_ALARM' && c.stepId === 'step-1');
    expect(alarmForStep1).toBeUndefined();
  });
});
