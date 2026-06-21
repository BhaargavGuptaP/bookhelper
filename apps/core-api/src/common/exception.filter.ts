import {
  Catch,
  HttpException,
  Inject,
  type ArgumentsHost,
  type ExceptionFilter,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { toProblemDetails, ValidationError, AppError } from "@bookhelper/telemetry";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";

/**
 * Global exception filter — converts everything thrown out of a controller
 * into an RFC 9457 ProblemDetails response.
 *
 * Order of precedence:
 *   1. `AppError` instances → mapped via `toProblemDetails`.
 *   2. `ZodError` from input validation → wrapped as `ValidationError` with
 *      `fieldErrors` extension (matches `zod.flatten()`).
 *   3. NestJS `HttpException` → status taken as-is; body inspected for shape.
 *   4. Anything else → 500 with a sanitized body in production.
 *
 * Logging policy: log unknown errors at ERROR with the cause; log AppError
 * at INFO/WARN by status (`5xx` is WARN; `<500` is INFO — they're expected).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const instance = req.originalUrl ?? req.url;

    const normalized = this.normalize(exception);
    const pd = toProblemDetails(normalized, {
      instance,
      isProduction: this.env.NODE_ENV === "production",
    });

    if (pd.status >= 500) {
      this.logger.error(
        `${req.method} ${instance} -> ${pd.status}`,
        normalized instanceof Error ? normalized.stack : String(normalized),
      );
    } else {
      this.logger.log(`${req.method} ${instance} -> ${pd.status}`);
    }

    res.status(pd.status).type("application/problem+json").json(pd.toJSON());
  }

  /** Coerce the thrown value into something `toProblemDetails` understands. */
  private normalize(exception: unknown): unknown {
    if (exception instanceof AppError) return exception;

    if (exception instanceof ZodError) {
      return new ValidationError("Invalid input", {
        extensions: { fieldErrors: exception.flatten().fieldErrors },
        cause: exception,
      });
    }

    if (exception instanceof HttpException) {
      const httpExc: HttpException = exception;
      const status = httpExc.getStatus();
      const resp = httpExc.getResponse();
      const rawDetail =
        typeof resp === "string"
          ? resp
          : (((resp as { message?: string | string[] }).message as string | string[] | undefined) ??
            httpExc.message);
      // Wrap in a synthetic AppError so toProblemDetails maps consistently.
      class Wrapped extends AppError {
        readonly status = status;
        readonly code = `E_HTTP_${status}`;
        readonly title = httpExc.name.replace(/Exception$/, "") || "HTTP Error";
      }
      return new Wrapped(Array.isArray(rawDetail) ? rawDetail.join("; ") : rawDetail, {
        cause: httpExc,
      });
    }

    return exception;
  }
}
