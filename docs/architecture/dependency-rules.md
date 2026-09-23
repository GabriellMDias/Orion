# Dependency Rules

## Purpose

This document defines dependency rules for the Orion repository.

Its goals are to:

- make dependency direction explicit;
- prevent accidental architectural coupling;
- preserve application boundaries;
- protect stable business concepts from infrastructure concerns;
- support local reasoning;
- enable future mechanical enforcement;
- reduce ambiguity for both humans and AI agents.

These rules apply at repository, application, package, module, and runtime-boundary levels.

The exact enforcement mechanism depends on the selected technology stack.

The architectural rules defined here exist independently of any specific linting, build, or dependency-analysis tool.

---

## Core Rule

Dependencies must follow ownership and responsibility.

A component may depend on another component only when that dependency is architecturally meaningful and explicitly allowed.

Physical proximity in the monorepo does not grant dependency permission.

A dependency is not valid merely because:

```text
the import resolves;
the package is available;
the code is in the same repository;
the build succeeds.
```

Dependency validity is an architectural concern.

---

# Dependency Categories

Orion distinguishes between several categories of dependency.

---

## Compile-Time Dependency

A compile-time dependency exists when one source module imports, references, links against, or otherwise requires another module to build.

Examples:

```text
import { UserSchema } from "@orion/contracts";
```

or:

```text
package A
    ↓
package B
```

Compile-time dependencies are the primary subject of repository dependency enforcement.

---

## Runtime Dependency

A runtime dependency exists when one application or component requires another system while executing.

Examples:

```text
web
  ↓ HTTPS
api
```

```text
api
  ↓
database
```

```text
worker
  ↓
message broker
```

Runtime dependencies must be explicit and observable.

A runtime dependency does not imply a compile-time dependency on the other application's implementation.

---

## Development Dependency

A development dependency exists only for development, testing, building, generation, validation, or repository automation.

Examples include:

```text
test framework
linter
formatter
code generator
architecture validator
documentation generator
```

Development dependencies must not leak into production runtime paths unless they are intentionally runtime dependencies.

---

## Generated Dependency

A generated dependency exists when code or documentation is produced from another canonical source.

For example:

```text
API contract
    ↓ generates
SDK
```

The generated artifact depends conceptually on its source.

The canonical source must not depend back on the generated artifact unless explicitly designed to do so.

---

# Repository-Level Dependency Model

The intended high-level dependency relationship is:

```text
apps
  ↓
packages
```

with supporting repository concerns around them:

```text
tooling  → inspects/builds/validates → apps + packages

infra    → deploys/configures        → application artifacts

docs     → describes/references      → repository architecture
```

The following general rules apply.

---

## Applications May Depend on Packages

Valid:

```text
apps/api
    ↓
packages/contracts
```

```text
apps/web
    ↓
packages/sdk
```

```text
apps/worker
    ↓
packages/observability
```

Applications consume shared capabilities through explicit package APIs.

---

## Packages Must Not Depend on Applications

Invalid:

```text
packages/contracts
    ↓
apps/api
```

```text
packages/domain
    ↓
apps/web
```

```text
packages/database
    ↓
apps/worker
```

Shared packages must remain independent of application implementation.

---

## Applications Must Not Import Other Applications

Invalid:

```text
apps/web
    ↓
apps/api
```

```text
apps/worker
    ↓
apps/api
```

```text
apps/mobile
    ↓
apps/web
```

Application-to-application interaction must happen through:

```text
shared contracts
shared packages
runtime communication
```

not through implementation imports.

---

## Runtime Code Must Not Depend on Repository Tooling

Invalid:

```text
apps/api
    ↓
tooling/scripts
```

```text
packages/domain
    ↓
tooling/generator
```

Repository tooling may inspect runtime code.

Runtime code must not require tooling to execute.

---

## Runtime Code Must Not Depend on Infrastructure Definitions

Invalid:

```text
apps/api
    ↓
infra/cloud
```

```text
packages/config
    ↓
infra/deployment
```

Infrastructure may deploy or configure application artifacts.

Application behavior must not depend directly on infrastructure-as-code implementation.

---

# Dependency Matrix

The following matrix defines the default high-level dependency policy.

