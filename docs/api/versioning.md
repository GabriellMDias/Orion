# API Versioning

## Purpose

This document defines the API versioning and compatibility policy used by Orion.

Its goals are to ensure that API evolution is:

- intentional;
- compatible where required;
- understandable by consumers;
- resistant to unnecessary version proliferation;
- safe for independently deployed clients;
- suitable for generated contracts and SDKs;
- testable;
- observable;
- maintainable over time.

Versioning exists to manage incompatible contract evolution.

It should not be used as the default response to every API change.

This document is technology-agnostic.

The specific API version representation, routing convention, media type strategy, schema format, deprecation tooling, and SDK versioning model will be selected later through explicit architectural decisions.

This document complements:

- `docs/api/principles.md`;
- `docs/api/error-contract.md`;
- `docs/architecture/versioning-and-compatibility.md`;
- `docs/architecture/application-boundaries.md`;
- `docs/architecture/testing-strategy.md`.

---

## Core Principle

Prefer compatible evolution.

Introduce a new API version only when a meaningful compatibility boundary cannot be preserved reasonably.

The desired decision model is:

```text id="m7s0ph"
proposed API change
        ↓
can existing consumers continue working correctly?
        ↓
yes
    → evolve current contract
        ↓
no
    → can migration/deprecation preserve compatibility?
        ↓
yes
    → migrate within current contract
        ↓
no
    → consider new API version
```

Versioning is a tool for incompatibility.

It is not an architecture goal.

---

# Compatibility Before Versioning

The first question for an API change should be:

```text id="2w36i8"
Can this change be made compatibly?
```

not:

```text id="t5sdzr"
Should we create v2?
```

A new version creates long-term maintenance cost.

Compatible evolution should be preferred when semantics remain clear.

---

# What Versioning Protects

API versioning protects consumers from incompatible changes.

Potential consumers include:

```text id="zh3o39"
web application
mobile application
desktop application
partner integration
public API consumer
CLI
service
automation
AI agent integration
```

Different consumers may have different upgrade speeds.

---

# Consumer Deployment Model Matters

Compatibility requirements depend heavily on how consumers are deployed.

For example:

```text id="cq6i6x"
backend + web deployed atomically
```

may tolerate tighter coordination.

While:

```text id="5zfwh2"
backend + mobile application
```

must account for old client versions remaining in use.

Versioning policy must reflect actual deployment topology.

---

# Public and Internal APIs

Not every API has the same compatibility commitment.

Potential categories include:

```text id="44q91y"
public external API
partner API
mobile backend API
web backend API
internal service API
local-only API
```

The expected compatibility window should be explicit for important contracts.

---

# Internal Does Not Mean Disposable

An internal API may still have independent consumers.

For example:

```text id="z2w3xr"
worker
mobile application
separate deployment
internal integration
```

may depend on it.

The relevant question is:

```text id="obz4ye"
Can all consumers migrate together?
```

not:

```text id="a4ah7r"
Is this API public?
```

---

# Breaking Change

A breaking change is a change that can cause a previously valid consumer to fail, behave incorrectly, or interpret data incorrectly.

Breaking changes may be:

```text id="1zjskg"
structural
semantic
behavioral
security-related
operational
```

---

# Structural Breaking Changes

Common structural breaking changes include:

```text id="3se7l8"
remove field
rename field
change field type
make optional field required
remove operation
change path
change request shape incompatibly
change response shape incompatibly
```

These are usually straightforward to detect.

---

# Semantic Breaking Changes

A contract may remain structurally identical while changing meaning.

Example:

```text id="8fmtwt"
status = "completed"
```

previously means:

```text id="4mn7dd"
payment completed
```

and later means:

```text id="ngc87h"
shipment completed
```

This is a breaking change even though the schema did not change.

Semantic compatibility is as important as structural compatibility.

---

# Behavioral Breaking Changes

Examples include:

```text id="yfh4zn"
operation previously idempotent, now not idempotent

resource previously immediately visible, now eventually consistent

request previously accepted, now rejected

pagination ordering changed

retry semantics changed
```

These may break consumers without changing schema.

---

# Security-Driven Breaking Changes

Security may require immediate incompatible changes.

Examples:

```text id="kz0lfi"
remove unsafe field
tighten authorization
disable vulnerable authentication method
stop accepting insecure input
```

Security takes priority over compatibility.

However, the compatibility impact must still be understood and communicated.

---

# Potentially Compatible Changes

Changes that are often compatible include:

```text id="xl8j14"
add new operation
add optional request field
add optional response field
add new filter
add new optional error detail
```

Compatibility still depends on consumer behavior.

---

# Additive Does Not Always Mean Compatible

Adding a value may still break consumers.

For example:

