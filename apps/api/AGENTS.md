# API-local instructions

- The composition root is `src/main.ts`: parse configuration, initialize Pino and OpenTelemetry, then dynamically load Fastify and compose `src/app.ts`. Preserve that order when adding instrumented infrastructure.
- Keep `src/config.ts` as the only environment parser; add schema and reference metadata together. Client-eligible values must pass through `clientConfigFrom` explicitly.
- Register transport routes and TypeBox wire schemas at the Fastify boundary. Keep Approval Request business rules and application operations independent of Fastify and Prisma; the repository adapter owns PostgreSQL calls and conditional writes.
- Keep `prisma/schema.prisma`, reviewed SQL migrations, and `prisma/schema-metadata.json` synchronized. Generate the ignored Prisma client with `pnpm db:generate`; use `ORION_MIGRATION_DATABASE_URL` only for the Prisma CLI and `ORION_DATABASE_URL` only at runtime. Regenerate API/database/configuration/error references through `references:write`, and let `references:check` detect drift against a freshly migrated Testcontainers PostgreSQL.
- Use `pnpm --filter @orion/api test`, `typecheck`, and `build`; run the root `pnpm validate` before handoff.
- Log only allowlisted operational fields. Never attach request bodies, raw URLs, headers, configuration objects, or arbitrary exception messages to logs or spans. Keep expected failures explicit and unexpected failures to one diagnostic event.