| From                   | To                        | Default                      |
| ---------------------- | ------------------------- | ---------------------------- |
| `apps/*`               | `packages/*`              | Allowed                      |
| `apps/*`               | other `apps/*`            | Forbidden                    |
| `packages/*`           | `apps/*`                  | Forbidden                    |
| `packages/*`           | other `packages/*`        | Restricted                   |
| `tooling/*`            | `apps/*`                  | Allowed for tooling purposes |
| `tooling/*`            | `packages/*`              | Allowed for tooling purposes |
| `apps/*`               | `tooling/*`               | Forbidden                    |
| `packages/*`           | `tooling/*`               | Forbidden                    |
| `infra/*`              | application artifacts     | Allowed                      |
| runtime code           | `infra/*`                 | Forbidden                    |
| `docs/*`               | implementation references | Allowed                      |
| runtime implementation | authored `docs/*`         | Forbidden by default         |

`Restricted` means that package-to-package dependencies require explicit responsibility alignment and may be governed by more specific rules below.

---

# Package Dependency Principles

Packages should form a directed dependency graph.

Circular dependencies are forbidden.

Valid dependency graphs should be understandable in one direction.

Prefer:

```text
A
↓
B
↓
C
```

over:

```text
A ↔ B
```

A circular dependency usually indicates:

- unclear ownership;
- misplaced responsibility;
- an abstraction at the wrong level;
- two concepts that should be merged;
- a missing lower-level dependency.

Circular dependencies must not be solved with dynamic imports, global registries, or other technical workarounds merely to hide the cycle.

The architectural problem must be addressed.

---

# Package Stability

More stable concepts should generally sit lower in the dependency graph.

More volatile implementation concerns should depend on stable abstractions where useful.

Conceptually:

```text
application composition
        ↓
application behavior
        ↓
domain concepts
```

and:

```text
infrastructure implementation
        ↓ implements
stable capability boundary
```

This does not require strict adherence to a specific named architecture pattern.

The principle is that high-volatility infrastructure should not unnecessarily control stable domain behavior.

---

# Domain Dependencies

If `packages/domain/` exists, it should remain among the most stable shared packages.

It should not depend directly on:

```text
HTTP frameworks
UI frameworks
database clients
ORMs
telemetry vendors
cloud SDKs
message brokers
filesystem-specific infrastructure
application entry points
```

Potential valid dependencies may include:

```text
language/runtime standard library
small foundational value libraries
carefully selected shared primitives
```

even these should be introduced deliberately.

The domain package should not become dependent on transport, persistence, or deployment concerns.

---

# Contracts Dependencies

If `packages/contracts/` exists, it should represent explicit cross-boundary contracts.

It should avoid dependencies on:

```text
application internals
ORM models
HTTP framework request types
database clients
UI frameworks
deployment infrastructure
```

Potential dependencies may include:

```text
schema validation library
serialization primitives
shared identifiers
small stable type primitives
```

Contracts should remain usable by multiple consumers without importing unrelated runtime dependencies.

---

# Database Dependencies

If `packages/database/` exists, it may depend on database-specific infrastructure such as:

```text
database driver
ORM
migration tooling
schema tooling
database observability integration
```

It must not depend on:

```text
apps/api
apps/web
apps/mobile
apps/desktop
```

Database infrastructure may implement persistence contracts defined elsewhere.

For example:

```text
domain/application boundary
        ↑
repository interface

database package
        ↓ implements
repository interface
```

The exact placement of repository interfaces will be defined by the selected application architecture.

---

# SDK Dependencies

If `packages/sdk/` exists, it may depend on:

```text
public contracts
transport primitives
serialization logic
generated client code
```

It must not depend on:

```text
backend application internals
database code
private domain implementation
server-only secrets
```

An SDK represents a supported consumer-facing interface.

It must not become a disguised import path into backend internals.

---

# Observability Dependencies

If `packages/observability/` exists, it may expose shared telemetry primitives.

Other packages may depend on observability only when doing so does not cause vendor-specific infrastructure to leak into stable business logic unnecessarily.

Prefer:

```text
application/infrastructure
        ↓
observability primitives
        ↓
vendor adapter
```

over:

```text
domain logic
        ↓
vendor-specific telemetry SDK everywhere
```

Domain-level telemetry may be useful, but business behavior should not become coupled to a specific observability provider.

---

# Configuration Dependencies

If `packages/config/` exists, it may provide configuration validation and loading primitives.

Packages should not depend on large application-wide configuration objects when they require only a small number of settings.

Prefer:

```text
PaymentService(
    timeout,
    retryPolicy
)
```

