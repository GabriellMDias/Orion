import { spawn, execFile, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { createServer as createNetServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import pg from "pg";
import { GenericContainer, Wait } from "testcontainers";

const run = promisify(execFile);
const webRoot = resolve(import.meta.dirname, "../..");
const repoRoot = resolve(webRoot, "../..");
const apiRoot = resolve(repoRoot, "apps/api");

async function freePort() {
  const listener = createNetServer();
  await new Promise<void>((ready) => listener.listen(0, "127.0.0.1", ready));
  const address = listener.address();
  if (!address || typeof address === "string")
    throw new Error("No available test port.");
  await new Promise<void>((done) => listener.close(() => done()));
  return address.port;
}

function watchService(name: string, child: ChildProcess, secrets: string[]) {
  let diagnostics = "";
  let failure: Error | undefined;
  let onFailure: ((error: Error) => void) | undefined;
  function append(chunk: Buffer) {
    diagnostics = (diagnostics + chunk.toString()).slice(-8_000);
  }
  function safeDiagnostics() {
    let safeOutput = diagnostics;
    for (const secret of secrets)
      safeOutput = safeOutput.replaceAll(secret, "[redacted]");
    return safeOutput
      .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted database URL]")
      .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
      .replace(
        /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
        "[redacted token]",
      );
  }
  function fail(reason: string) {
    if (failure) return;
    const safeOutput = safeDiagnostics();
    failure = new Error(
      `${name} ${reason}${safeOutput ? `\nRecent output:\n${safeOutput}` : ""}`,
    );
    onFailure?.(failure);
  }
  child.stdout?.on("data", append);
  child.stderr?.on("data", append);
  child.once("error", (error) => fail(`failed to start: ${error.message}`));
  child.once("close", (code, signal) =>
    fail(`exited (code ${code ?? "none"}, signal ${signal ?? "none"})`),
  );
  return {
    get failure() {
      return failure;
    },
    safeDiagnostics,
    onFailure(callback: (error: Error) => void) {
      onFailure = callback;
      if (failure) callback(failure);
    },
  };
}

async function waitFor(url: string, service: ReturnType<typeof watchService>) {
  for (let attempt = 0; attempt < 300; attempt++) {
    if (service.failure) throw service.failure;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      /* Service startup is still in progress. */
    }
    await delay(100);
  }
  const output = service.safeDiagnostics();
  throw new Error(
    `Test service did not become ready: ${url}.${output ? `\nRecent output:\n${output}` : ""}`,
  );
}

