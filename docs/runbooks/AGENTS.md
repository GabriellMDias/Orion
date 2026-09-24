# Runbook Instructions

- Consult the [index](README.md), [authoring policy](authoring.md), and [template](template.md).
- Document real operational conditions only. Do not invent provider commands, organizational roles, or runnable procedures before they exist.
- Include applicability, required access, verifiable preconditions, bounded actions, postcondition verification, and stop/escalation conditions.
- Follow [production-access policy](../security/production-access.md). A runbook grants no additional authority; verify delegated authorization before privileged or destructive actions.
- Preserve recovery and unknown-outcome semantics. Do not equate command success with recovery or retry an uncertain state-changing operation blindly.
