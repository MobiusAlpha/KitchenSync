/**
 * Component tests for TimerView.
 * T052 — Tests via the TimerViewProps interface.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimerView } from '../../src/components/TimerView.js';
import type { LiveSession, SessionCommand } from '@kitchensync/alarm-scheduler';

const targetTime = { hour: 19, minute: 0 };

const mockSession: LiveSession = {
  id: 'session-1',
  mealPlanId: null,
  startedAt: 1000000,
  targetTime,
  effectiveTargetTime: targetTime,
  alarmOverrides: [],
  totalDelayMinutes: 0,
  stepStates: [
    {
      stepId: 's1',
      dishId: 'd1',
      stepName: 'Roast',
      dishName: 'Chicken',
      scheduledStart: { hour: 17, minute: 30 },
      status: 'pending',
      confirmedAt: null,
      delayAppliedMinutes: 0,
    },
  ],
};

const stepDurations = new Map<string, number>([['s1', 90]]);

describe('TimerView', () => {
  it('renders step list with scheduled start time and step name', () => {
    render(
      <TimerView
        session={mockSession}
        commands={[]}
        stepDurations={stepDurations}
        onConfirmStep={vi.fn()}
        onApplyDelay={vi.fn()}
        onSetAlarmOverride={vi.fn()}
        onAcceptNewTargetTime={vi.fn()}
      />
    );
    expect(screen.getByText('Roast')).toBeInTheDocument();
    expect(screen.getByText(/17:30/)).toBeInTheDocument();
    expect(screen.getByText('Chicken')).toBeInTheDocument();
  });

  it('renders alarm prompt with step name and dish name when SOUND_ALARM command present', () => {
    const alarmCommand: SessionCommand = {
      type: 'SOUND_ALARM',
      stepId: 's1',
      stepName: 'Roast',
      dishName: 'Chicken',
    };
    render(
      <TimerView
        session={mockSession}
        commands={[alarmCommand]}
        stepDurations={stepDurations}
        onConfirmStep={vi.fn()}
        onApplyDelay={vi.fn()}
        onSetAlarmOverride={vi.fn()}
        onAcceptNewTargetTime={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /mark started/i })).toBeInTheDocument();
    expect(screen.getByText(/time to start this step/i)).toBeInTheDocument();
  });

  it('calls onConfirmStep with stepId when Mark Started is clicked', async () => {
    const user = userEvent.setup();
    const onConfirmStep = vi.fn();
    const alarmCommand: SessionCommand = {
      type: 'SOUND_ALARM',
      stepId: 's1',
      stepName: 'Roast',
      dishName: 'Chicken',
    };
    render(
      <TimerView
        session={mockSession}
        commands={[alarmCommand]}
        stepDurations={stepDurations}
        onConfirmStep={onConfirmStep}
        onApplyDelay={vi.fn()}
        onSetAlarmOverride={vi.fn()}
        onAcceptNewTargetTime={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /mark started/i }));
    expect(onConfirmStep).toHaveBeenCalledWith('s1');
  });

  it('renders delay buttons (+1m/+5m/+10m) for pending step', () => {
    render(
      <TimerView
        session={mockSession}
        commands={[]}
        stepDurations={stepDurations}
        onConfirmStep={vi.fn()}
        onApplyDelay={vi.fn()}
        onSetAlarmOverride={vi.fn()}
        onAcceptNewTargetTime={vi.fn()}
      />
    );
    expect(screen.getAllByText(/\+1m/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+5m/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+10m/i).length).toBeGreaterThan(0);
  });

  it('renders alarm toggles for pending step', () => {
    render(
      <TimerView
        session={mockSession}
        commands={[]}
        stepDurations={stepDurations}
        onConfirmStep={vi.fn()}
        onApplyDelay={vi.fn()}
        onSetAlarmOverride={vi.fn()}
        onAcceptNewTargetTime={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/step alarm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dish alarms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meal alarms/i)).toBeInTheDocument();
  });
});
