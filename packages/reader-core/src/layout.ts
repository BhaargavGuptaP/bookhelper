/**
 * **LayoutEngine** — the adapter-supplied module that turns a viewport
 * + a position into a *window* of content the renderer should paint.
 *
 * The reader-core never measures anything itself. Different formats lay
 * out wildly differently:
 *   • PDF (fixed): page geometry is intrinsic; layout = clamping to a
 *     rasterizable page range.
 *   • EPUB (reflowable): layout depends on font, measure, viewport,
 *     theme — paginated breaks must be measured (READER-SPEC §6.1).
 *   • Markdown / TXT: similar to EPUB but client-side fast-path.
 *   • Future formats (video transcript, web page): may have entirely
 *     different units (seconds, scroll fractions).
 *
 * Rather than try to model all of that in core, we describe the *seam*:
 * give the adapter a viewport + position, it returns a `LayoutWindow`
 * that bounds what's currently on screen and what should be eagerly
 * rendered around it. Concrete rendering (DOM, canvas, SVG) is the
 * adapter's job; the core only consumes the window for state tracking
 * (visible range, current page, progress).
 */

import type { BlockSummary } from "./document-model.js";
import type { PointLocator } from "./locator.js";
import type { ReaderPreferences } from "./preferences.js";

/**
 * Coarse description of the viewport. Unit-agnostic on purpose — the
 * adapter decides how to interpret it.
 */
export interface Viewport {
  /** Width and height in CSS pixels (or whatever unit the host uses). */
  readonly width: number;
  readonly height: number;
  /** Device pixel ratio for canvas rasterization. Defaults to 1. */
  readonly devicePixelRatio?: number;
}

/**
 * A measured slice of the document the renderer should paint. Returned
 * by `LayoutEngine.measure`.
 */
export interface LayoutWindow {
  /** Inclusive start position of what is visible (top of the viewport). */
  readonly from: PointLocator;
  /** Inclusive end position of what is visible (bottom of the viewport). */
  readonly to: PointLocator;
  /**
   * Optional buffered range the adapter has prepared either side of the
   * visible window (READER-SPEC §7.2 virtualization). The core uses this
   * for "is this locator already rendered?" checks before scrolling.
   */
  readonly buffered?: { readonly from: PointLocator; readonly to: PointLocator };
  /** Block summaries inside the window, ordered by `ord`. */
  readonly blocks: readonly BlockSummary[];
  /**
   * For fixed-layout formats — the page index currently centered in the
   * viewport. Omitted for reflowable.
   */
  readonly currentPage?: number;
  /** Total reading progress in `[0, 1]`, computed by the adapter. */
  readonly progress: number;
}

/**
 * The adapter's layout module. **Pure** with respect to its inputs:
 * given the same viewport, anchor, and preferences, it must return the
 * same window (modulo any caching of measurements).
 *
 * The interface is deliberately tiny so adapters can implement it with
 * one method that delegates to format-specific internals (PDF.js page
 * geometry, CSS columns, audio time stamps).
 */
export interface LayoutEngine {
  /**
   * Measure the layout for a given viewport + anchor. The anchor is the
   * position the reader is trying to keep stable (e.g. last-read locator
   * during a font-size change).
   */
  measure(input: {
    readonly viewport: Viewport;
    readonly anchor: PointLocator;
    readonly preferences: ReaderPreferences;
  }): Promise<LayoutWindow> | LayoutWindow;

  /**
   * Optional invalidation hook — the host calls this when something
   * outside the (viewport, anchor, prefs) tuple changes that may affect
   * layout (e.g. fonts finished loading, a CSS theme variable changed).
   * Adapters that don't cache can no-op.
   */
  invalidate?(): void;
}
