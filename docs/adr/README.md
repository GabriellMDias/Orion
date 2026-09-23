# Architecture Decision Records

## Purpose

This directory contains Architecture Decision Records, or ADRs, for Orion.

ADRs preserve important architectural decisions together with the context, alternatives, consequences, and rationale that existed when those decisions were made.

Their goals are to make architectural evolution:

- explicit;
- reviewable;
- historically understandable;
- resistant to repeated debate without new evidence;
- understandable by humans and AI agents;
- connected to current architecture without replacing current documentation.

An ADR answers:

```text
What significant architectural decision was made?

Why was it made?

Which alternatives were considered?

What consequences were accepted?

What later decision replaced it, if any?
```

An ADR is a record of a decision.

It is not the canonical documentation of the system's current behavior.

---

# Core Principle

Orion separates:

```text
ADRs
    → architectural decision history

current documentation
    → current architectural truth

Git
    → development history

migrations
    → released database state transitions

changelog
    → externally relevant release history
```

These mechanisms serve different purposes.

Do not use ADRs as substitutes for current documentation.

Do not use current documentation as a substitute for architectural decision history.

---

# What Is an ADR?

An ADR is a durable record of a significant architectural choice.

Typical ADR subjects include:

```text
selecting a database technology

choosing an API architecture

adopting a monorepo tool

selecting an authentication model

introducing a message broker

choosing an observability standard

changing a major deployment model

introducing a significant compatibility strategy
```

The decision should have architectural impact beyond one local implementation detail.

---

# Architecture Decision

A decision is architectural when it materially affects one or more of:

```text
system boundaries

dependency direction

data ownership

runtime topology

security model

persistence model

public contracts

deployment model

major operational behavior

cross-cutting technology

long-term maintainability
```

---

# Not Every Decision Needs an ADR

Most implementation decisions should not create ADRs.

Examples that normally do not require one include:

```text
renaming a local function

choosing one small helper abstraction

adding an index for a clearly demonstrated query

moving a file within one feature

fixing a bug

adding a test

changing internal copy

small refactoring
```

Repository history already preserves ordinary implementation evolution.

---

# ADR Threshold

Create an ADR when the decision is significant enough that a future contributor may reasonably ask:

```text
Why is the system designed this way instead of the obvious alternative?
```

and the answer cannot be inferred reliably from current implementation alone.

---

# ADR Heuristic

An ADR is likely appropriate when several of the following are true:

```text
the choice affects multiple applications or packages

the choice is difficult or expensive to reverse

reasonable engineers could choose differently

the choice introduces a long-term dependency

the choice changes an architectural boundary

the choice affects security or data integrity

the choice affects deployment or operational topology

the choice intentionally rejects a common alternative

the rationale would otherwise be lost
```

---

# ADRs Capture Decisions, Not Discussions

An ADR should converge on a decision.

It may describe alternatives and uncertainty.

It should not become a transcript of every discussion that occurred.

Preserve:

```text
relevant context
important alternatives
decision
rationale
consequences
```

not the entire conversational history.

---

# ADRs Are Not Design Documents

A design document may explain:

```text
detailed implementation
components
algorithms
data flow
rollout
```

An ADR explains why one architectural direction was selected.

A large project may have both.

---

# ADRs Are Not RFCs

A future proposal process may use RFCs or design proposals for collaborative exploration.

An ADR records the architectural decision once it is sufficiently concrete.

Orion does not require a separate RFC system by default.

---

# ADRs Are Not Runbooks

Runbooks explain how to operate or recover a system.

ADRs explain why an architectural decision was made.

---

# ADRs Are Not Changelog Entries

A changelog explains externally relevant released changes.

An ADR may never correspond to a customer-visible release.

---

# ADRs Are Not Current Architecture Documentation

Suppose an ADR says:

```text
Use technology A.
```

A later ADR may supersede it with:

```text
Use technology B.
```

The original ADR remains historically correct.

Current architecture documentation should simply explain:

```text
The system uses technology B.
```

