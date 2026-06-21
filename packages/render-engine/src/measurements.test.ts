import { describe, expect, it, vi } from "vitest";
import { createMeasurements } from "./measurements.js";

describe("createMeasurements", () => {
  it("derives layout from page count + default size", () => {
    const m = createMeasurements({ pageCount: 3, pageGap: 10 });
    const state = m.state.value;
    expect(state.pageCount).toBe(3);
    expect(state.metrics[1]?.top).toBe(0);
    expect(state.metrics[1]?.bottom).toBe(792);
    expect(state.metrics[2]?.top).toBe(792 + 10);
    expect(state.totalHeight).toBe(792 * 3 + 10 * 2);
    expect(state.maxWidth).toBe(612);
  });

  it("setPageSize re-derives cumulative offsets", () => {
    const m = createMeasurements({ pageCount: 3, pageGap: 0 });
    m.setPageSize(1, { width: 400, height: 100 });
    m.setPageSize(2, { width: 500, height: 200 });
    const state = m.state.value;
    expect(state.metrics[1]?.bottom).toBe(100);
    expect(state.metrics[2]?.top).toBe(100);
    expect(state.metrics[2]?.bottom).toBe(300);
    expect(state.maxWidth).toBe(612); // page 3 still default 612
  });

  it("ignores invalid sizes", () => {
    const m = createMeasurements({ pageCount: 1 });
    const fn = vi.fn();
    m.subscribe(fn);
    m.setPageSize(1, { width: -10, height: 100 });
    expect(fn).not.toHaveBeenCalled();
    m.setPageSize(0, { width: 100, height: 100 });
    expect(fn).not.toHaveBeenCalled();
  });

  it("setPageSizes batches into one emit", () => {
    const m = createMeasurements({ pageCount: 3, pageGap: 0 });
    const fn = vi.fn();
    m.subscribe(fn);
    m.setPageSizes([
      { index: 1, size: { width: 100, height: 100 } },
      { index: 2, size: { width: 100, height: 100 } },
      { index: 3, size: { width: 100, height: 100 } },
    ]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("setPageCount truncates and grows preserving prior measurements", () => {
    const m = createMeasurements({ pageCount: 3 });
    m.setPageSize(2, { width: 100, height: 100 });
    m.setPageCount(2);
    expect(m.state.value.metrics[2]?.size.height).toBe(100);
    m.setPageCount(5);
    expect(m.state.value.pageCount).toBe(5);
    expect(m.state.value.metrics[2]?.size.height).toBe(100);
  });

  it("setPageGap recomputes offsets", () => {
    const m = createMeasurements({ pageCount: 2, pageGap: 0 });
    expect(m.state.value.metrics[2]?.top).toBe(792);
    m.setPageGap(20);
    expect(m.state.value.metrics[2]?.top).toBe(792 + 20);
  });

  it("lazy-expands page count when setPageSize exceeds it", () => {
    const m = createMeasurements({ pageCount: 1 });
    m.setPageSize(3, { width: 100, height: 100 });
    expect(m.state.value.pageCount).toBe(3);
  });
});
