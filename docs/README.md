# Orion Documentation

## Purpose

This directory contains the architectural, operational, security, database, API, and decision documentation for Orion.

Its purpose is to make the system understandable without requiring contributors to reconstruct architecture from implementation details, Git history, production behavior, or tribal knowledge.

The documentation is designed for:

- human contributors;
- AI agents;
- operators;
- reviewers;
- future maintainers.

The repository is the primary source of truth.

Documentation should remain close to the code, contracts, schemas, and operational systems it describes.

---

# Documentation Model

Orion distinguishes several kinds of documentation because they answer different questions.

```text
current documentation
    → What is true now?

generated reference
    → What does the canonical machine-readable source currently define?

ADRs
    → Why was an architectural decision made?

migrations
    → How did released database state evolve?

runbooks
    → What should an operator do in a known operational situation?

Git history
    → How did repository implementation evolve?
```

These artifacts complement each other.

They should not be used interchangeably.

---

# Current Truth

The documents under:

```text
docs/architecture/
docs/api/
docs/database/
docs/reliability/
docs/security/
```

primarily describe current architectural policy and current intended system behavior.

When the architecture changes, these documents should be updated.

They are not historical archives.

Git already preserves previous revisions.

---

# Decision History

Architecture Decision Records under:

```text
docs/adr/
```

preserve significant architectural decisions and their rationale.

An accepted ADR represents the decision that was made at a point in time.

If that decision changes later:

```text
new ADR
    ↓
old ADR becomes superseded
    ↓
current documentation is updated
```

Do not rewrite old accepted ADRs merely to match current architecture.

---

# Operational Procedures

Runbooks under:

```text
docs/runbooks/
```

describe current operational procedures.

Runbooks should be directly usable by an authorized operator during:

- incidents;
- recovery;
- maintenance;
- controlled production operations.

Runbooks are current-state documents.

They should be updated when operational reality changes.

---

# Generated Reference

Some future documentation should be generated from canonical machine-readable sources.

Examples may include:

```text
database schema
    → database reference

API contract
    → API reference

error registry
    → error documentation

configuration schema
    → configuration reference

component metadata
    → UI/component reference
```

Generated documentation should normally live under:

```text
docs/generated/
```

when such tooling exists.

Generated documentation is derived output.

It must not become an independently edited source of truth.

---

# Canonical Sources

Orion prefers:

```text
one canonical source
    ↓
validation
    ↓
generated reference
```

over maintaining the same information manually in several places.

Examples:

```text
schema metadata
    → database documentation

API schema
    → validation + documentation + SDKs

configuration schema
    → runtime validation + documentation
```

The exact tools will be selected later.

---

# Authored Documentation

Not everything can or should be generated.

Human-authored documentation is required for information such as:

- architectural intent;
- rationale;
- ownership;
- domain semantics;
- invariants;
- non-obvious constraints;
- security expectations;
- operational reasoning;
- failure semantics;
- tradeoffs.

Generated reference describes structure well.

Authored documentation explains meaning.

---

# Documentation Hierarchy

A contributor should generally navigate Orion documentation in this order:

```text
README.md
    ↓
AGENTS.md
    ↓
docs/README.md
    ↓
relevant policy or architecture document
    ↓
domain / implementation documentation
    ↓
generated reference where applicable
    ↓
ADRs for historical rationale
    ↓
runbooks for operational procedures
```

The exact path depends on the task.

---

# Repository-Level Guidance

## `README.md`

The root `README.md` explains:

- what Orion is;
- its overall vision;
- repository intent;
- engineering philosophy;
- current project phase;
- high-level navigation.

It is the primary entry point for a new human contributor.

---

## `AGENTS.md`

`AGENTS.md` defines repository-wide contributor behavior, especially for AI agents.

It contains requirements related to:

- repository navigation;
- source-of-truth discipline;
- architecture;
- documentation;
- database changes;
- testing;
- observability;
- security;
- validation;
- generated files.

AI agents should read `AGENTS.md` before making substantial repository changes.

Future directory-specific `AGENTS.md` files may refine these rules when real structure requires them.

---

# Architecture

The architecture directory defines cross-cutting engineering constraints.

```text
docs/architecture/
```

---

## `architecture/principles.md`

The technical constitution of Orion.

Start here when a decision involves:

- architecture;
- maintainability;
- complexity;
- boundaries;
- contracts;
- data integrity;
- observability;
- security;
- operational safety.

These principles should guide decisions when more specific policy does not exist.

---

## `architecture/repository-structure.md`

Defines the intended repository organization and ownership model.

Use it when deciding:

- where code belongs;
- what is an application;
- what is a reusable package;
- where tooling belongs;
- how documentation is organized;
- when a new top-level directory is justified.

---

## `architecture/application-boundaries.md`

Defines responsibilities and trust boundaries between executable applications and runtime components.

Use it when deciding:

- backend vs client responsibilities;
- worker responsibilities;
- runtime boundaries;
- service boundaries;
- synchronous vs asynchronous interaction;
- whether logic belongs inside or outside an application.

---

## `architecture/dependency-rules.md`

Defines allowed dependency direction and package relationships.

Use it when deciding:

- which layer may depend on another;
- whether code should move into a shared package;
- whether a domain package may depend on infrastructure;
- whether one application may import another;
- where composition occurs.

---

## `architecture/error-handling.md`

Defines Orion's internal error-handling model.

Use it when designing:

- expected vs unexpected failures;
- error translation;
- retryability;
- cause preservation;
- public vs internal errors;
- reporting boundaries.

API-specific public error behavior is defined separately under:

```text
docs/api/error-contract.md
```

---

## `architecture/configuration.md`

Defines runtime and application configuration principles.

Use it when introducing:

- environment variables;
- application configuration;
- provider settings;
- feature configuration;
- typed configuration schemas;
- client-visible configuration.

Secrets are governed separately by:

```text
docs/security/secrets-management.md
```

---

## `architecture/testing-strategy.md`

Defines Orion's testing philosophy.

Use it when deciding:

- which type of test is appropriate;
- when real infrastructure is required;
- how regression tests should be written;
- how architecture should be mechanically validated;
- how flaky tests should be treated.

---

## `architecture/versioning-and-compatibility.md`

Defines compatibility principles across the complete system.

Use it for compatibility questions involving:

- applications;
- packages;
- databases;
- events;
- jobs;
- SDKs;
- configuration;
- deployments;
- persisted data.

API-specific versioning is defined separately under:

```text
docs/api/versioning.md
```

---

# API

The API directory defines contract behavior between independently interacting components.

```text
docs/api/
```

---

## `api/principles.md`

Defines general API architecture.

Use it when designing:

- operations;
- request/response contracts;
- validation;
- pagination;
- idempotency;
- asynchronous APIs;
- webhooks;
- SDK generation;
- transport boundaries.

---

## `api/error-contract.md`

Defines the public machine-readable error model.

Use it when adding:

- public error codes;
- validation-error structures;
- transport mappings;
- correlation identifiers;
- code-specific details;
- provider-error translation.

---

## `api/versioning.md`

Defines API-specific compatibility and versioning.

Use it when evaluating:

- breaking changes;
- additive changes;
- enum expansion;
- client compatibility;
- deprecation;
- API version boundaries;
- long-lived mobile or desktop clients.

---

# Database

The database directory defines durable-data architecture.

```text
docs/database/
```

---

## `database/principles.md`

Defines core persistence principles.

Use it when designing:

- tables;
- constraints;
- identifiers;
- relationships;
- indexes;
- database ownership;
- data types;
- derived data;
- database-side behavior.

---

## `database/migrations.md`

Defines migration-history policy.

The central rule is:

```text
released migration history is immutable
unreleased development migration history is refinable
```

Use it when:

- creating migrations;
- changing an unreleased schema;
- evaluating migration squashing;
- planning data backfills;
- designing expand-migrate-contract deployment;
- recovering from migration mistakes.

---

## `database/schema-documentation.md`

Defines how database semantics must be documented.

Use it when adding or changing:

- tables;
- columns;
- views;
- materialized views;
- functions;
- procedures;
- triggers;
- constraints;
- database-specific behavior.

The intended long-term model is:

```text
canonical schema + metadata
    ↓
generated database reference
```

---

## `database/transactions-and-concurrency.md`

Defines consistency and concurrency behavior.

Use it when implementing:

- transactions;
- retries;
- optimistic concurrency;
- pessimistic locking;
- idempotency;
- queue consumers;
- duplicate processing;
- outbox/inbox patterns;
- distributed workflows.

---

# Reliability

The reliability directory defines how Orion becomes observable, diagnosable, and operable in production.

