# Runbooks

## Purpose

This directory contains operational runbooks for Orion.

Runbooks define repeatable procedures for diagnosing, mitigating, recovering from, or safely operating known production conditions.

Their goals are to make operational response:

- faster;
- safer;
- repeatable;
- less dependent on individual memory;
- understandable by humans and AI agents;
- consistent with production-access and incident-response policy;
- explicit about preconditions and risk;
- verifiable after execution.

A runbook should help an operator answer:

```text id="tq3w4a"
What condition am I responding to?

What should I inspect first?

Which action is safe?

Which action is dangerous?

How do I verify recovery?

When should I stop and escalate?
```

A runbook is an operational procedure.

It is not merely descriptive documentation.

---

# Core Principle

A useful runbook should be executable by an authorized operator under pressure.

The intended model is:

```text id="o17jgl"
known operational condition
    ↓
identify scope
    ↓
verify preconditions
    ↓
diagnose
    ↓
mitigate or recover
    ↓
verify
    ↓
escalate if necessary
```

A runbook that only explains how a system works is not sufficient.

---

# What Is a Runbook?

A runbook is a documented sequence for handling a known operational task or incident pattern.

Examples may include:

```text id="pn5xre"
database unavailable

failed production migration

queue backlog

credential exposure

provider outage

stuck background jobs

backup restore

manual data repair

replay failed messages
```

The exact set should grow from real operational needs.

---

# When to Create a Runbook

A runbook is appropriate when:

```text id="mihepm"
the condition may happen again

response requires several non-obvious steps

the operation carries production risk

rapid response matters

incorrect execution can worsen impact

knowledge should not depend on one person
```

---

# Do Not Create Speculative Runbooks

Do not create runbooks for hypothetical systems that do not exist yet.

A runbook should correspond to:

```text id="7ewm0n"
real runtime
real dependency
real operational workflow
real incident pattern
```

Orion should not accumulate fictional procedures.

---

# Runbooks vs Architecture Documentation

Architecture documentation explains:

```text id="4z7ra2"
how the system is designed
```

A runbook explains:

```text id="y49f30"
what an operator should do in a specific operational situation
```

These are different artifacts.

---

# Runbooks vs ADRs

ADRs explain:

```text id="8ikg69"
why an architectural decision was made
```

Runbooks explain:

```text id="if91gb"
how to operate the resulting system safely
```

---

# Runbooks vs Incident Records

An incident record explains:

```text id="u3dah1"
what happened in one specific incident
```

A runbook explains:

```text id="1h3oic"
what to do when this kind of condition happens
```

A recurring incident should often improve a runbook.

---

# Runbooks vs Troubleshooting Notes

Troubleshooting notes may contain ideas.

A runbook should contain:

```text id="y1c4yc"
ordered actions
decision points
safety constraints
verification
escalation
```

It should be more operationally precise.

---

# Runbooks vs Scripts

A script performs automation.

A runbook may instruct an operator to use a script.

The script should encapsulate repeatable mechanics where appropriate.

The runbook should explain:

```text id="txrihb"
when to use it
required access
expected outcome
verification
failure handling
```

---

# Runbook Ownership

Every runbook should have an identifiable owner.

Ownership may follow:

```text id="m7tp3r"
service
application
domain
infrastructure capability
```

The owner is responsible for keeping the procedure current.

---

# Owner Responsibilities

The owner should ensure that:

```text id="01nl5q"
commands remain valid

links remain valid

required permissions are accurate

safety assumptions remain true

recovery steps still match production
```

---

# Shared Runbooks

A runbook may span several systems.

If so, ownership should still be explicit.

Avoid:

```text id="qmf90g"
everyone owns this
```

which usually means nobody maintains it.

---

# Runbook Status

Runbooks may eventually use simple lifecycle metadata such as:

```text id="12ppl7"
active
deprecated
```

Additional lifecycle complexity should be introduced only if needed.

---

# Active Runbook

An active runbook represents a procedure operators may use.

It must reflect current production architecture.

---

# Deprecated Runbook

A deprecated runbook should not be used for normal operations.

It should identify:

```text id="qv35wl"
replacement
reason
```

where relevant.

Obsolete procedures should eventually be removed if they provide no historical value.

---

# Runbooks Describe Current Operation

Unlike ADRs, runbooks are current-state operational documents.