```text id="iq48rx"
enum:
    pending
    completed
```

becomes:

```text id="crff0b"
enum:
    pending
    processing
    completed
```

A client using exhaustive matching may fail on:

```text id="5jf9z7"
processing
```

Therefore additive evolution must consider actual consumer assumptions.

---

# Enum Expansion

Enum expansion is one of the most common hidden compatibility risks.

Consumers should be designed to tolerate unknown future values where the contract expects extensibility.

Generated SDKs should preserve this capability where possible.

---

# Closed vs Open Enums

Some enums are intentionally closed.

Example:

```text id="rytyfo"
sort direction:
    asc
    desc
```

Others may evolve over time.

Example:

```text id="et58uv"
order status
```

The contract should distinguish these semantics where tooling allows.

---

# Unknown Enum Handling

For extensible enums, clients should have safe fallback behavior.

Conceptually:

```text id="dn16kt"
known values
    → handle normally

unknown value
    → preserve / fallback safely
```

Do not make every enum extensible automatically.

---

# Adding Response Fields

Adding an optional response field is generally compatible if consumers ignore unknown fields.

This assumption must be valid for:

```text id="tykd9u"
serialization library
generated SDK
client implementation
```

Some strict clients may reject unknown properties.

---

# Adding Request Fields

Adding optional request fields is usually compatible.

Adding required request fields is generally breaking for existing consumers.

---

# Making Fields Optional

Changing a required response field to optional may be breaking.

Existing consumers may assume:

```text id="9gm9gh"
field always exists
```

Changing:

```text id="yhe6jd"
required → optional
```

must therefore be treated carefully.

---

# Making Fields Required

Changing:

```text id="wp0w9l"
optional → required
```

for request input is generally breaking.

For responses, requiring a previously optional field may be structurally safe but still changes semantics.

---

# Nullability Changes

Changing nullability may be breaking.

Examples:

```text id="2o7z8l"
non-null → nullable
```

may break consumers that do not handle null.

```text id="o5s5yc"
nullable → non-null
```

may be compatible structurally but changes guarantees.

Nullability is part of the contract.

---

# Type Widening

Type widening may or may not be compatible.

Example:

```text id="cwttfr"
integer
    →
number
```

could break generated clients or precision assumptions.

Compatibility must be evaluated at the consumer representation level.

---

# Numeric Range Expansion

Increasing the possible numeric range may break clients using narrower types.

For example:

```text id="edfjxx"
32-bit integer
```

consumer assumptions may fail if the server begins returning larger values.

---

# String Format Changes

Changing the meaning or format of a string may be breaking even when the schema remains `string`.

Examples:

```text id="q2mf2z"
date format
identifier format
currency representation
URL format
```

Formatting guarantees should remain explicit.

---

# Identifier Changes

Changing resource identifier format may break:

```text id="5ckgc3"
client storage
routing
regex validation
database references
external integrations
```

Identifiers should be treated as stable opaque values unless the contract explicitly promises structure.

---

# Opaque Means Opaque

Consumers should not derive semantics from opaque identifiers.

For example:

```text id="tzhr5y"
usr_123
```

should not imply that consumers may parse:

```text id="mn7ljd"
usr
```

unless the prefix is part of the documented contract.

---

# Ordering Compatibility

Changing default result ordering can be breaking.

Example:

```text id="j6rh7i"
createdAt ascending
```

becomes:

```text id="y5id41"
createdAt descending
```

Consumers may rely on current ordering even if schema remains unchanged.

---

# Pagination Compatibility

Changing:

```text id="iwjwn5"
cursor semantics
page size
ordering
offset behavior
```

may be breaking.

Pagination is part of API behavior.

---

# Default Value Changes

Changing default behavior can break consumers.

Example:

```text id="t0fmvl"
includeArchived default = false
```

becomes:

```text id="klhnzu"
includeArchived default = true
```

even though the request schema is unchanged.

---

# Validation Tightening

Tightening validation can be breaking.

For example:

```text id="hd79k5"
name max length 500
```

becomes:

```text id="q4lz1l"
name max length 100
```

Existing valid requests may begin failing.

---

# Validation Relaxation

Relaxing validation is usually compatible for existing consumers.

It may still affect downstream assumptions or security.

---

# Error Compatibility

Public error codes are part of compatibility.

Potential breaking changes include:

```text id="axpm4m"
rename error code
remove error code
reuse code with new meaning
change details schema incompatibly
change retry semantics
```

---

# HTTP Status Compatibility

Changing the HTTP status for a semantic error may break consumers.

For example:

```text id="rt45w9"
409 → 400
```

may change SDK or retry behavior.

Treat meaningful status mapping as part of the contract.

---

# Authentication Compatibility

Changing authentication requirements can be breaking.

