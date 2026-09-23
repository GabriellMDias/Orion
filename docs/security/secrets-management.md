# Secrets Management

## Purpose

This document defines the secrets-management policy for Orion.

Its goals are to ensure that secrets are:

- created intentionally;
- stored only in approved systems;
- exposed only to authorized identities;
- provided only to runtimes that require them;
- never committed to source control;
- never intentionally included in telemetry;
- rotated when necessary;
- revocable;
- auditable where appropriate;
- removed when no longer required.

This document is technology-agnostic.

The specific secret-management platform and runtime integration mechanisms will be selected later through explicit architectural decisions.

This document complements:

- `docs/security/data-classification.md`;
- `docs/security/telemetry-redaction.md`;
- `docs/reliability/observability.md`;
- `docs/architecture/error-handling.md`.

---

## Core Principle

Secrets are capabilities.

Possession of a secret usually grants the ability to perform an action.

Examples include:

```text
database password
    → access database

API key
    → call external provider

signing key
    → create trusted signatures

session secret
    → affect authentication state
```

Therefore, secrets must be treated according to the capability they grant.

A secret is not merely another configuration value.

---

# What Is a Secret?

A secret is information whose confidentiality is required to preserve a security boundary or privileged capability.

Examples include:

```text
passwords
database credentials
API keys
OAuth client secrets
private cryptographic keys
signing keys
encryption keys
webhook secrets
session secrets
service credentials
private access tokens
recovery credentials
```

Secrets are classified as `RESTRICTED` unless a more specialized security policy applies.

---

# What Is Not Necessarily a Secret?

Some values may contain words such as `key`, `token`, or `identifier` without being confidential.

Examples may include:

```text
public cryptographic keys
publishable provider keys
client identifiers
resource identifiers
trace identifiers
public application IDs
```

Classification depends on whether possession of the value grants sensitive capability.

Names should make this distinction clear.

Prefer:

```text
publicKey
publishableKey
clientId
```

when the value is intentionally non-secret.

---

# Secrets vs Configuration

Configuration answers questions such as:

```text
Which environment is this?

Which provider is enabled?

What is the request timeout?

Which region should be used?
```

Secrets answer questions such as:

```text
Which credential grants access?

Which key can decrypt data?

Which token authenticates this service?
```

These concerns should remain conceptually separate.

A configuration system may reference a secret.

It should not require secrets to behave like ordinary configuration.

---

# Secret Ownership

Every secret should have an identifiable owner.

Ownership should answer:

- What capability does this secret grant?
- Which system created it?
- Which application requires it?
- Which environment does it belong to?
- Who may rotate it?
- How can it be revoked?
- What happens if it is compromised?
- When can it be deleted?

Unowned secrets tend to become permanent unmanaged credentials.

---

# Secret Scope

Secrets should be scoped as narrowly as practical.

Prefer:

```text
payment-api-production
    → payment provider production access
```

over:

```text
global-production-key
    → access to many unrelated systems
```

The smaller the capability, the smaller the impact of compromise.

---

# Environment Isolation

Secrets should be isolated between environments.

Prefer:

```text
development database credential
staging database credential
production database credential
```

over:

```text
one credential used everywhere
```

A development compromise must not automatically provide production access.

---

# Application Isolation

Different applications should not automatically share credentials.

For example:

```text
api
worker
web
mobile
desktop
```

have different trust levels and responsibilities.

If only `apps/api` requires database access, then:

```text
apps/api
    ✓ database credential
```

does not imply:

```text
apps/web
apps/mobile
apps/desktop
    ✓ database credential
```

Client applications must never receive server-only secrets.

---

# Service Identity

Where the platform supports identity-based authentication, prefer short-lived service identity over long-lived static secrets.

Conceptually:

```text
runtime identity
      ↓
authorized dynamically
      ↓
service access
```

may be preferable to:

```text
static credential stored indefinitely
```

This reduces secret distribution and rotation burden.

The exact mechanism depends on deployment infrastructure.

---

# Least Privilege

Secrets should grant only the minimum required capability.

A database credential should not automatically have:

```text
schema administration
user administration
backup administration
all-database access
```

if the application requires only:

```text
read/write access to application data
```

Provider credentials should follow the same principle.

---

# Separate Runtime and Administrative Credentials

Runtime credentials and administrative credentials should remain separate.

For example:

```text
application database credential
```

should not normally be the same as:

```text
migration administrator credential
```

or:

```text
database owner credential
```

Different capabilities should use different identities when the distinction provides meaningful protection.

---

# Human and Machine Credentials

Human access and application access should be distinguishable.

Prefer:

```text
developer identity
service identity
CI identity
deployment identity
```

over shared credentials used by all actors.

Shared credentials weaken:

```text
auditability
revocation
least privilege
incident response
```

---

# Secret Storage

Secrets must be stored in systems designed to protect confidential credentials.

Potential mechanisms may include:

