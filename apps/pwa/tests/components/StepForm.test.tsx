/**
 * Component tests for StepForm.
 * T023 — TDD: written before T026 implementation (now validates against implementation).
 * Tests target the StepFormProps interface.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepForm } from '../../src/components/StepForm.js';
import type { Step } from '@kitchensync/meal-model';

const mockStep: Step = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Chop onions',
  type: 'prep',
  durationMinutes: 10,
};

describe('StepForm', () => {
  it('renders empty state when steps array is empty', () => {
    render(<StepForm steps={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no steps yet/i)).toBeInTheDocument();
  });

  it('renders existing steps', () => {
    render(<StepForm steps={[mockStep]} onChange={vi.fn()} />);
    expect(screen.getByText('Chop onions')).toBeInTheDocument();
  });

  it('adds a step when name, type, and duration are valid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepForm steps={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText(/step name/i), 'Boil water');
    await user.clear(screen.getByLabelText(/duration/i));
    await user.type(screen.getByLabelText(/duration/i), '5');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(onChange).toHaveBeenCalledOnce();
    const newSteps = onChange.mock.calls[0][0] as Step[];
    expect(newSteps).toHaveLength(1);
    expect(newSteps[0]?.name).toBe('Boil water');
    expect(newSteps[0]?.durationMinutes).toBe(5);
  });

  it('rejects blank step name (inline validation)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepForm steps={[]} onChange={onChange} />);

    await user.clear(screen.getByLabelText(/duration/i));
    await user.type(screen.getByLabelText(/duration/i), '5');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects zero duration (inline validation)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepForm steps={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText(/step name/i), 'Step');
    await user.clear(screen.getByLabelText(/duration/i));
    await user.type(screen.getByLabelText(/duration/i), '0');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a step when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepForm steps={[mockStep]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /✕/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<StepForm steps={[mockStep]} onChange={vi.fn()} disabled />);
    screen.getAllByRole('button').forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('moves step up when up button is clicked', async () => {
    const user = userEvent.setup();
    const step2: Step = { ...mockStep, id: '22222222-2222-2222-2222-222222222222', name: 'Cook' };
    const onChange = vi.fn();
    render(<StepForm steps={[mockStep, step2]} onChange={onChange} />);

    const upButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(upButtons[1]!); // Move second step up
    const newSteps = onChange.mock.calls[0][0] as Step[];
    expect(newSteps[0]?.name).toBe('Cook');
    expect(newSteps[1]?.name).toBe('Chop onions');
  });
});
