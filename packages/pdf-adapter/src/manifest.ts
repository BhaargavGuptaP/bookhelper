/**
 * **PDF document manifest** — the metadata payload an opened PDF
 * publishes on `DocumentSession.manifest`.
 *
 * The reader-core `DocumentManifest` is intentionally thin (READER-SPEC
 * §3) so the platform never depends on format-specific fields. Adapters
 * extend it through the `meta` extension bag, which we type here as
 * `PdfManifestMeta`. UIs and plugins read it via the well-known shape
 * exported below — never by parsing strings.
 *
 * Everything downstream consumes the manifest: title in the topbar,
 * permissions in the action menu, producer/creator in the details
 * sidebar, page count in the progress bar, checksum for cache keys.
 */

import type { DocumentManifest, WritingDirection } from "@bookhelper/reader-core";

/**
 * Producer permissions decoded from the PDF's permission bit mask.
 * Each flag is `true`, `false`, or `null` (unknown — the PDF didn't
 * declare them, in which case the PDF spec says everything is allowed
 * but UIs should fail open by treating that as "permitted").
 */
export interface PdfPermissions {
  readonly print: boolean | null;
  readonly modify: boolean | null;
  readonly copy: boolean | null;
  readonly annotate: boolean | null;
  readonly fillForms: boolean | null;
  readonly accessibilityCopy: boolean | null;
  readonly assemble: boolean | null;
  readonly printHighQuality: boolean | null;
}

/**
 * PDF-specific metadata. Attached as `manifest.meta.pdf` so plugins can
 * find it without scanning the whole manifest. Adding a field here is
 * non-breaking by construction; removing one is a versioned migration.
 */
export interface PdfManifestMeta {
  /** PDF spec version, e.g. "1.7". */
  readonly pdfVersion?: string;
  /** "Producer" key from the metadata dictionary (the tool that wrote the file). */
  readonly producer?: string;
  /** "Creator" key (the application that created the source document). */
  readonly creator?: string;
  /** "Author" key. */
  readonly author?: string;
  /** "Subject" key. */
  readonly subject?: string;
  /** "Keywords" key (raw, not split). */
  readonly keywords?: string;
  /** PDF "/CreationDate" parsed to an ISO 8601 string when possible. */
  readonly creationDate?: string;
  /** PDF "/ModDate" parsed to an ISO 8601 string when possible. */
  readonly modificationDate?: string;
  /** Producer permissions, decoded from the bit mask (see PDF 1.7 §7.6.4). */
  readonly permissions: PdfPermissions;
  /** True if the PDF is encrypted (we still managed to open it). */
  readonly encrypted: boolean;
  /** True if the file is linearized (web-optimized). Inferred from the trailer. */
  readonly linearized: boolean;
  /** Number of pages. Mirrors `manifest.pageCount` for convenience. */
  readonly pageCount: number;
  /** pdfjs fingerprints (`[primary, secondary?]`) — used as a checksum. */
  readonly fingerprints: readonly string[];
}

/**
 * The composite manifest the PDF adapter publishes. Plugins that need
 * the PDF extension cast through this convenience type so they don't
 * have to dig into `meta` themselves.
 */
export interface PdfDocumentManifest extends DocumentManifest {
  readonly meta: Readonly<{ pdf: PdfManifestMeta }> & Readonly<Record<string, unknown>>;
}

/** True if `m` was produced by this PDF adapter. */
export function isPdfManifest(m: DocumentManifest): m is PdfDocumentManifest {
  return (
    m.format === "pdf" &&
    typeof m.meta === "object" &&
    m.meta !== null &&
    "pdf" in m.meta &&
    typeof (m.meta as { pdf?: unknown }).pdf === "object"
  );
}

/** Re-exported writing direction — we always emit `ltr` for PDF. */
export const pdfWritingDirection: WritingDirection = "ltr";
