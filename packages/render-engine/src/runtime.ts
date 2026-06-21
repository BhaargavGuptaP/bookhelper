/**
 * **RenderRuntime** — the composite that wires the viewport, zoom,
 * measurements, virtualization, scroll-sync, and overlays into one
 * cohesive object the Reader UI consumes.
 *
 * Architectural rules (enforced by the type seam):
 *
 *   1. The runtime does **not** import a format adapter. It receives
 *      one `DocumentSession` from `@bookhelper/reader-core` and treats
 *      it as a black-box source of metadata + `blockIdForPage` info.
 *   2. The runtime does **not** render anything. It emits a stream of
 *      `RuntimeFrame` snapshots; the UI binds them to React.
 *   3. The runtime does **not** persist anything. Preferences live in
 *      reader-core's `ReaderStore`.
 *
 * One runtime per open document. `dispose()` is idempotent and cuts
 * every subscription.
 */

import type { BlockId, DocumentSession } from "@bookhelper/reader-core";
import { createCoordinatesUtility, type CoordinatesUtility } from "./coords-utility.js";
import { createScrollSync, type ScrollEventPayload, type ScrollSync } from "./scroll-sync.js";
import { createMeasurements, type MeasurementsController, type PageSize } from "./measurements.js";
import { createOverlays, type OverlaysController } from "./overlays.js";
import { createViewport, type ViewportController, type ViewportState } from "./viewport.js";
import { createZoom, type ZoomController, type ZoomIntent } from "./zoom.js";
import { computeVisible, EMPTY_VISIBLE, type VisibleRange } from "./visibility.js";
import { computeRenderWindow, EMPTY_WINDOW, type RenderWindow } from "./virtualization.js";
import { createEmitter, type Emitter, type Observable, type Unsubscribe } from "./observable.js";
import type { RenderEnvironment } from "./environment.js";

export interface RuntimeFrame {
  readonly viewport: ViewportState;
  readonly zoom: number;
  readonly visible: VisibleRange;
  readonly window: RenderWindow;
  /** True while measurements are still empty or default-filled. */
  readonly placeholder: boolean;
}

export interface RenderRuntime {
  readonly viewport: ViewportController;
  readonly zoom: ZoomController;
  readonly measurements: MeasurementsController;
  readonly overlays: OverlaysController;
  readonly frame: Observable<RuntimeFrame>;
  readonly coordinates: CoordinatesUtility;
  /** Apply a zoom intent and reflect through the frame stream. */
  applyZoom(intent: ZoomIntent): number;
  /** Programmatically scroll the viewport (queued on next frame). */
  scrollTo(input: {
    readonly page: number;
    readonly y?: number;
    readonly anchor?: "start" | "center";
  }): void;
  /** Report a user-driven scroll event from the DOM. */
  reportScroll(scrollX: number, scrollY: number): void;
  /** Resize the viewport. */
  resize(width: number, height: number, devicePixelRatio?: number): void;
  /** Subscribe to frame snapshots. */
  subscribe(listener: (f: RuntimeFrame) => void): Unsubscribe;
  /** Tear down. Idempotent. */
  dispose(): void;
}

export interface CreateRuntimeOptions {
  readonly env: RenderEnvironment;
  readonly session: DocumentSession;
  /** Pages to keep mounted before the first visible page. */
  readonly overscanBefore?: number;
  /** Pages to keep mounted after the last visible page. */
  readonly overscanAfter?: number;
  /** Initial zoom. Defaults to 1. */
  readonly initialZoom?: number;
  /** Initial viewport size — used before the host has measured. */
  readonly initialViewport?: {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio?: number;
  };
  /** Page gap in CSS pixels. Default 16. */
  readonly pageGap?: number;
  /**
   * Format-specific way to encode a page number as a `BlockId`.
   * Defaults to `"page:N"` (matches `@bookhelper/pdf-adapter`); other
   * formats can override.
   */
  readonly blockIdForPage?: (page: number) => BlockId;
  /** Optional error sink for subscriber exceptions. */
  readonly onError?: (err: unknown) => void;
}

const DEFAULT_BLOCK_ID_FOR_PAGE = (page: number): BlockId => `page:${page}`;

