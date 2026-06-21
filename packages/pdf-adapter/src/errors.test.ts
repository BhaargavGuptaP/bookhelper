import { describe, expect, it } from "vitest";
import { AdapterError, ReaderError } from "@bookhelper/reader-core";
import { mapPdfError, PdfAdapterError } from "./errors.js";

function err(name: string, message = name): Error {
  const e = new Error(message);
  e.name = name;
  return e;
}

describe("mapPdfError", () => {
  it("maps PasswordException to E_PDF_PASSWORD_REQUIRED", () => {
    const out = mapPdfError(err("PasswordException"), { operation: "open" });
    expect(out).toBeInstanceOf(PdfAdapterError);
    expect((out as PdfAdapterError).code).toBe("E_PDF_PASSWORD_REQUIRED");
  });

  it("maps InvalidPDFException to E_PDF_INVALID", () => {
    expect(
      (mapPdfError(err("InvalidPDFException"), { operation: "open" }) as PdfAdapterError).code,
    ).toBe("E_PDF_INVALID");
  });

  it("maps MissingPDFException to E_PDF_MISSING", () => {
    expect(
      (mapPdfError(err("MissingPDFException"), { operation: "open" }) as PdfAdapterError).code,
    ).toBe("E_PDF_MISSING");
  });

  it("maps UnexpectedResponseException to E_PDF_NETWORK", () => {
    expect(
      (mapPdfError(err("UnexpectedResponseException"), { operation: "open" }) as PdfAdapterError)
        .code,
    ).toBe("E_PDF_NETWORK");
  });

  it("maps FormatError to E_PDF_CORRUPT", () => {
    expect((mapPdfError(err("FormatError"), { operation: "open" }) as PdfAdapterError).code).toBe(
      "E_PDF_CORRUPT",
    );
  });

  it("maps AbortError to E_PDF_ABORTED", () => {
    expect((mapPdfError(err("AbortError"), { operation: "open" }) as PdfAdapterError).code).toBe(
      "E_PDF_ABORTED",
    );
  });

  it("falls back to AdapterError for unknown errors", () => {
    const out = mapPdfError(err("Whatever"), { operation: "open" });
    expect(out).not.toBeInstanceOf(PdfAdapterError);
    expect(out).toBeInstanceOf(AdapterError);
    expect(out).toBeInstanceOf(ReaderError);
  });

  it("is idempotent on ReaderError inputs", () => {
    const e = new PdfAdapterError("E_PDF_INVALID", "x");
    expect(mapPdfError(e, { operation: "open" })).toBe(e);
  });

  it("preserves the cause chain", () => {
    const root = err("PasswordException", "needs a password");
    const mapped = mapPdfError(root, { operation: "open" }) as PdfAdapterError;
    expect(mapped.cause).toBe(root);
  });
});
