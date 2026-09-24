import { createHash, randomUUID } from "node:crypto";
import {
  authorize,
  BusinessFailure,
  nextStatus,
  validateDraft,
  validateRejectionReason,
  type Action,
  type ApprovalRequest,
  type Principal,
  type Status,
} from "./domain.js";

export interface CreateInput {
  title: string;
  description: string | null;
}
export interface MutationInput {
  expectedVersion: number;
  title?: string;
  description?: string | null;
  rejectionReason?: string;
}
export interface Page {
  items: ApprovalRequest[];
  nextCursor: string | null;
}
export interface Repository {
  create(
    input: CreateInput & {
      id: string;
      creatorId: string;
      idempotencyKey: string;
      intentFingerprint: string;
    },
  ): Promise<{ item: ApprovalRequest; fingerprint: string; replayed: boolean }>;
  get(id: string): Promise<ApprovalRequest | null>;
  list(filter: {
    scope: "mine" | "reviewable";
    principalId: string;
    limit: number;
    before?: { createdAt: Date; id: string };
  }): Promise<ApprovalRequest[]>;
  compareAndSwap(input: {
    id: string;
    creatorId: string;
    expectedVersion: number;
    sourceStatus: Status;
    nextStatus: Status;
    title?: string;
    description?: string | null;
    rejectionReason?: string | null;
    requireOwner: boolean;
  }): Promise<ApprovalRequest | null>;
}

function encodeCursor(
  scope: string,
  principalId: string,
  item: ApprovalRequest,
): string {
  return Buffer.from(
    JSON.stringify([
      1,
      scope,
      principalId,
      item.createdAt.toISOString(),
      item.id,
    ]),
  ).toString("base64url");
}
function decodeCursor(
  value: string,
  scope: string,
  principalId: string,
): { createdAt: Date; id: string } {
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString(),
    );
    if (
      !Array.isArray(decoded) ||
      decoded.length !== 5 ||
      decoded[0] !== 1 ||
      decoded[1] !== scope ||
      decoded[2] !== principalId ||
      typeof decoded[3] !== "string" ||
      typeof decoded[4] !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        decoded[4],
      ) ||
      Number.isNaN(Date.parse(decoded[3])) ||
      new Date(decoded[3]).toISOString() !== decoded[3] ||
      Buffer.from(JSON.stringify(decoded)).toString("base64url") !== value
    )
      throw new Error();
    return { createdAt: new Date(decoded[3]), id: decoded[4] };
  } catch {
    throw new BusinessFailure("VALIDATION_FAILED");
  }
}

export class ApprovalRequestService {
  private readonly repository: Repository;
  constructor(repository: Repository) {
    this.repository = repository;
  }

  async create(
    principal: Principal,
    input: CreateInput,
    idempotencyKey: string,
  ): Promise<ApprovalRequest> {
    validateDraft(input.title, input.description);
    if (!/^[A-Za-z0-9._~-]{1,200}$/.test(idempotencyKey))
      throw new BusinessFailure("VALIDATION_FAILED");
    const intentFingerprint = createHash("sha256")
      .update(JSON.stringify([input.title, input.description]))
      .digest("hex");
    const result = await this.repository.create({
      ...input,
      id: randomUUID(),
      creatorId: principal.id,
      idempotencyKey,
      intentFingerprint,
    });
    if (result.fingerprint !== intentFingerprint)
      throw new BusinessFailure("IDEMPOTENCY_KEY_REUSED");
    return result.item;
  }
  async get(principal: Principal, id: string): Promise<ApprovalRequest> {
    const item = await this.repository.get(id);
    if (!item) throw new BusinessFailure("RESOURCE_NOT_FOUND");
    authorize(principal, item, "get");
    return item;
  }
  async list(
    principal: Principal,
    scope: "mine" | "reviewable",
    limit: number,
    cursor?: string,
  ): Promise<Page> {
    if (
      scope === "reviewable" &&
      !principal.capabilities.has("approval:review")
    )
      throw new BusinessFailure("PERMISSION_DENIED");
    const before = cursor
      ? decodeCursor(cursor, scope, principal.id)
      : undefined;
    const rows = await this.repository.list({
      scope,
      principalId: principal.id,
      limit: limit + 1,
      before,
    });
    const items = rows.slice(0, limit);
    return {
      items,
      nextCursor:
        rows.length > limit
          ? encodeCursor(scope, principal.id, items[items.length - 1])
          : null,
    };
  }
  async mutate(
    principal: Principal,
    id: string,
    action: Action,
    input: MutationInput,
  ): Promise<ApprovalRequest> {
    const current = await this.repository.get(id);
    if (!current) throw new BusinessFailure("RESOURCE_NOT_FOUND");
    authorize(principal, current, action);
    if (
      !Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion < 1
    )
      throw new BusinessFailure("VALIDATION_FAILED");
    if (action === "edit")
      validateDraft(input.title ?? "", input.description ?? null);
    if (action === "reject") validateRejectionReason(input.rejectionReason);
    if (current.version !== input.expectedVersion)
      throw new BusinessFailure("RESOURCE_VERSION_CONFLICT");
    const target = nextStatus(current.status, action);
    const updated = await this.repository.compareAndSwap({
      id,
      creatorId: principal.id,
      expectedVersion: input.expectedVersion,
      sourceStatus: current.status,
      nextStatus: target,
      requireOwner: action !== "approve" && action !== "reject",
      ...(action === "edit"
        ? { title: input.title, description: input.description }
        : {}),
      ...(action === "reject"
        ? { rejectionReason: input.rejectionReason }
        : {}),
    });
    if (updated) return updated;
    // A losing conditional write is always a conflict; never silently retry.
    throw new BusinessFailure("RESOURCE_VERSION_CONFLICT");
  }
}
