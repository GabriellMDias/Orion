# Runbook: Procedure Title

**Owner:**
**Status:** active
**Related alerts:**
**Required access:**

## Purpose

Describe the operational condition or task this runbook handles.

State clearly when this procedure should be used.

## Trigger / Symptoms

Use this runbook when one or more of the following are observed:

- Describe a relevant alert, symptom, error, or operational condition.

Do not use this runbook when:

- Describe important non-applicability conditions when needed.

## Impact

Describe the expected operational impact.

Examples may include:

- requests failing;
- writes unavailable;
- jobs delayed;
- one capability degraded;
- potential data or security risk.

## Preconditions

Before continuing:

1. Confirm the target environment.
2. Confirm that the observed condition matches this runbook.
3. Confirm that the required access is available.
4. Verify any procedure-specific safety preconditions.

Add additional preconditions as required.

## Diagnosis

Perform the lowest-risk diagnostic steps first.

1. Inspect the relevant metrics, alerts, logs, traces, or error reports.
2. Confirm the affected scope.
3. Identify whether a recent deployment, migration, configuration change, or dependency failure is relevant.
4. Continue only when the evidence supports this procedure.

Document concrete provider-specific queries or commands here only after the corresponding tooling exists.

## Mitigation / Procedure

Follow the steps in order.

1. Describe the first operational action.
2. Describe the next action.
3. Include explicit decision points where behavior depends on observed evidence.

> **Warning:** Add a concrete warning before destructive, irreversible, or high-risk operations. Explain exactly what may be affected.

Do not continue beyond the documented scope when the observed system state differs materially from the runbook.

## Verification

Verify the intended outcome explicitly.

Confirm relevant signals such as:

- service health;
- error rate;
- latency;
- queue progress;
- data integrity;
- authorization state;
- credential revocation;
- expected application behavior.

Do not consider the procedure complete solely because a command returned successfully.

## Rollback / Recovery

Describe how to reverse the operation when rollback is safe.

If rollback is not safe or possible, describe the required forward-recovery path.

Remove this section only when it genuinely does not apply.

## Escalation

Stop and escalate when:

- observed evidence does not match the documented condition;
- the affected scope is larger than expected;
- required access is unavailable;
- destructive impact cannot be bounded;
- data corruption or security compromise is suspected;
- recovery does not behave as documented;
- postconditions cannot be verified.

Identify the appropriate owner or escalation target once the real organizational structure exists.

## Follow-Up

After recovery, consider whether the incident requires:

- a permanent corrective change;
- a regression test;
- an alert change;
- improved observability;
- automation;
- a runbook update;
- an ADR;
- a post-incident review.
