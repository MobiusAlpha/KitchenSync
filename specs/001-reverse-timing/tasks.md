# Tasks: Reverse-Timing Cooking Scheduler

**Input**: Design documents from `/specs/001-reverse-timing/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: TDD is **MANDATORY** per KitchenSync constitution (Principle II). Test tasks MUST appear
before their corresponding implementation tasks. Tests MUST be written and confirmed failing before
implementation begins. Tests target contracts/interfaces — never concrete types.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description in path/to/file`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`–`[US4]`)
- Exact file paths are required in all task descriptions

---

## Phase 1: Setup

**Purpose**: Monorepo scaffold, package stubs, tooling configuration. No dependencies — start immediately.

- [ ] T001 Initialize pnpm workspace root with Turborepo in `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- [ ] T002 [P] Scaffold `packages/timing-engine` with `src/index.ts`, `tests/`, `package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] T003 [P] Scaffold `packages/meal-model` with `src/index.ts`, `tests/`, `package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] T004 [P] Scaffold `packages/scheduler` with `src/index.ts`, `tests/`, `package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] T005 [P] Scaffold `packages/alarm-scheduler` with `src/index.ts`, `tests/`, `package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] T006 Scaffold `apps/pwa` with Vite 6 + React 19 + Bootstrap 5 + vite-plugin-pwa in `apps/pwa/package.json`, `apps/pwa/vite.config.ts`, `apps/pwa/vitest.config.ts`, `apps/pwa/src/main.tsx`
- [ ] T007 [P] Configure shared TypeScript base config (strict mode, `moduleResolution: bundler`) in `tsconfig.base.json`
- [ ] T008 [P] Configure ESLint + Prettier at repo root in `.eslintrc.cjs`, `.prettierrc`
- [ ] T009 Configure Turborepo pipeline (build → test → lint, with caching) in `turbo.json`
- [ ] T010 [P] Add PWA manifest + placeholder icons in `apps/pwa/public/manifest.webmanifest`, `apps/pwa/public/icons/icon-192.png`, `apps/pwa/public/icons/icon-512.png`

**Checkpoint**: `pnpm install` succeeds; `pnpm turbo build` exits cleanly on empty stubs.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `timing-engine` library (used by all packages) and PWA shell skeleton. MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

> **TDD NOTE: T011 must be written and confirmed FAILING before T012 is implemented. T012a must fail before T013/T014 are implemented. T012b must fail before T015 is implemented.**

- [ ] T011 Write failing contract tests for `WallClockTime`, `minutesBetween`, `addMinutes`, `wallClockFromMs` in `packages/timing-engine/tests/timing-engine.test.ts`
- [ ] T012 Implement `WallClockTime` type, `minutesBetween`, `addMinutes`, `wallClockFromMs` in `packages/timing-engine/src/index.ts`
- [ ] T012a [P] Write failing contract tests for hash-based routing skeleton: all five routes (`/`, `/recipes`, `/meal-plans`, `/timer/:sessionId`, `/settings`) render without crashing and show a placeholder heading in `apps/pwa/tests/routing.test.tsx`
- [ ] T012b [P] Write failing contract test for Dexie schema: tables `recipes`, `mealPlans`, `liveSessions`, `settings` can be opened and a write+read round-trip succeeds (uses `fake-indexeddb`) in `apps/pwa/tests/storage/db-schema.test.ts`
- [ ] T013 [P] Implement React Router v7 hash-based routing skeleton (routes: `/`, `/recipes`, `/meal-plans`, `/timer/:sessionId`, `/settings`) in `apps/pwa/src/main.tsx`
- [ ] T014 [P] Implement Bootstrap 5 navigation + layout shell in `apps/pwa/src/components/Layout/Layout.tsx`
- [ ] T015 [P] Create Dexie.js schema stub with table declarations for `recipes`, `mealPlans`, `liveSessions`, `settings` in `apps/pwa/src/storage/db.ts`

**Checkpoint**: `pnpm turbo test --filter=@kitchensync/timing-engine` passes; T012a routing tests pass; T012b schema round-trip test passes; PWA dev server boots and all routes render placeholder pages.

---

## Phase 3: User Story 1 — Single-Dish Reverse Schedule (Priority: P1) 🎯 MVP

**Goal**: A cook enters ad-hoc steps (or a single-block component), sets a target time, and sees a Gantt (default) + list schedule recalculating instantly. Single-block dishes can be expanded inline with a diff label.

