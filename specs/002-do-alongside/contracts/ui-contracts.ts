/**
 * @contract ui-contracts (addendum: 002-do-alongside)
 * Package: apps/pwa
 *
 * UI contracts for the Stage/Track model. Describes prop shapes and interaction
 * contracts for modified/new components.
 */

import type { Stage, Track, Step } from './meal-model';
import type { LiveSession, AlarmScope } from './alarm-scheduler';
import type { Schedule, StepEvent } from './scheduler';
import type { WallClockTime } from './timing-engine';

// ─── StageEditor ──────────────────────────────────────────────────────────────

/**
 * Replaces StepForm as the primary editing component for a Dish/Recipe's
 * step structure. Renders a vertical list of Stages; each Stage renders its
 * Tracks side-by-side (for multi-track) or inline (for single-track).
 *
 * Interactions:
 *   - "Add Stage" button: appends a new single-track Stage with an empty Track.
 *   - "Add Track" within a Stage: appends a new empty Track to that Stage
 *     (activates the "Do Alongside" parallel behaviour for that Stage).
 *   - "Remove Track" within a Stage: removes the Track; if last Track, removes Stage.
 *   - "Add Step" within a Track: opens StepForm inline for the Track's steps list.
 *   - Move Stage up/down: reorders Stages.
 *   - Move Step up/down within Track: reorders Steps in a Track.
 *   - Delete Stage: removes Stage and all its Tracks and Steps.
 *   - Delete Step: removes Step from Track; if last Step in last Track, removes Stage.
 */
export interface StageEditorProps {
  readonly stages: readonly Stage[];
  readonly onChange: (stages: readonly Stage[]) => void;
  readonly disabled?: boolean;
}

// ─── TrackEditor ─────────────────────────────────────────────────────────────

/**
 * Renders and edits the Steps within a single Track.
 * Visually equivalent to the old StepForm but scoped to one Track.
 *
 * Displayed within a StageEditor as one column of a multi-column Stage layout.
 */
export interface TrackEditorProps {
  readonly track: Track;
  readonly onChange: (track: Track) => void;
  readonly disabled?: boolean;
}

// ─── ScheduleView (updated) ───────────────────────────────────────────────────

/**
 * ScheduleView receives the same Schedule prop. Updated rendering:
 *
 * Events are grouped by stageId. Within a Stage group:
 * - Single-track Stages: render as a single row (unchanged from 001).
 * - Multi-track Stages: render as a grouped block with a left-border accent.
 *   Within the block, each Track's events render in a sub-row identified by trackId.
 *   The Stage's shared end time is shown as a "join" label on the right.
 *
 * isConcurrentWithOtherDish drives the "⇔ concurrent" badge (replaces the old
 * isParallel badge, which now has a different meaning).
 *
 * isParallel (intra-dish Stage parallelism) drives the Track lane grouping.
 */
export interface ScheduleViewProps {
  readonly schedule: Schedule | null;
}

// ─── GanttView (updated) ─────────────────────────────────────────────────────

/**
 * GanttView renders a horizontal timeline. Updated for Stage/Track:
 *
 * - One row per Dish.
 * - Within a Dish row, each Stage occupies a horizontal band.
 * - Single-track Stages: one bar filling the band.
 * - Multi-track Stages: one bar per Track, stacked vertically within the band.
 *   All bars in the Stage share the same right edge (stageEndTime).
 * - Track bars are color-coded by step type within the Track (gradient or dominant type).
 * - A vertical "join" line is drawn at each Stage boundary.
 */
export interface GanttViewProps {
  readonly schedule: Schedule | null;
}

// ─── TimerView (updated) ─────────────────────────────────────────────────────

/**
 * TimerView renders the live countdown session. Updated for Stage/Track:
 *
 * Step states are grouped by stageId. Rendering per group:
 *
 * SINGLE-TRACK STAGE (tracks.length === 1):
 *   Renders identically to 001-reverse-timing (one card per step).
 *
 * MULTI-TRACK STAGE (tracks.length > 1):
 *   Renders a "Running in parallel" header card.
 *   Each Track's steps render in a sub-group within the stage card.
 *   Each step has its own individual countdown, status badge, and "Mark Started" button.
 *   DelayControls and AlarmToggleControls are per-step (unchanged).
 *
 * STAGE GATE (applies to the FIRST step of each Stage after a multi-track Stage):
 *   The "Mark Started" button is DISABLED until isStageComplete(session, precedingStageId)
 *   returns true.
 *   A visible "Waiting for parallel steps to complete" label explains the disabled state.
 *   Once all steps in the preceding Stage are confirmed, the button activates with no
 *   other state change (the alarm already fired on schedule).
 *
 * Props are unchanged from 001-reverse-timing except:
 *   - isStageComplete helper is required for the gate check.
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
  readonly onAcceptNewTargetTime: (proposedTime: WallClockTime) => void;
  /** Injected helper — pure function, no side effects. */
  readonly isStageComplete: (session: LiveSession, stageId: string) => boolean;
}

// ─── Interaction contract: "Do Alongside" (add Track to Stage) ────────────────

/**
 * Full interaction flow for creating a parallel track within a Stage:
 *
 * 1. User views StageEditor. Each Stage has a footer row with an "Add Track" button.
 *    (For single-track Stages, this button is labelled "Do Alongside".)
 * 2. User clicks "Add Track" / "Do Alongside" on a Stage.
 * 3. A new empty Track column appears in that Stage's row.
 * 4. The new Track column shows an empty TrackEditor with an "Add Step" form.
 * 5. User fills in step(s) and saves.
 * 6. StageEditor calls onChange with updated stages.
 * 7. Schedule recalculates; the Stage now emits multi-track StepEvents.
 *
 * Removing a Track:
 * 1. Each Track column shows a "Remove Track" (×) button.
 * 2. Clicking removes the Track from the Stage.
 * 3. If only one Track remains, the Stage reverts to a sequential stage.
 * 4. If zero Tracks would remain (last Track deleted), the entire Stage is removed.
 * 5. StageEditor calls onChange.
 *
 * Visual model for a two-track Stage in StageEditor:
 *
 *   ┌─ Stage 2 ─────────────────────────────────────────────────┐
 *   │  Track A                │  Track B                        │
 *   │  [Brine chicken 45m]   │  [Prep vegetables 10m]          │
 *   │  [+ Add step]          │  [+ Add step]   [× Remove track] │
 *   │                        │  [+ Add Track]                   │
 *   └──────────────────────────────────────────────────────────-┘
 */
export type DoAlongsideInteractionContract = typeof _doAlongsideNoop;
declare const _doAlongsideNoop: unique symbol;
