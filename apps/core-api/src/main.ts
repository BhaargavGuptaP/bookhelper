import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger as NestLogger } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from "express";
import { AppModule } from "./app.module.js";
import { loadEnv } from "./config/env.js";

/**
 * Bootstrap.
 *
 * Pre-flight: validate env *before* Nest spins up so we never block a port
 * with a half-configured process.
 *
 * Lifecycle hooks: `enableShutdownHooks` ensures graceful drain on SIGTERM
 * (k8s rolling updates expect this).
 */
async function bootstrap(): Promise<void> {
  const env = loadEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Pino is the canonical logger.
  app.useLogger(app.get(Logger));

  // CORS — strict allow-list; web origin only.
  const origins = env.WEB_ORIGIN.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type", "x-request-id", "x-idempotency-key"],
    exposedHeaders: ["x-request-id"],
    maxAge: 86400,
  });

  // Conservative security headers (Helmet would also be appropriate; we
  // keep the dependency surface minimal in Sprint 1).
  app.use((_req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    next();
  });

  app.enableShutdownHooks();

  await app.listen(env.CORE_API_PORT, "0.0.0.0");
  new NestLogger("Bootstrap").log(`core-api listening on :${env.CORE_API_PORT} (${env.NODE_ENV})`);
}

bootstrap().catch((err) => {
  console.error("[bh.core-api] fatal during bootstrap:", err);
  process.exit(1);
});
