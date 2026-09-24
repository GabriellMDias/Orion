# Configuration

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0007](../adr/0007-establish-api-contract-openapi-sdk-and-configuration-schema-strategy.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Canonical Configuration Schema](#canonical-configuration-schema)
- [Configuration Validation](#configuration-validation)
- [Configuration Precedence](#configuration-precedence)
- [Centralized Ingestion](#centralized-ingestion)
- [Configuration and Secrets](#configuration-and-secrets)
- [New Configuration Checklist](#new-configuration-checklist)

Related policy: [secrets management](../security/secrets-management.md), [data classification](../security/data-classification.md).

## Purpose

This document defines the configuration architecture used by Orion.

Its goals are to ensure that application configuration is:

- explicit;
- validated;
- discoverable;
- typed where practical;
- environment-aware;
- separated from secrets;
- safe to expose according to its classification;
- testable;
- predictable across applications;
- compatible with automated documentation and AI-assisted development.

Configuration is part of the application contract.

Applications should not depend on undocumented environment state.

This document is technology-agnostic.

TypeBox is the accepted bootstrap schema system under ADR-0007. Runtime integration is not implemented; remaining deployment-specific mechanisms are still deferred.

This document complements:

- [docs/security/secrets-management.md](../security/secrets-management.md);
- [docs/security/data-classification.md](../security/data-classification.md);
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md);
- [docs/architecture/dependency-rules.md](dependency-rules.md);
- [docs/architecture/application-boundaries.md](application-boundaries.md).

---

## Core Principle

Configuration must be explicit.

An application should be able to answer:

```text
Which configuration does this application require?

Which values are optional?

Which values are secrets?

Which values are safe for clients?

Which values differ by environment?

What happens when a value is missing or invalid?

Where does each value come from?
```

Configuration should not be discovered accidentally during runtime execution.

---

## What Is Configuration?

Configuration controls application behavior without changing application source code.

Examples may include:

```text
runtime environment
service URLs
timeouts
retry limits
feature modes
port numbers
region
logging level
provider selection
cache behavior
batch sizes
```

Configuration should represent intentional operational variability.

---

## What Is Not Configuration?

Not every value that changes belongs in configuration.

Avoid using configuration for:

```text
business data
user preferences
domain state
database records
arbitrary feature behavior
secret values without secret-management policy
```

A useful rule is:

```text
configuration changes how the application operates

domain data describes what the application operates on
```

---

## Configuration vs Secrets

Configuration and secrets are related but distinct concepts.

Examples of ordinary configuration:

```text
PORT=8080
LOG_LEVEL=info
PAYMENT_PROVIDER=example
REQUEST_TIMEOUT_MS=5000
```

Examples of secrets:

```text
DATABASE_PASSWORD
PAYMENT_PROVIDER_SECRET
SESSION_SIGNING_KEY
```

Secrets follow:

- [docs/security/secrets-management.md](../security/secrets-management.md)

A configuration schema may reference a secret requirement.

It must not treat secret handling as ordinary configuration handling.

---

## Configuration Categories

Orion distinguishes several configuration categories.

Potential categories include:

```text
runtime configuration
application configuration
integration configuration
feature configuration
operational configuration
secret references
client-visible configuration
build-time configuration
```

These categories may have different delivery and security requirements.

---

## Runtime Configuration

Runtime configuration is resolved when an application starts or operates.

Examples:

```text
database endpoint
HTTP port
provider selection
timeout values
queue name
log level
```

Runtime configuration should normally be changeable without modifying application source.

Whether a restart is required depends on the configuration mechanism.

---

## Build-Time Configuration

Build-time configuration affects generated application artifacts.

Examples may include:

```text
target platform
compile-time feature selection
public application identifier
client API base URL
```

Build-time configuration requires special care because values may become permanently embedded in artifacts.

Anything embedded in:

```text
browser bundles
mobile binaries
desktop binaries
container image layers
```

must be considered accessible to recipients of those artifacts.

Therefore build-time configuration must never contain server-only secrets.

---

## Client-Visible Configuration

Configuration delivered to web, mobile, or desktop applications must be explicitly classified as client-safe.

Examples may include:

```text
public API URL
public application name
public feature availability
publishable provider identifier
```

Client-visible configuration must not contain:

```text
database credentials
private API keys
signing secrets
server tokens
internal privileged endpoints
```

The presence of a value in an environment variable does not make it safe for client exposure.

---

## Server-Only Configuration

Trusted backend applications may receive configuration unavailable to clients.

Examples:

```text
database connection settings
internal service endpoints
worker concurrency
private provider settings
secret references
```

Server-only configuration must remain inaccessible to client bundles.

Repository tooling should eventually enforce this distinction.

---

## Canonical Configuration Schema

Each application should have a canonical configuration schema.

The schema should define, where practical:

```text
name
type
required/optional
default
description
classification
secret status
client visibility
validation constraints
```

Conceptually:

```text
REQUEST_TIMEOUT_MS
    type: integer
    required: false
    default: 5000
    description: Maximum duration of outbound requests.
    classification: INTERNAL
    secret: false
    clientVisible: false
```

The exact schema format will depend on the selected stack.

---

## Configuration Validation

Configuration must be validated before it is used.

Do not rely on scattered runtime checks such as:

```text
if environmentValue exists here
```

throughout the application.

Prefer:

```text
raw configuration
      ↓
canonical schema validation
      ↓
validated configuration
      ↓
application
```

After validation, application code should be able to assume the configuration satisfies its declared schema.

---

## Fail Early

Invalid required configuration should normally fail during application initialization.

Prefer:

```text
Invalid configuration:

REQUEST_TIMEOUT_MS must be a positive integer.
```

over discovering the problem only when a user reaches a specific feature.

Failing early reduces partially functional deployments.

---

## Missing Required Configuration

Missing required configuration should produce a clear diagnostic.

Prefer:

```text
Missing required configuration: DATABASE_URL
```

over:

```text
Cannot read property 'host' of undefined.
```

The diagnostic may expose the configuration key name.

It must never expose a secret value.

---

## Configuration Types

Configuration should use meaningful types.

Avoid treating every value as a string after ingestion.

For example:

```text
"false"
```

must not accidentally behave as:

```text
true
```

because it is a non-empty string.

Potential configuration types include:

```text
string
integer
boolean
duration
URL
enum
list
structured object
```

Parsing and validation should occur at the configuration boundary.

---

## Units Must Be Explicit

Numeric configuration should make units explicit.

Avoid:

```text
REQUEST_TIMEOUT=30
```

when the unit is unclear.

Prefer names or types such as:

```text
REQUEST_TIMEOUT_MS=30000
```

or a typed duration representation.

This prevents subtle operational errors.

---

## Enums Over Arbitrary Strings

When configuration accepts a bounded set of modes, validate them explicitly.

Prefer:

```text
PAYMENT_PROVIDER:
    example
    alternative
```

over accepting arbitrary strings and discovering unsupported values later.

---

## Defaults

Defaults may reduce configuration burden.

A default is appropriate when:

- the behavior is safe;
- the behavior is predictable;
- the value is appropriate across expected environments;
- omission does not create ambiguity.

Defaults must not hide required operational decisions.

---

## Unsafe Defaults

Security-sensitive or environment-specific values should not silently fall back to unsafe defaults.

Avoid:

```text
AUTH_ENABLED=false
```

as an implicit fallback if authentication is expected.

Avoid:

```text
DATABASE_URL=localhost
```

in a way that may accidentally affect production.

Defaults should fail safely.

---

## Production Defaults

Configuration defaults must be safe if accidentally used in production.

If no safe default exists, require explicit configuration.

Prefer:

```text
required configuration
```

over:

```text
dangerous convenience default
```

---

## Development Defaults

Development-only defaults may exist when clearly isolated.

For example:

```text
local development port
local service URL
development-only emulator
```

Such defaults must not silently become production behavior.

The environment distinction should be explicit.

---

## Configuration Sources

Configuration may originate from several sources.

Potential sources include:

```text
environment variables
configuration files
command-line arguments
platform configuration
secret references
remote configuration systems
build configuration
```

The final source hierarchy will be selected later.

The important requirement is that precedence must be deterministic and documented.

---

## Configuration Precedence

If multiple configuration sources exist, their precedence must be explicit.

Avoid behavior such as:

```text
sometimes file wins

sometimes environment variable wins

sometimes command-line value wins
```

without a documented rule.

A future model may resemble:

```text
defaults
    ↓ overridden by
local/application configuration
    ↓ overridden by
environment configuration
    ↓ overridden by
runtime explicit override
```

This example is not yet normative.

---

## Avoid Excessive Configuration Layers

More configuration sources increase complexity.

Do not introduce multiple overlapping mechanisms without a concrete reason.

A system with:

```text
.env
.env.local
config.json
config.production.json
environment variables
remote config
CLI flags
database config
```

may become difficult to reason about.

Prefer the smallest set of configuration mechanisms that satisfies actual requirements.

---

## Environment Variables

Environment variables may be an effective runtime configuration delivery mechanism.

However, application code should not read arbitrary environment variables throughout the codebase.

Avoid:

```text
feature module
    ↓
process.env.SOME_VALUE
```

Prefer:

```text
environment
    ↓
configuration boundary
    ↓
validated configuration
    ↓
feature module
```

The same principle applies in languages without `process.env`.

---

## Centralized Ingestion

Raw environment access should be centralized.

This enables:

```text
validation
classification
documentation
testing
secret handling
client/server separation
```

It also makes configuration dependencies visible.

---

## Configuration Objects

Applications should avoid passing one giant configuration object everywhere.

For example:

```text
ApplicationConfig
    contains 80 settings
```

should not automatically be passed into every service.

Prefer giving components only the configuration they require.

Example:

```text
PaymentService({
    timeout,
    retryPolicy
})
```

rather than:

```text
PaymentService(globalConfig)
```

when the additional values are irrelevant.

---

## Configuration Dependency Visibility

A component's configuration dependency should be visible.

Hidden configuration access creates implicit coupling.

Prefer:

```text
constructor / factory parameters
```

or another explicit composition mechanism.

Avoid modules independently discovering configuration from global state.

---

## Composition Root

Configuration should normally be resolved near application composition.

Conceptually:

```text
raw environment
      ↓
configuration parser
      ↓
validated application configuration
      ↓
composition root
      ↓
specific component configuration
```

Domain logic should not normally read environment-specific configuration directly.

---

## Domain Logic

Stable domain behavior should not depend on deployment-specific configuration unnecessarily.

For example:

```text
An order cannot be cancelled after shipment.
```

should not depend on:

```text
process.env.ORDER_RULE_ENABLED
```

unless the product explicitly defines that rule as configurable.

Configuration should not become a mechanism for making every business invariant mutable.

---

## Configurable Business Behavior

Some business behavior may legitimately be configurable.

Examples could include:

```text
operational limits
product plans
feature availability
regional behavior
```

When configuration affects domain semantics, ownership must be explicit.

The data may belong in:

```text
application configuration
feature management
database-managed business settings
```

depending on who changes it and how frequently.

Do not automatically model all mutable business behavior as environment configuration.

---

## Configuration Change Frequency

How often a value changes is an architectural signal.

Values changed:

```text
once per deployment
```

may fit runtime configuration.

Values changed:

```text
frequently by business operators
```

may belong in application data or a feature-management system.

Values changed:

```text
per user
```

generally belong in user or domain data.

---

## Configuration Ownership

Every important configuration value should have an identifiable owner.

Ownership should answer:

```text
Who defines its meaning?

Which application consumes it?

Who may change it?

What happens when it changes?

Does it require restart?

Is it environment-specific?
```

Configuration without ownership tends to accumulate indefinitely.

---

## Application-Specific Configuration

Configuration should normally belong to the application that consumes it.

For example:

```text
apps/api
    owns API runtime configuration
```

```text
apps/worker
    owns worker concurrency configuration
```

Shared configuration primitives may exist, but unrelated application settings should not be centralized merely for convenience.

---

## Shared Configuration

Shared configuration is appropriate only when multiple applications genuinely share the same semantic setting.

Examples may include:

```text
canonical environment name
shared service endpoint
common telemetry convention
```

Even then, consider whether sharing the schema or sharing the actual value is appropriate.

---

## Naming

Configuration names should clearly describe their purpose.

Prefer:

```text
PAYMENT_REQUEST_TIMEOUT_MS
```

over:

```text
TIMEOUT
```

Prefer:

```text
DATABASE_POOL_MAX
```

over:

```text
MAX
```

Names should remain understandable without historical context.

---

## Namespace Conventions

As Orion grows, application-specific configuration may require namespaces.

A future naming model may resemble:

```text
API_...
WORKER_...
DATABASE_...
PAYMENT_...
OBSERVABILITY_...
```

The exact convention should be selected after the stack and deployment environment are known.

Consistency is more important than any specific prefix format.

---

## Boolean Naming

Boolean configuration should communicate positive semantics.

Prefer:

```text
FEATURE_ENABLED
```

over confusing negative forms such as:

```text
DISABLE_FEATURE=false
```

Double negatives increase operational mistakes.

---

## Configuration Descriptions

Every non-trivial configuration value should have a description explaining:

```text
what it controls
expected type
default behavior
operational consequences
```

Descriptions should explain semantics, not merely repeat the name.

---

## Configuration Documentation

Configuration documentation should be generated from the canonical schema where practical. The current API has a [generated configuration reference](../generated/configuration/api.md) from its TypeBox bootstrap schema and metadata.

A future generated reference may contain:

| Name                 | Type             | Required | Default | Classification | Description                        |
| -------------------- | ---------------- | -------- | ------- | -------------- | ---------------------------------- |
| `REQUEST_TIMEOUT_MS` | integer          | No       | `5000`  | INTERNAL       | Maximum outbound request duration. |
| `DATABASE_URL`       | secret reference | Yes      | —       | RESTRICTED     | Database connection credential.    |

The documentation must never expose secret values.

---

## One Canonical Definition

Avoid maintaining configuration independently in:

```text
code
README
deployment files
example env files
documentation
```

when those representations can derive from a canonical schema.

The desired model is:

```text
configuration schema
      ├── validation
      ├── types
      ├── generated documentation
      ├── example configuration
      └── deployment checks
```

where practical.

---

## Example Configuration Files

Example files may be generated or maintained to show required configuration names.

Examples must contain safe placeholders.

For example:

```text
DATABASE_URL=<required-secret>
REQUEST_TIMEOUT_MS=5000
```

Never include production values.

---

## Configuration Drift

Configuration drift occurs when environments unintentionally use inconsistent settings.

Orion should make environment differences discoverable.

Potential mechanisms may eventually include:

```text
configuration schema validation
deployment manifests
safe configuration fingerprints
environment comparison tooling
```

Exact values may remain secret or confidential.

---

## Configuration Fingerprints

For troubleshooting, it may be useful to identify a safe fingerprint of configuration state.

A fingerprint should exclude secrets.

It may help determine whether two instances are running materially different configuration.

This should be introduced only if operationally useful.

---

## Environment Model

Orion should use a small, explicit environment model.

Likely examples include:

```text
development
test
staging
production
```

Not every project requires all of these environments.

Environment names should be stable.

Avoid uncontrolled aliases for the same environment.

---

## Environment Is Not a Feature Flag

Avoid application behavior such as:

```text
if production:
    do X
else:
    do Y
```

when the actual distinction is a capability or feature.

Prefer explicit configuration:

```text
EMAIL_DELIVERY_MODE=real
```

or another meaningful setting.

Environment names should describe environment identity.

They should not become a generic mechanism for controlling unrelated behavior.

---

## Production-Specific Behavior

Some behavior legitimately differs in production.

Examples may include:

```text
debug diagnostics disabled
real external providers
production telemetry exporters
```

The distinction should remain explicit and testable.

---

## Test Configuration

Tests should be able to construct configuration explicitly.

Tests should not require unrelated machine environment state.

Prefer:

```text
createTestConfig({
    requestTimeout: ...
})
```

over relying entirely on the developer's shell environment.

This improves deterministic testing.

---

## Unit Tests

Unit tests should inject the minimal configuration required by the unit.

They should not require parsing the complete production configuration schema unless the configuration parser itself is under test.

---

## Integration Tests

Integration tests may validate real application configuration boundaries.

They should use synthetic test credentials and isolated test resources.

Production secrets must never be required.

---

## Configuration Parser Tests

Configuration validation should have dedicated tests for important behavior.

Examples include:

```text
required value missing
invalid integer
invalid URL
unsupported enum
unsafe production default
secret metadata preserved
```

---

## CI Configuration

CI should explicitly provide the configuration required by each workflow.

A workflow should not receive unrelated production settings.

For example:

```text
unit tests
```

should not automatically receive:

```text
production database credentials
production deployment credentials
```

Configuration and secret scope should align with job responsibility.

---

## Deployment Configuration

Deployment definitions should make required application configuration discoverable.

A deployment should fail before becoming active when mandatory configuration is unavailable or invalid.

The exact mechanism depends on the deployment platform.

---

## Configuration Validation in CI

CI should eventually validate that deployment configuration satisfies application schemas where practical.

Potential checks include:

```text
required keys exist
unknown keys detected
invalid values rejected
client/server classification respected
deprecated keys detected
```

Secrets may be validated by presence/reference without exposing their values.

---

## Unknown Configuration Keys

Unknown configuration keys may indicate:

```text
typo
obsolete setting
incorrect deployment
stale documentation
```

Where practical, configuration tooling should detect unexpected keys.

Whether unknown keys are warnings or errors depends on the configuration mechanism.

---

## Deprecated Configuration

Configuration keys should have an explicit deprecation lifecycle when required.

For example:

```text
introduce replacement
      ↓
support both temporarily
      ↓
migrate deployments
      ↓
remove old key
```

Do not leave obsolete configuration indefinitely.

---

## Renaming Configuration

Renaming a configuration key can affect:

```text
development
CI
staging
production
deployment scripts
documentation
secret stores
```

Treat important configuration renames as compatibility changes.

A safe migration may temporarily support both names.

---

## Removing Configuration

Before removing a configuration key:

1. remove application usage;
2. update deployment environments;
3. update CI;
4. update example configuration;
5. update generated documentation;
6. remove related secrets if applicable;
7. verify no old application version still requires it.

---

## Dynamic Configuration

Some systems support changing configuration without application restart.

Dynamic configuration introduces additional complexity:

```text
consistency
cache invalidation
concurrent changes
rollback
auditability
testing
```

Do not introduce dynamic configuration unless a concrete requirement exists.

Static startup configuration is simpler and should generally be preferred initially.

---

## Remote Configuration

Remote configuration systems may be useful for operational control.

They create a runtime dependency and require consideration of:

```text
availability
authentication
caching
fallback
consistency
auditability
```

Orion should not introduce a remote configuration system by default.

---

## Feature Flags

Feature flags are related to configuration but have distinct lifecycle and operational characteristics.

They may support:

```text
gradual rollout
temporary behavior switching
experimentation
emergency disablement
```

Feature flags should not automatically be implemented as ordinary environment variables.

A separate feature-management policy may be introduced if real requirements emerge.

---

## Feature Flag Debt

Temporary feature flags must have removal criteria.

A completed rollout should not leave permanent dead branches such as:

```text
if newCheckoutEnabled
else oldCheckout
```

indefinitely.

Feature flags are temporary complexity unless explicitly designed as permanent product settings.

---

## Configuration and Secrets

A configuration schema may describe a secret dependency.

For example:

```text
PAYMENT_PROVIDER_SECRET
    source: secret
    classification: RESTRICTED
```

The configuration system should validate the requirement.

The secret-management system should provide the value.

These responsibilities should remain distinct.

---

## Secret References

Where supported, configuration may contain references to secrets rather than secret values.

Conceptually:

```text
PAYMENT_PROVIDER_SECRET_REF
    ↓
secret manager
    ↓
actual credential
```

This may improve separation between deployment configuration and credential storage.

The exact mechanism depends on infrastructure.

---

## Secret Values in Memory

Once resolved, secret values may exist temporarily in application memory.

They remain `RESTRICTED`.

Configuration diagnostics, serialization, and logging must not expose them.

---

## Configuration Serialization

Configuration objects may contain secrets or confidential values.

Do not serialize complete configuration objects into:

```text
logs
error reports
health endpoints
debug output
support bundles
```

Use explicit safe projections.

---

## Safe Configuration Summary

Applications may expose a safe configuration summary for diagnostics.

For example:

```text
environment: production
paymentProvider: example
requestTimeoutMs: 5000
databaseConfigured: true
```

not:

```text
databaseUrl: postgres://user:password@...
```

The summary should be generated from explicit safe fields.

---

## Health Endpoints

Health endpoints must not expose raw configuration.

A health endpoint may indicate:

```text
database configured
provider initialized
```

without exposing connection strings or credentials.

---

## Error Messages

Configuration errors should identify the configuration key and expected requirement.

They must not expose restricted values.

Prefer:

```text
PAYMENT_PROVIDER_SECRET is missing.
```

over:

```text
PAYMENT_PROVIDER_SECRET was expected to equal ...
```

---

## Logging

Applications should not log complete configuration at startup.

A common anti-pattern is:

```text
logger.info(config)
```

This is prohibited when the configuration may contain sensitive data.

Use explicit safe fields.

---

## Telemetry

Configuration included in telemetry must follow:

- [docs/security/data-classification.md](../security/data-classification.md)
- [docs/security/telemetry-redaction.md](../security/telemetry-redaction.md)

Secret or restricted configuration must never be emitted intentionally.

---

## Configuration and AI Agents

AI agents should be able to understand configuration requirements from repository definitions without requiring access to actual secret values.

An agent should ideally be able to inspect:

```text
configuration schema
descriptions
types
defaults
classification
example placeholders
```

without seeing:

```text
production credentials
private tokens
real secret values
```

This is a core requirement for AI-friendly configuration design.

---

## AI-Assisted Configuration Changes

Before changing configuration behavior, an AI agent should determine:

```text
canonical configuration source
consuming applications
deployment impact
classification
secret status
documentation impact
backward compatibility
```

It must not introduce an environment variable casually merely because it is convenient.

---

## New Configuration Checklist

Before introducing a new configuration value, answer:

1. What behavior does this value control?
2. Why must it be configurable?
3. Which application owns it?
4. What is its type?
5. Is it required?
6. Is there a safe default?
7. What is its classification?
8. Is it a secret?
9. Is it client-visible?
10. Which environments require it?
11. Does changing it require restart?
12. How will it be validated?
13. How will it be documented?
14. How will it be tested?
15. Could the behavior belong in application data instead?

If these questions cannot be answered, the configuration design is incomplete.

---

## New Configuration Should Be Justified

Configuration creates additional system state.

Every configuration option increases the number of possible application behaviors.

Avoid making something configurable merely because:

```text
it might be useful someday
```

Prefer a fixed sensible behavior until real variability is required.

---

## Configuration Explosion

Excessive configuration creates a system that is difficult to understand and test.

For example:

```text
ENABLE_A
ENABLE_B
USE_NEW_C
USE_LEGACY_D
DISABLE_E
MODE_F
```

can create a large implicit state space.

Configuration should be minimized just like dependencies and abstractions.

---

## Invalid Configuration Combinations

If configuration options interact, invalid combinations should be prevented.

For example:

```text
PAYMENT_PROVIDER=example

EXAMPLE_PROVIDER_ENABLED=false
```

may represent contradictory state.

Prefer schemas capable of validating cross-field invariants where necessary.

---

## Mutually Exclusive Configuration

Mutually exclusive modes should be represented explicitly.

Prefer:

```text
STORAGE_PROVIDER = local | cloud
```

over:

```text
USE_LOCAL_STORAGE=true
USE_CLOUD_STORAGE=true
```

which permits contradictory combinations.

---

## Conditional Requirements

Some configuration may be required only when another capability is enabled.

For example:

```text
PAYMENT_PROVIDER=example
    ↓ requires
PAYMENT_PROVIDER_SECRET
```

The schema should express such conditions where practical.

---

## Configuration Groups

Related settings may be grouped semantically.

Example:

```text
database:
    url
    poolMin
    poolMax

http:
    port
    requestTimeout
```

Whether the runtime representation is nested or flat depends on the selected technology.

Semantic grouping should remain clear either way.

---

## Configuration Boundaries

A shared configuration system should not cause every package to depend on every configuration value.

Prefer:

```text
global ingestion
      ↓
application composition
      ↓
local typed configuration
```

This limits coupling and improves testability.

---

## Package Configuration

Shared packages should not normally read application environment state directly.

A package should receive the configuration required for its capability.

This keeps the package reusable and prevents hidden runtime dependencies.

---

## Library Packages

General-purpose shared packages should avoid configuration entirely where simple parameters are sufficient.

Prefer:

```text
createRetryPolicy({
    maxAttempts: 3
})
```

over:

```text
createRetryPolicy()
    ↓ internally reads environment
```

unless reading environment state is the package's explicit responsibility.

---

## Configuration and Dependency Direction

Configuration infrastructure belongs near the outer application boundary.

Stable domain packages should not depend on environment-specific configuration systems.

Conceptually:

```text
environment
    ↓
config infrastructure
    ↓
application composition
    ↓
domain behavior
```

not:

```text
domain behavior
    ↓
environment variables
```

---

## Configuration Reload

If runtime reload is ever supported, configuration values must define whether they are:

```text
startup-only
reloadable
immutable during process lifetime
```

Changing some values dynamically may be unsafe.

For example:

```text
database credentials
encryption strategy
transport port
```

may require different handling from:

```text
operational timeout
```

The reload model must be explicit.

---

## Configuration Changes and Observability

Important operational configuration changes should be discoverable.

Where dynamic configuration exists, telemetry may record:

```text
configuration key changed
change timestamp
actor or system
safe old/new classification
```

without exposing secret values.

---

## Configuration Audit

High-impact configuration changes may require auditability.

Examples may include:

```text
authorization mode
security settings
provider routing
feature rollout
production limits
```

The exact audit policy should reflect operational risk.

---

## Configuration and Releases

Application code and configuration may evolve independently.

A release should define which configuration schema it supports.

Deployment tooling should detect incompatible configuration where practical.

---

## Backward Compatibility

During rolling deployments, multiple application versions may coexist.

A configuration migration must consider whether:

```text
old version
new version
```

both understand the active configuration.

This may require temporary compatibility.

---

## Configuration Schema Versioning

A formal configuration schema version should not be introduced unless needed.

Git history and application release versions may already provide sufficient context initially.

If separately managed configuration evolves independently, explicit versioning may become justified later.

---

## Configuration Drift Between Versions

An old application version may rely on a configuration key removed by a newer version.

Deployment rollback may then fail.

Therefore configuration removal must consider rollback requirements.

---

## Configuration and Database Migrations

Configuration changes may sometimes coordinate with database evolution.

For example:

```text
new storage mode introduced
    ↓
data migrated
    ↓
configuration switched
    ↓
old mode removed
```

Such changes should follow safe deployment sequencing.

---

## Configuration and External Providers

Provider-specific configuration should remain close to the integration boundary.

Avoid provider-specific settings spreading throughout unrelated modules.

Example:

```text
PaymentProviderConfig
    endpoint
    timeout
    secret
```

belongs with payment-provider integration rather than global business logic.

---

## Configuration and Portability

Avoid unnecessary configuration tied to one deployment platform when a platform-neutral application concept exists.

However, do not build abstraction purely for hypothetical portability.

The configuration model should reflect actual architecture.

---

## Configuration Discovery

A contributor should be able to determine all required application configuration without searching arbitrary source files.

Expected future sources may include:

```text
application configuration schema
generated configuration reference
application README
```

The canonical schema should remain authoritative.

---

## Configuration Documentation Location

Generated configuration documentation should eventually live under:

```text
docs/generated/
```

Authored architectural rules remain in this document.

Application-specific configuration guidance may live under:

```text
apps/<application>/README.md
```

when applications exist.

---

## Mechanical Enforcement

Future tooling should enforce configuration rules where practical.

Potential checks include:

```text
direct environment access outside configuration boundary

missing schema definitions

unknown configuration keys

invalid values

client access to server-only configuration

secret values in client builds

unsafe defaults

undocumented configuration

stale generated references
```

The exact implementation depends on the selected stack.

---

## Client Bundle Enforcement

Build tooling should eventually distinguish:

```text
client-safe configuration
server-only configuration
secret configuration
```

Client builds must fail if they attempt to import or embed server-only or restricted configuration.

---

## Static Analysis

Static analysis may prohibit direct environment access outside approved modules.

For example:

```text
process.env
```

or equivalent APIs may only be allowed inside a configuration package or application configuration module.

This can make hidden configuration dependencies difficult to introduce.

---

## Generated Configuration Types

Where supported, configuration types should be generated or derived from the canonical schema.

Avoid maintaining:

```text
runtime validation schema
```

and:

```text
static configuration interface
```

independently when one can derive the other.

---

## Generated Example Files

Example environment files may eventually be generated from configuration schemas.

For example:

```text
.env.example
```

could contain:

```text
REQUEST_TIMEOUT_MS=5000
DATABASE_URL=<required-secret>
```

without storing actual credentials.

---

## Generated Documentation

A canonical configuration schema may eventually generate:

```text
reference tables
required-value lists
example environment files
deployment validation metadata
AI-readable configuration descriptions
```

This reinforces the single-source-of-truth principle.

---

## Common Anti-Patterns

The following patterns should be avoided.

---

### Scattered Environment Access

```text
module A → environment
module B → environment
module C → environment
```

Avoid.

Prefer centralized ingestion.

---

### Stringly Typed Configuration

```text
"false"
"30"
"enabled"
```

used without parsing and validation.

Avoid.

---

### Giant Global Configuration Object

Every component receives every setting.

Avoid.

---

### Configuration as Business Database

Environment variables used for frequently changing business behavior.

Avoid when domain data is the correct model.

---

### Secrets as Ordinary Configuration

Secret values treated like safe strings.

Prohibited.

---

### Server Secret in Client Build

Prohibited.

---

### Entire Configuration Logged

Prohibited when configuration may contain sensitive values.

---

### Hidden Defaults

Avoid defaults that materially change behavior without being visible in documentation.

---

### Environment Name as Generic Switch

```text
if production
```

used to control unrelated feature behavior.

Avoid.

---

### Arbitrary Dynamic Configuration

Avoid runtime-mutating settings without ownership, auditability, or consistency model.

---

### Unused Configuration

Configuration keys with no consumers should be removed.

Stale configuration creates false assumptions.

---

## Initial Configuration Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Configuration must be explicit and validated.
2. Each application should eventually have a canonical configuration schema.
3. Raw environment access should be centralized.
4. Components should receive only the configuration they require.
5. Configuration and secrets are distinct concerns.
6. Secret configuration follows [docs/security/secrets-management.md](../security/secrets-management.md).
7. Client-visible and server-only configuration must be distinguishable.
8. Client applications must never receive server-only secrets.
9. Invalid required configuration should fail early.
10. Configuration should use meaningful types rather than raw strings where practical.
11. Numeric units must be explicit.
12. Unsafe production defaults are prohibited.
13. Configuration sources and precedence must be deterministic.
14. Environment identity must not become a generic feature-switch mechanism.
15. Tests should not depend on unrelated machine configuration.
16. Configuration documentation should be generated from canonical schemas where practical.
17. Complete configuration objects must not be logged or exposed through diagnostics.
18. New configuration requires clear ownership and justification.
19. Obsolete configuration must be removed deliberately.
20. Configuration rules should become mechanically enforceable where practical.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
configuration package structure
environment-variable naming convention
configuration source precedence
local development mechanism
client configuration delivery
generated .env.example format
dynamic configuration support
feature-flag strategy
deployment configuration integration
```

These decisions should follow the selected technology stack and deployment model.

Significant choices should be captured through ADRs.

---

## Future Documentation

This document may later be complemented by:

```text
docs/security/secrets-management.md

docs/architecture/versioning-and-compatibility.md
docs/architecture/testing-strategy.md

docs/reliability/health-checks.md

apps/<application>/README.md
packages/config/README.md
```

Implementation-specific documentation should reference this policy rather than redefine configuration architecture independently.

---

## Summary

Configuration is an explicit application dependency.

The intended model is:

```text
raw environment / platform input
        ↓
canonical configuration schema
        ↓
validation
        ↓
typed validated configuration
        ↓
application composition
        ↓
only required values reach each component
```

Orion prefers:

```text
explicit over implicit

validated over assumed

typed over stringly typed

minimal over global

safe defaults over convenient defaults

generated documentation over duplicated documentation

configuration over source changes
```

while avoiding turning every possible behavior into a setting.

A missing configuration value should fail clearly.

A secret configuration value should remain secret.

A client-visible value should be explicitly safe.

A component should not need to search global environment state to understand its dependencies.

Configuration should make application behavior easier to reason about, not harder.
