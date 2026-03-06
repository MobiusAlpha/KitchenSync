import { Form } from 'react-bootstrap';
import type { AlarmScope, LiveSession } from '@kitchensync/alarm-scheduler';
import { alarmScheduler } from '@kitchensync/alarm-scheduler';

interface AlarmToggleControlsProps {
  readonly session: LiveSession;
  readonly stepId: string;
  readonly dishId: string;
  readonly onSetAlarmOverride: (
    scope: AlarmScope,
    targetId: string | null,
    enabled: boolean,
  ) => void;
}

const GLOBAL_CONFIG = { id: 'global' as const, defaultEnabled: true };

/**
 * On/off alarm toggles for step, dish, and meal scope.
 */
export function AlarmToggleControls({
  session,
  stepId,
  dishId,
  onSetAlarmOverride,
}: AlarmToggleControlsProps) {
  const stepEnabled = alarmScheduler.resolveAlarmEnabled(stepId, dishId, session, GLOBAL_CONFIG);
  const mealOverride = session.alarmOverrides.find(o => o.scope === 'meal');
  const dishOverride = session.alarmOverrides.find(o => o.scope === 'dish' && o.targetId === dishId);

  return (
    <div className="d-flex flex-column gap-1">
      <Form.Check
        type="switch"
        label="Step alarm"
        id={`alarm-step-${stepId}`}
        checked={stepEnabled}
        onChange={e => onSetAlarmOverride('step', stepId, e.target.checked)}
      />
      <Form.Check
        type="switch"
        label="Dish alarms"
        id={`alarm-dish-${dishId}`}
        checked={dishOverride?.enabled ?? true}
        onChange={e => onSetAlarmOverride('dish', dishId, e.target.checked)}
      />
      <Form.Check
        type="switch"
        label="Meal alarms"
        id={`alarm-meal`}
        checked={mealOverride?.enabled ?? true}
        onChange={e => onSetAlarmOverride('meal', null, e.target.checked)}
      />
    </div>
  );
}
