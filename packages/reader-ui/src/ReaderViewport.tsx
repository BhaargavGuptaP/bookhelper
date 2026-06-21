"use client";

/**
 * **ReaderViewport** — the scrolling reading surface.
 *
 * Owns the scroll container and reports its size + scroll position to the
 * render engine; renders only the pages in the current virtualization
 * window (`frame.window.pages`) absolutely positioned over a full-height
 * sizer, so a 1000-page document keeps a constant DOM footprint. Zoom is a
 * CSS transform on the pages layer — the engine's measurements stay
 * zoom-independent.
 */

import { useCallback, useEffect, useRef } from "react";
import { Spinner } from "@bookhelper/ui";
import { useReaderContext } from "./context.js";
import { ReaderPage } from "./ReaderPage.js";
import { pageWidthForMeasure } from "./layout.js";

export function ReaderViewport(): React.JSX.Element {
  const {
    runtime,
    frame,
    measurements,
    registerScroller,
    phase,
    error,
    pageCount,
    preferences,
    doc,
  } = useReaderContext();

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Register the scroller + keep the engine's viewport size in sync.
  useEffect(() => {
    const el = scrollerRef.current;
    registerScroller(el);
    if (!el || !runtime) return;
    const applySize = (): void => {
      const rect = el.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      runtime.resize(rect.width, rect.height, dpr);
    };
    applySize();
    const ro = new ResizeObserver(applySize);
    ro.observe(el);
    return () => {
      ro.disconnect();
      registerScroller(null);
    };
  }, [runtime, registerScroller, phase]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>): void => {
      const el = e.currentTarget;
      runtime?.reportScroll(el.scrollLeft, el.scrollTop);
    },
    [runtime],
  );

  if (phase === "opening") {
    return (
      <div className="bh-reader-viewport bh-reader-viewport--state" data-state="loading">
        <div className="bh-reader-state">
          <Spinner size={28} label={`Opening ${doc.title}`} />
          <p className="bh-reader-state__title">Opening document…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="bh-reader-viewport bh-reader-viewport--state" data-state="error">
        <div className="bh-reader-state" role="alert">
          <p className="bh-reader-state__title">This document couldn’t be opened</p>
          <p className="bh-reader-state__detail">{error?.message ?? "Unknown error."}</p>
        </div>
      </div>
    );
  }

  if (pageCount === 0) {
    return (
      <div className="bh-reader-viewport bh-reader-viewport--state" data-state="empty">
        <div className="bh-reader-state">
          <p className="bh-reader-state__title">This document is empty</p>
          <p className="bh-reader-state__detail">There are no pages to display.</p>
        </div>
      </div>
    );
  }

  const zoom = frame.zoom > 0 ? frame.zoom : 1;
  const width = pageWidthForMeasure(preferences.measure);
  const sizerHeight = Math.max(1, measurements.totalHeight * zoom);
  const viewportWidth = frame.viewport.width;
  const sizerWidth = Math.max(viewportWidth, width * zoom);
  const pages = frame.window.pages;

  return (
    <div
      className="bh-reader-viewport"
      ref={scrollerRef}
      onScroll={onScroll}
      role="document"
      aria-label={`${doc.title}, reading area`}
      // A scrollable reading region must be focusable so keyboard users can
      // scroll it; jsx-a11y can't tell a scroll container from static content.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      <div className="bh-reader-viewport__sizer" style={{ height: sizerHeight, width: sizerWidth }}>
        <div
          className="bh-reader-viewport__pages"
          style={{
            width,
            transform: `translateX(-50%) scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          {pages.map((p) => (
            <ReaderPage key={p} page={p} top={measurements.metrics[p]?.top ?? 0} width={width} />
          ))}
        </div>
      </div>
    </div>
  );
}
