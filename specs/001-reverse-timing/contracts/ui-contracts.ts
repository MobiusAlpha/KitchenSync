/**
 * @contract ui-contracts
 * Package: apps/pwa (component layer)
 *
 * Prop interfaces for all public React components in the KitchenSync PWA.
 * Components MUST be tested against these interfaces (Principle II — contract-based
 * testing). No implementation details (hooks, local state, refs) appear here — only
 * the external API: what each component receives and what callbacks it exposes.
 *
 * Dependencies: meal-model, scheduler, alarm-scheduler contracts.
 */

import type { Step, Recipe, MealPlan, WallClockTime } from './meal-model';
import type { Schedule } from './scheduler';
import type {
  LiveSession,
  AlarmScope,
  AlarmConfiguration,
  SessionCommand,
} from './alarm-scheduler';

// ─── StepForm ─────────────────────────────────────────────────────────────────

/**
 * Controlled list editor for an ordered set of Steps.
 * Renders add / edit / remove / reorder interactions.
 * Runs inline validation (validateStep) before propagating changes.
 */
export interface StepFormProps {
  /** Current ordered list of steps (controlled). */
  readonly steps: readonly Step[];
  /** Called whenever the step list changes (add, edit, remove, or reorder). */
  readonly onChange: (steps: readonly Step[]) => void;
  /** When true all inputs and action buttons are disabled. Default: false. */
  readonly disabled?: boolean;
}

// ─── BlockExpansion ───────────────────────────────────────────────────────────

/**
 * Inline panel for expanding a single-block Dish component into named stages (FR-033).
 *
 * Shown when the user taps a single-block Gantt lane or its corresponding list entry.
 * The user enters individual stages; the panel reactively shows the diff between the
 * running stage sum and the original block estimate (e.g. "+8 min vs. original estimate").
 * No constraint is enforced — the diff is informational only (FR-033 warn-not-constrain).
 *
 * On confirm, `onExpand` is called with the new step list (≥2 steps; each with name + type).
 * The parent is responsible for clearing `Dish.originalEstimateMinutes` after saving.
 */
export interface BlockExpansionProps {
  /**
   * Display name of the dish being expanded (shown as the panel title).
   */
  readonly dishName: string;
  /**
   * The original single-block estimate in minutes. Used to compute the diff label.
   * Must be > 0.
   */
  readonly originalEstimateMinutes: number;
  /**
   * Current draft stages being entered (controlled).
   * Starts empty; the parent initialises to [] when the panel opens.
   */
  readonly draftSteps: readonly Step[];
  /** Called as the user adds, edits, or removes draft stages. */
  readonly onDraftChange: (steps: readonly Step[]) => void;
  /**
   * Called when the user confirms the expansion.
   * The confirmed steps replace the single-block step in the parent Dish.
   * Guaranteed to have ≥ 1 step with valid durationMinutes.
   */
  readonly onExpand: (steps: readonly Step[]) => void;
  /** Called when the user cancels the expansion without saving. */
  readonly onCancel: () => void;
}

// ─── OverrunWarning ───────────────────────────────────────────────────────────

/**
 * Prominent banner displayed when the earliest scheduled step falls in the past.
 * Shown by ScheduleView and PlannerPage whenever Schedule.overrunMinutes > 0.
 */
export interface OverrunWarningProps {
  /** Positive number of minutes by which the schedule overruns the current time. */
  readonly overrunMinutes: number;
}

// ─── ScheduleView ─────────────────────────────────────────────────────────────

/** The two display modes for a computed Schedule (FR-012). */
export type ScheduleViewMode = 'gantt' | 'list';

/**
 * Read-only display of a computed Schedule.
 *
 * Supports two modes (FR-012):
 *   - 'gantt' (default): Gantt chart with one horizontal lane per dish;
 *     steps rendered as proportionally-sized CSS blocks.
 *   - 'list': Chronological list of step events ordered by start time.
 *
 * Works for both single-dish and multi-dish layouts.
 * Renders an empty-state prompt when schedule is null.
 */
export interface ScheduleViewProps {
  /** The computed schedule to display. null triggers the empty-state prompt. */
  readonly schedule: Schedule | null;
  /**
   * Active display mode. Defaults to 'gantt' on first render.
   * Controlled externally so the parent page can persist the user's preference.
   */
  readonly viewMode: ScheduleViewMode;
  /** Called when the user toggles between 'gantt' and 'list'. */
  readonly onViewModeChange: (mode: ScheduleViewMode) => void;
}

// ─── RecipeEditor ─────────────────────────────────────────────────────────────

/**
 * Form for creating or editing a named Recipe.
 * In edit mode (recipe !== null) the form is pre-filled with the existing recipe.
 * In create mode (recipe === null) the form is blank.
 * Calls onSave with a validated Recipe; calls onCancel on discard.
 */
export interface RecipeEditorProps {
  /** Existing recipe to edit, or null for create mode. */
  readonly recipe: Recipe | null;
  /** Called with the fully validated Recipe when the user confirms save. */
  readonly onSave: (recipe: Recipe) => void;
  /** Called when the user cancels without saving. */
  readonly onCancel: () => void;
}

// ─── RecipeLibrary ────────────────────────────────────────────────────────────

