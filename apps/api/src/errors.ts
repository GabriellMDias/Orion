import { Type, type Static } from "typebox";

export const errorRegistry = Object.freeze({
  VALIDATION_FAILED: Object.freeze({
    status: 400,
    message: "The request is invalid.",
    category: "validation",
    retryable: false,
  }),
  RESOURCE_NOT_FOUND: Object.freeze({
    status: 404,
    message: "The resource was not found.",
    category: "not_found",
    retryable: false,
  }),
  INTERNAL_ERROR: Object.freeze({
    status: 500,
    message: "An unexpected error occurred.",
    category: "internal",
    retryable: false,
  }),
  SERVICE_UNAVAILABLE: Object.freeze({
    status: 503,
    message: "The service is unavailable.",
    category: "availability",
    retryable: true,
  }),
} as const);

export type ErrorCode = keyof typeof errorRegistry;
export const errorEnvelopeSchema = Type.Object(
  {
    error: Type.Object(
      {
        code: Type.String({ pattern: "^[A-Z][A-Z0-9_]*$" }),
        message: Type.String(),
        requestId: Type.String(),
        traceId: Type.Optional(Type.String()),
        errorId: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);
export type ErrorEnvelope = Static<typeof errorEnvelopeSchema>;

export function publicError(
  code: ErrorCode,
  requestId: string,
  traceId?: string,
  errorId?: string,
): ErrorEnvelope {
  return {
    error: {
      code,
      message: errorRegistry[code].message,
      requestId,
      ...(traceId ? { traceId } : {}),
      ...(errorId ? { errorId } : {}),
    },
  };
}
