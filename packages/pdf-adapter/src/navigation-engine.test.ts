import { describe, expect, it } from "vitest";
import { LocatorResolutionError } from "@bookhelper/reader-core";
import {
  createPdfNavigationEngine,
  flattenChapterPages,
  stepThroughChapters,
} from "./navigation-engine.js";
import { buildOffsetTable, pointAtPageStart, type CodecContext } from "./locator-codec.js";

function codecFor(numPages: number): CodecContext {
  const charsByPage = new Array(numPages).fill(100);
  return { table: buildOffsetTable(charsByPage), docVersion: 1 };
}

describe("stepThroughChapters", () => {
  const chapters = [1, 5, 10, 20];

  it("steps forward to the next chapter from mid-chapter", () => {
    expect(stepThroughChapters(chapters, 7, "forward")).toBe(10);
  });

  it("returns null at the last chapter", () => {
    expect(stepThroughChapters(chapters, 25, "forward")).toBeNull();
  });

  it("steps back to the current chapter's start when past it", () => {
    expect(stepThroughChapters(chapters, 7, "backward")).toBe(5);
  });

  it("steps back to the previous chapter when at the current start", () => {
    expect(stepThroughChapters(chapters, 5, "backward")).toBe(1);
  });
});

describe("flattenChapterPages", () => {
  it("flattens a nested TOC into a sorted unique page list", () => {
    const codec = codecFor(20);
    const toc = [
      { id: "a", label: "A", depth: 0, anchor: pointAtPageStart(codec, 5) },
      {
        id: "b",
        label: "B",
        depth: 0,
        anchor: pointAtPageStart(codec, 10),
        children: [
          { id: "b1", label: "B1", depth: 1, anchor: pointAtPageStart(codec, 12) },
          { id: "b2", label: "B2", depth: 1, anchor: pointAtPageStart(codec, 12) }, // dupe
        ],
      },
    ];
    expect(flattenChapterPages(toc)).toEqual([5, 10, 12]);
  });

  it("returns an empty array for missing/empty TOCs", () => {
    expect(flattenChapterPages(undefined)).toEqual([]);
    expect(flattenChapterPages([])).toEqual([]);
  });
});

describe("createPdfNavigationEngine — step()", () => {
  const codec = codecFor(5);
  const nav = createPdfNavigationEngine({ codec, toc: undefined });
  const anchorAt = (
    p: number,
  ): {
    position: { blockId: string; offset: number; globalOffset: number; docVersion: number };
  } => ({
    position: pointAtPageStart(codec, p).position,
  });

  it("advances by page", () => {
    const result = nav.step({ anchor: anchorAt(2), grain: "page", direction: "forward" });
    expect(result && "target" in result ? result.target.position.blockId : null).toBe("page:3");
  });

  it("returns null at the last page", () => {
    expect(nav.step({ anchor: anchorAt(5), grain: "page", direction: "forward" })).toBeNull();
  });

  it("treats grain=block the same as grain=page for PDF", () => {
    const r1 = nav.step({ anchor: anchorAt(2), grain: "block", direction: "forward" });
    const r2 = nav.step({ anchor: anchorAt(2), grain: "page", direction: "forward" });
    expect(r1 && "target" in r1 ? r1.target.position.blockId : null).toBe(
      r2 && "target" in r2 ? r2.target.position.blockId : null,
    );
  });

  it("returns null for chapter steps when there is no TOC", () => {
    expect(nav.step({ anchor: anchorAt(2), grain: "chapter", direction: "forward" })).toBeNull();
  });
});

describe("createPdfNavigationEngine — resolve()", () => {
  it("clamps an out-of-range page to the document", () => {
    const codec = codecFor(3);
    const nav = createPdfNavigationEngine({ codec, toc: undefined });
    const out = nav.resolve({
      kind: "point",
      position: { blockId: "page:99", offset: 0, globalOffset: 0, docVersion: 1 },
    });
    // PointLocator pass-through is sync in our impl
    const target = (out as { target: { position: { blockId: string } } }).target;
    expect(target.position.blockId).toBe("page:3");
  });

  it("throws a LocatorResolutionError for non-PDF block ids", () => {
    const codec = codecFor(3);
    const nav = createPdfNavigationEngine({ codec, toc: undefined });
    expect(() =>
      nav.resolve({
        kind: "point",
        position: { blockId: "epub:foo", offset: 0, globalOffset: 0, docVersion: 1 },
      }),
    ).toThrow(LocatorResolutionError);
  });
});
