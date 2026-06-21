import { Controller, Get, Module } from "@nestjs/common";
import { Auth } from "@bookhelper/api-contracts";
import { CurrentUser } from "./current-user.decorator.js";
import type { Principal } from "./auth.types.js";

/**
 * `GET /v1/me` — the principal the verified token resolved to.
 *
 * Tiny module kept beside the auth machinery (single source of truth for what
 * the web app sees as "the current user"). Parsed through the contract so a
 * drift between server claims and the contract is caught at boot of tests.
 */
@Controller("v1/me")
class MeController {
  @Get()
  me(@CurrentUser() user: Principal): Auth.Me {
    return Auth.me.parse({
      id: user.userId,
      email: user.email,
      displayName: (user.claims["name"] as string | undefined) ?? user.email.split("@")[0],
      tenantId: user.tenantId,
      role: user.role,
      emailVerified: Boolean(user.claims["email_verified"] ?? true),
      createdAt: new Date().toISOString(),
    });
  }
}

@Module({ controllers: [MeController] })
export class MeModule {}