Examples:

```text id="90n1uh"
API key no longer accepted
new mandatory MFA
session cookie replaced with token
```

Security may justify the break, but migration planning is still required.

---

# Authorization Compatibility

Tightening permissions may cause previously successful requests to fail.

This is behaviorally breaking.

It may still be necessary for correctness or security.

---

# Rate-Limit Compatibility

Changing rate limits may affect consumers operationally.

The contract does not need to promise permanent throughput unless explicitly stated.

However, major reductions should be treated as compatibility-impacting for dependent consumers.

---

# Timeout Compatibility

Reducing server timeout below normal historical operation duration may affect consumers.

Operational settings can become de facto contract behavior.

---

# Side-Effect Compatibility

An operation's side effects are part of semantics.

For example, if:

```text id="gbt5od"
creating user
```

previously sends:

```text id="7xjzgl"
welcome email
```

but no longer does, dependent workflows may change.

Public contract documentation should describe externally relevant side effects.

---

# Compatible Evolution

Compatible evolution should generally prefer additive changes.

Conceptual sequence:

```text id="fcdlxf"
existing contract
    ↓
add new capability
    ↓
migrate consumers
    ↓
deprecate old capability
    ↓
remove only when compatibility policy permits
```

---

# Expand and Contract

API evolution may follow an expand-and-contract model similar to database evolution.

Example:

```text id="ab6hod"
add new field
    ↓
support old + new clients
    ↓
migrate consumers
    ↓
deprecate old field
    ↓
remove old field later
```

---

# Dual Contract Support

Temporary support for old and new representations may be necessary.

Examples:

```text id="2iuybf"
accept old and new request field
return both old and new response field
```

This should have explicit removal criteria.

---

# Compatibility Code Is Temporary

Compatibility branches such as:

```text id="zx2m4g"
if oldField exists:
    map to newField
```

should not remain indefinitely without justification.

Track removal conditions.

---

# Deprecation

Deprecation communicates that a contract element still works but should no longer be used.

A deprecation should identify:

```text id="fqh48j"
deprecated element
replacement
reason where useful
migration guidance
removal condition or timeline
```

---

# Deprecation Is Not Removal

A deprecated field or endpoint must remain functional according to the current compatibility commitment.

Do not mark something deprecated and simultaneously change its behavior incompatibly.

---

# Deprecation Without Consumers

If an internal contract has no remaining consumers, a formal long deprecation period may be unnecessary.

Compatibility process should be proportional to actual dependency.

---

# Deprecation Metadata

Where supported, canonical contracts should mark deprecated elements in machine-readable form.

This may generate:

```text id="3jveq8"
documentation warnings
SDK annotations
lint warnings
usage reports
```

---

# Deprecation Documentation

Generated documentation should clearly show:

```text id="e631cb"
Deprecated

Use: <replacement>
```

without requiring consumers to search release notes.

---

# Deprecation Telemetry

For important APIs, observing deprecated usage can help determine whether removal is safe.

Potential telemetry may include:

```text id="4llr0j"
deprecated operation usage
deprecated field usage
client version
```

where privacy and cardinality permit.

---

# Usage Evidence

Removal decisions should prefer evidence.

Ask:

```text id="01np6p"
Are any supported consumers still using this?
```

rather than assuming migration is complete.

---

# Removal Conditions

A deprecated contract element should have a removal condition.

Examples:

```text id="t7ajbl"
all first-party consumers migrated

usage remains zero for agreed observation period

minimum supported client version no longer depends on it

partner migration completed
```

---

# Removal Timeline

Public APIs may require explicit dates.

Internal APIs may use release-based conditions.

The policy should match consumer expectations.

---

# Version Boundary

A new API version should correspond to a meaningful incompatible contract boundary.

Do not version individual implementation changes.

A version represents:

```text id="2vdw00"
a contract generation consumers may depend on
```

---

# Version Granularity

Potential version scopes include:

```text id="7ajxi7"
entire API
domain area
operation family
single endpoint
```

Orion should prefer the smallest version boundary that remains understandable.

The exact approach is deferred until actual API topology exists.

---

# Avoid Per-Endpoint Version Chaos

Versioning each endpoint independently can create combinations such as:

```text id="6p8h8u"
users v1
orders v3
payments v2
invoices v4
```

This may be appropriate in specialized systems but increases consumer complexity.

Do not adopt it casually.

---

# Whole-API Versioning

A whole-API version is easy to explain but may force consumers to migrate unrelated operations together.

Example:

```text id="x4xehx"
/v1/...
/v2/...
```

This may be suitable for some external APIs.

It should not be selected before concrete requirements exist.

---

# Date-Based Versions

Some public APIs use date-based contract versions.

This can provide predictable evolution.