**Independent Test**: Add steps manually, set target time, verify start times per QS-US1-1 through QS-US1-4. No saved recipes required.

**Covers**: FR-001b, FR-002, FR-007, FR-008, FR-010, FR-011, FR-012a/b, FR-013, FR-014, FR-033.

### Tests for US1 (MUST FAIL before implementation — T016–T020)

- [ ] T016 [P] [US1] Write failing contract tests for `validateStep()` (valid step, blank name-when-required, zero duration, block step with no name/type) in `packages/meal-model/tests/step-validator.test.ts`
- [ ] T017 [P] [US1] Write failing contract tests for `scheduleDish()` (basic reverse calc, overrun detection, single-block step, `durationMinutes` on `StepEvent`) in `packages/scheduler/tests/schedule-dish.test.ts`
- [ ] T018 [P] [US1] Write failing contract tests for `GanttView` against `ScheduleViewProps` interface (lane-per-dish renders, proportional block widths, single-block dish, empty-state prompt, `viewMode` toggle) in `apps/pwa/tests/components/GanttView.test.tsx`
- [ ] T019 [P] [US1] Write failing contract tests for `StepForm` against `StepFormProps` interface (add, edit, remove, reorder steps; validation error display; disabled state) in `apps/pwa/tests/components/StepForm.test.tsx`
- [ ] T020 [P] [US1] Write failing contract tests for `BlockExpansion` against `BlockExpansionProps` interface (diff label matches `sum − originalEstimateMinutes`, `onExpand` called on confirm, `onCancel` called on discard) in `apps/pwa/tests/components/BlockExpansion.test.tsx`

### Implementation for US1

- [ ] T021 [US1] Implement `Step` type + `Dish` type + `validateStep()` (`durationMinutes` required; `name`/`type` required only when both present — block steps valid without them; `Dish` needed by `scheduleDish()` which accepts a `Dish` as input) in `packages/meal-model/src/index.ts`
- [ ] T022 [US1] Implement `WallClockTime` re-export + `validateWallClockTime()` in `packages/meal-model/src/index.ts`
- [ ] T023 [US1] Implement `scheduleDish()` (reverse-timing algorithm; populates `StepEvent.durationMinutes` and `isParallel`; sets `overrunMinutes`) in `packages/scheduler/src/index.ts`
- [ ] T024 [P] [US1] Implement `StepForm` component (add / edit / remove / reorder steps; runs `validateStep()` inline before calling `onChange`) in `apps/pwa/src/components/StepForm/StepForm.tsx`
- [ ] T025 [P] [US1] Implement `BlockExpansion` component (draft stage list via `StepForm`; running diff label vs `originalEstimateMinutes`; confirm / cancel) in `apps/pwa/src/components/BlockExpansion/BlockExpansion.tsx`
- [ ] T026 [US1] Implement `GanttView` component (pure-CSS lanes, proportional step blocks using `durationMinutes`, time-axis ruler, single-block and staged dishes, parallel badge) in `apps/pwa/src/components/GanttView/GanttView.tsx`
- [ ] T027 [US1] Implement `ScheduleView` wrapper (Gantt/list toggle; delegates to `GanttView` or chronological list renderer; empty-state prompt when `schedule` is null) in `apps/pwa/src/components/ScheduleView/ScheduleView.tsx`
- [ ] T028 [US1] Implement `OverrunWarning` banner component in `apps/pwa/src/components/OverrunWarning/OverrunWarning.tsx`
- [ ] T029 [US1] Implement `PlannerPage` (ad-hoc step entry via `StepForm`, target-time input, live `scheduleDish()` recalculation on every change, `ScheduleView`, `OverrunWarning`, `BlockExpansion` panel on single-block lane tap) in `apps/pwa/src/pages/PlannerPage.tsx`

**Checkpoint**: QS-US1-1 through QS-US1-4 pass. Schedule correct, Gantt renders with proportional blocks, list toggle works, inline expansion shows diff, overrun warning fires.

---

## Phase 4: User Story 2 — Create and Save a Recipe (Priority: P2)

**Goal**: A cook creates a named recipe with ordered steps, saves it to IndexedDB, reloads the app, and loads the recipe into a planning session with all steps intact and isolated.

**Independent Test**: Create recipe → save → page refresh → load into planner → verify steps/durations unchanged (QS-US2-1 through QS-US2-4). Depends on US1 planner existing to load into.

