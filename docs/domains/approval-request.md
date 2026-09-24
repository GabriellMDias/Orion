# Approval Request: Reference Feature

[Documentation index](../README.md) · [Implementation plan](../implementation-plan.md#phase-3) · [Human decisions](../human-actions.md#h-04)

This is the canonical business specification for Orion’s Approval Request reference feature. It records the project owner's Phase 3 decision. It does not assert that the feature, API, database schema, or user interface already exists. Architectural and security policies still govern its eventual implementation.

## Purpose and actors

A **Requester** creates an approval request, can edit it while it is a draft, can submit it for a decision, and can cancel it while it is a draft or submitted. A **Reviewer** decides a submitted request by approving or rejecting it. These are logical actors and capabilities, not yet an authentication provider, role model, or enforceable ownership rule. [H-05](../human-actions.md#h-05) must resolve public versus protected access, identity, authorization, tenancy, resource ownership, and whether a requester may review their own request before protected behavior is exposed.

## Use cases and invariants

| Use case | Business result |
| --- | --- |
| Create | Create a request in `DRAFT`. |
| Edit draft | Change a request only while it is `DRAFT`. |
| Get and list | Read requests without changing their state. Visibility and filtering by actor or ownership await H-05 and later API design. |
| Submit | Move a `DRAFT` request to `SUBMITTED`. |
| Approve | Move a `SUBMITTED` request to `APPROVED`. |
| Reject | Move a `SUBMITTED` request to `REJECTED` with a required reason. |
| Cancel | A Requester moves a `DRAFT` or `SUBMITTED` request to `CANCELLED`. |

- A request has exactly one of the five states below. `APPROVED`, `REJECTED`, and `CANCELLED` are terminal: no later edit or state transition is valid.
- State changes and draft edits must be conditional on the current state. A stale or concurrent operation must report a conflict instead of silently overwriting newer state. The winning state and any required rejection reason remain consistent.
- Repeated or competing operations must not create inconsistent effects. A retry may be reported as a conflict or handled as a safe replay; exact retry and response semantics remain an implementation decision. One request must not acquire multiple terminal outcomes.
- Read operations do not mutate a request. No actor visibility or self-review policy is inferred from the logical actor names.

## State transitions

| Operation | Valid source | Result |
| --- | --- | --- |
| Create | No existing request | `DRAFT` |
| Edit draft | `DRAFT` | `DRAFT`, with edited draft data |
| Submit | `DRAFT` | `SUBMITTED` |
| Approve | `SUBMITTED` | `APPROVED` |
| Reject, with reason | `SUBMITTED` | `REJECTED` |
| Cancel | `DRAFT` or `SUBMITTED` | `CANCELLED` |

All other state-changing combinations are invalid. In particular, an edit or submission after leaving `DRAFT`, an approval or rejection before submission, and any edit or transition from a terminal state must fail without changing the request. `get` and `list` have no state transition.

## Expected business failures

| Condition | Expected outcome |
| --- | --- |
| Requested item does not exist | Report that the request was not found; do not create or change one implicitly. |
| Action is invalid for the current state or the state is terminal | Reject the action and preserve the current state. |
| Reject has no usable reason | Reject the action and leave the request `SUBMITTED`. Exact reason format and limits are left to later contract design. |
| A stale edit or transition loses a race to another write | Report a conflict and preserve the winning write; do not silently overwrite it. |
| A duplicate or competing action arrives | Preserve one consistent result and report a safe replay or conflict as appropriate; do not apply a second inconsistent outcome. |

Transport status codes, error identifiers, validation shapes, and conflict/replay mechanics will be specified with the API and persistence design. Authentication and authorization failures depend on [H-05](../human-actions.md#h-05) and are not specified here.

## Data ownership, classification, and lifecycle

Approval Request owns its request state and, when rejected, the rejection reason as business data. Exact editable fields, identifiers, timestamps, schema metadata, and transaction ownership remain for [P3.4](../implementation-plan.md#phase-3). Requester identity, ownership enforcement, tenant scope, and who may read or review each request remain for H-05; the logical Requester actor does not settle those rules.

The owner classifies the intended feature data as ordinary **internal application data**. No secrets, credentials, financial, medical, or other specially sensitive data are intentionally part of this feature. Treat request content and rejection reasons as untrusted input and apply the [data-classification policy](../security/data-classification.md); this classification does not authorize public disclosure or unrestricted telemetry capture.

The lifecycle is creation as `DRAFT`, possible edit and submission, then a terminal decision or cancellation. PostgreSQL will provide durable persistence in the later implementation phase. The owner has defined no legal retention duration, automatic deletion requirement, or authoritative business-audit persistence requirement at this stage. This is not an indefinite-retention decision: applicable retention and disposal rules must be defined before production use under the [data-retention policy](../security/data-retention.md). Ordinary diagnostic logging does not become an authoritative business audit trail.

## Side-effect boundary

Creating or changing a request affects its durable internal business data once persistence is implemented. The reference feature has no external side effects or integrations by default: it does not require notifications, webhooks, messaging, external audit delivery, or a payment-like effect. Any later integration or authoritative audit requirement needs a separately recorded decision and corresponding consistency design under [delivery and side effects](../architecture/delivery-and-side-effects.md).

## Acceptance scenarios

1. Creating a request yields a `DRAFT` request; getting or listing it reads without changing state, subject to access rules decided under H-05.
2. Editing a current `DRAFT` changes its draft data and leaves it `DRAFT`. Editing after submit or after a terminal outcome fails without changing it.
3. Submitting a current `DRAFT` yields `SUBMITTED`. Repeating submission after that transition cannot create a second transition or overwrite a later outcome.
4. Approving a `SUBMITTED` request yields `APPROVED`; rejecting a `SUBMITTED` request with a reason yields `REJECTED` with that reason. Approving or rejecting a `DRAFT`, or acting after a terminal outcome, fails without mutation.
5. Rejecting a `SUBMITTED` request without a usable reason fails and leaves it `SUBMITTED`.
6. A Requester can cancel a `DRAFT` or `SUBMITTED` request, yielding `CANCELLED`; cancellation after a terminal outcome fails without mutation. Who qualifies as that Requester for a particular request awaits H-05.
7. If a draft edit races with submission, a stale edit cannot restore or overwrite the newly `SUBMITTED` request; the stale operation reports a conflict.
8. If approval, rejection, and/or cancellation race on a `SUBMITTED` request, exactly one valid terminal outcome persists. Losing operations report conflicts or safe replays and cannot replace that outcome or attach a conflicting rejection reason.
9. A write based on a stale version or previously observed state fails visibly when the request has since changed, including a stale edit against a newer draft revision. The newer data remains intact.
10. Repeating a successful operation cannot duplicate or contradict its business effect. No scenario expects an external integration or authoritative audit record.

Acceptance tests for state, concurrency, and persistence belong to later implementation phases. These scenarios are the business source for those tests, not a claim that they currently run.