```text
docs/reliability/
```

---

## `reliability/observability.md`

Defines Orion's overall observability model.

The core signals are:

```text
logs
traces
metrics
error reporting
```

Use it as the starting point for cross-signal observability design.

---

## `reliability/logging.md`

Defines structured logging policy.

Use it when adding:

- log events;
- log levels;
- structured fields;
- correlation;
- operational event names;
- logging around requests, jobs, dependencies, or migrations.

Do not log full application objects merely for convenience.

---

## `reliability/tracing.md`

Defines distributed tracing behavior.

Use it when adding:

- spans;
- trace propagation;
- async trace relationships;
- span attributes;
- manual instrumentation;
- sampling;
- cross-service correlation.

---

## `reliability/metrics.md`

Defines metrics policy.

Use it when adding:

- counters;
- gauges;
- histograms;
- service health metrics;
- SLI measurements;
- operational dashboards.

Metric dimensions must remain bounded.

Runtime identifiers such as:

```text
userId
requestId
traceId
resourceId
```

must not become ordinary metric labels.

---

## `reliability/error-reporting.md`

Defines centralized error-tracking behavior.

Use it when deciding:

- which failures should be captured;
- where capture occurs;
- how errors are grouped;
- how source maps are handled;
- what context is safe;
- how errors correlate with traces and logs.

Expected application outcomes should not automatically become error-tracker issues.

---

## `reliability/health-checks.md`

Defines:

```text
liveness
readiness
startup
```

semantics.

Use it when integrating with:

- orchestrators;
- load balancers;
- deployment systems;
- dependency health;
- graceful shutdown.

A dependency outage may make an application unready without making the process non-live.

---

## `reliability/alerting.md`

Defines when telemetry deserves human attention.

Use it when designing:

- alerts;
- severity;
- paging;
- thresholds;
- SLO burn-rate alerts;
- dependency alerts;
- escalation;
- runbook links.

An alert should have an expected action.

---

# Security

The security directory defines Orion's trust, data-protection, identity, and security-operations policies.

```text
docs/security/
```

---

## `security/data-classification.md`

Defines the canonical classification levels:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
```

Use it before deciding how data may be:

- stored;
- logged;
- transmitted;
- exposed;
- retained;
- accessed.

---

## `security/telemetry-redaction.md`

Defines what data may enter:

- logs;
- traces;
- error reports;
- metrics;
- audit telemetry.

The preferred model is:

```text
explicit safe selection
    ↓
redaction / transformation
    ↓
telemetry destination
```

not:

```text
capture everything
    ↓
