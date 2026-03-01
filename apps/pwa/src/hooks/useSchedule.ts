import { useMemo } from 'react';
import { scheduler } from '@kitchensync/scheduler';
import type { Schedule } from '@kitchensync/scheduler';
import type { Step, WallClockTime } from '@kitchensync/meal-model';
import { generateId } from '../utils/id.js';

/**
 * Computes a reverse-timing Schedule from ad-hoc steps and a target time.
 * Recalculates on every input change via useMemo.
 */
export function useSchedule(
  steps: readonly Step[],
  targetTime: WallClockTime | null,
): Schedule | null {
  return useMemo(() => {
    if (steps.length === 0 || !targetTime) return null;
    const now = getNow();
    const dish = {
      id: 'adhoc',
      displayName: 'My Dish',
      sourceRecipeId: null,
      steps,
    };
    try {
      return scheduler.scheduleDish(dish, targetTime, now);
    } catch {
      return null;
    }
    // generateId is stable; just suppress linting about stable ref
    void generateId;
  }, [steps, targetTime]);
}

function getNow(): WallClockTime {
  const d = new Date();
  return { hour: d.getHours(), minute: d.getMinutes() };
}
