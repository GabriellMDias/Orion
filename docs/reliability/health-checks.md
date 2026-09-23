# Health Checks

## Purpose

This document defines the health-check principles used by Orion.

Its goals are to ensure that runtime health signals are:

- semantically clear;
- safe;
- lightweight;
- suitable for orchestration;
- useful for deployment automation;
- observable;
- non-destructive;
- resistant to cascading failure;
- independent from a specific hosting platform;
- understandable by humans and AI agents.

Health checks exist to answer narrowly defined operational questions.

They should not become general diagnostic endpoints.

This document is technology-agnostic.

Specific endpoint paths, orchestration probes, platform integrations, database checks, load-balancer behavior, and monitoring providers will be selected later through explicit architectural decisions.

This document complements:

- `docs/reliability/observability.md`;
- `docs/reliability/logging.md`;
- `docs/reliability/metrics.md`;
- `docs/reliability/alerting.md`;
- `docs/architecture/configuration.md`;
- `docs/security/production-access.md`.

---

## Core Principle

Different health questions require different signals.

The fundamental distinction is:

```text
liveness
    → should this process continue running?

readiness
    → should this process receive traffic or work?

startup
    → has this process completed initialization sufficiently to begin normal health evaluation?
```

These questions must not be collapsed into one generic:

```text
/health
```

with ambiguous semantics.

---

# Health Is Contextual

A process can be:

```text
alive
```

while:

```text
not ready
```

For example:

```text
application process running
    +
database temporarily unavailable
```

may mean:

```text
liveness = healthy
readiness = unhealthy
```

Restarting the application repeatedly may not repair an external database outage.

---

# Liveness

Liveness answers:

```text
Is the process itself still capable of making progress?
```

A failed liveness check tells the runtime supervisor:

```text
this process is no longer healthy enough to continue
```

and may justify restart.

---

# Liveness Should Be Minimal

A liveness check should normally inspect only process-local conditions.

Potential concerns include:

```text
event loop or runtime deadlock
fatal initialization corruption
process unable to serve health logic
irrecoverable internal state
```

It should not normally depend on remote systems.

---

# Remote Dependencies Do Not Usually Belong in Liveness

Do not make liveness depend directly on:

```text
database
cache
payment provider
email provider
message broker
identity provider
external API
```

unless the process truly cannot recover or function meaningfully without restart.

If a dependency outage causes liveness failure, orchestration may repeatedly restart healthy application processes during the dependency incident.

This can amplify the outage.

---

# Liveness Failure

A liveness failure should indicate a problem that process restart has a reasonable chance of correcting.

Examples may include:

```text
deadlocked runtime
corrupted unrecoverable internal scheduler
irrecoverable initialization state
```

A dependency outage usually does not satisfy this rule.

---

# Readiness

Readiness answers:

```text
Can this process safely perform the work it may receive right now?
```

A failed readiness check should normally remove the process from:

```text
request routing
job claiming
traffic allocation
```

without necessarily terminating it.

---

# Readiness Is About Work Acceptance

A process should be ready only when it can perform its expected responsibilities within acceptable operating assumptions.

Potential readiness inputs include:

```text
required initialization completed
required database available
required message broker available
critical internal resources available
application not draining for shutdown
```

The exact dependencies depend on the runtime's responsibility.

---

# Dependency Failure and Readiness

If a backend cannot serve meaningful requests without its database:

```text
database unavailable
    ↓
readiness = unhealthy
```

may be appropriate.

But:

```text
liveness = healthy
```

can remain correct.

The process stays running and can recover when the database returns.

---

# Startup Check

Startup health answers:

```text
Has the process completed initialization sufficiently for ordinary liveness/readiness checks to begin?
```

This is useful when startup may legitimately take longer than normal probe timeouts.

Examples include:

```text
loading application metadata
warming required local state
establishing required initial resources
running startup validation
```

---

# Startup vs Readiness

Startup and readiness are related but distinct.

During startup:

```text
process not yet initialized
```

may not mean:

```text
process is broken
```

A startup probe can prevent an orchestrator from prematurely treating slow initialization as a liveness failure.

---

# Startup Must Be Bounded

Startup cannot remain incomplete forever.

If initialization cannot complete within a reasonable bounded period, deployment should fail visibly.

Do not use startup checks to hide indefinite initialization problems.

---

# Health Dimensions

A runtime may expose several health concepts:

```text
live
ready
starting
degraded
```

Not every deployment platform requires a formal endpoint for each concept.

