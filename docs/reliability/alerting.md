# Alerting

## Purpose

This document defines the alerting principles used by Orion.

Its goals are to ensure that alerts are:

- actionable;
- meaningful;
- proportional to impact;
- resistant to noise;
- deduplicated;
- correlated with runtime evidence;
- owned;
- testable;
- understandable by humans and AI agents;
- independent from a specific alerting provider.

Alerting exists to identify conditions that require timely human or automated response.

It should help answer:

```text id="r1l1n8"
What is wrong?

How serious is it?

Who owns the response?

What user or system impact exists?

What evidence should be inspected first?

What action is expected?
```

An alert is not simply a metric threshold with a notification attached.

This document is technology-agnostic.

Specific alerting providers, paging platforms, notification channels, escalation systems, schedules, and SLO tooling will be selected later through explicit architectural decisions.

This document complements:

- `docs/reliability/observability.md`;
- `docs/reliability/logging.md`;
- `docs/reliability/tracing.md`;
- `docs/reliability/metrics.md`;
- `docs/reliability/error-reporting.md`;
- `docs/reliability/health-checks.md`;
- `docs/security/incident-response.md`.

---

## Core Principle

Alert only when there is a meaningful condition that requires action.

The intended model is:

```text id="lu6u0q"
observable condition
    ↓
impact evaluation
    ↓
action required?
        ↓
    no
        → dashboard / log / metric / report
        ↓
    yes
        → alert
        ↓
owner
        ↓
response
```

An alert without an expected response is usually not a good alert.

---

# Alerts Are for Action

Every alert should answer:

```text id="crv7z7"
What should the recipient do?
```

If the correct response is:

```text id="l4q4dc"
nothing
```

then the condition likely belongs in:

```text id="7rvokf"
dashboard
log
report
ticket
trend analysis
```

rather than paging or immediate notification.

---

# Human Attention Is Expensive

Alerting consumes attention.

Excessive notifications cause:

```text id="5ydidg"
desensitization
ignored alerts
slower response
missed critical incidents
operator fatigue
```

Alert volume is therefore a reliability concern.

---

# Signal vs Notification

A monitoring signal is not automatically an alert.

Examples of useful signals:

```text id="30ujcg"
CPU utilization
queue depth
dependency latency
error rate
```

Only some conditions derived from these signals require notification.

---

# Alert Severity

Alerts should use a small, consistent severity model.

A conceptual model may include:

```text id="ls7x2h"
critical
high
medium
low
informational
```

The exact taxonomy may be simplified later.

Severity should reflect required response urgency and impact.

---

# Critical

A critical alert represents a condition such as:

```text id="jhkx89"
major user-facing outage
data integrity risk
security-critical incident
critical workflow unavailable
widespread failure with no automatic recovery
```

It may justify immediate paging.

---

# High

A high-severity alert may represent:

```text id="51xc8y"
substantial degradation
rapidly increasing failure rate
important dependency failure
large backlog threatening service objectives
```

that requires prompt attention.

---

# Medium

A medium-severity alert may represent:

```text id="6w8ogt"
limited degradation
single subsystem failure with workaround
capacity trend requiring near-term action
```

It may create a ticket or business-hours notification rather than wake someone overnight.

---

# Low and Informational

Low-severity or informational notifications may indicate:

```text id="2if64f"
deprecated behavior still in use
non-critical capacity trend
one automatically recovered instance
```

These should not compete with urgent alerts.

---

# Severity Must Drive Response

Severity should correspond to:

```text id="yxx94e"
response time
notification channel
escalation
```

A severity label with no operational meaning is not useful.

---

# Symptom-Based Alerting

Prefer alerts based on observable user or service symptoms.

Examples:

```text id="5nh5rq"
valid requests failing
latency objective violated
jobs missing deadlines
critical operation unavailable
```

These represent actual service impact.

---

# Cause-Based Alerting

Cause-based alerts represent internal conditions such as:

```text id="4f27un"
high CPU
database connection count
cache unavailable
disk usage
```

They may be useful when they reliably predict or cause impact.

They should not automatically page humans merely because a resource crossed a threshold.

---

# Symptoms Before Causes

When possible, alert on:

```text id="bq9s2m"
users are affected
```

rather than:

```text id="czu3mw"
a component might eventually affect users
```

Cause metrics remain valuable for diagnosis.

---

# Example

Prefer a primary alert:

```text id="khyt2k"
checkout success rate below objective
```

with supporting evidence:

```text id="f6p113"
payment provider failures increased

database latency elevated
```

