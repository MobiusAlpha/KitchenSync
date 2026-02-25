# KitchenSync — Claude Agent Context

## Project

KitchenSync is a reverse-timing cooking app. Users enter cook times, prep steps, and cooldowns for dishes (or a full meal), plus a target serving time. The app works backward to tell them when to start each step.

## Spec-Kit

This project uses **GitHub Spec Kit** (v0.1.6), a structured workflow for AI-assisted software development. Spec-kit lives in `.specify/` and exposes slash commands via `.claude/commands/`. It organizes work into sequential phases: constitution → spec → clarify → plan → tasks → implement.

**Do not research spec-kit.** Everything you need is documented here and in the files below.

---

## Slash Commands (Workflow Order)

| Command | Purpose | Creates |
|---------|---------|---------|
| `/speckit.constitution` | Define project principles and governance | `.specify/memory/constitution.md` |
| `/speckit.specify <description>` | Turn a feature description into a formal spec | `specs/<NNN>-<name>/spec.md` + new git branch |
| `/speckit.clarify` | Ask up to 5 targeted questions to tighten the spec | Updates `spec.md` in place |
| `/speckit.plan` | Research + design: data model, contracts, quickstart | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` |
| `/speckit.tasks` | Break the plan into a dependency-ordered task checklist | `tasks.md` |
| `/speckit.analyze` | Read-only consistency check across spec/plan/tasks | Report only, no file writes |
| `/speckit.checklist` | Generate domain-specific quality checklists | `checklists/*.md` |
| `/speckit.implement` | Execute tasks in order, marking them off as complete | Source code + marks `[X]` in `tasks.md` |
| `/speckit.taskstoissues` | Convert tasks to GitHub Issues | GitHub Issues |

---

## Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project principles (filled by /speckit.constitution)
├── templates/                   # Scaffolding templates for each artifact
└── scripts/bash/                # Shell scripts called by the slash commands

specs/
└── <NNN>-<feature-name>/        # One directory per feature (created by /speckit.specify)
    ├── spec.md                  # Feature specification (user stories, requirements, success criteria)
    ├── plan.md                  # Implementation plan (tech stack, structure, phases)
    ├── research.md              # Phase 0 research findings and decisions
    ├── data-model.md            # Entities, relationships, validation rules
    ├── contracts/               # Interface contracts (API, CLI, UI, etc.)
    ├── quickstart.md            # Integration test scenarios
    ├── tasks.md                 # Ordered task checklist (the implementation backlog)
    └── checklists/              # Quality gate checklists
```

`/speckit.specify` also **creates and checks out a new git branch** named `<NNN>-<feature-name>`. All feature work lives on that branch.

---

## Key Conventions

### spec.md
- Written for non-technical stakeholders — no tech stack, no implementation details
- User stories are prioritized (P1, P2, P3…) and each must be independently testable
- Requirements use `FR-001`, `FR-002`… numbering
- Success criteria are measurable and technology-agnostic

### plan.md
- Created by `/speckit.plan`, which runs shell scripts and may spawn research sub-agents
- Contains a **Constitution Check** gate that must pass before design proceeds
- Defines the concrete tech stack, file structure, and dependency decisions

### tasks.md
- Every task uses strict checklist format: `- [ ] T001 [P] [US1] Description in path/to/file.ext`
- `[P]` = parallelizable; `[US1]` = maps to User Story 1 in spec.md
- Tasks are grouped into phases: Setup → Foundational → one phase per user story → Polish
- During `/speckit.implement`, completed tasks are marked `[X]`

### constitution.md
- Project-wide non-negotiable principles
- Governs all downstream artifacts — violations in plan/tasks are CRITICAL findings in `/speckit.analyze`
- Versioned with semantic versioning (MAJOR.MINOR.PATCH)

---

## Typical Session Flow

**First-time setup (done by the human):**
1. Run `/speckit.constitution` → agree on project principles
2. Run `/speckit.specify <feature description>` → creates the spec and feature branch

**Per-feature development (can be AI-driven):**
3. Run `/speckit.clarify` → resolve ambiguities before planning
4. Run `/speckit.plan` → produces research, data model, contracts
5. Run `/speckit.tasks` → produces the ordered task list
6. (Optional) Run `/speckit.analyze` → catch consistency issues before coding
7. Run `/speckit.implement` → writes code phase-by-phase

---

## What to Do When Starting a New Session

1. Read this file first.
2. Check what branch you are on: `git branch --show-current`
3. Find the active feature directory: `ls specs/`
4. Read `specs/<NNN>-<name>/spec.md` and `plan.md` (if they exist) to understand where work left off.
5. Check `tasks.md` for unchecked tasks (`- [ ]`) to know what remains.
6. Resume from the appropriate slash command in the workflow above.

Do **not** re-research spec-kit or re-read the `.specify/` internals unless something is broken — this file is the canonical summary.

---

## Branch Notes

- `/speckit.specify` creates feature branches like `001-reverse-timing`
- Push completed feature work to the session's designated `claude/…` branch by merging the feature branch into it before pushing.
