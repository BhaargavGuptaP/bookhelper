"use client";

/**
 * **ReaderToolbar** — the top chrome.
 *
 * Back-to-library, document title, page indicator + jump, zoom controls,
 * fit-width / fit-page, theme cycle, preferences, and the TOC toggle. The
 * yet-to-ship features (Search, Bookmark, Highlight, AI) appear as visibly
 * disabled "Coming soon" affordances so the information architecture is
 * complete and discoverable, per scope.
 */

import { useEffect, useState, type FormEvent } from "react";
import { IconButton } from "@bookhelper/ui";
import { useReaderContext } from "./context.js";
import {
  AiIcon,
  BackIcon,
  BookmarkIcon,
  CloseIcon,
  FitPageIcon,
  FitWidthIcon,
  FocusIcon,
  HighlightIcon,
  PreferencesIcon,
  SearchIcon,
  ThemeIcon,
  TocIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons.js";

const SOON = "Coming soon";

export function ReaderToolbar(): React.JSX.Element {
  const { doc, phase, chrome, actions, currentPage, pageCount, zoom, capabilities } =
    useReaderContext();
  const ready = phase === "ready";
  const zoomPct = Math.round(zoom * 100);

  return (
    <header className="bh-reader-toolbar" role="toolbar" aria-label="Reader toolbar">
      <div className="bh-reader-toolbar__group bh-reader-toolbar__group--start">
        <IconButton label="Back to library" onClick={actions.close}>
          <BackIcon />
        </IconButton>
        <IconButton
          label={chrome.tocOpen ? "Hide table of contents" : "Show table of contents"}
          aria-pressed={chrome.tocOpen}
          aria-keyshortcuts="o"
          onClick={actions.toggleToc}
          disabled={!ready}
        >
          <TocIcon />
        </IconButton>
      </div>

      <div className="bh-reader-toolbar__title" title={doc.title}>
        <span className="bh-reader-toolbar__title-text">{doc.title}</span>
        {doc.author ? <span className="bh-reader-toolbar__author">{doc.author}</span> : null}
      </div>

      <div className="bh-reader-toolbar__group bh-reader-toolbar__group--center">
        <PageJump
          page={currentPage}
          pageCount={pageCount}
          disabled={!ready}
          onJump={(p) => actions.goToPage(p)}
        />
      </div>

      <div className="bh-reader-toolbar__group bh-reader-toolbar__group--end">
        <div className="bh-reader-toolbar__zoom" role="group" aria-label="Zoom">
          <IconButton
            label="Zoom out"
            aria-keyshortcuts="Control+-"
            onClick={actions.zoomOut}
            disabled={!ready}
          >
            <ZoomOutIcon />
          </IconButton>
          <button
            type="button"
            className="bh-reader-toolbar__zoom-value"
            onClick={actions.zoomReset}
            disabled={!ready}
            aria-label={`Zoom ${zoomPct} percent. Reset to 100%`}
            title="Reset zoom"
          >
            {zoomPct}%
          </button>
          <IconButton
            label="Zoom in"
            aria-keyshortcuts="Control++"
            onClick={actions.zoomIn}
            disabled={!ready}
          >
            <ZoomInIcon />
          </IconButton>
        </div>

        <IconButton
          label="Fit width"
          onClick={actions.fitWidth}
          disabled={!ready || !capabilities.zoom}
        >
          <FitWidthIcon />
        </IconButton>
        <IconButton
          label="Fit page"
          onClick={actions.fitPage}
          disabled={!ready || !capabilities.zoom}
        >
          <FitPageIcon />
        </IconButton>

        <span className="bh-reader-toolbar__divider" aria-hidden="true" />

        <IconButton
          label="Cycle reading theme"
          aria-keyshortcuts="t"
          onClick={actions.cycleTheme}
          disabled={!ready}
        >
          <ThemeIcon />
        </IconButton>
        <IconButton
          label="Reading preferences"
          aria-pressed={chrome.preferencesOpen}
          onClick={actions.togglePreferences}
          disabled={!ready}
        >
          <PreferencesIcon />
        </IconButton>
        <IconButton
          label={chrome.focusMode ? "Exit focus mode" : "Focus mode"}
          aria-pressed={chrome.focusMode}
          aria-keyshortcuts="f"
          onClick={actions.toggleFocusMode}
          disabled={!ready}
        >
          {chrome.focusMode ? <CloseIcon /> : <FocusIcon />}
        </IconButton>

        <span className="bh-reader-toolbar__divider" aria-hidden="true" />

        {/* Not-yet-shipped features — present but disabled. */}
        <div className="bh-reader-toolbar__group bh-reader-toolbar__soon" aria-label="Coming soon">
          <ComingSoon label="Search">
            <SearchIcon />
          </ComingSoon>
          <ComingSoon label="Bookmark">
            <BookmarkIcon />
          </ComingSoon>
          <ComingSoon label="Highlight">
            <HighlightIcon />
          </ComingSoon>
          <ComingSoon label="Ask AI">
            <AiIcon />
          </ComingSoon>
        </div>
      </div>
    </header>
  );
}

function ComingSoon({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <IconButton
      label={`${label} — ${SOON}`}
      title={`${label} — ${SOON}`}
      disabled
      aria-disabled="true"
      className="bh-icon-button--soon"
      data-coming-soon="true"
    >
      {children}
    </IconButton>
  );
}

function PageJump({
  page,
  pageCount,
  disabled,
  onJump,
}: {
  readonly page: number;
  readonly pageCount: number;
  readonly disabled: boolean;
  readonly onJump: (page: number) => void;
}): React.JSX.Element {
  const [draft, setDraft] = useState(String(page));

  // Reflect external page changes (scroll, nav) when not editing.
  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const n = Number.parseInt(draft, 10);
    if (Number.isFinite(n)) onJump(n);
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  return (
    <form className="bh-reader-pagejump" onSubmit={submit}>
      <label className="bh-reader-pagejump__label" htmlFor="bh-reader-page-input">
        Page
      </label>
      <input
        id="bh-reader-page-input"
        className="bh-reader-pagejump__input"
        type="number"
        inputMode="numeric"
        min={1}
        max={Math.max(1, pageCount)}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={() => setDraft(String(page))}
        aria-label={`Current page ${page} of ${pageCount}. Type a page number to jump.`}
      />
      <span className="bh-reader-pagejump__total">/ {pageCount || "—"}</span>
    </form>
  );
}