When production changes, the runbook should be updated.

Do not preserve obsolete operational steps merely as historical evidence.

Git already preserves their history.

---

# File Naming

Use descriptive English filenames.

Recommended form:

```text id="j34fue"
<condition-or-operation>.md
```

Examples:

```text id="kkm12c"
database-unavailable.md
failed-migration.md
rotate-compromised-credential.md
queue-backlog.md
```

Avoid generic names such as:

```text id="0g0fg9"
operations.md
troubleshooting.md
misc.md
```

---

# Runbook Scope

A runbook should handle one coherent operational condition or procedure.

Good:

```text id="2hf6vr"
restore-primary-database.md
```

Less useful:

```text id="kxx58y"
all-production-problems.md
```

Large unrelated procedures should be split.

---

# Runbook Structure

Runbooks should follow:

```text id="gqipn7"
docs/runbooks/template.md
```

The template should remain practical.

Required sections should justify their operational value.

---

# Minimum Runbook Content

A runbook should normally define:

```text id="hkl8dh"
purpose

trigger / symptoms

impact

preconditions

required access

diagnosis

mitigation or procedure

verification

rollback or recovery

escalation
```

Not every procedure requires every possible subsection.

---

# Purpose

The purpose should state what operational problem or task the runbook addresses.

Example:

```text id="eozg2i"
Use this runbook when the primary application database is unavailable or rejecting normal runtime connections.
```

Keep it specific.

---

# Trigger

Define when the runbook applies.

Potential triggers include:

```text id="f8k6rh"
alert name

known error code

health-check condition

provider event

specific operational request
```

---

# Symptoms

List observable symptoms that support using the runbook.

Examples:

```text id="fxez9a"
readiness failures

database connection errors

request error rate increase
```

Symptoms should help avoid applying the wrong runbook.

---

# Non-Applicability

Where useful, state when not to use the runbook.

Example:

```text id="2rzbc1"
Do not use this procedure for expected optimistic concurrency conflicts.
```

This can prevent dangerous misclassification.

---

# Impact

Describe the likely operational impact.

Examples:

```text id="5h9jnf"
writes unavailable

all API requests failing

background jobs delayed

authentication unavailable
```

This helps determine urgency.

---

# Preconditions

Before any production action, state required preconditions.

Potential examples:

```text id="nvyet5"
incident declared

correct environment confirmed

backup available

maintenance window active

specific service stopped
```

---

# Preconditions Must Be Verifiable

Avoid vague conditions such as:

```text id="z7prf0"
make sure everything is okay
```

Prefer observable checks.

---

# Required Access

Every runbook should identify required access.

Examples:

```text id="t17dke"
production observability read

database read-only

database operator

deployment operator

secret administrator
```

This should align with:

```text id="tve5s7"
docs/security/production-access.md
```

---

# Least Privilege in Runbooks

Do not require:

```text id="pjcbq3"
full administrator
```

when:

```text id="6f1e8o"
read-only database
```

is sufficient.

Runbooks should reinforce least privilege.

---

# Environment Confirmation

A production runbook should make environment confirmation explicit before risky operations.

For example:

```text id="m7cylb"
Confirm target environment: production.
```

Operational tooling should ideally make this difficult to confuse.

---

# Safety Warnings

High-risk steps should be visibly marked.

Examples include:

```text id="1gewav"
destructive operation

credential revocation

traffic disablement

database mutation

queue purge

restore operation
```

Warnings should explain the concrete risk.

---

# Warning Quality

Bad:

```text id="x76q33"
Be careful.
```

Good:

```text id="2ao68a"
This operation permanently deletes queued messages and cannot be reversed. Confirm that all messages are known duplicates before continuing.
```

---

# Diagnostic Sequence

Diagnosis should proceed from low-risk, high-signal evidence toward more invasive inspection.

Preferred progression:

```text id="9i3j1x"
metrics
    ↓
alerts
    ↓
logs
    ↓
traces
    ↓
error reports
    ↓
safe read-only production inspection
    ↓
privileged interactive diagnostics
```

when appropriate.

---

# Avoid Premature Mutation

Do not begin by changing production state while the failure is still poorly understood unless active harm requires immediate containment.

Prefer:

```text id="dhevvh"
observe
understand
contain
modify
```

where safe.

---

# Diagnostic Commands

Commands should be:

