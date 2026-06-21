import { z } from "zod";

/**
 * Liveness — process is alive. Used by load balancers; cheap and cannot fail
 * for a downstream reason (it would falsely cycle the pod).
 */
export const liveness = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
  version: z.string().min(1),
  uptimeSeconds: z.number().int().nonnegative(),
});
export type Liveness = z.infer<typeof liveness>;

/**
 * Readiness — process is ready to serve traffic. Includes dependency check
 * results so an operator can see *why* a pod is not ready.
 */
export const dependencyStatus = z.object({
  name: z.string().min(1),
  status: z.enum(["up", "down", "degraded", "skipped"]),
  message: z.string().optional(),
  latencyMs: z.number().nonnegative().optional(),
});
export type DependencyStatus = z.infer<typeof dependencyStatus>;

export const readiness = z.object({
  status: z.enum(["ready", "not_ready"]),
  service: z.string().min(1),
  version: z.string().min(1),
  checkedAt: z.string().datetime(),
  dependencies: z.array(dependencyStatus),
});
export type Readiness = z.infer<typeof readiness>;
