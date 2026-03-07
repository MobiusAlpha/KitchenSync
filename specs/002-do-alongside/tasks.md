# Tasks: Intra-Dish Parallel Steps ("Do Alongside")

**Input**: Design documents from `/specs/002-do-alongside/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

**Tests**: TDD is **MANDATORY** per KitchenSync constitution Principle II. Every test task
MUST be written and confirmed **FAILING** before its paired implementation task begins.
Tests MUST target the contracts/interfaces defined in `specs/002-do-alongside/contracts/`,
NOT concrete types.

**Model**: `Dish.stages: Stage[]` (sequential) → `Stage.tracks: Track[]` (parallel) →
`Track.steps: Step[]` (sequential). Supersymmetric with future Course and Service layers.

---

## Phase 1: Setup

**Purpose**: Confirm workspace integrity before touching any source files.

- [ ] T001 Verify monorepo builds cleanly from repo root (`pnpm build`) and all existing tests pass (`pnpm test`) before any changes

---

## Phase 2: Foundational — meal-model Stage/Track Entities

**Purpose**: Introduce `Track` and `Stage` into `@kitchensync/meal-model` and replace
`steps: Step[]` on `Dish` and `Recipe` with `stages: Stage[]`. Every downstream package
(`@kitchensync/scheduler`, `@kitchensync/alarm-scheduler`, `apps/pwa`) depends on these
types. **No user story work may begin until this phase is complete.**

**⚠️ CRITICAL**: Tests MUST be written and confirmed FAILING before each implementation task.

### Tests (write first — must fail before implementation)

- [ ] T002 [P] Write failing tests for `validateTrack` (empty steps, steps length bounds, invalid step fields) in `packages/meal-model/tests/validators.test.ts`
- [ ] T003 [P] Write failing tests for `validateStage` (empty tracks, tracks length bounds 1–10, nested validateTrack errors) in `packages/meal-model/tests/validators.test.ts`
- [ ] T004 [P] Write failing tests for updated `validateDish` accepting `stages: Stage[]` instead of `steps: Step[]` in `packages/meal-model/tests/validators.test.ts`
- [ ] T005 [P] Write failing tests for updated `validateRecipe` accepting `stages: Stage[]` instead of `steps: Step[]` in `packages/meal-model/tests/validators.test.ts`
- [ ] T006 [P] Write failing tests for `upgradeRecord` — old `steps: Step[]` record converts to `stages: Stage[]` with one single-track Stage per old Step in `packages/meal-model/tests/deserializers.test.ts`
- [ ] T007 [P] Write failing tests for `deserializeDish` — new-format round-trip, old-format auto-upgrade, fatally invalid returns null in `packages/meal-model/tests/deserializers.test.ts`
- [ ] T008 [P] Write failing tests for `deserializeRecipe` — mirrors deserializeDish contract in `packages/meal-model/tests/deserializers.test.ts`

### Implementation

- [ ] T009 Add `Track` and `Stage` interfaces to `packages/meal-model/src/entities.ts`; replace `steps: readonly Step[]` with `stages: readonly Stage[]` on both `Dish` and `Recipe`
- [ ] T010 Implement `validateTrack()` in `packages/meal-model/src/validators.ts` — validates id, non-empty steps array (1–50), each step passes existing `validateStep`; all step ids unique within track
- [ ] T011 Implement `validateStage()` in `packages/meal-model/src/validators.ts` — validates id, non-empty tracks array (1–10), each track passes `validateTrack`
- [ ] T012 Update `validateDish()` in `packages/meal-model/src/validators.ts` — validate `stages` field (1–20 Stages) instead of `steps`; error paths `stages[i].tracks[j].steps[k].field`
- [ ] T013 Update `validateRecipe()` in `packages/meal-model/src/validators.ts` — same as validateDish change
- [ ] T014 Create `packages/meal-model/src/deserializers.ts` with `upgradeRecord()` — detects `steps[]`/no-`stages` format; wraps each Step in `Stage { tracks: [Track { steps: [step] }] }` with generated UUIDs; returns raw upgraded object
- [ ] T015 Implement `deserializeDish()` in `packages/meal-model/src/deserializers.ts` — calls `upgradeRecord`, runs `validateDish`, drops invalid nested elements with `console.warn`, returns `Dish | null`
- [ ] T016 Implement `deserializeRecipe()` in `packages/meal-model/src/deserializers.ts` — mirrors `deserializeDish` for `Recipe`
- [ ] T017 Export `Track`, `Stage`, `validateTrack`, `validateStage`, `upgradeRecord`, `deserializeDish`, `deserializeRecipe` from `packages/meal-model/src/index.ts`
- [ ] T018 Confirm all T002–T008 tests now pass; confirm existing validator tests still pass

**Checkpoint**: `@kitchensync/meal-model` exports Stage/Track entities and all validators/deserializers. All tests green. Downstream packages can now be updated.

---

## Phase 3: User Story 1 — Add a Parallel Step to an Existing Dish (Priority: P1) 🎯 MVP

**Goal**: A user can add one or more parallel Tracks to any Stage in a dish. The scheduler
computes correct start times for all tracks (each independently reverse-timed from the shared
Stage end time). The schedule view visually groups parallel Stages. The recipe and planner
editors expose a "Do Alongside" gesture to create a new Track within a Stage.

**Independent Test**: Create a dish with `Stage[Track[BrineChicken 45m], Track[PrepVegetables 10m]]`
followed by `Stage[Track[MakeStock 60m]]`, target 18:00. Verify schedule shows BrineChicken
starts 15:15, PrepVegetables starts 15:50, MakeStock starts 16:00, both Stage-1 events share
`stageId`, shared end time invariant holds. Verify ScheduleView groups Stage 1 visually.

### Tests for User Story 1 (write first — must fail)

- [ ] T019 [P] Write failing tests for `scheduleDish` with a two-track Stage: shared end-time invariant, correct start times per track, `stageId`/`trackId` populated, `isParallel: true` for multi-track Stages in `packages/scheduler/tests/schedule-dish.test.ts`
- [ ] T020 [P] Write failing tests for `scheduleDish` with chained parallel Stages (two separate multi-track Stages in one dish) in `packages/scheduler/tests/schedule-dish.test.ts`
- [ ] T021 [P] Write failing tests for `scheduleDish` with a longer-duration companion Track than anchor Track (companion starts earlier; invariant still holds) in `packages/scheduler/tests/schedule-dish.test.ts`
- [ ] T022 [P] Write failing tests for `scheduleMealPlan` setting `isConcurrentWithOtherDish: true` when events from different dishes share `startTime` in `packages/scheduler/tests/schedule-meal-plan.test.ts`
- [ ] T023 [P] Write failing tests for `StageEditor`: renders stages, "Add Track" creates new Track in Stage, track count shown, stage order preserved in `apps/pwa/tests/components/StageEditor.test.tsx`
- [ ] T024 [P] Write failing tests for `TrackEditor`: renders steps in a Track, add step opens inline form, reorder steps, steps validated before save in `apps/pwa/tests/components/TrackEditor.test.tsx`
- [ ] T025 [P] Write failing tests for `ScheduleView` parallel Stage grouping: multi-track Stage events render under a shared group accent; single-track Stage events render as plain rows; `isConcurrentWithOtherDish` badge visible in `apps/pwa/tests/components/ScheduleView.test.tsx`

### Implementation for User Story 1

- [ ] T026 [P] Add `stageId: string`, `trackId: string`, `isConcurrentWithOtherDish: boolean` to `StepEvent`; update `isParallel` to mean `stage.tracks.length > 1` in `packages/scheduler/src/types.ts`
- [ ] T027 Rewrite `scheduleDish` inner loop: outer reverse-walk on `stages[]`; per-stage, capture `stageEndTime = cursor`; per-track, reverse-walk `track.steps[]` independently from `stageEndTime`; set `stageId`, `trackId`, `isParallel = stage.tracks.length > 1`; advance `cursor = min(trackStarts)` in `packages/scheduler/src/schedule-dish.ts`
- [ ] T028 Update `scheduleMealPlan` to set `isConcurrentWithOtherDish: true` on events from different dishes sharing the same `startTime` in `packages/scheduler/src/schedule-meal-plan.ts`
- [ ] T029 Create `TrackEditor` component — renders and edits `Step[]` within one Track; wraps existing step add/edit/delete/reorder logic; `props: { track: Track; onChange: (t: Track) => void; disabled?: boolean }` in `apps/pwa/src/components/TrackEditor.tsx`
- [ ] T030 Create `StageEditor` component — renders `Stage[]` as vertical list; each Stage shows its Tracks in columns; single-track Stage shows "Do Alongside" button; multi-track Stage shows per-track "Remove Track" (×); "Add Stage" appends a new sequential Stage; `props: { stages: Stage[]; onChange: (s: Stage[]) => void; disabled?: boolean }` in `apps/pwa/src/components/StageEditor.tsx`
- [ ] T031 Update `RecipeEditor` to use `StageEditor` instead of `StepForm` in `apps/pwa/src/components/RecipeEditor.tsx`
- [ ] T032 Update `MealPlanEditor` to use `StageEditor` instead of `StepForm` in `apps/pwa/src/components/MealPlanEditor.tsx`
- [ ] T033 Update `ScheduleView` to group events by `stageId`; render multi-track Stage groups with a left-border accent and a per-Track sub-row identified by `trackId`; replace old `isParallel` badge with `isConcurrentWithOtherDish` badge labelled "⇔ concurrent" in `apps/pwa/src/components/ScheduleView.tsx`
- [ ] T034 Create `GanttView` directory and component `apps/pwa/src/components/GanttView/GanttView.tsx` — horizontal timeline; one Dish row; per-Stage band; single-track Stages: one bar; multi-track Stages: stacked Track bars sharing right edge; bars colour-coded by dominant step type; vertical join lines at Stage boundaries
- [ ] T035 Confirm all T019–T025 tests now pass

**Checkpoint**: A dish with multi-track Stages schedules correctly. StageEditor and TrackEditor are usable in recipe and planner flows. ScheduleView groups parallel Stages. GanttView renders Track bars.

---

## Phase 4: User Story 2 — Edit or Remove a Parallel Step (Priority: P2)

**Goal**: A user can edit the duration/name/type of any step within a Track and see the
schedule immediately recalculate. A user can remove an entire Track from a Stage (Stage
reverts to single-track sequential) or remove the last Step from a Track (Track and then
Stage removed if empty). The anchor step is unaffected by companion Track removal.

**Independent Test**: (1) Dish with Stage[Track[Brine 45m], Track[PrepVeg 10m]] — edit
PrepVeg to 20m — verify PrepVeg.startTime shifts to 15:40, Brine unchanged, both still
end at 16:00. (2) Remove Track B — verify Stage now single-track, `isParallel: false`,
schedule identical to sequential-only dish.

### Tests for User Story 2 (write first — must fail)

- [ ] T036 [P] Write failing tests for `StageEditor` "Remove Track": two-track Stage collapses to single-track Stage; `isParallel` becomes false; `onChange` fires with updated stages in `apps/pwa/tests/components/StageEditor.test.tsx`
- [ ] T037 [P] Write failing tests for `StageEditor` "Add Track" creating a second track in an existing Stage: Stage becomes multi-track; new Track appears with empty steps in `apps/pwa/tests/components/StageEditor.test.tsx`
- [ ] T038 [P] Write failing tests for `TrackEditor` step edit: change duration, name, or type — `onChange` fires; schedule recalculates to reflect new duration; shared end-time invariant holds after edit in `apps/pwa/tests/components/TrackEditor.test.tsx`
- [ ] T039 [P] Write failing tests for `TrackEditor` step delete: removing last step in a Track triggers Track removal from its Stage; removing last Track triggers Stage removal from the Dish in `apps/pwa/tests/components/TrackEditor.test.tsx`
- [ ] T040 [P] Write failing tests for `MealPlanEditor` edit → schedule recalculates in `apps/pwa/tests/components/MealPlanEditor.test.tsx`
- [ ] T041 [P] Write failing tests for `RecipeEditor` edit/save preserves Stage/Track structure in `apps/pwa/tests/components/RecipeEditor.test.tsx`

### Implementation for User Story 2

- [ ] T042 Implement "Remove Track" in `StageEditor`: remove Track from Stage; if `tracks.length` drops to 0, remove Stage entirely; if drops to 1, Stage becomes sequential (`isParallel: false`); call `onChange` in `apps/pwa/src/components/StageEditor.tsx`
- [ ] T043 Implement "Add Track (Do Alongside)" in `StageEditor`: when Stage has ≥ 1 Track, append a new empty Track (with generated UUID); Stage becomes multi-track; call `onChange` in `apps/pwa/src/components/StageEditor.tsx`
- [ ] T044 Implement step-level edit in `TrackEditor`: editing any step field replaces the step in `track.steps[]` and fires `onChange`; removing last step in Track fires `onRemoveTrack` callback to parent `StageEditor` in `apps/pwa/src/components/TrackEditor.tsx`
- [ ] T045 Confirm all T036–T041 tests now pass

**Checkpoint**: Full CRUD for Tracks and Steps within Stages. Schedule recalculates on every edit. US1 and US2 are independently verifiable.

---

## Phase 5: User Story 3 — Parallel Steps in the Live Timer (Priority: P3)

**Goal**: The live timer shows all Steps in a multi-track Stage simultaneously. Each Step
has its own individual "Mark Started" button. The first Step of the subsequent Stage is
gated: its "Mark Started" button is disabled until `isStageComplete(session, precedingStageId)`
returns true. Delays applied to a companion Track's Step cascade within that Track only —
they do not cross into sibling Tracks or shift the Stage join point.

**Independent Test**: Start a timer session on Quickstart Scenario 5. Confirm: (1) Stage 1
shows both BrineChicken and PrepVegetables simultaneously. (2) Confirming one does not
unlock MakeStock. (3) Confirming both unlocks MakeStock. (4) Applying +10m to PrepVeg
shifts only PrepVeg; BrineChicken and MakeStock are unchanged.

### Tests for User Story 3 (write first — must fail)

- [ ] T046 [P] Write failing tests for `isStageComplete`: all confirmed → true; partial → false; none confirmed → false; stageId not found → true; stageId with single-track Stage → true once step confirmed in `packages/alarm-scheduler/tests/group-complete.test.ts`
- [ ] T047 [P] Write failing tests for `createLiveSession` populating `stageId` and `trackId` on each `LiveStepState` from the corresponding `StepEvent` fields in `packages/alarm-scheduler/tests/live-session.test.ts`
- [ ] T048 [P] Write failing tests for `applyStepDelay` CASE 1 (single-track Stage): delay target step + cascade to subsequent unstarted steps in same Track and subsequent sequential Stages; stop at Dish boundary in `packages/alarm-scheduler/tests/delay-cascade.test.ts`
- [ ] T049 [P] Write failing tests for `applyStepDelay` CASE 2 (multi-track Stage): delay target step only; do NOT cascade to sibling Track steps; do NOT cascade to subsequent Stages; emit UPDATE_DISPLAY in `packages/alarm-scheduler/tests/delay-cascade.test.ts`
- [ ] T050 [P] Write failing tests for `TimerView` parallel Stage rendering: multi-track Stage steps appear simultaneously; each has individual "Mark Started" button; grouped under "Running in parallel" header in `apps/pwa/tests/components/TimerView.test.tsx`
- [ ] T051 [P] Write failing tests for `TimerView` Stage gate: join step "Mark Started" button is `disabled` while `isStageComplete` returns false; becomes enabled once all Stage members confirmed; "Waiting for parallel steps to complete" label visible while gated in `apps/pwa/tests/components/TimerView.test.tsx`

### Implementation for User Story 3

- [ ] T052 [P] Add `stageId: string` and `trackId: string` to `LiveStepState` in `packages/alarm-scheduler/src/types.ts`
- [ ] T053 Update `createLiveSession` to populate `stageId` and `trackId` on each `LiveStepState` from the matching `StepEvent` in `packages/alarm-scheduler/src/live-session.ts`
- [ ] T054 Create `packages/alarm-scheduler/src/group-complete.ts` — export `isStageComplete(session, stageId): boolean`; returns true if every `LiveStepState` with that `stageId` has `confirmedAt !== null`; returns true for unknown stageId (degenerate/safe default)
- [ ] T055 Update `applyStepDelay` in `packages/alarm-scheduler/src/delay.ts` with CASE 1 (single-track: cascade within Track and through subsequent sequential Stages) and CASE 2 (multi-track: shift target step only; no cross-track or cross-stage cascade)
- [ ] T056 Export `isStageComplete` from `packages/alarm-scheduler/src/index.ts`
- [ ] T057 Update `TimerView` to group `session.stepStates` by `stageId`; render single-track Stage groups as before; render multi-track Stage groups under a "Running in parallel" card header with per-step sub-cards and individual timers; inject `isStageComplete` prop in `apps/pwa/src/components/TimerView.tsx`
- [ ] T058 Gate each join step's "Mark Started" button in `TimerView`: identify the stageId of the preceding Stage; render button as `disabled` with label "Waiting for parallel steps to complete" while `!isStageComplete(session, precedingStageId)` in `apps/pwa/src/components/TimerView.tsx`
- [ ] T059 Update `TimerPage` to import `isStageComplete` and pass it as a prop to `TimerView` in `apps/pwa/src/pages/TimerPage.tsx`
- [ ] T060 Confirm all T046–T051 tests now pass

**Checkpoint**: All three user stories are independently functional and tested. Timer correctly gates join steps and isolates delay cascades.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Storage integration, backward compatibility, and end-to-end scenario validation.

- [ ] T061 [P] Write failing tests for `RecipeRepository` reading an old-format record (`steps: Step[]`): after load, the returned Recipe has `stages: Stage[]`; write-back occurs so second read returns new format in `apps/pwa/tests/storage/RecipeRepository.test.ts`
- [ ] T062 [P] Write failing tests for `MealPlanRepository` reading an old-format Dish inside a MealPlan: same upgrade + write-back behaviour in `apps/pwa/tests/storage/MealPlanRepository.test.ts`
- [ ] T063 Update `RecipeRepository` to call `deserializeRecipe()` on IndexedDB read; on successful upgrade from old format, write the upgraded record back to the store (background, non-blocking) in `apps/pwa/src/storage/RecipeRepository.ts`
- [ ] T064 Update `MealPlanRepository` to call `deserializeDish()` for each Dish in a MealPlan read; same background write-back on upgrade in `apps/pwa/src/storage/MealPlanRepository.ts`
- [ ] T065 Confirm all T061–T062 tests now pass
- [ ] T066 [P] Write failing integration test for round-trip: save a Recipe with multi-track Stages → reload → `deserializeRecipe` returns identical structure → schedule output byte-for-byte identical to pre-save in `apps/pwa/tests/storage/RecipeRepository.test.ts`
- [ ] T067 [P] Write failing integration test: backward compat — seed IndexedDB with old-format `steps[]` Dish → load via MealPlanRepository → schedule matches what `scheduleDish` would produce for equivalent sequential stages in `apps/pwa/tests/storage/MealPlanRepository.test.ts`
- [ ] T068 Confirm T066–T067 tests pass
- [ ] T069 Manually walk Quickstart Scenarios 1–8 and record results; fix any failures before closing the feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS Phases 3, 4, 5**
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 (edits build on the Stage/Track UI created in US1)
- **Phase 5 (US3)**: Depends on Phase 3 (needs `StepEvent.stageId` from T026–T028)
- **Phase 6 (Polish)**: Depends on Phases 3–5

### User Story Dependencies

- **US1 (P1)**: Blocked only by Foundational. Start here.
- **US2 (P2)**: Depends on US1 — TrackEditor and StageEditor must exist before edit/remove can be completed and tested independently.
- **US3 (P3)**: Depends on US1 — needs `stageId`/`trackId` on `StepEvent` (T026) before `LiveStepState` can be populated (T052–T053).

### Parallel Opportunities Within Each Phase

**Phase 2** (after T001):
- T002–T008 all write test cases into independent files or independent `describe` blocks — all can run in parallel
- T009 → unblocks T010, T011 → unblocks T012, T013 → unblocks T014–T016 (sequential within entities)
- T017 and T018 both depend on T009–T016

**Phase 3** (after Phase 2):
- T019–T025 (test writing): all parallel
- T026, T027 sequential (T026 type changes must precede T027 algorithm)
- T028 parallel with T027 (different file)
- T029, T030 parallel (different files)
- T031, T032 parallel after T030 (different files, both consume StageEditor)
- T033, T034 parallel (different files)

**Phase 5** (after Phase 3):
- T046–T051 (test writing): all parallel
- T052, T053 sequential (T052 type changes first)
- T054, T055, T056 parallel after T052 (different files)
- T057, T058 sequential (same file, T057 first)
- T059 parallel with T057 (different file)

---

## Parallel Example: Phase 2 Test Writing

```
# All can be dispatched simultaneously:
T002: Write failing tests for validateTrack
T003: Write failing tests for validateStage
T004: Write failing tests for validateDish with stages
T005: Write failing tests for validateRecipe with stages
T006: Write failing tests for upgradeRecord
T007: Write failing tests for deserializeDish
T008: Write failing tests for deserializeRecipe
```

## Parallel Example: Phase 3 Scheduler + UI

```
# After T026 (StepEvent types), dispatch simultaneously:
T027: scheduleDish Stage/Track algorithm
T028: scheduleMealPlan isConcurrentWithOtherDish

