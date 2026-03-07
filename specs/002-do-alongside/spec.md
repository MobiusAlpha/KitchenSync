# Feature Specification: Intra-Dish Parallel Steps ("Do Alongside")

**Feature Branch**: `002-do-alongside`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User description: "Intra-dish parallel steps (do alongside). Within a single dish, a user can mark any step as do alongside an existing step. Both steps share the same end time (they finish together at the join point, which is always the next sequential step). Under the surface this is a DAG with parallel tracks auto-joining at the next step; in the UX it is a simple gesture on any step card — tap to get Edit / Delete / Do Alongside. Ends together is the universal default and is core to the product's reverse-timing philosophy."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add a Parallel Step to an Existing Dish (Priority: P1)

A user building a chicken noodle soup recipe wants to brine the chicken for 45 minutes, but also prep vegetables during the final 10 minutes of the brine. They tap the "Brine chicken" step, select "Do Alongside", and enter "Prep vegetables – 10 min". The schedule now shows both steps ending at the same moment, with the cook step beginning immediately after both complete.

**Why this priority**: This is the core value proposition of the feature. Without the ability to create a parallel step, nothing else in this feature exists. All other stories depend on it.

**Independent Test**: Can be fully tested by creating a single dish with two or more steps, applying "Do Alongside" to produce a parallel step, and verifying that the generated schedule places both steps ending at the same time.

**Acceptance Scenarios**:

1. **Given** a dish with at least two sequential steps, **When** the user taps any step card and selects "Do Alongside", **Then** a new step entry form opens pre-associated with that anchor step.
2. **Given** a new parallel step has been given a name and duration, **When** the user saves it, **Then** the schedule recalculates so that the parallel step ends at the same time as its anchor step.
3. **Given** a parallel step whose duration exceeds its anchor step's duration, **When** the schedule is generated, **Then** the parallel step's earlier start time propagates backward correctly so that both still end together.
4. **Given** a dish with a parallel step, **When** the user views the schedule, **Then** the parallel step is visually distinguished from sequential steps (e.g., shown side-by-side or with a grouping indicator).

---

### User Story 2 — Edit or Remove a Parallel Step (Priority: P2)

A user who has previously added a "Do Alongside" step wants to change its duration or delete it. They tap the parallel step card, see the same Edit / Delete / Do Alongside menu, choose Edit, update the duration, and the schedule recalculates. Alternatively they choose Delete and the step is removed, restoring the sequential timeline.

**Why this priority**: Parallel steps must be mutable like any other step. Without edit/delete, errors cannot be corrected and the feature is not production-ready.

**Independent Test**: Can be fully tested by creating a dish with a parallel step, then editing its duration and confirming the schedule updates, then deleting it and confirming the schedule reverts to the sequential baseline.

**Acceptance Scenarios**:

1. **Given** a parallel step exists on a dish, **When** the user taps it and selects "Edit", **Then** the step's name and duration are editable and the schedule updates on save.
2. **Given** a parallel step exists on a dish, **When** the user taps it and selects "Delete", **Then** the step is removed and the remaining steps reschedule as if it never existed.
3. **Given** a parallel step's duration is edited to be longer than its anchor step, **When** the schedule recalculates, **Then** the start time cascade is correct and both steps still end together.

---

### User Story 3 — Parallel Steps Appear Correctly in the Live Timer (Priority: P3)

During active cooking, a user following the live timer reaches a point where two steps are running in parallel. The timer surfaces both steps simultaneously, prompting the user to confirm each one independently when they complete it. The session does not advance to the next sequential step until both parallel steps are confirmed.

**Why this priority**: The live timer is the execution layer of KitchenSync. Parallel steps that are invisible or behave incorrectly during cooking undermine user trust and the core utility of the app.

**Independent Test**: Can be fully tested by starting a live timer session on a dish that contains a parallel step pair, confirming the steps appear concurrently, and verifying the next step only unlocks after both are confirmed.

**Acceptance Scenarios**:

