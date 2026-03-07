/**
 * T034a / T044a — Contract tests for deserializeRecipe() and deserializeMealPlan() schema guards.
 * TDD: these tests MUST fail before the guards are implemented (T034b / T044b).
 * Guards protect every IndexedDB read (Principle III).
 */
import { describe, it, expect } from 'vitest';
import { deserializeRecipe, deserializeMealPlan } from '../src/index.js';

// ─── deserializeRecipe ────────────────────────────────────────────────────────

const validRecipe = {
  id: 'r-1',
  name: 'Pasta',
  steps: [{ id: 's-1', durationMinutes: 20 }],  // block step: no name/type
  createdAt: 1000,
  updatedAt: 2000,
};

const validRecipeWithSteps = {
  id: 'r-2',
  name: 'Chicken',
  steps: [
    { id: 's-1', name: 'Prep', type: 'prep', durationMinutes: 15 },
    { id: 's-2', name: 'Cook', type: 'cook', durationMinutes: 45 },
  ],
  createdAt: 1000,
  updatedAt: 2000,
};

describe('deserializeRecipe', () => {
  it('returns ok:true for a valid recipe with named steps', () => {
    const result = deserializeRecipe(validRecipeWithSteps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Chicken');
      expect(result.value.steps).toHaveLength(2);
    }
  });

  it('returns ok:true for a valid recipe with a block step (no name/type)', () => {
    const result = deserializeRecipe(validRecipe);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Pasta');
      expect(result.value.steps[0]?.durationMinutes).toBe(20);
    }
  });

  it('returns ok:false for null input', () => {
    const result = deserializeRecipe(null);
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when id field is missing', () => {
    const result = deserializeRecipe({ ...validRecipe, id: undefined });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when name is blank', () => {
    const result = deserializeRecipe({ ...validRecipe, name: '' });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when steps array is empty', () => {
    const result = deserializeRecipe({ ...validRecipe, steps: [] });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when a step has invalid durationMinutes', () => {
    const result = deserializeRecipe({
      ...validRecipe,
      steps: [{ id: 's-1', durationMinutes: 0 }],
    });
    expect(result.ok).toBe(false);
  });

  it('strips unknown top-level fields from the returned Recipe', () => {
    const result = deserializeRecipe({ ...validRecipe, extraField: 'ignore-me' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as Record<string, unknown>)['extraField']).toBeUndefined();
    }
  });
});

// ─── deserializeMealPlan ──────────────────────────────────────────────────────

const validMealPlan = {
  id: 'mp-1',
  name: 'Sunday Roast',
  targetTime: { hour: 18, minute: 0 },
  dishes: [
    {
      id: 'd-1',
      displayName: 'Chicken',
      sourceRecipeId: null,
      steps: [{ id: 's-1', durationMinutes: 90 }],
    },
  ],
  createdAt: 1000,
  updatedAt: 2000,
};

describe('deserializeMealPlan', () => {
  it('returns ok:true for a valid meal plan', () => {
    const result = deserializeMealPlan(validMealPlan);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Sunday Roast');
      expect(result.value.dishes).toHaveLength(1);
    }
  });

  it('returns ok:false for null input', () => {
    const result = deserializeMealPlan(null);
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when id field is missing', () => {
    const result = deserializeMealPlan({ ...validMealPlan, id: undefined });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when targetTime is invalid', () => {
    const result = deserializeMealPlan({ ...validMealPlan, targetTime: { hour: 25, minute: 0 } });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when dishes array is empty', () => {
    const result = deserializeMealPlan({ ...validMealPlan, dishes: [] });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when a nested dish step has invalid durationMinutes', () => {
    const result = deserializeMealPlan({
      ...validMealPlan,
      dishes: [
        {
          ...validMealPlan.dishes[0],
          steps: [{ id: 's-bad', durationMinutes: -1 }],
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it('strips unknown top-level fields from the returned MealPlan', () => {
    const result = deserializeMealPlan({ ...validMealPlan, extraField: 'ignore-me' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as Record<string, unknown>)['extraField']).toBeUndefined();
    }
  });
});
