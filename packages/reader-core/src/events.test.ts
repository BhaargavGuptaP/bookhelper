import { describe, expect, it, vi } from "vitest";
import { createEventBus } from "./events.js";

describe("createEventBus", () => {
  it("delivers payloads to subscribers", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("reader.opened", fn);
    bus.emit("reader.opened", { docId: "doc-1" });
    expect(fn).toHaveBeenCalledWith({ docId: "doc-1" });
  });

  it("returns an idempotent unsubscribe function", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    const off = bus.on("reader.opened", fn);
    off();
    off();
    bus.emit("reader.opened", { docId: "doc-1" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("once() fires exactly once", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.once("reader.opened", fn);
    bus.emit("reader.opened", { docId: "a" });
    bus.emit("reader.opened", { docId: "b" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("supports off() to remove a specific listener", () => {
    const bus = createEventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("reader.opened", a);
    bus.on("reader.opened", b);
    bus.off("reader.opened", a);
    bus.emit("reader.opened", { docId: "x" });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });

  it("isolates throwing listeners and forwards the error to the sink", () => {
    const sink = vi.fn();
    const bus = createEventBus(sink);
    const good = vi.fn();
    bus.on("reader.opened", () => {
      throw new Error("boom");
    });
    bus.on("reader.opened", good);
    bus.emit("reader.opened", { docId: "x" });
    expect(good).toHaveBeenCalled();
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("snapshotting allows a listener to unsubscribe mid-dispatch without skipping others", () => {
    const bus = createEventBus();
    const calls: string[] = [];
    const second = (): void => {
      calls.push("second");
    };
    bus.on("reader.opened", () => {
      calls.push("first");
      bus.off("reader.opened", second);
    });
    bus.on("reader.opened", second);
    bus.emit("reader.opened", { docId: "x" });
    expect(calls).toEqual(["first", "second"]);
  });

  it("removeAll() clears every subscription", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("reader.opened", fn);
    bus.removeAll();
    bus.emit("reader.opened", { docId: "x" });
    expect(fn).not.toHaveBeenCalled();
  });
});
