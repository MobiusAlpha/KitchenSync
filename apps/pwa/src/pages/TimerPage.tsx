import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Alert, Button, Card } from 'react-bootstrap';
import { alarmScheduler } from '@kitchensync/alarm-scheduler';
import type { Schedule } from '@kitchensync/scheduler';
import { timingEngine } from '@kitchensync/timing-engine';
import { TimerView } from '../components/TimerView.js';
import { useTimer } from '../hooks/useTimer.js';
import { useAlarm } from '../hooks/useAlarm.js';
import { SettingsRepository } from '../storage/SettingsRepository.js';
import { LiveSessionRepository } from '../storage/LiveSessionRepository.js';
import { ROUTES } from '../routes.js';

/**
 * US4: Live countdown timer page.
 * - Creates a LiveSession from the incoming Schedule (via router state).
 * - Auto-resumes an existing session from IndexedDB on mount.
 * - Renders TimerView with delay controls and alarm toggles.
 * - T070: Shows proposed new target time on UPDATE_DISPLAY command.
 * - T071: Shows overrun warning when effectiveTargetTime exceeds original targetTime.
 */
export function TimerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = (location.state as { schedule?: Schedule } | null)?.schedule ?? null;
  const [isReady, setIsReady] = useState(false);
  const [initialSession, setInitialSession] = useState<ReturnType<typeof alarmScheduler.createLiveSession> | null>(null);
  const [globalConfig, setGlobalConfig] = useState({ id: 'global' as const, defaultEnabled: true });

  useEffect(() => {
    async function init() {
      const config = await SettingsRepository.read();
      setGlobalConfig(config);

      // Try to resume existing session
      const stored = await LiveSessionRepository.load();
      if (stored) {
        setInitialSession(stored);
        setIsReady(true);
        return;
      }

      // Create new session from incoming schedule
      if (schedule) {
        const newSession = alarmScheduler.createLiveSession(schedule, null, Date.now(), config);
        await LiveSessionRepository.save(newSession);
        setInitialSession(newSession);
        setIsReady(true);
      }
    }
    void init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!schedule && !isReady) {
    return (
      <div className="py-3">
        <Alert variant="info">
          No active timer session. Start one from the{' '}
          <Button
            variant="link"
            className="p-0"
            onClick={() => void navigate(ROUTES.PLANNER)}
          >
            Planner
          </Button>{' '}
          or{' '}
          <Button
            variant="link"
            className="p-0"
            onClick={() => void navigate(ROUTES.MEAL)}
          >
            Meal Plan
          </Button>
          .
        </Alert>
      </div>
    );
  }

  if (!isReady || !initialSession) {
    return <div className="py-3"><p className="text-muted">Loading timer…</p></div>;
  }

  return (
    <TimerPageInner
      initialSession={initialSession}
      globalConfig={globalConfig}
      schedule={schedule}
    />
  );
}

interface TimerPageInnerProps {
  readonly initialSession: ReturnType<typeof alarmScheduler.createLiveSession>;
  readonly globalConfig: { id: 'global'; defaultEnabled: boolean };
  readonly schedule: Schedule | null;
}

function TimerPageInner({ initialSession, globalConfig, schedule }: TimerPageInnerProps) {
  const navigate = useNavigate();
  const { handleCommands } = useAlarm();

  // Build stepDurations map from the original schedule's source events
  const stepDurations = useMemo<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    if (schedule) {
      for (const event of schedule.events) {
        // stepDurations comes from the Schedule — StepEvent doesn't have duration,
        // so we compute it from scheduledStart differences within each dish.
        // For now, store a 0 as a safe default; the caller should derive this.
        void event;
      }
    }
    // Derive from initialSession step states (approximate: not stored in LiveSession by design)
    // The caller (TimerPage T068) should build this before mount.
    // We use the schedule events to infer durations where possible.
    if (schedule) {
      // Group events by dish and infer step durations from start-time differences
      const byDish = new Map<string, typeof schedule.events[0][]>();
      for (const event of schedule.events) {
        const list = byDish.get(event.dishId) ?? [];
        list.push(event);
        byDish.set(event.dishId, list);
      }
      for (const [_dishId, events] of byDish) {
        const sorted = [...events].sort((a, b) => {
          const am = a.startTime.hour * 60 + a.startTime.minute;
          const bm = b.startTime.hour * 60 + b.startTime.minute;
          return am - bm;
        });
        for (let i = 0; i < sorted.length - 1; i++) {
          const curr = sorted[i]!;
          const next = sorted[i + 1]!;
          const dur = timingEngine.differenceMinutes(next.startTime, curr.startTime);
          map.set(curr.stepId, Math.abs(dur));
        }
        // Last step: use targetTime - lastStartTime
        const last = sorted[sorted.length - 1]!;
        if (last) {
          const dur = timingEngine.differenceMinutes(schedule.targetTime, last.startTime);
          map.set(last.stepId, Math.abs(dur));
        }
      }
    }
    return map;
  }, [schedule]);

  const { session, commands, confirmStep, applyDelay, setAlarmOverride, acceptNewTargetTime, endSession } =
    useTimer(initialSession, globalConfig, stepDurations);

  // Execute alarm side effects
  useEffect(() => {
    handleCommands(commands);
  }, [commands, handleCommands]);

  // T071: overrun warning when effectiveTargetTime exceeds original targetTime
  const overrunMinutes = timingEngine.differenceMinutes(
    session.effectiveTargetTime,
    session.targetTime,
  );

  const handleEndSession = async () => {
    await endSession();
    void navigate(ROUTES.PLANNER);
  };

  return (
    <div className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Live Timer</h1>
        <Button variant="outline-danger" onClick={() => void handleEndSession()}>
          End Session
        </Button>
      </div>

      {overrunMinutes > 0 && (
        <Alert variant="warning">
          ⚠️ You will miss your original target by <strong>{overrunMinutes} min</strong>.
        </Alert>
      )}

      <Card>
        <Card.Body>
          <TimerView
            session={session}
            commands={commands}
            stepDurations={stepDurations}
            onConfirmStep={confirmStep}
            onApplyDelay={applyDelay}
            onSetAlarmOverride={setAlarmOverride}
            onAcceptNewTargetTime={acceptNewTargetTime}
          />
        </Card.Body>
      </Card>
    </div>
  );
}
