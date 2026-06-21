import { z } from "zod";

/**
 * Authenticated principal — the shape resolved from a verified JWT.
 *
 * ARCHITECTURE.md §10 mandates OIDC/OAuth2 with short-lived JWTs verified at
 * the edge against a JWKS. This is the post-verification user view returned
 * to the BFF / web client.
 *
 * Multi-tenancy lives on every record (`tenantId`) — Sprint 1 establishes
 * the carrier; per-feature enforcement lands in subsequent sprints.
 */

/** Stable, opaque identifiers. */
export const userId = z.string().min(1).brand("UserId");
export type UserId = z.infer<typeof userId>;

export const tenantId = z.string().min(1).brand("TenantId");
export type TenantId = z.infer<typeof tenantId>;

/**
 * Coarse role on the home tenant. Fine-grained permission checks happen in
 * the API; this is just the carrier (RBAC details land in a later sprint).
 */
export const role = z.enum(["owner", "admin", "member", "guest"]);
export type Role = z.infer<typeof role>;

/** GET /v1/me — the principal the verified token resolves to. */
export const me = z.object({
  id: userId,
  email: z.string().email(),
  displayName: z.string().min(1).max(120),
  avatarUrl: z.string().url().optional(),
  tenantId,
  role,
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Me = z.infer<typeof me>;
