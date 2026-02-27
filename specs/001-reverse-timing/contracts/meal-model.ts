/**
 * @contract meal-model
 * Package: @kitchensync/meal-model
 *
 * Defines the core domain types and validation contracts for KitchenSync's
 * meal-model library. All entities in this contract are plain data objects
 * (no class instances). Validators return discriminated unions — never throw.
 *
 * NOTE: WallClockTime is defined in @kitchensync/timing-engine (canonical home)
 * and re-exported here for consumer convenience. meal-model depends on timing-engine.
 */

// Re-export WallClockTime from timing-engine — this package does not own the type.
export type { WallClockTime } from './timing-engine';

// ─── Primitive types ────────────────────────────────────────────────────────

/** All valid step categories. */
export type StepType = 'prep' | 'cook' | 'rest' | 'cooldown';

// ─── Core entities ───────────────────────────────────────────────────────────

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

/** An entry in a MealPlan — a snapshot copy of steps for one dish. */
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

// ─── Validation ──────────────────────────────────────────────────────────────

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

/** Validates a Step. */
export interface StepValidator {
  validate(input: unknown): ValidationResult<Step>;
}

/** Validates a Recipe (including all contained Steps). */
export interface RecipeValidator {
  validate(input: unknown): ValidationResult<Recipe>;
}

/** Validates a MealPlan (including all contained Dishes and Steps). */
export interface MealPlanValidator {
  validate(input: unknown): ValidationResult<MealPlan>;
}

/** Validates a WallClockTime. */
export interface WallClockTimeValidator {
  validate(input: unknown): ValidationResult<WallClockTime>;
}