```text id="xo2xwl"
specific
bounded
copyable
current
```

when actual tooling exists.

Do not invent provider-specific commands before the provider is selected.

---

# Placeholder Commands

Foundation-phase runbooks should not contain fake commands such as:

```text id="giomdk"
kubectl ...
psql ...
aws ...
```

until those technologies actually exist in Orion.

---

# Command Safety

A command included in a runbook should make its production impact clear.

Prefer read-only inspection before mutation.

---

# Copy-Paste Safety

Commands should avoid requiring operators to manually substitute sensitive values directly into shell history where safer methods exist.

---

# Shell History

Runbooks should not instruct operators to place:

```text id="1ks3of"
passwords
tokens
private keys
```

directly into command-line arguments when that would expose them through shell history or process inspection.

---

# Query Safety

Database queries should be:

```text id="ebs4f8"
bounded
read-only where possible
timeout-limited
indexed where known
```

Manual exploratory queries must not become uncontrolled production workloads.

---

# Expected Output

Where practical, a runbook should show what successful diagnostic output means.

Example concept:

```text id="a6qh1i"
Expected:
readiness = unhealthy
database = unavailable
```

Do not require operators to guess whether a command succeeded.

---

# Decision Points

A runbook should include explicit branching when response depends on evidence.

Conceptually:

```text id="f65a0l"
If database connectivity is restored:
    continue to recovery verification.

If connectivity still fails:
    escalate to database infrastructure investigation.
```

---

# Decision Trees

Simple decision trees may improve high-pressure execution.

Avoid excessively complex trees that are harder to follow than ordinary structured sections.

---

# Mitigation

Mitigation reduces current impact without necessarily fixing root cause.

Examples may include:

```text id="zz1i7e"
disable feature

rollback release

stop queue consumption

reduce traffic

switch provider

revoke credential
```

---

# Mitigation Must State Consequences

For every important mitigation, document:

```text id="2z8hal"
what impact it reduces

what capability it disables

what new risk it creates
```

---

# Temporary Mitigations

Mark temporary mitigations clearly.

Example:

```text id="1s0yzm"
Temporary mitigation: disable report generation until provider recovery.
```

Temporary mitigations require later removal or follow-up.

---

# Recovery

Recovery restores normal safe operation.

Runbooks should distinguish:

```text id="pm3kkv"
mitigation
```

from:

```text id="mnrw5c"
recovery
```

---

# Recovery Preconditions

Do not recover before the system is safe.

Examples:

```text id="g7zwjx"
dependency healthy

credential rotated

data integrity verified

new release deployed
```

---

# Progressive Recovery

Where risk exists, recovery may proceed gradually.

Examples:

```text id="fmbdwj"
resume one worker

restore partial traffic

enable feature for small scope
```

before full restoration.

---

# Verification

Every runbook involving state change should define how success is verified.

Potential evidence includes:

```text id="crw5j4"
metric recovered

health check ready

error rate normal

queue draining

data invariant restored

credential no longer accepted
```

---

# Verification Is Mandatory

Do not end a procedure with:

```text id="zkogmd"
run command
```

and assume success.

The procedure should end with:

```text id="42w6og"
verify intended state
```

---

# Negative Verification

Some procedures require proving the old unsafe behavior no longer occurs.

Example:

```text id="uy5296"
Confirm revoked credential can no longer authenticate.
```

---

# Recovery Observation

Some changes require monitoring for a period after recovery.

The runbook may define:

```text id="igbyl9"
which metrics

which alerts

which errors
```

to watch.

Avoid arbitrary time periods without operational justification.

---

# Rollback

If a procedure can be reversed, document rollback.

Examples:

```text id="7puqdr"
re-enable feature

restore previous config

redeploy previous version
```

---

# Rollback Preconditions

Rollback itself may be unsafe.

The runbook should identify compatibility requirements.

Example:

```text id="zxjr07"
Do not roll back the application after the contract migration has removed compatibility with the previous release.
```

---

# Forward Recovery

When rollback is not safe, document the forward-recovery direction.

Do not include a fictional rollback section merely because a template has one.

---

# Irreversible Operations

If an action is irreversible, state this explicitly before execution.

Examples include:

```text id="8q5x7b"
hard deletion

key destruction

queue purge

destructive restore
```

---

# Escalation

