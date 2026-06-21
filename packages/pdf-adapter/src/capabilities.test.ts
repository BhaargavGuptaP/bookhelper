import { describe, expect, it } from "vitest";
import { buildCapabilities, probeCapabilities, type CapabilityProbe } from "./capabilities.js";
import type { PdfPermissions } from "./manifest.js";
import { createFakePdfjsDocument } from "./test-helpers.js";

const noPerms: PdfPermissions = {
  print: null,
  modify: null,
  copy: null,
  annotate: null,
  fillForms: null,
  accessibilityCopy: null,
  assemble: null,
  printHighQuality: null,
};

const fullProbe: CapabilityProbe = {
  hasText: true,
  hasAnnotations: true,
  hasLinks: true,
  hasForms: false,
  hasSignatures: false,
  probedPages: 4,
  totalPages: 4,
};

describe("buildCapabilities", () => {
  it("reports fixed-layout + paginated + scroll + spread for PDF", () => {
    const caps = buildCapabilities(fullProbe, noPerms, true);
    expect(caps.renderModes).toEqual(["fixed"]);
    expect(caps.layoutModes).toEqual(["paginated", "scroll", "spread"]);
  });

  it("gates selection / search / TTS on extractable text", () => {
    const noText: CapabilityProbe = { ...fullProbe, hasText: false };
    const caps = buildCapabilities(noText, noPerms, true);
    expect(caps.selection).toBe(false);
    expect(caps.search).toBe(false);
    expect(caps.highlights).toBe(false);
    expect(caps.tts).toBe(false);
    expect(caps.screenReader).toBe(false);
  });

  it("denies copy/print when permissions explicitly forbid them", () => {
    const perms: PdfPermissions = { ...noPerms, copy: false, print: false };
    const caps = buildCapabilities(fullProbe, perms, false);
    expect(caps.copy).toBe(false);
    expect(caps.printing).toBe(false);
    expect(caps.export).toBe(false);
  });

  it("treats null permissions as fail-open (permitted)", () => {
    const caps = buildCapabilities(fullProbe, noPerms, false);
    expect(caps.copy).toBe(true);
    expect(caps.printing).toBe(true);
  });

  it("exposes forms / signatures via the extras bag", () => {
    const probe: CapabilityProbe = { ...fullProbe, hasForms: true, hasSignatures: true };
    const caps = buildCapabilities(probe, noPerms, true);
    expect(caps.extras?.forms).toBe(true);
    expect(caps.extras?.signatures).toBe(true);
  });

  it("flags `partial` when the probe didn't cover every page", () => {
    const probe: CapabilityProbe = { ...fullProbe, probedPages: 2, totalPages: 100 };
    const caps = buildCapabilities(probe, noPerms, true);
    expect(caps.extras?.partial).toBe(true);
  });
});

describe("probeCapabilities", () => {
  it("detects text and link annotations on the probed pages", async () => {
    const doc = createFakePdfjsDocument({
      numPages: 2,
      pages: [
        {
          text: [{ str: "hello" }],
          annotations: [{ subtype: "Link", url: "https://example.com" }],
        },
        { text: [{ str: "world" }] },
      ],
    });
    const probe = await probeCapabilities({
      doc,
      permissions: noPerms,
      hasOutline: false,
      probePages: 2,
    });
    expect(probe.hasText).toBe(true);
    expect(probe.hasLinks).toBe(true);
    expect(probe.hasAnnotations).toBe(true);
    expect(probe.probedPages).toBe(2);
  });

  it("clamps the probe to numPages", async () => {
    const doc = createFakePdfjsDocument({ numPages: 1, pages: [{ text: [{ str: "ok" }] }] });
    const probe = await probeCapabilities({
      doc,
      permissions: noPerms,
      hasOutline: false,
      probePages: 99,
    });
    expect(probe.probedPages).toBe(1);
  });
});
