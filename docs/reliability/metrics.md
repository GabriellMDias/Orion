# Metrics

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0010](../adr/0010-establish-observability-logging-tracing-metrics-and-error-reporting-strategy.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Metric Types](#metric-types)
- [Dimensions](#dimensions)
- [Cardinality](#cardinality)
- [Metric Registry](#metric-registry)
- [New Metric Checklist](#new-metric-checklist)

Related policy: [telemetry redaction](../security/telemetry-redaction.md), [alerting](alerting.md).

## Purpose

This document defines the metrics principles used by Orion.

Its goals are to ensure that metrics are:

- meaningful;
- bounded;
- low-cardinality;
- consistent;
- safe;
- suitable for dashboards and alerting;
- useful for reliability analysis;
- understandable by humans and AI agents;
- compatible with future SLOs;
- independent from a specific metrics vendor.

Metrics summarize system behavior numerically over time.

They should help answer questions such as:

```text
How many requests are being served?

How often are operations failing?

How long do operations take?

How much work is waiting?

Is a dependency becoming unhealthy?

Is the system approaching a resource limit?
```

Metrics are not intended to identify every individual request.

That is the role of logs, traces, and error reports.

This document is technology-agnostic.

ADR-0010 selects OpenTelemetry metrics and the telemetry transport strategy. Implementation details, storage, dashboards, and alerting platforms remain deployment-specific.

This document complements:

- [docs/reliability/observability.md](observability.md);
- [docs/reliability/logging.md](logging.md);
- [docs/reliability/tracing.md](tracing.md);
- [docs/reliability/alerting.md](alerting.md);
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md).

---

## Core Principle

Metrics should represent bounded numerical questions about system behavior.

The intended model is:

```text
runtime behavior
    ↓
meaningful measurement
    ↓
bounded dimensions
    ↓
time-series aggregation
    ↓
dashboard / alert / reliability analysis
```

A metric should exist because someone needs to ask a recurring numerical question.

Do not create metrics merely because a value can be measured.

---

## Metrics Are Aggregated Signals

Metrics are optimized for aggregation.

Examples:

```text
request count
error rate
latency distribution
queue depth
active connections
retry count
```

They are not optimized for identifying a specific:

```text
request
user
order
trace
job
```

High-cardinality investigation belongs primarily in logs and traces.

---

## Metric Types

Orion recognizes three fundamental conceptual metric types:

```text
counter
gauge
histogram
```

Specific libraries may expose additional types or abstractions.

These three concepts should remain sufficient for most application telemetry.

---

## Counter

A counter represents a cumulative quantity that increases over time.

Examples:

```text
requests processed
errors observed
jobs completed
retries attempted
events published
```

Conceptually:

```text
0
1
2
3
4
...
```

Counters should not normally decrease.

---

## Counter Rates

Operational analysis often uses the rate of a counter rather than its absolute value.

For example:

```text
requests per second

errors per minute
```

The metrics backend should derive rates from counters.

Do not manually emit a rate metric when the backend can calculate it reliably.

---

## Counter Reset

Process restart may reset an in-process counter.

Metrics systems should handle this according to their aggregation model.

Application code should not attempt to preserve counters across restarts unless the metric semantics explicitly require durable state.

---

## Gauge

A gauge represents a value that can increase or decrease.

Examples:

```text
queue depth
active workers
open connections
memory usage
in-flight requests
```

Conceptually:

```text
12
17
9
22
```

A gauge represents current or recently observed state.

---

## Gauge Ownership

A gauge should have one understandable source of truth.

Avoid multiple application instances reporting:

```text
global_queue_depth
```

when each instance only knows local queue depth unless the metrics backend aggregation semantics are intentionally defined.

---

## Local vs Global Gauges

A gauge may represent:

```text
local process state
```

or:

```text
global system state
```

The metric name and dimensions should make this distinction clear.

---

## Histogram

A histogram represents the distribution of measured values.

Common examples include:

```text
request duration
database query duration
job execution duration
payload size
```

Histograms allow analysis of:

```text
percentiles
distribution
count
sum
```

depending on the backend.

---

## Histograms for Latency

Latency should generally use histograms rather than averages alone.

An average such as:

```text
100 ms
```

can hide:

```text
99% of requests = 20 ms
1% of requests = 8 seconds
```

Tail latency matters.

---

## Percentiles

Useful latency analysis may include:

```text
p50
p90
p95
p99
```

The exact percentile depends on service characteristics.

Do not create every possible percentile merely because the provider supports it.

---

## Histogram Buckets

Some metrics systems require explicit histogram buckets.

Buckets should reflect meaningful expected ranges.

They should not be copied blindly from unrelated systems.

The exact bucket strategy is deferred until metrics tooling and workloads exist.

---

## Summary-Type Metrics

Some metrics libraries provide summaries that calculate quantiles locally.

Use them only after understanding:

```text
aggregation behavior
multi-instance behavior
cost
```

Histograms are often more suitable for distributed aggregation.

---

## Metric Name

Every metric should have a stable semantic name.

Examples:

```text
http.server.requests
jobs.processed
database.query.duration
provider.requests
```

or the naming convention selected by the metrics standard.

Metric names should describe the measured quantity.

---

## Metric Naming Convention

The exact naming convention should follow established semantic conventions where practical.

Orion should avoid inventing an incompatible naming scheme when open standards already provide suitable names.

Custom metrics should remain consistently namespaced.

---

## Metric Names Must Be Stable

Dashboards and alerts may depend on metric names.

Renaming established metrics is an operational compatibility change.

Do not rename metrics casually after operational consumers exist.

---

## Metric Name Cardinality

Metric names must not contain runtime identifiers.

Bad:

```text
orders.ord_123.duration
```

Good:

```text
orders.operation.duration
```

with a bounded operation dimension if needed.

---

## Dimensions

Metrics may include dimensions, labels, tags, or attributes.

These allow one metric to be segmented.

For example:

```text
http.server.requests{
    method="GET",
    route="/orders/{orderId}",
    status_class="2xx"
}
```

Dimensions are powerful.

They are also the primary source of metrics-cardinality problems.

---

## Cardinality

Cardinality is the number of distinct time-series combinations produced by a metric.

For example:

```text
method:
    5 values

route:
    20 values

status:
    6 values
```

could potentially create:

```text
5 × 20 × 6 = 600
```

series.

Adding one unbounded identifier can increase this dramatically.

---

## Cardinality Must Be Bounded

Metric dimensions must have a predictable bounded set of values.

Good candidates include:

```text
method
route template
status class
operation
provider
job type
result
environment
service
```

when their vocabularies are bounded.

---

## High-Cardinality Labels

The following should not be metric labels:

```text
userId
requestId
traceId
errorId
orderId
jobId
email
IP address
raw URL
exception message
SQL statement
```

They create unbounded or near-unbounded cardinality.

---

## Resource Identifiers

Do not put resource identifiers in metric dimensions.

Bad:

```text
orderId="ord_..."
```

If investigation requires a particular order, use logs or traces.

---

## Error Messages

Never use arbitrary error messages as metric labels.

Bad:

```text
error="Connection failed for customer 123..."
```

Prefer bounded semantic dimensions such as:

```text
error_code="DEPENDENCY_UNAVAILABLE"
```

or:

```text
error_category="dependency"
```

---

## Exception Type

Exception class/type may still create unexpected cardinality if third-party libraries generate many classes or dynamic values.

Prefer stable error categories where practical.

---

## HTTP Routes

Metrics should use:

```text
/orders/{orderId}
```

rather than:

```text
/orders/ord_01J...
```

Raw paths create cardinality proportional to resource count.

---

## Query Parameters

Query values must never become metric labels by default.

Even apparently harmless search terms create unbounded cardinality and may contain sensitive data.

---

## Tenant IDs

Tenant identifiers should generally not be metric labels.

Even when tenant count is currently small, it may grow significantly.

Per-tenant operational analysis should use another mechanism unless a specific bounded requirement justifies it.

---

## User IDs

User identifiers must not be metric labels.

Use logs or analytical systems for per-user investigation.

---

## Client Versions

Client version can become high cardinality over time.

If needed, it should be normalized or bounded according to an explicit support model.

For example:

```text
supported
deprecated
unsupported
```

may be more useful than every exact build number.

Exact client versions may still belong in logs.

---

## Release Versions

Release identifiers may create moderate cardinality.

They may be useful temporarily for deployment comparison.

The metrics architecture should understand retention and dimension cost before using exact releases broadly.

---

## Result Dimensions

A bounded result dimension can be useful.

Example:

```text
result:
    success
    failure
    denied
    cancelled
```

Do not generate result labels dynamically from arbitrary messages.

---

## Error Code Dimensions

Stable Orion error codes may be useful metric dimensions if the set is bounded for the measured operation.

However, a global metric containing hundreds or thousands of possible codes may become expensive.

Use:

```text
error_category
```

when detailed error-code segmentation is unnecessary.

---

## Dimensions Should Answer Questions

Before adding a dimension, ask:

```text
Which recurring operational question requires filtering or grouping by this field?
```

If no answer exists, omit it.

Every dimension increases cost and complexity.

---

## Cardinality Budget

Important metrics should have an implicit or explicit cardinality budget.

A metric should have a predictable upper bound on:

```text
number of label names
number of values per label
total series count
```

Formal budgets may be introduced later if scale requires them.

---

## Cardinality Review

Metrics changes should be reviewed for worst-case cardinality.

Do not review only the number of labels.

A single unbounded label is enough to make a metric unsafe.

---

## Units

Metric units must be explicit and standardized.

Examples include:

```text
seconds
milliseconds
bytes
items
requests
connections
```

Prefer standard base units when the selected observability standard recommends them.

---

## Unit Naming

Avoid ambiguous metrics such as:

```text
request_time
```

without knowing whether the unit is:

```text
seconds
milliseconds
microseconds
```

Unit semantics must be clear from schema or standard convention.

---

## Duration

Duration metrics should use one canonical unit according to the selected metrics conventions.

Application teams should not emit:

```text
duration_ms
duration_seconds
duration_us
```

for equivalent concepts without a reason.

---

## Data Size

Data size should use standardized byte-based units.

Avoid ambiguous:

```text
payload_size = 5
```

when the consumer cannot know whether that means bytes, KB, or MB.

---

## Counts

Counts should represent whole events or items.

Do not append arbitrary units when a metric is dimensionless.

---

## Service Health Metrics

Service reliability can often be described using a small set of high-value signals.

A common conceptual model is:

```text
rate
errors
duration
```

sometimes called RED.

---

## Rate

Rate measures how much work the system is receiving or completing.

Examples:

```text
HTTP requests
jobs processed
events consumed
provider calls
```

---

## Errors

Error metrics measure unsuccessful operational outcomes.

The system should distinguish:

```text
expected business rejection
```

from:

```text
technical failure
```

when reliability analysis requires it.

---

## Duration

Duration measures latency of meaningful operations.

Examples:

```text
HTTP request latency
job processing latency
dependency latency
database query latency
```

---

## RED Is a Heuristic

Rate, errors, and duration are useful for request-oriented services.

They are not a complete universal metric model.

Workers, infrastructure resources, and queues may require additional measurements.

---

## Resource Metrics

Infrastructure and constrained resources may use a conceptual model such as:

```text
utilization
saturation
errors
```

sometimes called USE.

---

## Utilization

Utilization measures how busy a finite resource is.

Examples:

```text
CPU utilization
connection pool usage
worker utilization
```

---

## Saturation

Saturation indicates queued demand beyond immediately available capacity.

Examples:

```text
connection pool waiters
queue depth
thread pool backlog
```

---

## Resource Errors

Resource systems may expose failures such as:

```text
connection acquisition timeout
disk error
memory allocation failure
```

---

## USE Is a Heuristic

The USE model is useful for finite resources.

It should not lead to speculative instrumentation for resources Orion does not operate directly.

---

## Application Metrics

Application-level metrics should measure meaningful runtime behavior.

Examples:

```text
orders.cancelled
reports.generated
jobs.completed
```

Only create such metrics when the aggregated behavior is operationally useful.

---

## Business Metrics

Business metrics and reliability metrics are distinct.

Example business questions:

```text
How many paid subscriptions were created?

What is conversion rate?

How much revenue was processed?
```

These often belong in analytics or business intelligence systems.

---

## Business Metrics in Operational Telemetry

Some business-level counts may still provide useful operational signals.

For example:

```text
payments.completed
```

may help detect a payment-system outage.

If used operationally, their purpose should be explicit.

---

## Analytics Is Not Metrics by Default

Do not turn the observability metrics system into the primary analytics warehouse.

Metrics backends are optimized for bounded time-series data, not arbitrary business analysis.

---

## Technical vs Business Failure

An operation may fail for a normal business reason.

For example:

```text
order cancellation rejected because order is shipped
```

This should not necessarily increase a:

```text
system_errors_total
```

metric.

Reliability metrics should represent technical service health accurately.

---

## Request Metrics

HTTP APIs should generally expose metrics for:

```text
request count
duration
broad result/status
```

using route templates and bounded dimensions.

---

## HTTP Status Classes

Metrics may use status class:

```text
2xx
3xx
4xx
5xx
```

instead of every exact status where detailed segmentation is unnecessary.

Exact status may still be bounded enough in many systems.

The convention should be consistent.

---

## 4xx Errors

A `4xx` is not automatically a system reliability failure.

Examples include:

```text
validation rejected
authentication required
permission denied
resource not found
```

Some specific 4xx spikes may still indicate application or security issues.

---

## 5xx Errors

Unexpected `5xx` responses are generally relevant reliability signals.

They should be visible through request error metrics and error-reporting systems.

---

## Latency Metrics

Latency should be measured at meaningful boundaries.

Examples:

```text
HTTP request
application operation
provider call
job execution
database query
```

Do not create latency metrics for every internal helper.

---

## Dependency Metrics

Important external dependencies may expose:

```text
request count
error count
latency
timeout count
retry count
```

with bounded provider and operation dimensions.

---

## Provider Dimensions

Provider name can be a useful dimension if the number of providers is small and controlled.

Do not use arbitrary remote hostname as a metric label.

---

## Database Metrics

Useful application-level database metrics may include:

```text
query duration
query failure count
transaction retry count
deadlock count
connection pool wait duration
```

Database infrastructure may expose additional native metrics.

---

## Query Cardinality

Never label database metrics with raw SQL text.

If query-level grouping is necessary, use:

```text
normalized operation
query name
repository operation
```

with bounded identifiers.

---

## Connection Pool Metrics

Connection pools may expose:

```text
active connections
idle connections
pending waiters
acquisition duration
timeout count
```

These can be strong saturation signals.

---

## Queue Metrics

Important queue metrics may include:

```text
queue depth
oldest message age
processing rate
failure rate
retry rate
dead-letter count
```

depending on infrastructure.

---

## Queue Depth

Queue depth is useful but incomplete.

A queue of:

```text
10,000 messages
```

may be healthy if processing capacity is enormous.

It may be critical if throughput is low.

Combine backlog with throughput and age.

---

## Message Age

The age of the oldest unprocessed message may provide a better latency signal than queue depth alone.

This is especially useful for bursty workloads.

---

## Worker Metrics

Workers may expose:

```text
jobs started
jobs completed
jobs failed
job duration
retry count
in-flight jobs
```

using bounded job-type dimensions.

---

## Job Type Cardinality

Job types should be architectural identifiers.

Do not dynamically create a job-type label from arbitrary user-defined data.

---

## Retry Metrics

Retries should be measurable.

Useful dimensions may include:

```text
operation
reason category
attempt class
```

Avoid attempt number as an unbounded dimension.

If attempt number has a fixed small range, it may be acceptable.

---

## Retry Success

It may be useful to distinguish:

```text
succeeded without retry
succeeded after retry
failed after retries
```

when retry behavior materially affects reliability.

---

## Dead-Letter Metrics

Dead-letter queue growth is often an important operational signal.

Metrics may include:

```text
dead-lettered messages
current dead-letter backlog
```

with bounded message-type dimensions.

---

## Cache Metrics

Caches may expose:

```text
hit count
miss count
error count
operation duration
```

when cache behavior materially affects reliability.

---

## Cache Hit Ratio

Hit ratio should generally be derived from:

```text
hits
misses
```

rather than emitted as a continuously calculated application metric if the backend can compute it.

---

## File Storage Metrics

If object/file storage becomes operationally significant, useful metrics may include:

```text
operation count
error count
duration
bytes transferred
```

with bounded operation labels.

---

## Authentication Metrics

Authentication systems may expose operational metrics such as:

```text
authentication attempts
authentication failures
session refresh failures
provider failures
```

Care must be taken not to turn user or credential identifiers into labels.

---

## Security Metrics

Some security-related aggregated signals may belong in metrics.

Examples:

```text
invalid signature count
rate-limit decisions
authentication failure count
```

Security telemetry may require separate access or retention.

---

## Authorization Metrics

Authorization denials can be measured in aggregate when useful.

Dimensions should remain bounded.

Do not label by user or resource ID.

A denial rate may be normal for some public APIs.

---

## Error Metrics

Errors should use stable categories.

Examples:

```text
validation
authentication
authorization
domain_conflict
dependency
infrastructure
unexpected
```

Detailed investigation belongs in logs and error reports.

---

## Error Code Metric

A code dimension may be useful for a bounded subset of public/application errors.

Before using it, estimate:

```text
maximum code count
series count
operational value
```

---

## Error Message Metric

Using human-readable error messages as labels is prohibited.

Messages are unstable and high cardinality.

---

## Exception Message Metric

Using exception messages as labels is prohibited.

---

## Metrics and Data Classification

Metrics must follow:

- [docs/security/data-classification.md](../security/data-classification.md)
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

Aggregated telemetry does not automatically become non-sensitive.

---

## Restricted Data

`RESTRICTED` values must never be intentionally used in metric values or labels when they represent secrets or credentials.

---

## Personal Data

Personal data should not be metric labels.

Metrics systems are designed for aggregation, not personal-data lookup.

---

## Sensitive Categories

Even a bounded category may reveal sensitive information.

For example:

```text
medical_condition="..."
```

would remain inappropriate merely because the possible value set is small.

Classification applies before cardinality.

---

## Metric Values and Sensitive Data

The numerical value itself may be sensitive in some contexts.

For example:

```text
account_balance
```

should not be exported as an infrastructure metric merely because it is numeric.

Metrics must represent operational questions, not arbitrary database values.

---

## PII-Free Design

Metrics should ideally be designed so that an individual person cannot be identified from a time series.

---

## Sampling

Metrics generally aggregate all observed events rather than sampling individual operations at application level.

The telemetry pipeline may still use aggregation, temporality, or provider-specific collection techniques.

Do not randomly sample counters unless the resulting mathematics are explicitly correct.

---

## Metrics and Tracing Sampling

A trace may be unsampled while request metrics still count the operation.

Metrics should provide broad population visibility even when tracing uses sampling.

---

## Metrics Loss

Telemetry pipelines may occasionally drop metric data.

Business correctness must not depend on metrics delivery.

Metrics are observational, not transactional state.

---

## Telemetry Must Not Break Operations

Failure to export metrics should not normally cause business operations to fail.

Use bounded buffers and safe failure behavior.

---

## Instrumentation Overhead

Metrics instrumentation should have low runtime overhead.

Avoid expensive synchronous network operations per measurement.

Metric exporters should batch or aggregate according to selected tooling.

---

## Cardinality Overhead

Cardinality can consume:

```text
memory
CPU
network
storage
provider quota
```

even before data reaches the backend.

Unsafe labels are therefore an application reliability risk, not merely a billing issue.

---

## Dashboards

Dashboards should answer operational questions.

Examples:

```text
Is the API healthy?

Are background jobs keeping up?

Did the latest release increase error rate?

Which dependency is slow?
```

Do not create dashboards simply to display every metric available.

---

## Dashboard Ownership

Important dashboards should have identifiable ownership.

A dashboard with no operational use should not be treated as required infrastructure.

---

## Dashboard Hierarchy

Operational dashboards may eventually be organized conceptually as:

```text
system overview
    ↓
application/service
    ↓
dependency or workflow
```

This should follow actual runtime topology.

---

## Golden Signals

A service overview may use a small group of high-value signals such as:

```text
traffic
errors
latency
saturation
```

These provide a useful starting point.

They are not a complete checklist for every application.

---

## Dashboards and Releases

Dashboards should make release changes visible where practical.

This helps correlate:

```text
latency increase
error increase
throughput change
```

with deployments.

---

## Metrics and SLOs

Metrics should be designed so future Service Level Objectives can be defined from reliable measurements.

Potential SLO dimensions include:

```text
availability
successful request rate
latency
job completion time
```

Do not create SLOs before meaningful user-facing reliability requirements exist.

---

## Service Level Indicator

An SLI is a measured indicator of service behavior.

Examples:

```text
successful eligible requests / eligible requests

requests completed under 500 ms / eligible requests
```

Metrics should support accurate SLI computation where future SLOs are expected.

---

## Service Level Objective

An SLO defines a target for an SLI over a period.

Conceptual example:

```text
99.9% of eligible requests succeed over 30 days
```

Exact objectives must come from product and reliability requirements.

Do not invent arbitrary "three nines" goals.

---

## Service Level Agreement

An SLA is a contractual or external commitment.

Orion architecture should not treat SLO and SLA as interchangeable.

A project may use internal SLOs without any external SLA.

---

## Eligible Events

SLO metrics need explicit eligibility rules.

For example:

```text
invalid client request
```

may not count against service availability.

But:

```text
valid request failing due to database outage
```

likely should.

The classification must reflect user experience and service responsibility.

---

## Error Budget

An error budget represents tolerated unreliability under an SLO.

It may later guide:

```text
release risk
reliability investment
incident prioritization
```

This should be introduced only after real SLOs exist.

---

## Burn Rate

SLO alerting may eventually use error-budget burn rate.

This is generally more meaningful than static alert thresholds for availability objectives.

Exact alerting strategy belongs in:

- [docs/reliability/alerting.md](alerting.md)

---

## Metric Accuracy

A metric should measure what its name claims.

Avoid counters whose semantics depend on ambiguous code paths.

For example:

```text
orders_completed
```

should increment only when the business definition of completion is satisfied.

---

## Metric Emission Point

Emit a metric at the boundary where the outcome is authoritative.

Avoid counting the same logical operation at several layers unless the metrics have clearly different meanings.

---

## Double Counting

If both:

```text
controller
service
```

increment:

```text
orders_created
```

one business event may be counted twice.

Metric ownership must be explicit.

---

## Retry Counting

Retries create similar counting risks.

Distinguish:

```text
logical operations
attempts
```

For example:

```text
provider.requests
```

may count every attempt.

```text
payments.logical_operations
```

may count one business operation.

Names and documentation must make the difference clear.

---

## Attempts vs Outcomes

For retryable work, useful metrics may include:

```text
attempt count
logical operation count
final success count
final failure count
```

Do not conflate them.

---

## Idempotent Retries

Duplicate idempotent requests may still count as incoming traffic.

Business outcome metrics should avoid counting the same logical action repeatedly if semantics require unique outcomes.

---

## Event Metrics

Event systems may distinguish:

```text
events published
delivery attempts
events consumed
events processed successfully
events deduplicated
```

Each metric represents a different operational question.

---

## Business Outcome Counters

A business outcome counter should increment only at the authoritative durable outcome.

For example:

```text
payment.completed
```

should not increment before the transaction is known to be complete.

---

## Metrics Naming and Event Naming

Log event names and metric names may share conceptual vocabulary.

They should not be identical merely for symmetry.

Example:

```text
log event:
    payment.provider.failed

counter:
    payment.provider.failures
```

The exact convention should follow selected standards.

---

## Monotonicity

Counters should remain monotonic within their intended lifecycle.

If a measured quantity can decrease, use a gauge instead.

---

## Derived Metrics

Prefer deriving ratios and rates in the metrics backend.

Examples:

```text
error rate =
errors / requests

cache hit ratio =
hits / (hits + misses)
```

This keeps primitive instrumentation simple and avoids inconsistent calculations across processes.

---

## Recording Percentages

Do not usually emit a changing percentage gauge when the underlying counts can be emitted.

Counts retain more information and can be aggregated correctly.

---

## Averages

Avoid emitting only averages.

For latency and size distributions, histograms preserve much more operational information.

---

## Minimum and Maximum

Min/max values alone can be misleading.

A single extreme observation can dominate a maximum without showing frequency.

Use distributions where appropriate.

---

## Time Windows

Application code should not normally implement its own rolling time windows for metrics.

The metrics backend is better suited for aggregation over:

```text
5 minutes
1 hour
30 days
```

---

## Metric Temporality

Metrics backends may use cumulative or delta temporality.

Application code should follow the selected instrumentation model rather than implementing custom temporality.

---

## Start-Up Metrics

An application may expose process and runtime metrics automatically.

Do not create custom application metrics duplicating standard runtime metrics.

---

## Runtime Metrics

Useful standard metrics may include:

```text
CPU
memory
garbage collection
event-loop lag
thread utilization
```

depending on runtime.

Use mature runtime instrumentation rather than custom measurement where possible.

---

## Process Metrics

Process-level metrics should be standardized by observability infrastructure.

Applications should not implement their own versions of common process telemetry.

---

## Infrastructure Metrics

Cloud/platform systems may already provide:

```text
CPU
memory
network
disk
load balancer metrics
database metrics
queue metrics
```

Prefer authoritative platform metrics over duplicate application instrumentation.

---

## Application-Owned Metrics

Custom application metrics should exist where infrastructure metrics cannot answer the operational question.

---

## Provider Metrics

External providers may expose their own service metrics.

Orion application telemetry should focus on the behavior as observed by Orion.

For example:

```text
provider call latency
provider call failures
```

rather than trying to reproduce provider-internal telemetry.

---

## Health Metrics

A health status itself does not always need a metric if readiness and alerting already have better signals.

Avoid binary:

```text
service_healthy = 1
```

when meaningful underlying metrics are available.

---

## Health State Transitions

Health state changes may still be logged or counted if operationally useful.

Exact health semantics belong in:

- [docs/reliability/health-checks.md](health-checks.md)

---

## Deployment Metrics

Operational deployment systems may expose:

```text
deployment count
deployment failure
rollback count
```

if useful.

These may come from CI/CD rather than application runtime.

---

## Migration Metrics

Database migrations may expose:

```text
migration duration
migration failure count
backfill progress
```

for significant operations.

Long-running backfills may need gauges or counters representing progress.

---

## Backfill Metrics

Useful long-running backfill metrics may include:

```text
rows processed
rows failed
remaining estimate
batch duration
```

where these quantities are safe and operationally meaningful.

---

## Data Volume Metrics

Aggregate row counts may sometimes help capacity planning.

Do not export sensitive per-customer data as dimensions.

---

## Cost Metrics

Some providers expose cost or usage metrics.

These may help operational planning.

Financial reporting should remain separate from technical metrics.

---

## Feature Flags

Feature-flag state should not become a label on every metric.

This can multiply cardinality dramatically.

If comparison is required, use bounded rollout cohorts or release annotations carefully.

---

## Experiment Metrics

Product experiments generally belong in analytics systems.

Observability metrics should not become an uncontrolled experimentation platform.

---

## Metrics Documentation

Important custom metrics should have canonical documentation.

Documentation should include:

```text
name
type
unit
description
dimensions
owner
```

where practical.

---

## Metric Description

A metric description should explain exactly what is measured.

Bad:

```text
orders metric
```

Better:

```text
Number of order cancellation attempts that reached the application operation boundary.
```

---

## Label Documentation

Custom dimensions should document:

```text
meaning
allowed values
cardinality expectations
```

where non-obvious.

---

## Metric Registry

Orion may eventually maintain a machine-readable registry for custom application metrics.

This could support:

```text
documentation
cardinality validation
dashboard generation
AI reasoning
```

It should be introduced only if the selected metrics instrumentation does not already provide suitable metadata.

---

## Metric Ownership

Every important custom metric should have an owner.

Ownership should answer:

```text
Who understands its semantics?

Who should approve label changes?

Who removes it when no longer used?
```

---

## Metric Lifecycle

Metrics have lifecycle cost.

A metric may progress through:

```text
introduced
used
deprecated
removed
```

Unused metrics should not remain emitted forever.

---

## Metric Deprecation

If dashboards or alerts depend on a metric, removal requires migrating those consumers.

Metric names and label schemas are operational contracts.

---

## Instrumentation Drift

Metrics should not silently change semantics while retaining the same name.

If the meaning changes materially, either migrate consumers deliberately or introduce a new metric.

---

## Dashboard Drift

A dashboard may continue rendering even after the metric semantics changed.

This can be more dangerous than a dashboard breaking visibly.

Semantic stability matters.

---

## Metric Verification

Important metrics should be validated where practical.

Examples:

```text
counter increments once

required bounded label exists

sensitive label absent

duration recorded in correct unit
```

Do not unit-test every automatic runtime metric.

---

## Cardinality Tests

High-risk instrumentation may include tests ensuring no unbounded field becomes a label.

Static tooling may eventually detect obvious violations such as:

```text
userId
requestId
traceId
```

used as dimensions.

---

## Instrumentation Integration Tests

Integration tests may verify that:

```text
HTTP request produces expected request metric

job completion increments correct counter

provider timeout records failure category
```

for critical observability behavior.

---

## Metrics in Test Environments

Tests should not require the production metrics provider.

Use in-memory or test metric readers/exporters where useful.

---

## Test Isolation

Metric state should not leak across tests in a way that makes assertions order-dependent.

---

## Metrics and Local Development

Local metrics collection may be optional.

Instrumentation code should still execute consistently enough that production behavior is not a separate untested code path.

---

## Debugging Metrics

Metrics are generally poor tools for debugging one individual event.

If a developer asks:

```text
Why did order 123 fail?
```

logs and traces are more appropriate.

Metrics answer:

```text
How often are order cancellations failing?
```

---

## Alerting

Metrics are a primary input for many alerts.

Alert design belongs in:

- [docs/reliability/alerting.md](alerting.md)

Metrics used for alerting should be:

```text
reliable
well-defined
stable
hard to accidentally disappear
```

---

## Alert-Safe Metrics

A metric powering critical alerts deserves stronger compatibility and testing than an exploratory metric.

Removing or renaming it can disable incident detection.

---

## Missing Data

Absence of metrics can mean:

```text
no events occurred
instrumentation failed
service is down
collector failed
query is wrong
```

Alerting should distinguish these possibilities when important.

---

## Zero vs Missing

A metric value of zero is not always equivalent to no time series.

This distinction matters for:

```text
alerts
dashboards
SLO calculations
```

Instrumentation and queries should be designed accordingly.

---

## Metrics Pipeline Health

The telemetry pipeline should expose its own health signals.

Potential indicators include:

```text
export failures
dropped measurements
buffer saturation
collector failure
```

Loss of metrics should not remain invisible.

---

## Recursive Telemetry Failure

Metrics export failures should not create unbounded new metrics or logs that worsen the telemetry outage.

Failure reporting must be bounded.

---

## Provider Quotas

Metrics providers may impose:

```text
series limits
ingestion limits
attribute limits
retention limits
```

Instrumentation should remain within known limits.

---

## Cost Control

Metrics cost depends heavily on:

```text
series count
retention
resolution
volume
```

Cardinality discipline is a reliability and cost-control requirement.

---

## Retention

Metrics retention should reflect:

```text
incident investigation
capacity planning
SLO windows
cost
```

The exact retention policy is deferred.

---

## Long-Term Trends

Long-term capacity or business analysis may require aggregated/downsampled metrics rather than full-resolution telemetry indefinitely.

Provider capabilities should guide implementation.

---

## Resolution

High-resolution metrics may be useful for operational diagnosis.

Not every metric requires second-level resolution.

Resolution should match the question being asked.

---

## Privacy

Metrics access should follow data sensitivity even when metrics are aggregated.

Internal topology and business-volume information may still be confidential.

---

## Production Access

Production metrics should be available only to authorized users and systems.

Detailed access policy belongs in:

- [docs/security/production-access.md](../security/production-access.md)

---

## AI Investigation

Metrics should allow an authorized AI agent to answer questions such as:

```text
Did error rate increase after release X?

Which dependency has the highest latency?

Is queue backlog increasing?

Are transaction retries increasing?

Is the problem isolated to one operation?
```

without needing high-cardinality personal data.

---

## AI Agent Requirements

Before adding a metric, an AI agent should ask:

```text
Which recurring numerical question does this answer?

Which metric type fits the quantity?

What is the unit?

Which dimensions are required?

What is worst-case cardinality?

Is there already a standard metric for this?
```

---

## AI and Cardinality

An AI agent must not use runtime identifiers as metric labels.

Specifically, it should treat fields such as:

```text
userId
requestId
traceId
errorId
resourceId
email
raw URL
exception message
```

as unsafe dimensions by default.

---

## AI and Metric Type

An AI agent should distinguish:

```text
counter
gauge
histogram
```

according to semantics.

Do not implement latency as an incrementing counter or queue depth as a counter merely because the API is convenient.

---

## AI and Derived Values

An AI agent should prefer primitive counts and distributions over emitting locally derived percentages when backend queries can calculate them correctly.

---

## AI and Existing Standards

Before inventing custom HTTP, database, runtime, or messaging metrics, an AI agent should inspect whether standard instrumentation already provides the signal.

---

## AI and Business Metrics

An AI agent should not add business analytics data to observability metrics merely because a product event exists.

The operational purpose must be explicit.

---

## AI and Error Labels

An AI agent should use stable bounded error categories or codes rather than exception messages.

---

## AI and Tests

Changes affecting critical alerting metrics, cardinality, units, or SLO calculations should include tests where practical.

---

## New Metric Checklist

Before introducing a custom metric, answer:

1. What operational question does this metric answer?
2. Who will use it?
3. Is an existing standard metric already available?
4. Is it a counter, gauge, or histogram?
5. What is its unit?
6. Where is the authoritative emission point?
7. Which dimensions are required?
8. What is the maximum possible cardinality?
9. Are any labels sensitive?
10. Could logs or traces answer the question better?
11. Will a dashboard or alert depend on it?
12. How will its semantics be documented?
13. How will it be tested?
14. What is its removal condition if it becomes unused?

---

## New Dimension Checklist

Before adding a metric dimension, answer:

1. Which question requires grouping by this field?
2. What are all possible values?
3. Is the value set bounded?
4. What is the expected number of values?
5. What is the worst-case total series multiplication?
6. Is the field sensitive?
7. Is the dimension already represented elsewhere?
8. Could the information be investigated through logs or traces instead?
9. Is a broader category sufficient?
10. Can the dimension remain stable over time?

---

## Latency Metric Checklist

Before adding a duration metric, answer:

1. Which operation is being timed?
2. Where does timing start?
3. Where does timing end?
4. Does the duration represent user-visible latency or internal work?
5. Which unit is used?
6. Is a histogram appropriate?
7. What dimensions are required?
8. Are retry attempts measured separately?
9. Is queue waiting time separate from processing time?
10. How will slow behavior be correlated with traces?

---

## SLO Metric Checklist

Before using a metric as an SLI, answer:

1. What user-visible behavior does it measure?
2. What events are eligible?
3. What counts as success?
4. What counts as failure?
5. Are client-caused failures excluded correctly?
6. Is instrumentation complete across all relevant instances?
7. Can retries distort the denominator?
8. Can missing telemetry distort the result?
9. Is the metric stable enough for long-term measurement?
10. Does the calculation match the intended service promise?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### User ID as Metric Label

Prohibited.

---

### Request ID as Metric Label

Prohibited.

---

### Trace ID as Metric Label

Prohibited.

---

### Resource ID as Metric Label

Prohibited.

---

### Email as Metric Label

Prohibited.

---

### Raw URL as Metric Label

Prohibited.

---

### Query Parameter as Metric Label

Prohibited by default.

---

### Error Message as Metric Label

Prohibited.

---

### Exception Message as Metric Label

Prohibited.

---

### SQL Statement as Metric Label

Prohibited.

---

### Dynamic Metric Name per Resource

Prohibited.

---

### Average-Only Latency Metric

Avoid.

---

### Percentage Gauge Instead of Primitive Counts

Avoid when counts can be aggregated correctly.

---

### Counter for Current Queue Depth

Incorrect.

Use a gauge.

---

### Gauge for Total Requests Processed

Incorrect for cumulative request count.

Use a counter.

---

### Metric Per Function

Avoid.

---

### Metrics as Business Analytics Warehouse

Avoid.

---

### Metric for Data That Already Has Standard Instrumentation

Avoid unless the standard metric is insufficient.

---

### Alert Depending on Unstable Exploratory Metric

Avoid.

---

### Silent Metric Semantic Change

Prohibited for operationally consumed metrics.

---

## Initial Metrics Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Metrics should represent recurring bounded numerical questions.
2. Custom metrics should use counter, gauge, or histogram semantics appropriately.
3. Metric names must be stable and must not contain runtime identifiers.
4. Metric dimensions must have bounded cardinality.
5. User IDs, request IDs, trace IDs, error IDs, resource IDs, emails, raw URLs, and exception messages must not be metric labels.
6. Units must be explicit and consistent.
7. Latency should generally be represented as a distribution rather than an average alone.
8. Service health should emphasize meaningful rate, error, duration, and saturation signals.
9. Technical failures should remain distinguishable from expected business rejections where reliability analysis requires it.
10. Existing standard runtime, HTTP, database, messaging, and infrastructure metrics should be preferred over duplicate custom instrumentation.
11. Primitive counters should be preferred over locally calculated rates and ratios when backend aggregation can derive them.
12. Metrics must follow data-classification and telemetry-redaction policy.
13. Metrics export failure must not normally fail business operations.
14. Critical alerting and SLO metrics should have stable semantics and stronger validation.
15. Metrics should complement, not replace, logs and traces for individual-event investigation.
16. Dashboard and alert consumers must be considered before renaming or removing established metrics.
17. Telemetry-pipeline failures and dropped measurements should be observable.
18. Custom metrics should have clear ownership and documentation.
19. AI agents must calculate cardinality risk before adding dimensions.
20. Metric naming, units, dimensions, and cardinality rules should become mechanically standardized where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
OpenTelemetry metrics adoption details
metrics provider
collector
metric naming convention
custom attribute namespace
histogram bucket strategy
metric retention
resolution
dashboard platform
SLO tooling
cardinality budgets
metric registry
```

These choices should follow the selected runtime stack, observability architecture, traffic scale, and operational requirements.

Significant choices should be captured through ADRs.

---

## Future Documentation

This document should be complemented by:

- [docs/reliability/error-reporting.md](error-reporting.md)
- [docs/reliability/health-checks.md](health-checks.md)
- [docs/reliability/alerting.md](alerting.md)
- [docs/security/production-access.md](../security/production-access.md)
- [docs/security/data-retention.md](../security/data-retention.md)

Provider-specific metric configuration and dashboards should be documented only after the observability stack is selected.

---

## Summary

Metrics provide bounded numerical visibility into system behavior over time.

The intended model is:

```text
meaningful quantity
    ↓
correct metric type
    ↓
explicit unit
    ↓
bounded dimensions
    ↓
time-series aggregation
    ↓
dashboard / alert / SLO
```

Orion prefers:

```text
bounded categories over identifiers

histograms over latency averages

primitive measurements over locally derived ratios

standard instrumentation over duplicate custom metrics

technical reliability metrics over arbitrary business analytics

stable semantics over convenience

metrics for aggregation, logs for evidence, traces for causality
```

A metric that answers no recurring operational question should probably not exist.

A metric with unbounded labels can damage the observability system itself.

A metric with unclear semantics can be worse than no metric because it creates false confidence.

The metrics system should make the health of Orion measurable without turning every runtime value into a time series.
