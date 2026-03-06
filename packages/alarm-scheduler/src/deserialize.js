function isObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isWallClockTime(v) {
    if (!isObject(v))
        return false;
    const hour = v['hour'];
    const minute = v['minute'];
    return (typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
        typeof minute === 'number' && Number.isInteger(minute) && minute >= 0 && minute <= 59);
}
function isLiveStepState(v) {
    if (!isObject(v))
        return false;
    const obj = v;
    return (typeof obj['stepId'] === 'string' &&
        typeof obj['dishId'] === 'string' &&
        isWallClockTime(obj['scheduledStart']) &&
        ['pending', 'started', 'overdue'].includes(obj['status']) &&
        (obj['confirmedAt'] === null || typeof obj['confirmedAt'] === 'number') &&
        typeof obj['delayAppliedMinutes'] === 'number');
}
function isAlarmOverride(v) {
    if (!isObject(v))
        return false;
    const obj = v;
    return (['meal', 'dish', 'step'].includes(obj['scope']) &&
        (obj['targetId'] === null || typeof obj['targetId'] === 'string') &&
        typeof obj['enabled'] === 'boolean');
}
/**
 * Deserializes and validates a LiveSession read from storage.
 * Guards against corrupted or schema-migrated data (Principle III).
 */
export function deserializeLiveSession(raw) {
    const errors = [];
    if (!isObject(raw)) {
        return { ok: false, errors: ['LiveSession must be an object'] };
    }
    const obj = raw;
    if (typeof obj['id'] !== 'string' || obj['id'].length === 0) {
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
    }
    else {
        obj['stepStates'].forEach((s, i) => {
            if (!isLiveStepState(s)) {
                errors.push(`stepStates[${i}] is invalid or has a corrupted scheduledStart field`);
            }
        });
    }
    if (!Array.isArray(obj['alarmOverrides'])) {
        errors.push('alarmOverrides must be an array');
    }
    else {
        obj['alarmOverrides'].forEach((o, i) => {
            if (!isAlarmOverride(o)) {
                errors.push(`alarmOverrides[${i}] is invalid`);
            }
        });
    }
    if (typeof obj['totalDelayMinutes'] !== 'number') {
        errors.push('totalDelayMinutes must be a number');
    }
    if (errors.length > 0)
        return { ok: false, errors };
    return { ok: true, value: raw };
}
/**
 * Deserializes and validates an AlarmConfiguration read from storage.
 */
export function deserializeAlarmConfig(raw) {
    const errors = [];
    if (!isObject(raw)) {
        return { ok: false, errors: ['AlarmConfiguration must be an object'] };
    }
    const obj = raw;
    if (obj['id'] === undefined || obj['id'] === null) {
        errors.push('id is required');
    }
    else if (obj['id'] !== 'global') {
        errors.push('id must be "global"');
    }
    if (typeof obj['defaultEnabled'] !== 'boolean') {
        errors.push('defaultEnabled must be a boolean');
    }
    if (errors.length > 0)
        return { ok: false, errors };
    return { ok: true, value: raw };
}
//# sourceMappingURL=deserialize.js.map