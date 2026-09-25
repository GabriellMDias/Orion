import { describe, expect, it } from "vitest";
import { ApiFailure, failureMessage, unwrap } from "../src/api.js";

describe("API error boundary", () => {
  it("preserves an unknown safe code and request ID without trusting its message", () => {
    const response = new Response(null, { status: 409 });
    const error = {
      error: {
        code: "FUTURE_SAFE_CODE",
        message: "Untrusted detail",
        requestId: "req-test",
      },
    };
    try {
      unwrap({ error, response });
      throw new Error("Expected API failure");
    } catch (caught) {
      expect(caught).toBeInstanceOf(ApiFailure);
      const failure = caught as ApiFailure;
      expect(failure.code).toBe("FUTURE_SAFE_CODE");
      expect(failure.requestId).toBe("req-test");
      expect(failureMessage(failure)).toBe(
        "The request could not be completed.",
      );
    }
  });
  it("treats a lost mutation response and server failure as unknown outcomes", () => {
    const networkFailure = new TypeError("synthetic network disconnect");
    expect(failureMessage(networkFailure, "create")).toContain(
      "same idempotency key",
    );
    expect(failureMessage(networkFailure, "write")).toContain(
      "Reload the request",
    );
    expect(
      failureMessage(
        new ApiFailure(503, "SERVICE_UNAVAILABLE", null, "Unavailable"),
        "write",
      ),
    ).toContain("outcome is unknown");
    expect(failureMessage(networkFailure, "read")).toContain("try again");
  });
});
