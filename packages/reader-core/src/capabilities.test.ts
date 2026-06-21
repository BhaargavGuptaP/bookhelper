import { describe, expect, it } from "vitest";
import { emptyCapabilities, hasCapability, type ReaderCapabilities } from "./capabilities.js";

describe("capabilities", () => {
  it("emptyCapabilities defaults every flag to false", () => {
    for (const [, value] of Object.entries(emptyCapabilities)) {
      if (typeof value === "boolean") expect(value).toBe(false);
    }
  });

  it("hasCapability honors the spread override pattern", () => {
    const caps: ReaderCapabilities = {
      ...emptyCapabilities,
      selection: true,
      renderModes: ["reflowable"],
    };
    expect(hasCapability(caps, "selection")).toBe(true);
    expect(hasCapability(caps, "search")).toBe(false);
  });

  it("emptyCapabilities is frozen against accidental mutation", () => {
    expect(Object.isFrozen(emptyCapabilities)).toBe(true);
  });
});
