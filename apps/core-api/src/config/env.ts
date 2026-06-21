import { z } from "zod";

/**
 * Core-API environment, validated at boot.
 *
 * Validation is exhaustive on purpose — every var the app touches is here,
 * with a `describe()`-style comment. Boot fails with a precise message on
 * misconfiguration (the cheapest possible failure mode).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  CORE_API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  // CORS allow-list — the web origin (comma-separated for multiple).
  WEB_ORIGIN: z.string().default("http://localhost:3000"),

  // Database — Postgres (ARCHITECTURE.md §6).
  DATABASE_URL: z
    .string()
    .url()
    .or(z.string().startsWith("postgres://"))
    .or(z.string().startsWith("postgresql://"))
    .optional(),

  // Object storage abstraction.
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(".storage"),
  S3_BUCKET: z.string().default("bookhelper"),
  S3_REGION: z.string().default("auto"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  // Auth — OIDC. Issuer + JWKS are optional in dev (auth guards no-op when
  // disabled). In prod, the AuthModule throws at boot if these are absent.
  OIDC_ISSUER: z.string().url().optional(),
  OIDC_JWKS_URI: z.string().url().optional(),
  OIDC_AUDIENCE: z.string().default("bookhelper"),

  // Dev-only auth fallback. When OIDC is unconfigured AND not production, the
  // AuthGuard resolves a fixed dev principal so the product is usable locally
  // without an IdP. Forced off in production (loadEnv rejects the combination).
  DEV_AUTH: z.coerce.boolean().default(true),
  DEV_USER_ID: z.string().default("user_dev"),
  DEV_TENANT_ID: z.string().default("tenant_dev"),
  DEV_USER_EMAIL: z.string().email().default("dev@bookhelper.local"),
  DEV_USER_NAME: z.string().default("Dev User"),

  // Public origin of this API (used to build the local presigned-upload URL).
  CORE_API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),

  // Server-side upload ceiling (may be stricter than the contract's hard max).
  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(200 * 1024 * 1024),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment for @bookhelper/core-api:\n${formatted}\n\nHint: copy .env.example to .env and fill in.`,
    );
  }

  // Prod safety rails — never allow the API to come up with auth disabled.
  if (result.data.NODE_ENV === "production") {
    if (!result.data.OIDC_ISSUER || !result.data.OIDC_JWKS_URI) {
      throw new Error(
        "OIDC_ISSUER and OIDC_JWKS_URI are required in production (auth cannot be no-op).",
      );
    }
    if (!result.data.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production.");
    }
    if (result.data.DEV_AUTH) {
      throw new Error("DEV_AUTH must be disabled in production (set DEV_AUTH=false).");
    }
  }

  return result.data;
}
