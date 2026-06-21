import { describe, it, expect } from "vitest";
import {
  spacing,
  radius,
  zIndex,
  fontScale,
  slate,
  iris,
  readerThemes,
  appThemes,
  duration,
  layout,
  minTouchTarget,
  semanticRamps,
} from "./index.js";

/**
 * These tests pin the token values against DESIGN-SYSTEM-SPEC.md.
 * If the spec changes, update both the spec and the token file in the SAME
 * commit, then update these tests. Tests are intentionally explicit — they
 * are the safety net that prevents silent design drift.
 */
describe("design tokens — DESIGN-SYSTEM-SPEC.md compliance", () => {
  describe("§2.3 Spacing", () => {
    it("uses 4px base / 8px rhythm", () => {
      expect(spacing["1"]).toBe(4);
      expect(spacing["2"]).toBe(8);
      expect(spacing["4"]).toBe(16);
      expect(spacing["6"]).toBe(24);
      expect(spacing["24"]).toBe(96);
    });
  });

  describe("§2.4 Radius", () => {
    it("uses the specified ramp", () => {
      expect(radius.xs).toBe(4);
      expect(radius.md).toBe(8);
      expect(radius.lg).toBe(12);
      expect(radius.full).toBe(9999);
    });
  });

  describe("§2.12 Z-index", () => {
    it("respects the layering order", () => {
      expect(zIndex.base).toBeLessThan(zIndex.sticky);
      expect(zIndex.sticky).toBeLessThan(zIndex.rail);
      expect(zIndex.rail).toBeLessThan(zIndex.dropdown);
      expect(zIndex.dropdown).toBeLessThan(zIndex.overlay);
      expect(zIndex.overlay).toBeLessThan(zIndex.dialog);
      expect(zIndex.dialog).toBeLessThan(zIndex.palette);
      expect(zIndex.palette).toBeLessThan(zIndex.toast);
      expect(zIndex.toast).toBeLessThan(zIndex.tooltip);
    });

    it("uses exact spec values", () => {
      expect(zIndex.rail).toBe(200);
      expect(zIndex.dialog).toBe(2100);
      expect(zIndex.palette).toBe(3000);
    });
  });

  describe("§2.2 Type scale", () => {
    it("never exceeds weight 600 (no 700+ in UI)", () => {
      for (const style of Object.values(fontScale)) {
        expect(style.weight).toBeLessThanOrEqual(600);
      }
    });

    it("pins display-lg to 48/52/600", () => {
      expect(fontScale["display-lg"]).toMatchObject({
        size: 48,
        lineHeight: 52,
        weight: 600,
      });
    });

    it("pins body-md to 14/22/400", () => {
      expect(fontScale["body-md"]).toMatchObject({
        size: 14,
        lineHeight: 22,
        weight: 400,
      });
    });
  });

  describe("§3.1 Slate ramp", () => {
    it("provides full 12 steps in light and dark", () => {
      for (let i = 1; i <= 12; i++) {
        const k = String(i) as keyof typeof slate.light;
        expect(slate.light[k]).toMatch(/^#[0-9A-F]{6}$/i);
        expect(slate.dark[k]).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it("pins canonical step values", () => {
      expect(slate.light["1"]).toBe("#FCFCFD");
      expect(slate.light["12"]).toBe("#1A1C1F");
      expect(slate.dark["1"]).toBe("#0A0A0B");
      expect(slate.dark["12"]).toBe("#ECEEF1");
    });
  });

  describe("§3.2 Iris (brand)", () => {
    it("pins the solid (step 9) for both modes", () => {
      expect(iris.light["9"]).toBe("#5B5BD6");
      expect(iris.dark["9"]).toBe("#6E56CF");
    });
  });

  describe("§3.4–§3.7 Semantic ramps", () => {
    it("provides solid/tint/text in both modes for each ramp", () => {
      for (const ramp of Object.values(semanticRamps)) {
        for (const mode of [ramp.light, ramp.dark]) {
          expect(mode.solid).toMatch(/^#[0-9A-F]{6}$/i);
          expect(mode.tint).toMatch(/^#[0-9A-F]{6}$/i);
          expect(mode.text).toMatch(/^#[0-9A-F]{6}$/i);
        }
      }
    });
  });

  describe("§3.9 Reader themes", () => {
    it("includes all four themes (light, sepia, dark, night)", () => {
      expect(Object.keys(readerThemes)).toEqual(["light", "sepia", "dark", "night"]);
    });

    it("uses true black only for Night (OLED), never for chrome dark", () => {
      expect(readerThemes.night.surface).toBe("#000000");
      expect(readerThemes.dark.surface).not.toBe("#000000");
    });
  });

  describe("App themes (UX §3 / DSS §3.15–§3.17)", () => {
    it("exposes exactly light / dark / high-contrast", () => {
      expect(appThemes).toEqual(["light", "dark", "high-contrast"]);
    });
  });

  describe("§2.10 Durations", () => {
    it("orders from instant → slower", () => {
      expect(duration.instant).toBeLessThan(duration.fast);
      expect(duration.fast).toBeLessThan(duration.base);
      expect(duration.base).toBeLessThan(duration.moderate);
      expect(duration.moderate).toBeLessThan(duration.slow);
      expect(duration.slow).toBeLessThan(duration.slower);
    });
  });

  describe("§2.14 / §2.15 Shell + touch target", () => {
    it("uses the spec's rail widths", () => {
      expect(layout.shell.railCollapsed).toBe(64);
      expect(layout.shell.railExpanded).toBe(240);
      expect(layout.shell.topbar).toBe(52);
    });

    it("enforces the WCAG-aligned 44px minimum touch target", () => {
      expect(minTouchTarget).toBe(44);
    });
  });
});
