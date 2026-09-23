# Error Handling

## Purpose

This document defines the error-handling principles and error model used by Orion.

Its goals are to ensure that failures are:

- explicit;
- predictable;
- safe;
- observable;
- diagnosable;
- consistent across applications;
- meaningful to machines;
- understandable to humans.

Errors are part of system behavior.

They must not be treated as incidental implementation details.

This document is technology-agnostic.

Framework-specific implementations should follow these rules rather than redefine them independently.

---

## Core Principle

Expected failures should be represented explicitly.

Unexpected failures should be observable.

External consumers should receive stable error contracts.

Internal diagnostic information should remain available to trusted systems without being exposed unnecessarily to users.

The error model must distinguish between:

```text
what happened

what the caller may safely know

what the user should see

what developers need for investigation
```

These concerns are related but are not the same.

---

# Error Categories

Orion distinguishes several high-level categories of failure.

---

## Validation Errors

Validation errors occur when provided input does not satisfy the expected structure or constraints.

Examples include:

```text
missing required field
invalid email format
invalid enum value
malformed identifier
value outside allowed range
unsupported input format
```

Validation errors are expected failures.

They should normally provide enough structured information for the caller to identify the invalid input.

Example conceptual structure:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "The request contains invalid data.",
  "details": [
    {
      "field": "email",
      "code": "INVALID_EMAIL"
    }
  ]
}
```

Human-readable field messages may be localized by the consuming application.

Stable machine-readable codes should remain independent of localization.

---

## Domain Errors

Domain errors represent valid requests that cannot be completed because of business rules or domain state.

Examples include:

```text
ORDER_ALREADY_SHIPPED
INSUFFICIENT_BALANCE
SUBSCRIPTION_ALREADY_CANCELLED
EMAIL_ALREADY_IN_USE
PAYMENT_ALREADY_CAPTURED
```

These are expected failures.

A domain error should represent meaningful business semantics rather than infrastructure details.

Prefer:

```text
ORDER_ALREADY_SHIPPED
```

over:

```text
DATABASE_CONSTRAINT_FAILED
```

when the actual meaning is a business rule.

---

## Authentication Errors

Authentication errors occur when the system cannot establish a valid identity.

Examples include:

```text
missing authentication
expired session
invalid token
invalid credentials
revoked session
```

Authentication errors must not reveal unnecessary information that could assist an attacker.

For example, authentication flows should avoid exposing whether a particular credential identifier exists when that distinction is not required.

---

## Authorization Errors

Authorization errors occur when an authenticated actor is not permitted to perform an operation.

Examples include:

```text
insufficient permission
resource access denied
administrative action denied
tenant boundary violation
```

Authorization decisions must be enforced at trusted boundaries.

Client-side visibility rules do not replace server-side authorization.

Authorization failures should avoid exposing protected resource information unnecessarily.

---

## Not Found Errors

A not-found error occurs when a requested resource cannot be resolved.

Examples include:

```text
USER_NOT_FOUND
ORDER_NOT_FOUND
DOCUMENT_NOT_FOUND
```

Whether a not-found condition should be distinguishable from an authorization failure depends on security requirements.

For sensitive resources, the system may intentionally avoid revealing whether the resource exists.

---

## Conflict Errors

Conflict errors occur when an operation cannot proceed because of current system state.

Examples include:

```text
VERSION_CONFLICT
RESOURCE_ALREADY_EXISTS
DUPLICATE_OPERATION
OPTIMISTIC_LOCK_FAILED
```

These may represent concurrency, uniqueness, or state-transition conflicts.

Conflict errors should expose semantic meaning rather than raw persistence exceptions.

---

## Rate Limit Errors

Rate-limit errors occur when an actor, client, or integration exceeds an allowed usage threshold.

A rate-limit error should provide machine-readable information where appropriate, such as:

```text
error code
retry eligibility
retry-after information
limit scope
```

Do not expose internal anti-abuse strategy details unnecessarily.

---

## External Dependency Errors

External dependency errors occur when Orion depends on another system that cannot complete an operation.

Examples include:

```text
payment provider unavailable
email service timeout
object storage failure
identity provider outage
external API rate limit
```

These failures require careful classification.

A provider-specific error should normally be translated into an application-level error.

Prefer:

```text
PAYMENT_PROVIDER_UNAVAILABLE
```

over exposing:

```text
StripeConnectionError
```

or equivalent provider-specific implementation details to external consumers.

---

## Infrastructure Errors

Infrastructure errors originate from technical dependencies such as:

```text
database
filesystem
network
queue
cache
runtime
operating system
```

Infrastructure failures are generally not part of the public contract directly.

They should be translated into stable application semantics where appropriate and preserved internally for diagnostics.

---

## Unexpected Internal Errors

Unexpected internal errors represent failures that the application did not intentionally model as part of normal behavior.

Examples include:

```text
unexpected null state
unhandled exception
programming error
broken invariant
unexpected database failure
unhandled provider behavior
```

These failures must:

- be captured;
- be correlated;
- be observable;
- avoid leaking internal details to external users.

The public representation should normally be generic.

For example:

```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred.",
  "errorId": "err_01...",
  "traceId": "..."
}
```

The internal telemetry should contain substantially more diagnostic context.

---

# Expected vs Unexpected Failures

One of the most important distinctions in Orion is:

```text
expected failure
```

versus:

```text
unexpected failure
```

An expected failure is part of known system behavior.

Examples:

```text
invalid input
insufficient permissions
order cannot be cancelled
resource does not exist
duplicate operation
```

An unexpected failure indicates a defect, unavailable dependency, violated invariant, or unmodeled condition.

Examples:

```text
unhandled exception
unexpected database error
impossible state
serialization failure
unknown provider response
```

Expected failures should normally not generate the same operational severity as unexpected failures.

Unexpected failures should normally produce diagnostic telemetry and error tracking.

---

# Error Contract

Cross-application errors should use a consistent conceptual structure.

A possible canonical model is:

```json
{
  "error": {
    "code": "ORDER_ALREADY_SHIPPED",
    "message": "This order can no longer be cancelled.",
    "requestId": "req_01...",
    "traceId": "4bf92f...",
    "errorId": "err_01..."
  }
}
```

Additional structured details may be included when appropriate.

For example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": [
      {
        "field": "email",
        "code": "INVALID_EMAIL"
      }
    ],
    "requestId": "req_01..."
  }
}
```

