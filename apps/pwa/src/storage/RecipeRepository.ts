import type { Recipe } from '@kitchensync/meal-model';
import { db } from './db.js';
import { generateId } from '../utils/id.js';

/**
 * CRUD repository for Recipe entities in IndexedDB.
 * All write operations manage timestamps; callers do NOT set createdAt/updatedAt.
 */
export const RecipeRepository = {
  async create(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    const now = Date.now();
    const recipe: Recipe = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.recipes.add(recipe);
    return recipe;
  },

  async update(
    id: string,
    data: Partial<Omit<Recipe, 'id' | 'createdAt'>>,
  ): Promise<Recipe | null> {
    const existing = await db.recipes.get(id);
    if (!existing) return null;
    const updated: Recipe = { ...existing, ...data, id, createdAt: existing.createdAt, updatedAt: Date.now() };
    await db.recipes.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.recipes.delete(id);
  },

  async getAll(): Promise<readonly Recipe[]> {
    const all = await db.recipes.orderBy('updatedAt').reverse().toArray();
    return all;
  },

  async getById(id: string): Promise<Recipe | null> {
    const recipe = await db.recipes.get(id);
    return recipe ?? null;
  },
};