```text
operating-system credential stores
CI secret stores
cloud secret managers
dedicated secret-management systems
encrypted local secret stores
platform-managed workload identity
```

The final storage mechanism will depend on the environment.

Plaintext files are not an acceptable long-term production secret store.

---

# Source Control

Secrets must never be intentionally committed to Git.

This applies to:

```text
current files
old commits
branches
tags
fixtures
examples
documentation
generated files
```

Examples of prohibited committed content include:

```text
.env containing real credentials
private keys
access tokens
database passwords
provider secrets
production certificates with private keys
```

A private repository does not make source control an acceptable secret store.

---

# Private Repositories

Private repository visibility reduces exposure.

It does not change the classification of secrets.

Secrets committed to a private repository may still be exposed through:

```text
contributors
CI
backups
repository clones
third-party integrations
security incidents
future repository publication
```

Therefore:

```text
private repository
```

does not imply:

```text
safe place for credentials
```

---

# Secret Files

Files containing credentials should normally be excluded from source control.

Examples may include:

```text
.env
.env.local
credentials.json
private-key.pem
```

Repository ignore rules provide convenience.

They are not the primary security boundary.

Secret scanning and contributor discipline remain necessary.

---

# Configuration Templates

The repository may contain templates showing required secret names.

For example:

```text
DATABASE_URL=<required>
PAYMENT_PROVIDER_SECRET=<required>
```

Templates must never contain real secret values.

Examples should use obvious placeholders.

---

# Local Development

Local development must not require production credentials for routine work.

Prefer:

```text
local database
local services
sandbox providers
development credentials
mock integrations
```

where practical.

Production credentials should never become the easiest way to run the application locally.

---

# Developer Secrets

Developers may require local credentials for external development environments.

Such credentials should:

- be scoped to development;
- have minimal privileges;
- be individually attributable where practical;
- be revocable;
- not grant production access.

Local secrets must remain outside source control.

---

# Shared Development Credentials

Shared development credentials should be avoided when individual or workload identities are practical.

When shared credentials are necessary, they should have:

```text
limited privilege
limited environment scope
clear ownership
documented rotation
```

They must never be reused for production.

---

# Local Secret Injection

The exact development mechanism is deferred.

Possible future approaches may include:

```text
environment injection
local encrypted secret manager
OS credential store
development secret service
```

The mechanism should optimize for both security and usability.

Developers should not need unsafe manual copy-and-paste workflows for routine use.

---

# Environment Variables

Environment variables may be used as a delivery mechanism for secrets.

They are not themselves a secret-management system.

A secret placed in an environment variable can still leak through:

```text
process inspection
debug output
crash diagnostics
environment dumps
child processes
misconfigured CI
```

Therefore environment variables must still follow the complete secrets policy.

---

# Environment Dumps

Applications and tooling must never log or expose complete environment-variable collections.

Avoid:

```text
print(process.env)
```

or equivalents.

Safe diagnostics should use explicit allowlists of non-secret configuration.

---

# Command-Line Arguments

Secrets should not normally be passed directly through command-line arguments.

Arguments may become visible through:

```text
process listings
shell history
CI logs
diagnostic tooling
```

Prefer approved secret-delivery mechanisms.

---

# Shell History

Developers and operational tooling should avoid commands such as:

```text
tool --api-key actual-secret-value
```

when the shell may persist the value.

Secret-management workflows should minimize manual handling.

---

# Clipboard

Copying secrets through the clipboard creates additional exposure risk.

Routine secret management should not depend on repeated manual clipboard use.

Where manual access is necessary, minimize duration and scope.

---

# Filesystem Storage

Plaintext secrets should not be stored permanently in arbitrary local files.

If local secret files are necessary for tooling compatibility, they should:

```text
remain outside source control
have restrictive filesystem permissions
contain only environment-appropriate credentials
be documented
```

The preferred long-term approach should be a secure credential store where practical.

---

# Client Applications

Web, mobile, and desktop applications are not trusted locations for server secrets.

Any value delivered to a client must be treated as potentially accessible to the end user.

This applies even when the application is:

```text
compiled
minified
obfuscated
packaged
signed
```

Obfuscation does not create secrecy.

---

# Browser Applications

Anything included in browser-delivered code or configuration must be treated as public to the user.

Never embed:

```text
database credentials
private provider API keys
private signing keys
server tokens
```

in frontend bundles.

---

# Mobile Applications

Secrets compiled into mobile binaries must be considered recoverable.

Do not embed backend secrets in mobile applications.

Mobile applications may hold user-specific credentials when required, but storage must use appropriate platform security mechanisms.

---

# Desktop Applications

Desktop applications should also be considered user-controlled environments.

Compiled binaries, configuration files, and application memory may be inspected.

Do not embed privileged backend secrets.

---

# Publishable Credentials

Some external providers intentionally support client-visible credentials.

These values should be clearly classified as non-secret.

For example:

```text
publishableKey
```

