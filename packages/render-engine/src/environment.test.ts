import { describe, expect, it, vi } from "vitest";
import { browserEnvironment, syntheticEnvironment } from "./environment.js";

describe("syntheticEnvironment", () => {
  it("returns the controlled clock from now()", () => {
    const { env, advance } = syntheticEnvironment(100);
    expect(env.now()).toBe(100);
    advance(50);
    expect(env.now()).toBe(150);
  });

  it("invokes RAF callbacks on flush", () => {
    const { env, flush } = syntheticEnvironment();
    const fn = vi.fn();
    env.raf(fn);
    expect(fn).not.toHaveBeenCalled();
    flush();
    expect(fn).toHaveBeenCalled();
  });

  it("cancelRaf removes pending callback", () => {
    const { env, flush } = syntheticEnvironment();
    const fn = vi.fn();
    const handle = env.raf(fn);
    env.cancelRaf(handle);
    flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("rejects negative advance", () => {
    const { advance } = syntheticEnvironment();
    expect(() => advance(-1)).toThrow();
  });

  it("drains microtasks after rafs", () => {
    const { env, flush } = syntheticEnvironment();
    const order: string[] = [];
    env.raf(() => order.push("raf"));
    env.scheduleMicrotask(() => order.push("micro"));
    flush();
    expect(order).toEqual(["raf", "micro"]);
  });
});

describe("browserEnvironment", () => {
  it("delegates to provided globals", () => {
    const performance = { now: vi.fn(() => 42) };
    const requestAnimationFrame = vi.fn(() => 7);
    const cancelAnimationFrame = vi.fn();
    const queueMicrotask = vi.fn();
    const env = browserEnvironment({
      performance,
      requestAnimationFrame,
      cancelAnimationFrame,
      queueMicrotask,
    });
    expect(env.now()).toBe(42);
    expect(env.raf(() => {})).toBe(7);
    env.cancelRaf(7);
    env.scheduleMicrotask(() => {});
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(queueMicrotask).toHaveBeenCalled();
  });
});
