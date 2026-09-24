import { Type } from "typebox";

export const healthSchema = Type.Object({
  status: Type.Union([Type.Literal("ok"), Type.Literal("unavailable")]),
});
export const healthOperations = [
  {
    method: "GET",
    url: "/health/startup",
    operationId: "getStartupHealth",
    schema: { response: { 200: healthSchema, 503: healthSchema } },
  },
  {
    method: "GET",
    url: "/health/live",
    operationId: "getLiveness",
    schema: { response: { 200: healthSchema, 503: healthSchema } },
  },
  {
    method: "GET",
    url: "/health/ready",
    operationId: "getReadiness",
    schema: { response: { 200: healthSchema, 503: healthSchema } },
  },
] as const;
