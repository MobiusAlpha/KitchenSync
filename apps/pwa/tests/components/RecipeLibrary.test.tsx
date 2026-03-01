/**
 * Component tests for RecipeLibrary.
 * T033 — Tests via the RecipeLibraryProps interface.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeLibrary } from '../../src/components/RecipeLibrary.js';
import type { Recipe } from '@kitchensync/meal-model';

const mockRecipes: readonly Recipe[] = [
  {
    id: 'r-1',
    name: 'Roast Chicken',
    steps: [{ id: 's1', name: 'Roast', type: 'cook', durationMinutes: 90 }],
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'r-2',
    name: 'Caesar Salad',
    steps: [{ id: 's2', name: 'Toss', type: 'prep', durationMinutes: 10 }],
    createdAt: 2000,
    updatedAt: 2000,
  },
];

describe('RecipeLibrary', () => {
  it('renders empty-state message when no recipes', () => {
    render(<RecipeLibrary recipes={[]} onSelect={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no saved recipes/i)).toBeInTheDocument();
  });

  it('renders recipe list with names', () => {
    render(<RecipeLibrary recipes={mockRecipes} onSelect={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Roast Chicken')).toBeInTheDocument();
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
  });

  it('calls onDelete with recipe id when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecipeLibrary recipes={mockRecipes} onSelect={vi.fn()} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    expect(onDelete).toHaveBeenCalledWith('r-1');
  });

  it('calls onSelect with recipe when load button is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RecipeLibrary recipes={mockRecipes} onSelect={onSelect} onDelete={vi.fn()} />);
    const loadButtons = screen.getAllByRole('button', { name: /load/i });
    await user.click(loadButtons[0]!);
    expect(onSelect).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('shows step count for each recipe', () => {
    render(<RecipeLibrary recipes={mockRecipes} onSelect={vi.fn()} onDelete={vi.fn()} />);
    // Both recipes have 1 step — two elements expected
    expect(screen.getAllByText(/1 step/).length).toBe(2);
  });
});
