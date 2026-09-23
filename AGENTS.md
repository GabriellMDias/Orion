# AGENTS.md

## Purpose

This repository is designed to be developed and maintained collaboratively by humans and AI agents.

The repository itself is the primary source of truth.

Code, documentation, tests, schemas, architecture rules, and generated artifacts must remain consistent with each other.

Do not rely on undocumented assumptions.

---

## Language

English is the canonical language of this repository.

All source code, identifiers, comments, documentation, commit-facing artifacts, database descriptions, API descriptions, logs, error codes, tests, scripts, and developer tooling must use English by default.

Do not introduce Portuguese or other languages into repository artifacts unless explicitly required by product localization or external data.

---

## Core Principles

When working in this repository:

1. Understand before changing.
2. Prefer existing patterns over introducing new ones.
3. Keep changes small, explicit, and verifiable.
4. Preserve architectural boundaries.
5. Update documentation when behavior, architecture, contracts, or operational procedures change.
6. Add or update tests for behavior changes.
7. Prefer mechanically enforced rules over written conventions.
8. Do not duplicate knowledge that can be generated from a canonical source.
9. Do not hide architectural decisions inside implementation details.
10. Never weaken validation, tests, typing, security, or observability merely to make a change pass.

---

## Repository Navigation

Before making a significant change, inspect the relevant documentation.

Primary documentation locations:

- `README.md` — repository overview and getting started.
- `docs/architecture/` — system architecture and architectural boundaries.
- `docs/domains/` — business domains and domain rules.
- `docs/adr/` — Architecture Decision Records.
- `docs/database/` — database conventions and non-generated database documentation.
- `docs/api/` — API conventions and contracts.
- `docs/reliability/` — reliability, error handling, and observability.
- `docs/security/` — security requirements and threat-related decisions.
- `docs/runbooks/` — operational procedures and incident response.
- `docs/generated/` — generated documentation. Do not edit manually.

More specific `AGENTS.md` files may exist deeper in the repository.

When present, the closest `AGENTS.md` to the file being modified provides additional instructions for that area.

---

## Source of Truth

Whenever possible, maintain one canonical source and derive other artifacts from it.

Examples:

- Database schema → database reference documentation.
- API schemas → OpenAPI documentation.
- OpenAPI → generated SDKs.
- Component metadata/stories → component documentation.
- Typed configuration schemas → configuration reference.
- Runtime schemas → validation and types.

Do not manually duplicate information that can be generated reliably.

Generated files must never become an independent source of truth.

---

## Documentation

Documentation is required when information cannot be safely inferred from the code alone.

Document:

- architectural decisions;
- business rules;
- invariants;
- non-obvious constraints;
- side effects;
- public contracts;
- security-sensitive behavior;
- important failure modes;
- operational procedures;
- integration behavior;
- unusual implementation decisions and their rationale.

Do not add comments that merely restate the code.

Prefer explaining **why**, **constraints**, and **consequences** rather than narrating obvious implementation details.

If code behavior changes and existing documentation becomes inaccurate, updating the documentation is part of the change.

---

## Architecture

Do not introduce new architectural patterns without checking existing architecture documentation and ADRs.

Before creating a new abstraction, service, package, dependency, or cross-layer relationship:

1. Search for an existing equivalent.
2. Check documented architectural boundaries.
3. Prefer the established pattern.
4. If a genuinely new architectural decision is required, document it with an ADR.

Architecture rules should be enforced mechanically whenever practical through:

- type systems;
- package boundaries;
- lint rules;
- dependency rules;
- tests;
- CI checks.

Do not bypass an architectural constraint instead of solving the underlying problem.

---

## Shared Code

Prefer sharing:

- domain contracts;
- schemas;
- validation;
- API clients;
- domain logic that is platform-independent;
- observability primitives;
- configuration;
- test utilities;
- design tokens where appropriate.

Do not create shared abstractions solely to eliminate small amounts of duplication.

A shared abstraction must have a clear semantic purpose.

---

## Database

Database changes must be explicit, reviewable, and reproducible.

When modifying the database:

- use the project's migration mechanism;
- provide canonical documentation for every application-owned table and column;
- document the purpose and behavior of every view, materialized view, function, procedure, and trigger;
- document non-obvious constraints, indexes, enums, domains, and database-specific behavior;
- prefer database-native comments or schema metadata when they can serve as the canonical source for generated documentation;
- preserve data integrity;
- consider rollback and backward compatibility;
- update generated database documentation;
- add tests when database behavior changes.

Do not make undocumented production-only schema changes.

Business rules should not be hidden in triggers or procedures unless their use is deliberate and documented.

## Migration History

Migration history represents transitions between released database states, not every intermediate development experiment.

### Unreleased migrations

Migrations that have never been applied to a persistent released environment may be rewritten, combined, regenerated, or removed when requirements change.

Do not preserve obsolete create/drop, add/remove, or rename/re-rename migration sequences merely because they occurred during development.

Before a release, prefer the smallest coherent set of migrations that safely transforms the last released schema into the intended new schema.

