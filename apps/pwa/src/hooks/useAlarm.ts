import { useRef, useCallback, useEffect } from 'react';
import type { SessionCommand } from '@kitchensync/alarm-scheduler';

/**
 * Manages Web Audio alarm chimes and OS notifications.
 * AudioContext is created on first user gesture (required by browsers).
 * Requests Notification permission once on mount.
 */
export function useAlarm() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (!permissionRequestedRef.current && 'Notification' in window) {
      permissionRequestedRef.current = true;
      void Notification.requestPermission();
    }
  }, []);

  function ensureAudioContext(): AudioContext {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  const playChime = useCallback(async () => {
    const ctx = ensureAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    let startTime = ctx.currentTime;
    for (const freq of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
      startTime += 0.25;
    }
  }, []);

  const handleCommands = useCallback((commands: readonly SessionCommand[]) => {
    for (const cmd of commands) {
      if (cmd.type === 'SOUND_ALARM') {
        void playChime();
        if ('Notification' in window && Notification.permission === 'granted') {
          void new Notification(`${cmd.stepName} — ${cmd.dishName}`, {
            body: 'Time to start this step!',
            tag: cmd.stepId,
          });
        }
      }
    }
  }, [playChime]);

  return { handleCommands };
}
