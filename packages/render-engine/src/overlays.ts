/**
 * **Overlay layer registry** — a flat, z-ordered table of named layers
 * that plugins (highlights, annotations, search hits, AI cards) will
 * later mount into.
 *
 * No layer content lives here. The registry just owns:
 *
 *   • Identity (a stable `OverlayLayerId` plugins refer to)
 *   • Ordering (a `zIndex` field that's deterministic)
 *   • Visibility toggling (Reader UI flips a single layer off)
 *   • Subscription (UI rebinds when layers are added/removed)
 *
 * The Reader UI will mount one DOM element per layer above the page
 * canvas; the plugin owns the content of that element. This package
 * does not render anything itself.
 */

import { createEmitter, type Emitter, type Observable, type Unsubscribe } from "./observable.js";

export type OverlayLayerId = string;

export interface OverlayLayer {
  readonly id: OverlayLayerId;
  readonly label: string;
  readonly zIndex: number;
  readonly visible: boolean;
  /** Optional category — informs UI grouping later. */
  readonly category?: "highlight" | "annotation" | "search" | "ai" | "custom";
}

export interface OverlaysState {
  readonly layers: readonly OverlayLayer[];
}

export interface OverlaysController {
  readonly state: Observable<OverlaysState>;
  register(layer: OverlayLayer): void;
  unregister(id: OverlayLayerId): void;
  setVisible(id: OverlayLayerId, visible: boolean): void;
  setZIndex(id: OverlayLayerId, zIndex: number): void;
  get(id: OverlayLayerId): OverlayLayer | undefined;
  subscribe(listener: (s: OverlaysState) => void): Unsubscribe;
}

export function createOverlays(): OverlaysController {
  const emitter: Emitter<OverlaysState> = createEmitter(
    { layers: [] },
    {
      equals: (a, b) => a.layers === b.layers,
    },
  );

  function commit(next: OverlayLayer[]): void {
    next.sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
    emitter.emit({ layers: next });
  }

  return {
    state: emitter,
    register(layer) {
      const existing = emitter.value.layers.find((l) => l.id === layer.id);
      if (existing) return;
      commit([...emitter.value.layers, layer]);
    },
    unregister(id) {
      const next = emitter.value.layers.filter((l) => l.id !== id);
      if (next.length === emitter.value.layers.length) return;
      commit(next);
    },
    setVisible(id, visible) {
      const next = emitter.value.layers.map((l) => (l.id === id ? { ...l, visible } : l));
      if (next === emitter.value.layers) return;
      commit(next);
    },
    setZIndex(id, zIndex) {
      const next = emitter.value.layers.map((l) => (l.id === id ? { ...l, zIndex } : l));
      commit(next);
    },
    get(id) {
      return emitter.value.layers.find((l) => l.id === id);
    },
    subscribe(listener) {
      return emitter.subscribe(listener);
    },
  };
}