over:

```text
PaymentService(globalApplicationConfig)
```

when the broader dependency is unnecessary.

This keeps dependencies explicit and reduces hidden coupling.

---

# Testing Dependencies

Production runtime code must not depend on testing infrastructure.

Invalid:

```text
packages/domain
    ↓
packages/testing
```

unless the dependency exists only inside test source files or test-specific build paths.

Testing utilities may depend on application or package public APIs where necessary.

Tests may have broader dependency access than runtime code, but tests should not routinely bypass architecture in ways that hide invalid production design.

---

# UI Dependencies

If shared UI packages exist, platform compatibility must be explicit.

For example:

```text
apps/web
    ↓
packages/ui-web
```

may be reasonable.

A generic:

```text
packages/ui
```

should not be assumed to work across web, mobile, and desktop unless the implementation genuinely supports those environments.

Client-specific UI packages must not become dependencies of backend or domain packages.

---

# Application Internal Dependency Direction

Within an application, dependencies should generally flow from outer delivery mechanisms toward stable behavior.

A conceptual backend model may look like:

```text
transport
    ↓
application
    ↓
domain
```

Infrastructure may implement interfaces required by application or domain behavior:

```text
transport
    ↓
application
    ↓
domain

infrastructure
    ↑ implements required capabilities
```

The exact folder structure and abstraction model will be defined separately.

The important rule is that:

```text
domain behavior
```

must not become dependent on:

```text
HTTP transport
database ORM
application bootstrap
vendor SDK details
```

without explicit architectural justification.

---

# UI Application Dependency Direction

A conceptual client application may look like:

```text
routing/pages
    ↓
features
    ↓
application/client logic
    ↓
contracts/SDK
```

UI components should not directly reach arbitrary backend transport or persistence concerns.

For example, avoid:

```text
Button component
    ↓
raw HTTP library
    ↓
backend endpoint
```

when the project architecture defines a client/service boundary.

Prefer:

```text
UI
    ↓
feature operation
    ↓
SDK/client boundary
```

when that separation improves consistency and testability.

---

# Composition Root

Applications should have a recognizable composition root.

The composition root is where concrete implementations are wired together.

For example:

```text
bootstrap
  ├── database adapter
  ├── telemetry provider
  ├── external integrations
  ├── application services
  └── transport
```

Low-level modules should not independently construct unrelated infrastructure.

Prefer:

```text
composition root creates dependencies
        ↓
dependencies are passed explicitly
```

over:

```text
any module may initialize infrastructure globally
```

This makes dependency direction easier to reason about and test.

---

# Direct Imports vs Dependency Injection

Dependency injection does not require a framework.

The important distinction is between:

```text
stable module dependency
```

and:

```text
runtime implementation dependency
```

Direct imports are appropriate for stable pure dependencies.

For replaceable infrastructure, explicit injection may provide clearer ownership.

Example:

```text
OrderService
    depends on
PaymentGateway
```

with:

```text
StripePaymentGateway
    implements
PaymentGateway
```

Application composition chooses the implementation.

Do not create interfaces for every class.

Abstraction should correspond to a meaningful boundary.

---

# External Provider Dependencies

Third-party provider SDKs should normally remain near integration boundaries.

For example:

```text
application capability
    ↓
payment abstraction
    ↓
payment provider adapter
    ↓
provider SDK
```

Avoid provider SDK usage spreading throughout unrelated code.

This reduces:

- vendor coupling;
- test complexity;
- migration cost;
- accidental leakage of provider concepts.

However, do not wrap a library merely to hide its name.

An abstraction should represent an application capability, not just duplicate another API.

---

# Persistence Dependency Rules

Domain or application behavior should not depend on raw database representation unnecessarily.

Avoid coupling such as:

```text
application service
    ↓
ORM-generated record type
```

when persistence and application semantics differ.

Prefer explicit persistence boundaries when they provide value.

For example:

```text
application service
    ↓
OrderRepository
    ↓
database implementation
```

The project should not introduce repository abstractions mechanically for every table.

Persistence abstractions should protect meaningful behavior or ownership boundaries.

---

# ORM Models Are Not Automatically Domain Models

An ORM-generated type may represent:

```text
storage structure
```

while the domain may represent:

```text
business meaning
```

These may align in simple cases.

They may diverge in more complex cases.

Do not assume:

```text
ORM model = domain entity = API contract = UI model
```

