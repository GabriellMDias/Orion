# API Error Contract

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0007](../adr/0007-establish-api-contract-openapi-sdk-and-configuration-schema-strategy.md). Accepted choices are distinct from implemented tooling.

The current API owns its [machine-readable error registry and public envelope](../../apps/api/src/errors.ts); the [generated error reference](../generated/api/errors.md) lists the implemented codes and HTTP statuses.

## Read for this change

- [Error Envelope](#error-envelope)
- [Error Code Format](#error-code-format)
- [Validation Errors](#validation-errors)
- [Unknown Outcome](#unknown-outcome)
- [Initial API Error Policy](#initial-api-error-policy)

Related policy: [error handling](../architecture/error-handling.md), [error reporting](../reliability/error-reporting.md).

## Purpose

This document defines the public API error contract used by Orion.

Its goals are to ensure that API failures are:

- predictable;
- machine-readable;
- safe;
- stable where compatibility matters;
- useful to human consumers;
- traceable through correlation identifiers;
- independent from internal implementation details;
- compatible with generated clients;
- testable;
- evolvable.

This document turns the architectural error model defined in:

- [docs/architecture/error-handling.md](../architecture/error-handling.md)

into an API-facing contract.

This document is technology-agnostic.

The transport/schema/OpenAPI/SDK strategy is selected by ADR-0004 and ADR-0007. The API runtime owns the [error registry and envelope schema](../../apps/api/src/errors.ts), including Approval Request errors, with a [generated registry reference](../generated/api/errors.md) and [OpenAPI contract](../generated/api/openapi.json). The [generated frontend SDK](../../packages/sdk/src/generated/api-types.ts) preserves the error envelope across the browser boundary.

This document complements:

- [docs/architecture/error-handling.md](../architecture/error-handling.md);
- [docs/api/principles.md](principles.md);
- [docs/security/authentication.md](../security/authentication.md);
- [docs/security/authorization.md](../security/authorization.md);
- [docs/reliability/observability.md](../reliability/observability.md);
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md).

---

## Core Principle

An API error must communicate only what the consumer needs to respond correctly.

The desired separation is:

```text
internal failure
    ↓ classify
public error semantics
    ↓ serialize safely
consumer response
```

The public contract should answer:

```text
What happened?

What stable code describes it?

Can the consumer act on it?

Is retry meaningful?

Which support reference can identify the failure?
```

It should not expose:

```text
stack trace
SQL
provider exception
internal class name
filesystem path
secret
raw infrastructure error
```

---

## Error Envelope

Orion APIs should use a consistent error envelope.

Conceptually:

```text
{
  "error": {
    "code": "ORDER_ALREADY_SHIPPED",
    "message": "The order can no longer be cancelled.",
    "requestId": "req_...",
    "traceId": "trace_...",
    "errorId": "err_..."
  }
}
```

The exact identifiers and optional fields may vary by transport and runtime.

The shape should remain stable once adopted.

---

## Top-Level `error`

A failed API response should expose error information under a clearly identifiable root object.

This keeps failure responses structurally distinct from successful response models.

Prefer:

```text
{
  "error": { ... }
}
```

over inconsistent forms such as:

```text
{
  "message": "...",
  "error": "...",
  "statusCode": ...
}
```

unless a specific transport standard requires otherwise.

---

## Error Code

`code` is the primary machine-readable error identifier.

Example:

```text
ORDER_ALREADY_SHIPPED
```

Consumers may branch on this value.

Therefore error codes are part of the API compatibility contract.

---

## Error Code Format

Public error codes should use stable semantic names.

Preferred conceptual format:

```text
UPPER_SNAKE_CASE
```

Examples:

```text
VALIDATION_FAILED
AUTHENTICATION_REQUIRED
PERMISSION_DENIED
RESOURCE_NOT_FOUND
ORDER_ALREADY_SHIPPED
RATE_LIMITED
INTERNAL_ERROR
```

The exact convention should remain consistent across the API.

---

## Error Codes Describe Semantics

A public error code should describe application or API meaning.

Good:

```text
EMAIL_ALREADY_IN_USE
```

Bad:

```text
SQLSTATE_23505
```

Bad:

```text
PRISMA_P2002
```

Bad:

```text
NULL_POINTER_EXCEPTION
```

Infrastructure-specific error codes must remain internal.

---

## Error Code Ownership

Stable error codes should have identifiable ownership.

For example:

```text
orders
    owns
ORDER_ALREADY_SHIPPED
```

Shared protocol-level codes may belong to cross-cutting infrastructure.

Example:

```text
VALIDATION_FAILED
AUTHENTICATION_REQUIRED
PERMISSION_DENIED
RATE_LIMITED
INTERNAL_ERROR
```

---

## Error Code Registry

Orion should eventually maintain a canonical machine-readable error registry.

A conceptual entry may contain:

```text
code
owner
category
description
public
retryability
default transport mapping
details schema
```

Example:

```text
code: ORDER_ALREADY_SHIPPED
owner: orders
category: domain
public: true
retryable: false
```

The exact format is deferred.

---

## Error Code Uniqueness

Each public error code should have one stable semantic meaning.

Do not reuse:

```text
RESOURCE_CONFLICT
```

for several unrelated conditions if consumers require distinct handling.

Likewise, do not create unnecessary near-duplicates such as:

```text
USER_EMAIL_EXISTS
EMAIL_ALREADY_EXISTS
EMAIL_IN_USE
EMAIL_ALREADY_IN_USE
```

without semantic distinction.

---

## Error Code Stability

Once a public error code has consumers, its meaning should remain stable.

Do not change:

```text
ORDER_ALREADY_SHIPPED
```

from:

```text
order cannot be cancelled because shipment occurred
```

to:

```text
order has any shipping-related state
```

without compatibility analysis.

---

## Human-Readable Message

`message` is intended for human understanding.

Example:

```text
"The order can no longer be cancelled."
```

Consumers must not parse this string for application logic.

---

## Message Is Not a Stable Machine Contract

The text may change because of:

```text
wording improvement
localization
clarity
product tone
```

Machine behavior must use:

```text
code
```

and structured details.

---

## Safe Messages

Public messages must not expose:

```text
credentials
personal data unnecessarily
SQL
filesystem paths
stack traces
provider internals
database schema details
authorization policy internals
```

Messages should be safe for untrusted consumers.

---

## Localization

Stable error codes remain language-independent.

Human-readable messages may eventually be localized.

For example:

```text
ORDER_ALREADY_SHIPPED
```

must remain the same regardless of whether the displayed message is English, Portuguese, or another language.

The localization architecture is deferred.

---

## Request Identifier

A public error may include:

```text
requestId
```

to identify the boundary request associated with the failure.

This can be useful for:

```text
support
log correlation
incident investigation
```

---

## Trace Identifier

A public error may include:

```text
traceId
```

when distributed tracing is available and exposure is considered safe.

The trace identifier should be opaque.

It must not encode sensitive information.

---

## Error Identifier

Unexpected errors may include a dedicated:

```text
errorId
```

that points to the captured error occurrence.

Example:

```text
err_01J...
```

This can serve as a user-facing support reference.

---

## Correlation Identifiers Are Not Secrets

Identifiers such as:

```text
requestId
traceId
errorId
```

should be designed as opaque diagnostic references.

They should not grant access to underlying telemetry merely by possession.

---

## Optional Correlation Fields

Not every error requires every identifier.

For example:

```text
validation error
```

may have:

```text
requestId
traceId
```

but no dedicated error occurrence.

An unexpected internal failure may include all three.

---

## Validation Errors

Validation failures require structured details.

Conceptually:

```text
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid fields.",
    "details": {
      "fields": [
        {
          "field": "email",
          "code": "INVALID_FORMAT",
          "message": "A valid email address is required."
        }
      ]
    }
  }
}
```

The exact schema will be selected with the canonical contract technology.

---

## Validation Error Code

The overall validation failure should use a stable top-level code such as:

```text
VALIDATION_FAILED
```

Field-specific details may expose more precise reason codes.

---

## Field Identifier

Validation details should identify the failing field in a stable form.

Potential representation:

```text
email
```

or:

```text
items[2].quantity
```

The format should be standardized once schema tooling is selected.

---

## Field Error Code

Field validation should prefer machine-readable reason codes.

Examples:

```text
REQUIRED
INVALID_FORMAT
TOO_SHORT
TOO_LONG
OUT_OF_RANGE
INVALID_VALUE
```

These codes should remain generic where possible.

---

## Validation Messages

Field validation messages remain human-readable and non-contractual.

Clients should use:

```text
field
code
```

rather than parsing message text.

---

## Multiple Validation Failures

A request may contain multiple validation failures.

The API may return all useful known issues in one response.

This improves client usability.

Exact behavior may depend on validation tooling.

---

## Validation Detail Bounds

Validation details must remain bounded.

Do not return thousands of field errors for a maliciously large payload.

Payload-size limits and validation limits should prevent abuse.

---

## Unknown Fields

If unknown input fields are rejected, the validation contract may represent that using a stable field-level error.

Example:

```text
UNKNOWN_FIELD
```

The exact semantics should follow the API contract.

---

## Domain Errors

Expected business failures should use semantic codes.

Examples:

```text
ORDER_ALREADY_SHIPPED
INSUFFICIENT_INVENTORY
INVITATION_EXPIRED
SUBSCRIPTION_ALREADY_CANCELLED
```

These are expected application outcomes.

They should not normally produce internal incident-level error reporting.

---

## Domain Error Details

Domain errors may expose structured details when consumers genuinely need them.

Example:

```text
{
  "code": "INSUFFICIENT_INVENTORY",
  "details": {
    "available": 3
  }
}
```

Only safe data should be included.

Avoid exposing internal state merely because it exists.

---

## Authentication Errors

Authentication-related errors may include semantic codes such as:

```text
AUTHENTICATION_REQUIRED
INVALID_CREDENTIALS
SESSION_EXPIRED
SESSION_REVOKED
```

The exact public distinction depends on information-disclosure requirements.

---

## Authentication Privacy

Public login flows may intentionally return the same error code for:

```text
unknown account
wrong password
```

to reduce account enumeration.

Internal telemetry may preserve safe diagnostic distinctions.

---

## Authorization Errors

Authorization failures may expose:

```text
PERMISSION_DENIED
```

or:

```text
RESOURCE_NOT_FOUND
```

depending on whether revealing resource existence is safe.

The public contract must not expose internal policy evaluation details.

---

## Not Found Errors

A canonical not-found error may use:

```text
RESOURCE_NOT_FOUND
```

when the consumer does not require a resource-specific code.

Domain-specific not-found errors may be appropriate where consumers need them.

Example:

```text
ORDER_NOT_FOUND
```

Avoid unnecessary code proliferation.

---

## Conflict Errors

Conflicts represent valid requests that cannot be completed because of current state.

Examples include:

```text
RESOURCE_VERSION_CONFLICT
EMAIL_ALREADY_IN_USE
IDEMPOTENCY_KEY_REUSED
ORDER_ALREADY_SHIPPED
```

These are distinct from invalid request syntax.

---

## Concurrency Conflicts

Optimistic concurrency failures should have stable semantics.

Example:

```text
RESOURCE_VERSION_CONFLICT
```

Consumers may respond by:

```text
reload
merge
ask user to retry
```

---

## Duplicate Operations

Duplicate or already-processed operations may return domain-specific conflict semantics.

Examples:

```text
ALREADY_PROCESSED
PAYMENT_ALREADY_CAPTURED
INVITATION_ALREADY_ACCEPTED
```

The API should distinguish safe replay from conflicting new intent.

---

## Idempotency Errors

Possible idempotency errors may include:

```text
IDEMPOTENCY_KEY_REUSED
IDEMPOTENCY_CONFLICT
```

when the same key is reused with incompatible request content.

Exact semantics depend on the API idempotency design.

---

## Rate Limiting

Rate-limited operations should expose a stable code such as:

```text
RATE_LIMITED
```

The response may include retry metadata.

---

## Retry-After

For transports that support it, rate-limit responses may expose a protocol-level retry indication such as:

```text
Retry-After
```

or equivalent structured information.

The exact format should follow protocol standards.

---

## Rate-Limit Details

Consumers may need:

```text
retryAfterSeconds
```

or equivalent.

Avoid exposing internal anti-abuse algorithms, thresholds, or detection logic.

---

## External Dependency Errors

Provider failures must be translated before crossing the API boundary.

Example:

```text
payment provider timeout
    ↓
PAYMENT_PROVIDER_UNAVAILABLE
```

or a more general stable semantic error.

Do not expose:

```text
StripeError
AWS SDK exception
SMTP server text
```

directly.

---

## Provider Declines

An expected external business response such as a payment decline may map to a stable public business error.

It should not be treated the same as:

```text
provider unavailable
```

Operational failure and business rejection are distinct.

---

## Infrastructure Errors

Unexpected database, network, storage, or runtime failures should normally map to a safe generic internal error.

Example:

```text
INTERNAL_ERROR
```

or an appropriately stable dependency-unavailable code where consumers can act meaningfully.

---

## Generic Internal Error

A generic unexpected failure may look conceptually like:

```text
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred.",
    "requestId": "req_...",
    "traceId": "trace_...",
    "errorId": "err_..."
  }
}
```

No internal cause should be exposed.

---

## Service Unavailable

Temporary service-level unavailability may use a semantic code such as:

```text
SERVICE_UNAVAILABLE
```

when useful.

Consumers may retry only when the operation semantics make retry safe.

---

## Dependency Unavailable

A public dependency-unavailable error should be introduced only if consumers need to distinguish it from generic service failure.

Avoid exposing the actual vendor unnecessarily.

For example:

```text
PAYMENT_SERVICE_UNAVAILABLE
```

may be appropriate.

```text
STRIPE_US_EAST_2_TIMEOUT
```

is probably not.

---

## Timeout Errors

Timeouts require careful semantics.

A timeout may mean:

```text
operation definitely did not happen
```

or:

```text
outcome is unknown
```

The public contract should distinguish these situations where retry safety depends on them.

---

## Unknown Outcome

For operations where the backend cannot determine whether an external side effect occurred, the error contract may require a semantic representation of uncertain outcome.

This should be introduced only for domains where the consumer must react differently.

Example concept:

```text
OPERATION_OUTCOME_UNKNOWN
```

Such errors require idempotency or reconciliation guidance.

---

## Retryability

Retryability should not be inferred solely from HTTP status code.

A public error may eventually expose:

```text
retryable
```

or structured retry metadata if consumers need this information.

Whether retryability belongs directly in the error envelope is intentionally deferred.

---

## Retryable Is Contextual

Even when a dependency failure is transient, repeating the operation may be unsafe.

For example:

```text
payment request timed out
```

does not imply:

```text
blind retry is safe
```

unless idempotency protects the operation.

---

## Retry Metadata

If retry information is exposed, it should be machine-readable.

Conceptual example:

```text
"retry": {
  "allowed": true,
  "afterSeconds": 10
}
```

The exact schema is deferred.

---

## Details Object

`details` may contain structured information specific to the error code.

Example:

```text
{
  "error": {
    "code": "RESOURCE_VERSION_CONFLICT",
    "details": {
      "expectedVersion": 7,
      "currentVersion": 8
    }
  }
}
```

Only include information consumers actually need.

---

## Details Must Have Schema

Avoid:

```text
details: arbitrary object
```

without contract.

For every public error exposing details, the shape should be defined.

---

## Details and Compatibility

Once consumers depend on a details field, that structure becomes part of the compatibility contract.

Changes require the same care as response-schema changes.

---

## Details Must Be Safe

Structured details must not expose:

```text
internal record dump
authorization policy
stack trace
raw provider response
credentials
hidden tenant information
```

---

## Metadata

Some errors may require cross-cutting metadata.

Potential examples:

```text
requestId
traceId
errorId
retry
```

Keep cross-cutting fields separate from domain-specific `details`.

---

## HTTP Status Mapping

For HTTP APIs, transport status should represent broad error category.

A conceptual default mapping may be:

| Error category                     |                            Typical HTTP status |
| ---------------------------------- | ---------------------------------------------: |
| Validation                         |                              `400 Bad Request` |
| Authentication required or invalid |                             `401 Unauthorized` |
| Authorization denied               |                                `403 Forbidden` |
| Not found                          |                                `404 Not Found` |
| State or version conflict          |                                 `409 Conflict` |
| Rate limit                         |                        `429 Too Many Requests` |
| Unexpected internal failure        |                    `500 Internal Server Error` |
| Upstream/dependency failure        | `502 Bad Gateway` or `503 Service Unavailable` |

This table provides guidance.

Domain semantics remain in the error code.

---

## Status Codes Are Coarse

Several distinct errors may map to the same HTTP status.

For example:

```text
EMAIL_ALREADY_IN_USE
RESOURCE_VERSION_CONFLICT
ORDER_ALREADY_SHIPPED
```

may all reasonably use:

```text
409
```

Consumers requiring semantic distinction should inspect the error code.

---

## 400 vs 422

Some API ecosystems use:

```text
400
```

for request validation.

Others use:

```text
422
```

for semantically invalid input.

Orion does not choose between these before the concrete HTTP contract is selected.

The important requirement is consistency.

---

## 401 and 403

For HTTP:

```text
401
```

typically represents missing or invalid authentication.

```text
403
```

typically represents an authenticated actor lacking permission.

Information-disclosure requirements may modify external behavior.

---

## 404 for Hidden Resources

A protected resource may intentionally map authorization failure to:

```text
404
```

when revealing existence would be unsafe.

This should be deliberate and tested.

---

## 409 Conflict

`409` is appropriate for state conflicts where the request is structurally valid but cannot be applied to current state.

Examples:

```text
duplicate unique business value
stale resource version
operation already completed
```

---

## 429 Rate Limit

A rate-limited consumer should receive:

```text
429
```

for HTTP APIs where appropriate.

Retry guidance may accompany the response.

---

## 5xx Errors

Unexpected internal or dependency failures should generally use `5xx`.

Expected business failures should not become `500` merely because they are represented by exceptions internally.

---

## HTTP Status Is Not Internal Severity

A `4xx` response can still be security-relevant.

A `5xx` response may be a routine dependency incident.

Transport category and operational severity are separate concerns.

---

## Protocol Independence

The semantic error registry should not be inherently tied to HTTP.

For example:

```text
ORDER_ALREADY_SHIPPED
```

can remain meaningful across:

```text
HTTP
RPC
CLI
message-based request/reply
```

Transport adapters may map the semantic error appropriately.

---

## Error Construction

Application code should create or return semantic failures.

Transport adapters should serialize them into the public contract.

Conceptually:

```text
domain/application error
        ↓
transport mapper
        ↓
HTTP status + public error envelope
```

---

## Error Mapping Ownership

Mapping should occur at intentional boundaries.

Examples:

```text
database uniqueness violation
    ↓ persistence/application translation
EMAIL_ALREADY_IN_USE
    ↓ transport mapping
409
```

Each layer should remove implementation-specific detail.

---

## Raw Exception Serialization

Never serialize arbitrary exceptions directly.

Prohibited:

```text
return {
  error: exception
}
```

This may expose:

```text
stack
cause
SQL
request data
provider metadata
credentials
```

---

## Cause Preservation

The public response removes internal detail.

Internal diagnostics should preserve the original cause chain where useful.

Public safety must not require destroying diagnostic evidence internally.

---

## Report Once

Unexpected errors should normally be reported once at the authoritative error boundary.

Avoid:

```text
repository logs error
service logs same error
controller logs same error
global handler logs same error
```

unless each event has distinct operational meaning.

---

## Expected Errors and Reporting

Expected validation, business, authentication, and authorization failures should not automatically be sent to centralized error tracking as unexpected incidents.

They may still contribute to:

```text
metrics
security telemetry
audit events
```

where appropriate.

---

## Error Severity

Operational severity should remain separate from public error semantics.

For example:

```text
PAYMENT_PROVIDER_UNAVAILABLE
```

may become a high-severity operational incident.

```text
PERMISSION_DENIED
```

may be normal expected behavior.

Both are public errors.

---

## Error Telemetry

Safe error telemetry may include:

```text
error code
category
operation
requestId
traceId
errorId
service
release
```

It must follow:

- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

---

## Public Error Body Must Not Be Telemetry Dump

Do not expose diagnostic fields merely because they exist internally.

The consumer error contract and telemetry model are different surfaces.

---

## Error IDs and Support

A support experience may ask the user for:

```text
errorId
```

or:

```text
requestId
```

Support tooling can use the identifier to locate sanitized internal diagnostics according to access policy.

---

## No Security Through Error ID Secrecy

Diagnostic identifiers should not be treated as credentials.

A user knowing an `errorId` must not automatically gain access to internal telemetry.

---

## Validation Path Privacy

Validation field paths should expose only public request-schema fields.

They must not reference:

```text
internal database column
backend property
ORM path
```

unless those names are intentionally public.

---

## Resource Identifiers in Errors

A public error should not echo sensitive resource identifiers unnecessarily.

The caller may already know the requested identifier.

Repeating it provides little value and may increase telemetry or UI exposure.

---

## Tenant Information

Error details must not reveal another tenant's:

```text
name
identifier
resource existence
permission state
```

when authorization prevents access.

---

## Security Errors

Security-sensitive failures should prioritize safe disclosure over detailed debugging.

Potential examples include:

```text
INVALID_CREDENTIALS
PERMISSION_DENIED
INVALID_WEBHOOK_SIGNATURE
```

Detailed causes belong in trusted diagnostics.

---

## Webhook Errors

Inbound webhook endpoints may expose minimal error responses according to provider requirements.

They should not reveal signature-validation internals.

---

## File Upload Errors

File APIs may expose structured failures such as:

```text
FILE_TOO_LARGE
UNSUPPORTED_MEDIA_TYPE
UPLOAD_FAILED
```

Security-scanning failures may require careful wording to avoid revealing internal detection details.

---

## Asynchronous Operation Errors

Long-running operations may fail after the initiating HTTP request has already succeeded.

Their error state should use the same stable semantic model where practical.

Example:

```text
{
  "status": "failed",
  "error": {
    "code": "REPORT_GENERATION_FAILED",
    ...
  }
}
```

---

## Background Job Errors

Internal jobs may use richer diagnostic failure models than public APIs.

If job failure becomes externally visible, map it to an appropriate public error contract.

Do not expose worker exception objects directly.

---

## Partial Success

Batch or multi-item operations may produce partial success.

If supported, the contract must define it explicitly.

Do not overload the ordinary single-error envelope ambiguously.

Potential design:

```text
items:
  - success
  - error
```

or an operation-specific result schema.

---

## Batch Errors

Batch APIs should identify which item failed without exposing unnecessary internal state.

The behavior should define whether processing is:

```text
atomic
best effort
all-or-nothing
partial
```

before designing error output.

---

## Error Compatibility

The following are compatibility-sensitive:

```text
error code
error category
status mapping when consumers depend on it
details schema
retry semantics
```

Changing any of these may break consumers.

---

## Adding Error Codes

Adding a new error code may be compatible when clients handle unknown codes gracefully.

However, clients using exhaustive generated enums may break.

SDK and enum strategy should account for this.

---

## Removing Error Codes

Removing or merging a public error code may break consumers.

The change should follow API compatibility policy.

---

## Renaming Error Codes

Renaming a public error code is generally breaking.

Prefer preserving the stable code and changing human-readable descriptions when semantics remain the same.

---

## Reusing Retired Codes

A retired error code should not later be reused for a different meaning.

Stable identifiers should remain semantically unique over their lifetime.

---

## Changing Status Mapping

Changing:

```text
409
```

to:

```text
400
```

may affect consumer retry, UI, and SDK logic.

Treat status mapping changes as contract changes where consumers rely on them.

---

## Details Evolution

Adding optional fields to `details` may be compatible.

Removing, renaming, or changing semantics of existing fields may be breaking.

Exact compatibility depends on serialization and client behavior.

---

## Unknown Error Codes

Clients should have a safe fallback for unknown public error codes.

Generated SDKs should not crash merely because the server introduced an additive error code.

A fallback such as:

```text
unknown API error
```

should preserve correlation information.

---

## Client Error Handling

Clients should broadly classify errors using stable contract semantics.

Potential handling groups include:

```text
validation
authentication
authorization
business conflict
rate limit
temporary service failure
unexpected failure
```

Exact UI behavior belongs to the client application.

---

## Client Message Display

Clients should not automatically display every backend `message` verbatim without considering:

```text
localization
product tone
context
security
```

Some messages may be appropriate directly.

Others may map to client-controlled copy.

---

## SDK Error Types

Generated or shared SDKs may expose structured error types.

Conceptually:

```text
ApiError {
    code
    message
    details
    requestId
    traceId
    errorId
}
```

The exact implementation is deferred.

---

## SDK Must Preserve Unknown Errors

An SDK should preserve unrecognized error codes and raw safe structured fields rather than discarding them.

This improves forward compatibility.

---

## SDK Must Not Expose Transport Internals as Primary Semantics

Consumers should not need to catch framework-specific errors such as:

```text
AxiosError
FetchError
GrpcStatusException
```

for application semantics.

An SDK may preserve transport cause internally while exposing the Orion error model.

---

## Documentation

Every public error code should eventually have generated documentation.

Potential fields include:

```text
code
description
category
HTTP status
retryability
details schema
owner
```

---

## Error Documentation Source

Generated error documentation should derive from the canonical error registry and contract schemas.

Do not maintain a separate manually synchronized list.

---

## Error Examples

Documentation examples must use synthetic data.

Examples should demonstrate:

```text
validation error
authentication error
domain conflict
unexpected error
rate limit
```

where useful.

---

## OpenAPI Representation

If OpenAPI is selected, error schemas and documented operation errors should derive from or align with the canonical registry.

Do not manually duplicate error definitions operation by operation when tooling can reuse shared schemas.

---

## Operation Error Declarations

Each API operation should eventually make expected public errors discoverable.

Conceptually:

```text
orders.cancel
    errors:
      - ORDER_NOT_FOUND
      - ORDER_ALREADY_SHIPPED
      - PERMISSION_DENIED
```

This can support:

```text
documentation
testing
SDK generation
AI reasoning
```

The exact metadata format is deferred.

---

## Error Registry Does Not Mean Every Runtime Error Is Enumerated

The registry should contain stable semantic errors.

It should not attempt to enumerate every:

```text
database exception
network exception
library error
runtime exception
```

These are translated into the stable semantic model.

---

## Testing

Error-contract behavior should be tested according to:

- [docs/architecture/testing-strategy.md](../architecture/testing-strategy.md)

---

## Contract Tests

Tests should verify the canonical error envelope.

For example:

```text
error.code exists
message is string
details matches code schema
correlation identifiers have correct format
```

---

## Validation Tests

Validation tests should verify:

```text
top-level VALIDATION_FAILED
field paths
field reason codes
no internal schema leakage
```

---

## Domain Error Tests

Domain operations exposed through APIs should verify that expected application errors map to stable public codes.

---

## Authentication Error Tests

Tests should verify safe semantics for:

```text
missing credentials
invalid credentials
expired credentials
revoked session
```

according to the authentication design.

---

## Authorization Error Tests

Tests should verify:

```text
denied operation
hidden resource existence
cross-tenant access
```

through the transport boundary.

---

## Internal Error Tests

Unexpected failure tests should verify that the public response does not expose:

```text
stack
SQL
secret
provider exception
internal path
```

while internal observability receives sufficient diagnostic context.

---

## Redaction Tests

Tests should assert that error serialization never includes restricted data.

This is especially important when exception objects or validation libraries retain original input.

---

## Retry Metadata Tests

If retry metadata is introduced, tests should verify that only genuinely retryable public errors expose it.

---

## Compatibility Tests

Stable error codes and detail schemas should participate in API compatibility testing when consumers depend on them.

---

## Generated Registry Validation

CI should eventually verify that:

```text
all public error codes are registered
registered codes are unique
details schemas are valid
operation declarations reference known codes
documentation is current
```

---

## Static Analysis

Future tooling may detect:

```text
raw exception serialized publicly
unknown error code
duplicate error code
database error returned directly
provider exception returned directly
```

where the selected language permits reliable analysis.

---

## AI Agent Requirements

Before introducing a new public error, an AI agent should inspect:

```text
existing error registry
similar domain errors
ownership
public/private distinction
status mapping
retry semantics
details schema
consumer requirements
```

---

## AI Should Reuse Existing Errors

An AI agent should not create a new error code merely because a new code path was added.

If an existing semantic error already represents the condition, reuse it.

---

## AI and Internal Errors

An AI agent must not expose internal exception names or messages as public API contracts.

---

## AI and Database Errors

A database constraint failure should be translated according to its semantic meaning.

For example:

```text
users_email_unique
```

may translate to:

```text
EMAIL_ALREADY_IN_USE
```

It must not escape as raw SQL or ORM metadata.

---

## AI and Provider Errors

Provider-specific failures must be translated before crossing the API boundary.

An AI agent should identify whether the provider response represents:

```text
business rejection
temporary dependency failure
configuration failure
unexpected failure
```

rather than mapping all provider exceptions identically.

---

## AI and Information Disclosure

When deciding between:

```text
PERMISSION_DENIED
RESOURCE_NOT_FOUND
```

an AI agent should inspect existing authorization and information-disclosure policy.

It must not choose based solely on convenience.

---

## AI and Error Tests

New or changed public error semantics should include tests at the relevant layer.

Bug fixes involving incorrect errors should add regression tests whenever practical.

---

## New Public Error Checklist

Before introducing a new public error code, answer:

1. What semantic condition does it represent?
2. Which domain owns it?
3. Is the condition expected or unexpected?
4. Does an existing error code already represent it?
5. Is it safe to expose publicly?
6. Which HTTP or transport status should represent it?
7. Is it retryable?
8. Does it require structured details?
9. What is the details schema?
10. Could the error reveal protected resource existence?
11. Which consumers need to distinguish it?
12. How will it be tested?
13. How will it be documented?
14. What compatibility implications exist?

If these questions cannot be answered, the public error is not ready.

---

## New Error Details Checklist

Before adding structured error details, answer:

1. Why does the consumer need this information?
2. Is every field safe to expose?
3. Does the detail duplicate information already available?
4. Is the shape explicit and typed?
5. Can the field become sensitive in another context?
6. Is the structure stable enough to become a contract?
7. How will unknown or missing detail fields be handled?
8. How will the schema be tested?

---

## Error Mapping Checklist

When translating an internal failure, answer:

1. What failed internally?
2. Is the failure expected?
3. What semantic condition should the consumer know?
4. Which implementation details must remain private?
5. Is retry safe?
6. Is the outcome known?
7. Which status should the transport use?
8. Should the failure be reported to error tracking?
9. Which correlation identifiers should be returned?
10. What test proves the mapping?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Parsing Error Messages

Client logic based on:

```text
message.includes("already exists")
```

Prohibited.

---

### Raw Exception Response

Prohibited.

---

### ORM Error Code as Public Contract

Prohibited.

---

### SQLSTATE as Public Contract

Prohibited.

---

### Provider Exception as Public Contract

Prohibited.

---

### Stack Trace in Response

Prohibited.

---

### Arbitrary `details`

Avoid.

Details require schema.

---

### One Generic Error for Every Expected Failure

Avoid when consumers need semantic distinctions.

---

### Unique Error Code for Every Code Path

Avoid.

Codes represent semantics, not implementation locations.

---

### Reusing Error Code With New Meaning

Prohibited.

---

### Sensitive Value in Error Message

Prohibited.

---

### Returning Authorization Internals

Prohibited.

---

### Treating All Exceptions as `500`

Avoid.

Expected business failures require semantic translation.

---

### Treating All Dependency Failures as Retryable

Avoid.

---

### HTTP Status as Only Error Contract

Avoid.

Status codes are too coarse for many application semantics.

---

### `200 OK` With Hidden Error Object

Avoid for ordinary API failure semantics unless a protocol specifically requires it.

---

### Different Error Envelope per Endpoint

Avoid.

---

### Full Input Echo on Validation Failure

Avoid.

It may expose sensitive data.

---

## Initial API Error Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Public API errors must use a consistent structured envelope.
2. Every public error must expose a stable machine-readable code.
3. Consumers must not parse human-readable messages for application logic.
4. Public error codes must describe semantic conditions rather than infrastructure implementation.
5. Internal database, ORM, provider, and runtime error codes must not escape directly.
6. Validation errors should provide structured field-level details where useful.
7. Public error details must have explicit schemas.
8. Unexpected internal failures must return safe generic public semantics.
9. Stack traces, SQL, credentials, and internal exception details must never appear in public errors.
10. Authentication and authorization failures must respect information-disclosure policy.
11. HTTP status codes should represent broad transport semantics; error codes provide application semantics.
12. Retryability must not be inferred solely from status code.
13. Unknown outcomes must be distinguished where retry safety depends on them.
14. Correlation identifiers may be exposed when safe and operationally useful.
15. Expected business failures should not automatically be reported as internal incidents.
16. Public error codes and details are compatibility-sensitive contracts.
17. Generated SDKs must preserve structured Orion error semantics.
18. Public errors should eventually derive from a canonical machine-readable registry.
19. API operations should eventually declare their expected stable public errors.
20. Error-contract rules should become mechanically validated where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
canonical error registry format
HTTP validation status convention
error identifier format
request identifier format
trace identifier exposure
retry metadata schema
SDK error type
OpenAPI error generation
operation-error declaration format
localization strategy
```

These choices should follow the selected API framework, schema system, observability stack, and client-generation strategy.

Significant choices should be captured through ADRs.

---

## Future Documentation

This document should be complemented by:

- [docs/api/versioning.md](versioning.md)
- [docs/architecture/versioning-and-compatibility.md](../architecture/versioning-and-compatibility.md)
- [docs/reliability/error-reporting.md](../reliability/error-reporting.md)
- [docs/reliability/logging.md](../reliability/logging.md)
- [docs/security/incident-response.md](../security/incident-response.md)

Implementation-specific error documentation should derive from the canonical error registry rather than duplicating it manually.

---

## Summary

The public error contract exists to expose stable semantics without exposing internal implementation.

The intended model is:

```text
internal failure
    ↓
classification
    ↓
stable semantic error
    ↓
safe transport mapping
    ↓
consumer
```

Orion prefers:

```text
stable codes over message parsing

semantic errors over infrastructure exceptions

structured details over arbitrary payloads

safe correlation over exposed diagnostics

explicit retry semantics over blind retries

generic internal failure over stack leakage

canonical registry over duplicated error lists
```

A consumer should be able to understand what happened without knowing which ORM, database, provider, or framework produced the underlying failure.

A support engineer should be able to correlate the public failure with internal evidence.

An internal exception should remain useful for diagnostics without becoming part of the public contract.

The API error model should make all three possible at the same time.
