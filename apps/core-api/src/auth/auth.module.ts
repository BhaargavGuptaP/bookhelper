import { Global, Module } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AuthGuard } from "./auth.guard.js";

/**
 * Auth module — provides the OIDC token verifier and the default `AuthGuard`.
 * Bound globally in `app.module.ts` (via `APP_GUARD`) so every route is
 * authenticated by default; `@Public()` opts out.
 */
@Global()
@Module({
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