solely to reduce mapping code.

Sharing a representation is acceptable only when the concepts genuinely have the same semantics.

---

# Public API Dependencies

Public API contracts must not depend on private implementation types.

For example, avoid exposing:

```text
database enum
ORM metadata
internal error class
internal aggregate representation
provider-specific identifiers
```

unless those concepts are intentionally part of the public contract.

Public contracts should evolve according to consumer requirements rather than internal implementation convenience.

---

# Error Dependency Rules

Internal exceptions or error classes may be richer than externally exposed error contracts.

Prefer:

```text
internal domain/application error
        ↓ mapped to
public API error
```

over exposing arbitrary internal exceptions directly.

Consumers should depend on stable public error codes or schemas.

They should not depend on:

```text
class names
stack traces
ORM exceptions
vendor errors
database driver messages
```

---

# Shared Identifier Dependencies

Identifiers may be shared when they represent a true cross-boundary concept.

For example:

```text
UserId
OrderId
PaymentId
```

may be valid shared concepts.

However, implementation-specific identifiers should not leak automatically.

For example:

```text
database row identifier
external provider ID
internal correlation ID
public business identifier
```

may have different ownership and semantics.

Do not unify them merely because they are all strings or UUIDs.

---

# Events Dependency Rules

Event producers and consumers should depend on canonical event contracts rather than each other's implementation.

Valid:

```text
producer
    ↓
event contract

consumer
    ↓
event contract
```

Invalid:

```text
consumer
    ↓
producer internal event implementation
```

Events must not create hidden circular ownership.

---

# Infrastructure Dependency Direction

Infrastructure adapters may depend on stable capability contracts.

Stable business logic should avoid dependencies on infrastructure implementations.

Conceptually:

```text
business capability
      ↑
   interface
      ↑
infrastructure adapter
```

At runtime, the application composition root wires them together.

This is dependency inversion where it provides actual architectural value.

It should not be applied mechanically to trivial implementation details.

---

# Tooling Dependency Direction

Repository tooling may depend on or inspect application structure.

Examples:

```text
architecture validator
    ↓ inspects
apps/
packages/
```

```text
documentation generator
    ↓ reads
schemas
```

Tooling must not become a runtime dependency.

Tooling may use internal repository knowledge because repository maintenance is its responsibility.

That does not grant application runtime code permission to depend on tooling internals.

---

# Documentation Generation Dependencies

Generated documentation should depend on canonical machine-readable sources.

Examples:

```text
database schema
    ↓
database documentation generator
    ↓
docs/generated/database
```

```text
API schema
    ↓
OpenAPI
    ↓
API documentation
```

Do not create reverse dependencies where application behavior depends on generated documentation.

---

# Forbidden Generic Dependency Patterns

The following patterns should be treated with suspicion or prohibited when they hide ownership.

---

## Generic `common` Package

Avoid:

```text
packages/common
```

when it contains unrelated code required by many areas.

This creates an unstructured dependency magnet.

Prefer narrower ownership:

```text
packages/contracts
packages/config
packages/observability
```

---

## Generic `utils` Package

Avoid making all applications depend on:

```text
packages/utils
```

without a clearly defined responsibility.

Small utility logic should normally remain local unless it represents a stable reusable capability.

---

## Application Internal Reuse

Do not create dependencies such as:

```text
apps/mobile
    ↓
apps/web/src/utils
```

Move genuinely shared behavior into an appropriate package.

---

## Infrastructure Leakage

Avoid:

```text
domain
    ↓
ORM
```

```text
domain
    ↓
HTTP framework
```

```text
contracts
    ↓
cloud provider SDK
```

unless the architecture explicitly justifies such coupling.

---

## Dependency Through Global State

Avoid hiding dependencies behind:

```text
global registries
service locators
mutable singletons
ambient runtime state
```

when explicit dependency relationships are practical.

A hidden dependency is still a dependency.

It is simply harder to understand.

---

# Client/Server Dependency Rules

Client applications may depend on:

```text
public contracts
generated SDKs
client-safe shared primitives
```

Client applications must not depend on:

```text
server credentials
database packages
server-only environment configuration
backend application internals
private infrastructure adapters
```

Build tooling should eventually prevent server-only modules from being bundled into client applications.

---

# Server-Only and Client-Safe Code

Packages that may be consumed by client applications must be explicitly safe for those environments.

