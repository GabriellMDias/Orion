const error = (name, comment, from, to) => ({
  name,
  comment,
  severity: "error",
  from,
  to,
});

export default {
  forbidden: [
    error(
      "no-circular-dependencies",
      "Circular dependencies violate Orion boundaries.",
      {},
      { circular: true },
    ),
    error(
      "no-unresolved-dependencies",
      "Imports must resolve to declared or local modules.",
      {},
      { couldNotResolve: true },
    ),
    error(
      "no-cross-application-imports",
      "Applications communicate through contracts, not another application's implementation.",
      { path: "^apps/([^/]+)/.+" },
      { path: "^apps/[^/]+/.+", pathNot: "^apps/$1/.+" },
    ),
    error(
      "no-package-to-application",
      "Shared packages must not depend on applications.",
      { path: "^packages/" },
      { path: "^apps/" },
    ),
    error(
      "no-runtime-to-tooling",
      "Application and package runtime code must not import repository tooling.",
      { path: "^(apps|packages)/" },
      { path: "^tooling/" },
    ),
    error(
      "no-runtime-to-infra",
      "Runtime code must not import infrastructure definitions.",
      { path: "^(apps|packages)/" },
      { path: "^infra/" },
    ),
    error(
      "no-client-to-server",
      "Client code must not import server-only capabilities.",
      { path: "^apps/(web|mobile|desktop)/" },
      { path: "^(apps/api|packages/database)/" },
    ),
    error(
      "no-domain-to-infrastructure",
      "Domain code must stay independent of HTTP, persistence, and infrastructure adapters.",
      { path: "^(apps|packages)/.+/domain/" },
      {
        path: "(^|/)(infrastructure|transport|persistence)/|^packages/database/",
      },
    ),
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude:
      "(^|/)(node_modules|coverage|test-results|playwright-report|generated)/",
    tsConfig: { fileName: "tsconfig.json" },
  },
};
