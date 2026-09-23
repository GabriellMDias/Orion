# Orion

Orion is an AI-first engineering foundation for building, evolving, and maintaining software applications with humans and AI agents working from the same source of truth.

The project is designed as a reusable base for future applications, with strong emphasis on:

- explicit architecture;
- living documentation;
- shared contracts;
- reusable code;
- automated validation;
- observability;
- maintainability;
- safe database evolution;
- predictable development conventions;
- effective collaboration between humans and AI agents.

Orion is not intended to be only a starter template.

Its goal is to provide a consistent engineering environment where applications can evolve without gradually losing architectural clarity, documentation quality, or operational visibility.

---

## Project Status

Orion is currently in its foundation phase.

The repository structure, architecture, tooling, technology stack, development workflows, and application boundaries are being defined incrementally.

During this phase:

- architectural decisions must be explicit;
- undocumented assumptions should be avoided;
- technologies should not be introduced before their role is understood;
- temporary conventions should not be presented as permanent architecture;
- documentation must reflect the current state of the repository.

Do not assume that planned directories, applications, tools, or commands already exist unless they are present in the repository.

---

## Vision

Orion aims to make software development predictable for both humans and AI agents.

A contributor should be able to enter the repository and determine:

- what the system does;
- how the repository is organized;
- where a responsibility belongs;
- which architectural boundaries must be respected;
- which contracts already exist;
- how data is structured;
- why important architectural decisions were made;
- how to validate a change;
- how production behavior can be observed;
- how failures can be investigated.

The repository should contain enough structured knowledge that development does not depend on undocumented context held by a single person.

---

## Core Idea

The repository is the primary source of truth.

Code, schemas, tests, documentation, contracts, generated references, architecture rules, and operational knowledge must remain consistent with each other.

Whenever information can be reliably derived from a canonical source, Orion should generate it instead of maintaining multiple independent copies.

For example:

```text
Database schema
      ↓
Database reference documentation

API contract
      ↓
OpenAPI
      ↓
Generated SDKs

Component definitions
      ↓
Component documentation

Configuration schemas
      ↓
Configuration reference
```

Documentation that explains intent, rationale, business rules, architecture, or operational behavior remains explicitly maintained because that information usually cannot be inferred safely from implementation alone.

---

## AI-First Development

AI agents are treated as first-class contributors to the repository.

This does not mean optimizing the codebase exclusively for AI.

Instead, Orion aims to make engineering knowledge explicit, structured, discoverable, and mechanically verifiable.

AI agents should be able to:

- navigate the repository predictably;
- discover existing patterns before introducing new ones;
- understand architectural constraints;
- locate relevant domain documentation;
- inspect contracts and schemas;
- execute deterministic validation workflows;
- identify generated artifacts and their canonical sources;
- investigate failures using observability data;
- make changes without depending on hidden context.

The same properties also improve maintainability for human contributors.

Repository-wide agent instructions are defined in [`AGENTS.md`](./AGENTS.md).

More specific instructions may exist in nested `AGENTS.md` files as the repository grows.

---

## Engineering Principles

Orion follows several foundational principles.

### One canonical source

Important information should have one authoritative representation whenever practical.

Derived representations should be generated automatically.

### Architecture must be enforceable

Architectural rules should not depend exclusively on documentation or contributor discipline.

Where practical, they should be enforced through:

- package boundaries;
- type systems;
- static analysis;
- lint rules;
- dependency constraints;
- tests;
- CI validation.

### Documentation is part of the implementation

A change is incomplete when the implementation and its documentation disagree.

Documentation should explain information that cannot be safely inferred from code, especially:

- architectural rationale;
- business rules;
- invariants;
- constraints;
- side effects;
- failure modes;
- operational procedures;
- integration behavior.

### Prefer explicit contracts

Boundaries between applications, services, packages, and external systems should use explicit, versionable contracts.

Applications should not independently redefine the same domain or transport contract.

### Production behavior must be observable

