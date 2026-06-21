/**
 * **PDF Document Adapter** — the public factory.
 *
 * `createPdfAdapter` returns a `DocumentAdapter` from `@bookhelper/reader-core`.
 * The reader core does not import this file or know it exists; the
 * `ReaderEngine` registry picks it up via the registration in the host.
 *
 * Open flow
 * ---------
 *
 *   1. Caller invokes `adapter.open({ docId, initialLocator?, signal? })`
 *      with the bytes (handed to the adapter at *construction* time via
 *      `dataSource`, see below — `AdapterOpenInput` doesn't carry bytes).
 *   2. We load the PDF via `pdfjs`, then in parallel: outline,
 *      permissions, metadata.
 *   3. We compute the **per-page character table** (lightweight —
 *      one `getTextContent` per page; necessary so the locator codec
 *      has stable `globalOffset` values). For very large PDFs the
 *      caller can pass `lazyOffsetTable: true` to defer this; the
 *      table will be filled in on demand.
 *   4. Build the manifest, capabilities, TOC, layout, navigation.
 *   5. Return a `PdfDocumentSession` that satisfies `DocumentSession`
 *      plus exposes PDF-specific helpers (`extractPageText`, `streamText`,
 *      `listImages`, `listLinks`).
 *
 * The bytes-vs-locator separation
 * -------------------------------
 *
 * Reader-core's `DocumentAdapter.open` takes a `docId`, not bytes. The
 * shell is responsible for fetching the bytes (it already does — Sprint
 * 2 storage) and constructing the adapter with them. This keeps the
 * adapter pure — it doesn't know about S3, Tauri filesystems, or the
 * web BFF.
 */

import {
  AdapterError,
  type AdapterOpenInput,
  type DocumentAdapter,
  type DocumentSession,
  type Locator,
  type LocatorResolution,
  type BlockSummary,
} from "@bookhelper/reader-core";
import { buildCapabilities, probeCapabilities } from "./capabilities.js";
import { mapPdfError } from "./errors.js";
import { loadPdf, type PdfjsDocumentProxy } from "./internal/pdfjs.js";
import { createPdfLayoutEngine } from "./layout-engine.js";
import {
  buildOffsetTable,
  pageBlockId,
  pageOffsetFromPosition,
  type CodecContext,
} from "./locator-codec.js";
import { buildManifest } from "./manifest-builder.js";
import type { PdfDocumentManifest, PdfPermissions } from "./manifest.js";
import { createPdfNavigationEngine } from "./navigation-engine.js";
import { PageCache } from "./page-cache.js";
import {
  buildPageText,
  extractPageText as extractPageTextRaw,
  streamText,
  type PageText,
} from "./text.js";
import { listImagesOnPage, type PdfImageDescriptor } from "./images.js";
import { listLinksOnPage, type PdfLink } from "./links.js";
import { buildToc } from "./toc.js";

/**
 * Data source for the adapter. We accept anything that resolves to
 * bytes — async so the shell can stream from S3, filesystem, or fetch
 * lazily. Constructed once per `createPdfAdapter` call.
 */
export type PdfDataSource = (input: { docId: string; signal?: AbortSignal }) => Promise<Uint8Array>;

export interface CreatePdfAdapterOptions {
  /** Where to get the PDF bytes from. Required. */
  readonly dataSource: PdfDataSource;
  /** Password for encrypted PDFs (caller decides whether to prompt). */
  readonly password?: string;
  /** Soft page cache size. Defaults to 32. */
  readonly maxResidentPages?: number;
  /**
   * Document version stamped on every emitted position. Defaults to 1.
   * The shell bumps this when the document is re-ingested so the
   * locator three-strategy cascade can detect stale anchors.
   */
  readonly docVersion?: number;
  /**
   * If `true`, skip the per-page char-count pass at open time. The
   * codec uses a placeholder table (each page == 0 chars). Per-page
   * text extraction still works; selection-based locators will
   * "lazy-fill" the table on first access. Use this for very large
   * PDFs (≥500 pages) where opening must be instant.
   */
  readonly lazyOffsetTable?: boolean;
  /**
   * How many pages to probe for the capability matrix. Defaults to 4.
   * Lower for instant-open of large docs; higher for richer capability
   * detection on small ones.
   */
  readonly capabilityProbePages?: number;
}

/**
 * The PDF-specific shape of `DocumentSession`. Adds PDF-only methods
 * (text extraction, image enumeration, link enumeration) that the
 * generic `DocumentSession` interface does not surface.
 */
export interface PdfDocumentSession extends DocumentSession {
  readonly manifest: PdfDocumentManifest;
  /** Extract the normalized text for one page (cached via the page cache). */
  extractPageText(page: number, signal?: AbortSignal): Promise<PageText>;
  /** Stream pages in order. */
  streamText(options?: {
    from?: number;
    to?: number;
    signal?: AbortSignal;
  }): AsyncIterable<PageText>;
  /** Enumerate image descriptors on a page. */
  listImages(page: number, signal?: AbortSignal): Promise<readonly PdfImageDescriptor[]>;
  /** Enumerate link annotations on a page. */
  listLinks(page: number, signal?: AbortSignal): Promise<readonly PdfLink[]>;
}

