/**
 * **ReaderSession** — one document being read.
 *
 * The session is the live wiring: it owns the store, the event bus, the
 * command bus, the lifecycle state machine, the bound adapter, and the
 * set of activated plugins. Everything user-facing (the React reader
 * shell, the Tauri host, the test harness) ultimately holds a
 * `ReaderSession` and interacts with it through commands and
 * subscriptions — never by poking internals.
 *
 * Construction is deliberately split from `open()`. A session can be
 * created, have plugins registered, and have command handlers attached
 * *before* a document is bound. Opening then activates everything in
 * the right order:
 *
 *   1. lifecycle: `idle` → `opening`
 *   2. adapter `open()` resolves; manifest + capabilities applied to state
 *   3. built-in command handlers registered (goto / next-page / zoom …)
 *   4. lifecycle: `opening` → `ready`; emit `document.loaded` + `reader.opened`
 *   5. plugins activated (in registration order)
 *
 * Closing does the reverse: deactivate plugins, run adapter `close()`,
 * emit `reader.closed`, clear listeners, lifecycle → `closed`. After
 * `close()`, the session is terminal — a new session must be created.
 *
 * The session is intentionally *single-document*. Multi-document
 * orchestration (workspace tabs, side-by-side reading) is the
 * responsibility of the shell, which holds an N-of-sessions.
 */

import type { DocumentAdapter, DocumentSession } from "./adapter.js";
import { createCommandBus, type ReaderCommandBus } from "./commands.js";
import { createContext, type ReaderContext } from "./context.js";
import type { DocumentManifest } from "./document-model.js";
import { createEventBus, type ReaderEventBus, type ReaderEventEmitter } from "./events.js";
import {
  AdapterError,
  CapabilityNotSupportedError,
  DuplicatePluginError,
  PluginActivationError,
  ReaderLifecycleError,
} from "./errors.js";
import { canTransition, isInteractive, type LifecycleState } from "./lifecycle.js";
import type { Locator, PointLocator } from "./locator.js";
import { noopLogger, type Logger } from "./logger.js";
import type { ReaderPlugin, PluginRegistration } from "./plugin.js";
import { withPreferences, type ReaderPreferences } from "./preferences.js";
import {
  createStore,
  initialState,
  type ReaderState,
  type ReaderStore,
  type StateSubscriber,
} from "./state.js";

/** Construction inputs for a session. */
export interface ReaderSessionOptions {
  /** The adapter for the document the session will (eventually) open. */
  readonly adapter: DocumentAdapter;
  /** Optional logger; defaults to a no-op. */
  readonly logger?: Logger;
  /** Optional seed state — primarily for tests. */
  readonly seedState?: ReaderState;
  /** Override the command bus's undo depth. */
  readonly maxUndoDepth?: number;
  /** Initial preferences to apply on construction. */
  readonly preferences?: ReaderPreferences;
}

/** Inputs to `open()`. */
export interface OpenInput {
  readonly docId: string;
  readonly initialLocator?: PointLocator;
  readonly signal?: AbortSignal;
}

/**
 * Public session surface. The shell / tests interact through this; the
 * implementation details (store, lifecycle FSM, adapter handle) are
 * intentionally not exposed beyond what's needed.
 */
export interface ReaderSession {
  /** Stable id assigned at construction; useful for telemetry. */
  readonly id: string;
  readonly events: ReaderEventBus;
  readonly commands: ReaderCommandBus;

  /** Current lifecycle. Read frequently by the shell. */
  readonly lifecycle: LifecycleState;
  /** Current frozen state. Equivalent to `subscribe()`-ing once. */
  getState(): ReaderState;
  subscribe(subscriber: StateSubscriber): () => void;

  /** Bind to a document. Idempotent if already opening/ready for same docId. */
  open(input: OpenInput): Promise<void>;

  /**
   * Tear down. Runs plugin cleanups, adapter close, and event removal.
   * Calling twice is safe.
   */
  close(): Promise<void>;

  /**
   * Register a plugin. May be called before or after `open()` — plugins
   * registered before opening are activated as soon as the document is
   * `ready`; those registered after are activated immediately if the
   * session is interactive, otherwise queued.
   */
  use(plugin: ReaderPlugin): Promise<void>;

  /** List registered plugins (debugging / introspection). */
  plugins(): readonly PluginRegistration[];

  /** Replace the user's preferences. Emits `preferences.changed`. */
  setPreferences(patch: Partial<ReaderPreferences>): void;

  /**
   * Update the selection. The selection plugin (future) will call this
   * from selection events; for Sprint 3A it's a programmatic seam used
   * by tests and by adapters that synthesize selection (e.g. find bar).
   */
  setSelection(selection: Locator | null): void;
}

