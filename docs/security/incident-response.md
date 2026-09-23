# Incident Response

## Purpose

This document defines the incident-response principles used by Orion.

Its goals are to ensure that incidents are:

- detected;
- classified consistently;
- contained quickly;
- investigated safely;
- recoverable;
- attributable;
- documented proportionally;
- resistant to evidence loss;
- followed by corrective action;
- understandable by humans and AI agents.

Incident response is the operational process used when normal system behavior, security guarantees, data integrity, or confidentiality may have been compromised.

This document is technology-agnostic.

Specific incident-management platforms, paging providers, forensic tools, communication channels, legal workflows, and external notification requirements will be selected later through explicit architectural decisions and applicable business or regulatory requirements.

This document complements:

- `docs/reliability/alerting.md`;
- `docs/reliability/error-reporting.md`;
- `docs/reliability/observability.md`;
- `docs/security/production-access.md`;
- `docs/security/secrets-management.md`;
- `docs/security/data-classification.md`;
- `docs/security/data-retention.md`.

---

## Core Principle

Incident response should optimize for:

```text
protect people and data
    ↓
contain impact
    ↓
preserve useful evidence
    ↓
restore safe operation
    ↓
understand root cause
    ↓
prevent recurrence
```

Speed matters.

So do correctness, evidence preservation, and avoiding secondary damage.

---

# What Is an Incident?

An incident is an event or condition requiring coordinated operational response because normal guarantees may be materially violated.

Potential incident classes include:

```text
reliability incident
security incident
data incident
```

These classes may overlap.

---

# Reliability Incident

A reliability incident involves degradation or loss of intended service behavior.

Examples include:

```text
major outage
high error rate
critical latency regression
queue backlog exceeding deadline
failed deployment affecting users
database unavailable
```

The primary concern is:

```text
availability
correctness
performance
recoverability
```

---

# Security Incident

A security incident involves actual or suspected compromise of a security property.

Examples include:

```text
credential exposure
unauthorized production access
privilege escalation
authentication bypass
malicious activity
secret leak
unexpected data access
```

The primary concerns are:

```text
confidentiality
integrity
authorization
identity
trust
```

---

# Data Incident

A data incident involves potential or confirmed loss, exposure, corruption, unauthorized modification, or improper retention of data.

Examples include:

```text
personal data exposed
records deleted incorrectly
data corruption
cross-tenant data leakage
restricted telemetry leak
retention workflow failure
```

A data incident may also be a security or reliability incident.

---

# Incident Types May Overlap

For example:

```text
database corruption
```

may be:

```text
reliability incident
+
data incident
```

A stolen production credential may be:

```text
security incident
+
possible data incident
```

Classification should describe reality rather than force one exclusive category.

---

# Event vs Incident

Not every error or alert is an incident.

Examples:

```text
one transient provider timeout
one failed job that retries successfully
one isolated crashed replica automatically replaced
```

may remain ordinary operational events.

An incident typically requires:

```text
meaningful impact
elevated risk
coordination
investigation
or deliberate mitigation
```

---

# Incident Trigger

An incident may begin from:

```text
alert
error report
support report
security signal
operator observation
provider notice
customer report
automated integrity check
```

Automated detection is desirable but not required.

---

# Incident Declaration

Once evidence indicates coordinated response is required, someone should explicitly declare the incident.

Declaration helps establish:

```text
ownership
severity
communication
timeline
decision tracking
```

Avoid leaving serious events in an ambiguous state where everyone assumes someone else is handling them.

---

# Incident Owner

Every active incident should have a clearly identifiable owner.

Depending on organizational maturity, roles may include:

```text
incident commander
technical lead
communications lead
security lead
scribe
```

Orion does not require all roles for every incident.

Small incidents may have one person performing several responsibilities.

---

# Incident Commander

For significant incidents, an incident commander coordinates:

```text
priorities
ownership
communication
decisions
escalation
```

The commander does not need to be the person performing every technical action.

---

# Technical Lead

A technical lead may coordinate:

```text
diagnosis
mitigation
recovery
verification
```

for the affected system.

---

# Security Lead

Security incidents may require a dedicated security owner for:

```text
containment
credential revocation
evidence handling
scope assessment
```

where team structure permits.

---

# Scribe

A scribe may maintain:

```text
timeline
major decisions
actions
observations
```

during larger incidents.

The purpose is durable evidence, not bureaucracy.

---

# Small-Team Operation

In a small team, one person may be:

```text
incident commander
technical responder
scribe
```

simultaneously.

The important requirement is that responsibilities remain understood.

---

# Severity

Incidents should use a small consistent severity model.

A conceptual model may include:

