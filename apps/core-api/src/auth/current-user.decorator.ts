import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { UnauthorizedError } from "@bookhelper/telemetry";
import type { Principal } from "./auth.types.js";

/**
 * Inject the verified `Principal` attached by `AuthGuard`. Throws if absent —
 * which can only happen if a handler forgot it's behind the global guard, so
 * failing loudly is correct.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.principal) throw new UnauthorizedError("No authenticated principal on request.");
    return req.principal;
  },
);
