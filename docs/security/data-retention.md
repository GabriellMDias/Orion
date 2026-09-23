# Data Retention

## Purpose

This document defines the data-retention principles used by Orion.

Its goals are to ensure that data is:

- retained only as long as justified;
- deleted when no longer required;
- classified before retention decisions are made;
- handled consistently across primary and derived systems;
- recoverable where operational requirements demand it;
- minimized across telemetry, caches, backups, and exports;
- understandable by humans and AI agents;
- compatible with future legal and regulatory requirements;
- suitable for machine-readable policy and enforcement.

Retention is part of data lifecycle management.

A system that knows how to create data must also know how that data eventually:

- expires;
- is deleted;
- is anonymized;
- is archived;
- or becomes subject to a different retention policy.

This document is technology-agnostic.

Specific retention durations, storage-provider lifecycle rules, backup schedules, legal-hold mechanisms, deletion APIs, and data-governance tooling will be selected later through explicit architectural decisions and applicable business/legal requirements.

This document complements:

- `docs/security/data-classification.md`;
- `docs/security/telemetry-redaction.md`;
- `docs/security/production-access.md`;
- `docs/database/principles.md`;
- `docs/reliability/logging.md`;
- `docs/reliability/tracing.md`;
- `docs/reliability/error-reporting.md`.

---

## Core Principle

Data should exist only while there is a justified reason for it to exist.

The intended model is:

```text id="94agqm"
data created
    ↓
purpose identified
    ↓
classification assigned
    ↓
retention rule applied
    ↓
active use
    ↓
retention end
    ↓
delete / anonymize / archive
    ↓
derived copies converge
```

`Keep forever` must be an explicit decision.

It must never be the invisible default.

---

# Retention Is a Data Contract

Retention defines part of the lifecycle of data.

For each important data category, Orion should eventually be able to answer:

```text id="l9s0s0"
Why do we keep it?

How long do we keep it?

What ends the retention period?

What happens afterward?

Which copies exist?

How are those copies removed or transformed?
```

If these questions cannot be answered, the lifecycle is incomplete.

---

# Retention Is Not One Global Number

Different data has different purposes.

Therefore Orion should not define one universal retention duration for:

```text id="8kik2y"
business data
authentication data
audit records
logs
traces
backups
exports
temporary files
```

Retention must follow the purpose and risk of each data category.

---

# Retention vs Deletion

Retention answers:

```text id="0piw5f"
How long should data remain available?
```

Deletion answers:

```text id="bt3t0p"
How is data removed after it should no longer remain?
```

Both are required.

A retention policy without a deletion mechanism is incomplete.

---

# Retention vs Archival

Archival moves data to a different storage or access model.

Archival does not mean deletion.

Archived data remains subject to:

```text id="hmx6uy"
classification
access control
retention
security
deletion obligations
```

---

# Retention vs Backup

Backups preserve recoverability.

They are not exempt from retention policy.

A backup may contain data that has already been deleted from the live system.

The system must define how deleted data eventually ages out of backups.

---

# Retention vs Legal Hold

A legal or regulatory hold may require preserving data beyond normal retention.

Such holds must be:

```text id="rh15ic"
explicit
scoped
authorized
auditable
```

They must not become a generic reason to retain everything indefinitely.

---

# Data Classification Comes First

Retention decisions should consider:

```text id="bgk28s"
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
```

as defined in:

```text id="0a18gz"
docs/security/data-classification.md
```

More sensitive data generally requires:

```text id="obn3or"
stronger justification
shorter retention where possible
tighter access
more careful deletion
```

---

# Data Minimization

Before defining how long to retain data, ask whether the system needs to collect it at all.

The preferred sequence is:

```text id="u2xq4o"
do not collect
    ↓ if needed
collect minimum
    ↓
retain minimum
    ↓
delete when no longer needed
```

Retention policy must not compensate for unnecessary collection.

---

# Purpose Limitation

Data should be retained for identified purposes.

Examples may include:

```text id="5kq8cj"
fulfilling product function
financial reconciliation
security investigation
fraud prevention
legal compliance
operational debugging
```

A new purpose should not automatically reuse previously collected data without review.

---

# Retention Owner

Important retained data should have an identifiable owner.

Ownership should answer:

```text id="0zq592"
Which domain defines the data lifecycle?

Who can change the retention rule?

Who is responsible for deletion behavior?
```

---

# Retention Policy Metadata

Orion may eventually represent retention policy in machine-readable metadata.

Conceptually:

```text id="6u6um7"
owner: identity
classification: CONFIDENTIAL
retention: 90d_after_account_deletion
disposition: delete
```

or:

```text id="2r5nz5"
retention: while_account_active
disposition: anonymize
```

The exact representation is deferred.

---

# Retention Trigger

A retention period often begins or ends based on an event.

Examples include:

```text id="4oat44"
record creation
last activity
account deletion
contract termination
incident closure
export generation
job completion
session expiration
```

The trigger must be explicit.

---

# Fixed Duration

Some data may use a fixed duration.

Example concept:

```text id="i7jgvv"
retain for 30 days after creation
```

The actual duration must come from product, legal, security, or operational requirements.

Do not invent arbitrary durations.

---

# Lifecycle-Based Retention

Some data should exist while a business object remains active.

Example:

```text id="7o5ebt"
retain while subscription exists
```

with separate policy after termination.

---

# Event-Based Retention

Some data may require:

```text id="4cspmg"
retain N days after account deletion
```

