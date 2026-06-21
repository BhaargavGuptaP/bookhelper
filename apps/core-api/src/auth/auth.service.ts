import { Injectable, Inject, Logger } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { UnauthorizedError } from "@bookhelper/telemetry";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";
import type { Principal } from "./auth.types.js";
import type { Auth } from "@bookhelper/api-contracts";

/**
 * AuthService — verifies OIDC-issued JWTs against a remote JWKS.
 *
 * Behavior:
 *   • If `OIDC_ISSUER` / `OIDC_JWKS_URI` are not configured → "disabled"
 *     mode. `verify()` rejects everything. This is only legal off-prod;
 *     `loadEnv()` already throws in production if the OIDC vars are absent.
 *   • Otherwise: standard signature + claims verification (iss, aud, exp).
 *
 * The JWKS is fetched lazily (jose caches automatically), so service boot
 * doesn't depend on the IdP being reachable.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private readonly enabled: boolean;
  /** Dev fallback: only when OIDC is off AND we're not in production. */
  private readonly devAuth: boolean;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.enabled = Boolean(env.OIDC_ISSUER && env.OIDC_JWKS_URI);
    this.devAuth = !this.enabled && env.NODE_ENV !== "production" && env.DEV_AUTH;
    if (this.enabled) {
      this.jwks = createRemoteJWKSet(new URL(env.OIDC_JWKS_URI!));
      this.logger.log(`OIDC enabled; issuer=${env.OIDC_ISSUER}`);
    } else {
      this.jwks = null;
      if (this.devAuth) {
        this.logger.warn(
          `OIDC not configured — DEV_AUTH active. Every request resolves to the dev principal (${env.DEV_USER_ID}). NEVER enabled in production.`,
        );
      } else {
        this.logger.warn(
          "OIDC NOT configured and DEV_AUTH off — AuthGuard will reject every request.",
        );
      }
    }
  }

  /**
   * Verify a bearer token. Throws `UnauthorizedError` on every failure mode
   * so callers (the guard) need only catch a single type. In dev-auth mode any
   * non-empty token resolves to the fixed dev principal.
   */
  async verify(token: string): Promise<Principal> {
    if (!this.enabled || !this.jwks) {
      if (this.devAuth && token) return this.devPrincipal();
      throw new UnauthorizedError("Auth is not configured on this server.");
    }
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.env.OIDC_ISSUER!,
        audience: this.env.OIDC_AUDIENCE,
      });
      return this.principalFromClaims(payload);
    } catch (cause) {
      throw new UnauthorizedError("Invalid or expired token.", { cause });
    }
  }

  /** The fixed dev principal (dev-auth mode only). */
  private devPrincipal(): Principal {
    return {
      userId: this.env.DEV_USER_ID as Auth.UserId,
      tenantId: this.env.DEV_TENANT_ID as Auth.TenantId,
      email: this.env.DEV_USER_EMAIL,
      role: "owner",
      scopes: [],
      claims: { dev: true },
    };
  }

  /** Map raw JWT claims into our `Principal`. */
  private principalFromClaims(payload: JWTPayload): Principal {
    const sub = payload.sub;
    if (!sub) throw new UnauthorizedError("Token missing `sub` claim.");
    const tenantId = (payload["tid"] ?? payload["org_id"]) as string | undefined;
    if (!tenantId) {
      throw new UnauthorizedError("Token missing tenant claim (`tid` or `org_id`).");
    }
    const email = (payload["email"] as string | undefined) ?? "";
    const role = (payload["role"] as string | undefined as Auth.Role | undefined) ?? "member";
    const scope = (payload["scope"] as string | undefined) ?? "";
    const scopes = scope.split(/\s+/).filter(Boolean);

    return {
      userId: sub as Auth.UserId,
      tenantId: tenantId as Auth.TenantId,
      email,
      role,
      scopes,
      claims: payload as Record<string, unknown>,
    };
  }
}
