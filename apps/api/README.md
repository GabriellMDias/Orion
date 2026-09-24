# Orion API runtime

[Implementation plan](../../docs/implementation-plan.md#phase-4) · [Configuration reference](../../docs/generated/configuration/api.md) · [Error registry](../../docs/generated/api/errors.md)

This Phase 4 application is an HTTP runtime foundation. It exposes `/health/startup`, `/health/live`, and `/health/ready`; no Approval Request business route, authentication provider, persistence, or web application exists yet.

From the repository root, install the frozen lockfile and run:

```sh
pnpm --filter @orion/api dev
pnpm --filter @orion/api test
pnpm --filter @orion/api typecheck
pnpm --filter @orion/api build
pnpm --filter @orion/api start
```

Set `ORION_ENV=development` for local execution; it is the only required environment value. The server binds to `127.0.0.1:3000` by default. `start` executes emitted ESM JavaScript from ignored `dist/` and requires a preceding build. The complete configuration list and safe defaults are [generated from the API source](../../docs/generated/configuration/api.md). There are no client-eligible configuration values in this phase. Supplying `ORION_OTLP_ENDPOINT` enables OTLP HTTP trace and metric export; without it, traces retain context but are discarded locally. No collector is needed for local validation.

`main.ts` validates configuration before opening a listener, initializes logging and OpenTelemetry, and only then imports the Fastify application. Incoming W3C trace context is propagated. Every request receives a fresh server-generated `x-request-id`; errors use the [public envelope](../../docs/api/error-contract.md) and a generated [code registry](../../docs/generated/api/errors.md). Logs contain bounded operational fields, and exported spans/metric dimensions are allowlisted. The HTTP runtime does not log payloads, raw URLs, headers, or exception messages.

Startup reports initialization, liveness reports process-local health, and readiness becomes unavailable while draining. SIGINT/SIGTERM initiate a bounded shutdown: stop accepting work, close HTTP connections, then flush telemetry within the remaining deadline. The root `pnpm validate` includes tests, generated-reference freshness, an emitted build, and a real process smoke check. The smoke check uses a local OTLP receiver that rejects exports to verify request independence from telemetry delivery.
