/**
 * **Page measurements** — intrinsic widths/heights per page plus the
 * derived layout (cumulative offsets, total content size).
 *
 * For fixed-layout formats (PDF) this is the geometry the adapter
 * reports. For reflowable formats the host will measure into block
 * heights and call `setBlockSize`; the public shape is identical.
 *
 * The store is **cache-friendly**: every measurement is keyed by an
 * opaque id (page number, block id), and the derived layout is
 * recomputed lazily on the first read after any change.
 *
 * Why not just hold an array? Because adapters discover measurements
 * lazily — a 1000-page PDF gets dimensions for the first 4 pages at
 * open time and the rest on demand. The store needs to handle holes.
 */

import { createEmitter, type Emitter, type Observable, type Unsubscribe } from "./observable.js";

export interface PageSize {
  readonly width: number;
  readonly height: number;
}

/** A measured page's offset within the document scroll height. */
export interface PageMetrics {
  readonly index: number; // 1-based to match locators
  readonly size: PageSize;
  /** Top offset within the document (CSS px), gap-inclusive. */
  readonly top: number;
  /** Bottom offset within the document (CSS px). */
  readonly bottom: number;
}

export interface MeasurementsState {
  readonly pageCount: number;
  /** Total scroll height across all known pages + gaps. */
  readonly totalHeight: number;
  /** The widest known page (drives content width / fit-width math). */
  readonly maxWidth: number;
  /** Per-page metrics (index 0 unused; 1..pageCount). */
  readonly metrics: ReadonlyArray<PageMetrics | undefined>;
}

export interface MeasurementsController {
  readonly state: Observable<MeasurementsState>;
  /** Report or refine the size of a single page. 1-based index. */
  setPageSize(index: number, size: PageSize): void;
  /** Report many sizes at once. */
  setPageSizes(sizes: ReadonlyArray<{ readonly index: number; readonly size: PageSize }>): void;
  /** Replace the total page count (e.g. when the document opens). */
  setPageCount(pageCount: number): void;
  /** Adjust the gap between pages (CSS px). Defaults to 16. */
  setPageGap(gap: number): void;
  /** Subscribe to changes. */
  subscribe(listener: (s: MeasurementsState) => void): Unsubscribe;
}

export interface CreateMeasurementsOptions {
  readonly pageCount?: number;
  readonly defaultSize?: PageSize;
  readonly pageGap?: number;
}

const DEFAULT_SIZE: PageSize = { width: 612, height: 792 }; // US Letter @ 72dpi
const DEFAULT_GAP = 16;

export function createMeasurements(
  options: CreateMeasurementsOptions = {},
): MeasurementsController {
  const defaultSize = options.defaultSize ?? DEFAULT_SIZE;
  let gap = options.pageGap ?? DEFAULT_GAP;
  let pageCount = Math.max(0, options.pageCount ?? 0);
  /** Sparse sizes by 1-based index. `undefined` => not yet measured (use default). */
  let sizes: Array<PageSize | undefined> = new Array(pageCount + 1).fill(undefined);

  const initialState: MeasurementsState = derive(pageCount, sizes, gap, defaultSize);
  const emitter: Emitter<MeasurementsState> = createEmitter(initialState, { equals: stateEquals });

  function recompute(): void {
    emitter.emit(derive(pageCount, sizes, gap, defaultSize));
  }

  return {
    state: emitter,
    setPageSize(index, size) {
      if (!Number.isInteger(index) || index < 1) return;
      if (size.width < 0 || size.height < 0) return;
      if (index > pageCount) {
        // Allow lazy expansion if the adapter raises the page count later.
        pageCount = index;
        sizes.length = pageCount + 1;
      }
      const prev = sizes[index];
      if (prev && prev.width === size.width && prev.height === size.height) return;
      sizes[index] = size;
      recompute();
    },
    setPageSizes(items) {
      let changed = false;
      for (const { index, size } of items) {
        if (!Number.isInteger(index) || index < 1) continue;
        if (size.width < 0 || size.height < 0) continue;
        if (index > pageCount) {
          pageCount = index;
          sizes.length = pageCount + 1;
        }
        const prev = sizes[index];
        if (!prev || prev.width !== size.width || prev.height !== size.height) {
          sizes[index] = size;
          changed = true;
        }
      }
      if (changed) recompute();
    },
    setPageCount(count) {
      const next = Math.max(0, count);
      if (next === pageCount) return;
      pageCount = next;
      // Truncate or extend the sizes array preserving existing measurements.
      const newSizes: Array<PageSize | undefined> = new Array(pageCount + 1).fill(undefined);
      for (let i = 1; i <= Math.min(pageCount, sizes.length - 1); i += 1) {
        newSizes[i] = sizes[i];
      }
      sizes = newSizes;
      recompute();
    },
    setPageGap(nextGap) {
      const g = Math.max(0, nextGap);
      if (g === gap) return;
      gap = g;
      recompute();
    },
    subscribe(listener) {
      return emitter.subscribe(listener);
    },
  };
}

function derive(
  pageCount: number,
  sizes: ReadonlyArray<PageSize | undefined>,
  gap: number,
  defaultSize: PageSize,
): MeasurementsState {
  const metrics: Array<PageMetrics | undefined> = new Array(pageCount + 1).fill(undefined);
  let cursor = 0;
  let maxWidth = 0;
  for (let i = 1; i <= pageCount; i += 1) {
    const size = sizes[i] ?? defaultSize;
    if (size.width > maxWidth) maxWidth = size.width;
    const top = cursor;
    const bottom = top + size.height;
    metrics[i] = { index: i, size, top, bottom };
    cursor = bottom + (i < pageCount ? gap : 0);
  }
  return {
    pageCount,
    totalHeight: cursor,
    maxWidth,
    metrics,
  };
}

function stateEquals(a: MeasurementsState, b: MeasurementsState): boolean {
  return (
    a.pageCount === b.pageCount &&
    a.totalHeight === b.totalHeight &&
    a.maxWidth === b.maxWidth &&
    a.metrics === b.metrics
  );
}