```text
SEV-1
SEV-2
SEV-3
SEV-4
```

The exact naming convention may change later.

Severity should reflect:

```text
impact
scope
urgency
data/security risk
recovery complexity
```

---

# Severity Is Not Technical Complexity

A technically complex bug with no user impact may be low severity.

A simple configuration error causing total outage may be critical.

Severity reflects impact and risk.

---

# SEV-1

A highest-severity incident may involve:

```text
widespread production outage
confirmed significant data exposure
active unauthorized privileged access
severe data corruption
critical security compromise
```

It requires immediate coordinated response.

---

# SEV-2

A high-severity incident may involve:

```text
major degradation
critical workflow unavailable
significant partial outage
suspected serious security compromise
```

requiring urgent response.

---

# SEV-3

A medium incident may involve:

```text
limited user impact
degraded non-critical capability
recoverable localized failure
```

requiring timely but not necessarily emergency response.

---

# SEV-4

A low-severity incident may involve:

```text
minor production defect
low-impact operational anomaly
contained non-critical failure
```

that still benefits from structured tracking.

---

# Security Severity

Security severity may require additional criteria such as:

```text
privilege level
credential type
data classification
attacker persistence
scope uncertainty
```

A low-volume event can still be critical if security impact is severe.

---

# Unknown Scope

When scope is uncertain, do not classify too low merely because confirmed impact is small.

Uncertainty itself may justify higher urgency until investigation narrows the risk.

---

# Classification Can Change

Incident severity may increase or decrease as evidence improves.

Changes should be explicit.

---

# Response Phases

A conceptual incident lifecycle is:

```text
detect
    ↓
triage
    ↓
contain
    ↓
eradicate / correct
    ↓
recover
    ↓
verify
    ↓
review
```

Real incidents may move between phases iteratively.

---

# Detection

Detection should establish:

```text
what signal appeared
when
which environment
which service or data
initial impact
```

Do not spend excessive time perfecting root cause before containing obvious active harm.

---

# Triage

Triage determines:

```text
is this real?
what is affected?
how urgent?
who should respond?
```

Early triage should be fast and evidence-driven.

---

# First Questions

Useful initial questions include:

```text
What changed?

What is failing?

Who or what is affected?

Is impact still increasing?

Is data or security at risk?

Can we safely reduce impact now?
```

---

# Impact Assessment

Impact should be described concretely.

Examples:

```text
checkout unavailable
12% of API requests failing
one tenant exposed to another tenant's records
signing key possibly disclosed
```

Avoid vague labels such as:

```text
system broken
```

when more precise information exists.

---

# Scope

Scope may include:

```text
service
operation
tenant
region
release
data category
credential
time window
```

Scope should be refined continuously during investigation.

---

# Timeline

Significant incidents should maintain a timeline.

Useful entries include:

```text
first known impact
first alert
incident declared
mitigation started
access revoked
deployment rolled back
recovery confirmed
```

The timeline supports later analysis.

---

# Time Source

Incident timestamps should use one consistent absolute time representation.

Avoid ambiguous:

```text
a few minutes ago
later
around lunch
```

in durable incident records.

---

# Containment

Containment reduces ongoing harm.

Examples include:

```text
disable vulnerable endpoint
revoke credential
remove instance from traffic
pause worker
disable feature
block malicious actor
stop data export
```

Containment may happen before full root-cause understanding.

---

# Containment Should Be Scoped

Prefer:

```text
disable affected capability
```

over:

```text
shut down entire platform
```

when narrower containment is safe.

However, broader containment is justified when scope is uncertain and risk is high.

---

# Security Containment

Possible security containment actions include:

```text
revoke sessions
rotate exposed secrets
disable compromised account
remove malicious access
block affected credential
restrict production access
```

---

# Reliability Containment

Possible reliability containment actions include:

```text
rollback release
disable feature
reduce traffic
stop failing job producer
scale capacity
route around unhealthy dependency
```

---

# Data Containment

Possible data-incident containment actions include:

```text
stop writes
disable export
pause deletion job
isolate corrupted dataset
disable affected tenant workflow
```

---

# Containment vs Evidence

Containment should not unnecessarily destroy evidence.

For example:

```text
terminate compromised instance
```

may be necessary.

But before doing so, if safe and practical, responders may preserve relevant:

```text
logs
metadata
process state
network evidence
```

according to incident needs.

---

# Safety First

Evidence preservation must not delay urgent containment when active harm continues.

The priority is:

```text
protect systems and data first
```

then preserve as much evidence as safely possible.

---

# Evidence

Incident evidence may include:

```text
logs
traces
error reports
audit records
deployment history
configuration changes
database records
provider events
access records
```

