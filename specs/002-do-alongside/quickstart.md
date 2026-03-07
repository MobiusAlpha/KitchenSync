# Quickstart & Integration Scenarios: 002-do-alongside

**Branch**: `002-do-alongside`
**Date**: 2026-03-07

These scenarios are the integration-level acceptance tests. Each maps to one or more spec acceptance scenarios and can be executed end-to-end without mocking.

---

## Scenario 1 — Chicken Noodle Soup: Basic Parallel Group

**Covers**: US1 (add parallel step), SC-001, SC-003, SC-006

**Setup**: Create a recipe with three backbone steps:
```
1. Brine chicken    — 45 min (prep)
2. Make stock       — 60 min (cook)
3. Serve            — 0 min  [implicit serve moment]
```

**Action**: Add a companion to "Brine chicken":
```
"Prep vegetables" — 10 min (prep)
```

**Expected schedule** (target time: 18:00):

| Start | Step | Group |
|-------|------|-------|
| 15:00 | Prep vegetables | ∥ Brine chicken group |
| 15:05 | Brine chicken   | ∥ Brine chicken group |
| 16:00 | Make stock      | — |
| 18:00 | [Serve]         | — |

**Assertions**:
1. `PrepeVegetables.startTime = 15:50` and `BrineChicken.startTime = 15:05`, both have `parallelGroupId = BrineChicken.id`.
   Wait, let me recalculate:
   - Target: 18:00
   - Make Stock: ends 18:00, starts 16:00 (60 min)
   - Brine Chicken: ends 16:00, starts 15:15 (45 min)
   - Prep Vegetables: ends 16:00, starts 15:50 (10 min)
   So:
   - Brine Chicken starts 15:15, ends 16:00
   - Prep Vegetables starts 15:50, ends 16:00

Corrected expected schedule (target: 18:00):

| Start | Step | parallelGroupId |
|-------|------|----------------|
| 15:15 | Brine chicken | `brine-id` |
| 15:50 | Prep vegetables | `brine-id` |
| 16:00 | Make stock | null |

**Assertions**:
1. `BrineChicken.startTime` = 15:15, `PrepVegetables.startTime` = 15:50.
2. Both events have `parallelGroupId = BrineChicken.id`.
3. `MakeStock.parallelGroupId` = null.
4. `BrineChicken.startTime + 45min = PrepVegetables.startTime + 10min = MakeStock.startTime` (shared end time invariant).
5. Both appear visually grouped in ScheduleView (same group accent).

---

## Scenario 2 — Longer Companion than Anchor

**Covers**: US1 AC3 (companion longer than anchor), SC-003

**Setup**: Recipe with two backbone steps:
```
1. Rest dough       — 20 min (rest)
2. Bake             — 30 min (cook)
```

**Action**: Add companion to "Rest dough":
```
"Make tomato sauce" — 35 min (cook)
```

**Expected schedule** (target: 19:00):

- Bake: ends 19:00, starts 18:30 (30 min)
- Rest dough: ends 18:30, starts 18:10 (20 min)
- Make tomato sauce: ends 18:30, starts 17:55 (35 min)

| Start | Step | parallelGroupId |
|-------|------|----------------|
| 17:55 | Make tomato sauce | `rest-id` |
| 18:10 | Rest dough | `rest-id` |
| 18:30 | Bake | null |

**Assertions**:
1. `MakeTomatoSauce.startTime` (17:55) is EARLIER than `RestDough.startTime` (18:10).
2. Both events have `parallelGroupId = RestDough.id`.
3. The schedule sorts events by startTime ascending — tomato sauce appears first.
4. Shared end time invariant: 17:55 + 35min = 18:10 + 20min = 18:30 = `Bake.startTime`.
5. `overrunMinutes` calculation uses the earliest event (17:55) as the baseline.

---

## Scenario 3 — Three-Way Fan-in

**Covers**: FR-004 (multiple companions), SC-003

**Setup**: Recipe with two backbone steps:
```
1. Prep station     — 5 min (prep)
2. Cook everything  — 20 min (cook)
```

**Action**: Add two companions to "Prep station":
```
"Chop onions"   — 8 min (prep)
"Slice peppers" — 6 min (prep)
```

**Expected schedule** (target: 12:00):

- Cook everything: ends 12:00, starts 11:40
- Prep station: ends 11:40, starts 11:35
- Chop onions: ends 11:40, starts 11:32
- Slice peppers: ends 11:40, starts 11:34

