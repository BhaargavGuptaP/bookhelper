import { describe, expect, it } from "vitest";
import { buildPageText, streamText } from "./text.js";
import { createFakePdfjsDocument } from "./test-helpers.js";

describe("buildPageText", () => {
  it("collapses whitespace and strips soft hyphens", () => {
    const out = buildPageText([{ str: "Hello   \u00adWorld" }, { str: "   again" }], 1);
    // Soft hyphen vanishes; runs of whitespace collapse to one space.
    expect(out.text).toBe("Hello World again");
    expect(out.page).toBe(1);
  });

  it("joins hyphenated line breaks", () => {
    const out = buildPageText([{ str: "exam-", hasEOL: true }, { str: "ple" }], 1);
    expect(out.text).toBe("example");
  });

  it("preserves run-level descriptors with transforms", () => {
    const out = buildPageText(
      [{ str: "Hi", transform: [1, 0, 0, 1, 50, 700], width: 12, height: 14 }],
      1,
    );
    expect(out.items).toHaveLength(1);
    expect(out.items[0]?.transform).toEqual([1, 0, 0, 1, 50, 700]);
    expect(out.items[0]?.width).toBe(12);
  });
});

describe("streamText", () => {
  it("yields PageText for each page in [from, to]", async () => {
    const doc = createFakePdfjsDocument({
      numPages: 3,
      pages: [{ text: [{ str: "one" }] }, { text: [{ str: "two" }] }, { text: [{ str: "three" }] }],
    });
    const seen: string[] = [];
    for await (const page of streamText(doc, { from: 1, to: 2 })) {
      seen.push(page.text);
    }
    expect(seen).toEqual(["one", "two"]);
  });

  it("honors abort signals", async () => {
    const doc = createFakePdfjsDocument({
      numPages: 3,
      pages: [{ text: [{ str: "one" }] }, { text: [{ str: "two" }] }, { text: [{ str: "three" }] }],
    });
    const ctrl = new AbortController();
    const it = streamText(doc, { signal: ctrl.signal });
    await it.next(); // first page comes out
    ctrl.abort();
    await expect(it.next()).rejects.toMatchObject({ name: "AbortError" });
  });
});
