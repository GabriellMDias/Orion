export const statuses = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
export type Status = (typeof statuses)[number];
export type Action = "edit" | "submit" | "approve" | "reject" | "cancel";

export interface ApprovalRequest {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  status: Status;
  version: number;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Principal {
  id: string;
  capabilities: ReadonlySet<"approval:review">;
}

export class BusinessFailure extends Error {
  readonly code:
    | "VALIDATION_FAILED"
    | "RESOURCE_NOT_FOUND"
    | "PERMISSION_DENIED"
    | "APPROVAL_REQUEST_INVALID_STATE"
    | "RESOURCE_VERSION_CONFLICT"
    | "IDEMPOTENCY_KEY_REUSED";
  constructor(code: BusinessFailure["code"]) {
    super(code);
    this.code = code;
  }
}

function usableText(value: string, maximum: number): boolean {
  return value.length > 0 && value.length <= maximum && value.trim().length > 0;
}

export function validateDraft(title: string, description: string | null): void {
  if (
    !usableText(title, 200) ||
    (description !== null && !usableText(description, 2000))
  )
    throw new BusinessFailure("VALIDATION_FAILED");
}

export function validateRejectionReason(reason: string | undefined): void {
  if (reason === undefined || !usableText(reason, 2000))
    throw new BusinessFailure("VALIDATION_FAILED");
}

export function nextStatus(current: Status, action: Action): Status {
  if (action === "edit" && current === "DRAFT") return "DRAFT";
  if (action === "submit" && current === "DRAFT") return "SUBMITTED";
  if ((action === "approve" || action === "reject") && current === "SUBMITTED")
    return action === "approve" ? "APPROVED" : "REJECTED";
  if (action === "cancel" && (current === "DRAFT" || current === "SUBMITTED"))
    return "CANCELLED";
  throw new BusinessFailure("APPROVAL_REQUEST_INVALID_STATE");
}

export function authorize(
  principal: Principal,
  item: ApprovalRequest,
  action: Action | "get",
): void {
  if (action === "get") {
    if (
      item.creatorId === principal.id ||
      (item.status === "SUBMITTED" &&
        principal.capabilities.has("approval:review"))
    )
      return;
    throw new BusinessFailure("RESOURCE_NOT_FOUND");
  }
  if (action === "approve" || action === "reject") {
    if (
      !principal.capabilities.has("approval:review") ||
      item.creatorId === principal.id
    )
      throw new BusinessFailure("PERMISSION_DENIED");
    return;
  }
  if (item.creatorId !== principal.id)
    throw new BusinessFailure("RESOURCE_NOT_FOUND");
}