1. **Given** a live session reaches a parallel step pair, **When** the timer view renders, **Then** both steps are shown simultaneously with individual timers.
2. **Given** both parallel steps are running, **When** the user confirms one step, **Then** that step is marked done but the session remains in the parallel state until the second step is also confirmed.
3. **Given** both parallel steps are confirmed, **When** the session advances, **Then** the next sequential (join) step begins immediately.
4. **Given** a delay is applied to one parallel step during cooking, **When** the schedule recalculates, **Then** the delay cascades only within that track and does not affect the anchor step's track or the join step beyond normal delay rules.

---

### Edge Cases

- What happens when a user tries to add a "Do Alongside" step to the last step in a dish (no downstream sequential join step exists beyond the implicit serve moment)?
- What happens when three or more steps are added as companions to the same anchor — i.e., a fan-in of more than two tracks at one join point?
- What happens when a companion step is given a duration of zero?
- What happens when a parallel step's duration is longer than the total time remaining before the serve time?
- How does the schedule display handle a meal plan where two dishes each have parallel steps scheduled at overlapping times?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A user MUST be able to initiate a "Do Alongside" action from any step card within a dish via a contextual menu containing at minimum "Edit", "Delete", and "Do Alongside".
- **FR-002**: A parallel step MUST share its end time with its anchor step; the scheduler MUST enforce this invariant automatically on every recalculation.
- **FR-003**: The join point for any parallel group MUST always be the next sequential step in the dish; users MUST NOT need to specify the join point manually.
- **FR-004**: Multiple steps MAY be attached as companions to the same anchor step (three or more steps converging at one join point).
- **FR-005**: The scheduler MUST calculate the start time of each parallel step independently, working backward from the shared end time using each step's own duration.
- **FR-006**: The dish schedule view MUST visually distinguish parallel step groups from sequential steps so that users can identify concurrent work at a glance.
- **FR-007**: The live timer MUST display all steps in a parallel group simultaneously and MUST NOT advance to the join step until every step in the group has been individually confirmed by the user.
- **FR-008**: Editing the duration of any step in a parallel group MUST trigger a full schedule recalculation for the affected dish.
- **FR-009**: Deleting a parallel companion step MUST remove it cleanly from the schedule without affecting the anchor step, other companions, or the join step.
- **FR-010**: When a parallel companion is added to the last step of a dish, the implicit serve moment serves as the join point.
- **FR-011**: Existing delay and overrun behaviour MUST continue to function correctly within individual parallel tracks; cross-track delay propagation is explicitly out of scope.
- **FR-012**: The recipe save/load cycle MUST preserve all parallel step relationships and reproduce an identical schedule after reload.

### Key Entities

- **ParallelGroup**: A set of two or more steps (including the anchor step) that share an end time and converge at a single join step. Belongs to one dish.
- **Anchor Step**: The existing sequential step to which one or more companions are attached. Remains part of the parallel group alongside its companions.
- **Companion Step**: A step created via "Do Alongside". Has its own name and duration. Belongs to exactly one parallel group. Its start time is calculated independently from the shared end time.
- **Join Step**: The next sequential step after a parallel group, or the serve moment if the group is at the end of the dish. Begins only when all steps in the group are confirmed complete.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a parallel companion step to any existing dish step in 3 taps or fewer.
- **SC-002**: Schedule recalculation for a dish with parallel steps completes within the same time budget as an equivalent sequential-only dish.
- **SC-003**: The shared end-time invariant holds for 100% of generated schedules containing parallel steps — no schedule may place two steps in the same group at different end times.
- **SC-004**: A dish with parallel steps saved and reloaded from storage produces an identical schedule in 100% of cases.
- **SC-005**: The live timer correctly gates progression to the join step on full confirmation of all parallel steps in 100% of timer sessions.
- **SC-006**: Users can identify which steps are running in parallel at a glance in both the schedule view and live timer without reading any help text.

## Assumptions

- "Ends together" is the universal default for all parallelism in KitchenSync; no offset or "starts together" variant is in scope for this feature.
- Nested parallelism (a companion step that itself has companions) is treated as a flat fan-in — all companions in a group join at the same point; recursive DAG depth beyond one level of branching per join is out of scope.
- A parallel companion attached to the last step of a dish implicitly joins at the dish's serve time, which is always defined.
- The "Do Alongside" contextual menu is available wherever step cards are shown: the recipe editor, the planner, and the meal-plan editor.
- Delay behaviour from feature 001 applies within each parallel track independently; cross-track delay propagation is out of scope.
