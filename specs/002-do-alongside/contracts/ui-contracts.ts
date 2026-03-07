/**
 * @contract ui-contracts (addendum: 002-do-alongside)
 * Package: apps/pwa
 *
 * UI contracts for the "Do Alongside" feature.
 * Describes prop shapes and interaction contracts for modified/new components.
 */

import type { CompanionStep, StepWithCompanions } from './meal-model';
import type { LiveSession, AlarmScope } from './alarm-scheduler';
import type { Schedule } from './scheduler';

// ─── StepForm (extended) ──────────────────────────────────────────────────────

/**
 * Extended StepForm props. The existing onChange callback now carries
 * StepWithCompanions[] (backward-compatible: CompanionStep.companions defaults
 * to [] when absent).
 *
 * New UX: each step card in the list exposes a contextual menu with three actions:
 *   - "Edit": existing behaviour (inline edit form)
 *   - "Delete": existing behaviour (remove step)
 *   - "Do Alongside": opens CompanionStepForm nested under the anchor card
 *
 * Companion steps render as indented sub-cards under their anchor, each with
 * their own contextual menu: "Edit" and "Delete" only (no "Do Alongside" on
 * companions — nesting is forbidden).
 */
export interface StepFormProps {
  readonly steps: readonly StepWithCompanions[];
  readonly onChange: (steps: readonly StepWithCompanions[]) => void;
  readonly disabled?: boolean;
}

// ─── CompanionStepForm ────────────────────────────────────────────────────────

/**
 * Inline form rendered under an anchor step card when the user selects
 * "Do Alongside". Structurally identical to the existing inline step form
 * (name, type, durationMinutes fields) but saves a CompanionStep rather than
 * a full Step.
 *
 * Displayed only while creating or editing a companion. Dismissed on save or cancel.
 */
export interface CompanionStepFormProps {
  /** The anchor step this companion belongs to. Display-only (shown in header). */
  readonly anchorStepName: string;
  /** Existing companion to edit, or null for new companion. */
  readonly initialCompanion: CompanionStep | null;
  readonly onSave: (companion: CompanionStep) => void;
  readonly onCancel: () => void;
}

// ─── ScheduleView (extended) ──────────────────────────────────────────────────

/**
 * ScheduleView receives the same Schedule prop as before.
 *
 * Extended rendering behaviour:
 * - Events with parallelGroupId !== null are visually grouped.
 * - Within a group, events render with a left-border or background accent
 *   (implementation detail; the key contract is grouping must be perceptible
 *   without reading text).
 * - A group header row (or inline badge) identifies the shared end time.
 * - The existing "⇔ parallel" badge (for cross-dish isParallel) is unchanged.
 *
 * No new props required — grouping is derived from StepEvent.parallelGroupId.
 */
export interface ScheduleViewProps {
  readonly schedule: Schedule | null;
}

// ─── GanttView (extended) ─────────────────────────────────────────────────────

/**
 * GanttView renders a horizontal timeline. Extended rendering for companions:
 * - Companion bars appear on a sub-row directly under their anchor bar within
 *   the same dish lane.
 * - All bars in a parallel group share the same right-edge (end time).
 * - Companion bars are visually distinguished (e.g., dashed border, lighter fill).
 *
 * No new props required — companion relationships are derived from
 * StepEvent.parallelGroupId.
 */
export interface GanttViewProps {
  readonly schedule: Schedule | null;
}

// ─── TimerView (extended) ─────────────────────────────────────────────────────

/**
 * TimerView receives the same props as before plus one new callback and one
 * new helper derived from alarm-scheduler.
 *
 * Extended rendering behaviour:
 * - Step states sharing a parallelGroupId are rendered as a grouped card with
 *   a "Running in parallel" header.
 * - Each member of the group shows its own individual timer countdown and
 *   "Mark Started" button.
 * - The join step's "Mark Started" button is DISABLED until isParallelGroupComplete
 *   returns true for the step's parallelGroupId.
 * - Once all group members are confirmed, the join step's button becomes active
 *   with no other change to state machine behaviour.
 */
export interface TimerViewProps {
  readonly session: LiveSession;
  readonly commands: readonly import('./alarm-scheduler').SessionCommand[];
  readonly stepDurations: ReadonlyMap<string, number>;
  readonly onConfirmStep: (stepId: string) => void;
  readonly onApplyDelay: (
    scope: AlarmScope | 'meal',
    targetId: string | null,
    delayMinutes: number,
  ) => void;
  readonly onSetAlarmOverride: (
    scope: AlarmScope,
    targetId: string | null,
    enabled: boolean,
  ) => void;
  readonly onAcceptNewTargetTime: (proposedTime: import('./timing-engine').WallClockTime) => void;
}

// ─── Interaction contract: "Do Alongside" gesture ────────────────────────────

/**
 * The full interaction flow for adding a companion step:
 *
 * 1. User views step list in StepForm (recipe editor or planner).
 * 2. User taps/clicks the context menu icon (⋮) on any backbone step card.
 * 3. A dropdown appears with: Edit | Delete | Do Alongside.
 * 4. User selects "Do Alongside".
 * 5. CompanionStepForm expands inline below the anchor card.
 * 6. User fills in companion name, type, duration and taps Save.
 * 7. A new CompanionStep is appended to anchor.companions[].
 * 8. StepForm calls onChange with the updated steps array.
 * 9. Schedule recalculates; companion StepEvent appears in ScheduleView/GanttView.
 *
 * Editing a companion:
 * 1. User taps the context menu on a companion sub-card.
 * 2. Dropdown: Edit | Delete (no "Do Alongside" option).
 * 3. Edit: CompanionStepForm opens pre-populated with companion data.
 * 4. Save: companion is replaced in anchor.companions[]; onChange fires.
 *
 * Deleting a companion:
 * 1. User taps Delete on a companion sub-card.
 * 2. Companion is removed from anchor.companions[].
 * 3. If anchor.companions becomes empty, anchor reverts to a plain sequential step.
 * 4. onChange fires; schedule recalculates.
 *
 * Deleting an anchor step:
 * - Behaves identically to existing step deletion.
 * - The anchor and ALL its companions are removed together.
 * - The caller (StepForm) removes the entire Step object including its companions.
 */
export type DoAlongsideInteractionContract = typeof _doAlongsideNoop;
declare const _doAlongsideNoop: unique symbol;
