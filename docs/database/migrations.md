# Database Migrations

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0006](../adr/0006-select-prisma-orm-for-database-access-and-migrations.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Released Migration](#released-migration)
- [Unreleased Migration](#unreleased-migration)
- [Destructive Changes](#destructive-changes)
- [Backfills](#backfills)
- [Initial Migration Policy](#initial-migration-policy)
- [Schema Evolution](#schema-evolution)

Related policy: [versioning and compatibility](../architecture/versioning-and-compatibility.md), [schema documentation](schema-documentation.md).

## Purpose

This document defines the database migration policy used by Orion.

Its goals are to ensure that database evolution is:

- safe;
- intentional;
- reviewable;
- compatible with application deployment;
- reproducible;
- testable;
- operationally observable;
- understandable by humans and AI agents;
- free from unnecessary development-history noise.

Database migrations represent meaningful transitions between durable database states.

They are not a complete record of every schema experiment performed during development.

This document is technology-agnostic.

PostgreSQL, Prisma Schema Language for representable structures, and Prisma Migrate are selected by ADR-0005 and ADR-0006. Deployment commands and remaining migration implementation details are not available yet.

This document complements:

- [docs/database/principles.md](principles.md);
- [docs/architecture/versioning-and-compatibility.md](../architecture/versioning-and-compatibility.md);
- [docs/architecture/testing-strategy.md](../architecture/testing-strategy.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md);
- [docs/reliability/observability.md](../reliability/observability.md).

---

## Core Principle

Orion follows this rule:

```text
production history is immutable

development history is disposable
```

More precisely:

```text
released migration history is immutable

unreleased migration history may be refined
```

Git preserves development history.

Migration history preserves meaningful transitions between released persistent database states.

These are different responsibilities.

---

## Why This Policy Exists

During development, schema design often evolves through exploration.

For example:

```text
create table experiment
    ↓
rename column
    ↓
change type
    ↓
drop table
```

If none of those states were ever released to a persistent environment that must be upgraded, preserving all four migrations provides little operational value.

The meaningful transition may simply be:

```text
released schema A
    ↓
released schema B
```

Migration history should describe this transition clearly and safely.

---

## Migration History Is Not Git History

Migration files must not be used as a substitute for source-control history.

Git answers questions such as:

```text
How did this design evolve during development?

Which experiments were attempted?

Who changed the schema?

Why was a column renamed before release?
```

Migration history answers:

```text
How does a database at released state A reach released state B safely?
```

Do not force migrations to preserve information Git already records better.

---

## Released and Unreleased Migrations

Every migration should be understood as either:

```text
unreleased
```

or:

```text
released
```

This distinction determines whether the migration history may be edited.

---

## Unreleased Migration

An unreleased migration has not yet become part of a persistent database history that Orion promises to upgrade safely.

An unreleased migration may be:

```text
edited
rewritten
combined
squashed
regenerated
renamed
removed
```

when doing so improves the final migration history.

---

## Released Migration

A released migration has become part of a persistent database state whose future upgrades depend on that migration history.

Once released, the migration is immutable.

It must not be:

```text
edited
deleted
rewritten
reordered
replaced
```

even if a cleaner migration could have been written in hindsight.

Corrections require a new migration.

---

## What Counts as Released?

A migration is released when it has been applied to a database environment that Orion considers part of durable release history.

Typical examples may include:

```text
production
persistent staging used as a release baseline
customer-hosted installation
persistent environment with guaranteed forward migration
```

The exact release environments will be defined with deployment architecture.

---

## Temporary Development Databases

A migration applied only to disposable developer or test databases is not automatically released.

Examples include:

```text
local database
ephemeral CI database
temporary preview environment
throwaway development environment
```

These databases may be recreated from scratch.

Their existence does not force migration immutability.

---

## Persistent Non-Production Environments

Not every non-production environment is disposable.

For example:

```text
long-lived staging database
```

may contain persistent data and depend on forward-only migrations.

If Orion treats such an environment as a durable migration consumer, migrations applied there may need to be considered released.

The environment policy must be explicit.

---

## When Release Status Is Uncertain

If it is unclear whether a migration has entered durable history, treat it as immutable until verified.

Prefer:

```text
possible unnecessary migration
```

over:

```text
corrupted migration history
```

---

## Migration Immutability

Once released, a migration's meaning and contents are immutable.

This includes:

```text
SQL
schema operations
data transformations
migration identifier
execution order
```

Changing a released migration can produce different schema states for databases that previously applied the original version.

That breaks reproducibility.

---

## Migration Checksums

If the selected migration tool supports checksums or equivalent integrity verification, released migration modification should be detected automatically.

Checksum failures should not be bypassed casually.

They may indicate:

```text
migration history was modified
database history drifted
repository history is inconsistent
```

---

## Fix Forward

When a released migration is incorrect, the normal strategy is:

```text
existing released migration
        ↓
new corrective migration
```

not:

```text
rewrite history
```

This preserves deterministic upgrade behavior.

---

## Example: Released Mistake

Suppose a released migration creates:

```text
users.nickname VARCHAR(20)
```

but the intended limit is 50.

Do not modify the released migration.

Create:

```text
ALTER users.nickname ...
```

through a new migration.

---

## Example: Unreleased Mistake

Suppose the same migration has only been used locally and has never entered durable release history.

It may be edited directly to create:

```text
users.nickname VARCHAR(50)
```

instead of preserving:

```text
create 20
    ↓
alter 50
```

for no operational reason.

---

## Development Iteration

During feature development, contributors may experiment with database design.

A local history might temporarily become:

```text
001_create_widgets
002_add_widget_status
003_rename_widget_status
004_drop_widgets
```

If none of these migrations were released and the final feature does not contain `widgets`, the correct final released migration history may contain none of them.

Git already preserves the experimentation.

---

## Squashing

Squashing combines multiple unreleased migrations into a smaller set of meaningful migrations.

Squashing is appropriate when:

- migrations are unreleased;
- the combined result remains safe;
- no durable environment depends on the intermediate states;
- the final history becomes clearer.

---

## Squashing Is Not Always One Migration

The objective is not:

```text
one feature = one migration
```

The objective is:

```text
minimum number of meaningful and safe migrations
```

A feature may legitimately require several migrations.

---

## Meaningful Migration Boundaries

Separate migrations may be appropriate when they represent distinct deployment or data-safety stages.

Examples include:

```text
add nullable column
    ↓
backfill data
    ↓
make column required
```

or:

```text
add new table
    ↓
migrate consumers
    ↓
remove legacy table
```

These intermediate states may be necessary even before release if they model the real deployment strategy.

---

## Safety Over Migration Count

Never collapse migrations merely to reduce file count when the combined operation would be less safe.

For example:

```text
add new column
backfill millions of rows
add NOT NULL
```

may need separate operational steps.

A single migration file is not inherently better.

---

## Migration Naming

Migration names should describe intent.

Prefer:

```text
create_orders
add_order_cancellation_reason
backfill_user_public_id
drop_legacy_payment_status
```

over:

```text
migration_42
update_schema
fix_db
changes
```

The exact naming syntax depends on the migration tool.

---

## Migration Identifier

Migration identifiers should remain unique and deterministic according to the selected tooling.

They may include:

```text
timestamp
sequence
tool-generated ID
```

The identifier format matters less than immutability and ordering.

---

## Schema Migrations

A schema migration changes database structure.

Examples include:

```text
CREATE TABLE
ALTER TABLE
CREATE INDEX
DROP COLUMN
ADD CONSTRAINT
```

Schema changes should be reviewed for both logical correctness and operational impact.

---

## Data Migrations

A data migration changes persisted data to support a new schema or semantic model.

Examples include:

```text
backfill new column
convert legacy status
populate new identifiers
move data between tables
```

Data migrations require the same seriousness as schema migrations.

---

## Schema and Data Migration Separation

Schema and data changes may be separated when doing so improves:

```text
operational safety
retryability
observability
deployment compatibility
```

For small changes, combining them may remain appropriate.

The decision should follow risk rather than ceremony.

---

## Backfills

A backfill populates or transforms existing data.

Backfills should consider:

```text
dataset size
execution time
locks
transaction size
retry behavior
progress
failure recovery
```

A migration tool executing one transaction is not necessarily the correct mechanism for a large backfill.

---

## Small Backfills

Small bounded backfills may safely execute as part of a migration.

Example:

```text
update a small reference table
```

The expected row count and operational cost should be understood.

---

## Large Backfills

Large backfills may require dedicated application or operational tooling.

A safer workflow may be:

```text
deploy compatible schema
        ↓
run batched backfill
        ↓
observe progress
        ↓
verify completeness
        ↓
enforce new constraint
```

The backfill may need to be resumable.

---

## Backfill Idempotency

Long-running or retryable backfills should preferably be idempotent.

Running the same batch twice should not corrupt data.

This improves recovery after interruption.

---

## Backfill Progress

Long-running backfills should provide progress visibility.

Potential signals include:

```text
rows processed
rows remaining
last processed identifier
batch duration
error count
```

Exact telemetry depends on tooling.

---

## Expand–Migrate–Contract

Breaking schema changes should often follow:

```text
expand
    ↓
migrate
    ↓
contract
```

when old and new application versions may coexist.

---

## Expand Phase

The expand phase introduces new schema while preserving compatibility with existing application code.

Examples:

```text
add new nullable column
add new table
add new index
add new API-compatible structure
```

Old application versions must continue functioning.

---

## Migrate Phase

The migrate phase moves application behavior or data toward the new model.

Examples:

```text
start writing both representations
backfill old records
switch reads to new field
deploy compatible code
```

This phase may span multiple releases.

---

## Contract Phase

The contract phase removes obsolete compatibility structures after all consumers have migrated.

Examples:

```text
drop old column
remove legacy table
remove compatibility trigger
make new field required
```

Contract operations must not occur while old application versions still depend on the legacy schema.

---

## Rolling Deployments

If deployment allows old and new application instances to coexist, migrations must remain compatible during that period.

Avoid:

```text
migration drops column
    ↓
old instance still reads column
```

This creates deployment-time failures.

---

## Application Before Migration

Some changes require database migration before new code is deployed.

Example:

```text
add optional column
    ↓
deploy code that uses it
```

The new application must not start before required schema exists.

---

## Application Before Contract

Other changes require application rollout before destructive schema cleanup.

Example:

```text
deploy code that no longer reads old column
    ↓
verify old code gone
    ↓
drop old column
```

Migration order must reflect compatibility.

---

## Migration and Deployment Are One System

Schema deployment and application deployment must be designed together.

Do not review migrations only as static SQL.

Ask:

```text
Which application versions may run before this?

Which versions may run after this?

Can both coexist?

What happens during rollback?
```

---

## Deployment Compatibility Matrix

For significant schema changes, it may be useful to reason about:

```text
old app + old schema
old app + expanded schema
new app + expanded schema
new app + contracted schema
```

Invalid combinations should be identified before release.

---

## Backward-Compatible Schema Changes

Generally safer changes include:

```text
add nullable column
add table
add compatible index
add optional relation
```

Operational safety still depends on database behavior.

For example, some `ALTER TABLE` operations may lock large tables.

---

## Breaking Schema Changes

Potentially breaking changes include:

```text
drop column
rename column
rename table
change type incompatibly
make nullable column required
remove enum value
change constraint semantics
```

These require compatibility analysis.

---

## Renaming Columns

Direct renaming may break old application versions.

A compatibility sequence may instead use:

```text
add new column
    ↓
write new column
    ↓
backfill
    ↓
switch reads
    ↓
remove old column later
```

This is more verbose but may be operationally safer.

---

## Renaming Tables

Table renames have similar compatibility implications.

Views, aliases, or dual structures may sometimes assist migration.

The exact strategy depends on database capabilities.

---

## Type Changes

Changing column types may involve:

```text
data conversion
table rewrite
locking
precision loss
application compatibility
```

A type change should never be assumed trivial merely because the migration syntax is short.

---

## Narrowing Types

Type narrowing can destroy or reject existing data.

Examples include:

```text
VARCHAR(255) → VARCHAR(50)
BIGINT → INTEGER
nullable → NOT NULL
```

Existing data must be validated before enforcement.

---

## NOT NULL Migration

A safe sequence may be:

```text
add nullable field
    ↓
deploy writers
    ↓
backfill existing rows
    ↓
verify no null remains
    ↓
add NOT NULL
```

when introducing a required field into an existing populated table.

---

## Defaults

Adding a default can affect:

```text
existing rows
future writes
application assumptions
database performance
```

A database default and an application default may have different semantics.

Both should be intentional.

---

## Default Removal

Defaults introduced for migration compatibility may be temporary.

If the long-term model expects explicit application input, remove transitional defaults after migration.

---

## Adding Constraints

Adding a constraint to existing data requires verifying that current rows satisfy it.

Potential process:

```text
inspect
    ↓
repair/backfill
    ↓
validate
    ↓
enforce
```

Some databases support phased constraint validation.

Use such capabilities when beneficial.

---

## Unique Constraints

Adding uniqueness to populated data requires checking duplicates first.

A migration should not discover production duplicates unexpectedly during deployment when earlier validation is practical.

---

## Foreign Keys

Adding foreign keys to existing data requires ensuring all referenced values are valid.

Invalid historical rows may require cleanup before enforcement.

---

## Index Creation

Index creation can be expensive or locking depending on database technology.

Production-safe index strategies may differ from local development.

Use non-blocking or concurrent mechanisms when the selected database supports them and the workload requires it.

---

## Index Removal

Removing an index may affect:

```text
query performance
constraint enforcement
```

Verify whether the index is only an optimization or also enforces semantics.

---

## Destructive Changes

Destructive changes require explicit review.

Examples include:

```text
DROP TABLE
DROP COLUMN
DELETE all data
TRUNCATE
irreversible transformation
```

A destructive migration should answer:

```text
Why is the data no longer required?

Has every consumer migrated?

Is backup/recovery needed?

Is the operation compatible with rollback?
```

---

## Data Destruction Must Be Intentional

The fact that application code no longer references a field does not prove the data is safe to delete.

Data may still be required for:

```text
audit
legal retention
reporting
support
future migration
```

Ownership and retention policy must be checked.

---

## Irreversible Migrations

Some migrations cannot be meaningfully reversed.

Examples:

```text
drop data
merge distinct states
destructive normalization
one-way encryption or anonymization
```

They may still be valid migrations.

Irreversibility must be explicit.

---

## Down Migrations

Orion does not assume that every migration must have a safe automatic `down` operation.

A syntactically reversible schema operation may not restore lost data.

For example:

```text
DROP COLUMN
```

cannot be reversed merely by recreating an empty column.

---

## Rollback Strategy

Rollback should distinguish:

```text
application rollback
database rollback
data restoration
forward corrective migration
```

These are different operations.

---

## Application Rollback

An application rollback returns code to a previous release.

It is only safe if the current database schema remains compatible with that version.

Migration planning must account for this.

---

## Database Rollback

Database rollback changes schema backward.

It may be dangerous after new writes have occurred.

Automatic rollback should not be assumed safe.

---

## Data Restoration

If a migration destroys or corrupts data, recovery may require:

```text
backup restore
point-in-time recovery
special repair script
```

rather than an ordinary down migration.

---

## Forward Recovery

In many production incidents, the preferred response is:

```text
new corrective migration
```

rather than reverting the database.

This preserves forward history and may reduce risk.

---

## Migration Transactions

Whether a migration runs inside a transaction depends on:

```text
database support
operation type
migration tool
operational risk
```

Do not assume transactional DDL behavior is universal.

---

## Large Migration Transactions

Large migrations inside one transaction may:

```text
hold locks
create large rollback state
increase replication lag
block application work
```

Operational safety may require smaller steps.

---

## Non-Transactional Operations

Some database operations cannot run inside a transaction.

The migration system must make such behavior explicit.

Failure recovery requires additional care.

---

## Migration Locks

Migration tooling should prevent multiple incompatible migration processes from modifying the same database concurrently where practical.

Concurrent migration execution can corrupt migration state.

---

## Migration Ordering

Migration order must be deterministic.

Two contributors creating migrations concurrently may need ordering reconciliation before merge.

The selected tooling should define canonical ordering.

---

## Parallel Development

Parallel feature development may create conflicting unreleased migrations.

Before release, these may be reordered, regenerated, or consolidated when safe.

Do not preserve accidental merge ordering purely because files were created independently.

---

## Branch Migrations

Feature branches may contain temporary migration histories.

Merging branches may require reconciling schema intent.

The final shared history should represent valid forward evolution.

---

## Merge Conflicts

Migration merge conflicts require semantic review.

Do not resolve them solely by choosing both files or accepting timestamp order.

Ask:

```text
Do these changes conflict?

Do they touch the same schema objects?

Does one depend on the other?

Should unreleased migrations be regenerated?
```

---

## Schema Diff Tools

Schema-diff tooling may help generate migrations.

Generated output is a proposal, not architectural intent.

A contributor must review:

```text
data loss
constraint meaning
locking
ordering
compatibility
```

before accepting generated migrations.

---

## ORM-Generated Migrations

If an ORM generates migrations, its output must still follow Orion's migration policy.

The tool does not own migration history.

Orion does.

Generated migrations may be:

```text
edited
combined
recreated
rejected
```

while unreleased if the final result is safer or clearer.

---

## Tool State vs Database Truth

Some migration systems maintain internal metadata tables.

These help track executed migrations.

They do not replace understanding of the actual database schema.

Schema drift must still be detectable.

---

## Baselines

Existing databases may sometimes need a migration baseline.

A baseline declares:

```text
this existing schema corresponds to migration state X
```

without replaying all historical creation steps.

Baselining is a significant operation and should be documented.

---

## Initial Migration

For a new project, the initial migration may create the first released schema.

Before the first release, it may be regenerated freely.

After release, it becomes immutable like every other released migration.

---

## Squashing Historical Released Migrations

Released migrations should not normally be squashed in place.

If migration replay eventually becomes operationally expensive, a new baseline strategy may be introduced.

That would require explicit tooling and release policy.

It must not silently rewrite the history used by existing installations.

---

## Migration Retention

Released migration files should remain available as long as supported database states depend on them.

Removing old migrations may make:

```text
new environment creation
upgrade from supported version
historical investigation
```

impossible.

Retention policy must align with support policy.

---

## Database Creation

A new database should be reproducible from repository-controlled sources.

Possible strategies include:

```text
replay migrations
apply baseline + later migrations
apply canonical schema + migration history
```

The selected method must remain deterministic.

---

## Fresh Database Test

CI should eventually verify that a fresh database can reach the current schema.

This detects:

```text
broken migration ordering
missing dependency
invalid SQL
schema-generation drift
```

---

## Upgrade Path Test

Fresh-database testing is not sufficient.

Production upgrades occur from previous released states.

Important release paths should be tested.

Conceptually:

```text
previous released schema
        ↓
current migrations
        ↓
current schema
```

---

## Supported Upgrade Window

As Orion matures, it may define how far back direct database upgrades are supported.

For example:

```text
previous release only
last N releases
all historical releases
```

This decision should follow deployment and support requirements.

---

## Migration Test Fixtures

Migration tests may preserve released schema snapshots or baselines.

These fixtures must represent real supported states.

They should not be updated merely to make failing migration tests pass.

---

## Schema Equivalence

After migration, the resulting database should match the intended canonical schema.

CI may eventually compare:

```text
migrated schema
```

against:

```text
canonical schema definition
```

to detect drift.

---

## Migration Data Tests

Data migrations should test semantic outcomes.

Example:

```text
legacy status = "done"
    ↓
new state = "completed"
```

not only that the migration executes without error.

---

## Migration Idempotency

Ordinary schema migrations are not necessarily idempotent.

Migration tools typically guarantee execution once.

Operational scripts and long-running backfills may require idempotency.

Do not apply one rule to every migration mechanism.

---

## Migration Failure

A migration failure should leave a diagnosable state.

The operator should be able to determine:

```text
which migration failed
which operation failed
whether transaction rolled back
whether partial changes remain
```

---

## Partial Migration Failure

Non-transactional migrations may partially apply before failure.

Recovery procedures must be understood before rerunning.

Blind retry may fail or cause further damage.

---

## Failed Migration State

The migration tool's internal state may need repair after partial failure.

Such repair should be controlled and documented.

Do not manually mark failed migrations as successful merely to continue deployment.

---

## Migration Observability

Production migrations should emit safe operational telemetry.

Potential information includes:

```text
migration identifier
application/release
environment
start time
finish time
duration
result
```

Long-running data operations may emit additional progress metrics.

---

## Migration Logs

Migration logs must follow:

- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

They must not dump:

```text
credentials
sensitive row data
secret configuration
```

---

## Migration Duration

Migration duration should be observable.

Unexpected increases may indicate:

```text
table growth
locking
inefficient backfill
unexpected execution plan
```

---

## Lock Monitoring

High-risk migrations may require observation of:

```text
database locks
blocked queries
replication lag
application latency
```

The exact procedures depend on database platform.

---

## Migration Alerting

Important migration failures should become operationally visible.

A deployment must not silently proceed after a required schema migration failed.

---

## Readiness

An application that requires schema version N should not become ready against an incompatible schema.

The exact compatibility check depends on architecture.

---

## Schema Version Checks

A formal numeric schema version is not required by default.

Migration state may already provide sufficient compatibility information.

Explicit versioning should be introduced only when useful.

---

## Application Compatibility Checks

Applications may eventually validate required migration state during startup or deployment.

Such checks must not leak database credentials or internal details through public endpoints.

---

## Migrations in CI

CI should eventually validate:

```text
migration syntax
fresh database migration
supported upgrade path
canonical schema equivalence
generated artifacts
architecture policy
```

according to repository maturity.

---

## Migration Linting

Static migration checks may detect risky operations such as:

```text
DROP COLUMN
ADD NOT NULL without safe path
large table rewrite
blocking index creation
```

Tooling may warn or fail according to risk.

The selected database platform determines what can be detected accurately.

---

## Risk Classification

Significant migrations may be classified conceptually as:

```text
low risk
medium risk
high risk
```

based on factors such as:

```text
data destruction
table size
locking
backfill volume
compatibility
irreversibility
```

A formal system should be introduced only if useful.

---

## High-Risk Migration Review

Additional review is appropriate for:

```text
large backfills
destructive operations
type conversions
unique constraints on large tables
long locks
cross-domain transformations
security-sensitive data changes
```

---

## Migration Approval

The repository should not require unnecessary manual bureaucracy for ordinary low-risk migrations.

Review should be proportional to risk.

Automation should handle routine safety checks where possible.

---

## Manual Production Migrations

Schema changes should not normally be typed manually into production.

Production changes should derive from repository-controlled migrations.

This provides:

```text
review
history
reproducibility
testing
```

---

## Emergency Schema Changes

An emergency may sometimes require direct production intervention.

If this occurs:

```text
contain incident
    ↓
record exact change
    ↓
reconcile repository migration history
    ↓
verify future migrations
```

The production schema and repository history must not remain divergent.

---

## Schema Drift

Schema drift occurs when actual database structure differs from repository-controlled migration state.

Drift is a defect.

Potential causes include:

```text
manual changes
failed migrations
tool bugs
environment inconsistency
```

---

## Drift Detection

Orion should eventually detect drift automatically where practical.

Potential approaches include:

```text
schema introspection
migration checksum validation
canonical schema comparison
```

---

## Drift Resolution

Do not automatically overwrite unexpected production drift.

First determine:

```text
what changed
why
whether data depends on it
whether it represents emergency intervention
```

Then reconcile safely.

---

## Data Fixes vs Migrations

Not every production data correction belongs in permanent schema migration history.

A one-time operational data fix may be better represented as:

```text
controlled script
audited operation
runbook step
```

when it does not define schema evolution.

The distinction should be explicit.

---

## Reusable Data Transformation

If a data transformation is required for every database upgrading through a release boundary, it belongs in the release migration path.

If it is a one-off repair for one corrupted environment, it may not.

---

## Reference Data Migrations

Changes to canonical reference data may require migrations when database rows are the source of truth.

Examples include:

```text
add required system role
rename canonical status
populate required lookup row
```

The ownership of reference data must be explicit.

---

## Seed Data Is Not Migration History

Development seed scripts must not be relied upon to upgrade released production data.

Migration logic should contain or invoke the required transformation for released state.

---

## Migration and Feature Flags

Feature flags may help separate:

```text
schema deployment
application activation
```

during complex migrations.

They are not required for ordinary schema evolution.

Temporary migration flags should have removal criteria.

---

## Dual Writes

Expand–migrate–contract may temporarily require writing both old and new representations.

Dual writes create consistency risk.

If used, define:

```text
canonical source during transition
failure behavior
reconciliation
removal condition
```

---

## Dual Reads

Applications may temporarily support reading old and new representations.

This can assist gradual migration.

Fallback behavior must not hide incomplete migration indefinitely.

---

## Compatibility Code

Temporary migration compatibility code should be clearly identifiable.

Examples:

```text
read new column, fallback to old
write both fields
```

Such code should have explicit removal conditions.

---

## Migration Debt

Temporary compatibility structures that remain indefinitely become migration debt.

Examples include:

```text
legacy column
dual-write path
compatibility trigger
fallback read
```

They should be removed after migration completion.

---

## Migration Completion

A complex migration is complete only when:

```text
new schema deployed
data migrated
new code active
old consumers removed
verification passed
legacy schema removed if intended
temporary compatibility removed
```

The migration lifecycle may span multiple releases.

---

## Verification

After migration, verify the intended result.

Potential checks include:

```text
row counts
null counts
constraint validation
sample semantic checks
application health
error rate
```

Verification should be proportional to risk.

---

## Data Validation Queries

High-risk migrations may define pre- and post-migration validation queries.

These queries should be safe and reviewable.

They must follow data-classification policy.

---

## Migration Runbooks

Particularly risky production migrations may require runbooks describing:

```text
preconditions
execution
monitoring
abort conditions
verification
recovery
```

Runbooks belong under:

```text
docs/runbooks/
```

---

## Abort Conditions

A high-risk migration should define when execution should stop.

Examples:

```text
unexpected lock duration
error rate spike
replication lag threshold
validation mismatch
```

Exact thresholds should follow operational evidence.

---

## Rollout Strategy

Some migrations may require staged rollout.

Conceptually:

```text
staging
    ↓
production subset
    ↓
full production
```

This depends on deployment architecture and database topology.

---

## Multiple Databases

If multiple database instances exist, migration coordination must define:

```text
ordering
failure behavior
partial rollout
compatibility
```

Do not assume all databases update atomically.

---

## Tenant-Specific Databases

If each tenant eventually has a database, migration systems must track migration state per tenant.

Partial migration creates version skew.

Operational tooling must make skew visible.

---

## Sharded Databases

Sharding introduces additional migration complexity.

Schema changes may need controlled rollout across shards.

Orion should not design for sharding before such requirements exist.

---

## Customer-Managed Databases

If Orion software is ever distributed to customer-managed environments, migration compatibility becomes a public product contract.

Migration history and upgrade support would require stricter policies.

This is not assumed today.

---

## Migration Security

Migration processes often require elevated privileges.

They must follow:

- [docs/security/secrets-management.md](../security/secrets-management.md)
- [docs/security/production-access.md](../security/production-access.md)

Migration credentials should not be exposed to ordinary runtime code.

---

## Migration Credential Scope

Prefer migration credentials that grant only the privileges required for schema evolution.

Avoid using unrestricted database superuser credentials when a narrower role is sufficient.

---

## Migration Audit

Production migration execution should be attributable where practical.

Useful information may include:

```text
release
migration
automation identity
deployment
timestamp
result
```

---

## Sensitive Data in Migration Code

Migration files must not contain real production sensitive values.

Examples:

```text
real email addresses
credentials
tokens
private customer records
```

Data transformations should operate generically.

---

## Generated Migration Files

Generated migration files may be committed if they represent repository-controlled migration history.

Once released, generated status does not make them editable.

Released generated migrations are immutable.

---

## Handwritten Migrations

Handwritten migrations follow exactly the same release policy.

Manual authorship does not grant special status.

---

## Migration Documentation

Complex migrations should explain non-obvious intent.

Useful documentation may include:

```text
why multiple stages are required
why operation is irreversible
why a temporary column exists
deployment ordering requirements
```

This explanation may live in:

```text
migration comments
ADR
runbook
release documentation
```

depending on scope.

---

## Comments in Migration Files

Comments are useful when they explain:

```text
operational constraint
data assumption
non-obvious transformation
compatibility requirement
```

Avoid comments that merely restate SQL.

---

## ADRs for Major Migrations

A migration may deserve an ADR when it changes major architectural behavior.

Examples:

```text
split one database into several
introduce row-level security
change identifier strategy
replace primary persistence model
```

Ordinary schema evolution does not require an ADR.

---

## Migration Review Questions

Every migration review should consider:

1. Is the migration released or unreleased?
2. What schema state does it transition from?
3. What schema state does it create?
4. Is data transformed?
5. Is data destroyed?
6. Can old and new application versions coexist?
7. Does the migration lock or rewrite large structures?
8. Is a backfill required?
9. Is the change reversible?
10. What does application rollback mean afterward?
11. What happens if execution fails halfway?
12. How will the result be verified?

---

## Before Creating a Migration

Before generating a migration, determine:

```text
Is the schema design sufficiently settled?

Does an unreleased migration already represent this feature?

Can the existing unreleased migration be refined instead?

Has any related migration been released?
```

Do not automatically create another migration for every local schema edit.

---

## Migration Refinement Workflow

For unreleased work:

```text
change schema
    ↓
inspect existing unreleased migrations
    ↓
decide whether to edit/regenerate/append
    ↓
validate fresh database
    ↓
validate intended final history
```

The correct result should optimize released history, not preserve every local edit.

---

## Migration Append Workflow

A new migration is appropriate when:

```text
previous relevant migration is already released
```

or:

```text
a separate migration stage is required for safety
```

or:

```text
the intermediate state is itself meaningful
```

---

## AI Agent Requirements

AI agents must not treat migration generation as a mechanical schema-diff task.

Before modifying migrations, an agent must determine:

```text
current schema
target schema
migration ownership
released/unreleased status
data impact
deployment compatibility
```

---

## AI Must Verify Release Status

An AI agent must not edit an existing migration unless it can establish that the migration is unreleased.

If uncertain:

```text
treat migration as released
```

and create a new forward migration if a change is required.

---

## AI and Migration Noise

An AI agent should avoid sequences such as:

```text
create column
    ↓
rename column
    ↓
drop column
```

within unreleased history when the final released schema never required the intermediate states.

It should refine unreleased history when safe.

---

## AI and Safety

An AI agent must not squash migrations merely for cleanliness when the separate steps are required for:

```text
backfill
compatibility
zero-downtime deployment
locking safety
```

Safety takes precedence over aesthetic migration history.

---

## AI and Destructive Changes

Before introducing:

```text
DROP
DELETE
TRUNCATE
```

an AI agent should identify:

```text
owner
data retention
consumer usage
release compatibility
recovery path
```

Lack of code references is insufficient evidence that deletion is safe.

---

## AI and Migration Tests

An AI-generated migration should include or update relevant tests.

Depending on change, this may include:

```text
fresh database test
upgrade-path test
data migration test
constraint test
compatibility test
```

---

## AI and Generated Tool Output

AI agents must review ORM- or tool-generated migration output before accepting it.

Generated code is not trusted intent.

---

## Mechanical Enforcement

Future tooling may enforce rules such as:

```text
released migration checksums immutable

fresh migration path succeeds

supported upgrade path succeeds

migration history matches database state

destructive operations require explicit acknowledgement

generated migration metadata is current
```

The exact enforcement depends on selected database tooling.

---

## Released Migration Registry

If the selected migration tool does not clearly distinguish release status, Orion may eventually maintain machine-readable release metadata.

Possible model:

```text
migration
release
first durable environment
checksum
```

This should be introduced only if tooling does not already provide a reliable source.

---

## Git Tags and Releases

Repository releases may eventually provide the canonical boundary for migration release status.

For example:

```text
migration included in release tag
    ↓
considered immutable
```

However, this is valid only if deployment workflow guarantees migration state aligns with releases.

The exact policy will be selected later.

---

## Migration Changelog

Migration history is not a user-facing changelog.

A migration such as:

```text
add index
```

may have no product-facing release-note significance.

Likewise, a product feature may require multiple migrations.

Do not conflate the two histories.

---

## Migration and ADR History

Migrations describe state transitions.

ADRs explain significant architectural decisions.

A migration should not contain the entire rationale for a major architectural change if an ADR is more appropriate.

---

## Migration and Current Documentation

Migration history explains how the schema evolved.

Current database documentation explains what the schema means now.

Do not require contributors to reconstruct current database semantics solely from migration history.

---

## History Separation

Orion deliberately separates:

```text
Git
    → development history

migrations
    → released database transition history

ADRs
    → architectural decision history

changelog
    → externally visible release history

current documentation
    → current system truth
```

Each history has a different responsibility.

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Editing Released Migrations

Prohibited.

---

### Deleting Released Migrations

Prohibited.

---

### Migration Per Development Edit

Avoid.

---

### Keeping Abandoned Unreleased Experiments

Avoid.

---

### Squashing Required Safety Stages

Prohibited.

---

### Assuming One Migration Is Always Better

Avoid.

---

### Automatic Down Migration as Recovery Strategy

Avoid.

---

### Large Unbounded Backfill in One Transaction

Avoid.

---

### Dropping Data Without Ownership Review

Prohibited.

---

### Schema Diff Without Intent Review

Avoid.

---

### Migration Tool Defines Architecture

Avoid.

---

### Manual Production Schema Changes

Prohibited as normal workflow.

---

### Production Drift Ignored

Prohibited.

---

### App Deployment Without Schema Compatibility Analysis

Avoid.

---

### Backfill Without Progress or Recovery Strategy

Avoid for large operations.

---

### Runtime App Uses Migration Admin Credential

Avoid.

---

### Migration Contains Real Sensitive Data

Prohibited.

---

## Initial Migration Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Released migration history is immutable.
2. Unreleased migration history may be refined.
3. Git preserves development history; migrations preserve released database transitions.
4. If migration release status is uncertain, treat it as immutable until verified.
5. Released migration corrections require new migrations.
6. Unreleased migrations may be rewritten, squashed, regenerated, or removed when safe.
7. The goal is the minimum number of meaningful and safe migrations, not the minimum number of files at any cost.
8. Separate migration stages must be preserved when required for compatibility, backfills, locking safety, or zero-downtime deployment.
9. Application and schema deployment compatibility must be considered together.
10. Destructive changes require explicit data-loss review.
11. Large backfills require explicit execution, progress, and recovery strategy.
12. Database rollback must not be assumed equivalent to application rollback.
13. Forward corrective migration is generally preferred for released history.
14. Fresh-database migration and released upgrade paths should eventually be tested.
15. Production schema drift is a defect.
16. Manual production schema changes are not a normal workflow.
17. Migration execution must be observable.
18. Migration credentials should be isolated from ordinary runtime credentials.
19. AI agents must determine release status before editing migration history.
20. Migration policy should become mechanically enforceable where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
migration naming format
migration checksum mechanism
release-state detection
baseline strategy
migration locking
transaction behavior
deployment integration
large-backfill tooling
schema drift tooling
migration CI checks
```

These decisions should follow the selected database engine, ORM or query tooling, deployment architecture, and release model.

Significant choices should be documented through ADRs.

---

## Future Documentation

This document should be complemented by:

- [docs/database/schema-documentation.md](schema-documentation.md)
- [docs/database/transactions-and-concurrency.md](transactions-and-concurrency.md)
- [docs/architecture/versioning-and-compatibility.md](../architecture/versioning-and-compatibility.md)
- [docs/security/production-access.md](../security/production-access.md)
- [docs/security/data-retention.md](../security/data-retention.md)
- [docs/reliability/health-checks.md](../reliability/health-checks.md)

Implementation-specific migration documentation should reference this policy rather than redefine migration history rules independently.

---

## Summary

Migration history exists to move durable databases safely between meaningful released states.

The central distinction is:

```text
unreleased migration
    → may be refined

released migration
    → immutable
```

Orion deliberately separates:

```text
development history
    → Git

released database transition history
    → migrations
```

This means an unreleased sequence such as:

```text
create table
    ↓
alter table
    ↓
drop table
```

does not need to survive forever if the table never existed in a released database.

At the same time:

```text
clean history
```

must never be prioritized over:

```text
safe deployment
data integrity
compatibility
recoverability
```

The correct migration history is not the shortest history.

It is the clearest safe path between database states that actually matter.


## Schema Evolution

Database schemas evolve through migrations.

The canonical migration policy is:

```text
production history is immutable
development history is disposable
```

More precisely:

```text
released migration history is immutable
unreleased migration history may be refined
```

Detailed policy belongs in:

- [docs/database/migrations.md](migrations.md)

---

## Released State

A migration becomes immutable once it participates in a permanent released database history according to the repository's release policy.

After that point, correcting the schema requires a new migration.

---

## Unreleased State

Before a migration becomes part of released history, it may be:

```text
rewritten
combined
regenerated
removed
```

when doing so results in cleaner meaningful history.

Git preserves development history.

Database migrations preserve released schema transitions.

---

## Migration Count

The goal is not the smallest possible number of migrations.

The goal is the smallest number of meaningful and safe migrations.

Multiple migrations may be required for:

```text
backfill
expand-migrate-contract
large transformations
backward-compatible deployment
zero-downtime changes
```

---

## Schema Change Safety

Schema changes should consider:

```text
data loss
locking
table rewrite
deployment compatibility
rollback
backfill duration
application version coexistence
```

A syntactically valid migration may still be operationally unsafe.

---

## Destructive Changes

Changes such as:

```text
DROP TABLE
DROP COLUMN
truncate
type narrowing
```

require explicit review of data-loss implications.

Do not assume unused application code means stored data is disposable.

---

## Renames

Column or table renames may be operationally breaking.

Depending on deployment topology, an expand-and-contract sequence may be safer than direct rename.

---

## Backfills

Data backfills should be treated as data migrations.

Large backfills may require:

```text
batching
progress tracking
retry
observability
```

They should not automatically run inside one long transaction.

---

## Schema and Application Compatibility

During rolling deployments, old and new application versions may coexist.

Schema evolution should account for this when deployment architecture requires it.

The database is often a shared compatibility boundary between versions.

---

## Migration Rollback

Not every database migration is safely reversible.

Rollback strategy should distinguish:

```text
application rollback
schema rollback
data restoration
forward fix
```

Blind automatic down migrations can be dangerous after data has changed.

---

## Forward Recovery

For released migrations, fixing forward is often safer than attempting destructive rollback.

The correct strategy depends on migration type and incident severity.

---
