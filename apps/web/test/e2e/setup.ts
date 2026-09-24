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

async function waitFor(url: string, child: ChildProcess) {
  let diagnostics = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    diagnostics = (diagnostics + chunk.toString()).slice(-12_000);
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    diagnostics = (diagnostics + chunk.toString()).slice(-12_000);
  });
  for (let attempt = 0; attempt < 300; attempt++) {
    if (child.exitCode !== null)
      throw new Error(
        `Test service exited before ${url} became ready. ${diagnostics}`,
      );
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      /* Service startup is still in progress. */
    }
    await delay(100);
  }
  throw new Error(`Test service did not become ready: ${url}. ${diagnostics}`);
}

export default async function setup() {
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
    jwks = createServer((_request, response) =>
      response.setHeader("content-type", "application/json").end(
        JSON.stringify({
          keys: [{ ...jwk, alg: "RS256", kid: "e2e", use: "sig" }],
        }),
      ),
    );
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
        .setExpirationTime("15m")
        .sign(privateKey);
    }
    process.env.ORION_E2E_OWNER_TOKEN = await token(randomUUID(), false);
    process.env.ORION_E2E_REVIEWER_TOKEN = await token(randomUUID(), true);
    const apiPort = await freePort();
    api = spawn(process.execPath, [resolve(apiRoot, "dist/main.js")], {
      cwd: apiRoot,
      env: {
        ...process.env,
        ORION_ENV: "test",
        ORION_API_PORT: String(apiPort),
        ORION_DATABASE_URL: runtimeUrl,
        ORION_TOKEN_ISSUER: issuer,
        ORION_TOKEN_AUDIENCE: "orion-api",
        ORION_TOKEN_JWKS_URL: `http://127.0.0.1:${address.port}/jwks`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    await waitFor(`http://127.0.0.1:${apiPort}/health/ready`, api);
    const webPort = await freePort();
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
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    await waitFor(`http://127.0.0.1:${webPort}/`, web);
    process.env.ORION_E2E_WEB_URL = `http://127.0.0.1:${webPort}`;
    process.env.ORION_E2E_API_URL = `http://127.0.0.1:${apiPort}`;
    return async () => {
      web?.kill();
      api?.kill();
      if (jwks) await new Promise<void>((done) => jwks!.close(() => done()));
      await container.stop();
    };
  } catch (error) {
    web?.kill();
    api?.kill();
    if (jwks) await new Promise<void>((done) => jwks!.close(() => done()));
    await container.stop();
    throw error;
  }
}
