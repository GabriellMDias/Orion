# API Configuration Reference

<!-- Generated from apps/api/src/config.ts. Run pnpm --filter @orion/api references:write; do not edit. -->

[Configuration policy](../../architecture/configuration.md) · [API runtime](../../../apps/api/README.md)

No values are currently eligible for client exposure. Only `ORION_ENV` is required; all other values have safe defaults.

| Environment variable | Type | Required | Default | Visibility | Purpose |
| --- | --- | --- | --- | --- | --- |
| `ORION_ENV` | development \| test \| production | yes | — | server | Runtime environment. |
| `ORION_API_HOST` | nonempty string | no | `127.0.0.1` | server | Listen address; loopback by default. |
| `ORION_API_PORT` | integer 0..65535 | no | `3000` | server | Listen port; zero selects an ephemeral port. |
| `ORION_LOG_LEVEL` | Pino level | no | `info` | server | Structured log threshold. |
| `ORION_SHUTDOWN_TIMEOUT_MS` | integer 100..30000 | no | `5000` | server | Total graceful shutdown deadline. |
| `ORION_OTLP_ENDPOINT` | http(s) URL | no | — | server | Optional OTLP HTTP collector base URL. |
| `ORION_TRACE_SAMPLE_RATIO` | number 0..1 | no | `1` | server | Trace sampling probability. |
