"use client";

/**
 * **ReaderShell** — the responsive layout that arranges the toolbar, side
 * panel, viewport, preferences sheet, and status bar.
 *
 * It owns the reader root element and stamps the reader theme + effective
 * reduced-motion + focus/panel state as data attributes, which the
 * stylesheet keys off (themes, focus-mode chrome hiding, responsive
 * breakpoints). It reads everything from context — no state of its own.
 */

import { useReaderContext } from "./context.js";
import { ReaderToolbar } from "./ReaderToolbar.js";
import { ReaderSidebar } from "./ReaderSidebar.js";
import { ReaderViewport } from "./ReaderViewport.js";
import { ReaderStatusBar } from "./ReaderStatusBar.js";
import { ReaderPreferencesPanel } from "./ReaderPreferencesPanel.js";
import { useEffectiveReducedMotion, useResolvedReaderTheme } from "./use-theme.js";

export function ReaderShell(): React.JSX.Element {
  const { preferences, chrome, progress, phase } = useReaderContext();
  const theme = useResolvedReaderTheme(preferences.theme);
  const reducedMotion = useEffectiveReducedMotion(preferences.reducedMotion);

  return (
    <div
      className="bh-reader"
      data-reader-theme={theme}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-focus={chrome.focusMode ? "true" : "false"}
      data-toc-open={chrome.tocOpen ? "true" : "false"}
      data-prefs-open={chrome.preferencesOpen ? "true" : "false"}
    >
      <a className="bh-reader__skip" href="#bh-reader-main">
        Skip to reading area
      </a>

      <ReaderToolbar />

      <div
        className="bh-reader__progress"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span className="bh-reader__progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="bh-reader__body">
        <ReaderSidebar />
        <main id="bh-reader-main" className="bh-reader__main" data-phase={phase}>
          <ReaderViewport />
        </main>
        <ReaderPreferencesPanel />
      </div>

      <ReaderStatusBar />
    </div>
  );
}
