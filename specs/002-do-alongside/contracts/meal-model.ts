/**
 * @contract meal-model (addendum: 002-do-alongside)
 * Package: @kitchensync/meal-model
 *
 * Replaces the flat steps: Step[] on Dish and Recipe with a Stage/Track
 * structure that correctly models arbitrary sequences of parallel step groups.
 *
 * The Step entity is unchanged. Two new entities are introduced: Track and Stage.
 * Dish and Recipe replace their `steps` field with `stages`.
 *
 * Backward-compatible at read time via a deserialization adapter.
 */

import type { StepType, ValidationResult } from './meal-model';

// ─── Step (unchanged) ─────────────────────────────────────────────────────────

/** Unchanged from 001-reverse-timing. */
export interface Step {
  readonly id: string;
  readonly name: string;
  readonly type: StepType;
  readonly durationMinutes: number;
}

// ─── New Entity: Track ────────────────────────────────────────────────────────

/**
 * One sequential line of execution within a Stage.
 *
 * All Tracks in the same Stage share the same end time (join point).
 * A Stage with a single Track is equivalent to a sequential step group.
 *
 * Steps within a Track execute in order (index 0 is first).
 */
export interface Track {
  /** UUID v4. Unique within the containing Dish/Recipe. Immutable after creation. */
  readonly id: string;
  /** Ordered steps. At least one required. Max 50. */
  readonly steps: readonly Step[];
}

// ─── New Entity: Stage ────────────────────────────────────────────────────────

/**
 * One time slot in the Dish's cooking schedule.
 *
 * Contains one or more Tracks that all complete at the Stage's shared end time
 * (the join point). The scheduler enforces the shared-end-time invariant.
 *
 * Stages within a Dish execute sequentially:
 *   Stage[i].endTime === Stage[i+1].startTime
 *   Stage[last].endTime === MealPlan.targetTime (or Dish targetTime)
 */
export interface Stage {
  /** UUID v4. Unique within the containing Dish/Recipe. Immutable after creation. */
  readonly id: string;
  /** Parallel tracks. At least one required. Max 10. */
  readonly tracks: readonly Track[];
}

// ─── Modified Entity: Dish ────────────────────────────────────────────────────

/**
 * Dish replaces steps: Step[] with stages: Stage[].
 * All other fields are unchanged from 001-reverse-timing.
 */
export interface Dish {
  readonly id: string;
  readonly displayName: string;
  readonly sourceRecipeId: string | null;
  /** Ordered Stages. At least one required. Max 20. */
  readonly stages: readonly Stage[];
}

// ─── Modified Entity: Recipe ──────────────────────────────────────────────────

/**
 * Recipe replaces steps: Step[] with stages: Stage[].
 * All other fields are unchanged from 001-reverse-timing.
 */
export interface Recipe {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  /** Ordered Stages. At least one required. Max 20. */
  readonly stages: readonly Stage[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Validates a Track object.
 *
 * Error field paths: `steps[${index}].${fieldName}` for step-level failures.
 *
 * @param input - Unknown value to validate.
 * @returns ValidationResult<Track> — never throws.
 */
export interface ValidateTrack {
  (input: unknown): ValidationResult<Track>;
}

/**
 * Validates a Stage object including all contained Tracks and Steps.
 *
 * Error field paths: `tracks[${i}].steps[${j}].${fieldName}`.
 *
 * @param input - Unknown value to validate.
 * @returns ValidationResult<Stage> — never throws.
 */
export interface ValidateStage {
  (input: unknown): ValidationResult<Stage>;
}

/**
 * Validates a Dish object with the new stages: Stage[] field.
 * Replaces the 001 validateDish signature.
 *
 * @param input - Unknown value to validate.
 * @returns ValidationResult<Dish> — never throws.
 */
export interface ValidateDish {
  (input: unknown): ValidationResult<Dish>;
}

/**
 * Validates a Recipe object with the new stages: Stage[] field.
 * Replaces the 001 validateRecipe signature.
 *
 * @param input - Unknown value to validate.
 * @returns ValidationResult<Recipe> — never throws.
 */
export interface ValidateRecipe {
  (input: unknown): ValidationResult<Recipe>;
}

// ─── Deserialization & Migration ──────────────────────────────────────────────

/**
 * Detects the storage format of a raw Dish or Recipe record and upgrades it
 * if necessary.
 *
 * Old format detection: record has a top-level `steps` array and no `stages`.
 *
 * Upgrade rule (old → new):
 *   { steps: [S1, S2, S3] }
 *   →
 *   { stages: [
 *       { id: uuid(), tracks: [{ id: uuid(), steps: [S1] }] },
 *       { id: uuid(), tracks: [{ id: uuid(), steps: [S2] }] },
 *       { id: uuid(), tracks: [{ id: uuid(), steps: [S3] }] },
 *     ] }
 *
 * Each old Step becomes its own single-track Stage, preserving sequential order.
 *
 * If the record already has `stages`, it is returned unchanged.
 * Returns null if the record is fatally invalid (not an object, missing id, etc.).
 *
 * After calling this function, callers SHOULD write the upgraded record back to
 * IndexedDB in the background so that future reads see the new format.
 *
 * @param raw - Raw object from IndexedDB.
 * @returns Upgraded raw object with stages: Stage[] (not yet validated), or null.
 */
export interface UpgradeRecord {
  (raw: unknown): Record<string, unknown> | null;
}

/**
 * Safely deserializes a Dish from IndexedDB raw data, including format upgrade.
 *
 * Calls UpgradeRecord internally, then validates the result.
 * Invalid stages/tracks/steps are dropped with console.warn (defensive pattern).
 * Returns null if the record is fatally invalid.
 *
 * @param raw - Raw object from IndexedDB.
 * @returns Valid Dish or null.
 */
export interface DeserializeDish {
  (raw: unknown): Dish | null;
}

/**
 * Safely deserializes a Recipe from IndexedDB raw data, including format upgrade.
 * Mirrors DeserializeDish.
 *
 * @param raw - Raw object from IndexedDB.
 * @returns Valid Recipe or null.
 */
export interface DeserializeRecipe {
  (raw: unknown): Recipe | null;
}
