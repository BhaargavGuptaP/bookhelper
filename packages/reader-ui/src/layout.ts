/**
 * Pure layout helpers shared by the viewport and page components. Kept
 * dependency-free so they're trivially testable.
 */

import type { LineSpacing, Measure } from "@bookhelper/reader-core";

/**
 * Unscaled page (reading column) width for a measure preset, in CSS px.
 * This is the zoom-independent geometry reported to the render engine;
 * zoom is layered on top as a visual transform.
 */
export function pageWidthForMeasure(measure: Measure): number {
  switch (measure) {
    case "narrow":
      return 600;
    case "wide":
      return 860;
    case "medium":
    default:
      return 720;
  }
}

/** Line-height multiplier for a line-spacing preset. */
export function lineHeightForSpacing(spacing: LineSpacing): number {
  switch (spacing) {
    case "compact":
      return 1.45;
    case "relaxed":
      return 1.9;
    case "comfortable":
    default:
      return 1.65;
  }
}

/** Clamp a number into `[lo, hi]`. */
export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}
