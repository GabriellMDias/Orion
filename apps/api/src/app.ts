import { randomUUID } from "node:crypto";
import { context, trace } from "@opentelemetry/api";
import { Type } from "typebox";
import Fastify, { LogController } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { Logger } from "pino";
import { publicError, type ErrorCode } from "./errors.js";
import { Lifecycle } from "./lifecycle.js";

const healthSchema = Type.Object({
  status: Type.Union([Type.Literal("ok"), Type.Literal("unavailable")]),
});

class SafeLogController extends LogController {
  constructor() {
    super({ disableRequestLogging: true });
  }
}

function currentTraceId(): string | undefined {
  const id = trace.getSpan(context.active())?.spanContext().traceId;
  return id && id !== "00000000000000000000000000000000" ? id : undefined;
}

export function createApp(logger: Logger, lifecycle = new Lifecycle()) {
  const app = Fastify({
    loggerInstance: logger,
    logController: new SafeLogController(),
    genReqId: () => `req_${randomUUID()}`,
    requestTimeout: 30_000,
    connectionTimeout: 10_000,
  }).withTypeProvider<TypeBoxTypeProvider>();

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
    if (
      (lifecycle.phase === "draining" || lifecycle.phase === "stopped") &&
      !request.url.startsWith("/health/")
    ) {
      reply
        .code(503)
        .send(publicError("SERVICE_UNAVAILABLE", request.id, currentTraceId()));
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    // Never log URL, headers, bodies, or arbitrary errors here.
    request.log.info(
      {
        requestId: request.id,
        traceId: currentTraceId(),
        statusCode: reply.statusCode,
      },
      "http_request",
    );
  });

  app.setErrorHandler((error, request, reply) => {
    const validation =
      typeof error === "object" && error !== null && "validation" in error;
    const code: ErrorCode = validation ? "VALIDATION_FAILED" : "INTERNAL_ERROR";
    const errorId = validation ? undefined : `err_${randomUUID()}`;
    if (errorId) {
      // One authoritative diagnostic; arbitrary exception messages/stacks may contain secrets.
      const safeErrorType =
        error instanceof Error &&
        [
          "Error",
          "TypeError",
          "RangeError",
          "SyntaxError",
          "ReferenceError",
        ].includes(error.name)
          ? error.name
          : "UnhandledError";
      request.log.error(
        {
          requestId: request.id,
          traceId: currentTraceId(),
          errorId,
          errorType: safeErrorType,
        },
        "unhandled_request_error",
      );
    }
    reply
      .code(validation ? 400 : 500)
      .send(publicError(code, request.id, currentTraceId(), errorId));
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .code(404)
      .send(publicError("RESOURCE_NOT_FOUND", request.id, currentTraceId()));
  });

  app.get(
    "/health/startup",
    { schema: { response: { 200: healthSchema, 503: healthSchema } } },
    async (_request, reply) => {
      if (!lifecycle.startupOk) reply.code(503);
      return { status: lifecycle.startupOk ? "ok" : "unavailable" } as const;
    },
  );
  app.get(
    "/health/live",
    { schema: { response: { 200: healthSchema, 503: healthSchema } } },
    async (_request, reply) => {
      if (!lifecycle.live) reply.code(503);
      return { status: lifecycle.live ? "ok" : "unavailable" } as const;
    },
  );
  app.get(
    "/health/ready",
    { schema: { response: { 200: healthSchema, 503: healthSchema } } },
    async (_request, reply) => {
      if (!lifecycle.ready) reply.code(503);
      return { status: lifecycle.ready ? "ok" : "unavailable" } as const;
    },
  );
  return { app, lifecycle };
}