---

# Evidence Integrity

Evidence used for security or high-impact investigations should be preserved without unnecessary modification.

Where practical, record:

```text
source
time collected
collector
relevant scope
```

for important forensic artifacts.

---

# Evidence Copies

Copies of production evidence remain production data.

They require:

```text
access control
classification
retention
secure storage
```

---

# Do Not Paste Raw Evidence Everywhere

Avoid copying sensitive incident evidence into:

```text
chat
issue tracker
pull request
email
document
```

when a safe reference to authorized telemetry is sufficient.

---

# Forensic Data

Forensic artifacts may include:

```text
disk image
memory dump
network capture
database export
```

These can contain broad sensitive data.

They require exceptional handling.

---

# Memory Dumps

Memory dumps may contain:

```text
tokens
credentials
user data
encryption material
```

Treat them as highly sensitive.

---

# Network Captures

Packet captures may contain sensitive application data.

Capture should be:

```text
scoped
authorized
time-limited
protected
```

---

# Credential Exposure

If a credential may have been exposed, assume compromise according to risk until evidence proves otherwise.

Do not rely solely on:

```text
nobody appears to have used it
```

when rotation is feasible.

---

# Secret Rotation

Compromised or potentially exposed secrets should be:

```text
revoked
rotated
replaced
```

according to:

```text
docs/security/secrets-management.md
```

---

# Rotation Order

Credential rotation may require sequencing.

Conceptually:

```text
introduce new credential
    ↓
update consumers
    ↓
verify
    ↓
revoke old credential
```

or immediate revocation first if active abuse requires it.

The sequence depends on risk.

---

# Signing Keys

Signing-key compromise may require support for:

```text
new key
old-key revocation
token/session invalidation
verification compatibility window
```

depending on system design.

This can be a high-impact incident.

---

# Session Revocation

Credential compromise may require revoking:

```text
user sessions
admin sessions
service tokens
refresh tokens
```

Scope should follow the affected identity.

---

# Access Review During Incident

Security incidents should review:

```text
who had access
what was accessed
whether permissions changed
whether persistence remains
```

where relevant.

---

# Eradication

Eradication removes the underlying cause or malicious persistence.

Examples include:

```text
remove vulnerable code
delete malicious account
remove unauthorized IAM grant
patch compromised dependency
remove injected configuration
```

Containment and eradication are different.

---

# Temporary Mitigation

A temporary mitigation may reduce impact without fixing root cause.

Examples:

```text
disable feature
increase capacity
block one input pattern
```

Such mitigations should not be mistaken for permanent resolution.

---

# Permanent Fix

The permanent correction should address the underlying defect.

Examples:

```text
fix race condition
correct authorization rule
replace leaked credential architecture
fix deletion workflow
patch dependency
```

---

# Recovery

Recovery restores normal safe operation.

Recovery should happen only after responders have reasonable confidence that:

```text
active harm is contained
system can operate safely
critical invariants hold
```

---

# Recovery May Be Gradual

Recovery may use:

```text
canary
partial traffic
progressive re-enable
controlled queue resume
```

rather than full immediate restoration.

---

# Recovery Verification

Recovery should be verified using relevant evidence.

Examples include:

```text
error rate normal
latency normal
queue draining
readiness healthy
correct permissions restored
data integrity validated
```

---

# Recovery Is Not Alert Resolution Alone

An alert returning to green does not prove the system is fully recovered.

Verify the actual impacted behavior.

---

# Data Integrity Verification

Data incidents may require:

```text
consistency checks
record counts
reconciliation
repair verification
```

before closure.

---

# Security Verification

Security recovery may require confirming:

```text
compromised credentials revoked
unauthorized access removed
persistence eliminated
new controls effective
```

---

# Reopening Traffic

When traffic was disabled, re-enable it only after:

```text
safe state confirmed
dependencies available
monitoring active
rollback/containment options ready
```

---

# Queue Recovery

Restarting queued work should consider:

```text
duplicates
stale messages
idempotency
current authorization
provider side effects
```

Do not blindly release a large backlog after incident mitigation.

---

# Backlog Recovery

A backlog may require:

```text
rate limiting
priority handling
temporary capacity
batch processing
```

to avoid causing a second incident during recovery.

---

# Communication

Incident communication should match impact and audience.

Potential audiences include:

```text
responders
engineering
support
leadership
customers
partners
regulators
```

Not every incident requires communication to every audience.

---

# Internal Communication

Internal updates should communicate:

```text
current impact
current severity
what changed
what responders are doing
next major decision
```

without unnecessary speculation.

---

# Communicate Facts vs Hypotheses