without requiring readers to reconstruct current truth from all historical ADRs.

---

# Current Truth vs Historical Truth

Orion distinguishes:

```text
current documentation
    → what is true now

ADR
    → what was decided at a specific point in architectural history
```

This distinction is fundamental.

---

# ADR Immutability

Once an ADR is accepted and represents historical decision state, its substantive history should generally remain immutable.

Do not rewrite an old ADR to pretend the current architecture was always the decision.

---

# Allowed Corrections

Minor non-semantic corrections may be acceptable.

Examples:

```text
spelling
broken links
formatting
clarifying obvious typo
```

Such corrections must not alter the historical meaning of the decision.

---

# Historical Integrity

If an accepted ADR is now incorrect because the architecture changed, do not rewrite it.

Create a new ADR that:

```text
records the new decision
references the old ADR
marks the old ADR as superseded
```

---

# Supersession

When a new architectural decision replaces an old one:

```text
ADR-001
    accepted
        ↓
ADR-017
    supersedes ADR-001
```

The old ADR remains in the repository.

Its status becomes:

```text
superseded
```

and it should reference the replacement.

---

# Partial Supersession

Sometimes a later ADR replaces only part of an earlier decision.

If partial supersession is needed, document explicitly:

```text
which part remains valid

which part was replaced

which ADR contains the new decision
```

Avoid ambiguous partial historical state where possible.

---

# Status

Every ADR should have an explicit status.

The initial Orion status model is:

```text
proposed
accepted
rejected
superseded
deprecated
```

Additional statuses should not be added without a clear need.

---

# Proposed

`proposed` means:

```text
the decision is under active consideration
```

Implementation should not assume the proposal is final unless the work is explicitly exploratory.

---

# Accepted

`accepted` means:

```text
the decision is the approved architectural direction
```

Current implementation and documentation should align with it unless migration is still underway.

---

# Rejected

`rejected` means:

```text
the proposed decision was considered and intentionally not adopted
```

Rejected ADRs may be valuable when the rejected alternative is likely to be proposed repeatedly.

---

# Superseded

`superseded` means:

```text
the decision was once accepted but a later architectural decision replaced it
```

The ADR should reference the replacement ADR.

---

# Deprecated

`deprecated` means:

```text
the decision remains historically relevant but should no longer be selected for new architecture
```

while replacement may still be transitional or not yet complete.

Use this status sparingly.

If another accepted decision fully replaces it, `superseded` is usually clearer.

---

# Status Transitions

Typical transitions include:

```text
proposed
    ↓
accepted
```

or:

```text
proposed
    ↓
rejected
```

An accepted ADR may later become:

```text
accepted
    ↓
superseded
```

or occasionally:

```text
accepted
    ↓
deprecated
```

---

# Do Not Revert to Proposed

Once an ADR has become part of architectural history, do not normally move it back to `proposed`.

If the decision is being reconsidered, create a new ADR.

---

# Decision Date

Each ADR should record the date of the relevant decision state.

For an accepted ADR, this should generally be the acceptance date.

Do not change the original date when the ADR is later superseded.

---

# ADR Numbering

ADRs should use monotonic numeric identifiers.

Conceptually:

```text
0001
0002
0003
...
```

Numbers identify records.

They do not indicate:

```text
priority
importance
architecture layer
domain
version
```

---

# File Naming

Recommended format:

```text
NNNN-short-decision-title.md
```

Example:

```text
0001-use-monorepo.md
0002-select-primary-database.md
0017-adopt-event-driven-integration-for-x.md
```

Use concise English titles.

---

# Number Allocation

Once an ADR number is used in shared history, do not reuse it for another decision.

A withdrawn or rejected ADR may leave a number permanently occupied.

This is acceptable.

---

# Number Gaps

Gaps are acceptable.

Do not renumber existing ADRs merely to create a perfectly continuous sequence.

Stable references are more important than aesthetic numbering.

---

# Branch Conflicts

Parallel work may temporarily allocate the same next ADR number.

