import type { MealPlan, Dish } from '@kitchensync/meal-model';
import { deserializeMealPlan } from '@kitchensync/meal-model';
import { db } from './db.js';
import { generateId } from '../utils/id.js';

/** Auto-disambiguates duplicate Dish displayNames by appending " #2", " #3" … */
function disambiguateDisplayNames(dishes: readonly Dish[]): Dish[] {
  const seen = new Map<string, number>();
  return dishes.map(dish => {
    const count = (seen.get(dish.displayName) ?? 0) + 1;
    seen.set(dish.displayName, count);
    if (count === 1) return dish;
    return { ...dish, displayName: `${dish.displayName} #${count}` };
  });
}

/**
 * CRUD repository for MealPlan entities in IndexedDB.
 * Enforces Dish.displayName uniqueness within a plan (auto-suffix disambiguation).
 */
export const MealPlanRepository = {
  async create(data: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MealPlan> {
    const now = Date.now();
    const mealPlan: MealPlan = {
      ...data,
      dishes: disambiguateDisplayNames(data.dishes),
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.mealPlans.add(mealPlan);
    return mealPlan;
  },

  async update(
    id: string,
    data: Partial<Omit<MealPlan, 'id' | 'createdAt'>>,
  ): Promise<MealPlan | null> {
    const existing = await db.mealPlans.get(id);
    if (!existing) return null;
    const updated: MealPlan = {
      ...existing,
      ...data,
      id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
      dishes: disambiguateDisplayNames(data.dishes ?? existing.dishes),
    };
    await db.mealPlans.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.mealPlans.delete(id);
  },

  async getAll(): Promise<readonly MealPlan[]> {
    const all = await db.mealPlans.orderBy('updatedAt').reverse().toArray();
    return all.flatMap(row => {
      const result = deserializeMealPlan(row);
      return result.ok ? [result.value] : [];
    });
  },

  async getById(id: string): Promise<MealPlan | null> {
    const row = await db.mealPlans.get(id);
    if (!row) return null;
    const result = deserializeMealPlan(row);
    return result.ok ? result.value : null;
  },
};
