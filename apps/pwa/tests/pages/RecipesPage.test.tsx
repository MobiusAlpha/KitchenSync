/**
 * Component tests for RecipesPage.
 * T082 — Tests via RecipeRepository and RecipeEditor interfaces.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { Recipe } from '@kitchensync/meal-model';

const mockRecipes: Recipe[] = [
  {
    id: 'r-1',
    name: 'Roast Chicken',
    steps: [{ id: 's1', name: 'Roast', type: 'cook', durationMinutes: 90 }],
    createdAt: 1000,
    updatedAt: 1000,
  },
];

vi.mock('../../src/storage/RecipeRepository.js', () => ({
  RecipeRepository: {
    getAll: vi.fn().mockResolvedValue(mockRecipes),
    create: vi.fn().mockImplementation(async (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => ({
      ...data,
      id: 'new-id',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('RecipesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function renderPage() {
    // Re-import page fresh after mock setup
    const { RecipesPage } = await import('../../src/pages/RecipesPage.js');
    render(
      <MemoryRouter>
        <RecipesPage />
      </MemoryRouter>
    );
  }

  it('renders RecipeLibrary with loaded recipes', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('Roast Chicken')).toBeInTheDocument();
    });
  });

  it('shows "New Recipe" button in library view', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /new recipe/i })).toBeInTheDocument());
  });

  it('shows RecipeEditor when "New Recipe" is clicked', async () => {
    const user = userEvent.setup();
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /new recipe/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /new recipe/i }));
    expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument();
  });

  it('calls RecipeRepository.delete when delete button is clicked', async () => {
    const user = userEvent.setup();
    await renderPage();
    await waitFor(() => expect(screen.getByText('Roast Chicken')).toBeInTheDocument());
    const { RecipeRepository } = await import('../../src/storage/RecipeRepository.js');
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(RecipeRepository.delete).toHaveBeenCalledWith('r-1');
  });

  it('shows RecipeEditor in edit mode when recipe is selected', async () => {
    const user = userEvent.setup();
    await renderPage();
    await waitFor(() => expect(screen.getByText('Roast Chicken')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /load/i }));
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});