Clearly distinguish:

```text
confirmed fact
```

from:

```text
working hypothesis
```

during incident response.

Premature certainty can misdirect response.

---

# External Communication

External communication should be:

```text
accurate
timely
appropriately scoped
non-speculative
```

when required.

This document does not define legal disclosure obligations.

---

# Customer Communication

When customers are affected, communication may include:

```text
what functionality is affected
when impact began
current mitigation status
what users need to do
```

where appropriate.

Avoid exposing unnecessary security details during an active incident.

---

# Security Disclosure

Security incidents may require careful disclosure timing to avoid:

```text
helping active attackers
sharing unverified scope
compromising investigation
```

Communication should coordinate with appropriate security/legal stakeholders when those functions exist.

---

# Regulatory Notification

Some data or security incidents may trigger legal notification requirements.

Those requirements depend on:

```text
jurisdiction
data type
scope
organization
contract
```

and must be evaluated separately.

This document does not invent notification deadlines.

---

# Support Coordination

Support teams should receive enough safe information to respond consistently to affected users.

Do not expose internal secrets or forensic details merely to improve support context.

---

# Single Source of Incident Status

Significant incidents should have one authoritative status location.

This may eventually be an incident-management system.

Avoid conflicting status across multiple chat threads.

---

# Status Updates

For significant incidents, updates should occur when:

```text
impact changes
severity changes
major mitigation occurs
scope changes
recovery begins
incident resolves
```

rather than on arbitrary noisy intervals.

---

# Decision Log

Important decisions may be recorded during an incident.

Examples:

```text
rollback instead of forward fix
disable feature globally
rotate all integration credentials
restore from backup
```

The record should capture enough rationale for later review.

---

# Production Changes During Incident

Emergency production changes should follow:

```text
docs/security/production-access.md
```

even when normal review timing is shortened.

Identity and auditability should remain.

---

# Incident Access

Responders may require temporary elevated production access.

Use the minimum additional privilege required.

Incidents do not justify universal production admin rights.

---

# Break-Glass

Break-glass may be appropriate if normal access systems prevent urgent response.

Its use should follow:

```text
docs/security/production-access.md
```

and be reviewed afterward.

---

# Change Freeze

Some incidents may justify temporarily limiting unrelated production changes.

This reduces confounding variables during investigation.

Do not apply a blanket freeze when it prevents necessary mitigation.

---

# Deployment Correlation

Early incident investigation should inspect:

```text
recent application deployments
database migrations
configuration changes
feature-flag changes
infrastructure changes
provider changes
```

because temporal correlation can narrow hypotheses quickly.

---

# Correlation Is Not Proof

A deployment immediately preceding an incident is a strong clue, not automatic proof.

Avoid rolling back blindly when rollback itself is dangerous or evidence indicates another cause.

---

# Rollback

Rollback is appropriate when:

```text
recent change likely caused impact
rollback is safe
old version remains compatible
```

according to versioning and migration policy.

---

# Forward Fix

A forward fix may be safer when:

```text
database changes are irreversible
old release is no longer compatible
rollback would lose data
```

The response plan should understand this before acting.

---

# Feature Flags

A feature flag may provide rapid containment.

Flags affecting critical behavior should have:

```text
safe defaults
clear ownership
auditability
```

where practical.

---

# Dependency Incidents

When an external dependency fails, Orion should distinguish:

```text
provider problem
```

from:

```text
Orion integration defect
```

Response may include:

```text
retry adjustment
fallback
temporary disable
provider escalation
```

---

# Provider Status

Provider status pages can be useful supporting evidence.

Observed Orion behavior remains more important than provider status alone.

---

# Third-Party Security Incident

A provider security incident may require:

```text
credential rotation
data exposure analysis
integration disablement
provider communication
```

depending on affected data and access.

---

# Incident and Backups

Data-loss or corruption incidents may require backup restoration.

Before restore, responders should understand:

```text
recovery point
data lost after backup
retention/deletion effects
current schema compatibility
```

---

# Restore Is Destructive

A production restore can overwrite current state.

It requires deliberate authorization and validation.

---

# Point-in-Time Recovery

If supported, point-in-time recovery may reduce data loss.

It still requires:

```text
scope
verification
reconciliation
```

after restoration.

---

# Data Repair vs Restore

Not every corruption incident should restore the entire database.

A targeted repair may be safer.

Choose the smallest recovery mechanism consistent with correctness.

---

# Incident Closure

An incident should not close merely because:

```text
alerts stopped
```

Closure should confirm:

```text
impact ended
system stable
critical recovery complete
temporary access handled
temporary mitigations tracked
```

---

