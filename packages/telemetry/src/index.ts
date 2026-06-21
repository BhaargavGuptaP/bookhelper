/**
 * @bookhelper/telemetry
 *
 * Cross-service primitives:
 *   • A structured logger (pino) with environment-aware redaction.
 *   • The canonical error model — RFC 9457 "Problem Details for HTTP APIs"
 *     (ARCHITECTURE.md mandates one error format across services).
 *   • An `AppError` base + a small catalogue of typed errors used by the API
 *     and the web BFF.
 *
 * Pure, framework-agnostic. NestJS / Next.js adapters live in the consumers.
 */

export { createLogger, type Logger, type LoggerOptions, type LogLevel } from "./logger.js";

export {
  ProblemDetails,
  isProblemDetails,
  problemTypeBase,
  type ProblemType,
} from "./problem-details.js";

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  PayloadTooLargeError,
  InternalError,
  ServiceUnavailableError,
  toProblemDetails,
  errorStatusFor,
} from "./errors.js";
