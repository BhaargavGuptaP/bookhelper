import { describe, expect, it, vi } from "vitest";
import { memoizePageLoader } from "./content-cache.js";
import type { PageContentLoader } from "./types.js";

describe("memoizePageLoader", () => {
  it("caches successful loads (one call per page)", async () => {
    const inner = vi.fn<PageContentLoader>((page) =>
      Promise.resolve({ page, paragraphs: [`p${page}`] }),
    );
    const loader = memoizePageLoader(inner);
    const a = await loader(3);
    const b = await loader(3);
    expect(a).toBe(b);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it("de-duplicates in-flight requests", async () => {
    let resolve!: (v: { page: number; paragraphs: string[] }) => void;
    const inner = vi.fn<PageContentLoader>(() => new Promise((r) => (resolve = r)));
    const loader = memoizePageLoader(inner);
    const p1 = loader(1);
    const p2 = loader(1);
    expect(inner).toHaveBeenCalledTimes(1);
    resolve({ page: 1, paragraphs: ["x"] });
    expect(await p1).toEqual(await p2);
  });

  it("does not cache failures", async () => {
    let fail = true;
    const inner = vi.fn<PageContentLoader>((page) =>
      fail ? Promise.reject(new Error("boom")) : Promise.resolve({ page, paragraphs: [] }),
    );
    const loader = memoizePageLoader(inner);
    await expect(loader(2)).rejects.toThrow("boom");
    fail = false;
    await expect(loader(2)).resolves.toEqual({ page: 2, paragraphs: [] });
    expect(inner).toHaveBeenCalledTimes(2);
  });

  it("evicts least-recently-used beyond the cap", async () => {
    const inner = vi.fn<PageContentLoader>((page) =>
      Promise.resolve({ page, paragraphs: [`p${page}`] }),
    );
    const loader = memoizePageLoader(inner, 2);
    await loader(1);
    await loader(2);
    await loader(3); // evicts page 1
    await loader(1); // re-fetches
    expect(inner).toHaveBeenCalledTimes(4);
  });
});
