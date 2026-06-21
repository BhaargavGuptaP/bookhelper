/**
 * Minimal, format-agnostic **Document Model** types consumed by the reader
 * core. The full canonical model lives in READER-SPEC §3; reader-core
 * deliberately keeps a thinner contract here so this package never grows
 * a dependency on a specific format's quirks.
 *
 * Concrete fields like `cumulativeCharStart`, `assets`, `pageMap`,
 * sanitized `html`, etc. are *adapter-internal*. The reader core only
 * needs enough to:
 *   • iterate blocks in document order,
 *   • measure progress (`totalChars`, `pageCount`),
 *   • render a TOC (via the adapter — we only carry the manifest),
 *   • resolve locators (via the adapter — we just hand them off).
 *
 * Anything richer is opaque from this package's perspective; adapters
 * can extend the shape via the `meta` field without changing core types.
 */

import type { BlockId, DocVersion, DocumentId, PointLocator } from "./locator.js";

/**
 * Two rendering modes the reader supports, copied verbatim from
 * READER-SPEC §1.2. The mode is reported by the adapter's
 * {@link ./capabilities.ReaderCapabilities | capabilities.layoutModes}.
 */
export type RenderMode = "reflowable" | "fixed";

/** Writing direction. Honored by the layout layer. */
export type WritingDirection = "ltr" | "rtl" | "vertical-rl";

/**
 * Document manifest. The shallow header an adapter produces eagerly when
 * a document is opened. The reader uses this to bootstrap progress math,
 * page indicators, language attributes, and TOC entries.
 */
export interface DocumentManifest {
  readonly docId: DocumentId;
  readonly docVersion: DocVersion;
  /** Free-form format tag from the adapter ("pdf", "epub", "markdown" …). */
  readonly format: string;
  readonly renderMode: RenderMode;
  /** Sum of normalized characters across the whole document. */
  readonly totalChars: number;
  /** Number of leaf blocks. */
  readonly blockCount: number;
  /** Optional — present only for fixed-layout (PDF, fixed EPUB). */
  readonly pageCount?: number;
  /** Optional title (display only; the adapter is the source of truth). */
  readonly title?: string;
  /** BCP-47 language tag. */
  readonly language?: string;
  readonly direction?: WritingDirection;
  /**
   * Adapter-private extension bag. The reader core never inspects this.
   * Use it for format-specific manifest fields without polluting core.
   */
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** A single TOC entry — a label and the locator it lands on. */
export interface TocEntry {
  readonly id: string;
  readonly label: string;
  readonly depth: number;
  /** A point locator at the start of the corresponding block. */
  readonly anchor: PointLocator;
  readonly children?: readonly TocEntry[];
}

/** Optional table-of-contents tree. Adapters supply this when supported. */
export type Toc = readonly TocEntry[];

/**
 * Coarse block descriptor used for windowing and progress. Concrete
 * content (sanitized HTML, page rasters, math, etc.) is the adapter's
 * concern and lives in its `RenderDescriptor` — *not* here.
 */
export interface BlockSummary {
  readonly blockId: BlockId;
  /** Document order. */
  readonly ord: number;
  /** Adapter-defined type tag (heading1 … paragraph … figure … pagebreak). */
  readonly type: string;
  /** Char count of normalized text in this block. */
  readonly charCount: number;
  /** Optional page index for fixed-layout formats. */
  readonly page?: number;
}
