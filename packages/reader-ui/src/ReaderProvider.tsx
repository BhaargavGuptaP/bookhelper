"use client";

/**
 * **ReaderProvider** — the composition + orchestration root of the shell.
 *
 * Responsibilities:
 *   1. Run the host `bootstrap` once (open the reader-core session + build
 *      the page-content loader + TOC), honoring abort on fast unmount.
 *   2. Construct the render runtime from the adapter's document session and
 *      keep its zoom / page-gap mirrored from reader-core preferences (so
 *      reader-core stays the single source of truth — no duplicated state).
 *   3. Restore the persisted per-document session (page + zoom) and the
 *      global reading preferences on open; persist them (debounced) and on
 *      teardown.
 *   4. Expose a flat `actions` bag where every navigation/view action is a
 *      Reader Command dispatch — never a direct state mutation.
 *   5. Own purely-presentational chrome state (TOC open, focus mode, panel
 *      sizes) that reader-core does not model.
 *
 * It renders no DOM of its own beyond the context provider; layout lives in
 * `ReaderShell` and the components.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ReaderPreferences, ReaderSession, ReadingTheme } from "@bookhelper/reader-core";
import {
  clampZoom,
  createRenderRuntime,
  fitPage as computeFitPage,
  fitWidth as computeFitWidth,
  nextZoomStep,
  previousZoomStep,
  type RenderRuntime,
} from "@bookhelper/render-engine";
import {
  ReaderContextProvider,
  type ReaderActions,
  type ReaderChromeState,
  type ReaderContextValue,
  type ReaderPhase,
} from "./context.js";
import { createBrowserReaderEnvironment } from "./environment.js";
import { memoizePageLoader } from "./content-cache.js";
import { createLocalReaderStorage } from "./persistence.js";
import { resolveReaderIntent, isEditableTarget } from "./keyboard.js";
import { useMeasurements, useReaderState, useRuntimeFrame } from "./use-store.js";
import type {
  OpenedReader,
  ReaderBootstrap,
  ReaderDocMeta,
  ReaderSessionRecord,
  ReaderStorage,
} from "./types.js";

const DEFAULT_PAGE_GAP = 24;
const DEFAULT_SIDEBAR_WIDTH = 304;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 480;
const DESKTOP_TOC_BREAKPOINT = 1024;
const PERSIST_DEBOUNCE_MS = 1200;

/** Reader themes the cycle (`t`) steps through. */
const THEME_CYCLE: readonly ReadingTheme[] = ["light", "sepia", "dark", "high-contrast"];

export interface ReaderProviderProps {
  readonly doc: ReaderDocMeta;
  readonly bootstrap: ReaderBootstrap;
  /** Called when the user leaves the reader (Back / close). */
  readonly onExit: () => void;
  /** Override the persistence backend (tests inject in-memory). */
  readonly storage?: ReaderStorage;
  readonly children: ReactNode;
}

