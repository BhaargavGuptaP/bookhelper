import { Global, Module } from "@nestjs/common";
import { loadEnv, type Env } from "./env.js";

/** DI token for the validated environment. */
export const ENV = Symbol.for("@bookhelper/core-api/env");

/**
 * Global config module. Exposes the validated `Env` object via the `ENV`
 * token. Injection sites use `@Inject(ENV)`.
 *
 * Loading happens once at boot — any failure here crashes the process before
 * the HTTP server starts (the right failure mode for misconfiguration).
 */
@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: (): Env => loadEnv(),
    },
  ],
  exports: [ENV],
})
export class ConfigModule {}
