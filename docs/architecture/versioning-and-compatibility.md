# Versioning and Compatibility

## Purpose

This document defines the versioning and compatibility principles used by Orion.

Its goals are to ensure that system evolution is:

- intentional;
- safe across deployment boundaries;
- explicit about compatibility commitments;
- resistant to unnecessary version proliferation;
- understandable across applications and packages;
- safe for persisted data;
- suitable for independently deployed consumers;
- testable;
- observable;
- understandable by humans and AI agents.

Compatibility is broader than API versioning.

It applies wherever two independently evolving artifacts, components, processes, or persisted states must continue working together.

This document is technology-agnostic.

Specific package-versioning schemes, release tooling, compatibility-checking systems, artifact registries, and deployment mechanisms will be selected later through explicit architectural decisions.

This document complements:

- `docs/architecture/application-boundaries.md`;
- `docs/architecture/dependency-rules.md`;
- `docs/architecture/configuration.md`;
- `docs/api/versioning.md`;
- `docs/database/migrations.md`;
- `docs/architecture/testing-strategy.md`.

---

## Core Principle

Versioning should represent real compatibility boundaries.

Do not introduce a version merely because something changed.

The desired model is:

```text
change
    ↓
does another independently evolving consumer depend on this behavior?
    ↓
no
    → change implementation normally
    ↓
yes
    → can compatibility be preserved?
            ↓
        yes
            → evolve compatibly
            ↓
        no
            → introduce explicit compatibility boundary
```

Compatibility should be preserved where its value exceeds its complexity.

---

# Compatibility Is About Consumers

A change becomes compatibility-sensitive when another consumer depends on the current behavior.

Potential consumers include:

```text
application
package
database
mobile client
desktop client
external integration
worker
service
deployment process
stored data
generated SDK
automation
```

The existence of a code boundary alone does not automatically require long-term compatibility.

---

# Independent Evolution

Compatibility matters most when components can evolve independently.

Examples include:

```text
backend deployed before mobile client

database migration applied before application rollout

event producer updated before consumer

shared package released before downstream application

configuration changed independently of application code
```

When both sides always change atomically, compatibility requirements may be much smaller.

---

# Compatibility Boundary

A compatibility boundary exists when one side may continue operating while another side changes.

Examples include:

```text
API ↔ mobile client

application ↔ database schema

event producer ↔ event consumer

package ↔ package consumer

application version N ↔ configuration

SDK ↔ server API
```

Each boundary should have explicit compatibility expectations.

---

# Internal Does Not Mean Compatible Forever

Internal code does not automatically require backward compatibility.

If:

```text
package A
package B
```

are always changed and released together in the same monorepo, maintaining old interfaces indefinitely may provide little value.

Compatibility should reflect actual deployment independence.

---

# Monorepo Compatibility

A monorepo reduces some compatibility requirements because many dependencies can evolve atomically.

For example:

```text
package API changes
    +
all internal consumers updated in same change
```

may not require a versioned compatibility layer.

Do not preserve obsolete internal APIs solely because they existed historically.

---

# Monorepo Does Not Eliminate Compatibility

Some monorepo artifacts still evolve independently at runtime.

Examples include:

```text
mobile application already installed

desktop application not yet updated

database schema already deployed

event message already queued

background job created by previous release
```

Runtime history creates compatibility boundaries even inside one repository.

---

# Released vs Unreleased Behavior

Orion distinguishes between:

```text
unreleased behavior
```

and:

```text
released behavior
```

Compatibility requirements are strongest after consumers can depend on behavior.

---

# Unreleased Changes

Before release, contracts and internal structures may be refined freely when no durable consumer depends on them.

Examples:

```text
rename unreleased API field

rewrite unreleased migration

replace unreleased event schema

change unpublished package interface
```

Git already preserves the development history.

---

# Released Changes

Once behavior is part of a released compatibility boundary, future evolution must consider dependent consumers.

Released does not necessarily mean publicly released.

It may mean:

```text
deployed
persisted
published
installed
queued
consumed independently
```

---

# Compatibility Is Not Immutability

A released contract may still evolve.

For example:

```text
API
event
configuration schema
package interface
```

may accept additive compatible changes.

The requirement is to preserve supported consumer behavior, not freeze all evolution.

---

# Development History vs Compatibility History

Orion separates:

```text
Git
    → development history

migrations
    → released database transition history

API versions
    → consumer compatibility boundaries

package versions
    → distributable artifact compatibility

ADRs
    → architectural decision history
```

Do not overload one mechanism to represent all forms of history.

---

# Types of Compatibility

Compatibility may involve several directions.

---

# Backward Compatibility

A newer provider remains compatible with an older consumer.

