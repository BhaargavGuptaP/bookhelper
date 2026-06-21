/**
 * Build a `ReaderCapabilities` matrix for an opened PDF.
 *
 * Capabilities are **dynamic** per-document: a scanned PDF without a
 * text layer reports `selection: false`, an encrypted PDF without copy
 * permission reports `copy: false`, a tiny one-page PDF without an
 * outline reports `toc: false`. The matrix is the contract Reader UI
 * uses to decide whether to render an affordance.
 *
 * What we always say PDF can do:
 *   • fixed-layout rendering (READER-SPEC §1.2 / §5.3),
 *   • paginated + scroll + two-up layout modes,
 *   • zoom,
 *   • images, links.
 *
 * What we figure out from the actual file:
 *   • TOC: present iff outline non-empty.
 *   • Selection / search / text layer: present iff at least one page
 *     has extractable text.
 *   • Copy / print: gated by the document's permission flags.
 *   • Annotations (native PDF annotations — not our highlights):
 *     present iff at least one page has any annotation.
 *   • Forms / signatures: present iff a Widget / Sig annotation exists.
 *
 * "Don't know yet" is reported as **false** by default — adapters must
 * promise what they support, not aspire to it. The probe runs against
 * the first few pages so opening a 1000-page PDF stays instant; the
 * `extras.partial` flag lets the UI know the matrix may be a lower bound.
 */

import { emptyCapabilities, type ReaderCapabilities } from "@bookhelper/reader-core";
import type { PdfjsDocumentProxy } from "./internal/pdfjs.js";
import type { PdfPermissions } from "./manifest.js";

/** How many pages to probe before declaring the matrix. */
const PROBE_PAGES_DEFAULT = 4;

export interface BuildCapabilitiesInput {
  readonly doc: PdfjsDocumentProxy;
  readonly permissions: PdfPermissions;
  readonly hasOutline: boolean;
  readonly probePages?: number;
  readonly signal?: AbortSignal;
}

export interface CapabilityProbe {
  readonly hasText: boolean;
  readonly hasAnnotations: boolean;
  readonly hasLinks: boolean;
  readonly hasForms: boolean;
  readonly hasSignatures: boolean;
  readonly probedPages: number;
  readonly totalPages: number;
}

/**
 * Probe a handful of pages for text/annotations/forms/signatures. Used
 * by both the capability builder and the manifest builder (the latter
 * wants the `encrypted` flag derived from permissions). Extracted into a
 * pure function so it's trivial to test.
 */
export async function probeCapabilities(input: BuildCapabilitiesInput): Promise<CapabilityProbe> {
  const probeLimit = Math.min(input.probePages ?? PROBE_PAGES_DEFAULT, input.doc.numPages);
  let hasText = false;
  let hasAnnotations = false;
  let hasLinks = false;
  let hasForms = false;
  let hasSignatures = false;

  for (let i = 1; i <= probeLimit; i += 1) {
    if (input.signal?.aborted) break;
    const page = await input.doc.getPage(i);
    try {
      if (!hasText) {
        const content = await page.getTextContent({ disableNormalization: false });
        if (content.items.some((it) => typeof it.str === "string" && it.str.length > 0)) {
          hasText = true;
        }
      }
      const annots = await page.getAnnotations();
      for (const a of annots) {
        const subtype = (a.subtype ?? "").toLowerCase();
        if (subtype) hasAnnotations = true;
        if (subtype === "link") hasLinks = true;
        if (subtype === "widget") hasForms = true;
        if (subtype === "sig") hasSignatures = true;
      }
    } finally {
      page.cleanup();
    }
  }

  return {
    hasText,
    hasAnnotations,
    hasLinks,
    hasForms,
    hasSignatures,
    probedPages: probeLimit,
    totalPages: input.doc.numPages,
  };
}

/** Compose the final {@link ReaderCapabilities}. */
export function buildCapabilities(
  probe: CapabilityProbe,
  permissions: PdfPermissions,
  hasOutline: boolean,
): ReaderCapabilities {
  const allowCopy = permissions.copy !== false; // null/true == permitted
  const allowPrint = permissions.print !== false;
  const partial = probe.probedPages < probe.totalPages;

  return {
    ...emptyCapabilities,
    renderModes: ["fixed"],
    layoutModes: ["paginated", "scroll", "spread"],
    toc: hasOutline,
    pageNumbers: true,
    thumbnails: true,
    search: probe.hasText,
    links: probe.hasLinks,
    footnotes: false,
    references: false,
    bookmarks: true,
    selection: probe.hasText,
    highlights: probe.hasText,
    annotations: probe.hasAnnotations,
    images: true,
    tables: false,
    code: false,
    math: false,
    media: false,
    zoom: true,
    reflow: false,
    dualView: probe.hasText, // a derived reflow "Clean Read" is feasible iff text exists
    printing: allowPrint,
    copy: allowCopy,
    export: allowCopy,
    tts: probe.hasText,
    screenReader: probe.hasText,
    extras: Object.freeze({
      forms: probe.hasForms,
      signatures: probe.hasSignatures,
      accessibilityTags: probe.hasText, // best signal we have without inspecting StructTreeRoot
      layers: false,
      partial,
    }),
  };
}
