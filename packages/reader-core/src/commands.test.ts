import { describe, expect, it, vi } from "vitest";
import { createCommandBus } from "./commands.js";
import { CommandExecutionError, CommandNotFoundError } from "./errors.js";

describe("createCommandBus", () => {
  it("dispatches to registered handlers and returns the result", async () => {
    const bus = createCommandBus();
    bus.register("reader.set-zoom", async ({ zoom }) => zoom * 2);
    await expect(bus.dispatch("reader.set-zoom", { zoom: 3 })).resolves.toBe(6);
  });

  it("throws CommandNotFoundError when no handler is installed", async () => {
    const bus = createCommandBus();
    await expect(bus.dispatch("reader.set-zoom", { zoom: 1 })).rejects.toBeInstanceOf(
      CommandNotFoundError,
    );
  });

  it("wraps thrown handler errors in CommandExecutionError, preserving cause", async () => {
    const bus = createCommandBus();
    bus.register("reader.set-zoom", () => {
      throw new Error("nope");
    });
    await expect(bus.dispatch("reader.set-zoom", { zoom: 1 })).rejects.toMatchObject({
      name: "CommandExecutionError",
      command: "reader.set-zoom",
    });
  });

  it("captures UndoableInvocation results on the undo stack", async () => {
    const bus = createCommandBus();
    let applied = 0;
    bus.register("reader.set-zoom", () => {
      applied += 1;
      return {
        undo: () => {
          applied -= 1;
        },
        redo: () => {
          applied += 1;
        },
      };
    });

    await bus.dispatch("reader.set-zoom", { zoom: 1 });
    expect(applied).toBe(1);
    expect(bus.canUndo()).toBe(true);
    expect(bus.canRedo()).toBe(false);

    await expect(bus.undo()).resolves.toBe(true);
    expect(applied).toBe(0);
    expect(bus.canRedo()).toBe(true);

    await expect(bus.redo()).resolves.toBe(true);
    expect(applied).toBe(1);
  });

  it("invokes undo/redo via the reader.undo and reader.redo commands too", async () => {
    const bus = createCommandBus();
    const undo = vi.fn();
    const redo = vi.fn();
    bus.register("reader.bookmark", () => ({ undo, redo }));
    await bus.dispatch("reader.bookmark", {
      locator: {
        kind: "point",
        position: { blockId: "b", offset: 0, globalOffset: 0, docVersion: 1 },
      },
    });
    await bus.dispatch("reader.undo", {});
    expect(undo).toHaveBeenCalledTimes(1);
    await bus.dispatch("reader.redo", {});
    expect(redo).toHaveBeenCalledTimes(1);
  });

  it("new actions invalidate the redo stack (standard editor behavior)", async () => {
    const bus = createCommandBus();
    bus.register("reader.bookmark", () => ({ undo: () => {}, redo: () => {} }));
    await bus.dispatch("reader.bookmark", {
      locator: {
        kind: "point",
        position: { blockId: "b", offset: 0, globalOffset: 0, docVersion: 1 },
      },
    });
    await bus.undo();
    expect(bus.canRedo()).toBe(true);
    await bus.dispatch("reader.bookmark", {
      locator: {
        kind: "point",
        position: { blockId: "b", offset: 0, globalOffset: 0, docVersion: 1 },
      },
    });
    expect(bus.canRedo()).toBe(false);
  });

  it("respects maxUndoDepth by dropping the oldest invocation", async () => {
    const bus = createCommandBus({ maxUndoDepth: 2 });
    bus.register("reader.bookmark", () => ({ undo: () => {}, redo: () => {} }));
    for (let i = 0; i < 5; i += 1) {
      await bus.dispatch("reader.bookmark", {
        locator: {
          kind: "point",
          position: { blockId: "b", offset: i, globalOffset: i, docVersion: 1 },
        },
      });
    }
    expect(bus.canUndo()).toBe(true);
    // Only 2 undos available.
    await bus.undo();
    await bus.undo();
    expect(bus.canUndo()).toBe(false);
  });

  it("unregister hook removes the handler", async () => {
    const bus = createCommandBus();
    const off = bus.register("reader.set-zoom", async () => 42);
    expect(bus.has("reader.set-zoom")).toBe(true);
    off();
    expect(bus.has("reader.set-zoom")).toBe(false);
  });

  it("undo() returns false when the stack is empty", async () => {
    const bus = createCommandBus();
    await expect(bus.undo()).resolves.toBe(false);
    await expect(bus.redo()).resolves.toBe(false);
  });

  it("a failing undo restores the invocation so the user can retry", async () => {
    const bus = createCommandBus();
    let attempts = 0;
    bus.register("reader.bookmark", () => ({
      undo: () => {
        attempts += 1;
        if (attempts === 1) throw new Error("io error");
      },
      redo: () => {},
    }));
    await bus.dispatch("reader.bookmark", {
      locator: {
        kind: "point",
        position: { blockId: "b", offset: 0, globalOffset: 0, docVersion: 1 },
      },
    });
    await expect(bus.undo()).rejects.toBeInstanceOf(CommandExecutionError);
    expect(bus.canUndo()).toBe(true);
    await expect(bus.undo()).resolves.toBe(true);
  });
});
