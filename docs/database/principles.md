# Database Principles

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0005](../adr/0005-select-postgresql-as-the-primary-database.md), [ADR-0006](../adr/0006-select-prisma-orm-for-database-access-and-migrations.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Database Ownership](#database-ownership)
- [Constraints](#constraints)
- [Data Types](#data-types)
- [Query Design](#query-design)
- [Schema Evolution](#schema-evolution)
- [New Table Checklist](#new-table-checklist)

Related policy: [migrations](migrations.md), [schema documentation](schema-documentation.md), [transactions and concurrency](transactions-and-concurrency.md), [data retention](../security/data-retention.md).

## Purpose

This document defines the database architecture principles used by Orion.

Its goals are to ensure that persisted data is:

- correct;
- consistent;
- discoverable;
- intentionally owned;
- protected by appropriate constraints;
- accessible through clear boundaries;
- evolvable through safe migrations;
- observable;
- testable;
- documented from canonical sources where practical.

The database is not merely an implementation detail.

It is a long-lived system of record whose structure, constraints, and behavior directly affect application correctness.

This document is technology-agnostic.

PostgreSQL and Prisma ORM/Migrate are implemented for the Approval Request feature under ADR-0005 and ADR-0006. Hosting and deployment-specific runtime details remain deferred. The [generated physical and semantic reference](../generated/database/approval-requests.md) derives from migrated PostgreSQL and schema-adjacent metadata.

This document complements:

- [docs/architecture/principles.md](../architecture/principles.md);
- [docs/architecture/application-boundaries.md](../architecture/application-boundaries.md);
- [docs/architecture/dependency-rules.md](../architecture/dependency-rules.md);
- [docs/architecture/testing-strategy.md](../architecture/testing-strategy.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md);
- [docs/security/data-classification.md](../security/data-classification.md);
- [docs/security/secrets-management.md](../security/secrets-management.md).

---

## Core Principle

Data integrity should be protected as close to the data as practical.

The desired model is:

```text
application behavior
        ↓
persistence boundary
        ↓
database constraints and transactions
        ↓
durable state
```

Application validation is valuable.

It does not replace database integrity.

The database should prevent invalid persistent states where it can do so clearly and safely.

---

## The Database Is a Contract

The database defines durable contracts involving:

```text
tables
columns
types
constraints
indexes
relationships
views
functions
procedures
triggers
transactions
```

These structures affect:

- application behavior;
- migrations;
- reporting;
- operational tooling;
- data recovery;
- future integrations.

Database design should therefore be explicit and reviewable.

---

## Database Ownership

Every application-owned database object should have identifiable ownership.

Ownership should answer:

```text
Which domain or module owns this table?

Which code is allowed to write it?

Which code may read it?

Who may change its schema?

Which invariants does it protect?
```

Tables without ownership tend to become shared mutable state.

---

## Table Ownership

A table should normally belong to one primary domain or capability.

For example:

```text
Orders
    owns
orders
order_items
```

```text
Users
    owns
users
user_profiles
```

Ownership does not mean other modules may never read the data.

It means schema semantics and mutation authority have a clear owner.

---

## Shared Database Does Not Mean Shared Ownership

Multiple modules may use one physical database.

That does not imply:

```text
every module may directly modify every table
```

A shared database is a deployment choice.

Ownership remains an architectural concern.

---

## Cross-Domain Reads

Reading another domain's tables creates coupling.

Such reads may be acceptable in a modular monolith when:

```text
the ownership is understood;
the coupling is intentional;
the query does not bypass important semantics;
```

but they should not emerge accidentally.

Repeated cross-domain reads may indicate the need for a clearer capability boundary, projection, or shared model.

---

## Cross-Domain Writes

Direct writes to another domain's owned tables should be strongly restricted.

Avoid:

```text
Payments module
    ↓ directly updates
Orders-owned tables
```

unless the architecture explicitly defines that responsibility.

Prefer invoking the owning capability.

---

## Persistence Is Not Domain Ownership

A database package may physically contain schema or persistence implementation for many domains.

This does not mean the database package owns their business semantics.

For example:

```text
packages/database
```

may contain:

```text
orders schema
users schema
payments schema
```

while ownership still belongs to the corresponding domains.

---

## Database Access Is a Capability

Database access should be deliberate.

Possession of a database client should not automatically grant permission to query everything.

Application architecture should expose only the persistence capabilities required by each responsibility where practical.

---

## Client Applications

Browser, mobile, and desktop applications should not receive direct database credentials by default.

The intended model is:

```text
client
    ↓
trusted backend
    ↓
database
```

Direct client database access requires an explicit architecture and security model.

It must never occur accidentally.

---

## Stable Domain Concepts vs Storage Representation

Database records represent persistence structure.

They are not automatically:

```text
domain entities
API contracts
UI models
event schemas
```

Sometimes one representation may safely serve several roles.

That should be an explicit semantic decision.

---

## ORM Models

If an ORM is used, generated ORM types represent the ORM's view of persistence.

Do not assume:

```text
ORM model
    =
domain model
```

or:

```text
ORM model
    =
public API contract
```

without considering ownership and compatibility.

---

## Schema as a Canonical Source

The database schema should be a canonical machine-readable source for structural database truth where practical.

From it, Orion should eventually be able to derive or validate:

```text
database documentation
type information
migration state
constraints
relationships
data classification metadata
```

depending on tooling.

---

## Schema Definition Strategy

[ADR-0006](../adr/0006-select-prisma-orm-for-database-access-and-migrations.md#canonical-database-representations) distinguishes three representations:

- Prisma Schema Language is the primary authored representation for structures it can represent.
- Versioned SQL migrations define released database evolution.
- Fully migrated PostgreSQL defines the complete physical schema, including custom SQL features.

Generated database reference must derive from or be validated against that complete migrated schema.

The chosen strategy should preserve:

```text
reviewability
determinism
database correctness
migration control
documentation
```

The representation strategy is accepted; tooling implementation is still pending.

---

## Database-Native Features

Orion should not avoid useful database-native features merely to preserve theoretical database portability.

Features such as:

```text
constraints
indexes
transactions
native types
generated columns
views
```

may provide substantial correctness or performance benefits.

Portability should be considered only when it is a real requirement.

---

## Constraints

Database constraints should protect durable invariants whenever the database can express them clearly.

Potential constraints include:

```text
NOT NULL
UNIQUE
PRIMARY KEY
FOREIGN KEY
CHECK
EXCLUSION
```

depending on database technology.

---

## Application Validation and Database Constraints

Prefer both when each provides value.

Conceptually:

```text
application validation
    → useful user feedback

database constraint
    → final integrity guarantee
```

For example:

```text
email must be unique
```

may be checked before insertion for better user experience.

A database uniqueness constraint should still protect against concurrency.

---

## NOT NULL

A field that must always exist should normally be represented as non-nullable.

Avoid nullable columns merely because:

```text
it is easier during implementation
```

Nullability is part of the data model.

It should represent actual semantics.

---

## Nullability

A nullable value should mean something explicit.

Possible meanings include:

```text
unknown
not applicable
not yet assigned
intentionally absent
```

If these meanings differ materially, a richer model may be appropriate.

---

## Unique Constraints

Uniqueness requirements should be enforced by the database when durable uniqueness matters.

Application-only uniqueness checks are vulnerable to concurrency.

For example:

```text
check email does not exist
    ↓
another request inserts same email
    ↓
first request inserts
```

Without a database constraint, both may succeed.

---

## Foreign Keys

Relationships that require referential integrity should normally use foreign-key constraints where the architecture permits them.

Foreign keys can prevent:

```text
orphaned rows
invalid references
accidental deletes
```

Their update and delete behavior must be intentional.

---

## Foreign-Key Actions

Actions such as:

```text
CASCADE
RESTRICT
SET NULL
```

must reflect domain semantics.

Do not use cascading deletion merely because it reduces application code.

A cascade may represent a significant data lifecycle decision.

---

## Check Constraints

Check constraints can protect simple durable invariants.

Examples may include:

```text
quantity > 0
percentage between 0 and 100
end_time >= start_time
```

They are useful when the rule is stable and expressible at the database level.

Complex business workflows should not be forced into unreadable check expressions.

---

## Domain Invariants

Not every domain invariant belongs in the database.

For example:

```text
shipped order cannot be cancelled
```

may require application/domain behavior rather than a static database constraint.

The database should protect invariants it can express appropriately.

The application should protect richer behavior.

---

## Defense in Depth

Critical invariants may exist at multiple layers.

For example:

```text
API validation
    ↓
domain validation
    ↓
database constraint
```

This is acceptable when each layer serves a different responsibility.

Avoid duplicating complex business logic in multiple forms that may drift.

---

## Data Types

Database types should represent the semantics of the stored value.

Avoid using generic text for everything when a stronger type improves correctness.

Potential examples include:

```text
boolean
integer
decimal
timestamp
date
UUID
enum
JSON
```

depending on database support.

---

## Numeric Types

Financial values and other precise quantities should use numeric representations appropriate to their semantics.

Floating-point storage should not be used casually for values requiring exact decimal precision.

The selected representation should document:

```text
precision
scale
unit
rounding behavior
```

where relevant.

---

## Money

Money should have explicit semantics.

A monetary value may require:

```text
amount
currency
```

Do not assume every number represents the same currency.

Avoid ambiguous columns such as:

```text
price
```

without clear unit or currency semantics when multiple currencies are possible.

---

## Units

Stored measurements should make units explicit.

Prefer:

```text
duration_ms
weight_grams
```

or another documented typed representation over ambiguous numeric columns.

---

## Dates and Times

Date and time storage should represent semantics explicitly.

Distinguish concepts such as:

```text
calendar date
local wall-clock time
absolute instant
duration
timezone
```

Do not use one timestamp type for every temporal concept without understanding its meaning.

---

## Time Zones

Absolute events should generally have unambiguous time semantics.

User-facing local time may require associated timezone information.

The exact database representation will depend on selected technology.

---

## Timestamps

Common lifecycle timestamps may include:

```text
created_at
updated_at
deleted_at
```

They should be introduced only when their semantics are useful.

Avoid automatically adding fields that nobody uses.

---

## Audit Timestamps

If `created_at` or `updated_at` is intended for auditing, its update semantics must be reliable.

A convenience timestamp is not necessarily a complete audit trail.

---

## Identifiers

Identifiers should have explicit scope and semantics.

Potential identifiers include:

```text
internal row ID
public resource ID
external provider ID
natural business identifier
```

These are not automatically interchangeable.

---

## Primary Keys

Primary keys should be stable.

Changing a primary key should be exceptional.

The exact key strategy will depend on database and application requirements.

---

## Public Identifiers

A public API identifier may be distinct from a database primary key.

This can be useful when:

```text
internal storage changes;
public format requires stability;
enumeration risk matters;
```

It is not mandatory for every table.

---

## Natural Keys

Natural business identifiers may sometimes be appropriate.

They should be used as primary keys only when their stability is well understood.

Mutable business identifiers often make poor primary keys.

---

## Generated Identifiers

Generated identifiers should avoid encoding sensitive information.

They should be suitable for their intended scope.

Identifiers are not authorization mechanisms.

---

## Enumerations

Enums can make bounded states explicit.

They should be used when values represent a stable closed set.

Changing database enums may have migration implications.

The exact strategy depends on selected database technology.

---

## State Models

When data represents lifecycle state, values should be explicit.

Prefer:

```text
status = pending | paid | cancelled
```

over combinations of loosely related booleans such as:

```text
is_paid
is_cancelled
is_pending
```

when those combinations can represent invalid states.

---

## Boolean Proliferation

Multiple booleans may create impossible combinations.

For example:

```text
is_active = true
is_deleted = true
is_suspended = true
```

may have unclear semantics.

Use an explicit state model when states are mutually exclusive.

---

## JSON and Unstructured Data

JSON or equivalent flexible columns may be useful.

They should not become a default substitute for schema design.

Use structured columns when fields have stable known semantics and require:

```text
validation
indexing
constraints
documentation
classification
```

---

## Free-Form Metadata

Free-form metadata should be introduced cautiously.

It complicates:

```text
classification
migration
validation
querying
redaction
AI reasoning
```

Known important fields should prefer explicit schemas.

---

## JSON Schema Evolution

Persisted JSON structures are still schemas.

They require migration and compatibility thinking even when the database does not enforce every field.

Schema flexibility does not remove evolution responsibilities.

---

## Large Objects

Large binary data should not automatically be stored in ordinary relational tables.

Potential alternatives may include object storage.

The decision should consider:

```text
size
access pattern
backup
transaction requirements
retention
cost
```

The actual strategy will be selected only when required.

---

## Files

If the application stores files externally, the database may store:

```text
file identifier
metadata
ownership
classification
storage reference
```

The database should not assume the external object still exists without considering lifecycle consistency.

---

## Indexes

Indexes exist to support real query and integrity requirements.

They should not be added blindly to every column.

Each significant index should have a purpose.

---

## Index Ownership

A meaningful index should be explainable by:

```text
query pattern
constraint
ordering requirement
```

Unused indexes increase:

```text
storage
write cost
migration cost
maintenance
```

---

## Unique Indexes

A unique index may enforce business integrity.

Its semantic purpose should be documented.

Do not treat it merely as a performance optimization.

---

## Composite Indexes

Column order matters.

Composite indexes should correspond to actual access patterns.

Avoid speculative indexing before query behavior exists.

---

## Partial and Specialized Indexes

Database-specific indexing features may be appropriate when they provide meaningful value.

They should be documented because their behavior may be less obvious than ordinary indexes.

---

## Query Design

Queries should retrieve only the data required.

Avoid:

```text
SELECT *
```

as a default architectural habit when explicit projections improve clarity, performance, or security.

The exact style depends on tooling.

---

## Projection

Read operations may use projections different from write/domain models.

For example:

```text
OrderSummary
```

may contain less data than:

```text
Order
```

This can improve:

```text
performance
security
API clarity
```

---

## N+1 Queries

Query patterns that accidentally issue one query per result should be avoided where they create material cost.

ORM convenience must not obscure actual database behavior.

Database access should remain observable.

---

## Query Count

Critical workflows may require tests or telemetry around query count when performance problems emerge.

Do not optimize every query prematurely.

Make expensive behavior discoverable.

---

## Transactions

See [database transaction and concurrency requirements](transactions-and-concurrency.md#transactions). The detailed requirements are maintained there.

---

## Data Integrity

Data integrity includes more than valid column values.

It includes:

```text
referential integrity
uniqueness
valid state
transactional consistency
ownership
cross-row invariants
```

The architecture should identify which layer protects each invariant.

---

## Derived Data

Persisted derived data may improve performance.

It also creates consistency obligations.

Examples include:

```text
cached totals
denormalized status
precomputed counters
```

Before persisting derived data, define:

```text
canonical source
update mechanism
rebuild strategy
consistency expectation
```

---

## Normalization

Normalize data when it improves correctness and ownership.

Denormalize when performance or read-model requirements justify the consistency cost.

Neither should be treated as doctrine.

---

## Denormalization

A denormalized copy is another representation that can become stale.

Its lifecycle must be explicit.

If the value can be regenerated, the canonical source should remain clear.

---

## Views

Database views may provide:

```text
stable projections
complex read abstraction
reporting interfaces
```

Views should have documented ownership and purpose.

They are database objects and part of schema evolution.

---

## Materialized Views

Materialized views introduce refresh and consistency semantics.

If used, documentation should define:

```text
source
refresh strategy
staleness expectation
ownership
```

---

## Stored Functions and Procedures

Database functions and procedures should be used intentionally.

They may be appropriate for:

```text
data-intensive operations
atomic database behavior
shared database invariants
```

They also hide behavior outside ordinary application code.

Their purpose and behavior must therefore be documented.

---

## Triggers

Triggers can protect invariants or implement technical behavior.

They can also create hidden side effects.

Triggers should be introduced only when their database-level value outweighs discoverability cost.

Every application-owned trigger must be documented.

---

## Trigger Side Effects

A contributor should be able to discover that:

```text
INSERT table A
```

causes:

```text
trigger
    ↓
UPDATE table B
```

without learning it through production debugging.

Hidden persistence behavior is architectural behavior.

---

## Generated Columns

Generated columns may be useful for derived values.

Their expressions and semantics should be documented where not obvious.

They remain part of schema compatibility.

---

## Database Events

Database-native notification features should not be introduced casually as the primary application event architecture.

They may be useful for specific technical purposes.

Application event ownership should remain explicit.

---

## Data Classification

Database fields inherit Orion's data-classification requirements.

Schema design should eventually make sensitive fields discoverable.

For example:

```text
users.email
    classification: CONFIDENTIAL
```

```text
users.password_hash
    classification: RESTRICTED
```

---

## Sensitive Columns

Restricted columns should receive additional consideration for:

```text
access
logging
backups
exports
replication
support tools
```

Database access alone does not justify exposing these values to application code that does not need them.

---

## Column-Level Access

Some systems may require limiting access to specific sensitive columns.

This should be introduced based on actual risk.

Application-level projections may provide sufficient protection initially.

---

## Encryption

Infrastructure encryption at rest does not change data classification.

Field-level encryption may be appropriate for particularly sensitive values.

It introduces:

```text
key management
migration
search limitations
rotation
recovery complexity
```

and should require explicit architectural justification.

---

## Secrets in the Database

Some application secrets may require persistence.

When possible, prefer:

```text
secure derived representation
```

or:

```text
external secret-management system
```

depending on use case.

Raw infrastructure secrets should not be stored in ordinary business tables merely for convenience.

---

## Password Hashes

Password hashes are database data but remain `RESTRICTED`.

Their presence in a table does not make them ordinary application fields.

Queries and projections should avoid retrieving them unless required by authentication logic.

---

## Database Credentials

Application database credentials follow:

- [docs/security/secrets-management.md](../security/secrets-management.md)

Runtime database credentials should be least-privileged.

---

## Runtime vs Migration Credentials

Migration tooling may require privileges that runtime applications do not.

Prefer separate identities when privilege requirements differ.

---

## Read-Only Credentials

Operational or analytical access may use read-only credentials when possible.

Read-only access is still sensitive because it may expose confidential data.

---

## Production Access

Humans should not routinely use unrestricted production database credentials.

Production database access should follow the future:

- [docs/security/production-access.md](../security/production-access.md)

---

## Auditability

Sensitive administrative database access should be auditable where infrastructure supports it.

Database access should not become an invisible backdoor around application authorization.

---

## Data Lifecycle

See [database lifecycle and recovery requirements](../security/data-retention.md#data-lifecycle). The detailed requirements are maintained there.

---

## Replication

Replication creates additional copies of data.

Replicas inherit:

```text
classification
access requirements
retention requirements
```

They should not become uncontrolled analytical or support databases.

---

## Read Replicas

Read replicas may improve scale or isolation.

They introduce consistency and failover semantics.

Applications must understand whether reads can be stale.

---

## Database Availability

Database failures should be observable and handled according to:

- [docs/architecture/error-handling.md](../architecture/error-handling.md)
- [docs/reliability/observability.md](../reliability/observability.md)

Application behavior should not expose raw database errors to untrusted consumers.

---

## Connection Pools

Connection pools are finite shared resources.

Configuration should be based on:

```text
application concurrency
database limits
number of replicas
deployment scale
```

rather than arbitrary high defaults.

---

## Connection Pool Exhaustion

Pool saturation should be observable.

Symptoms may include:

```text
increased latency
timeouts
failed queries
```

Increasing pool size is not always the correct solution.

---

## Query Timeouts

Database operations should not wait indefinitely.

Important queries should have bounded timeout behavior appropriate to the runtime and database driver.

Timeouts should be observable.

---

## Statement Cancellation

Where supported, timed-out or abandoned requests should avoid leaving unnecessary expensive database work running.

The exact mechanism depends on database technology.

---

## Schema Naming

Database object names should use consistent conventions.

The exact naming standard will be selected with the database stack.

Consistency should apply to:

```text
tables
columns
constraints
indexes
foreign keys
views
```

---

## Meaningful Names

Names should describe semantics.

Prefer:

```text
order_items
```

over:

```text
oi
```

unless a database-specific constraint requires abbreviation.

Avoid historical names whose current meaning differs from their original purpose.

---

## Boolean Columns

Boolean column names should read naturally as predicates.

Examples:

```text
is_active
has_access
```

depending on naming conventions.

Avoid ambiguous booleans.

---

## Foreign-Key Column Names

Relationship columns should make their target clear.

For example:

```text
user_id
order_id
```

rather than generic:

```text
owner
reference
```

unless the semantics genuinely differ.

---

## Constraint Names

Constraint names should be deterministic and understandable where tooling permits.

Useful names improve migration diagnostics and production debugging.

---

## Index Names

Index names should reveal their purpose or indexed fields where practical.

Generated names are acceptable if they remain deterministic and discoverable.

---

## Database Documentation

See [database documentation requirements](schema-documentation.md#database-documentation). The detailed requirements are maintained there.

---

## AI-Friendly Database Design

Database structures should be understandable without reverse engineering hidden conventions.

Prefer:

```text
explicit constraints
clear names
canonical schema
documented ownership
```

over:

```text
implicit relationships
magic values
undocumented triggers
```

---

## Magic Values

Avoid storing undocumented sentinel values such as:

```text
status = -1
type = 99
date = 1900-01-01
```

to represent hidden states.

Use explicit schema semantics.

---

## Historical Columns

Columns that remain only for compatibility or migration reasons should be documented as such.

Stale columns should eventually be removed when safe.

---

## Deprecated Database Objects

Database objects may require deprecation before removal.

A safe lifecycle may be:

```text
stop new usage
    ↓
migrate consumers
    ↓
verify no dependency remains
    ↓
remove in later migration
```

---

## Schema Evolution

See [database schema-evolution requirements](migrations.md#schema-evolution). The detailed requirements are maintained there.

---

## Database Testing

Database behavior should be tested according to:

- [docs/architecture/testing-strategy.md](../architecture/testing-strategy.md)

Important persistence behavior should use the actual database technology where semantics matter.

---

## Constraint Tests

Critical constraints should have tests when their behavior is important to application correctness.

Examples:

```text
unique email
foreign-key ownership
check constraint
```

Testing only application validation does not prove database enforcement exists.

---

## Transaction Tests

Critical atomic workflows should verify transaction behavior.

A failure should not leave partial persistent state when the operation promises atomicity.

---

## Concurrency Tests

Important concurrent workflows should receive dedicated tests.

Concurrency behavior is difficult to infer from sequential unit tests.

---

## Migration Tests

Migration validation should include relevant paths from released schema states.

A fresh database build alone does not prove production upgrade safety.

---

## Schema Drift

Production schema must not drift silently from the repository's canonical schema history.

Manual production schema changes should be avoided.

Emergency changes must be reconciled back into repository history.

---

## Manual Database Changes

Direct manual schema changes create:

```text
drift
missing history
reproducibility problems
```

Schema evolution should occur through repository-controlled migration workflows.

---

## Data Fixes

Production data fixes may sometimes require manual or scripted intervention.

Important data fixes should be:

```text
reviewed
auditable
repeatable where practical
scoped
```

A complex one-time data fix may deserve a repository script or migration.

---

## Database Scripts

Operational scripts that modify data should follow application ownership and security rules.

They should not become undocumented bypasses around domain invariants.

---

## Administrative SQL

Ad hoc SQL against production should be exceptional.

Important recurring operations should become controlled tooling.

---

## Seed Data

Seed data may support:

```text
development
tests
initial application bootstrap
```

These are different responsibilities.

Do not use one uncontrolled seed mechanism for all contexts.

---

## Development Seed Data

Development seeds should be synthetic and safe.

They should create useful local scenarios without copying production information.

---

## Production Bootstrap Data

If production requires initial reference data, it should be treated as part of deployment or migration design.

Do not assume development seeds are appropriate for production.

---

## Reference Data

Stable application reference data may be represented through:

```text
database rows
code
configuration
```

depending on ownership and lifecycle.

The source of truth should be explicit.

---

## Lookup Tables

Lookup tables may be useful for data-driven stable values.

They should not be introduced mechanically when a typed application enum is sufficient.

Likewise, application enums should not replace values that must be operationally managed.

---

## Audit History

If business history must be preserved, model it explicitly.

Do not assume ordinary application logs provide authoritative business audit history.

Potential mechanisms include:

```text
audit tables
history tables
domain events
versioned records
```

The appropriate model depends on requirements.

---

## Updated-At Is Not Audit History

An `updated_at` timestamp tells when something changed.

It does not tell:

```text
who changed it
what changed
why
previous value
```

Do not confuse modification timestamps with complete auditability.

---

## Event Sourcing

Event sourcing is not a default Orion architecture.

It should be introduced only when event history is the actual source-of-truth requirement.

Ordinary CRUD or domain persistence should not be converted into event sourcing for architectural fashion.

---

## CQRS

Separate read and write models may be useful when their requirements diverge substantially.

CQRS is not a default requirement.

Introduce it only when it solves concrete complexity or scale problems.

---

## Database per Service

A separate database per service may strengthen ownership in distributed systems.

It also introduces operational complexity.

Orion does not require it by default.

Service boundaries should precede database separation decisions.

---

## Modular Monolith Database

A modular monolith may use one physical database while preserving logical ownership.

This is a reasonable default when operational simplicity matters.

Logical boundaries must still be explicit.

---

## Reporting

Reporting and analytical queries may require cross-domain data.

They should not force runtime domains to abandon ownership.

Potential solutions may include:

```text
read models
views
analytics replicas
warehouse
```

only when requirements justify them.

---

## Analytics

Analytical workloads should not degrade critical transactional workloads unnecessarily.

As scale grows, workload isolation may become necessary.

Do not introduce a warehouse before real analytical requirements exist.

---

## Search

Search indexes are derived data stores.

If introduced, the database should remain the canonical source unless architecture explicitly states otherwise.

Synchronization and rebuild semantics must be defined.

---

## Cache

Caches are not the source of truth unless explicitly designed as durable state.

Database-backed canonical state should not depend on cache existence.

---

## External Data Stores

Introducing additional persistence technologies such as:

```text
document store
search engine
graph database
key-value store
```

requires concrete capability justification.

Polyglot persistence increases:

```text
operations
backup complexity
consistency complexity
observability requirements
```

Use additional data stores only when they provide substantial value.

---

## Data Store Selection

Choose data technology based on requirements such as:

```text
consistency
query model
scale
latency
operational maturity
transaction needs
```

not trend or novelty.

---

## Database Observability

Database operations should integrate with Orion observability.

Relevant signals may include:

```text
query duration
transaction failures
connection pool saturation
timeouts
deadlocks
migration duration
```

Sensitive query values must remain protected.

---

## Query Logging

Raw SQL logging may expose sensitive data.

Database observability must follow:

- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

Normalized or parameterized query representations should be preferred when possible.

---

## Slow Queries

Slow query behavior should be discoverable.

Optimization should be evidence-driven.

Do not add indexes or caching purely from speculation.

---

## Query Plans

Execution plans may be useful when investigating performance.

They should be treated as diagnostic information.

Plan analysis belongs to implementation-specific database operations.

---

## Metrics

Database metrics may eventually include:

```text
query latency
active connections
pool wait time
transaction failures
deadlocks
replication lag
```

Exact telemetry depends on database and hosting platform.

---

## Database Error Translation

Database errors should be translated at persistence or application boundaries.

For example:

```text
unique constraint violation
    ↓
EMAIL_ALREADY_IN_USE
```

when that constraint represents a domain semantic.

Do not expose raw database errors as public contracts.

---

## Unknown Database Errors

Unexpected database errors should remain unexpected internal failures.

Do not map all database exceptions into generic user mistakes.

Preserve the original cause internally for diagnostics.

---

## Database Availability

A database outage is usually an infrastructure failure.

Applications should fail predictably and provide safe external errors.

Critical dependency failure should be operationally visible.

---

## Database Health Checks

Health checks may validate database availability where readiness semantics require it.

Liveness should not necessarily fail merely because the database is temporarily unavailable.

Exact semantics belong in reliability documentation.

---

## Database Documentation and AI Agents

AI agents should be able to determine:

```text
which tables exist
what each table means
which columns exist
which constraints protect integrity
which domain owns the data
which migrations changed the structure
```

without reverse engineering production.

This is a core Orion goal.

---

## AI Agent Database Changes

Before modifying a database schema, an AI agent should:

```text
identify table ownership
inspect current schema
inspect released migration history
inspect relevant domain rules
inspect database documentation
consider compatibility
consider data migration
consider rollback or forward recovery
```

It must not generate a migration solely from schema diff without understanding intent.

---

## AI and Migration History

An AI agent must distinguish:

```text
unreleased migration
released migration
```

before editing migration history.

If release status is uncertain, the migration should be treated as immutable until verified.

---

## AI and Data Destruction

AI agents must not introduce destructive database operations casually.

Potential data loss requires explicit reasoning and validation.

A schema cleanup is not automatically safe merely because code no longer references the data.

---

## AI and Raw SQL

AI-generated raw SQL should follow the same ownership, security, and transaction rules as application-generated persistence.

Raw SQL is not exempt from architecture.

---

## Mechanical Enforcement

Future tooling may enforce database rules such as:

```text
schema documentation completeness
missing table ownership
missing column descriptions
restricted-field metadata
migration immutability
schema drift
generated documentation freshness
forbidden direct database imports
```

Exact enforcement depends on the chosen database tooling.

---

## Machine-Readable Metadata

A future canonical schema may include metadata such as:

```text
owner
description
classification
unit
deprecated
```

where practical.

This can support:

```text
generated docs
security validation
AI reasoning
migration review
```

---

## Schema Review

Database changes should receive review proportional to risk.

Additional scrutiny is appropriate for:

```text
destructive changes
large backfills
new sensitive data
new cross-domain relationships
new triggers
new public identifiers
new unique constraints
```

---

## New Table Checklist

Before creating a new table, answer:

1. Which domain owns it?
2. What durable concept does it represent?
3. Why must the data be persisted?
4. What is its primary key?
5. Which columns are required?
6. Which constraints protect integrity?
7. Which relationships exist?
8. What is each field's classification?
9. What is the deletion/retention behavior?
10. Which application code may write it?
11. Which application code may read it?
12. Which queries require indexes?
13. How will it be documented?
14. How will it be migrated?
15. How will it be tested?

If these questions cannot be answered, the table design is incomplete.

---

## New Column Checklist

Before introducing a column, answer:

1. What does the value mean?
2. Which type represents it correctly?
3. Can it be null?
4. What does null mean?
5. Does it require a default?
6. Is the default safe for existing rows?
7. What is its classification?
8. Does it require a constraint?
9. Does it require an index?
10. Is it part of a public contract?
11. How will existing rows be populated?
12. Is the field derived from another canonical value?
13. How will it be documented?

---

## New Constraint Checklist

Before introducing a constraint, answer:

1. Which invariant does it protect?
2. Is the database the correct enforcement layer?
3. Can existing data satisfy it?
4. Does application behavior already assume it?
5. What error semantics should a violation produce?
6. Does it affect concurrent operations?
7. Will adding it require a table scan or lock?
8. How will it be tested?

---

## New Index Checklist

Before creating an index, answer:

1. Which query or constraint requires it?
2. What is the expected access pattern?
3. What is the column order?
4. What is the write/storage cost?
5. Is a similar index already present?
6. Does creation have operational impact?
7. How will usefulness be measured?

---

## New Database Feature Checklist

Before introducing a:

```text
trigger
view
materialized view
procedure
function
```

answer:

1. What problem does it solve?
2. Why is the database the correct owner?
3. What hidden behavior does it introduce?
4. How will contributors discover it?
5. How will it be tested?
6. How will it be migrated?
7. How will it be observed?
8. What applications depend on it?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Application-Only Uniqueness

Checking uniqueness without a database constraint when durable uniqueness matters.

Avoid.

---

### Nullable by Convenience

Making required fields nullable merely to simplify implementation.

Avoid.

---

### Direct Client Database Credentials

Prohibited by default.

---

### Shared Mutable Tables Without Ownership

Avoid.

---

### Cross-Domain Writes by Convenience

Avoid.

---

### ORM Model as Universal Model

Avoid.

---

### Public API Directly Exposes Persistence Object

Avoid unless semantics intentionally match.

---

### JSON for Everything

Avoid.

---

### Generic Metadata as Primary Schema

Avoid.

---

### Floating Point for Exact Money

Avoid.

---

### Magic Sentinel Values

Avoid.

---

### Index Every Column

Avoid.

---

### No Foreign Keys Because Application Handles It

Avoid when referential integrity is important and the database can enforce it appropriately.

---

### Trigger With Undocumented Side Effect

Prohibited.

---

### Long Transaction Around External API Calls

Avoid unless explicitly designed.

---

### Manual Production Schema Drift

Prohibited as a normal workflow.

---

### Editing Released Migrations

Prohibited.

---

### One Runtime Credential With Administrative Privileges

Avoid.

---

### Production Database Dump as Development Fixture

Prohibited by default.

---

### Logging Raw Query Parameters

Prohibited when they may contain sensitive data.

---

### Soft Delete Everywhere

Avoid.

---

### Premature Polyglot Persistence

Avoid.

---

## Initial Database Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Every application-owned table must have identifiable ownership.
2. Shared physical databases do not imply shared logical ownership.
3. Direct cross-domain writes should be avoided unless explicitly designed.
4. Client applications must not receive direct database credentials by default.
5. Durable invariants should be enforced by database constraints where appropriate.
6. Application validation does not replace database integrity.
7. Nullability must represent real semantics.
8. Durable uniqueness should be enforced by the database.
9. Referential integrity should use explicit relationships where appropriate.
10. Persistence models must not automatically become domain or public API models.
11. Database access should follow explicit architectural boundaries.
12. Transactions must correspond to meaningful consistency requirements.
13. Concurrency must be considered for important workflows.
14. Released migration history is immutable.
15. Unreleased migration history may be refined.
16. Every application-owned table and column requires canonical documentation.
17. Views, functions, procedures, triggers, and materialized views require documented purpose.
18. Sensitive database fields must follow data-classification policy.
19. Database behavior should be tested against the real database technology where semantics matter.
20. Database structure and documentation should become machine-readable and mechanically validated where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
database hosting
identifier strategy
naming convention
timestamp conventions
database package structure
test database isolation
connection-pool strategy
database-native documentation mechanism
row-level security
backup architecture
```

These choices should follow actual product and deployment requirements.

Significant choices should be documented through ADRs.

---

## Future Documentation

This document should be complemented by:

- [docs/database/migrations.md](migrations.md)
- [docs/database/schema-documentation.md](schema-documentation.md)
- [docs/database/transactions-and-concurrency.md](transactions-and-concurrency.md)
- [docs/security/data-retention.md](../security/data-retention.md)
- [docs/security/production-access.md](../security/production-access.md)
- [docs/reliability/health-checks.md](../reliability/health-checks.md)

Implementation-specific database documentation should reference these principles rather than redefining them independently.

---

## Summary

The database is a durable system of record and an architectural boundary.

The intended model is:

```text
business responsibility
        ↓
explicit persistence capability
        ↓
owned schema
        ↓
constraints + transactions
        ↓
durable state
```

Orion prefers:

```text
explicit ownership over shared mutable tables

database-enforced integrity over application assumptions

meaningful types over generic storage

intentional transactions over accidental consistency

real database tests over persistence mocks alone

canonical schema metadata over duplicated documentation

safe migration history over noisy development history
```

The database should reject invalid durable states when it can do so clearly.

It should make hidden behavior difficult to create.

It should make ownership and relationships easy to discover.

A database schema that cannot explain its own semantics is difficult to maintain.

A database without enforceable integrity is easy to corrupt.

A database migration history that records every abandoned development experiment is difficult to trust.

Orion should avoid all three.