It also requires strong infrastructure and documentation.

Orion does not choose this strategy by default.

---

# Header-Based Versioning

Versions may be selected through headers.

This can keep paths stable.

It may also reduce visibility and complicate caching or debugging.

No transport representation is selected yet.

---

# Path-Based Versioning

Path-based versioning such as:

```text id="6mveac"
/v1/orders
```

is explicit and operationally simple.

It may lead to duplicated routing.

No default is selected yet.

---

# Media-Type Versioning

Media-type or content-negotiation versioning can be precise.

It also increases protocol complexity.

Use only when consumers and tooling benefit from it.

---

# Version Identifier Semantics

Version identifiers should represent compatibility boundaries.

They should not necessarily mirror:

```text id="7fwjwo"
application version
repository version
SDK version
database version
```

These are different concepts.

---

# API Version vs Release Version

A backend release may be:

```text id="etm33s"
2027.10.3
```

while still serving:

```text id="b3l8tx"
API v1
```

A product release does not require a new API version.

---

# API Version vs SDK Version

An SDK may release:

```text id="0fs4nq"
2.3.0
```

while consuming:

```text id="vvhwka"
API v1
```

SDK version reflects client-library evolution.

API version reflects server contract compatibility.

---

# API Version vs Schema Version

Database schema version and API version are independent.

An API may remain compatible across many database migrations.

Do not couple them unnecessarily.

---

# Supporting Multiple Versions

Every simultaneously supported API version creates cost.

The system may need:

```text id="5z8ukv"
multiple schemas
multiple controllers/adapters
compatibility logic
multiple SDKs
multiple docs
multiple tests
```

Version proliferation should therefore be avoided.

---

# Shared Implementation Across Versions

Different API versions may share internal application operations.

Conceptually:

```text id="c40sfd"
v1 transport mapping ─┐
                     ├→ application capability
v2 transport mapping ─┘
```

This avoids duplicating business logic.

---

# Version-Specific Domain Logic

Avoid:

```text id="57kx37"
OrderV1
OrderV2
```

as separate domains merely because API contracts differ.

Version differences should usually remain at boundary mapping unless business semantics truly differ.

---

# Version Translation

A version adapter may translate:

```text id="zc282x"
v1 request
    ↓
current application command
```

and:

```text id="hal64b"
current application result
    ↓
v1 response
```

This isolates compatibility behavior.

---

# Legacy Semantics

Some old API behavior may require preserving semantics no longer used internally.

Version adapters may emulate old behavior.

Such compatibility logic should be clearly identified.

---

# Version-Specific Bugs

Compatibility does not require preserving security vulnerabilities or data corruption bugs.

Bug-for-bug compatibility should be considered only when fixing the behavior would itself create serious consumer breakage and the behavior is safe.

Security fixes override this consideration.

---

# Version Lifecycle

A version may progress through conceptual stages:

```text id="m6z7bg"
development
    ↓
supported
    ↓
deprecated
    ↓
retired
```

The exact lifecycle depends on API audience.

---

# Development Version

A contract under active unreleased development may change freely when no compatibility promise exists.

This mirrors Orion's broader principle:

```text id="gqwdd5"
unreleased history may be refined
```

Do not prematurely preserve experimental API shapes.

---

# Released Contract

Once a contract has supported consumers, changes must follow compatibility policy.

Released does not necessarily require a numeric version.

An unversioned API can still have a released compatibility commitment.

---

# Deprecated Version

A deprecated version remains supported temporarily.

Consumers should migrate.

New consumers should not be encouraged to adopt it.

---

# Retired Version

A retired version is no longer served.

Retirement should occur only when removal conditions are satisfied or a security/correctness issue requires immediate shutdown.

---

# Version Support Policy

Orion should eventually define, per API class:

```text id="rg4mlo"
how many versions are supported

for how long

how deprecation is communicated

how retirement occurs
```

This should follow actual product needs.

---

# Public API Support

A public external API may require stronger support commitments.

Examples may include:

```text id="fhgkza"
published deprecation window
migration guide
stable documentation archive
```

No such commitment should be invented before the product exposes a public API.

---

# First-Party API Support

First-party applications may allow tighter coordination.

For example:

```text id="q5b4qr"
web frontend
```

may migrate immediately.

```text id="hjsykb"
mobile client
```

may require extended compatibility.

---

# Mobile Version Lag

Mobile clients may remain active long after a new backend deployment.

API changes consumed by mobile must account for:

```text id="zhwtwn"
app-store review delay
slow user upgrades
offline devices
unsupported old versions
```

---

# Minimum Supported Client Version

A product may eventually define a minimum supported mobile or desktop version.

API contract removal may depend on that policy.

The backend should not assume all users update immediately.

---

# Forced Client Upgrade

