/**
 * @contract meal-model (addendum: 002-do-alongside)
 * Package: @kitchensync/meal-model
 *
 * Additive extension to the meal-model contract from 001-reverse-timing.
 * Introduces CompanionStep and extends Step with an optional companions field.
 *
 * All existing types and validators are unchanged.
 * New exports are additive and backward-compatible.
 */

import type { StepType, ValidationResult } from './meal-model';

// ─── New Entity ───────────────────────────────────────────────────────────────

/**
 * A timed action that runs in parallel with its anchor Step, sharing the same
 * end time. CompanionSteps are always embedded inside their anchor Step;
 * they are never stored or referenced independently.
 *
 * Structurally identical to Step minus the `companions` field, which is
 * deliberately absent to enforce the one-level-deep invariant.
 */
export interface CompanionStep {
  /** UUID v4. Must be unique within the containing Dish/Recipe. */
  readonly id: string;
  /** 1–80 characters. Must not be blank. */
  readonly name: string;
  readonly type: StepType;
  /** Positive integer, 1–1440 minutes. */
  readonly durationMinutes: number;
}

// ─── Extended Entity ──────────────────────────────────────────────────────────

/**
 * Extension of the Step entity with an optional companions field.
 * When companions is absent or empty, behaviour is identical to 001-reverse-timing.
 */
export interface StepWithCompanions {
  readonly id: string;
  readonly name: string;
  readonly type: StepType;
  readonly durationMinutes: number;
  /**
   * Zero or more companion steps that run in parallel with this step.
   * All companions share this step's end time (the join point).
   *
   * When present and non-empty, this step is an anchor step.
   * Its id serves as the parallelGroupId for the entire group.
   *
   * Max 10 companions per anchor step.
   */
  readonly companions?: readonly CompanionStep[];
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Validates a CompanionStep object.
 *
 * @param input - Unknown value to validate.
 * @returns ValidationResult<CompanionStep> — never throws.
 */
export interface ValidateCompanionStep {
  (input: unknown): ValidationResult<CompanionStep>;
}

/**
 * Validates a Step object including its optional companions array.
 * Extends the existing validateStep signature; companions validation is additive.
 *
 * Error field paths for companion failures use the form:
 *   `companions[${index}].${fieldName}`
 *
 * @param input - Unknown value to validate.
 * @returns ValidationResult<StepWithCompanions> — never throws.
 */
export interface ValidateStep {
  (input: unknown): ValidationResult<StepWithCompanions>;
}

// ─── Deserialization ──────────────────────────────────────────────────────────

/**
 * Safely deserializes a Step (including companions) from IndexedDB raw data.
 *
 * Defensive behaviour:
 * - If companions is absent or null, returns companions: [].
 * - Each companion element is validated; invalid elements are dropped with a
 *   console.warn (same pattern as existing step deserialization).
 *
 * @param raw - Raw object from IndexedDB.
 * @returns A valid StepWithCompanions or null if the raw object is fatally invalid.
 */
export interface DeserializeStep {
  (raw: unknown): StepWithCompanions | null;
}
