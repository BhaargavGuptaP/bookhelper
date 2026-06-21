/**
 * **ReaderPlugin** — the extension boundary.
 *
 * A plugin is the *only* sanctioned way to add behavior to the reader.
 * Highlights, annotations, bookmarks, search UI, AI overlays, knowledge
 * graph collectors, learning trackers, analytics emitters, real-time
 * collaboration cursors — every one of those features will ship as
 * a plugin that receives a {@link ReaderContext} and uses only the
 * APIs that context exposes.
 *
 * Plugins **never**:
 *   • mutate `ReaderState` directly,
 *   • reach into another plugin,
 *   • import internal modules of the reader,
 *   • assume a renderer / DOM / fetch / storage.
 *
 * They only:
 *   • read state via `getState()` and `subscribe()`,
 *   • observe events via `on()`,
 *   • register their own command handlers and event types,
 *   • dispatch commands.
 *
 * That is the whole API surface — small enough to audit, large enough
 * to host every future feature. Because every plugin is constructed
 * before activation, plugin order doesn't matter for capability
 * discovery: the host activates them once the document is `ready`.
 */

import type { ReaderContext } from "./context.js";

/**
 * The plugin contract. Plugins are plain objects — no class hierarchy,
 * no lifecycle mixins — so they can be created by factories, imported
 * from any package, and tested in isolation.
 */
export interface ReaderPlugin {
  /**
   * Unique name (within a session). Used for diagnostics, plugin
   * state isolation, and duplicate-registration detection. Conventional
   * format: `vendor.feature` (e.g. `bookhelper.highlights`).
   */
  readonly name: string;

  /** Semantic version of the plugin — for telemetry and compat checks. */
  readonly version: string;

  /**
   * Capabilities the plugin requires. Activation fails fast if the
   * adapter's `ReaderCapabilities` does not satisfy them — UIs will hide
   * the plugin rather than show broken affordances.
   */
  readonly requires?: readonly string[];

  /**
   * Called once when the plugin is added to a ready session. May be
   * async (e.g. preload an index). May return a cleanup function in
   * lieu of defining `deactivate`.
   */
  activate(
    ctx: ReaderContext,
  ): void | (() => void | Promise<void>) | Promise<void | (() => void | Promise<void>)>;

  /**
   * Optional explicit deactivation hook. Called when the plugin is
   * removed or when the session closes. Either return a cleanup
   * function from `activate` or implement this — both are supported.
   */
  deactivate?(): void | Promise<void>;
}

/**
 * Internal record kept by the session for each registered plugin.
 * Exposed so tests can inspect activation state.
 */
export interface PluginRegistration {
  readonly plugin: ReaderPlugin;
  readonly activatedAt: number;
  readonly cleanup: (() => void | Promise<void>) | null;
}

/** Plugin factory — encouraged pattern for plugins that need params. */
export type ReaderPluginFactory<T = void> = (options: T) => ReaderPlugin;
