/**
 * Component tests for ScheduleView in multi-dish mode.
 * T042 — Tests via the ScheduleViewProps interface.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleView } from '../../src/components/ScheduleView.js';
import type { Schedule } from '@kitchensync/scheduler';

const multiDishSchedule: Schedule = {
  events: [
    {
      stepId: 's1',
      dishId: 'd1',
      dishName: 'Roast Chicken',
      stepName: 'Roast',
      stepType: 'cook',
      startTime: { hour: 17, minute: 30 },
      isParallel: true,
    },
    {
      stepId: 's2',
      dishId: 'd2',
      dishName: 'Caesar Salad',
      stepName: 'Toss',
      stepType: 'prep',
      startTime: { hour: 17, minute: 30 },
      isParallel: true,
    },
    {
      stepId: 's3',
      dishId: 'd1',
      dishName: 'Roast Chicken',
      stepName: 'Rest',
      stepType: 'rest',
      startTime: { hour: 19, minute: 0 },
      isParallel: false,
    },
  ],
  overrunMinutes: null,
};

describe('ScheduleView — multi-dish mode', () => {
  it('shows Dish column header in multi-dish mode', () => {
    render(<ScheduleView schedule={multiDishSchedule} />);
    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);
    expect(headers).toContain('Dish');
  });

  it('shows dish names on each row', () => {
    render(<ScheduleView schedule={multiDishSchedule} />);
    expect(screen.getAllByText('Roast Chicken')).toHaveLength(2); // two events from d1
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
  });

  it('shows all dishes events in one sorted list', () => {
    render(<ScheduleView schedule={multiDishSchedule} />);
    expect(screen.getByText('Roast')).toBeInTheDocument();
    expect(screen.getByText('Toss')).toBeInTheDocument();
    expect(screen.getByText('Rest')).toBeInTheDocument();
  });

  it('shows parallel badge for parallel steps', () => {
    render(<ScheduleView schedule={multiDishSchedule} />);
    const parallelBadges = screen.getAllByText(/⇔ parallel/i);
    expect(parallelBadges).toHaveLength(2);
  });

  it('does not show parallel badge for non-parallel steps', () => {
    render(<ScheduleView schedule={multiDishSchedule} />);
    // 3 events total, 2 parallel: only 2 badges
    expect(screen.getAllByText(/⇔ parallel/i)).toHaveLength(2);
  });
});
