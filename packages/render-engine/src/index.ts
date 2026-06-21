/**
 * `@bookhelper/render-engine` — format-agnostic rendering runtime.
 *
 * Sprint 3C.1 surface. See README.md for boundaries.
 */

// ─── Environment ──────────────────────────────────────────────────────
export type {
  MicrotaskSchedule,
  NowFn,
  RafCancel,
  RafSchedule,
  RenderEnvironment,
} from "./environment.js";
export { browserEnvironment, syntheticEnvironment } from "./environment.js";

// ─── Observable ───────────────────────────────────────────────────────
export type { Observable, Emitter, Unsubscribe } from "./observable.js";
export { createEmitter } from "./observable.js";

// ─── Viewport ─────────────────────────────────────────────────────────
export type { CreateViewportOptions, ViewportController, ViewportState } from "./viewport.js";
export { createViewport } from "./viewport.js";

// ─── Zoom ─────────────────────────────────────────────────────────────
export type { ZoomController, ZoomIntent } from "./zoom.js";
export {
  applyZoomIntent,
  clampZoom,
  createZoom,
  DEFAULT_ZOOM,
  fitPage,
  fitWidth,
  MAX_ZOOM,
  MIN_ZOOM,
  nextZoomStep,
  previousZoomStep,
  ZOOM_STEPS,
} from "./zoom.js";

// ─── Measurements ─────────────────────────────────────────────────────
export type {
  CreateMeasurementsOptions,
  MeasurementsController,
  MeasurementsState,
  PageMetrics,
  PageSize,
} from "./measurements.js";
export { createMeasurements } from "./measurements.js";

// ─── Visibility ───────────────────────────────────────────────────────
export type { ComputeVisibleInput, VisibleRange } from "./visibility.js";
export { computeVisible, EMPTY_VISIBLE } from "./visibility.js";

// ─── Virtualization ───────────────────────────────────────────────────
export type { ComputeWindowInput, RenderWindow } from "./virtualization.js";
export { computeRenderWindow, diffWindows, EMPTY_WINDOW } from "./virtualization.js";

// ─── Coordinates ──────────────────────────────────────────────────────
export type { DocumentPoint, ScrollToInput } from "./coordinates.js";
export { pointLocatorForPage, pointToScroll, scrollToPoint } from "./coordinates.js";
export type { CoordinatesUtility, CreateCoordinatesUtilityOptions } from "./coords-utility.js";
export { createCoordinatesUtility } from "./coords-utility.js";

// ─── Scroll sync ──────────────────────────────────────────────────────
export type {
  ScrollEventPayload,
  ScrollSource,
  ScrollSync,
  ScrollSyncOptions,
} from "./scroll-sync.js";
export { createScrollSync } from "./scroll-sync.js";

// ─── Overlays ─────────────────────────────────────────────────────────
export type {
  OverlayLayer,
  OverlayLayerId,
  OverlaysController,
  OverlaysState,
} from "./overlays.js";
export { createOverlays } from "./overlays.js";

// ─── Runtime ──────────────────────────────────────────────────────────
export type { CreateRuntimeOptions, RenderRuntime, RuntimeFrame } from "./runtime.js";
export { createRenderRuntime, pageSizesFromSession } from "./runtime.js";