Resolve such conflicts before merge by renumbering one unreleased ADR.

An ADR number that has not entered the shared repository history may be changed safely.

---

# ADR IDs Are Stable

Once merged and referenced, an ADR identifier should remain stable.

Avoid renaming:

```text
ADR-0012
```

to:

```text
ADR-0009
```

later.

---

# Title

The title should describe the decision.

Prefer:

```text
Use PostgreSQL as the Primary Relational Database
```

over:

```text
Database Decision
```

Prefer:

```text
Adopt OpenTelemetry for Observability Instrumentation
```

over:

```text
Telemetry
```

---

# Decision-Oriented Titles

Titles should generally describe the chosen direction, not only the topic.

Good:

```text
Use a Modular Monolith for the Initial Backend
```

Less useful:

```text
Backend Architecture
```

---

# ADR Structure

Orion ADRs should follow the canonical template in:

```text
docs/adr/template.md
```

The template should remain small enough that creating an ADR is not bureaucratic.

---

# Required Information

An ADR should normally contain:

```text
title
status
date
context
decision
consequences
```

Important decisions should also document:

```text
alternatives considered
rationale
related references
```

where useful.

---

# Context

The context should explain the problem or constraint that required a decision.

Good context explains:

```text
what problem exists
what constraints matter
why a decision is needed now
```

Avoid unnecessary implementation detail.

---

# Decision

The decision section should state clearly what Orion will do.

It should be possible to quote the decision without reconstructing it from the rationale.

---

# Rationale

Rationale explains why the chosen direction was preferred.

It should focus on the constraints and tradeoffs that materially affected the choice.

---

# Alternatives

Alternatives should include serious options that were considered.

Do not create fake alternatives merely to fill a template.

---

# Consequences

Every meaningful architectural decision has consequences.

Document both:

```text
benefits
costs
constraints
new responsibilities
```

Avoid ADRs that describe only advantages.

---

# Tradeoffs

An ADR should acknowledge tradeoffs openly.

Architecture decisions often exchange one kind of complexity for another.

For example:

```text
simpler deployment
    in exchange for
less independent scaling
```

This is useful future context.

---

# Reversibility

Where relevant, document how difficult the decision is to reverse.

Potential categories may conceptually be:

```text
easy
moderate
expensive
```

Or simply describe the concrete migration cost.

Do not create formal scoring unless it becomes useful.

---

# Migration

If the decision changes existing architecture, the ADR may describe the high-level migration direction.

Detailed operational steps should usually live elsewhere.

---

# Decision Scope

An ADR should identify the scope of the decision if ambiguity exists.

Examples:

```text
all backend services

only the initial web application

new domains only

production workloads
```

---

# Constraints

Important constraints should be explicit.

Examples include:

```text
mobile clients update slowly

small engineering team

must support regional deployment

must preserve database portability
```

Future readers need to know which assumptions drove the decision.

---

# Assumptions

If the decision depends on assumptions, record them.

A future architecture review can then ask whether those assumptions remain true.

---

# Evidence

Where applicable, rationale may reference evidence such as:

```text
benchmark
proof of concept
production incident
provider limitation
cost analysis
```

Do not embed large volatile datasets in the ADR itself.

Link to durable evidence where practical.

---

# External Links

External links may decay.

The ADR should contain enough rationale to remain understandable if an external article or vendor page disappears.

---

# Vendor Documentation

Vendor documentation may be referenced for technical constraints.

Do not make the ADR dependent on a single external URL for its core explanation.

---

# Repository References

Prefer repository references for:

```text
related policy
design document
benchmark
migration plan
previous ADR
```

where the artifact exists.

---

# Related ADRs

ADRs should reference related decisions when useful.

Examples:

```text
supersedes ADR-0004

depends on ADR-0007

extends ADR-0011
```

Do not create unnecessary dependency graphs for loosely related topics.

---

# Supersedes

A new ADR replacing an earlier one should state explicitly:

```text
Supersedes: ADR-XXXX
```

The older ADR should also be updated to reference the new one.

