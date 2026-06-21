/**
 * **Locator codec** — round-trip translation between reader-core locators
 * and PDF coordinates.
 *
 * Every highlight, bookmark, search hit, AI citation, and progress
 * marker that points into a PDF will travel through this codec. **Once
 * adapters ship, this mapping must not drift** — annotations stored
 * today must resolve to the same screen rects forever.
 *
 * The canonical form
 * ------------------
 *
 * A reader-core `Position` for a PDF carries:
 *
 *   • `blockId`     "page:N"  (N is 1-based) — one block per page.
 *   • `offset`      character offset *within the page's normalized text*.
 *   • `globalOffset`cumulative offset across the whole document (set by
 *                   the codec; tests assert it's monotonic).
 *   • `docVersion`  the manifest's `docVersion`.
 *   • `native`      `{ kind: "pdf", page, offset, quads? }` — the
 *                   format-native fast path for adapter resolution.
 *   • `quote`       optional `{ prefix, exact, suffix }` (set by the
 *                   selection layer, not here).
 *
 * The codec is **stateless** with respect to mutable state: it takes a
 * `PageOffsetTable` (precomputed cumulative offsets) and a `docVersion`
 * and emits/consumes positions. The table is computed once at open time
 * and reused for the lifetime of the session.
 *
 * Why a separate codec module? Because future formats (EPUB, video,
 * paper) will have their own codecs with the same shape. The interface
 * here is the template — keep it small.
 */

import type { BlockId, NativeAnchor, PointLocator, Position } from "@bookhelper/reader-core";

/** Constant `blockId` prefix used by this codec. */
export const PDF_BLOCK_PREFIX = "page:";

/**
 * Cumulative character offsets per page. Index 0 is unused (PDFs are
 * 1-indexed); `pageStarts[N]` is the global offset where page N begins.
 * `pageStarts[numPages + 1]` is the document's total char count.
 */
export interface PageOffsetTable {
  /** `pageStarts[1 .. numPages]` plus one sentinel at `numPages + 1`. */
  readonly pageStarts: readonly number[];
  /** Total normalized characters across the document. */
  readonly totalChars: number;
  /** Page count (1-based). */
  readonly numPages: number;
}

/** Inputs the codec needs for any encode/decode. */
export interface CodecContext {
  readonly table: PageOffsetTable;
  readonly docVersion: number;
}

/** Convert a `(page, offset)` tuple to a `Position`. */
export function positionFromPageOffset(
  ctx: CodecContext,
  page: number,
  offset: number,
  extras: { native?: NativeAnchor } = {},
): Position {
  if (!Number.isInteger(page) || page < 1 || page > ctx.table.numPages) {
    throw new RangeError(`Page ${page} out of range (1..${ctx.table.numPages}).`);
  }
  if (!Number.isFinite(offset) || offset < 0) {
    throw new RangeError(`Offset ${offset} must be a non-negative finite number.`);
  }
  const start = ctx.table.pageStarts[page] ?? 0;
  const pageChars = (ctx.table.pageStarts[page + 1] ?? start) - start;
  // Clamp to the page; callers that pass an offset past the end of the
  // page would otherwise create a position that compares wrong.
  const clamped = Math.min(offset, Math.max(0, pageChars));
  return {
    blockId: pageBlockId(page),
    offset: clamped,
    globalOffset: start + clamped,
    docVersion: ctx.docVersion,
    ...(extras.native ? { native: extras.native } : {}),
  };
}

/** Convert a `PointLocator` back to a `(page, offset)` tuple. */
export function pageOffsetFromPosition(position: Position): { page: number; offset: number } {
  const page = parsePageBlockId(position.blockId);
  if (page === null) {
    throw new TypeError(
      `Position blockId "${position.blockId}" is not a PDF page block (expected "${PDF_BLOCK_PREFIX}<N>").`,
    );
  }
  return { page, offset: position.offset };
}

/** Build a `PointLocator` pointing at the start of a page. */
export function pointAtPageStart(ctx: CodecContext, page: number): PointLocator {
  return {
    kind: "point",
    position: positionFromPageOffset(ctx, page, 0, {
      native: { kind: "pdf", page, offset: 0 },
    }),
  };
}

/** Build the block id for the given 1-based page. */
export function pageBlockId(page: number): BlockId {
  return `${PDF_BLOCK_PREFIX}${page}`;
}

/**
 * Parse a block id back to a 1-based page. Returns `null` for anything
 * that isn't a PDF-adapter block id (so callers can fall through to a
 * structural-recovery path for healed-across-formats migrations).
 */
export function parsePageBlockId(blockId: BlockId): number | null {
  if (!blockId.startsWith(PDF_BLOCK_PREFIX)) return null;
  const n = Number(blockId.slice(PDF_BLOCK_PREFIX.length));
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * Build an offset table from per-page char counts. Page indices are
 * 1-based; `charsByPage[i]` is the count for page `i + 1`.
 */
export function buildOffsetTable(charsByPage: readonly number[]): PageOffsetTable {
  const numPages = charsByPage.length;
  const pageStarts: number[] = new Array(numPages + 2).fill(0);
  let running = 0;
  for (let i = 0; i < numPages; i += 1) {
    pageStarts[i + 1] = running;
    const raw = charsByPage[i] ?? 0;
    const safe = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    running += safe;
  }
  pageStarts[numPages + 1] = running;
  return Object.freeze({
    pageStarts: Object.freeze(pageStarts) as readonly number[],
    totalChars: running,
    numPages,
  });
}
