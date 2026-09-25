# Orion API SDK

[Executable API contracts](../../apps/api/src/features/approval-requests/contracts.ts) · [Generated OpenAPI](../../docs/generated/api/openapi.json) · [API policy](../../docs/api/principles.md) · [Web consumer](../../apps/web/README.md)

`@orion/sdk` is the workspace client boundary for the current API. Its public surface is [`src/index.ts`](src/index.ts): `createOrionClient(baseUrl, getAccessToken)`, its return type, and generated `paths` types. The host application supplies the bearer token through a callback; the SDK does not issue, refresh, persist, or log credentials. It contains no business authorization rules or provider-specific identity model.

The API owns TypeBox wire contracts and stable operation IDs. OpenAPI is generated from them; `openapi-typescript` produces [`src/generated/api-types.ts`](src/generated/api-types.ts) from the committed OpenAPI. Do not edit generated types or copy API implementation models into this package.

From the repository root, run `pnpm --filter @orion/sdk generate` after an intentional OpenAPI change, then `pnpm references:check` and `pnpm --filter @orion/sdk typecheck`. The root `pnpm validate` also checks the generated client and web consumer. This package is private and has no independent published compatibility promise; real independently released consumers would activate the [compatibility policy](../../docs/architecture/versioning-and-compatibility.md) and [H-08](../../docs/human-actions.md#h-08).
