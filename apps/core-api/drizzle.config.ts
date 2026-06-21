import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit config — generates SQL migrations from `src/db/schema/**`.
 *
 * Migrations live under `src/db/migrations` and are NOT auto-applied at boot;
 * an operator runs `pnpm --filter @bookhelper/core-api drizzle:push` (or the
 * generated SQL via psql) during deployment.
 *
 *   pnpm --filter @bookhelper/core-api exec drizzle-kit generate
 *   pnpm --filter @bookhelper/core-api exec drizzle-kit push
 */
export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env["DATABASE_URL"] ?? "postgres://bookhelper:bookhelper@localhost:5432/bookhelper",
  },
  strict: true,
  verbose: true,
} satisfies Config;
