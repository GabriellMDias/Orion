import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import test from "node:test";
import { checkReleaseHistory } from "./release-history.ts";

const migration = "20260924000000_approval_requests";
const sqlPath = `apps/api/prisma/migrations/${migration}/migration.sql`;
const registryPath = "apps/api/prisma/release-history.json";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "orion-release-check-"));
  function write(path: string, content: string) {
    const target = resolve(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  function git(...args: string[]) {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  }
  function commit() {
    git("add", ".");
    git(
      "-c",
      "user.name=Orion Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "-m",
      "fixture",
    );
    return git("rev-parse", "HEAD");
  }
  function cleanup() {
    if (!root.startsWith(`${resolve(tmpdir())}${sep}`))
      throw new Error("Test directory escaped the temporary root");
    rmSync(root, { recursive: true, force: true });
  }
  git("init", "-q");
  write(sqlPath, "CREATE TABLE example (id integer);\n");
  write(
    registryPath,
    JSON.stringify({ schemaVersion: 1, recordedDurableReleases: [] }),
  );
  return { root, write, commit, cleanup };
}

void test("an empty registry records no release without constraining unreleased SQL", () => {
  const state = fixture();
  try {
    assert.equal(checkReleaseHistory(state.root), 0);
    state.write(sqlPath, "CREATE TABLE example (id bigint);\n");
    assert.equal(checkReleaseHistory(state.root), 0);
  } finally {
    state.cleanup();
  }
});

void test("released SQL stays byte-identical across edits while new unreleased SQL can evolve", () => {
  const state = fixture();
  try {
    const releaseCommit = state.commit();
    const sql = readFileSync(resolve(state.root, sqlPath), "utf8");
    const sha256 = createHash("sha256").update(sql).digest("hex");
    state.write(
      registryPath,
      JSON.stringify({
        schemaVersion: 1,
        recordedDurableReleases: [
          {
            id: "release-1",
            environment: "durable-test",
            gitCommit: releaseCommit,
            migrations: [{ directory: migration, sha256 }],
          },
        ],
      }),
    );
    assert.equal(checkReleaseHistory(state.root, releaseCommit), 1);
    state.write(sqlPath, sql.replaceAll("\n", "\r\n"));
    assert.equal(checkReleaseHistory(state.root, releaseCommit), 1);
    state.write(sqlPath, sql);
    state.write(
      "apps/api/prisma/migrations/20260925000000_new/migration.sql",
      "CREATE TABLE newer (id integer);\n",
    );
    assert.equal(checkReleaseHistory(state.root, releaseCommit), 1);
    state.write(sqlPath, "CREATE TABLE example (id bigint);\n");
    assert.throws(
      () => checkReleaseHistory(state.root, releaseCommit),
      /Released migration changed/,
    );
    state.write(sqlPath, sql);
    const registryCommit = state.commit();
    state.write(
      registryPath,
      JSON.stringify({ schemaVersion: 1, recordedDurableReleases: [] }),
    );
    assert.throws(
      () => checkReleaseHistory(state.root, registryCommit),
      /cannot be changed or removed/,
    );
  } finally {
    state.cleanup();
  }
});