hope redaction catches it
```

---

## `security/secrets-management.md`

Defines lifecycle and handling of:

- passwords used as system credentials;
- API keys;
- private keys;
- database credentials;
- provider credentials;
- signing secrets;
- recovery secrets.

Secrets must not live in source control or ordinary telemetry.

---

## `security/authentication.md`

Defines how Orion establishes actor identity.

Use it when designing:

- user authentication;
- sessions;
- tokens;
- service identities;
- API keys;
- webhook authentication;
- MFA;
- impersonation identity context.

---

## `security/authorization.md`

Defines how Orion determines whether an authenticated actor may perform an operation.

Use it for:

- permissions;
- roles;
- resource ownership;
- tenant isolation;
- support access;
- admin operations;
- machine capabilities;
- AI delegation.

Authentication and authorization are separate concerns.

---

## `security/production-access.md`

Defines privileged access to production.

Use it when designing:

- human production access;
- database access;
- observability access;
- just-in-time privilege;
- break-glass access;
- production query tooling;
- administrative operations;
- AI-assisted production operations.

Production access should be exceptional and least-privileged.

---

## `security/data-retention.md`

Defines data lifecycle after collection.

Use it when deciding:

- retention;
- deletion;
- anonymization;
- soft delete;
- backups;
- exports;
- caches;
- telemetry retention;
- derived-data deletion;
- provider data lifecycle.

`Keep forever` must be an explicit decision.

---

## `security/incident-response.md`

Defines coordinated response to:

```text
reliability incidents
security incidents
data incidents
```

Use it for:

- severity;
- containment;
- evidence preservation;
- credential rotation;
- recovery;
- communication;
- post-incident review;
- corrective actions.

---

# Architecture Decision Records

```text
docs/adr/
```

ADRs preserve significant architectural decisions.

---

## `adr/README.md`

Defines:

- when to create an ADR;
- ADR numbering;
- status;
- acceptance;
- rejection;
- supersession;
- historical immutability;
- relationship to current documentation.

Read this before creating an ADR.

---

## `adr/template.md`

The canonical starting template for a new ADR.

New ADRs should follow:

```text
NNNN-short-decision-title.md
```

Do not create ADRs for ordinary implementation details.

---

# Runbooks

```text
docs/runbooks/
```

Runbooks define operational procedures for known conditions.

---

## `runbooks/README.md`

Defines:

- when a runbook should exist;
- ownership;
- preconditions;
- required access;
- diagnosis;
- mitigation;
- recovery;
- verification;
- escalation;
- testing.

Read this before creating an operational runbook.

---

## `runbooks/template.md`

The canonical starting template for a new runbook.

Do not create speculative runbooks for infrastructure that does not yet exist.

---

# Generated Documentation

The intended future location for generated reference documentation is:

```text
docs/generated/
```

This directory should not be created merely as an empty placeholder.

Create it when actual documentation generation exists.

Potential future contents include:

```text
docs/generated/
├── api/
├── database/
├── configuration/
└── ...
```

The exact structure should follow real canonical sources.

---

# Domain Documentation

As real business domains are introduced, domain-specific documentation may live under:

```text
docs/domains/
```

when cross-file domain explanation becomes necessary.

Do not create this directory until real domain documentation exists.

Domain documentation may describe:

- terminology;
- invariants;
- ownership;
- workflows;
- state transitions;
- externally important side effects;
- domain-specific failure semantics.

Domain rules should remain close to canonical implementation and contracts whenever possible.

---

# Application Documentation

Application-specific documentation should live close to the owning application when it primarily concerns that application.

Global architecture documents should not become dumping grounds for:

```text
one application
one feature
one provider integration
```

Future application directories may contain their own README files or scoped documentation.

---

# Package Documentation

Reusable packages should document:

- responsibility;
- public API;
- dependency constraints;
- important assumptions;

when those facts are not already obvious from code and machine-readable contracts.

Do not create verbose package documentation that simply repeats type signatures.

---

# Documentation Placement

When deciding where information belongs, ask:

```text
Is this repository-wide policy?
    → docs/

Is this architectural decision history?
    → docs/adr/

Is this operational procedure?
    → docs/runbooks/

Is this generated structural reference?
    → docs/generated/

Is this domain meaning?
    → owning domain documentation

Is this specific to one application or package?
    → near that application or package
```

Prefer the narrowest authoritative location.

---

# Source-of-Truth Rule

A fact should have one canonical source whenever practical.

Do not maintain the same semantic fact manually in:

```text
schema
README
generated docs
API documentation
code comment
```

simultaneously.

Prefer:

```text
canonical source
    ↓
generated or referenced documentation
```

---

# Documentation Duplication

Some repetition is acceptable for navigation and summaries.

Duplicated normative rules are dangerous.

If two documents both define the same policy independently, they will eventually diverge.

Use references instead.

---

# Documentation Links

When one document depends on another policy, link to the authoritative document rather than copying its complete rules.

For example:

```text
API documentation
    → references authentication policy

runbook
    → references production-access policy
```

---

# Documentation and Code Comments

Code comments should explain information that is:

- non-obvious;
- local to the implementation;
- important for correctness;
- difficult to represent elsewhere.

Do not use comments to duplicate repository policy.

---

# Useful Comments

Useful comments may explain:

```text
why ordering matters

why unusual retry behavior is required

why a workaround exists

which invariant is being protected