rather than paging independently for all three if they represent one incident.

---

# Cause Alerts Can Still Matter

Some infrastructure conditions require action before user impact becomes visible.

Examples may include:

```text id="fqw22n"
disk almost full
certificate nearing expiration
replication lag threatening recovery objectives
queue growing faster than maximum drain capacity
```

These are legitimate preventive alerts.

---

# Predictive Alerts

Preventive alerts should exist only when:

```text id="k8xtpe"
condition has known operational risk
action can prevent impact
response window is meaningful
```

Avoid speculative alerts for every possible future risk.

---

# Alert Ownership

Every alert must have an owner.

Ownership should identify:

```text id="1h9fv9"
team
service
domain
operational capability
```

depending on organizational structure.

An alert with no owner is unlikely to receive reliable response.

---

# Owner Must Be Able to Act

Do not route an alert to a team that cannot change or mitigate the affected system.

Ownership should align with operational authority.

---

# Default Ownership

Alerts may inherit ownership from:

```text id="so6ctg"
service
application
domain
dependency adapter
```

where repository structure makes this reliable.

---

# Shared Dependencies

Alerts for shared infrastructure may belong to an infrastructure owner.

Application teams may still receive symptom alerts caused by that dependency.

Deduplication and incident coordination should prevent redundant response.

---

# Alert Context

An alert should contain enough safe context to begin investigation.

Potential fields include:

```text id="c9ac2v"
alert name
severity
service
environment
operation
current value
threshold or objective
duration
release
dashboard link
runbook link
trace/error references where relevant
```

---

# Alert Message

Alert text should be concise and actionable.

A good alert should communicate:

```text id="8fsw4j"
what is impacted
how severe
how long
where to look
```

without requiring immediate reverse engineering of the monitoring query.

---

# Alert Names

Alert names should be stable and semantic.

Good:

```text id="14b6fd"
APIHighErrorRate
CheckoutAvailabilityBurningFast
QueueProcessingBehind
```

Bad:

```text id="5n6qui"
Alert17
CPUThing
Query123Failed
```

The exact naming convention is deferred.

---

# Alert Names Should Describe Condition

Avoid embedding volatile threshold values in the alert name.

Bad:

```text id="oj58c4"
APIErrorRateOver5Percent
```

if the threshold may later change.

Prefer:

```text id="g8hdls"
APIHighErrorRate
```

with the threshold represented in rule configuration.

---

# Environment

Alerts must identify the environment.

Production and non-production should not share identical paging behavior by default.

---

# Production Alerts

Production alerts may page or escalate according to severity.

---

# Staging Alerts

Staging failures may be important but usually should not wake production on-call staff.

They may notify:

```text id="1tkvd1"
development team
release pipeline
ticketing system
```

depending on purpose.

---

# Development Alerts

Local development should not generate operational alerts.

---

# Test Alerts

Automated tests should normally fail CI rather than trigger production alerting.

---

# Alert Thresholds

Thresholds should be based on:

```text id="1vgol7"
user impact
capacity
service objectives
known operational limits
```

not arbitrary round numbers.

---

# Static Thresholds

Static thresholds may be appropriate for conditions with clear physical or logical limits.

Examples:

```text id="cw0p2z"
disk space below safe minimum
certificate expires within N days
dead-letter backlog above known operational capacity
```

---

# Dynamic Thresholds

Dynamic or anomaly-based alerts may be appropriate for variable workloads.

They introduce additional complexity and false-positive risk.

Use only when simpler thresholds cannot represent the real condition effectively.

---

# Threshold Hysteresis

Alert recovery thresholds may differ from activation thresholds to prevent flapping.

Example:

```text id="x7mgdo"
alert when utilization > 90%

resolve when utilization < 80%
```

where such behavior is supported and operationally useful.

---

# Duration

Transient spikes should not always alert.

A rule may require the condition to persist.

Conceptually:

```text id="4fhb5t"
error rate > threshold
for 10 minutes
```

before notifying.

The correct duration depends on how quickly real impact develops.

---

# Fast Failures

Some conditions justify immediate alerting.

Examples:

```text id="k0nq34"
data corruption detected
all replicas unavailable
critical credential revoked unexpectedly
security breach indicator
```

Do not force every alert through a long waiting period.

---

# Slow-Burn Conditions

Capacity or backlog problems may develop gradually.

Alerts should provide enough lead time for action without generating early noise.

---

# Alert Flapping

An alert that repeatedly enters and exits firing state creates noise.