The semantic distinctions should still remain clear.

---

# Degraded State

A process may remain capable of useful work while some non-critical capability is unavailable.

Example:

```text
primary API works
email provider unavailable
```

Depending on application semantics:

```text
readiness = healthy
overall diagnostic status = degraded
```

may be correct.

Do not remove the entire application from service because one optional capability is unavailable.

---

# Critical vs Non-Critical Dependencies

Dependencies should be classified according to the runtime responsibility.

Conceptually:

```text
required dependency
    → absence prevents core work

optional/degradable dependency
    → absence reduces capability but core work remains possible
```

This classification should drive readiness semantics.

---

# Dependency Criticality Is Application-Specific

A dependency may be critical for one runtime and optional for another.

Example:

```text
message broker
```

may be:

```text
critical for worker
```

but:

```text
optional for read-only API endpoint
```

Health semantics should follow actual runtime responsibility.

---

# Health Checks Should Not Encode Every Dependency

A health endpoint does not need to test every downstream system.

Doing so may create:

```text
slow probes
cascading failures
false unavailability
excessive load
```

Only dependencies necessary for the health question should be included.

---

# Dependency Health vs Service Health

A dependency can be unhealthy while the service remains partially healthy.

Example:

```text
analytics provider unavailable
```

should not necessarily make a transactional API unready.

Dependency health and service readiness are related but not identical.

---

# Health Endpoint Scope

Health endpoints should expose only the minimum information required by their consumer.

Potential consumers include:

```text
container orchestrator
load balancer
deployment pipeline
monitoring system
operator
```

Each may need different detail.

---

# Machine-Facing Health

Machine health endpoints should return simple deterministic signals.

Conceptually:

```text
healthy
unhealthy
```

plus protocol status.

They should not require parsing verbose human prose.

---

# Diagnostic Health

A separate authenticated diagnostic surface may expose more detail when operationally useful.

For example:

```text
database: healthy
messageBroker: degraded
emailProvider: unavailable
```

Such detail should not automatically be public.

---

# Public Health Output

Externally reachable health endpoints must not expose:

```text
database hostname
database name
internal service topology
provider credentials
environment variables
stack traces
deployment secrets
internal IP addresses
raw dependency errors
```

Health checks are a common information-disclosure surface.

---

# Minimal Health Response

A simple response may be conceptually:

```json
{
  "status": "ok"
}
```

or:

```json
{
  "status": "unavailable"
}
```

The exact format depends on platform requirements.

---

# Correlation IDs

Routine health-check responses do not necessarily require request or trace identifiers.

If health requests participate in ordinary request middleware, correlation may still exist internally.

Avoid unnecessary public detail.

---

# Health Endpoint Authentication

Infrastructure-local health endpoints may be accessible without application authentication if network isolation provides the intended protection.

Detailed diagnostic endpoints may require authentication and authorization.

The architecture must distinguish these surfaces explicitly.

---

# Security Boundary

A health endpoint being unauthenticated does not mean it may expose unrestricted internal details.

Unauthenticated health surfaces should be especially minimal.

---

# Health Checks Must Be Read-Only

Health checks must not perform destructive or state-changing operations.

Prohibited behavior includes:

```text
creating production records
deleting records
publishing real messages
sending email
charging payment methods
mutating external provider state
```

A health check observes capability.

It should not exercise real business side effects.

---

# Synthetic Transactions

Synthetic production monitoring is a separate concept.

A synthetic test may intentionally execute a controlled user-like workflow.

That is not the same as orchestration health checking.

Do not combine the two.

---

# Database Health

A database health check may verify minimal connectivity and required ability to perform the runtime's normal class of operation.

Potential strategies include:

```text
connection acquisition
lightweight constant query
minimal metadata query
```

The exact mechanism depends on the database stack.

---

# Database Check Must Be Cheap

Avoid:

```text
full table scan
large aggregate query
expensive join
schema introspection on every probe
```

Health checks may run very frequently.

An expensive probe can become production load.

---

# Database Readiness

If the application requires database access to perform core work, inability to reach the database may make the application unready.

This does not normally make it non-live.

---

# Database Permissions

A health query should use the same runtime identity where practical.

Testing with an unrelated administrative credential may produce false confidence.

For example:

```text
admin health query succeeds
runtime role cannot read
```

would be misleading.

---

# Database Schema Compatibility

An application that cannot safely operate against the current schema should not become ready.

A startup or readiness validation may verify required schema compatibility.

