/**
 * **Virtualization** — turn a visible range into a *render window* that
 * includes an overscan band, so scrolling never paints a blank page.
 *
 * Inputs: visible range, page count, overscan size (in pages).
 * Outputs: contiguous page indices the host should mount + a list of
 * the just-leaving pages it should keep cached for a moment to avoid
 * scroll-flicker.
 *
 * READER-SPEC §7.2 specifies overscan in pages, not pixels — the host
 * decides how many to keep based on the device/network and we don't
 * try to be clever here.
 */

import type { VisibleRange } from "./visibility.js";

export interface RenderWindow {
  /** 1-based inclusive first page to mount. */
  readonly firstPage: number;
  /** 1-based inclusive last page to mount. */
  readonly lastPage: number;
  /** Pages outside the visible range but still kept for warm scrolling. */
  readonly overscan: { readonly before: number; readonly after: number };
  /** Distinct ordered list of pages to mount (firstPage..lastPage). */
  readonly pages: readonly number[];
}

export const EMPTY_WINDOW: RenderWindow = Object.freeze({
  firstPage: 0,
  lastPage: 0,
  overscan: { before: 0, after: 0 },
  pages: Object.freeze([] as number[]),
});

export interface ComputeWindowInput {
  readonly visible: VisibleRange;
  readonly pageCount: number;
  /** Pages to keep mounted before the first visible page. Default 1. */
  readonly overscanBefore?: number;
  /** Pages to keep mounted after the last visible page. Default 2. */
  readonly overscanAfter?: number;
}

export function computeRenderWindow(input: ComputeWindowInput): RenderWindow {
  const { visible, pageCount } = input;
  if (pageCount === 0 || visible.firstPage === 0) return EMPTY_WINDOW;

  const before = Math.max(0, input.overscanBefore ?? 1);
  const after = Math.max(0, input.overscanAfter ?? 2);

  const firstPage = Math.max(1, visible.firstPage - before);
  const lastPage = Math.min(pageCount, visible.lastPage + after);

  const pages: number[] = [];
  for (let p = firstPage; p <= lastPage; p += 1) pages.push(p);

  return {
    firstPage,
    lastPage,
    overscan: {
      before: visible.firstPage - firstPage,
      after: lastPage - visible.lastPage,
    },
    pages,
  };
}

/** Compute which pages newly entered or exited between two windows. */
export function diffWindows(
  prev: RenderWindow,
  next: RenderWindow,
): {
  readonly entered: readonly number[];
  readonly exited: readonly number[];
} {
  const prevSet = new Set(prev.pages);
  const nextSet = new Set(next.pages);
  const entered: number[] = [];
  const exited: number[] = [];
  for (const p of next.pages) if (!prevSet.has(p)) entered.push(p);
  for (const p of prev.pages) if (!nextSet.has(p)) exited.push(p);
  return { entered, exited };
}
