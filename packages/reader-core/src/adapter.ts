/**
 * **DocumentAdapter** — the *only* seam between the reader core and a
 * concrete document format.
 *
 * The reader core never imports PDF.js, an EPUB parser, a Markdown
 * renderer, a YouTube transcript fetcher, or anything else format-
 * specific. It speaks to one `DocumentAdapter` per session, which
 * promises to:
 *
 *   1. Load the document (whatever that means for its format).
 *   2. Report its capabilities ({@link ./capabilities.ReaderCapabilities}).
 *   3. Provide a {@link ./layout.LayoutEngine} for windowing.
 *   4. Provide a {@link ./navigation.NavigationEngine} for steps/jumps.
 *   5. Resolve locators (the three-strategy cascade — READER-SPEC §4.3
 *      lives inside the adapter, not the core).
 *   6. Clean up after itself.
 *
 * Every future format — PDF, EPUB, Markdown, TXT, DOCX, research papers,
 * articles, web pages, podcast transcripts, YouTube transcripts —
 * implements exactly this interface. The reader UI, the highlight
 * plugin, the AI overlay, the knowledge graph collector all consume the
 * adapter through the same shape.
 *
 * **Determinism is part of the contract**: given the same document
 * version and inputs, an adapter must return equivalent manifests,
 * capabilities, and locator resolutions. Otherwise highlights drift
 * silently and no test can pin behavior.
 */

import type { ReaderCapabilities } from "./capabilities.js";
import type { BlockSummary, DocumentManifest, Toc } from "./document-model.js";
import type { LayoutEngine } from "./layout.js";
import type { Locator, PointLocator } from "./locator.js";
import type { NavigationEngine } from "./navigation.js";

/** Inputs handed to an adapter when the reader opens a document. */
export interface AdapterOpenInput {
  /** The document the reader is asking the adapter to bind to. */
  readonly docId: string;
  /**
   * Optional last-known position to restore. Adapters should use this
   * as the layout anchor for their first measurement.
   */
  readonly initialLocator?: PointLocator;
  /**
   * Caller-supplied abort signal. Adapters must respect it — long-running
   * fetches/parses are cancelable.
   */
  readonly signal?: AbortSignal;
}

/**
 * Result of resolving a locator (READER-SPEC §4.3). The shape allows
 * the adapter to tell the core "I had to re-anchor — here's the
 * canonical locator now" so the core can persist the healed locator
 * back to its origin (annotation store, bookmark list, etc.).
 */
export interface LocatorResolution {
  /** The canonical (possibly re-anchored) locator. */
  readonly locator: Locator;
  /** Which strategy resolved the locator — used for telemetry. */
  readonly strategy: "native" | "structural" | "quote";
  /** True if the locator was healed and should be persisted. */
  readonly healed: boolean;
}

/**
 * The complete adapter contract. The reader core depends only on this
 * interface; it never imports any adapter package.
 */
export interface DocumentAdapter {
  /** Stable identifier for telemetry & error messages ("pdf", "epub", …). */
  readonly name: string;

  /**
   * Bind the adapter to a document. Returns a handle the core stores
   * for the lifetime of the session. The handle bundles everything the
   * core needs — manifest, capabilities, layout, navigation, TOC.
   */
  open(input: AdapterOpenInput): Promise<DocumentSession>;
}

/**
 * The handle returned by `DocumentAdapter.open`. Owned by the reader
 * session; the core calls `close()` when the user leaves the document.
 */
export interface DocumentSession {
  readonly manifest: DocumentManifest;
  readonly capabilities: ReaderCapabilities;
  readonly layout: LayoutEngine;
  readonly navigation: NavigationEngine;

  /**
   * Optional table of contents. Adapters that don't support TOC return
   * `undefined`; the UI hides the affordance.
   */
  getToc?(): Promise<Toc | undefined> | Toc | undefined;

  /**
   * Iterate block summaries in document order. The core uses this for
   * progress math and scroll virtualization. Adapters stream blocks
   * lazily — emitting everything up-front is acceptable but not required.
   */
  blocks(): AsyncIterable<BlockSummary> | Iterable<BlockSummary>;

  /**
   * Resolve a locator against the current document version, healing
   * across re-ingestions where possible (the three-strategy cascade).
   * Throws `LocatorResolutionError` when the locator is truly orphaned.
   */
  resolveLocator(locator: Locator): Promise<LocatorResolution> | LocatorResolution;

  /**
   * Release any resources held by the adapter (web workers, page
   * canvases, fetched bytes). The core calls this on close; calling it
   * twice must be safe.
   */
  close(): Promise<void> | void;
}
