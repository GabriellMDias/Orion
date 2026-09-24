# Tracing

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0010](../adr/0010-establish-observability-logging-tracing-metrics-and-error-reporting-strategy.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Context Propagation](#context-propagation)
- [Untrusted Trace Context](#untrusted-trace-context)
- [Trace Links](#trace-links)
- [Sampling Checklist](#sampling-checklist)
- [New Span Checklist](#new-span-checklist)

Related policy: [telemetry redaction](../security/telemetry-redaction.md), [logging](logging.md).

## Purpose

This document defines the distributed tracing principles used by Orion.

Its goals are to ensure that traces are:

- useful for understanding causal execution;
- correlated across applications and asynchronous boundaries;
- safe;
- structured;
- low-noise;
- bounded in cost;
- understandable by humans and AI agents;
- compatible with open observability standards;
- useful during production investigation;
- independent from a specific tracing vendor.

Tracing describes how one logical operation flows through runtime boundaries.

It should help answer:

```text
Where did this operation go?

Which dependency was slow?

Which component failed?

Which asynchronous work came from this request?

Which spans belong to the same logical execution?
```

Tracing must not become a mechanism for recording arbitrary application data.

This document is technology-agnostic.

ADR-0010 selects OpenTelemetry, W3C Trace Context, and OTLP, with a Collector preferred when justified. Implementation details, sampling, storage, and visualization remain deployment-specific.

This document complements:

- [docs/reliability/observability.md](observability.md);
- [docs/reliability/logging.md](logging.md);
- [docs/reliability/error-reporting.md](error-reporting.md);
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md).

---

## Core Principle

A trace should represent meaningful causal execution across boundaries.

The intended model is:

```text
logical operation
    ↓
trace
    ↓
span hierarchy / links
    ↓
runtime boundaries
    ↓
diagnostic evidence
```

Tracing should reveal system behavior.

It should not attempt to record every function call.

---

## Trace

A trace represents one logical execution across one or more components.

Examples include:

```text
incoming API request

background job processing

webhook handling

scheduled workflow

event-driven processing chain
```

A trace may cross:

```text
processes
services
threads
workers
queues
databases
external providers
```

when context propagation exists.

---

## Trace ID

A trace should have a stable opaque:

```text
traceId
```

used to correlate related spans.

Where practical, logs and error reports produced inside the traced execution should include the same trace identifier.

---

## Span

A span represents one meaningful unit of work inside a trace.

Potential examples:

```text
HTTP request

application operation

database query

external provider call

queue publish

job processing

cache operation
```

A span should have:

```text
name
start time
end time
status
attributes
parent or causal relationship
```

according to the selected tracing standard.

---

## Span ID

Each span should have a stable opaque:

```text
spanId
```

within the trace.

The identifier is useful for precise correlation between:

```text
logs
errors
trace visualization
```

---

## Parent and Child Spans

Synchronous nested operations normally form parent-child relationships.

Conceptually:

```text
HTTP request span
    ↓
application operation span
        ↓
database span
        ↓
payment provider span
```

This relationship should represent actual execution causality.

---

## Trace Links

Not all causal relationships are strict parent-child relationships.

Asynchronous operations may require trace links.

Examples include:

```text
one event creates several jobs

one batch processes messages from several traces

one operation consumes multiple upstream events
```

Where the tracing standard supports links, use them when they better represent causality.

---

## Trace Context

Trace context contains the identifiers and metadata required to continue a trace across a boundary.

Conceptually:

```text
traceId
spanId
sampling decision
trace state
```

The exact representation should use established standards rather than custom protocols where possible.

---

## Context Propagation

Trace context should propagate across supported boundaries automatically where practical.

Potential boundaries include:

```text
HTTP
RPC
message queue
job queue
event bus
```

Application developers should not manually pass trace IDs through every business function.

---

## Propagation Is Boundary Infrastructure

Trace propagation belongs in:

```text
transport middleware
queue adapters
worker infrastructure
HTTP clients
provider adapters
```

rather than domain logic.

---

## Open Standards

Orion should prefer established tracing standards.

OpenTelemetry or equivalent open standards should be preferred over deeply coupling application code to one observability vendor.

The exact implementation is deferred.

---

## Vendor Isolation

Application code should use Orion tracing semantics or standard instrumentation.

Vendor-specific APIs should remain near observability infrastructure where practical.

A tracing vendor should be replaceable without rewriting business logic.

---

## Root Spans

A root span begins a new trace.

Common root boundaries include:

```text
incoming request with no valid upstream trace

scheduled job

externally triggered webhook

standalone CLI operation

background task with no causal parent
```

Do not create unrelated root traces inside one logical operation unnecessarily.

---

## Incoming Requests

An incoming network request should normally create or continue a trace.

If valid upstream trace context exists and the trust model permits accepting it, the server may continue that trace.

Otherwise it should start a new trace.

---

## Untrusted Trace Context

Trace headers come from external input.

They must be parsed defensively.

Malformed trace context must not cause request failure unless the protocol explicitly requires it.

---

## External Trace IDs Are Not Identity

A caller-provided trace identifier does not establish:

```text
authentication
authorization
tenant
user identity
```

Tracing context is operational metadata only.

---

## Trace Context Trust

Externally supplied trace metadata should not be allowed to inject:

```text
arbitrary attributes
sensitive values
privileged routing
```

into internal telemetry.

Only supported tracing fields should be accepted.

---

## Outbound HTTP Calls

Instrumented outbound calls should continue the current trace where supported.

A client span may include safe metadata such as:

```text
method
peer/service
route template where known
status
duration
```

Avoid raw query parameters and sensitive headers.

---

## External Providers

Calls to external providers should usually appear as spans when they materially affect latency or failure.

Examples:

```text
payment provider

email provider

object storage

identity provider
```

The span should expose enough metadata to distinguish operational dependencies without recording request payloads.

---

## Provider Span Names

Prefer stable semantic names.

For example:

```text
payment.authorize

email.send

storage.upload
```

or standard semantic conventions where available.

Avoid names derived from raw URL paths containing identifiers.

---

## Database Spans

Database operations should be traceable when meaningful.

Useful information may include:

```text
database system
operation
normalized statement or safe query identifier
table/resource
duration
status
```

depending on the selected instrumentation.

---

## Database Query Data

Raw query parameters must not enter traces by default.

They may contain:

```text
personal data
credentials
user content
financial data
```

Tracing follows the same telemetry-redaction policy as logs.

---

## Database Statement Capture

Automatic statement capture should be reviewed carefully.

If statements can contain literals or sensitive data, they must be:

```text
disabled
normalized
parameterized
redacted
```

as appropriate.

---

## ORM Instrumentation

ORM tracing is useful only if it preserves meaningful database visibility.

Instrumentation should not produce dozens of redundant spans for one logical query merely because the ORM has many internal layers.

---

## Application Spans

Application-level spans should represent important logical operations.

Examples:

```text
orders.cancel

users.register

reports.generate
```

These spans may bridge transport and infrastructure work.

Do not create spans for every private helper.

---

## Span Granularity

A span should justify its existence through:

```text
latency visibility
failure visibility
causal significance
operational importance
```

Avoid instrumentation such as:

```text
parseObject
mapArray
getName
validateBoolean
```

unless those operations are unusually expensive or operationally significant.

---

## Trace Noise

Too many spans make traces difficult to understand and expensive to store.

Instrumentation should optimize for:

```text
causal clarity
critical latency
dependency visibility
failure diagnosis
```

not maximum span count.

---

## Span Naming

Span names should be stable and low cardinality.

Good:

```text
HTTP GET /orders/{orderId}

orders.cancel

database.orders.select

payment.authorize
```

Bad:

```text
GET /orders/ord_01J8A7...
```

Bad:

```text
Cancel order for Gabriel Dias
```

Identifiers and personal data do not belong in span names.

---

## Span Names Are Operational Contracts

Dashboards and trace searches may depend on span names.

Do not construct span names dynamically from:

```text
resource IDs
user input
URLs with identifiers
error messages
```

---

## Attributes

Span attributes provide structured context.

Potential attributes include:

```text
operation
service
environment
release
route
method
result
errorCode
tenantId
actorId
jobType
attempt
```

when safe and useful.

---

## Attribute Naming

Attribute names should follow established semantic conventions where available.

Orion-specific attributes should use a consistent namespace or naming convention.

The exact convention is deferred.

---

## Attribute Values

Attribute values should preferably be:

```text
bounded
typed
predictable
safe
```

Do not attach arbitrary complex objects.

---

## High-Cardinality Attributes

Traces can tolerate some identifiers better than metrics.

However, every attribute still has:

```text
storage cost
privacy implications
search cost
```

Only attach high-cardinality fields when they materially improve diagnosis.

---

## Actor Identifiers

An opaque internal actor identifier may be useful in traces for authorized investigation.

Avoid:

```text
email
phone
display name
```

when a safe internal ID is sufficient.

---

## Tenant Identifiers

Tenant IDs may improve multi-tenant diagnosis.

They should be opaque and classified appropriately.

Do not expose tenant names or other sensitive tenant information unless operationally necessary.

---

## Sensitive Data

Tracing must follow:

- [docs/security/data-classification.md](../security/data-classification.md)
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

`RESTRICTED` data must never be intentionally recorded in traces.

---

## Request Payloads

Complete request bodies must not be recorded as span attributes or events by default.

---

## Response Payloads

Complete response bodies must not be recorded in traces by default.

---

## Headers

Sensitive headers must not be attached to spans.

Examples:

```text
Authorization
Cookie
Set-Cookie
API keys
provider signatures
```

---

## URLs

Raw URLs may include sensitive query parameters.

Prefer:

```text
route template
scheme
host or safe peer identifier
```

according to tracing conventions.

---

## Exceptions

Unexpected exceptions may be attached to the responsible span using standardized exception events or attributes.

Exception capture must remain safe.

Do not attach entire request objects or raw internal state alongside the exception.

---

## Span Status

Span status should indicate whether the span completed successfully according to tracing semantics.

Do not mark every expected business rejection as an infrastructure tracing error.

---

## Business Failure vs Technical Failure

For example:

```text
order cannot be cancelled because already shipped
```

may be a normal domain outcome.

The application span may record:

```text
result = rejected
errorCode = ORDER_ALREADY_SHIPPED
```

without necessarily treating the trace as an unexpected system failure.

---

## HTTP Client Errors

A `4xx` response does not automatically imply a trace error.

Status should reflect actual operation semantics.

For an incoming request:

```text
invalid user input
```

may be expected.

For an outbound dependency:

```text
provider returns unexpected 401
```

may represent a significant configuration failure.

Context matters.

---

## Error Recording

Unexpected errors should be associated with the span that owns the failed operation.

The error-reporting system may also capture the same failure with the trace ID.

This provides navigation between:

```text
error report
    ↔
trace
    ↔
logs
```

---

## Error Events

Do not create repeated exception events across every parent span.

One failure should not appear as duplicated error evidence throughout the entire trace unless multiple distinct operations failed.

---

## Logs and Traces

Logs emitted inside an active span should inherit:

```text
traceId
spanId
```

automatically where practical.

This enables correlation without manually copying identifiers.

---

## Traces and Metrics

Tracing and metrics serve different purposes.

Trace:

```text
Why was this individual request slow?
```

Metric:

```text
How often are requests slow?
```

Instrumentation may derive metrics from traces, but the operational concepts remain distinct.

---

## Span Events vs Logs

Span events may represent important occurrences tied directly to one span.

Examples:

```text
retry
cache miss
lock acquired
```

Use a span event when the information primarily explains the traced execution.

Use a log when the event should stand independently as searchable operational evidence.

Avoid recording both automatically without reason.

---

## Baggage

Distributed tracing standards may support baggage that propagates arbitrary key-value context.

Baggage should be used very cautiously.

It is propagated broadly and may reach external systems.

---

## Baggage Is Not General Context Storage

Do not put:

```text
email
permissions
roles
tokens
user content
full tenant metadata
```

in tracing baggage.

---

## Safe Baggage

If baggage is used, fields should be:

```text
small
bounded
non-sensitive
necessary across process boundaries
```

Many contexts should remain local rather than propagated.

---

## Baggage Cardinality

Baggage increases network and processing overhead.

Avoid unnecessary fields.

---

## Authentication Context

Authentication principal information should not be transported through tracing context as an authority mechanism.

Trace metadata may include safe diagnostic actor identifiers.

Actual authentication and authorization must use trusted application context.

---

## Asynchronous Messaging

Asynchronous messaging requires deliberate causal propagation.

Conceptually:

```text
producer span
    ↓
message
    ↓
consumer span
```

The consumer should be traceable back to the producing operation where useful.

---

## Producer Spans

Publishing an event or job may create a producer span representing:

```text
serialize
enqueue / publish
broker interaction
```

depending on tracing conventions.

---

## Consumer Spans

Message processing should create a consumer span representing:

```text
message received
processing
result
```

The span should include safe metadata such as:

```text
message type
consumer
attempt
```

---

## Queue Delay

Where tracing infrastructure supports it, async telemetry may distinguish:

```text
time waiting in queue
```

from:

```text
processing duration
```

This distinction is valuable for diagnosing latency.

---

## Long-Running Async Work

A trace that remains conceptually open for hours or days may be impractical.

Long-lived workflows may require:

```text
trace links
workflow identifiers
separate traces per execution stage
```

rather than one enormous trace.

---

## Trace Lifetime

Trace boundaries should reflect useful diagnostic sessions.

Do not force every business workflow into one trace if the workflow lasts days.

Use:

```text
workflowId
jobId
eventId
```

and trace links where appropriate.

---

## Scheduled Jobs

A scheduled job with no upstream causal trace should start a new trace.

The trace should identify:

```text
job type
schedule
execution
```

using safe bounded metadata.

---

## Retry Attempts

Retries may occur within:

```text
same trace
```

or:

```text
linked/new traces
```

depending on time and execution model.

The strategy should make attempts distinguishable.

Useful metadata includes:

```text
attempt
retry reason
```

---

## Immediate Retries

Short retries within one synchronous operation may remain child spans of the same trace.

Example:

```text
HTTP request
    ↓
provider attempt 1
    ↓
provider attempt 2
```

---

## Delayed Retries

A retry hours later may be better represented as a new trace linked to the original job or message.

Operational clarity takes precedence over preserving one continuous trace tree.

---

## Duplicate Message Processing

Duplicate delivery may generate separate consumer traces.

Safe message identifiers can correlate them.

Do not force duplicates into one trace if they are independent executions.

---

## Fan-Out

One operation may produce many downstream tasks.

Example:

```text
report generation request
    ↓
100 partition jobs
```

Creating one trace with thousands of descendants may become expensive and unusable.

Use trace links, workflow identifiers, or selective tracing.

---

## Fan-In

A task may depend on several upstream operations.

Strict parent-child relationships cannot represent several parents cleanly.

Trace links should be considered where supported.

---

## Batch Processing

Batch consumers should avoid attaching thousands of item identifiers to one span.

Potential strategies include:

```text
batch-level span
item-level spans only for important/failed work
safe counts
```

according to workload.

---

## Browser Tracing

Web applications may participate in distributed tracing.

Client-side tracing can reveal:

```text
navigation
API request latency
frontend errors
```

It also increases privacy exposure.

Only safe context should cross from browser to backend.

---

## Mobile Tracing

Mobile tracing may help diagnose:

```text
network latency
application startup
API failures
```

Client instrumentation must consider:

```text
battery
network cost
privacy
offline behavior
```

---

## Desktop Tracing

Desktop applications may similarly generate traces.

Local filesystem paths, usernames, and machine identifiers should not be captured indiscriminately.

---

## Client-to-Server Trace Propagation

Clients may propagate trace context to backend APIs where standards and security policy allow it.

The backend must treat client-provided trace context as operational metadata, not trusted application state.

---

## Cross-Origin Propagation

Browser trace-header propagation may require explicit allowed origins and headers.

Do not broadly expose tracing headers without understanding CORS and privacy implications.

---

## Third-Party Propagation

Do not automatically propagate internal trace context to every third-party provider.

Propagation should follow standards and provider support.

Some providers should be treated as external trace boundaries.

---

## Trace Boundaries and Trust Boundaries

A trace may cross a trust boundary.

That does not imply all attributes should cross it.

Context propagation should send only protocol-defined trace data unless additional fields are explicitly safe.

---

## Sampling

Tracing every operation may be too expensive at scale.

Sampling controls which traces are retained or exported.

Sampling strategy must preserve useful diagnostic coverage.

---

## Head Sampling

Head sampling decides early whether a trace should be sampled.

Advantages include:

```text
lower overhead
simple implementation
predictable cost
```

It may discard interesting traces before their outcome is known.

---

## Tail Sampling

Tail sampling decides after observing more of the trace.

It may retain:

```text
errors
slow traces
rare operations
```

more effectively.

It requires more sophisticated collection infrastructure.

---

## Sampling Decision Propagation

When using distributed head sampling, the sampling decision should propagate with trace context where standards require it.

This avoids inconsistent partial traces.

---

## Errors and Sampling

Unexpected error traces should generally have higher retention priority.

A sampling system that routinely discards error traces reduces incident diagnosability.

---

## Slow Traces

Slow traces may be sampled at a higher rate or retained through tail-based policies.

Thresholds should follow actual service expectations.

---

## Rare Operations

Low-volume high-value workflows may justify near-complete tracing even when high-volume endpoints are sampled.

---

## Security Events

Tracing is not the canonical security audit mechanism.

Do not rely on sampling-sensitive traces as the only record of required security events.

---

## Sampling and Correlation

If a trace is not exported, logs and error reports may still contain the generated trace ID.

Investigators should understand that an ID may exist without a retained trace.

---

## Sampling Transparency

Operational tooling should make it clear when a trace is unavailable due to sampling rather than missing instrumentation.

Where provider capabilities permit, this distinction is useful.

---

## Sampling Cost

Sampling should consider:

```text
traffic volume
span count
trace size
storage cost
diagnostic value
```

Cost management should not eliminate evidence required for reliability.

---

## Dynamic Sampling

Sampling rules may change according to:

```text
operation
error status
latency
environment
```

Dynamic policies should remain bounded and understandable.

---

## Production vs Development Sampling

Development and test environments may trace more heavily.

Production sampling should reflect scale and privacy requirements.

All environments remain subject to data-redaction rules.

---

## Test Environment Tracing

Tests should not require access to the production tracing provider.

Instrumentation should be testable through in-memory or test exporters where useful.

---

## Instrumentation Tests

Tracing tests should focus on important guarantees.

Examples:

```text
trace context propagated to worker

traceId attached to logs

sensitive field absent from span

operation span has stable name
```

Do not test every automatically generated span.

---

## Trace Context Propagation Tests

Important distributed boundaries should have integration tests verifying that context is:

```text
read
continued
propagated
cleared after operation
```

correctly.

---

## Context Leakage

Trace context from one execution must not leak into another.

This is particularly important when using:

```text
async-local storage
thread locals
worker pools
connection reuse
```

Context leakage can corrupt diagnostics and potentially expose metadata across users.

---

## Context Cleanup

Runtime instrumentation must ensure trace context is correctly restored or cleared after execution.

---

## Trace Attribute Redaction Tests

If instrumentation automatically captures:

```text
URL
database statement
exception
HTTP headers
```

tests should verify sensitive values do not appear.

---

## Automatic Instrumentation

Automatic instrumentation is useful for common technologies.

Examples:

```text
HTTP server
HTTP client
database driver
queue client
```

It reduces manual work and improves consistency.

---

## Automatic Instrumentation Review

Automatically captured attributes must be reviewed before production use.

Default instrumentation may capture more data than Orion policy permits.

---

## Manual Instrumentation

Manual spans should be introduced when automatic instrumentation cannot explain important application behavior.

Examples:

```text
orders.cancel
reports.render
inventory.reserve
```

Manual instrumentation should remain focused.

---

## Duplicate Instrumentation

Avoid multiple libraries instrumenting the same dependency and producing duplicate spans.

For example:

```text
HTTP framework instrumentation
+
custom middleware instrumentation
```

may generate redundant request spans.

One authoritative instrumentation path should be selected.

---

## Framework Instrumentation

Framework-generated span names and attributes may require normalization to Orion conventions.

Do not accept provider defaults blindly when they produce:

```text
high-cardinality names
unsafe URLs
implementation-specific noise
```

---

## Database Instrumentation

Database instrumentation should expose enough detail to diagnose:

```text
slow query
lock wait
query failure
```

without exposing row values.

---

## Queue Instrumentation

Queue instrumentation should expose:

```text
destination
operation
message type
attempt where appropriate
```

using bounded attributes.

Queue names may be safe if they are architectural identifiers.

---

## Cache Instrumentation

Cache spans may be useful when cache behavior materially affects latency.

Potential operation names:

```text
cache.get
cache.set
cache.invalidate
```

Avoid creating excessive spans for trivial local in-memory caches.

---

## Filesystem Instrumentation

Server filesystem spans are generally unnecessary unless file operations are important or slow.

Do not record sensitive absolute paths by default.

---

## DNS and Network Spans

Low-level network instrumentation may help diagnose specialized failures.

It should not be enabled automatically if it overwhelms higher-value application traces.

---

## Trace Events

A span may contain bounded events.

Useful examples:

```text
retry_started
fallback_used
lock_wait_started
```

Events should remain semantic and safe.

---

## Trace Events vs High-Volume Loops

Do not add one event per:

```text
row
item
byte
loop iteration
```

in large workloads.

Use:

```text
counts
summary attributes
separate child spans
```

where appropriate.

---

## Trace Size Limits

Tracing infrastructure should enforce reasonable limits on:

```text
attributes per span
attribute length
events per span
links per span
spans per trace
```

The exact limits depend on provider and workload.

---

## Truncation

Tracing systems may truncate oversized attributes.

Do not rely on truncation as a privacy mechanism.

Restricted values must be omitted or redacted.

---

## Trace Status and Retries

A failed attempt may have an error status even when the overall operation ultimately succeeds.

Example:

```text
payment attempt 1 → timeout
payment attempt 2 → success
```

The parent operation may succeed while the first child span records failure.

This is valuable diagnostic evidence.

---

## Partial Failure

Traces should make partial failures visible.

A successful parent operation should not hide significant failed dependency attempts when they explain latency or degradation.

---

## Fallbacks

If a fallback path is used, tracing may record:

```text
fallback = true
```

or a semantic event.

Fallback use may indicate degraded behavior and should be observable.

---

## Circuit Breakers

If circuit breakers are introduced, tracing may record bounded state such as:

```text
circuit_open
call_rejected
probe
```

The exact implementation belongs to resilience infrastructure.

---

## Timeouts

Dependency spans should indicate timeout failures distinctly from:

```text
connection refused
business rejection
authentication failure
```

where safe standardized attributes exist.

---

## Cancellation

A cancelled operation should be distinguishable from failure where tracing semantics support it.

Examples include:

```text
client disconnected
job cancelled
request context expired
```

---

## Process Lifecycle

Application startup and shutdown are usually better represented through logs and metrics than distributed traces.

Use traces only if startup has a meaningful multi-step diagnostic workflow worth tracing.

---

## Migrations

Database migrations may use traces for complex operations if valuable.

Migration logs and metrics remain more important for release visibility.

Do not instrument every DDL statement merely to create trace volume.

---

## Health Checks

Routine health checks should usually be excluded from tracing or heavily sampled.

They can dominate trace volume without providing meaningful diagnostic value.

Failures may still require telemetry.

---

## Metrics Scraping

Metrics endpoints should normally be excluded from distributed tracing.

---

## Static Assets

High-volume static asset requests may not require backend traces unless they participate in meaningful application behavior.

---

## Route Exclusions

The tracing configuration may exclude or sample specific routes according to:

```text
volume
diagnostic value
cost
```

Exclusion must not hide critical workflows.

---

## Internal Diagnostics

Tracing systems themselves must expose health and failure signals.

Examples:

```text
export failures
dropped spans
queue saturation
collector failure
```

Loss of observability should be visible.

---

## Telemetry Must Not Break Business Operations

Trace export failure should normally not cause application operations to fail.

Observability is important but must remain outside the critical business path unless a rare explicit requirement says otherwise.

---

## Export Backpressure

If the tracing exporter cannot keep up, instrumentation should use bounded buffers and safe dropping behavior rather than exhausting application memory.

---

## Export Failure

Exporter failures may be logged or measured in a rate-limited manner.

Avoid recursive failure where telemetry errors create more telemetry endlessly.

---

## Collector Isolation

Collector or provider outages should not create catastrophic application failure.

The observability pipeline should degrade safely.

---

## Trace Retention

Trace retention should consider:

```text
diagnostic value
cost
privacy
incident investigation window
```

The exact policy belongs to future data-retention and provider configuration.

---

## Trace Access

Production traces may contain:

```text
resource identifiers
actor identifiers
internal topology
error context
```

Access should be restricted according to production-access policy.

---

## Trace Export to Third Parties

A tracing provider is a data processor for captured telemetry.

Provider selection must account for:

```text
security
privacy
retention
data location
access controls
```

according to actual product requirements.

---

## Trace Attribute Inventory

As Orion matures, common trace attributes should have documented semantics.

Potential shared attributes include:

```text
orion.operation
orion.error_code
orion.actor_id
orion.tenant_id
```

The actual naming convention should follow the chosen standard and avoid duplicating standard attributes.

---

## Semantic Conventions

Prefer standard semantic conventions when they accurately represent the data.

Custom attributes should exist only for Orion-specific concepts.

---

## Stable Operation Names

Operation names shared across:

```text
traces
logs
metrics
error reports
```

can substantially improve cross-signal investigation.

For example:

```text
orders.cancel
```

may appear consistently across all telemetry.

This should be encouraged where practical.

---

## Unified Correlation Model

The desired observability model is:

```text
operation
    ↓
traceId
    ├── spans
    ├── structured logs
    ├── errors
    └── selected metrics
```

This does not require duplicating all data across every signal.

It requires enough shared metadata to navigate between them.

---

## AI Investigation

Tracing should allow an AI agent, under appropriate authorization, to investigate:

```text
which dependency dominated latency

which span first failed

whether retries occurred

which job originated from a request

which release produced the trace
```

without needing raw sensitive payloads.

---

## AI Agent Requirements

Before adding manual tracing, an AI agent should ask:

```text
Which causal boundary becomes visible?

Is automatic instrumentation already sufficient?

Will this span add meaningful latency or failure evidence?

Are all proposed attributes safe?
```

---

## AI and Span Granularity

An AI agent should not instrument every function automatically.

It should prefer:

```text
transport boundaries
application operations
important dependencies
async boundaries
```

---

## AI and Sensitive Attributes

An AI agent must not add:

```text
request body
response body
token
password
email
raw SQL parameters
user content
```

to trace attributes without an explicit approved policy.

Restricted data remains prohibited.

---

## AI and Trace Propagation

When adding a new:

```text
queue
worker
RPC boundary
HTTP client
```

an AI agent should consider trace propagation and ensure context is not lost or leaked.

---

## AI and Async Causality

An AI agent should not force a parent-child trace relationship when:

```text
operation executes much later
multiple parents exist
fan-out is extreme
```

Trace links or workflow identifiers may better represent reality.

---

## AI and Sampling

An AI agent should not disable sampling globally merely to debug a local issue.

Temporary tracing changes should remain bounded and secure.

---

## AI and Error Reporting

An AI agent should preserve trace correlation when integrating centralized error reporting.

Unexpected errors should ideally be navigable to their trace.

---

## AI and Tests

Changes to propagation, redaction, automatic instrumentation, or context isolation should include tests where practical.

---

## New Span Checklist

Before adding a manual span, answer:

1. What operation does the span represent?
2. Why is existing instrumentation insufficient?
3. What stable low-cardinality name should it use?
4. Which parent or link relationship applies?
5. Which attributes are operationally useful?
6. Are all attributes safe?
7. Could this span create excessive volume?
8. Will it materially improve latency or failure diagnosis?
9. Does the span duplicate another instrumentation layer?
10. How will the behavior be tested?

---

## New Trace Attribute Checklist

Before adding an attribute, answer:

1. What does the attribute mean?
2. Is a standard semantic convention available?
3. Is the field sensitive?
4. Is it high cardinality?
5. Does it help actual diagnosis?
6. Could an opaque identifier replace personal data?
7. Does the value have bounded vocabulary?
8. Does the field need to cross a trust boundary?
9. Is it already available through logs or error reporting?
10. Is the added storage cost justified?

---

## Async Propagation Checklist

Before propagating tracing across an asynchronous boundary, answer:

1. Is there one causal parent or several?
2. How long may the work be delayed?
3. Can the message be retried or duplicated?
4. Should execution continue the same trace or create a linked trace?
5. Which trace context fields are propagated?
6. Can external systems modify the context?
7. How is malformed context handled?
8. How is context leakage prevented?
9. Which message identifiers provide additional correlation?
10. How will propagation be tested?

---

## Sampling Checklist

Before changing sampling, answer:

1. Which traffic is affected?
2. What is current volume?
3. What diagnostic evidence may be lost?
4. Are error traces retained?
5. Are slow traces retained?
6. Is the rule deterministic?
7. Does the change materially affect cost?
8. Can the rule create biased observability?
9. How will dropped telemetry be measured?
10. How will the strategy be reviewed after deployment?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Span Per Function

Avoid.

---

### Dynamic Span Names Containing Resource IDs

Avoid.

---

### Request Body in Span Attributes

Prohibited by default.

---

### Response Body in Span Attributes

Prohibited by default.

---

### Credentials in Trace Context

Prohibited.

---

### Personal Data in Baggage

Prohibited by default.

---

### Raw SQL Parameters in Spans

Prohibited by default.

---

### Entire ORM Object as Trace Attribute

Prohibited.

---

### Trace Context Used for Authentication

Prohibited.

---

### Trace ID Used as Authorization Evidence

Prohibited.

---

### One Multi-Day Trace for Long Workflow

Avoid.

---

### Duplicate HTTP Spans From Multiple Instrumentation Layers

Avoid.

---

### Tracing Every Health Check

Avoid.

---

### Sampling All Traces Uniformly Regardless of Error or Value

Avoid when smarter retention is practical.

---

### Observability Provider Failure Breaks Business Operation

Avoid.

---

### Alerting on High-Cardinality Span Names

Avoid.

---

### Custom Trace Protocol When Standard Propagation Exists

Avoid.

---

## Initial Tracing Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Distributed traces should represent meaningful causal execution.
2. Span names must be stable and low cardinality.
3. Trace context should propagate automatically across supported runtime boundaries where practical.
4. Tracing must not be used as an authentication or authorization mechanism.
5. Open tracing standards should be preferred over vendor-specific application coupling.
6. Application spans should focus on meaningful operations rather than individual functions.
7. Automatic instrumentation should be reviewed for unsafe or noisy default attributes.
8. Complete request bodies and response bodies must not be captured by default.
9. `RESTRICTED` data must never be intentionally attached to traces.
10. Logs and error reports should correlate with trace IDs where practical.
11. Database tracing must avoid raw bind values and sensitive row data.
12. Asynchronous work should preserve causal relationships through propagation, links, or safe workflow identifiers.
13. Long-lived workflows should not be forced into one unbounded trace.
14. Trace volume and span count should be controlled through deliberate instrumentation and sampling.
15. Unexpected errors and important slow operations should receive higher trace-retention priority where supported.
16. Trace export failure should not normally fail business operations.
17. Trace context must not leak between requests, jobs, or tenants.
18. Propagation, context isolation, and sensitive-data redaction should be testable.
19. AI agents must reason about span value, causality, safety, and volume before adding instrumentation.
20. Trace conventions should become mechanically standardized where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
OpenTelemetry adoption details
collector
tracing provider
common span naming
custom attribute namespace
head vs tail sampling
sampling rates
browser/mobile tracing
trace retention
automatic instrumentation packages
```

These choices should follow the selected runtime stack, deployment platform, observability architecture, and actual traffic volume.

Significant choices should be captured through ADRs.

---

## Future Documentation

This document should be complemented by:

- [docs/reliability/metrics.md](metrics.md)
- [docs/reliability/error-reporting.md](error-reporting.md)
- [docs/reliability/health-checks.md](health-checks.md)
- [docs/reliability/alerting.md](alerting.md)
- [docs/security/production-access.md](../security/production-access.md)
- [docs/security/data-retention.md](../security/data-retention.md)

Provider-specific tracing configuration should be documented only after the observability stack is selected.

---

## Summary

Tracing describes causal execution.

The intended model is:

```text
logical operation
    ↓
trace
    ↓
meaningful spans
    ↓
safe attributes
    ↓
distributed propagation
    ↓
diagnostic evidence
```

Orion prefers:

```text
causal visibility over maximum instrumentation

stable low-cardinality names over dynamic span names

open standards over vendor coupling

safe metadata over payload capture

links and workflow correlation over artificial long-lived trace trees

selective sampling over uncontrolled trace cost

cross-signal correlation over duplicated telemetry
```

A useful trace should make system behavior easier to explain.

It should show where time was spent.

It should show where failure began.

It should preserve causality across relevant runtime boundaries.

It should do all of this without turning application data into telemetry.
