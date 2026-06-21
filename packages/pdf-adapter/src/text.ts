/**
 * **Text extraction** — per-page and streaming.
 *
 * The adapter exposes text as a coordinate-aware list of `PageText`
 * objects. Each `PageText` carries:
 *
 *   • A flat normalized string for the page (suitable for search index
 *     construction, TTS, AI prompts).
 *   • An array of `TextItem`s preserving each pdfjs text run's
 *     position (`transform`), dimensions, and char count. Future
 *     selection and highlight code reads from this array to map a
 *     character offset to a screen rect (the "PDF text layer").
 *
 * No UI lives here. No search index lives here. Just extraction.
 *
 * Normalization rules (READER-SPEC §3.2):
 *   1. NFC normalize.
 *   2. Collapse runs of whitespace to single spaces.
 *   3. Strip soft hyphens.
 *   4. Join hyphenated line-breaks ("exam-\nple" → "example") so a
 *      future search engine finds natural words.
 *
 * Performance:
 *   • `extractPageText(n)` parses one page; the engine caches the
 *     result via the page cache.
 *   • `streamText({ from, to })` yields pages in order so a caller
 *     can build an index incrementally without pinning the whole
 *     document in memory.
 */

import type { PdfjsDocumentProxy, PdfjsPageProxy, PdfjsTextItem } from "./internal/pdfjs.js";

export interface TextItem {
  /** The normalized text for this run. */
  readonly text: string;
  /** True if pdfjs marked this run as ending a line (we honor it). */
  readonly eol: boolean;
  /**
   * Raw pdfjs transform `[a, b, c, d, e, f]`. Adapters typically use
   * `[e, f]` (translation) for the run's PDF-space origin and the page
   * height to flip the y-axis.
   */
  readonly transform: readonly number[];
  readonly width: number;
  readonly height: number;
}

export interface PageText {
  readonly page: number;
  /** Flat, normalized text suitable for indexing. */
  readonly text: string;
  /** Original runs, in document order. */
  readonly items: readonly TextItem[];
}

const SOFT_HYPHEN = "\u00ad";

/** Normalize a single pdfjs text item's string. */
function normalizeItem(s: string): string {
  return s.normalize("NFC").replace(new RegExp(SOFT_HYPHEN, "g"), "");
}

/**
 * Collapse runs of whitespace to single spaces. Handles ASCII whitespace
 * (space, tab, ...) plus Unicode whitespace runs.
 *
 * Note we deliberately do *not* trim leading/trailing — joining text
 * items keeps spaces between them; leaving terminal whitespace alone
 * preserves paragraph hints downstream.
 */
function collapseWhitespace(s: string): string {
  return s.replace(/[ \t\f\v\u00a0\u2000-\u200a\u2028\u2029]+/g, " ");
}

/** Join hyphenated line breaks ("exam-\nple" → "example"). */
function joinHyphenatedLineBreaks(s: string): string {
  return s.replace(/(\w)-\n(\w)/g, "$1$2");
}

/**
 * Build the normalized page text from pdfjs items. Returns the joined
 * string and the per-item descriptors callers need to map offsets back
 * to coordinates later.
 */
export function buildPageText(items: readonly PdfjsTextItem[], pageNumber: number): PageText {
  const out: TextItem[] = [];
  const parts: string[] = [];
  for (const raw of items) {
    if (typeof raw.str !== "string") continue;
    const text = normalizeItem(raw.str);
    if (text.length === 0 && !raw.hasEOL) continue;
    parts.push(text);
    if (raw.hasEOL) parts.push("\n");
    out.push({
      text,
      eol: Boolean(raw.hasEOL),
      transform: raw.transform ?? [],
      width: raw.width ?? 0,
      height: raw.height ?? 0,
    });
  }
  const flat = joinHyphenatedLineBreaks(collapseWhitespace(parts.join("")));
  return { page: pageNumber, text: flat, items: out };
}

/** Extract the normalized text for one page. */
export async function extractPageText(page: PdfjsPageProxy): Promise<PageText> {
  const content = await page.getTextContent({ disableNormalization: false });
  return buildPageText(content.items, page.pageNumber);
}

/**
 * Stream pages in `[from, to]` (inclusive, 1-based). Honors abort. The
 * generator yields PageText one at a time so callers can pipe to an
 * index builder, a TTS engine, or an AI summarizer without pinning the
 * whole document.
 */
export async function* streamText(
  doc: PdfjsDocumentProxy,
  options: { from?: number; to?: number; signal?: AbortSignal } = {},
): AsyncGenerator<PageText, void, void> {
  const from = Math.max(1, options.from ?? 1);
  const to = Math.min(doc.numPages, options.to ?? doc.numPages);
  for (let i = from; i <= to; i += 1) {
    if (options.signal?.aborted) {
      throw new DOMException("Text streaming aborted", "AbortError");
    }
    const page = await doc.getPage(i);
    try {
      yield await extractPageText(page);
    } finally {
      page.cleanup();
    }
  }
}
