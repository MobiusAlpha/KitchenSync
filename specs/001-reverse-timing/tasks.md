# Tasks: Reverse-Timing Cooking Scheduler

**Input**: Design documents from `/specs/001-reverse-timing/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: TDD is **MANDATORY** per the KitchenSync constitution (Principle II). Test tasks
MUST appear before their corresponding implementation tasks, MUST be written and confirmed
failing before implementation begins, and MUST target contracts/abstractions — not concrete types.
Tests are immutable once passing.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. The monorepo uses **pnpm workspaces + Turborepo** with four library
packages (`timing-engine`, `meal-model`, `scheduler`, `alarm-scheduler`) and one PWA app.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialise the monorepo, scaffold all packages and the PWA app, and configure
shared tooling. No business logic. Must complete before any Phase 2 work.

- [ ] T001 Initialise pnpm workspace root with package.json (private, engines: node ≥20), pnpm-workspace.yaml (packages: ["packages/*","apps/*"]), and .npmrc (shamefully-hoist=false)
- [ ] T002 Configure Turborepo pipeline in turbo.json (tasks: build → test → lint, with correct dependency declarations between packages)
- [ ] T003 [P] Scaffold packages/timing-engine: package.json (@kitchensync/timing-engine, type:module), tsconfig.json (strict, moduleResolution:bundler), vitest.config.ts, src/index.ts (empty export)
- [ ] T004 [P] Scaffold packages/meal-model: package.json (@kitchensync/meal-model, type:module, peerDeps: @kitchensync/timing-engine), tsconfig.json (paths: @kitchensync/timing-engine → ../../timing-engine/src/index.ts for local dev), vitest.config.ts, src/index.ts (empty export)
- [ ] T005 [P] Scaffold packages/scheduler: package.json (@kitchensync/scheduler, type:module, peerDeps: timing-engine + meal-model), tsconfig.json, vitest.config.ts, src/index.ts (empty export)
- [ ] T006 [P] Scaffold packages/alarm-scheduler: package.json (@kitchensync/alarm-scheduler, type:module, peerDeps: timing-engine + meal-model + scheduler), tsconfig.json, vitest.config.ts, src/index.ts (empty export)
- [ ] T007 Scaffold apps/pwa using Vite + React 19 + TypeScript template: vite.config.ts (defineConfig with @vitejs/plugin-react), tsconfig.json + tsconfig.app.json (strict, moduleResolution:bundler, types:["vite/client","vite-plugin-pwa/client"]) + tsconfig.node.json, apps/pwa/package.json
- [ ] T008 Add workspace package dependencies to apps/pwa/package.json: @kitchensync/* (workspace:*), react@19, react-dom@19, bootstrap@5, react-bootstrap, dexie, react-router (v7), zustand; devDeps: vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/user-event, jsdom, fake-indexeddb (required to run Dexie.js inside Vitest/Node for repository tests — T031, T044, T061), vite-plugin-pwa, @vite-pwa/assets-generator, @types/react, @types/react-dom
- [ ] T009 [P] Configure root ESLint (eslint.config.js) with typescript-eslint strict rules, react-hooks plugin, and no-restricted-imports rule banning cross-package internal imports
- [ ] T010 Configure vite-plugin-pwa in apps/pwa/vite.config.ts: strategy generateSW, registerType autoUpdate, navigateFallback /index.html, glob asset patterns, manifest with name/short_name/display:standalone/theme_color/icons
- [ ] T011 [P] Generate PWA icon set (192×192 any, 512×512 any, 512×512 maskable) using @vite-pwa/assets-generator from a source SVG in apps/pwa/public/icons/

**Checkpoint**: All packages build with `turbo build`; `pnpm install` resolves without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, validators, timing primitives, database schema, and app shell.
All user stories depend on these. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests (write first — MUST FAIL before implementation)

> **NOTE: Write these tests FIRST, run them, confirm they FAIL, then implement.**

- [ ] T012 [P] Write failing unit tests for TimingEngine contract: subtractMinutes (midnight wrap), addMinutes (next-day wrap), differenceMinutes (cross-midnight path), formatWallClockTime (zero-padding), parseWallClockTime (invalid input → null) in packages/timing-engine/tests/timing-engine.test.ts — test against the TimingEngine interface, not the implementation
- [ ] T013 [P] Write failing unit tests for meal-model validators: validateStep (blank name, zero duration, invalid type), validateRecipe (no steps, blank name), validateMealPlan (no dishes, invalid WallClockTime), validateWallClockTime (out-of-range hour/minute) — all paths returning ValidationResult in packages/meal-model/tests/validators.test.ts

### Implementation

- [ ] T014 Implement WallClockTime interface in packages/timing-engine/src/types.ts and export from packages/timing-engine/src/index.ts; implement StepType union in packages/meal-model/src/types.ts; re-export WallClockTime from packages/meal-model/src/index.ts (import from @kitchensync/timing-engine) so consumers can import either package
- [ ] T015 Implement Step, Recipe, Dish, MealPlan entity interfaces in packages/meal-model/src/entities.ts; export from src/index.ts
- [ ] T016 Implement ValidationError and ValidationResult types plus validateStep, validateRecipe, validateMealPlan, validateWallClockTime validators in packages/meal-model/src/validators.ts; export from src/index.ts
- [ ] T017 Implement TimingEngine: subtractMinutes, addMinutes, differenceMinutes, formatWallClockTime, parseWallClockTime in packages/timing-engine/src/index.ts; export the TimingEngine facade object
- [ ] T018 Configure Dexie.js database class with tables: recipes (id, name, description, steps, createdAt, updatedAt), mealPlans (id, name, targetTime, dishes, createdAt, updatedAt), liveSessions (id), alarmConfig (id) in apps/pwa/src/storage/db.ts
- [ ] T019 Implement SettingsRepository (singleton AlarmConfiguration read/write) in apps/pwa/src/storage/SettingsRepository.ts: on read, pass raw IndexedDB data through alarmScheduler.deserializeAlarmConfig(); return the default config {id:'global', defaultEnabled:true} if the result is ok:false or no record exists; do NOT implement a schema guard inline (Principle I — the guard belongs in the alarm-scheduler library)
- [ ] T020 Set up React Router v7 hash-based routing with page stubs and route constants in apps/pwa/src/main.tsx and apps/pwa/src/App.tsx
- [ ] T021 Implement Bootstrap 5 app shell layout (fixed top navbar, main content region, bottom nav for mobile) in apps/pwa/src/components/AppShell.tsx

**Checkpoint**: `turbo test --filter=@kitchensync/timing-engine --filter=@kitchensync/meal-model` passes; Dexie schema initialises without errors in browser.

---

## Phase 3: User Story 1 — Single-Dish Reverse Schedule (Priority: P1) 🎯 MVP

**Goal**: A cook enters ad-hoc steps with durations, sets a "ready by" time, and receives an
instantly-calculated, reverse-ordered step schedule. Any change to a duration or target time
recalculates immediately. Past-target and empty-step edge cases are handled.

**Independent Test**: Add three ad-hoc steps (20 min Prep, 45 min Cook, 10 min Rest), set
target 19:00 — verify schedule shows Rest 18:50, Cook 18:05, Prep 17:45. Change Prep to
30 min — verify Prep shifts to 17:35 without any user action.

### Tests for User Story 1 (MANDATORY — write and confirm failing first)

- [ ] T022 [P] [US1] Write failing contract tests for scheduleDish: correct reverse-order start times, determinism (SC-003), zero-step dish rejected, overrunMinutes populated when earliest start is in past, and overrunMinutes null when on-time in packages/scheduler/tests/schedule-dish.test.ts — test against the ScheduleDish interface
- [ ] T023 [P] [US1] Write failing component tests for StepForm: renders empty state, add step (name + type + duration), inline validation (blank name rejected, zero duration rejected), reorder steps via drag or up/down buttons, remove step, edit existing step in apps/pwa/tests/components/StepForm.test.tsx
- [ ] T024 [P] [US1] Write failing component tests for ScheduleView (single-dish mode): renders each StepEvent with dish name + step name + type + formatted start time, renders OverrunWarning when overrunMinutes > 0, renders empty-state prompt when no events in apps/pwa/tests/components/ScheduleView.test.tsx

### Implementation for User Story 1

- [ ] T025 [US1] Implement scheduleDish function (reverse cumulative subtraction, overrunMinutes calculation, ascending sort) in packages/scheduler/src/schedule-dish.ts; export Scheduler facade from packages/scheduler/src/index.ts
- [ ] T026 [US1] Implement StepForm component (controlled step list, add/edit/remove/reorder, inline validation via validateStep contract) in apps/pwa/src/components/StepForm.tsx
- [ ] T027 [US1] Implement OverrunWarning component (highlighted banner with overrun duration) in apps/pwa/src/components/OverrunWarning.tsx
- [ ] T028 [US1] Implement ScheduleView component (renders StepEvent list in ascending startTime order with type badge and formatted time; accepts Schedule prop; shows OverrunWarning when overrunMinutes > 0) in apps/pwa/src/components/ScheduleView.tsx
- [ ] T029 [US1] Implement useSchedule hook (takes steps + targetTime state, calls scheduleDish, returns Schedule; recalculates on every input change via useMemo/useEffect) in apps/pwa/src/hooks/useSchedule.ts
- [ ] T030 [US1] Implement PlannerPage (target time input, StepForm, ScheduleView wired via useSchedule; no-steps guard; past-target warning from overrunMinutes) in apps/pwa/src/pages/PlannerPage.tsx

**Checkpoint**: US1 fully functional and independently testable. `turbo test --filter=@kitchensync/scheduler` passes. A cook can generate a correct single-dish reverse schedule from the browser with zero saved data.

---

## Phase 4: User Story 2 — Create and Save a Recipe (Priority: P2)

**Goal**: A cook creates a named recipe with ordered steps, saves it to IndexedDB, reloads
the app, and loads the recipe into a timing session with all steps and durations intact.
Edit and delete flows also work.

**Independent Test**: Create "Roast Chicken" with four steps, save, reload app, load recipe
into a planning session, verify all four steps and durations are intact and produce the
correct reverse schedule. Edit a step duration, save, verify updated duration is used in
the next session. Delete recipe, verify it disappears from the list.

### Tests for User Story 2 (MANDATORY — write and confirm failing first)

- [ ] T031 [P] [US2] Write failing unit tests for RecipeRepository: create (persists to IndexedDB, sets createdAt/updatedAt), update (updates updatedAt, preserves createdAt), delete (removes entry), getAll (returns all recipes), getById (returns correct recipe, returns null for missing id) in apps/pwa/tests/storage/RecipeRepository.test.ts — test via the RecipeRepository interface, mock Dexie using fake-indexeddb
- [ ] T032 [P] [US2] Write failing component tests for RecipeEditor: renders blank form for new recipe, pre-fills form for existing recipe, name validation (blank rejected), requires ≥1 step to save, save calls onSave callback with validated Recipe, cancel calls onCancel in apps/pwa/tests/components/RecipeEditor.test.tsx
- [ ] T033 [P] [US2] Write failing component tests for RecipeLibrary: renders empty-state message when no recipes, renders recipe list with names, delete button calls onDelete with recipe id, select button calls onSelect with recipe in apps/pwa/tests/components/RecipeLibrary.test.tsx

### Implementation for User Story 2

- [ ] T034 [US2] Implement RecipeRepository (Dexie.js CRUD: create assigns UUID + timestamps, update refreshes updatedAt, delete, getAll, getById) in apps/pwa/src/storage/RecipeRepository.ts
- [ ] T035 [US2] Implement RecipeEditor component (controlled form: recipe name + StepForm; validates via validateRecipe before save; edit mode pre-fills from recipe prop) in apps/pwa/src/components/RecipeEditor.tsx
- [ ] T036 [US2] Implement RecipeLibrary component (list of saved recipes with load and delete actions; empty-state prompt; uses RecipeRepository) in apps/pwa/src/components/RecipeLibrary.tsx
- [ ] T037 [US2] Implement RecipesPage (recipe library + inline recipe editor; create/edit/delete flow) in apps/pwa/src/pages/RecipesPage.tsx
- [ ] T038 [US2] Add "Load Recipe" flow to PlannerPage: recipe picker modal or route param that pre-fills StepForm with the selected recipe's steps (session copy — does not mutate saved recipe) in apps/pwa/src/pages/PlannerPage.tsx
- [ ] T039 [US2] Add "Save as Recipe" action to PlannerPage: opens name input, calls RecipeRepository.create with current steps, navigates to RecipesPage on success in apps/pwa/src/pages/PlannerPage.tsx

**Checkpoint**: US2 independently functional. A cook can save, reload, load, edit, and delete recipes without any US3/US4 features.

---

## Phase 5: User Story 3 — Multi-Dish Meal Planning (Priority: P3)

**Goal**: A cook assembles multiple dishes (from saved recipes or ad-hoc) into a meal plan
with a single "ready by" time. The app produces a unified chronological schedule across all
dishes, flags parallel steps, and recalculates automatically when any dish is added, removed,
or when the target time changes.

**Independent Test**: Add "Roast Chicken" (90 min total) and "Roasted Vegetables" (40 min
total) with target 19:00. Verify Chicken Prep starts at 17:30, Veg Prep starts at 18:20,
and all steps appear in one chronological list. Remove one dish — verify schedule updates
immediately.

### Tests for User Story 3 (MANDATORY — write and confirm failing first)

- [ ] T040 [P] [US3] Write failing contract tests for scheduleMealPlan: correct per-dish reverse-timed start times, ascending sort across dishes, isParallel=true for overlapping cross-dish steps, isParallel=false for non-overlapping steps, single-dish meal plan produces same result as scheduleDish in packages/scheduler/tests/schedule-meal-plan.test.ts
- [ ] T041 [P] [US3] Write failing component tests for MealPlanEditor: add dish from recipe (populates step list), add ad-hoc dish (empty StepForm), rename dish, remove dish, duplicate dish name gets numeric suffix, target time change propagates to all dishes in apps/pwa/tests/components/MealPlanEditor.test.tsx
- [ ] T042 [P] [US3] Write failing component tests for ScheduleView multi-dish mode: parallel steps show visual indicator, all dishes' events appear in one list sorted by startTime, dish name shown on each row in apps/pwa/tests/components/ScheduleView.multi-dish.test.tsx

### Implementation for User Story 3

- [ ] T043 [US3] Implement scheduleMealPlan function (schedule each dish independently against shared targetTime, merge events, sort ascending, detect and flag isParallel) in packages/scheduler/src/schedule-meal-plan.ts; add scheduleMealPlan to Scheduler facade in packages/scheduler/src/index.ts
- [ ] T044 [US3] Implement MealPlanRepository (Dexie.js CRUD with duplicate displayName disambiguation on create/update) in apps/pwa/src/storage/MealPlanRepository.ts
- [ ] T045 [US3] Implement MealPlanEditor component (add dish via RecipeLibrary picker or ad-hoc inline StepForm, rename/remove dishes, target time field) in apps/pwa/src/components/MealPlanEditor.tsx
- [ ] T046 [US3] Extend ScheduleView to handle multi-dish Schedule: render parallel step indicator (e.g., "⇔ parallel" badge) when isParallel=true; display dish name column in apps/pwa/src/components/ScheduleView.tsx
- [ ] T047 [US3] Implement MealPlanPage (MealPlanEditor + ScheduleView unified view, save/load meal plan from MealPlanRepository, "Start Timer" button navigates to TimerPage) in apps/pwa/src/pages/MealPlanPage.tsx

**Checkpoint**: US3 independently functional on top of US1/US2. A cook can build a multi-dish meal plan and view a unified, correctly-ordered schedule.

---

## Phase 6: User Story 4 — Live Countdown Timer (Priority: P4)

**Goal**: A cook starts a live timer session from any schedule. The app counts down to each
step using a drift-corrected Web Worker timer. Alarms fire (Web Audio chime + OS notification)
at each step's scheduled start. The cook confirms start, which dismisses the alarm and marks
the step. Delays (+1/+5/+10 min) cascade correctly. The session survives navigation and page
reload. The alarm hierarchy (global → meal → dish → step) is fully respected.

**Independent Test**: Generate any valid schedule, start the live timer. At one step's
scheduled start time, verify the alarm chimes and a confirmation prompt appears. Confirm
the step — verify it is marked started. Apply a +5 min delay to a step — verify that step
and all subsequent unstarted steps in the same dish shift forward by 5 min and the effective
completion time updates. Navigate away and back — verify the timer has continued running.

### Tests for User Story 4 (MANDATORY — write and confirm failing first)

> **NOTE: alarm-scheduler tests are pure TS — no browser, no timers, no side effects.**
> The library emits commands; tests assert the returned command list.

- [ ] T048 [P] [US4] Write failing contract tests for AlarmScheduler core: createLiveSession initialises all steps as pending with correct scheduledStart times; tickSession returns SOUND_ALARM command when step is due and alarm enabled; tickSession returns SHOW_OVERDUE command when step is past due unconfirmed; tickSession is a no-op for started steps in packages/alarm-scheduler/tests/live-session.test.ts
- [ ] T049 [P] [US4] Write failing contract tests for delay cascade: applyStepDelay shifts target step and all subsequent unstarted steps in same dish by d minutes, does not affect started steps, does not affect other dishes; applyDishDelay shifts all unstarted steps in the dish; applyMealDelay shifts all unstarted steps across all dishes; all three return UPDATE_DISPLAY command with updated effectiveMealEnd in packages/alarm-scheduler/tests/delay-cascade.test.ts
- [ ] T050 [P] [US4] Write failing contract tests for alarm resolution: resolveAlarmEnabled returns step-level override if present (highest precedence), dish-level if no step override, meal-level if no dish override, global default if no overrides; setAlarmOverride upserts correctly at each scope in packages/alarm-scheduler/tests/alarm-resolution.test.ts
- [ ] T051 [P] [US4] Write failing contract tests for deserializeLiveSession: valid LiveSession round-trips ok:true; missing required field returns ok:false with descriptive error; corrupted scheduledStart field returns ok:false in packages/alarm-scheduler/tests/deserialization.test.ts
- [ ] T077 [P] [US4] Write failing contract tests for deserializeAlarmConfig: valid AlarmConfiguration {id:'global', defaultEnabled:true/false} round-trips ok:true; missing id field returns ok:false; id !== 'global' returns ok:false; non-boolean defaultEnabled returns ok:false; null/undefined input returns ok:false in packages/alarm-scheduler/tests/deserialization.test.ts (same file as T051)
- [ ] T052 [P] [US4] Write failing component tests for TimerView: renders step list with countdown, renders alarm prompt with step name and dish name when SOUND_ALARM command present, confirm-start button calls onConfirmStep, renders delay buttons (+1/+5/+10) at step/dish/meal scope, alarm toggle renders current state and calls onSetAlarmOverride in apps/pwa/tests/components/TimerView.test.tsx

### Implementation for User Story 4

- [ ] T053 [US4] Implement createLiveSession (initialises LiveSession from Schedule: maps StepEvents to LiveStepState[] with status pending, copies scheduledStart, sets startedAt/targetTime/effectiveTargetTime, totalDelayMinutes=0) in packages/alarm-scheduler/src/live-session.ts
- [ ] T054 [US4] Implement tickSession (compare each pending step's scheduledStart to nowMs-derived WallClockTime; emit SOUND_ALARM if due+alarm-enabled, SHOW_OVERDUE if overdue; transition status; return updated session + commands) in packages/alarm-scheduler/src/tick-session.ts
- [ ] T055 [US4] Implement confirmStepStarted (transition pending/overdue → started, set confirmedAt, return DISMISS_ALARM command) in packages/alarm-scheduler/src/confirm-step.ts
- [ ] T056 [US4] Implement applyStepDelay, applyDishDelay, applyMealDelay with cascade logic (skip started steps, compute effectiveMealEnd, emit UPDATE_DISPLAY command) in packages/alarm-scheduler/src/delay.ts
- [ ] T057 [US4] Implement setAlarmOverride (upsert AlarmOverride in session.alarmOverrides) and resolveAlarmEnabled (walk override chain step→dish→meal→global) in packages/alarm-scheduler/src/alarm-resolution.ts
- [ ] T058 [US4] Implement computeEffectiveMealEnd (max of scheduledStart + stepDuration across all non-started steps) in packages/alarm-scheduler/src/effective-meal-end.ts
- [ ] T059 [US4] Implement deserializeLiveSession schema guard (validate all required fields and shapes; return ok:true/false result — no throw) in packages/alarm-scheduler/src/deserialize.ts
- [ ] T078 [US4] Implement deserializeAlarmConfig schema guard (validate id === 'global', defaultEnabled is boolean; return ok:true/false — no throw) in packages/alarm-scheduler/src/deserialize.ts (same file as T059); export from packages/alarm-scheduler/src/index.ts and add to AlarmScheduler facade
- [ ] T060 [US4] Assemble AlarmScheduler facade (re-export all functions under the AlarmScheduler interface) in packages/alarm-scheduler/src/index.ts
- [ ] T061 [US4] Implement LiveSessionRepository (Dexie.js: save, load via deserializeLiveSession schema guard, clear) in apps/pwa/src/storage/LiveSessionRepository.ts
- [ ] T062 [US4] Implement timer.worker.ts Web Worker (drift-corrected self-correcting tick using performance.now(); responds to start/stop messages; posts {type:'tick', nowMs} each second) in apps/pwa/src/workers/timer.worker.ts
- [ ] T063 [US4] Implement useTimer hook (instantiates Worker on mount, subscribes to tick messages, calls AlarmScheduler.tickSession on each tick, persists session to LiveSessionRepository, exposes session state to UI) in apps/pwa/src/hooks/useTimer.ts — hook accepts a `stepDurations: ReadonlyMap<string, number>` parameter (stepId → durationMinutes from original Dish steps, built by the caller before mount — see T068); stores it in a ref and passes it to every alarmScheduler.computeEffectiveMealEnd call; must NOT attempt to derive durations from LiveSession (LiveSession does not store them by design)
- [ ] T064 [US4] Implement useAlarm hook (creates singleton AudioContext on first user gesture; plays three-note ascending chime on SOUND_ALARM command using OscillatorNode + exponential gain ramp; requests Notification permission once and calls registration.showNotification() on SOUND_ALARM) in apps/pwa/src/hooks/useAlarm.ts
- [ ] T065 [US4] Implement TimerView component (step list with countdown to each step, alarm prompt overlay on SOUND_ALARM, confirm-start button, per-step alarm toggle, delay buttons visible per step; receives session + commands from useTimer/useAlarm) in apps/pwa/src/components/TimerView.tsx
- [ ] T066 [US4] Implement DelayControls component (+1/+5/+10 min buttons, scope selector step/dish/meal; calls onApplyDelay callback with stepId/dishId/scope + delayMinutes) in apps/pwa/src/components/DelayControls.tsx
- [ ] T067 [US4] Implement AlarmToggleControls component (renders on/off toggle for meal scope, per-dish scope, and per-step scope; calls onSetAlarmOverride with scope + targetId + enabled) in apps/pwa/src/components/AlarmToggleControls.tsx
- [ ] T068 [US4] Implement TimerPage (starts session from Schedule via createLiveSession, mounts useTimer/useAlarm, renders TimerView + DelayControls + AlarmToggleControls; auto-resumes session from LiveSessionRepository on mount if one exists; clears session on explicit end) in apps/pwa/src/pages/TimerPage.tsx — before mounting useTimer, build `stepDurations: ReadonlyMap<string, number>` from the incoming Schedule source Dishes by mapping step.id → step.durationMinutes across all dishes; pass this map to useTimer (it cannot be derived from the Schedule's StepEvents, which do not carry duration)

**Checkpoint**: US4 fully functional. `turbo test --filter=@kitchensync/alarm-scheduler` passes. Live timer session survives page reload, alarms fire within ±1 s, delay cascade works at all three scopes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: PWA installability, settings page, edge case UI, performance budget, and
integration validation.

- [ ] T069 [P] Implement AlarmSettingsPage (global alarm default toggle reads/writes via SettingsRepository; link from navbar settings icon) in apps/pwa/src/pages/AlarmSettingsPage.tsx
- [ ] T070 [P] Add "effective meal completion time" display to TimerPage: reads effectiveTargetTime from LiveSession and re-renders on every UPDATE_DISPLAY command in apps/pwa/src/pages/TimerPage.tsx
- [ ] T071 [P] Add overrun warning to TimerPage: when cumulative delays push effectiveTargetTime past original targetTime, render a banner "⚠️ You will miss your original target by X min" in apps/pwa/src/pages/TimerPage.tsx
- [ ] T072 [P] Add duplicate dish name auto-disambiguation helper (appends " #2", " #3"…) to MealPlanEditor at dish-add time in apps/pwa/src/components/MealPlanEditor.tsx
- [ ] T073 [P] Validate schedule recalculation stays under 16 ms budget: add a Vitest bench test for scheduleMealPlan with 10 dishes × 20 steps in packages/scheduler/tests/scheduler.bench.ts
- [ ] T074 [P] Wire up React Router routes in apps/pwa/src/App.tsx: / (PlannerPage), /recipes (RecipesPage), /meal (MealPlanPage), /timer (TimerPage), /settings (AlarmSettingsPage); add install-prompt handler capturing beforeinstallprompt event
- [ ] T075 Validate all acceptance scenarios from spec.md pass end-to-end: manually step through each numbered scenario in US1–US4 acceptance criteria using the built PWA and document any gaps
- [ ] T076 Run full Turborepo pipeline (pnpm turbo build test lint) and resolve any TypeScript errors or lint warnings across all packages and apps/pwa

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — requires `timing-engine` + `meal-model` + `scheduler`
- **US2 (Phase 4)**: Depends on Phase 2 — requires `meal-model` validators + IndexedDB schema
- **US3 (Phase 5)**: Depends on Phase 2 + US1 (scheduleDish must exist before scheduleMealPlan can reuse it)
- **US4 (Phase 6)**: Depends on Phase 2 + US1 (schedule is the input to a live session) + alarm-scheduler package foundation
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies (within the session)

```
Phase 1 → Phase 2 → US1 → US3
                  ↘ US2 ↗
                  → US4 (uses US1 output as input)
