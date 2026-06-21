# BookHelper — Reader Module: Technical Specification

> **Deep-dive companion** to [ARCHITECTURE.md](ARCHITECTURE.md) (§4–5, §12), [UX-DESIGN.md](UX-DESIGN.md) (§3, §5), [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) (§21), [FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md) (E6, E7), [ROADMAP.md](ROADMAP.md).
>
> **Scope:** the Reader is the surface that turns any ingested source into a readable, annotatable, searchable, synced experience. This spec is build-ready: data models as field tables, algorithms as numbered procedures, module contracts as input/output tables. **No implementation code.**
>
> **Supported now:** PDF · EPUB · Markdown · TXT. **Future:** DOCX · Research Papers (enhanced PDF). The architecture is format-agnostic by construction — adding a format is implementing one adapter, not changing the reader.

---

## Table of Contents

1. [Overview, Goals & Rendering Modes](#1-overview-goals--rendering-modes)
2. [Architecture](#2-architecture)
3. [The Canonical Document Model](#3-the-canonical-document-model)
4. [The Universal Locator System](#4-the-universal-locator-system)
5. [Rendering Pipeline](#5-rendering-pipeline)
6. [Pagination](#6-pagination)
7. [Scrolling](#7-scrolling)
8. [Search](#8-search)
9. [Bookmarks](#9-bookmarks)
10. [Highlights](#10-highlights)
11. [Annotations](#11-annotations)
12. [Selection](#12-selection)
13. [Reading Progress](#13-reading-progress)
14. [Offline](#14-offline)
15. [Sync](#15-sync)
16. [Performance](#16-performance)
17. [Accessibility](#17-accessibility)
18. [Edge Cases](#18-edge-cases)
19. [Module Contracts](#19-module-contracts-interfaces)
20. [Telemetry & QA](#20-telemetry--qa)

---

## 1. Overview, Goals & Rendering Modes

### 1.1 Goals
- **One reader, every format.** A single interaction model and annotation system across PDF/EPUB/MD/TXT (and future formats).
- **Instant + offline.** Open a cached document instantly with exact position restore; read and annotate fully offline.
- **Portable annotations.** Highlights/notes survive font changes, reflow, re-ingestion, and cross-device sync.
- **Faithful where it matters, clean where it helps.** Render PDFs faithfully *and* offer a derived reflowable "clean view" (critical for accessibility and research papers).
- **Sacred canvas.** No chrome at rest; AI/annotation summoned, never imposed (per UX §5).

### 1.2 The two rendering modes (the central design fork)

| Mode | Formats | Render technique | Position unit | Reflows? |
|---|---|---|---|---|
| **Reflowable** | EPUB (reflowable), Markdown, TXT, DOCX (future) | Semantic DOM rendered from the Document Model | character offset (stable) | Yes — font/measure/viewport change layout |
| **Fixed-layout (paged-faithful)** | PDF, EPUB fixed-layout, Research Papers | Page raster (PDF.js / pdfium-wasm) + invisible aligned text layer | page index + position | No — page geometry is fixed |

**Dual-view for PDF / Research Papers:** the original is rendered fixed-layout *and* a derived reflowable "Clean Read" view is generated from the Document Model (sections, resolved references, extracted figures). The user toggles. Clean Read is the **accessible default** for screen-reader users and the basis for TTS.

### 1.3 Non-goals (this module)
- Cross-document semantic search and RAG generation (owned by E8/E9; the reader only provides the "jump to span" landing and surfaces results).
- Ingestion/parsing (owned by E4; the reader *consumes* the Document Model). The reader specifies the contract it needs from ingestion (§3) but does not parse raw files itself — except a thin client-side fast-path for TXT/MD (§5.2).

---

## 2. Architecture

### 2.1 Layered model

```
┌──────────────────────────────────────────────────────────────┐
│ READER SHELL  (controls, TOC, settings, panels — UX §21)       │
├──────────────────────────────────────────────────────────────┤
│ INTERACTION LAYERS (stacked, independent, z-ordered)           │
│   4. Instrumentation layer  (invisible: dwell, scroll, reads)  │
│   3. AI overlay layer        (explain popovers, citations)     │
│   2. Annotation layer        (highlights, notes, bookmarks)    │
│   1. Content layer           (reflow DOM  OR  PDF canvas+text)  │
├──────────────────────────────────────────────────────────────┤
│ READER CORE                                                    │
│   Render Engine ── Paginator/Scroller ── Selection Service     │
│   Locator Service ── In-Doc Search ── Progress Tracker         │
├──────────────────────────────────────────────────────────────┤
│ FORMAT ADAPTERS (one per format)                               │
│   PdfAdapter · EpubAdapter · MarkdownAdapter · TxtAdapter      │
│   (future) DocxAdapter · ResearchPaperAdapter                  │
├──────────────────────────────────────────────────────────────┤
│ DATA PLANE                                                     │
│   Document Model store · Annotation store (CRDT) · Progress     │
│   Local-first cache (IndexedDB / SQLite) · Sync Engine         │
└──────────────────────────────────────────────────────────────┘
```

**Layer independence is load-bearing:** the annotation layer is *computed from locators*, never baked into content. Resizing or theming recomputes overlays without touching content; the AI panel opening never disturbs the content layer's scroll position.

### 2.2 Module decomposition

| Module | Responsibility |
|---|---|
| **Format Adapter** | Produces the canonical Document Model + a render descriptor for its format; resolves format-native anchors (CFI, page+quads). |
| **Render Engine** | Renders the content layer per mode (reflow DOM vs PDF canvas+text layer); manages fonts, images, math, theming. |
| **Paginator / Scroller** | Computes pages (reflow) or page geometry (fixed); drives continuous vs paged navigation; virtualization. |
| **Locator Service** | The heart: creates, resolves, compares, and re-anchors locators (§4). Used by every annotation/search/progress feature. |
| **Selection Service** | Normalizes platform selections (DOM range / PDF text layer) → locators; drives the selection toolbar. |
| **Annotation Engine** | Highlights/notes/bookmarks CRUD; overlay rendering; CRDT integration. |
| **In-Doc Search** | Client-side text search over the Document Model; match→locator→highlight→navigate. |
| **Progress Tracker** | Locator-based progress %, time-left, reading-event emission. |
| **Local Cache** | IndexedDB (web) / SQLite (desktop): Document Model, assets, annotations, progress, mutation queue. |
| **Sync Engine** | Mutation log + CRDT sync + delta pull; conflict resolution; offline queue. |

### 2.3 Where it runs

- **Client (primary):** all rendering, pagination, selection, in-doc search, annotation overlay, local cache, offline. The reader is a thick client; reading must not require a round-trip.
- **Edge/BFF:** Document Model + asset delivery (signed URLs), annotation/progress sync endpoints, cross-doc search proxy.
- **Server (E4/E8/E9):** ingestion produces the Document Model; hybrid search; RAG. The reader consumes, never re-derives.
- **Desktop (Tauri):** adds SQLite, local filesystem access, and a local vector cache for offline semantic search.

### 2.4 Data flow (open a document)

```
open(docId)
  └─▶ Local cache hit? ──yes──▶ hydrate Document Model + position + annotations (INSTANT render)
        │                          └─▶ background: revalidate (ETag) + pull annotation/progress deltas
        └─no──▶ fetch Document Model manifest + first window of blocks/pages from edge
                 └─▶ Format Adapter builds render descriptor ──▶ Render Engine paints window
                       └─▶ Locator Service resolves cached annotations onto the rendered window
```

---

## 3. The Canonical Document Model

The single source of truth for text content, structure, and anchoring. Produced by ingestion (E4) for heavy formats; produced client-side for TXT/MD.

### 3.1 Structure

A document is an ordered tree of **blocks** plus a manifest.

**Manifest fields**

| Field | Type | Notes |
|---|---|---|
| `docId` | id | stable document identifier |
| `format` | enum | pdf · epub · markdown · txt · docx · paper |
| `renderMode` | enum | reflowable · fixed |
| `version` | int | Document Model version (bumps on re-ingest) |
| `contentHash` | hash | of normalized text; dedupe + anchor stability |
| `blockCount`, `totalChars` | int | for progress math |
| `pageCount` | int? | fixed-layout only |
| `toc` | tree | heading hierarchy → block anchors |
| `language`, `direction` | enum | incl. `rtl`, `vertical` |
| `assets` | list | images/figures/fonts with keys + dimensions |
| `pageMap` | list? | fixed-layout: page → block-range + dimensions |

**Block fields**

| Field | Type | Notes |
|---|---|---|
| `blockId` | content-addressed id | `hash(normalizedText + structuralPath)` — stable across re-parse for unchanged content |
| `ord` | int | document order (for comparison/virtualization) |
| `type` | enum | heading{1–6} · paragraph · list · listitem · quote · code · figure · caption · table · footnote · pagebreak |
| `text` | string | **normalized** text (NFC, whitespace-collapsed, soft-hyphens removed) — the basis for offsets |
| `html` | string? | sanitized inline markup (emphasis, links, sup/sub) for reflow render |
| `locatorAnchor` | object | format-native fast-path: EPUB CFI base, PDF `{page, quads}`, char base offset |
| `cumulativeCharStart` | int | running char offset across the doc — progress math |
| `parentId`, `children` | id/list | tree structure |

### 3.2 Normalization rules (critical for stable offsets)
1. Unicode NFC; collapse runs of whitespace to single spaces (preserve paragraph boundaries as block boundaries, not characters).
2. Remove soft hyphens and join hyphenated line-breaks from PDFs (`exam-\nple` → `example`) so search/selection match natural text.
3. Strip render-only artifacts (page headers/footers, line numbers) into separate metadata, excluded from `text` (so they don't pollute search/RAG/offsets).
4. Offsets are **character offsets into the normalized `text`** of a block. Document-global offset = `block.cumulativeCharStart + localOffset`.

### 3.3 Per-format mapping

| Format | Produced by | Mapping notes |
|---|---|---|
| **TXT** | client (fast-path) | whole file → paragraphs split on blank lines; `renderMode=reflowable`. |
| **Markdown** | client (fast-path) | parse to blocks (headings/lists/code/quote/table); preserve inline `html`; `reflowable`. |
| **EPUB** | ingestion | spine → documents → blocks; preserve CFI base per block as `locatorAnchor`; `reflowable` (or `fixed` for fixed-layout EPUB). |
| **PDF** | ingestion | text-layer extraction + layout analysis → blocks; per block store `{page, quads}`; `renderMode=fixed`; also derive a reflowable "Clean Read" Document Model. |
| **DOCX** (future) | ingestion | styles → block types; lists/tables; `reflowable`. |
| **Research Paper** (future) | ingestion (GROBID-class) | section structure, references resolved to a bibliography block, figures/tables extracted; dual-view (fixed PDF + reflowable clean). |

---

## 4. The Universal Locator System

Everything that points into a document — highlights, notes, bookmarks, search matches, progress, AI citations — uses **one** locator type. This is the most important contract in the module.

### 4.1 Requirements
- **Renderable:** resolves to client rects for overlay drawing.
- **Stable:** survives font/measure/viewport reflow.
- **Portable:** survives document re-ingestion (version bump) where the content is unchanged or lightly changed.
- **Orderable:** two locators are comparable (for sorting, range math, progress).
- **Format-uniform:** identical shape for PDF and reflowable.

### 4.2 Locator schema (a point or a range)

| Field | Type | Notes |
|---|---|---|
| `kind` | enum | `point` · `range` |
| `start` / `end` | position | (`end` omitted for points) |
| position → `blockId` | id | primary anchor |
| position → `offset` | int | char offset into block normalized text |
| position → `globalOffset` | int | denormalized `cumulativeCharStart + offset` (fast ordering/progress) |
| `quote` | object? | **robustness anchor**: `{prefix, exact, suffix}` (≈32 chars each) |
| `native` | object? | fast-path render hint: EPUB CFI range, or PDF `{page, quads[]}` |
| `docVersion` | int | the Document Model version this was created against |

### 4.3 Resolution: locator → screen rects (the three-strategy cascade)

When rendering a locator (e.g., a highlight) onto the current view:

1. **Native fast-path** (same `docVersion`): use CFI/quads directly → rects. O(1). The common case.
2. **Structural anchor** (`blockId + offset`, possibly different `docVersion` but block still exists): find the block, walk to the offset, derive a DOM/text-layer range → rects.
3. **Quote re-anchor** (block missing or offsets drift after re-ingest): fuzzy-search the document for `exact` text, disambiguated by `prefix`/`suffix`, within a window near the old `globalOffset`; on match, **rewrite** the locator's structural anchor to the new block/offset and persist (self-healing).
4. **Orphan** (no confident match): mark the annotation `orphaned`; surface it in a recoverable "couldn't re-locate" tray (never silently drop it). User can re-place or delete.

### 4.4 Creation: selection/match → locator
1. Obtain a platform range (DOM Range for reflow; text-layer range for PDF — §12).
2. Map range endpoints to `{blockId, offset}` via `data-block`/`data-offset` attributes on rendered spans (reflow) or text-item indices (PDF).
3. Capture `quote` (prefix/exact/suffix from normalized text) and `native` (CFI or page+quads).
4. Stamp `globalOffset` and `docVersion`.

### 4.5 Comparison & ordering
- Order by `globalOffset` (then block `ord`, then `offset`) — total order over the document.
- Range overlap, containment, and adjacency computed from `[start.globalOffset, end.globalOffset)`.
- Powers: sorted annotation lists, "next/previous highlight," overlap merging, progress %.

### 4.6 Re-ingestion handling
On `docVersion` bump (E4 reprocess): annotations are **not** migrated eagerly. They re-resolve lazily on next open via §4.3; quote re-anchoring self-heals the common case; orphans surface for review. A background job can batch-re-anchor a user's annotations after a version bump to pre-empt orphans.

---

## 5. Rendering Pipeline

### 5.1 Stages (open → painted)

```
1. ACQUIRE     local cache → else fetch manifest + first window (blocks or pages)
2. PREPARE     adapter builds render descriptor; preload reading fonts; resolve theme tokens
3. LAYOUT      reflow: measure & paginate window  |  fixed: compute page geometry
4. PAINT       reflow: render block DOM  |  fixed: rasterize page(s) to canvas + text layer
5. DECORATE    Locator Service resolves visible annotations → overlay rects; search marks
6. HYDRATE     attach selection handlers, instrumentation, lazy-load offscreen assets
7. RESTORE     scroll/paginate to saved position (instant, pre-paint where possible)
```

Render is **windowed**: only the visible range ± buffer is laid out/painted (§7.2). Steps 3–6 run per window as the user scrolls/pages.

### 5.2 Reflowable rendering (EPUB/MD/TXT/DOCX)
- Blocks → sanitized semantic DOM (`<h1–6>`, `<p>`, `<ul/ol/li>`, `<blockquote>`, `<pre><code>`, `<figure>`, `<table>`), each carrying `data-block`/`data-offset` markers for locator mapping.
- **Sanitization:** all inline `html` passes an allow-list sanitizer (defense vs. malicious EPUB/MD content — §18).
- **Theming:** reader theme tokens (DESIGN-SYSTEM §21, independent from app chrome) applied via CSS variables; switching theme/measure/font recomputes layout + annotation rects only.
- **Fast-path for TXT/MD:** parsed client-side in a Web Worker (no server round-trip needed to start reading); large TXT streamed/chunked.

### 5.3 Fixed-layout rendering (PDF)
- **Engine:** PDF.js (primary) with pdfium-wasm evaluated as an alternative for fidelity/perf. Page rasterized to a canvas at devicePixelRatio; an **invisible, positionally-aligned text layer** (absolutely positioned spans) overlays the canvas for selection, search, and a11y.
- **Render scheduling:** visible pages rendered at full quality; adjacent pages pre-rendered at lower priority; offscreen pages released (memory cap §16). `OffscreenCanvas` + worker where available.
- **Annotation overlay:** an SVG/canvas layer above the page draws highlight rects from stored `quads`.
- **Clean Read (derived reflowable view):** rendered from the PDF's Document Model exactly like §5.2 — used for accessibility, TTS, small screens, and research papers.

### 5.4 Assets, images, math, fonts
- **Images/figures:** lazy-loaded with aspect-ratio placeholders (zero layout shift); `srcset`/responsive; failed loads → inline retry placeholder (§18).
- **Math:** MathML (reflow) or pre-rendered (KaTeX-style) from the Document Model; never raw LaTeX shown.
- **Fonts:** reading fonts preloaded before first paint (avoid FOUT); embedded EPUB fonts honored when allowed; fallbacks per DESIGN-SYSTEM §1.
- **Code blocks:** monospace, horizontal scroll, optional syntax highlighting from the Document Model.

---

## 6. Pagination

### 6.1 Reflowable pagination (computed, dynamic)
Pages are a *function* of content + font + measure + viewport — never persisted as numbers.

**Algorithm (per spread):**
1. Establish the page box (measure-constrained column width + viewport height, per reading settings).
2. Lay out blocks into a CSS multi-column container (or manual measurement) sized to the page box.
3. A "page" = the content within one column-width offset; advancing = translating the column offset by one page width.
4. Compute page boundaries lazily as the user advances (don't paginate the whole book up front — measure forward + a buffer).
5. Cache measured break positions keyed by `(font, size, measure, viewport, theme)`; invalidate on any change.

- **Page identity** is the locator at the page's first visible character — stable; "page 5 of 312" is a *display estimate* recomputed from total chars ÷ avg chars-per-page, never a stored anchor.
- **Two-page spread** (tablet/desktop wide): two page boxes side by side; advance by two.

### 6.2 Fixed-layout pagination (PDF)
- Pages are intrinsic (the `pageMap`). Navigation = page index. Single-page or two-page spread; "fit width / fit page / actual size" zoom modes.
- Page geometry from the PDF; highlight/selection use the text layer aligned to the rasterized page.

### 6.3 Shared pagination behaviors
- Page-turn is instant or a single calm fade (no decorative animation — UX §5; DESIGN-SYSTEM §9).
- Tap zones (mobile): left/right thirds page back/forward (optional, user setting).
- Keyboard: `←/→`, `Space`/`Shift+Space`, `[`/`]` chapter (§17).
- Mode toggle (paginated ↔ scroll) persists per document.

---

## 7. Scrolling

### 7.1 Continuous mode
- Reflowable: a single virtualized vertical flow of blocks.
- Fixed: a virtualized vertical stack of pages.
- Smooth, momentum-respecting; chrome hides on scroll-down, returns on scroll-up (UX §5).

### 7.2 Virtualization (the core perf mechanism)
1. Maintain a **position index**: cumulative heights (estimated, then corrected as measured) per block/page → enables O(log n) "scroll offset ↔ block" mapping.
2. Render only blocks/pages intersecting `[viewportTop − buffer, viewportBottom + buffer]`.
3. Recycle DOM nodes / release page canvases outside the window; replace with spacer elements of the correct estimated height (no scroll-jump).
4. As real heights are measured, reconcile estimates and adjust the spacer + scroll offset to prevent drift.
5. Buffer size adapts to scroll velocity (larger when flinging).

### 7.3 Scroll restoration & jump
- On open, restore to the saved progress locator: resolve locator → block → compute offset → scroll *before paint* where possible (no visible jump).
- Jump-to-locator (TOC, search, citation, bookmark): resolve → ensure block window rendered → smooth or instant scroll → briefly flash-highlight the target span.
- Scroll position persists continuously (debounced) to local store and syncs (§13, §15).

### 7.4 Huge documents
- Position index built incrementally; never measure the whole document up front.
- For very large PDFs, page thumbnails generated lazily for the scrubber.

---

## 8. Search

Two distinct searches; the reader owns only **in-document**.

### 8.1 In-document search (client-side, offline-capable)
**Index build (lazy, on first search per document):**
1. In a Web Worker, build a normalized-text token/position index over the Document Model `text` (the same normalized text used for offsets).
2. Index persisted in the local cache keyed by `(docId, docVersion)` for instant subsequent searches.

**Query:**
1. Tokenize query; match (exact, case/diacritic-insensitive by default; regex + whole-word + case-sensitive as options).
2. Each match → `{blockId, offset, length}` → **locator** (§4.4).
3. Resolve visible matches → overlay marks (search-highlight style, distinct from user highlights).
4. Navigation: next/prev cycles matches in document order; jumps + flashes the active match; count shown ("3 of 47").
- **PDF:** matches map through the text layer to page+quads for on-canvas marking.
- Performance: incremental, debounced; worker-side so the UI never blocks; results stream as found.

### 8.2 Cross-document & semantic search (delegated)
- The reader exposes "search everywhere" → hands off to platform hybrid search (E8). Results carry locators; selecting one opens the target document and jumps to the span (§7.3). The reader's responsibility ends at being a clean landing target.

### 8.3 Search UI
- In-reader find bar (`⌘F`): query, count, next/prev, options. Esc closes, clears marks.
- Matches honor reduced-motion (no animated cycling).

---

## 9. Bookmarks

**Model**

| Field | Type | Notes |
|---|---|---|
| `id` | id | |
| `docId`, `locator` | ref | point locator at the bookmarked position |
| `label` | string? | optional user label; default = nearest heading + page estimate |
| `createdAt` | ts | |

**Behaviors**
- Create: one tap/`b`; optimistic; a subtle ribbon glyph at the position.
- List: per-document bookmark list (in TOC/outline panel) ordered by locator; jump on select (§7.3).
- Sync: standard mutation (LWW; §15). Offline-capable.
- Auto-bookmark (optional setting): the last-read position is always restorable independent of explicit bookmarks (that's progress, §13).

---

## 10. Highlights

### 10.1 Model

| Field | Type | Notes |
|---|---|---|
| `id` | id | |
| `docId`, `locator` | ref | **range** locator |
| `color` | enum | 5 legibility-tested colors (DESIGN-SYSTEM §21) |
| `tag` | string? | optional semantic label (never color-only meaning) |
| `note` | ref? | linked note (§11) |
| `createdAt`, `updatedAt` | ts | |
| `syncState` | enum | synced · pending · orphaned |

### 10.2 Creation flow
1. Selection → toolbar → Highlight (or `h`).
2. Create locator (§4.4); **optimistic render immediately** (no wait); persist to local store + enqueue mutation.
3. Default color applied (no dialog); recolor later.

### 10.3 Rendering (reflow-safe, performant)
- **Primary technique:** the **CSS Custom Highlight API** — register the highlight's Range and style via a `::highlight()` pseudo. This draws highlights *without mutating the content DOM* → no reflow side-effects, excellent perf with hundreds of highlights.
- **Fallback:** an absolutely-positioned overlay layer drawing client-rects per highlight (older engines; PDF uses the overlay/SVG layer over the page canvas with stored quads).
- On reflow/theme/resize: recompute rects (debounced via `requestAnimationFrame`); for the Custom Highlight API, ranges auto-track layout.
- **Overlap handling:** overlapping highlights of the same color merge visually; different colors layer with blended opacity tuned to preserve text contrast in all themes.

### 10.4 Behaviors
- Gutter markers indicate highlights off-screen; click → scroll to it.
- Actions on a highlight: recolor, add note, ask AI, make flashcard, copy-with-citation, delete.
- Global highlights view (cross-document) is a separate surface (E7) consuming the same model.

### 10.5 Performance with many highlights
- Only highlights within the rendered window are resolved to rects; others held as locators.
- Custom Highlight API scales to large counts; overlay fallback caps simultaneously-drawn rects to the window.

---

## 11. Annotations (Notes)

### 11.1 Model

| Field | Type | Notes |
|---|---|---|
| `id` | id | |
| `docId` | ref | |
| `anchor` | locator? | range/point if anchored; null if standalone doc-note |
| `bodyDoc` | CRDT doc | rich text (Yjs) — Markdown + `[[concept]]`/`[[doc]]` links, embedded highlight refs |
| `links` | list | resolved concept/doc/note references (graph integration, E10) |
| `kind` | enum | margin · inline · standalone |
| `createdAt`, `updatedAt`, `authorId` | — | |

### 11.2 Behaviors
- Create from selection (anchored) or standalone; editor opens instantly (local-first).
- **Rich text via CRDT (Yjs)** so concurrent multi-device edits merge conflict-free (§15).
- `[[ ]]` autocomplete resolves to concepts/docs (E10); produces backlinks.
- Anchored notes render as gutter markers; clicking scrolls to the source span and opens the note.
- Actions: convert to flashcard, ask AI to expand/summarize/critique, jump-to-source, delete.
- Margin (tablet/desktop) vs. bottom-sheet (mobile) presentation (UX §6).

### 11.3 Anchoring
Notes use the same locator + re-anchor cascade (§4.3). An orphaned note's anchor surfaces for re-placement; the note body is never lost.

---

## 12. Selection

### 12.1 Reflowable selection
- Use the browser Selection/Range API over the content DOM.
- Map `Range.startContainer/startOffset` → `{blockId, offset}` via the nearest `data-block`/`data-offset` ancestor and intra-block text walking.
- Cross-block selections span multiple blocks → range locator with endpoints in different blocks.

### 12.2 PDF selection
- Selection operates over the **invisible text layer** aligned to the page raster.
- Each text-layer span carries its source text-item index → map to Document Model block/offset.
- **Cross-page selection** (the hard case): in continuous mode the text layers of adjacent pages are siblings; a selection spanning pages yields endpoints on different pages → resolved to a range locator spanning blocks. In single-page mode, cross-page selection is disabled (selection clamps to page).

### 12.3 Selection UX
- On selection settle, raise the compact toolbar (DESIGN-SYSTEM §21 / UX §5): `Highlight · Note · Ask · Explain · Define · Copy`.
- Touch: native selection handles; toolbar above selection, repositioned to avoid the system menu.
- Stylus (tablet): draw-to-highlight gesture maps a stroke across text to a selection → highlight (E16); pen toolbar for color.
- Esc / tap-away clears selection and toolbar.
- Selection survives minor scroll; cleared on navigation.

---

## 13. Reading Progress

### 13.1 Model & computation
- Progress is **locator-based**, expressed as percent = `start.globalOffset / totalChars` (reflowable) or page-weighted equivalent (fixed-layout uses `(pageIndex + intra-page fraction) / pageCount`, but still stores the precise locator).
- This is **stable across reflow** — changing font size never changes your percent (because it's char-based), unlike page-based progress.

**Model**

| Field | Type | Notes |
|---|---|---|
| `docId`, `userId` | ref | |
| `locator` | point | furthest-confident or last-viewed position (configurable) |
| `percent` | float | derived; cached |
| `lastReadAt` | ts | |
| `furthest` | locator | max position reached (for "furthest read") |

### 13.2 Time-left estimation
- Maintain a per-user reading-speed estimate (chars/min) from instrumentation; `timeLeftInChapter = remainingCharsInChapter / speed`. Shown on demand, never as a persistent nag (UX §1).

### 13.3 Instrumentation (invisible)
- Emit batched reading events (`reading.view`, `reading.dwell`, `reading.scroll`, `reading.complete_chapter`) with locators to the learning loop (E12/E13) — captured with zero visible cost; sampled/debounced.
- Progress persists continuously (debounced ~2–5s and on visibility-change/blur) to local store; syncs (§15).

### 13.4 Multi-device
- On open, reconcile local vs. remote progress: take the **furthest** position by default (configurable to "most recent device"); prompt only if positions diverge significantly across devices (e.g., "Continue from page 210 (laptop) or 140 (here)?").

---

## 14. Offline

### 14.1 Local-first store

| Platform | Store |
|---|---|
| Web | IndexedDB (Document Model, annotations, progress, mutation queue, search indices) + Cache API (assets, fonts) + Service Worker |
| Desktop (Tauri) | SQLite (structured data) + filesystem (raw + assets) + local vector cache (offline semantic search) |
| Mobile (Expo) | SQLite + file cache (E16) |

### 14.2 What's cached
- **On open:** the document's Document Model manifest + blocks + assets are cached; subsequent opens are instant and offline.
- **Pinned for offline (explicit):** user can pin documents/collections to guarantee full offline availability (assets fully prefetched).
- **Annotations/progress/bookmarks:** always local-first.

### 14.3 Offline capability matrix

| Capability | Offline? |
|---|---|
| Read a previously opened/pinned document | ✅ |
| Highlight / note / bookmark / progress | ✅ (queued) |
| In-document search | ✅ |
| Read-aloud (platform TTS) | ✅ |
| Open a never-before-opened document | ❌ (needs fetch) |
| AI Q&A / tutor / RAG | ❌ (queued question optional) |
| Cross-document semantic search | ⚠️ desktop only (local vector cache) |
| New ingestion | ❌ |

### 14.4 Eviction
- LRU eviction of unpinned document caches under storage pressure; pinned content never evicted; annotations/progress/mutation-queue never evicted (tiny + critical). Clear, user-visible storage controls in settings.

---

## 15. Sync

### 15.1 Principles
- **Local-first, eventually consistent.** Every mutation applies locally first, enqueues, and syncs in the background. The user never waits on the network to annotate.
- **Per-document logical clock** for ordering; **idempotency keys** on every mutation so replays are safe.

### 15.2 Data types & strategies

| Data | Strategy | Rationale |
|---|---|---|
| Annotations (note bodies) | **CRDT (Yjs)** | concurrent rich-text edits across devices merge conflict-free |
| Highlights, bookmarks | mutation log + **LWW** by `updatedAt` | simple, low-conflict |
| Reading progress | **LWW with max-position bias** | furthest/most-recent wins; rarely conflicts meaningfully |

### 15.3 Sync engine state machine

```
        ┌────────── online, queue empty ──────────┐
        ▼                                          │
     [IDLE] ──mutation──▶ [DIRTY] ──flush──▶ [SYNCING] ──ok──▶ [IDLE]
        ▲                                   │           │
        │                                   │ conflict  │ network error
   reconnect                                ▼           ▼
     [OFFLINE] ◀──lost connection──── [RESOLVING]   [BACKOFF] ──retry──▶ [SYNCING]
```

### 15.4 Flow
1. **Push:** drain the mutation queue in order; server applies idempotently; CRDT updates exchanged as Yjs deltas.
2. **Pull:** delta sync via a per-user `cursor` (changes since cursor) on open + on interval + on reconnect; merge into local store; re-resolve affected annotations onto the view.
3. **Conflict:** CRDT auto-merges note bodies; LWW resolves highlights/bookmarks/progress; truly divergent progress prompts the user (§13.4).
4. **Reconnect:** consolidate — pull deltas, then flush queued mutations; dedupe by idempotency key (mirrors the platform reconnect pattern).

### 15.5 Resilience
- Mutations survive app restarts (persisted queue). Backoff with jitter on failure. A subtle, non-alarming sync indicator; pending items show a "pending" dot; nothing is ever lost offline.

---

## 16. Performance

### 16.1 Budgets (from UX-DESIGN App. B + reader-specific)

| Action | Budget |
|---|---|
| Open cached document (to first paint + position) | instant (< 200 ms perceived) |
| Open uncached (to first readable window) | < 1.5 s on broadband |
| Page turn / scroll frame | 60 fps; no jank on fling |
| Highlight create (optimistic) | < 16 ms (immediate) |
| In-doc search first results | < 200 ms after index built |
| Reflow on font/theme change | < 100 ms for visible window |
| Memory (large PDF) | bounded (page recycling); no unbounded growth |

### 16.2 Techniques
- **Windowed rendering** (§7.2) — never render the whole document.
- **Web Workers** for: parsing (TXT/MD fast-path), search-index build, pagination measurement, PDF rasterization (OffscreenCanvas) — keep the main thread free.
- **Page recycling** for PDF: cap resident page canvases (e.g., visible ± 2); release the rest; re-render on demand.
- **CSS Custom Highlight API** for highlights — avoids DOM mutation cost (§10.3).
- **Debounced reflow recompute** on resize/settings via `requestAnimationFrame`; cache measured break positions keyed by layout inputs.
- **Lazy assets** with aspect-ratio reservations (no layout shift); decode off-thread.
- **Position index** for O(log n) scroll math; incremental height correction without scroll-jump.
- **Prefetch:** next chapter/pages and likely-next assets during idle (`requestIdleCallback`).
- **Cache pre-warm:** on reader open, pre-warm the AI prompt cache for the doc (ARCHITECTURE §16) so the first question is fast — done off the critical render path.

### 16.3 Memory & stability
- Hard caps on resident pages/blocks; explicit teardown on close; leak watchdogs in dev; long-reading-session soak tests in CI (§20).

---

## 17. Accessibility

(Floor: WCAG 2.2 AA; AAA contrast for body reading text — DESIGN-SYSTEM §30.)

- **Semantic content:** reflowable view is real semantic HTML (headings/lists/landmarks) — natively navigable. For **PDF**, the accessible path is the derived **Clean Read** reflowable view (the raster canvas alone is not accessible); the text layer also exposes selectable text to AT.
- **Screen readers:** document landmarks; heading navigation; annotations announced ("highlighted: …", "note on page 84"); the reader content is a labeled region; AI/notes panels are separate regions that **don't steal reading focus or position**.
- **Keyboard (complete):** all navigation/annotation reachable — see shortcut map below; visible focus; logical order; jump-to-TOC, next/previous highlight, find.
- **Read-aloud (TTS):** word/sentence sync-highlighting driven by Document Model text + speech boundary events; speed control; resumes at position.
- **Low-vision / dyslexia:** adjustable size/measure/line-height/letter-spacing; dyslexia font (Atkinson Hyperlegible); reading ruler / focus-line dimming non-current lines; high-contrast + Night themes; honors OS font scaling and 200%+ zoom (reflowable reflows; PDF offers Clean Read at zoom).
- **Reduced motion:** page turns become instant/cross-fade; no scroll animations; search marks don't animate.
- **Color independence:** highlight colors carry optional labels; never color-only meaning; highlight overlays tested to preserve text contrast in every theme.
- **Focus management:** opening the AI panel moves focus to it but preserves and restores reading focus/position on close (assistive-tech users never lose their place).

**Reader keyboard map** (UX §3, §5)

| Key | Action | Key | Action |
|---|---|---|---|
| `←/→`, `Space`/`Shift+Space` | page | `h` | highlight selection |
| `j/k` | line scroll | `n` | note on selection |
| `g g` / `G` | top / end | `/` or `Ask` | AI on selection |
| `[`/`]` | prev/next chapter | `b` | bookmark |
| `o` | outline/TOC | `f` | focus mode |
| `⌘F` | find in document | `+`/`-` | text size |
| `t` | theme | `a` | read-aloud |
| `Esc` | exit overlay/selection | `Tab` | next highlight/annotation (roving) |

---

## 18. Edge Cases

Grouped by area; each lists the handling.

### 18.1 Content / format
- **Scanned (image-only) PDF:** detected at ingestion → OCR branch (E4); if OCR pending, reader shows the raster with a "text features finishing" banner and disables text-dependent actions (search/select/AI) with a tooltip; once OCR lands, the text layer + Document Model activate.
- **Malformed / corrupt file:** ingestion surfaces a clear failure (E5.F3); reader shows a recoverable error (retry/replace/OCR), never a crash.
- **Encrypted / DRM / password PDF:** prompt for password (client-side decrypt where possible); DRM-protected content is rejected at ingestion with a clear message (we don't circumvent DRM).
- **Huge files** (1000+ pages, 100MB+ PDF, multi-MB TXT): windowed everything; incremental index; lazy thumbnails; never load whole into memory.
- **Empty / near-empty document:** render an "empty document" state, not a broken view.
- **Mixed languages / encodings:** normalize to NFC; detect per-block language for TTS/hyphenation.
- **RTL & vertical text:** `direction`/`writing-mode` from the manifest; pagination/scroll honor direction; selection and locators are direction-agnostic (offset-based).
- **Multi-column PDFs:** layout analysis sets reading order in the Document Model; Clean Read renders single-column in correct order; on-page selection still maps via the text layer.
- **Footnotes / endnotes:** rendered as popovers (reflow) or links; anchored as their own blocks; locators resolve to them.
- **Tables / figures / math:** preserved as typed blocks; tables horizontally scrollable; math as MathML/pre-rendered; figures lazy with captions.
- **Very long lines / no whitespace (code, URLs):** wrap/overflow-scroll; never break the layout.
- **Malicious EPUB/MD (script injection, external resource calls):** strict allow-list sanitization; block remote resource loads; sandbox; CSP. (Security — E17.)

### 18.2 Locator / annotation
- **Re-ingestion (`docVersion` bump):** lazy re-resolve via the cascade (§4.3); quote re-anchor self-heals; orphans surface in a recoverable tray; optional background re-anchor job.
- **Orphaned annotation** (content removed/heavily changed): never deleted silently; shown in "couldn't re-locate" tray with the original quote for manual re-placement.
- **Overlapping highlights:** merge (same color) / layer (different colors) with contrast-preserving opacity.
- **Annotation in a not-yet-rendered window:** held as locator; gutter marker indicates off-screen; resolved on scroll into view.
- **Selection spanning blocks/pages:** range locator with cross-block endpoints (§12).
- **Zero-width / collapsed selection:** treated as a point (e.g., bookmark/insertion), not a highlight.

### 18.3 Sync / offline
- **Concurrent edits to one note (multi-device):** CRDT merge — no data loss (§15.2).
- **Conflicting progress across devices:** max-position bias; prompt on large divergence (§13.4).
- **Offline mutation then server-side change:** reconnect consolidation (pull-then-flush, idempotent) reconciles (§15.4).
- **Storage full:** LRU evict unpinned caches; never evict annotations/queue; surface a clear storage notice.
- **Clock skew:** LWW uses server-stamped or logical clocks, not raw device time, to avoid skew bugs.

### 18.4 Rendering / runtime
- **Font load failure:** fall back to system reading font (no blank text); retry in background.
- **Image/figure load failure:** inline placeholder + retry; text reading uninterrupted.
- **Canvas context lost (PDF, GPU reset):** detect and re-render visible pages.
- **Rapid theme/font toggling:** debounced recompute; last-write-wins on layout.
- **Very high DPI / zoom:** render at devicePixelRatio; PDF re-rasterizes at zoom; reflow reflows.
- **Tiny viewport (split-screen):** measure clamps; minimum readable measure enforced; controls collapse.
- **Mid-render navigation away:** cancel in-flight render/index work (abort tokens); no orphaned workers.

### 18.5 AI / cross-feature
- **AI offline:** Ask affordance shows "AI offline — reading & notes still work"; questions can be queued.
- **Citation jump to a re-ingested doc:** citation locator re-resolves via the cascade; flash-highlight on arrival; orphan handling if unresolvable.

---

## 19. Module Contracts (interfaces)

Described as contracts (name · inputs → outputs · purpose). Not code.

### 19.1 FormatAdapter
| Method | Inputs → Outputs | Purpose |
|---|---|---|
| `buildDocumentModel` | rawRef / ingestion payload → DocumentModel | produce canonical model (client fast-path for TXT/MD; consume ingestion output otherwise) |
| `renderDescriptor` | DocumentModel, window → RenderDescriptor | tell the Render Engine how to paint this window (reflow blocks vs PDF pages) |
| `resolveNativeAnchor` | locator → native rects/range | format-native fast-path resolution (CFI/quads) |
| `capabilities` | → { mode, search, select, dualView } | feature flags per format |

### 19.2 LocatorService
| Method | Inputs → Outputs | Purpose |
|---|---|---|
| `fromSelection` | platformRange → Locator | create locator (§4.4) |
| `resolve` | Locator, renderedWindow → Rects \| `orphaned` | three-strategy cascade (§4.3) |
| `compare` | Locator, Locator → ordering | total order |
| `reanchor` | Locator, DocumentModel → Locator | quote-based self-heal after re-ingest |

### 19.3 RenderEngine / Paginator / Scroller
| Method | Inputs → Outputs | Purpose |
|---|---|---|
| `paintWindow` | RenderDescriptor → painted layer | render visible content |
| `paginate` | layoutInputs → page boundaries | reflow pagination (§6.1) |
| `scrollToLocator` | Locator → void | jump + restore (§7.3) |
| `positionToLocator` | scrollOffset → Locator | progress/scroll mapping |

### 19.4 AnnotationEngine
| Method | Inputs → Outputs | Purpose |
|---|---|---|
| `createHighlight/Note/Bookmark` | Locator, attrs → entity (optimistic) | capture (local-first) |
| `renderOverlay` | window, entities → overlay | draw highlights/markers (§10.3) |
| `mutate/delete` | id, change → void | edit; enqueue sync |

### 19.5 InDocSearch
| Method | Inputs → Outputs | Purpose |
|---|---|---|
| `buildIndex` | DocumentModel → index (worker) | lazy, cached |
| `query` | string, options → Locator[] (streamed) | match → locators |

### 19.6 LocalCache / SyncEngine
| Method | Inputs → Outputs | Purpose |
|---|---|---|
| `get/put` | key → record | local-first storage |
| `enqueue` | mutation (idempotent) → void | offline queue |
| `flush/pull` | cursor → applied deltas | sync (§15) |
| `subscribe` | docId → change stream | live multi-device updates |

---

## 20. Telemetry & QA

### 20.1 Telemetry (privacy-respecting; reading events are coarse + sampled)
- **Perf:** open-time (cached/uncached), frame timings, reflow time, search-index build, memory high-water, PDF render time.
- **Reliability:** orphaned-annotation rate, sync conflict rate, mutation-queue depth, failed asset/font loads.
- **Engagement (learning loop):** reading time, completion, dwell, chapter completion — locator-anchored, batched.

### 20.2 Test strategy
- **Unit:** locator creation/resolution/compare; normalization; pagination math; CRDT merge; LWW.
- **Golden corpus:** a curated set of "hard" files (scanned PDF, multi-column paper, RTL EPUB, huge TXT, math-heavy, malformed) — re-render + re-anchor must pass per release (mirrors the ingestion eval corpus, R-2 in ROADMAP §10).
- **Reflow-stability tests:** create annotations, change font/measure/theme/viewport → assert highlights stay on the same text (rect recompute correct, no drift).
- **Re-ingestion tests:** bump `docVersion` with edits → assert quote re-anchor success rate above threshold; orphans correctly surfaced.
- **Sync/offline tests:** offline-mutate on two simulated devices → assert convergence, no loss, idempotent replay.
- **Perf/soak:** long-reading-session memory soak; 1000-page PDF scroll; large-highlight-count render.
- **A11y:** screen-reader walkthroughs (reflow + PDF Clean Read), keyboard-only completion of every action, TTS sync, 200% zoom reflow, reduced-motion.

---

*End of Reader Module Specification v1. The locator system (§4) and the Document Model (§3) are the load-bearing contracts — changes to either require review, as every annotation, search result, citation, and progress marker depends on them. Adding a format = implementing one FormatAdapter (§19.1) against these contracts.*
