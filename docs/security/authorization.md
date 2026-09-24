# Authorization

[Documentation index](../README.md) · [Validation availability](../validation.md)

## Read for this change

- [Default Deny](#default-deny)
- [Trusted Enforcement Boundary](#trusted-enforcement-boundary)
- [Multi-Tenant Authorization](#multi-tenant-authorization)
- [Authorization Testing](#authorization-testing)
- [New Authorization Policy Checklist](#new-authorization-policy-checklist)

## Purpose

This document defines the authorization architecture and security principles used by Orion.

Its goals are to ensure that access decisions are:

- explicit;
- enforced at trusted boundaries;
- consistent across applications;
- based on verified identity;
- testable;
- auditable where appropriate;
- resistant to privilege escalation;
- compatible with domain ownership;
- understandable by humans and AI agents;
- mechanically enforceable where practical.

Authorization determines whether an authenticated or anonymous actor is permitted to perform an operation.

This document is technology-agnostic.

Specific authorization libraries, policy engines, role models, permission storage, and enforcement mechanisms will be selected later through explicit architectural decisions.

This document complements:

- [docs/security/authentication.md](authentication.md);
- [docs/security/data-classification.md](data-classification.md);
- [docs/security/secrets-management.md](secrets-management.md);
- [docs/architecture/application-boundaries.md](../architecture/application-boundaries.md);
- [docs/architecture/dependency-rules.md](../architecture/dependency-rules.md);
- [docs/architecture/error-handling.md](../architecture/error-handling.md).

---

## Core Principle

Authentication answers:

```text
Who is this actor?
```

Authorization answers:

```text
May this actor perform this operation on this resource in this context?
```

The intended model is:

```text
authenticated or anonymous actor
        ↓
trusted identity context
        ↓
authorization policy
        ↓
resource + operation + context
        ↓
allow or deny
```

Authorization must not depend solely on user-interface state or client-supplied claims.

---

## Default Deny

Authorization should fail closed.

If the system cannot establish that an operation is allowed, the default result should be denial.

Prefer:

```text
unknown permission
    ↓
deny
```

over:

```text
unknown permission
    ↓
allow
```

Security-sensitive ambiguity must not become implicit access.

---

## Authorization Requires Trusted Identity

Authorization decisions that depend on identity must use a verified principal.

Do not use:

```text
request.body.userId
request.query.role
client-provided tenantId
UI-provided permission
```

as authoritative authorization input without trusted verification.

Authorization operates on trusted identity context.

---

## Anonymous Actors

Some operations may be public.

Authorization must explicitly support:

```text
anonymous
```

rather than inventing artificial user identities.

A public operation should be intentionally public.

Lack of authentication must not accidentally bypass authorization logic.

---

## Authorization Decision Model

A meaningful authorization decision may depend on:

```text
actor
operation
resource
resource ownership
tenant
role
permission
resource state
relationship
environment
authentication assurance
```

Not every system requires every dimension.

Authorization should model only the dimensions required by actual domain rules.

---

## Operation-Based Authorization

Authorization should protect meaningful operations.

Examples include:

```text
order.read
order.cancel
user.update
user.delete
invoice.export
admin.user.suspend
```

Prefer protecting business operations rather than arbitrary implementation details.

For example:

```text
cancel order
```

is usually a more meaningful permission boundary than:

```text
call method X in controller Y
```

---

## Resource-Based Authorization

Some permissions depend on the target resource.

For example:

```text
user may edit own profile
```

requires both:

```text
operation = profile.update
resource owner = actor
```

Resource authorization must use trusted resource state.

Do not rely on client-provided ownership claims.

---

## Ownership

Ownership is an authorization relationship.

Examples include:

```text
user owns document
organization owns project
tenant owns order
```

Ownership should have explicit semantics.

Do not infer ownership casually from fields whose meaning is unrelated.

---

## Ownership Is Not Authentication

An actor may be authenticated but not own a resource.

For example:

```text
authenticated user
    ↓
tries to update another user's profile
```

Authentication succeeds.

Authorization should fail.

---

## Roles

Roles group authorization responsibilities.

Potential examples include:

```text
member
manager
administrator
support
billing-admin
```

Roles may simplify permission assignment.

They must not become vague shortcuts for unrelated privileges.

---

## Role Semantics

Every role should have a clear definition.

Avoid roles such as:

```text
super-user
special
power-user
```

without documented semantics.

A role should answer:

```text
What responsibility does this role represent?

Which permissions does it grant?

At what scope?
```

---

## Permissions

Permissions represent allowed capabilities.

Examples:

```text
orders.read
orders.cancel
users.manage
billing.view
billing.manage
```

Permissions should be stable enough to support policy and audit.

They should describe meaningful capabilities rather than framework implementation.

---

## Roles vs Permissions

Roles and permissions are different concepts.

Conceptually:

```text
role
    ↓ grants
permissions
```

For example:

```text
billing-admin
    ↓
billing.view
billing.manage
```

Application logic should prefer checking meaningful authorization policy rather than scattering hardcoded role names everywhere.

---

## Avoid Hardcoded Role Checks

Avoid:

```text
if user.role == "admin"
```

throughout the repository.

This creates authorization logic distributed across many modules.

Prefer:

```text
authorization.can(actor, "user.delete", targetUser)
```

or an equivalent policy boundary.

The exact API will depend on the selected stack.

---

## Policy-Based Authorization

A policy represents a reusable authorization rule.

Conceptually:

```text
CanCancelOrder(actor, order)
```

may consider:

```text
actor permissions
tenant membership
order ownership
order state
```

Authorization policy should express business-security semantics clearly.

---

## Authorization and Domain Rules

Authorization and domain validation are related but distinct.

For example:

```text
User may cancel order
```

is authorization.

```text
Shipped order cannot be cancelled
```

is a domain rule.

Both may cause the operation to fail.

They have different ownership.

Conceptually:

```text
authorization
    ↓
is actor allowed?

domain
    ↓
is operation valid?
```

The exact evaluation order may vary based on information-disclosure requirements.

---

## Authorization Before Domain Execution

Sensitive operations should normally authorize before performing side effects.

Avoid:

```text
modify data
    ↓
check permission
```

Prefer:

```text
authorize
    ↓
validate domain operation
    ↓
perform side effect
```

unless atomic architecture requires a combined decision.

---

## Information Disclosure

Authorization order may affect whether protected resource existence is revealed.

For example:

```text
GET /documents/secret-id
```

An unauthorized actor may receive:

```text
NOT_FOUND
```

instead of:

```text
PERMISSION_DENIED
```

when revealing existence would be sensitive.

This behavior should be deliberate.

---

## Trusted Enforcement Boundary

Authorization must be enforced in trusted code.

Examples include:

```text
backend application
trusted worker
trusted service
```

Client applications may improve user experience by hiding unavailable actions.

They do not provide security enforcement.

---

## UI Authorization

A UI may use authorization information to:

```text
hide actions
disable controls
show explanatory messages
```

This improves user experience.

It does not replace backend enforcement.

A malicious or modified client must still be unable to perform the forbidden operation.

---

## Client Authorization Hints

Clients may receive safe authorization hints such as:

```text
canCancelOrder
canEditProfile
canManageBilling
```

when useful.

These hints are presentation aids.

The backend must independently evaluate the operation when it is requested.

---

## Authorization Duplication

Avoid independently implementing the same authorization rule in:

```text
web
mobile
desktop
API
worker
```

The trusted authorization rule should have one canonical owner.

Clients may derive presentation behavior from backend-provided capabilities or shared safe rules when appropriate.

---

## Multi-Tenant Authorization

Multi-tenant systems require explicit tenant isolation.

A typical decision may depend on:

```text
actor
tenant membership
target resource tenant
requested operation
```

For example:

```text
actor.tenantId == resource.tenantId
```

may be necessary but should not automatically be assumed sufficient.

---

## Tenant Context

Tenant context must originate from a trusted source.

Do not trust:

```text
request.body.tenantId
```

merely because the client supplied it.

The system should determine whether the actor is authorized to act within the requested tenant.

---

## Tenant Switching

If users may belong to multiple tenants, switching active tenant context must be explicit.

The active tenant must remain constrained by verified membership or authorization.

Client-selected tenant context is a request.

It is not proof of membership.

---

## Cross-Tenant Access

Cross-tenant access should be prohibited by default.

Exceptional cross-tenant roles such as:

```text
platform administrator
support operator
auditor
```

should have explicit policies.

They must not arise from accidental broad database access.

---

## Database Tenant Isolation

Application authorization should be the primary semantic control.

Database protections may provide defense in depth where appropriate.

Potential mechanisms include:

```text
tenant-aware queries
database policies
separate schemas
separate databases
row-level security
```

The selected strategy depends on architecture and risk.

Database isolation does not eliminate the need for clear application authorization semantics.

---

## Row-Level Security

Database row-level security may eventually provide strong tenant or ownership enforcement.

If used, its policy must remain documented and testable.

Business authorization must not become hidden inside database policies without discoverability.

---

## Administrative Authorization

Administrative operations require explicit authorization.

Examples include:

```text
user suspension
permission changes
data export
security configuration
impersonation
production administration
```

The existence of an "admin" UI does not itself secure these operations.

---

## Administrative Roles

Administrative roles should be narrow where practical.

Prefer:

```text
billing-admin
support-agent
security-admin
```

over a single unrestricted administrator role when responsibilities differ materially.

Least privilege applies to administrative users.

---

## Superuser Access

A global unrestricted role may sometimes be required.

If introduced, it should be treated as a high-risk capability.

It should have:

```text
strict assignment
auditability
limited usage
strong authentication
clear ownership
```

Its existence should not become a shortcut around normal authorization design.

---

## Support Access

Support personnel may require access to customer information or limited account actions.

Support authorization should be distinct from engineering or infrastructure administration.

A support role should not automatically receive:

```text
database administration
secret access
deployment access
security administration
```

---

## Impersonation

If support or administrators can impersonate users, authorization must preserve both identities.

Conceptually:

```text
real actor: administrator
effective actor: user
```

Audit logs should retain the real actor.

Impersonation should be:

```text
explicit
visible
auditable
limited
```

It should not silently replace administrator identity.

---

## Machine Authorization

Machine actors also require authorization.

A worker may be authenticated as:

```text
worker-service
```

but should receive only capabilities required by its responsibilities.

Authentication as a trusted service does not imply unrestricted application access.

---

## Service-to-Service Authorization

Service communication may require both:

```text
service authentication
service authorization
```

For example:

```text
reporting service
```

may be authenticated but not allowed to invoke:

```text
payment.refund
```

unless explicitly permitted.

---

## Workload Identity

Where workload identities exist, authorization may use service identity directly.

Prefer capability scoped to:

```text
specific service
specific environment
specific operation
```

over broadly shared internal credentials.

---

## CI and Automation Authorization

CI systems and deployment automation are actors.

They should receive only the permissions required by their workflows.

For example:

```text
test workflow
```

should not automatically receive:

```text
production deployment
production database administration
secret-management administration
```

---

## AI Agent Authorization

AI agents must operate under explicit authorization.

An agent should not gain broader permissions merely because it can reason about the repository.

Potential distinctions include:

```text
read repository
modify repository
open pull request
read telemetry
deploy
access production
change infrastructure
```

Each capability should be authorized separately.

---

## Delegated AI Actions

When an AI agent acts on behalf of a human, the system should preserve delegated authority where practical.

Conceptually:

```text
human actor
    ↓ delegates
AI agent
    ↓ performs
operation
```

The agent should not receive permanent unrestricted authority.

---

## Authorization Context

An authorization decision may require contextual information.

Potential context includes:

```text
current tenant
authentication assurance
resource state
request origin
environment
time
delegation
```

Context should be trusted or validated appropriately.

---

## Authorization Context Must Be Minimal

Do not pass arbitrary request objects into policy evaluation when a smaller explicit context is sufficient.

Prefer:

```text
AuthorizationContext {
    actor
    tenant
    operation
    resource
}
```

over:

```text
entire HTTP request
```

This keeps authorization testable and transport-independent.

---

## Environment-Specific Authorization

Production access may have stricter requirements than development access.

For example:

```text
production data export
```

may require stronger authorization than:

```text
development test-data export
```

Environment should be an explicit policy input only where the distinction is security-relevant.

---

## Authentication Assurance

Some operations may require:

```text
authenticated user
```

while others may require:

```text
recent MFA-authenticated user
```

Authorization may therefore depend on authentication assurance.

This is particularly relevant for:

```text
credential changes
financial actions
administrative actions
sensitive exports
```

---

## Step-Up Authorization

Authorization may determine that the actor has sufficient permissions but insufficient current authentication assurance.

The resulting flow may be:

```text
authorized role
    ↓
operation requires stronger authentication
    ↓
step-up authentication
    ↓
operation proceeds
```

Authorization and authentication cooperate without becoming the same concern.

---

## Temporal Authorization

Some permissions may be time-limited.

Examples:

```text
temporary support access
emergency production access
delegated access
invitation-based access
```

Authorization should respect expiration.

Expired access must fail closed.

---

## Relationship-Based Authorization

Some applications may require authorization based on relationships.

Examples:

```text
member of organization
manager of employee
owner of resource
collaborator on document
```

Relationship rules should remain explicit.

Do not force every authorization model into global roles if relationships better represent the domain.

---

## Attribute-Based Authorization

Some policies may depend on attributes.

Examples:

```text
resource classification
tenant
region
actor type
operation risk
```

Attribute-based policy can be powerful but also complex.

Introduce it only where actual authorization requirements justify it.

---

## RBAC

Role-Based Access Control may be appropriate when permissions naturally group into organizational roles.

A conceptual model is:

```text
actor
    ↓ assigned
role
    ↓ grants
permissions
```

RBAC should not be adopted merely because it is common.

It should match actual domain semantics.

---

## ABAC

Attribute-Based Access Control may be appropriate when decisions depend on multiple dynamic attributes.

Conceptually:

```text
actor attributes
resource attributes
operation
context
    ↓
policy
```

ABAC introduces policy complexity and should be justified.

---

## ReBAC

Relationship-Based Access Control may be appropriate for graph-like relationships.

Examples include:

```text
document shared with user
user belongs to organization
manager supervises employee
```

Again, choose the model based on domain needs rather than architectural fashion.

---

## Mixed Authorization Models

Real systems may combine:

```text
roles
permissions
relationships
attributes
ownership
```

This is acceptable when semantics remain clear.

Avoid mixing mechanisms without a coherent policy model.

---

## Permission Scope

Permissions should define scope where needed.

For example:

```text
orders.read:self
orders.read:tenant
orders.read:any
```

or another explicit model.

Scope semantics should remain consistent.

Do not encode arbitrary scope conventions into strings without documentation.

---

## Resource Scope

Authorization may apply at levels such as:

```text
own resource
team
tenant
organization
global
```

These scopes should be explicit where they affect policy.

---

## Permission Naming

Permission names should represent stable capabilities.

Prefer:

```text
orders.cancel
users.suspend
billing.manage
```

over:

```text
canPressCancelButton
controller.orders.delete
feature42
```

Permission naming should describe application semantics.

---

## Permission Granularity

Permissions should be neither excessively broad nor excessively microscopic.

Too broad:

```text
ADMIN
```

may grant unrelated capabilities.

Too granular:

```text
orders.cancel.when-pending.from-web
```

may create unmanageable policy.

Choose granularity based on meaningful security behavior.

---

## Permission Registry

As Orion evolves, stable permissions should have a canonical machine-readable registry where practical.

A future registry may define:

```text
permission
owner
description
scope
risk level
```

Example:

```text
orders.cancel
    owner: orders
    description: Cancel an eligible order.
```

The exact format depends on the selected stack.

---

## Role Registry

If roles are used, roles should also have explicit definitions.

Potential metadata includes:

```text
role
description
granted permissions
scope
assignable by
```

Roles should not be defined only in scattered conditionals.

---

## Policy Ownership

Authorization policies should have identifiable ownership.

For example:

```text
Orders
    owns
orders.cancel policy
```

A central authorization infrastructure may evaluate policies.

It should not own the business meaning of every operation.

---

## Centralized Authorization Infrastructure

Shared authorization infrastructure may provide:

```text
policy evaluation
principal representation
permission lookup
audit hooks
common denial semantics
```

It should not become a giant switch statement containing every domain rule.

Domain-specific authorization ownership should remain clear.

---

## Local Policy Definition

A domain or feature may define authorization close to the protected operation.

Conceptually:

```text
orders/
    cancel-order
    cancel-order-policy
```

The exact structure is deferred.

The important principle is discoverability.

---

## Authorization at Application Boundaries

Authorization should normally happen before protected application operations.

For example:

```text
HTTP request
    ↓
authentication
    ↓
authorization
    ↓
CancelOrder
```

The application operation may also enforce authorization internally when the same operation is callable from multiple trusted entry points.

---

## Defense in Depth

Critical operations may enforce authorization at more than one layer.

For example:

```text
API transport
    ↓ coarse access control
application operation
    ↓ authoritative policy
database
    ↓ tenant isolation defense
```

Multiple layers are acceptable when responsibilities are distinct.

Avoid duplicated policy implementations that may drift.

---

## Worker Authorization

Background workers often operate without an interactive user.

Their authority must still be explicit.

A worker may operate:

```text
as system
```

or:

```text
on behalf of actor
```

These are different authorization semantics.

---

## Jobs Triggered by Users

If a user schedules a job, the system must decide whether authorization is evaluated:

```text
when job is created
when job executes
both
```

The correct behavior depends on whether permissions may change before execution.

---

## Permission Changes During Async Work

Consider:

```text
user authorized operation
    ↓
job queued
    ↓
permission revoked
    ↓
job executes later
```

The system must define whether the original authorization remains valid.

This decision should follow domain and security requirements.

---

## Events and Authorization

Events should not assume that every consumer inherits the producer's authority.

A consumer should operate according to its own trusted identity and responsibilities.

Actor context may be included when semantically required, but it must not become an unchecked authorization bypass.

---

## Data Access Authorization

Reading data is an authorization decision.

A module must not assume that read-only access is harmless.

Examples include:

```text
view profile
download document
list invoices
read audit history
```

Authorization applies to reads as well as writes.

---

## Field-Level Authorization

Some systems may require protecting individual fields.

For example:

```text
support agent may view account status
but not payment details
```

Field-level authorization should be introduced only when real requirements exist.

It increases complexity significantly.

---

## Response Filtering

If different actors may see different fields, response construction must respect authorization.

Avoid:

```text
serialize full entity
    ↓
hope client ignores restricted fields
```

Prefer deliberate response schemas.

---

## Bulk Operations

Bulk operations may increase authorization risk.

For example:

```text
export all users
bulk cancel orders
bulk update permissions
```

Authorization should consider the elevated capability and impact.

Permission to modify one resource does not automatically imply permission to modify all resources.

---

## Search and Listing Authorization

Collection endpoints must not expose unauthorized resources.

Authorization should apply to:

```text
list
search
count
aggregate
export
```

not only detail endpoints.

---

## Inference Attacks

Even when direct data access is blocked, aggregate responses may reveal protected information.

Examples include:

```text
count
existence check
search suggestions
error differences
```

Authorization design should consider information disclosure when data is sensitive.

---

## Authorization and Caching

Caches must not cause one actor to receive another actor's protected data.

Cache keys and cache scope should consider authorization context.

For example:

```text
resourceId
```

may be insufficient when response contents vary by:

```text
tenant
permissions
actor
```

---

## Authorization and CDN Caching

Public caching infrastructure requires special care for authenticated responses.

Protected responses must not accidentally become publicly cacheable.

HTTP caching policy should reflect authentication and authorization semantics.

---

## Authorization and Database Queries

Authorization should influence data access safely.

Prefer queries that retrieve only authorized data when practical.

For example:

```text
SELECT authorized tenant resource
```

may be preferable to:

```text
load all resources
    ↓
filter unauthorized ones in memory
```

especially for large or sensitive datasets.

---

## Avoid IDOR

Insecure Direct Object Reference occurs when possession of a resource identifier is treated as authorization.

For example:

```text
GET /documents/{id}
```

must not assume:

```text
knows id
    =
may access document
```

Ownership or permission must be verified.

---

## Predictable Identifiers

Opaque or unpredictable identifiers can reduce accidental exposure.

They are not an authorization control.

Even a cryptographically random resource ID requires authorization when the resource is protected.

---

## Authorization and Data Classification

More sensitive data may require stronger authorization.

For example:

```text
INTERNAL
CONFIDENTIAL
RESTRICTED
```

may justify different access policies.

Classification alone does not define the policy.

It informs the security requirements.

---

## Restricted Data

Access to `RESTRICTED` data should be rare and explicit.

Examples may include:

```text
credential administration
cryptographic key management
security recovery material
```

Ordinary application users and support roles should not receive restricted data unless the product specifically requires it.

---

## Authorization and Secrets

Authorization to operate a system does not automatically grant access to its raw secrets.

For example:

```text
may deploy application
```

does not necessarily imply:

```text
may read production database password
```

Capability-based operational systems should prefer allowing actions without exposing credentials.

---

## Authorization and Production Access

Production operational access should use separate authorization policy from ordinary product authorization.

Examples include:

```text
view production telemetry
execute deployment
access production database
change infrastructure
rotate secret
```

These rules will be expanded in:

- [docs/security/production-access.md](production-access.md)

---

## Authorization and Audit Logs

Sensitive authorization decisions may require audit events.

Potential events include:

```text
role assigned
permission changed
administrator action
data export
impersonation started
impersonation ended
security configuration changed
```

Audit records should capture the trusted actor.

---

## Authorization Decision Logging

Not every authorization decision should be logged.

High-volume successful checks may create unnecessary noise.

Useful logging may include:

```text
privileged access
policy changes
unexpected denials
suspicious access patterns
administrative operations
```

The exact telemetry policy should balance diagnostic value, privacy, and cost.

---

## Authorization Failure Telemetry

Authorization failures may be:

```text
normal expected behavior
```

or:

```text
security signal
```

depending on context.

A user accidentally opening an unavailable page is different from repeated attempts to access many protected resources.

Telemetry should distinguish semantics where useful.

---

## Public Authorization Errors

Common public authorization semantics may include:

```text
AUTHENTICATION_REQUIRED
PERMISSION_DENIED
RESOURCE_NOT_FOUND
```

The exact public error should consider information disclosure.

Authorization infrastructure should not expose internal policy evaluation details to untrusted callers.

---

## Internal Authorization Diagnostics

Internal diagnostics may include:

```text
operation
policy
actorId
resourceId
tenantId
decision
reason category
```

where appropriate and permitted.

Avoid logging entire actor or resource objects.

---

## Policy Reason Codes

Authorization systems may eventually use machine-readable internal reason codes.

Examples:

```text
MISSING_PERMISSION
WRONG_TENANT
NOT_RESOURCE_OWNER
INSUFFICIENT_AUTHENTICATION_ASSURANCE
ACCOUNT_DISABLED
```

These can improve diagnostics and testing.

They should not necessarily become public API error codes.

---

## Avoid Policy Detail Leakage

A public denial should not expose information such as:

```text
You cannot access this document because it belongs to executive tenant X.
```

when that information itself is protected.

Public messages should remain safe.

---

## Authorization Changes

Changing authorization policy is security-sensitive.

Examples include:

```text
new role
new permission
expanded scope
weakened ownership rule
new administrative capability
```

Such changes should receive explicit tests and documentation.

---

## Permission Migration

Changing role or permission semantics may require migrating persisted assignments.

For example:

```text
old role
    ↓ split into
role A
role B
```

Migration must preserve intended access.

Authorization data migrations should be treated as security-sensitive.

---

## Removing Permissions

Removing a permission may affect:

```text
roles
users
API clients
background jobs
integrations
```

The system should identify existing assignments before removing the capability.

---

## Renaming Permissions

A permission rename is not merely cosmetic when assignments are persisted.

Treat it as a schema or compatibility migration.

Prefer stable permission identifiers with editable human-readable descriptions.

---

## Role Changes

Changing the permissions granted by an existing role can silently alter access for many actors.

Role changes should therefore be reviewed as security changes.

---

## Authorization Data

Authorization state may include:

```text
role assignments
permission grants
tenant memberships
resource relationships
delegations
temporary access
```

This data is security-sensitive and generally at least `CONFIDENTIAL`.

---

## Authorization Data Integrity

Authorization data must preserve strong integrity.

Unauthorized changes to permission assignments can be equivalent to account compromise.

Database constraints and transactions should be used where appropriate.

---

## Authorization Transactions

Security-sensitive changes may need transactional guarantees.

For example:

```text
remove old role
assign new role
write audit event
```

should not leave unintended intermediate access states.

Exact transaction boundaries depend on implementation.

---

## Self-Escalation

Users must not be able to grant themselves privileges beyond their current authority.

For example:

```text
update own profile
```

must not allow changing:

```text
role = administrator
```

unless that capability is explicitly authorized.

Input schemas should distinguish ordinary editable fields from privileged security fields.

---

## Mass Assignment

Generic object update mechanisms can cause authorization vulnerabilities.

Avoid:

```text
update user with all request fields
```

when some fields represent privileged state.

Prefer explicit update contracts.

---

## Privilege Escalation

Authorization design should consider both:

```text
vertical escalation
```

where a user gains higher privileges, and:

```text
horizontal escalation
```

where a user accesses another user's equivalent resources.

Both require explicit prevention.

---

## Privilege Inheritance

If roles or groups inherit permissions, inheritance must remain understandable.

Deep or cyclic inheritance should be avoided.

A contributor should be able to determine why an actor has a permission.

---

## Permission Explanation

For complex authorization systems, it may eventually be useful to explain:

```text
why actor has permission
why actor was denied
```

for trusted administrative/debugging use.

Such diagnostics should not leak protected policy details to ordinary users.

---

## Authorization Introspection

Trusted tools may eventually support questions such as:

```text
Can user X cancel order Y?

Why?

Which policy granted access?
```

This can be valuable for support, debugging, and AI-assisted investigation.

Access to such tools must itself be authorized.

---

## Policy Determinism

Given the same trusted inputs and policy state, authorization should produce predictable results.

Avoid authorization that depends on hidden mutable global state.

Deterministic policy improves:

```text
testing
debugging
audit
AI reasoning
```

---

## Authorization Side Effects

Authorization checks should generally be free of business side effects.

A policy evaluation should not:

```text
modify resource
send email
charge payment
```

Merely checking permission should be safe.

Audit or telemetry side effects may occur through controlled infrastructure where appropriate.

---

## Pure Policy Functions

Where practical, authorization policy should be representable as:

```text
principal
resource
context
    ↓
decision
```

This makes policy easier to test.

External data lookup may still be necessary.

---

## Authorization Data Loading

Policy evaluation may require loading:

```text
resource ownership
tenant membership
role assignments
```

Data access should be efficient and explicit.

Avoid excessive repeated authorization queries that create significant performance cost.

---

## Avoid Authorization N+1

Collection operations may accidentally evaluate authorization with one database query per item.

Authorization design should consider efficient bulk evaluation where needed.

Security correctness comes first, but architecture should avoid obvious scalability problems.

---

## Cached Authorization Decisions

Authorization decisions may be cached only when their freshness semantics are understood.

Caching can delay:

```text
permission revocation
role changes
tenant removal
```

The acceptable delay must be explicit.

---

## Immediate Revocation

Some permissions may require near-immediate revocation.

Examples may include:

```text
administrator access
production access
security-sensitive capabilities
```

This requirement should influence caching and token design.

---

## Authorization in Tokens

Permissions or roles may be embedded in tokens.

This can improve performance.

It also creates freshness concerns.

For example:

```text
role revoked
    ↓
old token still says admin
```

The architecture must define how long stale authorization claims may remain valid.

---

## Server-Side Authorization State

Server-side policy lookup may provide fresher authorization state at the cost of additional runtime dependency.

The decision should be based on required revocation semantics and performance.

---

## Hybrid Authorization

A system may use token claims for coarse authorization and authoritative server state for sensitive operations.

This can be appropriate when different operations have different freshness requirements.

The model should remain explicit.

---

## Authorization and Feature Flags

Feature availability and authorization are different concepts.

A feature flag answers:

```text
Is this feature enabled?
```

Authorization answers:

```text
May this actor use it?
```

Both may need to be true.

Do not use feature flags as a security boundary.

---

## Subscription and Entitlements

Product entitlements may resemble permissions.

Examples:

```text
plan allows advanced reports
tenant purchased feature X
```

Entitlements and security authorization may interact.

They should remain conceptually distinct where doing so improves clarity.

---

## License Enforcement

License or subscription restrictions should not be confused with identity authorization.

A user may be authorized by role but blocked by product entitlement.

Distinct failure semantics may be useful.

---

## Authorization Testing

Authorization policy must be testable.

Important tests should cover:

```text
allowed actor
denied actor
anonymous actor
wrong tenant
resource owner
non-owner
admin
revoked permission
boundary conditions
```

Security-sensitive policy should have explicit test coverage.

---

## Negative Tests

Authorization tests must verify denial paths.

Testing only successful access is insufficient.

For every important capability, ask:

```text
Who must not be able to perform this?
```

---

## Cross-Tenant Tests

Multi-tenant systems should include tests specifically proving tenant isolation.

Examples:

```text
tenant A cannot read tenant B resource

tenant A cannot update tenant B resource

tenant A cannot infer protected tenant B resource
```

These tests should be considered high-value security tests.

---

## Privilege Escalation Tests

Security-sensitive update operations should test that ordinary actors cannot modify:

```text
roles
permissions
tenant ownership
security fields
administrative flags
```

without proper authorization.

---

## Authorization Regression Tests

Authorization bugs should produce regression tests whenever practical.

Examples:

```text
user could edit another user's document

support role could access restricted payment data

deleted membership still granted access

client-provided tenantId bypassed isolation
```

The regression should verify the denied behavior.

---

## Property-Based Authorization Testing

If the selected stack supports it and policy complexity justifies it, property-based tests may validate invariants such as:

```text
cross-tenant access is never allowed
```

across many generated cases.

This should be introduced only where it provides concrete value.

---

## Authorization Test Helpers

Test infrastructure may provide helpers to create:

```text
anonymous principal
ordinary user
tenant member
administrator
machine principal
```

Helpers should make security cases easy to express.

They must not hide the policy being tested.

---

## End-to-End Authorization Tests

Critical flows may require end-to-end tests proving that the full trusted boundary rejects unauthorized clients.

For example:

```text
web/client request
    ↓
API
    ↓
403 / safe not-found response
```

Unit policy tests alone do not prove transport integration is correct.

---

## Authorization in Development

Development environments must not disable authorization by default.

Developers should exercise realistic authorization behavior.

Convenience mechanisms may create test identities with explicit roles.

They must not bypass the authorization architecture itself.

---

## Authorization Bypass

A generic development flag such as:

```text
AUTHORIZATION_DISABLED=true
```

is dangerous.

If any bypass capability exists, it must be:

```text
strongly isolated
impossible to enable accidentally in production
explicitly tested
```

Prefer realistic development identities over bypassing policy.

---

## Superuser Development Accounts

Development may use a synthetic administrative account.

This is safer than disabling authorization globally.

Developers should still test ordinary and denied access paths.

---

## Authorization and Error Handling

Authorization failures should follow:

- [docs/architecture/error-handling.md](../architecture/error-handling.md)

The public response should preserve safe semantics.

Internal policy diagnostics should remain separate.

---

## Authorization and Observability

Authorization systems should provide enough evidence to investigate security-relevant failures without creating excessive telemetry.

Useful signals may include:

```text
denial category
operation
actor type
tenant
resource type
```

with identifiers included only when permitted and operationally necessary.

---

## Security Monitoring

Patterns such as:

```text
many denied requests
cross-tenant access attempts
administrative endpoint probing
repeated resource enumeration
```

may indicate abuse.

Detection should be introduced based on real security requirements.

---

## Authorization and Data Classification

Authorization design should account for data sensitivity.

For example, exporting `CONFIDENTIAL` information may require a stronger permission than viewing a single record.

Access to `RESTRICTED` information should require exceptional policy.

---

## Authorization Documentation

Authorization documentation should explain:

```text
principal model
roles
permissions
scope
tenant model
policy ownership
administrative capabilities
```

without duplicating machine-readable policy definitions unnecessarily.

---

## Generated Authorization Documentation

If roles and permissions become machine-readable, Orion should generate reference documentation where practical.

Potential generated output may include:

```text
role
permissions
scope
owner
description
```

This helps humans and AI agents discover the authorization model.

---

## Machine-Readable Authorization Model

A future canonical authorization registry may define concepts such as:

```text
permissions
roles
scope
ownership
policy metadata
```

Example:

```text
permission: orders.cancel
owner: orders
description: Cancel an eligible order.
risk: normal
```

The exact representation will depend on the selected stack.

---

## Mechanical Enforcement

Future tooling may enforce rules such as:

```text
protected operations must declare authorization policy

unknown permissions are invalid

role definitions reference valid permissions

client applications cannot define authoritative permissions

administrative operations require explicit policy

tenant-owned queries require tenant scope

security-sensitive fields cannot be modified through generic update contracts
```

The exact mechanisms will depend on architecture and tooling.

---

## Static Analysis

Static analysis may eventually detect patterns such as:

```text
hardcoded role checks
unprotected privileged endpoints
direct authorization-field updates
client-trusted user IDs
```

Mechanical checks should target high-value violations rather than attempt to infer all business policy.

---

## Policy Coverage

It may eventually be useful to validate that exposed protected operations have an associated authorization declaration.

For example:

```text
endpoint
    ↓
declares required operation/policy
```

This should be introduced if the selected architecture supports it cleanly.

---

## AI Agent Requirements

AI agents must not introduce authorization logic casually.

Before implementing access control, an agent should determine:

```text
actor
operation
resource
policy owner
tenant scope
existing permissions
existing roles
information-disclosure implications
```

An agent must not resolve authorization uncertainty by granting broader access.

---

## AI-Assisted Security Review

Machine-readable policies may eventually allow AI agents to inspect questions such as:

```text
Which endpoints modify user roles?

Which operations can support agents perform?

Can one tenant reach another tenant's records?

Which roles grant billing export?
```

Such analysis should rely on canonical policy definitions and tests rather than guesswork.

---

## New Permission Checklist

Before creating a permission, answer:

1. What operation does it authorize?
2. Which domain owns it?
3. Who should receive it?
4. What scope does it have?
5. Does an existing permission already cover the capability?
6. Is it public, administrative, or security-sensitive?
7. How will it be tested?
8. Does it require audit logging?
9. Does it affect confidential or restricted data?
10. How will it be documented?

If these questions cannot be answered, the permission is not ready.

---

## New Role Checklist

Before creating a role, answer:

1. What real responsibility does the role represent?
2. Which permissions should it grant?
3. What scope does it have?
4. Who may assign it?
5. Can it be revoked immediately?
6. Is the role tenant-specific or global?
7. Does it include privileged operations?
8. Does it overlap with existing roles?
9. How will changes to the role affect existing users?
10. How will it be tested?

---

## New Authorization Policy Checklist

Before creating a policy, answer:

1. Which operation is protected?
2. Which actor types may perform it?
3. Which resource is involved?
4. Does ownership matter?
5. Does tenant membership matter?
6. Does resource state matter?
7. Does authentication assurance matter?
8. What information may a denied actor safely learn?
9. What must be audited?
10. How will both allow and deny paths be tested?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### UI-Only Authorization

```text
button hidden
```

without trusted backend enforcement.

Prohibited.

---

### Trusting Client Roles

```text
request.role == "admin"
```

treated as authoritative.

Prohibited.

---

### Trusting Resource Identifier Possession

```text
actor knows resource ID
    ↓
actor may access resource
```

Prohibited.

---

### Scattered Role Checks

```text
if role == admin
```

throughout unrelated modules.

Avoid.

---

### Default Allow

Prohibited for security-sensitive access.

---

### Generic Admin Bypass

A single undocumented bypass around normal policies.

Strongly discouraged.

---

### Cross-Tenant Query Without Scope

Prohibited where tenant isolation is required.

---

### Mass Assignment of Security Fields

Prohibited.

---

### Feature Flag as Security

Prohibited.

---

### Client Capability Hint as Authority

Prohibited.

---

### Stale Token Role Assumed Forever

Avoid.

Authorization freshness must be explicit.

---

### Shared Authorization Logic Across Clients as Security

Client-shared policy may improve UX.

It must not replace trusted enforcement.

---

### Authorization by Obscurity

Hidden routes, unpredictable IDs, or undocumented endpoints are not authorization controls.

---

### Silent Privilege Expansion

Changing an existing role to grant substantially broader access without explicit review.

Avoid.

---

## Initial Authorization Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Authorization and authentication are separate concerns.
2. Authorization must be enforced at trusted boundaries.
3. Authorization should default to deny.
4. Client-provided roles, permissions, user IDs, and tenant IDs are not authoritative.
5. UI visibility does not enforce authorization.
6. Protected operations should have identifiable authorization ownership.
7. Roles should represent meaningful responsibilities.
8. Permissions should represent meaningful capabilities.
9. Hardcoded role checks scattered through application code should be avoided.
10. Multi-tenant systems must enforce tenant isolation explicitly.
11. Possession of a resource identifier does not grant access.
12. Read operations require authorization just as write operations do.
13. Administrative capabilities require explicit policy.
14. Machine actors require authorization as well as authentication.
15. AI agents must operate under explicit delegated capability.
16. Authorization changes are security-sensitive and require tests.
17. Both allow and deny paths must be tested.
18. Security-sensitive authorization bugs should receive regression tests.
19. Authorization data must preserve strong integrity.
20. Authorization policy should become machine-readable and mechanically enforceable where practical.

---

## Future Implementation Decisions

The following decisions are intentionally deferred:

```text
authorization library
policy engine
RBAC / ABAC / ReBAC model
permission registry format
role storage
tenant model
policy location
authorization caching
authorization claim strategy
database row-level security
administrative role model
AI-agent delegation model
```

These decisions should follow actual product and domain requirements.

Significant decisions should be documented through ADRs.

---

## Future Documentation

This document should eventually be complemented by:

- [docs/security/production-access.md](production-access.md)
- [docs/security/incident-response.md](incident-response.md)
- [docs/security/data-retention.md](data-retention.md)
- [docs/api/principles.md](../api/principles.md)
- [docs/database/principles.md](../database/principles.md)
- [docs/database/transactions-and-concurrency.md](../database/transactions-and-concurrency.md)

Application-specific authorization documentation should reference this policy rather than independently redefine the security model.

---

## Summary

Authorization determines whether an actor may perform an operation.

The fundamental model is:

```text
trusted actor
    +
operation
    +
resource
    +
context
        ↓
authorization policy
        ↓
allow / deny
```

Orion prefers:

```text
default deny over implicit access

capabilities over scattered role checks

trusted identity over client claims

explicit tenant scope over assumed isolation

least privilege over broad access

server enforcement over UI enforcement

testable policy over hidden conditionals
```

Authorization is not:

```text
authentication
UI visibility
resource obscurity
feature flags
possession of an identifier
```

A user can be authenticated and still be unauthorized.

A client can hide an action and still be insecure.

A permission model that cannot explain why access was granted is difficult to trust.

Orion authorization should remain explicit, testable, auditable where necessary, and increasingly mechanically enforceable as the system evolves.
