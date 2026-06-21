import { describe, expect, it } from "vitest";
import { createOverlays } from "./overlays.js";

describe("createOverlays", () => {
  it("registers and lists layers sorted by zIndex", () => {
    const o = createOverlays();
    o.register({ id: "ai", label: "AI", zIndex: 30, visible: true });
    o.register({ id: "highlights", label: "Highlights", zIndex: 10, visible: true });
    o.register({ id: "search", label: "Search", zIndex: 20, visible: true });
    const ids = o.state.value.layers.map((l) => l.id);
    expect(ids).toEqual(["highlights", "search", "ai"]);
  });

  it("ignores duplicate registrations", () => {
    const o = createOverlays();
    o.register({ id: "x", label: "x", zIndex: 1, visible: true });
    o.register({ id: "x", label: "x2", zIndex: 99, visible: false });
    expect(o.state.value.layers.length).toBe(1);
    expect(o.state.value.layers[0]?.label).toBe("x");
  });

  it("setVisible toggles layer visibility", () => {
    const o = createOverlays();
    o.register({ id: "x", label: "x", zIndex: 1, visible: true });
    o.setVisible("x", false);
    expect(o.get("x")?.visible).toBe(false);
  });

  it("setZIndex re-orders layers", () => {
    const o = createOverlays();
    o.register({ id: "a", label: "a", zIndex: 1, visible: true });
    o.register({ id: "b", label: "b", zIndex: 2, visible: true });
    o.setZIndex("a", 100);
    expect(o.state.value.layers.map((l) => l.id)).toEqual(["b", "a"]);
  });

  it("unregister removes a layer", () => {
    const o = createOverlays();
    o.register({ id: "a", label: "a", zIndex: 1, visible: true });
    o.unregister("a");
    expect(o.state.value.layers.length).toBe(0);
  });
});
