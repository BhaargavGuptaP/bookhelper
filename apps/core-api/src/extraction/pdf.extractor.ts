import { Injectable } from "@nestjs/common";
import { PDFDocument } from "pdf-lib";
import type { Documents } from "@bookhelper/api-contracts";
import { BadRequestError } from "@bookhelper/telemetry";
import type { ExtractionInput, ExtractionResult, SourceExtractor } from "./extractor.types.js";

/**
 * PDF extractor — pure-JS metadata + page count via pdf-lib.
 *
 * Limitation (documented): we do NOT render a page-image thumbnail here. Page
 * rasterization needs pdf.js + a canvas backend, which lands with the Reader
 * (READER-SPEC §5.3). For now PDFs use the frontend's typographic cover. A
 * scanned/encrypted/corrupt PDF still yields a page count where possible; an
 * unreadable file surfaces as a recoverable `failed` ingest (UX §14).
 */
@Injectable()
export class PdfExtractor implements SourceExtractor {
  readonly sourceType: Documents.SourceType = "pdf";

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(input.bytes, {
        ignoreEncryption: true,
        updateMetadata: false,
      });
    } catch (cause) {
      throw new BadRequestError("This PDF could not be read — it may be corrupt or malformed.", {
        cause,
      });
    }

    const result: ExtractionResult = {
      pageCount: doc.getPageCount(),
    };

    const title = safe(() => doc.getTitle());
    const author = safe(() => doc.getAuthor());
    // `getLanguage` exists at runtime on recent pdf-lib but isn't in the types.
    const language = safe(() => (doc as unknown as { getLanguage?: () => string }).getLanguage?.());

    return {
      ...result,
      ...(title ? { title: title.slice(0, 200) } : {}),
      ...(author ? { author: author.slice(0, 200) } : {}),
      ...(language ? { language: language.slice(0, 20) } : {}),
    };
  }
}

function safe<T>(fn: () => T | undefined): T | undefined {
  try {
    const v = fn();
    return typeof v === "string" ? (v.trim() ? (v as T) : undefined) : v;
  } catch {
    return undefined;
  }
}
