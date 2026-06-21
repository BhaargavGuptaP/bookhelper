/**
 * **ReaderEvents** — the typed pub/sub bus.
 *
 * Plugins, AI overlays, knowledge graph collectors, learning trackers,
 * collaboration cursors — all of them communicate with the reader by
 * **subscribing to events**, never by reaching into state or other
 * plugins. Future AI features must subscribe to `selection.changed` /
 * `page.changed` / `highlight.created` etc. rather than modify reader
 * internals. That's the whole reason this bus exists in Sprint 3A,
 * before any of those features ship.
 *
 * Event names are strings (`namespace.verb`) so they survive serialization
 * to telemetry pipelines, dev-tools panels, and cross-process plugins
 * (Tauri host ↔ web). The payload is typed via the `ReaderEventMap`
 * below; adapters and plugins extend the map via TypeScript declaration
 * merging when they need to broadcast their own events.
 *
 * The bus is intentionally tiny — no wildcard subscriptions, no async
 * propagation order, no priority queues. Those things are easy to add
 * later; getting rid of them is not.
 */

import type { ReaderCapabilities } from "./capabilities.js";
import type { DocumentManifest } from "./document-model.js";
import type { Locator, PointLocator } from "./locator.js";
import type { LifecycleState } from "./lifecycle.js";
import type { ReaderPreferences } from "./preferences.js";

// ──────────────────────────────────────────────────────────────────────────
// Canonical event map
// ──────────────────────────────────────────────────────────────────────────

/**
 * The built-in event names + payloads. Augment via TypeScript declaration
 * merging from a plugin/adapter package to add your own:
 *
 * ```ts
 * declare module "@bookhelper/reader-core" {
 *   interface ReaderEventMap {
 *     "highlight.created": { highlightId: string; locator: Range };
 *   }
 * }
 * ```
 */
export interface ReaderEventMap {
  // Session lifecycle ──────────────────────────────────────────────────
  "reader.opened": { docId: string };
  "reader.closed": { docId: string };
  "lifecycle.changed": { previous: LifecycleState; current: LifecycleState };

  // Document ───────────────────────────────────────────────────────────
  "document.loaded": { manifest: DocumentManifest; capabilities: ReaderCapabilities };

  // Position & navigation ─────────────────────────────────────────────
  "position.changed": { previous: PointLocator | null; current: PointLocator };
  "page.changed": { previous: number | null; current: number };
  "visible-range.changed": { from: PointLocator; to: PointLocator };

  // Selection ──────────────────────────────────────────────────────────
  "selection.changed": { selection: Locator | null };

  // Preferences ────────────────────────────────────────────────────────
  "preferences.changed": { previous: ReaderPreferences; current: ReaderPreferences };

  // Generic plugin telemetry channel ─────────────────────────────────
  "plugin.message": { plugin: string; message: unknown };

  // Errors surfaced for observability (does not throw) ────────────────
  "reader.error": { error: unknown };
}

/** Every legal event name. */
export type ReaderEventName = keyof ReaderEventMap;

/** Listener for a specific event. */
export type ReaderEventListener<E extends ReaderEventName> = (payload: ReaderEventMap[E]) => void;

/** Unsubscribe handle returned by `on`. Idempotent. */
export type Unsubscribe = () => void;

// ──────────────────────────────────────────────────────────────────────────
// Bus
// ──────────────────────────────────────────────────────────────────────────

/**
 * The public read/write surface of the bus. We split read (`on`) from
 * write (`emit`) because most consumers only need to subscribe — the
 * session keeps `emit` private to avoid spurious broadcasts.
 */
export interface ReaderEventBus {
  on<E extends ReaderEventName>(event: E, listener: ReaderEventListener<E>): Unsubscribe;
  once<E extends ReaderEventName>(event: E, listener: ReaderEventListener<E>): Unsubscribe;
  off<E extends ReaderEventName>(event: E, listener: ReaderEventListener<E>): void;
}

/** Internal emitter interface — exposed to the session, not to plugins. */
export interface ReaderEventEmitter extends ReaderEventBus {
  emit<E extends ReaderEventName>(event: E, payload: ReaderEventMap[E]): void;
  /** Remove every listener; called on session close. */
  removeAll(): void;
}

/**
 * Create a bus. Listener errors are caught and forwarded to a sink so a
 * misbehaving subscriber can never stop other subscribers from running
 * (events must be reliable enough that telemetry/persistence can depend
 * on them). The sink defaults to a no-op; the session wires it to
 * `reader.error`.
 */
export function createEventBus(
  onListenerError: (err: unknown, event: ReaderEventName) => void = () => {},
): ReaderEventEmitter {
  // Using Map<string, Set<Function>> rather than the DOM EventTarget so
  // this works identically in node, workers, web, and Tauri.
  const listeners = new Map<ReaderEventName, Set<(payload: unknown) => void>>();

  function on<E extends ReaderEventName>(event: E, listener: ReaderEventListener<E>): Unsubscribe {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    const wrapped = listener as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
      const s = listeners.get(event);
      if (!s) return;
      s.delete(wrapped);
      if (s.size === 0) listeners.delete(event);
    };
  }

  function off<E extends ReaderEventName>(event: E, listener: ReaderEventListener<E>): void {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(listener as (payload: unknown) => void);
    if (set.size === 0) listeners.delete(event);
  }

  function once<E extends ReaderEventName>(
    event: E,
    listener: ReaderEventListener<E>,
  ): Unsubscribe {
    const unsubscribe = on(event, ((payload) => {
      unsubscribe();
      listener(payload);
    }) as ReaderEventListener<E>);
    return unsubscribe;
  }

  function emit<E extends ReaderEventName>(event: E, payload: ReaderEventMap[E]): void {
    const set = listeners.get(event);
    if (!set || set.size === 0) return;
    // Snapshot so a listener that unsubscribes during dispatch can't
    // mutate the set we're iterating.
    for (const listener of [...set]) {
      try {
        listener(payload);
      } catch (err) {
        onListenerError(err, event);
      }
    }
  }

  function removeAll(): void {
    listeners.clear();
  }

  return { on, off, once, emit, removeAll };
}
