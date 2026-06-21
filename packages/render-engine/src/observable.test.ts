import { describe, expect, it, vi } from "vitest";
import { createEmitter } from "./observable.js";

describe("createEmitter", () => {
  it("notifies subscribers on emit", () => {
    const emitter = createEmitter(0);
    const fn = vi.fn();
    emitter.subscribe(fn);
    emitter.emit(1);
    expect(fn).toHaveBeenCalledWith(1);
    expect(emitter.value).toBe(1);
  });

  it("skips emit if value unchanged (Object.is)", () => {
    const emitter = createEmitter(0);
    const fn = vi.fn();
    emitter.subscribe(fn);
    emitter.emit(0);
    expect(fn).not.toHaveBeenCalled();
  });

  it("respects custom equals comparator", () => {
    const emitter = createEmitter({ x: 1 }, { equals: (a, b) => a.x === b.x });
    const fn = vi.fn();
    emitter.subscribe(fn);
    emitter.emit({ x: 1 });
    expect(fn).not.toHaveBeenCalled();
    emitter.emit({ x: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("supports unsubscribe", () => {
    const emitter = createEmitter(0);
    const fn = vi.fn();
    const unsubscribe = emitter.subscribe(fn);
    unsubscribe();
    emitter.emit(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it("tolerates unsubscribe during iteration", () => {
    const emitter = createEmitter(0);
    const fnA = vi.fn();
    const fnB = vi.fn();
    const unsubA = emitter.subscribe(() => {
      fnA();
      unsubA();
    });
    emitter.subscribe(fnB);
    emitter.emit(1);
    emitter.emit(2);
    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(2);
  });

  it("routes subscriber errors to onError", () => {
    const onError = vi.fn();
    const emitter = createEmitter(0, { onError });
    emitter.subscribe(() => {
      throw new Error("boom");
    });
    emitter.emit(1);
    expect(onError).toHaveBeenCalled();
  });

  it("setSilently updates value without notifying", () => {
    const emitter = createEmitter(0);
    const fn = vi.fn();
    emitter.subscribe(fn);
    emitter.setSilently(5);
    expect(emitter.value).toBe(5);
    expect(fn).not.toHaveBeenCalled();
  });
});