Example:

```text
new backend
    ↔
old mobile client
```

This is one of the most common requirements.

---

# Forward Compatibility

An older consumer tolerates a newer provider representation.

Example:

```text
old client ignores unknown additive response field
```

Forward-compatible consumers reduce migration pressure.

---

# Bidirectional Compatibility

During rolling deployment, both combinations may need to work:

```text
old consumer + new provider

new consumer + old provider
```

This is common when components deploy independently.

---

# Data Compatibility

Persisted data often outlives the application version that created it.

A new application must understand data created by old versions when the support model requires it.

Likewise, old application instances may temporarily encounter data written by a newer version during rolling deployment.

---

# Wire Compatibility

Wire compatibility concerns serialized communication.

Examples:

```text
HTTP JSON
event payload
RPC message
queue job payload
webhook
```

A structurally valid serialized message may still be semantically incompatible.

---

# Binary Compatibility

If Orion later publishes compiled libraries or native artifacts, binary compatibility may become relevant.

This is not currently assumed.

---

# Source Compatibility

Source compatibility matters when downstream code recompiles against an interface.

Examples:

```text
published SDK
shared library
package API
```

A change may preserve runtime behavior while breaking compilation.

---

# Semantic Compatibility

The most important compatibility is semantic.

A field may remain:

```text
string
```

while changing meaning completely.

This is still breaking.

Compatibility review must consider behavior, not only types.

---

# Operational Compatibility

A technically valid change may still be operationally incompatible.

Examples:

```text
query now requires much more database capacity

new version requires configuration not deployed yet

new worker cannot process jobs created by previous release

old instance cannot run against migrated schema
```

Operational compatibility is part of system design.

---

# Security Compatibility

Security may override ordinary compatibility.

Examples:

```text
unsafe credential format must be rejected

vulnerable endpoint must be disabled

authorization must be tightened
```

Do not preserve insecure behavior solely to avoid breaking a consumer.

The breaking impact should still be identified and managed.

---

# Application Compatibility

Applications may depend on:

```text
database schema
configuration
shared packages
internal services
event contracts
external providers
```

A deployment must consider the compatibility of all required dependencies.

---

# Rolling Deployments

Rolling deployment means old and new application versions may run simultaneously.

This creates a temporary compatibility window.

The system should reason about combinations such as:

```text
old app + old schema
old app + expanded schema
new app + expanded schema
```

before contract cleanup.

---

# Deployment Order

Some changes require:

```text
infrastructure first
application second
```

while others require:

```text
application first
cleanup second
```

The ordering should be explicit.

---

# Expand–Migrate–Contract

Orion uses the general pattern:

```text
expand
    ↓
migrate
    ↓
contract
```

for changes that cannot safely occur atomically.

This pattern applies beyond databases.

---

# Expand

Introduce compatible capability.

Examples:

```text
add new API field
add new database column
accept new event schema
support new configuration key
```

Existing consumers should continue functioning.

---

# Migrate

Move producers and consumers to the new behavior.

Examples:

```text
deploy new writers
migrate clients
backfill data
move consumers to new event
```

---

# Contract

Remove the obsolete compatibility path only after dependent consumers have migrated.

Examples:

```text
remove old field
drop old column
stop accepting old event
remove deprecated configuration key
```

---

# Compatibility Code Is Temporary

Code introduced only for transition should have a removal condition.

Examples:

```text
read old field as fallback

write both fields

accept old + new payload

support old configuration name
```

Without removal discipline, compatibility becomes permanent complexity.

---

# Package Compatibility

Shared packages inside the monorepo should normally evolve atomically with internal consumers.

Do not introduce semantic versioning between every internal package by default.

---

# Published Packages

If a package is distributed outside the monorepo or consumed independently, package compatibility becomes significant.

Versioning may then follow ecosystem conventions such as semantic versioning.

The exact strategy will be selected only when such distribution exists.

---

# Package Public Surface

A package should have an intentional public API.

Internal implementation modules should not become accidental compatibility commitments.

Use explicit exports and avoid deep imports where practical.

---

# Deep Imports

A consumer importing:

```text
package/internal/private-helper
```

creates coupling to implementation.

Repository architecture should prevent or discourage such dependencies.

Compatibility promises apply primarily to approved public surfaces.

---

# Package Breaking Change

Examples may include:

```text
remove exported function
change function signature
change returned semantics
change error behavior
remove supported option
```

If all consumers update atomically, the change may remain ordinary monorepo evolution.

If the package is independently distributed, versioning may be required.

---

# SDK Compatibility

Generated SDKs are independently usable artifacts.

They have at least two compatibility dimensions:

