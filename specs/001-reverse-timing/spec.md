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

## Clarifications

### Session 2026-02-25

- Q: Persistence model — user accounts vs local storage? → A: Local device storage only; no accounts, no backend, no cloud sync in scope.
- Q: Live timer — alarm and delay behaviour? → A: Each step has an individually togglable alarm that fires at the step's scheduled start time. The cook confirms the step has been *started* (not completed). Delay (+1/+5/+10 min) can be applied to a specific step, a specific dish (all remaining unstarted steps for that dish), or the whole meal (all remaining unstarted steps across all dishes).
- Q: Step-level delay cascade? → A: Cascade — delaying a step shifts all subsequent unstarted steps in the same dish by the same amount. After any delay, the app displays the updated effective meal completion time.
- Q: Alarm default state? → A: A global app setting controls the default (ships as "all on"). The cook can override at the meal level, then at the dish level, then toggle individual steps. Each level inherits from its parent unless explicitly overridden.

### Session 2026-03-06

- Q: Should the app support adding a component as a single total-duration block (no named stages)? → A: Yes — single-block entry is supported (name + total duration only). Internally this auto-creates a single unnamed/default step; no distinct UI mode is exposed. The same entry flow handles both single-block and staged components.
- Q: Does "component" map to dish only, or can a single dish contain parallel sub-components? → A: Component = Dish only. Parallelism exists only between dishes; steps within a single dish are always strictly sequential.
- Q: What should the primary schedule view be? → A: Both views available. Default is a Gantt-chart view with each dish as a continuous horizontal lane and its steps shown as blocks within that lane. A chronological list view is also available and user-switchable.
- Q: Can a single-block component be expanded into named stages inline during a session (without returning to the recipe editor)? → A: Yes — a single-block component can be expanded into named stages directly within the scheduling session. The schedule recalculates immediately when stages are added.

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
the app counts down to each step's start time. Each step has an individually togglable alarm that
fires when the step's start time arrives, prompting the cook to confirm they have started that step.
The cook can also delay any step, dish, or the entire meal by +1, +5, or +10 minutes at any point
during the session. The full schedule remains visible throughout.

**Why this priority**: The planning output is most useful when paired with real-time guidance during
active cooking. This story closes the loop from planning to execution and is sequentially dependent
on US1 (and optionally US3) being complete.

**Independent Test**: Can be fully tested by generating any valid schedule, starting the live timer,
and verifying that the app sounds an alarm (if enabled) when the clock reaches a step's start time,
and that confirming start dismisses the alarm and marks the step as started.

**Acceptance Scenarios**:

1. **Given** an active timer session with a step alarm enabled and that step's start time arriving,
   **When** the clock reaches the scheduled start time, **Then** the app sounds the alarm and
   displays a prominent prompt identifying the step and dish.
2. **Given** an alarm prompt is displayed, **When** the cook confirms they have started the step,
   **Then** the alarm dismisses and the step is marked as started in the schedule.
3. **Given** an active timer session with the global default set to "all on", **When** the cook
   disables alarms at the dish level for one dish, **Then** no alarms fire for any step in that
   dish; steps in other dishes continue to fire alarms as usual.
4. **Given** a dish with alarms disabled at the dish level, **When** the cook enables the alarm for
   one specific step within that dish, **Then** only that step fires an alarm; all other steps in
   the dish remain silent.
5. **Given** an active timer session, **When** the cook applies a +5 minute delay to a specific
   step, **Then** that step's scheduled start time shifts forward by 5 minutes, all subsequent
   unstarted steps in the same dish also shift forward by 5 minutes, and the updated effective
   meal completion time is displayed.
6. **Given** an active timer session with multiple remaining steps for a dish, **When** the cook
   applies a +10 minute delay to that dish, **Then** all remaining unstarted steps for that dish
   shift forward by 10 minutes.
7. **Given** an active timer session with a multi-dish meal, **When** the cook applies a +5 minute
   delay to the whole meal, **Then** all remaining unstarted steps across all dishes shift forward
   by 5 minutes.
8. **Given** an active timer session, **When** the cook navigates away from the timer screen and
   returns, **Then** the timer has continued running accurately and reflects the current state.
9. **Given** an active timer session where the current time has passed a step's start time without
   the cook confirming it as started, **When** the cook views the schedule, **Then** that step is
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
- What if the cook applies a delay to a step that has already been confirmed as started? Delay
  actions MUST be ignored for already-started steps (FR-029).
- What if applying a delay pushes the meal's completion time past the original target? The app
  MUST always display the updated effective completion time after any delay (FR-030), and MUST
  warn the cook when the cumulative delays cause the original target time to be missed.

## Requirements *(mandatory)*

### Functional Requirements

#### Recipe Management

- **FR-001**: Users MUST be able to create a recipe with a name and either (a) an ordered list of
  one or more named steps, or (b) a single total-duration block (name + duration only, no explicit
  step decomposition). Option (b) is stored internally as a single auto-generated step.
- **FR-002**: Each step MUST have a duration expressed as a positive whole number of minutes. Step
  name and step type (one of: Prep, Cook, Rest, Cooldown) are optional when a component is entered
  as a single total-duration block; they are required when steps are entered individually.
- **FR-003**: Users MUST be able to save a recipe for future use.
- **FR-004**: Users MUST be able to view, edit (name, steps, durations, order), and delete any
  saved recipe.
- **FR-005**: Saved recipes MUST persist across sessions without data loss.
- **FR-006**: Users MUST be able to reorder steps within a recipe before saving.

#### Ad-hoc Timing

