# Application Boundaries

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0004](../adr/0004-select-fastify-as-the-backend-http-framework.md), [ADR-0008](../adr/0008-select-react-vite-and-tanstack-for-web-applications.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Types of Boundaries](#types-of-boundaries)
- [Backend API Application](#backend-api-application)
- [Web Application](#web-application)
- [Shared Contracts](#shared-contracts)
- [Creating a New Application Boundary](#creating-a-new-application-boundary)
- [Boundary Enforcement](#boundary-enforcement)

Related policy: [dependency rules](dependency-rules.md), [principles](../api/principles.md).

## Purpose

This document defines how application boundaries are represented in Orion.

Its goal is to establish clear responsibilities between executable applications, shared packages, runtime integrations, and domain capabilities.

Applications may live in the same monorepo, but they must not behave as if they were one undifferentiated codebase.

A monorepo provides shared visibility.

It does not remove architectural boundaries.

---

## What Is an Application?

An application is an independently meaningful executable runtime or delivery surface.

Examples may include:

```text
apps/
├── api/
├── web/
├── mobile/
├── desktop/
├── worker/
└── cli/
```

An application normally has its own:

- entry point;
- runtime lifecycle;
- configuration;
- dependency composition;
- build process;
- deployment or distribution model;
- observability initialization;
- operational characteristics;
- platform-specific behavior.

Not every executable process requires a separate application.

A new application boundary should exist only when there is a meaningful runtime or product reason for it.

---

## Application Boundaries Are Architectural Boundaries

Applications must not depend on the private implementation of other applications.

The following is not allowed:

```text
apps/web
    ↓ imports
apps/api/src/orders/order-service
```

Neither is:

```text
apps/worker
    ↓ imports
apps/api/src/internal/database-access
```

Even when these imports are technically possible inside the monorepo, they violate application ownership.

Applications may share behavior through explicit packages.

They may communicate with other applications through explicit runtime contracts.

---

## Applications Are Consumers of Shared Capabilities

The intended high-level model is:

```text
                    shared packages
                         ▲   ▲
                         │   │
             ┌───────────┘   └───────────┐
             │                           │
          apps/api                    apps/web

             │                           │
             └──────── runtime ──────────┘
                     communication
```

Applications may depend on shared packages when those packages represent genuine shared responsibilities.

Applications must not use shared packages as a mechanism to bypass another application's boundary.

---

## Types of Boundaries

Orion distinguishes several kinds of boundaries.

---

### Runtime Boundary

A runtime boundary separates independently executing processes or applications.

Examples:

```text
browser
    ↕ HTTPS
API server
```

```text
API server
    ↕ message broker
background worker
```

```text
desktop application
    ↕ HTTPS
API server
```

Crossing a runtime boundary requires an explicit protocol or contract.

Runtime communication must not rely on implementation-level coupling.

---

### Process Boundary

Two components running in different operating system processes must be treated as distributed participants even if they are deployed together.

Communication across process boundaries should use explicit mechanisms such as:

- HTTP;
- RPC;
- messages;
- events;
- operating-system IPC;
- other deliberate transport mechanisms.

Do not model process boundaries as if they were local function calls.

Network and process failures must be considered.

---

### Deployment Boundary

Components that can be deployed independently have compatibility concerns.

A deployment boundary introduces possible states where different versions coexist.

For example:

```text
Web v3
    ↓
API v2
```

or:

```text
API v4
    ↓ publishes
Worker v3 consumes
```

Contracts across deployment boundaries must consider backward compatibility.

Independent deployment should not be introduced without a concrete reason.

---

### Trust Boundary

A trust boundary exists where data crosses between security contexts.

Examples include:

```text
Browser
    ↓
API
```

```text
Mobile application
    ↓
Backend
```

```text
External webhook
    ↓
Application
```

```text
Third-party API
    ↓
Application
```

Data crossing a trust boundary must be validated.

Client-controlled applications must never be considered trusted simply because their source code exists in the same repository.

---

### Persistence Boundary

Persistence infrastructure is a boundary between application behavior and stored state.

Database access must occur through intentional persistence ownership.

The presence of a shared database package does not mean every application may access the database directly.

For example:

```text
Web
    ↓
API
    ↓
Database
```

is fundamentally different from:

```text
Web
    ↓
Database
```

unless direct database access by the web runtime is explicitly part of the architecture.

---

## Backend API Application

The accepted HTTP adapter is [Fastify](../adr/0004-select-fastify-as-the-backend-http-framework.md#decision), with Pino runtime logging. Domain and application ownership remain governed by the boundaries below; plugins do not define business domains.

An API application is responsible for exposing backend capabilities through network contracts.

Potential responsibilities include:

- HTTP or RPC transport;
- request parsing;
- request validation;
- authentication integration;
- authorization enforcement;
- request correlation;
- transport error mapping;
- application-service orchestration;
- runtime dependency composition;
- API telemetry;
- health endpoints.

The API application should not own domain behavior merely because domain operations are exposed through HTTP.

Transport and domain responsibilities should remain distinguishable.

---

### API Transport Must Remain a Boundary

Transport-specific concepts should not unnecessarily leak into business behavior.

For example, domain logic should not normally require:

```text
HTTP request objects
HTTP response objects
HTTP status codes
HTTP framework decorators
cookies
headers
```

unless the behavior genuinely belongs to the HTTP boundary.

Prefer:

```text
HTTP request
    ↓
transport adapter
    ↓
application input
    ↓
business operation
```

and:

```text
business result
    ↓
transport mapping
    ↓
HTTP response
```

---

### API Application Must Not Become the Shared Backend Library

Other applications must not import API internals because the API happens to contain useful logic.

If logic is genuinely reusable, its ownership should be moved to an appropriate shared package or explicit domain boundary.

The API is an executable application.

It is not a general-purpose shared package.

---

## Web Application

The [accepted web direction](../adr/0008-select-react-vite-and-tanstack-for-web-applications.md#decision) is a React 19.x client-first SPA with Vite 8.x and React Compiler when compatible. TanStack Router owns URL/navigation state, TanStack Query owns server state through the generated OpenAPI client, and React state/context handles local UI state. No general global-state library or full-stack web framework is selected by default. Server rendering remains justified by product requirements; Fastify retains authoritative backend responsibilities. These choices are not yet implemented.

The web application owns browser-specific delivery and user experience concerns.

Potential responsibilities include:

- browser routing;
- pages;
- layouts;
- browser rendering;
- user interaction;
- frontend state;
- accessibility;
- browser storage where appropriate;
- web-specific authentication integration;
- API client composition;
- frontend telemetry;
- localization integration;
- web-specific presentation logic.

The web application should consume backend behavior through explicit contracts.

It must not depend on backend implementation details.

---

### Web Application Is Untrusted

The browser is an untrusted execution environment.

Any logic running in the browser may be:

- inspected;
- modified;
- bypassed;
- replayed;
- automated.

Therefore:

```text
client validation
```

is not equivalent to:

```text
server validation
```

and:

```text
hidden UI action
```

is not equivalent to:

```text
authorization enforcement
```

Business-critical validation and authorization must be enforced at trusted boundaries.

---

### Web-Specific Logic Belongs in the Web Application

Browser-specific behavior should normally remain local to the web application.

Examples include:

```text
DOM interaction
browser navigation
browser storage
web accessibility behavior
browser-specific rendering
web-only analytics initialization
```

Such behavior should not be moved into generic shared packages merely for apparent reuse.

---

## Mobile Application

A mobile application is an independently distributed client application.

Potential responsibilities include:

- native or cross-platform mobile UI;
- mobile navigation;
- device capabilities;
- secure device storage;
- offline behavior;
- push notification integration;
- mobile lifecycle management;
- mobile telemetry;
- platform-specific permissions;
- API client integration.

The mobile application is also an untrusted client from the backend perspective.

---

### Mobile Releases May Lag Behind Backend Releases

Unlike server applications, mobile applications may remain installed for long periods.

This means API compatibility must account for older clients where product requirements require continued support.

Potential compatibility concerns include:

```text
API v5
    ↑
mobile v4

API v5
    ↑
mobile v3
```

Breaking backend contracts may therefore have longer operational consequences for mobile clients than for centrally deployed web applications.

Version support policies should be documented when mobile development is introduced.

---

## Desktop Application

A desktop application is an independently installed or distributed client runtime.

Potential responsibilities include:

- desktop UI;
- local operating-system integration;
- local filesystem interaction;
- secure credential storage;
- automatic updates;
- desktop lifecycle behavior;
- local caching;
- desktop telemetry;
- API client integration.

Desktop applications should be treated as untrusted clients when communicating with backend systems.

Possession of desktop binaries must not grant access to server-side secrets or privileged internal capabilities.

---

## Worker Applications

A worker is a runtime dedicated to asynchronous or background processing.

Potential responsibilities include:

```text
queue consumption
scheduled processing
event handling
long-running background work
batch execution
asynchronous integrations
```

Workers should consume explicit application or domain capabilities.

They must not become an alternative path that bypasses business invariants.

For example:

```text
API
    ↓
Order application operation
```

and:

```text
Worker
    ↓
Order application operation
```

should ideally preserve the same core business rules when performing equivalent actions.

---

### Worker-Specific Concerns

Workers must explicitly consider:

- retries;
- idempotency;
- duplicate delivery;
- partial failures;
- dead-letter handling;
- concurrency;
- observability;
- timeout behavior;
- poison messages;
- graceful shutdown.

Asynchronous processing must not assume exactly-once execution unless such guarantees actually exist.

---

## CLI Applications

Command-line tools may exist for operational, administrative, development, or product use.

A CLI application may own:

- command parsing;
- terminal interaction;
- CLI-specific output formatting;
- local command lifecycle;
- command-specific authentication integration.

A CLI must still respect application and domain boundaries.

Administrative convenience is not permission to bypass important invariants.

---

## Application Communication

Applications communicate either through shared compile-time contracts or explicit runtime interfaces.

These are different forms of interaction and must not be confused.

---

### Compile-Time Sharing

Applications may share:

```text
types
schemas
validation
domain primitives
SDKs
observability primitives
configuration primitives
```

through packages.

For example:

```text
apps/api
    ↓
packages/contracts

apps/web
    ↓
packages/contracts
```

This does not mean the applications execute each other's implementation.

---

### Runtime Communication

Applications may communicate using:

```text
HTTP
RPC
events
messages
websockets
IPC
other explicit protocols
```

The selected mechanism should match actual requirements.

Do not introduce asynchronous messaging merely to avoid a direct application dependency if a simpler runtime contract is sufficient.

---

## Shared Contracts

Contracts used across application boundaries must have explicit ownership.

A shared contract may describe:

```text
request
response
event
error
identifier
serialization format
validation requirements
```

The contract should not expose internal implementation details accidentally.

For example, this is undesirable:

```text
Database ORM model
      ↓ directly exported as
Public API response
```

because persistence structure and public contract now evolve together unintentionally.

Prefer deliberate mapping between boundaries where the concepts differ.

---

## Internal Models and External Contracts

Internal models and external contracts may look similar.

Similarity does not imply they are the same responsibility.

Examples:

```text
Database record
Domain entity
Application result
API response
Frontend view model
```

These representations may sometimes be shared.

They may sometimes require explicit transformation.

The decision should depend on semantic ownership, not on reducing lines of code.

---

## Authentication Boundary

Authentication mechanisms may span multiple applications, but authentication authority must be explicit.

Client applications may:

```text
collect credentials
initiate authentication
store permitted session material
present authentication state
```

Trusted backend boundaries must validate authentication claims before accepting them.

Client-provided identity must never be trusted without verification.

---

## Authorization Boundary

Authorization belongs at trusted execution boundaries.

UI applications may hide or disable actions for user experience.

This does not enforce authorization.

For example:

```text
Web UI:
"Delete user" button hidden
```

does not replace:

```text
Backend:
verify actor is authorized to delete user
```

Authorization rules should preferably be represented close to the protected operation.

---

## Database Access Boundaries

Database access must be deliberate.

The default model should be:

```text
Client applications
        ↓
Backend boundary
        ↓
Persistence boundary
        ↓
Database
```

Client applications should not receive database credentials.

Backend modules should not receive unrestricted access to unrelated persistence concerns by default.

As domain ownership becomes concrete, access restrictions should become more specific.

---

## External Services

External providers are boundaries.

Examples include:

```text
payment providers
email services
object storage
identity providers
analytics services
maps
search services
AI providers
third-party APIs
```

External-service integrations should be isolated sufficiently that provider-specific behavior does not spread unnecessarily through the application.

Prefer:

```text
application capability
      ↓
integration boundary
      ↓
provider adapter
```

over:

```text
provider SDK
      ↓
used directly throughout the entire repository
```

This does not require a custom abstraction around every third-party library.

Isolation should correspond to meaningful architectural risk or ownership.

---

## Backend-for-Frontend Boundaries

A dedicated Backend for Frontend should not be introduced by default.

If different clients eventually require substantially different backend orchestration, a BFF may become appropriate.

Potential reasons include:

```text
different aggregation needs
different latency requirements
different authentication mechanisms
independent client evolution
different API composition
```

A BFF should solve a concrete client-boundary problem.

It should not be introduced merely because multiple frontend applications exist.

---

## Shared UI Boundaries

Web, mobile, and desktop applications may share visual concepts without sharing implementation.

Potentially shared concerns include:

```text
design tokens
icons
brand assets
semantic color definitions
spacing systems
typography definitions
```

Platform components should be shared only when their runtime and interaction semantics are genuinely compatible.

Avoid creating cross-platform abstractions that become more complex than maintaining clear platform implementations.

---

## Business Capability Ownership

A business capability should have identifiable ownership regardless of how many applications expose it.

For example:

```text
Orders capability
```

may be used by:

```text
API
Web
Mobile
Worker
```

but the core rule:

```text
A shipped order cannot be cancelled.
```

must not be independently reimplemented in each runtime.

Applications deliver capabilities.

They should not redefine core business truth.

---

## Application Composition

Executable applications are responsible for composition.

Composition includes selecting and wiring concrete implementations of dependencies.

For example:

```text
application bootstrap
        ↓
construct database adapter
        ↓
construct payment provider
        ↓
construct order service
        ↓
register HTTP transport
```

Core domain behavior should not need to know which runtime performed this composition.

---

## Dependency Injection

Orion may use explicit dependency injection where it improves boundary clarity and testability.

This does not imply requiring a dependency injection framework.

Dependencies should be visible rather than obtained through arbitrary global state.

Prefer:

```text
OrderService(
    orderRepository,
    paymentGateway
)
```

over hidden access such as:

```text
GlobalContainer.resolve(...)
```

when explicit composition provides clearer ownership.

The exact dependency injection strategy will be defined after the technology stack is selected.

---

## Global State

Application-global mutable state should be minimized.

Global state makes:

- testing harder;
- concurrency less predictable;
- dependencies less visible;
- AI-assisted reasoning more difficult;
- application composition less explicit.

Process-level infrastructure such as connection pools or telemetry providers may be globally scoped when appropriate, but access should remain intentional.

---

## Cross-Application Data Ownership

Applications must not assume ownership of another application's internal data representation.

If multiple applications require access to the same underlying business information, ownership must be explicit.

Possible models include:

```text
single backend owns persistence
clients consume API
```

or, if justified:

```text
multiple trusted runtimes
share controlled persistence capabilities
```

The latter requires explicit architecture and should not emerge accidentally from monorepo convenience.

---

## Direct Database Sharing Between Backend Applications

If multiple trusted backend applications eventually use the same database, direct access should not automatically imply shared ownership.

For example:

```text
API
    ↓
Orders tables

Worker
    ↓
Orders tables
```

may be acceptable if both are part of the same logical application boundary and share the same domain ownership model.

However:

```text
Service A
    ↓ modifies
Service B-owned tables
```

creates coupling that should be treated as an architectural decision.

Database sharing must never be used to bypass an explicit service boundary accidentally.

---

## Events

Events should represent meaningful facts or integration signals.

Examples:

```text
OrderPlaced
PaymentCaptured
UserRegistered
```

Events should not be introduced simply because asynchronous architecture appears more flexible.

Event ownership, schema, delivery guarantees, ordering expectations, and compatibility requirements should be explicit.

Consumers must not depend on undocumented event behavior.

---

## Synchronous vs Asynchronous Communication

Synchronous communication is appropriate when the caller requires an immediate result.

Asynchronous communication is appropriate when:

- immediate completion is unnecessary;
- processing may be long-running;
- retry isolation is useful;
- temporal decoupling provides real value;
- multiple independent consumers need notification.

Do not select asynchronous communication solely to make the architecture appear more distributed.

Every asynchronous boundary introduces additional failure modes.

---

## Failure Boundaries

Each application boundary creates potential independent failure.

For runtime communication, consider:

```text
timeout
network failure
partial failure
retry
duplicate request
temporary dependency outage
incompatible version
```

Application design must not assume remote operations behave like local function calls.

Failure behavior should become part of the contract.

---

## Timeouts

Remote calls should have explicit timeout behavior.

Unbounded waits create cascading operational failures.

Timeout values should reflect the semantics of the operation rather than arbitrary defaults when the operation is important.

Timeout handling should be observable.

---

## Retries

Retries should be deliberate.

A retry may repeat side effects.

Before retrying an operation, determine whether:

```text
the operation is idempotent;
an idempotency key exists;
duplicate effects are safe;
the failure is plausibly transient;
retry load may worsen the incident.
```

Retry policies should not be scattered independently across applications when consistent behavior is required.

---

## Compatibility Across Application Boundaries

Applications that can run different versions simultaneously must consider compatibility.

This may apply to:

```text
mobile ↔ API
desktop ↔ API
worker ↔ message schema
web ↔ API during rolling deployment
service ↔ service
```

Compatibility expectations should be explicit.

Breaking a shared contract should require deliberate migration rather than accidental synchronized assumptions.

---

## Versioning

Versioning should be introduced when there is an actual compatibility requirement.

Do not version internal boundaries prematurely.

Potential versioning targets may include:

```text
public APIs
external events
mobile-supported contracts
SDK releases
persistent file formats
```

Versioning strategy should be defined in dedicated API or contract documentation when required.

---

## Feature Ownership Across Applications

A feature may have implementation in multiple applications.

For example:

```text
orders/
```

could exist in:

```text
apps/api/
apps/web/
apps/mobile/
```

These directories represent different delivery responsibilities for the same business capability.

Their existence does not imply direct imports between them.

Shared semantics belong in shared contracts or domain packages.

Platform-specific behavior remains local.

---

## Example: Order Cancellation

A valid conceptual flow may look like:

```text
Web UI
    ↓
generated/shared client contract
    ↓
API transport
    ↓
Order application operation
    ↓
Order domain rules
    ↓
Order persistence
    ↓
Database
```

The web application may know:

```text
the operation exists;
the request shape;
the response shape;
the public error contract.
```

It should not need to know:

```text
which ORM is used;
which tables are modified;
which repository implementation is used;
which transaction mechanism exists;
which payment SDK is called internally.
```

---

## Example: Background Processing

Suppose an order requires asynchronous fulfillment.

A possible boundary is:

```text
API
    ↓
OrderPlaced event
    ↓
Worker
    ↓
Fulfillment application operation
```

The worker consumes an explicit event contract.

It must not reach into API-internal files to obtain order behavior.

Shared domain behavior may be consumed from an appropriate package if the architecture defines such ownership.

---

## Example: Mobile Client

A mobile client may use:

```text
apps/mobile
    ↓
packages/sdk
    ↓
API
```

The SDK may be generated from the canonical API contract.

The mobile application should not need to reproduce backend request and response structures manually.

---

## Local Application Documentation

Each sufficiently complex application should eventually document:

```text
purpose
runtime
entry point
configuration
internal structure
external dependencies
public interfaces
development commands
build process
deployment model
observability initialization
```

This information may live in:

```text
apps/<application>/README.md
```

and application-specific agent instructions may live in:

```text
apps/<application>/AGENTS.md
```

These files should not duplicate repository-wide rules unnecessarily.

---

## Application-Specific `AGENTS.md`

An application-specific `AGENTS.md` may define local rules such as:

```text
allowed dependency directions
framework-specific conventions
testing commands
generation commands
application-specific architecture
important files
forbidden patterns
```

It should assume the root [AGENTS.md](../../AGENTS.md) already applies.

Local files should contain only the additional context required for that application.

---

## Creating a New Application Boundary

Before creating a new application, answer:

1. What runtime responsibility requires separation?
2. Why can an existing application not own this responsibility?
3. Does it require independent deployment or distribution?
4. What contracts will it expose or consume?
5. Which shared packages will it use?
6. What persistent data may it access?
7. What trust boundaries exist?
8. What are its observability requirements?
9. What failure modes are introduced?
10. Does the new boundary justify its operational complexity?

A significant new application boundary should normally require an ADR.

---

## Splitting an Existing Application

Do not split an application merely because it has become large.

Size alone is not sufficient justification.

A split may be justified by:

```text
independent scaling requirements
different security boundaries
different operational ownership
different runtime requirements
independent deployment needs
failure isolation requirements
clear domain autonomy
```

Before splitting, ensure the logical boundary already exists.

Prefer:

```text
modular boundary
      ↓
proven independence
      ↓
runtime separation
```

over:

```text
large codebase
      ↓
immediate distributed system
```

---

## Merging Applications

Application boundaries are not permanent merely because they once existed.

If two applications create unnecessary operational complexity without meaningful independence, merging them may be appropriate.

Architecture should optimize for clear responsibility rather than maximizing the number of runtime boundaries.

---

## Monolith and Modular Boundaries

Orion defaults toward logical modularity before physical distribution.

A single backend deployment may contain multiple domain modules:

```text
API application
├── users
├── orders
├── payments
└── notifications
```

These modules should still have clear boundaries.

Running in the same process does not justify unrestricted internal coupling.

A modular monolith can preserve boundaries without paying the operational cost of distributed services.

---

## Microservices

Microservices are not a default goal.

A service boundary introduces costs such as:

```text
network failure
distributed tracing
deployment coordination
contract compatibility
service discovery
retry behavior
operational monitoring
data ownership complexity
distributed transactions
```

A service should exist when its independence provides sufficient value to justify those costs.

Service extraction should normally follow an already clear logical boundary.

---

## Serverless Functions

Deployment technology does not define application architecture automatically.

Multiple serverless functions may belong to:

```text
one logical application
```

or to:

```text
multiple independent applications
```

depending on ownership and contracts.

Do not let deployment primitives determine domain architecture accidentally.

---

## Repository Placement Does Not Define Runtime Trust

Code living under the same monorepo does not imply equal trust.

For example:

```text
apps/web
apps/api
```

exist in the same repository.

At runtime:

```text
web client = untrusted

API server = trusted backend boundary
```

Trust is determined by runtime security context, not repository proximity.

---

## Boundary Enforcement

Application boundaries should eventually be mechanically enforced.

Potential rules include:

```text
applications cannot import other applications;
applications may import only allowed packages;
client applications cannot import server-only packages;
shared packages cannot depend on applications;
internal application modules are not externally importable;
forbidden dependency edges fail CI;
```

The exact enforcement mechanism will depend on the selected stack.

The architectural rule must exist independently of the enforcement tool.

---

## Boundary Violations

When a contributor encounters a boundary that makes a legitimate requirement difficult, the default response should not be to bypass it.

Instead:

1. identify the required interaction;
2. determine the correct owner;
3. determine whether an existing contract is sufficient;
4. introduce or extend an explicit boundary if needed;
5. document significant architectural changes;
6. update mechanical enforcement.

Repeated pressure against a boundary may indicate that the boundary itself needs revision.

---

## Boundary Decision Model

When deciding where behavior belongs, use the following sequence:

```text
Is it specific to one runtime?
        │
       yes
        ↓
    application
```

Otherwise:

```text
Is it a genuinely shared business concept?
        │
       yes
        ↓
 domain/shared capability
```

Otherwise:

```text
Is it a shared cross-application contract?
        │
       yes
        ↓
     contracts
```

Otherwise:

```text
Is it repository development tooling?
        │
       yes
        ↓
      tooling
```

Otherwise:

```text
Is it deployment or operational infrastructure?
        │
       yes
        ↓
       infra
```

If none of these produce a clear answer, reconsider the responsibility before creating a new directory or package.

---

## Summary

Applications are executable boundaries.

Packages are shared capability boundaries.

Applications must not import the internal implementation of other applications.

Cross-application interaction occurs through:

```text
explicit shared contracts
```

or:

```text
explicit runtime communication
```

Client applications are untrusted.

Trusted backend applications must enforce validation, authentication, authorization, and business invariants.

Shared code must represent shared meaning rather than repository convenience.

Logical modularity should precede physical distribution.

New application boundaries must justify the additional architectural and operational complexity they introduce.

The monorepo exists to improve shared visibility and coordination.

It does not eliminate separation of responsibility.
