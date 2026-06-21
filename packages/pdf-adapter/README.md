# @bookhelper/pdf-adapter

The **PDF DocumentAdapter** for the BookHelper Reader Platform.
Sprint 3B — reference implementation for every future format adapter.

> This package is a `DocumentAdapter` from `@bookhelper/reader-core`.
> It deliberately implements no rendering, no UI, no search engine,
> no highlights, no AI, and no annotation persistence. Those belong
> to later sprints and consume this adapter through the platform's
> contracts — not by importing pdfjs.

---

## What this adapter owns

| Concern                                                          | API                                  |
| ---------------------------------------------------------------- | ------------------------------------ |
| Opening a PDF (bytes, URL, Uint8Array)                           | `createPdfAdapter`                   |
| Closing & resource cleanup                                       | `DocumentSession.close()`            |
| Document manifest (metadata)                                     | `manifest` + `PdfManifestMeta`       |
| Capabilities reporting (dynamic)                                 | `capabilities`                       |
| Table of contents (outline)                                      | `getToc()`                           |
| Navigation: page jump / next / prev / first / last / destination | `navigation.step / resolve`          |
| Locator resolution (PDF page+offset ↔ reader-core locator)       | `resolveLocator()`                   |
| Text extraction (per page, streaming)                            | `extractPageText()` / `streamText()` |
| Image enumeration (metadata)                                     | `listImages()`                       |
| Link enumeration (internal + external)                           | `listLinks()`                        |
| Error mapping (pdfjs → ReaderErrors)                             | `mapPdfError`                        |

What it **does not** own:

- Rendering pages to canvas (READER-SPEC §5.3 — host renderer / future PDF renderer plugin).
- Search index construction (Search Engine package, future sprint).
- Highlights / annotations / bookmarks (their own plugins).
- AI, knowledge graph, learning (their own packages).

---

## PDF engine

[`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist) (Mozilla, the
reference PDF.js library) — used through its **legacy Node build**
(`pdfjs-dist/legacy/build/pdf.mjs`). Why:

- Production-grade; powers Firefox.
- Pure JS; runs in Node, the browser, and web workers.
- Exposes everything we need: metadata, page count, outline, text
  content with positions, link/annotation enumeration, image-object
  enumeration.
- Avoids the `pdf-lib` text-extraction gap (which decodes content
  streams manually and doesn't ship a text iterator).

`pdfjs-dist` types are **never** leaked outside this package. Every
public type is defined in our own modules.

---

## Performance

- Documents load lazily — pages are not parsed until requested.
- The adapter holds a **soft page cache** keyed by page index (1-based).
  Pages evict via simple LRU once `maxResidentPages` is hit (default 32).
- Long operations honor the caller's `AbortSignal`.
- Text extraction is exposed as both an eager `extractPageText(page)` and
  a streaming `streamText({ from, to })` async iterator.

---

## Status

Sprint 3B. Reference implementation. Followed by EPUB and Markdown
adapters in later sprints.
