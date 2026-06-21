import { describe, expect, it, vi } from "vitest";
import {
  CapabilityNotSupportedError,
  DuplicatePluginError,
  ReaderLifecycleError,
} from "./errors.js";
import type { ReaderPlugin } from "./plugin.js";
import { createReaderSession } from "./session.js";
import { createFakeAdapter } from "./test-helpers.js";

const docId = "fake-doc";

describe("createReaderSession — lifecycle", () => {
  it("starts in idle and refuses commands before open()", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    expect(session.lifecycle).toBe("idle");
    await expect(session.commands.dispatch("reader.next-page", {})).rejects.toBeInstanceOf(Error); // CommandNotFoundError until builtins are wired
  });

  it("transitions idle → opening → ready on open()", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    const seen: string[] = [];
    session.events.on("lifecycle.changed", (e) => seen.push(e.current));
    await session.open({ docId });
    expect(seen).toEqual(["opening", "ready"]);
    expect(session.lifecycle).toBe("ready");
  });

  it("emits document.loaded and reader.opened in order", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    const docLoaded = vi.fn();
    const opened = vi.fn();
    session.events.on("document.loaded", docLoaded);
    session.events.on("reader.opened", opened);

    await session.open({ docId });
    expect(docLoaded).toHaveBeenCalledTimes(1);
    expect(opened).toHaveBeenCalledWith({ docId });
  });

  it("refuses a second open() call", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    await expect(session.open({ docId })).rejects.toBeInstanceOf(ReaderLifecycleError);
  });

  it("close() emits reader.closed and clears listeners", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    const closed = vi.fn();
    session.events.on("reader.closed", closed);
    await session.close();
    expect(closed).toHaveBeenCalledWith({ docId });
    expect(session.lifecycle).toBe("closed");
  });

  it("surfaces adapter open failures as AdapterError and goes to `error`", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter({ failOnOpen: true }) });
    await expect(session.open({ docId })).rejects.toMatchObject({
      name: "AdapterError",
    });
    expect(session.lifecycle).toBe("error");
  });
});

describe("createReaderSession — built-in commands", () => {
  it("reader.goto applies the resolved locator and emits position.changed", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    const fn = vi.fn();
    session.events.on("position.changed", fn);

    await session.commands.dispatch("reader.goto", {
      locator: {
        kind: "point",
        position: { blockId: "b2", offset: 0, globalOffset: 500, docVersion: 1 },
      },
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(session.getState().position?.position.blockId).toBe("b2");
  });

  it("reader.next-page advances via the adapter's NavigationEngine", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({
      docId,
      initialLocator: {
        kind: "point",
        position: { blockId: "b0", offset: 0, globalOffset: 0, docVersion: 1 },
      },
    });
    await session.commands.dispatch("reader.next-page", {});
    expect(session.getState().position?.position.blockId).toBe("b1");
  });

  it("reader.set-zoom mutates preferences and emits preferences.changed", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    const fn = vi.fn();
    session.events.on("preferences.changed", fn);
    await session.commands.dispatch("reader.set-zoom", { zoom: 2 });
    expect(session.getState().preferences.zoom).toBe(2);
    expect(fn).toHaveBeenCalled();
  });

  it("zoom clamps to the safe range", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    await session.commands.dispatch("reader.set-zoom", { zoom: 9999 });
    expect(session.getState().preferences.zoom).toBe(8);
    await session.commands.dispatch("reader.set-zoom", { zoom: 0 });
    expect(session.getState().preferences.zoom).toBe(0.25);
  });

  it("close via command tears the session down", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    await session.commands.dispatch("reader.close", {});
    expect(session.lifecycle).toBe("closed");
  });
});

describe("createReaderSession — selection & preferences seam", () => {
  it("setSelection emits selection.changed", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    const fn = vi.fn();
    session.events.on("selection.changed", fn);
    session.setSelection({
      kind: "range",
      start: { blockId: "b0", offset: 0, globalOffset: 0, docVersion: 1 },
      end: { blockId: "b0", offset: 5, globalOffset: 5, docVersion: 1 },
    });
    expect(fn).toHaveBeenCalled();
    expect(session.getState().selection?.kind).toBe("range");
  });
});

describe("createReaderSession — plugins", () => {
  function makePlugin(
    name: string,
    activated: { value: boolean },
    requires?: string[],
  ): ReaderPlugin {
    return {
      name,
      version: "0.0.0",
      ...(requires ? { requires } : {}),
      activate() {
        activated.value = true;
        return () => {
          activated.value = false;
        };
      },
    };
  }

  it("activates plugins registered before open() once the document is ready", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    const flag = { value: false };
    await session.use(makePlugin("p1", flag));
    expect(flag.value).toBe(false);
    await session.open({ docId });
    expect(flag.value).toBe(true);
  });

  it("activates plugins registered after open() immediately", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    const flag = { value: false };
    await session.use(makePlugin("p1", flag));
    expect(flag.value).toBe(true);
  });

  it("deactivates plugins in reverse on close()", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    const a = { value: false };
    const b = { value: false };
    await session.use(makePlugin("a", a));
    await session.use(makePlugin("b", b));
    await session.open({ docId });
    expect(a.value && b.value).toBe(true);
    await session.close();
    expect(a.value || b.value).toBe(false);
  });

  it("refuses duplicate plugin registrations", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.use(makePlugin("p", { value: false }));
    await expect(session.use(makePlugin("p", { value: false }))).rejects.toBeInstanceOf(
      DuplicatePluginError,
    );
  });

  it("fails activation when a required capability is missing", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    await session.open({ docId });
    await expect(
      session.use(makePlugin("needs-math", { value: false }, ["math"])),
    ).rejects.toBeInstanceOf(CapabilityNotSupportedError);
  });

  it("exposes a read-only context — events.emit is not in the type but at runtime undefined", async () => {
    const session = createReaderSession({ adapter: createFakeAdapter() });
    let received: unknown;
    await session.use({
      name: "spy",
      version: "0.0.0",
      activate(ctx) {
        // postMessage emits on plugin.message
        ctx.postMessage({ hello: "world" });
        // ctx.events has no `emit` (verified by the type system; at runtime
        // it simply isn't there).
        received = (ctx.events as unknown as { emit?: unknown }).emit;
      },
    });
    await session.open({ docId });
    expect(received).toBeUndefined();
  });
});
