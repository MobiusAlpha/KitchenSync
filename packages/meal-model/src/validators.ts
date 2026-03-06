import type { WallClockTime } from '@kitchensync/timing-engine';
import type { Step, Recipe, Dish, MealPlan } from './entities.js';
import { STEP_TYPES } from './types.js';

/** A single field-level validation failure. */
export interface ValidationError {
  /** Dot-path to the invalid field (e.g., "steps[0].durationMinutes"). */
  readonly field: string;
  /** Human-readable description of the failure. */
  readonly message: string;
}

/** Discriminated union returned by all validators. Never throws. */
export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ValidationError[] };

function err(field: string, message: string): ValidationError {
  return { field, message };
}

/** Validates a WallClockTime object. */
export function validateWallClockTime(
  input: unknown,
  fieldPrefix = '',
): ValidationResult<WallClockTime> {
  const errors: ValidationError[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: [err(fieldPrefix || 'value', 'Must be an object with hour and minute fields')] };
  }
  const obj = input as Record<string, unknown>;
  const hour = obj['hour'];
  const minute = obj['minute'];
  const hourField = fieldPrefix ? `${fieldPrefix}.hour` : 'hour';
  const minuteField = fieldPrefix ? `${fieldPrefix}.minute` : 'minute';
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) {
    errors.push(err(hourField, 'Hour must be an integer between 0 and 23'));
  }
  if (typeof minute !== 'number' || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    errors.push(err(minuteField, 'Minute must be an integer between 0 and 59'));
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { hour: hour as number, minute: minute as number } };
}

/** Validates a Step. Returns ValidationResult<Step>. */
export function validateStep(input: unknown): ValidationResult<Step> {
  const errors: ValidationError[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: [err('value', 'Step must be an object')] };
  }
  const obj = input as Record<string, unknown>;
  const { id, name, type, durationMinutes } = obj;

  if (typeof id !== 'string' || id.trim().length === 0) {
    errors.push(err('id', 'id is required'));
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push(err('name', 'Name must not be blank'));
  } else if (name.length > 80) {
    errors.push(err('name', 'Name must be 80 characters or fewer'));
  }
  if (!STEP_TYPES.includes(type as never)) {
    errors.push(err('type', `Type must be one of: ${STEP_TYPES.join(', ')}`));
  }
  if (
    typeof durationMinutes !== 'number' ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 1440
  ) {
    errors.push(err('durationMinutes', 'Duration must be a positive integer between 1 and 1440'));
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      id: id as string,
      name: name as string,
      type: type as Step['type'],
      durationMinutes: durationMinutes as number,
    },
  };
}

/** Validates a Recipe (including all contained Steps). */
export function validateRecipe(input: unknown): ValidationResult<Recipe> {
  const errors: ValidationError[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: [err('value', 'Recipe must be an object')] };
  }
  const obj = input as Record<string, unknown>;
  const { id, name, steps, createdAt, updatedAt, description } = obj;

  if (typeof id !== 'string' || id.trim().length === 0) {
    errors.push(err('id', 'id is required'));
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push(err('name', 'Name must not be blank'));
  } else if (name.length > 100) {
    errors.push(err('name', 'Name must be 100 characters or fewer'));
  }
  if (description !== undefined && typeof description !== 'string') {
    errors.push(err('description', 'Description must be a string'));
  } else if (typeof description === 'string' && description.length > 500) {
    errors.push(err('description', 'Description must be 500 characters or fewer'));
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push(err('steps', 'Recipe must have at least one step'));
  } else {
    steps.forEach((step, i) => {
      const stepResult = validateStep(step);
      if (!stepResult.ok) {
        stepResult.errors.forEach(e => {
          errors.push(err(`steps[${i}].${e.field}`, e.message));
        });
      }
    });
  }
  if (typeof createdAt !== 'number') {
    errors.push(err('createdAt', 'createdAt must be a number'));
  }
  if (typeof updatedAt !== 'number') {
    errors.push(err('updatedAt', 'updatedAt must be a number'));
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      id: id as string,
      name: name as string,
      description: description as string | undefined,
      steps: steps as Step[],
      createdAt: createdAt as number,
      updatedAt: updatedAt as number,
    },
  };
}

function validateDish(input: unknown, prefix: string): ValidationResult<Dish> {
  const errors: ValidationError[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: [err(prefix, 'Dish must be an object')] };
  }
  const obj = input as Record<string, unknown>;
  const { id, displayName, sourceRecipeId, steps } = obj;
  if (typeof id !== 'string' || id.trim().length === 0) {
    errors.push(err(`${prefix}.id`, 'id is required'));
  }
  if (typeof displayName !== 'string' || displayName.trim().length === 0) {
    errors.push(err(`${prefix}.displayName`, 'displayName must not be blank'));
  }
  if (sourceRecipeId !== null && typeof sourceRecipeId !== 'string') {
    errors.push(err(`${prefix}.sourceRecipeId`, 'sourceRecipeId must be a string or null'));
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push(err(`${prefix}.steps`, 'Dish must have at least one step'));
  } else {
    steps.forEach((step, i) => {
      const stepResult = validateStep(step);
      if (!stepResult.ok) {
        stepResult.errors.forEach(e => {
          errors.push(err(`${prefix}.steps[${i}].${e.field}`, e.message));
        });
      }
    });
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      id: id as string,
      displayName: displayName as string,
      sourceRecipeId: sourceRecipeId as string | null,
      steps: steps as Step[],
    },
  };
}

/** Validates a MealPlan (including all contained Dishes and Steps). */
export function validateMealPlan(input: unknown): ValidationResult<MealPlan> {
  const errors: ValidationError[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: [err('value', 'MealPlan must be an object')] };
  }
  const obj = input as Record<string, unknown>;
  const { id, name, targetTime, dishes, createdAt, updatedAt } = obj;

  if (typeof id !== 'string' || id.trim().length === 0) {
    errors.push(err('id', 'id is required'));
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push(err('name', 'Name must not be blank'));
  }
  const targetTimeResult = validateWallClockTime(targetTime, 'targetTime');
  if (!targetTimeResult.ok) {
    targetTimeResult.errors.forEach(e => errors.push(e));
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    errors.push(err('dishes', 'MealPlan must have at least one dish'));
  } else if (dishes.length > 20) {
    errors.push(err('dishes', 'MealPlan may have at most 20 dishes'));
  } else {
    dishes.forEach((dish, i) => {
      const dishResult = validateDish(dish, `dishes[${i}]`);
      if (!dishResult.ok) {
        dishResult.errors.forEach(e => errors.push(e));
      }
    });
  }
  if (typeof createdAt !== 'number') {
    errors.push(err('createdAt', 'createdAt must be a number'));
  }
  if (typeof updatedAt !== 'number') {
    errors.push(err('updatedAt', 'updatedAt must be a number'));
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      id: id as string,
      name: name as string,
      targetTime: (targetTimeResult.ok ? targetTimeResult.value : { hour: 0, minute: 0 }),
      dishes: dishes as Dish[],
      createdAt: createdAt as number,
      updatedAt: updatedAt as number,
    },
  };
}
