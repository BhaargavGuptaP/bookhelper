/**
 * **NavigationEngine** — the adapter-supplied module that maps positions
 * to navigation primitives.
 *
 * Where {@link ./layout.LayoutEngine | LayoutEngine} answers "what does
 * the viewport show?", `NavigationEngine` answers "given a target
 * position, what should the reader do to get there?". The two are
 * separated because layout is *read* every frame (during scrolling) and
 * must be cheap, whereas navigation is invoked occasionally and may do
 * expensive work (load a page on demand, build a TOC, jump to next
 * heading).
 *
 * Concrete adapters will translate these calls into scroll math, PDF
 * page seeks, timestamp jumps, etc. The core never assumes scroll;
 * adapters whose unit isn't pixels (video transcripts, paginated PDF)
 * are first-class.
 */

import type { BlockId } from "./locator.js";
import type { PointLocator } from "./locator.js";

/** Direction of step navigation. */
export type StepDirection = "forward" | "backward";

/** Grain of step navigation. */
export type StepGrain = "page" | "chapter" | "block";

/**
 * Result of resolving a navigation request. The adapter computes the
 * destination locator and (optionally) signals whether the reader
 * should animate or jump.
 */
export interface NavigationResolution {
  readonly target: PointLocator;
  /** Whether the host should animate the scroll (vs. instant jump). */
  readonly animate?: boolean;
}

/**
 * Adapter-supplied navigation surface.
 *
 * The methods return resolutions (locators) rather than performing the
 * scroll themselves — actual scrolling belongs to the host's renderer.
 * This keeps adapters portable across web/Tauri shells.
 */
export interface NavigationEngine {
  /**
   * Translate a step request ("next page", "previous chapter") starting
   * from the given anchor into a destination locator. Returning `null`
   * means there's nothing to step to (e.g. last page).
   */
  step(input: {
    readonly anchor: PointLocator;
    readonly grain: StepGrain;
    readonly direction: StepDirection;
  }): Promise<NavigationResolution | null> | NavigationResolution | null;

  /**
   * Resolve a TOC anchor / arbitrary locator to a concrete destination.
   * Adapters use this for the three-strategy cascade (READER-SPEC §4.3)
   * — quote re-anchoring, structural fallback — before returning.
   */
  resolve(locator: PointLocator): Promise<NavigationResolution> | NavigationResolution;

  /**
   * Optional: convenience for jumping to a block's start. The default
   * implementation in the host wraps `resolve` over a synthesized point
   * locator; adapters may override for efficiency.
   */
  resolveBlock?(blockId: BlockId): Promise<NavigationResolution> | NavigationResolution;
}
