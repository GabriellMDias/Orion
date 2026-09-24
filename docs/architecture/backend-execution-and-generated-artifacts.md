# Backend Execution and Generated Artifacts

[Documentation index](../README.md) · [Validation availability](../validation.md) · [Phase 3 plan](../implementation-plan.md#phase-3)

These are Phase 3 execution and storage conventions for the first API and its derived references. They implement existing [TypeScript/Node.js](../adr/0001-select-typescript-and-nodejs-as-primary-language-and-runtime.md), [pnpm](../adr/0002-select-pnpm-for-package-and-workspace-management.md), [API generation](../adr/0007-establish-api-contract-openapi-sdk-and-configuration-schema-strategy.md), [Prisma/PostgreSQL](../adr/0006-select-prisma-orm-for-database-access-and-migrations.md), and [validation](../adr/0003-establish-repository-validation-and-architecture-enforcement.md) decisions. The Phase 4 API scripts and configuration/error reference generators now exist; other listed artifacts remain planned. [Validation](../validation.md) lists current commands.

## API development and build

- Keep the API as an ESM TypeScript workspace application under `apps/api`. Use pnpm package scripts as the stable interface and native workspace filtering for orchestration; no dedicated monorepo task runner or backend bundler is needed initially.
- The `apps/api` scripts expose `dev` (a pinned `tsx watch` development executor), `typecheck` (`tsc --noEmit`), `build` (`tsc` emitting Node-compatible ESM JavaScript to an ignored `dist/` directory), and `start` (`node dist/main.js`). Source imports and compiler settings resolve in the emitted Node.js ESM output. `tsx` is an execution convenience, never a substitute for TypeScript checking or a production runtime dependency.
- Install dependencies from the shared frozen lockfile. Generate tool-managed Prisma client code before typecheck/build when required; keep its cache/output out of hand-edited source and commit history. Build and start must work without a development transpiler at runtime. Add smoke verification for the emitted application when the application exists.
- Extend root `pnpm validate` and the identical CI gate with application typecheck, tests, build, and generated-output freshness checks as those capabilities arrive. Keep validation non-mutating with respect to tracked source; generation is a separate explicit write command. Update [validation availability](../validation.md) when each script becomes real.

## Artifact ownership and storage

| Derived artifact | Canonical input | Planned output and handling |
| --- | --- | --- |
| OpenAPI 3.1 description | Executable TypeBox wire schemas and stable route `operationId` metadata owned by the API | Commit one deterministic `docs/generated/api/openapi.json`; clients and documentation consume that file, with no independently authored copy. |
| TypeScript API client types | Committed generated OpenAPI | When the web consumer exists, commit `packages/sdk/src/generated/api-types.ts` from `openapi-typescript`; use a thin `openapi-fetch` client outside the generated file. Do not import API implementation types into the web app. |
| API configuration reference | API-owned TypeBox bootstrap configuration schema and metadata | Committed `docs/generated/configuration/api.md` is regenerated and checked from the API source. It contains safe types/defaults, never secrets or a real `.env`. |
| API error registry reference | API-owned registry and envelope schema | Committed `docs/generated/api/errors.md` is regenerated and checked from the API source. Feature errors join the same registry when their routes exist. |
| Database reference | Migrated PostgreSQL plus canonical schema-adjacent semantic metadata; Prisma schema and reviewed migrations are inputs | Commit a navigable reference under `docs/generated/database/` when generation and migrated-database verification exist. It must include PostgreSQL objects Prisma cannot fully describe and must not be authored independently. |
| Prisma Client and emitted JavaScript | Prisma schema and TypeScript source | Generate into ignored, tool-managed outputs for each build; do not commit platform/tool-generated client code or `dist/`. Reviewed SQL migrations are authored release history, not disposable generated output. |

Mark generated files clearly and never edit them to repair a source defect. A generation command may update tracked derived artifacts intentionally; a separate check must regenerate in a temporary location or compare deterministically without changing tracked files. CI should fail on drift once each generator exists. Rebuildability does not waive public API or SDK compatibility responsibilities under [versioning](versioning-and-compatibility.md), nor the independent [migration-history rules](../database/migrations.md).

Do not create the planned files or directories as placeholders. Each artifact becomes part of the repository with its canonical source, generator, validation check, and actual consumer. The [Approval Request conventions](../domains/approval-request-implementation.md) supply the feature-specific data and contract metadata for those future generators.