/**
 * Read-only list of persisted Recipes with load and delete actions.
 * Renders an empty-state message when the list is empty.
 */
export interface RecipeLibraryProps {
  /** All persisted recipes to display. */
  readonly recipes: readonly Recipe[];
  /** Called when the user selects a recipe to load into a session. */
  readonly onSelect: (recipe: Recipe) => void;
  /** Called when the user requests deletion; caller is responsible for repository write. */
  readonly onDelete: (recipeId: string) => void;
}

// ─── MealPlanEditor ───────────────────────────────────────────────────────────

/**
 * Full editor for a MealPlan: target time, dish list (add from library or ad-hoc),
 * rename, and remove. Dish displayName disambiguation is handled by the repository
 * on save — the editor shows names as-entered and relies on the repository to
 * append suffixes on duplicate names.
 */
export interface MealPlanEditorProps {
  /** Current state of the meal plan being edited (controlled). */
  readonly mealPlan: MealPlan;
  /** All saved recipes available to load as dishes. */
  readonly savedRecipes: readonly Recipe[];
  /** Called whenever the meal plan structure changes. */
  readonly onChange: (mealPlan: MealPlan) => void;
}

// ─── DelayControls ────────────────────────────────────────────────────────────

/** Valid delay increments (minutes). */
export type DelayMinutes = 1 | 5 | 10;

/**
 * +1/+5/+10 min delay buttons rendered at step, dish, and meal scope.
 * Calls onApplyDelay with the scope, the relevant target id, and the chosen amount.
 */
export interface DelayControlsProps {
  /** UUID of the step this control is associated with. */
  readonly stepId: string;
  /** UUID of the dish this control is associated with. */
  readonly dishId: string;
  /**
   * Called when the cook selects a delay amount.
   * scope: 'step' | 'dish' | 'meal'
   * targetId: stepId for 'step', dishId for 'dish', null for 'meal'
   * delayMinutes: 1 | 5 | 10
   */
  readonly onApplyDelay: (
    scope: AlarmScope | 'meal',
    targetId: string | null,
    delayMinutes: DelayMinutes,
  ) => void;
}

// ─── AlarmToggleControls ──────────────────────────────────────────────────────

/**
 * On/off alarm toggles for step, dish, and meal scope.
 * Reads the current override state from session.alarmOverrides.
 */
export interface AlarmToggleControlsProps {
  /** Current live session (provides alarmOverrides for rendering). */
  readonly session: LiveSession;
  /** UUID of the step whose alarm toggle is being rendered. */
  readonly stepId: string;
  /** UUID of the dish whose alarm toggle is being rendered. */
  readonly dishId: string;
  /** Called when the cook toggles an alarm scope on or off. */
  readonly onSetAlarmOverride: (
    scope: AlarmScope,
    targetId: string | null,
    enabled: boolean,
  ) => void;
}

// ─── TimerView ────────────────────────────────────────────────────────────────

/**
 * The main live-timer display. Renders a list of steps with countdown times,
 * an alarm prompt overlay (triggered by SOUND_ALARM commands), confirm-start buttons,
 * per-step DelayControls, and AlarmToggleControls.
 *
 * Delay flow (two-phase):
 *   1. Cook applies a delay → UPDATE_DISPLAY command carries the computed
 *      effectiveMealEnd (intermediate proposed new target time).
 *   2. TimerView shows the proposed time and an "Accept" button.
 *   3. Cook accepts → onAcceptNewTargetTime is called → effectiveTargetTime
 *      is persisted in LiveSession.
 */
export interface TimerViewProps {
  /** Current live session state. */
  readonly session: LiveSession;
  /** Side-effect commands from the last tick; drives alarm and display updates. */
  readonly commands: readonly SessionCommand[];
  /**
   * Map of stepId → durationMinutes from the original schedule's source dishes.
   * Required by computeEffectiveMealEnd; passed in by TimerPage before mount.
   */
  readonly stepDurations: ReadonlyMap<string, number>;
  /** Called when the cook taps "Started" to confirm a step. */
  readonly onConfirmStep: (stepId: string) => void;
  /** Called when the cook applies a delay via DelayControls. */
  readonly onApplyDelay: DelayControlsProps['onApplyDelay'];
  /** Called when the cook toggles an alarm via AlarmToggleControls. */
  readonly onSetAlarmOverride: AlarmToggleControlsProps['onSetAlarmOverride'];
  /**
   * Called when the cook accepts the proposed new effective target time.
   * The proposed time is the effectiveMealEnd carried by the latest UPDATE_DISPLAY command.
   * Acceptance commits the value to LiveSession.effectiveTargetTime.
   */
  readonly onAcceptNewTargetTime: (proposedTime: WallClockTime) => void;
}

// ─── AlarmSettingsPage (inline — no child component props needed) ──────────────

/**
 * Prop interface for the global alarm settings page.
 * Reads and writes via SettingsRepository; exposes the current AlarmConfiguration
 * and a save handler to its hosting component or router.
 */
export interface AlarmSettingsPageProps {
  /** Current global alarm configuration (read from SettingsRepository on mount). */
  readonly config: AlarmConfiguration;
  /** Called when the user toggles the global default and confirms. */
  readonly onSave: (config: AlarmConfiguration) => void;
}