or equivalent.

The ending event should be unambiguous.

---

# Indefinite Retention

Indefinite retention requires explicit justification.

Potential reasons may include:

```text id="gn4n0m"
durable ledger requirement
long-term legal record
permanent product artifact
```

Indefinite does not mean:

```text id="otbs2w"
we never designed deletion
```

---

# No Default Forever

If no retention rule has been defined, the correct state is:

```text id="ihj1cy"
retention undefined
```

not:

```text id="g0p9d6"
retain forever
```

Undefined retention should become visible as a governance defect.

---

# Data Lifecycle States

A record may move through states such as:

```text id="nx1g34"
active
inactive
deleted
archived
anonymized
```

These states should have explicit semantics.

---

# Hard Delete

Hard deletion removes data from the active storage model.

It may still remain temporarily in:

```text id="4nf7i3"
backups
replicas
logs
caches
search indexes
```

until those systems converge according to their policies.

---

# Soft Delete

Soft delete marks data as deleted while retaining the row.

Typical conceptual field:

```text id="zmv3j0"
deletedAt
```

Soft delete is not equivalent to actual deletion.

---

# Soft Delete Is Not the Default

Do not add soft delete to every table automatically.

Soft delete increases:

```text id="e6m8yo"
query complexity
authorization complexity
uniqueness complexity
storage
privacy risk
retention ambiguity
```

Use it only when there is a concrete recovery, audit, or lifecycle need.

---

# Soft Delete Requires Retention

A soft-deleted record still contains data.

Therefore it must have a policy for:

```text id="m6rlrg"
eventual hard deletion
anonymization
archive
```

when appropriate.

A row with `deletedAt` retained forever is still retained data.

---

# Restore Window

Soft delete may support a bounded restore window.

Conceptually:

```text id="z7wb66"
delete requested
    ↓
soft deleted
    ↓
restore window
    ↓
hard delete
```

The actual window should be defined by product requirements.

---

# Tombstones

Some systems may require tombstone records after deletion.

A tombstone should contain only the minimal data required to represent:

```text id="a3p47w"
resource no longer exists
```

or preserve distributed consistency.

Do not retain the full deleted record if only a minimal marker is required.

---

# Anonymization

Anonymization removes the ability to identify a person from retained data to the level required by the applicable policy.

It may allow preserving:

```text id="9g0wdb"
aggregate statistics
non-identifying historical facts
```

without retaining unnecessary personal information.

---

# Anonymization Is Not Deletion by Renaming

Replacing:

```text id="ce6adn"
name = "Deleted User"
```

while retaining:

```text id="hxm5su"
email
phone
IP history
external identifiers
```

is not meaningful anonymization.

---

# Pseudonymization

Pseudonymization replaces identifying data with another identifier.

Pseudonymized data may still be re-identifiable.

It should generally remain classified as sensitive.

---

# Hashing Is Not Automatically Anonymization

Hashing:

```text id="5cg3hl"
email
phone
customer number
```

may still allow:

```text id="69yjlp"
dictionary attacks
linkability
re-identification
```

Hashing must not automatically be treated as deletion or anonymization.

---

# Aggregation

Aggregated data may have lower privacy risk than raw records.

However:

```text id="y5nzw3"
small cohorts
rare categories
precise timestamps
```

may still permit re-identification.

Aggregation does not automatically declassify data.

---

# Personal Data

Personal data should have an explicit lifecycle.

The system should be able to identify where personal data exists across:

```text id="9jonfj"
primary database
object storage
search
cache
telemetry
exports
backups
third-party processors
```

where practical.

---

# Sensitive Personal Data

Highly sensitive personal data should be retained only when necessary.

Long-term retention should require stronger justification.

---

# Authentication Data

Authentication-related data requires special treatment.

Potential categories include:

```text id="r0nszt"
password hashes
sessions
refresh tokens
MFA enrollment
recovery codes
login history
```

Each has different lifecycle needs.

---

# Password Hashes

Password hashes should exist only while required for authentication.

When the credential is no longer valid, the obsolete hash should not remain indefinitely without purpose.

---

# Sessions

Expired or revoked session state should be removed according to session-management requirements.

Active-session storage should not become a permanent history of all sessions unless security requirements justify it.

---

# Refresh Tokens

Refresh-token records should follow:

```text id="x3v7ga"
expiration
revocation
rotation
```

and eventually be removed when no longer useful for security or detection.

---

# Recovery Codes

Used or revoked recovery credentials should be invalidated immediately.

Historical retention of the secret value is unnecessary and unsafe.

---

# Authentication History

Security events such as:

```text id="821i10"
login success
login failure
credential change
session revocation
```

may require retention for security investigation.

The exact period is a future operational/legal decision.

---

# Authorization Data

Role and permission assignments may need current-state and historical audit retention.

Current authorization state and audit history are separate datasets.

Do not keep every historical permission state in the primary authorization tables accidentally.

---

# Audit Records

Audit records may require longer retention than ordinary diagnostic logs.

Their retention should reflect:

```text id="moa3ce"
security
compliance
investigation
business requirements
```

Audit retention should be explicitly defined.

---

# Audit Integrity vs Retention

Audit logs may require stronger protection against modification.

Retention duration and integrity protection are distinct concerns.

---

# Financial Records

Financial or billing data may have retention obligations determined by:

```text id="hz9031"
accounting
tax
contract
payment-provider rules
jurisdiction
```

This document does not invent durations.

