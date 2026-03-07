# Research: 002-do-alongside

**Phase**: 0 — Research & Decision Log
**Date**: 2026-03-07
**Branch**: `002-do-alongside`

---

## R-001 — Data Model Topology: How to Represent Companions

**Question**: Where should companion step data live in the entity model?

Three options were evaluated:

| Option | Description | Verdict |
|--------|-------------|---------|
| A | `Step` entity gains `companions?: CompanionStep[]` embedded directly | **CHOSEN** |
| B | `Dish` gains a separate `parallelGroups[]` array alongside `steps[]` | Rejected |
| C | Flat `steps[]` array; companions carry a `parallelGroupId` field | Rejected |

**Decision**: Option A — embed companions inside their anchor `Step`.

**Rationale**:
- The backbone `steps[]` array remains a flat, ordered list of sequential waypoints. Serialization, ordering, and backward compatibility are unchanged.
- Companion data is co-located with its anchor, eliminating cross-referencing bugs.
- The UI already iterates `steps[]` to render step cards; companions naturally render as nested sub-items under their anchor card.
- Validators already walk `steps[]` recursively; adding a nested `companions[]` walk follows the identical pattern.
- Option B requires storing `anchorStepId` references that can drift out of sync when steps are deleted. Option C makes the ordering of `steps[]` ambiguous (are these backbone or companion?).

**Alternatives rejected**:
- Option B: cross-reference maintenance overhead. Deleting an anchor step requires finding and removing its `ParallelGroup` entry separately. Error-prone.
- Option C: the backbone sequence of a dish becomes implicit rather than explicit, complicating both the scheduler walk and the UI list rendering.

---

## R-002 — CompanionStep Type

**Question**: Should `CompanionStep` be a distinct type or reuse `Step`?

**Decision**: Distinct structural type with the same four fields, no `companions` field.

**Rationale**:
- `Step` carries `companions?: CompanionStep[]`. If `CompanionStep` were identical to `Step` (including `companions`), the type would be self-referential and enable arbitrary nesting — explicitly out of scope per spec Assumptions.
- A distinct `CompanionStep` type (id, name, type, durationMinutes only) enforces the one-level-deep invariant at the type system level.
- Validators for `CompanionStep` are simpler than for `Step` (no nested walk needed).

---

## R-003 — Parallel Group Identity

**Question**: What is the group ID for a parallel group?

**Decision**: The anchor step's own `id` serves as the `parallelGroupId`. No new UUID is needed.

**Rationale**:
- Every group has exactly one anchor step (the backbone step that companions attach to).
- The anchor step's `id` is already unique, immutable, and present in every `StepEvent` and `LiveStepState`.
- Using the anchor's `id` eliminates a new UUID field on the `Step` entity while still providing a stable cross-layer group identifier (meal-model → scheduler → alarm-scheduler → PWA).

---

## R-004 — StepEvent Extension Strategy

**Question**: How should `StepEvent` expose intra-dish parallelism?

**Decision**: Add `parallelGroupId: string | null` alongside the existing `isParallel: boolean`.

**Rationale**:
- `isParallel` currently means "same startTime as another step from a **different** dish". Changing that meaning would be a breaking change for `ScheduleView` and `GanttView` consumers.
- `parallelGroupId` carries a distinct, richer signal: "this step belongs to an intra-dish parallel group; the group id identifies which group."
- Both fields can coexist. A step can have `isParallel: true` (cross-dish) AND `parallelGroupId: 'abc'` (intra-dish) simultaneously.
- Consumers that only care about cross-dish parallelism read `isParallel`. Consumers that need intra-dish group membership read `parallelGroupId`.

---

## R-005 — Scheduler Algorithm for Companions

**Question**: How does `scheduleDish` compute companion start times?

**Decision**: Capture `stepEndTime` at each backbone step walk, then subtract each companion's duration from it independently.

**Algorithm** (addendum to current reverse-walk):
```
cursor = targetTime
for i = steps.length - 1 downto 0:
  step = steps[i]
  stepEndTime = cursor                   // end time of this backbone step
  cursor = cursor - step.durationMinutes // start time of this backbone step
  emit StepEvent(step, startTime=cursor, parallelGroupId = step.companions?.length ? step.id : null)

  for each companion in step.companions (if any):
    companionStart = stepEndTime - companion.durationMinutes
    emit StepEvent(companion, startTime=companionStart, parallelGroupId=step.id)
```

**Rationale**:
- `stepEndTime` is always available during the backward walk (it's the cursor value before subtraction).
- Each companion is independently reverse-timed from the shared end point.
- Companions can have longer durations than the anchor; they simply start earlier. The walk doesn't need to "know" which is longest.
- No structural change to the backbone walk; companions are additive.

---

## R-006 — Live Timer: Group Gate Mechanism

**Question**: How does the live timer prevent advancing to the join step before all group members are confirmed?

**Decision**: UI-layer gate only. No state machine changes needed.

**Rationale**:
- `tickSession` fires alarms based on `scheduledStart` (time-based). The join step's alarm fires at the right wall-clock time regardless of group completion — this is correct: the alarm reminds the cook that it's time to start the next step. The cook may be waiting for the last parallel step to finish before confirming.
- `confirmStepStarted` accepts any step and marks it `started`. This is unchanged — each parallel step is confirmed individually.
- The gate is: **the join step's "Mark Started" button is disabled in `TimerView` until all steps sharing the same `parallelGroupId` have `confirmedAt !== null`**.
- This keeps the state machine pure (time-based only) and places the group-completion logic in the view layer, which already has full access to `session.stepStates`.

---

## R-007 — Delay Cascade Boundary for Companion Steps

**Question**: When a delay is applied to a companion step, should it cascade to the join step and beyond?

**Decision**: No cascade beyond the companion itself.

**Rationale**:
- Per spec FR-011 and Assumptions: delay cascades only within that track; cross-track propagation is out of scope.
- A companion step is the terminal node of its mini-track. There is no further step within that track to cascade to.
- The join step sits on the backbone track, not the companion's track.
- Implementation: in `applyStepDelay`, if the target step has a `parallelGroupId` AND its `stepId !== parallelGroupId` (i.e., it is a companion, not an anchor), shift only that step and stop — do not cascade further.
- For anchor steps (backbone step with companions): cascade proceeds along the backbone as before; companion siblings are not in the cascade path (they are lateral, not downstream).

---

## R-008 — No New Packages Required

**Question**: Does this feature require any new library packages?

**Decision**: No. All changes are additive extensions to existing packages.

| Package | Change Type |
|---------|-------------|
| `@kitchensync/meal-model` | Extend `Step`, add `CompanionStep`, update validators |
| `@kitchensync/scheduler` | Extend `StepEvent`, update `scheduleDish` |
| `@kitchensync/alarm-scheduler` | Extend `LiveStepState`, update `createLiveSession`, update `applyStepDelay` |
| `apps/pwa` | Update `StepForm`, `ScheduleView`, `GanttView`, `TimerView` |

**Rationale**: The feature is a natural extension of the existing DAG-capable architecture. The scheduler already reverse-walks steps; companions are additional reverse-walk outputs per step. The alarm-scheduler already tracks per-step state; `parallelGroupId` is an additive field. No new domain boundaries are crossed.

---

## R-009 — Backward Compatibility

**Question**: How are existing recipes and meal plans (with no companions) affected?

**Decision**: Fully backward-compatible. `companions` is optional (`?`) on `Step`. Existing data has `companions: undefined`, which deserializers treat as an empty array. Validators accept absence of the field without errors. The scheduler emits no companion events when `companions` is absent or empty.
