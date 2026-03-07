# Quickstart & Integration Scenarios: 002-do-alongside

**Branch**: `002-do-alongside`
**Date**: 2026-03-07 (revised: Stage/Track model)

These scenarios are the integration-level acceptance tests. Each maps to one or more
spec acceptance scenarios. Terminology: a "Stage" is one time slot; a "Track" is one
sequential line within a Stage.

---

## Scenario 1 — Basic Two-Track Stage (Do Alongside)

**Covers**: US1 (add parallel track), SC-001, SC-003, SC-006

**Dish stages**:
```
Stage 1: Track A [Brine chicken 45m (prep)]
         Track B [Prep vegetables 10m (prep)]   ← Do Alongside
Stage 2: Track A [Make stock 60m (cook)]
```

**Expected schedule** (target: 18:00):

- Stage 2 end = 18:00; Make stock starts 16:00 → Stage 2 start = 16:00 (also Stage 1 end)
- Stage 1:
  - Track A (Brine chicken 45m): starts 15:15 (16:00 − 45m)
  - Track B (Prep vegetables 10m): starts 15:50 (16:00 − 10m)
- Stage 1 start = min(15:15, 15:50) = 15:15 (for overrun calc)

| Start | Step | stageId | trackId | isParallel |
|-------|------|---------|---------|------------|
| 15:15 | Brine chicken | `stage1` | `trackA` | true |
| 15:50 | Prep vegetables | `stage1` | `trackB` | true |
| 16:00 | Make stock | `stage2` | `trackA` | false |

**Assertions**:
1. Brine chicken and Prep vegetables share `stageId = stage1`.
2. Make stock has `isParallel = false`; its stageId is `stage2`.
3. Shared end time: 15:15 + 45m = 16:00; 15:50 + 10m = 16:00. ✓
4. ScheduleView renders Stage 1 as a grouped block with two sub-rows.
5. Timer gate: Make stock's "Mark Started" is disabled until both Stage 1 steps are confirmed.

---

## Scenario 2 — Longer Track than Anchor (Track B longer than Track A)

**Covers**: US1 AC3, SC-003

**Dish stages**:
```
Stage 1: Track A [Rest dough 20m (rest)]
         Track B [Make tomato sauce 35m (cook)]
Stage 2: Track A [Bake 30m (cook)]
```

**Expected schedule** (target: 19:00):

- Bake: 18:30–19:00. Stage 1 end = 18:30.
- Track A: Rest dough 20m → starts 18:10
- Track B: Make tomato sauce 35m → starts 17:55
- Stage 1 start = min(18:10, 17:55) = 17:55

| Start | Step | isParallel |
|-------|------|-----------|
| 17:55 | Make tomato sauce | true |
| 18:10 | Rest dough | true |
| 18:30 | Bake | false |

**Assertions**:
1. Tomato sauce starts BEFORE rest dough (longer track starts first).
2. Both events in Stage 1 end at 18:30. Shared end time invariant holds.
3. `overrunMinutes` is computed from 17:55 (earliest event).

---

## Scenario 3 — Chained Parallel Stages (core new capability)

**Covers**: FR-004 (multiple parallel groups), the scenario the old model couldn't handle.

**Dish stages**:
```
Stage 1: Track A [Prep station 5m (prep)]
         Track B [Chop onions 8m (prep)]
         Track C [Slice peppers 6m (prep)]
Stage 2: Track A [Sauté 20m (cook)]
Stage 3: Track A [Plate 5m (prep)]
         Track B [Make sauce 15m (cook)]
```

**Expected schedule** (target: 12:00):

- Stage 3 end = 12:00; Plate starts 11:55; Make sauce starts 11:45. Stage 3 start = 11:45.
- Stage 2 end = 11:45; Sauté 20m starts 11:25. Stage 2 start = 11:25.
- Stage 1 end = 11:25; Prep station 5m starts 11:20; Chop onions 8m starts 11:17;
  Slice peppers 6m starts 11:19. Stage 1 start = 11:17.

| Start | Step | Stage | isParallel |
|-------|------|-------|-----------|
| 11:17 | Chop onions | Stage 1 | true |
| 11:19 | Slice peppers | Stage 1 | true |
| 11:20 | Prep station | Stage 1 | true |
| 11:25 | Sauté | Stage 2 | false |
| 11:45 | Make sauce | Stage 3 | true |
| 11:55 | Plate | Stage 3 | true |

**Assertions**:
1. Stage 1 has three tracks — all three steps share `stageId = stage1` and `isParallel = true`.
2. Sauté is in a single-track Stage — `isParallel = false`.
3. Stage 3 is another parallel Stage — two more events grouped under `stage3`.
4. Timer gate: Sauté is blocked until all three Stage 1 steps are confirmed.
5. Timer gate: Plate and Make sauce are blocked until Sauté is confirmed.
6. ScheduleView shows three distinct stage groups with visual separators.

---

## Scenario 4 — Edit and Delete Tracks

