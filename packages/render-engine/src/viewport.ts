/**
 * **Viewport state** — the size, scroll position, and device pixel ratio
 * of the area the host is rendering into.
 *
 * Viewport is the *physical* canvas. Zoom is layered on top of it
 * (`zoom.ts`) and modulates how the document content is sized within
 * the viewport — they are deliberately separate concerns:
 *
 *   • Viewport changes when the user resizes the window.
 *   • Zoom changes when the user presses ⌘+/⌘- or picks "Fit width".
 *
 * Both feed `coordinates.ts` for scroll↔locator translation.
 */

import type { Viewport } from "@bookhelper/reader-core";
import { createEmitter, type Emitter, type Observable, type Unsubscribe } from "./observable.js";

/** Viewport state including scroll offsets. */
export interface ViewportState extends Viewport {
  /** Horizontal scroll offset within the rendered content (CSS pixels). */
  readonly scrollX: number;
  /** Vertical scroll offset within the rendered content (CSS pixels). */
  readonly scrollY: number;
}

export interface ViewportController {
  readonly state: Observable<ViewportState>;
  /** Replace the viewport dimensions (typically on resize). */
  setSize(width: number, height: number, devicePixelRatio?: number): void;
  /** Replace the scroll position. */
  setScroll(scrollX: number, scrollY: number): void;
  /** Update everything in one batch (single emit). */
  update(partial: Partial<ViewportState>): void;
  /** Subscribe to changes. */
  subscribe(listener: (s: ViewportState) => void): Unsubscribe;
}

export interface CreateViewportOptions {
  readonly initial?: Partial<ViewportState>;
}

export function createViewport(options: CreateViewportOptions = {}): ViewportController {
  const initial: ViewportState = {
    width: Math.max(0, options.initial?.width ?? 0),
    height: Math.max(0, options.initial?.height ?? 0),
    devicePixelRatio: options.initial?.devicePixelRatio ?? 1,
    scrollX: Math.max(0, options.initial?.scrollX ?? 0),
    scrollY: Math.max(0, options.initial?.scrollY ?? 0),
  };

  const emitter: Emitter<ViewportState> = createEmitter(initial, {
    equals: viewportStateEquals,
  });

  return {
    state: emitter,
    setSize(width, height, devicePixelRatio) {
      const prev = emitter.value;
      emitter.emit({
        ...prev,
        width: Math.max(0, width),
        height: Math.max(0, height),
        devicePixelRatio: devicePixelRatio ?? prev.devicePixelRatio,
      });
    },
    setScroll(scrollX, scrollY) {
      const prev = emitter.value;
      emitter.emit({
        ...prev,
        scrollX: Math.max(0, scrollX),
        scrollY: Math.max(0, scrollY),
      });
    },
    update(partial) {
      const prev = emitter.value;
      emitter.emit({
        ...prev,
        ...partial,
        width: partial.width !== undefined ? Math.max(0, partial.width) : prev.width,
        height: partial.height !== undefined ? Math.max(0, partial.height) : prev.height,
        scrollX: partial.scrollX !== undefined ? Math.max(0, partial.scrollX) : prev.scrollX,
        scrollY: partial.scrollY !== undefined ? Math.max(0, partial.scrollY) : prev.scrollY,
      });
    },
    subscribe(listener) {
      return emitter.subscribe(listener);
    },
  };
}

function viewportStateEquals(a: ViewportState, b: ViewportState): boolean {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.devicePixelRatio === b.devicePixelRatio &&
    a.scrollX === b.scrollX &&
    a.scrollY === b.scrollY
  );
}