Such requirements should be documented once known.

---

# Payment Credentials

Raw payment credentials should generally not be retained by Orion when a provider can tokenize or own them.

Retention minimization is especially important for payment data.

---

# Provider Tokens

Provider-generated tokens may themselves be sensitive.

Their retention should follow the period for which the integration needs them.

---

# User Content

User-generated content should generally exist according to the product lifecycle.

Examples:

```text id="3tn7fk"
documents
messages
uploads
comments
```

Deletion semantics should consider:

```text id="oldh5z"
ownership
sharing
legal retention
backups
derived indexes
```

---

# User Content Deletion

Deleting an account does not automatically imply deleting every piece of content.

Some content may:

```text id="a4fnm1"
belong to an organization
be shared with other users
be legally required
```

Ownership and retention semantics must be explicit.

---

# Object Storage

Files in object storage require lifecycle rules.

Retention should consider:

```text id="l4wfqt"
primary object
previous versions
multipart uploads
temporary artifacts
thumbnails
derived files
```

---

# Object Versions

Storage systems may preserve old versions after overwrite or delete.

Version retention must be included in lifecycle policy.

A deleted object may otherwise remain indefinitely in version history.

---

# Temporary Uploads

Incomplete or temporary uploads should expire automatically.

Examples include:

```text id="dn5fln"
upload staging
conversion input
temporary signed-upload objects
```

Temporary storage should not become permanent by omission.

---

# Derived Files

Derived artifacts such as:

```text id="2tz36e"
thumbnail
preview
transcoded media
generated PDF
```

should generally inherit lifecycle from their canonical source unless a separate purpose requires different retention.

---

# Search Indexes

Search indexes are derived copies.

When canonical data is deleted or anonymized, search indexes must eventually reflect that change.

A search index must not become a forgotten permanent copy.

---

# Search Rebuildability

Derived search data should ideally be rebuildable from canonical sources.

This reduces the need for long-term independent retention.

---

# Caches

Caches should have bounded lifetime by design.

A cache is not a retention mechanism.

---

# Cache Expiration

Sensitive cached values should expire according to:

```text id="jctyb0"
operational need
security risk
canonical data changes
```

Cache TTL should not exceed justified lifecycle merely for convenience.

---

# Cache Invalidation

Deletion from canonical storage may require explicit cache invalidation if natural TTL is too long.

---

# Client-Side Caches

Web, mobile, and desktop applications may retain:

```text id="fzsgax"
local storage
database cache
filesystem data
offline state
```

Client-side retention must be considered where sensitive data exists.

---

# Logout and Local Data

Logging out may require deleting local credentials or sensitive cached state.

It does not necessarily require deleting all non-sensitive offline product data.

Semantics should be explicit.

---

# Mobile Backups

Operating-system device backups may preserve application data beyond local deletion.

Sensitive client storage should use platform mechanisms appropriate to its classification.

---

# Logs

Logs require retention limits.

Longer retention increases:

```text id="4ztzcm"
storage cost
privacy exposure
breach impact
```

Logging policy should minimize captured data before retention is considered.

---

# Log Retention

Different logs may justify different retention.

Examples:

```text id="cv9qor"
application diagnostic logs
security logs
audit records
deployment logs
```

Do not treat them as one homogeneous dataset.

---

# Debug Logs

High-verbosity diagnostic data should generally have shorter retention than ordinary operational telemetry.

Temporary incident logging should have an explicit removal or expiration plan.

---

# Traces

Trace retention should be limited according to:

```text id="d5pwfe"
diagnostic need
sampling
cost
privacy
incident investigation window
```

Traces are not intended as permanent execution history.

---

# Error Reports

Error reports may be retained long enough to support:

```text id="yur5ci"
investigation
regression analysis
release comparison
```

but should not retain unnecessary personal data indefinitely.

---

# Metrics

Metrics generally contain aggregated data.

They still require retention decisions based on:

```text id="h8onod"
SLO windows
capacity planning
trend analysis
cost
```

High-resolution raw metrics may not require the same retention as long-term aggregated trends.

---

# Telemetry Retention

Telemetry retention should distinguish:

```text id="j1vylu"
raw high-resolution telemetry
aggregated long-term telemetry
security/audit evidence
```

where providers support different retention tiers.

---

# Sensitive Telemetry

If sensitive data accidentally enters telemetry, ordinary retention policy must not be used as an excuse to wait for natural expiration.

Incident response may require active removal and credential rotation.

---

# Third-Party Telemetry Providers

Retention must account for external providers.

For every provider storing production telemetry, understand:

```text id="jq649f"
default retention
configurable retention
deletion capability
backup behavior
subprocessors
```

when relevant.

---

# Backups

Backups provide recovery capability.

They should have:

```text id="y6667y"
defined retention
encryption
access control
restore testing
deletion lifecycle
```

---

# Backup Retention

Backup retention should follow recovery objectives.

Do not retain backups indefinitely merely because storage is cheap.

---

# Backup Generations

A backup strategy may use multiple horizons.

Conceptually:

```text id="i774uh"
recent frequent backups

older less-frequent backups
```

The actual schedule depends on RPO, RTO, cost, and regulatory requirements.

---

# Deleted Data in Backups

When data is deleted from production, it may remain in backups until those backups expire.

This must be understood and documented.

A restored old backup may temporarily reintroduce deleted data.

---

# Restore and Deletion Replay

After restoring from a backup, the system may need to reapply:

```text id="q0vn0v"
deletion requests
retention changes
revocations
```

that occurred after the backup point.

Recovery design must account for this.

---

# Backup Isolation

Backups should not become a convenient way to bypass ordinary access controls or retention policy.

---

# Backup Copies

Copies of backups created for:

```text id="dvb8s5"
testing
migration
forensics
```

must have their own explicit lifecycle.

Temporary backup copies should be deleted after their purpose ends.

---

# Disaster Recovery Copies

Cross-region or offline backups remain subject to retention and classification.

Geographic replication does not change data sensitivity.

---

# Replicas

Database replicas contain production data.

Deletion and retention normally follow the primary database through replication.

Lag or detached replicas can create delayed deletion.

Operational procedures should account for this.

---

# Snapshots

Manual database or disk snapshots are backups.

They require:

```text id="hyvpct"
purpose
owner
expiration
```

A manually created snapshot should not live forever because it lacks lifecycle automation.

---

# Development Copies

Production snapshots should not be cloned into development environments by default.

If a controlled copy is required, it should use:

```text id="57emye"
anonymization
minimization
restricted access
explicit expiration
```

---

# Exports

Exports create new copies of production data.

Examples include:

```text id="2piv85"
CSV export
report archive
support bundle
data portability download
```

Every export should have a lifecycle.

---

# Generated Exports

Server-generated exports should expire when long-term retention is unnecessary.

A download link expiring does not necessarily delete the underlying file.

Both access and storage lifetime must be defined.

---

# User-Requested Exports

A user data export may contain broad personal data.

It should be:

```text id="khx1iv"
encrypted in transit
access-controlled
time-limited
deleted after appropriate period
```

according to product requirements.

---

# Internal Exports

Operational or analytical exports should not be retained in personal workstations or shared folders indefinitely.

---

# Email Attachments

Sending production data by email can create uncontrolled long-term copies.

Use dedicated secure delivery where possible.

Email should not be the default export transport for sensitive production data.

---

# Reports

Generated reports may contain confidential information.

Retention should follow their purpose rather than assuming all reports are harmless artifacts.

---

# Temporary Files

Temporary files should have automatic cleanup.

Examples:

```text id="npr1mz"
upload buffers
conversion files
temporary exports
diagnostic archives
```

Temporary directories should not accumulate persistent sensitive data.

---

# Local Scratch Space

Production jobs using local disk should clean temporary artifacts after:

```text id="cpvugt"
completion
failure
cancellation
```

where practical.

---

# Failed Job Artifacts

Failure paths are a common source of retention leaks.

Temporary data must not remain forever because cleanup only executes on success.

---

# Message Queues

Queued messages are retained data.

Queue retention should consider:

```text id="pgejqq"
maximum expected processing delay
retry window
dead-letter handling
privacy
```

---

# Event Logs

Durable event streams may intentionally retain history.

If event retention is long-term, event payload design must minimize unnecessary personal and restricted data.

---

# Event Sourcing

If event sourcing is ever introduced, retention becomes a core domain architecture decision.

Immutable event history may conflict with deletion requirements if personal data is embedded directly in events.

This complexity is one reason event sourcing is not an Orion default.

---

# Job Payloads

Persisted job payloads should contain only data required to execute the job.

Large embedded business objects increase retention and privacy risk.

Prefer identifiers or minimal command data where appropriate.

---

# Dead-Letter Queues

Dead-letter messages may survive longer than normal queue messages.

They require explicit retention.

A DLQ must not become permanent storage of failed sensitive payloads.

---

# Message Replay Archives

If message archives exist for replay, their retention and deletion semantics must be explicit.

---

# Analytics

Analytics systems often create long-lived derived copies.

Retention should distinguish:

```text id="c1inkg"
raw event data
user-level analytical data
aggregated statistics
```

---

# Analytics Minimization

Raw event-level analytics should collect only fields required for actual analytical use.

Do not retain complete product payloads for hypothetical future questions.

---

# Anonymous Analytics

Where aggregated or genuinely anonymized data satisfies the need, prefer it over long-lived identifiable event data.

---

# Data Warehouses

A data warehouse is a production data store.

It is not exempt from deletion requirements because it is analytical.

Deletion propagation must include warehouse copies where applicable.

---

# Data Lakes

Large object stores used for analytics can accumulate forgotten data.

Every dataset should have:

```text id="it67cz"
owner
purpose
classification
retention
```

---

# Derived Datasets

Derived data should inherit relevant retention constraints from its sources unless a separate justified lifecycle exists.

---

# AI and Machine Learning Data

If production data is ever used for:

```text id="kpy2ys"
training
evaluation
fine-tuning
embedding
retrieval
```

retention and deletion semantics must be explicit.

Such use is not implied by ordinary product data collection.

---

# Embeddings

Embeddings derived from user content may still encode sensitive information.

Deleting source content may require deleting associated embeddings and vector-index entries.

---

# Model Training Copies

Training datasets can be difficult to delete after model training.

Therefore using production data for training requires explicit policy before ingestion.

This document does not authorize such use.

---

# AI Prompt Logs

Prompts and responses used in application AI features may contain user content.

They should not be retained indefinitely by default.

Provider-side retention and training policies must be understood before integration.

---

# AI Diagnostic Context

AI operational tools should receive only the minimum retained telemetry required for the task.

Retention of AI investigation transcripts should follow their data sensitivity.

---

# Third-Party Providers

Sending data to a provider creates another retention surface.