# After T028, dispatch simultaneously:
T029: TrackEditor component
T030: StageEditor component

# After T030, dispatch simultaneously:
T031: RecipeEditor → StageEditor
T032: MealPlanEditor → StageEditor
T033: ScheduleView parallel grouping
T034: GanttView component
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Phase 1: Confirm build
2. Phase 2: meal-model Stage/Track (CRITICAL — blocks everything)
3. Phase 3: US1 — scheduler + editors + schedule view
4. **STOP and validate**: run Quickstart Scenarios 1–3; confirm schedule invariants

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 (US1) → Parallel editing and scheduling work ← **demo here**
3. Phase 4 (US2) → Full CRUD ← **demo here**
4. Phase 5 (US3) → Live timer ← **demo here**
5. Phase 6 → Polish + storage backward compat ← **ship here**

---

## Format Validation

All 69 tasks follow the checklist format: `- [ ] T### [P?] [US?] Description with file path`

| Phase | Task Range | Count |
|-------|-----------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T018 | 17 |
| US1 | T019–T035 | 17 |
| US2 | T036–T045 | 10 |
| US3 | T046–T060 | 15 |
| Polish | T061–T069 | 9 |
| **Total** | | **69** |

**Parallel opportunities**: 38 tasks marked `[P]`
**TDD pairs**: Every implementation phase is preceded by failing-test tasks
**Independent test criteria**: Each User Story phase includes a self-contained Independent Test scenario drawn from quickstart.md
