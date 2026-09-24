# Orion API runtime

[Phase 5 plan](../../docs/implementation-plan.md#phase-5) · [Approval Request specification](../../docs/domains/approval-request.md) · [OpenAPI](../../docs/generated/api/openapi.json) · [Configuration reference](../../docs/generated/configuration/api.md) · [Error registry](../../docs/generated/api/errors.md)

The Fastify API exposes health routes and the authenticated Approval Request feature. The feature persists its current state in PostgreSQL through Prisma 7. There is no login, password, refresh-token, provider-specific session, web application, or generated frontend client.

From the repository root, install the frozen lockfile and run:

```sh
pnpm --filter @orion/api dev
pnpm --filter @orion/api db:generate
pnpm --filter @orion/api db:migrate:deploy
pnpm --filter @orion/api test
pnpm --filter @orion/api typecheck
pnpm --filter @orion/api build
pnpm --filter @orion/api start
```

`ORION_ENV` is always required. Development and test may run the health-only foundation without feature configuration. Production requires all of `ORION_DATABASE_URL`, `ORION_TOKEN_ISSUER`, `ORION_TOKEN_AUDIENCE`, and `ORION_TOKEN_JWKS_URL`. The four values are also required together to enable the feature in development or test. `ORION_DATABASE_URL` is the restricted runtime PostgreSQL credential. `ORION_MIGRATION_DATABASE_URL` is read only by the Prisma CLI for `db:migrate:deploy` and must use a separately controlled migration role. Keep both out of tracked files. The [generated configuration reference](../../docs/generated/configuration/api.md) lists other safe settings.

The runtime role needs `USAGE` on the application schema, `SELECT` and `INSERT` on `approval_requests`, and column-level `UPDATE` only for `title`, `description`, `status`, `version`, `rejection_reason`, and `updated_at`. It needs no DDL or `DELETE` grant and cannot change the immutable ID, creator, creation intent, or creation timestamp. The Testcontainers fixture provisions this restricted role separately from the migration role and verifies these denials.

The bearer boundary accepts verified `at+jwt` access tokens signed with RS256 or ES256 by the configured issuer, with the configured audience and a non-expired `exp`. It requires a trusted `orion_principal_id` UUID claim, stable across identity-provider changes, and `orion_actor_type=human`; machine tokens are denied. It reads the `approval:review` capability from the space-delimited `scope` claim. A future concrete provider must arrange this mapping; no provider is selected or provisioned by this phase. Tests sign synthetic tokens against a local JWKS server and use synthetic application principals. The service never accepts owner identity or capability from an API body.

The [executable contracts](src/features/approval-requests/contracts.ts) own the eight feature routes, typed requests/responses, stable operation IDs, and expected errors. Create requires `Idempotency-Key`; edits and transitions require `expectedVersion`. The [generated OpenAPI 3.1 reference](../../docs/generated/api/openapi.json) includes health and feature operations. The [generated database reference](../../docs/generated/database/approval-requests.md) comes from a fresh PostgreSQL migrated by the committed SQL plus [schema-adjacent semantic metadata](prisma/schema-metadata.json). Run `pnpm --filter @orion/api references:write` only to intentionally regenerate tracked references; `references:check` starts a disposable Testcontainers PostgreSQL and compares without modifying tracked files. Tests also start an isolated migrated database and prove the runtime role cannot perform DDL. Docker or another Testcontainers-compatible runtime must be available for those checks.

`main.ts` validates configuration before opening a listener, initializes logging and OpenTelemetry, and only then imports the Fastify application. Incoming W3C trace context is propagated. Every request receives a fresh server-generated `x-request-id`; errors use the [public envelope](../../docs/api/error-contract.md) and a generated [code registry](../../docs/generated/api/errors.md). Logs contain bounded operational fields, and exported spans/metric dimensions are allowlisted. The HTTP runtime does not log payloads, raw URLs, headers, or exception messages.

Startup reports initialization, liveness reports process-local health, and readiness becomes unavailable while draining or when the required database is unavailable. The database is probed before the listener becomes ready and in a bounded readiness check. SIGINT/SIGTERM initiate a bounded shutdown of HTTP, the database adapter, and telemetry. The root `pnpm validate` includes real migrated-PostgreSQL tests, generated-reference freshness, an emitted build, and a real-process feature smoke.