Provider evaluation should consider:

```text id="j7ow9g"
what data is stored
how long
whether retention can be configured
how deletion works
whether backups retain data
```

where relevant.

---

# Processor Deletion

Deleting data from Orion's primary systems may not remove copies held by providers automatically.

Deletion workflows should propagate where required.

---

# Provider Account Termination

When a provider is removed, Orion should consider:

```text id="pxn58q"
data export
data deletion
retention confirmation
credentials revocation
```

as part of offboarding.

---

# Derived Copies

Deletion should consider all meaningful copies.

Conceptual dependency graph:

```text id="zjb1hy"
primary record
    ├── cache
    ├── search index
    ├── analytics
    ├── export
    ├── object derivative
    └── provider copy
```

The primary database is not necessarily the only place where data exists.

---

# Canonical Source

For every derived system, identify the canonical source.

This enables:

```text id="hpyqlf"
rebuild
invalidation
deletion propagation
consistency recovery
```

---

# Deletion Propagation

Deletion may occur synchronously or asynchronously.

If asynchronous, define:

```text id="vqkcf0"
expected convergence window
retry behavior
failure monitoring
reconciliation
```

---

# Deletion Is a Distributed Workflow

In a complex system, deleting one user's data may require several components.

Conceptually:

```text id="rb0p6a"
deletion requested
    ↓
primary state updated
    ↓
derived deletion tasks
    ↓
providers notified
    ↓
verification
```

Such workflows require idempotency and reconciliation.

---

# Deletion Idempotency

Deletion operations should be safe to repeat where practical.

A timeout must not leave the operator unsure whether repeating deletion is dangerous.

---

# Partial Deletion

Partial failure must be detectable.

For example:

```text id="lm61ia"
database deleted
search deletion failed
```

should not be silently considered complete.

---

# Deletion Reconciliation

Important deletion workflows should have a way to identify incomplete copies and retry them.

---

# Deletion Verification

For high-risk or regulated deletion workflows, the system may need verifiable completion state.

The exact evidence model is deferred.

---

# Data Subject Requests

If Orion products become subject to privacy requirements involving:

```text id="rbw677"
access
deletion
correction
portability
```

the implementation should build on the same canonical data inventory and lifecycle model.

This document does not define jurisdiction-specific legal requirements.

---

# Account Deletion

Account deletion semantics should be explicit.

Potential outcomes may include:

```text id="jhqer2"
delete personal profile
revoke credentials
anonymize retained business records
remove private content
preserve organization-owned content
```

depending on product ownership rules.

---

# Organization Deletion

Multi-user organization deletion may require different semantics from individual-user deletion.

Do not apply user deletion rules blindly to shared organizational data.

---

# Referential Integrity During Deletion

Deletion must preserve database integrity.

Potential strategies include:

```text id="q1h6rt"
cascade
restrict
set null
anonymize reference
tombstone
```

The correct choice depends on semantics.

---

# Historical Attribution

Some records may need to preserve:

```text id="8g1td2"
an action happened
```

without preserving:

```text id="1dt7y3"
full identity of the deleted actor
```

Anonymized historical attribution may be appropriate.

---

# Audit vs Deletion

Audit requirements may conflict with deleting ordinary user data.

Where history must remain, retain only the information required by the audit purpose.

Do not use audit as justification to preserve unrelated data.

---

# Database Constraints

Foreign keys and uniqueness constraints must account for deletion strategy.

Soft deletion often complicates uniqueness.

This is one reason deletion semantics must be designed early.

---

# Orphaned Data

Deletion workflows must not leave unexplained orphan records.

If an orphan is intentional, its lifecycle and meaning should be documented.

---

# Retention and State Machines

Retention should not be hidden inside unrelated state transitions.

For example:

```text id="rd58ro"
order = cancelled
```

does not automatically imply:

```text id="tbgocd"
delete after 30 days
```

unless that lifecycle is explicitly documented.

---

# Retention Jobs

Automated cleanup may run through scheduled jobs.

Such jobs should be:

```text id="qf7nl7"
idempotent
bounded
observable
retryable where safe
```

---

# Cleanup Batching

Large deletion workloads should use bounded batches.

Avoid one transaction deleting millions of records if it creates:

```text id="p7e9hz"
locks
replication pressure
long rollback
operational risk
```

---

# Retention Query Efficiency

Tables subject to automated retention should support efficient identification of expired data.

Indexes may be needed on fields such as:

```text id="ad2nmi"
expiresAt
deletedAt
createdAt
```

when actual query patterns justify them.

---

# Expiration Fields

Some records may have explicit:

```text id="mv55rl"
expiresAt
```

metadata.

This should represent semantic lifecycle, not merely scheduling implementation.

---

# TTL Features

Database or storage TTL features may automate deletion.

Use them when semantics align.

Automatic TTL must not bypass:

```text id="0egz0y"
required audit
derived deletion propagation
domain side effects
```

without deliberate design.

---

# Cleanup Failure

Retention automation failure must become observable.

Otherwise expired data may accumulate silently.

---

# Retention Metrics

Useful operational metrics may include:

```text id="m6yefj"
expired records pending cleanup
cleanup failures
oldest overdue deletion
```

when retention workflows become operationally important.

---

# Retention Alerts

Alerting may be appropriate when:

```text id="n5yy5y"
deletion SLA is violated
retention backlog grows
cleanup repeatedly fails
backup expiration stops
```

