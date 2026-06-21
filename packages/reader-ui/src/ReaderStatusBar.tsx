"use client";

/**
 * **ReaderStatusBar** — the bottom chrome.
 *
 * Page number + count, reading progress, zoom level, document type, a
 * capabilities summary (what the adapter reports it can do), and a live
 * session timer. The page read-out is a polite live region so screen
 * readers announce navigation without stealing focus.
 */

import { useEffect, useMemo, useState } from "react";
import { hasCapability, type CapabilityFlag } from "@bookhelper/reader-core";
import { useReaderContext } from "./context.js";

/** Human capability labels in display order. */
const CAPABILITY_LABELS: ReadonlyArray<{ flag: CapabilityFlag; label: string }> = [
  { flag: "toc", label: "Contents" },
  { flag: "links", label: "Links" },
  { flag: "selection", label: "Selectable" },
  { flag: "search", label: "Searchable" },
  { flag: "copy", label: "Copyable" },
  { flag: "images", label: "Images" },
];

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Tick once per second while the reader is open. */
function useSessionElapsed(openedAt: number, active: boolean): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!active || openedAt === 0) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, openedAt]);
  return openedAt === 0 ? 0 : Math.max(0, now - openedAt);
}

export function ReaderStatusBar(): React.JSX.Element {
  const { doc, phase, currentPage, pageCount, progress, zoom, capabilities, manifest, openedAt } =
    useReaderContext();
  const ready = phase === "ready";
  const elapsed = useSessionElapsed(openedAt, ready);

  const capabilitySummary = useMemo(
    () => CAPABILITY_LABELS.filter((c) => hasCapability(capabilities, c.flag)).map((c) => c.label),
    [capabilities],
  );

  const docType = (manifest?.format ?? doc.sourceType).toUpperCase();
  const renderMode = manifest?.renderMode === "fixed" ? "Fixed layout" : "Reflowable";

  return (
    <footer className="bh-reader-statusbar" aria-label="Reader status">
      <div className="bh-reader-statusbar__cluster">
        <span className="bh-reader-statusbar__page" role="status" aria-live="polite">
          {ready ? `Page ${currentPage} of ${pageCount}` : "—"}
        </span>
        <span className="bh-reader-statusbar__progress" aria-hidden="true">
          {Math.round(progress * 100)}% read
        </span>
      </div>

      <div className="bh-reader-statusbar__cluster bh-reader-statusbar__cluster--meta">
        <span className="bh-reader-statusbar__chip" title="Document type">
          {docType}
        </span>
        <span className="bh-reader-statusbar__chip" title="Layout mode">
          {renderMode}
        </span>
        {capabilitySummary.length > 0 ? (
          <span
            className="bh-reader-statusbar__caps"
            title={`Capabilities: ${capabilitySummary.join(", ")}`}
          >
            {capabilitySummary.join(" · ")}
          </span>
        ) : null}
      </div>

      <div className="bh-reader-statusbar__cluster bh-reader-statusbar__cluster--end">
        <span className="bh-reader-statusbar__zoom" title="Zoom level">
          {Math.round(zoom * 100)}%
        </span>
        <span
          className="bh-reader-statusbar__timer"
          title="Time in this session"
          aria-label={`Reading for ${formatDuration(elapsed)}`}
        >
          {formatDuration(elapsed)}
        </span>
      </div>
    </footer>
  );
}
