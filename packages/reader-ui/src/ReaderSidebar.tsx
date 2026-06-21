"use client";

/**
 * **ReaderSidebar** — the side panel that hosts the Table of Contents.
 *
 * Desktop: a fixed-position left panel, width persisted + resizable (drag
 * or keyboard on the separator). Tablet: collapsible. Mobile: a drawer
 * with a dismiss backdrop. Responsiveness is driven by CSS; this component
 * is the same in every form factor.
 */

import { useCallback, useRef } from "react";
import { IconButton } from "@bookhelper/ui";
import { useReaderContext } from "./context.js";
import { CloseIcon } from "./icons.js";
import { TableOfContents } from "./TableOfContents.js";
import { clamp } from "./layout.js";

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;
const KEYBOARD_STEP = 16;

export function ReaderSidebar(): React.JSX.Element | null {
  const { chrome, actions } = useReaderContext();
  const draggingRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      e.preventDefault();
      draggingRef.current = { startX: e.clientX, startWidth: chrome.sidebarWidth };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [chrome.sidebarWidth],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const drag = draggingRef.current;
      if (!drag) return;
      actions.setSidebarWidth(
        clamp(drag.startWidth + (e.clientX - drag.startX), MIN_WIDTH, MAX_WIDTH),
      );
    },
    [actions],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    draggingRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
  }, []);

  const onSeparatorKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        actions.setSidebarWidth(chrome.sidebarWidth - KEYBOARD_STEP);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        actions.setSidebarWidth(chrome.sidebarWidth + KEYBOARD_STEP);
      }
    },
    [actions, chrome.sidebarWidth],
  );

  if (!chrome.tocOpen) return null;

  return (
    <>
      <button
        type="button"
        className="bh-reader-sidebar__backdrop"
        aria-label="Close table of contents"
        tabIndex={-1}
        onClick={actions.toggleToc}
      />
      <aside
        className="bh-reader-sidebar"
        aria-label="Contents"
        style={{ width: chrome.sidebarWidth }}
      >
        <div className="bh-reader-sidebar__header">
          <h2 className="bh-reader-sidebar__title">Contents</h2>
          <IconButton label="Close contents" variant="ghost" onClick={actions.toggleToc}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="bh-reader-sidebar__body">
          <TableOfContents />
        </div>
        {/* A focusable, keyboard-operable window splitter (WAI-ARIA
            "separator" widget pattern). jsx-a11y doesn't model the
            interactive separator role, so the noninteractive rules are
            false positives here. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className="bh-reader-sidebar__resize"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize contents panel"
          aria-valuenow={chrome.sidebarWidth}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onSeparatorKey}
        />
      </aside>
    </>
  );
}