A package intended for both client and server runtimes must not accidentally import:

```text
filesystem APIs
server secrets
database clients
server-only SDKs
privileged environment configuration
```

Runtime compatibility should eventually become mechanically validated.

---

# Secret Dependency Rules

Secrets belong only in trusted runtime boundaries that require them.

A client-safe package must never depend on secret configuration.

For example:

```text
apps/web
    ✕
DATABASE_URL
```

```text
apps/mobile
    ✕
PRIVATE_API_KEY
```

Secrets must not become part of generated client artifacts or shared public configuration.

---

# Cross-Domain Dependencies

Business domains should avoid arbitrary internal dependencies.

For example:

```text
orders
    ↓
payments
```

may be valid if the business model requires it.

But repeated cross-domain access should be represented through explicit capabilities rather than unrestricted internal imports.

As domain boundaries become concrete, more specific dependency rules should be documented.

A dependency between domains should answer:

- Why does the dependency exist?
- Which domain owns the concept?
- Is the dependency synchronous or asynchronous?
- Is the dependency part of a stable business contract?
- Could the interaction be represented more explicitly?

---

# Avoid Bidirectional Domain Dependencies

Avoid:

```text
orders ↔ payments
```

Prefer determining ownership and direction.

For example:

```text
orders
    ↓ requests
payments capability
```

with:

```text
payments
    ↓ emits
PaymentCaptured event
```

when that matches actual semantics.

The exact pattern depends on the domain.

The important rule is to avoid hidden circular business ownership.

---

# Read Dependencies and Write Dependencies

Reading another domain's data is still a dependency.

A module must not assume that read-only access is harmless.

For example:

```text
Orders module
    ↓ directly queries
Users tables
```

creates coupling even if it performs no writes.

Where domain ownership matters, reads should also respect explicit boundaries.

---

# Database Table Ownership

When database ownership becomes defined, modules should access tables according to ownership rules.

Potential model:

```text
Orders module
    owns
orders
order_items
```

```text
Users module
    owns
users
user_profiles
```

An unrelated module should not modify those structures directly without an explicit architectural reason.

Direct cross-domain table access may be prohibited or constrained.

These rules should eventually be enforced where practical.

---

# Dependency on Generated Code

Authored code may depend on generated code when the generated artifact has a stable role.

For example:

```text
web
    ↓
generated API SDK
```

is valid.

But generated code should remain:

- reproducible;
- clearly identified;
- derived from a canonical source;
- excluded from manual modification.

Generated code must not become the only place where important semantics are documented.

---

# Versioned Dependencies

When separately released artifacts exist, version compatibility becomes part of the dependency relationship.

Examples:

```text
mobile application
    ↓
API contract version
```

```text
published SDK
    ↓
public API
```

```text
event consumer
    ↓
event schema version
```

Breaking dependency compatibility requires an explicit migration strategy.

---

# Dependency Additions

Before adding a new dependency edge, ask:

1. Which responsibility requires this dependency?
2. Is the dependency direction correct?
3. Is the target the canonical owner of the capability?
4. Is a public API available?
5. Is this creating a cycle?
6. Is this coupling stable concepts to volatile infrastructure?
7. Could the interaction be expressed through an existing contract?
8. Is a new abstraction actually necessary?
9. Does this increase runtime or deployment coupling?
10. Can the dependency be mechanically validated?

If the dependency feels convenient but ownership is unclear, do not add it until the responsibility is understood.

---

# Third-Party Dependencies

External libraries also create architectural dependencies.

Before introducing a foundational third-party dependency, consider:

- responsibility;
- maintenance status;
- security history;
- license;
- ecosystem maturity;
- runtime cost;
- bundle cost;
- portability impact;
- testability;
- lock-in;
- overlap with existing dependencies.

Multiple competing foundational libraries should not be introduced casually.

Examples include multiple:

```text
HTTP clients
validation libraries
logging systems
date libraries
ORMs
state-management frameworks
```

without an explicit reason.

---

# Transitive Dependencies

Do not rely intentionally on undeclared transitive dependencies.

If code directly uses a library, that dependency should normally be declared explicitly by the owning package or application.

This makes ownership and upgrades predictable.

---

# Optional Dependencies

Optional dependencies should correspond to genuinely optional capabilities.

Do not use optional dependency mechanisms to hide unclear architecture or incompatible runtime requirements.

---

# Dynamic Dependencies

