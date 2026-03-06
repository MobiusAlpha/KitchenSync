/**
 * Unit tests for LiveSessionRepository.
 * T080 — Tests via the LiveSessionRepository interface; Dexie mocked using fake-indexeddb.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import type { LiveSession } from '@kitchensync/alarm-scheduler';

const mockSession: LiveSession = {
  id: 'session-1',
  mealPlanId: null,
  startedAt: 1000000,
  targetTime: { hour: 19, minute: 0 },
  effectiveTargetTime: { hour: 19, minute: 0 },
  alarmOverrides: [],
  totalDelayMinutes: 0,
  stepStates: [
    {
      stepId: 's1',
      dishId: 'd1',
      stepName: 'Roast',
      dishName: 'Chicken',
      scheduledStart: { hour: 17, minute: 30 },
      status: 'pending',
      confirmedAt: null,
      delayAppliedMinutes: 0,
    },
  ],
};

beforeEach(async () => {
  const { indexedDB, IDBKeyRange } = await import('fake-indexeddb');
  Object.assign(globalThis, { indexedDB, IDBKeyRange });
  const { db } = await import('../../src/storage/db.js');
  await db.delete();
  await db.open();
});

describe('LiveSessionRepository', () => {
  async function getRepo() {
    return (await import('../../src/storage/LiveSessionRepository.js')).LiveSessionRepository;
  }

  it('save persists session; load returns it with correct step data', async () => {
    const repo = await getRepo();
    await repo.save(mockSession);
    const loaded = await repo.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.stepStates).toHaveLength(1);
    expect(loaded?.stepStates[0]?.stepName).toBe('Roast');
    expect(loaded?.targetTime).toEqual({ hour: 19, minute: 0 });
  });

  it('load passes raw data through deserializeLiveSession — corrupted data returns null', async () => {
    const repo = await getRepo();
    const { db } = await import('../../src/storage/db.js');
    // Insert a record under the sentinel key but with invalid structure
    await db.liveSessions.put({ id: 'active', stepStates: 'not-an-array' } as unknown as LiveSession);
    const loaded = await repo.load();
    expect(loaded).toBeNull();
  });

  it('clear removes session; subsequent load returns null', async () => {
    const repo = await getRepo();
    await repo.save(mockSession);
    await repo.clear();
    const loaded = await repo.load();
    expect(loaded).toBeNull();
  });

  it('load returns null when no session has been saved', async () => {
    const repo = await getRepo();
    const loaded = await repo.load();
    expect(loaded).toBeNull();
  });
});