export function createRenderRuntime(options: CreateRuntimeOptions): RenderRuntime {
  const { env, session, onError } = options;

  const pageCount = session.manifest.pageCount ?? 0;
  const docId = session.manifest.docId;
  const docVersion = session.manifest.docVersion;
  const blockIdForPage = options.blockIdForPage ?? DEFAULT_BLOCK_ID_FOR_PAGE;

  const viewport = createViewport({
    initial: {
      width: options.initialViewport?.width ?? 0,
      height: options.initialViewport?.height ?? 0,
      devicePixelRatio: options.initialViewport?.devicePixelRatio ?? 1,
      scrollX: 0,
      scrollY: 0,
    },
  });
  const zoom = createZoom(options.initialZoom);
  const measurements = createMeasurements({
    pageCount,
    pageGap: options.pageGap,
  });
  const overlays = createOverlays();
  const coordinates = createCoordinatesUtility({
    docId,
    docVersion,
    blockIdForPage,
  });

  // Composite frame stream.
  const initialFrame: RuntimeFrame = {
    viewport: viewport.state.value,
    zoom: zoom.factor.value,
    visible: EMPTY_VISIBLE,
    window: EMPTY_WINDOW,
    placeholder: true,
  };
  const frame: Emitter<RuntimeFrame> = createEmitter(initialFrame, {
    equals: frameEquals,
    ...(onError ? { onError } : {}),
  });

  // Track whether any caller has supplied a real measurement. We can't
  // infer this from `measurements.state.value` alone because the
  // measurement store fills in defaults for every page.
  let hasRealMeasurement = false;
  const u3a = measurements.subscribe(() => {
    hasRealMeasurement = true;
  });

  function recomputeFrame(): void {
    const vp = viewport.state.value;
    const z = zoom.factor.value;
    const m = measurements.state.value;
    const visible = computeVisible({
      scrollTop: vp.scrollY,
      viewportHeight: vp.height,
      zoom: z,
      measurements: m,
    });
    const win = computeRenderWindow({
      visible,
      pageCount: m.pageCount,
      ...(options.overscanBefore !== undefined ? { overscanBefore: options.overscanBefore } : {}),
      ...(options.overscanAfter !== undefined ? { overscanAfter: options.overscanAfter } : {}),
    });
    const placeholder = m.pageCount === 0 || !hasRealMeasurement;
    frame.emit({
      viewport: vp,
      zoom: z,
      visible,
      window: win,
      placeholder,
    });
  }

  // Subscribe to the three inputs and recompute on each.
  const u1 = viewport.subscribe(() => recomputeFrame());
  const u2 = zoom.subscribe(() => recomputeFrame());
  const u3 = measurements.subscribe(() => recomputeFrame());

  // Initial pass once inputs are wired.
  recomputeFrame();

  // Scroll synchronization — incoming reports update the viewport.
  const scrollSync: ScrollSync = createScrollSync({
    env,
    onFrame(payload: ScrollEventPayload) {
      viewport.setScroll(payload.scrollX, payload.scrollY);
    },
  });

  let disposed = false;
  return {
    viewport,
    zoom,
    measurements,
    overlays,
    frame,
    coordinates,
    applyZoom(intent) {
      if (disposed) return zoom.factor.value;
      return zoom.apply(intent);
    },
    scrollTo(input) {
      if (disposed) return;
      const m = measurements.state.value;
      const vp = viewport.state.value;
      const y = coordinates.pageToScroll(
        {
          page: input.page,
          ...(input.y !== undefined ? { y: input.y } : {}),
          ...(input.anchor !== undefined ? { anchor: input.anchor } : {}),
          viewportHeight: vp.height,
          zoom: zoom.factor.value,
        },
        m,
      );
      // Programmatic scroll bypasses the RAF coalescer: we want it
      // reflected immediately so the host can update the DOM scrollTop
      // synchronously and avoid a one-frame flash.
      viewport.setScroll(0, y);
    },
    reportScroll(scrollX, scrollY) {
      if (disposed) return;
      scrollSync.report(scrollX, scrollY, "user");
    },
    resize(width, height, devicePixelRatio) {
      if (disposed) return;
      viewport.setSize(width, height, devicePixelRatio);
    },
    subscribe(listener) {
      return frame.subscribe(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scrollSync.dispose();
      u1();
      u2();
      u3();
      u3a();
    },
  };
}

function frameEquals(a: RuntimeFrame, b: RuntimeFrame): boolean {
  return (
    a.viewport === b.viewport &&
    a.zoom === b.zoom &&
    a.visible === b.visible &&
    a.window === b.window &&
    a.placeholder === b.placeholder
  );
}

/** Convenience helper for hosts that don't want to import every name. */
export function pageSizesFromSession(
  session: DocumentSession,
): ReadonlyArray<{ readonly index: number; readonly size: PageSize }> {
  // Reader-core's `DocumentSession` does not expose per-page sizes
  // directly (that's a fixed-layout concern). The PDF adapter exposes
  // the geometry through its own LayoutEngine, which the UI calls per
  // page. For now we return an empty list and let the UI populate.
  void session;
  return [];
}
