# Implementation Plan: Intra-Dish Parallel Steps ("Do Alongside")

**Branch**: `002-do-alongside` | **Date**: 2026-03-07 (revised: Stage/Track model)
**Spec**: [spec.md](./spec.md)

---

## Summary

Extends KitchenSync with a **Stage/Track** data model that correctly represents
arbitrary sequences of parallel step groups within a dish — and provides the
foundational structure for Courses (parallel Dishes) and Services (parallel Courses)
without requiring a model rewrite at those layers.

**Supersymmetric pattern**:

| Level | Sequence unit | Parallel unit |
|-------|--------------|---------------|
| Dish (this feature) | `Stage` | `Track[]` within Stage |
| Course (future) | `CourseStage` | `Dish[]` within CourseStage |
| Service (future) | `ServiceStage` | `Course[]` within ServiceStage |

The scheduler algorithm — reverse-walk stages, then per-stage reverse-walk each track
from the shared end time — is identical at every level.

**Changes are additive in packages, breaking in storage**: `Dish.steps[]` and
`Recipe.steps[]` are replaced by `stages: Stage[]`. A read-time deserialization
adapter upgrades existing records with zero data loss.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: existing workspace only — pnpm + Turborepo monorepo; React 19, Bootstrap 5, Dexie 4 (IndexedDB), Vitest 2, React Testing Library
**Storage**: Dexie.js IndexedDB — stages/tracks are nested JSON within existing record structure; no new indexed columns; no schema version bump
**Testing**: Vitest (unit + integration); React Testing Library (component)
**Target Platform**: Browser PWA; all packages run in-browser or Vitest (Node-compatible)
**Performance**: O(S × T × P) where S = stages, T = tracks per stage, P = steps per track; identical constant factor to 001 for sequential dishes
**Backward Compatibility**: Read-time upgrade adapter; background write-back; one-time per record; no data loss

---

## Constitution Check

| Principle | Assessment | Status |
|-----------|-----------|--------|
| I. Library-First | `Stage`, `Track` entities and all validators live in `@kitchensync/meal-model`; `stageId`/`trackId` emit logic in `@kitchensync/scheduler`; `isStageComplete` in `@kitchensync/alarm-scheduler`. No PWA logic leaks into libraries. | ✅ PASS |
| II. Test-First / TDD | All test tasks precede implementation tasks. Tests target `ValidateTrack`, `ValidateStage`, `ScheduleDish`, `ApplyStepDelay`, `IsStageComplete` contracts. No concrete-type testing. | ✅ PASS |
| III. Input Validation | `validateTrack` and `validateStage` run at every trust boundary (storage read, form save). Upgrade adapter validates step-by-step before committing to memory. | ✅ PASS |
| IV. Documentation Standards | All new/modified public interfaces carry doc comments. | ✅ PASS |
| V. Cloud-Native Platform | Entirely client-side feature. No new backend services. Existing cloud-native constraints unchanged. | ✅ PASS |

**Guiding Design Principles**:
- **Reliability**: Shared end-time invariant is enforced deterministically by the scheduler (pure function). Stage gate logic is a pure predicate (`isStageComplete`) with no side effects.
- **Maintainability**: The Stage/Track structure is explicit and self-describing; no special-case `companions` field or anchor cross-references. The one-direction storage upgrade is transparent to all callers.
- **Scalability**: Stage/Track is O(S×T×P); no new indexes; the max-10-tracks and max-20-stages caps keep the UI and scheduler bounded. The supersymmetric design means the Course and Service layers can be added without modifying this layer.
- **Extensibility**: `stageId` and `trackId` on `StepEvent` and `LiveStepState` are the extension points for future scheduling strategies (offset joins, conditional stages, etc.). Adding a Course layer requires no changes to the Step/Track/Stage model.

**Trade-offs acknowledged**:
- `Dish.steps[]` → `Dish.stages[]` is a breaking schema change. Cost: read-time upgrade adapter. Benefit: eliminates a guaranteed future refactor at the Course and Service layers. Net: correct call.
- `isParallel` semantics change on `StepEvent`. Old meaning (cross-dish) is preserved in `isConcurrentWithOtherDish`. Any 001 consumer that reads `isParallel` will see changed behaviour. Since 001 is not yet shipped, this is acceptable; the contracts document the change explicitly.

---

## Project Structure

### Documentation
```text
specs/002-do-alongside/
├── plan.md          ← this file
├── research.md      ← 9 decisions; topology rationale; Stage/Track chosen
├── data-model.md    ← Stage, Track entities; updated Dish, Recipe, StepEvent, LiveStepState
├── quickstart.md    ← 8 integration scenarios
├── contracts/
│   ├── meal-model.ts       ← Track, Stage, Dish, Recipe; validators; upgrade/deserialize
│   ├── scheduler.ts        ← Extended StepEvent; Stage/Track scheduleDish algorithm
│   ├── alarm-scheduler.ts  ← Extended LiveStepState; isStageComplete; applyStepDelay cases
│   └── ui-contracts.ts     ← StageEditor, TrackEditor, ScheduleView, GanttView, TimerView
└── tasks.md         ← generated by /speckit.tasks
```

