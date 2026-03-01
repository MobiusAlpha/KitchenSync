import { Table, Badge, Alert } from 'react-bootstrap';
import { timingEngine } from '@kitchensync/timing-engine';
import type { Schedule } from '@kitchensync/scheduler';
import { OverrunWarning } from './OverrunWarning.js';

interface ScheduleViewProps {
  readonly schedule: Schedule | null;
}

const TYPE_COLOURS: Record<string, string> = {
  prep: 'info',
  cook: 'danger',
  rest: 'warning',
  cooldown: 'secondary',
};

/**
 * Read-only display of a computed Schedule.
 * Works for both single-dish and multi-dish layouts.
 */
export function ScheduleView({ schedule }: ScheduleViewProps) {
  if (!schedule) {
    return (
      <Alert variant="light" className="text-center text-muted border">
        Add steps and set a target time to see your schedule.
      </Alert>
    );
  }

  const isMultiDish = new Set(schedule.events.map(e => e.dishId)).size > 1;

  return (
    <div>
      {schedule.overrunMinutes !== null && schedule.overrunMinutes > 0 && (
        <OverrunWarning overrunMinutes={schedule.overrunMinutes} />
      )}
      <Table striped bordered hover responsive size="sm">
        <thead>
          <tr>
            <th>Start</th>
            {isMultiDish && <th>Dish</th>}
            <th>Step</th>
            <th>Type</th>
            {isMultiDish && <th></th>}
          </tr>
        </thead>
        <tbody>
          {schedule.events.map(event => (
            <tr key={`${event.dishId}-${event.stepId}`}>
              <td>
                <strong>{timingEngine.formatWallClockTime(event.startTime)}</strong>
              </td>
              {isMultiDish && <td>{event.dishName}</td>}
              <td>{event.stepName}</td>
              <td>
                <Badge bg={TYPE_COLOURS[event.stepType] ?? 'secondary'}>
                  {event.stepType}
                </Badge>
              </td>
              {isMultiDish && (
                <td>
                  {event.isParallel && (
                    <Badge bg="primary" title="Parallel with another dish">
                      ⇔ parallel
                    </Badge>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