export function ReaderProvider(props: ReaderProviderProps): ReactNode {
  const { doc, bootstrap, onExit } = props;

  const storage = useMemo<ReaderStorage>(
    () => props.storage ?? createLocalReaderStorage(),
    [props.storage],
  );

  // Persisted settings are read once, synchronously, so the first paint is
  // already correct (no flash of default layout).
  const settings0Ref = useRef<ReturnType<ReaderStorage["loadSettings"]> | null>(null);
  if (settings0Ref.current === null) settings0Ref.current = storage.loadSettings() ?? {};
  const settings0 = settings0Ref.current;

  const [phase, setPhase] = useState<ReaderPhase>("opening");
  const [error, setError] = useState<Error | null>(null);
  const [opened, setOpened] = useState<OpenedReader | null>(null);
  const [runtime, setRuntime] = useState<RenderRuntime | null>(null);
  const [chrome, setChrome] = useState<ReaderChromeState>(() => ({
    tocOpen: false,
    preferencesOpen: false,
    focusMode: settings0.focusMode ?? false,
    sidebarWidth: settings0.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH,
    pageGap: settings0.pageGap ?? DEFAULT_PAGE_GAP,
    expandedToc: new Set<string>(),
  }));

  const session = opened?.session ?? null;
  const state = useReaderState(session);
  const frame = useRuntimeFrame(runtime);
  const measurements = useMeasurements(runtime);

  const pageCount = opened?.pageCount ?? doc.pageCount ?? 0;

  // ── Refs for imperative access from stable callbacks ───────────────
  const runtimeRef = useRef<RenderRuntime | null>(null);
  const sessionRef = useRef<ReaderSession | null>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const pageCountRef = useRef(pageCount);
  const openedAtRef = useRef(0);
  const accumulatedMsRef = useRef(0);
  const prevRecordRef = useRef<ReaderSessionRecord | null>(null);
  const restoreRef = useRef<{ page: number; done: boolean }>({ page: 1, done: true });
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chromeRef = useRef(chrome);
  const prefsRef = useRef<ReaderPreferences>(state.preferences);
  // Holds the latest "flush everything" closure so the bootstrap effect's
  // cleanup (which captures values from mount time) still persists the final
  // state on a plain route-unmount.
  const teardownRef = useRef<() => void>(() => {});

  runtimeRef.current = runtime;
  sessionRef.current = session;
  pageCountRef.current = pageCount;
  chromeRef.current = chrome;
  prefsRef.current = state.preferences;

  // ── Helpers ─────────────────────────────────────────────────────────
  const clampPage = useCallback(
    (p: number) => Math.min(Math.max(1, Math.round(p)), Math.max(1, pageCountRef.current)),
    [],
  );

  const centerPage = useCallback((): number => {
    const c = runtimeRef.current?.frame.value.visible.centerPage ?? 0;
    return c > 0 ? c : restoreRef.current.page;
  }, []);

  const scrollToPage = useCallback((page: number, anchor: "start" | "center" = "start"): void => {
    const rt = runtimeRef.current;
    const el = scrollerRef.current;
    if (!rt) return;
    rt.scrollTo({ page, anchor });
    if (el) el.scrollTop = rt.viewport.state.value.scrollY;
  }, []);

  /** Persist the per-document session record (page/zoom/timer). */
  const persistSession = useCallback(
    (closing: boolean): void => {
      if (phase !== "ready") return;
      const now = Date.now();
      const sessionMs = openedAtRef.current ? Math.max(0, now - openedAtRef.current) : 0;
      const record: ReaderSessionRecord = {
        page: centerPage(),
        zoom: runtimeRef.current?.zoom.factor.value ?? prefsRef.current.zoom,
        lastOpenedAt: openedAtRef.current || now,
        lastClosedAt: closing ? now : (prevRecordRef.current?.lastClosedAt ?? now),
        totalReadingMs: accumulatedMsRef.current + sessionMs,
        updatedAt: now,
      };
      prevRecordRef.current = record;
      storage.saveSession(doc.docId, record);
    },
    [phase, centerPage, storage, doc.docId],
  );

  /** Persist global reading + layout settings. */
  const persistSettings = useCallback((): void => {
    storage.saveSettings({
      preferences: prefsRef.current,
      pageGap: chromeRef.current.pageGap,
      sidebarWidth: chromeRef.current.sidebarWidth,
      focusMode: chromeRef.current.focusMode,
    });
  }, [storage]);

  const schedulePersist = useCallback((): void => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      persistSession(false);
      persistSettings();
    }, PERSIST_DEBOUNCE_MS);
  }, [persistSession, persistSettings]);

  // Keep the teardown closure current so any unmount path flushes the final
  // session record + settings.
  teardownRef.current = (): void => {
    persistSession(true);
    persistSettings();
  };

  // ── Bootstrap (open) ────────────────────────────────────────────────
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const result = await bootstrap.open(ac.signal);
        if (cancelled || ac.signal.aborted) {
          await Promise.resolve(result.session.close()).catch(() => {});
          return;
        }

        const record = storage.loadSession(doc.docId);
        prevRecordRef.current = record;
        accumulatedMsRef.current = record?.totalReadingMs ?? 0;
        openedAtRef.current = Date.now();

        const restoredZoom = clampZoom(record?.zoom ?? settings0.preferences?.zoom ?? 1);
        const restorePage = Math.min(
          Math.max(1, record?.page ?? 1),
          Math.max(1, result.pageCount || 1),
        );
        restoreRef.current = { page: restorePage, done: false };

        // Apply restored reading preferences before first reader paint.
        const restoredPrefs: Partial<ReaderPreferences> = {
          ...(settings0.preferences ?? {}),
          zoom: restoredZoom,
        };
        result.session.setPreferences(restoredPrefs);

        const rt = createRenderRuntime({
          env: createBrowserReaderEnvironment(),
          session: result.documentSession,
          pageGap: chromeRef.current.pageGap,
          overscanBefore: 2,
          overscanAfter: 3,
          initialZoom: restoredZoom,
        });
        runtimeRef.current = rt;
        sessionRef.current = result.session;

        setRuntime(rt);
        setOpened(result);
        setPhase("ready");
      } catch (err) {
        if (cancelled || ac.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      teardownRef.current();
      const rt = runtimeRef.current;
      const sess = sessionRef.current;
      runtimeRef.current = null;
      sessionRef.current = null;
      rt?.dispose();
      if (sess) void Promise.resolve(sess.close()).catch(() => {});
    };
    // Bootstrap is keyed to the document; it runs once per mounted reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrap, doc.docId]);

  // ── Mirror reader-core zoom → render runtime (keeps page anchored) ──
  useEffect(() => {
    if (!runtime || phase !== "ready") return;
    const target = clampZoom(state.preferences.zoom);
    if (Math.abs(runtime.zoom.factor.value - target) < 1e-4) return;
    const anchor = centerPage();
    runtime.applyZoom({ kind: "set", factor: target });
    runtime.scrollTo({ page: anchor, anchor: "center" });
    if (scrollerRef.current) scrollerRef.current.scrollTop = runtime.viewport.state.value.scrollY;
  }, [runtime, phase, state.preferences.zoom, centerPage]);

  // ── Mirror page-gap → render runtime ────────────────────────────────
  useEffect(() => {
    if (!runtime) return;
    runtime.measurements.setPageGap(chrome.pageGap);
  }, [runtime, chrome.pageGap]);

  // ── One-time restore: position + scroll, open TOC on desktop ────────
  useEffect(() => {
    if (phase !== "ready" || !runtime || !session) return;
    if (restoreRef.current.done) return;
    if (!scrollerRef.current) return; // wait until the viewport mounts
    const page = restoreRef.current.page;
    restoreRef.current.done = true;
    const locator = runtime.coordinates.pageLocator(page);
    void session.commands.dispatch("reader.goto", { locator });
    scrollToPage(page, "start");
    // Desktop default: reveal the TOC if the document has one.
    if (
      typeof window !== "undefined" &&
      window.innerWidth >= DESKTOP_TOC_BREAKPOINT &&
      (opened?.toc.length ?? 0) > 0
    ) {
      setChrome((c) => ({ ...c, tocOpen: true }));
    }
  }, [phase, runtime, session, opened, scrollToPage]);

  // ── Persist on scroll-settle + on tab hide ──────────────────────────
  useEffect(() => {
    if (phase !== "ready") return;
    schedulePersist();
  }, [phase, frame.visible.centerPage, state.preferences, chrome, schedulePersist]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onHide = (): void => {
      if (document.visibilityState === "hidden") persistSession(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [persistSession]);

  // ── Actions ─────────────────────────────────────────────────────────
  const goToPage = useCallback(
    (page: number, anchor: "start" | "center" = "start"): void => {
      const rt = runtimeRef.current;
      const sess = sessionRef.current;
      if (!rt || !sess) return;
      const target = clampPage(page);
      void sess.commands.dispatch("reader.goto", { locator: rt.coordinates.pageLocator(target) });
      scrollToPage(target, anchor);
    },
    [clampPage, scrollToPage],
  );

  const setZoom = useCallback((factor: number): void => {
    const sess = sessionRef.current;
    if (!sess) return;
    void sess.commands.dispatch("reader.set-zoom", { zoom: clampZoom(factor) });
  }, []);

  const setPreferences = useCallback((patch: Partial<ReaderPreferences>): void => {
    sessionRef.current?.setPreferences(patch);
  }, []);

  const actions = useMemo<ReaderActions>(() => {
    const fit = (mode: "width" | "page"): void => {
      const rt = runtimeRef.current;
      if (!rt) return;
      const vp = rt.viewport.state.value;
      const m = rt.measurements.state.value;
      const contentWidth = m.maxWidth > 0 ? m.maxWidth : vp.width;
      const center = m.metrics[centerPage()];
      const contentHeight = center?.size.height ?? vp.height;
      const factor =
        mode === "width"
          ? computeFitWidth(vp.width, contentWidth)
          : computeFitPage(vp.width, vp.height, contentWidth, contentHeight);
      setZoom(factor);
    };
    return {
      nextPage: () => goToPage(centerPage() + 1),
      previousPage: () => goToPage(centerPage() - 1),
      goToPage,
      firstPage: () => goToPage(1),
      lastPage: () => goToPage(pageCountRef.current),
      zoomIn: () => setZoom(nextZoomStep(prefsRef.current.zoom)),
      zoomOut: () => setZoom(previousZoomStep(prefsRef.current.zoom)),
      zoomReset: () => setZoom(1),
      fitWidth: () => fit("width"),
      fitPage: () => fit("page"),
      setZoom,
      setPreferences,
      setTheme: (theme) => setPreferences({ theme }),
      cycleTheme: () => {
        const cur = prefsRef.current.theme;
        const idx = THEME_CYCLE.indexOf(cur as ReadingTheme);
        const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length] ?? "light";
        setPreferences({ theme: next });
      },
      toggleToc: () => setChrome((c) => ({ ...c, tocOpen: !c.tocOpen })),
      togglePreferences: () => setChrome((c) => ({ ...c, preferencesOpen: !c.preferencesOpen })),
      toggleFocusMode: () => setChrome((c) => ({ ...c, focusMode: !c.focusMode })),
      setSidebarWidth: (px) =>
        setChrome((c) => ({
          ...c,
          sidebarWidth: Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, Math.round(px))),
        })),
      setPageGap: (px) =>
        setChrome((c) => ({ ...c, pageGap: Math.min(80, Math.max(0, Math.round(px))) })),
      toggleTocNode: (id) =>
        setChrome((c) => {
          const next = new Set(c.expandedToc);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { ...c, expandedToc: next };
        }),
      dismiss: () =>
        setChrome((c) => {
          if (c.preferencesOpen) return { ...c, preferencesOpen: false };
          if (c.focusMode) return { ...c, focusMode: false };
          if (c.tocOpen) return { ...c, tocOpen: false };
          return c;
        }),
      close: () => {
        persistSession(true);
        persistSettings();
        onExit();
      },
    };
  }, [goToPage, setZoom, setPreferences, centerPage, persistSession, persistSettings, onExit]);

  // ── Keyboard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (isEditableTarget(e.target)) return;
      const intent = resolveReaderIntent({
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });
      if (!intent) return;
      e.preventDefault();
      switch (intent) {
        case "next-page":
          actions.nextPage();
          break;
        case "previous-page":
          actions.previousPage();
          break;
        case "first-page":
          actions.firstPage();
          break;
        case "last-page":
          actions.lastPage();
          break;
        case "zoom-in":
          actions.zoomIn();
          break;
        case "zoom-out":
          actions.zoomOut();
          break;
        case "zoom-reset":
          actions.zoomReset();
          break;
        case "toggle-toc":
          actions.toggleToc();
          break;
        case "toggle-preferences":
          actions.togglePreferences();
          break;
        case "toggle-focus-mode":
          actions.toggleFocusMode();
          break;
        case "cycle-theme":
          actions.cycleTheme();
          break;
        case "dismiss":
          actions.dismiss();
          break;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [actions]);

  const registerScroller = useCallback((el: HTMLElement | null): void => {
    scrollerRef.current = el;
  }, []);

  // Memoized (LRU) content loader so re-mounting a page during scroll never
  // re-extracts its text.
  const content = useMemo(() => (opened ? memoizePageLoader(opened.content) : null), [opened]);

  const currentPage =
    phase === "ready" && frame.visible.centerPage > 0
      ? frame.visible.centerPage
      : restoreRef.current.page;
  const progress = pageCount > 0 ? Math.min(1, Math.max(0, currentPage / pageCount)) : 0;

  const value = useMemo<ReaderContextValue>(
    () => ({
      doc,
      phase,
      error,
      session,
      state,
      preferences: state.preferences,
      capabilities: state.capabilities,
      manifest: state.document,
      runtime,
      frame,
      measurements,
      pageCount,
      currentPage,
      progress,
      zoom: state.preferences.zoom,
      content,
      toc: opened?.toc ?? [],
      chrome,
      actions,
      openedAt: openedAtRef.current,
      registerScroller,
    }),
    [
      doc,
      phase,
      error,
      session,
      state,
      runtime,
      frame,
      measurements,
      pageCount,
      currentPage,
      progress,
      opened,
      content,
      chrome,
      actions,
      registerScroller,
    ],
  );

  return <ReaderContextProvider value={value}>{props.children}</ReaderContextProvider>;
}