This should be lightweight and deterministic.

---

# Schema Check vs Full Migration Inspection

Do not replay migration history or perform expensive schema diffing in every readiness probe.

Compatibility should be represented through a lightweight mechanism if runtime validation is required.

---

# Cache Health

Cache availability should affect readiness only if the cache is required for correctness or acceptable operation.

If the system can safely fall back to the database:

```text
cache unavailable
```

may produce:

```text
degraded
```

rather than:

```text
unready
```

depending on resulting load and reliability.

---

# Cache Failure Can Become Critical

A cache that is technically optional may still become operationally critical if fallback would overload the database.

Readiness policy should reflect tested production behavior, not theoretical architecture.

---

# Message Broker Health

A worker unable to reach its required broker may be unready to process work.

An API that only publishes non-critical asynchronous notifications may have different semantics.

Dependency criticality remains contextual.

---

# Queue Connectivity

A health check should not publish arbitrary test messages on every probe.

Prefer lightweight connectivity or platform-native health signals.

---

# External Provider Health

Do not call every third-party provider during every health check.

Examples:

```text
payment API
email provider
identity provider
shipping provider
```

Such probes may:

```text
increase cost
hit rate limits
create false failures
increase dependency traffic
slow readiness
```

Runtime readiness should depend on external providers only when necessary.

---

# Provider Availability

A service may remain ready even when an external provider is temporarily unavailable if requests can:

```text
queue
retry later
degrade gracefully
return a bounded provider-specific failure
```

Readiness means the service can perform its responsibility safely, not that every downstream system is perfect.

---

# Dependency Health Should Come From Multiple Signals

For many remote systems, dependency health is better inferred from:

```text
real request error rate
latency metrics
circuit breaker state
provider status
```

than from constant synthetic polling inside readiness checks.

---

# Health Check Timeouts

Every dependency health check must have a short bounded timeout.

A health endpoint that waits indefinitely for a dependency can itself become unhealthy.

---

# Probe Timeout Budget

The total health response time must fit comfortably within the caller's timeout.

Conceptually:

```text
probe timeout
    >
internal health timeout
    +
processing overhead
```

Do not make internal checks use the entire external timeout budget.

---

# Parallel Dependency Checks

If several independent dependencies must be checked, parallel execution may reduce latency.

The implementation should still use bounded resource consumption.

---

# Sequential Checks

Sequential dependency checks can create cumulative latency:

```text
database 1s
broker 1s
cache 1s
    ↓
health response 3s
```

This may exceed probe budgets.

---

# Dependency Check Count

Before adding another readiness dependency, ask:

```text
If this dependency is unavailable, should this process really stop receiving all work?
```

If not, it likely does not belong in the critical readiness path.

---

# Failure Thresholds

Orchestrators commonly support failure thresholds.

One failed probe should not always immediately remove or restart a process.

Transient network noise may occur.

The exact threshold configuration is deployment-specific.

---

# Success Thresholds

Recovery may also require one or more successful probes.

The policy should balance:

```text
fast recovery
```

against:

```text
flapping prevention
```

---

# Flapping

A process that rapidly alternates:

```text
ready
not ready
ready
not ready
```

can destabilize traffic routing.

Health design should avoid overly sensitive checks.

---

# Hysteresis

Where useful, recovery/decline thresholds may differ to reduce flapping.

This belongs primarily to orchestration and alerting configuration.

---

# Readiness During Shutdown

A process beginning graceful shutdown should become unready before termination.

Conceptually:

```text
shutdown signal
    ↓
readiness = false
    ↓
stop receiving new work
    ↓
drain in-flight work
    ↓
terminate
```

This is critical for graceful deployments.

---

# Liveness During Shutdown

A gracefully draining process may remain live while it finishes existing work.

Liveness should not force premature termination during the allowed shutdown window.

---

# Worker Shutdown

A worker should stop claiming new jobs when it becomes unready or begins shutdown.

In-flight work should follow queue-specific safe completion or release semantics.

---

# Deployment Readiness

A newly started instance should not receive traffic until:

```text
startup completed
required configuration validated
critical dependencies ready
```

This reduces deployment-time failures.

---

# Deployment Completion

A deployment pipeline should not consider an instance healthy solely because the process started.

Readiness should confirm that the runtime can actually perform its expected work.

---

# Configuration Validation

Critical configuration should be validated before readiness becomes healthy.

Invalid configuration should generally cause startup failure rather than indefinite unready state when recovery requires a new deployment.

