# Authentication

[Documentation index](../README.md) · [Validation availability](../validation.md)

## Read for this change

- [Authentication Boundary](#authentication-boundary)
- [Password Storage](#password-storage)
- [Sessions](#sessions)
- [Authentication Integration Tests](#authentication-integration-tests)
- [New Authentication Mechanism Checklist](#new-authentication-mechanism-checklist)

## Purpose

This document defines the authentication architecture and security principles used by Orion.

Its goals are to ensure that identity is:

- established explicitly;
- verified at trusted boundaries;
- represented consistently;
- isolated from authorization concerns;
- resistant to credential leakage;
- observable without exposing secrets;
- compatible with multiple application types;
- adaptable to future identity providers;
- testable;
- suitable for both human and machine identities.

This document is technology-agnostic.

Specific identity providers, authentication libraries, token formats, session stores, cryptographic mechanisms, and platform integrations will be selected later through explicit architectural decisions.

This document complements:

- [docs/security/secrets-management.md](secrets-management.md);
- [docs/security/data-classification.md](data-classification.md);
- [docs/security/telemetry-redaction.md](telemetry-redaction.md);
- [docs/architecture/application-boundaries.md](../architecture/application-boundaries.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md);
- [docs/architecture/configuration.md](../architecture/configuration.md).

---

## Core Principle

Authentication answers:

```text
Who is this actor?
```

Authentication does not answer:

```text
What is this actor allowed to do?
```

That is authorization.

Orion must keep these concerns separate.

The desired flow is:

```text
credentials or identity proof
        ↓
trusted verification boundary
        ↓
authenticated identity
        ↓
authorization
        ↓
application operation
```

A client claiming an identity is not equivalent to a trusted backend verifying that identity.

---

## Actors

An actor is an entity that may perform an operation.

Potential actors include:

```text
human user
administrator
service
background worker
CLI tool
CI system
external integration
automation
AI agent
```

Authentication mechanisms may differ between actor types.

The resulting identity model should remain explicit.

---

## Human Identities

Human identities represent real users.

Authentication may eventually use mechanisms such as:

```text
email and password
passkeys
single sign-on
OAuth/OIDC
magic links
multi-factor authentication
```

No specific mechanism is required by this document.

The mechanism must provide sufficient assurance for the risk of the protected capability.

---

## Machine Identities

Machine-to-machine operations should use machine identities.

Examples include:

```text
API service
worker
CI deployment
scheduled job
external integration
```

Machine identities should not impersonate human users merely because reusing a human authentication path is convenient.

Prefer distinct identities with explicit capabilities.

---

## AI Agent Identity

If an AI agent performs operations on behalf of a user or system, the system should preserve the relevant identity relationships.

Potentially important context includes:

```text
human principal
agent identity
delegated capability
operation
```

An AI agent should not silently become an unrestricted system identity.

Delegated actions should remain attributable where practical.

---

## Principal

A principal is the authenticated identity used by trusted application code.

A principal may conceptually contain:

```text
subjectId
actorType
authenticationMethod
tenantId
sessionId
authenticationTime
assuranceLevel
```

The exact representation will depend on the selected stack.

It must not include arbitrary unverified client claims.

---

## Authentication Boundary

Authentication must occur at a trusted boundary.

Examples include:

```text
browser
    ↓ untrusted request
API
    ↓ verifies credentials
authenticated principal
```

or:

```text
external service
    ↓ signed webhook
API
    ↓ verifies signature
authenticated integration
```

The application must not treat externally supplied identity fields as authoritative without verification.

---

## Client Applications Are Untrusted

Web, mobile, and desktop applications should be treated as untrusted clients from the backend perspective.

A client may send:

```text
userId
role
tenantId
email
permission
```

but these values must not automatically be trusted.

Identity must derive from verified authentication state.

---

## Identity Claims

Authentication systems may produce claims.

Claims should be classified into:

```text
verified identity claims
application-derived claims
untrusted client claims
```

Only trusted claims may participate in security decisions.

The source and validation of important claims must be explicit.

---

## Subject Identifier

Each authenticated identity should have a stable subject identifier.

Prefer opaque identifiers that do not encode sensitive information.

Example:

```text
usr_01...
```

The subject identifier should remain stable enough for:

```text
authorization
audit
session management
telemetry correlation
```

according to product requirements.

---

## Public Identity vs Authentication Identity

A user-facing profile identifier may differ from the authentication subject.

For example:

```text
username
email
display name
```

may change over time.

Authentication should not depend unnecessarily on mutable presentation fields.

---

## Email Addresses

An email address may be used as an authentication identifier.

It remains personal data and should generally be treated as `CONFIDENTIAL`.

The system should avoid using email addresses as internal identity keys where stable opaque identifiers are more appropriate.

---

## Authentication Factors

Authentication factors may include:

```text
something the user knows
something the user has
something the user is
```

The required factor strength depends on security risk.

Orion should not force multi-factor authentication into every future application by default.

It should preserve an architecture capable of supporting stronger authentication where needed.

---

## Password Authentication

If passwords are supported, they must never be stored in plaintext.

Applications should use established password-hashing mechanisms suitable for password storage.

Do not implement custom password hashing.

Password policy should balance:

```text
security
usability
current industry practice
```

The exact password-hashing algorithm and parameters should be selected with the authentication stack.

---

## Password Storage

Password hashes are classified as `RESTRICTED`.

They must not appear in:

```text
logs
traces
error reports
API responses
support tools
AI prompts
```

Access should be limited to authentication infrastructure that requires them.

---

## Password Comparison

Password verification should be performed only through the approved password-hashing implementation.

Application code should never attempt plaintext comparison.

---

## Password Reset

Password reset is an authentication-sensitive workflow.

A reset mechanism should use:

```text
short-lived
single-purpose
high-entropy
```

credentials or equivalent trusted mechanisms.

Reset credentials are `RESTRICTED`.

They must not appear in telemetry.

---

## Password Reset Responses

Password-reset initiation should avoid unnecessary account enumeration.

For example, a public flow may return an equivalent response whether or not the provided identity exists.

Exact behavior depends on product requirements and threat model.

---

## Password Change

Sensitive credential changes should require sufficient identity assurance.

Depending on product requirements, this may involve:

```text
current password verification
recent authentication
multi-factor verification
session confirmation
```

The mechanism should match the risk.

---

## Credential Enumeration

Authentication interfaces should avoid revealing whether an account exists when that information provides attackers with unnecessary value.

This consideration applies to:

```text
login
password reset
account recovery
registration
```

The correct behavior may differ by product.

It should be intentional.

---

## Rate Limiting

Authentication endpoints are common abuse targets.

They may require controls such as:

```text
rate limiting
progressive delays
bot mitigation
account protection
IP or device heuristics
```

These mechanisms should not accidentally create denial-of-service vulnerabilities against legitimate users.

Exact anti-abuse strategy should be defined later if required.

---

## Brute-Force Protection

Repeated credential failures should become detectable.

Potential responses may include:

```text
rate limiting
temporary challenge
temporary lock
additional verification
security alert
```

Permanent lockout based solely on attacker-controlled attempts may be dangerous.

---

## Multi-Factor Authentication

If MFA is introduced, the system should distinguish:

```text
authenticated
```

from:

```text
authenticated with stronger assurance
```

Some operations may require higher assurance than ordinary application access.

Authentication assurance should remain explicit where relevant.

---

## Step-Up Authentication

Sensitive operations may require recent or stronger authentication.

Examples may include:

```text
changing credentials
viewing recovery codes
financial operation
administrative action
changing security settings
```

This can be represented as step-up authentication.

Authorization alone may not be sufficient when the current session is old or low-assurance.

---

## Recent Authentication

Some security-sensitive actions may require proof that authentication occurred recently.

A long-lived authenticated session does not necessarily provide sufficient assurance for every operation.

The exact definition of "recent" should be based on risk.

---

## Passkeys and Passwordless Authentication

Future Orion applications may support passwordless mechanisms such as passkeys.

The architecture should not assume that every authenticated user possesses a password.

Authentication code should depend on identity semantics rather than password-specific assumptions.

---

## External Identity Providers

Orion may delegate authentication to external identity providers.

Examples may include:

```text
enterprise SSO
OIDC providers
OAuth providers
social identity providers
```

External authentication creates a trust boundary.

The application must validate provider assertions according to the chosen protocol.

---

## External Claims

Claims received from an identity provider must not automatically become internal authorization data.

For example:

```text
provider role
provider group
provider tenant
```

should be mapped deliberately before affecting application permissions.

---

## Identity Linking

If multiple authentication methods may refer to the same user, identity linking requires careful design.

Avoid relying only on matching mutable attributes such as email unless the provider guarantees and verifies the semantics required.

Incorrect account linking can become an account takeover vulnerability.

---

## Identity Provider Availability

External identity providers create runtime dependencies.

Authentication architecture should consider:

```text
provider outage
token verification availability
key rotation
clock skew
metadata availability
```

Where possible, verification should avoid unnecessary synchronous dependency on the provider for every request.

---

## Sessions

A session represents authenticated continuity across requests or application interactions.

A session is not the same as a user.

One user may have multiple sessions.

Sessions may differ by:

```text
device
application
authentication method
creation time
assurance level
```

---

## Session Identifier

Session identifiers are credentials when possession grants access.

They are therefore `RESTRICTED`.

They must be:

```text
unguessable
protected in transit
protected at rest where applicable
redacted from telemetry
```

---

## Session Storage

Session architecture may be:

```text
server-side
token-based
hybrid
```

This document does not choose one.

The selected design must support:

```text
revocation requirements
expiration
security
multi-device behavior
operational needs
```

---

## Session Expiration

Sessions should have explicit expiration semantics.

Potential mechanisms include:

```text
absolute expiration
idle expiration
credential expiration
refresh expiration
```

The correct values depend on product risk and user experience.

Unlimited sessions should not emerge accidentally.

---

## Session Revocation

Important sessions should be revocable when product requirements demand it.

Possible triggers include:

```text
logout
password change
account compromise
administrator action
user request
security-policy change
```

The architecture must define what revocation means for the chosen session model.

---

## Global Logout

If product requirements include "log out everywhere", the session architecture must support invalidating all relevant sessions.

This requirement should not be assumed possible after choosing a session mechanism that makes global revocation difficult.

---

## Logout

Logout should invalidate or remove the relevant authentication capability according to the session model.

Deleting a client-side UI state alone is not sufficient when server-side session material remains valid.

---

## Session Fixation

Authentication workflows must prevent attackers from forcing users to authenticate into attacker-controlled session identities.

Where session identifiers exist before authentication, they may need regeneration after successful authentication.

---

## Session Rotation

Session identifiers may need rotation after:

```text
authentication
privilege elevation
security-sensitive changes
```

The exact mechanism depends on session architecture.

---

## Cookies

If browser authentication uses cookies, security-sensitive cookies should use appropriate platform protections.

Potential properties include:

```text
Secure
HttpOnly
SameSite
appropriate scope
```

Exact configuration should be determined from application architecture.

---

## Cookie Scope

Authentication cookies should be scoped as narrowly as practical.

Avoid granting credentials to unrelated:

```text
domains
subdomains
paths
```

without need.

---

## Cross-Site Request Forgery

Cookie-based authentication may introduce CSRF considerations because browsers attach cookies automatically.

If applicable, the authentication and API architecture must include an explicit CSRF defense.

The exact mechanism depends on client architecture and browser behavior.

---

## Cross-Site Scripting

XSS can compromise browser authentication state and user actions.

Authentication architecture must not assume that token storage alone solves browser security.

Client-side security and Content Security Policy may become relevant in web-specific documentation later.

---

## Tokens

Tokens may represent authentication, authorization, session state, or delegated capability.

The word `token` alone does not define semantics.

Every token type should have a clear purpose and owner.

---

## Access Tokens

Access tokens authorize access to protected resources after authentication or delegation.

They should have:

```text
defined audience
defined issuer
defined lifetime
defined validation rules
```

where the token format supports these concepts.

---

## Refresh Tokens

Refresh tokens are high-value credentials.

They are `RESTRICTED`.

If used, their storage, rotation, replay behavior, expiration, and revocation must be explicit.

They must never appear in telemetry.

---

## Token Lifetime

Token lifetime should match risk and operational requirements.

Shorter-lived access tokens reduce exposure.

Longer-lived credentials may improve usability but increase compromise impact.

The chosen strategy should be explicit.

---

## Token Rotation

Long-lived or refresh credentials may require rotation.

Rotation should consider replay detection and concurrent clients where relevant.

Do not add rotation complexity without understanding the selected token model.

---

## Token Revocation

Stateless verification mechanisms may make immediate revocation harder.

If revocation is a product requirement, that requirement must influence token architecture before implementation.

---

## Token Audience

A credential intended for one service must not automatically be accepted by another.

Audience validation reduces credential reuse across unintended boundaries.

---

## Token Issuer

Trusted token issuers should be explicit.

Applications must reject tokens from unexpected issuers.

---

## Token Signature Validation

Signed tokens must be cryptographically verified before claims are trusted.

Decoding is not verification.

Never treat a token as authenticated merely because its payload can be parsed.

---

## Token Algorithm Validation

Token verification must not blindly trust attacker-controlled algorithm selection.

The application should explicitly allow only intended verification mechanisms.

Exact implementation depends on the selected protocol and library.

---

## Token Claims

Important claims may include:

```text
subject
issuer
audience
expiration
issued time
authentication context
```

Claims should be validated according to the security model.

Unknown or unverified claims should not silently become trusted application state.

---

## Token Contents

Signed does not mean encrypted.

If token contents are readable by clients or intermediaries, do not place unnecessary sensitive data inside them.

Prefer minimal claims.

---

## Personally Identifiable Token Claims

Avoid embedding extensive personal data in credentials.

For example, prefer:

```text
subjectId
```

over:

```text
full profile
address
phone
private application state
```

unless there is a concrete protocol requirement.

---

## Bearer Credentials

Bearer credentials grant access to whoever possesses them.

They must therefore be handled as secrets.

Examples include:

```text
session tokens
access tokens
API tokens
```

They must not appear in:

```text
URLs
logs
error messages
source code
documentation
```

---

## Credentials in URLs

Authentication credentials should not be transmitted through URL query parameters unless a protocol explicitly requires a short-lived one-time value and risks are understood.

URLs frequently appear in:

```text
browser history
proxy logs
analytics
referrer headers
screenshots
```

Prefer safer transport mechanisms.

---

## One-Time Credentials

Some authentication workflows may use one-time credentials.

Examples:

```text
email verification token
password-reset token
magic-link token
```

These should generally be:

```text
high entropy
short lived
single purpose
single use where appropriate
```

They remain `RESTRICTED`.

---

## Email Verification

Email verification proves access to an email address.

It does not necessarily prove legal identity or ownership beyond control of the mailbox.

The application should not infer more assurance than the verification provides.

---

## Account Recovery

Account recovery is effectively an alternative authentication mechanism.

It must receive security treatment comparable to ordinary login.

A weak recovery flow can bypass a strong authentication system.

---

## Recovery Codes

Recovery codes are authentication credentials.

They are `RESTRICTED`.

They should normally be:

```text
single-use
high-entropy
securely stored
```

and should not be recoverable in plaintext after initial display where practical.

---

## Service-to-Service Authentication

Trusted backend services should authenticate to each other when a meaningful trust boundary exists.

Potential mechanisms may include:

```text
workload identity
mutual TLS
signed service credentials
short-lived service tokens
```

The exact mechanism depends on deployment infrastructure.

---

## Shared Service Secrets

Long-lived shared secrets between services should not be the default when stronger identity mechanisms are available.

Shared credentials weaken attribution and rotation.

---

## Webhook Authentication

Inbound webhooks must be authenticated according to provider capabilities.

Potential mechanisms include:

```text
request signatures
shared webhook secrets
mTLS
provider-issued credentials
```

Verification should protect against:

```text
forged messages
tampering
replay where relevant
```

---

## Webhook Replay Protection

If the provider protocol supports timestamps, nonces, or unique event identifiers, webhook validation should consider replay attacks.

A valid signature does not always prove that a message is fresh.

---

## API Keys

API keys may authenticate machines or external consumers.

They are credentials and should be treated as `RESTRICTED` unless explicitly designed as public identifiers.

API-key architecture should consider:

```text
scope
expiration
rotation
revocation
ownership
usage attribution
```

---

## API Key Storage

Where API keys are issued to consumers, the system should avoid storing recoverable plaintext credentials when verification can be performed using a secure derived representation.

Exact design depends on key format and product requirements.

---

## API Key Prefixes

If API keys are introduced, non-secret prefixes may be useful for:

```text
identifying key type
safe display
support
lookup
```

The secret portion must remain protected.

---

## Authentication Context

Trusted application code should receive authentication context through an explicit mechanism.

Avoid arbitrary global access such as:

```text
CurrentUser.get()
```

when explicit request or operation context provides clearer dependency ownership.

The exact pattern depends on the selected stack.

---

## Principal Propagation

Once authenticated, the principal may need to propagate through:

```text
transport
application service
domain operation
audit logging
outbound request
event
```

Propagation should contain only the information required by each boundary.

Do not copy complete authentication objects everywhere.

---

## Async Context

Background processing may continue after the original user request ends.

If user identity is relevant, the event or job should carry an explicit safe representation of required actor context.

Do not depend on process-local request state surviving across asynchronous boundaries.

---

## Delegated Identity

An asynchronous operation may run:

```text
on behalf of user
```

or:

```text
as system
```

These semantics should be distinguishable.

Audit behavior may depend on the difference.

---

## Impersonation

Administrative impersonation, if ever introduced, is security-sensitive.

It should clearly preserve:

```text
real administrator identity
impersonated identity
start/end of impersonation
audit trail
```

Impersonation must not erase the real actor from audit context.

---

## Authentication and Authorization

Authentication should produce identity.

Authorization should consume identity plus application state and policy.

Avoid embedding application authorization logic directly into authentication infrastructure.

For example:

```text
authentication provider says user is valid
```

does not automatically mean:

```text
user may delete orders
```

Authorization policy is defined separately.

---

## Roles in Authentication Tokens

Roles may appear in authentication claims.

Their presence does not automatically make them authoritative.

The application must define:

```text
claim source
freshness
ownership
mapping
revocation semantics
```

before using them for authorization.

---

## Authentication Errors

Authentication failures should use stable error semantics.

Potential examples include:

```text
AUTHENTICATION_REQUIRED
INVALID_CREDENTIALS
SESSION_EXPIRED
SESSION_REVOKED
AUTHENTICATION_FAILED
```

Exact public error codes will be defined with the canonical error registry.

---

## Authentication Error Privacy

Authentication errors should avoid revealing unnecessary details.

For example, public login responses may intentionally avoid distinguishing:

```text
unknown account
wrong password
```

depending on security requirements.

Internal telemetry may retain a safe classification where useful.

---

## Authentication Logging

Authentication telemetry may include safe metadata such as:

```text
authentication method
result
actorId when known and appropriate
provider
requestId
traceId
```

It must not include:

```text
password
token
session secret
recovery code
authorization header
```

---

## Failed Authentication Telemetry

Failed authentication attempts may be important security signals.

Telemetry should remain:

```text
bounded
structured
privacy-aware
```

Do not indiscriminately log raw usernames, credentials, or request payloads.

---

## Authentication Metrics

Useful metrics may include:

```text
authentication attempts
success rate
failure rate
provider errors
MFA challenge failures
session refresh failures
```

Metric labels should remain low-cardinality and must not contain credentials or user-specific identifiers.

---

## Audit Events

Security-sensitive authentication events may require audit logging.

Potential events include:

```text
password changed
MFA enabled
MFA disabled
recovery code regenerated
session revoked
all sessions revoked
identity linked
identity unlinked
```

Audit logs must not contain secret values.

---

## Session Visibility

Product requirements may eventually include user-visible active-session management.

For example:

```text
current device
recent sessions
last activity
revoke session
```

If required, session metadata should be designed intentionally.

Avoid over-collecting device information solely for display.

---

## Device Information

Authentication systems may use device metadata for security or user experience.

Device information can become identifying data.

Collection must be justified and follow data-classification policy.

---

## IP Addresses

IP information may be relevant to security monitoring.

It may also constitute personal data.

Collection and retention must be explicit.

Authentication implementation should not capture IP addresses merely because a framework exposes them.

---

## Risk-Based Authentication

Future applications may use contextual risk signals.

Examples may include:

```text
new device
unusual location
suspicious network
credential abuse indicators
```

Such systems introduce additional data-processing and false-positive risks.

They should not be introduced without concrete requirements.

---

## CAPTCHA and Bot Challenges

Bot-detection mechanisms may be added to public authentication workflows if abuse requires them.

They should not become the default merely because authentication exists.

Third-party bot providers create additional data-processing boundaries.

---

## Authentication State in Clients

Client applications may maintain a representation of authentication state.

Examples:

```text
authenticated
unauthenticated
session refreshing
authentication required
```

Client state is for user experience.

The backend remains authoritative for trusted authentication decisions.

---

## Client-Side Identity Claims

A client may cache user profile or role information for rendering.

This does not make that information authoritative for protected operations.

The server must independently verify identity and authorization where required.

---

## Offline Clients

Mobile or desktop applications may support offline behavior.

Offline authentication state must not be confused with current server authorization.

Actions requiring trusted backend authorization may need reevaluation when connectivity returns.

---

## Authentication and Local Storage

Credential storage in client applications must follow platform-appropriate security practices.

The chosen mechanism depends on:

```text
web
mobile
desktop
```

and the authentication architecture.

No generic storage mechanism should be assumed safe across platforms.

---

## Browser Token Storage

If browser tokens are used, the storage strategy must be selected explicitly.

The decision should consider:

```text
XSS
CSRF
session revocation
refresh behavior
cross-tab behavior
```

Do not choose a browser storage location solely for developer convenience.

---

## Mobile Credential Storage

Sensitive mobile credentials should use appropriate platform-protected storage when local persistence is required.

Application-level plain storage should not be the default.

---

## Desktop Credential Storage

Desktop applications should use operating-system credential-storage capabilities where appropriate.

Plain configuration files are not an acceptable default for authentication secrets.

---

## Authentication Across Applications

Different Orion applications may authenticate the same user.

For example:

```text
web
mobile
desktop
```

They may share identity semantics without sharing implementation-specific session mechanisms.

The canonical identity model should remain consistent.

---

## Shared Authentication Package

A future shared authentication package may provide:

```text
principal types
authentication context primitives
shared error semantics
token verification abstractions
```

only when responsibilities are genuinely shared.

Application-specific authentication behavior should remain local where appropriate.

---

## Provider-Specific Code

Identity-provider SDKs should remain near authentication integration boundaries.

Avoid provider-specific concepts spreading throughout unrelated business modules.

Prefer:

```text
application identity model
        ↓
authentication adapter
        ↓
provider SDK
```

when a meaningful boundary exists.

---

## Vendor Lock-In

Authentication providers often become foundational infrastructure.

Provider selection should consider:

```text
security
standards support
availability
migration strategy
session semantics
user export
MFA support
passkey support
cost
vendor lock-in
```

The decision should be documented through an ADR.

---

## Standards

Where mature authentication standards exist, Orion should prefer them over custom protocols.

Examples may include established industry protocols for:

```text
federated identity
delegated authorization
token exchange
```

Custom authentication protocols should require strong justification.

---

## Cryptography

Do not implement custom cryptographic authentication primitives.

Use established libraries and platform capabilities.

Cryptographic implementation details must be reviewed carefully.

---

## Time

Authentication protocols often rely on time-sensitive values.

Systems should account for:

```text
expiration
not-before time
clock skew
one-time token lifetime
```

Clock behavior may become a dependency.

---

## Authentication Initialization

Applications should validate authentication configuration during startup.

Examples include:

```text
provider configured
verification keys available
session store available
required secrets present
```

Invalid authentication configuration should fail safely.

---

## Dependency Failure

Authentication may depend on external systems.

Failure behavior should be explicit.

For example:

```text
identity provider unavailable
session store unavailable
verification key refresh failed
```

The application must distinguish:

```text
user authentication failure
```

from:

```text
authentication infrastructure failure
```

These have different operational meanings.

---

## Degraded Authentication

Running without required authentication because the identity provider is unavailable is normally unsafe.

Authentication infrastructure failures should fail closed unless a specific documented capability allows otherwise.

---

## Fail Closed

Security-sensitive authentication checks should default to denial when trusted verification cannot be completed.

Prefer:

```text
unable to verify
    ↓
deny
```

over:

```text
unable to verify
    ↓
assume authenticated
```

unless an explicitly documented offline security model requires otherwise.

---

## Authentication Bypass

Development or test authentication bypasses may exist only when strongly isolated.

They must never be silently reachable in production.

Examples of dangerous patterns include:

```text
AUTH_DISABLED=true
```

without environment constraints.

Any bypass mechanism must be:

```text
explicit
testable
production-safe
```

---

## Development Authentication

Local development should not require production user credentials.

Potential development mechanisms may include:

```text
local identity provider
development users
sandbox authentication
test identities
```

The exact mechanism will be chosen with the stack.

---

## Test Authentication

Automated tests should use synthetic identities.

Tests must not depend on real production accounts or credentials.

Test helpers may create authenticated principals directly for unit-level testing when transport authentication is not under test.

---

## Authentication Integration Tests

Integration tests should verify important authentication boundaries such as:

```text
valid authentication
invalid authentication
expired credential
revoked session
missing credential
provider failure
```

without using production credentials.

---

## Authentication End-to-End Tests

Critical end-to-end authentication flows may eventually verify:

```text
login
logout
session persistence
session expiration
credential recovery
MFA
```

depending on implemented capabilities.

---

## Security Regression Tests

Authentication security bugs should result in regression tests whenever practical.

Examples include:

```text
expired token accepted
revoked session accepted
wrong audience accepted
authentication bypass in production
token leaked to logs
```

---

## Source Code Boundaries

Domain modules should not directly parse authentication tokens or access authentication cookies.

Prefer:

```text
transport/authentication boundary
        ↓
verified principal
        ↓
application operation
```

This keeps security protocol logic out of business behavior.

---

## Authentication Context Dependency

Application operations that require identity should declare that dependency explicitly.

For example:

```text
CancelOrder({
    actor,
    orderId
})
```

or an equivalent application context.

Avoid hidden global identity state.

---

## Anonymous Operations

Not every operation requires authentication.

Public operations should explicitly support an anonymous principal or absence of principal where appropriate.

Do not create fake authenticated identities to represent anonymous users.

---

## Optional Authentication

Some routes may support richer behavior when authenticated but remain publicly accessible.

The authentication context should distinguish:

```text
anonymous
authenticated
```

without requiring every request to fail when credentials are absent.

---

## System Principal

System-initiated operations may use an explicit system principal when actor semantics matter.

For example:

```text
scheduled cleanup
automatic reconciliation
```

This should remain distinguishable from human actions.

---

## Audit Actor

Audit records should preserve the effective actor responsible for sensitive actions.

Potential fields may include:

```text
actorType
actorId
delegatedBy
sessionId
```

where appropriate.

Audit identity must not depend solely on user-provided values.

---

## Tenant Context

In multi-tenant systems, authentication and tenant membership are related but distinct.

A token containing:

```text
tenantId
```

does not automatically prove current authorization to that tenant unless the system defines and validates that claim appropriately.

Tenant isolation is primarily an authorization concern.

---

## Account Status

Authentication success does not necessarily imply the account may use the application.

Account states may include:

```text
disabled
suspended
deleted
pending verification
```

Whether these checks belong to authentication, authorization, or application policy should be explicit.

Avoid scattering account-status checks across unrelated modules.

---

## Disabled Accounts

If an account becomes disabled, existing session behavior must be defined.

Potential models include:

```text
immediate session invalidation
session invalidated on next verification
session valid until expiration
```

The correct behavior depends on risk.

---

## Deleted Accounts

Authentication semantics for deleted accounts must be explicit.

Soft-deleted records should not accidentally remain authenticatable.

---

## Authentication Data Ownership

Authentication-related data should have clear ownership.

Potential data includes:

```text
credential records
identity-provider links
sessions
recovery codes
MFA configuration
authentication events
```

Ownership should determine who may modify and expose this data.

---

## Authentication Database Tables

If authentication data is stored in the application database, its tables and fields must follow:

- [docs/security/data-classification.md](data-classification.md)
- [docs/database/schema-documentation.md](../database/schema-documentation.md)

when that documentation exists.

Secret-bearing fields must be identified explicitly.

---

## Session Tables

Session persistence may contain:

```text
session identifier
subject
expiration
device metadata
revocation state
```

Credential material must be protected appropriately.

Where possible, avoid storing raw bearer credentials if a secure derived representation can satisfy verification requirements.

---

## Authentication Events

Authentication changes may produce domain, security, or audit events.

Examples:

```text
UserAuthenticated
PasswordChanged
SessionRevoked
MfaEnabled
```

Whether these are domain events, audit events, or telemetry events depends on their purpose.

Do not conflate the categories.

---

## Authentication and Email Delivery

Authentication workflows such as:

```text
password reset
email verification
magic links
```

may depend on email delivery.

The application should consider:

```text
delivery failure
expired token
duplicate request
email provider outage
```

These workflows should remain safe under retry.

---

## Magic Links

If magic links are implemented, the link itself contains or references an authentication capability.

It should be:

```text
short-lived
single-purpose
protected from replay where appropriate
```

and must not be exposed in telemetry.

---

## Deep Links

Mobile or desktop authentication flows may use deep links.

Sensitive credentials in deep links can leak through platform logging or other applications.

The design must minimize credential exposure and validate callback ownership.

---

## Redirect URIs

Federated authentication often depends on redirect URIs.

Allowed redirect destinations must be explicitly controlled.

Open redirect behavior can become an authentication vulnerability.

---

## OAuth State and Similar Correlation Values

Authentication protocols may require state or correlation values to prevent request forgery or session confusion.

These values should be generated and validated according to the chosen protocol.

Do not invent simplified substitutes.

---

## Authentication and Caching

Authentication results may sometimes be cached.

Caching must not cause revoked or changed identity state to remain trusted beyond acceptable limits.

Cache behavior should match the security semantics of the authentication mechanism.

---

## Authentication and Clock Skew

Expiration-based authentication must account for small clock differences where protocols require it.

Allowed skew should remain bounded.

Large tolerances weaken expiration guarantees.

---

## Authentication and Key Rotation

If signed credentials are used, verification key rotation must be supported safely.

The system may need to accept:

```text
current key
previous valid key
```

during a transition.

Key identifiers and verification behavior should be explicit.

---

## Authentication and Deployment

Authentication changes are often compatibility-sensitive.

During rolling deployments:

```text
old version
new version
```

may coexist.

Changes to:

```text
session format
token claims
signing keys
cookie names
credential validation
```

must consider deployment compatibility.

---

## Authentication Migration

Major authentication changes should use an explicit migration plan.

Examples:

```text
password auth → passkeys
session cookies → token model
identity provider A → identity provider B
```

Migration may require supporting old and new mechanisms temporarily.

---

## Authentication Versioning

Authentication protocols should not be versioned casually.

Versioning is appropriate only when a real compatibility boundary exists.

Internal implementation changes should not automatically create new authentication versions.

---

## Error Handling

Authentication failures should follow:

- [docs/architecture/error-handling.md](../architecture/error-handling.md)

Expected authentication failures should not automatically become internal incidents.

Unexpected authentication infrastructure failures should be observable.

---

## Observability

Authentication systems should make it possible to understand:

```text
success rate
failure categories
provider failures
session refresh failures
unusual abuse patterns
```

without collecting credentials.

---

## Sensitive Authentication Telemetry

Never capture:

```text
passwords
password hashes
session tokens
access tokens
refresh tokens
recovery codes
MFA secrets
authorization headers
authentication cookies
```

Authentication telemetry must follow:

- [docs/security/telemetry-redaction.md](telemetry-redaction.md)

---

## Alerting

Potential authentication alerts may include:

```text
sudden authentication failure spike
identity provider outage
credential abuse indicators
unexpected authentication bypass
session validation failures after deployment
```

Alerting should avoid treating ordinary invalid credentials as incidents by default.

---

## Authentication Security Incidents

Potential incidents include:

```text
credential leak
session hijacking
token signing-key compromise
authentication bypass
account takeover
provider compromise
```

Incident handling should follow the future incident-response policy.

Credential compromise may require:

```text
session revocation
secret rotation
user notification
provider containment
audit review
```

depending on scope.

---

## Account Takeover

Authentication architecture should minimize account takeover risk.

Important defenses may include:

```text
strong credential storage
session protection
recovery security
MFA
abuse detection
credential change protections
```

The exact set depends on product risk.

---

## Session Hijacking

Protecting session credentials is as important as protecting login credentials.

An attacker with a valid bearer session may not need the user's password.

Session design must therefore consider:

```text
transport security
storage
expiration
revocation
XSS/CSRF depending on client
```

---

## Authentication Secret Exposure

If authentication credentials or signing secrets appear in source control or telemetry, follow:

- [docs/security/secrets-management.md](secrets-management.md)

Exposure must be treated according to the capability compromised.

---

## Data Minimization

Authentication systems should collect only identity information required for product and security needs.

Do not collect:

```text
birth date
physical address
phone number
government identity
device fingerprint
```

merely because an identity provider can provide it.

Additional identity attributes create additional security and privacy obligations.

---

## Profile vs Identity

User profile data and authentication identity data should remain conceptually distinct.

Authentication should not become the default owner of all user information.

For example:

```text
display name
avatar
preferences
```

may belong to a profile domain rather than authentication.

---

## Provider Profile Data

When external identity providers supply extensive profile data, ingest only what the application actually requires.

Do not persist entire provider payloads by default.

---

## Authentication Documentation

When authentication implementation is introduced, documentation should explain:

```text
supported authentication methods
session model
credential lifetimes
logout behavior
revocation semantics
provider dependencies
development authentication
recovery model
```

without exposing secret values.

---

## Machine-Readable Authentication Model

As Orion evolves, authentication-related contracts may become machine-readable.

Potential definitions may include:

```text
principal schema
authentication error codes
session metadata
public authentication API contracts
```

Generated documentation should derive from canonical schemas where practical.

---

## Authentication Package Boundaries

Potential future responsibilities may include:

```text
packages/auth
apps/api/auth
```

but the exact structure is intentionally deferred.

The final location should follow actual ownership.

Do not create a generic authentication package before shared responsibilities are known.

---

## Mechanical Enforcement

Future tooling may enforce rules such as:

```text
client code cannot import server authentication secrets

authentication cookies cannot be read by arbitrary domain modules

raw token parsing occurs only in approved modules

authentication credentials cannot enter telemetry

server authentication code cannot be bundled into clients

public contracts cannot expose credential-bearing fields
```

The exact mechanism depends on the selected stack.

---

## Security Review Triggers

Additional review should be considered when introducing:

```text
new authentication method
new identity provider
MFA
password reset
account recovery
session architecture change
new credential type
impersonation
delegated agent identity
```

These changes affect foundational security boundaries.

---

## New Authentication Mechanism Checklist

Before introducing a new authentication mechanism, answer:

1. Which actor does it authenticate?
2. What identity proof does it provide?
3. What trust boundary verifies it?
4. What credential is created?
5. What is the credential lifetime?
6. Where is the credential stored?
7. How is it revoked?
8. How is it rotated if applicable?
9. What happens after account disablement?
10. What telemetry is produced?
11. What data is collected?
12. What recovery mechanism exists?
13. What abuse scenarios exist?
14. Does it require external providers?
15. Does it affect existing sessions?
16. How will it be tested?

If these questions cannot be answered, the authentication design is incomplete.

---

## New Session Mechanism Checklist

Before choosing a session mechanism, answer:

1. Is the session server-side, token-based, or hybrid?
2. How is the session identifier protected?
3. How long does it remain valid?
4. How does logout work?
5. How does revocation work?
6. Can all sessions be revoked?
7. What happens when an account is disabled?
8. Can multiple application versions coexist?
9. How are browser, mobile, and desktop clients handled?
10. What storage is used on each client?
11. What CSRF or XSS considerations apply?
12. How are credentials rotated?
13. How is session telemetry sanitized?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Trusting Client User IDs

```text
request.body.userId
    ↓
treated as authenticated identity
```

Prohibited.

---

### Client-Side Authorization as Authentication

```text
button hidden
    ↓
operation considered protected
```

Prohibited.

---

### Raw Token Decode Without Verification

Prohibited.

---

### Password Logging

Prohibited.

---

### Session Token Logging

Prohibited.

---

### Token in URL

Strongly discouraged except where an explicit short-lived protocol requires it.

---

### Permanent Authentication Bypass

Prohibited.

---

### Production Credential Reuse in Development

Prohibited.

---

### Shared Human Account

Strongly discouraged.

Prefer individually attributable identities.

---

### Human Credentials for Services

Avoid.

Use machine identities.

---

### Service Credentials for Humans

Avoid.

Human access should be individually attributable.

---

### Authentication Provider Claims as Automatic Authorization

Avoid.

Map them deliberately.

---

### Global Mutable Current User

Avoid when explicit authentication context is practical.

---

### Authentication Logic in Domain Entities

Avoid protocol-specific authentication behavior inside domain logic.

---

### Full Provider Payload Persistence

Avoid.

Persist only required identity data.

---

### Infinite Sessions by Accident

Avoid.

Session lifetime must be explicit.

---

### Recovery Weaker Than Login

Avoid.

Account recovery is an authentication mechanism and must be protected accordingly.

---

## Initial Authentication Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Authentication and authorization are separate concerns.
2. Client applications are untrusted.
3. Identity must be verified at trusted boundaries.
4. Client-provided identity claims must not be trusted without verification.
5. Human and machine identities should remain distinct.
6. Machine services should not depend on shared human credentials.
7. Authentication credentials are `RESTRICTED`.
8. Authentication credentials must never be intentionally included in telemetry.
9. Passwords must never be stored in plaintext.
10. Custom password hashing and custom cryptographic authentication protocols are prohibited.
11. Sessions must have explicit lifetime and invalidation semantics.
12. Authentication mechanisms must define revocation behavior where required.
13. Browser, mobile, and desktop credential storage must follow platform-appropriate security mechanisms.
14. Server-only authentication secrets must never be delivered to clients.
15. Authentication failures should use stable error semantics without unnecessary information disclosure.
16. Authentication infrastructure failures must be distinguishable from invalid user credentials.
17. Security-sensitive authentication checks should fail closed.
18. Production authentication bypasses are prohibited.
19. Automated tests must use synthetic identities and credentials.
20. Authentication changes should become mechanically enforceable and testable where practical.

---

## Future Implementation Decisions

The following decisions are intentionally deferred:

```text
authentication provider
authentication library
password support
password-hashing algorithm
passkey support
MFA support
session model
token format
token lifetime
session storage
cookie strategy
browser authentication strategy
mobile authentication strategy
desktop authentication strategy
service-to-service identity
account recovery mechanism
```

These decisions should follow actual application requirements and the selected technology stack.

Significant choices should be documented through ADRs.

---

## Future Documentation

This document should eventually be complemented by:

- [docs/security/authorization.md](authorization.md)
- [docs/security/production-access.md](production-access.md)
- [docs/security/incident-response.md](incident-response.md)
- [docs/api/principles.md](../api/principles.md)
- [docs/api/error-contract.md](../api/error-contract.md)
- [docs/reliability/logging.md](../reliability/logging.md)
- [docs/reliability/error-reporting.md](../reliability/error-reporting.md)

Implementation-specific authentication documentation should reference this policy rather than redefine authentication principles independently.

---

## Summary

Authentication establishes trusted identity.

The fundamental flow is:

```text
untrusted credential or identity proof
        ↓
trusted verification
        ↓
authenticated principal
        ↓
authorization
        ↓
application operation
```

Orion prefers:

```text
verified identity over client claims

machine identity over shared credentials

explicit principal over hidden global state

short-lived credentials over unnecessary permanence

revocable sessions over irreversible access

standards over custom authentication protocols

minimal identity data over unnecessary profile collection
```

Authentication credentials are security capabilities.

They must remain protected throughout:

```text
creation
storage
transport
verification
session continuity
rotation
revocation
recovery
```

A secure login with an insecure recovery flow is not secure authentication.

A valid identity without authorization is not permission.

A client claim without trusted verification is not authentication.
