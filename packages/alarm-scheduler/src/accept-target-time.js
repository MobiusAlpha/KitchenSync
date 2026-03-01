/**
 * Commits the cook-accepted effective target time to the session (Phase 2 of the delay flow).
 */
export function acceptNewTargetTime(session, proposedTime) {
    return { ...session, effectiveTargetTime: proposedTime };
}
//# sourceMappingURL=accept-target-time.js.map