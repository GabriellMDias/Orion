import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { parseServerConfig } from "../src/config.js";
import { createLogger } from "../src/logging.js";

describe("Pino redaction", () => {
  it("removes credential fields and request headers at the central logger", () => {
    const lines: string[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(String(chunk));
        callback();
      },
    });
    const logger = createLogger(
      parseServerConfig({ ORION_ENV: "test" }),
      destination,
    );
    logger.info(
      {
        auth: { token: "secret-token" },
        req: { headers: { authorization: "Bearer secret" } },
        requestId: "req_safe",
      },
      "safe_event",
    );
    const output = lines.join("");
    expect(output).toContain("req_safe");
    expect(output).not.toContain("secret-token");
    expect(output).not.toContain("Bearer secret");
    expect(output).toContain("[REDACTED]");
  });
});