The exact serialized schema will be defined when API contracts are introduced.

---

# Error Codes

Error codes are stable machine-readable identifiers.

They exist so consumers do not need to parse human-readable messages.

Prefer:

```text
ORDER_ALREADY_SHIPPED
```

over:

```text
"The order has already been shipped."
```

for application logic.

Error codes should be:

- stable;
- explicit;
- documented;
- independent of localization;
- meaningful within their ownership boundary.

---

## Error Code Naming

Error codes should normally use uppercase machine-readable names.

Examples:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
PERMISSION_DENIED
ORDER_NOT_FOUND
ORDER_ALREADY_SHIPPED
PAYMENT_DECLINED
EXTERNAL_SERVICE_UNAVAILABLE
INTERNAL_ERROR
```

Codes should describe semantics rather than implementation.

Avoid:

```text
PRISMA_P2002
SQLSTATE_23505
STRIPE_ERROR
NULL_POINTER_EXCEPTION
```

as public application error codes.

Implementation-specific codes may still be recorded internally.

---

# Error Messages

Error messages are intended for humans.

They must not be used as stable programmatic identifiers.

Do not write consumer logic such as:

```text
if message == "Order already shipped"
```

Consumers should use error codes.

Messages may evolve independently.

---

## User-Facing Messages

User-facing error messages should:

- be understandable;
- avoid internal terminology;
- avoid stack traces;
- avoid sensitive data;
- avoid unnecessary implementation details;
- provide actionable guidance when appropriate.

For example:

```text
We could not complete this payment. Please try again.
```

is preferable to:

```text
PaymentGatewayTimeoutException after 30000 ms.
```

---

## Localization

Repository code and canonical error codes remain in English.

User-facing applications may localize messages.

Prefer:

```text
error code
    ↓
client localization
    ↓