**Covers**: FR-001a, FR-002, FR-003, FR-004, FR-005, FR-006, FR-009, FR-025.

### Tests for US2 (MUST FAIL before implementation — T030–T033)

- [ ] T030 [P] [US2] Write failing contract tests for `validateRecipe()` (name required, at least one step, nested `validateStep()` applied to each step) in `packages/meal-model/tests/recipe-validator.test.ts`
- [ ] T031 [P] [US2] Write failing `RecipeRepository` contract tests (CRUD: `create`, `update`, `getAll`, `getById`, `delete`; uses `fake-indexeddb`) in `apps/pwa/tests/storage/recipe-repository.test.ts`
- [ ] T032 [P] [US2] Write failing contract tests for `RecipeEditor` against `RecipeEditorProps` (create mode blank, edit mode pre-filled, `onSave` called with validated `Recipe`, `onCancel`) in `apps/pwa/tests/components/RecipeEditor.test.tsx`
- [ ] T033 [P] [US2] Write failing contract tests for `RecipeLibrary` against `RecipeLibraryProps` (renders list, empty-state message, `onSelect`, `onDelete`) in `apps/pwa/tests/components/RecipeLibrary.test.tsx`

### Implementation for US2

- [ ] T034 [US2] Implement `Recipe` type + `validateRecipe()` in `packages/meal-model/src/index.ts` (`Dish` type was implemented in T021)
- [ ] T034a [P] [US2] Write failing contract tests for `deserializeRecipe()` schema guard (valid recipe passes, missing fields rejected, nested steps validated, unknown fields stripped) in `packages/meal-model/tests/deserialize.test.ts`
- [ ] T034b [P] [US2] Implement `deserializeRecipe()` schema guard in `packages/meal-model/src/index.ts`; apply inside `RecipeRepository.getAll()` and `getById()` (Principle III — every IndexedDB read validated) in `apps/pwa/src/storage/recipe-repository.ts`
- [ ] T035 [US2] Implement `RecipeRepository` (Dexie CRUD: `create`, `update`, `getAll`, `getById`, `delete`) in `apps/pwa/src/storage/recipe-repository.ts`
- [ ] T036 [P] [US2] Implement `RecipeEditor` component (create / edit mode, `StepForm` integration, `validateRecipe()` before `onSave`) in `apps/pwa/src/components/RecipeEditor/RecipeEditor.tsx`
- [ ] T037 [P] [US2] Implement `RecipeLibrary` component (list of saved recipes, empty-state, select + delete actions) in `apps/pwa/src/components/RecipeLibrary/RecipeLibrary.tsx`
- [ ] T038 [US2] Implement `RecipesPage` (list via `RecipeLibrary`, create/edit via `RecipeEditor` modal/panel, delete with confirmation) in `apps/pwa/src/pages/RecipesPage.tsx`
- [ ] T039 [US2] Wire recipe-load into `PlannerPage`: load from library → snapshot into `Dish` (independent copy; session edits do NOT propagate to saved recipe) in `apps/pwa/src/pages/PlannerPage.tsx`
- [ ] T039a [US2] Add "Save as Recipe" affordance to `PlannerPage` (FR-009): button opens `RecipeEditor` pre-filled with current ad-hoc steps; on confirm calls `RecipeRepository.create()` and shows confirmation (contract coverage provided by existing T032 `RecipeEditor` tests) in `apps/pwa/src/pages/PlannerPage.tsx`

**Checkpoint**: QS-US2-1 through QS-US2-4 pass. Recipe persists across page refresh; session copy is isolated from source recipe.

---

## Phase 5: User Story 3 — Multi-Dish Meal Planning (Priority: P3)

**Goal**: A cook assembles multiple dishes (from library or ad-hoc) into a meal plan, sets one shared target time, and receives a unified Gantt schedule across all dishes with parallel-step indicators.

**Independent Test**: Two dishes + target time → unified schedule with correct per-dish start times and parallel indicators (QS-US3-1 through QS-US3-5). Depends on US1 scheduler and US2 recipe types.

**Covers**: FR-015, FR-016, FR-017, FR-018, FR-019, FR-020.

### Tests for US3 (MUST FAIL before implementation — T040–T043)

