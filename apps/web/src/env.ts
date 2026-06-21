import { z } from "zod";

/**
 * Web app environment, validated at module load.
 *
 * Why a single file: ARCHITECTURE.md mandates "Validation: Zod schemas at
 * every boundary." Process env is the outermost boundary — any service that
 * boots with a bad env value fails fast with a precise message instead of
 * mysteriously breaking a request later.
 *
 * Only `NEXT_PUBLIC_*` variables are safe to read in client code. Server-only
 * vars are accessible only in route handlers / server components and live in
 * `serverEnv`.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("BookHelper"),
});

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

function parse<S extends z.ZodTypeAny>(schema: S, raw: NodeJS.ProcessEnv): z.infer<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    // Render the first issue clearly — operators read this in pod logs.
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment for @bookhelper/web:\n${formatted}\n\n` +
        `Hint: copy .env.example to .env and fill in the missing values.`,
    );
  }
  return result.data;
}

export const publicEnv = parse(publicSchema, process.env);

/**
 * Server-only environment. Importing this from a Client Component is a
 * mistake — Next will refuse the build because we never expose the
 * non-NEXT_PUBLIC_ keys to the client bundle.
 */
export const serverEnv = parse(serverSchema, process.env);

export type PublicEnv = typeof publicEnv;
export type ServerEnv = typeof serverEnv;
