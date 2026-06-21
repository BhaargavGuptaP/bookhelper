import { Injectable, SetMetadata, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
// NestJS DI relies on emitted decorator metadata: classes referenced as
// constructor parameter types must remain VALUE imports.
import { Reflector } from "@nestjs/core";
import { UnauthorizedError } from "@bookhelper/telemetry";
import { AuthService } from "./auth.service.js";
// Side-effect import: pulls in the Express Request augmentation.
import "./auth.types.js";

/** Metadata key — set by `@Public()` on routes that don't require auth. */
export const IS_PUBLIC = "bh:isPublic";

/** Decorator to opt a route OUT of auth (health, etc.). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/**
 * AuthGuard — verifies the Bearer token and attaches `req.principal`.
 *
 * Default policy is "deny by default" — every route requires auth unless
 * decorated with `@Public()`. This matches the ARCHITECTURE rule:
 * "No service trusts a request without verification" (§10).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ", 2);
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedError("Missing or malformed Authorization header.");
    }
    req.principal = await this.auth.verify(token);
    return true;
  }
}
