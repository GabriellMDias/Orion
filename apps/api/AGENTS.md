# API-local instructions

- The composition root is `src/main.ts`: parse configuration, initialize Pino and OpenTelemetry, then dynamically load Fastify and compose `src/app.ts`. Preserve that order when adding instrumented infrastructure.
- Keep `src/config.ts` as the only environment parser; add schema and reference metadata together. Client-eligible values must pass through `clientConfigFrom` explicitly.
- Register transport routes and TypeBox wire schemas at the Fastify boundary. Keep business rules out of transport code when Phase 5 introduces the Approval Request feature.
- Use `pnpm --filter @orion/api test`, `typecheck`, and `build`; run the root `pnpm validate` before handoff. Edit configuration/error sources, run `pnpm --filter @orion/api references:write`, and let `references:check` detect drift.
- Log only allowlisted operational fields. Never attach request bodies, raw URLs, headers, configuration objects, or arbitrary exception messages to logs or spans. Keep expected failures explicit and unexpected failures to one diagnostic event.
