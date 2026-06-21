"use client";

/**
 * **ReaderPage** — one virtualized page surface.
 *
 * Renders the page's extracted text layer in a measure-constrained reading
 * column, measures its own intrinsic (zoom-independent) height, and reports
 * it to the render engine so scroll geometry converges. The component is
 * deliberately dumb about the format: it only ever sees `paragraphs` from
 * the host's content loader.
 *
 * Lifecycle states: loading (skeleton placeholder so layout doesn't jump),
 * ready (text), empty (blank page), error (retry).
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReaderContext } from "./context.js";
import { lineHeightForSpacing } from "./layout.js";

export interface ReaderPageProps {
  readonly page: number;
  /** Unscaled top offset within the content (CSS px). */
  readonly top: number;
  /** Unscaled page width (CSS px). */
  readonly width: number;
}

type PageStatus = "loading" | "ready" | "error";

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function ReaderPage({ page, top, width }: ReaderPageProps): React.JSX.Element {
  const { content, runtime, preferences, doc } = useReaderContext();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [paragraphs, setParagraphs] = useState<readonly string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const ref = useRef<HTMLElement | null>(null);

  // Load this page's content.
  useEffect(() => {
    if (!content) return;
    let active = true;
    setStatus("loading");
    content(page)
      .then((res) => {
        if (!active) return;
        setParagraphs(res.paragraphs);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active || isAbortError(err)) return;
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [content, page, attempt]);

  // Measure intrinsic height and report it to the render engine. Runs after
  // layout so we read the post-reflow height. ResizeObserver keeps it fresh
  // as fonts settle / preferences change.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !runtime) return;
    const report = (): void => {
      const height = el.offsetHeight;
      if (height > 0) runtime.measurements.setPageSize(page, { width, height });
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [runtime, page, width, status, paragraphs, preferences.fontScale, preferences.lineSpacing]);

  const style: React.CSSProperties = {
    position: "absolute",
    top,
    left: 0,
    width,
    fontSize: `${preferences.fontScale}rem`,
    lineHeight: lineHeightForSpacing(preferences.lineSpacing),
  };

  return (
    <article
      ref={ref}
      className="bh-reader-page"
      data-page={page}
      data-font={preferences.fontFamily}
      style={style}
      aria-label={`Page ${page}`}
      {...(doc.language ? { lang: doc.language } : {})}
    >
      {status === "loading" && (
        <div className="bh-reader-page__skeleton" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="bh-reader-page__skeleton-line" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="bh-reader-page__error" role="alert">
          <p>Couldn’t load this page.</p>
          <button
            type="button"
            className="bh-reader-link-button"
            onClick={() => setAttempt((a) => a + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {status === "ready" &&
        (paragraphs.length === 0 ? (
          <p className="bh-reader-page__blank" aria-label="Blank page">
            <span aria-hidden="true">·</span>
          </p>
        ) : (
          paragraphs.map((text, i) => (
            <p key={i} className="bh-reader-page__paragraph">
              {text}
            </p>
          ))
        ))}

      <span className="bh-reader-page__folio" aria-hidden="true">
        {page}
      </span>
    </article>
  );
}