The threshold must correspond to real risk or obligation.

---

# Logs for Retention Jobs

Cleanup jobs should log:

```text id="dxj8d2"
job
result
count
duration
safe scope
```

without logging deleted record contents.

---

# Audit of Deletion

Some deletions may require an audit record.

The audit should record:

```text id="06bt3r"
actor/system
operation
scope
time
result
```

without retaining the deleted sensitive content.

---

# Deletion Reason

A bounded reason category may be useful.

Examples:

```text id="h4usxy"
retention_expired
user_request
account_deleted
admin_action
legal_requirement
```

Do not embed long free-form sensitive text into audit events unnecessarily.

---

# Manual Deletion

Manual production deletion should follow:

```text id="09ipap"
docs/security/production-access.md
```

Prefer purpose-built deletion workflows.

---

# Bulk Deletion

Bulk deletion is high risk.

It should include:

```text id="jfjc9p"
scope preview
authorization
batching
verification
recovery planning
```

where practical.

---

# Retention and Recovery

Deletion may conflict with rollback and recovery.

A recovery plan must understand:

```text id="mc8dp8"
which deleted data may reappear from backup
which deletion records must be replayed
```

---

# Deletion Ledger

Some systems may need a durable record that a resource or identity must remain deleted.

This can help prevent restoration from resurrecting data incorrectly.

Such a mechanism should contain minimal necessary information.

---

# Backup Restoration

After restoring an older backup, deletion and retention workflows should reconcile the restored data against current lifecycle state.

---

# Restore Testing

Restore tests should consider whether deleted or expired data can reappear.

Recovery correctness includes retention correctness.

---

# Environment Retention

Non-production environments also need retention.

Examples:

```text id="pzckcu"
preview environments
test databases
CI artifacts
temporary branches
```

These often accumulate unnoticed.

---

# Preview Environments

Ephemeral preview environments should have automatic expiration.

Their storage should not persist forever after the branch or review closes.

---

# CI Artifacts

CI may retain:

```text id="3225hy"
logs
screenshots
test reports
build artifacts
coverage
```

Retention should be limited according to engineering need.

---

# CI Secrets and Artifacts

CI artifacts must not contain secrets.

Retention policy cannot make secret-bearing artifacts safe.

---

# Test Databases

Test databases should use:

```text id="7m5ojp"
synthetic data
automatic cleanup
environment isolation
```

Long-lived shared test data should not accidentally accumulate production-derived content.

---

# Development Logs

Local logs containing sensitive test data should also have reasonable lifecycle.

Development does not exempt data from classification.

---

# Local Tool Caches

Developer tooling may retain:

```text id="76o4e3"
API responses
downloaded files
database exports
AI context
```

Tooling should avoid persistent sensitive caches unless required.

---

# Generated Documentation

Generated documentation must not embed real production data.

Therefore ordinary repository history should not become a retention surface for production records.

---

# Source Control

Source control is intentionally durable.

Sensitive or user data must not be committed.

If a secret or restricted data enters Git, deletion from the latest revision does not remove historical exposure.

This becomes a security incident.

---

# Git Is Not a Retention System

Do not store:

```text id="4isvlm"
data exports
production samples
customer records
```

in Git for long-term convenience.

---

# Issue Trackers

Issues and pull requests may be retained for long periods.

Do not paste production personal data or secrets into them.

---

# Chat Systems

Operational chat may also retain messages for long periods.

Use safe references rather than pasting production payloads.

---

# Incident Records

Incident records may require long-term retention for learning.

They should summarize relevant facts without unnecessarily copying sensitive source data.

---

# Screenshots in Incidents

Screenshots should be minimized and redacted.

Prefer structured safe telemetry references where possible.

---

# Retention Changes

Changing retention policy can have large consequences.

Examples:

```text id="iix7nw"
90 days → 30 days

30 days → indefinite
```

Both require review.

Reducing retention may affect:

```text id="rihwtb"
support
analytics
compliance
recovery
```

Increasing retention increases:

```text id="t6frfr"
privacy
security
cost
```

risk.

---

# Retention Policy Changes

A retention-policy change should answer:

```text id="42da6c"
Why is the change needed?

Which data is affected?

Does it apply retroactively?

What happens to existing older data?

Which providers/copies must change?
```

---

# Retroactive Retention

Changing policy may require deleting already-stored data that now exceeds the new retention limit.

Do not apply new policy only to future records unless intentionally designed.

---

# Retention Migration

A change to lifecycle policy may require:

```text id="cbyhzn"
backfill expiration metadata
cleanup old records
change storage lifecycle rules
update provider retention
```

This should be treated as a migration.

---

# Legal Requirements

Legal and regulatory retention requirements are jurisdiction- and product-specific.

They should be documented when known.

This architecture document does not invent legal durations.

---

# Legal Minimum vs Product Maximum

A legal minimum retention may require keeping data for a certain period.

That does not automatically justify retaining it forever after that period.

Similarly, a legal maximum may prohibit longer retention.

Product policy must distinguish these concepts.

---

# Legal Hold

Legal hold should suspend ordinary deletion only for the scoped records or categories required.

The hold should have:

```text id="0ffv61"
authority
scope
start
review
release
```

---

# Hold Release

When a hold ends, ordinary retention should resume.

Data that already exceeded normal retention may then need prompt deletion.

---

# Security Retention

Security evidence may need retention long enough to investigate delayed incidents.

This should be balanced against privacy and breach exposure.

---