# Closure Criteria

Potential closure criteria include:

```text
service objectives recovered
security threat contained
data integrity verified
temporary emergency access revoked
required communication completed
```

---

# Monitoring Period

High-impact incidents may require an observation period after recovery before closure.

This helps detect relapse.

---

# Temporary Mitigation Tracking

If incident closure occurs before permanent correction, the temporary mitigation should have explicit follow-up ownership.

---

# Post-Incident Review

Significant incidents should receive a post-incident review.

The goal is:

```text
learning
system improvement
prevention
```

not individual blame.

---

# Review Scope

A review may examine:

```text
impact
timeline
detection
root cause
contributing factors
response
recovery
what worked
what failed
corrective actions
```

---

# Root Cause

Root cause should describe why the system allowed the incident.

Avoid stopping at:

```text
developer made mistake
operator ran wrong command
```

Ask why controls did not prevent or contain the mistake.

---

# Contributing Factors

Most incidents involve several contributors.

Examples:

```text
missing test
weak alert
unsafe default
unclear ownership
deployment coupling
insufficient authorization
```

These may be more useful than forcing one root cause.

---

# Five Whys

Techniques such as repeated "why" analysis may help.

They should not be used mechanically.

The goal is identifying actionable systemic causes.

---

# Human Error

Human actions should be analyzed in context.

Ask:

```text
Why was the unsafe action possible?

Why was it easy to make?

Why was detection delayed?

Why was recovery difficult?
```

System design should reduce reliance on perfect human behavior.

---

# What Went Well

Post-incident reviews should record controls that worked.

Examples:

```text
rollback succeeded
alert fired quickly
secret rotation was easy
runbook was accurate
```

This helps preserve effective practices.

---

# What Went Poorly

Record friction such as:

```text
missing telemetry
no runbook
unclear access
alert noise
slow recovery
```

without hiding operational weaknesses.

---

# Where We Got Lucky

It may be valuable to record situations where impact stayed small only by chance.

Examples:

```text
traffic happened to be low
attacker did not use exposed credential
corruption affected unused records
```

Luck should not be mistaken for control effectiveness.

---

# Corrective Actions

A post-incident review should produce concrete actions where needed.

Potential actions include:

```text
bug fix
regression test
alert improvement
runbook
authorization change
schema constraint
tooling safeguard
secret rotation automation
```

---

# Action Ownership

Every corrective action should have an identifiable owner.

Unowned action items tend not to happen.

---

# Action Priority

Corrective actions should be prioritized by:

```text
risk reduction
recurrence likelihood
impact
effort
```

Do not create dozens of low-value actions merely to make the review appear comprehensive.

---

# Preventive Control

Prefer controls that prevent recurrence mechanically.

Examples:

```text
constraint
type system
authorization rule
CI check
safe default
automated rotation
```

over:

```text
remember to be careful
```

---

# Detection Control

When prevention is impractical, improve detection.

Examples:

```text
metric
alert
audit event
integrity check
```

---

# Recovery Control

Recovery can also be improved.

Examples:

```text
tested backup restore
idempotent repair tool
runbook
automated rollback
```

---

# Regression Tests

Confirmed software defects should receive regression tests whenever practical.

The test should fail under the defective behavior and pass after correction.

---

# Incident Documentation

Important incident records should be durable enough for future learning.

The record should not become a copy of every raw log or chat message.

Summarize relevant evidence and link to authoritative systems where possible.

---

# Repository vs Incident System

Operational incident records may live in an incident-management system.

Durable architectural lessons should still update the repository when appropriate.

Examples include:

```text
policy
runbook
ADR
test
tooling
```

---

# ADRs After Incidents

An incident may reveal the need for an architectural decision.

For example:

```text
introduce transactional outbox
change production access model
adopt multi-region database
```

Such decisions should use ADRs rather than being hidden only in incident notes.

---

# Runbooks After Incidents

A recurring failure should often produce or improve a runbook.

A runbook is appropriate when the future response is known and repeatable.

---

# Alert Changes After Incidents

An incident may reveal:

```text
alert missing
alert too late
alert too noisy
```

Changes should improve detection quality, not simply increase notification volume.

---

# Observability Changes After Incidents

Missing diagnostic evidence is an observability defect.

Add the smallest useful signal necessary.

Do not respond by logging entire request bodies or enabling unsafe telemetry globally.

---

# Security Changes After Incidents

Security incidents may require improvements to:

```text
permissions
secret lifecycle
session handling
production access
redaction
```

depending on cause.

---

# Data-Retention Changes After Incidents

A telemetry or storage incident may reveal unnecessary retention.

Reducing retained data can reduce future blast radius.

