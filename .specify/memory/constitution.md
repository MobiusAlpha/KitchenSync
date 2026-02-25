<!--
SYNC IMPACT REPORT
Version: 1.0.0 → 1.1.0 (MINOR — material expansion of Principle II; substantive new governance rule)
Modified principles:
  - II. Test-First / TDD: added test immutability rule and contract-based testing requirement
Modified sections:
  - Governance: "Complexity additions" replaced with explicit dependency-approval gate
Templates:
  ✅ .specify/memory/constitution.md — this file
  ✅ CLAUDE.md — Principle II summary updated; "Per-feature development" heading de-parenthesised
  — .specify/templates/tasks-template.md — no further changes needed
  — .specify/templates/spec-template.md — no changes needed
  — .specify/templates/plan-template.md — no changes needed
Deferred:
  - None.
-->

# KitchenSync Constitution

## Core Principles

### I. Library-First

Every discrete domain concern (timing engine, meal model, notification scheduler, etc.) MUST be
implemented as a self-contained, independently testable library before being consumed by any
application layer (PWA, API service, CLI). Libraries MUST:

- Have a single, clearly stated purpose — no organizational-only libraries permitted
- Expose a clean public interface; internal implementation details MUST NOT leak across the
  library boundary
- Be independently testable without requiring the PWA or any backend service to be running
- Ship with documentation covering the full public interface (see Principle IV)

Rationale: Library-first keeps KitchenSync's core logic — especially timing math — portable,
reusable, and verifiable in isolation from UI or infrastructure concerns.

### II. Test-First / TDD (NON-NEGOTIABLE)

All production code MUST be preceded by a failing test. The Red–Green–Refactor cycle is
strictly enforced:

1. Write a test describing the desired behavior → confirm it **FAILS**
2. Write the minimum code to make it pass → confirm it **PASSES**
3. Refactor to improve clarity or structure while keeping all tests green

Test tasks in `tasks.md` MUST appear before their corresponding implementation tasks. No feature
phase may be marked complete unless its tests exist and are passing. Skipping this cycle requires
explicit written justification and project owner approval recorded in the spec.

**Test immutability**: Once a test is written and passing, it MUST NOT be modified without
explicit project owner approval. A test change is treated as a governance event — it must be
justified, approved, and recorded. The only exception is renaming/refactoring that does not
alter the behavior being verified.

**Contract-based testing**: Tests MUST be written against contracts and abstractions, not
against concrete implementations. The relevant contracts/abstractions MUST be designed and
agreed upon alongside the tests, before implementation begins. Testing through a concrete type
directly (rather than its interface/contract) is a violation of this principle.

### III. Input Validation — Never Trust the Client

All data crossing any trust boundary into the system MUST be validated server-side against a
defined schema before processing. Client-side validation is encouraged for UX responsiveness
but MUST NOT be the sole line of defense. Specifically:

- Every API endpoint MUST validate request payloads against a schema prior to any business
  logic execution
- Validation failures MUST return structured, human-readable error responses indicating which
  field(s) failed and why
- Unvalidated data MUST NOT be persisted to any data store or forwarded to downstream services

Rationale: PWA clients run entirely in user-controlled environments. Only server-side validation
provides guarantees that cannot be bypassed by client manipulation.

### IV. Documentation Standards

All public classes, structs, interfaces, and functions MUST carry doc comments. These MUST cover:

- The purpose of the class/function
- All parameters (name, type, meaning, valid range where applicable)
- Return values and their semantics
- Any non-obvious invariants, side effects, or error conditions

Code inside function bodies MUST NOT be commented excessively. Comments within bodies are
reserved for logic that is genuinely non-obvious and cannot be clarified through better naming
or decomposition. When in doubt, refactor rather than comment.

Documentation MUST be written in the canonical doc-comment format of the language in use, kept
synchronized with the code it describes, and sufficient for a developer unfamiliar with the
feature to use the public interface correctly without reading the implementation.

### V. Cloud-Native Platform

The KitchenSync platform MUST conform to cloud-native principles across all layers:

- **Frontend**: Delivered as a Progressive Web App (PWA) — installable, offline-capable,
  and responsive across device sizes. No native app builds are in scope.
- **Backend**: All backend services MUST run inside containers. Bare-metal or VM-only
  deployments are not acceptable.
- **Portability**: Container images MUST be environment-agnostic. Runtime configuration
  (API URLs, secrets, feature flags) MUST be supplied via environment variables — never
  baked into images or committed to source control.
- **Observability**: All backend services MUST expose `/health` and `/ready` endpoints.
  Structured logging is required; unstructured log output is not acceptable in production.
- **Statelessness**: Services MUST be stateless by default. All persistent state lives in an
  external store (database, distributed cache, or object storage). Services MUST scale
  horizontally without coordination.

## Platform & Architecture Constraints

- **Permitted runtimes**: Browser (PWA), containerized backend services — no others without
  explicit amendment
- **Container standard**: Docker-compatible images; local development MUST use Docker Compose
  or equivalent; production orchestration is container-native (e.g., Kubernetes)
- **Infrastructure-as-Code**: All infrastructure changes MUST be version-controlled. Manual
  mutations to production infrastructure are prohibited.
- **Secrets management**: Secrets MUST NOT be committed to source control under any
  circumstances. Environment variable injection or a secrets manager MUST be used.

## Development Workflow

1. **Spec before code** — A reviewed `spec.md` MUST exist before any implementation begins.
2. **Plan before tasks** — A complete `plan.md` MUST exist before `tasks.md` is generated.
3. **Tests before implementation** — Per Principle II: test tasks MUST precede their
   implementation counterparts in `tasks.md` and MUST be written and confirmed failing first.
4. **Validation gate** — Any feature implementing an external-facing interface is not
   complete until server-side input validation is in place and tested.
5. **Documentation gate** — Any feature is not complete until all public interfaces introduced
   by that feature carry doc comments.

## Governance

- This constitution supersedes all other project practices, guidelines, and conventions.
- **Amendments** require: (a) written rationale documenting the problem with the current rule,
  (b) proposed replacement text, (c) a migration plan for any existing code affected, and
  (d) explicit project owner approval. Amendments MUST increment the version per semver rules.
- **Compliance review**: All PRs MUST include a constitution compliance check. Any violation
  must be resolved or explicitly waived — with written justification — before merge.
- **New dependencies**: Any new external dependency requires explicit project owner approval
  before being introduced. The request MUST include: (a) what the dependency provides,
  (b) a specific explanation of why no existing dependency or standard library feature can
  achieve the same outcome, and (c) a maintainability justification if that is the primary
  driver (maintainability is a valid reason, but MUST be argued explicitly — e.g., reduced
  boilerplate, clearer intent, established ecosystem — not assumed). New service boundaries
  and new internal libraries are subject to the same approval gate.
- **AI agent guidance**: Runtime development guidance for AI agents is maintained in `CLAUDE.md`
  at the repository root and MUST be kept in sync with this constitution.

**Version**: 1.1.0 | **Ratified**: 2026-02-25 | **Last Amended**: 2026-02-25