# Incident Retention

Incident-related diagnostic data may require temporary extended retention.

Such exceptions should be:

```text id="hqbgy1"
scoped
time-bounded
authorized
```

not permanent.

---

# Fraud and Abuse Data

Fraud or abuse prevention may require retaining security signals.

The exact lifecycle should be justified separately from ordinary product analytics.

---

# Retention Exceptions

Exceptions to ordinary retention should identify:

```text id="f8qc92"
data
reason
authority
duration
owner
```

where practical.

---

# Exception Expiration

A retention exception should not itself default to permanent.

It should have a review or expiration condition.

---

# Retention Documentation

Important data categories should eventually have documented retention policy.

Possible structure:

```text id="wrzg2f"
category
owner
classification
purpose
retention trigger
duration
disposition
derived systems
```

---

# Machine-Readable Retention Registry

Orion may eventually maintain a machine-readable retention registry.

This could answer questions such as:

```text id="nq0d4o"
Which tables contain data retained after account deletion?

Which telemetry expires after 30 days?

Which derived stores contain user content?

Which datasets are indefinite?
```

The exact model is deferred.

---

# Retention Metadata Near Schema

Where useful, database schema metadata may include references to retention policy.

Avoid duplicating full policy text on every table.

---

# Data Inventory

Retention becomes easier when Orion knows where data exists.

A future data inventory may combine:

```text id="bujcn8"
schema metadata
classification
owner
retention
provider
derived copies
```

This should be generated where possible.

---

# AI Agent Requirements

Before introducing new persistent data, an AI agent should ask:

```text id="f43eou"
Why is this data stored?

What is its classification?

Who owns it?

How long should it exist?

What happens when its source is deleted?
```

---

# AI and Indefinite Retention

An AI agent must not assume:

```text id="97wyk8"
no retention requirement specified
```

means:

```text id="szth3l"
retain forever
```

It should identify the lifecycle as undefined.

---

# AI and Soft Delete

An AI agent should not add `deletedAt` reflexively.

It should first determine:

```text id="z73jg6"
restore requirement
audit requirement
eventual hard-delete policy
uniqueness implications
```

---

# AI and Derived Data

When adding:

```text id="p6479j"
cache
search index
analytics pipeline
object derivative
embedding
```

an AI agent should determine how deletion propagates from the canonical source.

---

# AI and Backups

An AI agent must not claim immediate total deletion when backups retain previous copies.

It should distinguish:

```text id="65qxbr"
live deletion
```

from:

```text id="nqbucv"
backup expiration
```

---

# AI and Telemetry

An AI agent should prefer reducing telemetry collection before relying on short retention as the only privacy control.

---

# AI and Providers

When integrating a new external provider that stores data, an AI agent should inspect:

```text id="8dp5ps"
provider retention
deletion capability
data categories sent
```

where that information is available.

---

# AI and Cleanup Jobs

AI-generated retention jobs should be:

```text id="1z6njj"
bounded
idempotent
observable
safe under retry
```

and should not delete arbitrary large datasets in one unreviewed transaction.

---

# AI and Tests

Retention-sensitive changes should include tests where practical for:

```text id="3lz5in"
expiration selection
deletion propagation
soft-delete filtering
restoration semantics
cleanup idempotency
```

---

# New Persistent Data Checklist

Before storing a new field, record, file, event, or payload, answer:

1. Why must this data be persisted?
2. Which domain owns it?
3. What is its classification?
4. Does it contain personal or restricted data?
5. What is the canonical source?
6. How long must it remain?
7. What event starts or ends retention?
8. What happens when retention expires?
9. Does it need hard delete, anonymization, or archive?
10. Which derived copies will exist?
11. How will deletion propagate?
12. Will backups contain it?
13. Does a provider receive it?
14. How will cleanup failure be detected?

---

# Soft Delete Checklist

Before implementing soft delete, answer:

1. Why is hard deletion insufficient?
2. Is restore required?
3. What is the restore window?
4. When does hard deletion occur?
5. How are uniqueness constraints affected?
6. How are queries prevented from accidentally returning deleted rows?
7. How does authorization treat deleted data?
8. How do caches and search indexes react?
9. What happens in backups?
10. How will retention completion be tested?

---

# Retention Rule Checklist

Before defining a retention rule, answer:

1. What data does the rule cover?
2. Who owns it?
3. What purpose requires retention?
4. What classification applies?
5. What event starts the retention clock?
6. What duration is justified?
7. Is the duration a minimum, maximum, or both?
8. What happens afterward?
9. Does the rule apply retroactively?
10. Which derived systems must follow it?
11. How do backups age out?
12. How will compliance with the rule be observed?

---

# Deletion Workflow Checklist

Before implementing a deletion workflow, answer:

1. What is being deleted?
2. What is the canonical record?
3. Which dependent records exist?
4. Which derived systems contain copies?
5. Which providers contain copies?
6. Is deletion synchronous or asynchronous?
7. Is the operation idempotent?
8. What happens after partial failure?
9. How is completion verified?
10. How do backups eventually age out the data?
11. Can restoration reintroduce the data?
12. Is an audit record required?

---

# Backup Retention Checklist

Before defining backup retention, answer:

1. What recovery objective requires the backup?
2. How frequently is it created?
3. How long must recovery points remain?
4. Is the backup encrypted?
5. Who can access it?
6. Are copies created in other regions?
7. How are expired backups deleted?
8. What happens to deleted production data inside old backups?
9. How are restores tested?
10. How are deletion events replayed after restoration?

