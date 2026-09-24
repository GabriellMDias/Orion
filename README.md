# Orion

Orion is an AI-first engineering foundation for applications maintained collaboratively by humans and AI agents. The repository is the shared source of truth for architecture, contracts, schemas, implementation, tests, and operational knowledge.

Its purpose is a reusable engineering environment that remains understandable as applications evolve: explicit boundaries, meaningful shared code, reproducible validation, observable production behavior, and safe database evolution. It is not a collection of unrelated libraries or an attempt to abstract every technology and eliminate all duplication.

## Current state

Orion is in its foundation phase. The repository contains documentation, eleven architectural decision records, a pnpm workspace, local validation tooling, and CI configuration. Applications, shared runtime packages, and generated references have not been implemented. Consult the [CI status](docs/architecture/continuous-integration.md) for remote execution and repository-setting availability.

Accepted architecture and implemented capability are different states. Consult the [technology map](docs/architecture/technology-decisions.md) for selected directions and deliberately deferred choices, and [validation availability](docs/validation.md) for current checks. With Node.js 24.13.0 and pnpm 11.25.0, run `pnpm install --frozen-lockfile` and `pnpm validate`. No application build or test command exists yet.

Directory trees in architecture documents describe intended responsibilities, not proof that those directories exist. The physical repository takes precedence over illustrations. English is the canonical repository language; product localization is separate.

## Start here

| Task | Entry point |
| --- | --- |
| Find the policy for a change | [Documentation task index](docs/README.md) |
| Understand contributor and agent obligations | [Global instructions](AGENTS.md), [contributing workflow](docs/contributing.md) |
| Understand architecture and code placement | [Principles](docs/architecture/principles.md), [repository structure](docs/architecture/repository-structure.md) |
| Find a selected technology or its rationale | [Technology map](docs/architecture/technology-decisions.md), [ADR index](docs/adr/README.md) |
| Determine available verification | [Validation](docs/validation.md) |
| Create an operational procedure | [Runbooks](docs/runbooks/README.md) |

Read the relevant route rather than the whole documentation tree. Current policy explains what applies now; ADRs preserve why significant decisions were made; generated references will derive from canonical machine-readable sources when tooling exists.

## Foundation direction

Orion is intended to become a monorepo of applications and cohesive shared capabilities. Logical modularity and local reasoning come before premature distribution. A shared abstraction must have a genuine semantic responsibility.

The foundation will grow through tooling and CI, persistence, backend and web applications, observability, and a complete reference feature. That vertical feature should connect database, persistence, application/domain behavior, API contract, SDK, UI, tests, telemetry, and documentation as executable architectural guidance. Future contributors should prefer proven repository examples over inventing competing patterns.

Architecture should be explicit and mechanically enforced where practical. Authored documentation preserves meaning and rationale that cannot be generated; derived structural facts should not be maintained as independent copies. See [architectural principles](docs/architecture/principles.md) for decision priorities, exceptions, and the detailed policies behind these goals.

## License

No license has been selected yet.