---

# Superseded By

The old ADR should indicate:

```text
Superseded by: ADR-YYYY
```

This is one of the few expected metadata changes to an accepted historical ADR.

It does not rewrite the historical decision.

---

# Rejected ADRs

Rejected ADRs may remain useful when:

```text
the alternative is likely to be reconsidered

the evaluation required significant work

the rejection documents an important constraint
```

---

# Do Not Record Every Rejected Idea

A brief idea that was immediately dismissed does not need an ADR.

ADRs should preserve meaningful architectural reasoning, not every brainstorm.

---

# Abandoned Proposals

An unaccepted proposal that is no longer relevant may either:

```text
remain rejected
```

or be removed before entering meaningful shared history if it was purely local experimentation.

Once broadly reviewed or referenced, preserving it as `rejected` may be more useful.

---

# ADRs and Releases

An ADR does not require a product release.

A decision may be accepted before implementation.

---

# Accepted Does Not Mean Fully Implemented

An accepted ADR may describe the intended architecture while migration is still occurring.

Current architecture documentation should distinguish transitional reality if necessary.

---

# Decision vs Implementation State

These are separate concepts:

```text
architectural decision
    → accepted

implementation
    → pending / partial / complete
```

Do not change ADR status merely because implementation is incomplete.

---

# Tracking Implementation

Implementation work should be tracked through normal project mechanisms such as:

```text
issues
tasks
project tracking
pull requests
```

not through ADR status proliferation.

---

# ADRs and Experimental Work

Experiments may happen before a decision.

Do not create an accepted ADR merely because a prototype exists.

The ADR should represent the architectural conclusion.

---

# ADRs and Proofs of Concept

A proof of concept can provide evidence.

The ADR may reference its result.

The proof of concept itself is not the decision.

---

# ADRs and Technology Selection

Major technology selection should generally use ADRs.

Examples:

```text
primary programming language
database
ORM
API contract system
monorepo build system
observability standard
deployment platform
```

when those decisions become concrete.

---

# One ADR per Technology?

Do not automatically create one ADR per dependency.

A technology deserves an ADR when its adoption is architecturally significant.

A small utility package generally does not.

---

# Bundled Decisions

Related decisions may appear in one ADR when they are inseparable.

For example:

```text
adopt tool X specifically because it provides architecture Y
```

may be one decision.

Avoid giant ADRs that decide the entire technology stack at once if decisions have independent rationale and lifecycles.

---

# Decision Granularity

A good ADR should be:

```text
large enough to matter
small enough to understand independently
```

---

# Cross-Cutting Decisions

Cross-cutting policies already defined as foundational documentation do not each require retroactive ADRs.

For example:

```text
structured logging
least privilege
release-aware migrations
```

are currently foundation principles.

Future changes to these foundational policies may require ADRs if architecturally significant.

---

# Foundation Phase

During Orion's foundation specification, many principles are being defined before implementation.

These policy documents establish the initial architecture baseline.

They do not require one ADR per policy statement.

---

# First Technology ADRs

After foundational policy is complete and technology selection begins, ADRs should become the primary record of major technology choices.

This creates the transition:

```text
foundation principles
    ↓
technology evaluation
    ↓
ADR
    ↓
implementation
```

---

# ADR Review

An ADR should receive review proportional to its impact.

High-impact decisions may require more scrutiny than small internal choices.

---

# Review Questions

Reviewers should ask:

```text
Is the problem real?

Are the constraints accurate?

Is the decision clear?

Were important alternatives considered?

Are security and operational consequences understood?

Is the decision consistent with Orion principles?

Is the complexity justified?
```

---

# Principle Conflicts

An ADR may intentionally deviate from an existing principle.

If so, it should explicitly explain why.

Do not silently create exceptions.

---

# Policy Changes

If an ADR changes a foundational policy, update the relevant current documentation after accepting the decision.

The ADR records:

```text
why the policy changed
```

The policy document records:

```text
what the policy is now
```

---

# ADR Acceptance

