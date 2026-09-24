# Error Reporting

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0010](../adr/0010-establish-observability-logging-tracing-metrics-and-error-reporting-strategy.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Expected vs Unexpected](#expected-vs-unexpected)
- [Report Once](#report-once)
- [Public vs Internal Error](#public-vs-internal-error)
- [Fingerprint Checklist](#fingerprint-checklist)
- [Source Map Checklist](#source-map-checklist)

Related policy: [error handling](../architecture/error-handling.md), [telemetry redaction](../security/telemetry-redaction.md).

## Purpose

This document defines the error-reporting principles used by Orion.

Its goals are to ensure that unexpected failures are:

- captured reliably;
- grouped meaningfully;
- correlated with logs and traces;
- associated with release and environment context;
- safe;
- actionable;
- deduplicated;
- useful to humans and AI agents;
- resistant to alert fatigue;
- independent from a specific error-tracking vendor.

Error reporting is a specialized observability capability.

It exists to help identify, group, prioritize, and investigate unexpected application failures.

It is not a replacement for:

- structured logging;
- metrics;
- tracing;
- audit logging;
- business event tracking.

This document is technology-agnostic.

Specific error-tracking providers, SDKs, source-map pipelines, symbolication systems, alerting integrations, and retention policies will be selected later through explicit architectural decisions.

This document complements:

- [docs/architecture/error-handling.md](../architecture/error-handling.md);
- [docs/reliability/observability.md](observability.md);
- [docs/reliability/logging.md](logging.md);
- [docs/reliability/tracing.md](tracing.md);
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md);
- [docs/security/data-classification.md](../security/data-classification.md).

---

## Core Principle

Unexpected failures should be captured once at the boundary that owns them.

The intended model is:

```text
unexpected failure
    ↓
classification
    ↓
authoritative capture
    ↓
safe context enrichment
    ↓
grouping
    ↓
error tracker
    ↓
investigation / alerting / regression prevention
```

Expected failures should not automatically enter the error tracker.

---

## Error Reporting Is for Unexpected Failures

The error tracker should primarily represent failures that indicate:

```text
bug
broken invariant
unexpected dependency behavior
configuration defect
infrastructure failure
unhandled exception
```

It should not become a database of every negative application outcome.

---

## Expected vs Unexpected

A foundational distinction is:

```text
expected failure
    → modeled application outcome

unexpected failure
    → system did not behave as designed
```

Examples of expected failures:

```text
validation rejected
authentication failed
permission denied
resource not found
order cannot be cancelled
rate limit reached
```

Examples of unexpected failures:

```text
null dereference
unhandled exception
impossible state
database driver crash
unexpected provider response shape
```

---

## Expected Failures

Expected failures should generally use:

```text
stable error code
metrics where useful
structured logs when operationally useful
audit events when required
```

They should not automatically create error-tracker issues.

---

## Unexpected Failures

Unexpected failures should normally be reported to centralized error tracking.

The report should include enough safe context to support diagnosis.

---

## Report Once

The same failure should normally be captured once.

Avoid:

```text
repository captures
service captures
controller captures
global handler captures
```

for one exception.

Duplicate reporting produces:

- noise;
- misleading issue counts;
- alert duplication;
- investigation confusion.

---

## Authoritative Error Boundary

Each execution model should have a clear final failure boundary.

Examples include:

```text
HTTP global error handler

background job runner

event consumer wrapper

scheduled task runner

CLI entry point

client application global error boundary
```

Unexpected failures reaching that boundary should normally be captured there.

---

## Intermediate Layers

Intermediate layers may:

```text
translate
wrap
enrich
preserve cause
```

an error.

They should not report it unless they become the final authoritative owner of that failure.

---

## Lost Errors

A failure must not be silently swallowed after being classified as unexpected.

If code intentionally catches an unexpected error and does not rethrow it, it becomes responsible for reporting or otherwise surfacing the failure.

---

## Error Capture

A captured error should represent the actual failure object or equivalent structured exception where possible.

Prefer:

```text
capture original exception
```

over:

```text
capture string "something failed"
```

The original cause chain is valuable for diagnosis.

---

## Cause Chain

Wrapped failures should preserve meaningful cause information.

Conceptually:

```text
application failure
    caused by
provider failure
    caused by
network timeout
```

The tracker should retain this relationship where the runtime and provider support it.

---

## Public vs Internal Error

The public API error and the internal captured error are different representations.

Example:

```text
public:
    INTERNAL_ERROR

internal:
    database connection reset
        caused by network failure
```

The public contract remains safe.

The internal tracker retains diagnostic evidence.

---

## Error ID

An unexpected failure may receive an opaque:

```text
errorId
```

This may be returned safely to a user or support workflow.

Conceptually:

```text
err_...
```

The identifier should correlate:

```text
public error
    ↔
error tracker issue/event
    ↔
logs
    ↔
trace
```

where practical.

---

## Error ID Is Not Access Control

Possession of an `errorId` must not grant access to internal telemetry.

It is a correlation reference, not a secret or authorization credential.

---

## Trace Correlation

Captured errors should include:

```text
traceId
```

where an active trace exists.

This allows investigators to navigate:

```text
error
    ↓
trace
    ↓
dependency spans
```

and understand where the failure originated.

---

## Span Correlation

The active:

```text
spanId
```

may also be useful for locating the exact failing span.

This should generally be attached automatically by observability infrastructure.

---

## Log Correlation

Logs emitted during the failed operation should carry the same:

```text
traceId
requestId
errorId
```

where applicable.

The system should not require manual copying of these identifiers across every code path.

---

## Request Correlation

Server-side request failures should include:

```text
requestId
```

when the runtime uses request-level correlation.

This can help support teams find request-specific evidence even when tracing is sampled.

---

## Job Correlation

Background-job error reports should include safe identifiers such as:

```text
jobId
jobType
attempt
```

where available.

Do not attach the entire job payload.

---

## Event Correlation

Event-consumer failures may include:

```text
eventId
eventType
consumer
attempt
```

where safe.

The event body should not be captured automatically.

---

## Release

Every error event should be attributable to a deployed release.

Useful metadata may include:

```text
release
commit
build
deployment
```

depending on the release system.

This makes it possible to answer:

```text
Did this failure begin after release X?
```

---

## Release Identity

A release identifier should be stable enough to correlate:

```text
error tracker
logs
traces
deployments
```

where practical.

It should not be confused with:

```text
API version
database version
SDK version
```

---

## Environment

Error reports should identify the environment.

Examples:

```text
development
test
staging
production
```

Production errors should remain distinguishable from non-production failures.

---

## Service or Application

Every error should identify the producing runtime.

Examples:

```text
api
worker
web
mobile
desktop
```

according to the actual repository structure.

---

## Operation

Where possible, error reports should include the semantic operation.

Examples:

```text
orders.cancel
users.register
reports.generate
```

This provides more stable context than implementation method names.

---

## Error Code

If the unexpected failure was translated into an internal or public stable error code, the report may include:

```text
errorCode
```

This can improve grouping and cross-signal investigation.

Do not use arbitrary human-readable messages as error-code substitutes.

---

## Error Category

A bounded category may classify the failure.

Examples:

```text
dependency
database
configuration
unexpected
concurrency
serialization
```

The category should remain semantic and bounded.

---

## Grouping

An error tracker should group related occurrences into issues.

Good grouping reduces:

```text
thousands of events
```

into:

```text
one underlying defect
```

where appropriate.

---

## Automatic Grouping

Provider default grouping may use:

```text
exception type
stack trace
message
source location
```

Automatic grouping is useful but not always correct.

---

## Grouping Stability

Grouping should remain stable across ordinary redeployments where the underlying defect is the same.

Small line-number shifts should not unnecessarily create unrelated issues when the provider can normalize them.

---

## Over-Grouping

Over-grouping occurs when unrelated failures become one issue.

Example:

```text
ExternalProviderError
```

may represent:

```text
timeout
invalid credentials
invalid response
rate limit
```

If these require different investigation, grouping may need refinement.

---

## Under-Grouping

Under-grouping occurs when one defect creates many issues.

Examples:

```text
dynamic error message contains resource ID

stack path differs per generated file

message contains arbitrary provider text
```

Grouping should not depend on high-cardinality data.

---

## Fingerprinting

A custom fingerprint may override or influence grouping.

Conceptually, a fingerprint may include:

```text
error category
operation
stable provider code
exception class
```

Only use custom fingerprinting when default grouping is inadequate.

---

## Fingerprint Stability

Fingerprint values must be:

```text
stable
bounded
semantic
non-sensitive
```

Do not include:

```text
requestId
userId
orderId
email
raw error message
```

in fingerprints.

---

## Fingerprint Ownership

Custom grouping logic is operational behavior.

It should have clear ownership and tests where it materially affects issue grouping.

---

## Do Not Fingerprint Every Error Manually

Provider grouping systems are generally mature.

Custom fingerprints should solve concrete grouping defects.

Over-customization can make future diagnostics worse.

---

## Stack Traces

Unexpected errors should preserve stack traces where the runtime supports them.

Stack traces should remain internal.

They must never be exposed directly through public API responses.

---

## Stack Trace Quality

Useful stack traces should identify application code accurately.

Build and deployment systems should preserve whatever metadata is required for:

```text
source mapping
symbolication
debug symbols
```

depending on platform.

---

## Source Maps

Minified or transpiled client/server builds may require source maps for useful stack traces.

If used, source maps should be:

```text
generated reproducibly
associated with the correct release
available to trusted error tooling
```

---

## Source Map Exposure

Source maps may reveal application source.

They should not be publicly exposed accidentally merely because error reporting needs them.

The storage and upload strategy must be explicit.

---

## Release-Specific Source Maps

Source maps must correspond to the exact deployed artifact.

Incorrect source maps create misleading diagnostics.

---

## Source Map Upload Failure

Failure to upload source maps should become visible in release validation when client-side diagnostics depend on them.

It should not silently degrade production debugging.

---

## Native Symbolication

Mobile or desktop native crashes may require:

```text
debug symbols
mapping files
symbolication artifacts
```

The exact mechanism depends on platform.

These artifacts should be associated with the correct release.

---

## Breadcrumbs

Breadcrumbs provide a bounded sequence of recent safe events leading to an error.

Potential breadcrumbs include:

```text
navigation
API request
state transition category
user interaction category
dependency call
```

They can provide valuable context for client failures.

---

## Breadcrumb Safety

Breadcrumbs are telemetry.

They must follow the same security rules as logs and traces.

Do not capture:

```text
typed form content
password fields
message contents
tokens
full request payloads
```

---

## Breadcrumb Volume

Breadcrumb buffers should be bounded.

The tracker should retain recent useful context rather than an unlimited session history.

---

## Automatic Breadcrumbs

Provider SDKs may automatically capture:

```text
console output
network requests
navigation
DOM interactions
```

These defaults must be reviewed before production use.

Automatic capture may violate Orion telemetry policy.

---

## Console Breadcrumbs

Capturing arbitrary console output may import unsafe or noisy data into the error tracker.

If enabled, application logging policy still applies.

---

## Network Breadcrumbs

Network breadcrumbs should prefer:

```text
method
route template or safe URL
status
duration
```

without:

```text
authorization headers
query values
request bodies
response bodies
```

---

## Navigation Breadcrumbs

Client navigation breadcrumbs may be useful.

Route names should avoid:

```text
personal data
resource IDs
sensitive query strings
```

where practical.

---

## User Context

An error tracker may associate an occurrence with a user or actor identifier.

Prefer an opaque internal:

```text
actorId
```

or:

```text
userId
```

rather than:

```text
email
name
phone
```

unless additional personal information is explicitly required and approved.

---

## Anonymous Sessions

Client-side errors may occur before authentication.

The tracker may use an anonymous session identifier if operationally useful and privacy-safe.

Such identifiers should have bounded retention and clear semantics.

---

## Tenant Context

Multi-tenant applications may include an opaque:

```text
tenantId
```

when necessary for diagnosis.

Do not include tenant names or sensitive tenant metadata unnecessarily.

---

## Tags

Error trackers often support indexed tags.

Tags should be:

```text
bounded
stable
searchable
safe
```

Potential examples:

```text
environment
service
operation
errorCode
provider
```

---

## Tag Cardinality

Tags should not include high-cardinality values such as:

```text
requestId
traceId
userId
orderId
jobId
```

when the provider indexes tags and cardinality becomes costly.

Such values may belong in non-indexed context fields instead.

---

## Provider Constraints

Different error trackers have different indexing and cardinality limits.

Instrumentation should remain compatible with provider constraints without embedding provider-specific concepts deeply into application code.

---

## Context Fields

Non-indexed structured context may provide richer investigation data.

It must still be:

```text
safe
minimal
bounded
```

Do not attach complete domain objects.

---

## Extra Context

Avoid generic APIs such as:

```text
extra = entireRequest
```

or:

```text
context = allState
```

Explicit safe projections should be used.

---

## Error Serialization

Custom error serialization should preserve:

```text
name/type
message where safe internally
stack
cause
stable code
safe metadata
```

without serializing arbitrary nested objects recursively.

---

## Exception Messages

Internal exception messages may contain sensitive data.

The reporting pipeline should review and sanitize them where practical.

Application code should avoid constructing exception messages containing secrets.

---

## Dynamic Exception Messages

Messages containing identifiers can degrade grouping.

Bad:

```text
Order ord_123 failed to update
```

Better:

```text
Order update failed
```

with:

```text
orderId
```

stored separately if safe and useful.

---

## Sensitive Exception Messages

Never construct errors such as:

```text
Authentication failed for token <token>
```

or:

```text
Database connection failed using <connection string>
```

Secrets should not appear in error objects at all.

---

## Provider Errors

Third-party SDK errors may contain:

```text
request bodies
response bodies
headers
credentials
provider metadata
```

They must be sanitized before or during centralized capture.

---

## Database Errors

Database errors may contain:

```text
SQL
schema names
constraint names
values
connection details
```

Capture should preserve useful cause information without exposing sensitive query data.

---

## ORM Errors

ORM errors should not automatically be captured with all attached metadata.

Provider-specific serialization behavior must be reviewed.

---

## Validation Errors

Ordinary request-validation errors should not be captured as unexpected exceptions.

They should use normal API error semantics.

---

## Authentication Failures

Expected invalid credentials should not create error-tracker issues.

Unexpected authentication infrastructure failures may.

Example:

```text
invalid password
    → expected

identity provider unavailable
    → operational failure

token parser crashes
    → unexpected
```

---

## Authorization Denials

Ordinary authorization denials should not create error-tracker events.

An authorization subsystem throwing an impossible or unexpected exception should.

---

## Not Found

Expected resource-not-found conditions should not be reported as application errors.

Unexpected absence of required internal state may be different.

Context determines classification.

---

## Domain Conflicts

Modeled domain conflicts should remain expected errors.

Examples:

```text
ORDER_ALREADY_SHIPPED
EMAIL_ALREADY_IN_USE
RESOURCE_VERSION_CONFLICT
```

They should not create centralized issue noise by default.

---

## Dependency Failures

Dependency failures require classification.

Examples:

```text
provider returns business decline
    → expected domain/provider outcome

provider returns 503
    → operational dependency failure

provider response cannot be parsed despite valid contract
    → likely unexpected defect
```

Different categories should not be reported identically.

---

## Temporary Dependency Failure

Transient dependency failures may be better represented primarily through:

```text
metrics
traces
bounded warning logs
```

if retries recover automatically.

Do not generate one error-tracker issue for every transient retry attempt.

---

## Exhausted Dependency Failure

If all retries fail and the logical operation fails unexpectedly, centralized error reporting may be appropriate.

The report should represent the logical failure rather than every failed attempt.

---

## Retry Attempts

Do not report every retry attempt as an independent error issue.

Instead record:

```text
attempt
retry category
final outcome
```

through tracing or metrics.

Capture the final unexpected failure when retries are exhausted.

---

## Database Deadlocks

Expected retried database deadlocks should not necessarily enter the error tracker.

Repeated or unrecoverable deadlocks may indicate a defect and should become visible through:

```text
metrics
logs
final error report
```

as appropriate.

---

## Concurrency Conflicts

Expected optimistic concurrency conflicts are not tracker-worthy by default.

Unexpected impossible-state conflicts may be.

---

## Configuration Errors

Invalid critical startup configuration should generally be reported as:

```text
startup failure
```

if error tracking infrastructure is available safely at that stage.

A fatal log may also be appropriate.

---

## Startup Reporting

Error-reporting SDK initialization often depends on configuration.

If initialization itself fails, the system must still emit a safe fallback diagnostic through logging.

Do not create circular dependence where failure to initialize error reporting becomes invisible.

---

## Process Crashes

Unhandled process-level failures should be captured where the runtime permits.

Examples include:

```text
uncaught exception
unhandled rejection
fatal runtime error
```

After capture, the process should follow the runtime's safe termination policy.

Do not continue execution after a known corrupted state merely because the tracker captured it.

---

## Fatal Errors

A `fatal` failure means the process cannot continue safely.

Capture should be attempted without delaying shutdown indefinitely.

---

## Flush on Shutdown

Error-reporting SDKs may buffer events.

For fatal or short-lived processes, shutdown may require a bounded flush.

The application must not hang indefinitely waiting for telemetry export.

---

## Short-Lived Jobs and CLI

Short-lived processes may exit before buffered errors are transmitted.

Instrumentation should account for this where error reporting is required.

Flush behavior should remain bounded.

---

## Client Error Boundaries

Frontend applications should use suitable error boundaries for unexpected UI failures.

An error boundary should:

```text
capture unexpected rendering/runtime error
show safe fallback UI
preserve diagnostic correlation
```

where framework capabilities permit.

---

## Client Error Boundaries Are Not Global Recovery

An error boundary should not conceal persistent broken application state.

Recovery behavior must be intentional.

---

## Browser Errors

Browser error tracking may capture:

```text
uncaught exceptions
unhandled promise rejections
resource failures
```

according to selected tooling.

Automatic capture must be reviewed for privacy and noise.

---

## Browser Extensions

Client-side errors may originate from:

```text
browser extensions
injected scripts
unsupported environments
```

where relevant.

Grouping and filtering may be needed to avoid noise outside application ownership.

---

## Network Errors in Clients

A normal offline state should not necessarily become an error-tracker issue.

Expected network failures should be classified according to product behavior.

Unexpected client networking defects may be reported.

---

## Mobile Errors

Mobile error reporting may include:

```text
uncaught exceptions
native crashes
application hangs
```

depending on platform.

Device metadata should be minimized and privacy-safe.

---

## Native Crashes

Native crash reporting may require dedicated crash pipelines.

Crashes should correlate with:

```text
release
build
platform
symbolication artifacts
```

where possible.

---

## Application Not Responding

If the selected platform supports detection of hangs or ANRs, these may be important reliability signals.

The exact integration is platform-specific and deferred.

---

## Desktop Crashes

Desktop applications may require crash reporting similar to mobile.

Local paths, usernames, machine names, and environment variables must not be captured indiscriminately.

---

## Error Group Ownership

Important error groups should eventually have an identifiable owner.

Ownership may follow:

```text
service
application
domain
integration
```

This helps route investigation.

---

## Automatic Ownership

The tracker may assign ownership based on:

```text
source path
service
operation
component
```

if repository structure makes ownership reliable.

Avoid brittle routing rules based solely on incidental stack frames.

---

## Triage

An error-tracking issue should be triaged based on:

```text
impact
frequency
affected operations
release correlation
severity
reproducibility
```

not merely occurrence count.

---

## One Occurrence Can Be Critical

A low-frequency error can still be severe.

Examples:

```text
data corruption
security boundary failure
payment duplication
```

Frequency must not be the only severity signal.

---

## High Frequency Can Be Low Severity

A high-frequency issue may be expected noise caused by:

```text
unsupported browser extension
bot traffic
known external client misuse
```

Classification and filtering matter.

---

## Severity

Error tracker severity should reflect operational significance.

Potential concepts include:

```text
warning
error
fatal
```

depending on provider.

Severity should not simply mirror HTTP status.

---

## Priority

Issue priority may consider:

```text
user impact
data integrity
security
frequency
business criticality
regression status
```

The exact triage process is operational policy and may evolve later.

---

## Regression Detection

The tracker should identify when an issue that was considered resolved reappears in a newer release where provider capabilities support it.

This is especially useful for verifying bug fixes.

---

## Release Regression

A failure first appearing after a deployment should be easy to identify.

Release metadata is therefore mandatory for meaningful error tracking.

---

## Resolved Issues

Marking an issue resolved is an operational workflow.

It does not prove the defect is fixed.

Regression tests should remain the code-level protection.

---

## Regression Tests

A bug fix should include a regression test whenever practical.

Error tracking identifies production evidence.

Tests protect the behavior from returning.

These are complementary mechanisms.

---

## Issue Suppression

Known non-actionable issues may be suppressed or filtered.

Suppression should be deliberate.

Do not broadly ignore entire exception classes without understanding what else they may represent.

---

## Filtering

Filtering may occur:

```text
before event creation
before export
at provider ingestion
```

Earlier filtering usually reduces:

```text
cost
privacy risk
noise
```

but should not hide important failures.

---

## Client Noise Filtering

Browser and mobile telemetry may require filters for:

```text
extension errors
unsupported environment noise
cancelled navigation
known external script failures
```

Filters should use stable evidence rather than fragile message substring matching where possible.

---

## Ignore Rules

Ignore rules should have:

```text
reason
owner
scope
reviewability
```

if they suppress significant classes of errors.

Permanent invisible filters are risky.

---

## Sampling

High-volume identical errors may require sampling.

Sampling should preserve:

```text
issue existence
frequency estimates where possible
representative context
```

Critical errors should receive higher retention priority.

---

## Sampling Is Not Classification

Do not sample an error merely because it is expected.

Expected failures should usually not enter error reporting in the first place.

Sampling solves volume.

Classification solves semantics.

---

## Event Volume

An error tracker should not receive one event per:

```text
expected validation rejection
404
permission denial
transient retry attempt
```

unless a specific security or operational use case justifies it.

---

## Rate Limiting

The error-reporting client or collector should protect application stability during failure storms.

A cascading incident must not overwhelm:

```text
CPU
memory
network
provider quota
```

because millions of identical exceptions are being exported.

---

## Local Deduplication

Client-side or collector-side deduplication may reduce repeated identical failures during a short period.

The exact strategy depends on provider and runtime.

---

## Provider Quotas

The system should understand provider limits such as:

```text
events per minute
attachment size
tag cardinality
retention
```

Instrumentation must degrade safely if quotas are reached.

---

## Attachments

Error trackers may support attachments.

Attachments should be disabled or used extremely cautiously.

They can contain large amounts of:

```text
personal data
user content
credentials
application state
```

Do not upload arbitrary diagnostics automatically.

---

## Screenshots

Automatic screenshots can capture:

```text
personal data
messages
financial information
authentication data
```

They should not be enabled casually.

If introduced, classification, consent, access, and redaction requirements must be explicit.

---

## Session Replay

Session replay is a high-risk telemetry capability.

If introduced, it requires explicit privacy and security review.

It is not part of Orion's default error-reporting foundation.

---

## Local Variables

Some trackers can capture local variables from stack frames.

This may expose arbitrary sensitive data.

Automatic local-variable capture should be disabled by default unless a safe mechanism is proven.

---

## Request Capture

Automatic request capture should be minimized.

Safe metadata may include:

```text
method
route template
status
```

The following must not be captured by default:

```text
request body
authorization header
cookies
query values
```

---

## Response Capture

Automatic response-body capture should be disabled by default.

---

## Environment Capture

Automatic environment-variable capture should be disabled.

Only explicitly allowlisted safe configuration metadata may be attached.

---

## Device Metadata

Client trackers may capture:

```text
device model
OS
app version
locale
```

This should be minimized to what diagnosis requires.

---

## IP Address Capture

IP addresses may be personal data.

Automatic IP collection should follow privacy and security requirements.

Disable or minimize it where unnecessary.

---

## Geolocation

Precise geolocation should not be attached to error reports by default.

---

## Data Classification

Error-reporting telemetry follows:

- [docs/security/data-classification.md](../security/data-classification.md)

The error tracker is not exempt from ordinary data-protection rules.

---

## Restricted Data

`RESTRICTED` data must never be intentionally sent to the error tracker.

Examples include:

```text
passwords
password hashes
tokens
API keys
private keys
database credentials
recovery codes
```

---

## Confidential Data

`CONFIDENTIAL` data should be minimized.

Prefer opaque identifiers over:

```text
email
name
phone
address
```

where diagnostic value is equivalent.

---

## User-Generated Content

User-generated content must not be captured automatically.

An error occurring while processing a document does not justify attaching the entire document.

---

## Redaction

Error-reporting instrumentation must integrate with centralized telemetry-redaction policy.

Redaction should occur as early as practical.

Provider-side filters are defense in depth, not the primary control.

---

## Safe Failure

If telemetry cannot be sanitized confidently, drop unsafe context.

Losing optional diagnostic data is preferable to exposing restricted information.

---

## Security Incidents

A suspected telemetry leak is a security incident.

Response should include:

```text
contain capture
identify affected provider/events
rotate compromised secrets if applicable
remove accessible telemetry where possible
fix source
add regression protection
```

according to incident-response policy.

---

## Error Tracker Access

Production error reports may contain:

```text
internal stack traces
resource identifiers
system topology
user identifiers
```

Access should therefore follow least privilege.

Detailed policy belongs in:

- [docs/security/production-access.md](../security/production-access.md)

---

## Provider Access

Vendor support personnel access to captured data should be considered during provider selection and configuration.

---

## Retention

Error-reporting retention should balance:

```text
incident investigation
regression analysis
privacy
cost
```

Detailed retention policy belongs in:

- [docs/security/data-retention.md](../security/data-retention.md)

---

## Deletion

Where privacy or regulatory obligations require deletion, the error-reporting provider must be considered part of the deletion surface if personal data can be present.

This is another reason to minimize personal data in telemetry.

---

## Environment Separation

Production and non-production errors should be distinguishable.

If the provider supports projects or environments, configuration should prevent staging noise from obscuring production issues.

---

## Development Errors

Development environments may use the same error-reporting integration for testing.

They should not trigger production incident alerts.

---

## Test Errors

Automated test failures should generally remain in CI/test tooling rather than centralized production error tracking.

Sending ordinary test exceptions to the tracker creates noise.

Integration tests may verify tracker behavior using test exporters or isolated environments.

---

## Error Reporting Availability

The error-reporting provider is an observability dependency.

It should not normally be part of the critical business path.

Failure to report an error must not convert one application failure into a larger outage.

---

## Non-Blocking Reporting

Error capture should normally be:

```text
buffered
bounded
non-blocking
```

where provider SDK capabilities permit.

---

## Export Failure

If error export fails, the system may emit a bounded:

```text
telemetry export failed
```

log or metric.

It must avoid recursive error reporting.

---

## Recursive Failure

Never implement:

```text
error tracker fails
    ↓
capture error tracker failure in error tracker
    ↓
repeat
```

The observability pipeline must have a safe fallback.

---

## Error Reporting Metrics

The observability system may expose aggregate metrics such as:

```text
errors captured
errors dropped
export failures
```

without creating circular dependencies.

---

## Alerting

Error tracker alerts should focus on actionable issue conditions.

Potential triggers include:

```text
new production issue
regression
high-frequency increase
fatal crash
critical workflow failure
```

Alerting policy belongs in:

- [docs/reliability/alerting.md](alerting.md)

---

## Do Not Alert on Every Captured Event

One issue may produce thousands of events.

Alerts should represent operational conditions, not raw event volume.

---

## New Issue Alerts

A new issue may be alert-worthy in critical production applications.

For high-noise surfaces such as browser clients, filtering and severity rules may be required.

---

## Regression Alerts

Regression alerts can be particularly valuable because they identify failures thought to have been resolved.

---

## Volume Alerts

Sudden error-frequency changes may be useful.

Metrics-based alerting may sometimes be better than provider-specific issue counts.

---

## Fatal Crash Alerts

Unexpected fatal process or client crashes may deserve high-priority notification depending on affected application.

---

## Ownership Routing

Alerts may route according to:

```text
service
domain
integration
```

where ownership is reliable.

Do not create complex routing before team structure requires it.

---

## Error Reporting and Logs

Error tracking should not become another ordinary logger.

Use logs for:

```text
semantic operational events
searchable runtime evidence
```

Use the error tracker for:

```text
unexpected failure grouping
stack/cause analysis
regression detection
issue triage
```

---

## Error Reporting and Traces

Tracing explains causal execution.

Error reporting explains the unexpected failure in depth.

The two should correlate.

A useful investigation flow is:

```text
error issue
    ↓
error occurrence
    ↓
trace
    ↓
failed span
    ↓
related logs
```

---

## Error Reporting and Metrics

Metrics show how often failures occur.

The tracker shows specific grouped defects.

Example:

```text
metric:
    unexpected error rate increased 5x

error tracker:
    DatabaseConnectionReset issue is responsible for 80%
```

---

## Error Reporting and Audit

Audit logging records accountability-sensitive actions.

Error reporting is not an audit record.

A tracker may sample or deduplicate events.

Audit logs must not depend on tracker retention or grouping.

---

## Error Reporting and Business Analytics

The error tracker must not be used as a business analytics system.

Do not attach business dimensions solely to make the tracker answer product questions.

---

## Error Reporting and Support

Support workflows may use:

```text
errorId
requestId
```

to locate internal evidence.

Support staff should see only the information authorized by production-access policy.

---

## User-Facing Error Reference

A user-facing support message may safely say:

```text
Reference: err_...
```

without exposing internal diagnostic content.

---

## Issue Comments

Human comments added inside an external error-tracking provider may contain operational knowledge.

Important durable architectural or incident conclusions should still be recorded in the repository where appropriate.

The external tracker is not the sole source of architectural truth.

---

## Incident Links

Important issues may link to:

```text
incident record
runbook
pull request
regression test
```

where tooling allows it.

This improves traceability from production evidence to correction.

---

## Runbooks

Recurring high-impact error classes may have runbooks.

A runbook may specify:

```text
how to confirm impact
which traces/logs to inspect
mitigation
recovery
escalation
```

---

## AI Investigation

Under appropriate authorization, an AI agent should be able to use error-reporting evidence to determine:

```text
which release introduced the failure
which operation failed
which trace contains the occurrence
which dependency failed
whether the issue is a regression
how frequently it occurs
```

without requiring access to raw restricted data.

---

## AI Agent Requirements

Before adding explicit error capture, an AI agent should ask:

```text
Is this failure expected or unexpected?

Will a higher-level boundary already capture it?

Will capturing here duplicate the event?

Which safe context is actually required?
```

---

## AI and Expected Errors

An AI agent must not send ordinary:

```text
validation failures
permission denials
not-found results
domain conflicts
```

to centralized error tracking merely because they are represented by exceptions internally.

Classification is semantic, not syntax-based.

---

## AI and Catch Blocks

When adding a catch block, an AI agent should determine whether it:

```text
handles
translates
retries
reports
rethrows
```

the error.

A catch block that logs and rethrows may create duplicate reporting.

---

## AI and Context

AI-generated error context should use explicit safe fields.

Do not attach:

```text
request
user object
ORM entity
config object
provider payload
```

whole.

---

## AI and Fingerprinting

An AI agent should not add custom fingerprints unless a real grouping problem exists.

If it does, the fingerprint must use stable bounded semantic values.

---

## AI and Source Maps

When introducing build transformations that make production stack traces unreadable, an AI agent should consider the source-map or symbolication path as part of the deployment design.

---

## AI and Regression Tests

When an error-tracker issue represents a confirmed bug, the fix should include a regression test whenever practical.

---

## AI and Noise

An AI agent should not improve observability by indiscriminately increasing capture volume.

The objective is actionable signal.

---

## New Error Capture Checklist

Before explicitly capturing an error, answer:

1. Is the failure unexpected?
2. Which layer owns it?
3. Will another boundary already capture it?
4. Is the original cause preserved?
5. Which release and environment metadata exist?
6. Which correlation identifiers should be attached?
7. Which safe contextual fields are necessary?
8. Could any captured field contain sensitive data?
9. Does the failure need custom grouping?
10. Will this create excessive event volume?
11. How will the issue be tested?
12. Which team or domain owns investigation?

---

## New Error Context Checklist

Before attaching a context field, answer:

1. What diagnostic question does it answer?
2. Is it safe?
3. What is its classification?
4. Can an opaque identifier replace personal data?
5. Is it bounded?
6. Does it belong as a tag, context field, log field, or trace attribute?
7. Could the provider index it and create cardinality cost?
8. Is the field already available elsewhere?
9. Is it necessary for most occurrences?
10. Could it contain user-controlled arbitrary text?

---

## Fingerprint Checklist

Before adding a custom fingerprint, answer:

1. What grouping defect exists today?
2. Which failures should become one issue?
3. Which failures must remain separate?
4. Are fingerprint fields stable?
5. Are they bounded?
6. Are they non-sensitive?
7. Can deployment/source changes alter them unexpectedly?
8. How will grouping be validated?

---

## Source Map Checklist

Before enabling source-map upload, answer:

1. Which artifact requires source mapping?
2. How is the deployed release identified?
3. Are source maps generated deterministically?
4. How are maps associated with the exact build?
5. Are maps publicly accessible?
6. Who can access them?
7. What happens when upload fails?
8. Is deployment validation required?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Capture Every Exception

Avoid.

Expected exceptions are not automatically tracker-worthy.

---

### Capture and Rethrow at Every Layer

Avoid.

---

### Validation Errors in Error Tracker

Avoid by default.

---

### Permission Denials in Error Tracker

Avoid by default.

---

### 404 Errors in Error Tracker

Avoid by default.

---

### One Error Event Per Retry Attempt

Avoid.

---

### Full Request Attached to Error

Prohibited by default.

---

### Full Response Attached to Error

Prohibited by default.

---

### Full User Object Attached to Error

Prohibited.

---

### Full Configuration Attached to Error

Prohibited.

---

### Environment Variables Attached to Error

Prohibited.

---

### Credentials in Error Messages

Prohibited.

---

### Raw Provider Payload Attached Automatically

Prohibited by default.

---

### High-Cardinality Values Used as Fingerprints

Prohibited.

---

### Request IDs Used as Fingerprints

Prohibited.

---

### Arbitrary User Content as Tracker Context

Prohibited by default.

---

### Public Source Maps by Accident

Avoid.

---

### Session Replay Enabled Without Security Review

Prohibited as a default.

---

### Local Variable Capture Enabled Blindly

Avoid.

---

### Error Tracker Used as Audit Log

Prohibited.

---

### Error Tracker Used as Ordinary Logger

Avoid.

---

### Error Tracker Failure Breaks Business Operation

Avoid.

---

## Initial Error Reporting Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Centralized error reporting should focus primarily on unexpected failures.
2. Expected validation, authentication, authorization, not-found, and domain-conflict outcomes must not be reported as unexpected errors by default.
3. Unexpected failures should normally be captured once at an authoritative runtime boundary.
4. Intermediate layers should preserve and enrich errors without duplicate capture.
5. Error reports should include release, environment, service, and correlation context where available.
6. Error reports should correlate with traces and logs through stable identifiers where practical.
7. Public error responses and internal error reports must remain separate representations.
8. `RESTRICTED` data must never be intentionally captured.
9. Full requests, responses, configuration, environment values, and arbitrary objects must not be attached by default.
10. Automatic SDK capture features must be reviewed for privacy and telemetry safety.
11. Source maps and symbolication artifacts must correspond to the exact deployed release.
12. Custom fingerprints should use stable bounded semantic fields only.
13. Error grouping should optimize for underlying defects rather than individual occurrences.
14. Retry attempts should not produce duplicate issues when one logical operation ultimately fails.
15. Error reporting must not be used as a substitute for logs, metrics, traces, or audit records.
16. Provider export failure must not normally fail business operations.
17. Error-tracker access and retention must follow production-access and data-retention policies.
18. Confirmed bugs should receive regression tests whenever practical.
19. AI agents must classify expected vs unexpected failures before adding capture.
20. Error-reporting context, grouping, and redaction should become mechanically standardized where practical.

---

## Future Implementation Decisions

The following decisions are intentionally deferred:

```text
error-tracking provider
SDKs
issue grouping strategy
custom fingerprint conventions
errorId format
source-map pipeline
symbolication pipeline
browser/mobile crash integration
sampling
issue ownership routing
tracker retention
alert integration
```

These choices should follow the selected runtime stack, client platforms, observability architecture, and operational requirements.

Significant choices should be captured through ADRs.

---

## Future Documentation

This document should be complemented by:

```text
docs/reliability/health-checks.md
docs/reliability/alerting.md

docs/security/production-access.md
docs/security/data-retention.md
docs/security/incident-response.md

docs/runbooks/
```

Provider-specific error-reporting setup should be documented only after the observability stack is selected.

---

## Summary

Error reporting exists to turn unexpected runtime failures into actionable grouped evidence.

The intended model is:

```text
unexpected failure
        ↓
capture once
        ↓
preserve cause
        ↓
attach safe context
        ↓
correlate with release / trace / logs
        ↓
group into underlying issue
        ↓
investigate
        ↓
fix
        ↓
regression test
```

Orion prefers:

```text
semantic classification over capture-everything

one authoritative report over duplicate events

stable grouping over high-cardinality fingerprints

safe context over arbitrary object capture

release correlation over isolated stack traces

source mapping over unreadable production stacks

error tracking for defects, logs for evidence, traces for causality, metrics for frequency
```

The error tracker should make unexpected failures easier to understand.

It should not become another logger.

It should not become an archive of expected user mistakes.

It should not require sensitive data to be useful.

A good error report should make the defect clearer while keeping the underlying user and system data protected.