---

# Recoverable vs Non-Recoverable Startup Failure

If failure can recover without restart:

```text
database temporarily unavailable
```

the process may stay alive and become ready later.

If failure cannot recover without corrected deployment:

```text
invalid required configuration
```

the process should normally fail fast.

---

# Credential Failure

A permanently invalid runtime credential may be a startup or readiness failure.

Repeated process restart may still be useless.

The operational system should make the configuration defect visible rather than creating an endless restart loop.

---

# Restart Is Not Recovery for Everything

Health policy should distinguish:

```text
restart may repair process-local failure
```

from:

```text
restart cannot repair external/systemic failure
```

This is the central reason liveness and readiness differ.

---

# Readiness and Partial Capability

An application with many independent capabilities may not have one obvious readiness answer.

For example:

```text
read endpoints healthy
write endpoints unavailable
```

A single load-balancer readiness state may be too coarse.

Possible strategies include:

```text
degraded behavior
separate runtimes
capability-specific routing
```

depending on real requirements.

Do not prematurely create dozens of health endpoints.

---

# Modular Monolith Health

A modular monolith may contain many modules but one runtime.

Readiness should represent the runtime's service contract rather than expose one probe per module by default.

---

# Microservice Health

If Orion applications later split into separate services, each service should own its own health semantics.

A central health service should not become the only source of health truth.

---

# Health Aggregation

An operational dashboard may aggregate health across services.

An aggregated dashboard status is not the same as an orchestration liveness/readiness signal.

---

# Overall Health Status

Diagnostic health may represent:

```text
healthy
degraded
unhealthy
```

The exact vocabulary may be useful for humans.

Machine orchestration often still needs a simpler binary ready/not-ready decision.

---

# Status Semantics

If `degraded` exists, its meaning must be explicit.

For example:

```text
service can perform core work
but at least one non-critical capability is unavailable
```

Do not use `degraded` as a vague catch-all.

---

# Dependency Detail

Diagnostic output may include dependency status.

Conceptually:

```text
database:
    status: healthy

email:
    status: degraded
```

Only expose details to authorized operational consumers when necessary.

---

# Dependency Names

Health output should use stable architectural names rather than raw infrastructure hostnames.

Prefer:

```text
primaryDatabase
```

over:

```text
db-prod-17.internal.example
```

---

# Dependency Error Detail

Do not expose raw dependency exceptions in health responses.

Bad:

```text
password authentication failed for user ...
```

Good:

```text
database:
    status: unavailable
```

with detailed diagnostics available internally through logs/error reporting.

---

# HTTP Status

For HTTP health endpoints, transport status should represent probe semantics.

Conceptually:

```text
healthy
    → success status

unhealthy
    → failure status
```

Exact codes and endpoint structure are implementation decisions.

---

# Health Response Schema

Once defined, health response schemas used by automation should remain stable.

Do not casually change field names consumed by orchestration or monitoring.

---

# Health Endpoints Are Contracts

Even internal infrastructure endpoints can become compatibility boundaries.

Consumers may include:

```text
orchestrator
load balancer
deployment pipeline
external uptime monitor
```

Changing behavior requires coordination.

---

# Logging Health Checks

Successful high-frequency health checks should not normally produce one log per request.

This creates low-value volume.

---

# Health Failure Logging

A health transition may be logged when useful.

For example:

```text
readiness.changed
    from: ready
    to: unready
```

This is generally more valuable than logging every failed poll.

---

# Repeated Failure Logging

Avoid one warning per probe during a long outage.

Use:

```text
state transition logs
metrics
alerts
```

to prevent log storms.

---

# Health Metrics

Useful health-related metrics may include:

```text
readiness state
dependency check failures
dependency check duration
state transition count
```

only when these answer operational questions.

---

# Binary Health Metrics

A binary readiness metric may be useful for dashboards.

It should not replace underlying causal metrics such as:

```text
database error rate
queue backlog
dependency latency
```

---

# Health Check Duration

Health-check latency itself may be measured if probes become unexpectedly slow.

A slow health endpoint may indicate:

```text
dependency degradation
resource starvation
bad probe design
```

---

# Tracing Health Checks

Routine health checks should normally be excluded from distributed tracing or heavily sampled.

They often generate enormous low-value trace volume.

---

# Failed Health Traces

Tracing failed health checks may be useful in rare cases.

Usually the underlying dependency signals provide better evidence.

---

# Error Reporting

