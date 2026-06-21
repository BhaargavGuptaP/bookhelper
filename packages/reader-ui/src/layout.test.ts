import { describe, expect, it } from "vitest";
import { clamp, lineHeightForSpacing, pageWidthForMeasure } from "./layout.js";

describe("pageWidthForMeasure", () => {
  it("widens with the measure preset", () => {
    expect(pageWidthForMeasure("narrow")).toBeLessThan(pageWidthForMeasure("medium"));
    expect(pageWidthForMeasure("medium")).toBeLessThan(pageWidthForMeasure("wide"));
  });
});

describe("lineHeightForSpacing", () => {
  it("increases with looser spacing", () => {
    expect(lineHeightForSpacing("compact")).toBeLessThan(lineHeightForSpacing("comfortable"));
    expect(lineHeightForSpacing("comfortable")).toBeLessThan(lineHeightForSpacing("relaxed"));
  });
});

describe("clamp", () => {
  it("bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