Dynamic imports, plugin loading, reflection, and runtime resolution may obscure dependency graphs.

They are acceptable when required by a real use case.

They must not be used to circumvent dependency enforcement.

Architectural dependency analysis should account for dynamic relationships when they materially affect runtime behavior.

---

# Dependency Cycles

Dependency cycles are prohibited by default.

When a cycle appears:

1. identify the shared responsibility;
2. determine its correct owner;
3. extract a lower-level contract if appropriate;
4. merge responsibilities if they are actually one concept;
5. reconsider the boundary.

Do not resolve cycles merely through:

```text
lazy imports
runtime service location
duplicated interfaces with hidden coupling
manual initialization order
```

unless the architecture genuinely requires such behavior.

---

# Dependency Depth

Deep dependency graphs increase reasoning cost.

Avoid unnecessary layers such as:

```text
A → B → C → D → E → F
```

when intermediate abstractions add no semantic value.

Each dependency layer should represent a meaningful responsibility.

The objective is not the fewest dependencies possible.

The objective is the clearest dependency graph possible.

---

# Dependency Fan-Out

A module with dependencies on many unrelated components may have too many responsibilities.

High fan-out should trigger architectural review.

For example:

```text
OrderService
  ├── database
  ├── email
  ├── payments
  ├── analytics
  ├── file storage
  ├── notifications
  ├── search
  └── feature flags
```

may indicate excessive orchestration or insufficient boundaries.

High fan-out is not automatically wrong, but it should be intentional.

---

# Dependency Fan-In

High fan-in may indicate a stable foundational component.

It may also indicate a dangerous dependency magnet.

Packages heavily depended upon by the repository should:

- remain focused;
- remain stable;
- have strong compatibility discipline;
- avoid unnecessary dependencies;
- have high-quality tests;
- expose narrow public APIs.

Changes to foundational packages require additional care.

---

# Dependency Ownership

Every dependency should have an identifiable owner on both sides.

The consuming component owns why it requires the dependency.

The providing component owns the stability and semantics of its public API.

Consumers must not depend on undocumented implementation behavior.

---

# Public vs Internal Dependency Surface

Packages and applications should distinguish public APIs from internal implementation.

Consumers should depend only on supported public surfaces.

Invalid:

```text
@orion/contracts/src/internal/parser
```

Prefer:

```text
@orion/contracts
```

or an explicitly exported public subpath.

Tooling should eventually reject unsupported internal imports.

---

# Barrel Exports

Barrel files or package entry points may be useful for defining public API surfaces.

They must not be used to flatten unrelated architecture into one giant namespace.

A public API should make supported dependencies clearer, not hide ownership.

---

# Dependency Enforcement

Dependency rules should progressively become mechanically enforced.

Potential enforcement targets include:

- application-to-application imports;
- package-to-application imports;
- package cycles;
- unsupported internal imports;
- client-to-server-only imports;
- forbidden domain dependencies;
- tooling/runtime boundary violations;
- infrastructure/runtime boundary violations;
- undeclared dependencies;
- generated-source boundaries.

Validation should fail when architectural rules are violated.

---

# Enforcement Error Quality

Dependency violations should produce actionable diagnostics.

Prefer:

```text
ARCH_DEP_001

Forbidden dependency:
apps/web -> apps/api

Applications must not import other application internals.

Use a shared contract or runtime API boundary instead.

See:
docs/architecture/application-boundaries.md
docs/architecture/dependency-rules.md
```

over:

```text
Import not allowed.
```

Architecture tooling is part of the developer interface.

---

# Enforcement Location

The same core dependency rules should be usable:

```text
locally
in CI
by AI agents
by editors when practical
```

CI must not be the first place where a contributor discovers an obvious dependency violation if earlier feedback is practical.

---

# Temporary Exceptions

A temporary dependency exception may be acceptable when there is a concrete reason.

Exceptions must not silently become permanent architecture.

A significant exception should document:

- the forbidden dependency;
- why it is temporarily required;
- its scope;
- associated risk;
- removal condition.

Where practical, temporary exceptions should be tracked mechanically.

---

# Permanent Exceptions

A permanent exception to a major dependency rule represents an architectural decision.

It should normally require an ADR.

The dependency rule documentation should then be updated if the exception changes the general architecture.

---

# Migration of Dependency Rules

When introducing stricter enforcement into an existing codebase:

