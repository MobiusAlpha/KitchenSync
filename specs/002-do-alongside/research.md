# Research: 002-do-alongside

**Phase**: 0 — Research & Decision Log
**Date**: 2026-03-07 (revised after topology review)
**Branch**: `002-do-alongside`

---

## R-001 — Data Model Topology: Supersymmetric Stage/Track Model

**Question**: What data model correctly represents intra-dish parallel steps while also
serving as the foundation for Courses (parallel dishes) and Services (parallel courses)
without requiring an architectural rewrite at each new feature?

**Context**: The initial design (backbone `Step[]` + embedded `companions: CompanionStep[]`)
was rejected because it only supports one level of parallelism and does not compose. The
pattern "parallel steps → join → more parallel steps → join → …" recurs at the Dish, Course,
and Service levels identically. A model that treats companions as a special case of Step will
require a full refactor at each subsequent layer.

**The supersymmetric pattern**:

| Level | Sequence unit | Parallel unit |
|-------|--------------|---------------|
| Dish today | `Stage` (sequential) | `Track[]` within a Stage |
| Course (future) | `CourseStage` (sequential) | `Dish[]` within a CourseStage |
| Service (future) | `ServiceStage` (sequential) | `Course[]` within a ServiceStage |

At every level: a **sequence of stages**, each stage containing **one or more parallel tracks**,
all sharing a join point (the stage's end time). Adding a new level means implementing the
same pattern one step wider — no redesign of inner levels.

**Options evaluated**:

| Option | Description | Verdict |
|--------|-------------|---------|
| A | `Step.companions?: CompanionStep[]` (embedded, one level) | **Rejected** — dead end |
| B | `Dish.parallelGroups[]` alongside `steps[]` | **Rejected** — same problem |
| C | **`Dish.stages: Stage[]` where `Stage.tracks: Track[]` and `Track.steps: Step[]`** | **CHOSEN** |
| D | Full recursive DAG (each node has `dependsOn: string[]`) | Rejected — overcomplicated for this domain |

**Decision**: Option C — Stage/Track model.

**Rationale**:
- `Stage` is the unit of time: all tracks within a stage share the same end time (join point).
  A stage with a single track is a plain sequential step group. Multi-track stages are parallel.
- `Track` is the unit of sequential execution within a stage. Each track contains one or more `Steps`.
- The scheduler algorithm is the same at every level: reverse-walk stages, then for each stage
  reverse-walk each track independently from the shared stage end time.
- The model composes cleanly upward: a `CourseStage` containing `Dish[]` uses the same reverse-timing
  pass as a `Stage` containing `Track[]`.
- The UI pattern is the same at every level: a vertical list of stages, each expanding to show
  its parallel tracks side-by-side.
- No cross-references, no anchor IDs, no `companions` special-case. The parallel group is simply
  any `Stage` with `tracks.length > 1`.

**Trade-off acknowledged**: This replaces `Dish.steps: Step[]` with `Dish.stages: Stage[]`, which
is a breaking change to the existing 001 storage format. A deserialization adapter will upgrade
old records on read: `steps: Step[]` → `[Stage { tracks: [Track { steps }] }]`. This cost is paid
once and is far lower than the cost of refactoring the model at the Course or Service layer.

---

## R-002 — Group Identity: Stage ID as the Parallel Group ID

**Decision**: The `Stage.id` is the parallel group identifier. It replaces the previously
proposed `parallelGroupId: anchorStepId` approach (which was invalidated by the topology change).

**Rationale**:
- Every step now belongs to a Stage (via `Stage → Track → Step`). The Stage is the natural
  unit of grouping: all steps in all tracks of a Stage share the same join point.
- `stageId` on `StepEvent` and `LiveStepState` enables the group-completion gate in the timer UI
  without any additional cross-reference.
- Single-track stages have `stageId` set (every step belongs to a stage), but are not visually
  distinguished as "parallel" since they have only one track.

---

## R-003 — Scheduler Algorithm for the Stage/Track Model

**Decision**: `scheduleDish` walks stages in reverse. For each stage, it determines the stage's
end time (the cursor value before processing the stage), then reverse-times each track
independently from that shared end time.

**Algorithm**:
```
cursor = targetTime
for i = stages.length - 1 downto 0:
  stage = stages[i]
  stageEndTime = cursor

  // Compute each track's start time independently
  trackStarts = []
  for each track in stage.tracks:
    trackStart = stageEndTime
    for j = track.steps.length - 1 downto 0:
      trackStart = trackStart - track.steps[j].durationMinutes
      emit StepEvent(step, startTime=trackStart, stageId=stage.id, trackId=track.id)
    trackStarts.push(trackStart)

  // The stage's start time is the EARLIEST track start (the track that begins soonest)
  cursor = min(trackStarts)
```

**Shared end time invariant**: All tracks in a stage end at `stageEndTime`. The stage's own
start time (for overrun calculation purposes) is the earliest track start.

---

## R-004 — StepEvent Extension

**Decision**: Add `stageId: string` and `trackId: string` to `StepEvent`. Remove the
previously proposed `parallelGroupId` field (replaced by `stageId`).

- `stageId`: groups all events that share a join point. Used by timer UI for gate logic.
- `trackId`: identifies which parallel track within the stage. Used by UI to render tracks
  as separate visual lanes within a stage.
- `isParallel` on `StepEvent` is redefined: `true` if the event's stage has `tracks.length > 1`.
  The previous cross-dish meaning is preserved as a separate concern at the MealPlan level.

---

## R-005 — LiveStepState Extension

**Decision**: Add `stageId: string` and `trackId: string` to `LiveStepState`.

- `stageId` enables `isStageComplete(session, stageId)` — the gate function that determines
  whether the join step can be started.
- `trackId` enables per-track delay cascade (delays within a track do not cross into sibling tracks).

---

## R-006 — Delay Cascade for Multi-Track Stages

**Decision**: Delay cascades within a track only. Cross-track propagation is not supported.

**Rules**:
- Applying a delay to step S in track T of stage X:
  1. Shifts all unstarted steps in track T at or after S's position.
  2. Does NOT cascade to other tracks in stage X.
  3. Does NOT cascade to subsequent stages (the join point is fixed; delays within a track
     do not shift the join point — only the start time of that track shifts).
- Applying a delay to the join step (the first step of the next stage) cascades as a
  single-track stage delay: all unstarted steps in that stage's single track shift.

**Rationale**: The join point is a structural constraint. If a track within a stage is delayed,
the cook must absorb the wait; the downstream stages don't move. This matches real cooking:
if your sauce takes longer, you hold it warm while the rest of the meal catches up.

---

## R-007 — Recipe Storage Alignment

**Decision**: `Recipe.steps: Step[]` is replaced with `Recipe.stages: Stage[]` for consistency
with Dish. The deserialization adapter for Recipe mirrors the Dish adapter.

**Rationale**: A Recipe is a Dish template. If their schemas diverge, `addDishFromRecipe`
must do a structural conversion on every call. Keeping them aligned eliminates that conversion
and makes Recipe editing directly composable with the Stage/Track UI.

---

## R-008 — Backward Compatibility: Storage Migration

**Decision**: No IndexedDB schema version bump required. The upgrade is handled in the
deserialization layer as a one-way read-time transform.

**Adapter**:
```
if record has steps: Step[] (old format):
  wrap as stages: [{ id: generateId(), tracks: [{ id: generateId(), steps: record.steps }] }]
  save upgraded record back to store (background write)
```

The background write means the next read sees the new format. One-time per record.
No migration script, no breaking change, no data loss.

---

## R-009 — No New Packages Required

All changes remain within `@kitchensync/meal-model`, `@kitchensync/scheduler`,
`@kitchensync/alarm-scheduler`, and `apps/pwa`. The Stage/Track model is an extension
of the existing entity layer; no new domain boundaries are introduced.
