import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  configReference,
  parseServerConfig,
} from "../../apps/api/src/config.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const examplePath = path.join(root, ".env.example");
const environment = "ORION_ENV=development";

const lines = [
  "# Local API development example. Copy to .env.local; never commit real values.",
  "# The keys and safe defaults below are checked against apps/api/src/config.ts.",
  "# See docs/setup.md and docs/generated/configuration/api.md.",
  environment,
  "",
  ...configReference
    .filter(({ name }) => name !== "ORION_ENV")
    .map(({ name, default: safeDefault, purpose }) =>
      safeDefault
        ? `# ${name}=${safeDefault}  # ${purpose}`
        : `# ${name}: ${purpose}`,
    ),
  "",
];

parseServerConfig({ ORION_ENV: "development" });
const expected = lines.join("\n");
const actual = (await readFile(examplePath, "utf8")).replaceAll("\r\n", "\n");
if (actual !== expected) {
  throw new Error(
    ".env.example differs from the API configuration schema/reference; update the example and rerun pnpm env:example:check.",
  );
}
console.log(
  ".env.example matches the API configuration reference and parses safely.",
);