Expected readiness failure during a known dependency outage should not automatically create one error-tracker issue per probe.

Unexpected bugs in the health-check implementation itself may be tracker-worthy.

---

# Alerting

Health endpoints may contribute to alerting, but raw probe failure is not always the best incident signal.

Alerting should consider:

```text
duration
affected traffic
replica count
error rate
SLO impact
```

Detailed policy belongs in:

```text
docs/reliability/alerting.md
```

---

# One Instance Unready

One unready instance in a pool of many healthy replicas may not require human intervention.

The orchestrator may recover automatically.

---

# Many Instances Unready

If most or all instances become unready simultaneously, this may indicate:

```text
shared dependency failure
bad deployment
configuration error
```

and may warrant alerting.

---

# Liveness Restart Storm

If an external dependency is included incorrectly in liveness, all instances may repeatedly restart together.

This can:

```text
increase startup load
amplify dependency traffic
reduce diagnostic evidence
delay recovery
```

This pattern must be avoided.

---

# Thundering Herd

When a dependency recovers, many unready instances may retry health checks simultaneously.

Probe intervals and retry behavior should avoid unnecessary thundering-herd load.

---

# Health Check Frequency

Probe frequency should balance:

```text
fast failure detection
resource cost
dependency load
flapping risk
```

The exact interval depends on deployment architecture.

---

# Dependency Polling Load

If:

```text
100 instances
×
health check every 2 seconds
```

each query the database, that creates:

```text
50 health queries per second
```

before any user traffic.

Health checks are production workload.

---

# Cheap by Design

The cost of a health check should remain small and predictable as the system grows.

Probe cost should not scale with:

```text
user count
table size
queue history
number of transactions
```

---

# No Full-System Validation Per Probe

A health check should not run:

```text
all migrations
all tests
all provider checks
full data consistency validation
```

on every call.

Such validation belongs in:

```text
CI
deployment validation
background integrity checks
runbooks
```

---

# Startup Validation vs Health Validation

Expensive deterministic validations may belong at startup.

Example:

```text
validate configuration schema
```

rather than running on every readiness probe.

---

# Background Integrity Checks

Long-running data-integrity checks should not block liveness/readiness unless the discovered defect truly makes serving traffic unsafe.

They should have separate monitoring.

---

# Health and Circuit Breakers

If a critical dependency circuit breaker is open, readiness may be affected depending on application semantics.

The decision should follow the service's ability to perform meaningful work.

Do not mechanically map:

```text
circuit open
```

to:

```text
unready
```

for every dependency.

---

# Health and Retry Storms

Readiness should not hide a dependency failure while application requests generate uncontrolled retries.

Dependency degradation requires coordinated:

```text
timeouts
retry policy
circuit breaking
readiness
```

where relevant.

---

# Health and Rate Limiting

A service under high load should not necessarily fail liveness.

It may remain:

```text
alive
ready
```

while applying:

```text
rate limiting
backpressure
```

If saturation prevents safe new work, readiness behavior may need reconsideration.

---

# Resource Saturation

Extreme local resource exhaustion may affect readiness.

Examples:

```text
connection pool completely saturated
worker capacity exhausted
disk unavailable
```

Whether this is transient load or process failure determines the proper signal.

---

# Memory Pressure

High memory usage is not automatically a liveness failure.

The runtime/platform may have better native resource controls.

Do not implement fragile custom memory thresholds without operational evidence.

---

# Disk Space

Applications requiring local durable storage may need disk health considerations.

Stateless applications often should rely on platform-level disk monitoring instead.

---

# Thread Pool / Event Loop

A severely blocked runtime may cause the health endpoint itself to stop responding.

This naturally makes liveness fail without a specialized deep check.

Avoid redundant complexity unless the runtime requires it.

---

# Health Handler Isolation

A health handler should be simple enough to remain responsive during partial application degradation.

Do not route health checks through:

```text
complex business middleware
expensive authorization
full application orchestration
```

unless required.

---

# Middleware

Some common middleware may still apply:

```text
basic request handling
correlation
security headers
```

but health probes should avoid unnecessary business processing.

---

# Dependency Check Caching

If dependency checks are expensive, short-lived cached health state may be considered.

Caching introduces:

```text
staleness
recovery delay
additional semantics
```

Use only when necessary.

---

# Health State Memory

Some systems may retain recent health state to reduce flapping.

This should not become a complex hidden state machine without strong need.

---

# Platform-Native Health

Hosting platforms may provide native health signals.