Mitigation may include:

```text id="ypc9jo"
duration
hysteresis
aggregation
better metric selection
```

Do not simply mute a flapping alert without understanding why it is unstable.

---

# Recovery Notifications

Recovery notifications may be useful for high-impact incidents.

They should indicate that the triggering condition has returned to healthy range.

A recovery notification does not prove the underlying root cause has been fixed permanently.

---

# Alert State

A conceptual alert lifecycle may include:

```text id="hvsxuv"
normal
    ↓
pending
    ↓
firing
    ↓
resolved
```

Provider terminology may differ.

---

# Pending State

A pending period can prevent transient conditions from firing immediately.

The duration should reflect the alert's urgency.

---

# Deduplication

Multiple signals caused by one failure should not create an unmanageable notification storm.

Alerting systems should deduplicate related notifications where practical.

---

# Duplicate Alerts

Examples of duplicate incident symptoms:

```text id="b5n1x1"
API 5xx high
API availability SLO burning
database dependency errors high
database latency high
```

All may originate from one database outage.

Not all should independently page separate responders.

---

# Primary vs Supporting Alerts

One signal may serve as the primary page.

Other signals may remain visible as supporting context.

This helps responders focus on user impact first.

---

# Aggregation

Multiple identical failures across replicas should usually become one alert representing the service-level condition.

Avoid:

```text id="uab39v"
one page per replica
```

for a shared incident.

---

# Instance-Level Alerts

Instance-level alerts may still be appropriate when:

```text id="thm2p6"
instance is unique
state cannot be automatically replaced
loss indicates data risk
```

Stateless replicated services generally benefit from service-level aggregation.

---

# One Instance Failure

A single failed replica in a healthy pool often does not require human intervention.

The orchestrator should recover it automatically.

---

# Capacity Loss

If enough replicas fail that:

```text id="h02cz9"
capacity
redundancy
availability
```

are threatened, the service-level condition may become alert-worthy.

---

# Alert Suppression

When a known parent condition explains many child alerts, suppression may reduce noise.

Example:

```text id="15ut2e"
region unreachable
```

may suppress child alerts for every service in that region.

Suppression should not hide unrelated independent failures.

---

# Maintenance Windows

Planned maintenance may require temporary suppression.

Maintenance windows should be:

```text id="gphz3g"
explicit
bounded
owned
```

Do not permanently mute alerts to avoid temporary noise.

---

# Deployment Suppression

Do not broadly disable alerting during every deployment.

Deployments are precisely when new failures may appear.

Where temporary expected behavior exists, suppress only the known condition and time window.

---

# Deployment Correlation

Alerts should make recent deployments visible where practical.

This helps answer:

```text id="5zr7zv"
Did the problem start after release X?
```

Deployment annotations on dashboards are useful supporting evidence.

---

# Post-Deployment Alerts

Some alert rules may have increased relevance immediately after release.

Examples include:

```text id="hqm6r9"
error-rate regression
latency regression
crash regression
readiness failure
```

---

# Canary Alerts

Canary deployments may use tighter comparison against the stable population.

A canary can be stopped automatically if:

```text id="byufqq"
error rate
latency
critical business success
```

degrades beyond policy.

The exact automation belongs to deployment implementation.

---

# Automated Rollback

Alert signals may eventually trigger automated rollback.

This is a high-impact mechanism.

It requires:

```text id="afj80u"
high-confidence signals
clear rollback safety
bounded automation
auditability
```

Do not connect noisy alerts directly to destructive automated actions.

---

# SLO-Based Alerting

Where Service Level Objectives exist, alerting should prefer user-impact measurements derived from SLIs.

This often produces better alerts than infrastructure thresholds alone.

---

# Error Budget

An SLO defines an allowed amount of failure.

The remaining allowance is the error budget.

Alerts may detect when the service is consuming this budget too quickly.

---

# Burn Rate

Burn rate represents how quickly the error budget is being consumed relative to the planned rate.

Conceptually:

```text id="n6neji"
burn rate = 1
```

means the service is consuming budget at the exact rate that would use the entire budget over the SLO window.

A much larger burn rate indicates rapid reliability loss.

---

# Fast Burn

A high burn rate over a short window indicates severe immediate impact.

This may justify paging.

---

# Slow Burn

A lower but sustained burn rate over a longer window may indicate a persistent reliability problem requiring action.

It may justify a lower-urgency alert.

---

# Multi-Window Burn-Rate Alerts

SLO alerting may use combinations such as:

```text id="ffo2ph"
short window
    +
longer confirmation window
```

to detect serious issues while reducing transient false positives.

Exact formulas and thresholds should be selected when real SLOs exist.

---

# Do Not Invent SLOs

Do not create alert rules based on arbitrary availability percentages before product reliability requirements are defined.

SLOs should represent actual service expectations.

---

# SLO Eligibility

The underlying SLI must correctly classify:

```text id="ytv98q"
eligible requests
successful requests
service failures
client-caused failures
```

Otherwise burn-rate alerts will be misleading.

---

# SLO and Infrastructure Alerts

SLO alerts detect user impact.

Infrastructure alerts may provide earlier warning.

Both can coexist when they answer different operational questions.

---

# Error-Rate Alerts

Error-rate alerts should use a meaningful denominator.

Bad:

```text id="dbfd3f"
errors > 100
```

without considering traffic volume.

Better:

```text id="4ck49b"
technical failure rate exceeds expected level
```

for sufficient traffic.

---

# Low-Traffic Services

Rates can become unstable with tiny denominators.

Low-volume services may require:

```text id="4ruc84"
minimum request count
longer window
absolute failure conditions
```

to avoid false alerts.

---

# Latency Alerts

Latency alerts should generally use distributions or SLO-style thresholds.

Avoid alerting on average latency alone.

Tail latency often represents user pain better.

---

# p99 Alerts

A p99 may be useful but can be unstable for low traffic.

Metric choice should match volume and user impact.

---

# Queue Alerts

Queue alerts should consider:

```text id="07c1wq"
backlog
throughput
oldest item age
deadline
```

rather than depth alone.

---

# Queue Depth Alone

A queue depth of:

```text id="nkxqp6"
10,000
```

may be healthy or catastrophic depending on:

```text id="k767jj"
processing rate
arrival rate
deadline
```

Alert on inability to keep up, not arbitrary count where possible.

---

# Oldest Message Age

For time-sensitive workloads, oldest message age may be a stronger signal.

Example:

```text id="9p7fce"
oldest payment-processing job > acceptable delay
```

is directly tied to service impact.

---

# Dead-Letter Alerts

New dead-lettered items may be alert-worthy when:

```text id="imjcy9"
messages represent important work
automatic recovery is exhausted
```

One malformed non-critical item may not justify immediate paging.

Severity should reflect workflow importance.

---

# Dependency Alerts

Dependency alerts should focus on the effect on Orion.

Example:

```text id="4nlh91"
payment provider failure rate observed by Orion
```

is usually more actionable than:

```text id="qhi0v1"
provider status page says degraded
```

External provider status can remain supporting context.

---

# Shared Dependency Failures

When one provider causes failures across many applications, alert routing should avoid separate parallel investigations where central coordination is possible.

---

# Provider Error Thresholds

A provider may return normal business errors.

Do not count:

```text id="ecjc8d"
payment declined
```

as provider availability failures.

Operational classifications must remain accurate.

---

# Database Alerts

Useful database-related alerts may include:

```text id="99vkrz"
connection pool saturation
sustained query latency
deadlock surge
database unavailable
replication lag threatening requirements
```

when application or infrastructure teams can act on them.

---

# Query Alerts

Do not create one alert per slow query fingerprint prematurely.

Slow-query analysis may belong in dashboards and investigation tools.

Alert when query degradation materially affects service or crosses known operational risk thresholds.

---

# Connection Pool Alerts

Connection pool saturation may deserve alerting when it causes:

```text id="xrn6zd"
waits
timeouts
request failures
```

A high percentage alone may be normal during healthy peak traffic.

---

# Memory Alerts

High memory utilization should alert only when:

```text id="k68nh3"
approaching known failure threshold
causing eviction/restart
growing unexpectedly
```

Avoid generic warnings at arbitrary utilization percentages.

---

# CPU Alerts

High CPU alone is often not user impact.

It may be healthy efficient utilization.

Alert when it correlates with:

```text id="kp1k97"
saturation
latency
capacity exhaustion
```

or threatens headroom.

---

# Disk Alerts

Disk capacity often has clear preventive thresholds because reaching full capacity can cause severe failure.

These alerts should provide enough lead time for remediation.

---

# Certificate Alerts

Certificate expiration is predictable.

Alerts should fire sufficiently early to allow renewal before impact.

The exact window depends on certificate management automation.

---

# Secret Expiration

Where credentials expire, expiration alerts may be useful.

Automated rotation is preferable to relying solely on human notification.

---

# Backup Alerts

