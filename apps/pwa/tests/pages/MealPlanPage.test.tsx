/**
 * Component tests for MealPlanPage.
 * T083 — Tests via MealPlanRepository, MealPlanEditor, and ScheduleView interfaces.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { MealPlan } from '@kitchensync/meal-model';

const emptyPlanList: MealPlan[] = [];

vi.mock('../../src/storage/MealPlanRepository.js', () => ({
  MealPlanRepository: {
    getAll: vi.fn().mockResolvedValue(emptyPlanList),
    getById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (data: Pick<MealPlan, 'name' | 'dishes' | 'targetTime'>) => ({
      ...data,
      id: 'new-plan-id',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/storage/RecipeRepository.js', () => ({
  RecipeRepository: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

describe('MealPlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function renderPage() {
    const { MealPlanPage } = await import('../../src/pages/MealPlanPage.js');
    render(
      <MemoryRouter>
        <MealPlanPage />
      </MemoryRouter>
    );
  }

  it('renders MealPlanEditor (empty dish state)', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no dishes yet/i)).toBeInTheDocument();
    });
  });

  it('renders ScheduleView empty state when no dishes', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText(/add steps and set a target time/i)).toBeInTheDocument();
    });
  });

  it('Start Timer button is disabled when no dishes', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start timer/i })).toBeDisabled();
    });
  });

  it('Save Plan button calls MealPlanRepository.create', async () => {
    const user = userEvent.setup();
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /save plan/i })).toBeInTheDocument());
    const { MealPlanRepository } = await import('../../src/storage/MealPlanRepository.js');
    await user.click(screen.getByRole('button', { name: /save plan/i }));
    await waitFor(() => {
      expect(MealPlanRepository.create).toHaveBeenCalled();
    });
  });

  it('shows Add Ad-hoc Dish button and adds a dish on click', async () => {
    const user = userEvent.setup();
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /add ad-hoc dish/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /add ad-hoc dish/i }));
    // After adding a dish, "Dish 1" should appear (via ad-hoc naming)
    await waitFor(() => {
      expect(screen.getByText(/dish 1/i)).toBeInTheDocument();
    });
  });
});
