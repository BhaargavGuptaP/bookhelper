/**
 * Enumerate **links** on a PDF page.
 *
 * Two flavors:
 *   • **External**: an `/A /URI` action — surfaced as `{ kind: "external", url, rect }`.
 *   • **Internal**: a destination (named or explicit) → we resolve the
 *     target page via pdfjs and surface `{ kind: "internal", page, rect }`.
 *
 * The destination resolver does the same dance the navigation engine
 * does for outlines — see `dest.ts`. We share the helper rather than
 * duplicating because both surfaces will diverge later (e.g. links
 * support fragment offsets; outlines don't).
 */

import type { PdfjsDocumentProxy, PdfjsPageProxy } from "./internal/pdfjs.js";
import { resolveDestinationToPage } from "./destinations.js";

export type PdfLink =
  | {
      readonly kind: "external";
      readonly url: string;
      readonly page: number;
      readonly rect: readonly number[] | null;
    }
  | {
      readonly kind: "internal";
      readonly targetPage: number;
      readonly page: number;
      readonly rect: readonly number[] | null;
    };

/** Enumerate every link annotation on the given page. */
export async function listLinksOnPage(
  doc: PdfjsDocumentProxy,
  page: PdfjsPageProxy,
): Promise<readonly PdfLink[]> {
  const annots = await page.getAnnotations();
  const out: PdfLink[] = [];
  for (const a of annots) {
    const subtype = (a.subtype ?? "").toLowerCase();
    if (subtype !== "link") continue;
    const rect = Array.isArray(a.rect) ? [...a.rect] : null;
    if (typeof a.url === "string" && a.url.length > 0) {
      out.push({ kind: "external", url: a.url, page: page.pageNumber, rect });
      continue;
    }
    if (a.dest !== undefined && a.dest !== null) {
      const target = await resolveDestinationToPage(doc, a.dest);
      if (target !== null) {
        out.push({ kind: "internal", targetPage: target, page: page.pageNumber, rect });
      }
    }
  }
  return out;
}