should be distinguishable from:

```text
secretKey
```

Do not rely solely on provider terminology.

Document the actual security capability.

---

# CI Secrets

CI systems may require credentials for:

```text
dependency publishing
container registries
deployments
infrastructure
code signing
external test environments
```

CI secrets should be scoped to the minimum required jobs.

A test job should not automatically receive production deployment credentials.

---

# Pull Request Security

Pull requests from untrusted or less-trusted contexts must not automatically receive privileged secrets.

CI design must consider the possibility that contributed code can intentionally print, upload, or otherwise exfiltrate accessible credentials.

Secret access should depend on workflow trust.

---

# Forked Contributions

If external contributions are ever supported, workflows running contributed code must not receive privileged repository or production secrets by default.

The exact policy will depend on repository visibility and contribution model.

---

# Build Secrets

Build-time secrets require special care.

Anything embedded into a build artifact must be assumed accessible to whoever receives that artifact.

Build secrets should be used only during the build process and should not become part of:

```text
compiled binaries
container layers
source maps
generated code
package metadata
```

unless intentionally public.

---

# Container Images

Secrets must not be baked into container images.

Avoid:

```text
COPY .env /app/.env
```

or build arguments that remain recoverable from image history or layers.

Secrets should normally be supplied at runtime through approved mechanisms.

---

# Container Build Context

The build context should avoid including local secret files even if later build steps do not intentionally copy them.

Repository ignore and container-specific ignore files should reduce accidental inclusion.

---

# Infrastructure as Code

Infrastructure definitions may reference secret identifiers.

They must not contain plaintext secret values.

Prefer:

```text
secret reference
```

over:

```text
secret value
```

Infrastructure tooling must avoid printing secrets during plan or deployment output.

---

# Database Credentials

Database credentials should be environment-specific and least-privileged.

Possible identities may include:

```text
application runtime
migration tooling
read-only analytics
administration
backup
```

These identities should remain distinct where their responsibilities differ.

---

# Migration Credentials

Schema migrations may require stronger database privileges than ordinary application runtime.

If so, migration credentials should be delivered only to the migration process.

The normal application should not inherit elevated privileges merely because migrations require them.

---

# External Provider Credentials

Each provider credential should ideally be scoped according to:

```text
environment
application
capability
```

For example:

```text
production email sending
```

should not automatically grant:

```text
account administration
billing management
development access
```

when the provider supports more restrictive permissions.

---

# Webhook Secrets

Secrets used to authenticate inbound webhooks are `RESTRICTED`.

They should:

- be stored through approved secret mechanisms;
- be environment-specific;
- be rotatable;
- never appear in telemetry;
- be compared securely according to the protocol.

Webhook request payloads must not include the secret in diagnostic output.

---

# Cryptographic Keys

Private cryptographic keys are `RESTRICTED`.

Their handling requires additional care.

Potential uses include:

```text
signing
encryption
authentication
certificate identity
```

Different purposes should normally use different keys.

One key should not serve unrelated cryptographic responsibilities without explicit justification.

---

# Key Separation

Prefer separate keys for:

```text
encryption
signing
authentication
```

when these represent distinct security capabilities.

Key reuse increases the consequences of compromise and complicates rotation.

---

# Public and Private Keys

Public keys may generally be distributed according to their purpose.

Private keys must remain restricted.

The relationship should be explicit in naming and documentation.

---

# Secret Generation

Secrets should be generated using cryptographically secure mechanisms appropriate to their purpose.

Do not invent custom random-generation algorithms.

Generated secrets should have sufficient entropy to resist guessing.

Human-readable convenience must not weaken machine credentials.

---

# Human Passwords

User passwords are not application-managed secrets in the same sense as infrastructure credentials, but they remain `RESTRICTED`.

They must never be recoverable from storage.

Password storage policy will be defined with authentication architecture.

---

# Secret Rotation

Important secrets must be rotatable.

A system design that assumes a credential can never change creates long-term operational risk.

Rotation may be:

```text
scheduled
incident-driven
provider-required
personnel-driven
cryptographic-policy-driven
```

The required cadence depends on the secret and platform capabilities.

---

# Rotation Without Outage

Where practical, secret rotation should not require application downtime.

A common conceptual pattern is:

```text
old secret valid
new secret created
        ↓
consumers updated
        ↓
new secret verified
        ↓
old secret revoked
```

Some systems support multiple active credentials specifically for this purpose.

---

# Immediate Rotation

A secret must be rotated or revoked promptly when:

```text
known exposure occurs
suspected compromise exists
credential appears in source control
credential appears in telemetry
unauthorized access is detected
provider requires revocation
```

The exact response depends on the secret capability.

---

# Rotation Ownership

Every important secret should have a clear answer to:

```text
Who rotates this?

How is it rotated?

How is the new value distributed?

How is the old value revoked?

How do we verify consumers migrated successfully?
```