A forced upgrade may sometimes allow removal of legacy contracts.

This is a product decision with availability and user-experience consequences.

It should not be used simply to avoid compatible API design.

---

# Desktop Client Lag

Distributed desktop clients have compatibility concerns similar to mobile.

Auto-update may reduce lag but does not guarantee instantaneous migration.

---

# Partner Integrations

Partner APIs may require explicit migration coordination.

Version retirement should consider contractual commitments and partner adoption.

---

# Service-to-Service APIs

Internal services may deploy independently.

Compatibility may therefore be necessary during rolling deployments.

The architecture should consider:

```text id="k64zmf"
old consumer + new provider

new consumer + old provider
```

where deployments can overlap.

---

# Rolling Deployment

A new server release may coexist with the previous server release.

Shared consumers and routing infrastructure should tolerate this where the deployment model requires it.

---

# Forward Compatibility

Forward compatibility means older consumers tolerate certain newer provider behavior.

Examples may include:

```text id="j6cmnk"
unknown response fields
unknown extensible enum values
```

This can significantly reduce version pressure.

---

# Backward Compatibility

Backward compatibility means newer provider versions continue supporting existing consumer expectations.

Most API compatibility work focuses on this direction.

---

# Bidirectional Compatibility

Rolling distributed systems may require both old and new components to coexist.

This may require temporary bidirectional compatibility.

Do not assume only consumer-old/provider-new matters.

---

# Tolerant Readers

Consumers should avoid rejecting harmless unknown response fields when the contract allows additive evolution.

This is commonly known as tolerant-reader behavior.

It should not weaken validation of security-sensitive semantics.

---

# Strict Writers

Consumers should send only documented request fields.

The server may reject unknown fields according to contract policy.

This helps prevent accidental dependence on undocumented behavior.

---

# Extensible Responses

Response models expected to grow should be designed with additive evolution in mind.

Avoid structures where every addition becomes breaking unnecessarily.

---

# Extensible Requests

Requests should not be made arbitrarily extensible merely for future-proofing.

Unknown input can create security and semantic ambiguity.

Extensibility should be intentional.

---

# Union Types

Adding a new variant to a union may be breaking for exhaustive consumers.

If a union is designed to grow, consumers need a safe unknown or fallback strategy.

---

# Discriminated Unions

Discriminated unions should have stable discriminators.

Changing discriminator meaning is breaking.

Adding variants requires compatibility analysis.

---

# Error Enum Expansion

The same enum-expansion risk applies to error-code types.

Generated SDKs should not force consumers to crash on a newly introduced server error.

---

# Generated SDK Compatibility

Generated SDKs should preserve API compatibility semantics.

For example, a generated client should ideally tolerate:

```text id="89nbhl"
unknown additive response field
```

when the contract permits it.

Generator selection must consider this behavior.

---

# SDK Major Versions

An SDK may use semantic versioning or another package-versioning scheme.

A breaking SDK API change may require an SDK major release even if the server API version remains unchanged.

Do not conflate package compatibility with server contract compatibility.

---

# SDK Generation Updates

Regenerating an SDK after an additive server contract change should not automatically create breaking client APIs.

Generator behavior should be tested.

---

# Contract Snapshot

Released canonical API contracts may eventually be retained as comparison baselines.

This allows automated compatibility analysis.

Example:

```text id="jqidat"
released API schema
    ↓ compare
proposed API schema
    ↓
breaking-change report
```

---

# Breaking-Change Detection

CI should eventually detect structural breaking changes mechanically where possible.

Potential examples include:

```text id="r8x9oy"
operation removed
required request field added
response field removed
type changed
enum changed
```

Semantic changes still require human review.

---

# Breaking-Change Tool Limitations

Automated tools cannot reliably determine all semantic compatibility.

For example:

```text id="a13k8n"
maximum page size reduced
```

or:

```text id="b5vef3"
field meaning changed
```

may not appear as schema breaks.

Tooling supports review.

It does not replace it.

---

# Compatibility Tests

Important compatibility promises should have automated tests where practical.

Examples:

```text id="2yt69t"
old mobile request still accepted
deprecated response field still returned
old error code still preserved
```

---

# Golden Contract Tests

A released contract snapshot may act as a compatibility baseline.

Changes can be reviewed through semantic diffs.

The snapshot is not necessarily the canonical authoring source.

---

# Consumer Contract Tests

When independently deployed consumers have critical expectations, consumer-driven contract tests may be useful.

This should be introduced only when deployment topology benefits from it.

---

# Deprecation Tests

Deprecated behavior may require tests until retirement.

Otherwise refactoring can accidentally remove compatibility early.

---

# Version Routing Tests

If multiple API versions coexist, routing must be tested explicitly.

