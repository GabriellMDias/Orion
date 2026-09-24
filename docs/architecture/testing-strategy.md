# Testing Strategy

[Documentation index](../README.md) · [Validation availability](../validation.md)

Governing decisions: [ADR-0009](../adr/0009-establish-testing-strategy-and-tooling.md). Accepted choices are distinct from implemented tooling.

## Read for this change

- [Test Categories](#test-categories)
- [Real Database Tests](#real-database-tests)
- [Security Tests](#security-tests)
- [Test Selection](#test-selection)
- [Canonical Test Commands](#canonical-test-commands)
- [Initial Testing Policy](#initial-testing-policy)

Related policy: [transactions and concurrency](../database/transactions-and-concurrency.md), [authorization](../security/authorization.md).

## Purpose

This document defines the testing strategy used by Orion.

Its goals are to ensure that tests:

- protect meaningful behavior;
- verify architectural boundaries;
- provide fast and reliable feedback;
- detect regressions;
- support safe refactoring;
- validate integrations;
- preserve security and data integrity;
- remain deterministic;
- remain maintainable;
- provide useful evidence to humans and AI agents.

Testing is part of system design.

Tests are not merely a verification step performed after implementation.

The shape of the test suite should reflect the architecture, contracts, risks, and runtime behavior of the system.

This document is technology-agnostic.

ADR-0009 selects the test runners, real-infrastructure strategy, and browser execution model; ADR-0011 selects CI. Their implementation and remaining suite-specific details are still pending.

This document complements:

- [docs/architecture/principles.md](principles.md);
- [docs/architecture/application-boundaries.md](application-boundaries.md);
- [docs/architecture/dependency-rules.md](dependency-rules.md);
- [docs/architecture/error-handling.md](error-handling.md);
- [docs/architecture/configuration.md](configuration.md);
- [docs/security/authentication.md](../security/authentication.md);
- [docs/security/authorization.md](../security/authorization.md);
- [docs/reliability/observability.md](../reliability/observability.md).

---

## Core Principle

Tests should protect behavior, contracts, and invariants.

They should not merely reproduce implementation structure.

The primary question is not:

```text
How much code is covered?
```

The primary question is:

```text
Which important failure would this test detect?
```

A valuable test should provide a clear answer.

---

## Testing as Risk Control

Different tests protect against different risks.

Examples include:

```text
unit test
    → protects local behavior

integration test
    → protects component interaction

contract test
    → protects boundary compatibility

end-to-end test
    → protects complete user workflow

architecture test
    → protects dependency rules

security test
    → protects authorization or data boundaries

migration test
    → protects database evolution
```

The test type should follow the risk being protected.

---

## Test Pyramid Is Guidance, Not Doctrine

Orion does not require a rigid numerical testing pyramid.

However, the general principle remains useful:

```text
many fast focused tests
        ↓
fewer integration tests
        ↓
small number of expensive end-to-end tests
```

The objective is to maximize useful confidence while preserving fast feedback.

Do not replace inexpensive deterministic tests with expensive end-to-end tests unnecessarily.

---

## Test Categories

The [accepted execution model](../adr/0009-establish-testing-strategy-and-tooling.md#decision) maps pure logic to Vitest in Node, infrastructure integration to Vitest with real dependencies, PostgreSQL behavior to Testcontainers and committed migrations, browser-dependent components to Vitest Browser Mode with Playwright, and complete browser journeys to Playwright Test. These are selected responsibilities, not available test commands; see [validation availability](../validation.md).

Orion recognizes several major categories of automated tests:

```text
unit
integration
contract
component
end-to-end
architecture
migration
security
observability
performance
smoke
```

Not every project requires every category immediately.

Test categories should be introduced according to actual architecture and risk.

---

## Unit Tests

Unit tests verify behavior within a small, isolated responsibility.

Potential subjects include:

```text
domain rule
value object
parser
policy
state transition
calculation
serializer
pure transformation
```

Unit tests should normally be:

- fast;
- deterministic;
- isolated from network dependencies;
- isolated from production infrastructure;
- easy to understand.

---

## Unit Test Boundaries

A unit is a meaningful responsibility.

It is not necessarily:

```text
one function
one class
one file
```

A unit may contain several internal implementation pieces when they represent one cohesive behavior.

Do not create artificial test seams merely to satisfy a narrow definition of "unit."

---

## Testing Implementation Details

Avoid tests that depend heavily on private implementation details.

For example, a test should not normally fail merely because:

```text
private helper renamed
internal method extracted
loop rewritten as map
```

when observable behavior remains unchanged.

Such tests increase refactoring cost without protecting product behavior.

---

## Public Behavior

Prefer testing through a stable public surface.

For example:

```text
CancelOrder.execute(...)
```

instead of invoking every internal helper individually.

Tests should reinforce module boundaries.

---

## Pure Domain Logic

Pure domain logic should generally be tested without:

```text
database
HTTP server
framework
message broker
external provider
```

when those dependencies are not part of the behavior being verified.

This provides fast, precise feedback.

---

## Integration Tests

Integration tests verify interaction between real components.

Examples include:

```text
application + database
API transport + application service
repository + database
worker + queue adapter
provider adapter + sandbox
```

Integration tests should use real implementations where the integration itself is the subject of the test.

---

## Real Database Tests

Persistence behavior should eventually be tested against the actual database technology used in production where practical.

Avoid relying exclusively on:

```text
mocked repository
in-memory substitute
different database engine
```

for behavior that depends on real database semantics.

Real database tests are important for:

```text
constraints
transactions
locking
indexes
SQL behavior
ORM mappings
migrations
```

---

## Integration Environment

Integration tests should run against isolated infrastructure.

Potential mechanisms may include:

```text
ephemeral containers
temporary databases
isolated schemas
local service emulators
```

The exact mechanism will depend on the selected stack.

Tests must not depend on shared production-like mutable state.

---

## Contract Tests

Contract tests verify that independently evolving components agree on boundary semantics.

Potential boundaries include:

```text
API ↔ client SDK
producer ↔ event consumer
service ↔ service
application ↔ external provider adapter
```

Contract testing should protect:

```text
request shape
response shape
error shape
event schema
serialization
compatibility
```

---

## Canonical Contracts

Where a canonical schema exists, contract tests should derive from or validate against it.

Prefer:

```text
canonical contract
    ↓
implementation validation
    ↓
generated clients
```

over maintaining independent expectations manually in each consumer.

---

## Consumer Expectations

Some boundaries may require verifying that a provider continues satisfying actual consumer expectations.

This is particularly useful when:

```text
applications deploy independently
mobile versions lag behind
external consumers exist
```

The exact contract-testing strategy should be selected based on deployment topology.

---

## Component Tests

Component tests verify a larger cohesive component without exercising the entire system.

Examples may include:

```text
web feature with mocked API boundary
API module with real database
UI form and client-side validation
```

Component tests can provide stronger confidence than narrow unit tests without the cost of full end-to-end execution.

---

## End-to-End Tests

End-to-end tests verify important workflows through production-like boundaries.

Examples:

```text
user registers
user logs in
user creates order
user cancels order
```

Potential path:

```text
browser
    ↓
web application
    ↓
API
    ↓
database
```

End-to-end tests provide valuable confidence but are relatively expensive and failure-prone.

They should focus on critical workflows.

---

## End-to-End Test Scope

Do not test every permutation through full end-to-end flows.

Prefer:

```text
small number of representative happy paths
small number of critical failure paths
```

with detailed edge cases covered at lower test levels.

---

## Critical User Journeys

Important product workflows should eventually have end-to-end protection.

Examples may include:

```text
authentication
checkout
payment
critical administrative action
data export
```

The exact journeys depend on the product built on Orion.

---

## Architecture Tests

Architecture rules should eventually be tested mechanically.

Potential checks include:

```text
apps cannot import apps

packages cannot import apps

forbidden dependency cycles

client code cannot import server-only modules

internal package modules cannot be imported externally
```

Architecture tests protect design constraints that ordinary behavioral tests may never detect.

---

## Architecture Tests in CI

Architecture violations should fail CI once the rule is mature and enforced.

A valid build that violates architecture is not considered healthy.

---

## Migration Tests

Database migrations should be tested.

Important checks may include:

```text
fresh database can migrate to current schema

released schema can migrate forward

constraints remain valid

required data migrations succeed

application remains compatible during migration
```

The exact strategy will be defined in database documentation.

---

## Migration History Policy

Migration testing must follow Orion's release-aware migration policy.

Unreleased migrations may be rewritten.

Released migrations must remain immutable.

Tests should validate the migration path that actually matters for released states.

---

## Security Tests

Security-sensitive behavior requires explicit tests.

Examples include:

```text
unauthorized operation denied

cross-tenant access denied

restricted field not returned

secret not logged

expired token rejected

invalid webhook signature rejected
```

Security properties should not rely solely on manual review.

---

## Negative Security Tests

Security tests must verify forbidden behavior.

For example:

```text
ordinary user cannot become administrator

tenant A cannot access tenant B

client cannot modify protected field

anonymous request cannot perform privileged operation
```

Successful-path testing alone is insufficient.

---

## Authorization Tests

Authorization testing should follow:

- [docs/security/authorization.md](../security/authorization.md)

Important policies should test:

```text
allow
deny
wrong tenant
wrong owner
insufficient permission
anonymous actor
revoked access
```

---

## Authentication Tests

Authentication testing should follow:

- [docs/security/authentication.md](../security/authentication.md)

Important cases may include:

```text
valid credential
invalid credential
expired session
revoked session
wrong audience
invalid signature
missing credential
```

depending on the selected authentication model.

---

## Telemetry Tests

Observability behavior may require tests.

Examples include:

```text
requestId generated

trace context propagated

unexpected error reported

release metadata attached

sensitive fields redacted
```

Observability is part of production behavior.

It should be verifiable.

---

## Redaction Tests

Telemetry redaction requires negative assertions.

For example:

```text
telemetry contains:
    requestId

telemetry does not contain:
    accessToken
    password
```

A redaction regression is a security defect.

---

## Smoke Tests

Smoke tests provide a small validation that a deployed or built application is fundamentally operational.

Examples may include:

```text
application starts

health endpoint succeeds

database reachable

critical route responds
```

Smoke tests should remain small and reliable.

They are not substitutes for deeper integration testing.

---

## Deployment Smoke Tests

Deployment workflows may run smoke tests after deployment.

A failure should make the deployment state visible and may trigger rollback depending on release strategy.

The exact policy will be defined later.

---

## Performance Tests

Performance tests should be introduced when a measurable performance requirement exists.

Potential areas include:

```text
API latency
throughput
database query performance
queue processing rate
client rendering
```

Do not build elaborate performance infrastructure before there is a meaningful target.

---

## Load Tests

Load tests evaluate behavior under expected or elevated concurrency.

They may be useful before:

```text
major launch
high-volume workflow
architecture change
performance-sensitive release
```

Load testing should use isolated environments.

It must not accidentally attack production.

---

## Stress Tests

Stress tests identify behavior beyond expected operating limits.

They can help understand:

```text
failure modes
degradation
recovery
capacity limits
```

These tests should be introduced according to operational maturity.

---

## Benchmark Tests

Microbenchmarks may be useful for performance-critical algorithms.

They should not be used as a substitute for realistic system measurements.

Benchmark results should be stable enough to be meaningful.

---

## Test Selection

Choose the lowest-cost test level that reliably protects the behavior.

For example:

```text
business calculation
    → unit test

database constraint
    → database integration test

API schema
    → contract/integration test

complete checkout workflow
    → end-to-end test
```

Do not use a browser to test a pure calculation.

Do not use a mock to validate a real database constraint.

---

## Testing at the Correct Boundary

A bug should generally be tested at the boundary where the defect occurred.

Examples:

```text
domain rule incorrect
    → domain test

ORM mapping incorrect
    → database integration test

HTTP error mapping incorrect
    → API integration test

browser interaction broken
    → UI/component or end-to-end test
```

This produces precise regression protection.

---

## Regression Tests

A bug fix should include a regression test whenever practical.

The test should:

```text
fail before the fix
pass after the fix
```

and protect the behavior that was broken.

If a regression test is not practical, the reason and verification approach should be documented.

---

## Regression Test Placement

Place a regression test at the lowest meaningful layer that reproduces the defect.

Do not automatically create an expensive end-to-end test for every bug.

---

## Test Naming

Test names should describe behavior.

Prefer:

```text
rejects cancellation when order is already shipped
```

over:

```text
testCancelOrder2
```

A test failure should communicate what guarantee was violated.

---

## Arrange, Act, Assert

Tests should have understandable structure.

A common pattern is:

```text
arrange
act
assert
```

The exact syntax is not important.

Clarity is.

---

## Given, When, Then

Behavior-oriented tests may use:

```text
given
when
then
```

when this improves domain readability.

Do not enforce one stylistic convention if another remains equally clear.

---

## One Behavioral Concern

A test should normally protect one coherent behavior.

This does not mean every test requires exactly one assertion.

Several assertions may collectively describe one result.

---

## Assertion Quality

Assertions should verify meaningful outcomes.

Avoid assertions such as:

```text
result is defined
```

when the actual requirement is:

```text
order state becomes cancelled
refund is scheduled
audit event exists
```

Tests should fail for meaningful reasons.

---

## Error Assertions

Expected failures should be tested through stable error semantics.

Prefer asserting:

```text
error.code == ORDER_ALREADY_SHIPPED
```

over:

```text
error.message == "This order can no longer be cancelled."
```

unless the human-readable message itself is the behavior under test.

---

## Public Contract Assertions

API tests should verify stable external behavior.

Avoid coupling tests unnecessarily to internal service classes or ORM objects.

---

## Test Data

Automated tests should use synthetic data.

Tests must not depend on real production customer information.

This requirement follows:

- [docs/security/data-classification.md](../security/data-classification.md)

---

## Test Fixtures

Fixtures should be:

- understandable;
- minimal;
- synthetic;
- easy to modify;
- scoped to the test where practical.

Large global fixtures make tests difficult to understand.

---

## Factories

Factories may simplify creation of valid domain objects and persistence records.

A factory should provide sensible test defaults while allowing relevant fields to remain explicit.

For example:

```text
createOrder({
    state: "shipped"
})
```

is preferable to repeating dozens of irrelevant fields in every test.

---

## Hidden Factory Behavior

Factories must not hide behavior that matters to the test.

If authorization depends on tenant ownership, tenant assignment should be explicit in the relevant test.

Convenient defaults must not obscure why a test passes.

---

## Seeds

Development seed data and automated test fixtures serve different purposes.

Tests should not depend blindly on a large shared development seed.

Test setup should remain deterministic.

---

## Deterministic Tests

Given the same code and test inputs, a test should produce the same result.

Avoid uncontrolled dependencies on:

```text
current time
randomness
network
execution order
machine locale
machine timezone
shared database state
```

where deterministic substitutes are possible.

---

## Time

Time-dependent behavior should use controllable time abstractions where practical.

For example:

```text
subscription expires tomorrow
```

should not depend on the actual wall clock during the test.

Prefer an explicit test clock or equivalent mechanism.

---

## Timezones

Tests involving dates and times should make timezone assumptions explicit.

Avoid tests that pass only on a developer's local timezone.

---

## Randomness

Randomness used in tests should be:

```text
seeded
controlled
or irrelevant to the assertion
```

When a random failure occurs, reproduction must be practical.

---

## Unique Values

Tests may require unique identifiers or names.

Generate them deterministically or safely enough to prevent collisions without reducing reproducibility.

---

## External Network Access

Unit and ordinary integration tests should not depend on uncontrolled internet access.

External services may be:

```text
unavailable
slow
rate limited
changed
```

Such dependencies make CI unreliable.

---

## Provider Sandboxes

External provider integration tests may use official sandbox environments when the integration itself requires validation.

These tests should be:

```text
isolated
clearly categorized
credential-safe
retry-aware
```

and may run separately from the fastest validation loop.

---

## Mocking

Mocks are useful when they isolate an external responsibility.

They are dangerous when they reproduce the implementation being tested.

Use mocks deliberately.

---

## What to Mock

Good mocking candidates may include:

```text
external payment provider
email sender
clock
random generator
slow remote service
```

when the integration itself is not under test.

---

## What Not to Mock Automatically

Avoid mocking every internal class.

Excessive mocking creates tests that verify:

```text
implementation choreography
```

instead of behavior.

This makes refactoring expensive.

---

## Database Mocking

Mocked repositories can be useful for focused application tests.

They do not replace real persistence integration tests.

Database semantics must eventually be verified against the real database.

---

## HTTP Mocking

Client tests may mock API boundaries.

API implementation tests should not mock the entire application behavior they are supposed to verify.

Use the correct side of the boundary.

---

## Fake Implementations

Fakes can provide simpler deterministic implementations of external capabilities.

Examples:

```text
FakePaymentGateway
InMemoryMessageBus
TestClock
```

Fakes must remain behaviorally appropriate for the test.

A fake that behaves fundamentally differently from production can create false confidence.

---

## Test Doubles as Contracts

A test double should implement the same meaningful capability interface as the production implementation where such an interface exists.

Avoid test-only APIs that allow impossible production behavior unless the test explicitly needs failure injection.

---

## Failure Injection

Tests should be able to simulate important failures.

Examples:

```text
database timeout
provider unavailable
queue publish failure
duplicate message
concurrency conflict
```

Failure injection is valuable for resilience and error-handling tests.

---

## Flaky Tests

Flaky tests are defects.

A test that sometimes passes and sometimes fails without relevant code changes damages trust in the entire suite.

Flaky tests should be:

```text
investigated
fixed
or temporarily quarantined with explicit ownership
```

They must not be ignored indefinitely.

---

## Retrying Tests

Automatic test retry may help diagnose environmental instability.

It must not become a way to hide deterministic defects.

A test that passes on the third attempt is still potentially broken.

---

## Quarantined Tests

Temporary quarantine may be necessary for a known flaky test.

A quarantined test should have:

```text
owner
reason
tracking issue
removal condition
```

Quarantine is temporary debt.

---

## Test Independence

Tests should not depend on execution order.

Invalid:

```text
test B requires test A to run first
```

Each test should establish its own required state.

---

## Shared State

Mutable shared state between tests should be minimized.

Potential sources include:

```text
global variables
shared database rows
filesystem
environment variables
static caches
```

Shared state creates order-dependent failures.

---

## Parallel Execution

Tests should be designed for parallel execution where practical.

This improves feedback speed.

Parallelism must not compromise isolation.

---

## Database Test Isolation

Database tests may use strategies such as:

```text
transaction rollback
separate schema
separate database
unique identifiers
database reset
```

The final strategy depends on the chosen database tooling.

Isolation must remain reliable under parallel execution if CI uses parallelism.

---

## Transaction Rollback Tests

Wrapping tests in transactions may improve speed.

However, this approach can hide behavior involving:

```text
commit semantics
multiple connections
background work
transaction boundaries
```

Use it only when it matches the behavior being tested.

---

## Database Reset

Full database reset provides strong isolation but may be slower.

The appropriate strategy should balance:

```text
correctness
speed
parallelism
implementation complexity
```

---

## Test Environment

The test environment should be reproducible.

A contributor should not need undocumented local services to run the main validation suite.

Required infrastructure should be started through documented tooling where practical.

---

## Canonical Test Commands

Orion should eventually expose canonical commands for test categories.

For example, conceptually:

```text
test
test:unit
test:integration
test:e2e
```

The actual command names will be chosen after tooling exists.

Do not document commands that do not exist.

---

## One Canonical Validation Workflow

The repository should eventually have one canonical validation workflow that provides confidence appropriate for ordinary changes.

Conceptually:

```text
format validation
lint
type check
architecture validation
tests
generated-file validation
```

The actual command must not be invented before implementation.

---

## Local Feedback

The most common development test loop should remain fast.

A contributor should be able to validate a focused change without running the entire repository's slowest tests.

---

## Affected Tests

As the repository grows, tooling may run only tests affected by a change.

This optimization must remain correct.

A fast but incomplete dependency calculation is dangerous.

---

## CI Test Layers

CI may use multiple levels of validation.

Conceptually:

```text
pull request
    ↓
fast deterministic validation

merge/main
    ↓
broader integration validation

release
    ↓
deployment / smoke / compatibility validation
```

The exact workflow will depend on repository scale.

---

## Required CI Checks

Once stable, critical test categories should become blocking checks.

A test failure must not be routinely bypassed.

Exceptions should be explicit.

---

## Test Failure Diagnostics

A failing test should provide enough information to understand:

```text
what behavior failed
expected result
actual result
relevant identifiers
```

without dumping sensitive data.

Poor diagnostics waste contributor and AI-agent time.

---

## CI Artifacts

Failed integration or end-to-end tests may produce diagnostic artifacts such as:

```text
test reports
browser screenshots
traces
application logs
```

Artifacts must follow data-classification rules.

They must not contain production secrets or real customer data.

---

## Screenshot Tests

UI screenshot tests may be useful for visual regressions.

They should be introduced only when visual stability matters.

They can be sensitive to:

```text
fonts
platform rendering
animations
timing
```

and should not replace semantic UI tests.

---

## Snapshot Tests

Snapshots may be useful for large structured output.

They should not become an approval mechanism where contributors blindly update snapshots.

A snapshot change should remain understandable.

---

## Large Snapshots

Avoid large snapshots of:

```text
entire API responses
whole DOM trees
large database records
```

when focused assertions communicate behavior more clearly.

---

## Golden Files

Golden-file tests may be appropriate for:

```text
generated code
serialization formats
compiler-like output
documentation generation
```

when reviewing the output as a whole is useful.

Golden files should be deterministic.

---

## Generated Code Tests

Generated artifacts should be tested at their source and generation boundary.

Potential checks include:

```text
generation succeeds
output is deterministic
repository has no stale generated files
generated client matches contract
```

Do not hand-edit generated outputs.

---

## Documentation Generation Tests

Generated documentation should be reproducible.

CI may verify:

```text
canonical source
    ↓ generation
matches committed/generated result
```

depending on repository policy.

---

## Architecture Documentation Tests

Authored documentation cannot be fully validated automatically.

However, links, references, generated indexes, and machine-readable cross-references may eventually be checked.

---

## API Tests

API testing should cover:

```text
request validation
authentication
authorization
application behavior
response schema
error contract
```

at appropriate layers.

Not every API behavior needs a full network-level test.

---

## API Integration Tests

Important transport behavior should eventually be tested through the actual transport adapter.

Examples:

```text
correct HTTP status
error serialization
headers
authentication integration
validation
```

---

## Client Tests

Web, mobile, and desktop tests should focus on client responsibilities such as:

```text
presentation
interaction
navigation
client-side state
API error handling
accessibility
```

They should not attempt to retest every backend business invariant.

---

## Accessibility Tests

Where applicable, automated accessibility checks should be part of client testing.

Automated checks do not replace human accessibility review.

They can prevent common regressions.

---

## Mobile Tests

Mobile-specific testing may eventually include:

```text
navigation
device lifecycle
offline behavior
permissions
secure storage
push notifications
```

only when those capabilities exist.

---

## Desktop Tests

Desktop-specific testing may eventually include:

```text
filesystem integration
operating-system integration
update behavior
secure credential storage
```

according to actual product requirements.

---

## Worker Tests

Background workers should test:

```text
successful processing
retry
duplicate delivery
idempotency
permanent failure
invalid message
```

where applicable.

---

## Message Consumer Tests

Consumers should verify event-contract compatibility separately from processing behavior where useful.

For example:

```text
event schema valid
    ↓
consumer operation executes
```

---

## Idempotency Tests

Operations expected to be idempotent must have explicit tests.

Examples:

```text
duplicate webhook
duplicate job delivery
repeated API request with same idempotency key
```

The test should verify that duplicate execution does not create unintended side effects.

---

## Concurrency Tests

Important concurrency behavior requires tests.

Potential examples include:

```text
two users update same resource
duplicate payment capture
concurrent inventory reservation
optimistic locking
```

Concurrency bugs often cannot be protected by ordinary unit tests alone.

---

## Transaction Tests

Critical transactional workflows should verify atomicity.

For example:

```text
operation fails
    ↓
no partial database state remains
```

when atomic behavior is required.

---

## Compensation Tests

Distributed workflows using compensation should test partial failure.

For example:

```text
payment succeeds
order persistence fails
    ↓
compensation scheduled
```

The exact behavior belongs to the domain.

---

## Retry Tests

Retry behavior should verify:

```text
which failures retry
maximum attempts
delay policy where relevant
side-effect safety
final failure behavior
```

Retries must not hide permanent failures.

---

## Timeout Tests

Important remote operations should test timeout behavior where practical.

The test should not require waiting for actual production timeout durations.

Injectable or configurable test timing may be appropriate.

---

## Error Handling Tests

Error tests should follow:

- [docs/architecture/error-handling.md](error-handling.md)

Important checks include:

```text
correct classification
stable error code
safe public response
original cause preserved internally
unexpected failure reported
```

---

## Configuration Tests

Configuration tests should follow:

- [docs/architecture/configuration.md](configuration.md)

Potential cases include:

```text
missing required value
invalid type
unsafe default
conditional requirement
client/server classification
```

---

## Secret Tests

Secret-management tests may validate:

```text
secret absent from logs
client build excludes secret
missing secret fails safely
known insecure default rejected
```

Never use real credentials in tests.

---

## Data Classification Tests

When classification becomes machine-readable, tests may verify:

```text
RESTRICTED field cannot enter telemetry
client schema excludes server-only field
export requires explicit classification handling
```

---

## Test Coverage

Coverage metrics may help identify untested areas.

Coverage percentage is not a quality target by itself.

A repository may have:

```text
95% line coverage
```

and still fail to test:

```text
authorization
concurrency
migration
critical failure mode
```

Coverage should support judgment, not replace it.

---

## Coverage Thresholds

Global coverage thresholds should not be introduced automatically.

If thresholds are used, they should encourage meaningful testing rather than incentivize trivial tests.

Risk-based expectations are preferable.

---

## Critical Code Coverage

Security-sensitive and high-risk modules may justify stronger coverage expectations.

Examples:

```text
authorization
authentication
financial calculations
migration logic
cryptographic integration
```

The expectation should still focus on meaningful branches and invariants.

---

## Branch Coverage

Branch coverage may reveal missing decision-path tests.

It can be more informative than line coverage for complex logic.

It still does not prove semantic correctness.

---

## Mutation Testing

Mutation testing may eventually help evaluate whether tests detect incorrect behavior.

It can be valuable for critical pure logic.

It is relatively expensive and should not be introduced without concrete benefit.

---

## Test Review

Code review should evaluate tests as production assets.

Reviewers should ask:

```text
Does this test protect the right behavior?

Could it pass while the implementation is broken?

Is it testing the correct boundary?

Is it deterministic?

Is it unnecessarily coupled to implementation?
```

---

## New Feature Testing

A new feature should identify its meaningful risks before implementation is considered complete.

Potential requirements may include:

```text
domain tests
authorization tests
database integration tests
contract tests
UI tests
```

depending on the feature.

---

## Definition of Done

Testing requirements should be part of the repository's Definition of Done.

A change is not complete merely because the implementation compiles.

It should include the verification appropriate to its risk.

---

## Risk-Based Testing

More critical behavior deserves stronger test evidence.

Potential risk dimensions include:

```text
security
data integrity
financial impact
customer impact
irreversibility
deployment complexity
external compatibility
```

The test strategy should respond to these risks.

---

## High-Risk Changes

Examples may include:

```text
authorization policy
authentication mechanism
database migration
payment workflow
data deletion
secret handling
public API compatibility
```

Such changes may require several complementary test layers.

---

## Low-Risk Changes

Low-risk changes should not require excessive test ceremony.

Examples may include:

```text
documentation typo
internal refactor already protected by existing tests
non-functional formatting change
```

Testing should remain proportional.

---

## Testing Private Methods

Private methods should not normally require direct tests.

Their behavior should be exercised through the owning public responsibility.

If a private method becomes difficult to test because it contains substantial independent behavior, that may indicate a missing module boundary.

---

## Test-Only Production APIs

Avoid adding production APIs solely to make internal implementation testable.

Prefer architectural seams that are meaningful in production.

---

## Testability

Testability is an architectural property.

Code with:

```text
explicit dependencies
small responsibilities
deterministic behavior
clear boundaries
```

is generally easier to test.

Do not use testing as an excuse for excessive abstraction.

---

## Dependency Injection

Explicit dependency injection may improve testability for replaceable infrastructure.

It does not require a dependency injection framework.

Avoid interfaces created solely because "tests need mocks" when no meaningful boundary exists.

---

## Test Framework Coupling

Domain and application code should not depend on the test framework.

Testing libraries belong in test code or test infrastructure.

Production behavior must remain test-framework-independent.

---

## Shared Testing Package

A future `packages/testing/` may contain reusable testing capabilities such as:

```text
factories
fixtures
test database utilities
custom assertions
integration harnesses
```

It must not become a dumping ground.

Behavior-specific tests should remain near the code they protect.

---

## Test Placement

Tests should generally live close to the behavior they protect.

This improves discoverability.

Potential structure:

```text
feature/
├── implementation
└── tests
```

or colocated conventions supported by the selected stack.

System-level and end-to-end suites may live in dedicated locations.

---

## Unit Test Placement

Unit tests should remain discoverable next to or near their module.

Do not create a distant global unit-test tree that mirrors the entire repository unless the selected ecosystem strongly benefits from it.

---

## End-to-End Test Placement

End-to-end tests may require dedicated application-level suites because they cross multiple boundaries.

Their ownership should still be explicit.

---

## Test Ownership

Every important test suite should have an identifiable owner.

A failing test should not become:

```text
someone else's problem
```

Ownership usually follows the feature, package, or application being tested.

---

## Test Documentation

Complex test infrastructure should document:

```text
how to run it
required dependencies
environment assumptions
debugging approach
known limitations
```

Simple tests should not require unnecessary documentation.

---

## Test Commands in Local `AGENTS.md`

Application- or package-specific `AGENTS.md` files may eventually document relevant validation commands.

They should reference canonical scripts rather than duplicate implementation logic.

---

## AI Agent Behavior

AI agents should treat tests as part of the implementation.

Before modifying behavior, an agent should:

```text
inspect existing tests
identify protected contracts
determine missing coverage
choose the appropriate test layer
```

An agent must not delete or weaken tests merely to make a change pass unless the protected behavior is intentionally changing.

---

## AI and Failing Tests

A failing test is evidence.

An AI agent should determine:

```text
Is implementation wrong?

Is test wrong?

Has the contract intentionally changed?

Is the failure environmental?
```

It should not assume the test is obsolete simply because it conflicts with generated code.

---

## AI and Regression Tests

When fixing a bug, an AI agent should add a regression test whenever practical.

The preferred sequence is:

```text
reproduce bug
    ↓
test fails
    ↓
fix implementation
    ↓
test passes
```

---

## AI and Test Selection

AI agents should prefer the narrowest meaningful test during iteration.

Before completing the task, they should run the broader canonical validation required by repository policy.

---

## AI-Generated Tests

AI-generated tests must be held to the same standards as human-authored tests.

Avoid tests that:

```text
assert trivial facts
mock everything
duplicate implementation
pass regardless of behavior
```

A test is valuable only if it can meaningfully fail.

---

## Test Failure Reproduction

When an AI agent receives a failing CI test, it should attempt to reproduce the relevant failure through the canonical local workflow where possible.

CI-specific assumptions should remain discoverable.

---

## Evidence-Based Changes

Tests, logs, traces, schemas, and contracts should allow AI agents to reason from observable evidence.

This is a central Orion principle.

---

## Test Performance

The test suite should have performance expectations.

Very slow tests reduce how frequently contributors run them.

Over time, test duration should be observable and optimized when it becomes a development bottleneck.

---

## Slow Test Classification

Tests that require expensive infrastructure may be categorized separately.

Examples:

```text
external sandbox tests
browser end-to-end tests
load tests
migration compatibility tests
```

Their slower execution should be intentional.

---

## Test Timeouts

Tests should have bounded execution time.

A hung test should eventually fail rather than block CI indefinitely.

Timeout values should be appropriate for the category.

---

## Test Resource Cleanup

Tests that create external resources must clean them up reliably.

Examples:

```text
database rows
temporary files
containers
provider sandbox resources
```

Cleanup should occur even after failure where practical.

---

## Leaked Test Resources

Leaked test resources can create:

```text
cost
flakiness
security risk
state pollution
```

Resource lifecycle should therefore be explicit.

---

## Test Secrets

Tests must never contain real production secrets.

Synthetic secrets should be obviously fake.

Example:

```text
test-secret-not-valid
```

Do not create realistic-looking credentials that trigger secret scanners unnecessarily unless testing the scanner itself.

---

## Test Logging

Test output should remain useful.

Avoid excessive logging that hides failures.

When tests fail, targeted diagnostics are more valuable than complete internal dumps.

---

## Sensitive Test Output

Even synthetic tests should follow safe logging patterns.

Unsafe habits in test code often spread into production code.

---

## Environment Parity

Test environments should reproduce production semantics where those semantics matter.

Examples include:

```text
database engine
serialization
timezone behavior
transaction semantics
```

Perfect environment parity is neither always possible nor necessary.

The important differences should be understood.

---

## Emulator Limitations

Emulators and in-memory substitutes may differ from production services.

When they are used, important provider-specific behavior may still require integration validation against the real system or official sandbox.

---

## Compatibility Testing

Separately deployable components may require compatibility tests.

Examples:

```text
new API with old mobile client

new event producer with old consumer

new database schema with previous application version
```

Compatibility expectations will be defined further in:

- [docs/architecture/versioning-and-compatibility.md](versioning-and-compatibility.md)

---

## Backward Compatibility Tests

If a compatibility promise exists, it should have automated protection where practical.

A written promise without verification is fragile.

---

## Forward Compatibility Tests

Some deployments may require old applications to tolerate newer data or contracts.

This should be tested only where the architecture explicitly requires it.

---

## Release Tests

Release-specific validation may include:

```text
build succeeds

artifacts generated

migration path valid

smoke tests succeed

critical compatibility checks succeed
```

The exact release process will be defined later.

---

## Production Tests

Automated testing against production should be extremely limited and safe.

Potential examples may include:

```text
synthetic health checks
non-destructive smoke operations
```

Never run destructive integration suites against production data.

---

## Synthetic Monitoring

Future reliability tooling may continuously execute safe synthetic workflows against deployed systems.

This is operational monitoring rather than ordinary CI testing.

It should be designed separately.

---

## Test Data Privacy

Testing practices must follow:

- [docs/security/data-classification.md](../security/data-classification.md)

Production-derived data should not enter ordinary test environments by default.

---

## Anonymized Production Data

If production-derived data is ever required for a specific test, anonymization must be meaningful.

Removing obvious names alone may not prevent re-identification.

Synthetic data remains preferable.

---

## Database Dumps

Production database dumps must not be used as ordinary local test fixtures.

This creates unnecessary privacy and security risk.

---

## Test Reports

Test reports may contain:

```text
input data
failure messages
screenshots
stack traces
```

They must not expose restricted information.

---

## Test Artifacts Retention

CI artifact retention should eventually reflect:

```text
diagnostic value
cost
data classification
```

Sensitive artifacts may require shorter retention or stricter access.

---

## Testing Documentation

The repository should eventually provide generated or authored guidance showing:

```text
available test categories
canonical commands
required infrastructure
CI mapping
```

This document defines principles.

Implementation-specific commands belong with actual tooling.

---

## Mechanical Enforcement

Future tooling may enforce testing requirements such as:

```text
architecture rules have tests

generated artifacts are current

forbidden test-only production dependency absent

critical configuration validation covered

database migrations validated

public contracts validated
```

Not every testing requirement can or should be mechanically enforced.

---

## Test Metadata

If the repository eventually needs richer orchestration, tests may expose metadata such as:

```text
category
owner
runtime
required infrastructure
risk
```

This should be introduced only when useful.

---

## Test Tags

Test tags or categories may distinguish:

```text
unit
integration
e2e
slow
external
```

Naming should remain standardized.

Do not build complex test taxonomy prematurely.

---

## Test Skipping

Tests should not be skipped casually.

A skip should have a clear reason.

Long-term unexplained skips are effectively deleted tests.

---

## Conditional Tests

Environment-dependent conditional skipping should be explicit.

For example:

```text
provider sandbox unavailable
```

may justify a separate opt-in suite.

Core correctness tests should not silently skip because infrastructure is missing.

---

## Disabled Tests

A disabled critical test should be treated as technical debt.

The repository should avoid accumulating permanent inactive safety checks.

---

## Removing Tests

A test may be removed when:

```text
protected behavior no longer exists

contract intentionally changed

test duplicates stronger coverage

test validates obsolete implementation detail
```

Removal should be intentional.

---

## Refactoring Tests

Refactoring may require adjusting tests that depend on implementation details.

Behavioral guarantees should remain protected.

A refactor that deletes meaningful coverage is incomplete.

---

## Duplicate Tests

Some overlap between test layers is acceptable for critical behavior.

Excessive duplicate testing increases runtime and maintenance cost.

Each layer should add distinct confidence.

---

## Test Value

A useful test should optimize for:

```text
defect detection
clarity
speed
stability
maintenance cost
```

No single dimension should dominate blindly.

---

## Initial Testing Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Tests must protect meaningful behavior, contracts, or invariants.
2. Test level should match the risk being verified.
3. Pure business behavior should prefer fast deterministic tests.
4. Real integration behavior should be tested against real dependencies where semantics matter.
5. Database behavior should eventually be validated against the actual production database technology.
6. Critical external contracts should receive contract or integration validation.
7. End-to-end tests should focus on critical workflows rather than every permutation.
8. Architecture rules should become mechanically tested.
9. Security-sensitive behavior must include denial-path tests.
10. Bug fixes should include regression tests whenever practical.
11. Tests must be deterministic and independent where practical.
12. Test execution order must not be required for correctness.
13. Production data and credentials must not be used in ordinary automated tests.
14. Flaky tests are defects.
15. Mocks should isolate real boundaries rather than duplicate implementation.
16. Important failure paths, retries, transactions, and concurrency should be testable.
17. Test output and artifacts must follow data-classification policy.
18. Test commands must become canonical and reproducible once tooling exists.
19. AI agents must treat tests as part of the implementation.
20. Coverage metrics must support judgment rather than replace it.

---

## Remaining Implementation Decisions

The accepted choices are linked above. These remaining details are intentionally deferred:

```text
mocking library
database isolation strategy
container lifecycle and reuse strategy
test categorization
mutation testing
CI parallelization
affected-test detection
```

These choices should follow the selected technology stack and repository tooling.

Significant choices may be captured through ADRs.

---

## Future Documentation

This document may later be complemented by:

```text
docs/architecture/versioning-and-compatibility.md

docs/database/migrations.md
docs/database/transactions-and-concurrency.md

docs/api/principles.md
docs/api/error-contract.md

docs/reliability/health-checks.md

apps/<application>/README.md
packages/testing/README.md
```

Implementation-specific testing documentation should reference this strategy rather than redefine its principles independently.

---

## Summary

Tests exist to protect important behavior.

The core decision model is:

```text
What can fail?
    ↓
At which boundary would the defect exist?
    ↓
What is the cheapest reliable test that would detect it?
```

Orion prefers:

```text
behavior over implementation details

determinism over environmental dependence

real integration where semantics matter

focused tests over unnecessary end-to-end coverage

negative security tests over happy paths alone

regression evidence over bug fixes without protection

fast feedback over oversized default suites
```

Tests should make change safer.

They should make architecture more explicit.

They should provide evidence when behavior breaks.

A test that never detects a meaningful defect provides little value.

A test suite that cannot be trusted provides false confidence.

Orion should optimize for reliable, meaningful, and appropriately layered verification.