A secret that nobody knows how to rotate is operational debt.

---

# Revocation

Secrets must be revocable where the underlying system supports it.

Revocation should terminate the associated capability as quickly as practical.

Creating a replacement credential is not sufficient if the compromised credential remains valid.

---

# Expiration

Short-lived credentials should be preferred where supported.

Expiration reduces the lifetime of stolen credentials.

However, expiration requires reliable refresh or renewal mechanisms.

A short-lived credential that regularly causes outages is not a successful design.

---

# Dynamic Credentials

Dynamic or temporary credentials may be preferred for infrastructure when the platform supports them.

Potential advantages include:

```text
short lifetime
reduced static storage
automatic expiration
better attribution
limited scope
```

The operational complexity must still be justified.

---

# Secret Versioning

Secret-management systems may maintain secret versions.

Applications should not depend on the internal versioning model unnecessarily.

Operational tooling should allow identifying which credential generation is active when required for safe rotation.

---

# Secret Lifecycle

A secret should conceptually have a lifecycle:

```text
create
  ↓
store
  ↓
authorize
  ↓
deliver
  ↓
use
  ↓
rotate
  ↓
revoke
  ↓
delete
```

Each stage creates security responsibilities.

---

# Secret Delivery

Secrets should be delivered only to the runtime that requires them.

Prefer:

```text
secret manager
    ↓
authorized runtime
```

over:

```text
secret copied manually
    ↓
multiple systems
    ↓
multiple files
    ↓
multiple people
```

Fewer copies reduce exposure.

---

# Just-in-Time Access

Where practical, privileged human access to secrets or production systems should be temporary rather than permanent.

The exact mechanism depends on operational infrastructure.

Standing access should not be the default merely for convenience.

---

# Secret Access Control

Secret access should follow least privilege.

Authorization may depend on:

```text
application identity
environment
human role
CI workflow
deployment role
operational task
```

A system capable of reading one secret should not automatically receive access to all secrets.

---

# Secret Naming

Secret names should clearly communicate ownership and purpose without containing sensitive values.

A conceptual convention may eventually include:

```text
environment/application/capability
```

For example:

```text
production/api/database
production/worker/queue
staging/api/payment-provider
```

The exact syntax depends on the selected secret platform.

---

# Secret Names Are Not Secret Values

Secret names may still reveal infrastructure information.

They should normally be treated as `INTERNAL`.

Do not put actual sensitive data into secret names.

---

# Application Startup

Applications should validate that required secrets are available during startup or initialization.

Missing required secrets should fail clearly.

Prefer:

```text
Missing required secret: PAYMENT_PROVIDER_SECRET
```

over:

```text
undefined
```

The diagnostic must identify the missing configuration name, not the secret value.

---

# Secret Validation

Where a secret has a known structural format, applications may validate basic structure without logging its contents.

For example:

```text
required
non-empty
expected encoding
expected key format
```

Avoid verification mechanisms that expose the value in error output.

---

# Startup Logging

Applications may log that secret-dependent systems initialized successfully.

They must not log the secret.

Valid:

```text
Payment provider initialized.
```

Invalid:

```text
Payment provider initialized with key sk_live_...
```

---

# Secret Access in Application Code

Application code should receive only the secrets it requires.

Avoid passing complete configuration objects containing unrelated secrets into every component.

Prefer:

```text
PaymentProvider({
    secret: paymentProviderSecret
})
```

at the composition boundary.

Do not make global secret access available throughout the application without need.

---

# Composition Root

Secret acquisition should generally happen near trusted application composition.

Conceptually:

```text
runtime secret source
       ↓
application bootstrap
       ↓
specific infrastructure adapter
```

rather than:

```text
any domain module
       ↓
directly reads environment secrets
```

This keeps secret dependencies visible.

---

# Domain Logic

Domain logic should not normally depend on secret-management systems.

For example, an order business rule should not directly retrieve:

```text
PAYMENT_API_KEY
```

Infrastructure boundaries should own provider credentials.

---

# Secret Access Helpers

If Orion eventually provides shared secret-access helpers, they should make ownership explicit.

A generic:

```text
getSecret(anyName)
```

available everywhere may weaken dependency visibility.

Prefer application composition that requests known required secrets deliberately.

---

# Secret Caching

Applications may cache secrets in memory when required for performance or provider integration.

Caching must consider:

```text
rotation
revocation
memory exposure
lifetime
refresh behavior
```

A permanently cached secret may prevent rotation from taking effect.

---

# Secret Refresh

If secrets may rotate while the application remains running, the runtime should have a defined refresh strategy.

Potential approaches include:

```text
restart on rotation
periodic refresh
provider-managed dynamic credentials
event-driven refresh
```

The selected strategy should match operational requirements.

---

# Failure During Secret Retrieval

Failure to retrieve a required secret should normally be treated as a configuration or infrastructure failure.

Depending on the runtime, the application may:

```text
fail startup
remain unready
degrade a specific capability
```

