/**
 * **Image enumeration** — metadata only.
 *
 * The adapter exposes image *descriptors* per page (name, kind, page,
 * approximate rect). It does not decode or extract pixels. Callers that
 * want the actual bytes will go through a future image extraction
 * plugin; for now Sprint 3B only declares the contract.
 *
 * Why ship this in 3B at all? Because the contract has to land before
 * any feature can depend on it. Search, AI, and figure-extraction will
 * all consume "list of images per page"; them shipping later doesn't
 * change the shape they need today.
 *
 * We enumerate via pdfjs' operator list — every painted image is a
 * `paintImageXObject` (or one of the inline / mask / repeat variants)
 * with an XObject name we can surface. We *intentionally* do not call
 * `page.objs.get(name)` here because that would pull the image bytes
 * into memory; the descriptor stays lightweight.
 */

import { PdfOps, type PdfjsPageProxy } from "./internal/pdfjs.js";

export type PdfImageKind = "xobject" | "inline" | "mask" | "repeat";

export interface PdfImageDescriptor {
  /** 1-based page index where this image lives. */
  readonly page: number;
  /** pdfjs internal name (e.g. "img_p0_1"). Use it with future extractors. */
  readonly name: string | null;
  readonly kind: PdfImageKind;
  /** Painting order within the page (stable across re-opens). */
  readonly index: number;
}

/** Enumerate images on a single page. */
export async function listImagesOnPage(
  page: PdfjsPageProxy,
): Promise<readonly PdfImageDescriptor[]> {
  const ops = await page.getOperatorList();
  const out: PdfImageDescriptor[] = [];
  for (let i = 0; i < ops.fnArray.length; i += 1) {
    const fn = ops.fnArray[i];
    const kind = opcodeKind(fn);
    if (!kind) continue;
    const args = ops.argsArray[i] ?? [];
    const name = pickName(args);
    out.push({
      page: page.pageNumber,
      name,
      kind,
      index: out.length,
    });
  }
  return out;
}

function opcodeKind(op: number | undefined): PdfImageKind | null {
  switch (op) {
    case PdfOps.paintImageXObject:
      return "xobject";
    case PdfOps.paintImageXObjectRepeat:
      return "repeat";
    case PdfOps.paintInlineImageXObject:
      return "inline";
    case PdfOps.paintImageMaskXObject:
      return "mask";
    default:
      return null;
  }
}

function pickName(args: readonly unknown[]): string | null {
  const first = args[0];
  return typeof first === "string" ? first : null;
}