- **FR-007**: Users MUST be able to start a timing session by entering a component directly — either
  as a single total-duration block or as a series of named steps — without creating or selecting a
  saved recipe.
- **FR-008**: Ad-hoc components MUST support both entry forms: single total-duration block and
  individual named steps with optional types, matching the same options available in saved recipes.
- **FR-009**: Users MUST be able to save an ad-hoc set of steps as a named recipe at any point
  during or after the session.

#### Scheduling

- **FR-010**: Users MUST be able to set a target "ready by" time (wall-clock HH:MM) for any dish
  or meal plan.
- **FR-011**: The system MUST calculate each step's start time by subtracting cumulative step
  durations from the target time in reverse step order.
- **FR-012**: The system MUST display the calculated schedule in two views, both always available
  and user-switchable:
  (a) **Gantt view** (default): each dish occupies a continuous horizontal lane; steps are rendered
  as labelled blocks within that lane, positioned and sized proportionally to their start time and
  duration. This is the default view shown on schedule generation.
  (b) **Chronological list view**: an ordered list of step events, each showing dish name, step
  name, step type, and start time.
- **FR-013**: If the earliest calculated start time is in the past, the system MUST display a
  prominent warning showing the overrun amount and preventing the cook from missing preparation
  windows silently.
- **FR-014**: Any change to a step duration or to the target time MUST trigger immediate
  recalculation of the schedule.
- **FR-033**: During a scheduling session, users MUST be able to expand a single-block component
  (auto-generated single step) into multiple named stages inline, without returning to the recipe
  editor. The schedule MUST recalculate immediately when stages are added or modified.

#### Meal Planning

- **FR-015**: Users MUST be able to create a meal plan containing one or more dishes.
- **FR-016**: Each dish in a meal plan MUST be sourced from either a saved recipe or an ad-hoc set
  of steps entered inline.
- **FR-017**: A meal plan MUST apply a single shared target "ready by" time to all dishes.
- **FR-018**: The system MUST generate a unified schedule across all dishes in a meal plan,
  displayed in both Gantt view (default) and chronological list view per FR-012.
- **FR-019**: Steps from different dishes scheduled at overlapping times MUST both appear in the
  schedule with a clear indication that they run in parallel.
- **FR-020**: Users MUST be able to add or remove dishes from a meal plan, with the schedule
  recalculating automatically after each change.

#### Live Timer

- **FR-021**: Users MUST be able to start a live countdown session from any calculated schedule.
- **FR-022**: Each step in a live timer session MUST have an individually togglable alarm (on/off).
  Step alarms inherit their default state from the dish-level setting, which inherits from the
  meal-level setting, which inherits from the global app setting (FR-031). When a step's alarm is
  on and its scheduled start time arrives, the system MUST sound the alarm and display a prompt
  identifying the step and dish.
- **FR-023**: When a step alarm fires, the system MUST present the cook with a "Start" confirmation.
  Confirming MUST dismiss the alarm and mark the step as started. Completion of steps is not
  tracked; only start confirmation is required.
- **FR-024**: The live timer MUST continue to run accurately if the user navigates away from and
  returns to the timer screen within the same session.
- **FR-026**: During a live session, users MUST be able to delay a specific step by +1, +5, or
  +10 minutes. The delay MUST cascade — all subsequent unstarted steps in the same dish shift
  forward by the same amount.
- **FR-027**: During a live session, users MUST be able to delay all remaining unstarted steps for
  a specific dish by +1, +5, or +10 minutes.
- **FR-028**: During a live session, users MUST be able to delay all remaining unstarted steps
  across all dishes in the meal by +1, +5, or +10 minutes.
- **FR-029**: Delay actions MUST NOT affect steps already confirmed as started.
- **FR-030**: After any delay is applied (step, dish, or meal scope), the system MUST immediately
  display the updated effective meal completion time, reflecting the cumulative impact of all
  delays applied so far in the session.
- **FR-031**: The app MUST expose a global setting that controls the default alarm state (on/off)
  for all steps. This setting MUST ship with a default of "all on."
- **FR-032**: During a live timer session, users MUST be able to set the alarm state at the meal
  level (applying to all dishes and their steps that have no dish- or step-level override) and at
  the dish level (applying to all steps in that dish that have no step-level override). Individual
  step overrides take highest precedence; dish-level overrides take precedence over meal-level;
  meal-level overrides take precedence over the global setting.

#### Data Persistence

- **FR-025**: Saved recipes MUST be stored on the user's local device only. No account, login, or
  server-side storage is required. Data is device-specific and is not synced across devices. Cloud
  sync is explicitly out of scope for this version.

### Key Entities

- **Recipe**: A named, reusable collection of ordered Steps. Attributes: name, optional description,
  ordered list of Steps, creation date, last-modified date.
- **Step**: A single timed action within a Recipe or ad-hoc session. Attributes: duration in whole
  minutes (required); name and type (Prep / Cook / Rest / Cooldown) are optional. When a component
  is entered as a single total-duration block, one Step is auto-generated with no name/type.
- **Meal Plan**: A collection of Dishes sharing a single target time. Attributes: name, target
  "ready by" time, ordered list of Dishes.
- **Dish**: An entry in a Meal Plan representing one recipe's worth of steps. Sourced from a saved
  Recipe or defined inline as ad-hoc Steps. Attributes: display name, step list.
- **Schedule**: The computed output for a Dish or Meal Plan. Contains a set of Step Events, each
  with: dish name, step name, step type, calculated start time, and duration. Rendered in Gantt
  view (default, one lane per dish) or chronological list view, switchable by the user.

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
