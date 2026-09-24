# Delivery and Side Effects

[Documentation index](../README.md) · [Validation availability](../validation.md)

## Read for this change

- [Idempotency](#idempotency)
- [Outbox Pattern](#outbox-pattern)
- [Work Claiming](#work-claiming)
- [Unknown Outcome](#unknown-outcome)
- [Retry Ownership](#retry-ownership)
- [Failure Windows](#failure-windows)

Related policy: [transactions and concurrency](../database/transactions-and-concurrency.md), [principles](../api/principles.md), [data retention](../security/data-retention.md).

This policy contains the cross-system delivery, idempotency, retry, and crash-recovery requirements previously maintained with database transactions. It does not select messaging infrastructure or require an inbox, outbox, saga, or distributed lock without a concrete need.

Database atomicity, isolation, constraints, locking, and transaction-specific retries remain in [transactions and concurrency](../database/transactions-and-concurrency.md). HTTP representation belongs to [API principles](../api/principles.md); compatibility and retained payloads follow [versioning](versioning-and-compatibility.md).


## Idempotency

An idempotent operation can be applied multiple times without producing additional unintended effects.

Conceptually:

```text
apply operation once
    ==
apply operation multiple times
```

from the perspective of the required outcome.

---

## Idempotency Is Semantic

Idempotency is not just:

```text
same HTTP response
```

It concerns side effects.

For example, retrying:

```text
capture payment
```

must not create multiple charges.

---

## Naturally Idempotent Operations

Some operations are naturally idempotent.

Example:

```text
set status = cancelled
```

may be idempotent if repeated cancellation has the same semantic result.

Others are not:

```text
increment balance by 10
```

---

## Idempotency Keys

An idempotency key can identify one logical operation across retries.

Conceptually:

```text
client sends operation with key K
    ↓
server records result for K
    ↓
same K received again
    ↓
return/reuse previous logical result
```

---

## Idempotency Key Scope

An idempotency key must have clear scope.

Potential scope may include:

```text
actor
tenant
operation type
endpoint
```

Otherwise the same key may accidentally collide across unrelated operations.

---

## Idempotency Key Storage

Durable idempotency normally requires durable storage.

In-memory deduplication is insufficient when:

```text
multiple instances exist
process restarts
```

---

## Unique Constraints for Idempotency

Database uniqueness may be used to guarantee one record per idempotency key.

This is often stronger than:

```text
check key exists
    ↓
insert
```

which is race-prone.

---

## Idempotency Result

The system should define what a repeated request receives.

Potential behaviors include:

```text
same result
current resource state
conflict if payload differs
```

Exact semantics belong to the specific API or operation.

---

## Same Key, Different Payload

Reusing an idempotency key for a materially different operation should normally be rejected.

Otherwise one key may silently refer to two intentions.

A stored request fingerprint may help detect misuse where required.

---

## Idempotency Retention

Idempotency records cannot necessarily live forever.

Retention should consider:

```text
client retry window
business risk
storage cost
operation semantics
```

The policy should be explicit for critical workflows.

---

## Duplicate Delivery

Asynchronous systems often provide at-least-once delivery.

This means a consumer may receive the same message more than once.

Consumers should not assume:

```text
one publish = exactly one execution
```

unless the infrastructure provides and proves that guarantee.

---

## Inbox Pattern

An inbox or processed-message record may prevent duplicate message handling.

Conceptually:

```text
receive event E
    ↓
check/insert event ID atomically
    ↓
process only once
```

The exact design depends on processing semantics.

---

## Exactly Once

"Exactly once" is often a system-level property, not a simple broker setting.

It may require coordination across:

```text
message delivery
database writes
external effects
```

Do not claim exactly-once behavior unless the complete workflow provides it.

---

## At-Least-Once

At-least-once delivery should assume duplicates.

The consumer must handle them safely.

This is often a practical default for reliable messaging.

---

## At-Most-Once

At-most-once delivery may lose work but avoids duplicate delivery.

It is appropriate only when the domain accepts that tradeoff.

---

## Outbox Pattern

An outbox may coordinate database state and message publication.

Conceptually:

```text
BEGIN
    update domain state
    insert outbox message
COMMIT

later:
    publish outbox message
```

This ensures that committed state has a durable record of the message that must be published.

---

## Outbox Does Not Make Delivery Exactly Once

The outbox may publish a message more than once if acknowledgement fails.

Consumers should still handle duplicate delivery when required.

---

## Outbox Ownership

An outbox entry should belong to the same transaction and database ownership boundary as the state that produced it.

A generic outbox is infrastructure.

The event semantics remain owned by the producing capability.

---

## Outbox Processing

Outbox processing should define:

```text
claiming
retry
ordering
failure
retention
observability
```

It should not become an unbounded forever-growing table.

---

## Inbox/Outbox Introduction

Orion should not introduce inbox/outbox infrastructure before asynchronous reliability requirements exist.

These patterns are valuable but add complexity.

---

## Saga

A saga coordinates a multi-step workflow across separate transactional boundaries.

Potential example:

```text
create order
    ↓
reserve inventory
    ↓
capture payment
    ↓
schedule shipment
```

Each step may commit independently.

Failure may require compensation.

---

## Compensation

Compensation is a new business action intended to mitigate a previous side effect.

It is not a true rollback.

For example:

```text
payment captured
    ↓
later operation fails
    ↓
refund payment
```

The refund is another external operation that may itself fail.

---

## Compensation Must Be Explicit

A compensating workflow should define:

```text
trigger
idempotency
retry
failure state
manual recovery
```

Do not assume compensation always succeeds.

---

## Saga State

Long-running distributed workflows may require persisted orchestration state.

The design should make incomplete or failed workflows discoverable.

Avoid workflows whose state exists only in transient process memory.

---

## Orchestration vs Choreography

Distributed workflows may be coordinated through:

```text
orchestration
```

or:

```text
event choreography
```

Neither is an Orion default.

Choose according to workflow complexity, coupling, and observability requirements.

---

## Partial Failure

Any operation involving multiple non-atomic systems must define partial failure.

For example:

```text
database commit succeeds
message publish fails
```

or:

```text
payment succeeds
database commit fails
```

These are normal design cases, not impossible anomalies.

---

## Reconciliation

Reconciliation detects and repairs divergent state.

Examples may include:

```text
payment provider says captured
database says pending

storage object exists
database reference missing
```

Reconciliation may be:

```text
scheduled
event-driven
manual
```

depending on risk.

---

## Reconciliation as Safety Net

Reconciliation should not be used to excuse avoidable inconsistency.

It is a recovery mechanism for systems where atomic cross-boundary guarantees are impossible.

---

## Source of Truth

Every distributed workflow should define the authoritative source for each fact.

For example:

```text
payment provider
    → authoritative for external payment settlement

Orion database
    → authoritative for application order state
```

Ambiguous authority makes reconciliation difficult.

---


## Work Claiming

Workers processing shared jobs must coordinate claims.

Potential mechanisms include:

```text
row locks
conditional updates
queue ownership
lease records
```

The chosen mechanism must prevent unintended concurrent processing where the job is not safe to run twice.

---

## Leases

A lease grants temporary processing ownership.

Leases may help recover from crashed workers.

They require explicit semantics for:

```text
expiration
renewal
stale worker
reclaim
```

A lease does not automatically make external effects safe.

---

## Poison Jobs

A job that repeatedly fails should not retry forever.

The system should define:

```text
maximum attempts
dead-letter behavior
failure state
manual recovery
```

Repeated transaction conflicts and business failures should be distinguished.

---

## Queue Ordering

Message order must not be assumed unless the infrastructure and partitioning model actually guarantee it.

If order matters, define:

```text
ordering key
scope
reordering tolerance
```

---

## Event Ordering

Two events may be observed out of order across distributed consumers.

If correctness depends on sequence, the event model may require:

```text
version
sequence number
state check
```

---

## Stale Events

A consumer may receive an older event after newer state has already been processed.

Handlers should determine whether stale events are:

```text
ignored
reconciled
rejected
```

according to domain semantics.

---


## Transactions and Domain Events

If a domain event must be published whenever a durable state change commits, consider transactional event recording such as an outbox.

Do not publish before commit and assume the database will succeed.

---

## Publish Before Commit

Dangerous sequence:

```text
publish OrderCreated
    ↓
database commit fails
```

Consumers may observe an order that never existed durably.

---

## Publish After Commit

Naive sequence:

```text
database commit succeeds
    ↓
process crashes
    ↓
event never published
```

This creates the opposite inconsistency.

Patterns such as an outbox exist to address this gap.

---


## Distributed Scheduling

If multiple application instances run scheduled jobs, the system must determine whether:

```text
each instance runs job
```

or:

```text
only one logical execution occurs
```

Do not assume scheduler libraries coordinate across instances automatically.

---

## Singleton Jobs

A job intended to run once globally may require:

```text
database claim
scheduler ownership
distributed coordination
```

The chosen mechanism should tolerate process crashes.

---

## Cron Overlap

A scheduled task may start again before its previous execution finishes.

The job must define whether overlap is:

```text
allowed
forbidden
coalesced
queued
```

---

## Webhook Concurrency

Providers may deliver:

```text
same webhook multiple times
different events concurrently
events out of order
```

Webhook handlers should be designed accordingly.

---

## User Double Submission

Users may click or submit the same action multiple times.

The UI may disable a button.

This is not a concurrency guarantee.

The server must protect non-repeatable operations independently.

---

## Network Retry

Clients, proxies, SDKs, and infrastructure may retry requests automatically.

Server-side design must not assume:

```text
one request sent
    =
one request received
```

for non-idempotent operations.

---

## Timeout Ambiguity

A timeout does not necessarily mean an operation failed.

Example:

```text
client sends payment request
provider processes payment
response times out
```

The caller now does not know whether the payment happened.

Idempotency and reconciliation are required to resolve this ambiguity safely.

---

## Unknown Outcome

Some failures produce an unknown outcome rather than a known failure.

This distinction is important.

For example:

```text
connection closed after request sent
```

may mean:

```text
operation failed
```

or:

```text
operation succeeded but response was lost
```

Error models should preserve this distinction where it affects retry safety.

---

## Retryable Does Not Mean Safe to Retry

A transport failure may be technically retryable but the business operation may not be safe to repeat.

Retry policy must consider:

```text
operation semantics
idempotency
unknown outcome
```

not just error category.

---

## Side-Effect Classification

Operations may be classified conceptually as:

```text
read-only
idempotent write
non-idempotent write
externally side-effecting
```

This classification can inform retries and concurrency behavior.

A formal type system is not required initially.

---


## Application Retry Boundary

Application-level retries around broader operations must not accidentally repeat:

```text
email
payment
external mutation
```

unless those effects are idempotent.

---

## Retry Ownership

Only one layer should normally own retry behavior for a given failure.

Avoid:

```text
database library retries
repository retries
service retries
HTTP client retries
```

stacking unknowingly and creating dozens of attempts.

---

## Retry Multiplication

If:

```text
outer layer retries 3 times
inner layer retries 3 times
```

the external system may see up to nine attempts.

Retry composition must be understood.

---


## Versioned Events

Events may include an aggregate version to detect:

```text
duplicate event
stale event
out-of-order event
```

This can be useful in event-driven projections.

It is not necessary for every event.

---


## Idempotency Tests

Important idempotent operations should verify:

```text
first request performs side effect
duplicate request does not repeat side effect
same idempotency key returns compatible result
different payload with same key rejected when required
```

---

## Duplicate Event Tests

Message consumers should test duplicate delivery when at-least-once semantics apply.

---

## Out-of-Order Event Tests

Consumers that depend on ordering should test stale or reordered messages.

---

## Retry Tests

Retries should test:

```text
transient failure retried
permanent failure not retried
attempt limit respected
side effects not duplicated
```

---


## Reconciliation Tests

If reconciliation exists, test divergent states deliberately.

Example:

```text
external payment = captured
internal payment = pending
    ↓
reconciliation repairs internal state
```

---

## Operational Recovery Tests

High-risk workflows may require testing manual recovery or replay procedures.

This is particularly important for:

```text
dead-letter queues
failed sagas
stuck migrations
```

---


## After-Commit Work

An `afterCommit` callback does not guarantee an external side effect will occur.

The process may crash after commit but before callback completion.

For required durable side effects, persist intent.

---

## Transactional Outbox vs After-Commit Callback

Conceptually:

```text
afterCommit callback
    → best effort in current process
```

while:

```text
transactional outbox
    → durable intent to publish later
```

These provide different guarantees.

---


## Queue Visibility Timeout

Queue systems may redeliver work when processing exceeds a visibility timeout or lease.

Workers should account for:

```text
long processing
lease renewal
duplicate execution
```

---

## Graceful Shutdown

Workers should stop accepting or claiming new work during shutdown and complete or safely release in-flight work according to queue semantics.

Abrupt shutdown should not silently lose claimed work.

---

## Process Crash

Concurrency design must tolerate process failure at arbitrary points.

Ask:

```text
What if the process dies immediately after this durable write?

What if it dies immediately before acknowledgement?

What if it dies after external side effect but before local state update?
```

These questions reveal distributed consistency gaps.

---

## Failure Windows

For important workflows, identify failure windows explicitly.

Example:

```text
database commit
    ↓
CRASH WINDOW
    ↓
message publish
```

A reliability pattern should address the window if losing the message is unacceptable.

---


## New Retry Checklist

Before adding retries, answer:

1. Which failure category is retried?
2. Why is it transient?
3. Is the operation safe to repeat?
4. Could the previous attempt have succeeded?
5. Is an idempotency mechanism required?
6. How many attempts are allowed?
7. Does another layer already retry?
8. What telemetry identifies attempts?
9. What happens after final failure?

---

## New Idempotency Checklist

Before adding idempotency, answer:

1. What logical operation does the key identify?
2. Who generates the key?
3. What is its scope?
4. Where is it stored?
5. What durable constraint prevents duplicates?
6. What happens if payload differs?
7. What result is returned on replay?
8. How long is the key retained?
9. What happens during concurrent first attempts?
10. How is behavior tested?

---

## New Distributed Workflow Checklist

Before implementing a workflow across multiple systems, answer:

1. Which system owns each fact?
2. Which state changes are atomic?
3. Which state changes are not atomic?
4. What partial failures are possible?
5. Which operations are idempotent?
6. How are duplicates handled?
7. How are retries handled?
8. Is compensation required?
9. Is reconciliation required?
10. How is incomplete state discovered?
11. What happens after process crash?
12. What operational recovery exists?

---
