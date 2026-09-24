# Continuous Integration

This page routes CI work to the accepted policy in [ADR-0011](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md). It introduces no new architectural decision. See [validation availability](../validation.md) for implemented local commands and the status below for remote enforcement.

## Current implementation and activation

The repository workflow at `.github/workflows/ci.yml` validates pull requests to `main`, pushes to `main`, merge-queue commits, and manual dispatches. It reads Node.js and pnpm versions from repository files, installs from the frozen lockfile, and runs `pnpm validate`. The stable branch-protection check name is **Orion required gate**. Its job fails if validation fails or does not finish successfully. Superseded pull-request runs are cancelled; primary-branch runs are not. No diagnostic artifacts are uploaded yet, so there is no artifact retention period to configure. Future uploads must specify bounded retention and contain no secrets or sensitive data.

The dependency-review job is prepared for pull requests and blocks newly introduced high or critical vulnerabilities when the repository variable `DEPENDENCY_REVIEW_ENABLED` is `true`. Leave that variable unset until GitHub Code Security/dependency review is verified available for this private repository; then set it to `true` and verify a real pull-request run. The aggregate gate treats an enabled but failed or skipped review as a failure. [H-03](../human-actions.md#h-03) tracks feature and entitlement verification.

The root `renovate.json` selects Renovate's recommended baseline, Dependency Dashboard, weekly routine cadence, grouped compatible TypeScript/lint updates, visible majors requiring dashboard approval, SHA-pin maintenance, and no automerge. Renovate vulnerability-remediation pull requests are not held to the routine schedule. Repository configuration does not install the Renovate GitHub App; [H-01](../human-actions.md#h-01) tracks its activation. [H-02](../human-actions.md#h-02) tracks effective protection of `main` by the exact aggregate check. Neither workflow source nor a local pass proves these external settings are active.

## Read for this change

| Change | Governing decision section |
| --- | --- |
| Local/CI command parity and incremental capabilities | [Canonical validation contract](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#canonical-validation-contract) |
| Required PR gate, primary-branch checks, manual runs | [Pull-request validation](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#pull-request-validation) and [required gate](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#required-ci-gate) |
| Runner, versions, lockfile, caching, concurrency | [Execution environment](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#ci-execution-environment) through [pull-request concurrency](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#pull-request-concurrency) |
| Integration/browser tests and artifacts | [Integration infrastructure](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#integration-test-infrastructure) and [testing strategy](testing-strategy.md) |
| Permissions, action pins, untrusted PRs, secrets, OIDC | [Actions security](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#github-actions-security) |
| Renovate cadence, grouping, majors, automerge, lockfiles | [Dependency automation](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#dependency-automation) |
| Dependency review, scanning, feature availability, licenses | [Dependency security alerts](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#dependency-security-alerts) and subsequent security sections |
| Validation mutations, reusable workflows, CI versus CD | [CI-generated modifications](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#ci-generated-modifications) and [continuous delivery](../adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md#continuous-delivery) |

## Policy boundaries

GitHub Actions uses the same repository validation capabilities as local development. GitHub-hosted Linux is the initial runner, with repository-pinned versions and frozen lockfile installation. A stable aggregate gate protects the primary branch. Validation must not silently fix tracked sources.

Renovate owns version-update automation, with routine weekly grouping and automerge disabled initially. Dependabot vulnerability alerts are a separate capability, not a second version-update system. GitHub security features retain the availability and entitlement qualifications in the ADR; paid security features are not a mandatory architectural dependency.

Deployment, release approvals, rollback environments, and CD remain deferred until concrete deployment requirements exist. Use [secrets management](../security/secrets-management.md), [production access](../security/production-access.md), and [retention](../security/data-retention.md) for those cross-cutting policies. Local validation commands are listed in [validation](../validation.md); remote run results and effective settings must be verified separately.
