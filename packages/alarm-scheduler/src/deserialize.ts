import type { AlarmConfiguration, LiveSession, LiveStepState, AlarmOverride } from './types.js';

type DeserializeResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly string[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isWallClockTime(v: unknown): boolean {
  if (!isObject(v)) return false;
  const hour = (v as Record<string, unknown>)['hour'];
  const minute = (v as Record<string, unknown>)['minute'];
  return (
    typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
    typeof minute === 'number' && Number.isInteger(minute) && minute >= 0 && minute <= 59
  );
}

function isLiveStepState(v: unknown): v is LiveStepState {
  if (!isObject(v)) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj['stepId'] === 'string' &&
    typeof obj['dishId'] === 'string' &&
    isWallClockTime(obj['scheduledStart']) &&
    ['pending', 'started', 'overdue'].includes(obj['status'] as string) &&
    (obj['confirmedAt'] === null || typeof obj['confirmedAt'] === 'number') &&
    typeof obj['delayAppliedMinutes'] === 'number'
  );
}

function isAlarmOverride(v: unknown): v is AlarmOverride {
  if (!isObject(v)) return false;
  const obj = v as Record<string, unknown>;
  return (
    ['meal', 'dish', 'step'].includes(obj['scope'] as string) &&
    (obj['targetId'] === null || typeof obj['targetId'] === 'string') &&
    typeof obj['enabled'] === 'boolean'
  );
}

/**
 * Deserializes and validates a LiveSession read from storage.
 * Guards against corrupted or schema-migrated data (Principle III).
 */
export function deserializeLiveSession(raw: unknown): DeserializeResult<LiveSession> {
  const errors: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, errors: ['LiveSession must be an object'] };
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj['id'] !== 'string' || (obj['id'] as string).length === 0) {
    errors.push('id must be a non-empty string');
  }
  if (obj['mealPlanId'] !== null && typeof obj['mealPlanId'] !== 'string') {
    errors.push('mealPlanId must be a string or null');
  }
  if (typeof obj['startedAt'] !== 'number') {
    errors.push('startedAt must be a number');
  }
  if (!isWallClockTime(obj['targetTime'])) {
    errors.push('targetTime must be a valid WallClockTime');
  }
  if (!isWallClockTime(obj['effectiveTargetTime'])) {
    errors.push('effectiveTargetTime must be a valid WallClockTime');
  }
  if (!Array.isArray(obj['stepStates'])) {
    errors.push('stepStates must be an array');
  } else {
    (obj['stepStates'] as unknown[]).forEach((s, i) => {
      if (!isLiveStepState(s)) {
        errors.push(`stepStates[${i}] is invalid or has a corrupted scheduledStart field`);
      }
    });
  }
  if (!Array.isArray(obj['alarmOverrides'])) {
    errors.push('alarmOverrides must be an array');
  } else {
    (obj['alarmOverrides'] as unknown[]).forEach((o, i) => {
      if (!isAlarmOverride(o)) {
        errors.push(`alarmOverrides[${i}] is invalid`);
      }
    });
  }
  if (typeof obj['totalDelayMinutes'] !== 'number') {
    errors.push('totalDelayMinutes must be a number');
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, value: raw as unknown as LiveSession };
}

/**
 * Deserializes and validates an AlarmConfiguration read from storage.
 */
export function deserializeAlarmConfig(raw: unknown): DeserializeResult<AlarmConfiguration> {
  const errors: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, errors: ['AlarmConfiguration must be an object'] };
  }
  const obj = raw as Record<string, unknown>;

  if (obj['id'] === undefined || obj['id'] === null) {
    errors.push('id is required');
  } else if (obj['id'] !== 'global') {
    errors.push('id must be "global"');
  }
  if (typeof obj['defaultEnabled'] !== 'boolean') {
    errors.push('defaultEnabled must be a boolean');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: raw as unknown as AlarmConfiguration };
}
