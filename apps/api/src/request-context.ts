import { context, trace } from "@opentelemetry/api";

export function currentTraceId(): string | undefined {
  const id = trace.getSpan(context.active())?.spanContext().traceId;
  return id && id !== "00000000000000000000000000000000" ? id : undefined;
}