```

US2 and US1 can be developed in parallel after Phase 2 is complete.
US3 needs scheduleMealPlan which extends the scheduler built in US1.
US4 needs any valid Schedule (from US1) as its session input.

### Package Build Order

```
timing-engine ──► meal-model ──┐
      │                        ├──► scheduler ──► alarm-scheduler
      └────────────────────────┘
```

Note: meal-model now depends on timing-engine (imports WallClockTime). Both meal-model and
timing-engine are listed as peerDeps of scheduler and alarm-scheduler.

### Within Each User Story

- TDD: test tasks MUST be written and confirmed failing before any implementation task in that story begins
- Tests target interfaces (TimingEngine, ScheduleDish, AlarmScheduler, etc.) — never concrete implementation classes
- Models/entities before services/repositories
- Library tasks before PWA component tasks
- Story complete (all tests passing) before beginning the next story

---

## Parallel Opportunities

### Phase 1 (T003–T006 are fully parallelisable)
```
T003 scaffold timing-engine    ─┐
T004 scaffold meal-model       ─┤─ all four in parallel
T005 scaffold scheduler        ─┤
T006 scaffold alarm-scheduler  ─┘
```

### Phase 2 (T012–T013 parallelisable, then T014–T017 have internal dep order)
```
T012 write timing-engine tests  ─┐ parallel
T013 write meal-model tests     ─┘
    │
    ▼ (confirm tests fail, then implement in dependency order)
