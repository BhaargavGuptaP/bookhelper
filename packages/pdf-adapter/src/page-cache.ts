/**
 * **LRU page cache** — bounded memory for parsed `PdfjsPageProxy`
 * handles.
 *
 * Each `getPage(n)` call in pdfjs decodes the page's content stream and
 * its associated XObjects. That's expensive to redo on every navigation
 * step, but holding every page in memory destroys a 1000-page PDF on a
 * mobile device. A small LRU is the standard compromise (READER-SPEC
 * §16: "hard caps on resident pages/blocks; explicit teardown on close").
 *
 * Behavior:
 *   • `acquire(n)` returns the cached page or fetches it, marking it MRU.
 *   • `release(n)` is a no-op outside the cache; eviction happens on
 *     acquire when the cap is exceeded and pages outside the working
 *     set are dropped via pdfjs' `cleanup()`.
 *   • `dispose()` cleans up every resident page; called on `close()`.
 *
 * The cache is intentionally *single-threaded* and *fire-and-forget* in
 * its concurrency model: a second `acquire(n)` while the first is
 * pending will hit the in-flight promise (memoized) rather than start
 * a duplicate parse.
 */

import type { PdfjsDocumentProxy, PdfjsPageProxy } from "./internal/pdfjs.js";

export interface PageCacheOptions {
  /** Max number of resident pages. Defaults to 32. */
  readonly maxResidentPages?: number;
}

export class PageCache {
  private readonly doc: PdfjsDocumentProxy;
  private readonly limit: number;
  private readonly resident = new Map<number, PdfjsPageProxy>();
  private readonly pending = new Map<number, Promise<PdfjsPageProxy>>();
  private disposed = false;

  constructor(doc: PdfjsDocumentProxy, options: PageCacheOptions = {}) {
    this.doc = doc;
    this.limit = Math.max(2, options.maxResidentPages ?? 32);
  }

  async acquire(pageNumber: number): Promise<PdfjsPageProxy> {
    if (this.disposed) {
      throw new Error("PageCache has been disposed.");
    }
    // Cache hit — promote to MRU by re-inserting.
    const cached = this.resident.get(pageNumber);
    if (cached) {
      this.resident.delete(pageNumber);
      this.resident.set(pageNumber, cached);
      return cached;
    }
    // In-flight dedup.
    const inFlight = this.pending.get(pageNumber);
    if (inFlight) return inFlight;

    const promise = this.doc.getPage(pageNumber).then((page) => {
      this.pending.delete(pageNumber);
      if (this.disposed) {
        page.cleanup();
        throw new Error("PageCache was disposed during acquire.");
      }
      this.resident.set(pageNumber, page);
      this.evictIfNeeded();
      return page;
    });
    this.pending.set(pageNumber, promise);
    return promise;
  }

  private evictIfNeeded(): void {
    while (this.resident.size > this.limit) {
      // Map iteration order is insertion order; first entry is LRU.
      const oldest = this.resident.keys().next();
      if (oldest.done) break;
      const page = this.resident.get(oldest.value);
      this.resident.delete(oldest.value);
      page?.cleanup();
    }
  }

  /** Inspectable size for tests. */
  size(): number {
    return this.resident.size;
  }

  /** Drop every resident page and prevent further acquires. */
  dispose(): void {
    this.disposed = true;
    for (const page of this.resident.values()) page.cleanup();
    this.resident.clear();
    this.pending.clear();
  }
}
