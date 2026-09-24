# Validation

## Current availability

The repository now has a pnpm workspace, a committed lockfile, and local validation tooling. Install Node.js 24.13.0 and pnpm 11.25.0 (pinned in `.node-version` and `package.json`), then run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm validate
```

`pnpm validate` runs the independently available checks below in order and stops at the first failure. It is non-interactive and does not fix tracked files. Run a narrower script to diagnose a particular failure.

| Command | Current check |
| --- | --- |
| `pnpm format:check` | Prettier checks source and configuration files. Existing authored Markdown is covered by structural checks below, not a repository-wide Prettier baseline. |
| `pnpm lint` | ESLint Flat Config checks JavaScript and TypeScript; TypeScript uses typescript-eslint's type-aware rules. |
| `pnpm typecheck` | Strict TypeScript checking of the current repository tooling. Extend project coverage as applications and packages are added. |
| `pnpm architecture` | dependency-cruiser checks resolvable imports, cycles, and applicable repository/application/package boundary rules. Extend rules with real package ownership and public APIs. |
| `pnpm docs:check` | Checks local Markdown targets and heading anchors, single top-level headings, ADR filenames/metadata/index entries, and reachability from the root README. It does not verify external URLs or the meaning of a document. |

Use `pnpm format` only when an intentional formatting edit is needed; it writes files and is separate from `pnpm validate`. A formatting failure names the file; type, lint, architecture, and documentation failures report the relevant source location or import/link. Repair the canonical source and rerun the failing script, then the aggregate command.

There are still no applications, runtime packages, test suites, or generators. Build and test commands are therefore unavailable; `pnpm validate` must not be interpreted as exercising them. A GitHub Actions workflow now invokes this same command; its execution and required-check settings are tracked in [CI status](architecture/continuous-integration.md). A first-party workspace dependency should use `workspace:` when a real package relationship is introduced.

## Accepted responsibilities

The [validation ADR](adr/0003-establish-repository-validation-and-architecture-enforcement.md), [testing ADR](adr/0009-establish-testing-strategy-and-tooling.md), and [CI ADR](adr/0011-establish-continuous-integration-dependency-automation-and-supply-chain-security-strategy.md) govern implementation.

| Responsibility | Accepted mechanism |
| --- | --- |
| Formatting checks | Prettier; separate checking from automatic fixes |
| Static analysis | ESLint Flat Config and typescript-eslint, with typed linting where useful |
| Type checking | TypeScript compiler; test execution and linting do not replace it |
| Dependency boundaries | dependency-cruiser, derived from [dependency rules](architecture/dependency-rules.md) |
| Pure logic | Vitest in Node.js |
| Infrastructure integration | Vitest with real dependencies; Testcontainers and migrated PostgreSQL for persistence behavior |
| Browser-dependent component/feature behavior | Vitest Browser Mode with the Playwright provider |
| Complete browser journeys | Playwright Test; Chromium initially, additional browsers according to product requirements |
| Derived artifacts and documentation | Consistency, links, metadata, and generation checks when their canonical sources and tooling exist |

The canonical workflow must be deterministic, non-interactive, composable, and non-mutating with respect to tracked source files. Explicit formatting/fix operations remain separate. Managed generated or ignored execution artifacts are not source modifications.

Add validation capabilities only when their implementations exist. Individual responsibilities should remain independently runnable where practical. CI must invoke the same validation capabilities rather than maintain different correctness logic. See [CI policy](architecture/continuous-integration.md).

## Choosing verification

Use [testing strategy](architecture/testing-strategy.md) for risk and test-layer selection. Documentation-only work can verify links, anchors, references, decision metadata, source preservation, and the final diff without pretending runtime tests exist. Structural checks do not replace review of normative meaning or accepted ADR constraints.

As applications and packages arrive, extend these checks and add the applicable test, build, and generated-artifact checks. Update this availability section and the root command pointer in the same change. Examples of future commands in ADRs are not evidence that those commands have been implemented.
