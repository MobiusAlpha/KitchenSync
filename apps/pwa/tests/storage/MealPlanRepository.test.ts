/**
 * Unit tests for MealPlanRepository.
 * T079 — Tests via the MealPlanRepository interface; Dexie mocked using fake-indexeddb.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

beforeEach(async () => {
  const { indexedDB, IDBKeyRange } = await import('fake-indexeddb');
  Object.assign(globalThis, { indexedDB, IDBKeyRange });
  const { db } = await import('../../src/storage/db.js');
  await db.delete();
  await db.open();
});

describe('MealPlanRepository', () => {
  async function getRepo() {
    return (await import('../../src/storage/MealPlanRepository.js')).MealPlanRepository;
  }

  const baseDish = {
    id: 'd-1',
    displayName: 'Main Dish',
    sourceRecipeId: null as string | null,
    steps: [{ id: 's1', name: 'Cook', type: 'cook' as const, durationMinutes: 30 }],
  };

  it('create persists to IndexedDB, sets createdAt/updatedAt', async () => {
    const repo = await getRepo();
    const before = Date.now();
    const plan = await repo.create({
      name: 'Sunday Dinner',
      targetTime: { hour: 19, minute: 0 },
      dishes: [baseDish],
    });
    const after = Date.now();
    expect(plan.id).toBeDefined();
    expect(plan.name).toBe('Sunday Dinner');
    expect(plan.createdAt).toBeGreaterThanOrEqual(before);
    expect(plan.createdAt).toBeLessThanOrEqual(after);
    expect(plan.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('update refreshes updatedAt and preserves createdAt', async () => {
    const repo = await getRepo();
    const created = await repo.create({
      name: 'Original',
      targetTime: { hour: 18, minute: 0 },
      dishes: [baseDish],
    });
    await new Promise(r => setTimeout(r, 2));
    const updated = await repo.update(created.id, { name: 'Updated' });
    expect(updated?.name).toBe('Updated');
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).toBeGreaterThan(created.updatedAt);
  });

  it('delete removes the entry', async () => {
    const repo = await getRepo();
    const plan = await repo.create({
      name: 'To Delete',
      targetTime: { hour: 19, minute: 0 },
      dishes: [baseDish],
    });
    await repo.delete(plan.id);
    const found = await repo.getById(plan.id);
    expect(found).toBeNull();
  });

  it('getAll returns all meal plans', async () => {
    const repo = await getRepo();
    const dish2 = { ...baseDish, id: 'd-2' };
    await repo.create({ name: 'A', targetTime: { hour: 18, minute: 0 }, dishes: [baseDish] });
    await repo.create({ name: 'B', targetTime: { hour: 19, minute: 0 }, dishes: [dish2] });
    const all = await repo.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('getById returns correct plan', async () => {
    const repo = await getRepo();
    const plan = await repo.create({
      name: 'Find Me',
      targetTime: { hour: 19, minute: 0 },
      dishes: [baseDish],
    });
    const found = await repo.getById(plan.id);
    expect(found?.name).toBe('Find Me');
  });

  it('getById returns null for missing id', async () => {
    const repo = await getRepo();
    const found = await repo.getById('non-existent-id');
    expect(found).toBeNull();
  });

  it('duplicate Dish displayName gets auto-suffixed "#2" on create', async () => {
    const repo = await getRepo();
    const dish2 = { ...baseDish, id: 'd-2' };
    const plan = await repo.create({
      name: 'Multi Dish',
      targetTime: { hour: 19, minute: 0 },
      dishes: [baseDish, dish2],
    });
    const names = plan.dishes.map(d => d.displayName);
    expect(names).toContain('Main Dish');
    expect(names).toContain('Main Dish #2');
  });

  it('duplicate Dish displayName gets auto-suffixed on update', async () => {
    const repo = await getRepo();
    const created = await repo.create({
      name: 'Plan',
      targetTime: { hour: 19, minute: 0 },
      dishes: [baseDish],
    });
    const dish2 = { ...baseDish, id: 'd-3' };
    const updated = await repo.update(created.id, { dishes: [baseDish, dish2] });
    expect(updated?.dishes.map(d => d.displayName)).toContain('Main Dish #2');
  });
});