localized user message
```

where appropriate.

The backend should not require clients to parse English messages.

Some server-provided messages may still be appropriate depending on the product contract.

The localization strategy will be defined separately.

---

# Error Details

Errors may include structured details when consumers can act on them safely.

Examples include:

```text
invalid fields
retry information
conflicting version
allowed state transitions
quota information
```

Error details must have an explicit schema.

Avoid arbitrary structures such as:

```json
{
  "details": {
    "anything": "can appear here"
  }
}
```

for public contracts.

A loosely defined error payload becomes difficult to validate, document, and evolve.

---

# Correlation Identifiers

Errors should preserve identifiers that allow the observed failure to be connected with telemetry.

Potential identifiers include:

```text
requestId
traceId
errorId
eventId
jobId
```

These identifiers have different responsibilities.

---

## Request ID

A request ID identifies an individual request or operation at an application boundary.

Example:

```text
req_01H...
```

It may be useful for:

- support;
- logs;
- API diagnostics;
- request correlation.

A request ID is not necessarily equivalent to a distributed trace ID.

---

## Trace ID

A trace ID identifies a distributed execution trace.

It may connect:

```text
browser
    ↓
API
    ↓
database
    ↓
external provider
```

or:

```text
API
    ↓
message
    ↓
worker
```

Trace identifiers should be propagated where supported by the observability architecture.

---

## Error ID

An error ID identifies a particular reported error occurrence or error-reporting event.

It may be useful when presenting a safe support reference to users.

Example:

```text
Something went wrong.

Reference:
err_01J8X4A2K9
```

The user can provide this reference without seeing internal implementation details.

---

# Internal Error Representation

Internal error objects may contain more information than public error contracts.

Potential internal properties include:

```text
error type
error code
original cause
operation
domain context
retryability
severity
provider metadata
database metadata
stack trace
request ID
trace ID
error ID
```

Internal errors must still respect privacy and telemetry policies.

More context does not mean unrestricted data capture.

---

# Error Causes

When one error is translated into another, the original cause should be preserved internally when the language or runtime supports it.

Conceptually:

```text
database unique constraint
        ↓
EmailAlreadyInUseError
        ↓
EMAIL_ALREADY_IN_USE
```

The external consumer sees:

```text
EMAIL_ALREADY_IN_USE
```

Internal telemetry may retain:

```text
EmailAlreadyInUseError
caused by database uniqueness violation
```

This preserves diagnosability without leaking implementation details.

---

# Error Translation

Errors should be translated at architectural boundaries.

For example:

```text
database
    ↓
persistence error
    ↓
application/domain error
    ↓
transport error contract
```

Each boundary should expose concepts appropriate to that boundary.

Do not expose raw lower-level exceptions across unrelated layers.

---

# Persistence Error Translation

Database failures should not normally become public database errors.

For example:

```text
unique constraint violation
```

may represent:

```text
EMAIL_ALREADY_IN_USE
```

or:

```text
DUPLICATE_IDEMPOTENCY_KEY
```

depending on domain semantics.

Likewise:

```text
foreign key violation
```

may indicate a programming defect rather than a caller error.

Translation depends on ownership and intent.

Do not map database errors mechanically without understanding their semantics.

---

# Provider Error Translation

External provider errors should be mapped into application-level concepts where appropriate.

For example:

```text
provider connection timeout
    ↓
PAYMENT_PROVIDER_UNAVAILABLE
```

```text
provider card declined
    ↓
PAYMENT_DECLINED
```

```text
provider invalid API key
    ↓
internal configuration incident
```

These failures have different operational meanings even if they originate from the same SDK.

---

# Transport Mapping

Transport layers translate internal error semantics into transport-specific representations.

For HTTP, this may include:

```text
status code
headers
serialized error contract
retry information
```

The domain should not need to know HTTP status codes.

Conceptually:

```text
OrderAlreadyShipped
        ↓
transport mapping
        ↓
HTTP response
```

The exact HTTP mapping will be defined in API documentation.

---

# HTTP Status Codes

When HTTP is used, status codes should reflect broad protocol semantics.

Possible conceptual mappings include:

```text
validation failure
    → 400

authentication required
    → 401

