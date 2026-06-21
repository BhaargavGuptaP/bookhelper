import { describe, expect, it, vi } from "vitest";
import { syntheticEnvironment } from "./environment.js";
import { createScrollSync } from "./scroll-sync.js";

describe("createScrollSync", () => {
  it("coalesces multiple reports into one frame", () => {
    const { env, flush } = syntheticEnvironment(0);
    const onFrame = vi.fn();
    const sync = createScrollSync({ env, onFrame });
    sync.report(0, 10);
    sync.report(0, 20);
    sync.report(0, 30);
    flush();
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onFrame).toHaveBeenCalledWith(expect.objectContaining({ scrollY: 30 }));
  });

  it("supplies timestamp from env.now()", () => {
    const { env, advance } = syntheticEnvironment(0);
    const onFrame = vi.fn();
    const sync = createScrollSync({ env, onFrame });
    advance(50);
    sync.report(0, 5);
    advance(0);
    expect(onFrame).toHaveBeenCalledWith(expect.objectContaining({ timestamp: 50 }));
  });

  it("dispose cancels pending frame", () => {
    const { env, flush } = syntheticEnvironment(0);
    const onFrame = vi.fn();
    const sync = createScrollSync({ env, onFrame });
    sync.report(0, 10);
    sync.dispose();
    flush();
    expect(onFrame).not.toHaveBeenCalled();
  });

  it("source defaults to 'user'", () => {
    const { env, flush } = syntheticEnvironment(0);
    const onFrame = vi.fn();
    const sync = createScrollSync({ env, onFrame });
    sync.report(0, 10);
    flush();
    expect(onFrame).toHaveBeenCalledWith(expect.objectContaining({ source: "user" }));
  });

  it("respects 'program' source tag", () => {
    const { env, flush } = syntheticEnvironment(0);
    const onFrame = vi.fn();
    const sync = createScrollSync({ env, onFrame });
    sync.report(0, 10, "program");
    flush();
    expect(onFrame).toHaveBeenCalledWith(expect.objectContaining({ source: "program" }));
  });
});
