import { describe, expect, it } from "vitest";
import {
  compareLocators,
  comparePositions,
  isPointLocator,
  isRangeLocator,
  locatorEnd,
  locatorStart,
  type Locator,
  type PointLocator,
  type Position,
  type RangeLocator,
} from "./locator.js";

const at = (blockId: string, offset: number, globalOffset: number): Position => ({
  blockId,
  offset,
  globalOffset,
  docVersion: 1,
});

const point = (p: Position): PointLocator => ({ kind: "point", position: p });
const range = (s: Position, e: Position): RangeLocator => ({ kind: "range", start: s, end: e });

describe("locator type guards", () => {
  it("distinguishes point and range locators", () => {
    const p: Locator = point(at("b1", 0, 0));
    const r: Locator = range(at("b1", 0, 0), at("b1", 5, 5));
    expect(isPointLocator(p)).toBe(true);
    expect(isRangeLocator(p)).toBe(false);
    expect(isPointLocator(r)).toBe(false);
    expect(isRangeLocator(r)).toBe(true);
  });
});

describe("locatorStart / locatorEnd", () => {
  it("returns the position for points and the endpoints for ranges", () => {
    const p = point(at("b1", 0, 10));
    expect(locatorStart(p)).toEqual(p.position);
    expect(locatorEnd(p)).toEqual(p.position);

    const r = range(at("b1", 0, 10), at("b2", 5, 25));
    expect(locatorStart(r)).toEqual(r.start);
    expect(locatorEnd(r)).toEqual(r.end);
  });
});

describe("comparePositions", () => {
  it("uses globalOffset as the primary key", () => {
    expect(comparePositions(at("b1", 0, 10), at("b9", 0, 20))).toBeLessThan(0);
    expect(comparePositions(at("b9", 0, 20), at("b1", 0, 10))).toBeGreaterThan(0);
  });

  it("breaks ties by blockId then by offset", () => {
    expect(comparePositions(at("a", 0, 10), at("b", 0, 10))).toBeLessThan(0);
    expect(comparePositions(at("a", 0, 10), at("a", 5, 10))).toBeLessThan(0);
    expect(comparePositions(at("a", 5, 10), at("a", 5, 10))).toBe(0);
  });
});

describe("compareLocators", () => {
  it("orders by start position, then by end position", () => {
    const a = range(at("b1", 0, 0), at("b1", 5, 5));
    const b = range(at("b1", 0, 0), at("b1", 10, 10));
    expect(compareLocators(a, b)).toBeLessThan(0);
    expect(compareLocators(b, a)).toBeGreaterThan(0);
    expect(compareLocators(a, a)).toBe(0);
  });

  it("treats a point and the range starting at it as equal-by-start", () => {
    const p = point(at("b1", 0, 0));
    const r = range(at("b1", 0, 0), at("b1", 5, 5));
    expect(compareLocators(p, r)).toBeLessThan(0);
  });
});
