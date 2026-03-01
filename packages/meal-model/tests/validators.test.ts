/**
 * Contract tests for meal-model validators.
 * Tests target the validator functions via their return types (ValidationResult<T>).
 * TDD: written BEFORE implementation (T016) and MUST fail first.
 */
import { describe, it, expect } from 'vitest';
import {
  validateStep,
  validateRecipe,
  validateMealPlan,
  validateWallClockTime,
} from '../src/index.js';
import type { WallClockTime } from '../src/index.js';

// ─── validateStep ─────────────────────────────────────────────────────────────

describe('validateStep', () => {
  it('accepts a valid step', () => {
    const result = validateStep({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Chop onions',
      type: 'prep',
      durationMinutes: 10,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a blank name', () => {
    const result = validateStep({
      id: '11111111-1111-1111-1111-111111111111',
      name: '   ',
      type: 'prep',
      durationMinutes: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    }
  });

  it('rejects zero duration', () => {
    const result = validateStep({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Step',
      type: 'cook',
      durationMinutes: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'durationMinutes')).toBe(true);
    }
  });

  it('rejects negative duration', () => {
    const result = validateStep({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Step',
      type: 'cook',
      durationMinutes: -5,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects duration exceeding 1440', () => {
    const result = validateStep({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Step',
      type: 'cook',
      durationMinutes: 1441,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid step type', () => {
    const result = validateStep({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Step',
      type: 'bake',
      durationMinutes: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    }
  });

  it('accepts all valid step types', () => {
    for (const type of ['prep', 'cook', 'rest', 'cooldown'] as const) {
      const result = validateStep({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Step',
        type,
        durationMinutes: 5,
      });
      expect(result.ok).toBe(true);
    }
  });
});

// ─── validateRecipe ───────────────────────────────────────────────────────────

describe('validateRecipe', () => {
  const validStep = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Step 1',
    type: 'prep' as const,
    durationMinutes: 10,
  };

  it('accepts a valid recipe', () => {
    const result = validateRecipe({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Roast Chicken',
      steps: [validStep],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a blank recipe name', () => {
    const result = validateRecipe({
      id: '11111111-1111-1111-1111-111111111111',
      name: '',
      steps: [validStep],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    }
  });

  it('rejects a recipe with no steps', () => {
    const result = validateRecipe({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Empty Recipe',
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'steps')).toBe(true);
    }
  });
});

// ─── validateMealPlan ─────────────────────────────────────────────────────────

describe('validateMealPlan', () => {
  const validDish = {
    id: '33333333-3333-3333-3333-333333333333',
    displayName: 'Chicken',
    sourceRecipeId: null,
    steps: [{
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Roast',
      type: 'cook' as const,
      durationMinutes: 90,
    }],
  };

  it('accepts a valid meal plan', () => {
    const result = validateMealPlan({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Sunday Roast',
      targetTime: { hour: 19, minute: 0 },
      dishes: [validDish],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a meal plan with no dishes', () => {
    const result = validateMealPlan({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Empty',
      targetTime: { hour: 19, minute: 0 },
      dishes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'dishes')).toBe(true);
    }
  });

  it('rejects a meal plan with more than 20 dishes', () => {
    const dishes = Array.from({ length: 21 }, (_, i) => ({
      ...validDish,
      id: `dish-${String(i)}`,
      displayName: `Dish ${String(i)}`,
    }));
    const result = validateMealPlan({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Too many',
      targetTime: { hour: 19, minute: 0 },
      dishes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'dishes')).toBe(true);
    }
  });

  it('rejects an invalid WallClockTime in targetTime', () => {
    const result = validateMealPlan({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Bad time',
      targetTime: { hour: 25, minute: 0 },
      dishes: [validDish],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field.includes('targetTime'))).toBe(true);
    }
  });
});

// ─── validateWallClockTime ────────────────────────────────────────────────────

describe('validateWallClockTime', () => {
  it('accepts a valid time', () => {
    const result = validateWallClockTime({ hour: 12, minute: 30 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual<WallClockTime>({ hour: 12, minute: 30 });
    }
  });

  it('accepts midnight (00:00)', () => {
    const result = validateWallClockTime({ hour: 0, minute: 0 });
    expect(result.ok).toBe(true);
  });

  it('accepts 23:59', () => {
    const result = validateWallClockTime({ hour: 23, minute: 59 });
    expect(result.ok).toBe(true);
  });

  it('rejects hour > 23', () => {
    const result = validateWallClockTime({ hour: 24, minute: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'hour')).toBe(true);
    }
  });

  it('rejects minute > 59', () => {
    const result = validateWallClockTime({ hour: 12, minute: 60 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'minute')).toBe(true);
    }
  });

  it('rejects negative hour', () => {
    const result = validateWallClockTime({ hour: -1, minute: 0 });
    expect(result.ok).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = validateWallClockTime('12:30');
    expect(result.ok).toBe(false);
  });
});