The mechanism for accepting an ADR may initially be repository review and merge.

As the team grows, formal ownership or approval requirements may evolve.

Do not introduce unnecessary ceremony before it provides value.

---

# Small-Team Acceptance

For a single maintainer or very small team, acceptance may simply mean:

```text
decision reviewed
ADR merged
status = accepted
```

This is sufficient if history remains clear.

---

# Future Team Growth

A larger team may later define:

```text
architecture owners
required reviewers
domain approvals
security review
```

for specific decisions.

Such governance should be added only when organizational needs justify it.

---

# Drafting an ADR

The typical process is:

```text
identify architectural decision
    ↓
allocate next ADR number
    ↓
copy template
    ↓
status = proposed
    ↓
document context and alternatives
    ↓
review
    ↓
accept or reject
```

---

# Implementing Before Acceptance

Exploratory implementation may occur before acceptance.

Long-lived production implementation should generally not rely on an unresolved major architectural proposal.

---

# Decision Timing

Create the ADR while the decision context is still known.

Do not wait months until everyone has forgotten why the choice was made.

---

# Retrospective ADRs

A retrospective ADR may be useful when an important architectural decision exists but was never recorded.

It should clearly represent:

```text
decision already in effect
```

rather than pretending the ADR preceded implementation.

---

# Retrospective Context

A retrospective ADR should avoid inventing historical reasoning that cannot be verified.

Record what is known.

If rationale is uncertain, say so.

---

# ADR Maintenance

ADRs should require very little routine maintenance.

Normal accepted ADRs remain unchanged unless:

```text
metadata link breaks
supersession occurs
minor correction is needed
```

Current architecture changes belong in new ADRs and current docs.

---

# ADR Index

This README should eventually contain or generate an ADR index.

Conceptually:

```text
| ADR | Title | Status |
| --- | --- | --- |
| 0001 | ... | accepted |
| 0002 | ... | superseded |
```

Once enough ADRs exist, generating the index from ADR metadata is preferable to manually duplicating it.

---

# Machine-Readable Metadata

ADR metadata should eventually be machine-readable enough to support:

```text
index generation
status validation
supersession validation
AI navigation
```

The exact frontmatter format is deferred until repository documentation tooling is selected.

---

# Manual Metadata First

Until documentation tooling exists, simple Markdown metadata is sufficient.

Do not introduce a custom ADR parser prematurely.

---

# Stable Metadata Names

Once tooling depends on ADR metadata fields, field names become documentation-tooling contracts.

Change them deliberately.

---

# Generated ADR Index

If an index is generated later:

```text
ADR files
    ↓
metadata parser
    ↓
docs/adr/README index
```

the ADR files remain canonical.

Do not manually maintain duplicate status data in several places.

---

# Searchability

ADRs should be easy for humans and AI agents to search.

Use:

```text
descriptive titles
explicit technology names
explicit concepts
related ADR references
```

Avoid vague filenames.

---

# AI Navigation

An AI agent investigating architecture should be able to determine:

```text
current architecture
    from current docs

historical rationale
    from ADRs

superseded reasoning
    from linked ADR history
```

It should not need to infer the current architecture by reading every ADR chronologically.

---

# AI Agent Requirements

Before creating an ADR, an AI agent should ask:

```text
Is this decision architecturally significant?

Will future contributors need the rationale?

Is this already decided by an existing ADR or policy?

Is this merely an implementation detail?
```

---

# AI Must Search Existing ADRs

Before proposing a new architectural decision, an AI agent should inspect existing ADRs for:

```text
same decision
related decision
superseded decision
rejected alternative
```

This reduces repeated architectural debate.

---

# AI Must Respect Accepted ADRs

An AI agent should treat accepted ADRs as architectural constraints unless:

```text
a new decision is explicitly being considered
```

It must not silently violate them for implementation convenience.

---

# AI and Superseded ADRs

An AI agent must not treat a superseded ADR as current architecture.

It should follow the replacement ADR and current documentation.

---

# AI and Current Truth

