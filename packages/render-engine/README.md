# @bookhelper/render-engine

Format-agnostic rendering runtime for the BookHelper reader.

## Responsibilities

| Concern                         | Module              |
| ------------------------------- | ------------------- |
| Viewport state                  | `viewport.ts`       |
| Zoom math + clamping            | `zoom.ts`           |
| Page virtualization (windowing) | `virtualization.ts` |
| Page measurements (intrinsic)   | `measurements.ts`   |
| Coordinate mapping              | `coordinates.ts`    |
| Visible-page detection          | `visibility.ts`     |
| Scroll synchronization          | `scroll-sync.ts`    |
| Overlay layers                  | `overlays.ts`       |
| Composite runtime               | `runtime.ts`        |

## What lives here vs not here

| Lives here                                        | Does **not** live here                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Compute which page indices are visible            | Render a PDF page (that is the format adapter's job)                |
| Compute the next zoom step                        | Decide which keyboard shortcut zooms (Reader UI's job)              |
| Translate a scroll position to a `PointLocator`   | Resolve a quote anchor (`@bookhelper/reader-core` adapter contract) |
| Manage a virtualization window with overscan      | Mount React components (Reader UI's job)                            |
| Provide overlay-layer bookkeeping (z-index, etc.) | Draw highlights, annotations, etc. (future plugins)                 |

## Architectural rules

1. **No DOM imports.** Browser globals (`window`, `document`, `requestAnimationFrame`) are accepted via a small `RenderEnvironment` seam so the engine is testable in Node and portable to Tauri/native windows.
2. **No format imports.** Anything format-specific arrives as a `DocumentSession` from `@bookhelper/reader-core`.
3. **No React.** This package is a pure TS runtime. UI bindings live in `@bookhelper/reader-ui`.
4. **No state duplication.** Reader-core's `ReaderStore` is the source of truth; the engine emits change notifications, never owns state.

## Status

Sprint 3C.1 — initial production-grade implementation. Sprint 3C.2 will wire this into `@bookhelper/reader-ui`.
