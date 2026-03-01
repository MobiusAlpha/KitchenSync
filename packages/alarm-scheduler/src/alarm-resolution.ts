import type { AlarmConfiguration, AlarmScope, LiveSession } from './types.js';

/**
 * Sets the alarm override at the specified scope (upsert behaviour).
 */
export function setAlarmOverride(
  session: LiveSession,
  scope: AlarmScope,
  targetId: string | null,
  enabled: boolean,
): LiveSession {
  const existing = session.alarmOverrides.filter(o => {
    if (o.scope !== scope) return true;
    if (scope === 'meal') return false;
    return o.targetId !== targetId;
  });
  return {
    ...session,
    alarmOverrides: [...existing, { scope, targetId, enabled }],
  };
}

/**
 * Resolves whether a specific step's alarm is currently enabled,
 * walking the override chain: step > dish > meal > global.
 */
export function resolveAlarmEnabled(
  stepId: string,
  dishId: string,
  session: LiveSession,
  globalConfig: AlarmConfiguration,
): boolean {
  const stepOverride = session.alarmOverrides.find(
    o => o.scope === 'step' && o.targetId === stepId,
  );
  if (stepOverride) return stepOverride.enabled;

  const dishOverride = session.alarmOverrides.find(
    o => o.scope === 'dish' && o.targetId === dishId,
  );
  if (dishOverride) return dishOverride.enabled;

  const mealOverride = session.alarmOverrides.find(o => o.scope === 'meal');
  if (mealOverride) return mealOverride.enabled;

  return globalConfig.defaultEnabled;
}
