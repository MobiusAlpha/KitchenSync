/**
 * T056 — Contract tests for AlarmToggleControls component.
 * Verifies current override state is rendered and onSetAlarmOverride is called
 * with correct scope and targetId.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LiveSession } from '@kitchensync/alarm-scheduler';
import { AlarmToggleControls } from '../../src/components/AlarmToggleControls.js';

const STEP_ID = 'step-abc';
const DISH_ID = 'dish-xyz';

const baseSession: LiveSession = {
  id: 'session-1',
  mealPlanId: null,
  startedAt: 1000,
  targetTime: { hour: 18, minute: 0 },
  effectiveTargetTime: { hour: 18, minute: 0 },
  stepStates: [
    {
      stepId: STEP_ID,
      dishId: DISH_ID,
      scheduledStart: { hour: 17, minute: 0 },
      status: 'pending',
      confirmedAt: null,
      delayAppliedMinutes: 0,
      stepName: 'Bake',
      dishName: 'Chicken',
    },
  ],
  alarmOverrides: [],
  totalDelayMinutes: 0,
};

function renderControls(
  session: LiveSession = baseSession,
  onSetAlarmOverride = vi.fn(),
) {
  render(
    <AlarmToggleControls
      session={session}
      stepId={STEP_ID}
      dishId={DISH_ID}
      onSetAlarmOverride={onSetAlarmOverride}
    />,
  );
  return onSetAlarmOverride;
}

describe('AlarmToggleControls', () => {
  it('renders Step alarm, Dish alarms, and Meal alarms toggles', () => {
    renderControls();
    expect(screen.getByLabelText('Step alarm')).toBeInTheDocument();
    expect(screen.getByLabelText('Dish alarms')).toBeInTheDocument();
    expect(screen.getByLabelText('Meal alarms')).toBeInTheDocument();
  });

  it('step toggle is checked when no step override (defaults to global enabled)', () => {
    renderControls();
    const stepToggle = screen.getByLabelText('Step alarm') as HTMLInputElement;
    // No override → defaults to global defaultEnabled (true)
    expect(stepToggle.checked).toBe(true);
  });

  it('calls onSetAlarmOverride with scope="step", stepId, false when step toggle turned off', async () => {
    const onSetAlarmOverride = vi.fn();
    renderControls(baseSession, onSetAlarmOverride);
    const stepToggle = screen.getByLabelText('Step alarm');
    await userEvent.click(stepToggle);
    expect(onSetAlarmOverride).toHaveBeenCalledWith('step', STEP_ID, false);
  });

  it('calls onSetAlarmOverride with scope="dish", dishId when dish toggle clicked', async () => {
    const onSetAlarmOverride = vi.fn();
    renderControls(baseSession, onSetAlarmOverride);
    const dishToggle = screen.getByLabelText('Dish alarms');
    await userEvent.click(dishToggle);
    expect(onSetAlarmOverride).toHaveBeenCalledWith('dish', DISH_ID, false);
  });

  it('calls onSetAlarmOverride with scope="meal", null when meal toggle clicked', async () => {
    const onSetAlarmOverride = vi.fn();
    renderControls(baseSession, onSetAlarmOverride);
    const mealToggle = screen.getByLabelText('Meal alarms');
    await userEvent.click(mealToggle);
    expect(onSetAlarmOverride).toHaveBeenCalledWith('meal', null, false);
  });

  it('reflects dish override enabled=false when override exists in session', () => {
    const sessionWithOverride: LiveSession = {
      ...baseSession,
      alarmOverrides: [{ scope: 'dish', targetId: DISH_ID, enabled: false }],
    };
    renderControls(sessionWithOverride);
    const dishToggle = screen.getByLabelText('Dish alarms') as HTMLInputElement;
    expect(dishToggle.checked).toBe(false);
  });
});