| Start | Step | parallelGroupId |
|-------|------|----------------|
| 11:32 | Chop onions | `prep-id` |
| 11:34 | Slice peppers | `prep-id` |
| 11:35 | Prep station | `prep-id` |
| 11:40 | Cook everything | null |

**Assertions**:
1. All three events in the group have `parallelGroupId = PrepStation.id`.
2. All three end at 11:40 (shared end time invariant).
3. `CookEverything.parallelGroupId` = null.
4. ScheduleView renders all three with group accent.

---

## Scenario 4 — Edit and Delete Companions

**Covers**: US2 (edit/delete), SC-004

**Setup**: Recipe from Scenario 1 (BrineChicken with PrepVegetables companion).

**Sub-scenario A — Edit companion duration**:
1. Edit "Prep vegetables" duration from 10 min to 20 min.
2. New `PrepVegetables.startTime` = 16:00 − 20min = 15:40.
3. `BrineChicken.startTime` unchanged at 15:15.
4. Shared end time invariant still holds: 15:40 + 20min = 16:00.

**Sub-scenario B — Delete companion**:
1. Delete "Prep vegetables".
2. `BrineChicken.companions` = [].
3. `BrineChicken.parallelGroupId` in emitted StepEvent = null.
4. ScheduleView shows BrineChicken as a plain sequential step (no group accent).
5. Schedule is identical to a recipe with no companions at all.

**Sub-scenario C — Save and reload**:
1. Add companion back (10 min "Prep vegetables").
2. Save recipe to IndexedDB.
3. Reload app (simulate page refresh).
4. Load recipe from IndexedDB.
5. Generated schedule is byte-for-byte identical to pre-save schedule.

---

## Scenario 5 — Live Timer: Parallel Group Gate

**Covers**: US3 (live timer), FR-007, SC-005

**Setup**: Meal plan with Scenario 1 recipe, target time 18:00.
Start a live timer session at 15:00.

**At 15:15 (BrineChicken alarm fires)**:
1. Both "Brine chicken" and "Prep vegetables" appear in the timer simultaneously.
2. "Make stock" step card is present but its "Mark Started" button is DISABLED.
3. `isParallelGroupComplete(session, BrineChicken.id)` = false.

**User confirms "Brine chicken"**:
1. BrineChicken status → `started`, confirmedAt = nowMs.
2. "Make stock" button remains DISABLED.
3. `isParallelGroupComplete(session, BrineChicken.id)` = false (PrepVegetables not yet confirmed).

**User confirms "Prep vegetables"**:
1. PrepVegetables status → `started`.
2. `isParallelGroupComplete(session, BrineChicken.id)` = true.
3. "Make stock" button becomes ENABLED.
4. Timer advances normally; MakeStock alarm fires at 16:00.

---

## Scenario 6 — Delay Applied to Companion (No Cross-Track Cascade)

**Covers**: FR-011, spec Assumptions (delay scope), US3 AC4

**Setup**: Live timer session from Scenario 5, at 15:15.

**Action**: Apply +10 min delay to "Prep vegetables" (companion step).

**Expected**:
1. `PrepVegetables.scheduledStart` shifts from 15:50 to 16:00.
2. `BrineChicken.scheduledStart` is UNCHANGED at 15:15.
3. `MakeStock.scheduledStart` is UNCHANGED at 16:00.
4. No cascade beyond the companion step itself.
5. An `UPDATE_DISPLAY` command is emitted.

---

## Scenario 7 — Companion on Last Backbone Step (Serve-Time Join)

**Covers**: FR-010, spec Assumptions (last step join)

**Setup**: Recipe with one backbone step:
```
1. Roast chicken    — 90 min (cook)
```

**Action**: Add companion:
```
"Make gravy"        — 20 min (cook)
```

**Expected schedule** (target: 19:00):

- Roast chicken: ends 19:00 (targetTime), starts 17:30
- Make gravy: ends 19:00 (targetTime), starts 18:40

| Start | Step | parallelGroupId |
|-------|------|----------------|
| 17:30 | Roast chicken | `roast-id` |
| 18:40 | Make gravy | `roast-id` |

**Assertions**:
1. Both end at 19:00 (targetTime serves as the join point).
2. No join step exists; the invariant holds against targetTime.
3. Validation accepts this recipe (FR-010 — companion on last step is valid).
