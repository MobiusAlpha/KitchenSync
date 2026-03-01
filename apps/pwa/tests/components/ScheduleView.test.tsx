/**
 * Component tests for ScheduleView.
 * T024 — Tests target the ScheduleViewProps interface.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleView } from '../../src/components/ScheduleView.js';
import type { Schedule } from '@kitchensync/scheduler';

const sampleSchedule: Schedule = {
  targetTime: { hour: 19, minute: 0 },
  overrunMinutes: null,
  events: [
    {
      dishId: 'dish-1',
      dishName: 'Chicken',
      stepId: 'step-1',
      stepName: 'Prep',
      stepType: 'prep',
      startTime: { hour: 17, minute: 45 },
      isParallel: false,
    },
    {
      dishId: 'dish-1',
      dishName: 'Chicken',
      stepId: 'step-2',
      stepName: 'Cook',
      stepType: 'cook',
      startTime: { hour: 18, minute: 5 },
      isParallel: false,
    },
  ],
};

describe('ScheduleView', () => {
  it('renders empty-state prompt when schedule is null', () => {
    render(<ScheduleView schedule={null} />);
    expect(screen.getByText(/add steps/i)).toBeInTheDocument();
  });

  it('renders each StepEvent with step name and formatted start time', () => {
    render(<ScheduleView schedule={sampleSchedule} />);
    expect(screen.getByText('Prep')).toBeInTheDocument();
    expect(screen.getByText('Cook')).toBeInTheDocument();
    expect(screen.getByText('17:45')).toBeInTheDocument();
    expect(screen.getByText('18:05')).toBeInTheDocument();
  });

  it('renders step type badges', () => {
    render(<ScheduleView schedule={sampleSchedule} />);
    expect(screen.getAllByText('prep')).toHaveLength(1);
    expect(screen.getAllByText('cook')).toHaveLength(1);
  });

  it('renders OverrunWarning when overrunMinutes > 0', () => {
    const overrunSchedule: Schedule = { ...sampleSchedule, overrunMinutes: 15 };
    render(<ScheduleView schedule={overrunSchedule} />);
    expect(screen.getByText(/15 minute/i)).toBeInTheDocument();
  });

  it('does not render OverrunWarning when overrunMinutes is null', () => {
    render(<ScheduleView schedule={sampleSchedule} />);
    expect(screen.queryByText(/behind schedule/i)).not.toBeInTheDocument();
  });

  it('shows parallel badge for multi-dish parallel steps', () => {
    const multiDishSchedule: Schedule = {
      ...sampleSchedule,
      events: [
        { ...sampleSchedule.events[0]!, dishId: 'dish-1', isParallel: true },
        {
          dishId: 'dish-2',
          dishName: 'Veg',
          stepId: 'step-3',
          stepName: 'Chop',
          stepType: 'prep',
          startTime: { hour: 17, minute: 45 },
          isParallel: true,
        },
      ],
    };
    render(<ScheduleView schedule={multiDishSchedule} />);
    expect(screen.getAllByText(/parallel/i)).toHaveLength(2);
  });
});