Backup failures may require alerting when recovery objectives depend on successful backups.

The alert should distinguish:

```text id="jrbxtb"
one transient failed attempt
```

from:

```text id="a39tl6"
recovery objective now at risk
```

---

# Restore Verification

Successful backup creation does not prove recoverability.

Periodic restore verification may have its own operational signals.

---

# Migration Alerts

Production migration failure should become immediately visible to deployment systems.

Whether it pages a human depends on:

```text id="3irjs7"
release state
user impact
automatic rollback/recovery
```

---

# Readiness Alerts

One unready replica should not necessarily page.

Alerting should consider:

```text id="vbggfi"
percentage of ready replicas
remaining capacity
duration
traffic impact
```

---

# Liveness Alerts

Frequent restart loops can indicate severe process failure.

A restart count or crash-loop condition may be more useful than one notification per restart.

---

# Error Tracker Alerts

Error-reporting systems may notify on:

```text id="n2d8jw"
new issue
regression
fatal crash
volume increase
```

These signals should be integrated with the broader alerting policy.

---

# New Error Does Not Always Mean Page

A new browser error affecting one unsupported browser extension should not have the same notification path as:

```text id="ne9k6b"
new backend error breaking checkout for all users
```

Impact and ownership matter.

---

# Security Alerts

Security alerting may require different semantics and escalation.

Examples:

```text id="wwd7sg"
credential misuse
suspicious privilege escalation
unexpected production access
```

Detailed security incident policy belongs in:

```text id="ga4mvf"
docs/security/incident-response.md
```

---

# Security Alerts Must Avoid Sensitive Content

A security notification must not expose raw:

```text id="osqk3a"
credentials
tokens
private keys
restricted user data
```

in notification channels.

---

# Audit Alerts

Audit events and alerts are distinct.

A privileged action may need to be recorded without creating an immediate alert.

Only suspicious or policy-significant conditions should notify responders.

---

# Alert Channels

Different severities may use different channels.

Conceptual examples:

```text id="9byy2s"
critical
    → pager

high
    → pager or urgent incident channel

medium
    → team notification / ticket

low
    → dashboard / periodic review
```

The exact tooling is deferred.

---

# Paging

Paging should be reserved for conditions requiring timely response outside normal working hours.

If the issue can safely wait until the next business day, it usually should not page.

---

# Email

Email may be appropriate for:

```text id="hz18sk"
slow-moving capacity risk
upcoming expiration
non-urgent operational review
```

It is not ideal for immediate outage response.

---

# Chat Notifications

Team chat may be useful for:

```text id="78uglr"
medium severity
deployment notifications
non-paging degradation
```

Important incidents should not rely solely on a channel where notifications are easily missed.

---

# Tickets

Some alerts are better represented as work items.

Examples:

```text id="vqdslf"
deprecated API still used
storage growth trend
non-critical dependency configuration drift
```

---

# Notification Content

Notifications should not include sensitive payloads.

A notification may contain:

```text id="rm54zf"
service
environment
alert
safe metric values
runbook link
dashboard link
```

Detailed production data should remain in authorized observability systems.

---

# Paging Privacy

Paging systems and chat channels may have broader access than production telemetry.

Therefore alert messages should contain even less sensitive context than internal logs or traces.

---

# Escalation

Critical alerts should have an escalation path if unacknowledged.

The exact policy depends on team structure.

---

# Escalation Is Not Spam

Escalation should increase confidence that someone owns response.

It should not notify everyone simultaneously without reason.

---

# Acknowledgement

Acknowledgement means:

```text id="422e58"
someone is taking ownership
```

not:

```text id="wlua5d"
the incident is resolved
```

Alerting systems should preserve this distinction.

---

# Resolution

An alert resolves when its triggering condition no longer applies.

Incident closure may require additional validation and follow-up.

---

# Alerts and Incidents

An alert may start an incident.

Not every alert becomes an incident.

Not every incident begins from an automated alert.

---

# Incident Creation

Incident process should be proportional to:

```text id="q7ca3y"
impact
duration
data risk
security
cross-team coordination
```

Detailed policy belongs in incident-response documentation.

---

# Alert Runbooks

Every high-severity alert should ideally have an associated runbook once the system is mature enough.

A runbook should answer:

```text id="jkl3tn"
What does this alert mean?

What should I inspect first?

What common causes exist?

What mitigation is safe?

When should I escalate?
```

---

# Runbook Link

The alert should link directly to the runbook where tooling supports it.

Responders should not have to search the repository during an urgent incident.