Orion should integrate with platform conventions rather than inventing incompatible behavior.

---

# Container Orchestration

Container platforms commonly distinguish:

```text
startup
liveness
readiness
```

Orion's semantics intentionally align with this general model.

The exact configuration belongs to infrastructure implementation.

---

# Load Balancers

Load balancer health checks commonly determine whether an instance receives traffic.

This maps most closely to readiness, not liveness.

---

# Process Supervisors

Process supervisors commonly restart processes that terminate or fail liveness.

They should not be used to compensate for every external dependency outage.

---

# Serverless Runtimes

Some serverless platforms do not expose traditional liveness/readiness probes.

The same semantic principles still apply to:

```text
startup initialization
dependency validation
failure behavior
```

Do not force container-specific mechanisms onto serverless deployments.

---

# Health for Client Applications

Web, mobile, and desktop applications generally do not expose server-style liveness endpoints.

They may still need:

```text
backend reachability state
offline state
service degradation UI
```

These are product concerns rather than orchestration health checks.

---

# Uptime Monitoring

External uptime checks answer:

```text
Can an external client reach this service?
```

This differs from internal readiness.

External monitoring may test a shallow public endpoint or controlled synthetic flow.

---

# Shallow Uptime Check

A shallow external check may verify:

```text
DNS
TLS
routing
application response
```

without testing every downstream dependency.

---

# Synthetic Monitoring

A synthetic monitor may test a meaningful workflow such as:

```text
authenticate test user
read controlled resource
```

This provides end-to-end evidence.

It should use isolated synthetic data and separate safety controls.

It is not a replacement for readiness.

---

# Health and Maintenance Mode

A runtime may intentionally become unready during maintenance.

Maintenance behavior should be explicit and observable.

Do not misuse liveness failure to remove a service deliberately.

---

# Health and Draining

Draining is a transitional state:

```text
alive
not accepting new work
finishing existing work
```

This normally maps to:

```text
live = true
ready = false
```

---

# Health and Deployment Rollback

If a new release never becomes ready, deployment automation should be able to fail or roll back according to release policy.

Readiness is an important deployment correctness signal.

---

# Readiness Is Not Proof of Full Correctness

A ready process may still contain bugs.

Readiness only means:

```text
the process currently satisfies the minimum conditions required to receive its expected work
```

Do not interpret it as a complete production validation result.

---

# Liveness Is Not Proof of Readiness

A live process may be unable to serve work.

These states intentionally differ.

---

# Health Is Not SLO

A service can pass all health probes while:

```text
20% of requests fail
```

due to a specific code path.

SLOs and request metrics provide broader user-experience reliability signals.

---

# Health Is Not Alerting

Health checks expose state.

Alerting decides:

```text
which state
for how long
at what scale
requires human action
```

These concerns must remain separate.

---

# Health Is Not Diagnostics

A health endpoint should not become:

```text
dump all subsystem state
```

Detailed investigation belongs in:

```text
logs
metrics
traces
error reports
runbooks
```

---

# Health Is Not Authentication

An unauthenticated health endpoint must not become a way to query:

```text
current users
tenant state
permissions
session state
```

---

# Health Is Not Business Validation

Do not test:

```text
can customer X place an order?
```

inside generic readiness.

That depends on domain state, not runtime health.

---

# Deterministic Semantics

The same health condition should produce the same result independently of arbitrary timing or random behavior.

Avoid probes that depend on:

```text
random external resource
arbitrary sample row
unstable user data
```

---

# Test Data

If a health check requires data access, it should not depend on production business records.

Prefer constant lightweight database operations.

---

# Health Check Testing

Health semantics should have automated tests.

Potential cases include:

```text
healthy startup
database unavailable
optional provider unavailable
shutdown draining
invalid configuration
```

---

# Liveness Tests

Tests should verify that external dependency failure does not incorrectly fail liveness where policy says it should not.

---

# Readiness Tests

Tests should verify that required dependency failure makes readiness unhealthy.

---

# Degraded Tests

If degraded state exists, tests should verify that non-critical failures do not remove the service from traffic unexpectedly.

---

# Shutdown Tests

Graceful-shutdown tests should verify:

```text
readiness becomes unhealthy
new work stops
in-flight work can drain
```

where practical.

---

# Health Output Tests

Public health responses should be tested to ensure they do not expose:

```text
credentials
internal exception text
hostnames
configuration values
```

---

# Timeout Tests

Dependency checks should be tested for bounded timeout behavior.