- [ ] T040 [P] [US3] Write failing contract tests for `validateMealPlan()` (at least one dish, name required, dish `displayName` uniqueness auto-suffix rule) in `packages/meal-model/tests/meal-plan-validator.test.ts`
- [ ] T041 [P] [US3] Write failing contract tests for `scheduleMealPlan()` (multi-dish chronological ordering, `isParallel` flagging for simultaneous start times, shared `targetTime`) in `packages/scheduler/tests/schedule-meal-plan.test.ts`
- [ ] T042 [P] [US3] Write failing `MealPlanRepository` contract tests (`save`, `getAll`, `getById`, `delete`; uses `fake-indexeddb`) in `apps/pwa/tests/storage/meal-plan-repository.test.ts`
- [ ] T043 [P] [US3] Write failing contract tests for `MealPlanEditor` against `MealPlanEditorProps` (target-time field, add-from-library, add-ad-hoc, remove dish, `onChange`) in `apps/pwa/tests/components/MealPlanEditor.test.tsx`

### Implementation for US3

- [ ] T044 [US3] Implement `MealPlan` type + `validateMealPlan()` (dish `displayName` auto-suffix on duplicate) in `packages/meal-model/src/index.ts`
- [ ] T044a [P] [US3] Write failing contract tests for `deserializeMealPlan()` schema guard (valid plan passes, missing fields rejected, nested dish and step validation applied) in `packages/meal-model/tests/deserialize.test.ts`
- [ ] T044b [P] [US3] Implement `deserializeMealPlan()` schema guard in `packages/meal-model/src/index.ts`; apply inside `MealPlanRepository.getAll()` and `getById()` (Principle III) in `apps/pwa/src/storage/meal-plan-repository.ts`
- [ ] T045 [US3] Implement `scheduleMealPlan()` (calls `scheduleDish()` per dish, merges + sorts all `StepEvent`s, flags `isParallel`) in `packages/scheduler/src/index.ts`
- [ ] T046 [US3] Implement `MealPlanRepository` (Dexie CRUD: `save`, `getAll`, `getById`, `delete`) in `apps/pwa/src/storage/meal-plan-repository.ts`
- [ ] T047 [US3] Implement `MealPlanEditor` component (shared target-time field, dish list with add-from-library + add-ad-hoc + remove, `onChange`) in `apps/pwa/src/components/MealPlanEditor/MealPlanEditor.tsx`
- [ ] T048 [US3] Implement `MealPlanPage` (create/edit via `MealPlanEditor`, live `scheduleMealPlan()` recalculation, `ScheduleView` Gantt with parallel badges, `OverrunWarning`) in `apps/pwa/src/pages/MealPlanPage.tsx`

**Checkpoint**: QS-US3-1 through QS-US3-5 pass. Unified Gantt shows all dish lanes; parallel steps show badge; target-time and dish changes recalculate immediately.

---

## Phase 6: User Story 4 — Live Countdown Timer (Priority: P4)

**Goal**: A cook starts a live session from any schedule, receives alarms at each step's start time, confirms starts, applies cascading delays at step/dish/meal scope, sees the updated effective meal completion time, and returns to a session that survived navigation.

**Independent Test**: Generate any schedule → start session → alarm fires → confirm start → apply delay → verify cascade + updated completion time (QS-US4-1 through QS-US4-9).

**Covers**: FR-021, FR-022, FR-023, FR-024, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032.

### Tests for US4 (MUST FAIL before implementation — T049–T056)

