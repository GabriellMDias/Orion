import { defineConfig } from "prisma/config";

// The CLI owns migration credentials; runtime configuration lives in src/config.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.ORION_MIGRATION_DATABASE_URL ?? "" },
});