Consumers requesting one version must not accidentally receive another contract.

---

# Version Documentation

Every supported version should have accessible documentation.

Consumers should be able to determine:

```text id="yhyu29"
current recommended version
deprecated versions
migration guidance
```

---

# Documentation Archive

Retired public API documentation may need to remain archived for historical investigation.

The need depends on API audience and support obligations.

---

# Migration Guides

A new incompatible API version should normally include migration guidance.

A migration guide should explain:

```text id="oe8d5w"
what changed
why
old form
new form
consumer actions
```

It should focus on contract changes rather than internal implementation.

---

# Changelog

API contract changes should appear in release/change documentation when consumers need to know about them.

The changelog is not a substitute for canonical API documentation.

---

# Compatibility Metadata

Future machine-readable contracts may identify:

```text id="h19hvv"
introducedIn
deprecated
replacement
stability
```

where this information provides tooling value.

Avoid metadata that cannot be maintained reliably.

---

# Experimental APIs

Some future capabilities may be intentionally experimental.

An experimental contract may carry weaker compatibility guarantees.

This status must be explicit.

Do not label unstable production APIs as experimental merely to avoid responsible evolution.

---

# Beta APIs

A beta API may permit more change than a stable API.

Consumers should understand the guarantee level.

The exact stability taxonomy should be introduced only when necessary.

---

# Stability Levels

If Orion eventually needs stability levels, possible concepts may include:

```text id="wh85o1"
experimental
preview
stable
deprecated
```

This should not be added before actual use cases exist.

---

# Version Discovery

Consumers should have an explicit way to know which API contract they are using.

Version selection should not depend on hidden server configuration.

---

# Default Version

If multiple versions exist, relying on an implicit default can be risky.

A default may change unexpectedly.

The selected versioning strategy should define whether explicit version selection is required.

---

# Latest Version Alias

An alias such as:

```text id="z79jyg"
latest
```

may be convenient.

It is inappropriate for consumers requiring stable contracts because its meaning changes.

Do not use mutable aliases as long-term compatibility guarantees.

---

# Version Negotiation

If clients and servers negotiate versions dynamically, the behavior must remain deterministic and observable.

This is additional protocol complexity and should require concrete value.

---

# Unsupported Version

Requests for unsupported versions should fail predictably.

Potential semantic error:

```text id="dzxqqn"
API_VERSION_UNSUPPORTED
```

if the selected transport requires such behavior.

---

# Version Retirement

After retirement, the server should not silently route an old version request to a newer incompatible version.

Fail explicitly.

Silent upgrade can produce incorrect behavior.

---

# Observability

API version usage should be observable where multiple versions exist.

Potential dimensions include:

```text id="83tps2"
version
operation
client class
```

Metrics must remain bounded.

---

# Client Version Telemetry

Client-version information may help migration planning.

It should be collected only when operationally useful and privacy-safe.

---

# Deprecated Usage Metrics

Deprecated operation or field usage can provide evidence for retirement.

Do not log full payloads merely to detect deprecated usage.

---

# Version-Specific Errors

Versioning should not create entirely independent error semantics without need.

Shared semantic errors may map to version-specific representations at the boundary.

---

# Authentication Across Versions

Multiple API versions should not casually use unrelated authentication architectures.

If authentication itself changes incompatibly, migration must be deliberate.

---

# Authorization Across Versions

Old API versions must not preserve weaker authorization merely for compatibility if doing so creates a security vulnerability.

Security policy applies across supported versions.

---

# Data Classification Across Versions

Older API versions must continue respecting current data-protection requirements.

Compatibility is not justification for exposing data that is now known to be unsafe.

---

# Version Maintenance Cost

Before creating a new version, estimate:

```text id="zfqqda"
duplicate contract maintenance
test matrix
SDK generation
documentation
observability
support burden
security patches
```

Versioning should solve a problem worth this cost.

---

# Avoid Permanent Legacy Versions

A version should not remain supported indefinitely by accident.

Long-term support must be intentional.

---

# Legacy Version Security

Supported legacy versions must receive relevant security fixes.

A deprecated endpoint does not become exempt from security requirements.

---

# Legacy Version Reliability

Operational monitoring should distinguish failures caused by legacy compatibility layers where useful.

Legacy behavior must remain diagnosable until retirement.

---

# Versioned Business Logic

Avoid duplicating application business logic per API version.

Prefer:

```text id="wla6cn"
version-specific adapter
        ↓
current application operation
```

where semantics allow it.

---

# When Business Semantics Actually Differ

If an old contract truly represents obsolete business semantics, a compatibility adapter may become complex.

At some point, preserving the old version may cost more than coordinated retirement.

That tradeoff should be explicit.

---

# Version Forking

