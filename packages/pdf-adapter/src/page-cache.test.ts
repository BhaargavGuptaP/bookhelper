import { describe, expect, it } from "vitest";
import { PageCache } from "./page-cache.js";
import { createFakePdfjsDocument } from "./test-helpers.js";

describe("PageCache", () => {
  it("evicts the LRU page when the cap is exceeded", async () => {
    const doc = createFakePdfjsDocument({ numPages: 5 });
    const cache = new PageCache(doc, { maxResidentPages: 2 });
    await cache.acquire(1);
    await cache.acquire(2);
    await cache.acquire(3); // evicts page 1
    expect(cache.size()).toBe(2);
  });

  it("dedups in-flight acquires", async () => {
    let count = 0;
    const doc = createFakePdfjsDocument({ numPages: 1 });
    const original = doc.getPage.bind(doc);
    doc.getPage = async (n) => {
      count += 1;
      return original(n);
    };
    const cache = new PageCache(doc);
    await Promise.all([cache.acquire(1), cache.acquire(1), cache.acquire(1)]);
    expect(count).toBe(1);
  });

  it("dispose() drops every resident page", async () => {
    const doc = createFakePdfjsDocument({ numPages: 3 });
    const cache = new PageCache(doc, { maxResidentPages: 5 });
    await cache.acquire(1);
    await cache.acquire(2);
    cache.dispose();
    expect(cache.size()).toBe(0);
    await expect(cache.acquire(1)).rejects.toThrow(/disposed/);
  });
});
