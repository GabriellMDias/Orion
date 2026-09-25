# SDK-local instructions

- `src/index.ts` is this package's public surface. Keep it a thin generated-contract consumer; never import API implementation or persistence modules.
- Generate `src/generated/api-types.ts` from the committed OpenAPI after changing the API's executable contracts. Do not hand-edit generated types or duplicate wire schemas here.
- Let the host supply bearer tokens through `createOrionClient`; do not add token storage, provider-specific identity, or business authorization to the SDK.
- Run `pnpm --filter @orion/sdk typecheck` and `pnpm references:check` after SDK changes, then the root `pnpm validate` before handoff.
