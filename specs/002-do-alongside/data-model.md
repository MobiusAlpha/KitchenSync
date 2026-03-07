# Data Model: 002-do-alongside

**Branch**: `002-do-alongside`
**Date**: 2026-03-07 (revised: Stage/Track topology)
**Depends on**: `001-reverse-timing` entities (Step, Dish, Recipe, MealPlan, StepEvent, LiveStepState)

---

## Overview

This feature replaces the flat `steps: Step[]` on `Dish` and `Recipe` with a
**Stage/Track** structure that correctly models arbitrary sequences of parallel step
groups. The existing `Step` entity is unchanged. The new intermediate entities are
`Stage` and `Track`.

The model is supersymmetric: the same Sequence-of-parallel-groups pattern applies at
the Dish, Course (future), and Service (future) levels, with no architectural changes
to inner levels required when outer levels are added.

All changes to `Dish` and `Recipe` are breaking at the storage layer but are handled
transparently by a deserialization adapter (read-time upgrade with background write-back).

---

## Unchanged Entity: Step

No changes. The four fields (`id`, `name`, `type`, `durationMinutes`) and all existing
constraints remain identical.

---

## New Entity: Track

A `Track` is one sequential line of execution within a `Stage`. All tracks within a
Stage share the same end time (join point). A Stage with a single Track is equivalent
to a sequential step group.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` (UUID v4) | Required. Unique within the containing Dish/Recipe. Immutable. |
| `steps` | `readonly Step[]` | Required. One or more Steps. Sequential execution order. |

**Constraints**:
- Min 1 Step per Track. An empty Track is invalid.
- Step `id` values must be unique across all Tracks in the containing Dish/Recipe.
- Max 50 Steps per Track (prevents UI overload; exceeds any realistic recipe).
- Tracks are unordered relative to each other within a Stage (all start independently).

---

## New Entity: Stage

A `Stage` is one time slot in the Dish's cooking schedule. It contains one or more
parallel Tracks that all complete at the Stage's shared end time (join point). A Stage
with a single Track is a "sequential stage" and behaves identically to the old
`steps[]` element grouping.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` (UUID v4) | Required. Unique within the containing Dish/Recipe. Immutable. |
| `tracks` | `readonly Track[]` | Required. One or more Tracks. |

**Constraints**:
- Min 1 Track per Stage. An empty Stage is invalid.
- Max 10 Tracks per Stage (UX constraint: beyond this, the parallel display becomes unmanageable).
- Stages execute sequentially: Stage N's end time is Stage N+1's start time (the join point).
- A Stage's start time = min(startTime of all its Tracks).
- A Stage's end time = max(endTime of all its Tracks) = the shared join point. All tracks
  end at this time by construction of the reverse-timing algorithm.

---

## Modified Entity: Dish

`steps: readonly Step[]` is replaced by `stages: readonly Stage[]`.
All other fields and constraints are unchanged.

| Field | Type | Change |
|-------|------|--------|
| `id` | `string` | Unchanged |
| `displayName` | `string` | Unchanged |
| `sourceRecipeId` | `string \| null` | Unchanged |
| `steps` | ~~`readonly Step[]`~~ | **REMOVED** |
| `stages` | `readonly Stage[]` | **NEW** — replaces `steps` |

**Constraints on `stages`**:
- Min 1 Stage per Dish (every dish must have at least one timed action).
- Max 20 Stages per Dish (extended from the informal per-step cap in 001).
- The total number of Steps across all Stages and Tracks must not exceed 200 (practical guard).

---

## Modified Entity: Recipe

`steps: readonly Step[]` is replaced by `stages: readonly Stage[]`.
All other fields and constraints are unchanged.

| Field | Type | Change |
|-------|------|--------|
| `id` | `string` | Unchanged |
| `name` | `string` | Unchanged |
| `description` | `string \| undefined` | Unchanged |
| `steps` | ~~`readonly Step[]`~~ | **REMOVED** |
| `stages` | `readonly Stage[]` | **NEW** — replaces `steps` |
| `createdAt` | `number` | Unchanged |
| `updatedAt` | `number` | Unchanged |

---

## Modified Entity: StepEvent (scheduler output)

Two new fields added. `isParallel` semantics updated.

| Field | Type | Change |
|-------|------|--------|
| `dishId` | `string` | Unchanged |
| `dishName` | `string` | Unchanged |
| `stepId` | `string` | Unchanged |
| `stepName` | `string` | Unchanged |
| `stepType` | `StepType` | Unchanged |
| `startTime` | `WallClockTime` | Unchanged |
| `isParallel` | `boolean` | **Updated semantics** — now `true` when the event's Stage has `tracks.length > 1` (intra-dish parallelism). Cross-dish same-startTime parallel flag is moved to `isConcurrentWithOtherDish` (new field below). |
| `isConcurrentWithOtherDish` | `boolean` | **NEW** — `true` when another event from a different Dish has the same startTime. Carries the 001 meaning of the old `isParallel` field. |
| `stageId` | `string` | **NEW** — the Stage this step belongs to. All events in a parallel Stage share this id. |
| `trackId` | `string` | **NEW** — the Track within the Stage this step belongs to. Used for per-track UI lane grouping. |

