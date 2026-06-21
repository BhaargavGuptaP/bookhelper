/**
 * The Reader context — the single object every shell component reads from.
 *
 * Composition: {@link ReaderProvider} constructs the reader-core session,
 * the render runtime, and the page-content loader, then publishes them plus
 * derived display values and a flat `actions` bag here. Components
 * (toolbar, viewport, TOC, status bar, preferences) are thin consumers —
 * they never own reader state, only render it and call actions. This is how
 * "all state flows through Reader Core / no duplicated state" is enforced at
 * the component boundary.
 */

import { createContext, useContext } from "react";
import type {
  DocumentManifest,
  ReaderCapabilities,
  ReaderPreferences,
  ReaderSession,
  ReaderState,
  ReadingTheme,
} from "@bookhelper/reader-core";
import type { MeasurementsState, RenderRuntime, RuntimeFrame } from "@bookhelper/render-engine";
import type { PageContentLoader, ReaderDocMeta, ReaderTocNode } from "./types.js";

/** Lifecycle of the shell's bootstrap, distinct from reader-core lifecycle. */
export type ReaderPhase = "opening" | "ready" | "error";

/** Chrome / layout UI state owned by the shell (not by reader-core). */
export interface ReaderChromeState {
  readonly tocOpen: boolean;
  readonly preferencesOpen: boolean;
  readonly focusMode: boolean;
  /** Side panel (TOC) width in CSS px. */
  readonly sidebarWidth: number;
  /** Gap between pages in CSS px. */
  readonly pageGap: number;
  /** Expanded TOC node ids. */
  readonly expandedToc: ReadonlySet<string>;
}

/**
 * Imperative actions. Every navigation/view action routes through a Reader
 * Command (`reader.goto`, `reader.set-zoom`, `reader.close`) or
 * `setPreferences` — never a direct UI-state mutation of reader-core data.
 */
export interface ReaderActions {
  // Navigation (all dispatch `reader.goto` under the hood + scroll).
  nextPage(): void;
  previousPage(): void;
  goToPage(page: number, anchor?: "start" | "center"): void;
  firstPage(): void;
  lastPage(): void;
  // View (all dispatch `reader.set-zoom`; reader-core stays the source of truth).
  zoomIn(): void;
  zoomOut(): void;
  zoomReset(): void;
  fitWidth(): void;
  fitPage(): void;
  setZoom(factor: number): void;
  // Reading preferences (flow through reader-core).
  setPreferences(patch: Partial<ReaderPreferences>): void;
  setTheme(theme: ReadingTheme): void;
  cycleTheme(): void;
  // Chrome (shell-local).
  toggleToc(): void;
  togglePreferences(): void;
  toggleFocusMode(): void;
  setSidebarWidth(px: number): void;
  setPageGap(px: number): void;
  toggleTocNode(id: string): void;
  /** Esc behavior: progressively dismiss panels / focus mode. */
  dismiss(): void;
  /** Persist + leave the reader (calls the host `onExit`). */
  close(): void;
}

export interface ReaderContextValue {
  // Identity / status
  readonly doc: ReaderDocMeta;
  readonly phase: ReaderPhase;
  readonly error: Error | null;

  // reader-core
  readonly session: ReaderSession | null;
  readonly state: ReaderState;
  readonly preferences: ReaderPreferences;
  readonly capabilities: ReaderCapabilities;
  readonly manifest: DocumentManifest | null;

  // render-engine
  readonly runtime: RenderRuntime | null;
  readonly frame: RuntimeFrame;
  readonly measurements: MeasurementsState;

  // Derived display
  readonly pageCount: number;
  readonly currentPage: number;
  readonly progress: number;
  readonly zoom: number;

  // Content
  readonly content: PageContentLoader | null;
  readonly toc: readonly ReaderTocNode[];

  // Chrome + actions
  readonly chrome: ReaderChromeState;
  readonly actions: ReaderActions;

  // Session timing
  readonly openedAt: number;

  /** Viewport registers its scroll container so navigation can drive it. */
  registerScroller(el: HTMLElement | null): void;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);
ReaderContext.displayName = "ReaderContext";

export const ReaderContextProvider = ReaderContext.Provider;

/** Read the reader context. Throws if used outside a {@link ReaderProvider}. */
export function useReaderContext(): ReaderContextValue {
  const ctx = useContext(ReaderContext);
  if (!ctx) {
    throw new Error("useReaderContext must be used within a <ReaderProvider>.");
  }
  return ctx;
}
