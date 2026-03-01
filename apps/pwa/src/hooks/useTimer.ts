import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveSession, AlarmConfiguration, SessionCommand } from '@kitchensync/alarm-scheduler';
import { alarmScheduler } from '@kitchensync/alarm-scheduler';
import { LiveSessionRepository } from '../storage/LiveSessionRepository.js';

interface UseTimerResult {
  session: LiveSession;
  commands: readonly SessionCommand[];
  confirmStep: (stepId: string) => void;
  applyDelay: (scope: 'step' | 'dish' | 'meal', targetId: string | null, delayMinutes: 1 | 5 | 10) => void;
  setAlarmOverride: (scope: 'meal' | 'dish' | 'step', targetId: string | null, enabled: boolean) => void;
  acceptNewTargetTime: (proposedTime: import('@kitchensync/timing-engine').WallClockTime) => void;
  endSession: () => Promise<void>;
}

/**
 * Manages the live timer session lifecycle.
 * - Instantiates the timer Web Worker on mount.
 * - Subscribes to tick messages and calls AlarmScheduler.tickSession on each tick.
 * - Persists the session to LiveSessionRepository on every state change.
 * - Accepts stepDurations for effectiveMealEnd computation.
 */
export function useTimer(
  initialSession: LiveSession,
  globalConfig: AlarmConfiguration,
  stepDurations: ReadonlyMap<string, number>,
): UseTimerResult {
  const [session, setSession] = useState<LiveSession>(initialSession);
  const [commands, setCommands] = useState<readonly SessionCommand[]>([]);
  const sessionRef = useRef<LiveSession>(initialSession);
  const stepDurationsRef = useRef(stepDurations);
  const globalConfigRef = useRef(globalConfig);

  // Keep refs in sync
  sessionRef.current = session;
  stepDurationsRef.current = stepDurations;
  globalConfigRef.current = globalConfig;

  useEffect(() => {
    const worker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.addEventListener('message', (event: MessageEvent<{ type: 'tick'; nowMs: number }>) => {
      if (event.data.type !== 'tick') return;
      const { nowMs } = event.data;
      const { session: updated, commands: cmds } = alarmScheduler.tickSession(
        sessionRef.current,
        nowMs,
        globalConfigRef.current,
      );
      sessionRef.current = updated;
      setSession(updated);
      if (cmds.length > 0) setCommands(cmds);
      void LiveSessionRepository.save(updated);
    });

    worker.postMessage({ type: 'start' });

    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSession = useCallback((updated: LiveSession) => {
    sessionRef.current = updated;
    setSession(updated);
    void LiveSessionRepository.save(updated);
  }, []);

  const confirmStep = useCallback((stepId: string) => {
    const { session: updated, commands: cmds } = alarmScheduler.confirmStepStarted(
      sessionRef.current,
      stepId,
      Date.now(),
    );
    setCommands(cmds);
    updateSession(updated);
  }, [updateSession]);

  const applyDelay = useCallback((
    scope: 'step' | 'dish' | 'meal',
    targetId: string | null,
    delayMinutes: 1 | 5 | 10,
  ) => {
    let result: { session: LiveSession; commands: readonly SessionCommand[] };
    const current = sessionRef.current;
    if (scope === 'step' && targetId) {
      result = alarmScheduler.applyStepDelay(current, targetId, delayMinutes);
    } else if (scope === 'dish' && targetId) {
      result = alarmScheduler.applyDishDelay(current, targetId, delayMinutes);
    } else {
      result = alarmScheduler.applyMealDelay(current, delayMinutes);
    }
    setCommands(result.commands);
    updateSession(result.session);
  }, [updateSession]);

  const setAlarmOverrideFn = useCallback((
    scope: 'meal' | 'dish' | 'step',
    targetId: string | null,
    enabled: boolean,
  ) => {
    const updated = alarmScheduler.setAlarmOverride(sessionRef.current, scope, targetId, enabled);
    updateSession(updated);
  }, [updateSession]);

  const acceptNewTargetTime = useCallback((proposedTime: import('@kitchensync/timing-engine').WallClockTime) => {
    const updated = alarmScheduler.acceptNewTargetTime(sessionRef.current, proposedTime);
    updateSession(updated);
  }, [updateSession]);

  const endSession = useCallback(async () => {
    await LiveSessionRepository.clear();
  }, []);

  return { session, commands, confirmStep, applyDelay, setAlarmOverride: setAlarmOverrideFn, acceptNewTargetTime, endSession };
}