---

# Runbook Quality

A runbook should not simply say:

```text id="h20zlw"
check logs
```

It should identify useful:

```text id="so283b"
dashboard
metric
log event
trace
error issue
dependency
```

where possible.

---

# Missing Runbook

A new system may have alerts before mature runbooks exist.

High-impact recurring alerts should prioritize runbook creation.

---

# Alerts Must Be Testable

Important alert rules should be verifiable.

Potential approaches include:

```text id="mgbe38"
query tests
synthetic metric fixtures
rule validation
staging simulation
```

depending on tooling.

---

# Alert Syntax Validation

Alert definitions should be checked for:

```text id="2wvue7"
invalid query
missing metric
invalid label
bad threshold expression
```

where provider tooling permits.

---

# Semantic Alert Tests

Critical alerts may require tests demonstrating that:

```text id="51f3ka"
healthy condition does not fire

known unhealthy condition fires

recovery resolves
```

---

# Alert Configuration as Code

Alert definitions should preferably live in version-controlled configuration where practical.

This provides:

```text id="j17x3a"
review
history
reproducibility
ownership
```

The exact infrastructure approach is deferred.

---

# Manual Alert Rules

Manual provider-side rules may be acceptable during early experimentation.

Long-term critical alerts should be reproducible from repository-controlled configuration where tooling supports it.

---

# Alert Changes

Changing an alert can affect incident detection.

Critical alert changes should be reviewed like production code.

---

# Deleting Alerts

Before deleting an established alert, determine:

```text id="sm45lr"
why it existed
whether signal moved elsewhere
whether another rule replaces it
whether runbooks depend on it
```

Do not delete alerts merely because they are noisy.

Fix the semantics.

---

# Noisy Alerts

When an alert fires frequently without action, investigate:

```text id="ouuo44"
wrong threshold
wrong signal
wrong duration
expected behavior
ownership problem
automatic recovery
```

Do not accept chronic noise as normal.

---

# Alert Quality Metrics

The alerting system itself may be evaluated.

Potential measures include:

```text id="yqbcez"
pages per incident
false-positive rate
alerts with no action
time to acknowledge
repeated noisy alerts
```

Formal measurement may be introduced when operational maturity requires it.

---

# Every Page Should Teach Something

Repeated alerts that produce the same manual action may indicate an opportunity for:

```text id="qshwl9"
automation
self-healing
capacity improvement
runbook improvement
root-cause fix
```

Human intervention should not remain the default automation engine.

---

# Self-Healing

Automatic recovery is preferable when:

```text id="d2aq71"
condition is well understood
recovery is safe
success can be verified
```

An alert may then be required only if automatic recovery fails or occurs excessively.

---

# Auto-Restart

Restarting one crashed stateless instance may be automatic.

Alert only if:

```text id="6whu6c"
restarts repeat
capacity degrades
all instances affected
```

rather than on every isolated restart.

---

# Retry Recovery

If a transient dependency call succeeds on retry, it may not require a page.

Metrics can still reveal excessive retry rates.

---

# Circuit Breaker Recovery

An open circuit may recover automatically.

Alert when:

```text id="o3wxr7"
user impact exists
duration is excessive
critical dependency unavailable
```

not merely whenever the state changes briefly.

---

# Alerting on Trends

Trend alerts can be useful for:

```text id="wgb3dw"
capacity
storage
certificate expiration
quota consumption
```

when trend extrapolation is reliable enough to support action.

Avoid speculative anomaly alerts without operational evidence.

---

# Quota Alerts

External provider quotas may require early warning when exhaustion would cause outages.

The alert should consider:

```text id="11pp0g"
current consumption
time until reset
growth rate
```

where available.

---

# Budget Alerts

Cost budgets may generate notifications.

Cost-management alerts are operational but not necessarily reliability incidents.

Use appropriate channels.

---

# Alert Dependencies

An alert rule should not depend on an observability component whose failure is indistinguishable from healthy zero data.

For example:

```text id="twppgf"
no metrics
```

must not silently mean:

```text id="lphryr"
zero failures
```

---

# Missing Data Handling

Alert queries should define how missing data is interpreted.

Potential cases:

```text id="93etqm"
service has no traffic
service is down
metrics exporter failed
metric was renamed
```

These are different conditions.

---

# Telemetry Pipeline Alerts

Loss of observability may itself require alerting.

Examples:

```text id="e653q4"
metrics collector unavailable
error tracker events dropping
logs no longer ingesting
```

Severity should reflect how much diagnostic capability is lost.

