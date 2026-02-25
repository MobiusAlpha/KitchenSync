# Feature Specification: Reverse-Timing Cooking Scheduler

**Feature Branch**: `001-reverse-timing`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "We're building a reverse-timer app that helps home cooks figure out when
to start each dish in a meal, based on prep, cooking, and cooldown times pre-configured for different
recipes (should also allow the ad-hoc addition of timing steps without creating a formalized recipe),
aiming for a specified 'done' time. Recipes should be able to be created and saved with all of the
timings of their components configured. Multiple recipes should be able to be combined into a meal as
individual dishes, and can be timed together."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single-Dish Reverse Schedule (Priority: P1)

A home cook wants to know exactly when to start preparing a dish so it is ready at a specific time.
They enter (or load) the dish's steps — prep, cook, rest, cooldown — with a duration for each, set a
target "ready by" time, and the app instantly shows them a step-by-step start schedule, working
backwards from that time.

**Why this priority**: This is the fundamental value proposition of the app. Every other story depends
on this capability, and it delivers complete, standalone value for a cook preparing a single dish.

**Independent Test**: Can be fully tested using only ad-hoc steps (no saved recipes required): a tester
adds steps manually, sets a target time, and verifies each step's calculated start time is correct.

**Acceptance Scenarios**:

1. **Given** a cook has entered three steps (20 min Prep, 45 min Cook, 10 min Rest) and set a target
   time of 7:00 PM, **When** they request a schedule, **Then** the app displays: Rest starts at
   6:50 PM, Cook starts at 6:05 PM, Prep starts at 5:45 PM.
2. **Given** a target time that is in the past, **When** the cook requests a schedule, **Then** the
   app warns that the target time has already passed and prompts the cook to choose a new time.
3. **Given** a dish with no steps entered, **When** the cook requests a schedule, **Then** the app
   prevents schedule generation and prompts the cook to add at least one step.
4. **Given** a valid schedule has been calculated, **When** the cook changes one step's duration,
   **Then** the entire schedule recalculates immediately without the cook needing to request it again.

---

### User Story 2 - Create and Save a Recipe (Priority: P2)

A home cook frequently makes the same dishes and wants to avoid re-entering timing information each
time. They create a named recipe, define its ordered steps with durations, and save it. On future
visits, they load the saved recipe to generate a reverse schedule without any re-entry.

**Why this priority**: Saved recipes are the core reuse mechanism of the app. Without them, every
session requires manual re-entry. This story unlocks efficient repeated use and is a prerequisite for
meal planning (US3).

**Independent Test**: Can be fully tested by creating a recipe, saving it, reloading the app, loading
the recipe into a timing session, and verifying all steps and durations are intact and produce the
correct schedule.

**Acceptance Scenarios**:

1. **Given** a cook has defined a recipe named "Roast Chicken" with four steps and their durations,
   **When** they save it, **Then** the recipe appears in their saved recipe list and can be loaded
   into any timing session.
2. **Given** a cook has a saved recipe, **When** they edit a step's duration and save again, **Then**
   the updated duration is reflected in all subsequent timing sessions using that recipe.
3. **Given** a cook selects a saved recipe for a timing session, **When** they view the steps,
   **Then** all steps and durations match what was saved, in the original order.
4. **Given** a saved recipe exists, **When** the cook deletes it, **Then** it no longer appears in
   the saved recipe list and cannot be loaded.

---

### User Story 3 - Multi-Dish Meal Planning (Priority: P3)

A home cook is preparing a full meal with multiple dishes. They combine several saved recipes (and
optionally ad-hoc dishes) into a meal plan, set a single target "ready by" time, and receive a
unified, chronologically-ordered schedule showing when to start every step across all dishes —
including steps from different dishes that run in parallel.

**Why this priority**: This is the most powerful use case for a dinner host, but it depends on US1
(scheduling logic) and US2 (saved recipes) being in place. It delivers substantially more value than
single-dish scheduling for anyone cooking a complete meal.

**Independent Test**: Can be fully tested by adding two or more dishes to a meal plan, setting a
target time, and verifying the combined schedule lists all steps from all dishes ordered by start
time with correct start times for each dish.

**Acceptance Scenarios**:

1. **Given** a meal plan with "Roast Chicken" (total: 90 min) and "Roasted Vegetables" (total:
   40 min), and a target of 7:00 PM, **When** the cook generates the schedule, **Then** Chicken
   Prep starts at 5:30 PM and Vegetable Prep starts at 6:20 PM, with all steps listed in
   chronological order.
2. **Given** a meal plan where two dishes have steps scheduled at the same time, **When** the
   schedule is displayed, **Then** both overlapping steps are visible with a clear indication that
   they run in parallel.
3. **Given** a meal plan with one saved recipe and one ad-hoc dish, **When** the cook generates
   the schedule, **Then** both dishes are included in the unified schedule.
4. **Given** a meal plan with at least one dish, **When** the cook changes the target time, **Then**
   the entire schedule recalculates immediately.
5. **Given** a meal plan with two dishes, **When** the cook removes one dish, **Then** the schedule
   recalculates automatically with only the remaining dish.

---

### User Story 4 - Live Countdown Timer (Priority: P4)

A home cook has a calculated schedule and is actively cooking. They start a live timer session and
the app counts down to each step's start time, alerting them when it is time to begin each step. They
can mark steps as done and the schedule remains visible throughout the session.

**Why this priority**: The planning output is most useful when paired with real-time guidance during
active cooking. This story closes the loop from planning to execution and is sequentially dependent
on US1 (and optionally US3) being complete.

**Independent Test**: Can be fully tested by generating any valid schedule, starting the live timer,
and verifying that the app alerts the user when the clock reaches each step's calculated start time.

**Acceptance Scenarios**:

1. **Given** an active timer session with the next step starting in 5 minutes, **When** that time
   arrives, **Then** the app displays a prominent alert indicating which step to begin and for which
   dish.
2. **Given** an active timer session, **When** the cook marks a step as complete, **Then** that
   step is visually distinguished as done and the next upcoming step is highlighted.
3. **Given** an active timer session, **When** the cook navigates away from the timer screen and
   returns, **Then** the timer has continued running accurately and reflects the current state.
4. **Given** an active timer session where the current time has passed a step's start time without
   the step being marked complete, **When** the cook views the schedule, **Then** that step is
   flagged as overdue.

---

### Edge Cases

- What happens when a meal's total cooking time exceeds the time available? The earliest calculated
  start time will fall in the past; the app MUST warn the cook that preparation needs to have
  started already, and display the overrun duration.
- What happens when a step has a duration of zero? Zero-duration steps MUST be rejected with a
  prompt to enter a positive duration.
- What happens if the cook removes a dish from a meal plan mid-session? The schedule MUST
  recalculate automatically with the remaining dishes.
- What happens when the app has no saved recipes yet? The app MUST allow the cook to begin an
  ad-hoc session without requiring any pre-saved data.
- What if two dishes in a meal plan have the same name? The app MUST distinguish them (e.g., by
  appending a number) so the unified schedule remains unambiguous.
- What if a saved recipe is loaded and then its steps are modified within the session? Changes in
  the session MUST NOT automatically overwrite the saved recipe; the cook MUST explicitly save to
  update it.

## Requirements *(mandatory)*

### Functional Requirements

#### Recipe Management

- **FR-001**: Users MUST be able to create a recipe with a name and an ordered list of one or more
  named steps.
- **FR-002**: Each step MUST have a name, a step type (one of: Prep, Cook, Rest, Cooldown), and a
  duration expressed as a positive whole number of minutes.
- **FR-003**: Users MUST be able to save a recipe for future use.
- **FR-004**: Users MUST be able to view, edit (name, steps, durations, order), and delete any
  saved recipe.
- **FR-005**: Saved recipes MUST persist across sessions without data loss.
- **FR-006**: Users MUST be able to reorder steps within a recipe before saving.

#### Ad-hoc Timing

- **FR-007**: Users MUST be able to start a timing session by entering steps directly, without
  creating or selecting a saved recipe.
- **FR-008**: Ad-hoc steps MUST support the same step types and duration configuration as steps
  within a saved recipe.
- **FR-009**: Users MUST be able to save an ad-hoc set of steps as a named recipe at any point
  during or after the session.

#### Scheduling

- **FR-010**: Users MUST be able to set a target "ready by" time (wall-clock HH:MM) for any dish
  or meal plan.
- **FR-011**: The system MUST calculate each step's start time by subtracting cumulative step
  durations from the target time in reverse step order.