export default async function setup({
  tokenLifetime = "15m",
  apiEnvironment = "test",
  onUnexpectedExit,
}: {
  tokenLifetime?: string;
  apiEnvironment?: "development" | "test";
  onUnexpectedExit?: (error: Error) => void;
} = {}) {
  const container = await new GenericContainer("postgres:16")
    .withEnvironment({
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "orion",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage("database system is ready to accept connections", 2),
    )
    .start();
  let jwks: Server | undefined;
  let api: ChildProcess | undefined;
  let web: ChildProcess | undefined;
  let shuttingDown = false;
  let cleanupTask: Promise<void> | undefined;
  function stopResources() {
    cleanupTask ??= (async () => {
      shuttingDown = true;
      delete process.env.ORION_E2E_OWNER_TOKEN;
      delete process.env.ORION_E2E_REVIEWER_TOKEN;
      web?.kill();
      api?.kill();
      const results = await Promise.allSettled([
        jwks
          ? new Promise<void>((done, fail) =>
              jwks!.close((error) => (error ? fail(error) : done())),
            )
          : Promise.resolve(),
        container.stop(),
      ]);
      const failures: unknown[] = [];
      for (const result of results)
        if (result.status === "rejected") failures.push(result.reason);
      if (failures.length)
        throw new AggregateError(failures, "Local resource cleanup failed.");
    })();
    return cleanupTask;
  }
  try {
    const host = container.getHost();
    const port = container.getMappedPort(5432);
    const migrationUrl = `postgresql://postgres:test@${host}:${port}/orion`;
    const runtimeUrl = `postgresql://orion_runtime:runtime_test@${host}:${port}/orion`;
    await run(
      process.execPath,
      [
        resolve(apiRoot, "node_modules/prisma/build/index.js"),
        "migrate",
        "deploy",
      ],
      {
        cwd: apiRoot,
        env: { ...process.env, ORION_MIGRATION_DATABASE_URL: migrationUrl },
        timeout: 90_000,
      },
    );
    const admin = new pg.Client({ connectionString: migrationUrl });
    await admin.connect();
    try {
      await admin.query(
        "CREATE ROLE orion_runtime LOGIN PASSWORD 'runtime_test'",
      );
      await admin.query("GRANT USAGE ON SCHEMA public TO orion_runtime");
      await admin.query(
        "GRANT SELECT, INSERT ON approval_requests TO orion_runtime",
      );
      await admin.query(
        "GRANT UPDATE (title, description, status, version, rejection_reason, updated_at) ON approval_requests TO orion_runtime",
      );
    } finally {
      await admin.end();
    }

    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const webPort = await freePort();
    const browserOrigin = `http://127.0.0.1:${webPort}`;
    let ownerToken = "";
    let reviewerToken = "";
    jwks = createServer((request, response) => {
      response.setHeader("content-type", "application/json");
      response.setHeader("cache-control", "no-store");
      response.setHeader("x-content-type-options", "nosniff");
      if (request.method === "GET" && request.url === "/jwks") {
        response.end(
          JSON.stringify({
            keys: [{ ...jwk, alg: "RS256", kid: "e2e", use: "sig" }],
          }),
        );
      } else if (
        request.method === "GET" &&
        request.url === "/local-identity/available"
      ) {
        response.end(JSON.stringify({ available: true }));
      } else if (
        request.method === "POST" &&
        (request.url === "/local-identity/owner" ||
          request.url === "/local-identity/reviewer")
      ) {
        if (request.headers.origin !== browserOrigin) {
          response.statusCode = 403;
          response.end(JSON.stringify({ error: "Forbidden" }));
          return;
        }
        response.end(
          JSON.stringify({
            accessToken:
              request.url === "/local-identity/owner"
                ? ownerToken
                : reviewerToken,
          }),
        );
      } else {
        response.statusCode = 404;
        response.end(JSON.stringify({ error: "Not found" }));
      }
    });
    await new Promise<void>((ready) => jwks!.listen(0, "127.0.0.1", ready));
    const address = jwks.address();
    if (!address || typeof address === "string")
      throw new Error("No JWKS test port.");
    const issuer = "https://synthetic-browser-issuer.example.test/";
    async function token(id: string, review: boolean) {
      return new SignJWT({
        sub: `synthetic-${id}`,
        orion_principal_id: id,
        orion_actor_type: "human",
        scope: review ? "approval:review" : "",
      })
        .setProtectedHeader({ alg: "RS256", typ: "at+jwt", kid: "e2e" })
        .setIssuer(issuer)
        .setAudience("orion-api")
        .setIssuedAt()
        .setExpirationTime(tokenLifetime)
        .sign(privateKey);
    }
    ownerToken = await token(randomUUID(), false);
    reviewerToken = await token(randomUUID(), true);
    const apiPort = await freePort();
    api = spawn(process.execPath, [resolve(apiRoot, "dist/main.js")], {
      cwd: apiRoot,
      env: {
        ...process.env,
        ORION_ENV: apiEnvironment,
        ORION_API_PORT: String(apiPort),
        ORION_DATABASE_URL: runtimeUrl,
        ORION_TOKEN_ISSUER: issuer,
        ORION_TOKEN_AUDIENCE: "orion-api",
        ORION_TOKEN_JWKS_URL: `http://127.0.0.1:${address.port}/jwks`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const sensitiveValues = [
      migrationUrl,
      runtimeUrl,
      ownerToken,
      reviewerToken,
    ];
    const apiService = watchService("API", api, sensitiveValues);
    await waitFor(`http://127.0.0.1:${apiPort}/health/ready`, apiService);
    web = spawn(
      process.execPath,
      [
        resolve(webRoot, "node_modules/vite/bin/vite.js"),
        "--host",
        "127.0.0.1",
        "--port",
        String(webPort),
        "--strictPort",
      ],
      {
        cwd: webRoot,
        env: {
          ...process.env,
          ORION_WEB_API_TARGET: `http://127.0.0.1:${apiPort}`,
          ORION_WEB_LOCAL_IDENTITY_TARGET: `http://127.0.0.1:${address.port}`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const webService = watchService("Web", web, sensitiveValues);
    await waitFor(`http://127.0.0.1:${webPort}/`, webService);
    if (onUnexpectedExit) {
      const report = (error: Error) => {
        if (!shuttingDown) onUnexpectedExit(error);
      };
      apiService.onFailure(report);
      webService.onFailure(report);
    }
    process.env.ORION_E2E_OWNER_TOKEN = ownerToken;
    process.env.ORION_E2E_REVIEWER_TOKEN = reviewerToken;
    process.env.ORION_E2E_WEB_URL = `http://127.0.0.1:${webPort}`;
    process.env.ORION_E2E_API_URL = `http://127.0.0.1:${apiPort}`;
    return stopResources;
  } catch (error) {
    try {
      await stopResources();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Setup and cleanup failed.",
        { cause: cleanupError },
      );
    }
    throw error;
  }
}