When ADR history conflicts with current architecture documentation because a later decision changed the system:

```text
current docs
```

describe the current state.

ADRs explain how that state was reached.

---

# AI and Rejected ADRs

A rejected ADR does not permanently prohibit reconsideration.

If constraints materially change, a new ADR may reconsider the same direction.

The new ADR should explain what changed.

---

# AI and Rewriting History

An AI agent must not update an old accepted ADR's decision section merely to match current architecture.

It should create a new ADR and supersede the old one.

---

# AI and ADR Scope

An AI agent should not create ADRs for every library addition, refactor, endpoint, database index, or local abstraction.

ADRs are scarce architectural records, not verbose commit messages.

---

# AI and Alternatives

An AI agent should include meaningful alternatives when they materially influenced the decision.

It should not fabricate alternatives or claim evaluation evidence that does not exist.

---

# AI and Evidence

An AI agent must distinguish:

```text
known evidence
reasoned tradeoff
assumption
```

when drafting an ADR.

---

# AI and Technology Freshness

When a technology decision depends on:

```text
current product capability
pricing
support lifecycle
security status
provider limits
```

the evaluation should use current evidence at decision time.

The ADR should preserve the important conclusion and constraints without becoming a snapshot of every volatile vendor detail.

---

# AI and Consequences

AI-generated ADRs must include negative consequences and costs.

An ADR that lists only advantages is incomplete.

---

# AI and Implementation

After an ADR is accepted, an AI agent implementing the decision should:

```text
update current architecture docs
implement the selected direction
add validation where appropriate
avoid preserving rejected experimental paths
```

---

# New ADR Checklist

Before creating an ADR, answer:

1. What architectural decision is being made?
2. Why does this decision require a durable record?
3. Which systems or boundaries are affected?
4. Is an existing ADR already authoritative?
5. Is the decision already defined by foundational policy?
6. Is the decision difficult or costly to reverse?
7. Were meaningful alternatives considered?
8. What constraints drive the choice?
9. What consequences will be accepted?
10. Which current documents will need updating after acceptance?

---

# ADR Acceptance Checklist

Before marking an ADR `accepted`, answer:

1. Is the decision stated clearly?
2. Is the context sufficient?
3. Are important constraints documented?
4. Are serious alternatives represented accurately?
5. Is the rationale understandable?
6. Are negative consequences included?
7. Is the decision consistent with existing accepted ADRs?
8. If not, is supersession explicit?
9. Does the decision conflict with foundational policy?
10. Which implementation work follows?
11. Which current documentation must change?

---

# ADR Supersession Checklist

Before superseding an ADR, answer:

1. Which previous decision is being replaced?
2. Why is it no longer appropriate?
3. Which assumptions or constraints changed?
4. Is the replacement decision explicit?
5. Does the new ADR reference the old one?
6. Does the old ADR reference the new one?
7. Which current documentation must be updated?
8. Which compatibility or migration work is required?

---

# ADR Rejection Checklist

Before marking a proposal `rejected`, answer:

1. Was the proposal significant enough to preserve?
2. Why was it rejected?
3. Which alternative was preferred, if any?
4. Are the decisive constraints documented?
5. Could changed constraints justify reconsideration later?

---

# Common Anti-Patterns

The following patterns are prohibited or strongly discouraged.

---

## ADR for Every Pull Request

Avoid.

---

## ADR for Every Dependency

Avoid.

---

## ADR Used as Current Documentation

Avoid.

---

## Current Documentation Contains Full Decision History

Avoid.

---

## Old ADR Rewritten to Match New Architecture

Prohibited.

---

## Superseded ADR Deleted

Avoid.

---

## Renumber Accepted ADRs

Prohibited.

---

## Reuse Old ADR Number

Prohibited.

---

## Accepted ADR With No Clear Decision

Avoid.

---

## ADR Containing Only Advantages

Avoid.

---

## Fake Alternatives Added to Fill Template

Avoid.

---

## Huge ADR Deciding Entire System Architecture at Once

Avoid.

