export type LifecyclePhase = "starting" | "ready" | "draining" | "stopped";

export class Lifecycle {
  #phase: LifecyclePhase = "starting";
  get phase(): LifecyclePhase {
    return this.#phase;
  }
  markReady(): void {
    if (this.#phase !== "starting")
      throw new Error("Invalid lifecycle transition");
    this.#phase = "ready";
  }
  beginDrain(): void {
    if (this.#phase === "starting" || this.#phase === "ready")
      this.#phase = "draining";
  }
  markStopped(): void {
    this.#phase = "stopped";
  }
  get startupOk(): boolean {
    return this.#phase !== "starting";
  }
  get live(): boolean {
    return this.#phase !== "stopped";
  }
  get ready(): boolean {
    return this.#phase === "ready";
  }
}

export async function withDeadline(
  work: Promise<unknown>,
  timeoutMs: number,
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Shutdown deadline exceeded")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface ClosableHttp {
  close(): Promise<unknown>;
  server: { closeAllConnections(): void };
}

export interface FlushableTelemetry {
  shutdown(): Promise<void>;
}

export async function shutdownRuntime(
  http: ClosableHttp,
  lifecycle: Lifecycle,
  telemetry: FlushableTelemetry,
  timeoutMs: number,
  reportTimeout: (boundary: "http" | "telemetry") => void,
): Promise<void> {
  lifecycle.beginDrain();
  const deadline = Date.now() + timeoutMs;
  try {
    await withDeadline(http.close(), Math.max(1, deadline - Date.now()));
  } catch {
    http.server.closeAllConnections();
    reportTimeout("http");
  }
  try {
    await withDeadline(
      telemetry.shutdown(),
      Math.max(1, deadline - Date.now()),
    );
  } catch {
    reportTimeout("telemetry");
  }
  lifecycle.markStopped();
}
