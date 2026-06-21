import type { Documents, Storage } from "@bookhelper/api-contracts";
import { BadRequestError } from "@bookhelper/telemetry";

/**
 * Map an accepted upload MIME type to our internal `sourceType`.
 *
 * Sprint 2 production set: pdf | epub | text | markdown. Image MIME types are
 * accepted by the upload contract (for covers) but are NOT registerable as
 * documents — registering one is a client error.
 *
 * Adding a future source (docx/web/audio) = one entry here + a contract enum
 * bump + an extractor. No controller/service change.
 */
const MIME_TO_SOURCE: Partial<Record<Storage.AllowedUploadMime, Documents.SourceType>> = {
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
  "text/plain": "text",
  "text/markdown": "markdown",
};

const SOURCE_TO_EXT = {
  pdf: "pdf",
  epub: "epub",
  text: "txt",
  markdown: "md",
} as const satisfies Record<Documents.SourceType, string>;

export function sourceTypeForMime(mime: string): Documents.SourceType {
  const mapped = MIME_TO_SOURCE[mime as Storage.AllowedUploadMime];
  if (!mapped) {
    throw new BadRequestError(`Unsupported document type: ${mime}.`, {
      extensions: { supported: Object.keys(MIME_TO_SOURCE) },
    });
  }
  return mapped;
}

export function extForSource(sourceType: Documents.SourceType): string {
  return SOURCE_TO_EXT[sourceType];
}
