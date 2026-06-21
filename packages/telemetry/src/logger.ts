import pino from "pino";

/**
 * Canonical log levels used across services. Maps 1:1 onto pino's levels so
 * we never lose information when forwarding to an aggregator.
 */
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

/** Structured logger surface — a narrow subset of pino we commit to. */
export type Logger = pino.Logger;

export interface LoggerOptions {
  /** Logical service name, written to every record. Required for routing. */
  readonly service: string;
  /** `process.env.NODE_ENV` — controls pretty vs JSON output. */
  readonly env?: string | undefined;
  /** Minimum level. Defaults to `info` (prod) / `debug` (non-prod). */
  readonly level?: LogLevel | undefined;
  /** Extra base bindings (e.g. `{ region, instanceId }`). */
  readonly base?: Record<string, unknown> | undefined;
}

/**
 * Paths redacted in every log record. Anything carrying a credential or
 * direct PII should be added here, never logged raw. The list is intentionally
 * exhaustive in common shapes (Authorization headers, set-cookie, password
 * fields nested in bodies) — additions are cheap, omissions are breaches.
 */
const REDACT_PATHS: readonly string[] = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "*.password",
  "*.token",
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
  "*.headers.authorization",
  "*.headers.cookie",
];

/**
 * Build a service logger. The same factory is used by every Node service so
 * that operators see a consistent record shape and redaction policy.
 */
export function createLogger(options: LoggerOptions): Logger {
  const env = options.env ?? process.env["NODE_ENV"] ?? "development";
  const isProd = env === "production";
  const level: LogLevel = options.level ?? (isProd ? "info" : "debug");

  // Pretty printing in dev only — the prod path is line-delimited JSON,
  // which is what every log shipper expects.
  const transport = isProd
    ? undefined
    : {
        target: "pino/file",
        options: { destination: 1 }, // stdout
      };

  return pino({
    name: options.service,
    level,
    base: { service: options.service, env, ...(options.base ?? {}) },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: [...REDACT_PATHS], censor: "[REDACTED]" },
    formatters: {
      level: (label) => ({ level: label }),
    },
    ...(transport ? { transport } : {}),
  });
}