---

# Observability Dependency Failure

Observability failure should not break business operations.

However, extended observability loss may justify human intervention because the system is effectively operating blind.

---

# Meta-Alert Noise

Do not create one alert for every telemetry backend hiccup.

Alert when monitoring capability is materially impaired.

---

# Alert Correlation

Future tooling may correlate:

```text id="sg6bgi"
alerts
deployments
errors
traces
logs
```

into one incident view.

This is valuable but should not require application code to depend on one vendor.

---

# AI Investigation

An authorized AI agent should be able to start from an alert and determine:

```text id="xrlkm2"
what condition fired

which service is affected

which release is active

which metrics changed

which error groups increased

which traces show failures

which runbook applies
```

This requires stable, machine-readable alert metadata.

---

# Machine-Readable Alert Metadata

Future alert definitions may include metadata such as:

```text id="8l09up"
owner
severity
service
runbook
signal type
```

where tooling supports it.

---

# AI Agent Requirements

Before creating an alert, an AI agent should ask:

```text id="n8lfvm"
What impact does this detect?

What action should a human take?

Can the system recover automatically?

Which existing alert already covers this symptom?
```

---

# AI and Metric Thresholds

An AI agent must not invent arbitrary thresholds without evidence.

It should derive them from:

```text id="4u4w5v"
SLO
known capacity limit
business deadline
documented operational requirement
historical baseline where appropriate
```

---

# AI and Resource Alerts

An AI agent should not page on:

```text id="uxoifd"
CPU high
memory high
queue depth high
```

without determining the operational impact or risk.

---

# AI and Duplicate Alerts

Before adding another alert for a subsystem, an AI agent should inspect whether an existing symptom-level alert already detects the same incident.

---

# AI and Severity

An AI agent should choose severity according to:

```text id="7tnqri"
impact
urgency
required response
```

not according to the emotional wording of the condition.

---

# AI and Runbooks

A new high-severity alert should include or reference a useful runbook when practical.

---

# AI and Sensitive Data

An AI agent must not include personal data, credentials, raw payloads, or restricted identifiers in notification text.

---

# AI and Noisy Alerts

An AI agent should not solve noisy alerts simply by increasing thresholds without investigating whether the signal itself is wrong.

---

# AI and Alert Tests

Changes to critical alerts should include validation or tests where the alerting platform supports it.

---

# New Alert Checklist

Before adding an alert, answer:

1. What condition does it detect?
2. What actual impact or risk does the condition represent?
3. Why is human attention required?
4. Which owner can act on it?
5. What severity is appropriate?
6. What notification channel is appropriate?
7. What metric or signal powers it?
8. Is the signal stable and reliable?
9. What threshold is justified?
10. How long must the condition persist?
11. Can the system recover automatically?
12. Does another alert already cover the same incident?
13. What context should the notification include?
14. Is any notification content sensitive?
15. Which runbook applies?
16. How will the alert be tested?
17. What should resolve the alert?

If these questions cannot be answered, the alert is not ready.

---

# Paging Checklist

Before making an alert page someone, answer:

1. Does this condition require action before the next normal working period?
2. Is there meaningful current user, data, security, or availability impact?
3. Can the recipient actually mitigate the issue?
4. Is the signal sufficiently reliable?
5. Does automatic recovery already handle it?
6. Could several equivalent pages fire for one incident?
7. Is a runbook available?
8. What escalation occurs if nobody responds?

---

# SLO Alert Checklist

Before introducing an SLO-based alert, answer:

1. Which SLO is being protected?
2. Which SLI measures it?
3. Is the SLI accurate?
4. Which requests/events are eligible?
5. What is the current error budget?
6. What burn rate indicates urgent impact?
7. What windows reduce false positives?
8. What response is expected?
9. Is a separate slow-burn alert needed?
10. How will alert behavior be tested?

---

# Resource Alert Checklist

Before alerting on a resource metric, answer:

1. What resource is constrained?
2. What is its real safe operating limit?
3. Does crossing this threshold cause user impact?
4. Does it predict imminent impact?
5. Can the platform self-heal?
6. Is the condition sustained or transient?
7. Which action should the responder take?
8. Would symptom-level alerting detect the incident better?

---

# Noisy Alert Review Checklist

When an alert is noisy, answer:

1. Was each firing actionable?
2. Was the threshold wrong?
3. Was the window too short?
4. Is the metric noisy?
5. Is the signal expected behavior?
6. Is automatic recovery working?
7. Should severity be lowered?
8. Should the alert become a dashboard or ticket?
9. Does another alert already cover it?
10. Can the underlying problem be automated away?

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## Alert Because a Metric Exists

