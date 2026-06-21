import { describe, expect, it } from "vitest";
import { createReaderEngine } from "./engine.js";
import { createFakeAdapter } from "./test-helpers.js";

describe("createReaderEngine", () => {
  it("returns null when no adapter matches", () => {
    const engine = createReaderEngine();
    expect(engine.resolveAdapter({ format: "pdf", docId: "x" })).toBeNull();
  });

  it("picks the most recently registered matching adapter", () => {
    const engine = createReaderEngine();
    const first = createFakeAdapter({ name: "first" });
    const second = createFakeAdapter({ name: "second" });
    engine.registerAdapter({ adapter: first, matches: ({ format }) => format === "pdf" });
    engine.registerAdapter({ adapter: second, matches: ({ format }) => format === "pdf" });
    expect(engine.resolveAdapter({ format: "pdf", docId: "x" })?.name).toBe("second");
  });

  it("unregister hook removes the adapter", () => {
    const engine = createReaderEngine();
    const adapter = createFakeAdapter();
    const off = engine.registerAdapter({ adapter, matches: () => true });
    off();
    expect(engine.resolveAdapter({ format: "pdf", docId: "x" })).toBeNull();
  });

  it("createSession throws if no adapter matches", () => {
    const engine = createReaderEngine();
    expect(() => engine.createSession({ docId: "x", format: "pdf" })).toThrow(
      /No reader adapter is registered/,
    );
  });

  it("createSession returns a session and tracks it as live until close", async () => {
    const engine = createReaderEngine();
    engine.registerAdapter({ adapter: createFakeAdapter(), matches: () => true });
    const session = engine.createSession({ docId: "x", format: "fake" });
    expect(engine.sessions()).toContain(session);
    await session.open({ docId: "x" });
    await session.close();
    expect(engine.sessions()).not.toContain(session);
  });
});