- **FR-012**: The system MUST display the calculated schedule as an ordered list of step events,
  each showing: dish name, step name, step type, and start time.
- **FR-013**: If the earliest calculated start time is in the past, the system MUST display a
  prominent warning showing the overrun amount and preventing the cook from missing preparation
  windows silently.
- **FR-014**: Any change to a step duration or to the target time MUST trigger immediate
  recalculation of the schedule.

#### Meal Planning

- **FR-015**: Users MUST be able to create a meal plan containing one or more dishes.
- **FR-016**: Each dish in a meal plan MUST be sourced from either a saved recipe or an ad-hoc set
  of steps entered inline.
- **FR-017**: A meal plan MUST apply a single shared target "ready by" time to all dishes.
- **FR-018**: The system MUST generate a unified, chronologically-ordered schedule across all dishes
  in a meal plan.
- **FR-019**: Steps from different dishes scheduled at overlapping times MUST both appear in the
  schedule with a clear indication that they run in parallel.
- **FR-020**: Users MUST be able to add or remove dishes from a meal plan, with the schedule
  recalculating automatically after each change.

#### Live Timer

- **FR-021**: Users MUST be able to start a live countdown session from any calculated schedule.
- **FR-022**: The system MUST alert the user when the current time reaches each step's scheduled
  start time.
- **FR-023**: Users MUST be able to mark individual steps as complete during a live session.
- **FR-024**: The live timer MUST continue to run accurately if the user navigates away from and
  returns to the timer screen within the same session.

#### Data Persistence

- **FR-025**: Saved recipes MUST be associated with
  [NEEDS CLARIFICATION: a user account (requiring login/registration) or local device storage (no
  account needed, but data is device-specific and not synced across devices)]. This choice
  significantly affects scope: account-based persistence requires authentication, profile management,
  and server-side storage; local persistence requires none of these but limits the cook to one device.

### Key Entities

- **Recipe**: A named, reusable collection of ordered Steps. Attributes: name, optional description,
  ordered list of Steps, creation date, last-modified date.
- **Step**: A single timed action within a Recipe or ad-hoc session. Attributes: name, type
  (Prep / Cook / Rest / Cooldown), duration in whole minutes.
- **Meal Plan**: A collection of Dishes sharing a single target time. Attributes: name, target
  "ready by" time, ordered list of Dishes.
- **Dish**: An entry in a Meal Plan representing one recipe's worth of steps. Sourced from a saved
  Recipe or defined inline as ad-hoc Steps. Attributes: display name, step list.
- **Schedule**: The computed output for a Dish or Meal Plan. Contains a chronologically-ordered list
  of Step Events, each with: dish name, step name, step type, and calculated start time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can add ad-hoc steps and obtain a correct reverse schedule in under
  3 minutes, without prior training or documentation.
- **SC-002**: A returning user can load a saved recipe and generate a complete schedule in under
  30 seconds.
- **SC-003**: The schedule calculation is deterministic — identical step lists, durations, and target
  times always produce identical schedules.
- **SC-004**: All step start times in the schedule are accurate: the sum of all step durations equals
  exactly the difference between the first step's start time and the target time, with no accumulated
  rounding errors.
- **SC-005**: A cook can assemble a 3-dish meal plan and generate a unified schedule in under
  5 minutes.
- **SC-006**: 90% of users successfully generate a schedule for a single dish on their first attempt,
  without abandoning the flow.
- **SC-007**: Saved recipes are retrieved without data loss across at least 30 days of inactivity.
- **SC-008**: During a live timer session, each step alert is triggered at or within one minute after
  its scheduled start time, under normal operating conditions.

## Assumptions

- Steps within a single dish are strictly sequential — they do not overlap with each other within
  the same recipe or ad-hoc step list.
- Steps from different dishes in a meal plan may run in parallel; the app displays them side by
  side without attempting to resequence them to avoid conflicts.
- All durations are entered and stored in whole minutes; sub-minute precision is out of scope for
  this version.
- A "target time" is a wall-clock time (HH:MM) on the current or next calendar day; multi-day
  meal planning is out of scope.
- The app is intended for individual or household use; real-time collaborative multi-user meal
  planning is out of scope.
- Cloud sync and cross-device access are future enhancements; the initial scope covers single-device
  use (see FR-025 for clarification on persistence model).
