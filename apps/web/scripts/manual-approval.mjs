import setup from "../test/e2e/setup.ts";

let reportExit;
const serviceExit = new Promise((resolve) => {
  reportExit = resolve;
});
let interrupt;
const interrupted = new Promise((resolve) => {
  interrupt = () => resolve(null);
});
process.on("SIGINT", interrupt);
process.on("SIGTERM", interrupt);

let stop;
try {
  stop = await setup({
    apiEnvironment: "development",
    tokenLifetime: "1h",
    onUnexpectedExit: reportExit,
  });
  process.stdout.write(
    `Approval Request web: ${process.env.ORION_E2E_WEB_URL}\n` +
      `Approval Request API: ${process.env.ORION_E2E_API_URL}\n` +
      "Use the local owner/reviewer buttons in the web app.\n" +
      "Synthetic tokens expire after one hour. Press Ctrl+C to stop.\n",
  );
  const failure = await Promise.race([interrupted, serviceExit]);
  if (failure) throw failure;
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
} finally {
  process.off("SIGINT", interrupt);
  process.off("SIGTERM", interrupt);
  await stop?.();
}
