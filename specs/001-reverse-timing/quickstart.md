# Quickstart: Integration Acceptance Scenarios

**Feature**: `001-reverse-timing` | **Date**: 2026-02-25
**Purpose**: End-to-end integration scenarios derived from spec.md user story acceptance criteria.
These scenarios are the definitive integration gate for the feature — all must pass before the
feature is considered complete. Reference T075 (Phase 7) for manual validation of these scenarios.

---

## How to Use This File

Each scenario is structured as **Given / When / Then** and maps 1:1 to a spec.md acceptance
scenario. Scenarios are ordered by user story priority (P1 first). They are designed to be run
sequentially as a walkthrough of the built PWA, not as automated tests.

**Prerequisites**: Run `pnpm turbo build` and open `apps/pwa` in a browser before starting.

---

## US1 — Single-Dish Reverse Schedule

### QS-US1-1: Basic reverse schedule calculation

**Given** the cook is on the Planner page (route `/`) with no steps entered
**When** they add three steps:
- Step 1: "Prep vegetables" — Prep — 20 min
- Step 2: "Roast" — Cook — 45 min
- Step 3: "Rest" — Rest — 10 min

**And** sets the target time to 19:00
**Then** the schedule displays:
- "Rest" starts at **18:50**
- "Roast" starts at **18:05**
- "Prep vegetables" starts at **17:45**

### QS-US1-2: Past-target overrun warning

**Given** the current time is, for example, 20:00
**When** the cook sets a target time of 18:00 with any steps
**Then** the app displays a prominent overrun warning showing how far in the past
the earliest start time falls (e.g., "Preparation needed to start 2 h 15 min ago")

### QS-US1-3: Empty step guard

**Given** the Planner page has no steps entered
**When** the cook attempts to view or start a schedule
**Then** schedule generation is blocked and the UI prompts "Add at least one step to generate a schedule"

### QS-US1-4: Instant recalculation on change

**Given** the cook has a valid schedule displayed (e.g., QS-US1-1 above)
**When** they change "Prep vegetables" duration from 20 min to 30 min
**Then** the schedule immediately updates (no submit action required):
- "Rest" stays at **18:50**
- "Roast" stays at **18:05**
- "Prep vegetables" shifts to **17:35**

---

## US2 — Create and Save a Recipe

### QS-US2-1: Save and reload recipe

**Given** the cook navigates to the Recipes page (route `/recipes`)
**When** they create a recipe named "Roast Chicken" with four steps and save it
**And** the app is reloaded (page refresh or browser restart)
**Then** "Roast Chicken" appears in the recipe list
**And** loading it into a planning session shows all four steps with their original durations in order

### QS-US2-2: Edit recipe, verify update in next session

**Given** a saved recipe exists with a step "Marinate" — 30 min
**When** the cook edits the step to "Marinate" — 45 min and saves
**Then** the next timing session loaded from this recipe shows "Marinate" as 45 min

### QS-US2-3: Load recipe — session is an independent copy

**Given** a saved recipe "Roast Chicken" is loaded into a planning session
**When** the cook changes a step duration within the session (without explicitly saving)
**Then** navigating to the Recipes page shows "Roast Chicken" still has the original unchanged steps

### QS-US2-4: Delete recipe

**Given** a saved recipe exists
**When** the cook deletes it
**Then** it no longer appears in the recipe list and cannot be loaded

---

## US3 — Multi-Dish Meal Planning

### QS-US3-1: Unified chronological schedule for two dishes

**Given** a meal plan with two dishes:
- "Roast Chicken" — total 90 min steps (e.g., 30 min Prep + 60 min Cook)
- "Roasted Vegetables" — total 40 min steps (e.g., 10 min Prep + 30 min Cook)

**And** the target time is set to 19:00
**Then** the unified schedule shows all steps from both dishes in chronological order:
- Chicken "Prep" starts at **17:30**
- Veg "Prep" starts at **18:20**
- Chicken "Cook" starts at **18:00**
- Veg "Cook" starts at **18:30**