A runbook should define when the operator should stop following normal steps and escalate.

Examples:

```text id="v94zx1"
data corruption confirmed

security compromise suspected

recovery fails twice

unknown destructive side effects

scope exceeds documented procedure
```

---

# Escalation Target

Where team structure exists, identify the appropriate:

```text id="40nl1m"
service owner

database owner

security responder

incident commander

provider support
```

Do not invent organizational roles before they exist.

---

# Stop Conditions

Some conditions should explicitly stop the procedure.

Example:

```text id="25nvck"
Stop if the target database is not confirmed as production primary.
```

Stop conditions prevent uncertainty from turning into unsafe action.

---

# Runbook Confidence Boundary

A runbook should not encourage operators to improvise beyond documented safe scope.

If evidence falls outside the known procedure:

```text id="to4wfp"
stop
preserve evidence
escalate
```

may be the correct instruction.

---

# Incident Integration

For incident-oriented runbooks, indicate whether:

```text id="2362kf"
incident declaration

severity evaluation

status communication
```

may be required.

Detailed incident policy remains in:

```text id="0tjclx"
docs/security/incident-response.md
```

---

# Alert Integration

Alerts should link to the relevant runbook where possible.

Runbooks may reference the canonical alert name.

This enables:

```text id="xkmfba"
alert
    ↓
runbook
    ↓
diagnosis
```

---

# Observability Integration

Runbooks should reference stable telemetry concepts.

Examples:

```text id="c4p9mv"
operation

metric

log event

trace

error code
```

Avoid relying on fragile human-readable log messages.

---

# Log Queries

Future runbooks may contain saved or reproducible queries.

Queries should use stable fields such as:

```text id="z8sgu0"
event
service
operation
errorCode
traceId
```

rather than message-string matching where possible.

---

# Metric References

A runbook may say:

```text id="9453mq"
Inspect request error rate and database connection acquisition latency.
```

The exact provider query should be added once metrics tooling exists.

---

# Trace References

Trace investigation should state what the operator is looking for.

For example:

```text id="x0o8k6"
Inspect the first failing dependency span and compare latency with healthy traces.
```

This is more useful than:

```text id="y87rfb"
check traces
```

---

# Error Tracker References

A runbook may identify:

```text id="ya57q3"
relevant error code

known issue group

regression pattern
```

where stable.

Provider-specific links may be added later.

---

# Health References

Runbooks may use:

```text id="gvmqzq"
liveness
readiness
dependency status
```

according to:

```text id="5w36q3"
docs/reliability/health-checks.md
```

---

# Production Access Integration

Runbooks must not bypass production-access policy.

If a procedure requires elevated access, it should say so.

Do not instruct operators to:

```text id="uazg2e"
reuse service credentials

copy secrets

use shared administrator account
```

---

# Just-In-Time Access

Where just-in-time access exists, the runbook may include:

```text id="u8vqwf"
request required role
```

as a precondition.

The exact provider-specific mechanism belongs in operational implementation.

---

# Break-Glass

A runbook should invoke break-glass only for genuine emergency conditions where normal access is unavailable or insufficient.

Break-glass should not be the default first step.

---

# Secrets

Runbooks must never contain raw secrets.

Use:

```text id="vqquh5"
secret reference

credential identifier

secret-management procedure
```

instead.

---

# Data Classification

When the procedure may expose sensitive data, document the classification risk.

Example:

```text id="4zqljc"
This procedure may expose CONFIDENTIAL account metadata. Do not copy query output outside authorized production tooling.
```

---

# Data Exports

If a procedure creates temporary exports, define:

```text id="sfj4jh"
where stored

who can access

how long retained

how deleted
```

according to retention policy.

---

# Data Repair Runbooks

A data repair runbook should identify:

```text id="ah570w"
invariant

affected scope

canonical desired state

repair method

verification

recovery
```

---

# Repair Scripts

Prefer reviewed repository-controlled scripts for repeatable repairs.

The runbook should reference the script rather than duplicate complex code inline.

---

# Script Version

When an operational script is version-sensitive, the runbook should identify which repository revision or release context is appropriate.

Avoid copying stale scripts into external notes.

---

# Dry Run

If a tool supports dry run, the runbook should use it before destructive execution where valuable.

The runbook should explain expected preview output.

---

# Idempotency

Runbooks involving retries should state whether an operation is safe to repeat.

