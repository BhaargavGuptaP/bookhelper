/**
 * **ReaderContext** — the narrow surface a plugin or command handler sees.
 *
 * The context is constructed by the session and handed to plugins on
 * `activate`. It deliberately does **not** include `store.apply` or
 * `events.emit` for system events: those are the session's prerogative.
 * Plugins read state, subscribe to events, dispatch commands, register
 * handlers, and emit a single allowed event channel (`plugin.message`)
 * for cross-plugin messaging.
 *
 * Why a separate `ReaderContext` type rather than passing the session?
 * Because *interface narrowing is the cheapest enforcement we get*.
 * If a plugin tries `ctx.events.emit("position.changed", …)`, the
 * compiler stops it — that field doesn't exist on `ReaderEventBus`.
 * Future plugin sandboxing (workers, Tauri IPC) will marshal exactly
 * this shape and nothing else.
 */

import type { ReaderCommandBus } from "./commands.js";
import type { ReaderEventBus, ReaderEventEmitter } from "./events.js";
import type { Logger } from "./logger.js";
import type { ReaderStore } from "./state.js";

/**
 * The plugin-facing API surface. Construct via `createContext` in the
 * session; never instantiate directly.
 */
export interface ReaderContext {
  /** Read-only state access + subscriptions. */
  readonly store: Pick<ReaderStore, "getState" | "subscribe">;
  /** Subscribe-only event bus (no emit for system events). */
  readonly events: ReaderEventBus;
  /** Full command bus — dispatch & register are both safe for plugins. */
  readonly commands: ReaderCommandBus;
  /** Plugin-scoped logger; messages are namespaced by plugin name. */
  readonly log: Logger;
  /**
   * Send a structured message on the `plugin.message` channel. The
   * payload is wrapped as `{ plugin, message }` so subscribers can
   * filter by source without parsing.
   */
  postMessage(message: unknown): void;
}

/**
 * Construct a `ReaderContext` for a specific plugin. The session calls
 * this once per `activate`. The plugin name is baked in so the message
 * channel and log scope are correctly attributed.
 */
export function createContext(input: {
  readonly pluginName: string;
  readonly store: ReaderStore;
  readonly events: ReaderEventEmitter;
  readonly commands: ReaderCommandBus;
  readonly log: Logger;
}): ReaderContext {
  const { pluginName, store, events, commands, log } = input;

  // Expose only the read-side of the store to plugins.
  const readonlyStore: Pick<ReaderStore, "getState" | "subscribe"> = {
    getState: store.getState,
    subscribe: store.subscribe,
  };

  // Expose only on/once/off (no emit) — same for events.
  const readonlyEvents: ReaderEventBus = {
    on: events.on,
    once: events.once,
    off: events.off,
  };

  return {
    store: readonlyStore,
    events: readonlyEvents,
    commands,
    log: log.child({ plugin: pluginName }),
    postMessage(message) {
      events.emit("plugin.message", { plugin: pluginName, message });
    },
  };
}