A new API version should not become a permanent fork of the entire application architecture.

Shared domain and application capabilities should remain shared where possible.

---

# API Version Removal Checklist

Before retiring a version, answer:

1. Which consumers still use it?
2. What compatibility commitment exists?
3. Has deprecation been communicated?
4. Is a migration guide available?
5. Is usage measurable?
6. Have first-party consumers migrated?
7. Have external consumers had sufficient migration opportunity?
8. Are any long-lived mobile/desktop clients still dependent on it?
9. Are version-specific tests ready to be removed?
10. Are documentation and SDK references updated?
11. Are security or legal obligations affected?
12. What happens to requests after retirement?

---

# New API Version Checklist

Before creating a new API version, answer:

1. What incompatible change requires it?
2. Why can additive evolution not solve the problem?
3. Why can deprecation within the current contract not solve it?
4. Which consumers require compatibility with the old contract?
5. What scope does the version apply to?
6. How will consumers select the version?
7. How will old and new versions share application logic?
8. How long will the old version remain supported?
9. How will usage be observed?
10. How will documentation be maintained?
11. How will SDKs be generated?
12. How will compatibility be tested?
13. What is the migration path?
14. What is the retirement condition?

If these questions cannot be answered, a new version is probably premature.

---

# Breaking Change Checklist

Before making a contract change, evaluate:

1. Does it remove or rename anything?
2. Does it change type or nullability?
3. Does it add a required request field?
4. Does it add a new enum or union value?
5. Does it change meaning without changing shape?
6. Does it change ordering or pagination?
7. Does it change validation?
8. Does it change authorization?
9. Does it change error semantics?
10. Does it change idempotency or retry behavior?
11. Does it change side effects?
12. Does it affect independently deployed clients?
13. Can the change be made additively?
14. Can a deprecation phase avoid a new version?

---

# Deprecation Checklist

Before deprecating a contract element, answer:

1. What replaces it?
2. Why is it deprecated?
3. Which consumers currently use it?
4. Is usage observable?
5. What migration work is required?
6. How will documentation mark it?
7. How will generated SDKs expose the warning?
8. What is the removal condition?
9. What tests must remain until removal?
10. What compatibility window is required?

---

# AI Agent Requirements

Before changing a released API contract, an AI agent should inspect:

```text id="t8efbt"
canonical schema
known consumers
stability expectations
deprecated elements
compatibility tests
generated SDK implications
```

---

# AI Must Prefer Compatible Evolution

An AI agent must not create a new API version merely because a breaking change is easier to implement.

It should first evaluate additive and transitional designs.

---

# AI and Enum Changes

An AI agent should treat adding enum values as compatibility-sensitive unless the contract explicitly defines the enum as extensible.

---

# AI and Required Fields

An AI agent should assume that adding a required request field breaks existing consumers unless proven otherwise.

---

# AI and Response Changes

An AI agent should not assume response-field additions are safe until client parsing behavior is understood.

---

# AI and Semantic Changes

An AI agent must consider meaning, not only schema diff.

A structurally identical contract can still be breaking.

---

# AI and Consumer Lag

When mobile, desktop, partners, or independently deployed services consume the API, an AI agent must not assume atomic migration.

---

# AI and Deprecation

An AI agent should not remove deprecated behavior merely because it is marked deprecated.

It must verify removal conditions.

---

# AI and Security

If compatibility conflicts with a necessary security fix, the AI agent should preserve security and explicitly identify the breaking impact.

---

# AI and Version-Specific Code

An AI agent should keep compatibility logic near API boundaries where possible.

It should not duplicate core business logic into version-specific implementations without a semantic reason.

---

# AI and Tests

A compatibility-sensitive change should update:

```text id="5d1tcu"
contract tests
compatibility tests
version tests
generated schema checks
```

where applicable.

---

# Mechanical Enforcement

Future tooling may enforce rules such as:

```text id="o2y8hd"
breaking schema changes detected against released baseline

deprecated elements identified in generated docs

removed operations require explicit compatibility approval

unknown version identifiers rejected

released API snapshots retained

generated SDKs match canonical contract
```

Semantic review will still be required.

---

# Contract Baseline

A future release workflow may retain canonical API baselines.

Conceptually:

```text id="8tkefa"
current proposed contract
        ↓ compare against
last released contract
        ↓
compatibility report
```

This mirrors Orion's emphasis on meaningful released states.

---

# Unreleased API Changes

Before a contract is released to dependent consumers, it may be refined freely.

For example:

```text id="0dyl0m"
add field
rename field
remove field
reshape endpoint
```

may all be collapsed into the final unreleased contract.

Do not preserve unnecessary compatibility with a contract no consumer ever depended on.

---

# Released API History

Once consumers depend on a contract, evolution must respect compatibility commitments.

