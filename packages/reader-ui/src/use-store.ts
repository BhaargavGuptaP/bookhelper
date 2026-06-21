/**
 * React bindings over the two external stores the shell observes:
 *
 *   • reader-core `ReaderSession` — the single source of truth for
 *     lifecycle, position, preferences, capabilities.
 *   • render-engine `RenderRuntime` — the live frame (viewport, zoom,
 *     visible range, render window) and page measurements.
 *
 * Both are plain observables; `useSyncExternalStore` is the correct,
 * tearing-free way to read them. Snapshots are referentially stable when
 * nothing changed (both stores dedupe), so these never loop.
 */

import { useCallback, useSyncExternalStore } from "react";
import { initialState, type ReaderSession, type ReaderState } from "@bookhelper/reader-core";
import {
  EMPTY_VISIBLE,
  EMPTY_WINDOW,
  type MeasurementsState,
  type RenderRuntime,
  type RuntimeFrame,
} from "@bookhelper/render-engine";

const EMPTY_FRAME: RuntimeFrame = Object.freeze({
  viewport: { width: 0, height: 0, devicePixelRatio: 1, scrollX: 0, scrollY: 0 },
  zoom: 1,
  visible: EMPTY_VISIBLE,
  window: EMPTY_WINDOW,
  placeholder: true,
});

const EMPTY_MEASUREMENTS: MeasurementsState = Object.freeze({
  pageCount: 0,
  totalHeight: 0,
  maxWidth: 0,
  metrics: Object.freeze([]) as MeasurementsState["metrics"],
});

/** Subscribe to reader-core session state. */
export function useReaderState(session: ReaderSession | null): ReaderState {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!session) return () => {};
      return session.subscribe(() => onChange());
    },
    [session],
  );
  const getSnapshot = useCallback(() => (session ? session.getState() : initialState), [session]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Subscribe to the render runtime's composite frame. */
export function useRuntimeFrame(runtime: RenderRuntime | null): RuntimeFrame {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!runtime) return () => {};
      return runtime.subscribe(() => onChange());
    },
    [runtime],
  );
  const getSnapshot = useCallback(() => (runtime ? runtime.frame.value : EMPTY_FRAME), [runtime]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Subscribe to per-page measurements (geometry for virtualized layout). */
export function useMeasurements(runtime: RenderRuntime | null): MeasurementsState {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!runtime) return () => {};
      return runtime.measurements.subscribe(() => onChange());
    },
    [runtime],
  );
  const getSnapshot = useCallback(
    () => (runtime ? runtime.measurements.state.value : EMPTY_MEASUREMENTS),
    [runtime],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
