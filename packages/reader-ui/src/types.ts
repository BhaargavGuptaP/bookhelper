/**
 * Public contracts for the Reader shell UI.
 *
 * The reader-ui is **format-agnostic presentation**. It never imports a
 * document adapter or pdf.js. The host application (the composition root)
 * is responsible for constructing the format-specific pieces — a PDF
 * adapter, a reader-core session, the render runtime's document session,
 * and a page-content loader — and handing them back through a
 * {@link ReaderBootstrap}. Everything below is the shape of that seam.
 */

import type { DocumentSession, ReaderPreferences, ReaderSession } from "@bookhelper/reader-core";

/** Source format token. Mirrors the Library's `sourceType`. */
export type ReaderSourceType = "pdf" | "epub" | "text" | "markdown";

/**
 * The display metadata the shell needs before (and while) a document is
 * open. Sourced from the Library record — the shell does not re-derive it.
 */
export interface ReaderDocMeta {
  readonly docId: string;
  readonly title: string;
  readonly author?: string;
  readonly sourceType: ReaderSourceType;
  /** Total pages for fixed-layout formats; 0/undefined while unknown. */
  readonly pageCount?: number;
  readonly language?: string;
}

/**
 * The rendered content of one page, in document order. The reader-ui owns
 * presentation only: it lays this text out in a measure-constrained
 * reading column. The host produces it from whatever the adapter exposes
 * (for PDF: the extracted, normalized text layer) — the shell never parses
 * the format itself.
 */
export interface ReaderPageContent {
  readonly page: number;
  /** Normalized paragraphs in reading order. Empty array => blank page. */
  readonly paragraphs: readonly string[];
}

/** Lazily load one page's renderable content. Must honor the abort signal. */
export type PageContentLoader = (page: number, signal?: AbortSignal) => Promise<ReaderPageContent>;

/**
 * A table-of-contents node already resolved to a page number by the host
 * (which knows the format's locator encoding). The shell renders the tree
 * and navigates by page — it never parses a block id.
 */
export interface ReaderTocNode {
  readonly id: string;
  readonly label: string;
  /** 0-based nesting depth, for indentation + aria-level (depth + 1). */
  readonly depth: number;
  /** 1-based page this entry lands on. */
  readonly page: number;
  readonly children: readonly ReaderTocNode[];
}

/**
 * Everything the shell needs once a document is open. The host builds this
 * inside {@link ReaderBootstrap.open}, after wiring the adapter, the
 * reader-core session, and the render runtime's document session.
 */
export interface OpenedReader {
  /** The reader-core session. Source of truth for lifecycle + state. */
  readonly session: ReaderSession;
  /**
   * The adapter's document session — handed to the render engine to drive
   * virtualization. The shell treats it as an opaque metadata source.
   */
  readonly documentSession: DocumentSession;
  /** Page content loader (text layer). */
  readonly content: PageContentLoader;
  /** Table of contents resolved to page numbers (empty if none). */
  readonly toc: readonly ReaderTocNode[];
  /** Total page count for the open document. */
  readonly pageCount: number;
}

/**
 * The host-supplied factory the shell calls once on mount. It must honor
 * the abort signal (the reader unmounts mid-open on fast navigation) and
 * reject with a useful `Error` the shell can surface as an error state.
 */
export interface ReaderBootstrap {
  open(signal: AbortSignal): Promise<OpenedReader>;
}

/**
 * Per-document session record persisted between visits. Drives "reopen
 * where I left off". Times are epoch milliseconds.
 */
export interface ReaderSessionRecord {
  /** Last centered page. */
  readonly page: number;
  /** Last zoom factor. */
  readonly zoom: number;
  readonly lastOpenedAt: number;
  readonly lastClosedAt: number;
  /** Cumulative reading time across all sessions, milliseconds. */
  readonly totalReadingMs: number;
  readonly updatedAt: number;
}

/**
 * Global, cross-document reader settings. `preferences` are the reader-core
 * reading preferences (theme, zoom, measure, reduced-motion …) that flow
 * through reader-core; the rest are purely-presentational chrome settings
 * the platform doesn't model but the sprint requires us to persist (page
 * gap, sidebar width, focus mode).
 */
export interface ReaderSettings {
  readonly preferences: ReaderPreferences;
  /** Gap between pages, CSS px. */
  readonly pageGap: number;
  /** Side panel (TOC) width, CSS px. */
  readonly sidebarWidth: number;
  readonly focusMode: boolean;
}

/**
 * Storage seam for settings + per-document session records. The default
 * implementation is `localStorage`-backed; tests inject an in-memory one.
 * All methods are synchronous and must never throw (swallow quota / parse
 * errors and degrade to "nothing persisted").
 */
export interface ReaderStorage {
  loadSettings(): Partial<ReaderSettings> | null;
  saveSettings(settings: ReaderSettings): void;
  loadSession(docId: string): ReaderSessionRecord | null;
  saveSession(docId: string, record: ReaderSessionRecord): void;
}
