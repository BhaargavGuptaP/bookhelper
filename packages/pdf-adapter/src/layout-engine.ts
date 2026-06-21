/**
 * `LayoutEngine` implementation for PDF (fixed-layout).
 *
 * The reader core gives us a viewport + an anchor; we tell it which
 * range of pages is visible plus a progress estimate. For PDF this is
 * straightforward because pages have intrinsic geometry; we estimate
 * the number of pages that fit in the viewport based on the anchor
 * page's height at the user's zoom. The actual rasterization is the
 * host's concern (READER-SPEC §5.3) — we never paint anything here.
 */

import type {
  BlockSummary,
  LayoutEngine,
  LayoutWindow,
  PointLocator,
  Viewport,
} from "@bookhelper/reader-core";
import type { PdfjsDocumentProxy } from "./internal/pdfjs.js";
import {
  pageBlockId,
  pageOffsetFromPosition,
  pointAtPageStart,
  type CodecContext,
} from "./locator-codec.js";

export interface PdfLayoutEngineInput {
  readonly doc: PdfjsDocumentProxy;
  readonly codec: CodecContext;
  /** How many pages either side of the visible window to consider buffered. */
  readonly bufferPages?: number;
}

export function createPdfLayoutEngine(input: PdfLayoutEngineInput): LayoutEngine {
  const { doc, codec } = input;
  const bufferPages = Math.max(0, input.bufferPages ?? 2);
  const numPages = codec.table.numPages;

  return {
    async measure(measureInput: {
      readonly viewport: Viewport;
      readonly anchor: PointLocator;
      readonly preferences: { readonly zoom: number };
    }): Promise<LayoutWindow> {
      if (numPages === 0) {
        return {
          from: input.codec ? safePoint(codec, 1) : safePoint(codec, 1),
          to: safePoint(codec, 1),
          blocks: [],
          progress: 0,
        };
      }
      const { page } = pageOffsetFromPosition(measureInput.anchor.position);
      const visible = await estimateVisiblePages(
        doc,
        page,
        measureInput.viewport,
        measureInput.preferences.zoom,
      );
      const fromPage = Math.max(1, page);
      const toPage = Math.min(numPages, page + Math.max(0, visible - 1));

      const blocks: BlockSummary[] = [];
      for (let p = fromPage; p <= toPage; p += 1) {
        const start = codec.table.pageStarts[p] ?? 0;
        const next = codec.table.pageStarts[p + 1] ?? start;
        blocks.push({
          blockId: pageBlockId(p),
          ord: p - 1,
          type: "page",
          charCount: Math.max(0, next - start),
          page: p,
        });
      }

      const fromBufferedPage = Math.max(1, fromPage - bufferPages);
      const toBufferedPage = Math.min(numPages, toPage + bufferPages);
      const progress = computeProgress(page, numPages);

      return {
        from: pointAtPageStart(codec, fromPage),
        to: pointAtPageStart(codec, toPage),
        buffered: {
          from: pointAtPageStart(codec, fromBufferedPage),
          to: pointAtPageStart(codec, toBufferedPage),
        },
        blocks: Object.freeze(blocks),
        currentPage: page,
        progress,
      };
    },
  };
}

function safePoint(codec: CodecContext, page: number): PointLocator {
  return pointAtPageStart(codec, Math.min(Math.max(1, page), Math.max(1, codec.table.numPages)));
}

/**
 * Estimate how many pages fit in the viewport. The estimate is a lower
 * bound suitable for windowing — actual scroll math happens in the host
 * renderer.
 */
async function estimateVisiblePages(
  doc: PdfjsDocumentProxy,
  anchorPage: number,
  viewport: Viewport,
  zoom: number,
): Promise<number> {
  const page = await doc.getPage(anchorPage);
  try {
    const vp = page.getViewport({ scale: Math.max(0.01, zoom) });
    if (!vp.height || !Number.isFinite(vp.height)) return 1;
    const pageH = vp.height;
    const fit = Math.max(1, Math.floor(viewport.height / pageH) + 1);
    return fit;
  } finally {
    page.cleanup();
  }
}

function computeProgress(page: number, numPages: number): number {
  if (numPages <= 0) return 0;
  return Math.min(1, Math.max(0, page / numPages));
}
