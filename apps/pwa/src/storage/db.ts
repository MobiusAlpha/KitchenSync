import Dexie, { type Table } from 'dexie';
import type { Recipe, MealPlan } from '@kitchensync/meal-model';
import type { LiveSession, AlarmConfiguration } from '@kitchensync/alarm-scheduler';

/**
 * KitchenSync IndexedDB database via Dexie.js.
 * All domain data is local-only (no backend, no cloud sync in v1).
 */
export class KitchenSyncDb extends Dexie {
  recipes!: Table<Recipe, string>;
  mealPlans!: Table<MealPlan, string>;
  liveSessions!: Table<LiveSession, string>;
  alarmConfig!: Table<AlarmConfiguration, string>;

  constructor() {
    super('KitchenSyncDb');
    this.version(1).stores({
      recipes: 'id, name, createdAt, updatedAt',
      mealPlans: 'id, name, createdAt, updatedAt',
      liveSessions: 'id',
      alarmConfig: 'id',
    });
  }
}

/** Singleton database instance. */
export const db = new KitchenSyncDb();
