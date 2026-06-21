# @bookhelper/reader-ui

The **Reader shell UI** — the first complete reading experience for BookHelper.
Presentation only. It renders the toolbar, viewport, table of contents,
status bar, and preferences over a `@bookhelper/reader-core` session and a
`@bookhelper/render-engine` runtime.

```
Library  →  Open Book  →  Reader  →  Navigate  →  Close Book
```

## What it owns

- Layout & chrome: `ReaderShell`, `ReaderToolbar`, `ReaderSidebar`,
  `TableOfContents`, `ReaderStatusBar`, `ReaderPreferencesPanel`,
  `ReaderViewport` / `ReaderPage`.
- Orchestration: `ReaderProvider` wires the session, render runtime, and
  page-content loader; mirrors zoom/page-gap from reader-core preferences;
  restores & persists the per-document session and global settings; binds
  keyboard shortcuts; exposes a flat `actions` bag via `useReaderContext()`.

## What it must never do (architectural boundary)

`reader-ui` is **format-agnostic**. It never:

- imports `pdfjs-dist` or `@bookhelper/pdf-adapter`,
- parses a document format or knows storage details,
- duplicates reader state — everything flows through reader-core.

It consumes only `ReaderEngine` / `ReaderSession` / `RuntimeFrame` /
`DocumentSession` / `ReaderCapabilities` / `ReaderPreferences`. The host
application is the composition root: it builds the format-specific pieces (a
PDF adapter, the session, the render runtime's document session, a page
content loader) behind a single `ReaderBootstrap` and hands them in:

```tsx
import { Reader, type ReaderBootstrap } from "@bookhelper/reader-ui";
import "@bookhelper/reader-ui/styles.css";

const bootstrap: ReaderBootstrap = {
  async open(signal) {
    /* open the adapter + reader-core session, return OpenedReader */
  },
};

<Reader doc={docMeta} bootstrap={bootstrap} onExit={() => router.back()} />;
```

See `apps/web/src/reader/bootstrap.ts` for the PDF composition root.

## How navigation & state stay coherent

- **All navigation is a Reader Command.** Page nav routes through
  `reader.goto`; zoom through `reader.set-zoom`; close through `reader.close`.
  The shell never mutates reader-core state directly.
- **reader-core is the source of truth** for position, preferences, and
  capabilities. The render runtime's zoom mirrors `preferences.zoom`;
  progress / current page are derived from the live render frame for display.
- **Virtualization** comes from the render engine: only the pages in
  `frame.window` are mounted; each page measures its own intrinsic
  (zoom-independent) height and reports it back, so 1000-page documents keep
  a constant DOM footprint.

## Rendering model (this sprint)

PDF pages render as a **text layer** (the adapter's normalized extracted
text) in a measure-constrained reading column. Pixel-perfect raster page
rendering is deferred — it would require a rasterization API on the PDF
adapter (out of scope; no redesign of Sprint 3B). Zoom is a CSS transform on
the page layer; fit-width / fit-page use the render engine's zoom math.

## Themes

Reader themes (`light` / `sepia` / `dark` / `high-contrast`) are **independent
of the app chrome theme** and applied as `data-reader-theme` on the reader
root. Reduced motion is the OR of the user preference and the OS setting.

```

```
