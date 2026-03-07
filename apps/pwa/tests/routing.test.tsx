/**
 * T012a — Contract tests for hash-based routing skeleton.
 * All five application routes render without crashing and show a placeholder heading.
 * Tests target the routing structure, not specific page content.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../src/App.js';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Hash-based routing skeleton', () => {
  it('renders PlannerPage at / without crashing', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: /planner/i })).toBeInTheDocument();
  });

  it('renders RecipesPage at /recipes without crashing', () => {
    renderAt('/recipes');
    expect(screen.getByRole('heading', { name: /recipes/i })).toBeInTheDocument();
  });

  it('renders MealPlanPage at /meal without crashing', () => {
    renderAt('/meal');
    expect(screen.getByRole('heading', { name: /meal plan/i })).toBeInTheDocument();
  });

  it('renders TimerPage at /timer without crashing', () => {
    renderAt('/timer');
    // Without a schedule in router state, TimerPage renders a "no active session" prompt
    expect(screen.getByText(/no active timer session/i)).toBeInTheDocument();
  });

  it('renders AlarmSettingsPage at /settings without crashing', () => {
    renderAt('/settings');
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });
});
