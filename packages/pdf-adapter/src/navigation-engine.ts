/**
 * `NavigationEngine` implementation for PDF.
 *
 * Maps reader-core navigation requests to PDF page math:
 *
 *   • `step({ grain: "page", direction })`     ↔ next/previous page
 *   • `step({ grain: "chapter", direction })`  ↔ next/previous outline entry
 *   • `step({ grain: "block", direction })`    ↔ same as page (one block per page)
 *   • `resolve(locator)`                       ↔ pass-through (the locator
 *                                                already encodes a page)
 *   • `resolveBlock(blockId)`                  ↔ resolve "page:N" to that page
 *
 * **Chapter granularity** is implemented against a flat list of outline
 * anchors computed at construction. We don't try to be clever about
 * "current chapter is the deepest ancestor of the current page" because
 * any heuristic for that diverges from user intent on the long tail of
 * PDFs that have inconsistent outlines.
 */

import {
  LocatorResolutionError,
  type NavigationEngine,
  type NavigationResolution,
  type PointLocator,
  type Toc,
} from "@bookhelper/reader-core";
import {
  pageBlockId,
  pageOffsetFromPosition,
  pointAtPageStart,
  type CodecContext,
} from "./locator-codec.js";

export interface PdfNavigationEngineInput {
  readonly codec: CodecContext;
  readonly toc: Toc | undefined;
}

export function createPdfNavigationEngine(input: PdfNavigationEngineInput): NavigationEngine {
  const { codec, toc } = input;
  const numPages = codec.table.numPages;
  // Flatten the TOC to a sorted list of page anchors for chapter steps.
  const chapterPages = flattenChapterPages(toc);

  function clamp(page: number): number {
    if (numPages === 0) return 0;
    if (page < 1) return 1;
    if (page > numPages) return numPages;
    return page;
  }

  return {
    step({ anchor, grain, direction }): NavigationResolution | null {
      if (numPages === 0) return null;
      const { page } = pageOffsetFromPosition(anchor.position);
      switch (grain) {
        case "page":
        case "block": {
          const next = direction === "forward" ? page + 1 : page - 1;
          if (next < 1 || next > numPages) return null;
          return { target: pointAtPageStart(codec, next), animate: true };
        }
        case "chapter": {
          if (chapterPages.length === 0) return null;
          const target = stepThroughChapters(chapterPages, page, direction);
          if (target === null) return null;
          return { target: pointAtPageStart(codec, target), animate: true };
        }
        /* c8 ignore next */
      }
      return null;
    },

    resolve(locator: PointLocator): NavigationResolution {
      // Reader-core hands us a PointLocator; the codec already validates
      // shape. If it doesn't decode, the locator is from a different
      // document and we surface a `LocatorResolutionError`.
      try {
        const { page, offset } = pageOffsetFromPosition(locator.position);
        const clamped = clamp(page);
        return {
          target: {
            kind: "point",
            position: {
              ...locator.position,
              blockId: pageBlockId(clamped),
              offset,
              globalOffset: (codec.table.pageStarts[clamped] ?? 0) + offset,
            },
          },
          animate: false,
        };
      } catch (err) {
        throw new LocatorResolutionError(
          `PDF navigation could not resolve locator at ${locator.position.blockId}.`,
          { cause: err },
        );
      }
    },

    resolveBlock(blockId): NavigationResolution {
      const match = /^page:(\d+)$/.exec(blockId);
      if (!match) {
        throw new LocatorResolutionError(
          `"${blockId}" is not a PDF page block id (expected "page:N").`,
        );
      }
      const page = Number(match[1]);
      const clamped = clamp(page);
      return { target: pointAtPageStart(codec, clamped), animate: true };
    },
  };
}

/** Find the page to land on for a chapter step. Pure for testability. */
export function stepThroughChapters(
  chapterPages: readonly number[],
  fromPage: number,
  direction: "forward" | "backward",
): number | null {
  // Find the chapter containing `fromPage`. For forward, advance to the
  // first chapter strictly *after* the current chapter's start (so
  // pressing next-chapter from mid-chapter goes to the next chapter,
  // not the current chapter's start). For backward, go to the previous
  // chapter, or to the current chapter's start when we're past it.
  let currentChapterIdx = -1;
  for (let i = 0; i < chapterPages.length; i += 1) {
    if (chapterPages[i]! <= fromPage) currentChapterIdx = i;
    else break;
  }
  if (direction === "forward") {
    const next = currentChapterIdx + 1;
    return next < chapterPages.length ? (chapterPages[next] ?? null) : null;
  }
  // backward
  if (currentChapterIdx === -1) return null;
  const currentStart = chapterPages[currentChapterIdx]!;
  if (fromPage > currentStart) return currentStart;
  const prev = currentChapterIdx - 1;
  return prev >= 0 ? (chapterPages[prev] ?? null) : null;
}

/** Flatten a (possibly nested) TOC into a sorted unique list of pages. */
export function flattenChapterPages(toc: Toc | undefined): readonly number[] {
  if (!toc || toc.length === 0) return [];
  const pages = new Set<number>();
  const stack = [...toc];
  while (stack.length > 0) {
    const node = stack.shift()!;
    const blockId = node.anchor.position.blockId;
    const m = /^page:(\d+)$/.exec(blockId);
    if (m) pages.add(Number(m[1]));
    if (node.children) stack.unshift(...node.children);
  }
  return [...pages].sort((a, b) => a - b);
}