```text
SDK ↔ application using SDK

SDK ↔ server API
```

These must not be conflated.

---

# SDK Package Version

A breaking SDK programming-interface change may require a package major version.

This does not necessarily imply a server API version change.

---

# API Compatibility

API-specific policy is defined in:

```text
docs/api/versioning.md
```

The core rule remains:

```text
prefer compatible evolution before introducing a new API version
```

---

# Database Compatibility

Database compatibility is defined through release-aware migration policy.

Important boundaries include:

```text
old app ↔ new schema
new app ↔ transitional schema
```

Released migration history itself is immutable.

---

# Database Schema Is a Runtime Contract

An application deployment depends on a database schema shape.

Therefore a schema change must consider currently running and rollback application versions.

---

# Database Compatibility Window

During an expand–migrate–contract deployment:

```text
old and new application versions
```

may need to operate against the same schema.

The compatibility window should end only after old versions are no longer expected to run.

---

# Database Rollback Compatibility

If application rollback is supported, the current schema must remain usable by the rollback version.

Destructive contraction should not occur before rollback requirements expire.

---

# Persisted Data Compatibility

Application code should consider persisted representations created by older versions.

Examples include:

```text
enum values
serialized JSON
job payload
cached document
stored event
```

Persisted serialization is a compatibility boundary.

---

# Persisted JSON

JSON stored in a database is not exempt from schema evolution.

If application versions persist structured JSON, they must define how old and new shapes coexist.

---

# Event Compatibility

Events may remain in:

```text
queue
log
dead-letter queue
archive
```

after the producer version that created them has disappeared.

Consumers may therefore need to understand historical event shapes.

---

# Event Contracts

An event contract should define:

```text
event type
schema
semantic meaning
producer
consumers
```

where event-driven architecture exists.

---

# Event Evolution

Prefer additive event evolution when practical.

Potentially compatible changes include:

```text
add optional field
add metadata
```

depending on consumer behavior.

---

# Event Breaking Changes

Potential breaking event changes include:

```text
rename field
remove field
change type
change semantic meaning
change event purpose
```

A new event type or schema version may be required.

---

# Event Versioning

Do not version events automatically.

If existing consumers and queued historical messages can tolerate compatible evolution, a new version may be unnecessary.

---

# New Event Type vs New Version

A semantically different fact should often become a new event type rather than another version of the old meaning.

For example:

```text
OrderCreated
```

should not become:

```text
OrderCreatedV2
```

if the event now represents an entirely different business fact.

Use semantic names.

---

# Event Consumers Must Be Tolerant Where Intended

Consumers may ignore unknown additive fields when the contract allows it.

They must not silently ignore changes that affect required business semantics.

---

# Event Replay

If event replay is supported, current consumers may receive historical messages.

This creates stronger compatibility requirements.

Replay capability must influence event-schema evolution.

---

# Job Payload Compatibility

Queued background jobs are persisted contracts.

A new worker release may receive a job produced by the old release.

Therefore job payload evolution should consider deployment overlap and queue retention.

---

# Job Schema Evolution

Potential strategies include:

```text
compatible additive payload

versioned job payload

worker supports multiple historical shapes
```

The appropriate strategy depends on job lifetime.

---

# Long-Lived Jobs

The longer jobs can remain pending or retrying, the stronger compatibility requirements become.

A job retrying for several days may outlive multiple deployments.

---

# Dead-Letter Queue Compatibility

Dead-lettered messages may be retried after the original code is gone.

Operational recovery must account for historical message schemas.

---

# Configuration Compatibility

Configuration is another contract between:

```text
deployment environment
    ↔
application version
```

Configuration changes must follow:

```text
docs/architecture/configuration.md
```

---

# Required Configuration Changes

Adding a new required configuration key may break deployment of the new application unless the environment is updated first.

A safe sequence may be:

```text
deploy configuration
    ↓
deploy application
```

---

# Removing Configuration

Removing an old configuration key must consider rollback.

An older application may still require it.

Do not remove deployment configuration before the rollback window ends.

---

# Configuration Rename

A compatibility sequence may support:

```text
OLD_NAME
NEW_NAME
```

temporarily.

The application may accept both while deployment environments migrate.

---

# Configuration Precedence During Migration

When old and new configuration names coexist, precedence must be deterministic.

For example:

```text
NEW_NAME preferred
OLD_NAME fallback
```

with warnings for legacy use.

---

# Secret Compatibility

Secret rotation may require multiple credential versions to coexist temporarily.

For example:

```text
old signing key
new signing key
```

may both need validation during rotation.

Secret compatibility must follow security requirements, not convenience.

---

# Cryptographic Key Rotation

Key rotation often requires a compatibility window.

