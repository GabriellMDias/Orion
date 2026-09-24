import { parseServerConfig } from "./config.js";
import { createLogger } from "./logging.js";
import { shutdownRuntime } from "./lifecycle.js";
import { initializeTelemetry } from "./telemetry.js";

const config = parseServerConfig(process.env);
const logger = createLogger(config);
const telemetry = initializeTelemetry(config, logger);
// Load Fastify and the application only after instrumentation is registered.
const { createApp } = await import("./app.js");
const { createRepository } =
  await import("./features/approval-requests/prisma-repository.js");
const { ApprovalRequestService } =
  await import("./features/approval-requests/service.js");
const { createAccessTokenVerifier } =
  await import("./features/approval-requests/authentication.js");
const repository = config.databaseUrl
  ? createRepository(config.databaseUrl)
  : undefined;
const feature =
  repository &&
  config.tokenIssuer &&
  config.tokenAudience &&
  config.tokenJwksUrl
    ? {
        service: new ApprovalRequestService(repository),
        checkReady: async () => {
          try {
            await repository.db.$queryRaw`SELECT 1`;
            return true;
          } catch {
            return false;
          }
        },
        verifier: createAccessTokenVerifier({
          issuer: config.tokenIssuer,
          audience: config.tokenAudience,
          jwksUrl: config.tokenJwksUrl,
        }),
      }
    : undefined;
const { app, lifecycle } = createApp(logger, undefined, feature);
const resources = {
  shutdown: async () => {
    try {
      await repository?.db.$disconnect();
    } finally {
      await telemetry.shutdown();
    }
  },
};

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutdown_started");
  await shutdownRuntime(
    app,
    lifecycle,
    resources,
    config.shutdownTimeoutMs,
    (boundary) => logger.warn({ boundary }, "shutdown_deadline_exceeded"),
  );
  process.exitCode = 0;
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  if (repository) await repository.db.$queryRaw`SELECT 1`;
  await app.listen({ host: config.host, port: config.port });
  lifecycle.markReady();
  logger.info(
    { address: app.server.address(), environment: config.environment },
    "api_ready",
  );
} catch {
  logger.fatal("api_startup_failed");
  await shutdownRuntime(
    app,
    lifecycle,
    resources,
    config.shutdownTimeoutMs,
    () => logger.warn("startup_cleanup_deadline_exceeded"),
  );
  process.exitCode = 1;
}