- [ ] T049 [P] [US4] Write failing contract tests for `createLiveSession()` + `tickSession()` (session initialized with all steps pending; tick emits `SOUND_ALARM` at due time, `SHOW_OVERDUE` past due) in `packages/alarm-scheduler/tests/session-lifecycle.test.ts`
- [ ] T050 [P] [US4] Write failing contract tests for `confirmStepStarted()` (pending → started, overdue → started, no-op if already started, emits `DISMISS_ALARM`) in `packages/alarm-scheduler/tests/confirm-step.test.ts`
- [ ] T051 [P] [US4] Write failing contract tests for `applyStepDelay()`, `applyDishDelay()`, `applyMealDelay()`, `computeEffectiveMealEnd()`, `acceptNewTargetTime()` (cascade rules; started steps skipped; two-phase `effectiveTargetTime` commit) in `packages/alarm-scheduler/tests/delay.test.ts`
- [ ] T052 [P] [US4] Write failing contract tests for `setAlarmOverride()`, `resolveAlarmEnabled()`, `deserializeLiveSession()`, `deserializeAlarmConfig()` (override chain: step > dish > meal > global; schema guards reject invalid data) in `packages/alarm-scheduler/tests/alarm-override.test.ts`
- [ ] T053 [P] [US4] Write failing `LiveSessionRepository` contract tests (`save` persists; `load()` restores through `deserializeLiveSession` schema guard; `clear()` removes session; uses `fake-indexeddb`) in `apps/pwa/tests/storage/live-session-repository.test.ts`
- [ ] T054 [P] [US4] Write failing contract tests for `TimerView` against `TimerViewProps` (renders step countdown, alarm-prompt overlay, confirm button, two-phase accept banner, delay controls) in `apps/pwa/tests/components/TimerView.test.tsx`
- [ ] T055 [P] [US4] Write failing contract tests for `DelayControls` against `DelayControlsProps` (+1/+5/+10 buttons call `onApplyDelay` with correct scope, `targetId`, and amount) in `apps/pwa/tests/components/DelayControls.test.tsx`
- [ ] T056 [P] [US4] Write failing contract tests for `AlarmToggleControls` against `AlarmToggleControlsProps` (renders current override state; `onSetAlarmOverride` called with correct scope and `targetId`) in `apps/pwa/tests/components/AlarmToggleControls.test.tsx`

### Implementation for US4 — Library

- [ ] T057 [US4] Implement `createLiveSession()` + `tickSession()` (`SOUND_ALARM`, `SHOW_OVERDUE`, `DISMISS_ALARM` command emission; alarm resolution via `resolveAlarmEnabled`) in `packages/alarm-scheduler/src/index.ts`
- [ ] T058 [US4] Implement `confirmStepStarted()` (status transition, `DISMISS_ALARM` command) in `packages/alarm-scheduler/src/index.ts`
- [ ] T059 [US4] Implement `applyStepDelay()`, `applyDishDelay()`, `applyMealDelay()`, `computeEffectiveMealEnd()`, `acceptNewTargetTime()` (cascade; `UPDATE_DISPLAY` command; two-phase commit) in `packages/alarm-scheduler/src/index.ts`
- [ ] T060 [US4] Implement `setAlarmOverride()` (upsert) + `resolveAlarmEnabled()` (step > dish > meal > global chain) in `packages/alarm-scheduler/src/index.ts`
- [ ] T061 [US4] Implement `deserializeLiveSession()` + `deserializeAlarmConfig()` schema guards (validate every IndexedDB read; return `{ ok: false, errors }` on invalid data) in `packages/alarm-scheduler/src/index.ts`

### Implementation for US4 — Storage + Infrastructure

- [ ] T062 [P] [US4] Implement drift-corrected timer Web Worker (sends `{ type: 'TICK', nowMs: number }` each second using `performance.now()` correction) in `apps/pwa/src/workers/timer.worker.ts`
- [ ] T063 [US4] Implement `LiveSessionRepository` (Dexie: `save`, `load`, `clear`; snapshots on every write; `load()` applies `deserializeLiveSession` guard per contract) in `apps/pwa/src/storage/live-session-repository.ts`
- [ ] T064 [P] [US4] Implement `SettingsRepository` (Dexie singleton `AlarmConfiguration`: `get`, `save`; applies `deserializeAlarmConfig` on every read) in `apps/pwa/src/storage/settings-repository.ts`

### Implementation for US4 — Components, Hooks, Pages

- [ ] T065 [P] [US4] Implement `DelayControls` component (+1/+5/+10 min buttons, `onApplyDelay` with step/dish/meal scope) in `apps/pwa/src/components/DelayControls/DelayControls.tsx`
- [ ] T066 [P] [US4] Implement `AlarmToggleControls` component (on/off toggles; reads resolved alarm state from `session.alarmOverrides`) in `apps/pwa/src/components/AlarmToggleControls/AlarmToggleControls.tsx`
- [ ] T067 [US4] Implement `TimerView` component (per-step countdown, alarm-prompt overlay, "Started" confirm button, `DelayControls` + `AlarmToggleControls` per step, proposed-target accept banner) in `apps/pwa/src/components/TimerView/TimerView.tsx`
- [ ] T068 [US4] Implement `useTimer` hook (manages Web Worker lifecycle; calls `tickSession` on each tick; persists snapshot to `LiveSessionRepository` on every state change) in `apps/pwa/src/hooks/useTimer.ts`
- [ ] T069 [P] [US4] Implement `useAlarm` hook (`AudioContext` oscillator beep; lazy-resume after first user gesture; silent when alarm disabled) in `apps/pwa/src/hooks/useAlarm.ts`
- [ ] T070 [US4] Implement `TimerPage` (creates `LiveSession` from schedule; restores from `LiveSessionRepository` on page reload; drives `useTimer` + `useAlarm` + `TimerView`) in `apps/pwa/src/pages/TimerPage.tsx`
- [ ] T070a [P] [US4] Write failing contract tests for `AlarmSettingsPage` against `AlarmSettingsPageProps` (renders current `defaultEnabled` toggle, `onSave` called with toggled config) in `apps/pwa/tests/components/AlarmSettingsPage.test.tsx`
- [ ] T071 [US4] Implement `AlarmSettingsPage` (reads/writes `AlarmConfiguration` via `SettingsRepository`; controls global default alarm state) in `apps/pwa/src/pages/AlarmSettingsPage.tsx`

