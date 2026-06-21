import { describe, expect, it, vi } from "vitest";
import { createStore, initialState, select } from "./state.js";

describe("createStore", () => {
  it("starts with the supplied (or initial) state", () => {
    const store = createStore();
    expect(store.getState()).toEqual(initialState);
  });

  it("freezes state on every transition for safe sharing", () => {
    const store = createStore();
    store.apply({ progress: 0.5 });
    expect(Object.isFrozen(store.getState())).toBe(true);
  });

  it("notifies subscribers with the new and previous state", () => {
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getState();
    const after = store.apply({ progress: 0.42 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(after, before);
    expect(after.progress).toBe(0.42);
  });

  it("no-ops when the patch does not change any field (no notifications)", () => {
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.apply({ progress: initialState.progress });
    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribe is idempotent and stops further notifications", () => {
    const store = createStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    off();
    store.apply({ progress: 0.9 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("isolates throwing subscribers from each other", () => {
    const store = createStore();
    const good = vi.fn();
    store.subscribe(() => {
      throw new Error("bad subscriber");
    });
    store.subscribe(good);
    expect(() => store.apply({ progress: 0.5 })).not.toThrow();
    expect(good).toHaveBeenCalled();
  });
});

describe("select()", () => {
  it("derives values from the store", () => {
    const store = createStore();
    expect(select(store, (s) => s.lifecycle)).toBe("idle");
  });
});
