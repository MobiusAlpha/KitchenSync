/**
 * @contract storage
 * Package: apps/pwa (storage layer)
 *
 * Repository interfaces for IndexedDB persistence (Dexie.js).
 * All repositories are defined as interfaces to enable contract-based testing
 * (Principle II) and future substitution without touching callers.
 *
 * All read operations pass raw IndexedDB data through the relevant schema guard
 * (deserializeLiveSession, deserializeAlarmConfig) before returning, satisfying
 * Principle III at every trust boundary.
 *
 * Recipe.name need NOT be unique — entity identity is guaranteed by id (UUID v4).
 * Dish.displayName MUST be unique within a MealPlan; the repository enforces this
 * automatically by appending " #2", " #3" … on create/update.
 */

import type { Recipe, MealPlan } from './meal-model';
import type { LiveSession, AlarmConfiguration } from './alarm-scheduler';

// ─── RecipeRepository ─────────────────────────────────────────────────────────

/**
 * CRUD interface for persisting Recipe entities to IndexedDB.
 * All write operations manage timestamps; callers do NOT set createdAt/updatedAt.
 */
export interface RecipeRepository {
  /**
   * Persist a new Recipe. Assigns a UUID v4 id, sets createdAt and updatedAt
   * to the current epoch ms. Returns the persisted Recipe with all fields populated.
   */
  create(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe>;

  /**
   * Update an existing Recipe. Merges provided fields; refreshes updatedAt;
   * preserves createdAt and id. Returns the updated Recipe, or null if not found.
   */
  update(id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Promise<Recipe | null>;

  /** Remove a Recipe by id. No-op (resolves) if id not found. */
  delete(id: string): Promise<void>;

  /** Return all persisted Recipes ordered by updatedAt descending. */
  getAll(): Promise<readonly Recipe[]>;

  /** Return a single Recipe by id, or null if not found. */
  getById(id: string): Promise<Recipe | null>;
}

// ─── MealPlanRepository ───────────────────────────────────────────────────────

/**
 * CRUD interface for persisting MealPlan entities to IndexedDB.
 * Enforces Dish.displayName uniqueness within a plan (auto-suffix disambiguation).
 */
export interface MealPlanRepository {
  /**
   * Persist a new MealPlan. Assigns a UUID v4 id, sets createdAt and updatedAt.
   * Auto-disambiguates duplicate Dish displayNames by appending " #2", " #3" …
   * Returns the persisted MealPlan with all fields populated.
   */
  create(data: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MealPlan>;

  /**
   * Update an existing MealPlan. Merges provided fields; refreshes updatedAt.
   * Re-applies displayName disambiguation if dishes changed.
   * Returns the updated MealPlan, or null if not found.
   */
  update(id: string, data: Partial<Omit<MealPlan, 'id' | 'createdAt'>>): Promise<MealPlan | null>;

  /** Remove a MealPlan by id. No-op (resolves) if id not found. */
  delete(id: string): Promise<void>;

  /** Return all persisted MealPlans ordered by updatedAt descending. */
  getAll(): Promise<readonly MealPlan[]>;

  /** Return a single MealPlan by id, or null if not found. */
  getById(id: string): Promise<MealPlan | null>;
}

// ─── LiveSessionRepository ────────────────────────────────────────────────────

/**
 * Single-slot persistence for the active LiveSession.
 * Only one session is active at a time (single-user, single-device).
 * All reads pass raw data through deserializeLiveSession (Principle III).
 */
export interface LiveSessionRepository {
  /**
   * Persist (overwrite) the active LiveSession under a fixed storage key.
   * Replaces any previously stored session unconditionally.
   */
  save(session: LiveSession): Promise<void>;

  /**
   * Load the active LiveSession from IndexedDB, running it through
   * deserializeLiveSession. Returns null if no session exists or if schema
   * validation fails (fail-safe — corrupted data is treated as absent).
   */
  load(): Promise<LiveSession | null>;

  /** Remove the stored session. Called when the cook ends the timer session. */
  clear(): Promise<void>;
}

// ─── SettingsRepository ───────────────────────────────────────────────────────

/**
 * Singleton persistence for the global AlarmConfiguration.
 * Reads pass raw IndexedDB data through deserializeAlarmConfig (Principle III).
 * Falls back to the safe default { id: 'global', defaultEnabled: true } on any
 * read error or missing record (alarms default to on — fail-safe for cooking use).
 */
export interface SettingsRepository {
  /**
   * Read the global AlarmConfiguration.
   * Returns { id: 'global', defaultEnabled: true } when no record exists or the
   * stored record fails schema validation.
   */
  read(): Promise<AlarmConfiguration>;

  /** Overwrite the global AlarmConfiguration. */
  write(config: AlarmConfiguration): Promise<void>;
}