Potential model:

```text
write/sign with new key
    ↓
read/verify with new + previous keys
    ↓
retire old key
```

This should be explicitly designed when cryptographic systems are introduced.

---

# Authentication Compatibility

Authentication format changes can affect:

```text
existing sessions
tokens
mobile clients
service identities
```

A deployment must determine whether existing credentials remain valid.

---

# Session Compatibility

Changing session serialization or storage may invalidate active sessions.

This may be acceptable, but it is a product and security decision.

Do not make mass logout an accidental side effect.

---

# Token Compatibility

Changes to:

```text
issuer
audience
claim semantics
signing algorithm
key
```

may affect currently valid tokens.

Migration should consider token lifetime.

---

# Authorization Compatibility

Authorization policy may change over time.

Tightening authorization may be intentionally breaking.

Loosening authorization may introduce security exposure.

Authorization changes require explicit review regardless of version labels.

---

# Permission Identifier Compatibility

Persisted or externally referenced permission identifiers should remain stable where consumers depend on them.

Renaming a permission may require migration.

---

# Data Classification Compatibility

A field's classification may change.

For example:

```text
INTERNAL
    ↓
CONFIDENTIAL
```

This can invalidate previous assumptions about:

```text
logging
exports
analytics
access
retention
```

Security controls must follow the stricter current classification.

---

# Serialization Compatibility

Serialization formats can become durable contracts.

Examples:

```text
JSON document stored in database

cached payload

session object

event body

encrypted serialized state
```

Their evolution must be intentional.

---

# Custom Binary Serialization

Custom binary formats create strong compatibility obligations.

Do not introduce them without concrete need.

Mature standard formats should generally be preferred.

---

# Cache Compatibility

Caches may temporarily contain values created by a previous application version.

A new version should either:

```text
understand old cached values
invalidate cache safely
namespace/version cache keys
```

depending on semantics.

---

# Cache Key Versioning

Versioning a cache key can be a simple migration mechanism.

Conceptually:

```text
user:v1:<id>
    ↓
user:v2:<id>
```

This is local implementation versioning, not necessarily public contract versioning.

---

# Cache Version Proliferation

Old cache versions should expire or be removed.

Do not retain permanent legacy cache namespaces without need.

---

# Search Index Compatibility

Search indexes are derived state.

A schema change may require:

```text
dual index
reindex
alias switch
```

rather than maintaining backward compatibility indefinitely.

Because search is derived, rebuildability should reduce long-term compatibility burden.

---

# Generated Artifacts

Generated outputs should be reproducible from canonical sources.

Compatibility promises normally apply to the canonical contract, not incidental generated formatting.

---

# Generated SDKs

Generated SDK public interfaces may nevertheless become compatibility commitments to SDK users.

Their package versioning should account for this.

---

# Generated Documentation

Documentation generation format itself should not become a compatibility burden unless external automation depends on it.

Machine-readable artifacts intended for automation should have explicit schemas.

---

# CLI Compatibility

If Orion later provides user-facing CLI commands, command names, arguments, output, and exit codes may become contracts.

Do not assume CLI changes are harmless merely because they are not APIs.

---

# Script Compatibility

Internal scripts used only within one repository revision may change freely.

Scripts used by external CI or operational systems may require compatibility.

---

# Infrastructure Compatibility

Infrastructure definitions and application releases also form compatibility boundaries.

Examples:

```text
application expects queue that does not exist yet

new app expects new IAM permission

old app incompatible with removed environment variable
```

Infrastructure rollout must be coordinated with application rollout.

---

# Infrastructure Expand–Contract

A safe infrastructure change may follow:

```text
create new resource
    ↓
deploy consumers
    ↓
migrate data/traffic
    ↓
remove old resource
```

This mirrors other compatibility transitions.

---

# Provider Compatibility

Third-party providers may change their APIs or behavior.

Adapters should isolate provider-specific compatibility from domain logic where practical.

---

# Provider API Versions

Some external providers require explicit API-version selection.

Such versions are dependencies, not Orion API versions.

Their upgrade should be deliberate and tested.

---

# Provider Deprecation

External provider deprecations may impose migration deadlines.

These should become visible operational work rather than surprise runtime failures.

---

# Language Runtime Compatibility

Changes to language runtime or compiler version may affect:

```text
build output
library compatibility
runtime behavior
```

Such upgrades should be treated as infrastructure/toolchain compatibility changes.

---

# Dependency Compatibility

Dependency upgrades may contain breaking changes.

Lockfiles and reproducible builds help control this risk.

Major dependency upgrades should be reviewed based on actual impact.

---

# Dependency Version Ranges

Version ranges should not allow uncontrolled breaking dependency upgrades.

