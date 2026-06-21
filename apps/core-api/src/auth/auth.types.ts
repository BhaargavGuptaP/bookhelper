import type { Auth } from "@bookhelper/api-contracts";

/**
 * Server-side principal — the verified-JWT view used by guards/controllers.
 * Mirrors the `Auth.Me` contract (api-contracts) so the over-the-wire and
 * in-process types stay aligned.
 */
export interface Principal {
  readonly userId: Auth.UserId;
  readonly tenantId: Auth.TenantId;
  readonly email: string;
  readonly role: Auth.Role;
  readonly scopes: readonly string[];
  /** Raw decoded JWT for downstream attribution/audit. */
  readonly claims: Readonly<Record<string, unknown>>;
}

/**
 * Express request augmentation so handlers can read `req.principal` without
 * a custom decorator. We use `express-serve-static-core` directly (Express's
 * type-augmentation point) — augmenting `express` itself is no-op.
 */
declare module "express" {
  interface Request {
    principal?: Principal;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}
