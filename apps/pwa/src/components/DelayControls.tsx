import { Button, ButtonGroup } from 'react-bootstrap';
import type { AlarmScope } from '@kitchensync/alarm-scheduler';

type DelayMinutes = 1 | 5 | 10;

interface DelayControlsProps {
  readonly stepId: string;
  readonly dishId: string;
  readonly onApplyDelay: (
    scope: AlarmScope | 'meal',
    targetId: string | null,
    delayMinutes: DelayMinutes,
  ) => void;
}

const DELAYS: DelayMinutes[] = [1, 5, 10];

/**
 * +1/+5/+10 min delay buttons rendered at step, dish, and meal scope.
 */
export function DelayControls({ stepId, dishId, onApplyDelay }: DelayControlsProps) {
  return (
    <div className="d-flex flex-column gap-1">
      <div className="d-flex align-items-center gap-1">
        <small className="text-muted" style={{ minWidth: '40px' }}>Step:</small>
        <ButtonGroup size="sm">
          {DELAYS.map(d => (
            <Button
              key={d}
              variant="outline-warning"
              onClick={() => onApplyDelay('step', stepId, d)}
            >
              +{d}m
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div className="d-flex align-items-center gap-1">
        <small className="text-muted" style={{ minWidth: '40px' }}>Dish:</small>
        <ButtonGroup size="sm">
          {DELAYS.map(d => (
            <Button
              key={d}
              variant="outline-secondary"
              onClick={() => onApplyDelay('dish', dishId, d)}
            >
              +{d}m
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div className="d-flex align-items-center gap-1">
        <small className="text-muted" style={{ minWidth: '40px' }}>Meal:</small>
        <ButtonGroup size="sm">
          {DELAYS.map(d => (
            <Button
              key={d}
              variant="outline-danger"
              onClick={() => onApplyDelay('meal', null, d)}
            >
              +{d}m
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}
