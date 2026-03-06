import type { WallClockTime } from '@kitchensync/timing-engine';
import type { LiveSession } from './types.js';

/**
 * Commits the cook-accepted effective target time to the session (Phase 2 of the delay flow).
 */
export function acceptNewTargetTime(
  session: LiveSession,
  proposedTime: WallClockTime,
): LiveSession {
  return { ...session, effectiveTargetTime: proposedTime };
}
