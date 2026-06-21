/**
 * **ReaderEngine** — the top-level entry point.
 *
 * One `ReaderEngine` per host process (Next.js web server, Tauri app,
 * test). It is intentionally small: it holds adapter registration and
 * mints {@link ReaderSession}s. Sessions are where the interesting
 * state lives.
 *
 * Why a separate engine if a session already encapsulates a document?
 * Three reasons:
 *
 *   1. **Adapter registry.** When the shell receives a `docId` it does
 *      not know the format. The engine looks up the registered adapter
 *      that handles this document and constructs the session with it.
 *   2. **Process-wide concerns.** Telemetry, default preferences,
 *      logger — things that should be wired once and shared by every
 *      session the user opens.
 *   3. **Future cross-session coordination.** Workspace tabs, "open
 *      two books side by side", AI features that scope across the
 *      whole library — those want a place that knows about every
 *      open session.
 *
 * The engine never holds business state itself; it is a thin factory
 * + registry.
 */

import type { DocumentAdapter } from "./adapter.js";
import { noopLogger, type Logger } from "./logger.js";
import type { ReaderPreferences } from "./preferences.js";
import { createReaderSession, type ReaderSession, type ReaderSessionOptions } from "./session.js";

/**
 * Predicate the engine uses to pick an adapter for a given document.
 * Resolution is keyed by `format` (a string the shell already knows
 * about — uploaded MIME type, file extension, content sniff result).
 */
export type AdapterPredicate = (input: {
  readonly format: string;
  readonly docId: string;
}) => boolean;

/** Registry entry. */
export interface AdapterRegistration {
  readonly adapter: DocumentAdapter;
  readonly matches: AdapterPredicate;
}

export interface ReaderEngineOptions {
  readonly logger?: Logger;
  readonly defaultPreferences?: ReaderPreferences;
  /** Override the per-session undo depth. */
  readonly maxUndoDepth?: number;
}

/** Inputs for opening a session through the engine. */
export interface CreateSessionInput {
  readonly docId: string;
  /** The format token used to pick an adapter. */
  readonly format: string;
  /** Optional per-session preference overrides. */
  readonly preferences?: ReaderPreferences;
}

/** The engine surface. */
export interface ReaderEngine {
  registerAdapter(registration: AdapterRegistration): () => void;
  /** Explicit adapter lookup — exposed for tests/diagnostics. */
  resolveAdapter(input: { format: string; docId: string }): DocumentAdapter | null;
  /** Create — but do not yet `open()` — a new reader session. */
  createSession(input: CreateSessionInput): ReaderSession;
  /** Currently-live sessions (those that have not been `close()`d). */
  sessions(): readonly ReaderSession[];
}

/** Construct a new engine. Pure — no side effects. */
export function createReaderEngine(options: ReaderEngineOptions = {}): ReaderEngine {
  const log = (options.logger ?? noopLogger).child({ component: "reader-engine" });
  const adapters: AdapterRegistration[] = [];
  const live = new Set<ReaderSession>();

  function registerAdapter(registration: AdapterRegistration): () => void {
    adapters.push(registration);
    return () => {
      const idx = adapters.indexOf(registration);
      if (idx >= 0) adapters.splice(idx, 1);
    };
  }

  function resolveAdapter(input: { format: string; docId: string }): DocumentAdapter | null {
    // Reverse iteration: later registrations win, mirroring how plugin
    // systems typically allow runtime overrides.
    for (let i = adapters.length - 1; i >= 0; i -= 1) {
      const entry = adapters[i];
      if (!entry) continue;
      if (entry.matches(input)) return entry.adapter;
    }
    return null;
  }

  function createSession(input: CreateSessionInput): ReaderSession {
    const adapter = resolveAdapter({ format: input.format, docId: input.docId });
    if (!adapter) {
      throw new Error(
        `No reader adapter is registered for format "${input.format}" (docId="${input.docId}").`,
      );
    }
    const sessionOpts: ReaderSessionOptions = {
      adapter,
      logger: log,
      ...(options.maxUndoDepth !== undefined ? { maxUndoDepth: options.maxUndoDepth } : {}),
      ...((input.preferences ?? options.defaultPreferences)
        ? { preferences: (input.preferences ?? options.defaultPreferences) as ReaderPreferences }
        : {}),
    };
    const session = createReaderSession(sessionOpts);
    live.add(session);
    // Auto-unregister on close so the engine never holds stale handles.
    session.events.on("reader.closed", () => {
      live.delete(session);
    });
    return session;
  }

  return {
    registerAdapter,
    resolveAdapter,
    createSession,
    sessions() {
      return [...live];
    },
  };
}
