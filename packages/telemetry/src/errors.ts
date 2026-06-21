import { ProblemDetails, problemTypeBase } from "./problem-details.js";

/**
 * Application error base class.
 *
 * `AppError` carries everything a transport layer (Nest exception filter, Next
 * BFF route handler) needs to render an RFC 9457 ProblemDetails:
 *
 *   • `status`  — the HTTP status code.
 *   • `code`    — stable machine-readable code (`E_NOT_FOUND`, `E_VALIDATION`).
 *   • `title`   — human summary; safe to surface in UI.
 *   • `detail`  — context-specific detail; safe to surface in UI.
 *   • `cause`   — original error (kept server-side; never serialized).
 *   • `extensions` — structured context for the client (e.g. field errors).
 *
 * Subclasses set the status/title — call sites supply detail + extensions.
 */
export interface AppErrorOptions {
  readonly detail?: string;
  readonly cause?: unknown;
  readonly extensions?: Readonly<Record<string, unknown>>;
  readonly instance?: string;
}

export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;
  abstract readonly title: string;
  readonly extensions: Readonly<Record<string, unknown>>;
  readonly instance?: string;

  constructor(message?: string, opts: AppErrorOptions = {}) {
    super(
      message ?? opts.detail ?? "",
      opts.cause !== undefined ? { cause: opts.cause } : undefined,
    );
    this.name = new.target.name;
    this.extensions = opts.extensions ?? {};
    if (opts.instance !== undefined) this.instance = opts.instance;
  }

  get detail(): string | undefined {
    return this.message || undefined;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Catalogue — keep this list small and well-named. Resist adding niche
// subclasses; prefer reusing one of these with `extensions`.
// ──────────────────────────────────────────────────────────────────────────

export class BadRequestError extends AppError {
  readonly status = 400;
  readonly code = "E_BAD_REQUEST";
  readonly title = "Bad request";
}

export class UnauthorizedError extends AppError {
  readonly status = 401;
  readonly code = "E_UNAUTHORIZED";
  readonly title = "Unauthorized";
}

export class ForbiddenError extends AppError {
  readonly status = 403;
  readonly code = "E_FORBIDDEN";
  readonly title = "Forbidden";
}

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = "E_NOT_FOUND";
  readonly title = "Not found";
}

export class ConflictError extends AppError {
  readonly status = 409;
  readonly code = "E_CONFLICT";
  readonly title = "Conflict";
}

/**
 * Input validation failure. The `fieldErrors` extension is what the UI
 * binds to — keep the shape compatible with `ZodError.flatten()`.
 */
export class ValidationError extends AppError {
  readonly status = 422;
  readonly code = "E_VALIDATION";
  readonly title = "Validation failed";
}

export class PayloadTooLargeError extends AppError {
  readonly status = 413;
  readonly code = "E_PAYLOAD_TOO_LARGE";
  readonly title = "Payload too large";
}

export class InternalError extends AppError {
  readonly status = 500;
  readonly code = "E_INTERNAL";
  readonly title = "Internal server error";
}

export class ServiceUnavailableError extends AppError {
  readonly status = 503;
  readonly code = "E_SERVICE_UNAVAILABLE";
  readonly title = "Service unavailable";
}

/** Map any thrown value to an HTTP status code. */
export function errorStatusFor(err: unknown): number {
  if (err instanceof AppError) return err.status;
  return 500;
}

/**
 * Convert any thrown value to an RFC 9457 ProblemDetails. Untyped errors
 * collapse to a generic 500 — `detail` is suppressed in production so we
 * don't leak internals (the original error is logged separately).
 */
export function toProblemDetails(
  err: unknown,
  ctx: { instance?: string; isProduction?: boolean } = {},
): ProblemDetails {
  const isProd = ctx.isProduction ?? process.env["NODE_ENV"] === "production";

  if (err instanceof AppError) {
    return new ProblemDetails({
      type: problemTypeBase + err.code.toLowerCase().replace(/^e_/, ""),
      title: err.title,
      status: err.status,
      ...(err.detail !== undefined ? { detail: err.detail } : {}),
      code: err.code,
      ...(err.instance !== undefined
        ? { instance: err.instance }
        : ctx.instance !== undefined
          ? { instance: ctx.instance }
          : {}),
      extensions: err.extensions,
    });
  }

  return new ProblemDetails({
    type: problemTypeBase + "internal",
    title: "Internal server error",
    status: 500,
    code: "E_INTERNAL",
    ...(isProd ? {} : { detail: err instanceof Error ? err.message : String(err) }),
    ...(ctx.instance !== undefined ? { instance: ctx.instance } : {}),
  });
}