Exact dependency policy will be selected with package tooling.

Reproducibility takes priority over speculative freshness.

---

# Schema Version Numbers

Do not introduce global schema version numbers merely because compatibility exists.

Existing artifacts such as:

```text
migration state
contract version
package version
```

may already provide sufficient information.

Version identifiers should serve a concrete compatibility need.

---

# Global System Version

Orion does not require one global version number that represents every:

```text
API
database
package
application
configuration
```

These components may evolve at different rates.

A release identifier may still identify a deployed build.

---

# Release Version

A product or repository release may identify a set of compatible artifacts.

It does not imply all underlying contracts changed versions.

---

# Release Metadata

Runtime systems should eventually expose safe release metadata for observability.

This helps answer:

```text
Which application version produced this behavior?
```

without conflating it with API or database versions.

---

# Compatibility Matrix

For complex releases, explicitly writing a compatibility matrix may be useful.

Example:

| Consumer | Provider            | Compatible |
| -------- | ------------------- | ---------- |
| App N    | Schema N            | Yes        |
| App N    | Schema N+1 expand   | Yes        |
| App N+1  | Schema N+1 expand   | Yes        |
| App N    | Schema N+1 contract | No         |

Such matrices should be used when they clarify deployment safety.

---

# Compatibility Windows

A compatibility window is the period during which old and new forms must coexist.

Examples:

```text
rolling deploy duration
mobile support duration
queue message retention
token lifetime
rollback window
```

The window should influence how long transitional support remains.

---

# Rollback Window

Rollback requirements create backward compatibility obligations.

If application version N may be restored for 24 hours, schema and configuration changes during that period must remain compatible with N unless rollback is explicitly abandoned.

---

# Roll Forward vs Rollback

Not every system change should support rollback.

Sometimes forward recovery is safer.

The release process should know whether:

```text
rollback supported
```

or:

```text
forward fix required
```

for each significant change.

---

# Compatibility and Data Loss

Compatibility must never be used to justify silent data loss.

If old and new versions interpret data differently, migration must ensure durable meaning is preserved.

---

# Data Migration Compatibility

Changing representation may require supporting both forms temporarily.

Example:

```text
legacy status field
    ↓
new normalized state
```

The migration should define which representation is canonical during transition.

---

# Dual Writes

Dual writes may be used temporarily.

They create consistency risk and require:

```text
canonical source
failure handling
reconciliation
removal condition
```

They should not become permanent without architectural justification.

---

# Dual Reads

Fallback reads may support migration:

```text
read new representation
    ↓
fallback to old representation
```

Fallback should not hide incomplete migration indefinitely.

---

# Compatibility Markers

Temporary compatibility code should be easy to find.

Potential approaches may include:

```text
clear naming
TODO with issue
deprecation metadata
tracking documentation
```

Do not create permanent anonymous compatibility branches.

---

# Compatibility Debt

Compatibility support is technical debt when its consumer no longer exists.

Examples:

```text
legacy request parser
old job payload
deprecated config key
obsolete database column
v1 adapter
```

Such debt should be removed deliberately.

---

# Compatibility Ownership

Every compatibility layer should have an owner.

The owner should know:

```text
which consumer requires it
why it exists
when it can be removed
```

---

# Deprecation

Deprecation signals that a supported contract should no longer receive new usage.

A deprecation should include:

```text
replacement
consumer migration path
removal condition
```

where practical.

---

# Deprecation Is a Lifecycle

Conceptually:

```text
active
    ↓
deprecated
    ↓
migration
    ↓
usage reaches zero / support window ends
    ↓
removed
```

Deprecation should not mean permanent support.

---

# Removal Requires Evidence

Before removing compatibility behavior, determine:

```text
which consumers remain
whether queued/persisted historical data exists
whether rollback still requires old behavior
whether supported old clients remain
```

Code search alone may be insufficient.

---

# Runtime Usage Evidence

Observability may help identify:

```text
deprecated endpoint use
old event consumption
old config key use
legacy client versions
```

where this can be collected safely.

---

# Compatibility Metrics

Compatibility telemetry must remain low-cardinality.

Avoid unbounded labels for:

```text
client identifier
payload version
arbitrary consumer name
```

Use bounded known categories.

---

# Feature Flags and Compatibility

Feature flags may assist migration by controlling activation separately from deployment.

Example:

```text
deploy compatible code
    ↓
enable new behavior gradually
```

Feature flags do not eliminate compatibility requirements between old and new data formats.

---

# Feature Flag Removal

A completed compatibility migration should remove temporary feature flags when no longer needed.

---

# Canary Deployment

Canary deployment may expose a new version to limited traffic while old and new versions coexist.

