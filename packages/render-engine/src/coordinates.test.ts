import { describe, expect, it } from "vitest";
import { createMeasurements } from "./measurements.js";
import { pointLocatorForPage, pointToScroll, scrollToPoint } from "./coordinates.js";

describe("scrollToPoint / pointToScroll", () => {
  it("returns page 0 when no pages", () => {
    const m = createMeasurements({ pageCount: 0 });
    expect(scrollToPoint(0, 1, m.state.value).page).toBe(0);
  });

  it("scrollToPoint round-trips with pointToScroll", () => {
    const m = createMeasurements({ pageCount: 5, pageGap: 0 });
    const scrollY = pointToScroll({ page: 3, y: 100, viewportHeight: 600, zoom: 1 }, m.state.value);
    const result = scrollToPoint(scrollY, 1, m.state.value);
    expect(result.page).toBe(3);
    expect(result.y).toBeCloseTo(100);
  });

  it("clamps overflow scroll to last page", () => {
    const m = createMeasurements({ pageCount: 2, pageGap: 0 });
    const result = scrollToPoint(999999, 1, m.state.value);
    expect(result.page).toBe(2);
    expect(result.fraction).toBe(1);
  });

  it("center anchor offsets by half viewport", () => {
    const m = createMeasurements({ pageCount: 3, pageGap: 0 });
    const offset = pointToScroll(
      { page: 2, anchor: "center", viewportHeight: 600, zoom: 1 },
      m.state.value,
    );
    expect(offset).toBe(792 - 300);
  });

  it("zoom scales scrollY", () => {
    const m = createMeasurements({ pageCount: 2, pageGap: 0 });
    const z1 = pointToScroll({ page: 2, viewportHeight: 600, zoom: 1 }, m.state.value);
    const z2 = pointToScroll({ page: 2, viewportHeight: 600, zoom: 2 }, m.state.value);
    expect(z2).toBe(z1 * 2);
  });
});

describe("pointLocatorForPage", () => {
  it("constructs a PointLocator with deterministic block id", () => {
    const loc = pointLocatorForPage({
      docVersion: 1,
      page: 7,
      blockIdForPage: (p) => `page:${p}`,
    });
    expect(loc.kind).toBe("point");
    expect(loc.position.blockId).toBe("page:7");
    expect(loc.position.offset).toBe(0);
    expect(loc.position.globalOffset).toBe(0);
    expect(loc.position.docVersion).toBe(1);
  });

  it("threads explicit offset and globalOffset", () => {
    const loc = pointLocatorForPage({
      docVersion: 2,
      page: 3,
      offset: 42,
      globalOffset: 1042,
      blockIdForPage: (p) => `page:${p}`,
    });
    expect(loc.position.offset).toBe(42);
    expect(loc.position.globalOffset).toBe(1042);
  });
});