A hanging dependency must not cause the health endpoint to hang indefinitely.

---

# Flapping Tests

Complex health state logic may require tests for transitions.

Do not introduce complex hysteresis logic without test coverage.

---

# Dependency Check Abstraction

If multiple applications share health-check infrastructure, common mechanisms may live in a shared package.

Application-specific readiness semantics must remain owned by the application.

---

# Generic Health Framework

A generic health framework may provide:

```text
probe registration
timeout handling
result aggregation
safe serialization
metrics
```

It should not decide automatically which dependency is critical.

---

# Dependency Check Result

A dependency check may conceptually return:

```text
healthy
unhealthy
degraded
```

plus internal safe diagnostic metadata.

The public aggregation policy should decide how that affects readiness.

---

# Failure Reason Codes

Internal health checks may use bounded reason codes such as:

```text
DEPENDENCY_UNAVAILABLE
TIMEOUT
CONFIGURATION_INVALID
INITIALIZATION_INCOMPLETE
```

These can improve observability without exposing raw exceptions.

---

# Health Ownership

Every application's health semantics should have an identifiable owner.

Ownership answers:

```text
Which dependencies determine readiness?

Which conditions determine liveness?

Who changes these rules?
```

---

# Dependency Ownership

A shared infrastructure team may provide probe mechanisms.

The application/domain owner still decides whether dependency loss makes the runtime unable to serve.

---

# Documentation

Runtime-specific health behavior should eventually document:

```text
liveness criteria
readiness criteria
startup criteria
critical dependencies
graceful-shutdown behavior
```

near deployment/runtime implementation.

---

# Runbooks

Recurring health failures should be linked to runbooks where appropriate.

Example:

```text
readiness failing because database unavailable
    ↓
database incident runbook
```

---

# AI Agent Requirements

Before changing health behavior, an AI agent should ask:

```text
What exact question does this probe answer?

Would restarting the process repair this failure?

Can the process still safely receive work?

Is this dependency truly critical?
```

---

# AI and Liveness

An AI agent must not add a remote dependency to liveness merely because the application uses that dependency.

It should first establish that process restart is an appropriate recovery action.

---

# AI and Readiness

An AI agent should consider whether loss of a dependency prevents:

```text
all meaningful work
```

or only:

```text
one degradable capability
```

before making readiness fail.

---

# AI and Probe Cost

An AI agent should assume health checks run frequently.

It must not add:

```text
expensive query
full provider call
large data scan
```

without explicit justification.

---

# AI and Security

An AI agent must not expose raw exceptions or configuration through health responses.

---

# AI and Logging

An AI agent should avoid logging every successful health probe or every repeated failure poll.

State transitions are usually more useful.

---

# AI and Tests

Changes to liveness, readiness, startup, critical dependency classification, or graceful shutdown should include tests where practical.

---

# New Liveness Check Checklist

Before adding a liveness condition, answer:

1. What process-local failure does it detect?
2. Would restarting the process reasonably fix the failure?
3. Does the condition depend on a remote system?
4. Could a shared dependency outage restart every replica?
5. Is the check cheap?
6. Is the check bounded?
7. Can the runtime already detect this failure naturally?
8. How will the behavior be tested?

If restart is not a plausible recovery action, the condition probably does not belong in liveness.

---

# New Readiness Check Checklist

Before adding a readiness condition, answer:

1. Which runtime responsibility requires this dependency or state?
2. Can the process perform useful safe work without it?
3. Is the dependency critical or degradable?
4. Is the check cheap?
5. Is the check read-only?
6. Does it use the runtime identity where appropriate?
7. What timeout applies?
8. Could frequent probes overload the dependency?
9. How does recovery occur?
10. How will the behavior be tested?

---

# Startup Check Checklist

Before adding startup-specific behavior, answer:

1. Why can initialization legitimately take longer than normal probe timing?
2. Which initialization step must complete?
3. What is the maximum acceptable startup duration?
4. Is failure recoverable without restart?
5. Is failure caused by invalid deployment configuration?
6. Should startup fail fast instead?
7. How will deployment automation distinguish slow startup from broken startup?

---

# Health Endpoint Checklist

Before exposing a health endpoint, answer:

1. Who consumes the endpoint?
2. Is it liveness, readiness, startup, or diagnostics?
3. Does the response expose internal details?
4. Is authentication required?
5. Is the check read-only?
6. Is it cheap?
7. Is it bounded by timeout?
8. Is the response schema stable?
9. Will routine requests create logs or traces?
10. How will it be tested?

