-- Reviewed initial durable Approval Request schema. PostgreSQL owns the clock.
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "approval_requests" (
  "id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000),
  "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "rejection_reason" VARCHAR(2000),
  "idempotency_key" VARCHAR(200) NOT NULL,
  "intent_fingerprint" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "approval_requests_version_positive" CHECK ("version" > 0),
  CONSTRAINT "approval_requests_title_nonblank" CHECK ("title" ~ '[^[:space:]]'),
  CONSTRAINT "approval_requests_description_nonblank" CHECK ("description" IS NULL OR "description" ~ '[^[:space:]]'),
  CONSTRAINT "approval_requests_rejection_reason_state" CHECK (("status" = 'REJECTED') = ("rejection_reason" IS NOT NULL AND "rejection_reason" ~ '[^[:space:]]')),
  CONSTRAINT "approval_requests_idempotency_key_nonblank" CHECK ("idempotency_key" ~ '^[A-Za-z0-9._~-]+$'),
  CONSTRAINT "approval_requests_fingerprint_sha256" CHECK ("intent_fingerprint" ~ '^[a-f0-9]{64}$')
);

CREATE UNIQUE INDEX "approval_requests_creator_key_unique" ON "approval_requests"("creator_id", "idempotency_key");
CREATE INDEX "approval_requests_mine_page_idx" ON "approval_requests"("creator_id", "created_at" DESC, "id" DESC);
CREATE INDEX "approval_requests_review_page_idx" ON "approval_requests"("status", "created_at" DESC, "id" DESC);