---

# Incident Metrics

Organizations may eventually track:

```text
time to detect
time to contain
time to recover
incident frequency
```

These can help improve systems.

They should not become simplistic performance metrics for individuals.

---

# MTTD

Mean Time to Detect may help evaluate detection capability.

It can hide distribution details and should not be treated as the only measure.

---

# MTTR

"MTTR" can mean several different things:

```text
time to respond
time to repair
time to recover
time to resolve
```

If used, the meaning must be explicit.

---

# Incident Count

Incident count alone is a poor reliability measure.

One severe incident can matter more than many small ones.

---

# Blameless Does Not Mean Accountability-Free

Incident review should avoid personal blame.

It should still identify:

```text
ownership
missed controls
unsafe decisions
required corrections
```

clearly.

---

# Security Evidence Retention

Incident evidence may require temporary extended retention.

Such exceptions should follow:

```text
docs/security/data-retention.md
```

and remain scoped.

---

# Legal Hold

Some incident evidence may become subject to legal hold.

This is a specialized retention exception and should be explicitly authorized.

---

# Deleting Incident Evidence

Incident data should eventually follow retention policy.

A serious incident is not automatic justification for keeping all raw evidence forever.

---

# Privacy During Incident Response

Incident urgency does not suspend privacy principles.

Responders should still minimize:

```text
personal data
restricted data
unnecessary exports
```

during investigation.

---

# Need-to-Know

Sensitive incident information should be shared only with people who need it for response or required communication.

---

# Incident Channels

Incident chat channels may retain messages for long periods.

Do not paste:

```text
tokens
credentials
private keys
full user records
```

into them.

---

# Screenshots

Incident screenshots should be minimized and redacted.

Prefer structured evidence when possible.

---

# AI-Assisted Incident Response

AI agents may assist with:

```text
timeline synthesis
telemetry correlation
hypothesis generation
runbook lookup
code analysis
```

when authorized.

They do not automatically receive additional production authority because an incident exists.

---

# AI Access During Incident

AI production access should follow:

```text
docs/security/production-access.md
```

The incident may justify a temporary delegated capability.

It does not justify unrestricted access.

---

# AI and Evidence

An AI agent should prefer safe:

```text
logs
metrics
traces
error metadata
```

over broad raw data exports.

---

# AI and Hypotheses

AI-generated hypotheses must be treated as hypotheses until supported by evidence.

Do not execute destructive mitigation solely because an AI explanation sounds plausible.

---

# AI and Containment

An AI agent may recommend containment.

High-impact actions should require the same authorization and verification as human-proposed actions.

---

# AI and Secrets

Do not expose raw production secrets to AI merely to accelerate incident response.

Prefer delegated or redacted mechanisms.

---

# AI and Incident Summaries

AI-generated summaries should distinguish:

```text
confirmed fact
inference
open question
```

clearly.

---

# AI and Corrective Actions

AI agents should prefer durable mechanical fixes such as:

```text
test
constraint
CI rule
safer permission
bounded operational tool
```

over reminders.

---

# Incident Runbooks

Common incident types should eventually have runbooks.

Potential examples include:

```text
database unavailable
credential exposure
failed production migration
queue backlog
data corruption
provider outage
```

Only create runbooks for real operational patterns.

---

# Runbook Escalation

A runbook should identify when ordinary mitigation is insufficient and escalation is required.

---

# Runbook Safety

Runbooks must not contain raw secrets.

High-risk commands should specify:

```text
preconditions
scope
verification
recovery
```

---

# Incident Automation

Automation may assist with:

```text
collecting safe diagnostics
opening incident channel
adding deployment context
revoking known credential
```

where safe and tested.

---

# Automated Containment

Automated containment is high impact.

It should require strong confidence that the signal is accurate.

Examples might include:

```text
disable compromised key
isolate malicious workload
```

only when false positives are acceptably controlled.

---

# Automation Must Be Reversible Where Possible

Automated incident actions should prefer reversible containment.

---

# Self-Healing

Automatic reliability recovery may prevent an operational event from becoming an incident.

Repeated self-healing may itself indicate underlying instability and should become observable.

---

# Incident Detection Gaps

An incident discovered by a customer rather than telemetry should prompt examination of detection gaps.

The goal is not necessarily to alert on every possible defect, but to detect important impact sooner.

---

# Incident Response Testing

Incident response should eventually be exercised.

Potential mechanisms include:

```text
tabletop exercise
backup restore test
credential rotation drill
failure injection
security simulation
```

according to system maturity.

---

# Tabletop Exercises

A tabletop exercise can test:

```text
roles
communication
decision process
runbooks
access
```

