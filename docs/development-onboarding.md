# Development Onboarding

[Repository README](../README.md) · [Validation](validation.md) · [API runtime](../apps/api/README.md) · [Web workflow](../apps/web/README.md)

This is the reproducible local path for the current foundation. It uses disposable PostgreSQL and synthetic identities for tests; it does not require a production database, identity provider, telemetry vendor, or deployment account.

## Prepare a clean checkout

Use Node.js 24.13.0 and pnpm 11.25.0, as pinned by `.node-version` and `package.json`. Start Docker or another Testcontainers-compatible container runtime and verify that its daemon is reachable with `docker info`. From a fresh checkout, run:

```sh
pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @orion/web exec playwright install chromium
```

On Linux, use `pnpm --filter @orion/web exec playwright install --with-deps chromium` if the browser's system libraries are absent. Windows browser component tests use the installed Edge channel; Playwright end-to-end tests use Chromium. Do not put credentials in tracked files.

## Configure and run the applications

The minimal development API needs only `ORION_ENV=development`. Generate the Prisma client as above, then start the API in one terminal:

```sh
ORION_ENV=development pnpm --filter @orion/api dev
```

In PowerShell, use `$env:ORION_ENV = 'development'` followed by `pnpm --filter @orion/api dev`. The default listener is `127.0.0.1:3000`; `GET http://127.0.0.1:3000/health/ready` should return `{"status":"ok"}`. This minimal mode exposes health routes but does not enable Approval Request routes.

Start the web development server in another terminal:

```sh
pnpm --filter @orion/web dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. The web server forwards `/api` to the local API. Without an already-issued bearer token and the complete feature configuration, the reference UI stays disconnected; it does not implement login. [API configuration](generated/configuration/api.md) names the four settings required together for the feature. A real provider and user-facing token acquisition remain conditional under [H-07](human-actions.md#h-07); do not create test credentials in the repository to simulate one.

## Initialize and exercise feature data

The executable feature workflow provisions a fresh disposable PostgreSQL, applies the committed migration using a migration credential, creates a separate restricted runtime role, and uses a local signed-token issuer with synthetic human principals. No seed data or external account is needed:

```sh
pnpm build
pnpm --filter @orion/api feature:smoke
pnpm test:e2e
```

The feature smoke exercises the emitted API and a create/submit/review flow, including process interruption. The browser test builds and runs the API and web app against its own migrated PostgreSQL and verifies the owner/reviewer journey. These fixtures are disposable and are not release or production data.

If using a separate **local** PostgreSQL for manual development, create distinct migration and restricted runtime credentials before enabling the feature. Set `ORION_MIGRATION_DATABASE_URL` only for `pnpm --filter @orion/api db:migrate:deploy`; set `ORION_DATABASE_URL` only for the API runtime. Also configure the trusted token issuer, audience, and JWKS URL together as described in the [API runtime guide](../apps/api/README.md). The repository does not select or provision that issuer. Do not copy Testcontainers' synthetic credentials into a persistent environment.

## Validate, regenerate, and build

Run the full, non-mutating tracked-source gate after changes:

```sh
pnpm validate
```

It checks format, lint, types, dependency boundaries, documentation, migration release history, current generated references, real PostgreSQL and browser tests, builds, and process smokes. `pnpm references:check` can diagnose generated drift independently; it migrates a fresh PostgreSQL for the physical database reference and does not repair tracked files. To intentionally change derived references, edit their canonical TypeBox/schema/metadata sources and run `pnpm --filter @orion/api references:write`, then `pnpm --filter @orion/sdk generate` after an OpenAPI change. Review the generated diff and rerun `pnpm references:check`. Never edit generated output to hide a source mismatch.

`pnpm build` emits the API ESM and web static assets into ignored `dist/` directories and checks the browser bundle for known server-only markers. The [release evolution workflow](database/release-evolution.md) governs migrations; no durable release is recorded merely by running these commands.