why a seemingly simpler implementation is unsafe
```

---

# Unhelpful Comments

Avoid comments that merely restate code.

Example:

```text
// Increment counter
counter += 1
```

Such comments create maintenance noise.

---

# Database Documentation

Database structural and semantic documentation should follow:

```text
docs/database/schema-documentation.md
```

Important database meaning belongs in canonical schema metadata where possible.

Generated database reference should eventually derive from that source.

---

# API Documentation

API documentation should eventually derive from the canonical API contract.

Do not independently maintain:

```text
validator
OpenAPI schema
SDK type
API docs
```

as separate competing truths.

The exact contract technology will be selected later.

---

# Configuration Documentation

Configuration reference should eventually derive from the canonical configuration schema.

A configuration field should ideally define:

```text
name
type
description
required/default
classification
secret status
validation
```

once tooling exists.

---

# Error Documentation

Public error codes should eventually come from a canonical machine-readable error registry.

This can support:

```text
API documentation
SDK typing
compatibility analysis
tests
```

without duplicating code definitions manually.

---

# Documentation Quality

Documentation should optimize for:

```text
accuracy
clarity
discoverability
durability
```

rather than volume.

More documentation is not automatically better documentation.

---

# Documentation Should Explain Meaning

Good documentation explains:

```text
purpose
semantics
constraints
rationale
failure behavior
ownership
```

where relevant.

It should not merely mirror code structure.

---

# Documentation Must Remain Current

Incorrect documentation is often more harmful than missing documentation because it creates false confidence.

When behavior changes, update the canonical documentation in the same change where practical.

---

# Documentation Is Part of the Change

A change is incomplete when it materially alters documented behavior without updating the corresponding documentation.

Examples include:

```text
new architectural boundary

new public error

changed compatibility policy

changed database semantics

new operational requirement
```

---

# Generated Files Must Not Be Edited Manually

When a document declares itself generated:

```text
do not edit the generated file
```

Update the canonical source and regenerate it.

Manual modifications will be lost and create source-of-truth drift.

---

# Documentation Review

Documentation should receive review proportional to its importance.

Changes to:

```text
architecture policy
security policy
database lifecycle
API compatibility
production operations
```

deserve more scrutiny than minor prose improvements.

---

# Documentation Language

Repository documentation must be written in English.

This includes:

- Markdown;
- code comments;
- API descriptions;
- database descriptions;
- ADRs;
- runbooks;
- generated documentation;
- operational metadata.

Product localization is a separate concern.

---

# Terminology

Prefer stable domain and architectural terminology.

If two documents refer to the same concept, they should normally use the same name.

Inconsistent terminology makes both human and AI reasoning harder.

---

# Links to Current Truth

ADRs and runbooks may reference architecture policies.

Architecture policy should not require readers to inspect historical ADRs merely to understand current expectations.

---

# Documentation Discovery for AI Agents

Before modifying an area, an AI agent should inspect:

```text
AGENTS.md
    ↓
docs/README.md
    ↓
relevant architecture/policy documents
    ↓
relevant ADRs
    ↓