without causing real production failure.

---

# Disaster Recovery Exercises

Recovery procedures that are never tested should not be assumed reliable.

Examples include:

```text
restore database
fail over region
rotate signing key
```

where those capabilities exist.

---

# Security Exercises

Security response may benefit from testing:

```text
credential compromise
production access misuse
data exposure
```

using synthetic scenarios.

---

# Game Days

Controlled reliability exercises may expose weaknesses in:

```text
alerting
observability
recovery
capacity
```

Use only when the system is mature enough to conduct them safely.

---

# Incident Response Checklist

At incident declaration, answer:

1. What happened?
2. When did impact begin?
3. Which environment is affected?
4. Which systems or data are involved?
5. What is the current severity?
6. Is impact still increasing?
7. Is security or data integrity at risk?
8. Who owns the response?
9. What immediate containment is safe?
10. What evidence must be preserved?
11. Which recent changes may be relevant?
12. Who needs to be informed?

---

# Security Incident Checklist

For a suspected security incident, answer:

1. Which identity, credential, or boundary may be compromised?
2. Is unauthorized access ongoing?
3. Which privileges are involved?
4. Which data classification may be affected?
5. Which sessions or credentials should be revoked?
6. Is attacker persistence possible?
7. What access evidence exists?
8. What containment can occur immediately?
9. What evidence must be preserved?
10. Are external notifications potentially required?
11. Which secrets require rotation?
12. What verifies that access has been removed?

---

# Data Incident Checklist

For a data incident, answer:

1. Which data is affected?
2. Is the problem exposure, corruption, deletion, or unauthorized modification?
3. Which classifications are involved?
4. Which users or tenants may be affected?
5. What is the time window?
6. Is the issue still occurring?
7. Which derived copies may also be affected?
8. Can writes safely continue?
9. Is backup or reconciliation required?
10. How will integrity be verified?
11. Can deleted or exposed data be contained?
12. Are notification obligations potentially involved?

---

# Reliability Incident Checklist

For a reliability incident, answer:

1. Which user-facing capability is degraded?
2. What is the current failure rate or latency?
3. Which dependencies are unhealthy?
4. Which release is active?
5. Did a recent deployment or migration occur?
6. Can traffic be reduced or routed?
7. Can the change be rolled back safely?
8. Is there a backlog?
9. What is the recovery path?
10. How will recovery be verified?

---

# Containment Checklist

Before applying containment, answer:

1. What active harm does this stop?
2. What is the affected scope?
3. Can containment be narrower?
4. Could containment cause data loss?
5. Could it destroy important evidence?
6. Is the action reversible?
7. Which authorization is required?
8. How will success be verified?
9. What follow-up recovery is required?

---

# Credential Compromise Checklist

Before responding to suspected credential compromise, answer:

1. Which credential is affected?
2. What capability does it grant?
3. Where is it used?
4. Can it be revoked immediately?
5. Would immediate revocation cause critical outage?
6. Is replacement already available?
7. Which systems require redeployment or reconfiguration?
8. Which sessions/tokens depend on it?
9. Is there evidence of use?
10. Which audit data should be preserved?
11. How will rotation completion be verified?
12. How will recurrence be prevented?

---

# Recovery Checklist

Before declaring recovery, answer:

1. Has active harm stopped?
2. Is the service functioning correctly?
3. Are critical dependencies healthy?
4. Is data integrity verified?
5. Are compromised credentials revoked?
6. Are temporary emergency privileges removed or scheduled to expire?
7. Are backlogs under control?
8. Are alerts and telemetry normal?
9. Are customers still experiencing impact?
10. Is additional monitoring required?

---

# Incident Closure Checklist

Before closing an incident, answer:

1. Has impact ended?
2. Is recovery verified?
3. Is the incident severity final?
4. Are temporary mitigations documented?
5. Are emergency credentials/access revoked?
6. Are required communications complete?
7. Is evidence stored appropriately?
8. Does the incident require a post-incident review?
9. Are corrective actions owned?
10. Are any follow-up runbooks or tests required?

---

# Post-Incident Review Checklist

A post-incident review should answer:

1. What was the impact?
2. When did impact begin and end?
3. How was the incident detected?
4. What was the technical cause?
5. What contributing factors existed?
6. Why did existing controls not prevent it?
7. What made detection faster or slower?
8. What made recovery faster or slower?
9. What went well?
10. What went poorly?
11. Where did the system get lucky?
12. Which corrective actions provide the highest risk reduction?
13. Which regression tests are required?
14. Which runbooks or alerts should change?
15. Which architectural policies should change?

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## Do Not Declare Incident Until Root Cause Is Known