The behavior must be explicit.

---

# Optional Secrets

A secret should be optional only when the corresponding capability is truly optional.

For example:

```text
optional analytics provider
```

may allow startup without its credential.

A required database credential should not silently become optional.

---

# Secret Defaults

Secrets must not have insecure fallback defaults.

Avoid patterns such as:

```text
SESSION_SECRET = env.SESSION_SECRET ?? "development-secret"
```

when such behavior could reach production.

Development defaults should be clearly isolated and incapable of silently becoming production behavior.

---

# Placeholder Secrets

Placeholder values such as:

```text
changeme
secret
password
default
```

must not be accepted in production.

Validation should eventually detect known unsafe defaults.

---

# Logs and Telemetry

Secrets must never be intentionally emitted to:

```text
logs
traces
metrics
error reports
breadcrumbs
audit events
profiling metadata
```

This rule is defined further in:

```text
docs/security/telemetry-redaction.md
```

Secret-management implementation must integrate with telemetry policy.

---

# Error Handling

Errors involving secret access must not include the secret value.

Prefer:

```text
Unable to authenticate with payment provider.
```

over:

```text
Authentication failed using API key sk_live_...
```

Provider exceptions must be reviewed because they may include credential-bearing request context.

---

# Secret Serialization

Secret values should not be included in generic serialization mechanisms.

Avoid placing secrets inside large runtime objects that may later be:

```text
logged
dumped
returned
cached
serialized
```

Dedicated secret wrappers may be considered if the selected language can use them effectively.

---

# Secret Types

Where supported by the selected language, Orion may eventually use dedicated types to distinguish secrets from ordinary strings.

Conceptually:

```text
Secret<T>
```

could make accidental logging or serialization harder.

This should be introduced only if it provides practical safety without excessive complexity.

---

# Secret Redaction by Type

If dedicated secret types are introduced, their default string representation should never expose the underlying value.

For example:

```text
Secret("[REDACTED]")
```

rather than the secret itself.

This can provide defense in depth.

---

# Error Tracking SDKs

Automatic error-capture SDKs must be configured so secret values are not captured from:

```text
environment variables
request headers
local variables
configuration objects
breadcrumbs
provider requests
```

Default SDK configuration must be reviewed before production use.

---

# Debuggers

Debuggers can inspect process memory and secret values.

Production debugging access must therefore be considered privileged access.

Routine operational investigation should prefer sanitized telemetry instead of unrestricted debugger access.

---

# Memory Dumps

Memory dumps may contain secrets.

Full process memory dumps should be treated as `RESTRICTED` diagnostic artifacts.

Their collection should be exceptional and access tightly controlled.

---

# Crash Reports

Crash-report tooling must be reviewed for potential capture of:

```text
environment variables
memory
local variables
HTTP headers
configuration
```

Crash-report convenience must not bypass the secret policy.

---

# Support Tools

Support tools should never expose application secrets.

Customer-support access and infrastructure-administration access are different responsibilities.

A support role should not receive provider or database credentials merely because it can inspect customer accounts.

---

# Administrative Interfaces

Administrative user interfaces must not display secret values unnecessarily.

If secret configuration needs to be represented, prefer states such as:

```text
configured
not configured
last rotated at ...
```

over displaying the credential.

---

# Secret Creation Interfaces

If Orion eventually provides UI or CLI workflows for creating secrets, the secret value should normally be shown only when necessary.

One-time display may be appropriate for generated credentials.

Repeated retrieval should be avoided when the system can use replacement or rotation instead.

---

# Backups

Secret-management systems may have their own backup mechanisms.

Backing up secrets creates another high-value data store.

Backups must preserve equivalent or stronger access controls.

Application backups should not accidentally include secret files.

---

# Database Backups

Database backups may contain credential-like user data such as:

```text
password hashes
sessions
provider tokens
```

These remain `RESTRICTED`.

Database backup security therefore intersects with secret management.

---

# Secret Deletion

Secrets should be deleted when the capability no longer exists.

Examples include:

```text
provider removed
application retired
environment deleted
integration replaced
employee access revoked
```

Unused credentials increase attack surface.

---

# Orphaned Secrets

Secrets with no known consumer should be investigated.

Possible outcomes include:

```text
delete
revoke
document ownership
restore missing consumer documentation
```

Secret inventory should eventually make orphaned secrets detectable.

---

# Secret Inventory

Orion should eventually maintain a machine-readable or provider-derived inventory of important secrets.

The inventory should contain metadata, not secret values.

Potential metadata includes:

```text
name
owner
environment
consumer
purpose
createdAt
rotation policy
last rotated
```

The exact system depends on the selected secret-management platform.

---

# Secret Documentation

Documentation should describe:

```text
secret purpose
owning application
required environment
source/provider
rotation procedure
```

without containing the value.

For example:

