# Logging

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0004](../adr/0004-select-fastify-as-the-backend-http-framework.md), [ADR-0010](../adr/0010-establish-observability-logging-tracing-metrics-and-error-reporting-strategy.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Structured Logging](#structured-logging)
- [Field Naming](#field-naming)
- [Correlation Identifiers](#correlation-identifiers)
- [Redaction Tests](#redaction-tests)
- [New Log Event Checklist](#new-log-event-checklist)

Related policy: [telemetry redaction](../security/telemetry-redaction.md), [data retention](../security/data-retention.md).

## Purpose

This document defines the logging principles used by Orion.

Its goals are to ensure that logs are:

- structured;
- useful for diagnosis;
- safe;
- correlated across operations;
- low-noise;
- consistent;
- machine-readable;
- understandable by humans and AI agents;
- appropriate for production environments;
- distinct from audit, metrics, traces, and error-reporting concerns.

Logs are operational evidence.

They should help answer:

```text
What happened?

Where did it happen?

Which operation was involved?

Which safe identifiers correlate the event?

Was the outcome expected?

What should be investigated next?
```

Logs must not become uncontrolled dumps of application state.

This document is technology-agnostic.

ADR-0010 selects Pino, production JSON output, and correlation fields. Collection/storage providers and retention remain deployment-specific; logging infrastructure is not implemented.

This document complements:

- [docs/reliability/observability.md](observability.md);
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md);
- [docs/security/data-classification.md](../security/data-classification.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md);
- [docs/api/error-contract.md](../api/error-contract.md).

---

## Core Principle

Logs should record meaningful operational events as structured data.

The desired model is:

```text
runtime event
    ↓
semantic log event
    ↓
safe structured fields
    ↓
collector
    ↓
search / correlation / investigation
```

Prefer:

```text
event + context
```

over:

```text
arbitrary text dump
```

---

## Logs Are Evidence

Logs exist to support investigation.

They are not:

```text
business database
audit ledger
analytics warehouse
debug scratchpad
error tracker
metrics system
```

A log event should have a clear operational purpose.

---

## Structured Logging

Production logs should be structured.

Conceptually:

```json
{
  "level": "info",
  "event": "order.cancelled",
  "request_id": "req_...",
  "trace_id": "trace_...",
  "orderId": "ord_...",
  "durationMs": 24
}
```

Production-oriented Pino logs use structured JSON under ADR-0010; local development may use pretty output.

Structured logs enable:

```text
search
filtering
aggregation
correlation
AI analysis
```

without parsing arbitrary sentence formats.

---

## Human-Readable Messages

Structured logs may include a concise human-readable message.

Example:

```text
message: "Order cancellation completed."
```

The message is supplementary.

Operational queries should rely primarily on stable structured fields.

---

## Event Name

Important log entries should use a stable semantic event name.

Examples:

```text
http.request.completed
order.cancelled
payment.provider.failed
job.retry.scheduled
database.migration.completed
```

Event names should describe what happened.

---

## Event Naming

Event names should follow one consistent convention.

A conceptual format is:

```text
<area>.<subject>.<event>
```

Examples:

```text
auth.session.revoked
orders.cancellation.failed
worker.job.completed
```

The exact convention may be simplified once actual applications exist.

Consistency matters more than the specific separator.

---

## Event Names Are Semantic

Avoid event names tied to implementation details.

Bad:

```text
OrderServiceMethod3Finished
```

Better:

```text
order.cancelled
```

The event should survive ordinary refactoring.

---

## Stable Event Names

If dashboards, alerts, searches, or runbooks depend on an event name, changing it becomes an operational compatibility concern.

Do not rename established event names casually.

---

## Log Fields

Log fields should carry structured context.

Potential common fields include:

```text
timestamp
level
event
message
service
environment
release
request_id
trace_id
span_id
errorId
actorId
tenantId
operation
durationMs
result
```

Not every field belongs on every event.

---

## Field Naming

Field names should be consistent across applications.

Avoid:

```text
request_id
requestId
reqId
request
```

all representing the same concept.

ADR-0010 selects `request_id`, `trace_id`, and `span_id`, with `trace_flags` when useful. These are logging/telemetry fields; public API field names remain a separate contract.

---

## Stable Field Semantics

A field name must preserve one meaning.

For example:

```text
userId
```

should not mean:

```text
authenticated actor
```

in one service and:

```text
resource owner
```

in another.

Use semantically precise names.

---

## Correlation Identifiers

Logs should use correlation identifiers defined by Orion observability.

Potential identifiers include:

```text
request_id
trace_id
span_id
errorId
jobId
eventId
releaseId
```

These identifiers help connect evidence across systems.

---

## Request ID

`request_id` identifies one incoming request boundary.

It can correlate:

```text
request start
application operation
dependency call
response
error
```

where tracing is unavailable or supplementary.

---

## Trace ID

`trace_id` identifies a distributed trace.

Logs emitted inside traced operations should include it automatically where practical.

Do not require developers to manually pass trace IDs through every function.

---

## Span ID

`span_id` may identify the active trace span.

It is useful for precise correlation but may not be necessary in every log storage system.

---

## Error ID

Unexpected errors may have an `errorId` linking logs with centralized error-reporting records.

The identifier must remain opaque and safe.

---

## Job ID

Background work should include a stable job identifier when available.

This helps correlate:

```text
claim
attempt
retry
completion
failure
```

---

## Event ID

Asynchronous event processing may include a stable event or message identifier.

This is useful for diagnosing duplicate delivery and processing.

---

## Release Metadata

Logs should make it possible to determine which deployed release produced an event.

Useful metadata may include:

```text
service
release
deployment
environment
```

Exact fields depend on deployment architecture.

---

## Environment

Logs should identify the environment.

Examples may include:

```text
development
test
staging
production
```

Environment names must not become arbitrary business behavior switches.

---

## Service or Application Name

Every log event should be attributable to a producing runtime.

Potential examples:

```text
api
worker
web-server
```

The exact service naming convention will depend on actual applications.

---

## Operation

Where useful, logs should identify the semantic operation.

Examples:

```text
orders.cancel
users.register
reports.generate
```

This can correlate logs, traces, errors, and metrics.

---

## Result

A bounded result field may classify operation outcome.

Potential values:

```text
success
failure
denied
cancelled
retry
```

The vocabulary should remain bounded.

Avoid arbitrary result strings.

---

## Duration

Operations with meaningful latency may include:

```text
durationMs
```

or another standardized unit.

Units must be explicit in field names or schema.

---

## High-Cardinality Fields

Logs may contain high-cardinality identifiers when operationally useful.

Unlike metric labels, logs are naturally suited to identifiers such as:

```text
request_id
orderId
jobId
```

Data classification still applies.

---

## Sensitive Identifiers

Even identifiers may be sensitive.

For example:

```text
email
phone
IP address
external account number
```

should not be used casually as log correlation keys.

Prefer opaque internal identifiers where possible.

---

## Data Classification Applies to Logs

Logs are data stores.

Every logged value remains subject to:

- [docs/security/data-classification.md](../security/data-classification.md)

Logging a value does not lower its classification.

---

## Restricted Data

`RESTRICTED` data must never be intentionally logged.

Examples include:

```text
password
password hash
session token
access token
refresh token
API secret
private key
database credential
recovery code
```

This prohibition applies across all environments.

---

## Confidential Data

`CONFIDENTIAL` data should not be logged by default.

If specific confidential identifiers are operationally necessary, collection must be minimized and justified.

Prefer opaque internal identifiers.

---

## User Content

Free-form user content must not be logged by default.

Examples:

```text
message body
document content
uploaded file content
support text
```

User content may contain arbitrary secrets or personal information.

---

## Request Bodies

Complete request bodies must not be logged by default.

This applies even in development unless a safe explicit diagnostic workflow exists.

Request bodies may contain:

```text
credentials
personal data
financial data
user content
```

---

## Response Bodies

Complete API responses must not be logged by default.

Responses may contain confidential information even when requests do not.

---

## Headers

HTTP headers must use an allowlist if logged.

Never log sensitive headers such as:

```text
Authorization
Cookie
Set-Cookie
Proxy-Authorization
```

---

## Query Strings

Complete URLs or query strings should not be logged by default.

Query parameters may contain:

```text
tokens
emails
search terms
personal data
```

Prefer route templates and explicit safe query metadata.

---

## Route Templates

For HTTP requests, log:

```text
/orders/{orderId}
```

rather than:

```text
/orders/ord_123
```

when the raw identifier is not necessary.

This also improves aggregation.

---

## Database Parameters

Raw SQL bind parameters must not be logged by default.

They may contain sensitive values.

Database observability should prefer:

```text
operation
table
normalized statement
duration
```

where safe.

---

## SQL Statements

Even SQL text may reveal schema details or embedded literals.

If SQL logging exists, parameterization and redaction must be reviewed.

Raw SQL logging should not be globally enabled in production casually.

---

## Configuration Logging

Applications must never log complete configuration objects.

A safe startup summary may include:

```text
environment
feature mode
safe provider selection
```

through explicit allowlisted fields.

---

## Environment Variables

Never dump complete environment variables to logs.

Environment variables frequently contain credentials and infrastructure secrets.

---

## Exceptions

Exception logging requires care.

An exception object may contain:

```text
request input
provider response
SQL
configuration
filesystem path
credentials
```

Error serialization should use centralized safe handling.

---

## Stack Traces

Stack traces are appropriate for trusted internal diagnostics of unexpected failures.

They must not be exposed publicly.

They should be captured by the authoritative error-reporting boundary rather than repeated in many log events.

---

## Automatic Object Serialization

Avoid:

```text
logger.info({ user })
logger.error({ request })
logger.debug({ config })
```

when the complete object has not been explicitly approved for telemetry.

Prefer explicit safe projections.

---

## Explicit Projections

Prefer:

```text
logger.info({
    event: "order.cancelled",
    orderId: order.id,
    actorId: actor.id
})
```

over logging the complete `order` or `actor`.

---

## Default-Deny Telemetry

When uncertain whether a field is safe to log, omit it.

Telemetry usefulness does not override confidentiality.

---

## Redaction

Logging infrastructure should apply centralized redaction as defense in depth.

This policy is defined in:

- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

Application code should still avoid creating unsafe events in the first place.

---

## Redaction Is Not Permission to Log Everything

Do not intentionally log complete sensitive payloads because:

```text
the logger will redact them
```

Redaction can fail.

Safe event design comes first.

---

## Logging Levels

Logging levels should have consistent semantics.

A conceptual set is:

```text
trace
debug
info
warn
error
fatal
```

The selected logging framework may use different names.

---

## Trace Level

`trace` is for highly detailed diagnostic information.

It should be:

```text
rare
disabled in normal production operation
safe even when enabled
```

Trace-level logging must still follow data-classification rules.

---

## Debug Level

`debug` is for diagnostic context useful during investigation but too verbose for routine production use.

Examples may include:

```text
safe decision path
cache decision
bounded internal state category
```

Debug logs must not contain secrets.

---

## Info Level

`info` represents meaningful normal operational events.

Examples:

```text
application started
deployment activated
background job completed
important business workflow completed
```

Not every successful function call deserves an `info` log.

---

## Warn Level

`warn` represents unexpected or degraded behavior that does not necessarily mean the operation failed.

Examples:

```text
deprecated configuration used
retry required
fallback path used
dependency latency unusually high
```

Warnings should be actionable or meaningful.

---

## Error Level

`error` represents failed operations or unexpected conditions requiring investigation.

Examples:

```text
required dependency failed
unexpected application error
job permanently failed
```

Expected user mistakes should not automatically use `error`.

---

## Fatal Level

`fatal` represents failure that prevents the process from continuing safely.

Examples:

```text
invalid critical startup configuration
corrupted mandatory runtime state
```

After a fatal event, process termination is generally expected.

---

## Level Is Not HTTP Status

A `404` response is not automatically a warning.

A `403` is not automatically an error.

A `500` may warrant error reporting.

Log level should reflect operational significance, not transport code mechanically.

---

## Level Is Not Business Importance

A large financial transaction succeeding is not necessarily an `error` or `warn`.

Level reflects operational condition, not monetary or business value.

---

## Avoid Level Inflation

If everything is:

```text
warn
```

or:

```text
error
```

then those levels stop being meaningful.

Routine expected conditions should use appropriate lower levels or no log at all.

---

## Expected Failures

Expected failures often do not require individual warning or error logs.

Examples:

```text
validation rejected
login credentials invalid
authorization denied
resource not found
```

They may instead contribute to:

```text
metrics
security monitoring
audit
```

depending on context.

---

## Unexpected Failures

Unexpected failures should reach the authoritative error boundary.

The boundary should:

```text
capture error
attach safe context
assign correlation/error identifiers
report once
```

Duplicate logs should be avoided.

---

## Report Once

A failure should normally be logged or reported at one authoritative layer.

Avoid:

```text
database layer logs
    ↓
repository logs
    ↓
service logs
    ↓
controller logs
    ↓
global handler logs
```

for the same exception.

This produces noise without new information.

---

## Add Context Without Duplicate Failure Logging

Intermediate layers may enrich errors before rethrowing or translating them.

They should not log the same failure merely because they saw it.

---

## Boundary Logging

Good logging boundaries include:

```text
incoming request completion
background job completion
external dependency interaction
process lifecycle
unexpected error boundary
```

Avoid logging every internal method transition.

---

## Request Logging

An API runtime may log request completion.

A useful event may include:

```text
event: http.request.completed
method
route
status
durationMs
request_id
trace_id
```

and safe bounded context.

---

## Request Start Logging

Logging both request start and request completion doubles volume.

Request-start logs should be added only if they provide concrete diagnostic value.

Completion logs are usually more useful because they include result and duration.

---

## Successful Request Logging

Whether every successful request is logged depends on:

```text
traffic volume
cost
diagnostic needs
tracing coverage
```

High-volume systems may sample or rely more heavily on traces/metrics.

---

## Failed Request Logging

Expected client errors should not produce noisy stack traces.

Unexpected request failures should correlate with centralized error reporting.

---

## Background Job Logging

Jobs should log meaningful lifecycle transitions.

Potential events:

```text
job.started
job.retry.scheduled
job.completed
job.failed
```

Include:

```text
jobId
jobType
attempt
duration
```

where safe.

---

## Worker Lifecycle

Workers may log:

```text
worker.started
worker.stopping
worker.stopped
```

Process lifecycle logging helps diagnose deployment and shutdown issues.

---

## Job Payloads

Do not log complete job payloads.

Log safe identifiers and operation metadata.

---

## Event Consumer Logging

Message consumers may log:

```text
eventId
eventType
consumer
attempt
result
duration
```

Avoid logging full event bodies.

---

## Duplicate Messages

Expected duplicate detection should not necessarily produce warnings.

If duplicates are normal under at-least-once delivery, treat them as expected operational behavior.

---

## Dependency Logging

Outbound dependency calls may log or trace:

```text
provider
operation
duration
result
safe provider code
```

Do not log credentials or full payloads.

---

## Provider Naming

Provider names may be useful operational dimensions if the set is bounded.

For example:

```text
provider: payment_primary
```

Avoid leaking provider-specific internal details in public errors.

Internal telemetry may remain provider-aware.

---

## Dependency Failures

Dependency errors should be logged at the boundary that owns the integration or captured through tracing/error reporting.

Avoid both adapter and caller logging identical failures.

---

## Database Logging

Database telemetry should prioritize:

```text
duration
operation type
safe table/resource context
retry/conflict category
```

rather than row content.

---

## Migration Logging

Migration logs should include:

```text
migrationId
release
start
completion
duration
result
```

following:

- [docs/database/migrations.md](../database/migrations.md)

---

## Startup Logging

Application startup should provide concise safe evidence.

Potential events:

```text
application.starting
application.started
application.startup_failed
```

Safe metadata may include:

```text
service
release
environment
```

---

## Startup Configuration

Startup logs may indicate:

```text
configuration valid
database connectivity initialized
provider adapter selected
```

but must not include raw credentials or complete configuration.

---

## Shutdown Logging

Graceful shutdown should be visible.

Potential events:

```text
application.shutdown_started
application.shutdown_completed
```

This helps diagnose:

```text
deployment termination
stuck workers
incomplete draining
```

---

## Health Check Logging

Successful health checks should not normally generate one log per request.

They can create enormous low-value volume.

Failures or state changes may be logged where operationally useful.

---

## Polling Endpoints

Other high-frequency polling endpoints may require reduced or sampled logging.

Logging policy should consider signal-to-noise ratio.

---

## Audit Logs

Audit logs are distinct from diagnostic logs.

Audit logs answer questions such as:

```text
Who changed this privileged setting?

Who exported this confidential data?

Who assigned this role?
```

They may have stronger integrity and retention requirements.

---

## Diagnostic Logs vs Audit Logs

Diagnostic log:

```text
provider call timed out
```

Audit log:

```text
administrator granted billing-admin role to user
```

These should not be treated as the same data stream by default.

---

## Audit Logs Must Also Be Safe

Audit requirements do not permit secret exposure.

Audit records must still follow classification and redaction policy.

---

## Business Events

Business/domain events are not diagnostic logs.

For example:

```text
OrderCancelled
```

may be a durable business event.

```text
order.cancelled
```

may also exist as a diagnostic log event.

Their purpose and guarantees differ.

---

## Metrics

Metrics are for numeric aggregation over time.

Examples:

```text
request count
latency distribution
error count
queue depth
```

Do not rely on logs as the only source for important operational metrics when dedicated metrics are appropriate.

---

## Logs vs Metrics

Logs answer:

```text
What happened to this specific operation?
```

Metrics answer:

```text
How often is this happening?
```

Both may originate from the same operation.

They serve different investigative modes.

---

## Traces

Traces describe causal execution across boundaries.

Logs complement traces with discrete semantic events.

Avoid duplicating every trace span as a log entry.

---

## Logs vs Traces

Trace:

```text
HTTP request
    → database
    → payment provider
```

Log:

```text
payment retry exhausted
```

Traces provide topology and timing.

Logs provide selected semantic evidence.

---

## Error Reporting

Centralized error reporting captures unexpected failures with:

```text
stack trace
cause chain
release
trace correlation
safe runtime context
```

This differs from ordinary logs.

---

## Logs vs Error Reporting

Do not rely solely on:

```text
logger.error(exception)
```

when a dedicated error tracker provides better grouping and diagnostics.

Likewise, not every error log belongs in the error tracker.

---

## Logging and Alerting

Alerts should not generally be triggered from arbitrary textual log searches when stronger structured metrics or error signals exist.

Log-based alerts may be appropriate for specific discrete events.

---

## Log Searchability

Important operational fields should be indexed or otherwise searchable in the selected logging system where practical.

Typical searches may include:

```text
request_id = ...
trace_id = ...
errorId = ...
jobId = ...
operation = ...
```

---

## Cardinality and Cost

Logs have storage and indexing cost.

High-volume logs should justify their value.

Avoid logging repeated low-value events merely because it is easy.

---

## Sampling

High-volume successful events may be sampled.

Sampling should not apply blindly to:

```text
errors
security events
rare failures
migration events
```

where complete visibility may matter.

---

## Deterministic Sampling

Where sampling is used, deterministic sampling based on trace or request ID may improve correlation across systems.

The exact implementation is deferred.

---

## Dynamic Log Levels

Runtime log-level changes may be useful during incidents.

This capability introduces risk.

Any dynamic mechanism should be:

```text
authorized
auditable where appropriate
time-limited
safe
```

It must not enable secret logging.

---

## Debug Mode

A production debug mode must not:

```text
disable redaction
dump request bodies
dump environment variables
expose stack traces publicly
```

More verbosity does not weaken security policy.

---

## Emergency Diagnostics

Incident response may require additional diagnostic telemetry.

Even during incidents:

```text
RESTRICTED data must not be intentionally logged
```

Safe temporary diagnostics should have explicit scope and removal.

---

## Local Development

Development logs may be more human-readable.

However, development code should use the same semantic structured fields where practical.

This helps avoid production-only logging defects.

---

## Production-Like Logging in Tests

Integration tests may validate structured logs and redaction.

Test infrastructure should be able to inspect emitted events without depending on the production logging vendor.

---

## Test Logging

Automated tests should avoid noisy logs during successful execution.

Failures may surface relevant captured logs.

Do not make CI output unreadable with routine application logging.

---

## Redaction Tests

Logging infrastructure should include tests proving that sensitive values are removed or blocked.

Examples should include:

```text
Authorization header
password
session token
API key
database URL
```

with synthetic values.

---

## Semantic Logging Tests

Important logging behavior may have tests when it protects:

```text
correlation
security
incident diagnosis
audit separation
```

Do not test every ordinary log message.

---

## Log Schema

Orion should eventually define a common structured log schema.

Possible required fields may include:

```text
timestamp
level
event
service
environment
release
```

with optional correlation fields.

The exact schema is deferred until logging infrastructure exists.

---

## Schema Evolution

Log schema may evolve.

Fields used by dashboards, alerts, or automated analysis should be treated as operational contracts.

Avoid silent field-name changes that break investigations.

---

## Reserved Fields

Common platform fields should eventually be reserved.

Applications should not redefine fields such as:

```text
trace_id
request_id
level
service
event
```

with different semantics.

---

## Custom Fields

Domain-specific logs may add custom fields.

Names should be explicit and avoid collision with common observability fields.

---

## Typed Logging

If the selected language supports it effectively, critical event shapes may use typed helpers or schemas.

For example:

```text
logOrderCancelled({
    orderId,
    actorId,
    durationMs
})
```

This can improve field consistency and redaction.

Do not create a rigid custom type for every trivial log event unless it provides value.

---

## Logging Abstraction

Shared logging infrastructure should provide:

```text
structured emission
context enrichment
redaction
correlation
provider integration
```

Domain code should not depend on a specific logging vendor.

---

## Vendor Isolation

Vendor-specific logging APIs should remain near observability infrastructure where practical.

Application code should emit Orion semantic logging concepts.

---

## Logger Injection

A logger may be injected or made available through safe runtime context.

The exact mechanism is deferred.

Avoid unrestricted global mutable logging context.

---

## Context Enrichment

Infrastructure may enrich log events automatically with:

```text
service
environment
release
request_id
trace_id
```

Application code should not manually repeat these fields everywhere.

---

## Child Loggers

Scoped or child loggers may attach stable context such as:

```text
jobId
operation
```

This can reduce repeated boilerplate.

Context must remain safe.

---

## Context Lifetime

Context from one request or job must never leak into another.

This is particularly important with:

```text
async-local storage
thread-local storage
worker reuse
```

Testing should detect context leakage when such mechanisms are used.

---

## Logging Libraries

Use mature structured logging infrastructure.

Do not build a custom logging system unless a real requirement cannot be satisfied otherwise.

---

## Console Logging

Direct arbitrary console output such as:

```text
console.log(...)
```

or language equivalents should generally be prohibited in production runtime code once the canonical logger exists.

Tooling scripts may have different requirements.

---

## Standard Output

Containerized or cloud runtimes may emit structured logs through standard output.

The transport mechanism does not change the semantic logging policy.

---

## Multi-Line Logs

Structured logs should avoid uncontrolled multi-line output.

Stack traces may be represented specially by the logging/error-reporting infrastructure.

Multi-line arbitrary strings are difficult to parse and search.

---

## Logging Collections

Avoid logging entire arrays or collections.

Prefer bounded metadata such as:

```text
itemCount: 47
```

and safe identifiers only when necessary.

---

## Large Objects

Logging systems should enforce reasonable event-size limits.

Oversized events may:

```text
increase cost
be truncated
cause exporter failure
expose excessive data
```

---

## Truncation

If strings may be logged, safe length limits should apply.

Truncation must not accidentally expose the most sensitive part of a credential.

Restricted values should be removed entirely, not truncated.

---

## Hashing

Hashing sensitive data is not automatically safe.

A hash of:

```text
email
phone
small-domain identifier
```

may remain linkable or reversible through guessing.

Use hashing only when the privacy model explicitly permits it.

---

## Pseudonymous Identifiers

Opaque internal identifiers are generally preferable to personal identifiers for correlation.

For example:

```text
userId: usr_...
```

may be preferable to:

```text
email: person@example.com
```

---

## IP Addresses

IP addresses may be personal data.

Logging them should be justified by:

```text
security
fraud prevention
operations
```

and subject to retention and minimization policies.

---

## User Agent

User-agent strings may be useful for diagnostics.

They can also be high-cardinality and privacy-relevant.

Collect only when useful.

---

## Device Information

Device model, OS, application version, and similar fields may help client diagnostics.

They should be bounded and minimized.

---

## Geographic Data

Precise location data should not be logged by default.

If coarse location is operationally required, classification and minimization still apply.

---

## Logging Business State

Avoid logging business state merely for analytics.

Operational logs should capture enough state to diagnose behavior.

Business analytics belongs in dedicated data systems when needed.

---

## State Transition Logs

Important lifecycle transitions may justify semantic logs.

Example:

```text
event: order.state_changed
fromState: pending
toState: cancelled
```

only if the event is operationally useful and does not duplicate a canonical audit or event stream unnecessarily.

---

## Error Codes in Logs

When an operation fails with a stable application error, logs may include:

```text
errorCode
```

This is preferable to using the human-readable error message as a query dimension.

---

## Provider Error Codes

Safe provider reason codes may be captured internally when useful.

They should remain distinct from Orion public error codes.

Example:

```text
providerCode
errorCode
```

---

## Log Message Stability

Human-readable log messages are not stable contracts.

Dashboards and alerts should depend on structured fields or event names rather than exact sentence text.

---

## Localization

Operational logs should use English.

Logs are repository/runtime engineering artifacts, not localized product content.

---

## Logging Ownership

Cross-cutting logging infrastructure owns:

```text
schema
transport
redaction
correlation
provider integration
```

Domain/application code owns:

```text
which meaningful events should be logged
which domain-safe fields provide diagnostic value
```

---

## Missing Logs

A production failure that cannot be diagnosed because required context is absent may indicate an observability defect.

The solution should be to add targeted evidence, not indiscriminate logging.

---

## Excessive Logs

Too much logging is also a defect.

It can cause:

```text
higher cost
slower investigation
sensitive-data exposure
signal dilution
```

Logging should optimize signal.

---

## Logging During Incident Review

When an incident reveals missing evidence, add the smallest reliable telemetry that would make the failure diagnosable next time.

This may be:

```text
log
metric
trace attribute
error context
```

depending on the question.

---

## Runbook Integration

Runbooks may reference known log events or fields.

Example:

```text
Search:
event = payment.provider.failed
trace_id = <trace>
```

Stable structured fields improve runbook reliability.

---

## AI Agent Requirements

AI agents should treat logging as a deliberate observability interface.

Before adding a log, an agent should ask:

```text
What operational question does this answer?

Is this already observable through a trace, metric, or error report?

Is the data safe?

Is the event likely to create noise?
```

---

## AI and Sensitive Data

An AI agent must not log complete objects merely for debugging.

It should construct an explicit safe projection.

---

## AI and Error Logging

An AI agent should inspect existing error boundaries before adding:

```text
logger.error(...)
```

to avoid duplicate reporting.

---

## AI and Levels

An AI agent should not use `warn` or `error` merely because an operation returned an expected negative outcome.

Operational severity must be considered.

---

## AI and Correlation

When adding runtime boundaries such as:

```text
request handler
worker
event consumer
```

an AI agent should ensure safe correlation context is propagated where architecture supports it.

---

## AI and Logging Tests

Changes to redaction, correlation, or security-sensitive logging should include tests.

Ordinary message wording changes usually do not require dedicated tests.

---

## AI and Console Statements

Once canonical logging exists, AI agents should not introduce ad hoc console statements into runtime application code.

Temporary debugging output must not survive completed changes.

---

## New Log Event Checklist

Before adding a production log event, answer:

1. What operational question does it answer?
2. What is the stable event name?
3. Which level is appropriate?
4. Which fields are necessary?
5. Are any fields sensitive?
6. Can opaque identifiers replace personal data?
7. Is the same information already available through traces, metrics, or error reporting?
8. Could the event create excessive volume?
9. Does it duplicate another layer's error logging?
10. Will humans and AI agents know how to interpret it?

---

## New Log Field Checklist

Before adding a log field, answer:

1. What does the field mean?
2. Is the name consistent with existing telemetry?
3. What is its classification?
4. Is it operationally necessary?
5. Is it bounded?
6. Is it high cardinality?
7. Is there a safer identifier?
8. Does it belong in logs rather than metrics or audit?
9. What is its unit or value vocabulary?
10. Can it be automatically enriched instead?

---

## Error Logging Checklist

Before logging an error, answer:

1. Is the failure expected or unexpected?
2. Which layer owns reporting?
3. Has another layer already reported it?
4. Does centralized error reporting capture it?
5. Which stable error code applies?
6. What safe identifiers are required?
7. Could exception serialization expose sensitive data?
8. Should the event be `warn`, `error`, or not logged individually?
9. Is a metric or audit event also required?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Logging Complete Request Bodies

Prohibited by default.

---

### Logging Complete Response Bodies

Prohibited by default.

---

### Logging Authorization Headers or Cookies

Prohibited.

---

### Logging Secrets

Prohibited.

---

### Logging Full Configuration

Prohibited.

---

### Logging Full Environment

Prohibited.

---

### Logging Complete Domain Objects

Avoid.

---

### Logging Complete ORM Records

Avoid.

---

### Error Logged at Every Layer

Avoid.

---

### Every 4xx Logged as Warning

Avoid.

---

### Every Exception Logged as Error Without Classification

Avoid.

---

### Alerts Based on Message Text

Avoid when structured event fields exist.

---

### Metrics Derived Only From Text Parsing

Avoid.

---

### Business Analytics Implemented Through Diagnostic Logs

Avoid.

---

### Health-Check Success Logged Per Request

Avoid.

---

### Debug Mode Disables Redaction

Prohibited.

---

### Arbitrary Console Logging in Runtime Code

Avoid once canonical logging infrastructure exists.

---

### Unbounded Objects or Collections in Logs

Avoid.

---

### Personal Data Used as Correlation Key

Avoid when opaque identifiers exist.

---

## Initial Logging Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Production logs should be structured.
2. Important events should use stable semantic event names.
3. Common correlation fields should use consistent names.
4. Logs must follow data-classification and telemetry-redaction policy.
5. `RESTRICTED` data must never be intentionally logged.
6. Complete request and response bodies must not be logged by default.
7. Complete configuration and environment values must not be logged.
8. Applications should log explicit safe projections rather than arbitrary objects.
9. Expected business, validation, authentication, and authorization failures should not automatically become error-level logs.
10. Unexpected failures should be reported once at an authoritative boundary.
11. Human-readable log messages must not be treated as machine contracts.
12. Logs, audit logs, metrics, traces, and error reporting are distinct observability mechanisms.
13. High-volume logging must be justified by diagnostic value.
14. Health-check success and similar high-frequency low-value events should not generate routine logs.
15. Background work should expose safe job/message correlation identifiers.
16. Log-level semantics should remain consistent across applications.
17. Logging infrastructure should enrich common runtime context automatically where practical.
18. Redaction and context-isolation behavior must be tested.
19. AI agents must not introduce logging without considering signal, duplication, and data sensitivity.
20. Log schema and redaction should become mechanically enforceable where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
additional common field names beyond ADR-0010 correlation fields
event naming convention
log collector
storage provider
retention
sampling
dynamic log-level mechanism
context propagation implementation
CI logging checks
```

These choices should follow the selected runtime stack, deployment platform, and observability provider.

Significant choices should be captured through ADRs.

---

## Future Documentation

This document should be complemented by:

- [docs/reliability/tracing.md](tracing.md)
- [docs/reliability/metrics.md](metrics.md)
- [docs/reliability/error-reporting.md](error-reporting.md)
- [docs/reliability/health-checks.md](health-checks.md)
- [docs/reliability/alerting.md](alerting.md)
- [docs/security/production-access.md](../security/production-access.md)
- [docs/security/data-retention.md](../security/data-retention.md)

Provider-specific logging configuration should be documented only after the observability stack is selected.

---

## Summary

Logs are structured operational evidence.

The intended model is:

```text
meaningful runtime event
        ↓
safe semantic fields
        ↓
correlation
        ↓
structured storage
        ↓
investigation
```

Orion prefers:

```text
structured events over arbitrary text

stable event names over message parsing

explicit safe fields over object dumps

opaque identifiers over personal data

one authoritative error report over duplicate logging

signal over volume

logs for evidence, metrics for aggregation, traces for causality, audit for accountability
```

A log entry should exist because it answers an operational question.

It should not exist merely because the application can print something.

A production logging system should make failures easier to understand without making sensitive data easier to expose.
