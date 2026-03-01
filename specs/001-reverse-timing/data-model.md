# Data Model: Reverse-Timing Cooking Scheduler

**Feature**: `001-reverse-timing` | **Date**: 2026-02-25
**Derived from**: `spec.md` (FR-001–FR-032), `plan.md` Technical Context

---

## Entity Overview

```
┌─────────────┐        ┌──────────────┐
│   Recipe    │1──────*│     Step     │
└─────────────┘        └──────────────┘
      │ (loaded as)
      ▼
┌─────────────┐        ┌──────────────┐
│  MealPlan   │1──────*│    Dish      │
└─────────────┘        └──────────────┘
                              │ (contains)
                              ▼
                       ┌──────────────┐
                       │     Step     │ (inline copy, not the saved Recipe's steps)
                       └──────────────┘
                              │ (scheduled as)
                              ▼
┌─────────────┐        ┌──────────────┐
│  Schedule   │1──────*│  StepEvent   │
└─────────────┘        └──────────────┘

┌──────────────────┐   ┌────────────────┐
│   LiveSession    │──*│ LiveStepState  │
└──────────────────┘   └────────────────┘

┌──────────────────────┐
│  AlarmConfiguration  │ (global app setting, inherited by session/dish/step)
└──────────────────────┘
```

---

## Entities

### Step

The atomic unit of a recipe or ad-hoc timing session.

| Field       | Type                                           | Constraints |
|-------------|------------------------------------------------|-------------|
| `id`        | `string` (UUID v4)                             | Required, immutable after creation |
| `name`      | `string`                                       | Required; 1–80 characters |
| `type`      | `'prep' \| 'cook' \| 'rest' \| 'cooldown'`    | Required; closed enum |
| `durationMinutes` | `number`                               | Required; integer; ≥ 1; ≤ 1440 (24 h) |

**Validation rules**:
- `name` must not be blank or whitespace-only
- `durationMinutes` must be a positive whole number (FR-002: "positive whole number of minutes")
- Zero-duration steps are rejected (edge case, spec §Edge Cases)

---

### Recipe

A named, reusable, ordered collection of Steps saved for future use.

| Field         | Type           | Constraints |
|---------------|----------------|-------------|
| `id`          | `string` (UUID v4) | Required, immutable; entity identity is the UUID — names need not be unique |
| `name`        | `string`       | Required; 1–100 characters |
| `description` | `string`       | Optional; max 500 characters |
| `steps`       | `Step[]`       | Required; ordered; ≥ 1 step |
| `createdAt`   | `number` (epoch ms) | Required; set on creation; immutable |
| `updatedAt`   | `number` (epoch ms) | Required; updated on every save |

**Validation rules**:
- `name` must not be blank
- `steps` array must contain at least one Step
- Step order is significant; the array index defines execution order
- Recipe names are NOT required to be unique — UUID `id` is the sole identity key
- Deleting a Recipe does not affect any active LiveSession derived from it

---

### MealPlan

A collection of Dishes sharing a single target "ready by" time.

| Field         | Type                  | Constraints |
|---------------|-----------------------|-------------|
| `id`          | `string` (UUID v4)    | Required, immutable |
| `name`        | `string`              | Required; 1–100 characters |
| `targetTime`  | `WallClockTime`       | Required; see type below |
| `dishes`      | `Dish[]`              | Required; ≥ 1 Dish; max 20 (validated by `validateMealPlan`) |
| `createdAt`   | `number` (epoch ms)   | Required; immutable |
| `updatedAt`   | `number` (epoch ms)   | Required |

**`WallClockTime`**: `{ hour: number; minute: number }` where `hour ∈ [0, 23]`, `minute ∈ [0, 59]`.
Represents a time on the current or next calendar day only. Multi-day planning is out of scope.

**Validation rules**:
- `dishes` must contain at least one Dish
- If two Dishes have the same `displayName`, a numeric suffix must be appended automatically
  to disambiguate (edge case, spec §Edge Cases)

---

### Dish

