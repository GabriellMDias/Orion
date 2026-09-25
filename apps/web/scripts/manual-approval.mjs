import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import setup from "../test/e2e/setup.ts";

const tokenDirectory = resolve(import.meta.dirname, "../../../.orion-local");
const ownerTokenFile = resolve(tokenDirectory, "owner-token.txt");
const reviewerTokenFile = resolve(tokenDirectory, "reviewer-token.txt");

const stop = await setup({
  apiEnvironment: "development",
  tokenLifetime: "1h",
});

try {
  await mkdir(tokenDirectory, { recursive: true, mode: 0o700 });
  await writeFile(ownerTokenFile, process.env.ORION_E2E_OWNER_TOKEN, {
    mode: 0o600,
  });
  await writeFile(reviewerTokenFile, process.env.ORION_E2E_REVIEWER_TOKEN, {
    mode: 0o600,
  });
  process.stdout.write(
    `Approval Request web: ${process.env.ORION_E2E_WEB_URL}\n` +
      `Approval Request API: ${process.env.ORION_E2E_API_URL}\n` +
      `Owner token file: ${ownerTokenFile}\n` +
      `Reviewer token file: ${reviewerTokenFile}\n` +
      "Synthetic tokens expire after one hour. Press Ctrl+C to stop.\n",
  );
  await new Promise((done) => {
    process.once("SIGINT", done);
    process.once("SIGTERM", done);
  });
} finally {
  delete process.env.ORION_E2E_OWNER_TOKEN;
  delete process.env.ORION_E2E_REVIEWER_TOKEN;
  try {
    await Promise.all([
      rm(ownerTokenFile, { force: true }),
      rm(reviewerTokenFile, { force: true }),
    ]);
  } finally {
    await stop();
  }
}