**Covers**: US2 (edit/delete), SC-004

**Setup**: Dish from Scenario 1 (Stage 1 with two tracks).

**Sub-scenario A — Edit Track B step duration**:
1. Edit "Prep vegetables" from 10m to 20m.
2. New start: 16:00 − 20m = 15:40.
3. Track A (Brine chicken) start unchanged: 15:15.
4. Shared end time 16:00 still holds.

**Sub-scenario B — Remove Track B**:
1. Remove Track B from Stage 1.
2. Stage 1 now has one Track: [Brine chicken 45m].
3. Stage 1 is now a sequential stage: `isParallel = false`.
4. Schedule identical to a dish with `stages: [Stage[Brine], Stage[Stock]]`.

**Sub-scenario C — Save and reload**:
1. Add Track B back (Prep vegetables 10m).
2. Save recipe.
3. Reload (simulate page refresh / IndexedDB read).
4. Deserialized stages match what was saved exactly.
5. Schedule is identical to pre-save output.

---

## Scenario 5 — Live Timer: Stage Gate

**Covers**: US3, FR-007, SC-005

**Setup**: Dish from Scenario 1 (two-track Stage 1). Live session started at 15:00.

**At 15:15 (Stage 1 alarm fires — Brine chicken)**:
1. Both Stage 1 steps appear in the timer (Brine chicken AND Prep vegetables).
2. Make stock "Mark Started" button: DISABLED.
3. `isStageComplete(session, stage1.id)` → false.

**Cook confirms Brine chicken**:
1. BrineChicken.confirmedAt = now. Status → started.
2. Make stock still DISABLED. Prep vegetables not yet confirmed.
3. `isStageComplete(session, stage1.id)` → false.

**Cook confirms Prep vegetables**:
1. PrepVegetables.confirmedAt = now.
2. `isStageComplete(session, stage1.id)` → true.
3. Make stock "Mark Started" becomes ENABLED.
4. Make stock alarm fires normally at 16:00.

---

## Scenario 6 — Delay on Multi-Track Stage Step (No Cross-Track Cascade)

**Covers**: FR-011, Assumptions, US3 AC4

**Setup**: Live session from Scenario 5, at 15:15.

**Action**: Apply +10m delay to Prep vegetables (Track B, Stage 1).

**Expected**:
1. `PrepVegetables.scheduledStart` shifts from 15:50 to 16:00.
2. `BrineChicken.scheduledStart` unchanged at 15:15.
3. `MakeStock.scheduledStart` unchanged at 16:00.
4. No cascade beyond Prep vegetables (terminal node of its Track).
5. `UPDATE_DISPLAY` command emitted.

**Action**: Apply +5m delay to Brine chicken (Track A, Stage 1, single-step track).

**Expected**:
1. `BrineChicken.scheduledStart` shifts from 15:15 to 15:20.
2. `PrepVegetables.scheduledStart` unchanged (sibling Track — no cross-track cascade).
3. `MakeStock.scheduledStart` unchanged (Stage boundary — delay stays within Track).
4. `UPDATE_DISPLAY` command emitted.

---

## Scenario 7 — Backward Compatibility: Old Format Record Upgrade

**Covers**: R-008 (storage migration), SC-008

**Setup**: IndexedDB contains an old-format Dish record:
```json
{ "id": "d1", "displayName": "Roast Chicken",
  "steps": [
    { "id": "s1", "name": "Prep", "type": "prep", "durationMinutes": 15 },
    { "id": "s2", "name": "Roast", "type": "cook", "durationMinutes": 90 }
  ] }
```

**On read**:
1. `DeserializeDish` detects `steps` array, no `stages` field.
2. Adapter wraps: two Stages, each with one Track, each Track with one Step.
3. Returns a valid `Dish` with `stages: [Stage[Prep], Stage[Roast]]`.
4. Repository writes upgraded record back to IndexedDB (background).
5. Next read returns the new format directly.

**Schedule verification**:
1. Schedule computed from upgraded Dish matches what 001-reverse-timing would
   have computed from the original `steps[]` array.
   (Each step in its own single-track Stage = exact equivalent of sequential steps.)

---

## Scenario 8 — Last-Stage Parallel (Join at targetTime)

**Covers**: FR-010 (parallel on final stage), SC-007

**Dish stages**:
```
Stage 1: Track A [Roast chicken 90m (cook)]
         Track B [Make gravy 20m (cook)]
```
(Only one stage; the join point is targetTime.)

**Expected schedule** (target: 19:00):

- Stage 1 end = 19:00 (targetTime).
- Track A: Roast chicken starts 17:30.
- Track B: Make gravy starts 18:40.
- Stage 1 start = min(17:30, 18:40) = 17:30.

**Assertions**:
1. Both steps share stageId and end at 19:00.
2. `overrunMinutes` based on 17:30 (earliest event).
3. Timer shows both steps simultaneously. No downstream gate step exists.
4. Confirming both steps completes the session.
