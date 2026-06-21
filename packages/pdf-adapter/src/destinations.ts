/**
 * Resolve a PDF "destination" — a named destination string, an explicit
 * destination array, or a raw page reference — to a **1-based page
 * index**.
 *
 * Used by:
 *   • Outline / TOC building (each entry's `dest`).
 *   • Internal link enumeration.
 *   • The navigation engine's `goToDestination` command.
 *
 * Returns `null` if the destination cannot be resolved (the caller then
 * raises a typed `PdfAdapterError("E_PDF_DESTINATION_NOT_FOUND")`).
 *
 * Notes
 *
 *   • PDF destinations come in two shapes:
 *     - Named (a string the document's "Names" tree looks up).
 *     - Explicit array `[pageRef, /XYZ, x, y, zoom]` (and variants).
 *   • pdfjs returns either; we accept both. We rely on
 *     `getPageIndex(ref)` which returns the *0-based* page index, then
 *     normalize to 1-based.
 *   • For purely fitted destinations (`/Fit`) we just return the page.
 *     Future versions may also surface the (x, y) anchor.
 */

import type { PdfjsDocumentProxy } from "./internal/pdfjs.js";

/**
 * Resolve any destination shape to a 1-based page index, or `null` if
 * it does not point at a real page.
 */
export async function resolveDestinationToPage(
  doc: PdfjsDocumentProxy,
  dest: unknown,
): Promise<number | null> {
  let explicit: unknown[] | null;
  if (typeof dest === "string") {
    explicit = await safe(() => doc.getDestination(dest));
  } else if (Array.isArray(dest)) {
    explicit = dest;
  } else {
    explicit = null;
  }
  if (!explicit || explicit.length === 0) return null;
  const ref = explicit[0];
  if (!ref || typeof ref !== "object") return null;
  // pdfjs destinations use either a Ref ({ num, gen }) or a 0-based
  // page index (number) depending on the document.
  if (typeof (ref as { num?: unknown }).num === "number") {
    const idx = await safe(() => doc.getPageIndex(ref as { num: number; gen: number }));
    return idx === null || idx === undefined ? null : idx + 1;
  }
  if (typeof ref === "number") {
    return Number.isInteger(ref) && ref >= 0 ? ref + 1 : null;
  }
  return null;
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
