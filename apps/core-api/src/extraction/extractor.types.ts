import type { Documents } from "@bookhelper/api-contracts";

/**
 * Extraction is the "background processing" step of ingestion (no AI in
 * Sprint 2). Each source type has an extractor that pulls metadata + an
 * optional embedded cover from the uploaded bytes.
 *
 * Adding a future source type (docx, web article, audio transcript, …) is a
 * new `SourceExtractor` + one registry entry — no service or controller
 * change. That is the "extensible without refactor" requirement.
 */

export interface ExtractedCover {
  readonly bytes: Uint8Array;
  readonly contentType: string;
}

export interface ExtractionResult {
  readonly title?: string;
  readonly author?: string;
  readonly language?: string;
  readonly pageCount?: number;
  readonly wordCount?: number;
  readonly description?: string;
  readonly cover?: ExtractedCover;
}

export interface ExtractionInput {
  readonly bytes: Uint8Array;
  /** Untrusted client filename — used only to derive a default title. */
  readonly filename: string;
}

export interface SourceExtractor {
  readonly sourceType: Documents.SourceType;
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

/** DI token for the array of registered extractors. */
export const EXTRACTORS = Symbol.for("@bookhelper/core-api/extractors");