Never make the operator infer idempotency.

---

# Unknown Outcome

If an operation times out and completion is uncertain, document how to determine actual state before retrying.

Example:

```text id="s41taq"
Do not rerun the operation until current resource state is verified.
```

---

# Batch Operations

Batch procedures should define:

```text id="zex88c"
batch size

progress

failure handling

resume behavior
```

when relevant.

---

# Long-Running Procedures

For long-running maintenance, include:

```text id="xmo8g2"
progress indicators

safe pause behavior

resume behavior

monitoring
```

where the tooling supports them.

---

# Concurrent Execution

If running a procedure twice concurrently is unsafe, say so explicitly.

Examples:

```text id="7ne2zb"
Only one operator may execute this repair at a time.
```

The underlying tooling should eventually enforce this where possible.

---

# Preconditions vs Assumptions

A precondition can be checked before execution.

An assumption describes environmental expectations.

Important assumptions should be documented if violation changes safety.

---

# Automation Opportunities

If a runbook is used repeatedly for the same deterministic operation, consider automation.

Repeated manual procedures may indicate a tooling gap.

---

# Runbook to Tooling Evolution

A useful maturity path is:

```text id="quj82a"
manual procedure
    ↓
repeated safely
    ↓
script
    ↓
purpose-built operational tool
    ↓
automatic recovery where appropriate
```

Runbooks may remain as orchestration and verification guides.

---

# Self-Healing

When a known failure can be repaired automatically and safely, humans should not remain the primary recovery mechanism.

Alert only when:

```text id="cp3w4o"
automatic recovery fails
```

or repeated recovery indicates deeper instability.

---

# Runbook Testing

A runbook that has never been exercised may contain dangerous assumptions.

Important procedures should eventually be tested.

Potential mechanisms include:

```text id="92dqne"
staging exercise

tabletop exercise

restore test

game day

synthetic failure
```

---

# Destructive Runbook Testing

Do not test destructive production procedures directly against real data merely to prove documentation works.

Use controlled non-production or synthetic environments where possible.

---

# Backup Restore Runbooks

Backup restore procedures require real restore testing.

A backup is not trustworthy merely because creation succeeded.

---

# Credential Rotation Runbooks

Rotation procedures should be exercised before emergency compromise if possible.

Emergency is the worst time to discover undocumented dependencies.

---

# Runbook Validation

Future tooling may validate:

```text id="md0sh1"
required metadata

owner

references

broken repository links

known command wrappers
```

where useful.

---

# Avoid Over-Automating Documentation Validation

Do not create rigid parsing rules that make simple runbooks difficult to maintain.

Validation should protect useful invariants.

---

# Command Verification

If commands are checked into the repository, CI may eventually verify:

```text id="jtbw23"
script exists

arguments remain valid

referenced tool exists
```

where tooling permits.

---

# Link Validation

Repository-local runbook references should be checked for broken links.

External provider links may be more volatile.

---

# Runbook Freshness

Runbooks should be reviewed when:

```text id="1odwtg"
related architecture changes

production tooling changes

incident reveals incorrect steps

permissions change

dependency changes
```

A fixed calendar review may be added later if operational maturity requires it.

---

# Incident-Driven Review

After a runbook is used during a significant incident, review:

```text id="j0ox5c"
Was it accurate?

Was anything missing?

Did any step create confusion?

Could any step be automated?
```

---

# Runbook Drift

Runbook drift occurs when documented procedure no longer matches production.

This is dangerous because incorrect documentation appears authoritative.

Fix drift as an operational defect.

---

# Remove Obsolete Runbooks

When the underlying system no longer exists:

```text id="pwrtfa"
remove or deprecate the runbook
```

Do not preserve large amounts of obsolete operational documentation in current navigation.

Git preserves history.

---

# Runbook Index

This README should eventually serve as or generate an index of current runbooks.

Conceptually:

```text id="j8vrgg"
| Runbook | Owner | Trigger |
| --- | --- | --- |
| Database unavailable | Platform | Database readiness failure |
| Queue backlog | Backend | Queue age alert |
```

Do not create empty entries before real runbooks exist.

---

# Generated Index

Once enough runbooks exist, an index may be generated from metadata.

Runbook files remain canonical.

---

# Machine-Readable Metadata

Future runbooks may include metadata such as:

