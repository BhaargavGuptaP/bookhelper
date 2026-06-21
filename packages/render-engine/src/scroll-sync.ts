/**
 * **Scroll synchronization** — coalesce raw scroll events into one
 * coherent `ViewportController.setScroll` per animation frame.
 *
 * Browser scroll events fire at sub-frame rates and can fire hundreds
 * of times per second on fast wheel hardware. We don't want to drive
 * downstream recomputation (visible range, render window, plugin
 * notifications) at that rate — once per RAF is enough and matches
 * what the browser will actually paint.
 *
 * The sync helper also handles **programmatic** scrolls (e.g. "scroll
 * to page 42") by tagging the call so the listener can avoid re-firing
 * a "user scrolled" event in response to its own state change.
 */

import type { RenderEnvironment } from "./environment.js";

export type ScrollSource = "user" | "program";

export interface ScrollEventPayload {
  readonly scrollX: number;
  readonly scrollY: number;
  readonly source: ScrollSource;
  /** Timestamp from the env clock — for debounce / inertia calculations. */
  readonly timestamp: number;
}

export interface ScrollSyncOptions {
  readonly env: RenderEnvironment;
  /** Called once per frame with the latest coalesced scroll. */
  readonly onFrame: (payload: ScrollEventPayload) => void;
}

export interface ScrollSync {
  /** Report a scroll position; coalesced to the next frame. */
  report(scrollX: number, scrollY: number, source?: ScrollSource): void;
  /** Cancel any pending frame; safe to call multiple times. */
  dispose(): void;
}

/**
 * Build a scroll synchronizer that batches `report()` calls into one
 * RAF callback per frame. Subsequent reports within the same frame
 * overwrite the queued value — we only care about the latest.
 */
export function createScrollSync(options: ScrollSyncOptions): ScrollSync {
  const { env, onFrame } = options;
  let pending: ScrollEventPayload | null = null;
  let handle: number | null = null;

  function schedule(): void {
    if (handle !== null) return;
    handle = env.raf(() => {
      handle = null;
      const payload = pending;
      pending = null;
      if (payload) onFrame(payload);
    });
  }

  return {
    report(scrollX, scrollY, source = "user") {
      pending = {
        scrollX,
        scrollY,
        source,
        timestamp: env.now(),
      };
      schedule();
    },
    dispose() {
      if (handle !== null) {
        env.cancelRaf(handle);
        handle = null;
      }
      pending = null;
    },
  };
}
