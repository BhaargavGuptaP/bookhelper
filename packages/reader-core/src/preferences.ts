/**
 * **ReaderPreferences** — the user-facing reading settings.
 *
 * These are stored per-user (and may be overridden per-document by the
 * shell). The reader-core treats preferences as opaque state — it merges
 * them into the global state, emits a `PreferenceChanged` event when they
 * mutate, and exposes them to adapters via the layout pipeline. *How*
 * the adapter consumes them (font size → CSS variable, zoom → canvas
 * scale, etc.) is the adapter's business.
 *
 * The shape mirrors what UX-DESIGN.md §3 and DESIGN-SYSTEM.md §21 expose
 * as reading controls. Values are intentionally normalized (e.g. zoom is
 * a unitless multiplier, not a percentage string) so adapters do not
 * have to parse them.
 */

import type { LayoutMode } from "./capabilities.js";

/** Reading theme — content-layer theme, independent of app chrome. */
export type ReadingTheme = "system" | "light" | "sepia" | "dark" | "high-contrast";

/** Font family bucket; specific fonts are resolved by the shell. */
export type FontFamily = "serif" | "sans-serif" | "dyslexic" | "monospace";

/** Reading-flow direction preference (override over document direction). */
export type FlowDirection = "auto" | "ltr" | "rtl";

/** Vertical rhythm. */
export type LineSpacing = "compact" | "comfortable" | "relaxed";

/** Horizontal measure / column width preset. */
export type Measure = "narrow" | "medium" | "wide";

export interface ReaderPreferences {
  readonly theme: ReadingTheme;
  readonly fontFamily: FontFamily;
  /** Multiplier over the base reading font size (1 == base, 1.25 == +25%). */
  readonly fontScale: number;
  readonly lineSpacing: LineSpacing;
  readonly measure: Measure;
  readonly flow: FlowDirection;
  /** Preferred layout mode; honored only if the adapter supports it. */
  readonly layoutMode: LayoutMode;
  /** Unitless zoom multiplier for fixed-layout formats. */
  readonly zoom: number;
  /** Honor `prefers-reduced-motion`; defaults to true. */
  readonly reducedMotion: boolean;
  /** Render hyphenation? (reflowable adapters). */
  readonly hyphenate: boolean;
  /** Show invisible page-break indicators? */
  readonly showPageBreaks: boolean;
}

/**
 * Calm, accessible defaults aligned with the design system's reading
 * surface. Adapters and the shell may merge their own overrides on top.
 */
export const defaultPreferences: ReaderPreferences = Object.freeze({
  theme: "system",
  fontFamily: "serif",
  fontScale: 1,
  lineSpacing: "comfortable",
  measure: "medium",
  flow: "auto",
  layoutMode: "scroll",
  zoom: 1,
  reducedMotion: true,
  hyphenate: false,
  showPageBreaks: false,
});

/**
 * Produce a new preferences object with the given patch applied. We use
 * structural copy rather than mutation so subscribers can detect changes
 * with referential equality.
 */
export function withPreferences(
  base: ReaderPreferences,
  patch: Partial<ReaderPreferences>,
): ReaderPreferences {
  return Object.freeze({ ...base, ...patch });
}
