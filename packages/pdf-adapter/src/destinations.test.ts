import { describe, expect, it } from "vitest";
import { resolveDestinationToPage } from "./destinations.js";
import { createFakePdfjsDocument } from "./test-helpers.js";

describe("resolveDestinationToPage", () => {
  it("resolves a named destination via the document's Names dictionary", async () => {
    const doc = createFakePdfjsDocument({
      numPages: 5,
      destinations: { chapter1: [{ num: 3 }, "XYZ"] },
    });
    expect(await resolveDestinationToPage(doc, "chapter1")).toBe(3);
  });

  it("resolves an explicit destination array", async () => {
    const doc = createFakePdfjsDocument({ numPages: 5 });
    expect(await resolveDestinationToPage(doc, [{ num: 2 }, "Fit"])).toBe(2);
  });

  it("returns null for unresolvable destinations", async () => {
    const doc = createFakePdfjsDocument({ numPages: 5 });
    expect(await resolveDestinationToPage(doc, "missing")).toBeNull();
    expect(await resolveDestinationToPage(doc, null)).toBeNull();
    expect(await resolveDestinationToPage(doc, {})).toBeNull();
  });
});
