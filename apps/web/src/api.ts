import { createOrionClient, type paths } from "@orion/sdk";
import { loadClientConfig } from "./config.js";

export type ApprovalRequest =
  paths["/approval-requests/{id}"]["get"]["responses"][200]["content"]["application/json"];
export type ApprovalPage =
  paths["/approval-requests"]["get"]["responses"][200]["content"]["application/json"];
export type Scope = "mine" | "reviewable";

const knownCodes = new Set([
  "AUTHENTICATION_REQUIRED",
  "PERMISSION_DENIED",
  "RESOURCE_NOT_FOUND",
  "VALIDATION_FAILED",
  "APPROVAL_REQUEST_INVALID_STATE",
  "RESOURCE_VERSION_CONFLICT",
  "IDEMPOTENCY_KEY_REUSED",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly requestId: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiFailure";
  }
}

export function unwrap<T>({
  data,
  error,
  response,
}: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (data !== undefined) return data;
  const envelope =
    error && typeof error === "object" && "error" in error ? error.error : null;
  const detail = envelope && typeof envelope === "object" ? envelope : null;
  const code =
    detail &&
    "code" in detail &&
    typeof detail.code === "string" &&
    /^[A-Z][A-Z0-9_]{0,79}$/.test(detail.code)
      ? detail.code
      : "UNKNOWN_ERROR";
  const requestId =
    detail && "requestId" in detail && typeof detail.requestId === "string"
      ? detail.requestId
      : null;
  const message =
    detail &&
    "message" in detail &&
    typeof detail.message === "string" &&
    knownCodes.has(code)
      ? detail.message
      : "The request could not be completed.";
  throw new ApiFailure(response.status, code, requestId, message);
}

export function approvalApi(token: string) {
  const client = createOrionClient(loadClientConfig().apiBaseUrl, () => token);
  return {
    async list(scope: Scope, cursor?: string) {
      return unwrap<ApprovalPage>(
        await client.GET("/approval-requests", {
          params: { query: { scope, ...(cursor ? { cursor } : {}) } },
        }),
      );
    },
    async get(id: string) {
      return unwrap<ApprovalRequest>(
        await client.GET("/approval-requests/{id}", {
          params: { path: { id } },
        }),
      );
    },
    async create(title: string, description: string | null, key: string) {
      return unwrap<ApprovalRequest>(
        await client.POST("/approval-requests", {
          params: { header: { "idempotency-key": key } },
          body: { title, description },
        }),
      );
    },
    async edit(
      id: string,
      expectedVersion: number,
      title: string,
      description: string | null,
    ) {
      return unwrap<ApprovalRequest>(
        await client.PUT("/approval-requests/{id}/draft", {
          params: { path: { id } },
          body: { expectedVersion, title, description },
        }),
      );
    },
    async submit(id: string, expectedVersion: number) {
      return unwrap<ApprovalRequest>(
        await client.POST("/approval-requests/{id}/submit", {
          params: { path: { id } },
          body: { expectedVersion },
        }),
      );
    },
    async approve(id: string, expectedVersion: number) {
      return unwrap<ApprovalRequest>(
        await client.POST("/approval-requests/{id}/approve", {
          params: { path: { id } },
          body: { expectedVersion },
        }),
      );
    },
    async reject(id: string, expectedVersion: number, reason: string) {
      return unwrap<ApprovalRequest>(
        await client.POST("/approval-requests/{id}/reject", {
          params: { path: { id } },
          body: { expectedVersion, reason },
        }),
      );
    },
    async cancel(id: string, expectedVersion: number) {
      return unwrap<ApprovalRequest>(
        await client.POST("/approval-requests/{id}/cancel", {
          params: { path: { id } },
          body: { expectedVersion },
        }),
      );
    },
  };
}

export function failureMessage(
  error: unknown,
  operation: "read" | "create" | "write" = "read",
) {
  if (
    operation !== "read" &&
    (!(error instanceof ApiFailure) || error.status >= 500)
  )
    return operation === "create"
      ? "Creation outcome is unknown. Check My requests, or retry the same details with the same idempotency key."
      : "Update outcome is unknown. Reload the request before deciding whether to try again.";
  if (!(error instanceof ApiFailure))
    return "The service could not be reached. Check the connection and try again.";
  switch (error.code) {
    case "AUTHENTICATION_REQUIRED":
      return "Your access token is missing, invalid, or expired. Enter a current token.";
    case "PERMISSION_DENIED":
      return "You do not have permission for this action.";
    case "RESOURCE_VERSION_CONFLICT":
      return "This request changed. Reload it before trying again.";
    case "APPROVAL_REQUEST_INVALID_STATE":
      return "This action is no longer allowed in the current state.";
    case "RATE_LIMITED":
      return "Too many requests. Wait a moment and try again.";
    default:
      return error.message;
  }
}