**Checkpoint**: QS-US4-1 through QS-US4-9 pass. Alarm fires at step time, confirm dismisses it, delay cascades correctly, session survives navigation, overdue steps flagged.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: PWA offline capability, iOS quirks, performance validation, E2E smoke tests, documentation.

- [ ] T072 [P] Configure `generateSW` service worker (offline precache + runtime caching for hash routes) in `apps/pwa/vite.config.ts`
- [ ] T073 [P] Apply iOS Safari PWA quirk fixes (`viewport-fit=cover`, `apple-mobile-web-app-capable`, safe-area insets) in `apps/pwa/index.html`, `apps/pwa/src/components/Layout/Layout.tsx`
- [ ] T074 [P] Verify duplicate Dish display-name auto-disambiguation ("`Chicken`" → "`Chicken #2`") is enforced in `apps/pwa/src/storage/meal-plan-repository.ts` on create/update (logic in `validateMealPlan` was implemented in T044; this task ensures the repository layer also enforces it)
- [ ] T075 [P] Write Playwright E2E smoke tests for QS-US1-1, QS-US2-1, QS-US3-1, QS-US4-2 in `apps/pwa/tests/e2e/`
- [ ] T076 Manual quickstart.md walkthrough — run scenarios QS-US1-1 through QS-US4-9 against built PWA; record pass/fail results in `specs/001-reverse-timing/quickstart.md`
- [ ] T077 [P] TSDoc audit — verify all public exports in `packages/*/src/index.ts` carry TSDoc comments (Principle IV)
- [ ] T078 [P] Run `pnpm turbo build` and resolve all TypeScript strict-mode errors across all packages and `apps/pwa`
- [ ] T079 [P] Performance spot-check: measure `scheduleDish()` on a 20-step dish (must be < 16 ms per SC-003/SC-004); verify alarm trigger latency in `TimerPage` (within ±1 s per SC-008)

**Checkpoint**: App installs as PWA, works fully offline, all quickstart scenarios pass, build is clean, no TSDoc gaps.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 only — no other story dependency
- **Phase 4 (US2)**: Depends on Phase 3 (T039 extends `PlannerPage` with recipe loading)
- **Phase 5 (US3)**: Depends on Phase 3 + Phase 4 (`scheduleMealPlan` builds on `scheduleDish`; meal plan uses `Recipe`/`Dish` types from US2)
- **Phase 6 (US4)**: Depends on Phase 3 minimum; Phase 5 recommended for full multi-dish timer test coverage
- **Phase 7 (Polish)**: Depends on all story phases complete

### User Story Dependencies

| Story | Depends On | Reason |
|-------|-----------|--------|
| US1 (P1) | Phase 2 | Pure scheduling — no story deps |
| US2 (P2) | US1 | Recipe loading wires into `PlannerPage` (T039) |
| US3 (P3) | US1 + US2 | `scheduleMealPlan` uses `scheduleDish`; `MealPlan` contains `Dish`/`Recipe` types |
| US4 (P4) | US1 | Timer sessions derive from a `Schedule`; US3 adds multi-dish coverage |

### Within Each Phase

1. Write ALL test tasks for the phase — confirm every test FAILS (TDD — non-negotiable)
2. Library/model tasks before PWA consumer tasks
3. Storage tasks before hook/page tasks
4. Components (`[P]` where eligible) before hooks before pages
5. Complete one story phase fully before beginning the next

### Parallel Opportunities