```text
PAYMENT_PROVIDER_SECRET

Purpose:
Authenticate server-side payment requests.

Consumers:
apps/api

Classification:
RESTRICTED
```

---

# Documentation Generation

If the configuration schema becomes machine-readable, secret-reference documentation should be generated where practical.

Generated documentation must show metadata only.

It must never attempt to resolve or display secret values.

---

# Secret Scanning

The repository should eventually use automated secret scanning.

Scanning may occur:

```text
before commit
during CI
through repository hosting
during security audits
```

Scanning should detect common credential patterns and private keys.

It complements but does not replace proper secret management.

---

# False Positives

Secret scanning may produce false positives.

The correct response is not to broadly disable scanning.

Exceptions should be narrow and documented.

Test credentials should be clearly synthetic when possible.

---

# Secret Scanning History

Scanning only the current working tree is insufficient.

Secrets may exist in Git history.

Repository-hosting secret scanning or historical scanning should be used where practical.

---

# Accidental Source-Control Exposure

If a secret is committed:

```text
do not merely delete the file
```

The response should be:

```text
identify the secret
        ↓
revoke or rotate it
        ↓
remove future exposure
        ↓
evaluate repository history exposure
        ↓
investigate usage if necessary
        ↓
add prevention
```

The original value must be considered potentially compromised.

---

# History Rewriting

Git history may sometimes be rewritten to remove exposed secret material.

This reduces continued accidental exposure.

It does not restore the secrecy of the credential.

Rotation or revocation remains required.

---

# Telemetry Exposure

If a secret appears in telemetry, the secret must be considered potentially exposed.

Response should include:

```text
stop collection
rotate or revoke
identify affected destinations
remove stored copies where possible
investigate access
add regression protection
```

The procedures will be detailed in incident-response documentation.

---

# Chat and Collaboration Tools

Secrets must not be pasted into:

```text
chat systems
issues
pull requests
code reviews
AI prompts
support tickets
documents
```

unless an explicitly approved secure workflow requires it.

Ordinary collaboration tools should be treated as inappropriate secret stores.

---

# AI Agents

AI agents must not receive `RESTRICTED` secret values by default.

This applies even when an agent is authorized to work with the repository.

Code access is not equivalent to credential access.

Prefer giving the agent:

```text
secret name
configuration schema
error classification
sanitized diagnostics
```

rather than the secret itself.

---

# AI-Assisted Debugging

AI-assisted debugging should use evidence such as:

```text
authentication failed
provider
error code
traceId
configuration key name
```

not:

```text
actual provider key
full environment dump
session token
database password
```

An AI agent generally does not need the secret value to diagnose secret-related configuration failures.

---

# Agent Actions Requiring Secrets

If future agents can perform operational actions that require privileged credentials, prefer delegated tool access where the credential remains hidden from the agent context.

Conceptually:

```text
AI agent
    ↓ authorized action
secure integration
    ↓
external system
```

rather than:

```text
AI agent
    ↓ receives raw secret
external system
```

This preserves capability while minimizing credential exposure.

---

# Secret Rotation by Automation

Automation may eventually rotate credentials.

Automated rotation must preserve:

```text
authorization
auditability
safe rollout
rollback capability where possible
revocation of previous credentials
```

Automation should not create unmanaged secret copies.

---

# Operational Access

Humans should not routinely need to retrieve raw production secrets.

Prefer operational systems where the user authenticates as themselves and receives authorized capability without learning long-lived credentials.

This improves:

```text
auditability
revocation
least privilege
```

---

# Break-Glass Access

Emergency privileged access may eventually be necessary.

A break-glass process should be:

```text
rare
explicit
auditable
time-limited
reviewed afterward
```

Break-glass credentials must not become routine operational credentials.

Detailed policy belongs in production-access documentation.

---

# Auditability

Important secret-management actions should be auditable where supported.

Examples include:

```text
secret created
secret accessed
permissions changed
secret rotated
secret revoked
secret deleted
```

Audit records must not contain the secret value.

---

# Separation of Duties

For high-risk environments, creation, access, rotation, and approval responsibilities may require separation.

This level of control should be introduced according to actual risk and organizational maturity.

Orion should support it without requiring enterprise complexity prematurely.

---

# Secret Availability

Secret-management infrastructure is a runtime dependency when applications retrieve secrets dynamically.

Its failure behavior must be understood.

Potential strategies include:

```text
retrieve at startup
cache securely
use workload identity
refresh periodically
```

The design should avoid unnecessary runtime dependence on a secret service when safer alternatives exist.

---

# Startup Retrieval

Retrieving secrets during startup can simplify runtime behavior.

Conceptually:

```text
application starts
    ↓
retrieves required secrets
    ↓
initializes dependencies
    ↓
becomes ready
```

If required retrieval fails, the application should normally remain unready.

---

# Runtime Retrieval

Some credentials may require runtime retrieval or renewal.

This should be used when:

```text
credentials are short-lived
dynamic identity is required
rotation without restart is needed
```

