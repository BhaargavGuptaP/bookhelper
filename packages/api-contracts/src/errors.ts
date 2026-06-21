import { z } from "zod";

/**
 * Wire schema for the RFC 9457 Problem Details envelope. Mirrors
 * `@bookhelper/telemetry`'s `ProblemDetails` class — kept here so consumers
 * (the web BFF, fetch helpers) can validate without pulling the server lib.
 *
 * Extension members are allowed at the top level per RFC 9457 §3.2 — we
 * model that with `.passthrough()`.
 */
export const problem = z
  .object({
    type: z.string().min(1).default("about:blank"),
    title: z.string().min(1),
    status: z.number().int().min(100).max(599),
    detail: z.string().optional(),
    instance: z.string().optional(),
    code: z.string().min(1).optional(),
  })
  .passthrough();
export type Problem = z.infer<typeof problem>;
