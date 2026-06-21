import { describe, expect, it } from "vitest";
import { buildManifest, decodePermissions, parsePdfDate } from "./manifest-builder.js";
import { createFakePdfjsDocument } from "./test-helpers.js";

describe("parsePdfDate", () => {
  it("parses standard `D:YYYYMMDDHHmmSS` strings to ISO 8601", () => {
    expect(parsePdfDate("D:20240115123045Z")).toBe("2024-01-15T12:30:45.000Z");
  });

  it("parses timezone-offset variants", () => {
    const iso = parsePdfDate("D:20240115123045+05'30'");
    expect(iso).toMatch(/^2024-01-15T07:00:45/);
  });

  it("returns undefined for garbage", () => {
    expect(parsePdfDate("not a date")).toBeUndefined();
    expect(parsePdfDate(undefined)).toBeUndefined();
    expect(parsePdfDate(123)).toBeUndefined();
  });
});

describe("decodePermissions", () => {
  it("returns the fail-open shape when permissions are absent", () => {
    const p = decodePermissions(null);
    expect(p.copy).toBeNull();
    expect(p.print).toBeNull();
  });

  it("decodes the bitmask into the named flags", () => {
    const p = decodePermissions([4, 16]); // PRINT + COPY
    expect(p.print).toBe(true);
    expect(p.copy).toBe(true);
    expect(p.modify).toBe(false);
  });
});

describe("buildManifest", () => {
  it("folds metadata, permissions, and the PDF extension bag into the canonical shape", async () => {
    const doc = createFakePdfjsDocument({
      numPages: 3,
      info: {
        Title: "Hello PDF",
        Author: "Test Author",
        Subject: "Testing",
        Keywords: "alpha, beta",
        Creator: "TestCreator",
        Producer: "TestProducer",
        PDFFormatVersion: "1.7",
        CreationDate: "D:20240101000000Z",
        ModDate: "D:20240515103045Z",
        Language: "en",
        IsLinearized: true,
      },
      permissions: [4, 16],
    });
    const manifest = await buildManifest({
      docId: "doc-1",
      doc,
      outline: null,
      pageCount: 3,
      totalChars: 999,
      blockCount: 3,
      docVersion: 2,
    });
    expect(manifest.format).toBe("pdf");
    expect(manifest.renderMode).toBe("fixed");
    expect(manifest.docVersion).toBe(2);
    expect(manifest.pageCount).toBe(3);
    expect(manifest.blockCount).toBe(3);
    expect(manifest.totalChars).toBe(999);
    expect(manifest.title).toBe("Hello PDF");
    expect(manifest.language).toBe("en");
    expect(manifest.direction).toBe("ltr");

    const meta = manifest.meta.pdf;
    expect(meta.author).toBe("Test Author");
    expect(meta.subject).toBe("Testing");
    expect(meta.keywords).toBe("alpha, beta");
    expect(meta.creator).toBe("TestCreator");
    expect(meta.producer).toBe("TestProducer");
    expect(meta.pdfVersion).toBe("1.7");
    expect(meta.creationDate).toBe("2024-01-01T00:00:00.000Z");
    expect(meta.modificationDate).toBe("2024-05-15T10:30:45.000Z");
    expect(meta.linearized).toBe(true);
    expect(meta.encrypted).toBe(true);
    expect(meta.permissions.copy).toBe(true);
    expect(meta.permissions.print).toBe(true);
    expect(meta.fingerprints).toContain("fake-fingerprint-1");
  });

  it("omits optional metadata fields cleanly when the dict is empty", async () => {
    const doc = createFakePdfjsDocument({ numPages: 1, info: {} });
    const manifest = await buildManifest({
      docId: "doc-2",
      doc,
      outline: null,
      pageCount: 1,
      totalChars: 0,
      blockCount: 1,
      docVersion: 1,
    });
    expect(manifest.title).toBeUndefined();
    expect(manifest.meta.pdf.author).toBeUndefined();
    expect(manifest.meta.pdf.permissions.copy).toBeNull();
  });
});
