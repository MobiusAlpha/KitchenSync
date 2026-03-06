/**
 * Component tests for MealPlanEditor.
 * T041 — Tests via the MealPlanEditorProps interface.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealPlanEditor } from '../../src/components/MealPlanEditor.js';
import type { MealPlan, Recipe } from '@kitchensync/meal-model';

function emptyPlan(): MealPlan {
  return {
    id: 'mp-1',
    name: 'My Meal',
    targetTime: { hour: 19, minute: 0 },
    dishes: [],
    createdAt: 1000,
    updatedAt: 1000,
  };
}

const mockRecipe: Recipe = {
  id: 'r-1',
  name: 'Roast Chicken',
  steps: [{ id: 's1', name: 'Roast', type: 'cook', durationMinutes: 90 }],
  createdAt: 1000,
  updatedAt: 1000,
};

describe('MealPlanEditor', () => {
  it('renders empty state when no dishes', () => {
    render(<MealPlanEditor mealPlan={emptyPlan()} savedRecipes={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no dishes yet/i)).toBeInTheDocument();
  });

  it('shows add buttons', () => {
    render(<MealPlanEditor mealPlan={emptyPlan()} savedRecipes={[]} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add ad-hoc dish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add from recipe/i })).toBeInTheDocument();
  });

  it('adds ad-hoc dish with empty steps on button click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MealPlanEditor mealPlan={emptyPlan()} savedRecipes={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /add ad-hoc dish/i }));
    expect(onChange).toHaveBeenCalledOnce();
    const updated = onChange.mock.calls[0][0] as MealPlan;
    expect(updated.dishes).toHaveLength(1);
    expect(updated.dishes[0]?.steps).toHaveLength(0);
  });

  it('removes a dish when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const planWithDish: MealPlan = {
      ...emptyPlan(),
      dishes: [{
        id: 'd-1',
        displayName: 'Dish 1',
        sourceRecipeId: null,
        steps: [],
      }],
    };
    render(<MealPlanEditor mealPlan={planWithDish} savedRecipes={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /remove/i }));
    const updated = onChange.mock.calls[0][0] as MealPlan;
    expect(updated.dishes).toHaveLength(0);
  });

  it('adds dish from recipe with its name and steps', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MealPlanEditor mealPlan={emptyPlan()} savedRecipes={[mockRecipe]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /add from recipe/i }));
    // Modal should appear with Load button
    const loadButtons = await screen.findAllByRole('button', { name: /load/i });
    await user.click(loadButtons[0]!);
    expect(onChange).toHaveBeenCalledOnce();
    const updated = onChange.mock.calls[0][0] as MealPlan;
    expect(updated.dishes).toHaveLength(1);
    expect(updated.dishes[0]?.displayName).toBe('Roast Chicken');
    expect(updated.dishes[0]?.steps).toHaveLength(1);
  });

  it('target time change propagates via onChange', () => {
    const onChange = vi.fn();
    render(<MealPlanEditor mealPlan={emptyPlan()} savedRecipes={[]} onChange={onChange} />);
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: '20:30' } });
    expect(onChange).toHaveBeenCalled();
  });
});
