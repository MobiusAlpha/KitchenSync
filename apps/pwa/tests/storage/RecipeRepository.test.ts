/**
 * Unit tests for RecipeRepository.
 * T031 — Tests via the RecipeRepository interface; Dexie mocked using fake-indexeddb.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

// Reset fake-indexeddb between tests
beforeEach(async () => {
  const { indexedDB, IDBKeyRange } = await import('fake-indexeddb');
  // Reinitialize with fresh db
  Object.assign(globalThis, { indexedDB, IDBKeyRange });
  // Re-import db to pick up the fresh indexedDB
  const { db } = await import('../../src/storage/db.js');
  await db.delete();
  await db.open();
});

describe('RecipeRepository', () => {
  async function getRepo() {
    return (await import('../../src/storage/RecipeRepository.js')).RecipeRepository;
  }

  it('create persists to IndexedDB, sets createdAt/updatedAt', async () => {
    const repo = await getRepo();
    const before = Date.now();
    const recipe = await repo.create({
      name: 'Roast Chicken',
      steps: [{
        id: 'step-1',
        name: 'Roast',
        type: 'cook',
        durationMinutes: 90,
      }],
    });
    const after = Date.now();
    expect(recipe.id).toBeDefined();
    expect(recipe.name).toBe('Roast Chicken');
    expect(recipe.createdAt).toBeGreaterThanOrEqual(before);
    expect(recipe.createdAt).toBeLessThanOrEqual(after);
    expect(recipe.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('update refreshes updatedAt and preserves createdAt', async () => {
    const repo = await getRepo();
    const created = await repo.create({
      name: 'Original',
      steps: [{ id: 's1', name: 'Step', type: 'prep', durationMinutes: 5 }],
    });
    await new Promise(r => setTimeout(r, 2)); // Ensure time difference
    const updated = await repo.update(created.id, { name: 'Updated' });
    expect(updated?.name).toBe('Updated');
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).toBeGreaterThan(created.updatedAt);
  });

  it('delete removes the entry', async () => {
    const repo = await getRepo();
    const recipe = await repo.create({
      name: 'To Delete',
      steps: [{ id: 's1', name: 'Step', type: 'prep', durationMinutes: 5 }],
    });
    await repo.delete(recipe.id);
    const found = await repo.getById(recipe.id);
    expect(found).toBeNull();
  });

  it('getAll returns all recipes', async () => {
    const repo = await getRepo();
    await repo.create({ name: 'A', steps: [{ id: 's1', name: 'S', type: 'prep', durationMinutes: 5 }] });
    await repo.create({ name: 'B', steps: [{ id: 's2', name: 'S', type: 'cook', durationMinutes: 10 }] });
    const all = await repo.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('getById returns correct recipe', async () => {
    const repo = await getRepo();
    const recipe = await repo.create({
      name: 'Find Me',
      steps: [{ id: 's1', name: 'Step', type: 'prep', durationMinutes: 5 }],
    });
    const found = await repo.getById(recipe.id);
    expect(found?.name).toBe('Find Me');
  });

  it('getById returns null for missing id', async () => {
    const repo = await getRepo();
    const found = await repo.getById('non-existent-id');
    expect(found).toBeNull();
  });
});