```text id="4hsst4"
owner
service
severity
requiredRole
relatedAlerts
```

when tooling provides value.

Do not invent a metadata system before repository tooling requires it.

---

# Searchability

Runbooks should be searchable by:

```text id="8ovh14"
symptom
service
dependency
error code
alert
operation
```

Use concrete terminology in titles and text.

---

# AI Navigation

An AI agent responding to an operational problem should be able to:

```text id="ebtkzs"
identify matching runbook

check whether trigger conditions apply

follow safe diagnostic sequence

recognize escalation boundaries

verify recovery
```

---

# AI Agent Requirements

Before using a runbook, an AI agent should verify:

```text id="56i3e4"
the runbook matches the actual condition

the environment is correct

required access is available

preconditions are satisfied

the procedure is current
```

---

# AI Must Not Blindly Execute Runbooks

A runbook is operational guidance, not unconditional permission.

An AI agent must not perform destructive or privileged steps merely because they appear in a document.

Authorization requirements still apply.

---

# AI and Production Authority

Following a runbook does not increase the AI agent's production privileges.

The agent may only perform actions permitted by the current delegated capability.

---

# AI and Preconditions

An AI agent must not skip preconditions to accelerate execution.

If a required precondition cannot be verified, it should stop before unsafe action.

---

# AI and Uncertainty

If observed evidence differs materially from the runbook:

```text id="t37c5f"
stop
identify mismatch
escalate or investigate
```

Do not force reality into the documented procedure.

---

# AI and Commands

An AI agent should not invent missing commands or provider-specific steps and present them as canonical runbook procedure.

Missing implementation-specific steps should remain explicitly unresolved until the actual stack exists.

---

# AI and Destructive Actions

Before a destructive action, an AI agent should verify:

```text id="735iy9"
scope
authorization
reversibility
verification method
```

and require the appropriate approval mechanism.

---

# AI and Verification

An AI agent should not declare a runbook complete because the final command returned successfully.

It must verify the intended operational outcome.

---

# AI and Runbook Improvements

After an incident, an AI agent may propose:

```text id="x58s2v"
clarification

missing check

automation

new warning

better verification
```

based on observed evidence.

---

# New Runbook Checklist

Before creating a runbook, answer:

1. What real operational condition or task does it address?
2. Is the condition likely to recur?
3. Who owns the system?
4. What triggers use of the runbook?
5. What symptoms confirm applicability?
6. Which access is required?
7. What are the dangerous actions?
8. What is the safest diagnostic sequence?
9. What mitigation is available?
10. How is recovery performed?
11. How is success verified?
12. When should the operator stop and escalate?
13. Can any steps be automated?
14. How will the procedure be tested?

---

# Runbook Step Checklist

Before adding a step, answer:

1. What does the step accomplish?
2. Is it diagnostic, mitigating, destructive, or recovery-oriented?
3. What access does it require?
4. Can it expose sensitive data?
5. Can it be bounded?
6. Is it safe to retry?
7. What output indicates success?
8. What output indicates failure?
9. What should happen next?
10. Can tooling enforce the safety requirement instead?

---

# Destructive Step Checklist

Before including a destructive step, answer:

1. Why is destruction necessary?
2. What exactly is affected?
3. Can scope be reduced?
4. Is a dry run available?
5. Is the operation reversible?
6. Is a backup or recovery path available?
7. What authorization is required?
8. What happens on partial failure?
9. How is success verified?
10. Is escalation safer than continuing under uncertainty?

---

# Escalation Checklist

A runbook should escalate when:

1. Evidence does not match the documented condition.
2. Required access is unavailable.
3. A destructive step has uncertain scope.
4. Data corruption is broader than expected.
5. Security compromise is suspected.
6. Recovery does not behave as documented.
7. The procedure has already failed safely.
8. The operator cannot verify postconditions.
9. The issue crosses ownership boundaries.
10. Continuing would require improvising privileged actions.

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## Runbook That Only Explains Architecture

Avoid.

---

## Runbook With No Trigger

Avoid.

---

## Runbook With No Owner

Avoid.

---

## Runbook With No Verification

Avoid.

---

## Runbook Says "Check Logs"

Avoid without identifying what evidence to inspect.

---

## Runbook Says "Restart Everything"

Avoid without justification and scope.

---

## Production Admin Required for Every Procedure