---

## ADR Used as Project Task Tracker

Avoid.

---

## ADR Used as Runbook

Avoid.

---

## ADR Used as Changelog

Avoid.

---

## Architecture Changed Without Updating Current Docs

Avoid.

---

## Rejected ADR Treated as Permanent Ban Regardless of Changed Constraints

Avoid.

---

## Status Invented Per ADR

Avoid.

Use the shared status model.

---

# Initial ADR Policy

Until ADR tooling exists, Orion adopts the following requirements:

1. ADRs record significant architectural decisions and their rationale.
2. ADRs must not be created for ordinary local implementation decisions.
3. Current documentation describes current truth; ADRs preserve decision history.
4. Git preserves development history and must not be replaced by ADRs.
5. Accepted ADR history should remain substantively immutable.
6. Architectural changes should create new ADRs rather than rewrite old accepted decisions.
7. Replaced ADRs should remain in the repository with status `superseded`.
8. Superseded ADRs and their replacements should reference each other.
9. ADR identifiers should use stable monotonic numeric numbering.
10. Existing merged ADR numbers must not be reused or renumbered.
11. The initial ADR status set is `proposed`, `accepted`, `rejected`, `superseded`, and `deprecated`.
12. ADR titles should describe the actual architectural decision.
13. ADRs should document relevant context, decision, consequences, and meaningful alternatives.
14. Architectural tradeoffs and negative consequences must be represented honestly.
15. Accepted ADRs may precede full implementation.
16. Implementation progress should not be encoded through custom ADR statuses.
17. Major technology selections should generally be recorded through ADRs once technology selection begins.
18. AI agents must inspect existing ADRs before proposing conflicting architectural decisions.
19. AI agents must not treat superseded ADRs as current architecture.
20. ADR metadata, indexing, status validation, and supersession links should become mechanically validated where practical.

---

# Future Implementation Decisions

The following decisions are intentionally deferred:

```text
ADR metadata format
frontmatter format
automatic numbering
ADR index generation
status validation
supersession validation
architecture approval workflow
required reviewers
documentation tooling
```

These choices should follow repository tooling and team size.

Do not introduce dedicated ADR software unless it provides concrete value.

---

# Repository Layout

The ADR directory is intended to contain:

```text
docs/adr/
├── README.md
├── template.md
├── 0001-....md
├── 0002-....md
└── ...
```

Do not create placeholder ADR files before real decisions exist.

---

# Initial ADR Creation Flow

Until automated tooling exists:

```text
1. Identify that the decision deserves an ADR.
2. Determine the next available numeric identifier.
3. Copy docs/adr/template.md.
4. Rename the file using the identifier and decision title.
5. Set status to proposed.
6. Document context, decision, alternatives, and consequences.
7. Review the proposal.
8. Mark it accepted or rejected.
9. Update current architecture documentation if accepted.
10. Implement the decision.
```

---

# Supersession Flow

When architecture changes later:

```text
1. Create a new proposed ADR.
2. Reference the existing ADR being reconsidered.
3. Explain what changed.
4. Record the replacement decision.
5. Accept the new ADR.
6. Mark the old ADR superseded.
7. Add reciprocal ADR references.
8. Update current architecture documentation.
9. Migrate implementation safely.
```

---

# Summary

ADRs preserve architectural reasoning.

The intended model is:

```text
architectural question
    ↓
proposal
    ↓
decision
    ↓
ADR
    ↓
implementation
    ↓
current documentation
```

Later:

```text
architecture changes
    ↓
new ADR
    ↓
old ADR superseded
    ↓
current documentation updated
```

Orion prefers:

```text
durable rationale over architectural folklore

new decisions over rewritten history

current docs for current truth

ADRs for decision history

Git for development history

meaningful records over bureaucratic volume
```

A future contributor should not need to ask:

```text
Why did they choose this?
```

and rely on memory.

They should also not need to read ten years of ADRs merely to determine what the system does today.

Current documentation explains the architecture.

ADRs explain why that architecture exists.
