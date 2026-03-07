import { Table, Badge, Alert, ButtonGroup, Button } from 'react-bootstrap';
import { timingEngine } from '@kitchensync/timing-engine';
import type { Schedule } from '@kitchensync/scheduler';
import { OverrunWarning } from './OverrunWarning.js';
import { GanttView } from './GanttView/GanttView.js';

/** The two display modes for a computed Schedule (FR-012). */
export type ScheduleViewMode = 'gantt' | 'list';

/**
 * Read-only display of a computed Schedule.
 * Supports 'gantt' (default) and 'list' modes (FR-012).
 * Works for both single-dish and multi-dish layouts.
 */
export interface ScheduleViewProps {
  /** The computed schedule to display. null triggers the empty-state prompt. */
  readonly schedule: Schedule | null;
  /**
   * Active display mode. Defaults to 'list' when not provided.
   * Controlled externally so the parent page can persist the user's preference.
   */
  readonly viewMode?: ScheduleViewMode;
  /** Called when the user toggles between 'gantt' and 'list'. */
  readonly onViewModeChange?: (mode: ScheduleViewMode) => void;
}

const TYPE_COLOURS: Record<string, string> = {
  prep: 'info',
  cook: 'danger',
  rest: 'warning',
  cooldown: 'secondary',
};

/** Chronological list renderer (used in 'list' mode). */
function ListView({ schedule }: { readonly schedule: Schedule }) {
  const isMultiDish = new Set(schedule.events.map(e => e.dishId)).size > 1;
  return (
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
  );
}

/**
 * ScheduleView — wrapper around GanttView or ListView.
 * Renders a Gantt/list mode toggle button group and delegates to the appropriate renderer.
 * Renders an empty-state prompt when schedule is null.
 */
export function ScheduleView({
  schedule,
  viewMode = 'list',
  onViewModeChange,
}: ScheduleViewProps) {
  if (!schedule) {
    return (
      <Alert variant="light" className="text-center text-muted border">
        Add steps and set a target time to see your schedule.
      </Alert>
    );
  }

  return (
    <div>
      {schedule.overrunMinutes !== null && schedule.overrunMinutes > 0 && (
        <OverrunWarning overrunMinutes={schedule.overrunMinutes} />
      )}

      {onViewModeChange && (
        <div className="d-flex justify-content-end mb-2">
          <ButtonGroup size="sm">
            <Button
              variant={viewMode === 'gantt' ? 'primary' : 'outline-primary'}
              onClick={() => onViewModeChange('gantt')}
              aria-pressed={viewMode === 'gantt'}
            >
              Gantt
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
              onClick={() => onViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
            >
              List
            </Button>
          </ButtonGroup>
        </div>
      )}

      {viewMode === 'gantt' ? (
        <GanttView schedule={schedule} />
      ) : (
        <ListView schedule={schedule} />
      )}
    </div>
  );
}
