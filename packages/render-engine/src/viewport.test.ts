import { describe, expect, it, vi } from "vitest";
import { createViewport } from "./viewport.js";

describe("createViewport", () => {
  it("starts from the supplied initial state", () => {
    const v = createViewport({ initial: { width: 800, height: 600 } });
    expect(v.state.value.width).toBe(800);
    expect(v.state.value.height).toBe(600);
    expect(v.state.value.scrollY).toBe(0);
    expect(v.state.value.devicePixelRatio).toBe(1);
  });

  it("clamps negative sizes and scrolls to zero", () => {
    const v = createViewport({ initial: { width: -50, height: -50, scrollX: -10, scrollY: -10 } });
    expect(v.state.value.width).toBe(0);
    expect(v.state.value.scrollX).toBe(0);
  });

  it("setSize emits and updates state", () => {
    const v = createViewport();
    const fn = vi.fn();
    v.subscribe(fn);
    v.setSize(100, 200, 2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(v.state.value).toMatchObject({ width: 100, height: 200, devicePixelRatio: 2 });
  });

  it("setScroll emits once per change", () => {
    const v = createViewport({ initial: { width: 100, height: 100 } });
    const fn = vi.fn();
    v.subscribe(fn);
    v.setScroll(0, 50);
    v.setScroll(0, 50); // dedup'd
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("update applies partial changes in one batch", () => {
    const v = createViewport();
    const fn = vi.fn();
    v.subscribe(fn);
    v.update({ width: 1024, height: 768, scrollY: 300 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(v.state.value).toMatchObject({ width: 1024, height: 768, scrollY: 300 });
  });
});
