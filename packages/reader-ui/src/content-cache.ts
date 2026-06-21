/**
 * A tiny LRU memoizer around a {@link PageContentLoader}. Scrolling
 * mounts/unmounts pages constantly; without this every re-mount would
 * re-extract the same page's text. We cap resident entries to bound memory
 * for very large documents (the adapter caps its own page cache too).
 *
 * Successful results are cached; in-flight requests are de-duplicated.
 * Failures are not cached so a transient error can be retried.
 */

import type { PageContentLoader, ReaderPageContent } from "./types.js";

export function memoizePageLoader(loader: PageContentLoader, max = 64): PageContentLoader {
  const cache = new Map<number, ReaderPageContent>();
  const inflight = new Map<number, Promise<ReaderPageContent>>();

  return (page) => {
    const cached = cache.get(page);
    if (cached) {
      // Refresh recency.
      cache.delete(page);
      cache.set(page, cached);
      return Promise.resolve(cached);
    }
    const pending = inflight.get(page);
    if (pending) return pending;

    const promise = loader(page)
      .then((result) => {
        inflight.delete(page);
        cache.set(page, result);
        while (cache.size > max) {
          const oldest = cache.keys().next();
          if (oldest.done) break;
          cache.delete(oldest.value);
        }
        return result;
      })
      .catch((err: unknown) => {
        inflight.delete(page);
        throw err;
      });
    inflight.set(page, promise);
    return promise;
  };
}
