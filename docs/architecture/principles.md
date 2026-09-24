# Architecture Principles

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0001](../adr/0001-select-typescript-and-nodejs-as-primary-language-and-runtime.md), [ADR-0002](../adr/0002-select-pnpm-for-package-and-workspace-management.md), [ADR-0003](../adr/0003-establish-repository-validation-and-architecture-enforcement.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Decision Priority](#decision-priority)
- [Exceptions](#exceptions)
- [6. Domain Rules Must Have a Clear Home](#6-domain-rules-must-have-a-clear-home)
- [8. Shared Code Must Represent Shared Meaning](#8-shared-code-must-represent-shared-meaning)
- [13. Release History Must Be Intentional](#13-release-history-must-be-intentional)

## Purpose

This document defines the architectural principles that guide Orion.

These principles exist to keep the system understandable, maintainable, observable, testable, and predictable as it evolves.

They apply to humans and AI agents equally.

They are intentionally technology-agnostic.

Specific technology choices, implementation patterns, and exceptions should be documented separately through architecture documentation and Architecture Decision Records.

When implementation convenience conflicts with these principles, the conflict must be made explicit rather than silently ignored.

---

## 1. The Repository Is the Source of Truth

The repository must contain the information required to understand, build, validate, operate, and evolve the system.

Important knowledge must not exist only in:

- personal memory;
- private conversations;
- undocumented operational habits;
- external tools without repository references;
- temporary implementation assumptions.

The repository should contain or reference:

- source code;
- architecture documentation;
- domain rules;
- contracts;
- database definitions;
- tests;
- generated references;
- operational procedures;
- security requirements;
- observability conventions;
- important architectural decisions.

When information changes, the repository must change with it.

---

## 2. One Concept Should Have One Canonical Source

The same information should not be maintained independently in multiple places when a canonical representation can exist.

Prefer:

```text
canonical source
      ↓
generated representations
```

over:

```text
manual copy A

manual copy B

manual copy C
```

Examples may include:

```text
Database schema
      ↓
Database documentation

API schema
      ↓
OpenAPI
      ↓
Generated clients

Runtime schema
      ↓
Validation
      ↓
Static types

Component metadata
      ↓
Component documentation
```

Generated artifacts must be reproducible from their canonical sources.

Generated artifacts must not silently become independent sources of truth.

---

## 3. Architecture Must Be Explicit

System structure must not emerge accidentally from implementation.

Applications, packages, modules, layers, and dependencies should have clear responsibilities.

For any significant component, it should be possible to answer:

- what responsibility it owns;
- what it may depend on;
- what may depend on it;
- which contracts it exposes;
- which side effects it performs;
- where its data comes from;
- where its behavior is documented.

Architectural boundaries should be understandable without reconstructing them from thousands of implementation details.

---

## 4. Architecture Should Be Mechanically Enforced

Important architectural constraints should be enforced by tools whenever practical.

Documentation explains the rule.

Tooling should prevent violations.

Possible mechanisms include:

- type systems;
- package boundaries;
- module boundaries;
- dependency rules;
- static analysis;
- lint rules;
- tests;
- build checks;
- CI validation.

A critical architectural rule that exists only as prose is weaker than a rule that can be automatically verified.

Human discipline and AI instructions are useful, but they should not be the only protection for important invariants.

---

## 5. Prefer Explicit Contracts

Boundaries between components should use explicit contracts.

This applies to communication between:

- applications;
- modules;
- services;
- packages;
- frontend and backend;
- internal and external systems;
- asynchronous producers and consumers.

Contracts should define behavior clearly enough that consumers do not need to depend on implementation details.

Where appropriate, contracts should be:

- typed;
- validated;
- versionable;
- documented;
- testable;
- machine-readable.

The same contract should not be independently redefined by multiple consumers.

---

## 6. Domain Rules Must Have a Clear Home

Business behavior must not be scattered arbitrarily across controllers, UI components, database triggers, background jobs, integration code, and persistence adapters.

Important domain rules should have an identifiable canonical implementation and corresponding documentation when necessary.

A contributor should be able to determine where a business rule belongs before implementing it.

Platform-specific concerns should not unnecessarily contaminate platform-independent domain behavior.

Domain logic should remain reusable where reuse is natural and meaningful.

---

## 7. Dependencies Must Point Toward Stable Responsibilities

Higher-volatility implementation details should depend on more stable contracts and domain concepts rather than the reverse.

Infrastructure concerns should not define core business behavior.

Examples of infrastructure concerns include:

- databases;
- HTTP frameworks;
- queues;
- third-party APIs;
- UI frameworks;
- telemetry backends;
- storage providers.

The architecture should make it possible to replace infrastructure without rewriting unrelated domain behavior whenever the cost of such separation is justified.

This principle does not require abstraction for its own sake.

Abstractions must exist because they protect a meaningful boundary.

---

## 8. Shared Code Must Represent Shared Meaning

A monorepo makes code sharing easy.

That does not mean all duplication should be removed.

Code should be shared when multiple consumers genuinely depend on the same concept or responsibility.

Good candidates may include:

- contracts;
- schemas;
- validation;
- domain logic;
- API clients;
- configuration primitives;
- observability primitives;
- test utilities;
- design tokens.

Avoid shared abstractions that exist only because two implementations currently look similar.

Duplication is sometimes cheaper than premature coupling.

---

## 9. Applications Must Remain Independently Understandable

Shared infrastructure should not make individual applications impossible to understand in isolation.

Each application should clearly expose:

- its purpose;
- entry points;
- dependencies;
- configuration;
- external integrations;
- operational behavior;
- relevant documentation.

Shared packages should reduce duplication and improve consistency without obscuring ownership.

---

## 10. Prefer Vertical Completeness

Features should be designed and validated through all relevant layers rather than implemented as disconnected horizontal fragments.

A complete feature may cross:

```text
database
    ↓
persistence
    ↓
domain/application logic
    ↓
contract
    ↓
API
    ↓
client
    ↓
UI
    ↓
tests
    ↓
observability
    ↓
documentation
```

Not every feature requires every layer.

However, when a feature crosses multiple boundaries, those boundaries should be treated as one coherent change.

This makes behavior easier to understand, validate, document, and use as a reference implementation.

---

## 11. Documentation Is Part of the System

Documentation is not a secondary artifact created after implementation.

It is part of the system.

Documentation should explain information that cannot be safely inferred from code alone, including:

- intent;
- business rules;
- architectural rationale;
- invariants;
- constraints;
- side effects;
- failure modes;
- operational procedures;
- integration behavior;
- security-sensitive behavior.

Documentation should not restate obvious implementation details.

Code and documentation must evolve together.

A correct implementation with incorrect documentation is an incomplete change.

---

## 12. Current Documentation Describes Current Truth

Current documentation should describe the system as it exists now.

It should not accumulate abandoned implementation history unnecessarily.

Different forms of history belong in different places:

```text
Git
    → development history

Database migrations
    → released database evolution

Changelog
    → externally relevant released changes

ADRs
    → significant architectural decisions

Current documentation
    → current system behavior and architecture
```

Documentation should not preserve obsolete states merely because they once existed during development.

Git already provides historical reconstruction when necessary.

---

## 13. Release History Must Be Intentional

Development iteration and released system evolution are different concerns.

Experimental changes may be created, modified, replaced, or removed before release.

Release artifacts should describe meaningful transitions between persistent released states.

This principle applies particularly to:

- database migrations;
- changelog entries;
- generated release artifacts;
- compatibility guarantees.

Released historical artifacts must not be rewritten when doing so would invalidate deployed systems or persistent environments.

Safety always takes priority over minimizing historical artifacts.

---

## 14. Make Invalid States Difficult to Represent

Whenever practical, the architecture should prevent invalid system states rather than merely detecting them later.

Possible mechanisms include:

- constrained types;
- validated schemas;
- database constraints;
- explicit state machines;
- domain invariants;
- compile-time restrictions;
- API validation.

For example, prefer expressing:

```text
OrderStatus =
    Pending
    Paid
    Shipped
    Cancelled
```

over accepting arbitrary strings and hoping all consumers use valid values.

Validation should happen at appropriate trust boundaries.

---

## 15. External Input Is Untrusted

Data entering the system from outside a trusted boundary must be validated.

Examples include:

- HTTP requests;
- client applications;
- uploaded files;
- webhooks;
- external APIs;
- message queues;
- environment variables;
- command-line input;
- imported data.

Client-side validation is useful for user experience but must not be treated as the sole enforcement mechanism for server-side invariants.

---

## 16. Errors Are Part of the Contract

Failure behavior should be designed intentionally.

Expected failures should have explicit representations.

Unexpected failures should remain observable.

Consumers should not need to parse arbitrary error strings to determine what happened.

Error handling should distinguish between:

```text
expected domain failure

validation failure

authentication or authorization failure

external dependency failure

unexpected internal failure
```

Internal implementation details must not be exposed unnecessarily to end users.

Errors should preserve correlation information required for investigation.

---

## 17. Production Behavior Must Be Observable

A system that cannot explain what happened in production is incomplete.

Production-relevant functionality should provide sufficient telemetry for investigation.

Depending on the operation, this may include:

- structured logs;
- traces;
- metrics;
- error reports;
- request identifiers;
- trace identifiers;
- release identifiers;
- relevant domain context.

Observability should allow a developer or AI agent to reconstruct the path of a failure without relying exclusively on user reports.

Observability must respect privacy and security requirements.

---

## 18. Logs Must Be Structured

Production logging should favor structured events over arbitrary human-only text.

Prefer information such as:

```text
event
requestId
traceId
operation
result
duration
entityType
entityId
errorCode
```

over relying entirely on messages such as:

```text
Something went wrong while processing the thing.
```

Human-readable messages remain useful, but important diagnostic dimensions should exist as structured data.

---

## 19. Sensitive Information Must Not Become Telemetry

Observability must not become an uncontrolled copy of application data.

Secrets and prohibited sensitive information must never be logged intentionally.

This includes, at minimum:

- passwords;
- authentication tokens;
- session secrets;
- API keys;
- private keys;
- payment credentials;
- cryptographic secrets.

Other personal or sensitive data must be collected only when justified and must follow explicit privacy, retention, and redaction policies.

---

## 20. Failures Must Be Actionable

When possible, failures produced by development tooling should tell the contributor how to proceed.

Prefer:

```text
Architecture violation: controllers cannot depend directly on database adapters.

Expected dependency direction:
controller -> application service -> repository

See:
docs/architecture/layers.md
```

over:

```text
Invalid dependency.
```

This is especially important for AI-assisted development.

A useful error message becomes part of the development interface.

---

## 21. Tests Protect Behavior

Tests should primarily protect externally relevant behavior, business rules, contracts, and architectural invariants.

Tests should avoid unnecessary coupling to implementation details.

Different test levels have different responsibilities.

Use the lowest-cost test that reliably protects the behavior.

Broader tests should be used when validating:

- component boundaries;
- database behavior;
- integrations;
- application workflows;
- infrastructure behavior.

A production bug should normally result in a regression test whenever practical.

---

## 22. Bugs Should Improve the System

A bug should not result only in a local patch.

When appropriate, bug investigation should determine:

- why the bug was possible;
- why existing validation did not catch it;
- whether a regression test is required;
- whether an invariant was missing;
- whether observability was insufficient;
- whether documentation was unclear;
- whether architecture allowed an invalid dependency or state.

The goal is not merely to fix the observed symptom.

The system should become harder to break in the same way again.

---

## 23. Prefer Deterministic Development Workflows

Humans and AI agents should be able to reproduce development operations reliably.

Important workflows should eventually have canonical commands.

Examples include:

- setup;
- development;
- validation;
- testing;
- generation;
- database operations;
- builds;
- documentation generation.

Avoid requiring contributors to remember undocumented command sequences.

A repeatable workflow is preferable to a collection of manual steps.

---

## 24. Automation Must Be Reproducible

Generated outputs, builds, migrations, documentation, and validation should behave consistently across environments whenever practical.

Automation should not depend on hidden local machine state.

Inputs and required configuration should be explicit.

CI should exercise the same fundamental workflows that contributors use locally whenever practical.

---

## 25. Defaults Should Be Safe

The default path should also be the safe path.

Contributors should not need special knowledge to avoid obvious security, reliability, or architectural mistakes.

Shared infrastructure should make correct behavior easier than incorrect behavior.

Examples may include:

- secure configuration defaults;
- standardized error handling;
- shared authentication mechanisms;
- default telemetry;
- validated configuration;
- safe database access patterns;
- consistent secret handling.

---

## 26. Prefer Boring Solutions for Solved Problems

Novel architecture should be introduced only when it provides clear value.

For common infrastructure concerns, prefer technologies and patterns that are:

- well understood;
- mature;
- observable;
- maintainable;
- documented;
- widely supported;
- compatible with automation.

Innovation should be concentrated where it creates product or engineering value.

Complexity requires justification.

---

## 27. Avoid Premature Abstraction

Do not create abstractions solely in anticipation of possible future requirements.

Introduce abstractions when there is evidence of a meaningful boundary or repeated concept.

A useful abstraction should simplify reasoning.

An abstraction that only hides implementation without reducing conceptual complexity is usually harmful.

Prefer a clear concrete implementation over a speculative generic framework.

---

## 28. Prefer Small, Cohesive Units

Modules, packages, services, components, and functions should have focused responsibilities.

Large units make ownership, testing, reuse, and AI-assisted reasoning more difficult.

However, splitting code into many tiny abstractions without meaningful boundaries is also undesirable.

Cohesion is more important than arbitrary size limits.

---

## 29. Optimize for Local Reasoning

A contributor should be able to modify a component without needing to understand the entire repository.

Good architecture should minimize the amount of context required to make a safe change.

This requires:

- explicit interfaces;
- clear ownership;
- predictable directory structure;
- limited coupling;
- local documentation;
- stable boundaries.

This principle is particularly valuable for AI agents because unnecessary context increases ambiguity and reduces reliability.

---

## 30. Make Side Effects Visible

Operations that perform side effects should make those effects discoverable.

Examples include:

- database writes;
- external API calls;
- emitted events;
- emails;
- notifications;
- file operations;
- cache invalidation;
- background jobs.

A function or service that appears pure should not secretly perform unrelated external actions.

Important side effects should be documented when they are not obvious from the contract.

---

## 31. Idempotency Should Be Deliberate

Operations that may be retried should explicitly consider idempotency.

This is particularly important for:

- payments;
- webhook processing;
- job execution;
- message consumers;
- external integrations;
- provisioning operations;
- retryable API requests.

A retry must not unintentionally duplicate externally meaningful effects.

Where idempotency is required, the mechanism should be explicit and testable.

---

## 32. Concurrency Must Be Considered Explicitly

Operations that modify shared state should consider concurrent execution.

Do not assume that a business operation will only run once at a time.

Possible strategies may include:

- database constraints;
- transactions;
- optimistic concurrency;
- locking;
- idempotency keys;
- serialized processing.

The chosen mechanism should match the consistency requirements of the domain.

---

## 33. Data Integrity Belongs Close to the Data

Critical data invariants should be protected at the strongest appropriate layer.

Application validation is useful, but important relational invariants should also use database guarantees where appropriate.

Examples include:

- foreign keys;
- unique constraints;
- not-null constraints;
- check constraints;
- transactional guarantees.

Do not rely solely on application code for invariants that the database can reliably enforce.

---

## 34. Database Behavior Must Be Discoverable

Database behavior must not become a hidden secondary application.

Tables, columns, views, procedures, functions, triggers, constraints, and important indexes must be documented according to repository policy.

Business behavior implemented in database-level mechanisms must be deliberate and discoverable.

Triggers and procedures must not contain surprising domain logic without explicit justification and documentation.

Database documentation should preferably be generated from canonical schema metadata whenever practical.

---

## 35. Backward Compatibility Must Be Evaluated

Changes to persistent or shared boundaries must consider existing consumers.

Examples include:

- APIs;
- database schemas;
- message formats;
- event contracts;
- configuration;
- stored files;
- generated SDKs.

Breaking changes must not occur accidentally.

Where compatibility is required, migration and deprecation strategies should be explicit.

---

## 36. Deployment Safety Takes Priority Over Elegance

The cleanest final schema or API is not always the safest deployment path.

Production evolution may require temporary compatibility layers.

Examples include:

```text
expand
    ↓
migrate
    ↓
switch consumers
    ↓
contract
```

Temporary complexity is acceptable when required for safe deployment.

It should be removed once the migration is complete.

---

## 37. Configuration Is Part of the Contract

Application configuration should be explicit, typed or validated when practical, documented, and fail safely.

Missing or invalid required configuration should fail early.

Avoid configuration values that silently change critical behavior without clear documentation.

Secrets and ordinary configuration should be handled separately.

---

## 38. Environment Differences Must Be Intentional

Development, testing, staging, and production may differ where necessary.

Those differences must be explicit.

Avoid production-only behavior that cannot reasonably be exercised before production.

Core application behavior should remain as consistent as practical across environments.

---

## 39. Security Boundaries Must Be Explicit

Authentication answers:

```text
Who is this actor?
```

Authorization answers:

```text
Is this actor allowed to perform this operation?
```

These concerns must not be conflated.

Authorization should be enforced at trusted application boundaries.

Sensitive operations should not rely solely on UI visibility or client behavior for access control.

---

## 40. Infrastructure Should Serve the Architecture

Infrastructure choices should follow application requirements.

Do not introduce:

- message brokers;
- distributed systems;
- caches;
- orchestration layers;
- microservices;
- search engines;
- additional databases;

without a concrete need.

Every infrastructure component introduces operational cost.

The architecture should remain as simple as the requirements allow.

---

## 41. Monolith First Unless Boundaries Require Otherwise

Orion should not assume that independent deployment is automatically desirable.

A well-structured modular application is generally preferable to premature service decomposition.

Separate services should be introduced when justified by concrete needs such as:

- independent scaling;
- isolation;
- deployment autonomy;
- security boundaries;
- operational ownership;
- substantially different runtime requirements.

Logical modularity should precede physical distribution.

---

## 42. Generated Code Must Remain Replaceable

Generated code should reduce repetitive work without becoming an opaque dependency.

Its canonical source and generation process must be known.

Generated output should not be manually modified unless explicitly designed for extension.

Whenever practical, generated code should remain reproducible and replaceable.

---

## 43. Tooling Is Part of Developer Experience

Repository tooling is an internal product.

Commands, diagnostics, validation failures, generators, and setup workflows should be designed for usability.

This is important for both humans and agents.

Tooling should favor:

- deterministic behavior;
- actionable errors;
- clear output;
- predictable command names;
- minimal hidden state.

Good developer experience reduces architectural drift.

---

## 44. AI Agents Must Operate Through Verifiable Feedback

AI agents should not be expected to rely only on instructions.

They should have feedback mechanisms capable of proving whether a change is valid.

Examples include:

- compiler feedback;
- type checking;
- linting;
- architectural rules;
- automated tests;
- schema validation;
- generated artifact checks;
- build validation.

The repository should progressively increase the amount of important behavior that can be mechanically verified.

---

## 45. AI-Specific Architecture Must Also Benefit Humans

Do not introduce unusual conventions only because they make a specific AI tool easier to use.

AI-oriented structure is desirable when it also improves:

- clarity;
- consistency;
- discoverability;
- automation;
- maintainability;
- onboarding.

The goal is not to optimize the repository for a single agent implementation.

The goal is to build an explicit engineering system that both humans and machines can reason about reliably.

---

## 46. Important Decisions Must Preserve Rationale

A significant architectural decision should not be understandable only from its final implementation.

When a decision has long-term consequences, preserve:

- context;
- alternatives considered;
- decision;
- trade-offs;
- consequences.

Use an Architecture Decision Record when appropriate.

Future contributors should be able to distinguish between:

```text
intentional constraint
```

and:

```text
historical accident
```

---

## 47. Prefer Reversible Decisions Early

During early development, choose options that preserve flexibility when there is insufficient evidence for a permanent commitment.

Do not build unnecessary abstraction solely to achieve theoretical flexibility.

Reversibility should come from:

- clear boundaries;
- explicit contracts;
- limited coupling;
- isolated infrastructure dependencies;
- documented decisions.

As requirements become clearer, intentionally commit to more specific solutions where they provide value.

---

## 48. Complexity Must Pay Rent

Every layer, abstraction, dependency, service, package, process, or technology increases the amount of system knowledge required.

Complexity is acceptable when it solves a concrete problem better than a simpler alternative.

If the benefit cannot be explained clearly, the complexity should be questioned.

The objective is not maximum architectural sophistication.

The objective is maximum useful capability with the minimum necessary complexity.

---

## 49. Prefer Consistency Over Personal Preference

Once Orion establishes a good pattern, contributors should follow it unless there is a concrete reason to change it.

A technically valid alternative is not automatically an improvement.

Consistency reduces:

- cognitive overhead;
- documentation requirements;
- errors;
- review complexity;
- AI ambiguity.

If an existing pattern is inadequate, improve the pattern deliberately rather than creating competing conventions silently.

---

## 50. The Architecture Must Be Able to Evolve

These principles exist to support evolution, not prevent it.

Architecture is expected to change as requirements become clearer.

Changes to fundamental architecture should be intentional, documented, and mechanically enforced where appropriate.

When evidence shows that an existing decision is no longer appropriate:

1. identify the limitation;
2. evaluate alternatives;
3. document the new decision;
4. migrate deliberately;
5. remove obsolete architecture;
6. update validation and documentation.

The system should evolve without accumulating multiple generations of contradictory architecture.

---

## Decision Priority

When principles appear to conflict, use the following priority order:

1. correctness;
2. security and privacy;
3. data integrity;
4. production safety;
5. explicit contracts and architectural boundaries;
6. observability and diagnosability;
7. maintainability;
8. simplicity;
9. consistency;
10. development convenience.

This ordering is guidance rather than an excuse to ignore trade-offs.

Significant conflicts should be documented explicitly.

---

## Exceptions

These principles are defaults, not immutable laws.

An exception is acceptable when:

- there is a concrete technical or business reason;
- the consequences are understood;
- the deviation is explicit;
- the decision is documented when significant;
- the exception does not silently establish a competing architectural pattern.

Temporary exceptions should include a clear path for removal when practical.

---

## Relationship to Other Documentation

This document defines durable architectural principles.

It should not contain detailed implementation instructions.

More specific documentation should define how these principles are realized.

Examples:

```text
docs/architecture/
    principles.md
    repository-structure.md
    application-boundaries.md
    dependency-rules.md
    error-handling.md

docs/adr/
    ADR-0001-...
    ADR-0002-...

docs/database/
docs/api/
docs/reliability/
docs/security/
```

[AGENTS.md](../../AGENTS.md) defines contributor and AI-agent behavior.

This document defines architectural philosophy.

ADRs define significant architectural decisions.

Implementation documentation defines concrete mechanisms.

These responsibilities should remain distinct.