local application/package documentation
```

where applicable.

---

# AI Agents Must Not Invent Missing Policy

If current documentation intentionally defers a technology or implementation decision, an AI agent should not silently treat one option as already selected.

Examples include:

```text
ORM
database engine
API framework
tracing provider
deployment platform
```

until the relevant decision is made.

---

# AI Agents and Historical Documents

AI agents must distinguish:

```text
accepted current policy
```

from:

```text
superseded ADR
```

and:

```text
old Git revision
```

Historical information is context, not automatically current instruction.

---

# AI Agents and Generated Documentation

AI agents should update the canonical source rather than generated documentation.

If generation tooling does not yet exist, do not pretend generated reference is canonical.

---

# AI Agents and Missing Documentation

When important semantics cannot be inferred safely, an AI agent should:

```text
identify the missing knowledge
```

rather than invent business rules.

Once the information is known, it should be documented in the appropriate canonical location.

---

# Documentation Creation Checklist

Before creating a new documentation file, answer:

1. What question does this document answer?
2. Does an existing document already own this information?
3. Is this current truth, decision history, generated reference, or operational procedure?
4. Could the information be represented canonically in code/schema/contract instead?
5. Who owns the information?
6. Where will future contributors look for it?
7. Will the document remain maintainable as the system evolves?

If there is no clear answer, a new document may not be necessary.

---

# Documentation Change Checklist

When implementation changes, ask:

1. Did architecture change?
2. Did a public contract change?
3. Did database semantics change?
4. Did configuration change?
5. Did security behavior change?
6. Did an operational procedure change?
7. Does an ADR need to be created or superseded?
8. Does generated reference need regeneration?
9. Did ownership or terminology change?
10. Would an AI agent reading current docs understand the new behavior correctly?

---

# Initial Documentation Policy

Until documentation tooling exists, Orion adopts the following requirements:

1. The repository is the primary source of documentation truth.
2. Current architecture documents describe current truth rather than historical evolution.
3. ADRs preserve significant architectural decision history.
4. Runbooks describe current executable operational procedures.
5. Git preserves implementation history.
6. Migrations preserve meaningful released database transitions.
7. Generated documentation should derive from canonical machine-readable sources whenever practical.
8. Generated documentation must not become an independently edited source of truth.
9. Authored documentation should explain intent, semantics, constraints, ownership, and rationale that cannot be inferred reliably from structure alone.
10. Normative information should have one canonical source whenever practical.
11. Documentation should reference authoritative policies instead of duplicating them.
12. Domain and application-specific documentation should remain close to the owning code where appropriate.
13. Empty documentation structures should not be created before real content exists.
14. Significant behavior changes should update corresponding documentation in the same change where practical.
15. Documentation must be written in English.
16. Incorrect or obsolete current-state documentation should be treated as a defect.
17. Technology-specific documentation should be created only after the technology exists or has been selected.
18. AI agents must inspect relevant current documentation and ADRs before making architectural changes.
19. AI agents must not invent semantics that canonical documentation intentionally leaves undefined.
20. Documentation generation, link validation, metadata validation, and discoverability should become mechanically enforced where practical.

---

# Current Foundation Documentation

The initial Orion foundation consists of:

```text
.
├── AGENTS.md
├── README.md
└── docs/
    ├── README.md
    ├── architecture/
    │   ├── principles.md
    │   ├── repository-structure.md
    │   ├── application-boundaries.md
    │   ├── dependency-rules.md
    │   ├── error-handling.md
    │   ├── configuration.md
    │   ├── testing-strategy.md
    │   └── versioning-and-compatibility.md
    ├── reliability/
    │   ├── observability.md
    │   ├── logging.md
    │   ├── tracing.md
    │   ├── metrics.md
    │   ├── error-reporting.md
    │   ├── health-checks.md
    │   └── alerting.md
    ├── security/
    │   ├── data-classification.md
    │   ├── telemetry-redaction.md
    │   ├── secrets-management.md
    │   ├── authentication.md
    │   ├── authorization.md
    │   ├── production-access.md
    │   ├── data-retention.md
    │   └── incident-response.md
    ├── database/
    │   ├── principles.md
    │   ├── migrations.md
    │   ├── schema-documentation.md
    │   └── transactions-and-concurrency.md
    ├── api/
    │   ├── principles.md
    │   ├── error-contract.md
    │   └── versioning.md
    ├── adr/
    │   ├── README.md
    │   └── template.md
    └── runbooks/
        ├── README.md
        └── template.md
```

Do not add new foundational documents merely to make this tree larger.

Future documentation should be driven by actual implementation, decisions, domains, and operational needs.

---

# Orion Foundation Specification v0.1

The documents listed above form the initial:

```text
Orion Foundation Specification v0.1
```

They establish the baseline engineering rules before technology selection and implementation.

The intended progression after this point is:

```text
Foundation principles
    ↓
Foundation policies
    ↓
Technology selection
    ↓
Architecture Decision Records
    ↓
Monorepo and tooling implementation
    ↓
Initial backend + database + web application
    ↓
Reference vertical feature
```

The foundation should now remain stable enough to guide technology selection.

Future changes are expected.

Significant architectural changes should use ADRs and update current documentation rather than expanding policy speculatively.

---

# What Comes Next

The next phase is technology selection.

Expected decisions may eventually include:

```text
primary programming language and runtime

package manager

monorepo tooling

backend framework

primary database

database access / ORM strategy

API contract and validation system

web stack

testing tools

observability stack

deployment platform

CI/CD tooling
```

These decisions should not be made implicitly.

Architecturally significant choices should be evaluated and captured through ADRs.

---

# Summary

Orion documentation exists to make the system explainable.

The intended model is:

```text
canonical source
    ↓
current documentation
    ↓
generated reference where possible
```

with separate historical and operational layers:

```text
ADRs
    → why architecture was chosen

migrations
    → how released database state changed

Git
    → how implementation evolved

runbooks
    → how known operational situations are handled
```

Orion prefers:

```text
current truth over historical reconstruction

canonical sources over duplicated documentation

generated reference over manual structural duplication

authored meaning over code restatement

explicit decision history over architectural folklore

executable runbooks over vague operational notes
```

Documentation is part of the system.

It should make the architecture easier to understand, safer to change, easier to operate, and easier for both humans and AI agents to reason about correctly.
