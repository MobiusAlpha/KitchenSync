import type { WallClockTime } from '@kitchensync/timing-engine';
import type { StepType } from './types.js';

/** A single timed action within a recipe or ad-hoc timing session. */
export interface Step {
  /** UUID v4. Immutable after creation. */
  readonly id: string;
  /** 1–80 characters. Must not be blank. */
  readonly name: string;
  readonly type: StepType;
  /** Positive whole number of minutes (1–1440). */
  readonly durationMinutes: number;
}

/** A named, reusable, ordered collection of Steps. */
export interface Recipe {
  /** UUID v4. Immutable after creation. */
  readonly id: string;
  /** 1–100 characters. Must not be blank. */
  readonly name: string;
  /** Optional free-text description. Max 500 characters. */
  readonly description?: string;
  /** Ordered array of Steps; must contain at least one. */
  readonly steps: readonly Step[];
  /** Unix epoch ms. Set on creation; immutable. */
  readonly createdAt: number;
  /** Unix epoch ms. Updated on every save. */
  readonly updatedAt: number;
}

/**
 * An entry in a MealPlan — a snapshot copy of steps for one dish.
 * Changes to the source Recipe do NOT propagate here.
 */
export interface Dish {
  /** UUID v4. Immutable after creation. */
  readonly id: string;
  /**
   * Display name unique within the parent MealPlan.
   * Duplicate names are disambiguated automatically (e.g., "Chicken #2").
   */
  readonly displayName: string;
  /**
   * UUID of the source Recipe, if this dish was loaded from one.
   * null for ad-hoc dishes.
   */
  readonly sourceRecipeId: string | null;
  /** Snapshot copy of steps. Changes to the source Recipe do NOT propagate here. */
  readonly steps: readonly Step[];
}

/** A collection of Dishes sharing a single target "ready by" time. */
export interface MealPlan {
  /** UUID v4. Immutable after creation. */
  readonly id: string;
  /** 1–100 characters. Must not be blank. */
  readonly name: string;
  /** The shared target "ready by" time for all dishes in this meal plan. */
  readonly targetTime: WallClockTime;
  /** Ordered array of Dishes; must contain at least one; max 20. */
  readonly dishes: readonly Dish[];
  /** Unix epoch ms. Set on creation; immutable. */
  readonly createdAt: number;
  /** Unix epoch ms. Updated on every save. */
  readonly updatedAt: number;
}
