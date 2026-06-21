/**
 * The **Universal Locator** — the single coordinate system used by every
 * feature that points into any document.
 *
 * Highlights, notes, bookmarks, search hits, AI citations, scroll position,
 * progress markers — all of them are stored as `Locator`s. Because every
 * format reduces to the same shape, no UI code, plugin, or command has to
 * ask "what kind of document is this?".
 *
 * The schema follows {@link ../../../READER-SPEC.md} §4.2 exactly:
 *   • A `point` is a single position.
 *   • A `range` is a pair of points with a start and end.
 *
 * Each position carries three independent anchors so it can be resolved
 * even after re-ingestion (READER-SPEC §4.3, the three-strategy cascade):
 *
 *   1. **Native fast-path** — format-specific quads/CFI (`native`).
 *   2. **Structural** — `{ blockId, offset }`.
 *   3. **Quote** — `{ prefix, exact, suffix }` for fuzzy re-anchoring.
 *
 * No code in this package implements that cascade; it lives in the
 * adapter's `LocatorService`. We only describe its inputs/outputs.
 */

/** Document Model version number. Bumped by ingestion on re-parse. */
export type DocVersion = number;

/** Stable block identity — content-addressed (READER-SPEC §3.1). */
export type BlockId = string;

/** Stable document identity. */
export type DocumentId = string;

/**
 * Format-native render hint embedded in a locator. The reader-core never
 * looks inside; it just hands it back to the adapter that produced it.
 *
 * Examples adapters will use (not implemented here):
 *   • PDF:  `{ kind: "pdf", page: number, quads: number[][] }`
 *   • EPUB: `{ kind: "epub-cfi", cfi: string }`
 *   • Video transcript: `{ kind: "media", tStart: number, tEnd: number }`
 */
export interface NativeAnchor {
  readonly kind: string;
  readonly [key: string]: unknown;
}

/**
 * The robustness anchor used to re-locate a position after the document
 * has been re-ingested or lightly edited. Conventionally ~32 chars each.
 */
export interface QuoteAnchor {
  readonly prefix: string;
  readonly exact: string;
  readonly suffix: string;
}

/**
 * A single position inside a document. The three anchors (`native`,
 * `{blockId, offset}`, `quote`) are redundant on purpose — see the
 * resolution cascade in READER-SPEC §4.3.
 */
export interface Position {
  /** Primary structural anchor. */
  readonly blockId: BlockId;
  /** Character offset into the block's normalized text. */
  readonly offset: number;
  /**
   * Denormalized `cumulativeCharStart + offset`. Used for O(1) ordering
   * and progress math; never trusted as primary anchor across re-ingests.
   */
  readonly globalOffset: number;
  /** Document Model version this position was created against. */
  readonly docVersion: DocVersion;
  /** Optional format-native fast path. */
  readonly native?: NativeAnchor;
  /** Optional quote-based fallback anchor. */
  readonly quote?: QuoteAnchor;
}

/** A locator that points at a single position. */
export interface PointLocator {
  readonly kind: "point";
  readonly position: Position;
}

/** A locator that spans a range of positions, end exclusive. */
export interface RangeLocator {
  readonly kind: "range";
  readonly start: Position;
  readonly end: Position;
}

/** The canonical locator union — every "where in the doc" reference. */
export type Locator = PointLocator | RangeLocator;

/** Convenience type guard. */
export function isPointLocator(loc: Locator): loc is PointLocator {
  return loc.kind === "point";
}

/** Convenience type guard. */
export function isRangeLocator(loc: Locator): loc is RangeLocator {
  return loc.kind === "range";
}

/**
 * The {@link Position} a locator starts at. Centralizes the point/range
 * distinction so callers never branch on `kind` themselves.
 */
export function locatorStart(loc: Locator): Position {
  return loc.kind === "point" ? loc.position : loc.start;
}

/** The {@link Position} a locator ends at (== start for points). */
export function locatorEnd(loc: Locator): Position {
  return loc.kind === "point" ? loc.position : loc.end;
}

/**
 * Total order over positions. Sorts by `globalOffset`, then `blockId`,
 * then `offset` as a stable tie-breaker. Comparing positions across
 * different `docVersion`s is meaningful only after re-anchoring; we still
 * return a deterministic order so collections stay sorted.
 *
 * Returns < 0 / 0 / > 0 in the usual `Array.prototype.sort` sense.
 */
export function comparePositions(a: Position, b: Position): number {
  if (a.globalOffset !== b.globalOffset) return a.globalOffset - b.globalOffset;
  if (a.blockId !== b.blockId) return a.blockId < b.blockId ? -1 : 1;
  return a.offset - b.offset;
}

/**
 * Total order over locators. Sorts by start position first, then by end —
 * so a point and the range starting at it sort point-first, and nested
 * ranges sort by outermost-first.
 */
export function compareLocators(a: Locator, b: Locator): number {
  const s = comparePositions(locatorStart(a), locatorStart(b));
  if (s !== 0) return s;
  return comparePositions(locatorEnd(a), locatorEnd(b));
}