permission denied
    → 403

resource not found
    → 404

state conflict
    → 409

rate limited
    → 429

unexpected internal failure
    → 500

temporary upstream unavailable
    → 502 / 503 depending on context
```

These mappings are guidelines.

The API contract should define the final conventions.

Application logic should depend on stable error codes rather than only HTTP status codes.

Multiple different application errors may legitimately share the same HTTP status.

---

# Error Ownership

Every stable error code should have an identifiable owner.

For example:

```text
ORDER_ALREADY_SHIPPED
    owned by Orders domain
```

```text
PAYMENT_DECLINED
    owned by Payments capability
```

```text
VALIDATION_ERROR
    owned by shared API conventions
```

Avoid creating global error-code namespaces containing unrelated concepts without ownership.

---

# Domain Error Granularity

Error codes should be specific enough to support meaningful behavior.

Avoid overly generic domain errors such as:

```text
ORDER_ERROR
PAYMENT_ERROR
USER_ERROR
```

when consumers need to distinguish actual conditions.

At the same time, avoid exposing every internal branch as a permanent public contract.

Error granularity should correspond to meaningful consumer behavior.

---

# Public vs Internal Error Codes

Some error codes are public contracts.

Others may be internal operational classifications.

For example:

```text
Public:
PAYMENT_DECLINED
```

while internal telemetry may classify:

```text
PAYMENT_PROVIDER_TIMEOUT
PAYMENT_PROVIDER_INVALID_RESPONSE
PAYMENT_PROVIDER_AUTHENTICATION_FAILED
```

Whether an internal classification becomes public should depend on whether consumers can usefully act on the distinction.

---

# Retryability

Retry behavior should be explicit when it matters.

Errors may conceptually be classified as:

```text
retryable
non-retryable
conditionally retryable
```

For example:

```text
temporary network timeout
    → potentially retryable

validation error
    → non-retryable

payment declined
    → usually non-retryable without changed input

rate limit
    → retryable after a delay
```

Retryability should not be inferred solely from generic error categories.

Retries can duplicate side effects.

Idempotency must be considered.

---

# Error Severity

Operational severity is different from user-facing error type.

Potential internal severity levels may include:

```text
debug
info
warning
error
critical
```

The exact logging model will be defined in reliability documentation.

Expected domain failures should not automatically generate high-severity error telemetry.

For example:

```text
wrong password
```

may be an expected authentication failure.

It should not automatically create an incident-level alert.

---

# Logging Errors

Errors must not be logged redundantly at every layer.

This pattern should be avoided:

```text
repository logs error
    ↓
service logs same error
    ↓
controller logs same error
    ↓
global handler logs same error
```

This creates duplicate noise.

Prefer one authoritative error-reporting point for unexpected failures, while lower layers enrich or propagate structured context.

The final logging architecture will define exact ownership.

---

# Log Context

Useful error context may include:

```text
operation
requestId
traceId
errorId
actorId when permitted
entity type
entity identifier when permitted
provider
attempt
duration
release
environment
```

Context should be structured.

Avoid embedding all context into a single human-readable message.

---

# Sensitive Information

Errors and telemetry must never intentionally expose or record prohibited sensitive information.

Examples include:

```text
passwords
authentication tokens
session secrets
API keys
private keys
payment credentials
database passwords
authorization headers
```

Sensitive values must not appear in:

```text
public error responses
logs
error-reporting systems
trace attributes
metrics labels
breadcrumbs
```

---

# Personal Data

Personal information must not be attached to errors by default merely because it may be useful for debugging.

Data collection should follow explicit privacy and retention policy.

Prefer stable internal identifiers where possible.

For example:

```text
userId
```

may be preferable to:

```text
full name
email
phone number
```

depending on the investigation requirement and privacy policy.

---

# Stack Traces

Stack traces are internal diagnostic information.

They must not be exposed to untrusted users in production.

Stack traces may be captured by trusted observability systems.

Development environments may expose additional detail when safe and explicitly configured.

---

# Development vs Production Errors

Development environments may provide richer diagnostic output.

Production environments must provide safe error contracts.

The semantic error code should remain consistent when practical.

For example:

```text
Development:
INTERNAL_ERROR
+ local stack trace