Avoid.

---

## Raw Secret Embedded in Runbook

Prohibited.

---

## Unbounded Database Query

Avoid.

---

## Destructive Command With No Warning

Prohibited.

---

## Destructive Command With No Verification

Avoid.

---

## Blind Retry After Unknown Outcome

Avoid.

---

## Break-Glass as First Step

Prohibited.

---

## Runbook Assumes Production Is Default Environment

Prohibited.

---

## Provider-Specific Command Invented Before Technology Selection

Avoid.

---

## Runbook Used as Incident History

Avoid.

---

## Obsolete Procedure Preserved as Current Truth

Avoid.

---

## Runbook Never Exercised for Critical Recovery

Avoid.

---

## AI Executes Runbook Without Checking Applicability

Prohibited.

---

# Initial Runbook Policy

Until operational tooling exists, Orion adopts the following requirements:

1. Runbooks should document real repeatable operational procedures, not hypothetical systems.
2. Runbooks describe current operational truth and should be updated when production changes.
3. Every runbook should have identifiable ownership.
4. Runbooks should define clear trigger conditions and applicability.
5. Required production access should be explicit and least-privileged.
6. Preconditions should be verified before risky actions.
7. Diagnostic steps should prefer low-risk observability before invasive production access.
8. Destructive actions must be explicitly marked and scoped.
9. Runbooks must never contain raw production secrets.
10. Production commands should not be invented before actual technology selection.
11. Mitigation, recovery, and permanent correction should remain conceptually distinct.
12. Procedures involving state change must include verification.
13. Unknown outcomes must be resolved before unsafe retry.
14. Runbooks should define stop and escalation conditions.
15. Temporary mitigations should be identifiable and followed up.
16. Repeated manual procedures should be candidates for scripts, tooling, or safe automation.
17. Critical runbooks should eventually be exercised in controlled environments.
18. Incident use should feed improvements back into the runbook.
19. AI agents must verify applicability, preconditions, authorization, and postconditions before following a runbook.
20. Runbook ownership, references, required access, and structural metadata should become mechanically validated where practical.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text id="ejn6py"
runbook metadata format
generated runbook index
operational CLI
production query tooling
incident-management links
alert-provider links
command validation
runbook testing automation
required owner format
runbook review cadence
```

These choices should follow actual runtime, observability, production-access, and incident-management tooling.

---

# Repository Layout

The runbook directory is intended to contain:

```text id="vc0pbm"
docs/runbooks/
├── README.md
├── template.md
├── database-unavailable.md
├── failed-migration.md
└── ...
```

Only create operational runbooks when the corresponding system or procedure actually exists.

---

# Initial Runbook Creation Flow

Until tooling exists:

```text id="l9vpr4"
1. Identify a real repeatable operational condition.
2. Confirm the procedure deserves a runbook.
3. Copy docs/runbooks/template.md.
4. Give the file a descriptive English name.
5. Identify ownership and required access.
6. Define trigger, symptoms, and preconditions.
7. Add diagnosis, mitigation, recovery, and verification.
8. Add explicit warnings and escalation conditions.
9. Review for security and production safety.
10. Exercise the procedure when practical.
```

---

# Incident Improvement Flow

After a runbook is used:

```text id="jy9z8y"
1. Compare documented steps with actual response.
2. Remove incorrect assumptions.
3. Add missing evidence or decision points.
4. Improve verification.
5. Automate repeated safe mechanics where valuable.
6. Update related alerts or observability if needed.
```

---

# Summary

A runbook is a production procedure designed for execution under pressure.

The intended model is:

```text id="d4rvve"
known condition
    ↓
confirm applicability
    ↓
verify preconditions
    ↓
diagnose safely
    ↓
mitigate
    ↓
recover
    ↓
verify
    ↓
escalate when outside known scope
```

Orion prefers:

```text id="kddc71"
executable procedures over descriptive prose

explicit triggers over vague troubleshooting

least privilege over broad admin access

observation before mutation

bounded actions over improvisation

verification over assumed success

escalation over unsafe guesswork

automation over repeated manual mechanics
```

A runbook should make a known operational situation easier to handle correctly.

It should reduce uncertainty.

It should reduce the chance of an operator making the incident worse.

And when reality no longer matches the documented procedure, the correct next step is usually to stop pretending the runbook still applies.