---

# Dependency Classification Checklist

For each dependency considered in health behavior, answer:

1. Which capability uses it?
2. Is it required for all core work?
3. Can the application degrade safely without it?
4. Can work be queued for later?
5. Can a local fallback be used?
6. Would removing the instance from traffic improve the situation?
7. Would restarting the process improve the situation?
8. How is dependency failure already observed?
9. What happens during a global dependency outage?
10. What happens when the dependency recovers?

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## Database Included in Liveness by Default

Avoid.

---

## External Provider Included in Liveness

Avoid.

---

## Every Dependency Included in Readiness

Avoid.

---

## Expensive Database Query in Health Check

Avoid.

---

## Publishing Test Messages on Every Probe

Avoid.

---

## Performing Business Transactions in Health Check

Prohibited.

---

## Raw Exception in Health Response

Prohibited.

---

## Configuration Dump in Health Response

Prohibited.

---

## Internal Hostnames Exposed Publicly

Avoid.

---

## One Ambiguous `/health` Endpoint for Every Purpose

Avoid when multiple semantics are required.

---

## Logging Every Successful Probe

Avoid.

---

## Warning Log on Every Failed Probe

Avoid.

---

## Tracing Every Health Request

Avoid.

---

## Restarting Healthy Processes During Shared Dependency Outage

Avoid.

---

## Health Check With No Timeout

Prohibited.

---

## Health Check Cost Scales With Data Size

Avoid.

---

## Readiness Remains Healthy During Graceful Shutdown

Avoid.

---

## Startup Failure Hidden Forever Behind Unready State

Avoid.

---

## Health Used as Full System Diagnostic Dump

Avoid.

---

# Initial Health-Check Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Liveness, readiness, and startup are distinct concepts.
2. Liveness should primarily represent process-local health.
3. Remote dependency failure should not make liveness fail by default.
4. Readiness should indicate whether the process can safely receive its expected work.
5. Critical dependency failure may make readiness unhealthy.
6. Non-critical dependency failure should support degradation where safe rather than removing the whole service from traffic automatically.
7. Startup checks should distinguish legitimate initialization time from runtime failure.
8. Health checks must be cheap, read-only, deterministic, and bounded by timeout.
9. Health checks must not perform real business side effects.
10. Public health responses must expose minimal safe information.
11. Raw exceptions, configuration, credentials, and internal topology must not be exposed through health responses.
12. Successful high-frequency health probes should not produce routine log or trace noise.
13. Graceful shutdown should make readiness unhealthy before process termination.
14. A process may remain live while unready.
15. Health-check dependency load must be considered at full replica and probe frequency.
16. Health signals should not substitute for metrics, SLOs, synthetic monitoring, or diagnostics.
17. Critical health behavior should be covered by integration tests where practical.
18. Runtime-specific health semantics should eventually be documented near deployment configuration.
19. AI agents must reason about recovery action and dependency criticality before changing health behavior.
20. Health-check semantics and safe response shapes should become mechanically standardized where practical.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text
health endpoint paths
HTTP response schema
orchestration platform
startup/liveness/readiness probe configuration
dependency check library
probe intervals
timeouts
failure thresholds
success thresholds
degraded-state representation
health metrics
external uptime monitoring
synthetic monitoring
```

These choices should follow the selected runtime, infrastructure platform, and deployment architecture.

Significant choices should be captured through ADRs.

---

# Future Documentation

This document should be complemented by:

```text
docs/reliability/alerting.md

docs/security/production-access.md
docs/security/data-retention.md

docs/runbooks/
```

Runtime-specific health configuration should be documented only after actual deployment targets exist.

---

# Summary

Health checks answer narrow operational questions.

The core distinction is:

```text
liveness
    → should this process continue running?

readiness
    → should this process receive work?

startup
    → has initialization completed enough for normal health evaluation?
```

Orion prefers:

```text
process-local liveness over dependency-coupled restart loops

capability-based readiness over checking every dependency

degraded operation over unnecessary total outage

cheap probes over full-system validation

minimal safe output over diagnostic dumps

state transitions over probe log spam

restart only when restart is a plausible recovery action
```

A database outage may make an API unready.

It does not automatically make the API process dead.

A temporary provider outage may degrade one capability without making the whole application unavailable.

A health check should help the runtime make a specific operational decision.

If it cannot explain which decision it supports, its semantics are probably too vague.
