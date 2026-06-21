import { describe, expect, it } from "vitest";
import { computeRenderWindow, diffWindows, EMPTY_WINDOW } from "./virtualization.js";

describe("computeRenderWindow", () => {
  it("returns empty window when pageCount is 0", () => {
    expect(
      computeRenderWindow({
        visible: { firstPage: 0, lastPage: 0, centerPage: 0, centerFraction: 0 },
        pageCount: 0,
      }),
    ).toEqual(EMPTY_WINDOW);
  });

  it("applies default overscan (1 before, 2 after)", () => {
    const win = computeRenderWindow({
      visible: { firstPage: 5, lastPage: 6, centerPage: 5, centerFraction: 0 },
      pageCount: 100,
    });
    expect(win.firstPage).toBe(4);
    expect(win.lastPage).toBe(8);
    expect(win.overscan).toEqual({ before: 1, after: 2 });
  });

  it("clamps overscan to document edges", () => {
    const win = computeRenderWindow({
      visible: { firstPage: 1, lastPage: 1, centerPage: 1, centerFraction: 0 },
      pageCount: 2,
    });
    expect(win.firstPage).toBe(1);
    expect(win.lastPage).toBe(2);
    expect(win.overscan.before).toBe(0);
  });

  it("enumerates pages list", () => {
    const win = computeRenderWindow({
      visible: { firstPage: 2, lastPage: 3, centerPage: 2, centerFraction: 0 },
      pageCount: 10,
      overscanBefore: 0,
      overscanAfter: 1,
    });
    expect(win.pages).toEqual([2, 3, 4]);
  });
});

describe("diffWindows", () => {
  it("computes entered/exited pages", () => {
    const prev = computeRenderWindow({
      visible: { firstPage: 1, lastPage: 2, centerPage: 1, centerFraction: 0 },
      pageCount: 10,
    });
    const next = computeRenderWindow({
      visible: { firstPage: 5, lastPage: 6, centerPage: 5, centerFraction: 0 },
      pageCount: 10,
    });
    const { entered, exited } = diffWindows(prev, next);
    expect(entered).toEqual(expect.arrayContaining([5, 6, 7, 8]));
    expect(exited).toEqual(expect.arrayContaining([1, 2, 3]));
  });
});