Production:
INTERNAL_ERROR
+ safe error reference
```

Environment differences must not cause fundamentally different business behavior.

---

# Unhandled Exceptions

Every executable application should have a final unhandled-error boundary appropriate to its runtime.

Examples may include:

```text
global HTTP exception handler
background-job error boundary
process-level rejection handling
UI error boundary
desktop crash reporting
mobile crash reporting
```

The purpose of the final boundary is to:

- capture unexpected failures;
- report telemetry;
- preserve correlation information;
- return or display a safe result where possible;
- avoid silent failure.

It is not a substitute for handling expected failures explicitly.

---

# Process-Level Failures

Some failures may leave process state unreliable.

Examples may include:

```text
corrupted global state
failed critical initialization
broken invariant in infrastructure initialization
unrecoverable runtime condition
```

In such situations, terminating and allowing controlled restart may be safer than continuing.

The exact policy depends on runtime architecture and will be documented where relevant.

---

# Initialization Errors

Applications should fail early when required initialization cannot complete safely.

Examples include:

```text
missing required configuration
invalid configuration
unavailable mandatory startup dependency
failed schema compatibility check
invalid secrets
```

Avoid starting an application in a partially functional state unless degraded operation is explicitly supported.

---

# Background Job Errors

Background jobs require explicit error semantics.

A failed job may need classification such as:

```text
retryable failure
permanent failure
invalid payload
duplicate delivery
dependency unavailable
poison message
```

Job failures should retain:

```text
jobId
trace context
attempt number
error classification
```

where appropriate.

Repeated failures should become operationally visible.

---

# Event Consumer Errors

Event and message consumers must distinguish between:

```text
temporary processing failure
permanent business rejection
invalid message contract
duplicate event
consumer defect
```

Blind retries can create infinite failure loops.

Poison-message behavior should be deliberate.

---

# UI Error Handling

Client applications should not present raw backend errors directly to users.

The client should interpret stable error contracts and decide how to present them.

Conceptually:

```text
API error
    ↓
client error classification
    ↓
user experience
```

For example:

```text
VALIDATION_ERROR
    → field-level feedback

AUTHENTICATION_REQUIRED
    → authentication flow

PERMISSION_DENIED
    → access-denied experience

INTERNAL_ERROR
    → generic failure + support reference
```

The same backend error may be presented differently across web, mobile, and desktop applications.

---

# Expected UI Errors

Expected user-correctable failures should usually be handled locally.

Examples:

```text
invalid form input
expired confirmation code
duplicate email
insufficient permissions
business rule violation
```

These should not necessarily trigger global application error experiences.

---

# Unexpected UI Errors

Unexpected client failures should be captured through client-side error reporting.

Examples include:

```text
rendering crash
unexpected state
unhandled promise rejection
native crash
desktop process crash
```

Client observability should include release information and sufficient context to diagnose the failure safely.

---

# User Error References

Unexpected failures may expose a safe reference identifier to the user.

Example:

```text
Something went wrong.

Reference:
err_01J8X4A2K9
```

This can help support or engineering correlate a report with telemetry.

The reference must not encode sensitive information.

---

# Supportability

A production error should ideally be diagnosable from:

```text
error reference
request ID
trace ID
release
timestamp
```

without requiring the user to describe internal application behavior.

The system should not depend exclusively on screenshots of error messages for diagnosis.

---

# Error Tracking

Unexpected failures should eventually integrate with a centralized error-tracking mechanism.

The specific provider is not defined by this document.

The system should support capabilities such as:

```text
exception capture
stack traces
release correlation
environment classification
error grouping
breadcrumbs
trace correlation
alerting
user feedback where appropriate
```

Provider selection will be documented separately.

---

# Source Maps and Symbolication

Applications that transform or compile production code should preserve the ability to map production failures back to meaningful source locations.

Examples include:

```text
JavaScript source maps
native symbol files
compiled stack mapping
```

Diagnostic artifacts must be handled securely.

They should not necessarily be publicly accessible.

---

# Error Reporting and Releases

Error telemetry should identify the application release where practical.

This allows investigation of questions such as:

```text
Which release introduced the failure?

