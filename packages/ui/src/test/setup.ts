import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * jsdom doesn't ship `matchMedia`. Provide a deterministic stub that defaults
 * to "no preference" (returns matches=false) — tests opt in to dark/reduced
 * motion explicitly via `vi.spyOn`.
 */
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(), // legacy
      removeListener: vi.fn(), // legacy
      dispatchEvent: vi.fn(),
    }),
  });
}

afterEach(() => {
  cleanup();
  // Each test starts with a clean storage + html attribute slate.
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  }
});