An entry in a MealPlan representing one recipe's worth of steps. Holds a snapshot copy of
steps, not a live reference — changes to the source Recipe after the Dish is created do NOT
automatically propagate (spec §Edge Cases: "Changes in the session MUST NOT automatically
overwrite the saved recipe").

| Field           | Type                  | Constraints |
|-----------------|-----------------------|-------------|
| `id`            | `string` (UUID v4)    | Required, immutable |
| `displayName`   | `string`              | Required; 1–100 chars; must be unique within the MealPlan (auto-suffix if duplicate) |
| `sourceRecipeId`| `string \| null`      | UUID of the Recipe this was loaded from; `null` for ad-hoc dishes |
| `steps`         | `Step[]`              | Required; ordered; ≥ 1 step; snapshot copy |

---

### Schedule

The computed output for a single Dish or a full MealPlan. Derived — never persisted.
Recalculated on every relevant input change (FR-014).

| Field        | Type          | Constraints |
|--------------|---------------|-------------|
| `targetTime` | `WallClockTime` | The "ready by" time this schedule was computed for |
| `events`     | `StepEvent[]` | Ordered ascending by `startTime`; at least one entry |
| `overrunMinutes` | `number \| null` | Positive if the earliest step's start falls in the past; `null` otherwise |

#### StepEvent

| Field        | Type             | Constraints |
|--------------|------------------|-------------|
| `dishId`     | `string`         | UUID of the parent Dish |
| `dishName`   | `string`         | Display name of the parent Dish |
| `stepId`     | `string`         | UUID of the Step |
| `stepName`   | `string`         | Display name of the Step |
| `stepType`   | `Step['type']`   | Copied from Step |
| `startTime`  | `WallClockTime`  | Calculated start time for this step |
| `isParallel` | `boolean`        | `true` if another StepEvent from a different dish starts at the same `startTime` |

**Scheduling algorithm** (from FR-011):
```
Given dish with steps [s₁, s₂, … sₙ] and targetTime T:
  startTime(sₙ) = T − durationMinutes(sₙ)
  startTime(sₙ₋₁) = startTime(sₙ) − durationMinutes(sₙ₋₁)
  …
  startTime(s₁) = T − Σ durationMinutes(sᵢ) for i = 1..n
```
Steps within a dish are strictly sequential (no intra-dish overlap). Steps from different
dishes may overlap — `isParallel` flags this.

---

### LiveSession

Represents an active countdown timer session. Created when the user starts a live timer from
a Schedule. Persisted to IndexedDB so it survives page reloads (Q3 resolution: auto-resume).

| Field              | Type                   | Constraints |
|--------------------|------------------------|-------------|
| `id`               | `string` (UUID v4)     | Required, immutable |
| `mealPlanId`       | `string \| null`       | UUID of source MealPlan if multi-dish; `null` for single-dish |
| `startedAt`        | `number` (epoch ms)    | Wall-clock time when the session was started |
| `targetTime`       | `WallClockTime`        | Original target time (before any delays) |
| `effectiveTargetTime` | `WallClockTime`     | Cook-confirmed effective target time. Updated only via `AcceptNewTargetTime` after the cook accepts a proposed delay. See two-phase delay flow below. |
| `stepStates`       | `LiveStepState[]`      | One entry per Step across all Dishes |
| `alarmOverrides`   | `AlarmOverride[]`      | Session-level alarm overrides at meal/dish/step scope |
| `totalDelayMinutes`| `number`               | Cumulative delay applied to the session; ≥ 0 |

#### LiveStepState

| Field              | Type                       | Constraints |
|--------------------|----------------------------|-------------|
| `stepId`           | `string`                   | UUID of the Step |
| `dishId`           | `string`                   | UUID of the parent Dish |
| `scheduledStart`   | `WallClockTime`            | Current scheduled start (shifts with delays) |
| `status`           | `'pending' \| 'started' \| 'overdue'` | Required |
| `confirmedAt`      | `number \| null`           | Epoch ms when the cook confirmed start; `null` until confirmed |
| `delayAppliedMinutes` | `number`                | Total minutes of delay applied to this specific step; ≥ 0 |

**Delay cascade rule** (FR-026):
When a step-level delay of `d` minutes is applied to step `sᵢ`:
- `sᵢ.scheduledStart += d` iff `sᵢ.status !== 'started'`
- For all `sⱼ` in the same dish where `j > i` and `sⱼ.status !== 'started'`: `sⱼ.scheduledStart += d`

**Two-phase delay flow** (FR-030):

Updating the cook-confirmed target time is a two-step process, to give the cook a chance
to review the computed impact before committing:

```
Phase 1 — Delay applied:
  applyStepDelay / applyDishDelay / applyMealDelay
    → shifts scheduledStart values for unstarted steps
    → calls computeEffectiveMealEnd (dynamic — from step states + durations)
    → emits UPDATE_DISPLAY { effectiveMealEnd }   ← proposed new target shown in UI
    LiveSession.effectiveTargetTime is NOT updated yet.

Phase 2 — Cook accepts:
  Cook taps "Accept" in TimerView
    → acceptNewTargetTime(session, effectiveMealEnd)
    → LiveSession.effectiveTargetTime = effectiveMealEnd   ← committed
```

`effectiveMealEnd = max(scheduledStart(lastUnstartedStepPerDish) + lastStepDuration)`

The UI (T070) reads `effectiveMealEnd` from the `UPDATE_DISPLAY` command, not from
`LiveSession.effectiveTargetTime`, while displaying the proposed time. It reads
`effectiveTargetTime` only for the overrun-vs-original-target banner (T071).

---

### AlarmConfiguration (global setting)

Persisted to IndexedDB. Governs the default alarm state for all sessions (FR-031).

| Field           | Type      | Constraints |
|-----------------|-----------|-------------|
| `id`            | `'global'` | Singleton; fixed key |
| `defaultEnabled`| `boolean` | Default: `true` (ships as "all on") |

#### AlarmOverride

Session-level overrides form the inheritance chain (FR-032):
global → meal → dish → step (highest precedence wins).

| Field      | Type                                    | Constraints |
|------------|-----------------------------------------|-------------|
| `scope`    | `'meal' \| 'dish' \| 'step'`           | Required |
| `targetId` | `string \| null`                        | DishId for `'dish'` scope; StepId for `'step'` scope; `null` for `'meal'` |
| `enabled`  | `boolean`                               | Required |

**Alarm resolution algorithm**:
```
function isAlarmEnabled(stepId, dishId, session, globalConfig):
  stepOverride  = session.alarmOverrides.find(o => o.scope==='step' && o.targetId===stepId)
  if stepOverride → return stepOverride.enabled
  dishOverride  = session.alarmOverrides.find(o => o.scope==='dish' && o.targetId===dishId)
  if dishOverride → return dishOverride.enabled
  mealOverride  = session.alarmOverrides.find(o => o.scope==='meal')
  if mealOverride → return mealOverride.enabled
  return globalConfig.defaultEnabled
```

---

## State Transitions

### LiveStepState.status

```
pending ──(scheduleStart arrives, alarm fires)──► [alarm displayed]
  │
  └──(cook confirms start)──► started
  └──(time passes scheduledStart without confirmation)──► overdue
     overdue ──(cook confirms start late)──► started
```

### LiveSession lifecycle

```
[Schedule computed] ──► LiveSession created (all steps: pending)
                               │
                        [timer running]
                               │
        ┌──────────────────────┴───────────────────────┐
        │ step confirmed started                        │ delay applied
        │ status: pending → started                     │ scheduledStart shifts
        │                                               │ effectiveTargetTime updated
        └──────────────────────────────────────────────-┘
                               │
                    [all steps started or overdue]
                               │
                        LiveSession ends
                        (no explicit "complete" state — session is done
                         when the cook leaves the timer screen)
```

---

## Validation Summary

| Entity         | Boundary             | Validator location |
|----------------|----------------------|--------------------|
| Step           | Form submit          | `meal-model` library — `validateStep()` |
| Recipe         | Save action          | `meal-model` library — `validateRecipe()` |
| MealPlan       | Save / schedule      | `meal-model` library — `validateMealPlan()` |
| WallClockTime  | Target time input    | `meal-model` library — `validateWallClockTime()` |
| LiveSession    | IndexedDB read       | `alarm-scheduler` library — `deserializeLiveSession()` schema guard |
| AlarmConfiguration | IndexedDB read   | `alarm-scheduler` library — `deserializeAlarmConfig()` schema guard |

All validators return `{ ok: true, value: T } | { ok: false, errors: ValidationError[] }` —
no exceptions thrown from validation paths.
