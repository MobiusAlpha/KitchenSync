import { Alert, Badge, Button, Card, ListGroup } from 'react-bootstrap';
import { timingEngine } from '@kitchensync/timing-engine';
import type { LiveSession, SessionCommand } from '@kitchensync/alarm-scheduler';
import type { WallClockTime } from '@kitchensync/meal-model';
import type { AlarmScope } from '@kitchensync/alarm-scheduler';
import { DelayControls } from './DelayControls.js';
import { AlarmToggleControls } from './AlarmToggleControls.js';

type DelayMinutes = 1 | 5 | 10;

interface TimerViewProps {
  readonly session: LiveSession;
  readonly commands: readonly SessionCommand[];
  readonly stepDurations: ReadonlyMap<string, number>;
  readonly onConfirmStep: (stepId: string) => void;
  readonly onApplyDelay: (
    scope: AlarmScope | 'meal',
    targetId: string | null,
    delayMinutes: DelayMinutes,
  ) => void;
  readonly onSetAlarmOverride: (
    scope: AlarmScope,
    targetId: string | null,
    enabled: boolean,
  ) => void;
  readonly onAcceptNewTargetTime: (proposedTime: WallClockTime) => void;
}

const STATUS_COLOURS: Record<string, string> = {
  pending: 'light',
  started: 'success',
  overdue: 'danger',
};

/**
 * The main live-timer display. Renders step list with countdowns, alarm prompt,
 * confirm-start buttons, delay controls, and alarm toggle controls.
 */
export function TimerView({
  session,
  commands,
  stepDurations,
  onConfirmStep,
  onApplyDelay,
  onSetAlarmOverride,
  onAcceptNewTargetTime,
}: TimerViewProps) {
  const alarmCommand = commands.find(c => c.type === 'SOUND_ALARM');
  const updateDisplay = commands.find(c => c.type === 'UPDATE_DISPLAY');

  return (
    <div>
      {/* Alarm prompt overlay */}
      {alarmCommand?.type === 'SOUND_ALARM' && (
        <Alert variant="danger" className="d-flex align-items-center gap-3">
          <span className="fs-3">🔔</span>
          <div className="flex-grow-1">
            <strong>{alarmCommand.stepName}</strong> — {alarmCommand.dishName}
            <br />
            <small>Time to start this step!</small>
          </div>
          <Button
            variant="outline-light"
            onClick={() => onConfirmStep(alarmCommand.stepId)}
          >
            Mark Started
          </Button>
        </Alert>
      )}

      {/* UPDATE_DISPLAY — proposed new target time */}
      {updateDisplay?.type === 'UPDATE_DISPLAY' && (
        <Alert variant="info" className="d-flex align-items-center gap-2">
          <span>🕐</span>
          <div className="flex-grow-1">
            Proposed new meal completion:{' '}
            <strong>{timingEngine.formatWallClockTime(updateDisplay.effectiveMealEnd)}</strong>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onAcceptNewTargetTime(updateDisplay.effectiveMealEnd)}
          >
            Accept
          </Button>
        </Alert>
      )}

      {/* Step list */}
      <ListGroup>
        {session.stepStates.map(state => {
          const duration = stepDurations.get(state.stepId);
          return (
            <ListGroup.Item
              key={state.stepId}
              variant={STATUS_COLOURS[state.status] ?? 'light'}
              className="d-flex flex-column gap-2"
            >
              <div className="d-flex align-items-center gap-2">
                <div className="flex-grow-1">
                  <strong>{state.stepName}</strong>
                  <span className="ms-2 text-muted">{state.dishName}</span>
                  <Badge
                    bg={state.status === 'started' ? 'success' : state.status === 'overdue' ? 'danger' : 'secondary'}
                    className="ms-2"
                  >
                    {state.status}
                  </Badge>
                </div>
                <div className="text-end">
                  <div><strong>{timingEngine.formatWallClockTime(state.scheduledStart)}</strong></div>
                  {duration !== undefined && (
                    <small className="text-muted">{duration} min</small>
                  )}
                </div>
                {state.status !== 'started' && (
                  <Button
                    size="sm"
                    variant="outline-success"
                    onClick={() => onConfirmStep(state.stepId)}
                  >
                    Started
                  </Button>
                )}
              </div>

              {state.status !== 'started' && (
                <div className="d-flex gap-4 flex-wrap">
                  <DelayControls
                    stepId={state.stepId}
                    dishId={state.dishId}
                    onApplyDelay={onApplyDelay}
                  />
                  <AlarmToggleControls
                    session={session}
                    stepId={state.stepId}
                    dishId={state.dishId}
                    onSetAlarmOverride={onSetAlarmOverride}
                  />
                </div>
              )}
            </ListGroup.Item>
          );
        })}
      </ListGroup>

      <Card className="mt-3 bg-light">
        <Card.Body className="py-2">
          <small className="text-muted">
            Target time:{' '}
            <strong>{timingEngine.formatWallClockTime(session.targetTime)}</strong>
            {' | '}Effective:{' '}
            <strong>{timingEngine.formatWallClockTime(session.effectiveTargetTime)}</strong>
          </small>
        </Card.Body>
      </Card>
    </div>
  );
}