The added operational complexity must be justified.

---

# Secret Provider Outage

An outage of the secret provider should have defined behavior.

Depending on implementation:

```text
existing runtime continues with cached credential
new runtime cannot start
credential renewal eventually fails
```

The system should expose this condition through observability without logging secrets.

---

# Rotation and Deployment

Secret rotation and application deployment are separate operations.

The architecture should avoid requiring a code release merely to change a credential when practical.

Configuration and credentials should remain operational concerns.

---

# Rollback

Deployment rollback must consider credential compatibility.

For example:

```text
new version uses new credential
old credential revoked
rollback to old version
```

may fail if the old version cannot use the new credential.

Safe rotation should consider rollback windows where relevant.

---

# Multi-Version Applications

During rolling deployments, multiple application versions may coexist.

Secret changes must consider whether:

```text
old version
new version
```

can both operate during the transition.

This is particularly important when changing authentication mechanisms or credential formats.

---

# Secret Rotation Testing

Critical credential rotation procedures should be testable before an incident.

A rotation process that has never been tested is a reliability risk.

Where practical, staging or development environments should exercise equivalent procedures.

---

# Recovery

Secret-management architecture should consider recovery from:

```text
lost credential
lost secret store access
incorrect rotation
provider outage
deleted credential
compromised administrative identity
```

Recovery mechanisms must not create weaker permanent backdoors.

---

# Secret Manager Administrator Credentials

Administrative access to the secret-management system is itself highly sensitive.

The credentials or identities capable of reading or changing all secrets represent a major security boundary.

They require stronger protection than ordinary application credentials.

---

# Encryption Keys for Secret Storage

If Orion operates any encrypted secret storage directly, encryption-key management must not create circular security such as:

```text
encryption key stored next to encrypted secrets
```

Dedicated platform mechanisms should be preferred over custom cryptographic storage implementations.

---

# Do Not Build a Custom Secret Manager

Orion should not implement its own general-purpose secret-management system without an extraordinary requirement.

Secret management is a solved but security-sensitive infrastructure problem.

Prefer established platform capabilities.

Orion should define policy and integration, not reinvent credential storage.

---

# Third-Party Secret Management

Introducing an external secret-management provider creates a critical infrastructure dependency.

Selection should consider:

```text
security model
availability
audit capabilities
access control
rotation support
platform integration
local development experience
cost
vendor lock-in
```

The selection should be documented through an ADR.

---

# Secret Management and Configuration

The future configuration architecture should distinguish:

```text
ordinary configuration
secret references
secret values
```

A configuration schema may declare that a value is secret without containing the secret itself.

Conceptually:

```text
DATABASE_URL
    required: true
    classification: RESTRICTED
    source: secret
```

This metadata may drive validation and generated documentation.

---

# Machine-Readable Secret Metadata

As Orion evolves, configuration schemas may include machine-readable metadata such as:

```text
secret: true
classification: RESTRICTED
clientVisible: false
telemetryAllowed: false
```

This can support automated enforcement.

The exact format depends on the selected stack.

---

# Mechanical Enforcement

Future tooling should enforce secret-management rules where practical.

Potential checks include:

```text
secret scanning
prohibited committed files
client/server import validation
configuration classification
telemetry redaction
unsafe environment dumps
production default-secret detection
secret-bearing build artifact detection
```

Mechanical enforcement is preferable to relying exclusively on contributor memory.

---

# Client Bundle Validation

Build tooling should eventually detect accidental inclusion of server-only secret configuration in client bundles.

For example:

```text
DATABASE_URL
PRIVATE_API_KEY
SESSION_SECRET
```

must never be bundled into browser or distributed client applications.

---

# Container Validation

CI may eventually inspect production images for:

```text
.env files
private keys
known secret patterns
credential files
```

when practical.

Secret scanning should cover deployment artifacts, not only source code.

---

# Dependency Review

Third-party libraries handling credentials should receive additional scrutiny.

Examples include:

```text
authentication libraries
secret-manager SDKs
cryptographic libraries
credential helpers
```

Security-sensitive foundational dependencies should be mature and well maintained.

---

# Secret Documentation Requirements

When introducing a new secret, document at least:

```text
name
purpose
owner
consumer
environment scope
source
rotation expectations
```

Do not document:

```text
actual value
```

A new secret without ownership documentation should be considered incomplete.

---

# New Secret Checklist

Before introducing a new secret, answer:

1. What capability does it grant?
2. Why is a secret required?
3. Can workload identity or another non-secret mechanism be used instead?
4. Which application requires it?
5. Which environment requires it?
6. What is the minimum required privilege?
7. Where will it be stored?
8. How will it be delivered?
9. How will it be rotated?
10. How will it be revoked?
11. How will accidental exposure be detected?
12. Could it reach logs, traces, builds, or clients?
13. Who owns the secret?
14. When can it be deleted?