Unexpected production failures must not depend on users manually reporting that something went wrong.

Applications should eventually provide consistent:

- structured logs;
- distributed traces;
- metrics;
- error reporting;
- correlation identifiers.

Operational telemetry must provide enough context to investigate failures without exposing prohibited sensitive information.

### Development history and release history are different

Git records development history.

Database migrations record meaningful transitions between released database states.

Changelogs record changes visible to consumers.

Architecture Decision Records explain important architectural decisions.

Current documentation describes the current system.

Intermediate development experiments should not unnecessarily pollute release artifacts.

### Prefer reversible decisions

When architecture is still evolving, prefer solutions that are easier to replace, revise, or remove.

Foundational choices should become harder to change only after their responsibilities and trade-offs are understood.

---

## Monorepo

Orion is intended to use a monorepo.

The goal is to keep applications, shared packages, contracts, infrastructure, documentation, and engineering tooling accessible from a single repository.

This provides a unified context for both humans and AI agents.

The repository is expected to eventually contain multiple application types, potentially including:

- backend services;
- web applications;
- mobile applications;
- desktop applications;
- shared packages;
- infrastructure;
- engineering tooling.

Applications should share code when that sharing represents a genuine common responsibility.

Orion does not aim to eliminate all duplication through abstraction.

A shared abstraction must have a clear semantic purpose.

---

## Intended Repository Model

The exact structure will evolve through architectural decisions.

A possible high-level organization is:

```text
.
├── AGENTS.md
├── README.md
│
├── apps/
│   ├── api/
│   ├── web/
│   ├── mobile/
│   └── desktop/
│
├── packages/
│   ├── domain/
│   ├── contracts/
│   ├── database/
│   ├── sdk/
│   ├── observability/
│   ├── testing/
│   └── config/
│
├── docs/
│   ├── architecture/
│   ├── domains/
│   ├── adr/
│   ├── database/
│   ├── api/
│   ├── reliability/
│   ├── security/
│   ├── runbooks/
│   └── generated/
│
├── tooling/
│
├── infra/
│
└── .github/
```

This structure is illustrative until the corresponding directories and architectural decisions are actually introduced.

The repository itself always takes precedence over this example.

---

## Documentation Model

Orion distinguishes between authored documentation and generated documentation.

### Authored documentation

Authored documentation captures information that requires human or architectural intent.

Examples include:

- architecture;
- domain rules;
- ADRs;
- security decisions;
- operational procedures;
- integration behavior;
- important constraints;
- rationale behind non-obvious decisions.

Expected locations include:

```text
docs/architecture/
docs/domains/
docs/adr/
docs/database/
docs/api/
docs/reliability/
docs/security/
docs/runbooks/
```

### Generated documentation

Generated documentation represents information derived from canonical machine-readable sources.

Examples may include:

- database references;
- API references;
- SDK references;
- component catalogs;
- configuration references;
- schema diagrams.

Generated documentation is expected to live under:

```text
docs/generated/
```

Generated files must not become independent sources of truth.

---

## Architecture Decision Records

Important architectural decisions should be documented as Architecture Decision Records.

An ADR should be used when a decision has meaningful long-term consequences, such as:

- choosing a foundational technology;
- defining an architectural boundary;
- introducing a major infrastructure dependency;
- defining an authentication strategy;
- establishing a persistence strategy;
- changing a public contract strategy;
- selecting an observability architecture.

ADRs should explain:

- the context;
- the decision;
- relevant alternatives;
- consequences;
- important trade-offs.

The goal is not to document every implementation choice.

The goal is to preserve the reasoning behind decisions that future contributors may otherwise be tempted to reverse without understanding their original context.

---

## Database Evolution

Database migration history should represent meaningful transitions between released states rather than every intermediate development experiment.

Unreleased migrations may be rewritten, consolidated, regenerated, or removed when requirements change.

Released migrations are immutable.

If a migration has reached an environment whose migration history is considered permanent, subsequent changes must be represented by new migrations.

