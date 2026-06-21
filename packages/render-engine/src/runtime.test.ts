import { describe, expect, it, vi } from "vitest";
import { syntheticEnvironment } from "./environment.js";
import { createRenderRuntime } from "./runtime.js";
import { fakeManifest, fakeSession } from "./test-helpers.js";

describe("createRenderRuntime — composite frame", () => {
  it("emits an initial placeholder frame and reports the page count", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 5 }));
    const runtime = createRenderRuntime({ env, session });
    expect(runtime.frame.value.placeholder).toBe(true);
    expect(runtime.measurements.state.value.pageCount).toBe(5);
    runtime.dispose();
  });

  it("recomputes visible/window on viewport resize", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 10 }));
    const runtime = createRenderRuntime({
      env,
      session,
      pageGap: 0,
    });
    runtime.resize(800, 1000);
    expect(runtime.frame.value.visible.firstPage).toBe(1);
    runtime.dispose();
  });

  it("zoom intent flows through the frame stream", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 3 }));
    const runtime = createRenderRuntime({ env, session });
    const seen: number[] = [];
    runtime.subscribe((f) => seen.push(f.zoom));
    runtime.applyZoom({ kind: "in" });
    expect(seen[seen.length - 1]).toBeGreaterThan(1);
    runtime.dispose();
  });

  it("scrollTo moves viewport to the target page", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 5 }));
    const runtime = createRenderRuntime({ env, session, pageGap: 0 });
    runtime.resize(800, 1000);
    runtime.scrollTo({ page: 3 });
    expect(runtime.viewport.state.value.scrollY).toBe(792 * 2);
    runtime.dispose();
  });

  it("reportScroll coalesces into the next frame", () => {
    const { env, flush } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 5 }));
    const runtime = createRenderRuntime({ env, session, pageGap: 0 });
    runtime.resize(800, 1000);
    runtime.reportScroll(0, 100);
    runtime.reportScroll(0, 200);
    runtime.reportScroll(0, 300);
    flush();
    expect(runtime.viewport.state.value.scrollY).toBe(300);
    runtime.dispose();
  });

  it("dispose stops further state changes from being applied", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 3 }));
    const runtime = createRenderRuntime({ env, session });
    runtime.dispose();
    runtime.applyZoom({ kind: "in" });
    runtime.scrollTo({ page: 2 });
    runtime.resize(100, 100);
    expect(runtime.viewport.state.value.width).toBe(0);
  });

  it("coordinates utility builds locators with correct block id", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 3 }));
    const runtime = createRenderRuntime({ env, session });
    const loc = runtime.coordinates.pageLocator(2);
    expect(loc.position.blockId).toBe("page:2");
    runtime.dispose();
  });

  it("custom blockIdForPage applies", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 3 }));
    const runtime = createRenderRuntime({
      env,
      session,
      blockIdForPage: (p) => `slide:${p}`,
    });
    expect(runtime.coordinates.pageLocator(2).position.blockId).toBe("slide:2");
    runtime.dispose();
  });

  it("subscriber errors are routed via onError", () => {
    const { env } = syntheticEnvironment(0);
    const session = fakeSession(fakeManifest({ pageCount: 3 }));
    const onError = vi.fn();
    const runtime = createRenderRuntime({ env, session, onError });
    runtime.subscribe(() => {
      throw new Error("boom");
    });
    runtime.applyZoom({ kind: "in" });
    expect(onError).toHaveBeenCalled();
    runtime.dispose();
  });
});
