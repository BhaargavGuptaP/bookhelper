import { describe, expect, it } from "vitest";
import { defaultPreferences } from "@bookhelper/reader-core";
import {
  createLocalReaderStorage,
  createMemoryReaderStorage,
  sessionKey,
  SESSION_KEY_PREFIX,
} from "./persistence.js";
import type { ReaderSessionRecord, ReaderSettings } from "./types.js";

const settings: ReaderSettings = {
  preferences: { ...defaultPreferences, theme: "sepia", zoom: 1.25 },
  pageGap: 32,
  sidebarWidth: 320,
  focusMode: true,
};

const record: ReaderSessionRecord = {
  page: 7,
  zoom: 1.5,
  lastOpenedAt: 1000,
  lastClosedAt: 2000,
  totalReadingMs: 60000,
  updatedAt: 2000,
};

describe("sessionKey", () => {
  it("namespaces per document", () => {
    expect(sessionKey("doc_42")).toBe(`${SESSION_KEY_PREFIX}doc_42`);
  });
});

describe.each([
  ["memory", createMemoryReaderStorage],
  ["local", createLocalReaderStorage],
])("%s storage", (_name, make) => {
  it("round-trips settings", () => {
    const s = make();
    expect(s.loadSettings()).toBeNull();
    s.saveSettings(settings);
    expect(s.loadSettings()).toEqual(settings);
  });

  it("round-trips per-document session records", () => {
    const s = make();
    expect(s.loadSession("doc_1")).toBeNull();
    s.saveSession("doc_1", record);
    expect(s.loadSession("doc_1")).toEqual(record);
    // Isolation between documents.
    expect(s.loadSession("doc_2")).toBeNull();
  });
});
