/**
 * Map raw pdfjs errors to the typed `ReaderError` catalogue.
 *
 * pdfjs throws strings, plain Errors, and custom Exception classes that
 * differ by version. Downstream code must **never** see those — every
 * failure leaving the adapter is either an instance of `ReaderError`
 * (from `@bookhelper/reader-core`) or a `PdfAdapterError` we define here
 * specifically for PDF-shaped failures.
 *
 * The mapping table is the documented contract of this adapter for
 * error handling. Adding a new pdfjs error name = one entry here.
 */

import { AdapterError, ReaderError } from "@bookhelper/reader-core";
import { PdfjsErrorName } from "./internal/pdfjs.js";

/**
 * Stable, machine-readable error codes specific to the PDF adapter.
 * Every `PdfAdapterError` carries one; product analytics, retries, and
 * test assertions pivot on this string (never on `instanceof`).
 */
export type PdfErrorCode =
  | "E_PDF_PASSWORD_REQUIRED"
  | "E_PDF_INVALID"
  | "E_PDF_MISSING"
  | "E_PDF_NETWORK"
  | "E_PDF_CORRUPT"
  | "E_PDF_ABORTED"
  | "E_PDF_PAGE_OUT_OF_RANGE"
  | "E_PDF_DESTINATION_NOT_FOUND"
  | "E_PDF_UNSUPPORTED";

/**
 * PDF-specific error. Subclass of `ReaderError` so a generic
 * "catch any reader failure" still works in core/UI.
 */
export class PdfAdapterError extends ReaderError {
  readonly code: PdfErrorCode;
  readonly pageNumber?: number;

  constructor(
    code: PdfErrorCode,
    message: string,
    options?: { cause?: unknown; pageNumber?: number },
  ) {
    super(message, options ? { cause: options.cause } : undefined);
    this.code = code;
    if (options?.pageNumber !== undefined) this.pageNumber = options.pageNumber;
  }
}

/**
 * Translate any value thrown by pdfjs (or our own pre-parse guards) into
 * a typed error. The transformation is deterministic: same input shape
 * yields same output code so tests can assert on `.code`.
 */
export function mapPdfError(
  err: unknown,
  ctx: { adapter?: string; operation: string },
): ReaderError {
  // Already typed — pass through (idempotent).
  if (err instanceof ReaderError) return err;

  const name = errName(err);
  const message = errMessage(err);
  const cause = err;

  if (name === "AbortError") {
    return new PdfAdapterError("E_PDF_ABORTED", "PDF operation was aborted.", { cause });
  }
  if (name === PdfjsErrorName.Password) {
    return new PdfAdapterError("E_PDF_PASSWORD_REQUIRED", "This PDF is password-protected.", {
      cause,
    });
  }
  if (name === PdfjsErrorName.InvalidPDF) {
    return new PdfAdapterError("E_PDF_INVALID", "The file is not a valid PDF.", { cause });
  }
  if (name === PdfjsErrorName.Missing) {
    return new PdfAdapterError("E_PDF_MISSING", "The PDF could not be located.", { cause });
  }
  if (name === PdfjsErrorName.Unexpected) {
    return new PdfAdapterError(
      "E_PDF_NETWORK",
      "An unexpected response was received while loading the PDF.",
      { cause },
    );
  }
  if (name === PdfjsErrorName.FormatError) {
    return new PdfAdapterError("E_PDF_CORRUPT", "The PDF appears to be corrupt.", { cause });
  }

  // Last resort: bubble up as a generic AdapterError. The original is
  // preserved on `cause` so logs can still tell us what happened, while
  // callers see a stable failure shape.
  return new AdapterError(ctx.adapter ?? "pdf", ctx.operation, message, { cause });
}

function errName(e: unknown): string {
  if (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    typeof (e as { name: unknown }).name === "string"
  ) {
    return (e as { name: string }).name;
  }
  return "Error";
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
