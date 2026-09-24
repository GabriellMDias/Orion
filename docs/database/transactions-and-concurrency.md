# Transactions and Concurrency

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0006](../adr/0006-select-prisma-orm-for-database-access-and-migrations.md), [ADR-0009](../adr/0009-establish-testing-strategy-and-tooling.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Application-Level Transaction Ownership](#application-level-transaction-ownership)
- [Isolation Levels](#isolation-levels)
- [Check-Then-Act Race](#check-then-act-race)
- [Deadlock Retry](#deadlock-retry)
- [Database Retry Boundary](#database-retry-boundary)
- [New Transaction Checklist](#new-transaction-checklist)

Related policy: [delivery and side effects](../architecture/delivery-and-side-effects.md), [testing strategy](../architecture/testing-strategy.md).

## Purpose

This document defines the transaction and concurrency principles used by Orion.

Its goals are to ensure that state changes are:

- atomic where required;
- safe under concurrent execution;
- explicit about consistency guarantees;
- resilient to retries;
- resistant to duplicate processing;
- compatible with external side effects;
- observable;
- testable;
- understandable by humans and AI agents.

Concurrency is a production property.

Even when application code appears sequential, multiple requests, workers, retries, jobs, and processes may operate on the same data simultaneously.

This document is technology-agnostic.

Specific database isolation levels, locking primitives, transaction APIs, retry libraries, and distributed coordination mechanisms will be selected later through explicit architectural decisions.

This document complements:

- [docs/database/principles.md](principles.md);
- [docs/database/migrations.md](migrations.md);
- [docs/architecture/testing-strategy.md](../architecture/testing-strategy.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md);
- [docs/reliability/observability.md](../reliability/observability.md).

---

## Core Principle

Concurrency must be designed explicitly.

The intended model is:

```text
operation
    ↓
identify consistency requirement
    ↓
choose transaction / constraint / lock / versioning strategy
    ↓
handle conflicts explicitly
    ↓
produce correct durable state
```

Do not assume that:

```text
code executes sequentially
```

therefore:

```text
production behavior is sequential
```

That assumption is incorrect.

---

## Concurrency Is Normal

Concurrent execution may come from:

```text
multiple HTTP requests
multiple application instances
background workers
queue retries
duplicate webhook delivery
scheduled jobs
user retries
network retries
deployment overlap
```

Concurrency should be expected, not treated as an edge case.

---

## Transaction

A transaction groups database operations into one consistency boundary.

Conceptually:

```text
BEGIN
    operation A
    operation B
    operation C
COMMIT
```

If the transaction cannot complete:

```text
ROLLBACK
```

when the database supports transactional behavior for the operations involved.

---

## Atomicity

Atomicity means the transaction's required database changes succeed or fail together.

For example:

```text
create order
reserve order number
insert order items
```

may need to represent one atomic durable operation.

If the final insert fails, the database should not retain an incomplete order when the domain requires all-or-nothing behavior.

---

## Transaction Boundaries

A transaction boundary should correspond to a meaningful consistency requirement.

The question is:

```text
Which changes must be observed together as one durable state?
```

Do not choose boundaries solely according to:

```text
function
HTTP request
class
repository method
```

unless those boundaries also match consistency semantics.

---

## Transactions Should Be Explicit

Code performing multiple dependent writes should make transaction ownership visible.

Avoid hidden transaction behavior where contributors cannot determine whether:

```text
operation is atomic
```

without inspecting framework internals.

The selected persistence layer should make transaction scope discoverable.

---

## One Transaction per Request

Orion does not adopt:

```text
every HTTP request runs inside one database transaction
```

as a default rule.

Some requests perform no writes.

Some perform remote calls.

Some require multiple independent consistency boundaries.

Transaction scope should follow data semantics.

---

## Transaction per Repository Method

Likewise, every repository method should not automatically open and commit its own transaction.

For example:

```text
repository.createOrder()
repository.createItems()
```

cannot participate atomically if each method commits independently.

Transaction ownership should exist at the layer that understands the complete consistency requirement.

---

## Application-Level Transaction Ownership

Application operations often understand which persistence changes belong together.

Conceptually:

```text
application operation
        ↓
begin transaction
        ↓
persistence operations
        ↓
commit
```

Exact implementation may use transaction scopes, units of work, context objects, or database-native APIs.

---

## Domain Layer and Transactions

Domain logic should normally express business behavior independently of database transaction APIs.

For example:

```text
Order.cancel()
```

should not need to know how a SQL transaction is created.

Application or persistence infrastructure should coordinate durable transaction boundaries.

---

## Nested Transactions

Nested transaction semantics vary by database and library.

Some implementations use:

```text
savepoints
```

rather than true nested transactions.

Do not assume nested transaction calls create independent atomic units.

Their semantics must be understood before use.

---

## Savepoints

Savepoints may allow partial rollback within a larger transaction.

They can be useful for specialized workflows.

They should not be introduced merely because the database supports them.

The consistency semantics should justify them.

---

## Transaction Duration

Transactions should normally be as short as practical while preserving required atomicity.

Long transactions increase the risk of:

```text
lock contention
deadlocks
connection exhaustion
replication lag
large rollback work
```

---

## External Calls Inside Transactions

External network calls should generally not occur inside database transactions.

Avoid:

```text
BEGIN
    update database
    call payment provider
    send email
    call remote API
COMMIT
```

because the remote operation may be:

```text
slow
unavailable
non-transactional
non-reversible
```

while database locks remain held.

---

## Database Transactions Do Not Cover External Systems

A database transaction can usually roll back database state.

It cannot automatically roll back:

```text
email already sent
payment already captured
message accepted by broker
external API mutation
file uploaded
```

This is one of Orion's most important consistency principles.

---

## Distributed Atomicity

When one operation spans multiple systems, true atomicity may not exist.

The architecture must instead define behavior for partial failure.

Potential patterns include:

```text
idempotency
outbox
inbox
saga
compensation
reconciliation
```

These patterns should be introduced according to actual requirements.

---

## Do Not Pretend Distributed Work Is One Transaction

Avoid code that semantically claims:

```text
transaction {
    charge card
    insert order
}
```

if the payment provider does not participate in the same transactional system.

The syntax may look transactional while the system is not.

---

## Consistency Boundary

A consistency boundary defines state that must remain mutually valid.

For example:

```text
order
order items
order totals
```

may form one database consistency boundary.

The exact boundary belongs to domain design.

---

## Strong Consistency

Strong consistency may be required when the system must immediately prevent conflicting state.

Examples may include:

```text
unique account identifier
single inventory reservation
one payment capture per idempotency key
```

Database constraints and transactions are often appropriate.

---

## Eventual Consistency

Some cross-system state may converge asynchronously.

Examples may include:

```text
search index
analytics projection
email status
external reporting
```

Eventual consistency must be intentional.

It should define:

```text
canonical source
expected delay
failure recovery
reconciliation
```

---

## Eventual Consistency Is Not an Excuse

Do not label incorrect or uncontrolled state as:

```text
eventually consistent
```

without a mechanism that actually drives convergence.

Eventual consistency requires an explicit process that eventually repairs divergence.

---

## Concurrency Anomalies

Concurrent transactions may create anomalies depending on database isolation.

Potential anomalies include:

```text
dirty read
non-repeatable read
phantom read
lost update
write skew
```

Not every application must reason about all anomalies.

Important workflows should understand the anomalies relevant to their correctness.

---

## Isolation Levels

Database transaction isolation controls what concurrent transactions can observe.

Common conceptual levels include:

```text
read uncommitted
read committed
repeatable read
serializable
```

Exact semantics differ by database implementation.

Do not rely solely on isolation-level names.

Understand the selected database's actual behavior.

---

## Database Defaults

The default database isolation level may be appropriate for many operations.

It should not be assumed sufficient for every workflow.

Important concurrency-sensitive operations require explicit analysis.

---

## Serializable Isolation

Serializable isolation can provide strong correctness guarantees.

It may also introduce:

```text
transaction aborts
retries
contention
performance cost
```

It should be used where its guarantees justify the tradeoff.

---

## Read Committed

Read committed is common and often sufficient for ordinary CRUD.

It does not automatically prevent:

```text
lost updates
write skew
application-level race conditions
```

Correctness may still require constraints, locks, or conditional writes.

---

## Repeatable Read

Repeatable read may provide stronger read stability.

Its exact protection against write skew or phantom behavior depends on the database.

Do not derive guarantees from the label alone.

---

## Lost Update

A lost update may occur when:

```text
transaction A reads value 10
transaction B reads value 10

A writes 11
B writes 11
```

when the correct result should be 12.

This can be prevented through techniques such as:

```text
atomic update
optimistic concurrency
locking
serializable transaction
```

depending on the operation.

---

## Prefer Atomic Database Operations

When a state change can be represented atomically by the database, prefer that over:

```text
read
calculate
write
```

when concurrency would make the sequence unsafe.

For example:

```text
UPDATE counters
SET value = value + 1
```

may be safer than reading and rewriting the value from application memory.

---

## Check-Then-Act Race

A common race pattern is:

```text
check condition
    ↓
condition is true
    ↓
perform action
```

Two concurrent requests may both pass the check.

Example:

```text
check email available
    ↓
insert user
```

Database uniqueness must provide the final guarantee.

---

## Constraints as Concurrency Control

Database constraints are one of the strongest and simplest concurrency mechanisms.

Examples include:

```text
UNIQUE
FOREIGN KEY
CHECK
```

They allow the database to resolve races at the durable boundary.

---

## Optimistic Concurrency

Optimistic concurrency assumes conflicts are possible but relatively uncommon.

A typical strategy uses a version or expected state.

Conceptually:

```text
read version = 7
    ↓
modify
    ↓
UPDATE ...
WHERE version = 7
    ↓
version = 8
```

If no row is updated, a concurrent modification occurred.

---

## Version Columns

A version column may provide explicit optimistic locking.

Example:

```text
version INTEGER
```

Each successful mutation increments it.

The application can detect stale writes.

---

## Updated Timestamp as Version

An update timestamp may sometimes be used for optimistic concurrency.

This approach requires sufficient precision and reliable update semantics.

A dedicated version number is often clearer when concurrency semantics matter.

---

## Optimistic Conflict

An optimistic concurrency conflict is generally an expected conflict, not an internal database failure.

It may map to application semantics such as:

```text
RESOURCE_VERSION_CONFLICT
```

The correct behavior may be:

```text
retry
reload
ask user to reconcile
```

depending on operation.

---

## Pessimistic Locking

Pessimistic locking acquires database locks before performing conflicting work.

Conceptually:

```text
SELECT ... FOR UPDATE
```

or equivalent.

It may be useful when:

```text
conflicts are likely
operation must serialize
lock duration is small
```

---

## Lock Scope

Locks should cover the smallest meaningful resource.

Overly broad locks reduce concurrency.

For example:

```text
lock entire table
```

may be unnecessarily expensive when:

```text
lock one row
```

would protect the invariant.

---

## Locks Are Not Free

Pessimistic locking can cause:

```text
blocking
deadlocks
latency spikes
connection occupancy
```

It should be measured and justified.

---

## Advisory Locks

Some databases provide advisory or application-defined locks.

They may be useful for coordinating operations not naturally represented by row locks.

They should be used cautiously.

Their ownership, timeout, and failure semantics must be explicit.

---

## Distributed Locks

A distributed lock introduces another coordination system.

Orion does not use distributed locks as a default solution.

Before introducing one, determine whether the invariant can instead be protected through:

```text
database constraint
conditional write
idempotency
queue partitioning
single owner
```

Distributed locking has difficult failure semantics.

---

## Lock Expiration

Any lock system using expiration must consider:

```text
operation continues after lease expires
another actor acquires lock
both actors now execute
```

A lease alone does not guarantee exclusivity unless fencing or equivalent semantics exist.

---

## Fencing Tokens

For high-risk distributed locks, monotonic fencing tokens may be required to prevent stale lock holders from performing writes.

This is an advanced pattern.

It should be introduced only when the distributed coordination model actually requires it.

---

## Deadlocks

A deadlock occurs when transactions wait on each other's locks in a cycle.

For example:

```text
transaction A locks row 1
transaction B locks row 2

A waits for row 2
B waits for row 1
```

The database typically aborts one transaction.

---

## Deadlocks Are Expected Failure Modes

A deadlock does not necessarily indicate database corruption.

It indicates a concurrency conflict the application or transaction design must handle.

Occasional deadlocks may be retriable.

Repeated deadlocks indicate a design or access-ordering problem.

---

## Lock Ordering

Acquiring locks in a consistent order reduces deadlock risk.

For example:

```text
always lock accounts ordered by ID
```

may prevent cycles when transferring between accounts.

Important multi-resource operations should define deterministic ordering where practical.

---

## Deadlock Retry

If the database reports a known retryable deadlock, retry may be appropriate.

Retry must:

```text
restart the complete transaction
respect attempt limits
avoid repeating unsafe external side effects
```

Do not retry only the final query if earlier reads are no longer valid.

---

## Serialization Failures

Stronger isolation may abort transactions when serializable execution cannot be guaranteed.

These failures are often designed to be retried.

Retry behavior should be bounded and observable.

---

## Transaction Retry

A transaction retry may re-execute:

```text
reads
business logic
writes
```

Anything inside the retry boundary must therefore be safe to repeat.

---

## Side Effects Inside Retryable Transactions

Never place non-idempotent external effects inside code that may be transparently retried.

Dangerous example:

```text
transaction attempt 1
    → charge card
    → serialization failure

transaction attempt 2
    → charge card again
```

The result may be duplicate payment.

---

## Retry Classification

Not every database error is retryable.

Potential retryable categories may include:

```text
deadlock
serialization conflict
temporary connection failure
```

depending on database and operation.

Permanent errors such as:

```text
constraint violation
invalid query
missing column
```

should not be blindly retried.

---

## Bounded Retries

Retries must be bounded.

Avoid:

```text
while true:
    retry transaction
```

Repeated conflicts may indicate:

```text
heavy contention
logic defect
dependency failure
```

The operation should eventually fail predictably.

---

## Retry Backoff

For contention or remote failures, retries may use:

```text
delay
backoff
jitter
```

when appropriate.

Database transaction conflicts may sometimes be retried immediately or with small randomized delay depending on workload.

The policy should follow evidence.

---

## Retry Observability

Retries should be observable without producing excessive noise.

Useful context may include:

```text
operation
attempt
retry reason
duration
final outcome
```

Expected transient retries should not automatically generate incidents.

---

## Idempotency

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#idempotency). The detailed requirements are maintained there.

---

## State Machines

Concurrency-sensitive workflows often benefit from explicit state machines.

For example:

```text
pending
    ↓
processing
    ↓
completed
```

with allowed transitions.

State transitions can be protected with conditional database updates.

---

## Conditional State Transition

Prefer:

```text
UPDATE jobs
SET state = 'processing'
WHERE id = ?
  AND state = 'pending'
```

over:

```text
read state
if pending:
    update processing
```

when multiple workers may race.

The affected-row count becomes part of concurrency control.

---

## Compare-and-Set

Compare-and-set operations update state only when the current value matches an expected value.

This is a general optimistic concurrency mechanism.

Conceptually:

```text
state expected = pending
        ↓
set state = processing
        ↓
succeeds only if still pending
```

---

## Work Claiming

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#work-claiming). The detailed requirements are maintained there.

---

## Transaction Isolation and Read Models

A transaction may read a snapshot that becomes stale immediately after commit.

Application code must not assume that:

```text
read value
```

remains globally true indefinitely.

---

## Validation Under Concurrency

Application validation may become stale between validation and write.

For example:

```text
inventory available
    ↓
another transaction reserves inventory
    ↓
current transaction attempts reservation
```

The durable write must still protect the invariant.

---

## Authorization and Transactions

Authorization decisions may depend on database state.

For sensitive operations, consider whether:

```text
authorization check
```

and:

```text
protected state change
```

must observe a consistent state.

This is particularly relevant for rapidly changing ownership or permissions.

---

## Authorization Race

Example:

```text
user has permission
    ↓
permission revoked concurrently
    ↓
operation commits
```

Whether this is acceptable depends on authorization freshness requirements.

The system must define the semantic boundary.

---

## Immediate Revocation

Security-sensitive permissions may require stronger consistency between authorization state and protected operation.

This may influence:

```text
transaction design
token strategy
cache behavior
```

---

## Transactions and Audit Events

If a required audit record describes a database state change, the two may need to commit atomically.

For example:

```text
change privileged role
insert audit record
```

If both live in the same database, one transaction may protect consistency.

External audit systems require another strategy.

---

## Transactions and Domain Events

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#transactions-and-domain-events). The detailed requirements are maintained there.

---

## Read-Your-Writes

Some operations require a caller to immediately observe its own committed change.

This should be considered if the architecture introduces:

```text
read replicas
eventual read models
caches
```

A stale replica may violate expected user behavior even if durable state is correct.

---

## Replica Lag

Read replicas can return stale data.

Applications should choose whether an operation can tolerate this.

For example:

```text
analytics dashboard
```

may tolerate lag better than:

```text
read order immediately after payment
```

---

## Cache Consistency

Caches create another concurrency boundary.

A database transaction does not atomically update an external cache.

Cache invalidation strategy must define failure behavior.

The cache should not become the only source of critical durable truth.

---

## Cache Stampede

Concurrent cache misses may cause many identical expensive operations.

Mitigation may include:

```text
single-flight
locking
stale-while-revalidate
```

if the problem actually arises.

---

## File Storage and Transactions

Database state and object storage usually cannot commit atomically.

Operations such as:

```text
upload file
create database record
```

require partial-failure design.

Potential strategies include:

```text
temporary upload
finalize after commit
cleanup orphan objects
reconciliation
```

---

## Payment Transactions vs Database Transactions

A payment provider's concept of transaction is not the same as a database transaction.

Do not confuse provider terminology with atomicity across systems.

---

## Financial Operations

Financial operations often require stronger protections around:

```text
idempotency
ledger integrity
duplicate prevention
auditability
```

If Orion-based products introduce financial state, the domain may require additional specialized architecture.

---

## Ledger Design

A financial ledger should not be designed casually as mutable balances alone.

If such functionality is required, dedicated accounting invariants may be necessary.

This is outside the default Orion foundation.

---

## Counter Updates

Shared counters should use concurrency-safe update mechanisms.

Avoid:

```text
read count
increment locally
write count
```

under concurrency unless protected.

---

## Inventory

Inventory reservation is a canonical concurrency-sensitive workflow.

Potential strategies may include:

```text
conditional decrement
row lock
reservation records
optimistic versioning
```

The correct choice depends on product semantics.

---

## Uniqueness Reservation

Identifiers such as:

```text
username
email
order number
```

should use database-enforced uniqueness when uniqueness is a durable invariant.

Application prechecks may improve error messages but do not replace the constraint.

---

## Sequence Allocation

If an application requires sequential business numbers, allocation must be concurrency-safe.

Database sequences or dedicated allocation mechanisms may be appropriate.

Do not generate sequential numbers by:

```text
SELECT MAX(number) + 1
```

under concurrency.

---

## Sequence Gaps

Database sequences may contain gaps.

If business requirements demand gapless numbering, that is a significantly stronger requirement and may reduce concurrency.

It must be justified explicitly.

---

## Distributed Scheduling

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#distributed-scheduling). The detailed requirements are maintained there.

---

## Database Retry Boundary

When retrying a transaction, retry the logical transaction boundary rather than arbitrary internal statements.

A failed transaction may invalidate previous reads and assumptions.

---

## Application Retry Boundary

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#application-retry-boundary). The detailed requirements are maintained there.

---

## Timeouts and Transactions

A request timeout may expire while database work continues.

Cancellation propagation should be used where supported and safe.

Transaction cleanup must remain reliable.

---

## Connection Loss

If a database connection is lost during commit, the application may not know whether commit succeeded.

This may create an unknown outcome.

The operation design should tolerate this for critical workflows through idempotency or reconciliation where required.

---

## Commit Ambiguity

Commit ambiguity is particularly important for externally retried write operations.

A caller should not blindly repeat a non-idempotent operation simply because the database connection failed during commit.

---

## Consistency vs Availability

Distributed systems sometimes require explicit tradeoffs between consistency and availability.

Orion does not preselect one universal tradeoff.

The choice belongs to the specific capability.

Strong invariants should not be weakened merely to preserve availability without product justification.

---

## Single-Writer Patterns

Some complex concurrency problems may be simplified by assigning one logical writer.

Examples:

```text
queue partition per aggregate
single reconciliation worker
actor-style processing
```

This can reduce conflicts but adds architecture.

Use only when justified.

---

## Partitioned Processing

Messages for one resource may be routed to the same partition to preserve local ordering.

Partitioning semantics should be explicit.

Do not assume global ordering.

---

## Versioned Events

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#versioned-events). The detailed requirements are maintained there.

---

## Concurrency Error Semantics

Concurrency conflicts should map to meaningful application errors where appropriate.

Potential internal/public concepts may include:

```text
RESOURCE_CONFLICT
VERSION_CONFLICT
ALREADY_PROCESSED
```

The exact registry will be defined later.

---

## Expected Conflicts

A concurrency conflict may be an expected outcome.

Examples:

```text
username already claimed
order already cancelled
record changed by another user
```

These should not automatically become unexpected internal errors.

---

## Unexpected Concurrency Failures

Repeated deadlocks, lock timeouts, or impossible state conflicts may indicate operational or implementation defects.

These should be observable.

---

## Lock Timeout

A lock timeout should be distinguished from:

```text
database unavailable
constraint violation
business conflict
```

It may be transient or indicate severe contention.

---

## Contention Metrics

Important concurrency-sensitive workflows may eventually expose:

```text
conflict count
retry count
deadlock count
lock wait duration
```

Metrics should remain bounded.

---

## Transaction Tracing

Tracing may identify transaction-level operations where useful.

Avoid creating one span for every trivial query if that produces noise.

Important latency and failure boundaries should remain visible.

---

## Sensitive Data

Concurrency diagnostics must still follow:

- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

Do not dump full database rows merely because a conflict occurred.

---

## Testing Transactions

Transaction behavior must be tested against the real database technology where semantics matter.

Mocks cannot prove:

```text
rollback
locking
isolation
constraint interaction
```

---

## Atomicity Tests

An atomic workflow should test failure in the middle of the transaction.

Example:

```text
write A succeeds
write B fails
    ↓
verify A did not remain committed
```

when all-or-nothing behavior is required.

---

## Concurrency Tests

Concurrency-sensitive workflows should execute competing operations simultaneously where practical.

Examples:

```text
two users claim same username
two workers process same message
two requests cancel same order
```

Sequential tests do not reproduce the race.

---

## Optimistic Concurrency Tests

Tests should verify:

```text
first update succeeds
stale update conflicts
```

when versioning is used.

---

## Locking Tests

If row locking protects an invariant, integration tests should verify the intended behavior.

Avoid tests that assume lock timing based solely on arbitrary sleep durations when better coordination mechanisms are possible.

---

## Deadlock Tests

Deadlock retry infrastructure may deserve focused integration tests if it is important.

Do not create brittle tests that depend on undocumented database scheduler behavior.

---

## Idempotency Tests

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#idempotency-tests). The detailed requirements are maintained there.

---

## Failure Injection

Transaction and concurrency testing benefits from deliberate failure injection.

Potential failures include:

```text
database conflict
provider timeout
process interruption
message duplicate
publish failure
```

---

## Test Determinism

Concurrency tests are prone to flakiness.

Use explicit synchronization where possible.

Avoid depending only on:

```text
sleep 100ms
hope operations overlap
```

Tests should coordinate the intended race deterministically.

---

## Production Verification

For critical distributed workflows, production telemetry should help verify that:

```text
duplicates are controlled
retries are bounded
reconciliation succeeds
stuck workflows are visible
```

Testing alone cannot cover every failure mode.

---

## Reconciliation Tests

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#reconciliation-tests). The detailed requirements are maintained there.

---

## Transaction API Design

The selected transaction API should make it difficult to:

```text
accidentally escape transaction context
use non-transactional repository inside transaction
commit partially
```

The implementation strategy should be evaluated when choosing database tooling.

---

## Transaction Context

Persistence operations participating in one transaction may need explicit transaction context.

Conceptually:

```text
transaction
    ↓
repository A
repository B
```

Both must operate on the same transactional connection/session.

---

## Hidden Global Transaction Context

Implicit async-local transaction context may be convenient.

It can also hide dependencies.

If used, behavior should remain predictable and testable.

Explicit context may be preferable when clarity outweighs convenience.

---

## Repository APIs

Repository abstractions should not make transactions impossible.

For example, repositories that always create independent connections and commit internally may prevent atomic multi-repository operations.

Persistence boundaries should support required consistency.

---

## Unit of Work

A Unit of Work pattern may be useful if it clearly represents transaction ownership.

It is not a required Orion abstraction.

Do not introduce it merely for architectural terminology.

---

## Transaction Hooks

Callbacks such as:

```text
afterCommit
afterRollback
```

may be useful.

They can also create hidden behavior.

If introduced, their semantics must be clear, especially around retries and process failure.

---

## After-Commit Work

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#after-commit-work). The detailed requirements are maintained there.

---

## Business Locks

Some business concepts may require explicit reservations.

Example:

```text
seat reservation
inventory hold
temporary claim
```

A business reservation is domain state.

It should not automatically be implemented as a long-lived database lock.

---

## Database Locks vs Business Locks

Database lock:

```text
technical concurrency primitive
short-lived
transaction-scoped
```

Business lock/reservation:

```text
domain concept
may live minutes or hours
persisted explicitly
```

Do not conflate them.

---

## Reservation Expiration

Domain reservations may require expiration and cleanup.

Expiration introduces concurrency around:

```text
renewal
release
claim after expiry
```

The semantics should be modeled explicitly.

---

## Distributed Clocks

Time-based concurrency protocols should not assume perfect clock synchronization across machines.

Where exact ordering matters, database time, monotonic sequences, or logical versions may be safer than wall-clock comparison.

---

## Updated At and Ordering

`updated_at` is not always a reliable total ordering mechanism.

Two updates may share timestamps or clocks may differ across systems.

Use explicit versions or sequences when ordering is a correctness requirement.

---

## Unique Business Numbers

If business numbers require uniqueness but not strict sequence, use mechanisms optimized for uniqueness.

Do not add serialization merely to produce aesthetically consecutive numbers.

---

## Performance and Concurrency

Stronger consistency mechanisms may reduce throughput.

Performance tradeoffs should be measured.

Do not weaken correctness based on speculative performance concerns.

---

## Hot Rows

Frequently updated shared rows can become contention hotspots.

Examples include:

```text
global counters
single configuration row
shared aggregate
```

If contention becomes material, redesign may be required.

---

## Hot Indexes

Sequential insertion patterns or heavily contended unique indexes may affect performance.

Optimization should follow database-specific evidence.

---

## Batch Operations

Batch writes may improve throughput.

They also affect:

```text
transaction duration
lock scope
failure granularity
memory
```

Batch size should be deliberate.

---

## Bulk Updates

Large updates can create long transactions and widespread locks.

For large data changes, batching may be safer.

This overlaps with migration/backfill strategy.

---

## Queue Visibility Timeout

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#queue-visibility-timeout). The detailed requirements are maintained there.

---

## State Repair

Not every failure must be prevented synchronously.

Some may be repaired through:

```text
retry
reconciliation
operator intervention
```

The repair mechanism must be part of the design.

---

## Manual Intervention

Some rare inconsistent states may require operational intervention.

If so, the system should make them:

```text
detectable
diagnosable
safe to repair
```

Runbooks should document the process.

---

## Auditability

For high-risk concurrency-sensitive changes, audit records may help determine:

```text
which operation won
which actor initiated it
which retries occurred
```

Audit requirements should remain separate from ordinary diagnostic logging.

---

## Transaction Naming

Important transactional operations should have stable semantic operation names for telemetry and diagnostics.

Examples:

```text
order.cancel
payment.record
inventory.reserve
```

rather than database implementation names alone.

---

## AI Agent Requirements

AI agents must assume concurrent execution unless the architecture explicitly proves single-threaded or single-writer behavior.

Before implementing a state-changing workflow, an agent should ask:

```text
What happens if this runs twice?

What happens if two actors run it simultaneously?

What happens if the process crashes halfway?

What happens if an external call succeeds but the database write fails?

What happens if the database commits but the response is lost?
```

---

## AI and Check-Then-Act

AI agents should identify check-then-act races.

For example:

```text
if not exists:
    insert
```

should trigger evaluation of a database uniqueness constraint or atomic operation.

---

## AI and Retries

An AI agent must not add retries without determining:

```text
which errors are transient
whether operation is idempotent
whether inner retries already exist
whether outcome may be unknown
```

---

## AI and Locks

An AI agent must not introduce distributed locks as a first-line solution.

It should first evaluate:

```text
constraint
conditional write
optimistic concurrency
row lock
queue ownership
```

---

## AI and External Side Effects

An AI agent should treat every external side effect outside the database as non-transactional unless explicit infrastructure proves otherwise.

It must not imply rollback guarantees that do not exist.

---

## AI and Exactly-Once Claims

AI-generated documentation or code must not claim exactly-once behavior without evidence across the complete workflow.

---

## AI and Concurrency Tests

Changes involving concurrency guarantees should include integration-level tests whenever practical.

A sequential mock-based unit test is insufficient evidence for database locking behavior.

---

## Mechanical Enforcement

Future tooling may help enforce rules such as:

```text
transaction callbacks cannot call certain external adapters

known retry loops are bounded

idempotency keys have unique constraints

transaction-specific repositories use shared context

concurrency-sensitive operations have required tests
```

Not every concurrency property can be statically enforced.

Code review and testing remain necessary.

---

## New Transaction Checklist

Before introducing a transaction, answer:

1. Which invariant requires atomicity?
2. Which database changes must commit together?
3. Which layer owns the transaction?
4. How long can the transaction remain open?
5. Which locks may it acquire?
6. Can it deadlock?
7. Can it be retried?
8. Does retry repeat any external side effect?
9. What happens if commit outcome is unknown?
10. How will the behavior be tested?

---

## New Concurrency-Sensitive Operation Checklist

Before implementing a concurrency-sensitive operation, answer:

1. Can two executions occur simultaneously?
2. Can the same request or message be delivered twice?
3. Which durable invariant must hold?
4. Can a constraint enforce it?
5. Is optimistic concurrency sufficient?
6. Is pessimistic locking required?
7. What isolation guarantees are required?
8. What happens on conflict?
9. Is retry safe?
10. How is the race reproduced in tests?

---

## New Retry Checklist

See [delivery and side-effect policy](../architecture/delivery-and-side-effects.md#new-retry-checklist). The detailed requirements are maintained there.

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Read-Then-Write Counter

```text
read value
increment
write value
```

without concurrency protection.

Avoid.

---

### Check-Then-Insert Without Constraint

Avoid when uniqueness matters.

---

### Remote API Call Inside Long Database Transaction

Avoid.

---

### Assuming Database Rollback Reverses External Effects

Prohibited.

---

### Infinite Retry

Prohibited.

---

### Retry Non-Idempotent Operation Blindly

Prohibited.

---

### Duplicate Retry Layers

Avoid.

---

### Distributed Lock as First Solution

Avoid.

---

### Exact-Once Claim Without Proof

Avoid.

---

### Business Reservation Implemented as Long Database Lock

Avoid.

---

### `SELECT MAX(...) + 1` for Concurrent Number Allocation

Avoid.

---

### Sleep-Based Concurrency Test

Avoid when deterministic synchronization is practical.

---

### Unbounded Outbox Table

Avoid.

---

### Worker Assumes Messages Are Never Duplicated

Avoid unless infrastructure guarantee is proven.

---

### Permission Check Far Before Sensitive Write

Avoid when authorization may change and immediate revocation matters.

---

### Publish Event Before Database Commit

Avoid when event implies durable state.

---

### Publish Event After Commit Without Durable Recovery

Avoid when publication is required for correctness.

---

## Initial Transactions and Concurrency Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Concurrency must be assumed for production state-changing operations.
2. Transaction boundaries must represent meaningful consistency requirements.
3. Database transactions must remain as short as practical.
4. External network calls should not normally occur inside database transactions.
5. Database rollback must not be assumed to reverse external side effects.
6. Durable invariants should use constraints and atomic database operations where appropriate.
7. Application-only check-then-act logic must not be relied upon for concurrent uniqueness.
8. Optimistic or pessimistic concurrency should be selected deliberately according to conflict semantics.
9. Retryable transactions must not contain unsafe non-idempotent external side effects.
10. Retries must be bounded and owned intentionally.
11. Duplicate delivery must be assumed where infrastructure provides at-least-once behavior.
12. Critical non-idempotent operations should use explicit idempotency mechanisms where retries or duplicates are possible.
13. "Exactly once" must not be claimed without end-to-end guarantees.
14. Distributed workflows must define partial-failure and recovery behavior.
15. Deadlocks and serialization conflicts should be classified explicitly and retried only when safe.
16. Important concurrency-sensitive workflows require real integration testing.
17. Distributed locks should not be the default concurrency mechanism.
18. Process crash windows must be considered for important cross-system workflows.
19. Concurrency and retry behavior must be observable.
20. AI agents must reason about duplicate, concurrent, retry, and crash behavior before implementing state-changing workflows.

---

## Future Implementation Decisions

The following decisions are intentionally deferred:

```text
default database isolation level
transaction API
transaction context strategy
optimistic locking convention
deadlock retry policy
serialization retry policy
idempotency-key storage
outbox implementation
message deduplication strategy
distributed coordination mechanism
queue processing model
```

These decisions should follow the selected database engine, persistence tooling, messaging architecture, and actual domain requirements.

Significant decisions should be captured through ADRs.

---

## Future Documentation

This document may later be complemented by:

```text
docs/database/schema-documentation.md

docs/api/principles.md
docs/api/versioning.md

docs/reliability/tracing.md
docs/reliability/metrics.md

docs/runbooks/
```

Domain-specific concurrency requirements should remain close to the domain that owns them.

---

## Summary

Transactions provide atomicity within a database consistency boundary.

Concurrency determines what happens when multiple operations interact with that boundary simultaneously.

Distributed systems add another constraint:

```text
database transaction
    ≠
distributed transaction
```

Orion prefers:

```text
constraints over application-only races

atomic writes over read-modify-write when possible

explicit conflicts over silent lost updates

bounded retries over infinite retry

idempotency over duplicate side effects

durable intent over best-effort post-commit actions

reconciliation over pretending partial failure cannot happen
```

The essential questions for every important state-changing operation are:

```text
What if it runs twice?

What if it runs concurrently?

What if it fails halfway?

What if the caller retries?

What if the response is lost?

What if the process crashes?
```

If the architecture cannot answer those questions, the concurrency model is incomplete.


## Transactions

Transactions protect atomic data changes.

Operations that require all-or-nothing durable state should use appropriate transaction boundaries.

Conceptually:

```text
begin
    ↓
change A
change B
change C
    ↓
commit
```

If any required change fails:

```text
rollback
```

when that behavior matches domain semantics.

---

## Transaction Boundaries

Transactions should correspond to meaningful consistency boundaries.

Avoid:

```text
one transaction around an entire HTTP request
```

without understanding the implications.

Likewise, avoid splitting an atomic operation across separate transactions accidentally.

---

## Long Transactions

Long-running transactions can create:

```text
locks
contention
resource usage
deadlocks
```

External network calls should generally not occur inside database transactions unless the design explicitly requires it and consequences are understood.

---

## External Side Effects

Database transactions cannot normally roll back external side effects such as:

```text
email sent
payment captured
message published externally
```

Distributed workflows require explicit reliability patterns rather than assuming database rollback solves everything.

---

## Transactional Messaging

Patterns such as an outbox may eventually be appropriate when durable state changes and message publication must be coordinated.

Such patterns should be introduced only when real asynchronous requirements exist.

---

## Concurrency

Database design must consider concurrent operations.

Sequential application code does not imply sequential production behavior.

Potential problems include:

```text
lost updates
duplicate creation
double processing
write skew
deadlocks
```

Concurrency requirements should be explicit for important operations.

---

## Optimistic Concurrency

Optimistic concurrency may be appropriate when conflicts are uncommon.

Potential mechanisms include:

```text
version column
updated-at comparison
conditional update
```

The exact approach depends on persistence tooling.

---

## Pessimistic Concurrency

Locks may be appropriate when operations require exclusive access.

They should be used deliberately because they can reduce throughput and increase deadlock risk.

---

## Idempotency

Database constraints often help enforce idempotency.

Examples include:

```text
unique idempotency key
unique external event ID
unique provider transaction ID
```

Application-level checks alone may be insufficient under concurrency.

---

## Isolation Levels

Transaction isolation affects correctness and performance.

The database default should not be assumed correct for every workflow.

Important concurrent workflows may require explicit analysis of:

```text
read phenomena
write conflicts
locking
retry behavior
```

Detailed policy belongs in [docs/database/transactions-and-concurrency.md](transactions-and-concurrency.md).

---

## Deadlocks

Deadlocks are a normal possibility in transactional databases.

Applications should have defined behavior when the database reports a retryable deadlock.

Do not treat every deadlock as corruption.

Repeated deadlocks may indicate poor access ordering or transaction design.

---

## Retry Safety

Database retries must consider side effects.

A transaction retry may repeat application logic.

The retried block should not perform unsafe external side effects unless they are idempotent or otherwise protected.

---
