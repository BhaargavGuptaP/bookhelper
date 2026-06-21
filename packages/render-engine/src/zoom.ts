/**
 * **Zoom math** — pure functions + a small controller. No DOM, no
 * preference persistence.
 *
 * Zoom is expressed as a *scale factor* (1.0 = 100%). Users interact
 * through symbolic steps ("+", "-", "reset", "fit-width", "fit-page",
 * preset percentage) so this module owns the mapping between symbolic
 * actions and concrete factors.
 *
 * The step ladder follows READER-SPEC §6.3 — geometric, not linear, so
 * single-press changes feel proportional whether you're at 50% or 300%.
 */

import { createEmitter, type Emitter, type Observable, type Unsubscribe } from "./observable.js";

/** Geometric zoom step ladder — 50% .. 400%. */
export const ZOOM_STEPS: readonly number[] = Object.freeze([
  0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0,
]);

export const MIN_ZOOM = ZOOM_STEPS[0]!;
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1]!;
export const DEFAULT_ZOOM = 1;

/** Symbolic intents the UI emits — the controller maps to concrete factors. */
export type ZoomIntent =
  | { readonly kind: "set"; readonly factor: number }
  | { readonly kind: "in" }
  | { readonly kind: "out" }
  | { readonly kind: "reset" }
  | { readonly kind: "fit-width"; readonly viewportWidth: number; readonly contentWidth: number }
  | {
      readonly kind: "fit-page";
      readonly viewportWidth: number;
      readonly viewportHeight: number;
      readonly contentWidth: number;
      readonly contentHeight: number;
    };

/** Clamp a factor to the allowed zoom range. */
export function clampZoom(factor: number): number {
  if (!Number.isFinite(factor)) return DEFAULT_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, factor));
}

/** Next step up from `current`, clamped to MAX. */
export function nextZoomStep(current: number): number {
  const c = clampZoom(current);
  for (const step of ZOOM_STEPS) {
    if (step > c + 1e-6) return step;
  }
  return MAX_ZOOM;
}

/** Previous step down from `current`, clamped to MIN. */
export function previousZoomStep(current: number): number {
  const c = clampZoom(current);
  for (let i = ZOOM_STEPS.length - 1; i >= 0; i -= 1) {
    const step = ZOOM_STEPS[i]!;
    if (step < c - 1e-6) return step;
  }
  return MIN_ZOOM;
}

/** Compute the factor that fits content width inside the viewport. */
export function fitWidth(viewportWidth: number, contentWidth: number): number {
  if (viewportWidth <= 0 || contentWidth <= 0) return DEFAULT_ZOOM;
  return clampZoom(viewportWidth / contentWidth);
}

/** Compute the factor that fits a page entirely inside the viewport. */
export function fitPage(
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number,
  contentHeight: number,
): number {
  if (viewportWidth <= 0 || viewportHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) {
    return DEFAULT_ZOOM;
  }
  return clampZoom(Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight));
}

/** Apply an intent to a current factor. Pure. */
export function applyZoomIntent(current: number, intent: ZoomIntent): number {
  switch (intent.kind) {
    case "set":
      return clampZoom(intent.factor);
    case "in":
      return nextZoomStep(current);
    case "out":
      return previousZoomStep(current);
    case "reset":
      return DEFAULT_ZOOM;
    case "fit-width":
      return fitWidth(intent.viewportWidth, intent.contentWidth);
    case "fit-page":
      return fitPage(
        intent.viewportWidth,
        intent.viewportHeight,
        intent.contentWidth,
        intent.contentHeight,
      );
  }
}

export interface ZoomController {
  readonly factor: Observable<number>;
  apply(intent: ZoomIntent): number;
  subscribe(listener: (factor: number) => void): Unsubscribe;
}

export function createZoom(initial: number = DEFAULT_ZOOM): ZoomController {
  const emitter: Emitter<number> = createEmitter(clampZoom(initial));
  return {
    factor: emitter,
    apply(intent) {
      const next = applyZoomIntent(emitter.value, intent);
      emitter.emit(next);
      return next;
    },
    subscribe(listener) {
      return emitter.subscribe(listener);
    },
  };
}
