/**
 * Contract tests for alarm resolution hierarchy.
 * T050
 */
import { describe, it, expect } from 'vitest';
import type { AlarmConfiguration, LiveSession, Schedule } from '../src/index.js';
import { alarmScheduler } from '../src/index.js';

const globalConfig: AlarmConfiguration = { id: 'global', defaultEnabled: true };
const globalConfigOff: AlarmConfiguration = { id: 'global', defaultEnabled: false };

const schedule: Schedule = {
  targetTime: { hour: 19, minute: 0 },
  overrunMinutes: null,
  events: [
    { dishId: 'd1', dishName: 'Chicken', stepId: 's1', stepName: 'Prep', stepType: 'prep', startTime: { hour: 17, minute: 0 }, isParallel: false },
    { dishId: 'd1', dishName: 'Chicken', stepId: 's2', stepName: 'Cook', stepType: 'cook', startTime: { hour: 17, minute: 30 }, isParallel: false },
  ],
};

function makeSession(): LiveSession {
  return alarmScheduler.createLiveSession(schedule, null, Date.now(), globalConfig);
}

describe('resolveAlarmEnabled', () => {
  it('returns global default when no overrides', () => {
    const session = makeSession();
    expect(alarmScheduler.resolveAlarmEnabled('s1', 'd1', session, globalConfig)).toBe(true);
    expect(alarmScheduler.resolveAlarmEnabled('s1', 'd1', session, globalConfigOff)).toBe(false);
  });

  it('returns meal-level override when set', () => {
    let session = makeSession();
    session = alarmScheduler.setAlarmOverride(session, 'meal', null, false);
    expect(alarmScheduler.resolveAlarmEnabled('s1', 'd1', session, globalConfig)).toBe(false);
  });

  it('returns dish-level override over meal override', () => {
    let session = makeSession();
    session = alarmScheduler.setAlarmOverride(session, 'meal', null, false);
    session = alarmScheduler.setAlarmOverride(session, 'dish', 'd1', true);
    expect(alarmScheduler.resolveAlarmEnabled('s1', 'd1', session, globalConfig)).toBe(true);
  });

  it('returns step-level override as highest precedence', () => {
    let session = makeSession();
    session = alarmScheduler.setAlarmOverride(session, 'meal', null, false);
    session = alarmScheduler.setAlarmOverride(session, 'dish', 'd1', true);
    session = alarmScheduler.setAlarmOverride(session, 'step', 's1', false);
    expect(alarmScheduler.resolveAlarmEnabled('s1', 'd1', session, globalConfig)).toBe(false);
  });
});

describe('setAlarmOverride', () => {
  it('upserts at meal scope', () => {
    let session = makeSession();
    session = alarmScheduler.setAlarmOverride(session, 'meal', null, false);
    session = alarmScheduler.setAlarmOverride(session, 'meal', null, true);
    const mealOverrides = session.alarmOverrides.filter(o => o.scope === 'meal');
    expect(mealOverrides).toHaveLength(1);
    expect(mealOverrides[0]?.enabled).toBe(true);
  });

  it('upserts at dish scope', () => {
    let session = makeSession();
    session = alarmScheduler.setAlarmOverride(session, 'dish', 'd1', false);
    session = alarmScheduler.setAlarmOverride(session, 'dish', 'd1', true);
    const dishOverrides = session.alarmOverrides.filter(o => o.scope === 'dish' && o.targetId === 'd1');
    expect(dishOverrides).toHaveLength(1);
    expect(dishOverrides[0]?.enabled).toBe(true);
  });

  it('upserts at step scope', () => {
    let session = makeSession();
    session = alarmScheduler.setAlarmOverride(session, 'step', 's1', false);
    session = alarmScheduler.setAlarmOverride(session, 'step', 's1', true);
    const stepOverrides = session.alarmOverrides.filter(o => o.scope === 'step' && o.targetId === 's1');
    expect(stepOverrides).toHaveLength(1);
    expect(stepOverrides[0]?.enabled).toBe(true);
  });
});
