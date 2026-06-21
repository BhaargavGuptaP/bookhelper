import { Global, Module, Logger } from "@nestjs/common";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";

/** DI token for the Drizzle handle. Inject as `@Inject(DB)`. */
export const DB = Symbol.for("@bookhelper/core-api/db");

/**
 * Postgres + Drizzle wiring.
 *
 * Sprint 1 wires the connection only — no schema yet. Subsequent sprints
 * add the `schema/` exports and migrations.
 *
 * If `DATABASE_URL` is unset we provide `null` and log a clear warning. This
 * is only allowed off-prod (env validation enforces this — see `loadEnv`).
 */
export type Database = PostgresJsDatabase | null;

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ENV],
      useFactory: (env: Env): Database => {
        const logger = new Logger("DBModule");
        if (!env.DATABASE_URL) {
          logger.warn(
            "DATABASE_URL not set — DB handle is null. Set it (or run `docker compose up postgres`) to enable persistence.",
          );
          return null;
        }
        const client = postgres(env.DATABASE_URL, {
          max: 10,
          idle_timeout: 30,
          connect_timeout: 10,
          // Quiet libpq notices by default; structured logs handle the rest.
          onnotice: () => {},
        });
        return drizzle(client);
      },
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
