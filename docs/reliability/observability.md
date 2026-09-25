# Observability

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0010](../adr/0010-establish-observability-logging-tracing-metrics-and-error-reporting-strategy.md). Accepted choices are distinct from implemented tooling.

The current API [initializes Pino and OpenTelemetry](../../apps/api/src/main.ts) before composing Fastify; its [runtime guide](../../apps/api/README.md) and [telemetry-redaction tests](../../apps/api/test/telemetry.test.ts) show the implemented boundary. A collector, dashboard, alert owner, and production service objectives remain conditional.

## Read for this change

- [Observability Signals](#observability-signals)
- [Telemetry Correlation](#telemetry-correlation)
- [Testing Observability](#testing-observability)
- [Initial Observability Requirements](#initial-observability-requirements)

Related policy: [logging](logging.md), [tracing](tracing.md), [metrics](metrics.md), [error reporting](error-reporting.md), [health checks](health-checks.md), [alerting](alerting.md), [telemetry redaction](../security/telemetry-redaction.md).

## Purpose

This document defines the observability model for Orion.

Its goals are to ensure that production behavior can be understood from evidence rather than speculation.

Observability should make it possible to answer questions such as:

- What happened?
- Where did it happen?
- When did it happen?
- Which request, job, event, user action, or release was involved?
- Which dependency participated?
- What failed?
- Was the failure isolated or systemic?
- Did the system recover?
- Which users or workflows were affected?
- Was the issue introduced by a recent release?
- Can the behavior be reproduced or explained from telemetry?

Observability is part of application architecture.

It must not be treated as an optional production add-on.

---

## Core Principle

A production system should be able to explain its own behavior.

Orion applications should emit enough structured telemetry to investigate important behavior without requiring:

- local reproduction as the only source of evidence;
- user screenshots as the only diagnostic source;
- ad hoc production debugging;
- database inspection as the primary debugging mechanism;
- speculation based on incomplete log messages.

The desired model is:

```text
runtime behavior
      ↓
structured telemetry
      ↓
correlation
      ↓
investigation
      ↓
action
```

Observability should support both humans and AI agents.

---

## Observability Signals

The [accepted server-side implementation direction](../adr/0010-establish-observability-logging-tracing-metrics-and-error-reporting-strategy.md#decision) uses OpenTelemetry for traces and metrics, Pino JSON logs, W3C Trace Context, and OTLP. A Collector is preferred when justified, not mandatory. Backend/vendor choice remains deployment-specific; browser instrumentation and the OpenTelemetry Logs SDK are not initial defaults. Dedicated error reporting is optional and operational telemetry is not authoritative business audit history. Implementation is pending.

Orion recognizes four primary observability signals:

```text
logs
traces
metrics
errors
```

These signals have different purposes.

They should complement each other rather than duplicate the same information indiscriminately.

---

### Logs

Logs describe discrete events that occurred during execution.

Examples include:

```text
request completed
payment attempt started
payment attempt failed
job retried
configuration loaded
external dependency unavailable
order state changed
```

Logs should be structured.

Important diagnostic information should exist as explicit fields rather than being embedded only in human-readable text.

---

### Traces

Traces describe the execution path of an operation across components and dependencies.

A trace may represent:

```text
user action
    ↓
web request
    ↓
API
    ↓
application operation
    ↓
database
    ↓
external provider
```

or:

```text
API
    ↓
event
    ↓
worker
    ↓
external service
```

Traces are particularly useful for:

- latency analysis;
- dependency analysis;
- distributed failure investigation;
- identifying slow operations;
- understanding execution flow;
- correlating related telemetry.

---

### Metrics

Metrics represent aggregated numerical behavior over time.

Examples include:

```text
request rate
error rate
latency
queue depth
job duration
database pool usage
cache hit rate
external provider failure rate
```

Metrics are useful for understanding system health and trends.

They should not be used to carry arbitrary high-cardinality diagnostic context.

---

### Error Reporting

Error reporting focuses on unexpected failures.

It should provide capabilities such as:

```text
exception capture
stack traces
error grouping
release correlation
environment classification
breadcrumbs
trace correlation
alerting
```

Error reporting complements logs and traces.

It should not replace them.

---

## Telemetry Correlation

Observability signals should be correlated whenever practical.

A production investigation should be able to move between:

```text
error
  ↓
trace
  ↓
logs
  ↓
metrics
  ↓
release
```

Correlation identifiers should be propagated consistently.

Potential identifiers include:

```text
traceId
spanId
requestId
errorId
jobId
eventId
releaseId
```

Each identifier has a different purpose.

---

## Trace ID

A trace ID identifies an execution path.

It should be propagated across supported distributed boundaries.

For example:

```text
Web
 │
 │ traceId
 ▼
API
 │
 ├── Database
 │
 └── Payment Provider
```

When asynchronous processing occurs:

```text
API
 │
 │ trace context
 ▼
Message
 │
 ▼
Worker
```

the originating trace relationship should be preserved when the observability model supports it.

---

## Span ID

A span identifies an individual operation within a trace.

Examples include:

```text
HTTP request
database query
external API request
background job
cache operation
application operation
```

Spans should represent meaningful operations.

Avoid producing large numbers of meaningless spans merely because instrumentation permits it.

---

## Request ID

A request ID identifies an individual application-boundary request.

For example:

```text
req_01J...
```

Request IDs may be exposed safely to clients when useful for support and correlation.

They are distinct from trace IDs.

A request may participate in a larger distributed trace.

---

## Error ID

An error ID identifies a specific failure report.

It may be surfaced to the user as a support reference.

Example:

```text
Something went wrong.

Reference:
err_01J8X4A2K9
```

The reference must not encode sensitive data.

---

## Job ID

Asynchronous jobs should have stable identifiers where appropriate.

A job ID may be used to correlate:

```text
job scheduled
job started
job retried
job failed
job completed
```

This is particularly useful when retries occur.

---

## Event ID

Events and messages may require unique identifiers for:

```text
correlation
deduplication
idempotency
replay analysis
```

Event identifiers should not automatically be reused as trace identifiers.

They represent different semantics.

---

## Release Identity

Production telemetry should identify the running release whenever practical.

This enables questions such as:

```text
Which release introduced this error?

Did the failure rate increase after deployment?

Are older mobile clients affected?

Did the problem disappear after rollback?
```

Release identity should be consistent with the repository's release process once that process is defined.

---

## Environment Identity

Telemetry should distinguish execution environments.

Examples may include:

```text
development
test
staging
production
```

Environment names should be stable.

Avoid uncontrolled environment naming such as:

```text
prod
production
production-main
main-prod
prd
```

when they all represent the same semantic environment.

---

## Service and Application Identity

Every telemetry-producing runtime should identify itself consistently.

Examples:

```text
api
web
worker
mobile
desktop
```

If multiple services eventually exist, each should have a stable service identity.

Do not rely solely on hostnames or deployment-generated instance names to determine application ownership.

---

## Structured Logging

Production-relevant logs should be structured.

A log event may conceptually contain:

```json
{
  "timestamp": "...",
  "level": "info",
  "event": "order.cancelled",
  "service": "api",
  "environment": "production",
  "release": "v1.4.0",
  "requestId": "req_01...",
  "traceId": "4bf92f...",
  "orderId": "ord_01..."
}
```

The exact format will depend on the selected stack.

The principle is that relevant context should exist as machine-readable fields.

---

## Event Names

Important structured logs should use stable event names.

Prefer:

```text
order.created
order.cancelled
payment.capture.started
payment.capture.failed
job.retry.scheduled
```

over relying only on messages such as:

```text
Order was created successfully.
```

A human-readable message may still exist.

The stable event name provides machine-readable semantics.

---

## Logging Levels

Orion should use a small, well-defined logging-level model.

A likely model is:

```text
debug
info
warning
error
critical
```

The exact implementation may differ by platform.

The semantic intent should remain consistent.

---

### Debug

Used for detailed diagnostic information primarily useful during investigation or development.

Debug logs should not be required for normal production understanding if they are disabled in production.

---

### Info

Used for meaningful normal operations.

Examples:

```text
application started
deployment initialized
job completed
important domain workflow completed
```

Avoid logging every trivial function call at `info`.

---

### Warning

Used when something unexpected occurred but the operation may continue.

Examples:

```text
temporary fallback used
retry scheduled
deprecated contract consumed
non-critical dependency unavailable
```

Warnings should represent something worth investigating if frequent.

---

### Error

Used when an operation failed unexpectedly or could not complete as required.

An error-level log should normally correspond to a meaningful operational failure.

Expected business failures should not automatically be logged as errors.

---

### Critical

Used for severe conditions requiring urgent operational attention.

Examples may include:

```text
application cannot start
data integrity at risk
critical dependency permanently unavailable
system-wide failure
```

Critical severity should remain rare.

---

## Avoid Logging Every Error Multiple Times

The same failure should not be independently reported at every layer.

Avoid:

```text
repository logs exception
    ↓
service logs same exception
    ↓
controller logs same exception
    ↓
global handler logs same exception
    ↓
error tracker captures same exception
```

This produces noise and may create multiple incidents for one failure.

Prefer:

```text
lower layers
    ↓ propagate/enrich
intentional boundary
    ↓ reports once
```

The reporting owner should be explicit.

---

## Context Enrichment

Telemetry should be enriched with useful context at appropriate boundaries.

Potential context includes:

```text
service
environment
release
operation
requestId
traceId
actorId
tenantId
entity type
entity identifier
provider
attempt number
duration
result
```

Only context that is useful and permitted should be included.

Do not attach all available application data indiscriminately.

---

## Context Ownership

Different layers may add different context.

For example:

```text
transport
    → request information

application
    → operation information

domain
    → relevant business semantics

integration
    → provider information

observability infrastructure
    → release/environment/trace context
```

Telemetry enrichment should preserve architectural ownership.

---

## Domain Events vs Telemetry Events

A domain event and an observability event are different concepts.

For example:

```text
OrderPlaced
```

may be a domain or integration event.

A telemetry event such as:

```text
order.place.completed
```

exists for operational visibility.

Do not assume one must replace the other.

Domain events have application semantics.

Telemetry events have diagnostic semantics.

---

## Business Observability

Important business workflows may expose operational metrics.

Examples include:

```text
orders created
payments captured
payments declined
subscriptions renewed
jobs completed
imports failed
```

Business metrics can help determine whether the system is functioning correctly even when infrastructure appears healthy.

For example:

```text
HTTP error rate = normal

successful payments = zero
```

may indicate a serious application problem.

---

## Technical Observability

Technical telemetry may include:

```text
request duration
CPU
memory
database latency
connection pool usage
queue depth
cache behavior
provider latency
runtime errors
```

Business and technical signals should complement each other.

---

## Tracing

Tracing should focus on meaningful execution boundaries.

Potential trace spans include:

```text
incoming HTTP request
application operation
database operation
external API call
message publish
message consume
background job
```

Avoid tracing every trivial local function call.

Too much instrumentation increases cost and reduces signal quality.

---

## Trace Naming

Span names should be stable and low-cardinality.

Prefer:

```text
POST /orders
OrderService.create
db.orders.insert
payment.capture
```

over:

```text
POST /orders/ord_01J84AT3...
```

Dynamic identifiers should be attributes, not part of span names.

---

## Trace Attributes

Useful attributes may include:

```text
operation
result
error code
HTTP method
route template
database operation
provider
job type
```

Avoid uncontrolled high-cardinality attributes.

---

## Metrics

Metrics should answer operational questions efficiently.

Common metric types may include:

```text
counter
gauge
histogram
```

Examples:

```text
requests_total
request_duration
errors_total
queue_depth
job_duration
payment_attempts_total
```

The actual naming convention will be selected with the telemetry stack.

---

## Metric Labels

Metric labels must remain bounded.

Safe examples may include:

```text
service
environment
operation
result
error category
provider
```

Potentially dangerous labels include:

```text
userId
orderId
requestId
traceId
email
full URL
arbitrary error message
```

High-cardinality labels can make metric systems expensive or unusable.

Diagnostic identifiers belong primarily in logs and traces.

---

## Latency

Latency should be measured where it matters.

Potential measurements include:

```text
request duration
database duration
external provider duration
job duration
queue waiting time
```

Percentile-based latency measurements are generally more useful than averages alone.

The exact service objectives will be defined later.

---

## Error Rate

Unexpected failure rate should be measurable.

Useful dimensions may include:

```text
service
operation
error category
provider
release
```

Error rates should distinguish expected business outcomes from true operational failures.

For example:

```text
PAYMENT_DECLINED
```

may be a valid business outcome.

It should not automatically count as an infrastructure error.

---

## Availability

Availability should eventually reflect meaningful user-facing capability rather than process existence alone.

For example:

```text
API process running
```

does not necessarily mean:

```text
checkout works
```

Availability signals should evolve toward meaningful service behavior as the system matures.

---

## Health Checks

Applications may expose health checks appropriate to their runtime.

Health checks should distinguish between different concepts when necessary.

Potential categories include:

```text
liveness
readiness
dependency health
```

A health endpoint must not leak sensitive configuration or infrastructure details.

---

### Liveness

Liveness answers:

```text
Is this process alive enough to continue running?
```

It should not usually depend on every external service.

Otherwise, temporary dependency outages may cause unnecessary restart loops.

---

### Readiness

Readiness answers:

```text
Can this application safely receive work?
```

Readiness may depend on critical initialization or dependencies.

Exact semantics depend on deployment architecture.

---

## Dependency Health

External dependency health should be observable without blindly treating every dependency failure as application death.

Examples:

```text
database unavailable
payment provider degraded
email provider unavailable
queue unavailable
```

Dependency health should be represented separately when operationally useful.

---

## External Dependency Telemetry

Outbound dependencies should provide enough telemetry to understand:

```text
which provider was called
which operation was attempted
duration
result
retry behavior
timeout
```

Sensitive payloads must not be captured indiscriminately.

---

## Database Observability

Database telemetry should support investigation of:

```text
query latency
connection pool saturation
transaction failures
deadlocks
timeouts
migration failures
```

Raw SQL capture must be evaluated carefully.

Queries may contain sensitive values.

Parameter redaction or query normalization may be required.

---

## Queue and Messaging Observability

Asynchronous systems should expose telemetry for:

```text
messages published
messages consumed
processing duration
retry count
queue depth
message age
dead-letter growth
consumer failures
```

Asynchronous telemetry should preserve correlation with the originating operation where practical.

---

## Background Job Observability

Background jobs should expose:

```text
job type
jobId
attempt
start
completion
duration
result
error classification
```

Repeated retries should be visible.

A job that silently fails and disappears is an observability defect.

---

## Cache Observability

If caching is introduced, relevant telemetry may include:

```text
hit rate
miss rate
latency
eviction
errors
```

Do not introduce complex cache telemetry before caching itself has a justified role.

---

## Client Observability

Web, mobile, and desktop applications should have observability appropriate to their runtime.

Potential signals include:

```text
unhandled errors
crashes
failed API operations
release
application version
navigation breadcrumbs
performance measurements
```

Client telemetry must respect privacy constraints.

---

## Browser Observability

Browser applications may provide:

```text
JavaScript error reporting
source-map-backed stack traces
navigation timing
API request correlation
release identity
```

Browser telemetry must not expose server secrets.

---

## Mobile Observability

Mobile applications may require:

```text
native crash reporting
application version
operating-system version
device class
network failure information
offline behavior
```

Device information should be limited to what is operationally justified.

---

## Desktop Observability

Desktop applications may require:

```text
process crash reporting
application version
operating-system information
update version
local integration failures
```

Local file paths or usernames should not be captured blindly.

---

## Source Maps and Symbols

Production builds that transform code should preserve diagnostic mapping artifacts when required.

Examples include:

```text
JavaScript source maps
native debug symbols
compiled stack mapping
```

These artifacts should be available to trusted error-reporting systems where appropriate.

They do not necessarily need to be publicly accessible.

---

## Open Standards

Orion should prefer open telemetry standards when they provide sufficient capability.

Vendor-specific systems may be used for storage, visualization, alerting, or error tracking.

Instrumentation should avoid unnecessary provider lock-in where a stable standard exists.

The exact telemetry standard and vendor integrations will be selected through architecture decisions.

---

## Vendor Isolation

Vendor-specific telemetry APIs should not spread arbitrarily through business code.

Prefer:

```text
application code
      ↓
shared observability conventions
      ↓
telemetry implementation
      ↓
vendor
```

over:

```text
module A ─┐
module B ─┼→ vendor SDK directly
module C ─┘
```

This does not require wrapping every telemetry API.

Isolation should exist where it improves consistency, portability, testing, or policy enforcement.

---

## Telemetry Must Not Change Business Behavior

Observability should normally fail safely.

An unavailable telemetry backend should not cause an unrelated business operation to fail unless observability itself is a regulatory or security requirement for that operation.

For example:

```text
error tracker unavailable
```

should not normally prevent:

```text
order creation
```

Telemetry infrastructure must avoid becoming an accidental critical dependency.

---

## Telemetry Failures

Failures in telemetry export should themselves be diagnosable when practical.

However, care must be taken to avoid recursive behavior such as:

```text
telemetry export fails
    ↓
logs telemetry failure
    ↓
logging export fails
    ↓
logs telemetry failure
    ↓
...
```

Observability infrastructure must fail in a controlled manner.

---

## Sensitive Information

Telemetry systems must not become uncontrolled data stores.

The following must never be intentionally captured:

```text
passwords
authentication tokens
session secrets
API keys
private keys
payment credentials
database passwords
authorization headers
cryptographic secrets
```

This rule applies to:

```text
logs
traces
metrics
error reports
breadcrumbs
profiling metadata
user feedback attachments
```

---

## Personal Data

Personal data should be collected only when operationally justified.

Possible sensitive or personal fields include:

```text
email
phone number
full name
IP address
physical address
device identifiers
user-generated content
request bodies
uploaded files
```

Prefer stable internal identifiers where possible.

Collection, retention, redaction, and access must follow explicit privacy policy.

---

## Data Minimization

The default should be:

```text
capture what is required for investigation
```

not:

```text
capture everything because it may be useful later
```

Telemetry is production data.

It must be treated accordingly.

---

## Redaction

Orion should support centralized redaction mechanisms.

Redaction may apply to:

```text
HTTP headers
query parameters
request bodies
response bodies
log fields
exception metadata
provider payloads
```

Redaction rules should be reusable across applications where the semantics are shared.

---

## Allowlist Over Blocklist

For sensitive payload capture, prefer explicit allowlisting where practical.

For example:

```text
capture:
operation
result
provider
duration
```

is generally safer than:

```text
capture entire request body
then try to remove sensitive fields
```

especially for public or evolving APIs.

---

## Telemetry Retention

Telemetry retention should eventually be explicitly defined.

Different data classes may require different retention periods.

For example:

```text
high-volume debug logs
application logs
security logs
traces
error reports
metrics
```

Retention should balance:

```text
diagnostic value
cost
privacy
compliance
security
```

The exact policy will be defined after telemetry providers are selected.

---

## Access Control

Observability systems may contain sensitive operational information.

Access should follow least-privilege principles.

Not every contributor or application requires unrestricted access to:

```text
production logs
error reports
traces
security events
user-linked telemetry
```

Access architecture should be defined with the selected operational platform.

---

## User Context

Attaching user context to telemetry may help diagnose issues.

This should be deliberate.

Prefer identifiers such as:

```text
userId
tenantId
```

where appropriate.

Avoid attaching unnecessary personal information.

User context should be removed or updated appropriately when authentication state changes.

---

## Anonymous Operations

Telemetry must not assume that every operation has an authenticated user.

Anonymous workflows should remain fully diagnosable through:

```text
traceId
requestId
session-safe correlation
operation context
```

without inventing fake user identities.

---

## Sampling

High-volume telemetry may require sampling.

Sampling must not make critical failures invisible.

Different signals may require different policies.

For example:

```text
successful high-volume traces
    → sampled

unexpected errors
    → retained at higher rate
```

Sampling strategy should be documented when implemented.

---

## Cost Awareness

Observability has operational cost.

Excessive logging, high-cardinality metrics, and unsampled traces may create unnecessary expense.

Cost should be controlled without destroying diagnostic value.

Prefer:

```text
high-quality structured signals
```

over:

```text
maximum possible telemetry volume
```

---

## Performance Overhead

Instrumentation adds runtime overhead.

The observability architecture should monitor and constrain:

```text
CPU overhead
memory usage
network volume
application latency
storage volume
```

Observability must not materially degrade application reliability without justification.

---

## Telemetry During Development

Development environments should provide useful observability without requiring the full production stack.

Developers and AI agents should be able to inspect relevant local:

```text
logs
traces when practical
error output
request correlation
```

Development telemetry should use the same semantic conventions as production whenever practical.

---

## Testing Observability

Important observability behavior should be testable.

Potential tests include:

```text
request ID generated
trace context propagated
error reported
secret redaction applied
structured event emitted
duplicate error report avoided
release metadata attached
```

Avoid tests that tightly couple business logic to the implementation details of a telemetry vendor.

---

## Observability in CI

CI should verify observability-related invariants when practical.

Potential checks include:

```text
prohibited logging patterns
missing structured fields
invalid telemetry event names
secret leakage
unknown error codes
invalid metric labels
```

The exact checks depend on the selected stack.

---

## Naming Conventions

Telemetry names should be stable and predictable.

This applies to:

```text
log events
span names
metric names
error codes
service names
attributes
```

The exact naming specification should be documented once the telemetry implementation is selected.

Avoid multiple names for the same concept.

For example:

```text
user_id
userId
userid
actor_user
```

should not coexist without semantic reasons.

---

## Semantic Conventions

Where mature standard semantic conventions exist, Orion should prefer them over inventing custom naming.

Custom conventions should be introduced only for Orion-specific domain semantics.

This improves interoperability across telemetry systems and tooling.

---

## Operational Dashboards

Dashboards should answer concrete operational questions.

Examples include:

```text
Is the API healthy?

Are requests becoming slower?

Did the last deployment increase errors?

Are background jobs accumulating?

Is a provider failing?

Are critical business workflows succeeding?
```

A dashboard should not exist merely to display every metric available.

---

## Service Overview

Each important runtime should eventually have an operational overview showing relevant signals such as:

```text
request rate
error rate
latency
resource saturation
dependency health
release
```

The exact indicators depend on the runtime.

---

## Business Workflow Dashboards

Critical product workflows may require dedicated views.

For example:

```text
checkout attempts
payment success rate
payment failure classification
order creation rate
```

This helps identify semantic failure even when infrastructure metrics appear healthy.

---

## Alerting Principles

Alerts should indicate conditions that require action.

Avoid alerts for every individual error occurrence.

Good alerts should generally be:

```text
actionable
specific
low-noise
severity-aware
linked to investigation context
```

An alert should help answer:

```text
What is wrong?
How severe is it?
What changed?
Where should I investigate?
```

---

## Alert Sources

Alerts may be based on:

```text
error rate
latency
availability
resource saturation
queue backlog
dead-letter growth
provider outage
business workflow failure
```

The exact alert thresholds should be based on operational evidence rather than arbitrary numbers.

---

## Alert Fatigue

Too many low-value alerts make important alerts easier to ignore.

Expected business failures should not normally generate operational alerts.

For example:

```text
user entered wrong password
```

is not usually an incident.

A significant change in authentication failure rate might be.

---

## Release Monitoring

Deployments should be observable.

Relevant telemetry may include:

```text
release deployed
release version
deployment environment
deployment timestamp
error-rate change
latency change
health-check result
```

This supports rapid investigation of deployment-related regressions.

---

## Deployment Correlation

Operational systems should make it possible to answer:

```text
What changed immediately before this incident?
```

Release metadata should correlate:

```text
source revision
application release
deployment
telemetry
```

when the deployment architecture allows it.

---

## Rollback Visibility

If a deployment is rolled back, telemetry should reflect the active release afterward.

This prevents investigations from attributing post-rollback behavior to the wrong application version.

---

## Operational Events

Important operational changes may be represented as events.

Examples include:

```text
deployment
rollback
configuration change
feature rollout
migration execution
provider incident
```

These events can provide context when analyzing changes in metrics or errors.

---

## Database Migration Observability

Database migrations should be observable.

Relevant information may include:

```text
migration identifier
start
completion
duration
failure
environment
release
```

Migration logs must not expose secrets or sensitive data.

Long-running or risky migrations may require additional monitoring.

---

## Feature Flags

If feature flags are introduced, important telemetry may include flag state when necessary to investigate behavior.

Avoid adding uncontrolled high-cardinality flag metadata to every signal.

Feature-flag observability should be deliberate.

---

## Configuration Observability

Applications should make relevant non-secret configuration state discoverable where operationally useful.

For example:

```text
feature mode
configured provider
timeout profile
runtime mode
```

Secrets and credentials must never be emitted.

Configuration fingerprints or safe summaries may be useful in some cases.

---

## Incident Investigation

A normal investigation path should be possible from evidence.

For example:

```text
alert
  ↓
affected service
  ↓
error group
  ↓
trace
  ↓
relevant logs
  ↓
dependency behavior
  ↓
release
  ↓
source code
```

Runbooks should describe specific investigation paths for known incidents.

---

## AI-Assisted Investigation

Orion should be designed so that AI agents can investigate runtime failures using structured evidence.

An agent should ideally be able to correlate:

```text
errorId
    ↓
error report
    ↓
traceId
    ↓
trace
    ↓
structured logs
    ↓
release
    ↓
source code
    ↓
tests
```

This reduces speculation and improves the reliability of AI-generated fixes.

---

## Telemetry Accessibility for AI Agents

If AI agents are eventually given access to observability systems, access must follow the same security and privacy rules as human access.

AI access must not justify collecting more sensitive telemetry.

The safe principle is:

```text
collect minimal necessary telemetry
then control access
```

not:

```text
collect everything because an agent may need it
```

---

## From Incident to Regression Test

A desirable production-debugging workflow is:

```text
production failure
      ↓
telemetry evidence
      ↓
root cause
      ↓
local reproduction
      ↓
regression test fails
      ↓
fix
      ↓
regression test passes
      ↓
deployment
      ↓
telemetry confirms recovery
```

Observability and testing should reinforce each other.

---

## Runbooks

Known operational failure modes should have runbooks.

A runbook may reference:

```text
dashboards
metrics
queries
error groups
traces
logs
deployment history
recovery procedures
```

Runbooks belong under:

```text
docs/runbooks/
```

They should remain actionable.

---

## Observability Ownership

Cross-cutting observability conventions should have explicit ownership.

A shared observability package may eventually own capabilities such as:

```text
logger creation
trace context
correlation identifiers
redaction
telemetry initialization primitives
common attributes
```

Applications remain responsible for instrumenting application-specific behavior.

---

## Instrumentation Ownership

The module that owns an operation should generally own its semantic instrumentation.

For example:

```text
payment integration
    owns payment provider telemetry

HTTP transport
    owns request transport telemetry

job runner
    owns execution telemetry
```

Cross-cutting infrastructure should provide mechanisms and conventions.

It should not guess every business event automatically.

---

## Automatic Instrumentation

Automatic instrumentation is useful for generic infrastructure such as:

```text
HTTP
database
runtime
network clients
```

but it cannot replace semantic instrumentation.

Automatic instrumentation may tell us:

```text
POST /payments returned 409
```

Semantic instrumentation may tell us:

```text
payment declined because card issuer rejected authorization
```

Both may be valuable.

---

## Manual Instrumentation

Manual telemetry should be introduced when it answers a meaningful operational question.

Avoid instrumentation merely because a code path exists.

A useful question is:

```text
If this operation fails in production, what evidence would we need to understand why?
```

---

## Telemetry Quality

Useful telemetry should be:

```text
structured
consistent
correlated
bounded
safe
actionable
```

Telemetry should not become:

```text
verbose
duplicated
unbounded
sensitive
ambiguous
```

---

## Missing Telemetry Is a Defect

If an important production failure cannot be diagnosed because required evidence was not captured, that should be treated as a reliability defect.

The corrective action may include:

```text
better logs
new trace attributes
new metric
improved correlation
better error reporting
new runbook
```

Observability should improve as operational experience grows.

---

## Excessive Telemetry Is Also a Defect

More telemetry is not automatically better.

Excessive telemetry may create:

```text
noise
cost
privacy risk
security risk
poor investigation experience
```

Instrumentation should optimize for information quality.

---

## Initial Observability Requirements

The following foundational requirements apply alongside the accepted implementation direction:

1. Production-relevant applications must be observable.
2. Logs must be structured where operationally relevant.
3. Unexpected errors must be reportable.
4. Trace and request correlation should be preserved where practical.
5. Telemetry should identify application, environment, and release.
6. Important remote operations should expose latency and result information.
7. Background jobs and asynchronous consumers must be diagnosable.
8. Sensitive secrets must never be intentionally captured.
9. Personal data collection must be minimized.
10. High-cardinality values must not be used carelessly in metrics.
11. The same unexpected error should not be independently reported at every layer.
12. Telemetry must not normally become a critical dependency for business behavior.
13. Important telemetry behavior should be testable.
14. Deployment changes should be correlatable with runtime behavior.
15. Observability should support evidence-based investigation by humans and AI agents.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
metrics backend
error tracking provider
dashboard platform
alerting platform
retention policy
sampling policy
telemetry storage
```

These choices should be made through explicit architecture decisions once the technology stack and deployment model are defined.

---

## Related Documentation

Signal-specific and security details are maintained in:

- [docs/reliability/logging.md](logging.md)
- [docs/reliability/tracing.md](tracing.md)
- [docs/reliability/metrics.md](metrics.md)
- [docs/reliability/error-reporting.md](error-reporting.md)
- [docs/reliability/alerting.md](alerting.md)
- [docs/reliability/health-checks.md](health-checks.md)
- [docs/security/data-classification.md](../security/data-classification.md)
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

Implementation-specific documentation should reference this file rather than redefine its principles independently.

---

## Summary

Observability exists so that production behavior can be understood from evidence.

Orion uses four primary signals:

```text
logs
traces
metrics
errors
```

These signals should be correlated through identifiers and release metadata.

The desired investigation model is:

```text
user-visible failure
        ↓
error/reference ID
        ↓
trace
        ↓
structured logs
        ↓
dependencies
        ↓
release
        ↓
source code
```

Telemetry must remain structured, safe, bounded, and actionable.

Observability should provide enough information to diagnose failures without becoming an uncontrolled copy of application data.

A system that fails without leaving useful evidence has a reliability defect.

A telemetry system that exposes unnecessary sensitive information has a security defect.

Orion must avoid both.
