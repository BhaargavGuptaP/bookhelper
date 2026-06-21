/**
 * **ReaderState** — the single source of truth for one reader session.
 *
 * Everything visible or interactable in the reader is derived from this
 * shape: lifecycle stage, the bound document, current position, visible
 * window, selection, preferences, search/bookmark/annotation/history
 * placeholders for plugins, and (for diagnostics) the active capabilities.
 *
 * **No duplicated state.** When a plugin needs to know the current page,
 * it reads `state.position`/`state.visibleRange`, not its own counter.
 * When the AI overlay needs the current selection, it reads
 * `state.selection`. Centralization is what lets the platform host every
 * future feature without coupling them.
 *
 * State is **immutable on the outside**: subscribers always receive a
 * frozen snapshot, and mutations happen through a single `apply`
 * function inside the session. That gives us referential equality
 * checks for cheap diffing and prevents the "who wrote this field?"
 * debugging tax.
 *
 * The store itself is intentionally tiny — no reducers, no middlewares,
 * no signals library. It works identically in node, web, workers, and
 * Tauri because it does not depend on any of them.
 */

import { emptyCapabilities, type ReaderCapabilities } from "./capabilities.js";
import type { DocumentManifest } from "./document-model.js";
import type { LayoutWindow } from "./layout.js";
import type { Locator, PointLocator } from "./locator.js";
import { defaultPreferences, type ReaderPreferences } from "./preferences.js";
import type { LifecycleState } from "./lifecycle.js";

/**
 * The state plugins read. **Frozen** on every transition so that
 * subscribers can diff with `===` and never accidentally mutate
 * shared state.
 */
/**
 * Declaration-merge point for typed plugin state slices.
 *
 * Each plugin package augments this interface to declare its own state key
 * and type. The pattern mirrors `ReaderCommandMap` and `ReaderEventMap`:
 *
 * ```ts
 * // In packages/highlight-plugin/src/index.ts:
 * declare module "@bookhelper/reader-core" {
 *   interface ReaderPluginStateMap {
 *     "bookhelper.highlights": HighlightSlice;
 *   }
 * }
 * ```
 *
 * Plugins that have not declared a slice access their state as `unknown`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReaderPluginStateMap {}

export interface ReaderState {
  readonly lifecycle: LifecycleState;
  /** The document this session is bound to (null until `opened`). */
  readonly document: DocumentManifest | null;
  /** Capabilities reported by the active adapter. */
  readonly capabilities: ReaderCapabilities;
  /** The user's effective preferences for this session. */
  readonly preferences: ReaderPreferences;
  /** Current furthest-read / restore position. */
  readonly position: PointLocator | null;
  /**
   * Live visible window, updated by the adapter as the user scrolls.
   * `null` while the document is loading.
   */
  readonly visibleRange: LayoutWindow | null;
  /** Active selection if any (point or range). */
  readonly selection: Locator | null;
  /** Reading progress in `[0, 1]` derived from `visibleRange.progress`. */
  readonly progress: number;
  /** Current page index for fixed-layout formats; `null` for reflowable. */
  readonly currentPage: number | null;

  // Placeholders — populated by feature plugins (search, bookmarks,
  // annotations, highlights, history). Keeping the shape stable lets
  // those plugins ship without re-broadcasting their data through events.
  readonly bookmarks: readonly Locator[];
  readonly highlights: readonly Locator[];
  readonly annotations: readonly Locator[];
  readonly history: readonly PointLocator[];
  readonly searchQuery: string | null;
  readonly searchMatches: readonly Locator[];

  /**
   * Per-session state bag for plugins.
   *
   * Plugins declare their slice via TypeScript declaration merging:
   * ```ts
   * declare module "@bookhelper/reader-core" {
   *   interface ReaderPluginStateMap {
   *     "bookhelper.highlights": { highlights: readonly StoredHighlight[] };
   *   }
   * }
   * ```
   * This gives the same type-safety and discoverability as
   * ReaderCommandMap and ReaderEventMap. Unknown keys remain accessible
   * as `unknown` for forward-compatibility with untyped plugins.
   */
  readonly pluginState: Readonly<Partial<ReaderPluginStateMap>>;
}

/** The conservative default for a session that has not yet opened. */
export const initialState: ReaderState = Object.freeze({
  lifecycle: "idle",
  document: null,
  capabilities: emptyCapabilities,
  preferences: defaultPreferences,
  position: null,
  visibleRange: null,
  selection: null,
  progress: 0,
  currentPage: null,
  bookmarks: Object.freeze([]) as readonly Locator[],
  highlights: Object.freeze([]) as readonly Locator[],
  annotations: Object.freeze([]) as readonly Locator[],
  history: Object.freeze([]) as readonly PointLocator[],
  searchQuery: null,
  searchMatches: Object.freeze([]) as readonly Locator[],
  pluginState: Object.freeze({}) as Readonly<Partial<ReaderPluginStateMap>>,
});

/** Subscriber to state changes. Receives the new (and previous) state. */
export type StateSubscriber = (next: ReaderState, previous: ReaderState) => void;

/** Selector helpers — `select(state)` returns a derived value. */
export type StateSelector<T> = (state: ReaderState) => T;

/**
 * Minimal store contract. The session creates one; plugins read from it
 * via `ReaderContext` (which exposes only `getState` and `subscribe`,
 * never `apply`).
 */
export interface ReaderStore {
  getState(): ReaderState;
  subscribe(subscriber: StateSubscriber): () => void;
  /**
   * Apply a patch producing a new state. The patch is shallow-merged
   * into the previous state and the result is frozen. Subscribers are
   * notified synchronously in subscription order; a subscriber that
   * throws does not stop later subscribers.
   */
  apply(patch: Partial<ReaderState>): ReaderState;
}

/** Construct a store seeded with `initialState` (or an override for tests). */
export function createStore(seed: ReaderState = initialState): ReaderStore {
  let state = Object.isFrozen(seed) ? seed : Object.freeze({ ...seed });
  const subscribers = new Set<StateSubscriber>();

  function getState(): ReaderState {
    return state;
  }

  function subscribe(subscriber: StateSubscriber): () => void {
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  }

  function apply(patch: Partial<ReaderState>): ReaderState {
    const previous = state;
    // Identity check — no-op patches don't notify (keeps event bursts
    // quiet during scrolling).
    let changed = false;
    for (const key of Object.keys(patch) as (keyof ReaderState)[]) {
      if (patch[key] !== previous[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return previous;

    state = Object.freeze({ ...previous, ...patch });
    for (const subscriber of [...subscribers]) {
      try {
        subscriber(state, previous);
      } catch {
        // Swallow — state must never be partially observed. The session
        // forwards via `reader.error` separately.
      }
    }
    return state;
  }

  return { getState, subscribe, apply };
}

/** Convenience: derive a value from state with a selector. */
export function select<T>(store: ReaderStore, selector: StateSelector<T>): T {
  return selector(store.getState());
}