Did the error disappear after deployment?

Which users are still running an affected mobile version?
```

Release identity should follow repository release conventions once defined.

---

# Error Metrics

Important error classes may contribute to operational metrics.

Examples include:

```text
unexpected error rate
dependency failure rate
payment failure rate
job retry rate
authorization failure rate
```

Metrics should use bounded dimensions.

High-cardinality values such as arbitrary error messages or full identifiers must not be used carelessly as metric labels.

---

# Alerting

Not every error occurrence should produce an alert.

Alerting should prioritize conditions requiring action.

Examples may include:

```text
sudden increase in unexpected failures
sustained dependency outage
critical workflow failure
background job dead-letter growth
high error rate after deployment
```

Expected user errors should not generate alert fatigue.

---

# Error Budgets and Reliability

As Orion matures, error rates may become part of formal reliability objectives.

This may include:

```text
service-level indicators
service-level objectives
error budgets
availability objectives
latency objectives
```

These concepts should be introduced when operational maturity requires them.

They are not required merely because the architecture supports observability.

---

# Errors and Transactions

Errors that occur during transactional operations must preserve data integrity.

A failed operation should not leave partial state unless partial completion is explicitly part of the domain.

For example:

```text
create order
charge payment
update inventory
```

requires deliberate transaction and compensation semantics.

Exception handling must not accidentally swallow failures that should abort a transaction.

---

# Errors and Side Effects

When an operation performs multiple side effects, failure semantics must be explicit.

Possible outcomes include:

```text
all effects succeeded
no effects succeeded
some effects succeeded
operation requires compensation
operation requires retry
```

The system must not claim success when externally meaningful required side effects failed.

---

# Partial Failures

Distributed operations may fail partially.

For example:

```text
order persisted
email failed
```

This may or may not mean the entire business operation failed.

The correct behavior depends on domain semantics.

Partial failure policy must be explicit for important workflows.

---

# Compensation

Some failures cannot be resolved through rollback.

External side effects may require compensation.

Examples include:

```text
refund payment
cancel reservation
delete provisioned resource
reverse allocation
```

Compensation logic should represent domain behavior rather than generic exception handling.

---

# Error Handling Must Not Hide Bugs

Avoid patterns such as:

```text
try {
    operation();
} catch {
    return null;
}
```

when failure has meaningful semantics.

Broad exception swallowing hides defects and damages observability.

Catch errors only when the current boundary can:

```text
recover
translate
enrich
retry safely
compensate
report appropriately
```

Otherwise, allow the error to propagate to the appropriate owner.

---

# Avoid Catch-All Business Logic

Do not convert every error into a generic expected error.

For example:

```text
try {
    ...
} catch {
    throw new OrderNotFoundError();
}
```

would be incorrect if the underlying failure could be:

```text
database outage
programming bug
timeout
```

Error translation must preserve semantics.

---

# Error Enrichment

A boundary may add useful context without changing error identity.

Conceptually:

```text
PaymentProviderUnavailable
    +
orderId
paymentAttemptId
provider
```

Care must be taken not to mutate globally shared error objects unpredictably.

The exact implementation depends on language and runtime.

---

# Assertions and Invariants

Assertions may be used to detect states that should be impossible.

An assertion failure should generally be treated as an unexpected internal error.

Assertions must not be used as a replacement for validating untrusted input.

For example:

```text
request field is valid
```

should be validated.

```text
domain state reached an impossible internal combination
```

may justify an invariant assertion.

---

# Public Error Compatibility

Once a public error code is consumed externally, it becomes part of the compatibility surface.

Do not casually:

```text
rename
remove
change semantics
reuse
```

public error codes.

If behavior changes, compatibility impact must be evaluated.

---

# Error Code Reuse

An existing error code should not be reused for a different semantic condition merely because the user-facing message is similar.

Error codes represent meaning.

For example:

```text
PAYMENT_DECLINED
```

must not later represent:

```text
payment provider unavailable
```

Those conditions require different consumer behavior.

---

# Error Documentation

Stable public errors should eventually be documented automatically where possible.

Potential generated information may include:

```text
error code
description
HTTP mapping
retryability
public details schema
owning domain
```

The canonical source should be machine-readable where practical.

Authored documentation may explain complex semantics that cannot be derived automatically.

---

# Testing Errors

Important error behavior requires tests.

Tests should verify:

```text
correct error classification
correct public code
safe serialization
expected transport mapping
authorization behavior
validation details
provider translation
absence of sensitive data
```

Unexpected error handling should also be tested at important application boundaries.

---

# Regression Tests

When a production bug involves incorrect error handling, the fix should include a regression test whenever practical.

Examples:

```text
provider timeout incorrectly returned success

