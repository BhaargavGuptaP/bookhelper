import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * jsdom is missing a handful of layout/timing primitives the render engine
 * and viewport rely on. We provide deterministic stubs so component tests
 * run without a real browser. Tests that need specific behaviour (a measured
 * height, a reduced-motion match) override these explicitly.
 */

// matchMedia — defaults to "no preference".
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// ResizeObserver — jsdom ships none. A no-op stub is enough; viewport size
// is driven explicitly in tests via `resize()`.
if (typeof globalThis !== "undefined" && !("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}

// requestAnimationFrame / cancelAnimationFrame — run synchronously so the
// scroll-sync RAF coalescer flushes within the test tick.
if (typeof globalThis !== "undefined" && typeof globalThis.requestAnimationFrame !== "function") {
  let raf = 0;
  (
    globalThis as unknown as { requestAnimationFrame: (cb: (t: number) => void) => number }
  ).requestAnimationFrame = (cb) => {
    raf += 1;
    cb(raf);
    return raf;
  };
  (globalThis as unknown as { cancelAnimationFrame: (h: number) => void }).cancelAnimationFrame =
    () => {};
}

// Element.scrollTo — jsdom doesn't implement scrolling.
if (typeof Element !== "undefined" && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo(this: Element): void {
    /* no-op in jsdom */
  } as Element["scrollTo"];
}

// jsdom reports zero-size rects, which would collapse the viewport and mount
// no pages. Give every element a sensible default box so virtualization runs.
if (typeof Element !== "undefined") {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

afterEach(() => {
  cleanup();
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});
