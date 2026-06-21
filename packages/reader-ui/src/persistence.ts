/**
 * Persistence for reader preferences and per-document session records.
 *
 * Two seams: a global preferences blob (shared across documents) and a
 * per-document session record ("reopen where I left off"). Both are
 * intentionally best-effort — storage can be full, disabled (private mode),
 * or absent (SSR). Every accessor swallows errors and degrades to "nothing
 * persisted" so the reader never breaks because a write failed.
 */

import type { ReaderSessionRecord, ReaderSettings, ReaderStorage } from "./types.js";

export const SETTINGS_KEY = "bh.reader.settings";
export const SESSION_KEY_PREFIX = "bh.reader.session.";

/** Compose the per-document session key. */
export function sessionKey(docId: string): string {
  return `${SESSION_KEY_PREFIX}${docId}`;
}

/** localStorage-backed storage. Falls back to memory if storage is absent. */
export function createLocalReaderStorage(): ReaderStorage {
  const ls = safeLocalStorage();
  if (!ls) return createMemoryReaderStorage();

  return {
    loadSettings() {
      return readJson<Partial<ReaderSettings>>(ls, SETTINGS_KEY);
    },
    saveSettings(settings) {
      writeJson(ls, SETTINGS_KEY, settings);
    },
    loadSession(docId) {
      return readJson<ReaderSessionRecord>(ls, sessionKey(docId));
    },
    saveSession(docId, record) {
      writeJson(ls, sessionKey(docId), record);
    },
  };
}

/** In-memory storage — used in tests and as the SSR/no-storage fallback. */
export function createMemoryReaderStorage(): ReaderStorage {
  const store = new Map<string, string>();
  const get = <T>(key: string): T | null => {
    const raw = store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };
  const set = (key: string, value: unknown): void => {
    try {
      store.set(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  };
  return {
    loadSettings: () => get<Partial<ReaderSettings>>(SETTINGS_KEY),
    saveSettings: (settings) => set(SETTINGS_KEY, settings),
    loadSession: (docId) => get<ReaderSessionRecord>(sessionKey(docId)),
    saveSession: (docId, record) => set(sessionKey(docId), record),
  };
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    // Touch it once — Safari throws on access in private mode.
    const probe = "__bh_reader_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(ls: Storage, key: string): T | null {
  try {
    const raw = ls.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(ls: Storage, key: string, value: unknown): void {
  try {
    ls.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled — ignore */
  }
}
