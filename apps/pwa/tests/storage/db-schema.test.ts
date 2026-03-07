/**
 * T012b — Dexie schema round-trip test.
 * Verifies that all four IndexedDB tables can be opened and support basic write + read.
 * Uses fake-indexeddb so no real browser IndexedDB is required.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { KitchenSyncDb } from '../../src/storage/db.js';

let db: KitchenSyncDb;

beforeEach(() => {
  // Create a fresh in-memory database for each test
  db = new KitchenSyncDb();
});

describe('Dexie schema — table round-trips', () => {
  it('recipes table: write and read a record', async () => {
    const recipe = {
      id: 'r-1',
      name: 'Test Recipe',
      steps: [{ id: 's-1', durationMinutes: 30 }],
      createdAt: 1000,
      updatedAt: 1000,
    };
    await db.recipes.add(recipe as never);
    const stored = await db.recipes.get('r-1');
    expect(stored?.name).toBe('Test Recipe');
  });

  it('mealPlans table: write and read a record', async () => {
    const plan = {
      id: 'mp-1',
      name: 'Test Plan',
      targetTime: { hour: 18, minute: 0 },
      dishes: [],
      createdAt: 1000,
      updatedAt: 1000,
    };
    await db.mealPlans.add(plan as never);
    const stored = await db.mealPlans.get('mp-1');
    expect(stored?.name).toBe('Test Plan');
  });

  it('liveSessions table: write and read a record', async () => {
    const session = { id: 'active', mealPlanId: null, startedAt: 1000 };
    await db.liveSessions.add(session as never);
    const stored = await db.liveSessions.get('active');
    expect(stored?.id).toBe('active');
  });

  it('alarmConfig table: write and read a record', async () => {
    const config = { id: 'global', defaultEnabled: true };
    await db.alarmConfig.add(config as never);
    const stored = await db.alarmConfig.get('global');
    expect(stored?.defaultEnabled).toBe(true);
  });
});