### Released migrations

Once a migration has been applied to production or another environment whose migration history is considered permanent, treat that migration as immutable.

Do not modify, delete, reorder, or squash released migrations.

Any subsequent reversal or modification must be represented by a new migration.

### Safety over migration count

Do not optimize for the absolute minimum number of migrations.

Use multiple migrations when required for:

- safe data backfills;
- backward-compatible deployments;
- zero-downtime schema changes;
- expand-and-contract migrations;
- large data transformations;
- operational safety.

The goal is the minimum number of **meaningful and safe** migrations, not necessarily a single migration.

### Before creating a migration

Determine whether the schema change is still experimental or is being prepared for release.

When iterating on an unreleased feature, prefer updating the unreleased database change rather than accumulating migrations that only undo previous unreleased migrations.

Never rewrite migration history merely to make tooling errors disappear.

If there is uncertainty about whether a migration has already been released, treat it as immutable until its release status is verified.

---

## APIs and Contracts

Public and cross-application contracts must be explicit and versionable.

Do not independently redefine the same contract in multiple applications.

When changing an API or shared contract:

- evaluate backward compatibility;
- update its canonical schema;
- update or regenerate dependent clients;
- update relevant tests;
- update documentation.

Errors exposed across application boundaries must use the project's standard error format.

---

## Error Handling

Expected failures must be represented explicitly.

Unexpected failures must be observable.

Do not:

- silently swallow exceptions;
- expose internal stack traces to end users;
- return arbitrary error shapes;
- log secrets or sensitive credentials.

Errors should provide enough context for investigation while respecting privacy and security requirements.

Where available, preserve correlation identifiers such as:

- request ID;
- trace ID;
- error/event ID.

---

## Observability

Production-relevant code must be observable.

Use the project's shared observability infrastructure rather than introducing isolated logging or telemetry mechanisms.

Prefer structured telemetry.

Important operations should provide sufficient context through appropriate:

- logs;
- traces;
- metrics;
- error reporting.

Never log:

- passwords;
- authentication tokens;
- API keys;
- private keys;
- session secrets;
- payment credentials;
- other prohibited sensitive information.

---

## Testing

Behavior changes require appropriate verification.

Use the lowest-cost test that reliably validates the intended behavior, while adding broader integration coverage when boundaries or integrations are involved.

Tests should validate behavior, not implementation details unnecessarily.

A bug fix should include a regression test that fails before the fix and passes afterward whenever practical.

If a regression test is not practical, document why and describe how the fix was verified.

Do not delete, disable, or weaken a valid test merely because it fails after a change.

---

## Generated Files

Files marked as generated must not be edited manually.

Change their canonical source and regenerate them using the repository tooling.

If generated output is stale, regenerate it rather than patching the output directly.

---

## Dependencies

Before adding a dependency:

1. Check whether the repository already provides the required capability.
2. Prefer standard platform functionality when reasonable.
3. Consider maintenance, security, licensing, bundle/runtime cost, and ecosystem maturity.
4. Avoid introducing multiple libraries that solve the same problem without a documented reason.

New foundational dependencies may require an ADR.

---

## Security

Treat all external input as untrusted.

Follow secure defaults.

Do not:

- hardcode secrets;
- commit credentials;
- disable security controls to simplify development;
- expose sensitive internal details through errors;
- trust client-side validation as the only validation layer.

Security-sensitive changes require explicit tests and documentation where appropriate.

---

## Change Workflow

For each task:

1. Read the relevant code and documentation.
2. Identify the existing pattern.
3. Determine the smallest coherent change.
4. Implement the change.
5. Add or update tests.
6. Update affected documentation.
7. Regenerate derived artifacts when required.
8. Run the repository validation commands.
9. Review the final diff for unintended changes.

Do not declare a task complete while known validation errors remain unless the limitation is explicitly reported.

---

## Validation

The repository will provide a canonical command for complete local validation.

Once defined, always run it before considering substantial work complete.

Until such tooling exists:

- do not invent validation commands;
- use the commands actually defined by the repository;
- clearly report checks that could not be performed.

---

## AI Agent Behavior

AI agents working in this repository must:

- inspect relevant files before editing;
- avoid guessing about repository-specific behavior;
- search for existing implementations before creating new ones;
- follow local conventions;
- preserve unrelated code;
- avoid broad refactors unless required by the task;
- explain important assumptions when they cannot be verified;
- leave the repository in a more understandable state than before.

When requirements conflict with repository architecture or documented decisions, identify the conflict rather than silently bypassing the architecture.

When uncertain about an architectural choice, prefer the least irreversible solution.

---

## Definition of Done

A change is complete when, as applicable:

- implementation is correct;
- architectural boundaries are respected;
- tests pass;
- types and static analysis pass;
- generated artifacts are current;
- documentation is current;
- observability is preserved or improved;
- security requirements are satisfied;
- no unrelated changes were introduced.

Correct code with stale documentation is not complete.

Passing tests with violated architecture is not complete.

Documentation without enforceable implementation where enforcement is practical is not complete.
