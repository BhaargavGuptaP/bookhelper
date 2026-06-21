/**
 * **Coordinate mapping** — bidirectional translation between screen
 * space (scroll offsets) and document space (page + intra-page Y, or
 * the universal `PointLocator`).
 *
 * Format-specific resolution still lives in the adapter — we don't try
 * to compute character offsets from a Y coordinate here. The engine's
 * job is *positional*: which page are we on, and how far down it.
 *
 * For deeper resolution (Y → block, character), the caller hands the
 * resulting page + Y to the adapter's `NavigationEngine.resolve` (or
 * the layout engine's `measure`).
 */

import type { BlockId, DocVersion, PointLocator } from "@bookhelper/reader-core";
import type { MeasurementsState } from "./measurements.js";

export interface DocumentPoint {
  /** 1-based page index. */
  readonly page: number;
  /** Y offset within the page (content space, 0..page.height). */
  readonly y: number;
  /** Fraction of the page above the point (0..1). */
  readonly fraction: number;
}

export interface ScrollToInput {
  readonly page: number;
  /** Optional Y offset within the page (content space). */
  readonly y?: number;
  /** Optional anchor — `start` (top of page) or `center`. Default: `start`. */
  readonly anchor?: "start" | "center";
  /** Current viewport height (CSS px, screen space). */
  readonly viewportHeight: number;
  readonly zoom: number;
}

/** Translate a scroll offset to a document point. */
export function scrollToPoint(
  scrollTop: number,
  zoom: number,
  measurements: MeasurementsState,
): DocumentPoint {
  if (measurements.pageCount === 0) return { page: 0, y: 0, fraction: 0 };
  const offsetContent = scrollTop / Math.max(zoom, 0.0001);
  // Linear scan would be O(n); we reuse the visible-page binary search via
  // a small inline copy to avoid importing visibility (cyclical).
  let lo = 1;
  let hi = measurements.pageCount;
  if (offsetContent <= (measurements.metrics[1]?.top ?? 0)) {
    return { page: 1, y: 0, fraction: 0 };
  }
  if (offsetContent >= (measurements.metrics[measurements.pageCount]?.bottom ?? 0)) {
    const last = measurements.metrics[measurements.pageCount];
    if (last) {
      return {
        page: measurements.pageCount,
        y: last.size.height,
        fraction: 1,
      };
    }
  }
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const m = measurements.metrics[mid];
    if (!m) {
      hi = mid - 1 < lo ? lo : mid - 1;
      continue;
    }
    if (offsetContent < m.top) hi = mid - 1;
    else if (offsetContent > m.bottom) lo = mid + 1;
    else {
      const y = Math.max(0, Math.min(m.size.height, offsetContent - m.top));
      return {
        page: mid,
        y,
        fraction: m.size.height > 0 ? y / m.size.height : 0,
      };
    }
  }
  const m = measurements.metrics[lo];
  const y = m ? Math.max(0, Math.min(m.size.height, offsetContent - m.top)) : 0;
  return { page: lo, y, fraction: m && m.size.height > 0 ? y / m.size.height : 0 };
}

/** Translate a (page, y) to a scroll offset in viewport space. */
export function pointToScroll(input: ScrollToInput, measurements: MeasurementsState): number {
  if (measurements.pageCount === 0) return 0;
  const page = Math.min(Math.max(1, input.page), measurements.pageCount);
  const metrics = measurements.metrics[page];
  if (!metrics) return 0;
  const y = Math.max(0, Math.min(metrics.size.height, input.y ?? 0));
  const contentOffset = metrics.top + y;
  const screenOffset = contentOffset * input.zoom;
  if (input.anchor === "center") {
    return Math.max(0, screenOffset - input.viewportHeight / 2);
  }
  return Math.max(0, screenOffset);
}

/**
 * Build a `PointLocator` for a given page anchor. The block id is
 * synthesized by the caller-provided `blockIdForPage` to keep this
 * module format-agnostic — for PDF that's `"page:N"`; other formats
 * will encode differently.
 */
export function pointLocatorForPage(input: {
  readonly docVersion: DocVersion;
  readonly page: number;
  readonly offset?: number;
  readonly globalOffset?: number;
  readonly blockIdForPage: (page: number) => BlockId;
}): PointLocator {
  const offset = input.offset ?? 0;
  return {
    kind: "point",
    position: {
      docVersion: input.docVersion,
      blockId: input.blockIdForPage(input.page),
      offset,
      globalOffset: input.globalOffset ?? offset,
    },
  };
}
