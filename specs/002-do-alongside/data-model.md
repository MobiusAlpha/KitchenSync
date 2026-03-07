# Data Model: 002-do-alongside

**Branch**: `002-do-alongside`
**Date**: 2026-03-07
**Depends on**: `001-reverse-timing` entities (Step, Dish, Recipe, MealPlan, StepEvent, LiveStepState)

---

## Overview

This feature extends the existing data model with one new entity (`CompanionStep`) and additive fields on three existing entities (`Step`, `StepEvent`, `LiveStepState`). All changes are backward-compatible: new fields are optional or default to `null`/empty, and no existing field is removed or renamed.

---

## New Entity: CompanionStep

A `CompanionStep` is a timed action that runs in parallel with its anchor `Step`. It is always embedded inside the anchor step — it does not exist as a top-level entity and is never stored independently.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` (UUID v4) | Required. Immutable after creation. |
| `name` | `string` | Required. 1–80 characters. Must not be blank. |
| `type` | `StepType` | Required. One of: `prep`, `cook`, `rest`, `cooldown`. |
| `durationMinutes` | `number` | Required. Positive integer. 1–1440 (1 min to 24 hrs). |

**Constraints**:
- A `CompanionStep` MUST NOT itself carry a `companions` field. Nesting is forbidden at the type level.
- A `CompanionStep` inherits its end time from its anchor `Step`; this is not stored (it is always derived by the scheduler).
- `id` must be unique within the containing `Dish`/`Recipe` across both backbone steps and all companion steps.

---

## Modified Entity: Step

One new optional field is added. All existing fields and constraints are unchanged.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` (UUID v4) | Unchanged. |
| `name` | `string` | Unchanged. 1–80 chars. |
| `type` | `StepType` | Unchanged. |
| `durationMinutes` | `number` | Unchanged. 1–1440. |
| `companions` | `readonly CompanionStep[]` | **NEW. Optional.** Zero or more companion steps. When absent or empty, behaviour is identical to 001-reverse-timing. |

**Constraints on `companions`**:
- Max 10 companions per anchor step (prevents UI overload; matches the 20-dish cap convention).
- Each companion's `id` must be unique within the containing `Dish`/`Recipe`.
- A step with `companions` is called an **anchor step**; its `id` serves as the `parallelGroupId` for the whole group.
- An anchor step is itself a member of its own parallel group (it does not step aside — it still occupies the backbone position).

---

## Modified Entity: StepEvent (scheduler output)

One new field added. All existing fields and constraints are unchanged.

| Field | Type | Constraints |
|-------|------|-------------|
| `dishId` | `string` | Unchanged. |
| `dishName` | `string` | Unchanged. |
| `stepId` | `string` | Unchanged. For companions, this is the companion's own `id`. |
| `stepName` | `string` | Unchanged. |
| `stepType` | `StepType` | Unchanged. |
| `startTime` | `WallClockTime` | Unchanged. For companions: `anchorEndTime − companion.durationMinutes`. |
| `isParallel` | `boolean` | Unchanged. `true` only for cross-dish overlap (same startTime, different dishId). |
| `parallelGroupId` | `string \| null` | **NEW.** The anchor step's `id` if this event belongs to an intra-dish parallel group; `null` otherwise. Set on both anchor and companion events when a group exists. |

**Derived rules**:
- All events in the same parallel group share the same logical end time (the start time of the next backbone step, or `targetTime` if the group is last).
- Events may have different `startTime` values within a group (companions can be shorter or longer than the anchor).
- Sorting: events are ordered by `startTime` ascending, then `dishId` (stable). Within a group, companions with earlier start times appear before the anchor.

---

## Modified Entity: LiveStepState (alarm-scheduler runtime)

One new field added. All existing fields and constraints are unchanged.

| Field | Type | Constraints |
|-------|------|-------------|
| `stepId` | `string` | Unchanged. |
| `dishId` | `string` | Unchanged. |
| `stepName` | `string` | Unchanged. |
| `dishName` | `string` | Unchanged. |
| `scheduledStart` | `WallClockTime` | Unchanged. |
| `status` | `LiveStepStatus` | Unchanged. `pending \| started \| overdue`. |
| `confirmedAt` | `number \| null` | Unchanged. |
| `delayAppliedMinutes` | `number` | Unchanged. |
| `parallelGroupId` | `string \| null` | **NEW.** Mirrors `StepEvent.parallelGroupId`. Enables group-completion checks in the timer UI and cascade-boundary enforcement in delay logic. |

---

## Entity Relationships

```
Recipe
└── steps: Step[]              ← backbone only; ordered
    └── companions?: CompanionStep[]   ← embedded; unordered relative to each other

Dish
└── steps: Step[]              ← snapshot copy of backbone steps
    └── companions?: CompanionStep[]

MealPlan
└── dishes: Dish[]

         ┌─────────── scheduleDish() ───────────┐
         │                                       ▼
         │    Schedule.events: StepEvent[]
         │      StepEvent.parallelGroupId ─────── group membership
         │
         └─────── createLiveSession() ──────────▶ LiveSession
                                                    .stepStates: LiveStepState[]
                                                    LiveStepState.parallelGroupId
```

---

## Parallel Group Semantics

### Join Point

The join point is always the **next backbone step** after the anchor step in `steps[]`. If the anchor step is the last backbone step, the join point is the implicit serve moment (`targetTime`). This is never stored — it is a derived property of position in `steps[]`.

### Shared End Time Invariant

For every parallel group: `endTime(anchor) = endTime(companion_1) = endTime(companion_2) = … = startTime(joinStep)`.

This invariant is enforced by the scheduler. It is not stored anywhere; it is the output of the reverse-timing algorithm.

### Group Completion

A parallel group is **complete** when every `LiveStepState` with the same `parallelGroupId` has `confirmedAt !== null`. The join step's "Mark Started" action is unavailable until group completion. The alarm for the join step still fires on schedule (time-based); only the confirmation gesture is gated.

---

## Validation Rules

### CompanionStep
- `id`: non-empty string, UUID format preferred
- `name`: non-empty string, 1–80 chars
- `type`: one of the four `StepType` values
- `durationMinutes`: integer, 1 ≤ n ≤ 1440

### Step.companions (if present)
- Must be an array (not null, not object)
- Each element must pass `validateCompanionStep`
- Array length: 0–10
- All companion `id` values must be unique within the containing dish

### Cross-field
- No companion may have the same `id` as any backbone step in the same dish
- An anchor step with `companions.length === 0` is treated the same as `companions: undefined`

---

## Storage & Serialization

Companions are stored as part of the `Step` document inside `Dish` and `Recipe` in IndexedDB. No schema migration is required: the Dexie schema version is unchanged because `companions` is a nested field within the existing `steps` JSON column, not a new indexed column.

**Deserialization guard** (extends existing pattern from 001-reverse-timing):
- `deserializeStep` must handle `companions: undefined | null | unknown[]`
- If `companions` is missing or null, output `companions: []`
- Each element is passed through `validateCompanionStep`; invalid companions are dropped with a console warning (same defensive pattern used for invalid top-level steps)