(exact times depend on step configuration; the key constraint is all steps from both dishes
appear in a single sorted list)

### QS-US3-2: Parallel step indicator

**Given** a meal plan where two dishes have steps that start at the same time
**Then** both overlapping steps in the unified schedule display a visible "parallel" indicator

### QS-US3-3: Mixed saved + ad-hoc meal plan

**Given** a meal plan with one dish loaded from a saved recipe and one dish entered ad-hoc
**Then** both dishes appear in the unified schedule with correct reverse-timed start times

### QS-US3-4: Target time change recalculates all dishes

**Given** a meal plan with two dishes and a valid schedule displayed
**When** the cook changes the target time
**Then** all steps across all dishes recalculate immediately

### QS-US3-5: Remove dish recalculates

**Given** a meal plan with two dishes
**When** the cook removes one dish
**Then** the schedule recalculates automatically showing only the remaining dish's steps

---

## US4 — Live Countdown Timer

### QS-US4-1: Alarm fires at scheduled step time

**Given** an active timer session with at least one step alarm enabled
**When** the wall clock reaches that step's scheduled start time
**Then** the app plays an audio chime and displays a prominent prompt naming the step and dish

### QS-US4-2: Confirm step start dismisses alarm

**Given** an alarm prompt is displayed for a step
**When** the cook taps "Confirm Started"
**Then** the alarm chime stops, the prompt dismisses, and the step is marked as started in the timer view

### QS-US4-3: Alarm inheritance — dish-level disable

**Given** global alarm default is "all on"
**When** the cook disables alarms at the dish level for one dish
**Then** no alarms fire for any step in that dish; steps in all other dishes still alarm as expected

### QS-US4-4: Alarm inheritance — step-level re-enable over dish-level disable

**Given** alarms are disabled at the dish level for a dish with three steps
**When** the cook enables the alarm for step 2 of that dish specifically
**Then** only step 2 fires an alarm; steps 1 and 3 remain silent

### QS-US4-5: Step-level delay cascade

**Given** an active timer session with a dish containing three unstarted steps
**When** the cook applies +5 min delay to step 1
**Then**:
- Step 1's scheduled start shifts forward by 5 min
- Steps 2 and 3's scheduled starts also shift forward by 5 min
- The updated effective meal completion time is displayed

### QS-US4-6: Dish-level delay

**Given** an active timer session with one dish containing multiple unstarted steps
**When** the cook applies +10 min delay to that dish
**Then** all unstarted steps in that dish shift forward by 10 min

### QS-US4-7: Meal-level delay across all dishes

**Given** an active timer session with a multi-dish meal
**When** the cook applies +5 min delay at the meal level
**Then** all unstarted steps across all dishes shift forward by 5 min

### QS-US4-8: Session survives navigation

**Given** an active timer session is running
**When** the cook navigates away from the timer screen and then returns
**Then** the timer reflects the time elapsed during navigation and the session state is intact

### QS-US4-9: Overdue step flagging

**Given** an active timer session where a step's scheduled start time has passed
**And** the cook has not confirmed it as started
**When** the cook views the timer screen
**Then** that step is flagged as overdue with a visual indicator

---

## Edge Case Walkthrough

| Edge Case | Scenario Reference | Expected Outcome |
|-----------|-------------------|------------------|
| Zero-duration step | QS-US1-3 (StepForm) | Rejected at input with error message |
| Past target time | QS-US1-2 | Overrun warning with overrun amount shown |
| No recipes saved | (start any session) | Planner works without requiring saved data |
| Two dishes with same name | QS-US3-1 | Duplicate name auto-disambiguated (e.g., "Chicken #2") |
| Delay on already-started step | QS-US4-5 | Started steps are NOT shifted; only unstarted steps cascade |
| Delay pushes past original target | QS-US4-5/6/7 | Updated effective completion time always displayed; overrun banner shown |
| Session copy isolation | QS-US2-3 | Editing in session does NOT modify saved recipe |