database error leaked SQL message

permission failure exposed protected resource

unexpected exception returned stack trace
```

The regression test should protect the intended behavior.

---

# Observability Tests

Critical telemetry behavior may require tests.

Examples include:

```text
trace ID preserved
request ID returned
secret redaction applied
unexpected error reported
duplicate error reporting avoided
```

Observability is part of production behavior and may require verification.

---

# Error Handling Anti-Patterns

The following patterns should be avoided.

---

## String-Based Error Logic

Avoid:

```text
if error.message.includes("duplicate")
```

Prefer typed or coded errors.

---

## Raw Provider Errors

Avoid returning provider exceptions directly to consumers.

---

## Raw Database Errors

Avoid exposing database error messages or codes as the public API contract.

---

## Silent Catching

Avoid catching an error without intentionally handling, translating, or reporting it.

---

## Duplicate Reporting

Avoid reporting the same error independently at every architectural layer.

---

## Generic Success After Failure

Avoid returning successful responses after required side effects failed.

---

## User Messages as Contracts

Avoid making clients depend on human-readable message text.

---

## Sensitive Diagnostic Responses

Avoid returning:

```text
stack traces
SQL queries
filesystem paths
internal hostnames
secrets
provider credentials
```

to untrusted clients.

---

## Excessively Generic Errors

Avoid collapsing all expected behavior into:

```text
BAD_REQUEST
```

when meaningful consumer distinctions exist.

---

## Excessively Specific Public Errors

Avoid exposing every technical failure as a permanent public error code.

Public error semantics should correspond to meaningful consumer behavior.

---

# Responsibility by Layer

A conceptual responsibility model is:

```text
domain
    owns business failure semantics

application
    owns operation-level failure semantics

infrastructure
    owns technical implementation failures

transport
    owns protocol mapping

client
    owns user presentation

observability
    owns diagnostic capture
```

These boundaries may vary depending on the selected architecture.

The important principle is that each layer should expose errors appropriate to its consumers.

---

# Example: Order Cancellation

Consider:

```text
Cancel order
```

Potential domain failure:

```text
OrderAlreadyShipped
```

Application-level semantics:

```text
ORDER_ALREADY_SHIPPED
```

HTTP representation:

```json
{
  "error": {
    "code": "ORDER_ALREADY_SHIPPED",
    "message": "This order can no longer be cancelled.",
    "requestId": "req_01..."
  }
}
```

Web presentation:

```text
This order has already been shipped and can no longer be cancelled.
```

No infrastructure details are exposed.

---

# Example: Duplicate Email

Database behavior:

```text
unique constraint violation
```

Persistence translation:

```text
EmailAlreadyExists
```

Public contract:

```text
EMAIL_ALREADY_IN_USE
```

Client behavior:

```text
show field-level email feedback
```

The client does not need to know that uniqueness is enforced through a database index.

---

# Example: Database Outage

Database driver:

```text
connection unavailable
```

Application:

```text
unexpected infrastructure failure
```

Public response:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred.",
    "errorId": "err_01...",
    "traceId": "..."
  }
}
```

Internal telemetry:

```text
database connection error
stack trace
request ID
trace ID
release
environment
```

Operational alerting may trigger if the failure rate becomes significant.

---

# Example: Payment Provider Timeout

Provider:

```text
timeout
```

Integration boundary:

```text
PaymentProviderUnavailable
```

Depending on domain semantics, the operation may:

```text
return a retryable error

schedule reconciliation

leave payment state pending

retry safely using idempotency
```

The behavior must be deliberate.

