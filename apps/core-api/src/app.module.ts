import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import { ConfigModule } from "./config/config.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { AuthGuard } from "./auth/auth.guard.js";
import { DatabaseModule } from "./db/db.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { HealthModule } from "./health/health.module.js";
import { LibraryModule } from "./library/library.module.js";
import { MeModule } from "./auth/me.module.js";
import { HttpExceptionFilter } from "./common/exception.filter.js";

/**
 * Root module. Wires:
 *   • Config (env)
 *   • Pino logger (HTTP request logging, per-request correlation id)
 *   • Auth (global guard — `@Public()` opts out)
 *   • DB + Storage
 *   • Health endpoints
 *   • Global RFC 9457 exception filter
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        // Each request gets a stable id surfaced as `x-request-id`.
        genReqId: (req, res) => {
          const incoming = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
          res.setHeader("x-request-id", incoming);
          return incoming;
        },
        redact: {
          paths: ["req.headers.authorization", "req.headers.cookie"],
          censor: "[REDACTED]",
        },
        level:
          process.env["LOG_LEVEL"] ?? (process.env["NODE_ENV"] === "production" ? "info" : "debug"),
      },
    }),
    AuthModule,
    DatabaseModule,
    StorageModule,
    HealthModule,
    LibraryModule,
    MeModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