If these questions cannot be answered, the secret-management design is incomplete.

---

# Secret Removal Checklist

When a secret is no longer required:

1. remove application usage;
2. remove deployment references;
3. verify no active consumer remains;
4. revoke the credential;
5. remove it from the secret store;
6. update documentation;
7. update permission policies;
8. verify old deployment artifacts do not rely on it.

Removal should eliminate the capability, not merely remove one reference.

---

# Secret Exposure Response

If a secret may have been exposed:

1. identify the secret and capability;
2. stop ongoing exposure;
3. revoke or rotate the credential;
4. identify affected systems and environments;
5. inspect access or usage history where available;
6. remove stored exposed copies where practical;
7. verify replacement credentials;
8. investigate root cause;
9. add regression prevention;
10. document the incident according to incident-response policy.

Containment takes priority over preserving the exposed credential for convenience.

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## Secrets in Git

```text
.env committed to repository
```

Prohibited.

---

## Production Credentials in Development

```text
developer uses production database password locally
```

Prohibited by default.

---

## Shared Global Credential

```text
one API key used by development, CI, staging, and production
```

Avoid.

---

## Client-Side Private Key

```text
web application bundle contains server provider secret
```

Prohibited.

---

## Secret in URL

```text
https://example.com?action=...&token=secret
```

Avoid because URLs may appear in many telemetry systems.

---

## Secret in Logs

```text
logger.info(`Using key ${apiKey}`)
```

Prohibited.

---

## Secret in Error

```text
throw new Error(`Invalid key: ${apiKey}`)
```

Prohibited.

---

## Secret in Documentation

```text
Example production key: actual-secret
```

Prohibited.

---

## Secret in Test Fixture

```text
fixture contains real production token
```

Prohibited.

---

## Hardcoded Secret

```text
const SECRET = "real-secret";
```

Prohibited.

---

## Default Production Secret

```text
env.SECRET ?? "changeme"
```

Prohibited.

---

## Shared Administrative Credential

```text
all developers use one production admin password
```

Strongly discouraged.

---

## Secret Access Everywhere

```text
any module can read arbitrary environment variables
```

Avoid when explicit configuration composition is practical.

---

## Rotation Requires Source Change

```text
credential hardcoded into source and redeployed to rotate
```

Prohibited.

---

# Initial Secrets Policy

Until implementation-specific mechanisms are selected, Orion adopts the following requirements:

1. Secrets are classified as `RESTRICTED`.
2. Secrets must never be committed to source control.
3. Private repository visibility does not make Git an acceptable secret store.
4. Development, staging, and production credentials must be isolated.
5. Client applications must never receive server-only secrets.
6. Secrets must follow least privilege.
7. Runtime credentials should be distinct from administrative credentials when responsibilities differ.
8. Human and machine identities should be distinct where practical.
9. Production secrets must not be required for routine local development.
10. Secrets must never be intentionally emitted to telemetry.
11. Complete environment dumps are prohibited.
12. Secrets must not be passed through unsafe command-line or build mechanisms.
13. Secrets must not be baked into client bundles or container images.
14. Every important secret must have an owner and documented purpose.
15. Important secrets must be rotatable and revocable.
16. Known or suspected secret exposure requires rotation or revocation.
17. Removing an exposed value from Git or telemetry does not restore secrecy.
18. AI agents must not receive raw restricted secrets by default.
19. Prefer identity-based and short-lived credentials where the platform supports them cleanly.
20. Secret-management rules should become mechanically enforceable where practical.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text
secret-management platform
local development secret mechanism
CI secret provider
production workload identity
secret naming convention
secret rotation automation
dynamic credential strategy
secret inventory implementation
secret scanning tooling
```

These decisions should be made after Orion's technology stack, deployment platform, and operational environment are defined.

Significant decisions should be captured through ADRs.

---

# Future Documentation

This document should eventually be complemented by:

```text
docs/architecture/configuration.md

docs/security/authentication.md
docs/security/authorization.md
docs/security/production-access.md
docs/security/incident-response.md
docs/security/encryption.md

docs/reliability/health-checks.md
```

Implementation-specific secret-management documentation should reference this policy rather than duplicate it.

---

# Summary

Secrets are privileged capabilities.

They must not be treated as ordinary configuration.

The desired lifecycle is:

```text
create
  ↓
store securely
  ↓
grant minimally
  ↓
deliver safely
  ↓
use only where required
  ↓
rotate
  ↓
revoke
  ↓
delete
```

Orion prefers:

```text
identity over static credential

short-lived over permanent

scoped over global

application-specific over shared

automated delivery over manual copying

explicit ownership over anonymous credentials
```

The most important rule is simple:

```text
A system should possess only the secrets required to perform its responsibility,
for only as long as they are required.
```

A secret that is copied unnecessarily increases attack surface.

A secret that cannot be rotated creates operational risk.

A secret that has no owner creates security debt.

Orion should make all three conditions difficult to create.
