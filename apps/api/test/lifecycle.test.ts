import { describe, expect, it, vi } from "vitest";
import { Lifecycle, shutdownRuntime } from "../src/lifecycle.js";

describe("bounded lifecycle", () => {
  it("drains HTTP before telemetry and stops after cleanup", async () => {
    const lifecycle = new Lifecycle();
    lifecycle.markReady();
    const calls: string[] = [];
    const http = {
      close: () => {
        expect(lifecycle.phase).toBe("draining");
        calls.push("http");
        return Promise.resolve();
      },
      server: { closeAllConnections: vi.fn() },
    };
    const telemetry = {
      shutdown: () => {
        calls.push("telemetry");
        return Promise.resolve();
      },
    };
    await shutdownRuntime(http, lifecycle, telemetry, 1000, vi.fn());
    expect(calls).toEqual(["http", "telemetry"]);
    expect(lifecycle.phase).toBe("stopped");
  });

  it("caps hanging HTTP and telemetry cleanup and forces connections closed", async () => {
    const lifecycle = new Lifecycle();
    lifecycle.markReady();
    const forced = vi.fn();
    const boundaries: string[] = [];
    const never = () => new Promise<void>(() => undefined);
    const started = Date.now();
    await shutdownRuntime(
      { close: never, server: { closeAllConnections: forced } },
      lifecycle,
      { shutdown: never },
      120,
      (boundary) => boundaries.push(boundary),
    );
    expect(Date.now() - started).toBeLessThan(1000);
    expect(forced).toHaveBeenCalledOnce();
    expect(boundaries).toEqual(["http", "telemetry"]);
    expect(lifecycle.phase).toBe("stopped");
  });
});
