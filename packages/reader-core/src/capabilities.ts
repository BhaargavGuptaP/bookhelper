/**
 * **ReaderCapabilities** — what an adapter promises it can do.
 *
 * The Reader UI consults this object to decide whether to render an
 * affordance (e.g. should we show the "Search" button? a TOC panel?
 * a zoom slider?). Plugins consult it before registering keybindings
 * or commands that depend on a feature.
 *
 * Capabilities are **declarative**. An adapter reports the union of all
 * the things its format can express; runtime checks still apply (a
 * particular document may have no TOC even though the format supports
 * one — that's the difference between `capabilities.toc` and
 * `state.toc.length > 0`).
 *
 * The list below is intentionally broad and forward-looking (covering
 * formats we don't yet have adapters for) because **adding a capability
 * later is more expensive than reserving the slot now** — every consumer
 * of `ReaderCapabilities` would have to update. Sprint 3A's whole reason
 * to exist is to get these contracts right before any adapter ships.
 */

import type { RenderMode } from "./document-model.js";

/** Coarse set of layout modes an adapter can render in. */
export type LayoutMode = "paginated" | "scroll" | "spread";

/**
 * The full capability matrix. Every flag defaults to `false` if missing —
 * unknown capabilities are unsupported, never assumed.
 */
export interface ReaderCapabilities {
  // ── Structure ────────────────────────────────────────────────────────
  /** Render mode(s) the adapter natively supports. */
  readonly renderModes: readonly RenderMode[];
  /** Layout modes the adapter can drive (paginated / scroll / two-up). */
  readonly layoutModes: readonly LayoutMode[];

  // ── Navigation & discovery ───────────────────────────────────────────
  readonly toc: boolean;
  readonly pageNumbers: boolean;
  readonly thumbnails: boolean;
  readonly search: boolean;
  readonly links: boolean;
  readonly footnotes: boolean;
  readonly references: boolean;
  readonly bookmarks: boolean;

  // ── Annotation surfaces ──────────────────────────────────────────────
  readonly selection: boolean;
  readonly highlights: boolean;
  readonly annotations: boolean;

  // ── Content kinds ────────────────────────────────────────────────────
  readonly images: boolean;
  readonly tables: boolean;
  readonly code: boolean;
  readonly math: boolean;
  readonly media: boolean;
  /** True if text content is available via OCR (scanned pages, image-only EPUB). */
  readonly ocr: boolean;

  // ── View controls ────────────────────────────────────────────────────
  readonly zoom: boolean;
  readonly reflow: boolean;
  readonly dualView: boolean;

  // ── Output / interop ─────────────────────────────────────────────────
  readonly printing: boolean;
  readonly copy: boolean;
  readonly export: boolean;

  // ── Read-aloud / a11y ────────────────────────────────────────────────
  readonly tts: boolean;
  readonly screenReader: boolean;

  /**
   * Adapter-defined extension bag for capabilities that don't fit the
   * above. Capability discovery code should treat unknown keys as
   * informational only.
   */
  readonly extras?: Readonly<Record<string, boolean>>;
}

/**
 * The conservative "nothing supported" baseline. Adapters spread their
 * supported flags over this so missing fields stay `false` (per the
 * "default to unsupported" rule).
 *
 * ```ts
 * const caps: ReaderCapabilities = {
 *   ...emptyCapabilities,
 *   renderModes: ["reflowable"],
 *   selection: true,
 *   search: true,
 * };
 * ```
 */
export const emptyCapabilities: ReaderCapabilities = Object.freeze({
  renderModes: Object.freeze([]) as readonly RenderMode[],
  layoutModes: Object.freeze([]) as readonly LayoutMode[],
  toc: false,
  pageNumbers: false,
  thumbnails: false,
  search: false,
  links: false,
  footnotes: false,
  references: false,
  bookmarks: false,
  selection: false,
  highlights: false,
  annotations: false,
  images: false,
  tables: false,
  code: false,
  math: false,
  media: false,
  ocr: false,
  zoom: false,
  reflow: false,
  dualView: false,
  printing: false,
  copy: false,
  export: false,
  tts: false,
  screenReader: false,
});

/** Capability key — every boolean flag exposed above. */
export type CapabilityFlag = NonNullable<
  {
    [K in keyof ReaderCapabilities]: ReaderCapabilities[K] extends boolean ? K : never;
  }[keyof ReaderCapabilities]
>;

/**
 * Check whether a capability is enabled. Centralizing this lets us evolve
 * the capability model later (e.g. tri-state "experimental") without
 * rewriting every call site.
 */
export function hasCapability(caps: ReaderCapabilities, flag: CapabilityFlag): boolean {
  return caps[flag] === true;
}