/** Construct a PDF adapter bound to a data source. */
export function createPdfAdapter(options: CreatePdfAdapterOptions): DocumentAdapter {
  const {
    dataSource,
    password,
    maxResidentPages,
    docVersion = 1,
    lazyOffsetTable = false,
    capabilityProbePages,
  } = options;

  const name = "pdf";

  return {
    name,
    async open(input: AdapterOpenInput): Promise<PdfDocumentSession> {
      const signal = input.signal;
      let doc: PdfjsDocumentProxy | null = null;
      try {
        const bytes = await dataSource({ docId: input.docId, ...(signal ? { signal } : {}) });
        doc = await loadPdf({
          data: bytes,
          ...(password ? { password } : {}),
          ...(signal ? { signal } : {}),
        });
      } catch (err) {
        throw mapPdfError(err, { adapter: name, operation: "open" });
      }
      if (!doc) {
        throw new AdapterError(name, "open", "PDF document failed to load (no document).");
      }

      // Cache lives for the session.
      const cache = new PageCache(
        doc,
        ...(maxResidentPages !== undefined ? [{ maxResidentPages }] : []),
      );

      // Outline + per-page char counts in parallel.
      let outline: Awaited<ReturnType<PdfjsDocumentProxy["getOutline"]>>;
      try {
        outline = await doc.getOutline();
      } catch {
        outline = null;
      }

      let charsByPage: number[];
      if (lazyOffsetTable) {
        charsByPage = new Array(doc.numPages).fill(0);
      } else {
        charsByPage = await countCharsPerPage(doc, cache, signal);
      }
      const table = buildOffsetTable(charsByPage);
      const codec: CodecContext = { table, docVersion };

      // Capabilities probe.
      const permissions = await safe(() => doc!.getPermissions());
      const probe = await probeCapabilities({
        doc,
        permissions: decodePermissionsLocal(permissions ?? null),
        hasOutline: Boolean(outline && outline.length > 0),
        ...(capabilityProbePages !== undefined ? { probePages: capabilityProbePages } : {}),
        ...(signal ? { signal } : {}),
      });
      const decodedPerms = decodePermissionsLocal(permissions ?? null);
      const capabilities = buildCapabilities(
        probe,
        decodedPerms,
        Boolean(outline && outline.length > 0),
      );

      // TOC.
      const toc = await buildToc({ doc, outline, codec });

      // Manifest.
      const manifest = await buildManifest({
        docId: input.docId,
        doc,
        outline,
        pageCount: doc.numPages,
        totalChars: table.totalChars,
        blockCount: doc.numPages, // one block per page
        docVersion,
      });

      const layout = createPdfLayoutEngine({ doc, codec });
      const navigation = createPdfNavigationEngine({ codec, toc });

      let closed = false;

      const session: PdfDocumentSession = {
        manifest,
        capabilities: capabilities,
        layout,
        navigation,
        getToc() {
          return toc;
        },
        blocks(): Iterable<BlockSummary> {
          // One block per page; cheap to enumerate eagerly.
          const out: BlockSummary[] = [];
          for (let p = 1; p <= table.numPages; p += 1) {
            const start = table.pageStarts[p] ?? 0;
            const next = table.pageStarts[p + 1] ?? start;
            out.push({
              blockId: pageBlockId(p),
              ord: p - 1,
              type: "page",
              charCount: Math.max(0, next - start),
              page: p,
            });
          }
          return out;
        },
        async resolveLocator(locator: Locator): Promise<LocatorResolution> {
          // Sprint 3B: structural anchor resolution only. The quote
          // cascade lives with the future selection plugin.
          const start = locator.kind === "point" ? locator.position : locator.start;
          try {
            // Validate the blockId is one of ours.
            const { page, offset } = pageOffsetFromPosition(start);
            const clampedPage = Math.min(Math.max(1, page), table.numPages);
            const pageStart = table.pageStarts[clampedPage] ?? 0;
            const pageChars = (table.pageStarts[clampedPage + 1] ?? pageStart) - pageStart;
            const clampedOffset = Math.min(Math.max(0, offset), pageChars);
            if (locator.kind === "point") {
              return {
                locator: {
                  kind: "point",
                  position: {
                    ...start,
                    blockId: pageBlockId(clampedPage),
                    offset: clampedOffset,
                    globalOffset: pageStart + clampedOffset,
                  },
                },
                strategy: "structural",
                healed: clampedPage !== page || clampedOffset !== offset,
              };
            }
            // For ranges: pass-through with both endpoints re-anchored.
            const endPage = pageOffsetFromPosition(locator.end);
            const endClampedPage = Math.min(Math.max(1, endPage.page), table.numPages);
            const endPageStart = table.pageStarts[endClampedPage] ?? 0;
            const endPageChars =
              (table.pageStarts[endClampedPage + 1] ?? endPageStart) - endPageStart;
            const endClampedOffset = Math.min(Math.max(0, endPage.offset), endPageChars);
            return {
              locator: {
                kind: "range",
                start: {
                  ...locator.start,
                  blockId: pageBlockId(clampedPage),
                  offset: clampedOffset,
                  globalOffset: pageStart + clampedOffset,
                },
                end: {
                  ...locator.end,
                  blockId: pageBlockId(endClampedPage),
                  offset: endClampedOffset,
                  globalOffset: endPageStart + endClampedOffset,
                },
              },
              strategy: "structural",
              healed:
                clampedPage !== page ||
                clampedOffset !== offset ||
                endClampedPage !== endPage.page ||
                endClampedOffset !== endPage.offset,
            };
          } catch (err) {
            throw mapPdfError(err, { adapter: name, operation: "resolveLocator" });
          }
        },
        async extractPageText(page: number, sig?: AbortSignal): Promise<PageText> {
          assertOpen();
          assertPageInRange(page, table.numPages);
          try {
            const handle = await cache.acquire(page);
            void sig; // single-page extraction is cheap; abort applies at the outer layer
            const text = await extractPageTextRaw(handle);
            return text;
          } catch (err) {
            throw mapPdfError(err, { adapter: name, operation: "extractPageText" });
          }
        },
        streamText(streamOpts): AsyncIterable<PageText> {
          assertOpen();
          // Delegate to the standalone streamer; we don't reuse the
          // page cache here because streaming intentionally walks pages
          // we'd otherwise evict.
          return streamText(doc!, streamOpts ?? {});
        },
        async listImages(page: number): Promise<readonly PdfImageDescriptor[]> {
          assertOpen();
          assertPageInRange(page, table.numPages);
          try {
            const handle = await cache.acquire(page);
            return await listImagesOnPage(handle);
          } catch (err) {
            throw mapPdfError(err, { adapter: name, operation: "listImages" });
          }
        },
        async listLinks(page: number): Promise<readonly PdfLink[]> {
          assertOpen();
          assertPageInRange(page, table.numPages);
          try {
            const handle = await cache.acquire(page);
            return await listLinksOnPage(doc!, handle);
          } catch (err) {
            throw mapPdfError(err, { adapter: name, operation: "listLinks" });
          }
        },
        async close(): Promise<void> {
          if (closed) return;
          closed = true;
          cache.dispose();
          try {
            await doc?.destroy();
          } catch {
            /* swallow — close must be idempotent */
          }
          doc = null;
        },
      };

      // Reference `buildPageText` so it can't be tree-shaken before
      // any tests have a chance to import it via this barrel.
      void buildPageText;

      return session;

      function assertOpen(): void {
        if (closed) {
          throw new AdapterError(name, "operation", "PDF session has been closed.");
        }
      }
    },
  };
}

