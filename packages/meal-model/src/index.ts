/**
 * @kitchensync/meal-model
 *
 * Core domain types, entities, and validators for KitchenSync.
 * WallClockTime is re-exported here for consumer convenience.
 */

// Re-export WallClockTime from timing-engine (canonical home)
export type { WallClockTime } from '@kitchensync/timing-engine';

export type { StepType } from './types.js';
export { STEP_TYPES } from './types.js';
export type { Step, Recipe, Dish, MealPlan } from './entities.js';
export type { ValidationError, ValidationResult } from './validators.js';
export {
  validateStep,
  validateRecipe,
  validateMealPlan,
  validateWallClockTime,
} from './validators.js';