/** Build a fresh session bound to `adapter`. */
export function createReaderSession(options: ReaderSessionOptions): ReaderSession {
  const log = (options.logger ?? noopLogger).child({ component: "reader-session" });
  const sessionId = generateSessionId();

  // Event bus first — store/commands forward errors through it.
  const events: ReaderEventEmitter = createEventBus((err) => {
    log.warn({ err }, "reader event listener threw");
    // Re-emit as a reader.error so external observability sees it,
    // but guard against infinite loops if a `reader.error` listener
    // also throws (createEventBus's catch handles that).
    events.emit("reader.error", { error: err });
  });

  const seed: ReaderState = options.seedState ?? {
    ...initialState,
    preferences: options.preferences
      ? withPreferences(initialState.preferences, options.preferences)
      : initialState.preferences,
  };
  const store: ReaderStore = createStore(seed);
  const commands: ReaderCommandBus = createCommandBus({
    maxUndoDepth: options.maxUndoDepth ?? 100,
  });

  // Plugin registry — keyed by name so duplicate detection is O(1).
  const pluginsByName = new Map<string, PluginRegistration>();
  const pluginOrder: string[] = [];

  // Adapter session handle is populated by open() and cleared on close().
  let docSession: DocumentSession | null = null;
  let currentOpenSignal: AbortController | null = null;

  // ── Lifecycle helpers ──────────────────────────────────────────────
  function transition(next: LifecycleState): void {
    const previous = store.getState().lifecycle;
    if (previous === next) return;
    if (!canTransition(previous, next)) {
      throw new ReaderLifecycleError(previous, `transition to ${next}`);
    }
    store.apply({ lifecycle: next });
    events.emit("lifecycle.changed", { previous, current: next });
  }

  function requireInteractive(operation: string): DocumentSession {
    const lc = store.getState().lifecycle;
    if (!isInteractive(lc) || !docSession) {
      throw new ReaderLifecycleError(lc, operation);
    }
    return docSession;
  }

  // ── Built-in command handlers ──────────────────────────────────────
  // These wire commands to adapter calls. Plugins may *override* them
  // by re-registering — the bus uses last-write-wins for handler ids.
  function registerBuiltins(): void {
    commands.register("reader.goto", async ({ locator }) => {
      const session = requireInteractive("goto");
      const resolution = await session.navigation.resolve(locator);
      const previous = store.getState().position;
      store.apply({ position: resolution.target });
      events.emit("position.changed", { previous, current: resolution.target });
    });

    commands.register("reader.next-page", async () => {
      await step("page", "forward");
    });
    commands.register("reader.previous-page", async () => {
      await step("page", "backward");
    });
    commands.register("reader.next-chapter", async () => {
      await step("chapter", "forward");
    });
    commands.register("reader.previous-chapter", async () => {
      await step("chapter", "backward");
    });

    commands.register("reader.zoom-in", async () => {
      const z = store.getState().preferences.zoom;
      setPreferences({ zoom: clampZoom(z * 1.1) });
    });
    commands.register("reader.zoom-out", async () => {
      const z = store.getState().preferences.zoom;
      setPreferences({ zoom: clampZoom(z / 1.1) });
    });
    commands.register("reader.set-zoom", async ({ zoom }) => {
      setPreferences({ zoom: clampZoom(zoom) });
    });

    commands.register("reader.close", async () => {
      await close();
    });
  }

  async function step(grain: "page" | "chapter", direction: "forward" | "backward"): Promise<void> {
    const session = requireInteractive(`step ${grain} ${direction}`);
    const anchor = store.getState().position;
    if (!anchor) return;
    const resolution = await session.navigation.step({ anchor, grain, direction });
    if (!resolution) return;
    const previous = store.getState().position;
    store.apply({ position: resolution.target });
    events.emit("position.changed", { previous, current: resolution.target });
  }

  function clampZoom(z: number): number {
    if (!Number.isFinite(z)) return 1;
    return Math.min(8, Math.max(0.25, z));
  }

  // ── Preferences ────────────────────────────────────────────────────
  function setPreferences(patch: Partial<ReaderPreferences>): void {
    const previous = store.getState().preferences;
    const current = withPreferences(previous, patch);
    if (current === previous) return;
    store.apply({ preferences: current });
    events.emit("preferences.changed", { previous, current });
  }

  // ── Selection ──────────────────────────────────────────────────────
  function setSelection(selection: Locator | null): void {
    const prev = store.getState().selection;
    if (prev === selection) return;
    store.apply({ selection });
    events.emit("selection.changed", { selection });
  }

  // ── Plugins ────────────────────────────────────────────────────────
  function buildContext(pluginName: string): ReaderContext {
    return createContext({
      pluginName,
      store,
      events,
      commands,
      log,
    });
  }

  async function activatePlugin(plugin: ReaderPlugin): Promise<PluginRegistration> {
    // Capability gate (fail-fast — no silent no-ops in production).
    if (plugin.requires && plugin.requires.length > 0) {
      const caps = store.getState().capabilities as unknown as Record<string, unknown>;
      for (const required of plugin.requires) {
        if (caps[required] !== true) {
          throw new CapabilityNotSupportedError(
            required,
            `Plugin "${plugin.name}" requires capability "${required}".`,
          );
        }
      }
    }

    const ctx = buildContext(plugin.name);
    let cleanup: (() => void | Promise<void>) | null = null;
    try {
      const result = await plugin.activate(ctx);
      if (typeof result === "function") cleanup = result;
    } catch (err) {
      throw new PluginActivationError(plugin.name, err);
    }
    return {
      plugin,
      activatedAt: Date.now(),
      cleanup,
    };
  }

  async function use(plugin: ReaderPlugin): Promise<void> {
    if (pluginsByName.has(plugin.name)) {
      throw new DuplicatePluginError(plugin.name);
    }
    // Register slot eagerly so a concurrent `use()` of the same name
    // fails fast even before activation completes.
    const placeholder: PluginRegistration = {
      plugin,
      activatedAt: 0,
      cleanup: null,
    };
    pluginsByName.set(plugin.name, placeholder);
    pluginOrder.push(plugin.name);

    const lc = store.getState().lifecycle;
    if (!isInteractive(lc)) {
      // Defer activation until the session becomes ready.
      return;
    }
    try {
      const reg = await activatePlugin(plugin);
      pluginsByName.set(plugin.name, reg);
    } catch (err) {
      pluginsByName.delete(plugin.name);
      const idx = pluginOrder.indexOf(plugin.name);
      if (idx >= 0) pluginOrder.splice(idx, 1);
      throw err;
    }
  }

  async function activateDeferredPlugins(): Promise<void> {
    for (const name of pluginOrder) {
      const reg = pluginsByName.get(name);
      if (!reg || reg.activatedAt !== 0) continue;
      try {
        const activated = await activatePlugin(reg.plugin);
        pluginsByName.set(name, activated);
      } catch (err) {
        // A bad plugin should not poison the whole session — surface
        // through the error channel and continue with the rest.
        events.emit("reader.error", { error: err });
      }
    }
  }

  async function deactivatePlugins(): Promise<void> {
    // Reverse registration order — symmetric with activation.
    for (const name of [...pluginOrder].reverse()) {
      const reg = pluginsByName.get(name);
      if (!reg) continue;
      try {
        if (reg.cleanup) await reg.cleanup();
        if (reg.plugin.deactivate) await reg.plugin.deactivate();
      } catch (err) {
        events.emit("reader.error", { error: err });
      }
    }
    pluginsByName.clear();
    pluginOrder.length = 0;
  }

  // ── Open / close ───────────────────────────────────────────────────
  async function open(input: OpenInput): Promise<void> {
    const lc = store.getState().lifecycle;
    if (lc !== "idle") {
      throw new ReaderLifecycleError(lc, "open");
    }

    transition("opening");
    registerBuiltins();

    const abort = new AbortController();
    currentOpenSignal = abort;
    if (input.signal) {
      input.signal.addEventListener("abort", () => abort.abort());
    }

    let session: DocumentSession;
    try {
      session = await options.adapter.open({
        docId: input.docId,
        ...(input.initialLocator ? { initialLocator: input.initialLocator } : {}),
        signal: abort.signal,
      });
    } catch (err) {
      transition("error");
      throw new AdapterError(options.adapter.name, "open", asMessage(err), { cause: err });
    }

    docSession = session;
    const manifest: DocumentManifest = session.manifest;

    store.apply({
      document: manifest,
      capabilities: session.capabilities,
      ...(input.initialLocator ? { position: input.initialLocator } : {}),
    });

    transition("ready");

    events.emit("document.loaded", {
      manifest,
      capabilities: session.capabilities,
    });
    events.emit("reader.opened", { docId: manifest.docId });

    // Plugins registered before `open` are activated now.
    await activateDeferredPlugins();
  }

  async function close(): Promise<void> {
    const lc = store.getState().lifecycle;
    if (lc === "closed") return;
    if (lc === "idle") {
      // Never opened — short-circuit to closed.
      transition("closed");
      events.removeAll();
      return;
    }

    transition("closing");
    currentOpenSignal?.abort();

    await deactivatePlugins();

    if (docSession) {
      try {
        await docSession.close();
      } catch (err) {
        events.emit("reader.error", { error: err });
      } finally {
        docSession = null;
      }
    }

    const docId = store.getState().document?.docId ?? "";
    transition("closed");
    if (docId) events.emit("reader.closed", { docId });
    events.removeAll();
  }

  return {
    id: sessionId,
    events,
    commands,
    get lifecycle() {
      return store.getState().lifecycle;
    },
    getState: store.getState,
    subscribe: store.subscribe,
    open,
    close,
    use,
    plugins() {
      return pluginOrder
        .map((name) => pluginsByName.get(name))
        .filter((r): r is PluginRegistration => Boolean(r));
    },
    setPreferences,
    setSelection,
  };
}

function asMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

let sessionCounter = 0;
function generateSessionId(): string {
  sessionCounter += 1;
  return `reader-session-${sessionCounter.toString(36)}-${Date.now().toString(36)}`;
}
