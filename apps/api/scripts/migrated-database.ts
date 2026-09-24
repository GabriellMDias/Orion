import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { GenericContainer, Wait } from "testcontainers";
import pg from "pg";

const run = promisify(execFile);
const appRoot = resolve(import.meta.dirname, "..");

export async function withMigratedDatabase<T>(
  work: (runtimeUrl: string, migrationUrl: string) => Promise<T>,
): Promise<T> {
  const container = await new GenericContainer("postgres:16")
    .withEnvironment({
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "orion",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage("database system is ready to accept connections"),
    )
    .start();
  try {
    const url = `postgresql://postgres:test@${container.getHost()}:${container.getMappedPort(5432)}/orion`;
    await run(
      process.execPath,
      [
        resolve(appRoot, "node_modules/prisma/build/index.js"),
        "migrate",
        "deploy",
      ],
      {
        cwd: appRoot,
        env: { ...process.env, ORION_MIGRATION_DATABASE_URL: url },
        timeout: 90_000,
      },
    );
    const admin = new pg.Client({ connectionString: url });
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
    const runtimeUrl = `postgresql://orion_runtime:runtime_test@${container.getHost()}:${container.getMappedPort(5432)}/orion`;
    return await work(runtimeUrl, url);
  } finally {
    await container.stop();
  }
}