| Phase | Parallel group |
|-------|---------------|
| Phase 1 | T002–T005 (package scaffolds), T007–T008 (tooling), T010 (icons) |
| Phase 2 | T013–T015 (PWA skeleton) — parallel to T011/T012 (timing-engine) |
| Phase 3 | T016–T020 (all US1 tests); T024–T025 (StepForm ∥ BlockExpansion); T028 → T029 (OverrunWarning must precede PlannerPage) |
| Phase 4 | T030–T033 (all US2 tests); T036–T037 (RecipeEditor ∥ RecipeLibrary) |
| Phase 5 | T040–T043 (all US3 tests) |
| Phase 6 | T049–T056 (all US4 tests); T062 ∥ T064 (Worker ∥ SettingsRepo); T065 ∥ T066 (DelayControls ∥ AlarmToggleControls); T068 ∥ T069 (useTimer ∥ useAlarm) |
| Phase 7 | T072–T075, T077–T079 (all independent) |

---

## Parallel Execution Example: Phase 3 (US1) Tests

```bash
# All five US1 contract tests can be dispatched simultaneously.
# Every one MUST report FAILING before any implementation task begins.

T016  packages/meal-model/tests/step-validator.test.ts
T017  packages/scheduler/tests/schedule-dish.test.ts
T018  apps/pwa/tests/components/GanttView.test.tsx
T019  apps/pwa/tests/components/StepForm.test.tsx
T020  apps/pwa/tests/components/BlockExpansion.test.tsx

# After all 5 fail → implementation sequence:
T021 → T022  (meal-model: Step + WallClockTime)
T023         (scheduler: scheduleDish)
T024 ∥ T025  (StepForm ∥ BlockExpansion — different files)
T026 → T027  (GanttView → ScheduleView)
T028 → T029  (OverrunWarning before PlannerPage — PlannerPage imports OverrunWarning)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: User Story 1 (tests first, then implementation)
4. **STOP and VALIDATE**: Run QS-US1-1 through QS-US1-4 manually in browser
5. App is a working single-dish scheduler with Gantt + list views — independently deployable

### Incremental Delivery

| Milestone | Phases | Delivered Capability |
|-----------|--------|---------------------|
| MVP | 1–3 | Ad-hoc single-dish reverse schedule (Gantt + list + block expansion) |
| Recipe Library | 1–4 | Save/load/edit/delete named recipes |
| Meal Planner | 1–5 | Multi-dish unified Gantt schedule |
| Full App | 1–6 | Live countdown timer + alarms + delays |
| Shipped | 1–7 | Installable PWA, offline, Playwright-tested, performance-validated |

---

## Task Summary

| Phase | Tasks | Story | Key Deliverable |
|-------|-------|-------|----------------|
| 1: Setup | T001–T010 | — | Monorepo scaffold, tooling |
| 2: Foundation | T011–T015 + T012a, T012b | — | `timing-engine`, PWA shell (+ routing + schema tests) |
| 3: US1 | T016–T029 | US1 | Single-dish Gantt scheduler + block expansion |
| 4: US2 | T030–T039 + T034a, T034b, T039a | US2 | Recipe create/save/load + `deserializeRecipe` guard |
| 5: US3 | T040–T048 + T044a, T044b | US3 | Multi-dish meal planner + `deserializeMealPlan` guard |
| 6: US4 | T049–T071 + T070a | US4 | Live timer + alarms + delays + AlarmSettingsPage test |
| 7: Polish | T072–T079 | — | PWA offline, E2E, perf |
| **Total** | **87** | | |

---

## Notes

- `[P]` tasks = different files, no dependency on any incomplete task in the same phase
- `[Story]` label maps every task to a specific user story for full traceability
- Every story phase is independently completable and testable before the next begins
- Commit after each logically complete task or small group
- **Never mark a test task complete until the test is running and confirmed FAILING**
- **Never mark an implementation task complete until the previously-written test PASSES**
- Tests are immutable once passing — do not modify a passing test (Constitution Principle II)
- **`useSchedule` hook**: No separate hook is needed. Schedule recalculation state (`scheduleDish` / `scheduleMealPlan` results) is managed inline in `PlannerPage` (T029) and `MealPlanPage` (T048) via `useState` + `useEffect`. The `apps/pwa/src/store/` directory referenced in plan.md is not required for v1; state lives in page-level hooks. Do not create a Zustand store unless a cross-page state sharing need emerges during implementation.