---

# Provider Retention Checklist

Before sending production data to a third party, answer:

1. Which data is sent?
2. What is its classification?
3. Does the provider persist it?
4. What is the default retention?
5. Can retention be configured?
6. Can individual data be deleted?
7. What backup retention does the provider use?
8. Which subprocessors receive it?
9. What happens when the integration is terminated?
10. Is the provider lifecycle compatible with Orion's policy?

---

# Retention Exception Checklist

Before extending retention beyond the normal policy, answer:

1. Which data is affected?
2. Why is the exception required?
3. Who authorized it?
4. What is the scope?
5. How long does the exception last?
6. Does it affect backups and providers?
7. How is the exception tracked?
8. What happens when it expires?

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## Keep Everything Forever

Prohibited as an implicit default.

---

## No Retention Rule Means Forever

Prohibited.

---

## Soft Delete Everywhere

Avoid.

---

## Soft Delete With No Hard-Delete Plan

Avoid.

---

## Backup Retained Forever Because Storage Is Cheap

Avoid.

---

## Deleted User Data Remains Forever in Search Index

Prohibited.

---

## Cache Used as Permanent Storage

Avoid.

---

## Temporary Files With No Cleanup

Avoid.

---

## DLQ as Permanent Archive

Avoid.

---

## Analytics Copy Exempt From Deletion

Avoid.

---

## Production Dump Retained on Developer Laptop

Prohibited.

---

## Sensitive Export Shared Through Email Indefinitely

Avoid.

---

## Hashing Treated Automatically as Anonymization

Avoid.

---

## Replace Name but Retain All Other Identifiers and Call It Anonymous

Prohibited.

---

## Retention Duration Invented Without Requirement

Avoid.

---

## Backup Restore Reintroduces Deleted Data With No Reconciliation

Avoid.

---

## Provider Data Lifecycle Ignored

Avoid.

---

## Generated AI Embeddings Retained After Source Deletion Without Policy

Avoid.

---

## Legal Hold Applied to Entire System Without Scope

Avoid.

---

## Cleanup Job Deletes Unbounded Data in One Transaction

Avoid.

---

## Retention Failure Invisible

Avoid.

---

# Initial Data Retention Policy

Until stack-specific implementation and concrete legal/product requirements exist, Orion adopts the following requirements:

1. Every important persistent data category should eventually have an explicit retention lifecycle.
2. `Retain forever` must be an explicit justified policy, never an implicit default.
3. Data minimization should precede retention design.
4. Retention must consider data classification and purpose.
5. Soft delete is not equivalent to deletion and must not be introduced by default.
6. Soft-deleted data should have an eventual disposition when permanent retention is unnecessary.
7. Derived copies such as caches, search indexes, analytics data, exports, embeddings, and provider copies must be included in deletion design.
8. Backups must have defined retention and access controls.
9. Deleting live data does not imply immediate deletion from backups; backup aging must be documented.
10. Temporary files, exports, preview environments, and other temporary artifacts should expire automatically where practical.
11. Telemetry must have explicit retention appropriate to diagnostic need, privacy, and cost.
12. `RESTRICTED` data should be retained only for the minimum justified period.
13. Production data must not be copied to development environments by default.
14. Retention and deletion workflows should be idempotent, observable, and recoverable where practical.
15. Partial deletion failures must not silently appear complete.
16. Restore procedures must account for deletion and retention changes that occurred after the restored backup.
17. Third-party providers storing Orion data must be included in retention and deletion analysis.
18. Retention exceptions such as legal holds should be explicit, scoped, and reviewable.
19. AI agents must identify retention and deletion semantics when introducing new persistent data.
20. Retention metadata, cleanup validation, and deletion propagation should become mechanically enforceable where practical.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text id="yf4y1g"
specific retention durations
legal retention requirements
database cleanup tooling
backup schedule
backup retention
object-storage lifecycle rules
telemetry retention
audit-log retention
legal-hold mechanism
data inventory format
machine-readable retention registry
privacy-request workflow
provider deletion orchestration
```

These choices should follow actual product requirements, jurisdiction, contractual commitments, operational needs, and selected infrastructure.

Significant decisions should be captured through ADRs where architectural.

---

# Future Documentation

This document should be complemented by:

```text id="b0n6ib"
docs/security/incident-response.md

docs/runbooks/
```

Domain-specific retention rules should remain close to the owning domain or canonical data metadata rather than being duplicated into this architecture document.

---

# Summary

Retention is part of data lifecycle, not an afterthought.

The intended model is:

```text id="k0nz7y"
collect only what is needed
        ↓
classify
        ↓
retain for explicit purpose
        ↓
expire
        ↓
delete / anonymize / archive
        ↓
propagate to derived copies
        ↓
verify convergence
```

Orion prefers:

```text id="3ujhjf"
minimum collection over hypothetical future value

explicit retention over invisible forever

hard deletion over unnecessary soft deletion

anonymization over retaining unnecessary identity

derived-data convergence over primary-only deletion

automatic expiration over manual cleanup

bounded retention over accidental accumulation

known backup behavior over false claims of immediate deletion
```

A row marked deleted is still retained data.

A backup is still production data.

A search index is still a copy.

An export is still a copy.

A hashed identifier may still be personal data.

A provider's database is still part of the lifecycle.

The system should be able to explain why data still exists.

If it cannot, that data probably should not be retained indefinitely.