This increases the importance of shared database and message compatibility during the canary period.

---

# Blue-Green Deployment

Blue-green deployment may shorten mixed-version time but still requires compatibility during:

```text
traffic switch
rollback
shared database use
```

Deployment strategy changes the window, not necessarily the requirement.

---

# Backward-Compatible Reads

Readers should often tolerate data written by previous supported versions.

Example:

```text
missing optional field
```

may receive a default semantic.

Avoid guessing semantics when old data is ambiguous.

---

# Backward-Compatible Writes

During mixed-version deployment, new writes may need to remain understandable by old readers.

This is often harder.

It may require delaying new representation use until old readers are gone.

---

# Write Compatibility Before Read Compatibility

When old readers cannot understand new data, deploying a new writer too early can be dangerous.

Always evaluate:

```text
Can the old version read data created by the new version?
```

not only the reverse.

---

# Data Version Fields

Persisted payloads may include explicit version metadata when multiple shapes must coexist.

Example:

```text
schemaVersion: 2
```

Do not add version fields to every record preemptively.

Use them when parsing genuinely requires explicit shape identification.

---

# Version Detection by Shape

Inferring version solely from optional fields may work for simple migrations.

Explicit versioning is safer when several incompatible representations can coexist.

The decision depends on complexity.

---

# Compatibility Testing

Compatibility should be tested at the boundary where it matters.

Potential tests include:

```text
old API request against new server

new app against transitional database

old worker reading new message

new worker reading queued old job

rollback app against current schema
```

---

# Compatibility Tests Should Reflect Reality

Do not maintain arbitrary historical combinations.

Test only combinations supported by actual release policy.

---

# Released Baselines

Important compatibility boundaries may retain released baselines.

Examples:

```text
API schema snapshot
database release baseline
event schema fixture
configuration fixture
```

These support automated comparison.

---

# Golden Fixtures

Historical payload fixtures may be useful to test deserialization compatibility.

Examples:

```text
job-v1.json
event-v2.json
```

These fixtures should represent real released shapes.

---

# Compatibility Fixtures Are Immutable Evidence

A fixture representing a released historical contract should not be silently updated to make tests pass.

If the old contract changed historically, create the appropriate additional fixture.

---

# Property-Based Compatibility Testing

For complex serializers, property-based testing may provide useful compatibility evidence.

This should be introduced only where risk justifies it.

---

# Migration Tests

Compatibility between application and schema should follow database migration testing policy.

A fresh database alone is not sufficient evidence.

---

# API Compatibility Tests

API compatibility should follow:

```text
docs/api/versioning.md
```

and should use machine-readable contract baselines where practical.

---

# Event Compatibility Tests

If event-driven architecture is introduced, producers and consumers should validate supported event shapes.

---

# Configuration Compatibility Tests

Applications may test startup against:

```text
current configuration

transitional configuration

deprecated configuration
```

during migration windows.

---

# Rollback Compatibility Tests

Critical release pipelines may verify that the previous application version can operate against the post-expand schema.

This is particularly valuable for high-risk deployments.

---

# Compatibility Failure

A compatibility failure should be explicit and diagnosable.

Prefer:

```text
unsupported schema
unsupported API version
unsupported event version
```

over silently interpreting incompatible data incorrectly.

---

# Fail Fast on Incompatibility

When a component cannot safely operate with a dependency version, fail before performing unsafe work where practical.

For example:

```text
application startup
    ↓
required schema capability missing
    ↓
not ready
```

---

# Capability Detection

Sometimes compatibility is better represented by capability detection than numeric versions.

For example:

```text
does provider support feature X?
```

may be more robust than:

```text
providerVersion >= 7
```

Use capability checks when the actual dependency is a capability.

---

# Version Checks

Numeric version checks can be appropriate when the external system defines precise version semantics.

Avoid arbitrary internal version comparisons when feature detection expresses the dependency more accurately.

---

# Compatibility and Defaults

Defaults can assist compatible evolution.

They can also hide missing migration.

For example:

```text
new field missing
    ↓
assume false
```

is only safe if `false` accurately represents old-state semantics.

Do not invent defaults merely to make deserialization succeed.

---

# Compatibility and Unknown Values

Forward-compatible consumers may preserve unknown values.

This is preferable to mapping unknown values silently to an incorrect known value.

---

# Unknown Is Better Than Wrong

If a consumer does not understand:

```text
new status = deferred
```

it may be safer to represent:

```text
unknown
```

than incorrectly map it to:

```text
pending
```

Semantic correctness takes priority over convenient fallback.

---

# Compatibility and Validation

Validation should allow supported old forms during deprecation windows.

