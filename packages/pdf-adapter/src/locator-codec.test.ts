import { describe, expect, it } from "vitest";
import {
  buildOffsetTable,
  pageBlockId,
  pageOffsetFromPosition,
  parsePageBlockId,
  pointAtPageStart,
  positionFromPageOffset,
  type CodecContext,
} from "./locator-codec.js";

function ctxFor(charsByPage: number[], docVersion = 1): CodecContext {
  return { table: buildOffsetTable(charsByPage), docVersion };
}

describe("locator codec — block ids", () => {
  it("encodes and decodes page block ids", () => {
    expect(pageBlockId(7)).toBe("page:7");
    expect(parsePageBlockId("page:7")).toBe(7);
    expect(parsePageBlockId("page:0")).toBeNull();
    expect(parsePageBlockId("epub:foo")).toBeNull();
  });
});

describe("buildOffsetTable", () => {
  it("produces monotonic cumulative offsets and totalChars", () => {
    const table = buildOffsetTable([100, 50, 25]);
    expect(table.numPages).toBe(3);
    expect(table.totalChars).toBe(175);
    expect(table.pageStarts[1]).toBe(0);
    expect(table.pageStarts[2]).toBe(100);
    expect(table.pageStarts[3]).toBe(150);
    expect(table.pageStarts[4]).toBe(175);
  });

  it("treats negative or NaN char counts as zero (defensive)", () => {
    const table = buildOffsetTable([10, Number.NaN, -5, 5]);
    expect(table.totalChars).toBe(15);
  });
});

describe("positionFromPageOffset", () => {
  it("clamps offsets to the page length", () => {
    const ctx = ctxFor([10, 20]);
    const p = positionFromPageOffset(ctx, 1, 9999);
    expect(p.offset).toBe(10);
    expect(p.globalOffset).toBe(10);
    expect(p.blockId).toBe("page:1");
  });

  it("computes globalOffset from cumulative starts", () => {
    const ctx = ctxFor([100, 50]);
    const p = positionFromPageOffset(ctx, 2, 25);
    expect(p.globalOffset).toBe(125);
  });

  it("rejects out-of-range pages and negative offsets", () => {
    const ctx = ctxFor([10]);
    expect(() => positionFromPageOffset(ctx, 0, 0)).toThrow(RangeError);
    expect(() => positionFromPageOffset(ctx, 2, 0)).toThrow(RangeError);
    expect(() => positionFromPageOffset(ctx, 1, -1)).toThrow(RangeError);
  });
});

describe("pageOffsetFromPosition", () => {
  it("round-trips through positionFromPageOffset", () => {
    const ctx = ctxFor([10, 20, 30]);
    for (const [page, offset] of [
      [1, 0],
      [1, 5],
      [2, 10],
      [3, 30],
    ] as const) {
      const pos = positionFromPageOffset(ctx, page, offset);
      expect(pageOffsetFromPosition(pos)).toEqual({ page, offset });
    }
  });

  it("rejects non-PDF block ids", () => {
    expect(() =>
      pageOffsetFromPosition({
        blockId: "epub:cfi(/6/2)",
        offset: 0,
        globalOffset: 0,
        docVersion: 1,
      }),
    ).toThrow(TypeError);
  });
});

describe("pointAtPageStart", () => {
  it("emits a point locator with a native fast-path", () => {
    const ctx = ctxFor([10, 20]);
    const p = pointAtPageStart(ctx, 2);
    expect(p.kind).toBe("point");
    expect(p.position.blockId).toBe("page:2");
    expect(p.position.offset).toBe(0);
    expect(p.position.globalOffset).toBe(10);
    expect(p.position.native).toEqual({ kind: "pdf", page: 2, offset: 0 });
  });
});
