/**
 * Contract tests for deserialization schema guards.
 * T051 (deserializeLiveSession) + T077 (deserializeAlarmConfig)
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
  ],
};

function makeValidSession(): LiveSession {
  return alarmScheduler.createLiveSession(schedule, null, Date.now(), globalConfig);
}

// ─── deserializeLiveSession ───────────────────────────────────────────────────

describe('deserializeLiveSession', () => {
  it('round-trips a valid LiveSession with ok:true', () => {
    const session = makeValidSession();
    const result = alarmScheduler.deserializeLiveSession(session);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(session.id);
      expect(result.value.targetTime).toEqual(session.targetTime);
    }
  });

  it('returns ok:false for null input', () => {
    const result = alarmScheduler.deserializeLiveSession(null);
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for missing required field (id)', () => {
    const session = makeValidSession();
    const { id: _id, ...withoutId } = session;
    void _id;
    const result = alarmScheduler.deserializeLiveSession(withoutId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
    }
  });

  it('returns ok:false for corrupted scheduledStart field', () => {
    const session = makeValidSession();
    const corrupted = {
      ...session,
      stepStates: [
        { ...session.stepStates[0], scheduledStart: 'not-a-time' },
      ],
    };
    const result = alarmScheduler.deserializeLiveSession(corrupted);
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for missing stepStates', () => {
    const session = makeValidSession();
    const { stepStates: _ss, ...withoutStepStates } = session;
    void _ss;
    const result = alarmScheduler.deserializeLiveSession(withoutStepStates);
    expect(result.ok).toBe(false);
  });
});

// ─── deserializeAlarmConfig ───────────────────────────────────────────────────

describe('deserializeAlarmConfig', () => {
  it('round-trips a valid AlarmConfiguration with ok:true', () => {
    const config: AlarmConfiguration = { id: 'global', defaultEnabled: true };
    const result = alarmScheduler.deserializeAlarmConfig(config);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('global');
      expect(result.value.defaultEnabled).toBe(true);
    }
  });

  it('round-trips defaultEnabled:false', () => {
    const config: AlarmConfiguration = { id: 'global', defaultEnabled: false };
    const result = alarmScheduler.deserializeAlarmConfig(config);
    expect(result.ok).toBe(true);
  });

  it('returns ok:false for missing id field', () => {
    const result = alarmScheduler.deserializeAlarmConfig({ defaultEnabled: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
    }
  });

  it('returns ok:false when id is not "global"', () => {
    const result = alarmScheduler.deserializeAlarmConfig({ id: 'user-1', defaultEnabled: true });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for non-boolean defaultEnabled', () => {
    const result = alarmScheduler.deserializeAlarmConfig({ id: 'global', defaultEnabled: 'yes' });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for null input', () => {
    const result = alarmScheduler.deserializeAlarmConfig(null);
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for undefined input', () => {
    const result = alarmScheduler.deserializeAlarmConfig(undefined);
    expect(result.ok).toBe(false);
  });
});