Orion prefers the smallest coherent set of migrations that can safely move the previous released schema to the next released schema.

Operational safety takes precedence over minimizing migration count.

Multiple migrations may be required for cases such as:

- safe data backfills;
- backward-compatible deployments;
- large data transformations;
- expand-and-contract changes;
- zero-downtime deployments.

Detailed agent rules are defined in [`AGENTS.md`](./AGENTS.md).

---

## Testing and Validation

Orion will provide a canonical validation workflow for contributors and AI agents.

The final workflow is expected to validate relevant concerns such as:

```text
formatting
linting
architecture rules
static typing
unit tests
integration tests
database consistency
generated artifacts
documentation consistency
security checks
build validation
```

The exact tooling and command do not exist yet unless explicitly present in the repository.

Once introduced, the repository should provide one canonical entry point for complete local validation.

---

## Observability and Reliability

Observability is considered part of application architecture rather than an optional production add-on.

Applications built on Orion should eventually provide a consistent approach to:

- structured logging;
- error tracking;
- traces;
- metrics;
- request correlation;
- production diagnostics.

Unexpected failures should produce sufficient diagnostic information for investigation.

User-facing errors must not expose internal stack traces, secrets, or sensitive implementation details.

Operational data must follow explicit privacy and security rules.

---

## Security

Security should be designed into shared infrastructure and default development patterns.

Orion will favor:

- secure defaults;
- explicit trust boundaries;
- server-side validation;
- centralized secret handling;
- dependency review;
- consistent authentication and authorization mechanisms;
- structured security-sensitive logging policies;
- automated security validation where practical.

Secrets and credentials must never be committed to the repository.

---

## Repository Language

English is the canonical language of the repository.

This includes:

- source code;
- identifiers;
- comments;
- documentation;
- database descriptions;
- API descriptions;
- tests;
- scripts;
- logs;
- error codes;
- developer tooling.

Product localization is separate from repository language.

Applications may support any required user-facing languages through their localization mechanisms.

---

## Current Priorities

The initial development of Orion will focus on establishing the foundation before building substantial application features.

The expected sequence is:

1. repository governance;
2. documentation structure;
3. architectural principles;
4. monorepo structure;
5. technology selection;
6. shared development tooling;
7. validation and CI;
8. database foundation;
9. backend foundation;
10. frontend foundation;
11. observability;
12. a complete reference feature implemented vertically through the system.

This sequence may evolve as architectural decisions are made.

---

## Reference Implementation

Once the foundation is established, Orion should include at least one complete vertical feature that demonstrates the intended architecture.

A reference feature should ideally cover:

```text
database
    ↓
persistence
    ↓
domain/application logic
    ↓
API contract
    ↓
client SDK
    ↓
application UI
    ↓
tests
    ↓
observability
    ↓
documentation
```

This feature should serve as executable architectural documentation.

Future contributors and AI agents should prefer following a proven repository example over inventing a new pattern.

---

## Non-Goals

Orion is not intended to:

- abstract every technology behind custom wrappers;
- eliminate all code duplication;
- force code sharing where platform differences make it harmful;
- document obvious implementation details;
- preserve every abandoned development experiment;
- replace automated enforcement with large amounts of written policy;
- introduce infrastructure before there is a concrete reason for it;
- become a collection of unrelated libraries.

The goal is consistency without unnecessary abstraction.

---

## Contributing

Development rules for both humans and AI agents are defined in [`AGENTS.md`](./AGENTS.md).

As the repository evolves, application-specific and package-specific instructions may be defined in nested `AGENTS.md` files.

Before making a significant change:

1. inspect the relevant implementation;
2. inspect the relevant documentation;
3. identify existing patterns;
4. determine whether an ADR already governs the decision;
5. make the smallest coherent change;
6. update tests and documentation;
7. run the repository validation workflow when available;
8. review the final diff.

---

## License

No license has been selected yet.
