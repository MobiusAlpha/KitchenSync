/**
 * T020 — Contract tests for BlockExpansion against BlockExpansionProps interface.
 * TDD: these tests MUST fail before BlockExpansion is implemented (T025).
 * Tests target the BlockExpansionProps contract, not any concrete implementation.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { BlockExpansionProps } from '../../src/components/BlockExpansion/BlockExpansion.js';
import { BlockExpansion } from '../../src/components/BlockExpansion/BlockExpansion.js';
import type { Step } from '@kitchensync/meal-model';

const baseStep: Step = { id: 'step-draft-1', name: 'Chop', type: 'prep', durationMinutes: 10 };

const baseProps: BlockExpansionProps = {
  dishName: 'Chicken',
  originalEstimateMinutes: 60,
  draftSteps: [],
  onDraftChange: vi.fn(),
  onExpand: vi.fn(),
  onCancel: vi.fn(),
};

describe('BlockExpansion', () => {
  it('renders the dish name as a panel title', () => {
    render(<BlockExpansion {...baseProps} />);
    expect(screen.getByText(/chicken/i)).toBeInTheDocument();
  });

  it('shows 0 min diff label when no draft steps', () => {
    render(<BlockExpansion {...baseProps} draftSteps={[]} />);
    // Running sum is 0, original is 60 → diff is −60 or shows original estimate
    expect(screen.getByText(/60 min/i)).toBeInTheDocument();
  });

  it('shows diff label: sum of draft steps vs original estimate', () => {
    const draftSteps: Step[] = [
      { id: 'a', name: 'Prep', type: 'prep', durationMinutes: 20 },
      { id: 'b', name: 'Cook', type: 'cook', durationMinutes: 50 },
    ];
    render(<BlockExpansion {...baseProps} originalEstimateMinutes={60} draftSteps={draftSteps} />);
    // sum = 70, original = 60 → +10 min vs. original estimate
    expect(screen.getByText(/\+10/i)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<BlockExpansion {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onExpand with current draftSteps when Confirm button is clicked', () => {
    const onExpand = vi.fn();
    const draftSteps: Step[] = [baseStep];
    render(<BlockExpansion {...baseProps} draftSteps={draftSteps} onExpand={onExpand} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm|expand|save/i }));
    expect(onExpand).toHaveBeenCalledWith(draftSteps);
  });
});
