import { Type, type Static } from "typebox";

export const errorRegistry = Object.freeze({
  AUTHENTICATION_REQUIRED: Object.freeze({
    status: 401,
    message: "Authentication is required.",
    category: "authentication",
    retryable: false,
  }),
  PERMISSION_DENIED: Object.freeze({
    status: 403,
    message: "Permission denied.",
    category: "authorization",
    retryable: false,
  }),
  APPROVAL_REQUEST_INVALID_STATE: Object.freeze({
    status: 409,
    message: "The request cannot be changed in its current state.",
    category: "conflict",
    retryable: false,
  }),
  RESOURCE_VERSION_CONFLICT: Object.freeze({
    status: 409,
    message: "The request changed; reload it before trying again.",
    category: "conflict",
    retryable: false,
  }),
  IDEMPOTENCY_KEY_REUSED: Object.freeze({
    status: 409,
    message: "The creation key was used for different content.",
    category: "conflict",
    retryable: false,
  }),
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