This creates a parallel with database migration policy:

```text id="zuck3j"
unreleased contract
    → may be refined

released contract
    → compatibility matters
```

Unlike database migrations, a released API contract may evolve compatibly in place.

The key concern is preserving consumer behavior.

---

# Git History vs API History

Git preserves:

```text id="v7zbl4"
development evolution
```

API versions and compatibility policy preserve:

```text id="qksc5v"
consumer-facing compatibility boundaries
```

Do not version every development experiment.

---

# Version History vs Changelog

API version history and product changelog are different.

A product release may add many compatible API capabilities without changing API version.

A new API version may contain only one major incompatible contract redesign.

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## New Version for Every Breaking Development Edit

Avoid.

Unreleased contracts may be refined.

---

## New Version for Every Backend Release

Avoid.

---

## Breaking Change Hidden Behind Same Contract Without Migration

Prohibited when compatibility is promised.

---

## Assuming Additive Enum Change Is Always Safe

Avoid.

---

## Removing Deprecated Field Without Checking Consumers

Avoid.

---

## Maintaining Legacy Version Forever by Accident

Avoid.

---

## Duplicating Domain Logic for Each API Version

Avoid.

---

## Silent Version Upgrade

Avoid.

Unsupported old versions should fail explicitly rather than receive incompatible new semantics.

---

## Mutable `latest` as Stable Contract

Avoid for long-lived consumers.

---

## Coupling API Version to Database Migration Number

Avoid.

---

## Coupling API Version to Application Release Version

Avoid.

---

## Treating Internal API as Automatically Breaking-Change-Free

Avoid.

---

## Preserving Security Vulnerability for Compatibility

Prohibited.

---

## Relying Only on Structural Diff

Avoid.

Semantic compatibility must be reviewed.

---

# Initial API Versioning Policy

Until implementation-specific mechanisms are selected, Orion adopts the following requirements:

1. Compatible API evolution is preferred over creating new versions.
2. A new API version requires a meaningful incompatible contract boundary.
3. Unreleased API contracts may be refined freely when no consumer compatibility exists.
4. Released contract evolution must consider actual consumers.
5. Compatibility includes structural, semantic, behavioral, security, and operational behavior.
6. Adding a required request field is considered breaking by default.
7. Removing or renaming public fields is considered breaking by default.
8. Enum and union expansion must be treated as compatibility-sensitive.
9. Public error codes and detail schemas are compatibility-sensitive.
10. Pagination, ordering, validation, authorization, retry, and idempotency semantics are part of compatibility.
11. Mobile, desktop, partner, and independently deployed service consumers must be assumed capable of lagging behind.
12. Deprecated behavior must remain functional until its defined removal condition is satisfied.
13. Version-specific adapters should reuse shared application/domain logic where possible.
14. API version identifiers must remain independent from application, SDK, and database versions.
15. Supported legacy versions remain subject to current security requirements.
16. A retired version must fail explicitly rather than silently receive incompatible semantics.
17. Compatibility should eventually be validated against released machine-readable contract baselines.
18. Automated breaking-change detection should complement, not replace, semantic review.
19. AI agents must prefer additive evolution before proposing a new API version.
20. Version proliferation must be treated as long-term maintenance cost.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text id="2h0g48"
API version scope
version identifier format
path vs header vs media-type selection
released contract baseline format
breaking-change detection tooling
deprecation metadata format
deprecation telemetry
public API support window
mobile compatibility window
SDK versioning convention
version retirement process
```

These choices should follow actual consumer topology and the selected API/schema tooling.

Significant choices should be captured through ADRs.

---

# Future Documentation

This document should eventually be complemented by:

```text id="u5mqla"
docs/architecture/versioning-and-compatibility.md

docs/api/principles.md
docs/api/error-contract.md

docs/runbooks/
```

If Orion exposes a stable public API, consumer-facing migration and deprecation documentation should be generated or authored separately from these internal architectural rules.

---

# Summary

API versioning exists to manage incompatible consumer-facing change.

The preferred path is:

```text id="sq4l0x"
compatible additive change
        ↓
consumer migration
        ↓
deprecation
        ↓
removal when safe
```

A new version should be introduced only when that path cannot reasonably preserve the required contract.

Orion prefers:

```text id="titac0"
compatible evolution over version proliferation

consumer evidence over assumptions

semantic review over schema diff alone

deprecation over sudden removal

boundary adapters over duplicated business logic

explicit retirement over permanent legacy
```

A new backend release does not require a new API version.

A new SDK release does not require a new API version.

A database migration does not require a new API version.

A structurally unchanged API can still contain a breaking semantic change.

The correct version boundary is the one that protects consumers from incompatible behavior without turning every implementation change into permanent legacy.
