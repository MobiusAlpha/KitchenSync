/**
 * T055 — Contract tests for DelayControls component.
 * Verifies +1/+5/+10 buttons call onApplyDelay with correct scope, targetId, and amount.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DelayControls } from '../../src/components/DelayControls.js';

const STEP_ID = 'step-1';
const DISH_ID = 'dish-1';

function renderDelayControls(onApplyDelay = vi.fn()) {
  render(
    <DelayControls
      stepId={STEP_ID}
      dishId={DISH_ID}
      onApplyDelay={onApplyDelay}
    />,
  );
  return onApplyDelay;
}

describe('DelayControls', () => {
  it('renders +1m, +5m, +10m buttons for Step scope', () => {
    renderDelayControls();
    // Each delay amount appears 3 times (step/dish/meal rows)
    expect(screen.getAllByText('+1m')).toHaveLength(3);
    expect(screen.getAllByText('+5m')).toHaveLength(3);
    expect(screen.getAllByText('+10m')).toHaveLength(3);
  });

  it('calls onApplyDelay with scope="step", stepId, and 1 when step +1m is clicked', async () => {
    const onApplyDelay = vi.fn();
    renderDelayControls(onApplyDelay);
    const stepPlusOne = screen.getAllByText('+1m')[0]!;
    await userEvent.click(stepPlusOne);
    expect(onApplyDelay).toHaveBeenCalledWith('step', STEP_ID, 1);
  });

  it('calls onApplyDelay with scope="step", stepId, and 5 when step +5m is clicked', async () => {
    const onApplyDelay = vi.fn();
    renderDelayControls(onApplyDelay);
    const stepPlusFive = screen.getAllByText('+5m')[0]!;
    await userEvent.click(stepPlusFive);
    expect(onApplyDelay).toHaveBeenCalledWith('step', STEP_ID, 5);
  });

  it('calls onApplyDelay with scope="step", stepId, and 10 when step +10m is clicked', async () => {
    const onApplyDelay = vi.fn();
    renderDelayControls(onApplyDelay);
    const stepPlusTen = screen.getAllByText('+10m')[0]!;
    await userEvent.click(stepPlusTen);
    expect(onApplyDelay).toHaveBeenCalledWith('step', STEP_ID, 10);
  });

  it('calls onApplyDelay with scope="dish", dishId, and 5 when dish +5m is clicked', async () => {
    const onApplyDelay = vi.fn();
    renderDelayControls(onApplyDelay);
    const dishPlusFive = screen.getAllByText('+5m')[1]!;
    await userEvent.click(dishPlusFive);
    expect(onApplyDelay).toHaveBeenCalledWith('dish', DISH_ID, 5);
  });

  it('calls onApplyDelay with scope="meal", null, and 10 when meal +10m is clicked', async () => {
    const onApplyDelay = vi.fn();
    renderDelayControls(onApplyDelay);
    const mealPlusTen = screen.getAllByText('+10m')[2]!;
    await userEvent.click(mealPlusTen);
    expect(onApplyDelay).toHaveBeenCalledWith('meal', null, 10);
  });
});
