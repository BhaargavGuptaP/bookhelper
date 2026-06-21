import { describe, expect, it } from "vitest";
import {
  applyZoomIntent,
  clampZoom,
  createZoom,
  DEFAULT_ZOOM,
  fitPage,
  fitWidth,
  MAX_ZOOM,
  MIN_ZOOM,
  nextZoomStep,
  previousZoomStep,
  ZOOM_STEPS,
} from "./zoom.js";

describe("zoom math", () => {
  it("clamps NaN to default", () => {
    expect(clampZoom(Number.NaN)).toBe(DEFAULT_ZOOM);
  });

  it("clamps to min/max", () => {
    expect(clampZoom(-1)).toBe(MIN_ZOOM);
    expect(clampZoom(100)).toBe(MAX_ZOOM);
  });

  it("nextZoomStep steps through the ladder and saturates", () => {
    let z = MIN_ZOOM;
    const visited = new Set<number>();
    for (let i = 0; i < ZOOM_STEPS.length + 2; i += 1) {
      z = nextZoomStep(z);
      visited.add(z);
    }
    expect(z).toBe(MAX_ZOOM);
    expect(visited.size).toBeGreaterThan(0);
  });

  it("previousZoomStep steps down and saturates", () => {
    let z = MAX_ZOOM;
    for (let i = 0; i < ZOOM_STEPS.length + 2; i += 1) z = previousZoomStep(z);
    expect(z).toBe(MIN_ZOOM);
  });

  it("fitWidth scales content to viewport width", () => {
    expect(fitWidth(800, 400)).toBeCloseTo(2);
    expect(fitWidth(0, 400)).toBe(DEFAULT_ZOOM);
    expect(fitWidth(400, 0)).toBe(DEFAULT_ZOOM);
  });

  it("fitPage uses the smaller of width/height ratios", () => {
    expect(fitPage(800, 1000, 400, 1200)).toBeCloseTo(1000 / 1200);
    expect(fitPage(800, 1000, 0, 0)).toBe(DEFAULT_ZOOM);
  });

  it("applyZoomIntent dispatches by kind", () => {
    expect(applyZoomIntent(1, { kind: "set", factor: 1.5 })).toBe(1.5);
    expect(applyZoomIntent(1, { kind: "reset" })).toBe(DEFAULT_ZOOM);
    expect(applyZoomIntent(1, { kind: "in" })).toBeGreaterThan(1);
    expect(applyZoomIntent(1, { kind: "out" })).toBeLessThan(1);
    expect(applyZoomIntent(1, { kind: "fit-width", viewportWidth: 800, contentWidth: 800 })).toBe(
      1,
    );
  });

  it("createZoom emits factor changes", () => {
    const z = createZoom(1);
    const seen: number[] = [];
    z.subscribe((f) => seen.push(f));
    z.apply({ kind: "in" });
    z.apply({ kind: "reset" });
    expect(seen.length).toBe(2);
  });
});
