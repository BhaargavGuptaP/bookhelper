import { describe, expect, it } from "vitest";
import { createMeasurements } from "./measurements.js";
import { computeVisible, EMPTY_VISIBLE } from "./visibility.js";

describe("computeVisible", () => {
  it("returns empty when no pages", () => {
    const m = createMeasurements({ pageCount: 0 });
    expect(
      computeVisible({
        scrollTop: 0,
        viewportHeight: 600,
        zoom: 1,
        measurements: m.state.value,
      }),
    ).toEqual(EMPTY_VISIBLE);
  });

  it("returns empty when viewport has no height", () => {
    const m = createMeasurements({ pageCount: 3, pageGap: 0 });
    expect(
      computeVisible({
        scrollTop: 0,
        viewportHeight: 0,
        zoom: 1,
        measurements: m.state.value,
      }),
    ).toEqual(EMPTY_VISIBLE);
  });

  it("identifies first/last/center pages", () => {
    const m = createMeasurements({ pageCount: 5, pageGap: 0 });
    // Each page 792 tall; viewport 1000; scrollTop 0 -> pages 1-2 visible.
    const result = computeVisible({
      scrollTop: 0,
      viewportHeight: 1000,
      zoom: 1,
      measurements: m.state.value,
    });
    expect(result.firstPage).toBe(1);
    expect(result.lastPage).toBe(2);
    expect(result.centerPage).toBe(1);
  });

  it("respects zoom by dividing scroll/viewport", () => {
    const m = createMeasurements({ pageCount: 5, pageGap: 0 });
    const result = computeVisible({
      scrollTop: 1584, // 2 pages * 792
      viewportHeight: 1000,
      zoom: 1,
      measurements: m.state.value,
    });
    expect(result.firstPage).toBe(3);
  });

  it("clamps to document boundaries", () => {
    const m = createMeasurements({ pageCount: 3, pageGap: 0 });
    const result = computeVisible({
      scrollTop: 100000,
      viewportHeight: 1000,
      zoom: 1,
      measurements: m.state.value,
    });
    expect(result.firstPage).toBe(3);
    expect(result.lastPage).toBe(3);
  });
});
