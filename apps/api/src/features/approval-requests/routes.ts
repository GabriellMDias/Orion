import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Server, IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "pino";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { publicError, errorRegistry } from "../../errors.js";
import { currentTraceId } from "../../request-context.js";
import {
  BusinessFailure,
  type ApprovalRequest,
  type Principal,
} from "./domain.js";
import type { AccessTokenVerifier } from "./authentication.js";
import { ApprovalRequestService } from "./service.js";
import { approvalOperations } from "./contracts.js";

function wire(item: ApprovalRequest) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function registerApprovalRoutes(
  app: FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse,
    Logger,
    TypeBoxTypeProvider
  >,
  service: ApprovalRequestService,
  verifier: AccessTokenVerifier,
): void {
  const principals = new WeakMap<FastifyRequest, Principal>();
  void app.register((feature, _options, done) => {
    feature.addHook("onRequest", async (request, reply) => {
      const principal = await verifier.verify(request.headers.authorization);
      if (!principal) {
        reply
          .code(401)
          .send(
            publicError(
              "AUTHENTICATION_REQUIRED",
              request.id,
              currentTraceId(),
            ),
          );
        return;
      }
      principals.set(request, principal);
    });
    for (const operation of approvalOperations) {
      feature.route({
        method: operation.method,
        url: operation.url,
        schema: operation.schema,
        handler: async (request, reply) => {
          const principal = principals.get(request);
          if (!principal)
            return reply
              .code(401)
              .send(
                publicError(
                  "AUTHENTICATION_REQUIRED",
                  request.id,
                  currentTraceId(),
                ),
              );
          try {
            const params = request.params as { id: string } | undefined;
            const body = request.body as Record<string, unknown> | undefined;
            const query = request.query as
              | {
                  scope?: "mine" | "reviewable";
                  limit?: number;
                  cursor?: string;
                }
              | undefined;
            const id = params?.id ?? "";
            switch (operation.operationId) {
              case "createApprovalRequest": {
                const item = await service.create(
                  principal,
                  {
                    title: body!.title as string,
                    description:
                      (body!.description as string | null | undefined) ?? null,
                  },
                  request.headers["idempotency-key"] as string,
                );
                return reply.code(201).send(wire(item));
              }
              case "listApprovalRequests": {
                const page = await service.list(
                  principal,
                  query?.scope ?? "mine",
                  query?.limit ?? 20,
                  query?.cursor,
                );
                return reply.send({
                  items: page.items.map(wire),
                  nextCursor: page.nextCursor,
                });
              }
              case "getApprovalRequest":
                return reply.send(wire(await service.get(principal, id)));
              case "editApprovalRequestDraft":
                return reply.send(
                  wire(
                    await service.mutate(principal, id, "edit", {
                      expectedVersion: body!.expectedVersion as number,
                      title: body!.title as string,
                      description:
                        (body!.description as string | null | undefined) ??
                        null,
                    }),
                  ),
                );
              case "submitApprovalRequest":
                return reply.send(
                  wire(
                    await service.mutate(principal, id, "submit", {
                      expectedVersion: body!.expectedVersion as number,
                    }),
                  ),
                );
              case "approveApprovalRequest":
                return reply.send(
                  wire(
                    await service.mutate(principal, id, "approve", {
                      expectedVersion: body!.expectedVersion as number,
                    }),
                  ),
                );
              case "rejectApprovalRequest":
                return reply.send(
                  wire(
                    await service.mutate(principal, id, "reject", {
                      expectedVersion: body!.expectedVersion as number,
                      rejectionReason: body!.reason as string,
                    }),
                  ),
                );
              case "cancelApprovalRequest":
                return reply.send(
                  wire(
                    await service.mutate(principal, id, "cancel", {
                      expectedVersion: body!.expectedVersion as number,
                    }),
                  ),
                );
            }
          } catch (error) {
            if (error instanceof BusinessFailure)
              return reply
                .code(errorRegistry[error.code].status)
                .send(publicError(error.code, request.id, currentTraceId()));
            throw error;
          }
        },
      });
    }
    done();
  });
}
