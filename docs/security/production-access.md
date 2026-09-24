# Production Access

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0011](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Access Request](#access-request)
- [Approval](#approval)
- [Break-Glass Access](#break-glass-access)
- [Manual Data Changes](#manual-data-changes)
- [AI-Executed Production Changes](#ai-executed-production-changes)
- [Destructive Operations](#destructive-operations)

Related policy: [incident response](incident-response.md), [README](../runbooks/README.md).

## Purpose

This document defines the production-access principles used by Orion.

Its goals are to ensure that access to production systems is:

- intentional;
- least-privileged;
- time-bounded where practical;
- attributable;
- auditable;
- revocable;
- resistant to routine overexposure;
- appropriate to data classification;
- understandable by humans and AI agents;
- compatible with future automated enforcement.

Production access is a privileged capability.

It must not become the default workflow for development, debugging, support, or routine administration.

This document is technology-agnostic.

Specific identity providers, cloud IAM systems, database access mechanisms, bastions, VPNs, privileged-access platforms, session recording tools, and approval workflows will be selected later through explicit architectural decisions.

This document complements:

- [docs/security/authentication.md](authentication.md);
- [docs/security/authorization.md](authorization.md);
- [docs/security/secrets-management.md](secrets-management.md);
- [docs/security/data-classification.md](data-classification.md);
- [docs/security/telemetry-redaction.md](telemetry-redaction.md);
- [docs/reliability/observability.md](../reliability/observability.md);
- [docs/database/principles.md](../database/principles.md).

---

## Core Principle

Production access should be the minimum capability required, granted to the minimum actor, for the minimum time necessary.

The intended model is:

```text
operational need
    ↓
authorized identity
    ↓
approved production capability
    ↓
time-bounded access
    ↓
audited action
    ↓
automatic expiration / explicit revocation
```

Long-lived unrestricted human production access should be avoided.

---

## Production Is a Separate Trust Boundary

Production should be treated as a distinct trust boundary from:

```text
development
local environments
CI
test
staging
preview environments
```

Access to non-production does not imply production access.

---

## Human Access Is Exceptional

Normal system operation should rely on:

```text
application identities
service identities
deployment automation
approved operational tooling
```

rather than direct human interaction with production systems.

Humans should access production when a real operational need exists.

---

## Routine Work Must Not Require Production Access

The architecture should make normal work possible without production access.

Examples include:

```text
local development
automated tests
staging validation
synthetic data inspection
generated documentation
telemetry-based debugging
```

If everyday development routinely requires production access, the architecture or tooling is insufficient.

---

## Access Must Have Purpose

Every production-access capability should exist for a defined operational purpose.

Examples may include:

```text
incident investigation
controlled data repair
deployment operation
security response
database administration
support escalation
```

Avoid generic:

```text
production access
```

as one undifferentiated permission.

---

## Least Privilege

An actor should receive only the capabilities required for the task.

Privileges may differ across:

```text
read
write
admin
secret access
deployment
database operations
telemetry
infrastructure
```

A user who needs logs should not automatically receive database write access.

---

## Privilege Dimensions

Production access should be considered across several dimensions:

```text
system
resource
operation
environment
time
data classification
```

For example:

```text
read production logs
```

is a different capability from:

```text
modify production database
```

---

## Separate Roles

Production privileges should be separated where practical.

Potential concepts include:

```text
production observer
production operator
database reader
database operator
deployment operator
security administrator
secret administrator
```

The exact roles are deferred.

Avoid one universal production administrator role for routine use.

---

## Read Access vs Write Access

Read access is generally lower risk than write access.

It is not risk-free.

Read access may still expose:

```text
personal data
business-sensitive data
security metadata
system topology
```

Therefore read permissions must also follow least privilege.

---

## Write Access

Production write access can alter durable state.

It should require stronger controls than ordinary read access.

Potential examples include:

```text
database modification
configuration change
feature activation
queue manipulation
manual job execution
```

---

## Administrative Access

Administrative privileges should be more restricted than ordinary operational access.

Examples include:

```text
changing IAM roles
rotating secrets
modifying audit configuration
granting production access
altering security policy
```

These capabilities can affect the security model itself.

---

## Security Administration

A user who can grant production permissions should not automatically possess every production capability.

Permission administration and resource administration should be separable where practical.

---

## Access to Secrets

Access to production resources does not imply access to raw production secrets.

For example:

```text
deploy application
```

should not necessarily allow:

```text
view database password
```

Systems should prefer delegated use over secret disclosure.

---

## Delegated Secret Use

Where infrastructure permits, a person or automation should be able to perform an authorized operation without learning the underlying credential.

Examples include:

```text
assume role
temporary database credential
workload identity
signed deployment action
```

This reduces secret exposure.

---

## Named Identities

Production access must use attributable identities.

Avoid shared accounts such as:

```text
admin
root-team
shared-db-user
operations
```

for human access.

Every action should be attributable to a specific actor.

---

## Shared Credentials

Shared human credentials are strongly discouraged.

They weaken:

```text
auditability
revocation
accountability
incident investigation
```

---

## Service Accounts

Service identities are appropriate for automation.

They should not be reused by humans for convenience.

Human and machine identities should remain distinct.

---

## Impersonating Automation

A person should not normally log in as:

```text
deployment service account
worker identity
CI identity
```

to perform manual work.

Use a dedicated human operational identity with appropriate delegated capabilities.

---

## Strong Authentication

Production access should require strong authentication appropriate to risk.

Potential controls may include:

```text
MFA
passkeys
hardware-backed credentials
step-up authentication
recent authentication
```

The exact mechanism depends on the selected identity platform.

---

## Reauthentication

Sensitive operations may require recent authentication even when a user already has an active session.

Examples may include:

```text
granting privilege
accessing restricted data
revealing a secret
initiating destructive operation
```

---

## Just-In-Time Access

Human production access should be time-bounded where practical.

The preferred model is:

```text
no standing privilege
    ↓
request access
    ↓
grant temporary capability
    ↓
perform operation
    ↓
automatic expiration
```

This is often called just-in-time access.

---

## Standing Access

Standing production access should exist only where operational requirements justify it.

Examples may include:

```text
on-call responders
platform operators
security responders
```

Even then, privileges should remain narrow.

---

## Standing Administrative Access

Permanent broad administrative access should be minimized aggressively.

If standing high privilege exists, its rationale should be documented and reviewed periodically.

---

## Access Duration

Temporary grants should have an explicit expiration.

The duration should reflect the expected task.

Avoid access grants that remain active indefinitely because expiration was inconvenient.

---

## Automatic Expiration

Temporary privileges should expire automatically where infrastructure supports it.

Human memory should not be the primary revocation mechanism.

---

## Access Request

A production-access request should identify enough context to justify the grant.

Potential fields include:

```text
actor
resource
requested capability
reason
duration
related incident or work item
```

The exact workflow is deferred.

---

## Approval

Higher-risk access may require approval.

Approval may depend on:

```text
requested privilege
data classification
destructive capability
incident urgency
```

Not every read-only diagnostic action needs the same workflow as unrestricted database administration.

---

## Self-Approval

High-risk access should not rely entirely on unrestricted self-approval where organizational scale permits separation.

For very small teams, compensating controls such as strong auditability may be necessary.

---

## Small-Team Reality

Orion may initially be operated by a very small number of people.

The policy should remain structurally sound even when:

```text
requester
approver
responder
```

may temporarily be the same individual.

Automation, time limits, and auditability remain valuable.

---

## Break-Glass Access

Break-glass access exists for exceptional emergencies where normal access mechanisms are insufficient.

Examples may include:

```text
identity provider unavailable
critical authorization system failure
urgent incident requiring unavailable privilege
```

Break-glass access should be rare.

---

## Break-Glass Properties

Break-glass access should be:

```text
strongly protected
highly privileged only as necessary
auditable
time-limited where possible
monitored
reviewed after use
```

---

## Break-Glass Is Not Convenience

Break-glass must not become:

```text
the faster way to access production
```

If normal access is too difficult for routine legitimate needs, improve the normal workflow.

---

## Break-Glass Credentials

If emergency credentials exist, they should follow:

- [docs/security/secrets-management.md](secrets-management.md)

They should not be stored in:

```text
source control
personal notes
chat messages
ordinary password managers without policy
```

unless the selected emergency-access architecture explicitly permits the storage mechanism.

---

## Break-Glass Notification

Break-glass use should generate immediate or near-immediate visibility to appropriate operators where practical.

The goal is not punishment.

The goal is awareness that an exceptional control path was used.

---

## Break-Glass Review

Every break-glass use should be reviewed afterward.

Questions include:

```text
Why was it necessary?

Was the scope appropriate?

Did normal controls fail?

Should tooling or runbooks improve?

Were any credentials exposed?
```

---

## Production Database Access

Direct production database access is high risk.

It should not be the normal way to:

```text
debug application behavior
view user state
modify records
perform support tasks
```

Prefer application-aware operational tooling where possible.

---

## Database Read Access

Read-only database access may be useful for:

```text
incident investigation
data verification
controlled operational analysis
```

It should use a credential or role that cannot modify data.

---

## Read-Only Is Not Harmless

A database read role may still expose:

```text
CONFIDENTIAL
RESTRICTED
personal
financial
authentication-related
```

data.

Read access must consider classification and scope.

---

## Database Write Access

Human database write access should be strongly restricted.

Manual changes bypass:

```text
application validation
domain rules
audit behavior
event publication
normal authorization
```

and can violate system invariants.

---

## Manual Data Changes

Production data corrections should prefer:

```text
reviewed repair script
application-aware administrative operation
controlled migration
reconciliation workflow
```

over ad hoc SQL.

---

## Ad Hoc SQL Writes

Commands such as:

```text
UPDATE ...
DELETE ...
INSERT ...
```

executed manually against production should be exceptional.

When necessary, they should be:

```text
reviewed
scoped
auditable
verified
recoverable where practical
```

---

## Data Repair

A production data repair should define:

```text
affected records
expected invariant
repair operation
validation
failure handling
rollback or forward recovery
```

Large or high-risk repairs should use dedicated tooling.

---

## Repair Scripts

Operational repair scripts should preferably live in the repository when they are reusable or significant.

This provides:

```text
review
history
testing
repeatability
```

They must still avoid becoming unrestricted permanent admin interfaces.

---

## One-Off Repairs

A truly one-off repair may still require preservation of the exact procedure used when the operation is significant.

The appropriate artifact may be:

```text
script
incident record
runbook
migration
```

depending on context.

---

## Database Credentials

Production runtime, migration, and human-access credentials should remain separate.

Conceptually:

```text
runtime role
    → normal application privileges

migration role
    → schema evolution privileges

human read role
    → controlled diagnostics

human admin role
    → exceptional operations
```

---

## Migration Access

Migration privileges are often broader than runtime privileges.

They should not be used by the application during normal operation.

---

## Production Shell Access

Direct shell access to production hosts should be avoided where modern infrastructure provides safer alternatives.

If shell access exists, it should be:

```text
authenticated
attributable
time-bounded where practical
auditable
```

---

## Immutable Infrastructure

Where infrastructure is designed to be immutable, operators should prefer:

```text
change repository
build artifact
deploy replacement
```

over modifying a running host manually.

---

## SSH Access

SSH or equivalent host access should not be enabled merely out of habit.

Its need should follow the hosting model.

If enabled, it becomes a privileged production interface requiring strong controls.

---

## Container Shell Access

Opening a shell inside a production container can expose:

```text
environment variables
mounted secrets
network access
application memory
```

and should be treated as privileged access.

---

## Filesystem Access

Production filesystem access may reveal:

```text
temporary files
cached user data
logs
configuration
secrets
```

Access must remain scoped.

---

## Process Memory

Debugging process memory or heap dumps is highly sensitive.

Memory may contain:

```text
tokens
credentials
personal data
application payloads
```

Such diagnostics require explicit security review and restricted handling.

---

## Core Dumps

Core dumps and crash dumps should be treated as highly sensitive artifacts.

They must not be uploaded or shared casually.

---

## Production Telemetry Access

Logs, traces, metrics, and error reports are production data surfaces.

Access to telemetry should follow least privilege.

---

## Logs

Logs may contain:

```text
resource identifiers
actor identifiers
system topology
operational context
```

even when redaction is correct.

Log access should not automatically include database or secret access.

---

## Traces

Traces may reveal:

```text
internal architecture
operation timing
resource identifiers
dependency topology
```

They should be accessible only to appropriate operational users.

---

## Error Reports

Error reports may contain:

```text
stack traces
safe runtime context
user IDs
internal error causes
```

They may require stronger access control than ordinary metrics.

---

## Metrics

Metrics are generally less sensitive than logs and traces.

They can still reveal:

```text
traffic levels
business volume
capacity
service topology
```

and should not automatically be public.

---

## Observability Role Separation

An operator may need:

```text
read observability
```

without:

```text
write production data
```

This should be an easy access pattern.

---

## Secret Management Access

Viewing, creating, rotating, or revoking secrets are separate privileged actions.

A user able to deploy an application should not automatically be able to reveal all secret values.

---

## Secret Viewing

Where infrastructure allows:

```text
use secret
```

without:

```text
reveal secret
```

prefer the former.

---

## Secret Rotation

Secret rotation may require elevated access.

Rotation workflows should minimize exposure of both old and new secret values.

---

## Cloud Console Access

Cloud-provider console access should use named identities and narrow roles.

Avoid granting broad:

```text
owner
administrator
```

permissions as default operational roles.

---

## Root / Owner Accounts

Provider root or account-owner credentials should be treated as break-glass capabilities.

They should not be used for routine work.

---

## Infrastructure Write Access

Changing infrastructure may affect:

```text
networking
identity
storage
database
availability
```

Infrastructure write access is high privilege.

Changes should normally flow through reviewed infrastructure-as-code where that exists.

---

## Manual Infrastructure Changes

Manual provider-console changes should be exceptional once infrastructure is repository-managed.

If an emergency change occurs, repository state must be reconciled afterward.

---

## Deployment Access

Deployment capability can effectively change production code.

It is a powerful production privilege.

Access should be controlled independently from:

```text
database admin
secret admin
IAM admin
```

where practical.

---

## CI/CD Identity

Production deployment automation should use a dedicated machine identity.

It should have only the permissions required for deployment.

---

## Developer Deployment

Human developers should normally trigger or authorize controlled deployment automation rather than using local machine credentials to modify production directly.

---

## Production Configuration

Production configuration changes should follow controlled workflows.

Direct provider-console edits should be minimized where configuration can be versioned or managed declaratively.

---

## Dynamic Configuration

If dynamic configuration exists, changes should be:

```text
authorized
auditable
validated
```

especially when they materially alter production behavior.

---

## Feature Flags

Feature flags may alter production behavior without deploying code.

Flag mutation therefore requires production authorization appropriate to impact.

---

## High-Risk Flags

Flags controlling:

```text
security
billing
data deletion
authorization
critical workflow
```

may require stronger controls.

Feature flags are not harmless configuration.

---

## Production Support Access

Customer-support workflows should avoid broad production access.

Prefer specialized support capabilities that expose only the information and actions required.

---

## Support Tools

A support interface may provide:

```text
safe account lookup
bounded operational status
approved corrective action
```

without exposing raw database access.

---

## Support Impersonation

If support impersonation exists, it should follow authorization policy.

It must preserve:

```text
real support actor
effective user
reason
session duration
audit record
```

Impersonation should not hide the real operator.

---

## Data Export

Production data export is high risk.

Exports should use explicit authorized workflows rather than ad hoc database dumps.

---

## Database Dumps

Production database dumps contain broad data exposure.

They should not be downloaded casually for:

```text
debugging
local reproduction
development convenience
```

---

## Production Data in Development

Production data should not be copied into development environments by default.

Use:

```text
synthetic
anonymized
pseudonymized
minimized
```

data according to the use case.

---

## Screenshots

Screenshots of production systems can capture confidential information.

They should be treated as production data and minimized accordingly.

---

## Copy and Paste

Copying production values into:

```text
chat
issue
pull request
document
AI prompt
```

may create uncontrolled data propagation.

Only safe sanitized information should leave authorized production systems.

---

## AI Access to Production

AI agents should not receive unrestricted production access by default.

Any AI access should use:

```text
explicit delegated capability
least privilege
sanitized data
auditable identity
```

where supported.

---

## AI Identity

An AI-assisted operation should preserve:

```text
human principal
agent identity
delegated capability
action
```

where the platform supports this distinction.

---

## AI Must Not Possess Long-Lived Secrets

AI workflows should prefer delegated integrations over exposing raw production credentials.

Do not paste or inject production secrets into prompts merely to enable an agent to operate.

---

## AI and Restricted Data

Access to `RESTRICTED` data by AI should be exceptional and explicitly controlled.

Ordinary AI investigation should rely on:

```text
sanitized telemetry
safe metadata
synthetic reproduction
```

where possible.

---

## AI-Executed Production Changes

An AI agent should not receive broad autonomous production write capability simply because it can generate correct code.

Production mutations require the same authorization, review, audit, and safety controls as human actions.

---

## Automated Operations

Automation may perform production actions when:

```text
scope is explicit
preconditions are validated
operation is bounded
audit exists
failure handling is defined
```

Automation should reduce human risk, not bypass production controls.

---

## Operational Tooling

Prefer purpose-built production tools over raw unrestricted access.

Examples may include:

```text
retry failed job
rebuild projection
disable compromised session
rotate integration credential
inspect safe resource status
```

Each tool should expose only necessary capability.

---

## Admin APIs

Administrative APIs are privileged production surfaces.

They require:

```text
strong authentication
authorization
auditability
bounded operations
safe input validation
```

They should not be hidden only through obscurity.

---

## Internal Does Not Mean Trusted

A production admin endpoint available only on an internal network still requires authorization appropriate to its risk.

Network location is defense in depth, not complete authorization.

---

## Auditability

Privileged production actions should produce an audit trail where appropriate.

The audit record should answer:

```text
who
did what
to which resource
when
through which capability
with what result
```

without recording restricted secret values.

---

## Audit vs Diagnostic Logs

Audit records and ordinary logs serve different purposes.

An audit record should not depend on debug log retention or sampling.

---

## Access Grant Audit

Production access grants should themselves be auditable.

Potential events include:

```text
access requested
access approved
access granted
access expired
access revoked
break-glass used
```

---

## Access Review

Standing production permissions should be reviewed periodically once the organization is large enough to make access drift likely.

Review should ask:

```text
Does this actor still need this privilege?
```

not merely:

```text
Was this permission originally approved?
```

---

## Joiner / Mover / Leaver Lifecycle

Production access should follow identity lifecycle.

Access should change when a person:

```text
joins
changes responsibility
leaves
```

Revocation should not depend on someone remembering individual systems manually.

---

## Immediate Revocation

Security incidents or role changes may require immediate privilege revocation.

The access system should support this without waiting for long-lived credentials to expire where practical.

---

## Access Through Groups

Role/group-based access is generally preferable to manually assigning many individual permissions.

Groups should represent real operational responsibilities.

Avoid generic:

```text
everyone-production
```

groups.

---

## Temporary Groups

Temporary incident or migration groups may be useful.

They should expire or be removed after the operation.

---

## Environment Separation

Production privileges should not be implied by lower-environment groups.

Example:

```text
database-admin-staging
```

should not automatically mean:

```text
database-admin-production
```

---

## Regional or Tenant Scope

If future systems require regional or tenant-scoped administration, permissions should be narrow enough to represent that boundary where practical.

Do not introduce this complexity before real requirements exist.

---

## Data Classification and Access

Data classification should influence access strength.

For example:

```text
INTERNAL
    → ordinary authorized production operations

CONFIDENTIAL
    → narrower need-to-know access

RESTRICTED
    → exceptional access
```

Exact access policy may vary by category.

---

## Field-Level Access

Some operational tools may expose only safe fields even when the underlying record contains restricted data.

This is preferable to granting broad row-level visibility when unnecessary.

---

## Data Masking

Masked production views may support operational tasks without exposing full values.

Examples may include:

```text
partial email
last four digits
credential prefix
```

only when the masked representation is appropriate and safe.

---

## Masking Does Not Declassify Automatically

Masked data may remain sensitive.

Classification depends on re-identification and usage risk.

---

## Search by Sensitive Value

Support and operational systems may sometimes need to locate a record using:

```text
email
phone
external identifier
```

The search capability should expose only the minimum result necessary.

Search input itself should not be logged indiscriminately.

---

## Query Tools

If production query tooling is provided, it should prefer:

```text
read-only
bounded result size
query timeout
auditability
safe export restrictions
```

over unrestricted database consoles.

---

## Result Limits

Operational queries should have reasonable limits to prevent:

```text
large accidental scans
mass data exposure
resource exhaustion
```

---

## Query Timeouts

Production query tools should use bounded execution time.

One investigative query should not degrade the production database.

---

## Resource Consumption

Production access policy includes protecting availability.

An authorized query can still be unsafe if it consumes excessive:

```text
CPU
memory
I/O
locks
connections
```

---

## Locking Risk

Manual database operations that can hold locks must be treated carefully.

Operational tooling should prefer safe read patterns and bounded transactions.

---

## Destructive Operations

High-risk actions such as:

```text
delete
truncate
drop
revoke broad access
purge queue
rotate signing key
```

should have stronger confirmation and authorization controls.

---

## Confirmation

Interactive confirmation can reduce accidental destructive actions.

It is not a substitute for authorization or review.

---

## Typed Confirmation

For especially dangerous operations, confirmation may require explicit resource identification.

Example:

```text
type the production environment name
```

This may reduce accidental context mistakes.

The exact UI pattern is deferred.

---

## Environment Visibility

Operational tools should make the current environment obvious.

Accidentally running a staging command in production should be difficult.

---

## Production Marking

Production environments should be visually and programmatically distinguishable from non-production environments.

This may include:

```text
environment label
different access workflow
different credentials
explicit command flag
```

---

## Command-Line Production Access

CLI tools should require explicit production selection.

Avoid commands where production is an implicit default.

---

## Safe Defaults

Production tooling should default to:

```text
read-only
dry-run
non-production
bounded scope
```

where practical.

Dangerous behavior should require explicit intent.

---

## Dry Run

Operations capable of previewing effects should support a dry-run mode where meaningful.

A dry run should show:

```text
scope
planned changes
validation errors
```

without performing mutation.

---

## Dry Run Limitations

A dry run cannot prove that later execution will encounter identical concurrent state.

It is a safety aid, not a transactional guarantee.

---

## Batch Operations

Production batch operations should define:

```text
scope
batch size
progress
failure handling
retry
resume
```

Large one-shot modifications increase risk.

---

## Idempotency

Operational production actions should be idempotent where practical.

This improves safety after:

```text
timeout
operator uncertainty
partial failure
retry
```

---

## Reconciliation

High-impact production workflows should have a way to verify final state.

Examples:

```text
count repaired rows
confirm queue drained
verify secret rotation
validate permissions
```

---

## Rollback

A production change should identify whether rollback is possible.

If rollback is unsafe, define forward recovery.

Do not claim rollback exists when irreversible state changes prevent it.

---

## Operational Change Records

Significant manual production changes should be traceable to:

```text
incident
ticket
change record
pull request
```

where appropriate.

The exact process should remain proportional to system maturity.

---

## Emergency Changes

Emergency production changes may bypass ordinary timing or approval steps.

They must not bypass:

```text
identity
auditability
safety
post-change reconciliation
```

unless the infrastructure itself has failed and break-glass is required.

---

## Repository Reconciliation

If production is changed manually outside repository-managed configuration, repository state should be updated afterward where applicable.

Production should not silently drift from the declared source of truth.

---

## Access to Backups

Production backups contain production data.

Access should generally be as restrictive as access to the original data.

A backup is not a less-sensitive copy.

---

## Restore Access

Restoring backups is a privileged destructive-capable operation.

It can overwrite production state.

Restore authorization should therefore be explicit.

---

## Backup Download

Downloading full backups to personal workstations should be avoided.

Use controlled restore and analysis environments where possible.

---

## Data Warehouses and Replicas

Read replicas or analytical copies may reduce production workload.

They do not automatically reduce data sensitivity.

Access policies should remain appropriate to the copied data.

---

## Production Search Indexes

Search indexes may contain significant copies of production content.

They should be treated as production data stores.

---

## Caches

Caches may contain sensitive production values.

Direct cache inspection should follow data-classification rules.

---

## Queues

Production queues may contain:

```text
user identifiers
job payloads
event data
```

Queue inspection is production-data access.

---

## Dead-Letter Queues

Dead-letter queues are especially sensitive because failed messages may contain unusual payloads.

Access should remain restricted and payloads should not be copied casually.

---

## Manual Message Replay

Replaying production messages can cause side effects.

Replay tools should consider:

```text
idempotency
duplicate delivery
current authorization
stale data
provider side effects
```

---

## Production API Keys

API keys used for operational tools are production credentials.

They should follow secret-management policy and should not be embedded in local scripts or shell history.

---

## Personal Devices

Production access from personal or unmanaged devices may create security risk.

Device-trust policy may be introduced when organizational requirements justify it.

This document does not select a specific device-management model.

---

## Session Duration

Privileged production sessions should be bounded.

Long-lived browser or shell sessions increase risk of unattended access.

---

## Idle Timeout

Privileged sessions may require shorter idle timeouts than ordinary application sessions.

The exact policy depends on access tooling.

---

## Concurrent Sessions

Highly privileged access systems may restrict or monitor concurrent sessions.

Introduce only if the risk model requires it.

---

## Session Recording

Some privileged-access systems support command or session recording.

This can improve auditability.

It also captures potentially sensitive information.

If used, retention and access controls must be explicit.

---

## Clipboard Controls

Some high-security environments restrict clipboard transfer.

Orion does not require this by default.

The principle remains:

```text
avoid uncontrolled extraction of production data
```

---

## Local Files

Temporary production exports on local filesystems should be avoided.

If unavoidable, they require:

```text
secure storage
minimal scope
explicit deletion
```

and appropriate classification.

---

## Temporary Artifacts

Operational artifacts should have a defined lifecycle.

Examples:

```text
query result
diagnostic bundle
database export
crash dump
```

Do not leave them indefinitely in shared or personal storage.

---

## Incident Access

During incidents, broader access may be justified temporarily.

The incident should not erase least-privilege principles.

Prefer expanding access only to what the incident requires.

---

## Incident Commander

If a formal incident process exists later, an incident commander may coordinate access needs.

Access control itself should still be enforced by the authorized system.

---

## Production Debugging

Production debugging should prefer:

```text
logs
traces
metrics
error reports
safe diagnostic endpoints
```

before interactive shell or database access.

---

## Reproduction Before Mutation

Where practical:

```text
observe
reproduce safely
understand
then modify
```

rather than modifying production state while still diagnosing the issue.

---

## Remote Debuggers

Attaching an interactive debugger to production is highly invasive.

It may:

```text
pause execution
expose memory
change timing
modify runtime state
```

Use only with explicit operational justification.

---

## Profilers

Production profilers may be useful when designed for low overhead.

They can also capture:

```text
stack paths
runtime state
allocations
```

and require access controls.

---

## Diagnostic Bundles

If Orion later creates automated diagnostic bundles, they should be:

```text
sanitized
bounded
time-scoped
authorized
```

They should not become convenient production data dumps.

---

## Production Access Logging

The access system itself should emit safe operational evidence.

Potential events include:

```text
production_access.granted
production_access.revoked
production_access.expired
break_glass.used
privileged_operation.executed
```

The exact event model is deferred.

---

## Authentication Logs

Authentication activity for production-access systems may be security-relevant.

Failures should be monitored according to the threat model.

---

## Failed Privileged Access Attempts

Repeated failed privileged access attempts may warrant security monitoring.

They should not expose attempted credentials in telemetry.

---

## Authorization Denials

Denied production operations may contribute to security telemetry.

A normal accidental denial does not necessarily require alerting.

---

## Privilege Escalation

Changes that grant greater production capability should be auditable.

Unexpected or unauthorized escalation is security-significant.

---

## Access Anomalies

Future monitoring may consider:

```text
unusual privileged access time
unexpected environment
unusual resource
break-glass use
```

Only introduce anomaly detection when it provides reliable value.

---

## Production Access and Alerting

Privileged actions may generate alerts when:

```text
break-glass used
critical role changed
restricted secret revealed
unexpected privilege escalation occurred
```

Routine authorized read access should not necessarily notify everyone.

---

## Production Access and Retention

Audit records of privileged access may require longer retention than ordinary diagnostic logs.

The exact retention policy belongs in:

- [docs/security/data-retention.md](data-retention.md)

---

## Production Access and Incident Response

Misuse or suspected compromise of production access should follow:

- [docs/security/incident-response.md](incident-response.md)

Likely actions may include:

```text
revoke sessions
revoke credentials
preserve audit evidence
assess affected resources
rotate secrets
```

---

## Access Failures Should Fail Closed

If the authorization system cannot determine that privileged access is allowed, the operation should normally be denied.

Production access must not default to allow because the access-control dependency is unavailable.

---

## Access System Availability

Privileged access systems are operational dependencies.

Their outage may prevent administrative work.

This is generally safer than silently bypassing authorization.

Break-glass may provide an explicit emergency path.

---

## Offline Emergency Access

If an emergency access mechanism is designed to work when primary identity systems are unavailable, its controls must be particularly strong.

This is a future infrastructure decision.

---

## Production Access Documentation

The repository should eventually document:

```text
available production roles
how temporary access is requested
how break-glass works
how access is revoked
which operations are audited
```

once actual infrastructure exists.

Do not document fictional provider-specific procedures before selection.

---

## Runbooks

High-risk production operations should have runbooks where repeated use is expected.

Examples may include:

```text
restore backup
repair failed migration
rotate compromised credential
replay failed jobs
revoke active sessions
```

---

## Runbook Access

Runbooks should describe:

```text
required role
preconditions
safe commands/actions
verification
rollback or recovery
```

They must not contain raw production secrets.

---

## AI Agent Requirements

Before requesting or using production access, an AI agent should determine:

```text
what task requires access
which resource is needed
whether read-only access is sufficient
which data classification is involved
whether safer telemetry or tooling can answer the question
```

---

## AI Must Prefer Lower Privilege

An AI agent should prefer:

```text
metrics
logs
traces
safe read-only query
```

before requesting:

```text
database write
shell
secret reveal
administrator role
```

---

## AI and Production Data

An AI agent must not copy production data into ordinary:

```text
chat
issue
document
test fixture
source code
```

to simplify reasoning.

Use sanitized or synthetic representations.

---

## AI and Write Operations

Before proposing a production mutation, an AI agent should identify:

```text
scope
preconditions
side effects
idempotency
recovery
verification
```

---

## AI and Ad Hoc SQL

An AI agent should not casually generate production write SQL as the preferred operational workflow.

It should first consider:

```text
admin operation
repair script
migration
application workflow
```

that preserves invariants.

---

## AI and Break-Glass

An AI agent must not recommend break-glass simply because normal access requires additional steps.

Break-glass is for failure of the normal control path or genuine emergency.

---

## AI and Secret Exposure

An AI agent should prefer delegated access mechanisms and secret references.

It must not ask for raw production credentials when the task can be performed without revealing them.

---

## AI and Auditability

AI-assisted production operations should remain attributable.

If an agent acts on behalf of a human, the resulting action should preserve that relationship where tooling supports it.

---

## AI and Confirmation

Destructive production actions should receive appropriate explicit human authorization according to the operational tooling.

Automation must not infer approval from ambiguous context.

---

## AI and Access Removal

An AI agent should not assume temporary production access is no longer needed solely because one command finished.

Access lifecycle should follow the explicit grant and automatic expiration model.

---

## New Production Role Checklist

Before creating a production role, answer:

1. Which operational responsibility requires it?
2. Which resources does it need?
3. Which actions must it perform?
4. Which actions must it not perform?
5. Does it expose confidential or restricted data?
6. Can permissions be narrower?
7. Is the role for humans or machines?
8. Is standing access necessary?
9. Can access be just-in-time?
10. How will actions be audited?
11. Who owns the role?
12. How will access be reviewed and revoked?

---

## Production Access Request Checklist

Before granting production access, answer:

1. Who is requesting access?
2. What task requires it?
3. Which environment?
4. Which resource?
5. What minimum capability is needed?
6. Is read-only sufficient?
7. Is the requested duration appropriate?
8. Is stronger approval required?
9. Does the task involve restricted data?
10. Is a safer operational tool available?
11. What record should link the access to the work?
12. When will access expire?

---

## Production Data Repair Checklist

Before modifying production data manually or through repair tooling, answer:

1. What invariant is currently violated?
2. Which records are affected?
3. What is the canonical desired state?
4. Why can the normal application workflow not perform the repair?
5. Will the repair trigger required side effects?
6. Is the operation idempotent?
7. Is a dry run available?
8. How will concurrency be handled?
9. How will the result be verified?
10. Can the operation be rolled back?
11. If not, what is the forward recovery plan?
12. How will the exact action be audited?

---

## Break-Glass Checklist

Before using break-glass access, answer:

1. What emergency exists?
2. Why is the normal access path insufficient?
3. Which minimum emergency privilege is required?
4. Who is responsible for the action?
5. How long should access remain active?
6. What audit evidence will be generated?
7. Who should be notified?
8. What credentials or systems may be exposed?
9. How will access be revoked afterward?
10. What post-use review is required?

---

## Production Query Checklist

Before running a direct production query, answer:

1. Can telemetry answer the question instead?
2. Is read-only access sufficient?
3. Which tables or resources are required?
4. What data classification is involved?
5. Can the query use a replica or safe operational view?
6. Is the query bounded?
7. Does it have a timeout?
8. Could it acquire expensive locks?
9. Could results expose unnecessary records?
10. Will query text or parameters enter telemetry?
11. How will temporary results be handled?

---

## Destructive Operation Checklist

Before a destructive production operation, answer:

1. What exactly will change?
2. What is the maximum affected scope?
3. Can the scope be reduced?
4. Is there a dry-run or preview?
5. Is the operation reversible?
6. What backup or recovery mechanism exists?
7. Which approval is required?
8. What happens if execution stops halfway?
9. How will success be verified?
10. What audit event records the operation?
11. What downstream side effects can occur?
12. Can the operation be made idempotent?

---

## Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

### Everyone Is Production Admin

Prohibited.

---

### Shared Human Production Account

Avoid.

---

### Permanent Broad Admin Access

Avoid.

---

### Developer Uses Runtime Service Credential

Avoid.

---

### Runtime Uses Migration Credential

Prohibited.

---

### Read Access Assumed Harmless

Avoid.

---

### Direct Database Write as Routine Support Workflow

Avoid.

---

### Production Database Dump Used for Local Development

Prohibited by default.

---

### Production Secret Pasted Into Chat

Prohibited.

---

### Secret Reveal Required for Ordinary Deployment

Avoid.

---

### Production Shell as First Debugging Step

Avoid.

---

### Manual Infrastructure Change Without Reconciliation

Avoid.

---

### Break-Glass Used for Convenience

Prohibited.

---

### Production as Default CLI Environment

Prohibited.

---

### Health or Debug Endpoint Exposes Admin Capability Without Authorization

Prohibited.

---

### Support Agent Gets General Database Access

Avoid.

---

### AI Agent Receives Permanent Broad Production Credential

Prohibited.

---

### Audit Trail Depends on Developer Memory

Avoid.

---

### Temporary Access With No Expiration

Avoid.

---

### Manual Data Repair With No Verification

Avoid.

---

### Production Query With Unbounded Result

Avoid.

---

### Copy Production Data Into Test Fixtures

Prohibited by default.

---

## Initial Production Access Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Production is a distinct trust boundary.
2. Human production access should be exceptional rather than the normal development workflow.
3. Production privileges must follow least privilege.
4. Human and machine identities must remain distinct.
5. Shared human production credentials should be avoided.
6. Read, write, administrative, deployment, secret, and observability access should remain separable where practical.
7. Human production access should be time-bounded and just-in-time where practical.
8. Standing broad administrative access should be minimized.
9. Break-glass access must be exceptional, auditable, and reviewed after use.
10. Production runtime, migration, human-read, and human-admin database privileges should remain distinct.
11. Manual production database writes should be exceptional and should preserve invariants through reviewed operational mechanisms.
12. Production telemetry is privileged data and requires access control.
13. Production data must not be copied into development environments by default.
14. Production secrets must not be exposed merely to enable routine operations.
15. Privileged actions should be attributable to named identities and auditable where appropriate.
16. Operational tooling should prefer safe bounded capabilities over unrestricted shells and database consoles.
17. Production should never be the implicit default target for destructive tooling.
18. AI-assisted production access must use explicit delegated capabilities and must not rely on broad long-lived credentials.
19. Production-access failures should fail closed rather than silently bypass authorization.
20. Production roles, temporary grants, privileged operations, and break-glass usage should become mechanically auditable where practical.

---

## Future Implementation Decisions

The following decisions are intentionally deferred:

```text
identity provider
cloud IAM model
production role definitions
just-in-time access mechanism
approval workflow
break-glass mechanism
database access tooling
bastion or private network strategy
production query tooling
session recording
device trust requirements
production access review cadence
privileged access alerting
```

These choices should follow actual infrastructure, organizational size, compliance requirements, and selected cloud/platform tooling.

Significant choices should be captured through ADRs.

---

## Future Documentation

This document should be complemented by:

```text
docs/security/data-retention.md
docs/security/incident-response.md

docs/runbooks/
```

Provider-specific production-access procedures should be documented only after infrastructure and identity systems are selected.

---

## Summary

Production access is a privileged capability, not a routine convenience.

The intended model is:

```text
real operational need
        ↓
named authenticated identity
        ↓
minimum required privilege
        ↓
time-bounded access
        ↓
audited operation
        ↓
verification
        ↓
expiration / revocation
```

Orion prefers:

```text
observability over direct inspection

read-only over write

purpose-built operational tools over unrestricted consoles

temporary access over standing privilege

delegated capabilities over revealed secrets

automation over repetitive manual administration

named identities over shared accounts

auditable operations over invisible production changes
```

Production should be understandable without being broadly accessible.

It should be operable without making unrestricted access normal.

A person who needs to diagnose a failure should not automatically gain the ability to alter production data.

A person who can deploy code should not automatically see every secret.

An AI agent that can reason about production should not automatically possess production authority.

Access should exist because the task requires it, and disappear when the task no longer does.
