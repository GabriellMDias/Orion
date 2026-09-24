# Telemetry Redaction

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0010](../adr/0010-establish-observability-logging-tracing-metrics-and-error-reporting-strategy.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Default Deny for Payload Capture](#default-deny-for-payload-capture)
- [Redaction Strategies](#redaction-strategies)
- [HTTP Request Telemetry](#http-request-telemetry)
- [Representative Secret Tests](#representative-secret-tests)
- [New Telemetry Checklist](#new-telemetry-checklist)

## Purpose

This document defines the telemetry-redaction policy for Orion.

Its goals are to ensure that logs, traces, error reports, breadcrumbs, metrics, diagnostics, and related telemetry provide sufficient operational value without exposing sensitive information.

Telemetry is production data.

It must be treated with the same security and privacy discipline as other application data.

This document complements:

- [docs/security/data-classification.md](data-classification.md);
- [docs/reliability/observability.md](../reliability/observability.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md).

When telemetry usefulness conflicts with data-protection requirements, data protection takes priority.

---

## Core Principle

Telemetry should capture the minimum information required to understand system behavior.

The preferred model is:

```text
runtime data
    ↓
classification
    ↓
explicit telemetry selection
    ↓
redaction / transformation
    ↓
telemetry destination
```

Avoid:

```text
runtime data
    ↓
capture everything
    ↓
attempt to remove secrets afterward
```

Redaction is a defense layer.

It is not a substitute for minimizing collection at the source.

---

## Scope

This policy applies to all telemetry-producing mechanisms, including:

```text
application logs
structured logs
distributed traces
span attributes
error tracking
exception metadata
breadcrumbs
metrics
audit logs
profiling metadata
diagnostic dumps
health diagnostics
support diagnostics
```

It also applies to telemetry produced by:

```text
backend applications
web applications
mobile applications
desktop applications
workers
CLI tools
infrastructure
third-party SDKs
framework instrumentation
```

---

## Classification-Based Handling

Telemetry handling follows Orion's data-classification model.

General rules:

```text
PUBLIC
    → may normally be captured

INTERNAL
    → may normally be captured when operationally useful

CONFIDENTIAL
    → capture only when justified, minimized, and controlled

RESTRICTED
    → must not be intentionally captured
```

A telemetry destination does not reduce the classification of the information stored within it.

---

## Restricted Data

`RESTRICTED` data must never be intentionally included in telemetry.

Examples include:

```text
passwords
password hashes
authentication tokens
session tokens
refresh tokens
API secrets
private keys
signing secrets
database credentials
payment credentials
recovery codes
authorization headers containing credentials
cookie values containing session credentials
```

This prohibition applies even when:

```text
telemetry is encrypted;
telemetry access is restricted;
the environment is non-production;
the value would simplify debugging;
the telemetry provider supports sensitive-data filtering.
```

Restricted values should not reach telemetry systems in the first place.

---

## Confidential Data

`CONFIDENTIAL` data may appear in telemetry only when there is a concrete diagnostic need.

Examples may include:

```text
internal user identifiers
tenant identifiers
order identifiers
provider identifiers
resource identifiers
```

when those values are required for investigation.

Prefer identifiers over descriptive personal data.

For example:

```text
userId: usr_01...
```

is generally preferable to:

```text
email: alice@example.com
fullName: Alice Example
phone: +...
```

when the identifier is sufficient for investigation.

---

## Default Deny for Payload Capture

Request bodies, response bodies, event payloads, job payloads, and arbitrary serialized objects must not be captured by default.

Prefer explicit allowlisting.

For example:

```text
capture:
    HTTP method
    route template
    status code
    duration
    requestId
    traceId
```

rather than:

```text
capture:
    entire request
```

Payload capture should require deliberate justification.

---

## Allowlist Before Redaction

When the expected telemetry schema is known, prefer allowlisting safe fields over accepting arbitrary data and applying a blocklist.

Prefer:

```text
{
  operation,
  result,
  duration,
  provider,
  requestId
}
```

over:

```text
{
  ...requestObject,
  password: "[REDACTED]"
}
```

Blocklists are fragile because schemas evolve.

Allowlisting limits exposure by default.

---

## Redaction Strategies

Orion may use several redaction strategies depending on the data.

---

### Removal

Remove the value entirely.

Example:

```text
Authorization: [REMOVED]
```

This is the preferred strategy for credentials and secrets.

---

### Constant Replacement

Replace a sensitive value with a fixed marker.

Example:

```text
password: "[REDACTED]"
```

This makes the presence of the field visible without preserving its value.

---

### Partial Masking

Preserve only a limited safe portion.

Example:

```text
cardLast4: "1234"
```

or, when justified:

```text
email: "a***@example.com"
```

Partial masking should be used only when the visible portion has genuine operational value.

---

### Pseudonymization

Replace a value with a stable non-secret identifier when correlation is useful.

Example:

```text
external email
    ↓
internal userId
```

Pseudonymization does not automatically make data anonymous.

The resulting identifier may still be `CONFIDENTIAL`.

---

### Hashing

Hashing may provide correlation without storing the original value.

However, predictable values may remain recoverable through enumeration.

For example:

```text
hash(email)
```

may still represent personal data.

Hashing must not be treated automatically as anonymization.

---

## Credential Redaction

The telemetry pipeline should recognize common credential locations.

Potential sources include:

```text
Authorization headers
Cookie headers
Set-Cookie headers
query parameters
form fields
JSON bodies
environment variables
provider SDK metadata
exception context
```

Common sensitive names may include:

```text
password
passwd
secret
token
accessToken
refreshToken
apiKey
apiSecret
privateKey
clientSecret
authorization
cookie
session
credential
```

This list is a safety net.

It must not replace explicit schema-based handling.

---

## HTTP Request Telemetry

HTTP request telemetry may normally include:

```text
method
route template
status code
duration
requestId
traceId
service
environment
release
```

It may include carefully selected safe attributes when required.

It must not capture sensitive HTTP content indiscriminately.

---

## URLs

Full URLs may contain sensitive information.

For example:

```text
GET /reset-password?token=secret-value
```

Logging the full URL would leak the token.

Prefer:

```text
route: /reset-password
```

or normalized route templates.

Query parameters should not be captured by default.

---

## Query Parameters

Query parameters must be treated as untrusted data.

They may contain:

```text
authentication tokens
email addresses
search text
personal identifiers
user-generated content
```

Do not record the complete query string by default.

If specific parameters are operationally useful, allowlist them explicitly.

---

## HTTP Headers

Headers must not be captured indiscriminately.

The following should normally be removed:

```text
Authorization
Cookie
Set-Cookie
Proxy-Authorization
```

Other headers may also contain confidential data.

Allowlist safe headers rather than attempting to capture all headers.

---

## Request Bodies

Request bodies must not be logged or attached to traces by default.

They may contain:

```text
passwords
personal data
payment information
uploaded content
authentication credentials
free-form metadata
```

If a specific request field is required for telemetry, extract and classify that field deliberately.

Do not serialize the entire request object.

---

## Response Bodies

Response bodies must not be captured by default.

Responses may contain:

```text
personal profiles
tokens
private content
financial information
business-sensitive information
```

Operational telemetry should normally capture response metadata rather than response content.

---

## File Uploads

Uploaded file content must never be automatically captured in telemetry.

This includes:

```text
file contents
binary buffers
document text
image metadata
archive contents
```

Safe metadata may include, when justified:

```text
file size
declared media type
processing result
internal file identifier
```

Original file names may contain personal or sensitive information and should be handled carefully.

---

## WebSocket and RPC Payloads

The same rules that apply to HTTP payloads apply to WebSocket, RPC, and other transport payloads.

Do not assume a protocol is safe to log because it is internal.

Capture schema-level metadata rather than arbitrary message content.

---

## Event and Message Payloads

Message queues and event systems often retain payloads across multiple systems.

Telemetry should not create an additional unrestricted copy.

Prefer logging:

```text
eventType
eventId
correlationId
consumer
attempt
result
duration
```

instead of the full event payload.

---

## Job Payloads

Background job payloads must not be serialized into logs by default.

Prefer:

```text
jobType
jobId
attempt
result
```

If business identifiers are required for debugging, include only the necessary identifiers.

---

## Database Telemetry

Database telemetry requires special care.

Potentially safe metadata includes:

```text
operation type
table or logical entity
duration
result
database system
```

Raw SQL and bound values require additional scrutiny.

---

## SQL Statements

SQL statements may contain literal values.

For example:

```sql
SELECT *
FROM users
WHERE email = 'alice@example.com';
```

Capturing this statement would expose personal information.

Prefer parameterized or normalized representations such as:

```sql
SELECT *
FROM users
WHERE email = ?;
```

when SQL telemetry is required.

---

## SQL Parameters

Database query parameters must not be captured automatically.

Parameters may contain:

```text
password hashes
personal information
tokens
financial information
private content
```

If parameter capture is ever enabled for a specific diagnostic workflow, it must follow explicit classification and access controls.

---

## ORM Telemetry

ORM instrumentation may automatically capture:

```text
queries
parameters
model names
error metadata
```

Default SDK behavior must be reviewed.

Orion must not assume ORM instrumentation is safe without configuration.

---

## Database Errors

Database exception messages may contain:

```text
SQL
table names
column names
values
connection information
internal hostnames
```

Raw database exceptions should not be exposed directly to users.

Before sending them to telemetry providers, inspect what metadata the database driver includes.

---

## External Provider Telemetry

Third-party SDKs may attach request and response data to exceptions or breadcrumbs.

This may include sensitive information.

Provider instrumentation must be reviewed for:

```text
headers
credentials
request bodies
response bodies
customer data
provider-specific identifiers
```

Disable or sanitize unsafe automatic capture.

---

## Payment Providers

Payment-provider telemetry deserves especially strict handling.

Never capture:

```text
full card number
security code
bank credentials
authentication secrets
raw payment credentials
```

Prefer provider-generated safe identifiers and result codes.

Example:

```text
provider: example-payment
paymentAttemptId: pat_01...
result: declined
declineCategory: issuer_declined
```

---

## Authentication Providers

Authentication-provider telemetry must not capture credentials or raw tokens.

Potentially useful safe metadata includes:

```text
provider
flow
result
error category
internal userId
```

when appropriate.

---

## Error Reporting

Error-tracking tools may capture more information than application logs.

Potential automatic capture includes:

```text
stack traces
breadcrumbs
request headers
request bodies
query strings
cookies
local variables
environment information
user context
```

Every automatic capture feature must be reviewed.

Unsafe capture should be disabled before production use.

---

## Stack Traces

Stack traces are generally useful and may be captured internally.

They may still reveal:

```text
file paths
module names
internal implementation
runtime details
```

Stack traces are not intended for untrusted users.

They must never contain secrets intentionally.

---

## Local Variables

Automatic local-variable capture is high risk.

Variables may contain arbitrary application data, including restricted values.

Local-variable capture should be disabled by default unless the environment and redaction controls make its use explicitly acceptable.

---

## Exception Objects

Exception objects may contain provider payloads, SQL, HTTP responses, or internal request state.

Do not assume:

```text
captureException(error)
```

is safe without understanding what the error object contains.

Error-reporting integrations should sanitize exception metadata before export where necessary.

---

## Breadcrumbs

Breadcrumbs provide valuable execution context but can easily capture sensitive information.

Potential breadcrumb sources include:

```text
navigation
HTTP requests
console logs
database calls
user interactions
SDK activity
```

Breadcrumb configuration must follow the same classification policy as ordinary telemetry.

---

## Console Capture

Client error-reporting SDKs may automatically capture console output.

This creates a direct path from unsafe development logging to production telemetry.

Therefore:

```text
console.log(userObject)
```

is not harmless merely because it is not sent explicitly to the telemetry provider.

Production console capture must be reviewed or disabled appropriately.

---

## User Context in Error Tracking

Error-reporting systems may support user context.

Prefer:

```text
user.id
```

over:

```text
user.email
user.name
user.phone
```

unless the additional fields are explicitly required and permitted.

User context must be cleared when authentication state ends.

---

## Trace Attributes

Trace attributes should contain low-risk operational context.

Preferred examples:

```text
operation
result
provider
error.code
job.type
service.name
deployment.environment
```

Use identifiers only when necessary.

Do not attach entire application objects to spans.

---

## Span Events

Span events follow the same redaction policy as logs.

An event such as:

```text
payment.failed
```

should include safe operational attributes rather than provider payload dumps.

---

## Metrics

Metrics must never contain secrets.

Metrics should generally avoid personal and entity-specific data altogether.

Do not use labels such as:

```text
email
userId
orderId
requestId
traceId
IP address
error message
full URL
```

unless a very specific design explicitly justifies the dimension and its cardinality and privacy impact.

For most cases, these values do not belong in metrics.

---

## Error Messages as Metric Labels

Do not use arbitrary exception messages as metric labels.

Example:

```text
error_message="User alice@example.com already exists"
```

creates both:

```text
privacy risk
high cardinality
```

Prefer bounded classifications:

```text
error_code="EMAIL_ALREADY_IN_USE"
```

---

## Audit Logs

Audit logs have a different purpose from diagnostic logs but still require redaction.

An audit event should capture:

```text
actor identifier
action
resource identifier
result
timestamp
```

without recording credentials or unnecessary payloads.

Audit requirements may justify retaining some confidential identifiers that ordinary application logs would omit.

Such use must be explicit.

---

## Security Logs

Security telemetry may require additional context for incident investigation.

This does not remove classification requirements.

Prefer:

```text
actorId
source category
authentication result
policy result
```

over raw credentials or full request bodies.

---

## Client-Side Telemetry

Client applications operate in less-trusted environments and may observe sensitive user input.

Special care is required for:

```text
form values
clipboard content
local storage
URL parameters
navigation state
screen contents
user-generated content
```

Client error reporting must not automatically capture these values.

---

## Session Replay

If session replay is ever introduced, it must receive separate security and privacy review.

Session replay may capture:

```text
typed text
screen contents
form values
private conversations
personal information
```

Sensitive fields and application areas must be masked or excluded.

Session replay must never be enabled merely because an observability vendor provides it.

---

## Screenshots

Automatic screenshots in error reporting or support flows may expose confidential information.

Screenshot capture must be treated as a separate data-collection capability.

It must not be enabled by default without review.

---

## Mobile Crash Reports

Mobile crash reports may include:

```text
device metadata
stack traces
application state
breadcrumbs
local paths
```

Collection should be minimized.

Crash-report attachments and memory dumps require additional review because they may contain arbitrary sensitive data.

---

## Desktop Crash Dumps

Desktop crash dumps and memory dumps can contain arbitrary process memory.

They may therefore include:

```text
tokens
personal data
documents
credentials
```

Full memory dumps should be treated as highly sensitive diagnostic artifacts.

Their collection should require explicit justification and restricted access.

---

## Environment Variables

Telemetry must never include complete environment-variable dumps.

Environment variables frequently contain secrets.

If safe configuration state must be recorded, construct an explicit allowlisted representation.

Example:

```text
runtimeMode: "production"
paymentProvider: "example"
featureSet: "stable"
```

not:

```text
process.env
```

---

## Application Configuration

Configuration objects may contain both public settings and secrets.

Never log entire configuration structures by default.

Prefer safe configuration summaries generated through explicit schemas.

---

## Startup Logs

Startup logs must not print secret configuration.

Avoid:

```text
Connected with DATABASE_URL=...
Provider initialized with key=...
```

Prefer:

```text
Database connection initialized.
Payment provider initialized.
```

or safe non-secret metadata.

---

## Secret Detection

Orion should eventually use multiple layers of secret detection.

Potential layers include:

```text
source-control secret scanning
static analysis
runtime telemetry redaction
schema-based classification
CI validation
provider-side filtering
```

No single layer should be considered sufficient.

---

## Redaction at Source

The strongest redaction point is before sensitive data enters telemetry.

Prefer:

```text
application
    ↓ emits safe telemetry
```

over:

```text
application emits sensitive telemetry
    ↓ collector removes it later
```

Early redaction reduces exposure across intermediate systems.

---

## Centralized Redaction

Cross-cutting infrastructure should also provide centralized protection.

For example:

```text
application logger
    ↓
shared redaction processor
    ↓
telemetry exporter
```

Centralized redaction protects against accidental unsafe fields.

It complements, rather than replaces, safe instrumentation at the source.

---

## Collector-Side Redaction

Telemetry collectors or processors may provide additional filtering before data reaches external systems.

This is useful as defense in depth.

However, collector-side redaction should not be the only layer protecting secrets.

---

## Provider-Side Redaction

External telemetry providers may offer data-scrubbing features.

These should be configured where useful.

They are the final defense layer, not the primary policy.

Sensitive data has already crossed a boundary by the time provider-side filtering occurs.

---

## Defense in Depth

A strong telemetry pipeline may use:

```text
safe instrumentation
        ↓
application redaction
        ↓
collector filtering
        ↓
provider scrubbing
```

Each layer reduces the probability and impact of accidental exposure.

---

## Redaction Failure Behavior

If redaction fails, telemetry handling should fail safely.

The system should prefer dropping unsafe telemetry over exporting potentially restricted information.

For example:

```text
unable to safely sanitize diagnostic payload
        ↓
drop payload
        ↓
emit minimal safe redaction-failure signal
```

The redaction-failure signal itself must not contain the original sensitive payload.

---

## Redaction Error Recursion

Redaction failures must not create recursive telemetry failures.

Avoid:

```text
redaction error
    ↓
logs object that caused redaction error
    ↓
redaction error
```

Fallback behavior should produce only bounded safe metadata.

---

## Unknown Fields

Unknown dynamic fields must be treated conservatively.

For example:

```text
metadata: Record<string, unknown>
```

must not automatically be added to telemetry.

When arbitrary structures exist, explicit allowlisting becomes even more important.

---

## Serialization Safety

Telemetry serialization may invoke:

```text
custom serializers
object getters
toJSON methods
recursive traversal
```

These mechanisms may unexpectedly expose additional fields.

Telemetry serializers should be deterministic and designed specifically for safe output when handling complex application objects.

---

## Logging Objects

Avoid:

```text
logger.info("User created", user)
```

when `user` is a full domain or persistence object.

Prefer:

```text
logger.info("User created", {
    event: "user.created",
    userId: user.id
})
```

This makes the telemetry contract explicit.

---

## ORM Entities and Domain Objects

Persistence and domain objects may contain fields that are not safe for telemetry.

They must not be serialized wholesale.

This includes objects representing:

```text
users
payments
sessions
credentials
orders
documents
```

Create explicit telemetry projections instead.

---

## Telemetry Projection

A telemetry projection is a deliberately safe representation of an object.

Conceptually:

```text
Order
    ↓
OrderTelemetryContext
```

Example:

```text
OrderTelemetryContext
{
    orderId
    state
    operation
}
```

rather than serializing every order field.

Telemetry projections may become reusable when a domain requires consistent instrumentation.

---

## Redaction and Data Classification Metadata

If Orion later introduces machine-readable data classification, telemetry redaction should consume that metadata where practical.

For example:

```text
field: passwordHash
classification: RESTRICTED
telemetry: prohibited
```

or:

```text
field: userId
classification: CONFIDENTIAL
telemetry: identifier-only
```

This would allow security rules to move from convention toward mechanical enforcement.

---

## Sensitive Field Metadata

Future schema metadata may define properties such as:

```text
classification
telemetryAllowed
telemetryTransform
exportable
clientVisible
```

The exact model should remain simple enough to maintain consistently.

Metadata that becomes stale is dangerous.

Generated validation should therefore be preferred where practical.

---

## Redaction Rules Must Be Testable

Important redaction behavior should have automated tests.

Potential tests include:

```text
Authorization header removed
password field removed
access token removed
safe userId retained
query string excluded
request body not captured
exception metadata sanitized
```

A redaction regression is a security defect.

---

## Representative Secret Tests

Tests should use obvious synthetic values.

Example:

```text
super-secret-test-token
```

The test should verify that the value does not appear anywhere in emitted telemetry.

This may include:

```text
logs
trace attributes
breadcrumbs
error events
```

---

## Negative Assertions

Telemetry tests should verify absence, not only presence.

For example:

```text
assert telemetry contains requestId
assert telemetry does not contain accessToken
```

This is especially important for security-sensitive instrumentation.

---

## End-to-End Telemetry Tests

Important flows may require tests through the full telemetry pipeline.

For example:

```text
application emits error
    ↓
redaction processor
    ↓
export payload
```

The final exported representation should be inspected for prohibited fields.

---

## Static Analysis

Future tooling may detect unsafe patterns such as:

```text
logger.info(request.body)
logger.error(process.env)
span.setAttribute("password", ...)
captureException(error, { extra: user })
```

Static analysis cannot detect every leak, but it can prevent common mistakes.

---

## Schema-Based Validation

If application schemas contain classification metadata, CI may eventually validate telemetry usage automatically.

Potential checks include:

```text
RESTRICTED fields cannot be referenced by telemetry helpers

CONFIDENTIAL fields require explicit policy

metric labels cannot use entity identifiers

client-safe telemetry cannot access server secrets
```

---

## Runtime Guards

Shared observability libraries may provide runtime guards.

For example:

```text
reject known restricted field names
truncate oversized values
limit object depth
reject arbitrary objects
```

Runtime guards should remain a fallback.

They should not encourage unsafe instrumentation patterns.

---

## Logging APIs

Orion should prefer structured logging APIs that make context explicit.

Prefer:

```text
logger.info("order.cancelled", {
    orderId,
    requestId
})
```

over free-form concatenation such as:

```text
logger.info(
    "Order " + orderId +
    " cancelled by " + email +
    " with token " + token
)
```

Structured APIs make security inspection easier.

---

## Unsafe String Interpolation

Even structured logging systems cannot redact values reliably when sensitive information is embedded into arbitrary strings.

For example:

```text
logger.info(`Login with token ${token}`)
```

is significantly harder to sanitize than:

```text
logger.info("authentication.attempt", {
    token: token
})
```

although the token should not be logged in either case.

Avoid embedding runtime data into opaque messages unnecessarily.

---

## Stable Event Schemas

Important telemetry events may eventually have defined schemas.

Example:

```text
payment.capture.failed

allowed fields:
    paymentAttemptId
    provider
    errorCode
    duration
    traceId
```

A schema-based approach improves:

```text
consistency
security review
documentation
analytics
AI reasoning
```

It should be introduced where the value justifies the maintenance cost.

---

## Telemetry Size Limits

Large telemetry payloads increase cost and exposure risk.

Shared telemetry infrastructure should consider limits for:

```text
string length
array size
object depth
breadcrumb count
exception metadata
```

Truncation must not create misleading semantics.

---

## User-Generated Strings

User-generated strings should not automatically become log messages or telemetry attributes.

Examples include:

```text
search text
comments
document titles
form fields
chat messages
file names
```

If a value is required, classify and sanitize it explicitly.

---

## File Paths

File paths may reveal:

```text
usernames
project structure
private document names
local directories
```

Server-internal source paths may be acceptable inside trusted stack traces.

User-controlled or local-client paths require greater caution.

---

## IP Addresses

IP addresses may constitute personal data depending on context and jurisdiction.

They should not be captured merely because framework instrumentation provides them.

If IP collection is operationally or security-relevant, its purpose and retention must be explicit.

---

## User-Agent Information

User-agent information may help diagnose compatibility problems.

Full values may also contribute to device fingerprinting.

Capture only when there is a concrete need.

Normalized browser/platform information may be preferable to raw strings.

---

## Device Information

Mobile and desktop telemetry should avoid collecting excessive device information.

Potentially useful information may include:

```text
operating-system version
application version
device class
architecture
```

Unique device identifiers require additional justification.

---

## Geolocation

Precise location data is highly sensitive.

It must not be attached to telemetry by default.

If a product requires location functionality, observability should capture only the minimum information necessary to diagnose location-related behavior.

---

## Feature Flags

Telemetry may include feature-flag state when required for debugging.

Prefer bounded flag identifiers and values.

Do not attach entire feature-flag contexts containing user attributes.

---

## Error Codes

Stable error codes are preferred telemetry dimensions.

Example:

```text
error.code = "ORDER_ALREADY_SHIPPED"
```

This is safer and more useful than arbitrary exception text.

---

## Provider Error Codes

Provider-specific error codes may be stored internally when they help investigation.

They must be reviewed for sensitivity and cardinality.

Public application consumers should still rely on Orion-owned error semantics where appropriate.

---

## Redaction and Correlation

Redaction must preserve operational correlation when possible.

For example, removing personal information should not remove:

```text
requestId
traceId
errorId
jobId
internal resource identifier when allowed
```

These identifiers provide diagnostic value without requiring descriptive sensitive data.

---

## Support References

User-facing support references such as `errorId` or `requestId` should be safe to disclose.

They must not encode:

```text
email
user ID directly
timestamp with sensitive meaning
secret state
database key material
```

Prefer random or opaque identifiers.

---

## Telemetry Export

Telemetry exporters should transmit data only to approved destinations.

An application must not introduce a new telemetry destination casually.

A new external telemetry provider creates a data-processing boundary and may require:

```text
security review
privacy review
data-processing review
retention review
ADR
```

depending on its significance.

---

## Multi-Vendor Telemetry

Sending the same telemetry to multiple providers increases exposure and retention surfaces.

Do not duplicate telemetry across vendors without concrete value.

Each destination must independently satisfy Orion's data-handling requirements.

---

## Development Telemetry

Development environments may expose richer diagnostics, but restricted-data rules still apply.

Development mode does not justify logging:

```text
passwords
tokens
API secrets
private keys
```

Developers should not become accustomed to unsafe logging patterns that later reach production.

---

## Test Telemetry

Tests should use synthetic sensitive values and verify sanitization.

Test telemetry must not accidentally export to production telemetry systems.

Automated-test environments should normally use isolated or disabled external telemetry exporters.

---

## CI Telemetry

CI logs are telemetry and may be retained externally.

Do not print:

```text
environment secrets
credential files
tokens
production data
```

Build and deployment scripts must use secret-masking capabilities where available.

---

## Infrastructure Logs

Infrastructure systems may log:

```text
HTTP metadata
container output
load-balancer requests
database events
cloud audit activity
```

Application-level redaction is not sufficient if infrastructure independently records sensitive data.

Infrastructure logging configuration must follow the same policy.

---

## Reverse Proxies and Load Balancers

Access logs may capture:

```text
full URLs
query strings
headers
IP addresses
```

Default configurations must be reviewed.

A secure application logger does not prevent an upstream proxy from leaking sensitive query parameters.

---

## Database Server Logs

Database systems may log:

```text
queries
failed statements
parameters
connection information
```

Database logging configuration must be reviewed independently of application logging.

---

## Container and Platform Logs

Anything written to standard output or standard error may be collected automatically by the platform.

Therefore:

```text
print(secret)
console.log(token)
```

is effectively a telemetry leak even when no logging library is involved.

---

## Third-Party SDK Logging

Some SDKs support debug logging that may expose:

```text
headers
payloads
credentials
provider responses
```

Debug logging must be reviewed before being enabled.

Production debug logging should never be enabled casually.

---

## Emergency Diagnostics

Exceptional incidents may justify temporarily increased telemetry.

Such changes must be:

```text
explicit
time-bounded
reviewed
minimized
removed afterward
```

Restricted data must still not be captured intentionally.

Emergency debugging is not an exemption from core secret-handling rules.

---

## Temporary Diagnostic Instrumentation

Temporary logs added during incident investigation should be clearly identifiable and removed when no longer needed.

They must still follow classification rules.

A temporary diagnostic line can leak data just as easily as permanent instrumentation.

---

## Redaction Incidents

If confidential or restricted data is found in telemetry, treat the situation as a security issue.

Response should include:

```text
stop further collection
identify affected telemetry destinations
determine data classification
determine exposure scope
remove data where possible
rotate credentials if applicable
review access history
fix the instrumentation
add regression protection
```

The severity depends on the data involved.

---

## Credential Leakage

If a credential appears in telemetry, assume that the credential may have been exposed.

Removing the telemetry entry does not restore the credential's secrecy.

The credential should be revoked or rotated according to incident procedures.

---

## Historical Telemetry

Fixing instrumentation prevents future leakage.

It does not automatically remove already stored telemetry.

Investigation must consider:

```text
logs
traces
error reports
backups
exports
provider retention
```

where the sensitive value may already exist.

---

## Access to Telemetry

Telemetry access must follow least privilege.

Because telemetry may contain confidential operational information, access should be limited to contributors and systems that require it.

Sensitive telemetry access should be auditable where appropriate.

---

## AI Agent Access

AI agents may access telemetry only according to approved authorization and data-classification rules.

Prefer providing agents with:

```text
structured
sanitized
minimal
task-relevant
```

telemetry.

Do not provide:

```text
raw environment dumps
full customer records
unredacted request payloads
credential-bearing logs
```

merely because they may help debugging.

---

## AI-Friendly Telemetry

Telemetry should be designed so AI agents can reason from machine-readable evidence.

Prefer:

```text
event: payment.capture.failed
errorCode: PAYMENT_PROVIDER_UNAVAILABLE
paymentAttemptId: pat_01...
traceId: ...
```

over:

```text
"Something weird happened while paying."
```

Security and machine readability reinforce each other when telemetry uses explicit bounded fields.

---

## Sanitized Investigation Bundles

Orion may eventually support generating sanitized diagnostic bundles for support or AI-assisted investigation.

Such a bundle could include:

```text
error metadata
trace identifiers
selected structured logs
release information
environment
safe configuration summary
```

It should exclude restricted data by construction.

The exact implementation should be introduced only when there is a concrete operational need.

---

## Documentation Examples

Telemetry documentation must use synthetic values.

Do not copy production logs directly into repository documentation without sanitization.

Example values should be obviously fictional.

---

## Machine-Readable Policy

As Orion evolves, some redaction rules should become machine-readable.

Potential sources include:

```text
schema metadata
telemetry event schemas
shared redaction configuration
data classification metadata
```

This allows policy to be enforced consistently across:

```text
backend
web
mobile
desktop
workers
tooling
```

---

## Canonical Redaction Policy

Orion should eventually have one canonical redaction-policy definition where practical.

Applications may add stricter local rules.

They should not independently maintain conflicting copies of the same secret-field policy.

A conceptual future model may include:

```text
restrictedFieldNames
restrictedHeaders
restrictedQueryParameters
safeTelemetryFields
fieldTransformations
maximumValueLengths
```

The implementation format depends on the selected stack.

---

## Generated Documentation

Machine-readable redaction rules may eventually generate documentation showing:

```text
which fields are prohibited;
which headers are removed;
which fields are masked;
which fields are allowed;
```

Generated documentation should not include actual secret values.

---

## Mechanical Enforcement

Future enforcement may include:

```text
static analysis of logging calls
structured telemetry schemas
secret-field detection
schema-based classification checks
CI telemetry tests
runtime redaction processors
provider scrubbing configuration validation
```

The goal is to reduce reliance on memory and manual code review.

---

## Pull Request Review

Changes that introduce new telemetry should be reviewed for:

```text
purpose
fields captured
classification
cardinality
retention implications
provider exposure
redaction
AI accessibility
```

A log statement is a data-collection decision.

It should be reviewed accordingly.

---

## New Telemetry Checklist

Before introducing new telemetry, determine:

1. What operational question does this telemetry answer?
2. Which fields are required?
3. What is each field's classification?
4. Can a safer identifier provide the same value?
5. Could any field contain user-controlled content?
6. Could any field contain a credential?
7. Is the data bounded?
8. Is the destination approved?
9. Is retention appropriate?
10. Should this behavior have a redaction test?

If these questions cannot be answered, the telemetry design is not ready.

---

## Initial Redaction Rules

Until stack-specific implementation exists, Orion adopts the following requirements:

1. `RESTRICTED` data must never be intentionally captured in telemetry.
2. Request and response bodies must not be captured by default.
3. Headers must use explicit allowlisting or equivalent safe filtering.
4. Authorization and session credentials must always be removed.
5. Query strings must not be captured indiscriminately.
6. Application objects must not be serialized wholesale into telemetry.
7. Database query parameters must not be captured by default.
8. Metrics must avoid personal and high-cardinality identifiers.
9. Error-reporting SDK automatic capture must be reviewed before production use.
10. Local-variable capture must be disabled by default.
11. Structured fields are preferred over arbitrary interpolated messages.
12. Redaction should happen as early as practical.
13. Centralized redaction must provide defense in depth.
14. Redaction failures must fail safely.
15. Important redaction behavior must be automatically tested.
16. Production and development environments both follow secret-protection rules.
17. AI agents receive only sanitized telemetry appropriate to their authorization.
18. Telemetry providers must be treated as external data-processing boundaries.
19. Telemetry leakage of restricted information is a security incident.
20. Redaction rules should become machine-readable and enforceable where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
OpenTelemetry configuration
error-reporting provider
redaction library
collector architecture
session-replay policy
telemetry retention
provider-side scrubbing rules
machine-readable classification format
```

These decisions should follow the selected technology stack and deployment architecture.

---

## Future Documentation

This document may later be complemented by:

- [docs/security/secrets-management.md](secrets-management.md)
- [docs/security/production-access.md](production-access.md)
- [docs/security/data-retention.md](data-retention.md)
- [docs/security/incident-response.md](incident-response.md)
- [docs/reliability/logging.md](../reliability/logging.md)
- [docs/reliability/tracing.md](../reliability/tracing.md)
- [docs/reliability/error-reporting.md](../reliability/error-reporting.md)

Implementation-specific documents must follow the policy defined here.

---

## Summary

Telemetry is an additional copy of application information.

Therefore:

```text
less collection
    ↓
less redaction complexity
    ↓
less exposure
```

Orion prefers:

```text
explicit safe telemetry
```

over:

```text
arbitrary runtime objects + cleanup
```

The most important rules are:

```text
never capture secrets

do not capture payloads by default

prefer allowlists

prefer structured bounded fields

use identifiers instead of personal data

redact before export

apply defense in depth

test the absence of sensitive data
```

Observability must make production behavior understandable.

It must not make production data unnecessarily visible.

A telemetry system that lacks diagnostic value is a reliability problem.

A telemetry system that captures sensitive information unnecessarily is a security problem.

Orion must solve for both simultaneously.
