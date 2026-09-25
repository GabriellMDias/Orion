import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const assets = resolve(import.meta.dirname, "../dist/assets");
const scripts = readdirSync(assets).filter((name) => name.endsWith(".js"));
if (scripts.length === 0)
  throw new Error("The web build contains no JavaScript assets.");
const forbidden = [
  "ORION_DATABASE_URL",
  "ORION_MIGRATION_DATABASE_URL",
  "ORION_TOKEN_JWKS_URL",
  "@prisma/client",
  "postgresql://",
  "runtime_test",
  "node:fs",
  "__orion_local_identity",
];
for (const name of scripts) {
  const content = readFileSync(resolve(assets, name), "utf8");
  for (const marker of forbidden) {
    if (content.includes(marker))
      throw new Error(
        `Server-only marker ${marker} reached the browser bundle.`,
      );
  }
}
process.stdout.write("Web bundle contains no known server-only markers.\n");
