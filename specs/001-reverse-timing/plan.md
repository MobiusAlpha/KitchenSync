# Implementation Plan: Reverse-Timing Cooking Scheduler

**Branch**: `001-reverse-timing` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-reverse-timing/spec.md`

## Summary

KitchenSync is a reverse-timing cooking scheduler delivered as an installable Progressive Web App.
Users define meal steps with durations, set a target "ready by" time, and receive a backward-calculated
schedule. During active cooking, a live timer session counts down to each step, fires alarms, and
cascades any delays forward through unstarted steps in the same dish, displaying the updated meal
completion time after every change.

The app is local-only (no backend, no accounts, no cloud sync in v1). All logic is structured as
independently testable TypeScript libraries consumed by a Vite + React PWA shell, styled with
Bootstrap 5.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 19, Vite 6, vite-plugin-pwa (Workbox), Bootstrap 5,
react-bootstrap, Dexie.js (IndexedDB wrapper), Vitest, React Testing Library
**Storage**: IndexedDB via Dexie.js (recipes, meal plans, settings); sessionStorage for live timer
state snapshot
**Testing**: Vitest (unit + integration), React Testing Library (component/contract tests),
Playwright (E2E — deferred to polish phase)
**Target Platform**: Browser PWA (Chrome, Firefox, Safari — iOS Safari required for kitchen tablet use)
**Project Type**: Monorepo — pnpm workspaces with Turborepo; 4 library packages + 1 PWA app
**Performance Goals**: Schedule recalculation < 16 ms (single animation frame); alarm trigger
within ±1 s of scheduled time (SC-008)
**Constraints**: Fully offline-capable after first load; IndexedDB data must survive 30+ days
inactivity (SC-007); no server required; iOS Safari PWA quirks must be handled
**Scale/Scope**: Single-user, single-device; up to ~20 steps per dish, ~10 dishes per meal;
no concurrent-session coordination needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | ✅ PASS | Four standalone TS packages: `timing-engine`, `meal-model`, `scheduler`, `alarm-scheduler`. Each independently testable without PWA. |
| II. Test-First / TDD | ✅ PASS | Vitest enforced; all task phases will have test tasks preceding implementation tasks; contract-based testing via TS interfaces. |
| III. Input Validation | ⚠️ CONDITIONAL | No backend in scope (local storage only per spec). Validation MUST occur at every trust boundary: user input forms (client-side, first-and-only line), and on every IndexedDB read (schema guard on deserialization). Acknowledged trade-off: client is the only validation layer because there is no server. |
| IV. Documentation Standards | ✅ PASS | TSDoc required on all exported interfaces and functions across all packages. |
| V. Cloud-Native Platform | ⚠️ PARTIAL — SEE BELOW | |

### Principle V Trade-off

**Violation**: No backend service, no containers, no `/health` endpoint.

**Justification**: The spec explicitly excludes backend, accounts, and cloud sync from v1 scope
(FR-025, clarified 2026-02-25). Constitution Principle V is satisfied at the frontend layer
(PWA — installable, offline-capable, responsive). The backend cloud-native requirements (containers,
stateless services, observability endpoints) are **N/A for this feature** because there is no backend.
When a backend is introduced in a future feature, full Principle V compliance will be required at
that layer.

**Acknowledged trade-off recorded here per Guiding Design Principles governance requirement.**

### Principle III Conditional Detail

Because this is a client-only app, "server-side validation" collapses to "validation at every
trust boundary before data is processed or persisted." Concretely:

- All form inputs are parsed and validated through library-layer validators before being passed
  to any domain function or persisted to IndexedDB.
- Every IndexedDB read deserializes through a typed schema guard (Zod or hand-written) before
  the returned object is used — guarding against corrupted or migrated data formats.
- Raw user input MUST NOT be passed directly to scheduling or storage functions.

**Post-design re-check**: To be completed after Phase 1 design confirms no new trust boundaries
were introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-reverse-timing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── timing-engine.ts
│   ├── meal-model.ts
│   ├── scheduler.ts
│   ├── alarm-scheduler.ts
│   ├── storage.ts
│   └── ui-contracts.ts
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
packages/
├── timing-engine/           # Pure TS: duration math, time arithmetic, step-start calculation
│   ├── src/
│   │   └── index.ts
│   ├── tests/
│   └── package.json
├── meal-model/              # Pure TS: Recipe, Step, MealPlan, Dish entities + validation
│   ├── src/
│   │   └── index.ts
│   ├── tests/
│   └── package.json
├── scheduler/               # Pure TS: reverse-timing algorithm, schedule generation
│   ├── src/
│   │   └── index.ts
│   ├── tests/
│   └── package.json
└── alarm-scheduler/         # Pure TS: live session state, alarm hierarchy, delay cascade
    ├── src/
    │   └── index.ts
    ├── tests/
    └── package.json

apps/
└── pwa/                     # Vite + React 19 + Bootstrap 5 PWA
    ├── public/
    │   ├── icons/           # PWA icons (192, 512 px)
    │   └── manifest.webmanifest
    ├── src/
    │   ├── components/      # React components (recipe editor, schedule view, timer)
    │   ├── pages/           # Route-level pages
    │   ├── hooks/           # Custom React hooks (useSchedule, useTimer, useAlarm)
    │   ├── store/           # Zustand or React context state
    │   ├── storage/         # Dexie.js db definition + repository adapters
    │   └── main.tsx
    ├── tests/
    │   ├── components/      # React Testing Library tests
    │   └── e2e/             # Playwright (polish phase)
    ├── vite.config.ts
    └── package.json

package.json                 # pnpm workspace root
pnpm-workspace.yaml
turbo.json                   # Turborepo pipeline (build, test, lint)
```

**Structure Decision**: Monorepo with pnpm workspaces + Turborepo. Four `packages/` satisfy
Constitution Principle I (Library-First). One `apps/pwa` consumes them. Each package has its
own Vitest suite. The PWA app is the sole integration point — no backend in v1 scope.

## Complexity Tracking

| Principle | Tension | Resolution |
|-----------|---------|------------|
| V. Cloud-Native (backend) | No backend in v1 scope | N/A for this feature; full compliance required when backend is introduced |
| III. Input Validation (server-side) | Local-only app, no server | Validation at every client trust boundary; schema guards on all IndexedDB reads |

## Phase 0 Research Findings

*See [research.md](./research.md) — generated after research agent consolidation.*

## Phase 1 Design Decisions

*See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).*

## Open Questions (resolved during planning)

| Q | Answer |
|---|--------|
| Session persistence when app is backgrounded/closed mid-timer? | Live session state snapshots to IndexedDB on every state change. On reload, the session is restored and the timer resumes from the current wall-clock time — "Option A" behaviour without requiring a background service worker timer. Overdue steps are flagged on restore. |
| Alarm sound source? | Web Audio API oscillator (synthesized beep) — no external audio file dependency, works offline. |
| Routing strategy? | React Router v7 hash-based routing — avoids service worker route conflicts and works with static hosting. |
