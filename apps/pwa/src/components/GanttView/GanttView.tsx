import { Badge } from 'react-bootstrap';
import { timingEngine } from '@kitchensync/timing-engine';
import type { Schedule, StepEvent } from '@kitchensync/scheduler';
import type { WallClockTime } from '@kitchensync/meal-model';

/** Minutes from midnight for a WallClockTime. */
function toMinutes(t: WallClockTime): number {
  return t.hour * 60 + t.minute;
}

interface GanttLaneProps {
  readonly dishName: string;
  readonly events: readonly StepEvent[];
  /** Earliest start time across all events (used as the ruler origin). */
  readonly minMinutes: number;
  /** Total span of the ruler in minutes. */
  readonly spanMinutes: number;
}

function GanttLane({ dishName, events, minMinutes, spanMinutes }: GanttLaneProps) {
  return (
    <div className="mb-2">
      <div className="small fw-semibold text-truncate mb-1" style={{ maxWidth: 120 }}>
        {dishName}
      </div>
      <div
        className="position-relative bg-light border rounded"
        style={{ height: 36 }}
        aria-label={`Gantt lane for ${dishName}`}
      >
        {events.map(event => {
          const startMin = toMinutes(event.startTime);
          const left = spanMinutes > 0
            ? ((startMin - minMinutes) / spanMinutes) * 100
            : 0;
          const width = spanMinutes > 0
            ? (event.durationMinutes / spanMinutes) * 100
            : 0;

          return (
            <div
              key={event.stepId}
              className="position-absolute h-100 d-flex align-items-center px-1 overflow-hidden"
              style={{
                left: `${Math.max(0, left)}%`,
                width: `${Math.max(0.5, width)}%`,
                backgroundColor: '#0d6efd',
                opacity: 0.85,
                borderRadius: 4,
              }}
              title={`${event.stepName ?? 'Block'} — ${event.durationMinutes} min`}
            >
              <span className="text-white small text-truncate" style={{ fontSize: '0.7rem' }}>
                {event.stepName ?? '—'}
                {event.isParallel && (
                  <Badge bg="warning" text="dark" className="ms-1" style={{ fontSize: '0.6rem' }}>
                    ∥
                  </Badge>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * GanttView — pure-CSS Gantt chart with one horizontal lane per dish.
 * Steps are rendered as proportionally-sized blocks using durationMinutes (FR-012a).
 * Parallel steps from different dishes share the same time position and show a ∥ badge.
 */
export function GanttView({ schedule }: { readonly schedule: Schedule }) {
  const { events } = schedule;

  if (events.length === 0) return null;

  // Group events by dish
  const dishMap = new Map<string, { name: string; events: StepEvent[] }>();
  for (const event of events) {
    const existing = dishMap.get(event.dishId);
    if (existing) {
      existing.events.push(event);
    } else {
      dishMap.set(event.dishId, { name: event.dishName, events: [event] });
    }
  }

  // Compute ruler bounds
  const allStartMinutes = events.map(e => toMinutes(e.startTime));
  const allEndMinutes = events.map(e => toMinutes(e.startTime) + e.durationMinutes);
  const minMinutes = Math.min(...allStartMinutes);
  const maxMinutes = Math.max(...allEndMinutes);
  const spanMinutes = maxMinutes - minMinutes || 60; // at least 60-min span

  // Time-axis ruler labels (at most 5 ticks)
  const tickCount = Math.min(5, Math.ceil(spanMinutes / 30) + 1);
  const tickMinutes = spanMinutes / (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    minMinutes + Math.round(i * tickMinutes),
  );

  return (
    <div aria-label="Gantt chart">
      {/* Time axis */}
      <div className="position-relative mb-1" style={{ height: 20 }}>
        {ticks.map((t, i) => {
          const pct = ((t - minMinutes) / spanMinutes) * 100;
          const wct = { hour: Math.floor((t % 1440) / 60), minute: t % 60 };
          return (
            <span
              key={i}
              className="position-absolute small text-muted"
              style={{
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
              }}
            >
              {timingEngine.formatWallClockTime(wct)}
            </span>
          );
        })}
      </div>

      {/* Lanes */}
      {[...dishMap.entries()].map(([dishId, { name, events: dishEvents }]) => (
        <GanttLane
          key={dishId}
          dishName={name}
          events={dishEvents}
          minMinutes={minMinutes}
          spanMinutes={spanMinutes}
        />
      ))}
    </div>
  );
}