**Rationale for renaming `isParallel` semantics**: The old `isParallel` meant "cross-dish overlap",
but the feature name "Do Alongside" introduces intra-dish parallelism, which is the more natural
meaning of "parallel" at the step level. Separating the two concepts avoids an ambiguous boolean.
The old meaning is preserved under a more specific name.

---

## Modified Entity: LiveStepState (alarm-scheduler runtime)

Two new fields added.

| Field | Type | Change |
|-------|------|--------|
| `stepId` | `string` | Unchanged |
| `dishId` | `string` | Unchanged |
| `stepName` | `string` | Unchanged |
| `dishName` | `string` | Unchanged |
| `scheduledStart` | `WallClockTime` | Unchanged |
| `status` | `LiveStepStatus` | Unchanged |
| `confirmedAt` | `number \| null` | Unchanged |
| `delayAppliedMinutes` | `number` | Unchanged |
| `stageId` | `string` | **NEW** — mirrors `StepEvent.stageId`. Enables `isStageComplete()` gate in timer UI. |
| `trackId` | `string` | **NEW** — mirrors `StepEvent.trackId`. Enables per-track delay cascade boundary. |

---

## Entity Relationships

```
Recipe
└── stages: Stage[]             ← sequential
    └── tracks: Track[]         ← parallel within stage
        └── steps: Step[]       ← sequential within track

Dish
└── stages: Stage[]             ← snapshot copy of stages from Recipe (or ad-hoc)
    └── tracks: Track[]
        └── steps: Step[]

MealPlan
└── dishes: Dish[]

         ┌─────── scheduleDish() ─────────────┐
         │  walks stages[] in reverse;         │
         │  for each stage, reverse-times       ▼
         │  each track independently      Schedule.events: StepEvent[]
         │  from shared stageEndTime       StepEvent.stageId → group
         │                                 StepEvent.trackId → lane
         └────── createLiveSession() ─────────▶ LiveSession
                                               .stepStates: LiveStepState[]
                                               .stageId / .trackId

── Future ──────────────────────────────────────────────────────────────
Course
└── courseStages: CourseStage[]
    └── dishes: Dish[]           ← parallel Dishes (same Stage/Track pattern, one level up)

Service
└── serviceStages: ServiceStage[]
    └── courses: Course[]        ← parallel Courses
```

---

## Stage/Track Semantics

### Sequential Stage (single track)
```
Stage { tracks: [Track { steps: [A, B, C] }] }
```
Equivalent to the old `steps: [A, B, C]`. Scheduled as: C → B → A (reverse walk).

### Parallel Stage (multi-track)
```
Stage {
  tracks: [
    Track { steps: [A] },     ← Track 1
    Track { steps: [B, C] },  ← Track 2
  ]
}
```
Scheduled as:
- Stage end time E (= start of next stage)
- Track 1: A starts at E − dur(A)
- Track 2: B starts at E − dur(B) − dur(C); C starts at E − dur(C)
- Stage start time = min(A.start, B.start) = used for overrun calculation

### Chained parallel groups (key scenario the old model couldn't handle)
```
stages: [
  Stage { tracks: [Track[prep 10m], Track[brine 45m]] },   ← join after 45m
  Stage { tracks: [Track[make stock 60m]] },               ← sequential
  Stage { tracks: [Track[plate 5m], Track[sauce 15m]] },   ← join after 15m
]
```

### Join Point Invariant
For every Stage: all Tracks end at the same time = `stageEndTime`. The scheduler
enforces this; it is not stored.

### Stage Completion (for timer gate)
A Stage is **complete** when every `LiveStepState` with the same `stageId` has
`confirmedAt !== null`. The first step of the subsequent Stage cannot be confirmed
until the preceding Stage is complete.

---

## Validation Rules

### Track
- `id`: non-empty string
- `steps`: non-empty array; each element passes `validateStep`; all `step.id` values unique within the Dish

### Stage
- `id`: non-empty string
- `tracks`: array with 1–10 elements; each element passes `validateTrack`

### Dish / Recipe `stages`
- Array with 1–20 elements; each element passes `validateStage`
- Total step count across all stages and tracks ≤ 200

### Cross-field
- All `stage.id`, `track.id`, and `step.id` values must be globally unique within the containing Dish/Recipe

---

## Storage & Backward Compatibility

**IndexedDB schema version**: unchanged. No new indexed columns.

**Format detection**: A stored record is in the old format if it has a top-level `steps` array and no `stages` array.

**Read-time upgrade** (deserialization adapter):
```
old: { steps: [S1, S2, S3] }
new: { stages: [
         { id: uuid(), tracks: [{ id: uuid(), steps: [S1] }] },
         { id: uuid(), tracks: [{ id: uuid(), steps: [S2] }] },
         { id: uuid(), tracks: [{ id: uuid(), steps: [S3] }] },
       ] }
```
Each old `Step` becomes its own single-track Stage, preserving sequential order.
After upgrade, the record is written back to IndexedDB (background, non-blocking).
Subsequent reads see the new format directly.