1. define the desired rule;
2. measure current violations;
3. prevent new violations;
4. migrate existing violations deliberately;
5. remove temporary exceptions;
6. make the rule fully blocking.

Do not weaken the intended architecture merely because legacy code currently violates it.

---

# AI Agent Requirements

AI agents must inspect dependency ownership before introducing new imports or package relationships.

Before creating a dependency, an agent should:

```text
search for an existing public API;
identify the owner of the required capability;
check whether the dependency direction is allowed;
avoid internal implementation imports;
avoid creating cycles;
prefer established patterns;
```

An AI agent must not bypass a dependency rule merely because doing so completes the immediate task faster.

When a legitimate requirement conflicts with the current dependency architecture, the conflict must be reported and resolved explicitly.

---

# Example: Valid Web Dependency

```text
apps/web
    ↓
packages/sdk
    ↓
packages/contracts
```

Possible interpretation:

```text
web
uses supported API client

SDK
implements API consumption

contracts
define shared API semantics
```

No backend internals are imported.

---

# Example: Invalid Web Dependency

```text
apps/web
    ↓
apps/api/src/orders/order-service
```

Problems:

```text
application boundary violation;
server implementation leaked into client;
runtime trust boundary ignored;
backend deployment assumptions leaked into web;
```

Corrective direction:

```text
apps/web
    ↓
API contract / SDK
    ↓ runtime
apps/api
```

---

# Example: Valid Backend Persistence Dependency

```text
application operation
    ↓
repository capability

database adapter
    ↑ implements
repository capability
```

Application composition connects both sides.

Persistence technology remains outside the stable business capability.

---

# Example: Invalid Domain Dependency

```text
packages/domain
    ↓
ORM
```

if the ORM exists purely as persistence infrastructure.

This couples business behavior to storage technology unnecessarily.

A simpler project may deliberately choose a more direct model, but that choice must be explicit.

---

# Example: Valid Event Dependency

```text
API
    ↓
packages/contracts/events

Worker
    ↓
packages/contracts/events
```

The producer and consumer share the event contract.

They do not import each other's implementation.

---

# Example: Invalid Tooling Dependency

```text
apps/api
    ↓
tooling/repository-config-reader
```

Repository tooling must not become part of the application runtime.

If the application needs configuration functionality, that capability should belong in an appropriate runtime package.

---

# Example: Provider Isolation

Prefer:

```text
application
    ↓
EmailSender capability
    ↓
provider adapter
    ↓
external email SDK
```

over:

```text
application module A ─┐
application module B ─┼→ external email SDK
application module C ─┘
```

when email delivery is a meaningful shared capability.

---

# Initial Rules

Before the full Orion stack exists, the following rules should be considered foundational:

1. Applications must not import other applications.
2. Packages must not depend on applications.
3. Runtime code must not depend on repository tooling.
4. Runtime code must not depend on infrastructure definitions.
5. Circular dependencies are forbidden.
6. Consumers must not import unsupported package internals.
7. Client code must not depend on server-only capabilities.
8. Generated artifacts must depend on canonical sources, not the reverse.
9. Infrastructure-specific concerns should not leak into stable domain behavior without explicit justification.
10. New dependency edges must follow explicit ownership.

These rules should become mechanically enforceable as soon as the selected technology stack allows it.

---

# Future Dependency Model

As Orion's concrete stack and package topology are defined, this document should evolve from general rules into an explicit machine-enforceable dependency map.

For example, a future model may define relationships such as:

```text
apps/api
    → packages/application
    → packages/domain

apps/api
    → packages/database

apps/web
    → packages/sdk
    → packages/contracts

packages/database
    → packages/domain

packages/contracts
    → foundational schemas
```

This example is intentionally non-normative today.

The actual dependency graph must be decided from real responsibilities rather than copied from a theoretical architecture.

---

# Summary

Dependency direction expresses architecture.

The primary repository rules are:

```text
apps may depend on packages

apps may not depend on other apps

packages may not depend on apps

runtime code may not depend on tooling

runtime code may not depend on infrastructure definitions

package dependencies must be explicit and acyclic

public APIs must be respected

client/server trust boundaries must be preserved
```

Dependencies should follow responsibility rather than convenience.

Stable business concepts should not become unnecessarily coupled to volatile infrastructure.

A monorepo provides visibility.

It does not grant unrestricted dependency access.

As Orion evolves, these rules should increasingly move from written policy to automated enforcement.