The system must not assume failure means the provider performed no side effect.

---

# Example: Unauthorized Access

Client requests:

```text
GET /admin/users
```

Authenticated actor lacks permission.

Public result:

```text
PERMISSION_DENIED
```

Internal telemetry may record:

```text
actorId
required permission
operation
requestId
```

where permitted.

The response should not expose sensitive administrative implementation details.

---

# Example: Unknown Resource

For a normal public resource:

```text
ORDER_NOT_FOUND
```

may be appropriate.

For a sensitive resource, the system may intentionally return an indistinguishable access result to avoid revealing existence.

Security policy determines the behavior.

---

# Error Handling and AI Agents

The error model should make system behavior understandable to AI agents.

Structured errors are preferable to ambiguous logs.

An agent investigating a production issue should be able to correlate:

```text
error code
    ↓
error documentation
    ↓
trace ID
    ↓
logs
    ↓
source code
    ↓
test coverage
```

This allows AI-assisted investigation to operate from evidence rather than speculation.

---

# Actionable Development Errors

Development-time failures should provide guidance when possible.

For example:

```text
ERROR_CONTRACT_001

Unknown public error code:
ORDER_CANNOT_CANCEL

Use an existing canonical error code or register a new one.

See:
docs/architecture/error-handling.md
```

Tooling errors are part of developer experience.

---

# Canonical Error Registry

As Orion evolves, stable cross-boundary error codes should have a canonical machine-readable registry.

A future registry may define properties such as:

```text
code
owner
description
category
public/private
retryability
HTTP mapping
details schema
```

Possible conceptual representation:

```text
ORDER_ALREADY_SHIPPED
    owner: orders
    category: conflict
    public: true
    retryable: false
```

The exact format should be selected after the application stack is defined.

The registry should become the canonical source for generated error documentation and validation where practical.

---

# Future Mechanical Enforcement

Potential future validation includes:

```text
public error codes must exist in the registry;

duplicate codes are forbidden;

public error responses must follow the canonical schema;

internal stack traces must not be serialized;

unknown error codes fail validation;

client applications consume codes rather than message strings;

generated documentation matches the registry;

prohibited sensitive fields cannot be attached to telemetry.
```

These rules should become automated when practical.

---

# Initial Error Model

Until stack-specific implementation is defined, Orion adopts the following foundational rules:

1. Expected failures must be modeled explicitly.
2. Unexpected failures must be observable.
3. Public consumers must receive stable machine-readable error codes.
4. Human-readable messages must not be used as application contracts.
5. Internal implementation errors must not leak directly across boundaries.
6. Stack traces must not be exposed to untrusted users in production.
7. Correlation identifiers should be preserved where practical.
8. Sensitive information must not be included in public errors or telemetry.
9. Errors should be translated at architectural boundaries.
10. Client applications own user-facing presentation.
11. Stable public error codes are compatibility-sensitive.
12. Unexpected errors should be reported once at an intentional boundary.
13. Retry behavior must be deliberate.
14. Partial failures and side effects must have explicit semantics.
15. Important error behavior must be testable.

---

# Future Documentation

As the architecture evolves, this document may be complemented by:

```text
docs/api/error-contract.md
docs/reliability/logging.md
docs/reliability/tracing.md
docs/reliability/error-reporting.md
docs/reliability/alerting.md
docs/security/data-classification.md
docs/security/telemetry-redaction.md
```

These documents should define implementation-specific policies without duplicating the architectural principles established here.

---

# Summary

Errors are part of application architecture.

Orion distinguishes between:

```text
expected failures
    ↓
explicit semantics and stable contracts

unexpected failures
    ↓
safe public response + internal observability
```

Public consumers depend on:

```text
stable error codes
structured details
correlation identifiers
```

not:

```text
exception class names
database errors
provider errors
stack traces
message strings
```

Errors should become more specific internally and safer externally.

The system should preserve enough information for humans and AI agents to diagnose failures while exposing only what each boundary is allowed to know.

A failure that cannot be understood in production is an observability problem.

A failure that leaks internal details is a security problem.

A failure whose semantics are ambiguous is a contract problem.

Error handling must address all three.