### Source Code
```text
packages/meal-model/
├── src/
│   ├── entities.ts       # + Track, Stage interfaces; Dish.stages, Recipe.stages replace .steps
│   ├── types.ts          # unchanged
│   ├── validators.ts     # + validateTrack(), validateStage(); update validateDish/validateRecipe
│   ├── deserializers.ts  # + upgradeRecord(), deserializeDish(), deserializeRecipe()
│   └── index.ts          # + export Track, Stage, validateTrack, validateStage, upgradeRecord
└── tests/
    ├── validators.test.ts      # + Track/Stage validation tests; Dish/Recipe with stages
    └── deserializers.test.ts   # + upgrade adapter tests; round-trip tests

packages/scheduler/
├── src/
│   ├── types.ts          # StepEvent + stageId, trackId, isConcurrentWithOtherDish;
│   │                     # isParallel semantics updated
│   └── schedule-dish.ts  # Stage/Track reverse-walk algorithm; shared end time invariant
└── tests/
    └── schedule-dish.test.ts  # + multi-track stage tests; chained parallel stages; shared end time

packages/alarm-scheduler/
├── src/
│   ├── types.ts          # LiveStepState + stageId, trackId
│   ├── live-session.ts   # createLiveSession: populate stageId/trackId from StepEvent
│   ├── delay.ts          # applyStepDelay: Cases 1/2 (single-track vs multi-track stage)
│   ├── group-complete.ts # NEW: isStageComplete() pure function
│   └── index.ts          # + export isStageComplete
└── tests/
    ├── live-session.test.ts      # + stageId/trackId population tests
    ├── delay-cascade.test.ts     # + multi-track cascade boundary tests
    └── group-complete.test.ts    # NEW: isStageComplete tests

apps/pwa/src/
├── components/
│   ├── StageEditor.tsx          # NEW: replaces StepForm as top-level step editor
│   ├── TrackEditor.tsx          # NEW: step editor scoped to one Track
│   ├── ScheduleView.tsx         # + Stage grouping; trackId sub-rows; isConcurrentWithOtherDish badge
│   └── GanttView/GanttView.tsx  # + Track bars per stage; join lines at stage boundaries
├── pages/
│   └── TimerPage.tsx            # + pass isStageComplete to TimerView
└── components/
    └── TimerView.tsx            # + Stage-grouped step cards; gate on isStageComplete

apps/pwa/tests/
├── components/
│   ├── StageEditor.test.tsx     # NEW
│   ├── TrackEditor.test.tsx     # NEW
│   ├── ScheduleView.test.tsx    # + parallel stage rendering
│   ├── GanttView.test.tsx       # + multi-track bars
│   └── TimerView.test.tsx       # + stage gate; parallel step display
└── pages/
    └── TimerPage.test.tsx       # + integration: Stage/Track live session
```

---

## Implementation Phases

### Phase 0 — meal-model: New Entities & Validators

1. Add `Track` and `Stage` interfaces to `entities.ts`
2. Replace `steps: Step[]` with `stages: Stage[]` on `Dish` and `Recipe`
3. Implement `validateTrack()` and `validateStage()` in `validators.ts`
4. Update `validateDish()` and `validateRecipe()` to validate `stages`
5. Implement `upgradeRecord()`, `deserializeDish()`, `deserializeRecipe()` in `deserializers.ts`
6. Export all new types and functions from `index.ts`

**TDD gate**: Tests for `validateTrack`, `validateStage`, `upgradeRecord` (old format → new), and deserialization round-trips must be written and confirmed failing before implementation.

### Phase 1 — scheduler: Stage/Track Algorithm

1. Add `stageId`, `trackId`, `isConcurrentWithOtherDish` to `StepEvent`; update `isParallel` semantics
2. Rewrite `scheduleDish` inner loop: outer walk on `stages[]`, inner walk per `track.steps[]`
3. Capture `stageEndTime` per stage; reverse-time each track from it independently
4. Set `isParallel = stage.tracks.length > 1` per event
5. Update `scheduleMealPlan` to set `isConcurrentWithOtherDish` on cross-dish same-startTime events

**TDD gate**: Tests for chained parallel stages, shared end-time invariant, longer-track scenarios, and cross-dish `isConcurrentWithOtherDish` before implementation.

### Phase 2 — alarm-scheduler: Stage Gate & Cascade

1. Add `stageId` and `trackId` to `LiveStepState`
2. Update `createLiveSession` to populate them from `StepEvent`
3. Implement `isStageComplete(session, stageId)` in `group-complete.ts`
4. Update `applyStepDelay` with CASE 1 (single-track) and CASE 2 (multi-track) rules

**TDD gate**: Tests for `isStageComplete` (all confirmed, partial, none), and each `applyStepDelay` cascade case before implementation.

### Phase 3 — PWA: New Editor + Updated Views

1. `TrackEditor` component (new) — step CRUD within a single Track
2. `StageEditor` component (new) — Stage list with add/remove Track per Stage
3. Update `MealPlanEditor` and `RecipeEditor` to use `StageEditor` instead of `StepForm`
4. Update `ScheduleView` — Stage groups with Track sub-rows; `isConcurrentWithOtherDish` badge
5. Update `GanttView` — Track bars per stage; join lines
6. Update `TimerView` — Stage-grouped step cards; gate on `isStageComplete`
7. Update `TimerPage` — inject `isStageComplete` into `TimerView`

**TDD gate**: Component tests for each new/updated component before implementation.

### Phase 4 — Polish & Verification

1. Verify backward compat: old-format records load, display, and schedule correctly
2. Verify round-trip: save Stage/Track recipe → reload → identical schedule
3. Manual smoke test against all 8 Quickstart scenarios
4. Verify `RecipeRepository` and `MealPlanRepository` call new `deserializeDish/Recipe`