After removal, validation should reject them explicitly.

---

# Compatibility and Errors

Errors caused by unsupported versions or shapes should have stable diagnostics.

Do not allow incompatibility to surface as:

```text
undefined property
SQL failure
generic internal error
```

when the boundary can detect it earlier.

---

# Compatibility and Observability

Runtime telemetry should help identify compatibility-related failures.

Potential fields include:

```text
application release
contract version
operation
compatibility error category
```

where bounded and useful.

---

# Release Correlation

When a compatibility failure appears after deployment, telemetry should make it possible to correlate the failure with:

```text
release
migration
configuration change
```

---

# Compatibility Alerts

Repeated unsupported-contract failures may indicate:

```text
old clients still active

deployment ordering error

consumer migration incomplete
```

Alerting should reflect actual operational impact.

---

# Documentation

Compatibility-sensitive contracts should document:

```text
supported versions
deprecations
migration expectations
```

only where such versioning actually exists.

Do not add speculative compatibility matrices to simple components.

---

# ADRs

Significant compatibility strategy decisions should be captured through ADRs.

Examples:

```text
mobile API support policy

event versioning model

package publication strategy

rollback compatibility window
```

Ordinary compatible changes do not require ADRs.

---

# Compatibility Review

Changes should receive compatibility review when they affect an independently evolving boundary.

Reviewers should ask:

```text
Who consumes this?

Can the consumer update atomically?

Can old and new versions coexist?

Does persisted historical state exist?

Is rollback required?

Can the change be additive?
```

---

# New Compatibility Boundary Checklist

Before introducing a versioned compatibility boundary, answer:

1. Which producer and consumer evolve independently?
2. Why can they not change atomically?
3. What compatibility direction is required?
4. How long must compatibility be preserved?
5. Is the boundary public, internal, persisted, or operational?
6. What is the canonical contract?
7. How will compatibility be tested?
8. How will usage be observed?
9. How will deprecation work?
10. What is the removal condition?

If these questions cannot be answered, explicit versioning may be premature.

---

# Breaking Change Checklist

Before making a compatibility-sensitive change, answer:

1. Which consumers depend on the current behavior?
2. Is the change structural, semantic, behavioral, or operational?
3. Can the change be additive?
4. Can expand–migrate–contract be used?
5. Can all consumers update together?
6. Does persisted old data exist?
7. Can new writers create data old readers cannot understand?
8. Is rollback required?
9. Does security require immediate change?
10. How will the transition be tested?
11. How will completion be verified?
12. What temporary compatibility code must later be removed?

---

# Deployment Compatibility Checklist

Before deploying a change spanning multiple components, answer:

1. What is deployed first?
2. What old versions remain active?
3. What new versions become active?
4. Which database schema is present at each step?
5. Which configuration is present?
6. Which messages may remain queued?
7. Which sessions or tokens remain valid?
8. Can rollback occur?
9. Which temporary compatibility paths are required?
10. What indicates migration completion?

---

# Persisted Payload Checklist

Before changing a persisted serialized payload, answer:

1. Where is the payload stored?
2. How long can it survive?
3. Which application versions may read it?
4. Can old readers understand new writes?
5. Can new readers understand old writes?
6. Is an explicit schema version required?
7. Can existing payloads be migrated?
8. Can the data be rebuilt instead?
9. How will compatibility be tested?

---

# AI Agent Requirements

Before changing a compatibility-sensitive boundary, an AI agent should identify:

```text
producer
consumer
deployment independence
released state
persisted historical data
rollback requirements
existing compatibility tests
```

---

# AI Must Not Version Reflexively

An AI agent must not add:

```text
v2
schemaVersion
new package major version
new event version
```

merely because a breaking change would otherwise require more work.

It should first evaluate compatible evolution.

---

# AI and Monorepo Changes

An AI agent should understand that internal monorepo consumers may often be updated atomically.

It should not preserve unnecessary internal backward compatibility where no runtime or release boundary exists.

---

# AI and Runtime Boundaries

An AI agent must recognize that:

```text
mobile client
queued job
database
event
persisted JSON
```

may outlive the code that created them.

These require compatibility analysis even inside a monorepo.

---

# AI and Persisted Data

Before changing serialized persisted data, an AI agent must determine whether old representations already exist.

It must not assume current code shape represents all stored data.

---

# AI and Rollback

An AI agent should evaluate whether a change makes the previous application release unable to run.

If so, it should identify the impact on rollback explicitly.

---

# AI and Compatibility Code Removal

An AI agent should not delete compatibility code merely because new code no longer uses it.

It must determine whether old consumers, persisted data, or rollback still require it.

---

# AI and Security

