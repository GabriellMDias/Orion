# API Configuration Reference

<!-- Generated from apps/api/src/config.ts. Run pnpm --filter @orion/api references:write; do not edit. -->

[Configuration policy](../../architecture/configuration.md) · [API runtime](../../../apps/api/README.md)

No values are eligible for client exposure. `ORION_ENV` is always required; the database and token settings are required together to enable the Approval Request feature and in production.

| Environment variable | Type | Required | Default | Visibility | Purpose |
| --- | --- | --- | --- | --- | --- |
| `ORION_ENV` | development \| test \| production | yes | — | server | Runtime environment. |
| `ORION_API_HOST` | nonempty string | no | `127.0.0.1` | server | Listen address; loopback by default. |
| `ORION_API_PORT` | integer 0..65535 | no | `3000` | server | Listen port; zero selects an ephemeral port. |
| `ORION_LOG_LEVEL` | Pino level | no | `info` | server | Structured log threshold. |
| `ORION_SHUTDOWN_TIMEOUT_MS` | integer 100..30000 | no | `5000` | server | Total graceful shutdown deadline. |
| `ORION_OTLP_ENDPOINT` | http(s) URL | no | — | server | Optional OTLP HTTP collector base URL. |
| `ORION_TRACE_SAMPLE_RATIO` | number 0..1 | no | `1` | server | Trace sampling probability. |
| `ORION_DATABASE_URL` | PostgreSQL URL | no | — | server | Runtime database credential; required to activate Approval Request routes. |
| `ORION_TOKEN_ISSUER` | issuer URL | no | — | server | Expected access-token issuer; configure with audience and JWKS URL. |
| `ORION_TOKEN_AUDIENCE` | nonempty string | no | — | server | Expected API access-token audience. |
| `ORION_TOKEN_JWKS_URL` | http(s) URL | no | — | server | Trusted issuer public-key endpoint. |
