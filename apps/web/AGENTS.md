# Web application instructions

- The generated `@orion/sdk` client is the web application's API boundary. Change the API's TypeBox contracts and regenerate OpenAPI and SDK types; never import `apps/api` implementation or edit generated types by hand.
- Keep URL-owned list scope/cursor and detail IDs in TanStack Router, API-owned state in TanStack Query, and temporary form state in React. Clear query data when the in-memory bearer token changes.
- Browser input and UI visibility do not grant permission. Keep API authorization, expected-version conflicts, and idempotency semantics visible to users without reimplementing business rules in React.
- Only the same-origin `VITE_ORION_API_BASE_URL` reaches the browser bundle. Keep access tokens in memory, never in URLs, storage, logs, or generated artifacts.
- Run `typecheck`, `build`, `test:browser`, and `test:e2e` as applicable, then the root `pnpm validate`.
