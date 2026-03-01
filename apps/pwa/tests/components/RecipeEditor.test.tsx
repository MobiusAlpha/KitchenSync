/**
 * Component tests for RecipeEditor.
 * T032 — Tests via the RecipeEditorProps interface.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeEditor } from '../../src/components/RecipeEditor.js';
import type { Recipe } from '@kitchensync/meal-model';

const mockRecipe: Recipe = {
  id: 'r-1',
  name: 'Roast Chicken',
  description: 'A classic roast',
  steps: [
    { id: 's-1', name: 'Roast', type: 'cook', durationMinutes: 90 },
  ],
  createdAt: 1000000,
  updatedAt: 1000000,
};

describe('RecipeEditor', () => {
  it('renders blank form for new recipe', () => {
    render(<RecipeEditor recipe={null} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect((screen.getByLabelText(/recipe name/i) as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument();
  });

  it('pre-fills form for existing recipe', () => {
    render(<RecipeEditor recipe={mockRecipe} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect((screen.getByLabelText(/recipe name/i) as HTMLInputElement).value).toBe('Roast Chicken');
    expect(screen.getByText('Roast')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('rejects blank name — onSave not called', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RecipeEditor recipe={null} onSave={onSave} onCancel={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /create recipe/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('requires at least one step — onSave not called when steps are empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RecipeEditor recipe={null} onSave={onSave} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/recipe name/i), 'My Recipe');
    await user.click(screen.getByRole('button', { name: /create recipe/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with validated Recipe on successful save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RecipeEditor recipe={mockRecipe} onSave={onSave} onCancel={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0] as Recipe;
    expect(saved.name).toBe('Roast Chicken');
    expect(saved.steps).toHaveLength(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<RecipeEditor recipe={null} onSave={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