T014 (WallClockTime in timing-engine + StepType in meal-model)
  → T015 entities (meal-model; imports WallClockTime from timing-engine)
  → T016 validators
  → T017 TimingEngine implementation
```

### Phase 3 Tests (T022–T024 all parallelisable before any implementation)
```
T022 scheduler contract tests   ─┐
T023 StepForm component tests   ─┤ parallel
T024 ScheduleView component     ─┘
```

### Phase 6 Tests (T048–T052 + T077 all parallelisable)
```
T048 core session tests           ─┐
T049 delay cascade tests          ─┤
T050 alarm resolution tests       ─┤ parallel
T051 deserializeLiveSession tests ─┤
T077 deserializeAlarmConfig tests ─┤
T052 TimerView tests              ─┘
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Load the PWA in the browser, add three ad-hoc steps, set a target
   time, verify schedule is correct, verify it recalculates on step edit
5. Deploy MVP to static hosting (or demo locally) — this is a fully usable tool

### Incremental Delivery

| Stage | Phases | What a cook can do |
|-------|--------|--------------------|
| MVP   | 1 + 2 + US1 | Ad-hoc single-dish scheduling |
| v1.1  | + US2  | Save/load named recipes |
| v1.2  | + US3  | Multi-dish meal plans |
| v1.3  | + US4  | Live countdown with alarms & delays |
| v1.4  | + Polish | Installable PWA, settings, performance validated |

---

## Notes

- `[P]` tasks can run in parallel within their phase; they operate on different files
- `[USN]` label maps each task to a user story for traceability to spec.md
- TDD is non-negotiable: never begin an implementation task until its test task is
  written and confirmed failing
- Commit after each phase checkpoint (at minimum)
- The `alarm-scheduler` library emits `SessionCommand` objects — it never calls `setTimeout`,
  plays audio, or fires notifications directly; all side effects are handled in the PWA layer
- Web Worker (`timer.worker.ts`) is the only place `setInterval`/`setTimeout` is used for
  timing — the main thread and service worker must not hold timer state
- `AudioContext.resume()` MUST be called inside a user gesture handler before any chime plays
- All IndexedDB reads pass through schema guard deserializers before the data is used