Avoid.

Containment may be needed first.

---

## Every Alert Becomes an Incident

Avoid.

---

## Incident With No Owner

Prohibited.

---

## Severity Based Only on Error Count

Avoid.

---

## Assume Low Confirmed Scope Means Low Risk

Avoid when scope remains uncertain.

---

## Destroy Evidence Before Considering Preservation

Avoid when preservation is safe.

---

## Preserve Evidence While Active Harm Continues

Avoid.

Containment takes priority.

---

## Leave Potentially Exposed Credential Active Because Abuse Is Not Confirmed

Avoid when safe rotation is practical.

---

## Paste Raw Secrets Into Incident Chat

Prohibited.

---

## Grant Everyone Production Admin During Incident

Avoid.

---

## Roll Back Without Checking Compatibility

Avoid.

---

## Restore Entire Database for Small Repairable Corruption

Avoid.

---

## Declare Recovery Because Alert Cleared

Avoid.

---

## Close Incident With Permanent Fix Undefined

Avoid for significant unresolved root causes.

---

## Root Cause Is "Human Error"

Avoid as the final analysis.

---

## Postmortem Exists Only to Assign Blame

Prohibited.

---

## Add Logging Everywhere After Incident

Avoid.

Add targeted safe evidence.

---

## Create Dozens of Low-Value Action Items

Avoid.

---

## Permanent Retention of Raw Incident Evidence by Default

Avoid.

---

## AI Hypothesis Treated as Confirmed Cause

Prohibited.

---

## Break-Glass Used Because Normal Workflow Is Slower

Prohibited.

---

# Initial Incident Response Policy

Until stack-specific incident tooling and organization-specific procedures exist, Orion adopts the following requirements:

1. Reliability, security, and data incidents are distinct but may overlap.
2. Significant incidents must have explicit ownership.
3. Severity should reflect impact, risk, scope, and urgency rather than technical complexity alone.
4. Incident response should prioritize containment of active harm before perfect root-cause understanding.
5. Evidence should be preserved when practical without delaying necessary containment.
6. Potentially compromised credentials should be revoked or rotated according to risk.
7. Emergency production access must remain attributable and auditable.
8. Incident communication should distinguish confirmed facts from hypotheses.
9. Recovery must be verified through actual service, security, or data-integrity evidence.
10. Alert resolution alone is not sufficient proof of recovery.
11. Significant incidents should maintain a usable timeline.
12. Temporary mitigations must not silently become permanent architecture.
13. Significant confirmed software defects should receive regression tests whenever practical.
14. Post-incident review should focus on systemic causes and corrective controls rather than individual blame.
15. Corrective actions should prefer mechanical prevention, detection, or recovery improvements over reminders.
16. Incident evidence must follow data-classification, access, and retention policies.
17. Incident urgency does not suspend privacy, authorization, or least-privilege requirements.
18. AI-assisted incident response must distinguish evidence from inference and must not automatically gain additional production authority.
19. Common recurring incidents should eventually receive tested runbooks.
20. Incident severity, ownership, timelines, follow-up actions, and evidence links should become mechanically structured where practical.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text
incident-management platform
severity nomenclature
paging/escalation policy
incident roles
status communication tooling
customer status page
forensic storage
security notification workflow
post-incident review template
incident retention
tabletop exercise cadence
automated containment
```

These choices should follow actual organizational size, product criticality, jurisdiction, infrastructure, and incident-management tooling.

Significant choices should be captured through ADRs where architectural.

---

# Future Documentation

This document should be complemented by:

```text
docs/adr/
docs/runbooks/
```

Concrete operational procedures should live in runbooks rather than expanding this policy document into provider-specific instructions.

---

# Summary

Incident response exists to reduce harm, restore safe operation, and improve the system.

The intended model is:

```text
detect
    ↓
classify
    ↓
contain
    ↓
preserve useful evidence
    ↓
correct
    ↓
recover
    ↓
verify
    ↓
learn
    ↓
prevent recurrence
```

Orion prefers:

```text
explicit ownership over ambiguous responsibility

containment over waiting for perfect certainty

evidence over speculation

least privilege over emergency overexposure

safe recovery over fast but unverified recovery

mechanical corrective controls over reminders

durable learning over incident amnesia

systemic analysis over individual blame
```

A reliability incident asks whether the system is serving correctly.

A security incident asks whether trust boundaries were violated.

A data incident asks whether information was exposed, corrupted, lost, or retained incorrectly.

One event may be all three.

The incident is not finished when the alert stops.

It is finished when impact is contained, safe operation is restored, the relevant evidence is understood, and the system has a clear path to becoming harder to break in the same way again.
