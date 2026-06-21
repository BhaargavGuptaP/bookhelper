/**
 * **Visible-page detection** — given a scroll position + viewport
 * height, return the inclusive page range currently visible.
 *
 * This is a pure function over `MeasurementsState`. The runtime calls
 * it on viewport/zoom/measurement changes; the virtualization layer
 * builds an overscan window around the result.
 *
 * Binary search over cumulative offsets so a 1000-page document is
 * O(log n) per query — measured & cached in `runtime.ts` to avoid
 * per-frame recomputation.
 */

import type { MeasurementsState, PageMetrics } from "./measurements.js";

export interface VisibleRange {
  /** 1-based inclusive first visible page (0 if no pages). */
  readonly firstPage: number;
  /** 1-based inclusive last visible page (0 if no pages). */
  readonly lastPage: number;
  /** Page closest to the viewport center, used for "current page" UI. */
  readonly centerPage: number;
  /** Fraction of the centerPage that is above the fold (0..1). */
  readonly centerFraction: number;
}

export const EMPTY_VISIBLE: VisibleRange = Object.freeze({
  firstPage: 0,
  lastPage: 0,
  centerPage: 0,
  centerFraction: 0,
});

export interface ComputeVisibleInput {
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly zoom: number;
  readonly measurements: MeasurementsState;
}

export function computeVisible(input: ComputeVisibleInput): VisibleRange {
  const { measurements } = input;
  const zoom = input.zoom > 0 ? input.zoom : 1;
  if (measurements.pageCount === 0 || input.viewportHeight <= 0) return EMPTY_VISIBLE;

  // Convert viewport space → content space (unzoomed).
  const top = input.scrollTop / zoom;
  const bottom = top + input.viewportHeight / zoom;
  const center = top + input.viewportHeight / (2 * zoom);

  const firstPage = pageAtOffset(measurements.metrics, measurements.pageCount, top, "first");
  const lastPage = pageAtOffset(measurements.metrics, measurements.pageCount, bottom, "last");
  const centerPage = pageAtOffset(measurements.metrics, measurements.pageCount, center, "first");

  // Fraction within centerPage.
  let centerFraction = 0;
  const pm = measurements.metrics[centerPage];
  if (pm) {
    const h = Math.max(1, pm.size.height);
    centerFraction = Math.min(1, Math.max(0, (center - pm.top) / h));
  }

  return { firstPage, lastPage, centerPage, centerFraction };
}

/**
 * Binary search for the page that contains the given vertical offset.
 * Pages are stored 1-based in `metrics`; we treat `metrics[0]` as
 * absent.
 *
 * `mode === "first"` returns the earliest matching page; "last" the
 * latest (used for the bottom boundary to include the page that
 * straddles the fold).
 */
function pageAtOffset(
  metrics: ReadonlyArray<PageMetrics | undefined>,
  pageCount: number,
  offset: number,
  mode: "first" | "last",
): number {
  if (pageCount === 0) return 0;
  let lo = 1;
  let hi = pageCount;
  // Clamp to the document — overflow at either end pins to the boundary page.
  const firstTop = metrics[1]?.top ?? 0;
  const lastBottom = metrics[pageCount]?.bottom ?? 0;
  if (offset <= firstTop) return 1;
  if (offset >= lastBottom) return pageCount;
  while (lo < hi) {
    const mid = mode === "first" ? (lo + hi) >> 1 : (lo + hi + 1) >> 1;
    const m = metrics[mid];
    if (!m) {
      // Missing measurements (e.g. lazy load) — back off conservatively.
      if (mode === "first") hi = mid - 1 < lo ? lo : mid - 1;
      else lo = mid + 1 > hi ? hi : mid + 1;
      continue;
    }
    if (offset < m.top) {
      hi = mid - 1;
    } else if (offset > m.bottom) {
      lo = mid + 1;
    } else {
      return mid;
    }
  }
  return lo;
}