Avoid.

---

## Page on Every Error

Avoid.

---

## Page on Every `5xx` Event Individually

Avoid.

---

## Page on Every Restart

Avoid.

---

## Page on Every Unready Replica

Avoid.

---

## CPU Above Arbitrary Percentage

Avoid without operational justification.

---

## Memory Above Arbitrary Percentage

Avoid without operational justification.

---

## Queue Depth Threshold Without Throughput or Deadline Context

Avoid.

---

## Alert With No Owner

Prohibited.

---

## Alert With No Expected Action

Avoid.

---

## Alert With No Runbook for Recurring Critical Condition

Avoid once the system is mature.

---

## Same Incident Pages Multiple Teams Independently

Avoid where coordination is possible.

---

## Suppress Alerts During All Deployments

Avoid.

---

## Permanent Mute

Avoid.

---

## Notification Contains Sensitive Payload

Prohibited.

---

## Alert Query Uses High-Cardinality Personal Data

Avoid.

---

## Message Text Used as Primary Alert Grouping

Avoid.

---

## Missing Metric Treated as Healthy Zero Without Analysis

Avoid.

---

## SLO Invented From Arbitrary Percentage

Avoid.

---

## Threshold Raised Merely to Silence Noise

Avoid.

---

## Auto-Rollback From Noisy Signal

Prohibited.

---

# Initial Alerting Policy

Until stack-specific implementation exists, Orion adopts the following requirements:

1. Alerts should exist only for conditions requiring meaningful action.
2. Paging should be reserved for conditions requiring timely response.
3. Symptom-based alerts should generally be preferred over low-level cause alerts.
4. Preventive cause alerts are appropriate when action can reliably prevent impact.
5. Every alert must have identifiable ownership.
6. Severity must reflect impact, urgency, and expected response.
7. Alert notifications must contain only safe operational context.
8. Duplicate signals from one incident should be deduplicated or coordinated where practical.
9. Isolated automatically recoverable replica failures should not normally page humans.
10. Alert thresholds must be based on SLOs, capacity limits, deadlines, or other defensible operational requirements rather than arbitrary values.
11. Alert rules should use persistence windows or hysteresis where appropriate to reduce flapping.
12. SLO burn-rate alerting should be preferred for user-facing reliability objectives once meaningful SLOs exist.
13. Queue alerts should consider age, throughput, and deadlines rather than depth alone.
14. Expected business outcomes must not be treated as technical failures in alert signals.
15. Alert definitions should eventually be version controlled and reviewable.
16. High-severity alerts should have useful runbooks where practical.
17. Observability pipeline failure should become visible when it materially reduces diagnostic capability.
18. Noisy alerts must be treated as defects and improved rather than accepted permanently.
19. AI agents must identify impact, action, ownership, and threshold justification before creating alerts.
20. Alerting rules, ownership metadata, and runbook references should become mechanically validated where practical.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text id="3ls8cv"
alerting provider
paging provider
severity taxonomy
notification channels
escalation policy
on-call model
SLO tooling
burn-rate thresholds
alert-as-code implementation
maintenance-window mechanism
automatic rollback integration
alert ownership metadata
```

These choices should follow actual team structure, deployment topology, service objectives, and observability tooling.

Significant choices should be captured through ADRs.

---

# Future Documentation

This document should be complemented by:

```text id="l8quwv"
docs/security/production-access.md
docs/security/data-retention.md
docs/security/incident-response.md

docs/runbooks/
```

Provider-specific alert definitions and notification routing should be documented only after the observability and incident-response tooling is selected.

---

# Summary

Alerting exists to direct attention toward conditions that require action.

The intended model is:

```text id="90h6wm"
signal
    ↓
impact
    ↓
action required
    ↓
owned alert
    ↓
response
```

Orion prefers:

```text id="fzgc17"
symptoms over speculative causes

actionable alerts over notification volume

SLO impact over arbitrary thresholds

service-level aggregation over per-instance paging

deduplication over alert storms

runbooks over improvisation

automatic recovery over unnecessary human intervention

clear ownership over broadcast escalation
```

A metric crossing a threshold does not automatically deserve a page.

A process restart does not automatically deserve a page.

A dependency warning does not automatically deserve a page.

An alert should exist because a person or automation needs to do something meaningful within a defined time.

If nobody can explain what action follows the alert, the alert should probably not exist.