If compatibility conflicts with a required security correction, the AI agent should prioritize security and identify the migration impact clearly.

---

# AI and Tests

Compatibility-sensitive changes should add or update tests against the relevant supported old/new combinations where practical.

---

# Mechanical Enforcement

Future tooling may enforce rules such as:

```text
released API baseline compatibility

released migration immutability

deprecated contract references

package public-surface checks

generated SDK compatibility

event schema validation

configuration schema validation
```

Not every compatibility property can be inferred mechanically.

Semantic review remains necessary.

---

# Compatibility Metadata

Where useful, canonical contracts may eventually include metadata such as:

```text
introduced
deprecated
replacement
stability
```

This metadata should be added only when tooling or consumers benefit from it.

---

# Compatibility Manifest

Orion may eventually maintain machine-readable information about supported compatibility boundaries.

This should not become a manually maintained duplicate of information already available in canonical schemas and release metadata.

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## Version Everything

Avoid.

---

## Preserve Every Internal Interface Forever

Avoid.

---

## Assume Monorepo Means No Compatibility Problems

Avoid.

---

## Assume Internal Means No Consumers

Avoid.

---

## Assume Additive Means Compatible

Avoid.

---

## Structural Diff as Only Compatibility Review

Avoid.

---

## New Writer Produces Data Old Reader Cannot Understand During Rolling Deployment

Avoid.

---

## Remove Rollback Compatibility Accidentally

Avoid.

---

## Temporary Compatibility Code With No Removal Condition

Avoid.

---

## Dual Write Without Canonical Source

Avoid.

---

## Silent Interpretation of Unknown Data

Avoid.

---

## Global System Version for Unrelated Contracts

Avoid.

---

## API Version Tied to Database Version

Avoid.

---

## Package Version Tied to Product Release

Avoid unless distribution model specifically requires it.

---

## Keep Legacy Behavior Solely Because It Exists

Avoid.

Compatibility must protect real consumers, not history for its own sake.

---

## Preserve Security Vulnerability for Compatibility

Prohibited.

---

# Initial Versioning and Compatibility Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Versioning should represent real compatibility boundaries.
2. Compatible evolution is preferred over introducing new versions.
3. Compatibility requirements depend on independently evolving consumers.
4. Internal monorepo code does not require backward compatibility by default when consumers can update atomically.
5. Runtime artifacts such as mobile clients, database state, queued jobs, events, and persisted payloads may require compatibility even inside the monorepo.
6. Unreleased contracts may be refined when no dependent released consumer exists.
7. Released compatibility-sensitive behavior must consider existing consumers.
8. Structural, semantic, behavioral, security, and operational compatibility must all be considered.
9. Expand–migrate–contract should be preferred for transitions requiring old and new forms to coexist.
10. Temporary compatibility code must have identifiable removal conditions.
11. New writers must not produce representations unsupported by old readers during required mixed-version windows.
12. Rollback requirements create compatibility obligations.
13. Persisted serialized data must be treated as a versioned contract when multiple shapes can coexist.
14. Database, API, SDK, package, and application versions are separate concepts.
15. Event and job payload evolution must account for retained historical messages.
16. Security corrections may intentionally override compatibility.
17. Compatibility should be tested at actual supported boundaries.
18. Usage and observability should provide evidence for deprecation and removal where practical.
19. AI agents must identify producer, consumer, release state, and persistence lifetime before introducing versioning.
20. Compatibility complexity should exist only while a real consumer requires it.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text
repository release versioning
published package versioning
SDK semantic versioning
compatibility baseline storage
contract-diff tooling
event schema versioning
job payload versioning
rollback support window
client support policy
deprecation tracking
compatibility telemetry
```

These decisions should follow actual runtime topology, distribution model, and technology choices.

Significant decisions should be documented through ADRs.

---

# Future Documentation

This document may later be complemented by:

```text
docs/api/versioning.md
docs/database/migrations.md

docs/adr/
docs/runbooks/
```

Application- or domain-specific compatibility rules should remain close to the boundary that requires them.

---

# Summary

Compatibility exists because independently evolving components cannot always change atomically.

The central question is:

```text
Who still depends on the old behavior?
```

Orion prefers:

```text
compatible evolution over version proliferation

atomic monorepo changes over unnecessary internal legacy

expand–migrate–contract over abrupt breaking transitions

explicit compatibility windows over indefinite support

consumer evidence over assumptions

boundary adapters over duplicated business logic

semantic correctness over shape compatibility alone
```

A database migration number is not an API version.

An API version is not an SDK version.

An SDK version is not an application release.

A monorepo does not eliminate runtime compatibility.

A version should exist because a compatibility boundary requires it, not merely because something changed.
