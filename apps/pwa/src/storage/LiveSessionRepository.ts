import type { LiveSession } from '@kitchensync/alarm-scheduler';
import { alarmScheduler } from '@kitchensync/alarm-scheduler';
import { db } from './db.js';

const SESSION_KEY = 'active';

/**
 * Single-slot persistence for the active LiveSession.
 * All reads pass raw data through deserializeLiveSession (Principle III).
 */
export const LiveSessionRepository = {
  async save(session: LiveSession): Promise<void> {
    // Store under a fixed sentinel id so there is only ever one active session
    const stored = { ...session, id: SESSION_KEY };
    await db.liveSessions.put(stored as unknown as LiveSession);
  },

  async load(): Promise<LiveSession | null> {
    try {
      const raw = await db.liveSessions.get(SESSION_KEY);
      if (!raw) return null;
      const result = alarmScheduler.deserializeLiveSession(raw);
      return result.ok ? result.value : null;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await db.liveSessions.delete(SESSION_KEY);
  },
};