/** Count chars per page. Uses the cache so a re-acquire is cheap. */
async function countCharsPerPage(
  doc: PdfjsDocumentProxy,
  cache: PageCache,
  signal: AbortSignal | undefined,
): Promise<number[]> {
  const out: number[] = new Array(doc.numPages).fill(0);
  for (let p = 1; p <= doc.numPages; p += 1) {
    if (signal?.aborted) {
      throw new DOMException("Open aborted while counting characters", "AbortError");
    }
    const page = await cache.acquire(p);
    const content = await page.getTextContent({ disableNormalization: false });
    let chars = 0;
    for (const item of content.items) {
      if (typeof item.str === "string") chars += item.str.length;
    }
    out[p - 1] = chars;
  }
  return out;
}

function assertPageInRange(page: number, numPages: number): void {
  if (!Number.isInteger(page) || page < 1 || page > numPages) {
    throw new AdapterError("pdf", "page", `Page ${page} out of range (1..${numPages}).`);
  }
}

/**
 * Local copy of `decodePermissions` so the open() function doesn't
 * import from `manifest-builder` for what is otherwise a two-line
 * decode — kept here so the manifest builder remains a pure builder.
 */
function decodePermissionsLocal(perms: readonly number[] | null): PdfPermissions {
  // Defer to the canonical decoder via dynamic import would be heavy;
  // we duplicate the small flag table here using the same constants.
  // Keeping a single source of truth: this function and
  // `manifest-builder.decodePermissions` must agree. The capability
  // test asserts that.
  if (perms === null) {
    return {
      print: null,
      modify: null,
      copy: null,
      annotate: null,
      fillForms: null,
      accessibilityCopy: null,
      assemble: null,
      printHighQuality: null,
    };
  }
  const has = (flag: number): boolean => perms.includes(flag);
  return {
    print: has(4),
    modify: has(8),
    copy: has(16),
    annotate: has(32),
    fillForms: has(256),
    accessibilityCopy: has(512),
    assemble: has(1024),
    printHighQuality: has(2048),
  };
}

async function safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    return undefined;
  }
}
