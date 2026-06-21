import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { PDFDocument } from "pdf-lib";
import { TextExtractor } from "./text.extractor.js";
import { MarkdownExtractor } from "./markdown.extractor.js";
import { EpubExtractor } from "./epub.extractor.js";
import { PdfExtractor } from "./pdf.extractor.js";

describe("TextExtractor", () => {
  it("derives title from first non-empty line and counts words", async () => {
    const result = await new TextExtractor().extract({
      bytes: new TextEncoder().encode("My Notes\nThis is a body with five words."),
      filename: "notes.txt",
    });
    expect(result.title).toBe("My Notes");
    expect(result.wordCount).toBeGreaterThan(5);
    expect(result.description).toContain("body");
  });

  it("falls back to filename-derived title when the body is empty", async () => {
    const result = await new TextExtractor().extract({
      bytes: new Uint8Array(0),
      filename: "/tmp/the-rust-programming-language.txt",
    });
    expect(result.title).toBe("the rust programming language");
  });
});

describe("MarkdownExtractor", () => {
  it("uses the first ATX H1 as the title", async () => {
    const md = "Preamble\n\n# Real Title\n\nBody.";
    const result = await new MarkdownExtractor().extract({
      bytes: new TextEncoder().encode(md),
      filename: "x.md",
    });
    expect(result.title).toBe("Real Title");
  });

  it("strips markdown markup from the description and word count", async () => {
    const md = "# Title\n\n```code\nlots of code\n```\n\n_emphasis_ word.";
    const result = await new MarkdownExtractor().extract({
      bytes: new TextEncoder().encode(md),
      filename: "x.md",
    });
    expect(result.description).not.toContain("```");
    expect(result.wordCount).toBeGreaterThan(0);
  });
});

describe("EpubExtractor", () => {
  it("reads dc:title + dc:creator + cover from an embedded OPF", async () => {
    const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>The Test Book</dc:title>
    <dc:creator>Ada Lovelace</dc:creator>
    <dc:language>en</dc:language>
    <meta name="cover" content="cover-img" />
  </metadata>
  <manifest>
    <item id="cover-img" href="cover.png" media-type="image/png" />
  </manifest>
</package>`;
    const container = `<?xml version="1.0"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`;
    // 1x1 png header bytes (any non-empty payload will do).
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const epub = zipSync({
      "META-INF/container.xml": strToU8(container),
      "OEBPS/content.opf": strToU8(opf),
      "OEBPS/cover.png": png,
    });

    const r = await new EpubExtractor().extract({ bytes: epub, filename: "x.epub" });
    expect(r.title).toBe("The Test Book");
    expect(r.author).toBe("Ada Lovelace");
    expect(r.language).toBe("en");
    expect(r.cover?.contentType).toBe("image/png");
  });

  it("throws BadRequestError on an invalid archive", async () => {
    await expect(
      new EpubExtractor().extract({ bytes: new Uint8Array([1, 2, 3]), filename: "bad.epub" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("PdfExtractor", () => {
  it("returns pageCount + roundtrips title/author from real PDF bytes", async () => {
    const doc = await PDFDocument.create();
    doc.setTitle("PDF Title");
    doc.setAuthor("PDF Author");
    doc.addPage([300, 400]);
    doc.addPage([300, 400]);
    const bytes = await doc.save();
    const r = await new PdfExtractor().extract({
      bytes: new Uint8Array(bytes),
      filename: "x.pdf",
    });
    expect(r.pageCount).toBe(2);
    expect(r.title).toBe("PDF Title");
    expect(r.author).toBe("PDF Author");
  });

  it("rejects an unreadable PDF with a recoverable BadRequestError", async () => {
    await expect(
      new PdfExtractor().extract({
        bytes: new TextEncoder().encode("not a pdf"),
        filename: "bad.pdf",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
