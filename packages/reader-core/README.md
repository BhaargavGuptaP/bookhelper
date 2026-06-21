# @bookhelper/reader-core

> The format-agnostic **Reader Platform**.
>
> Every future format (PDF, EPUB, Markdown, TXT, DOCX, research papers,
> articles, web pages, podcast transcripts, YouTube, …) plugs into this
> platform through **one** interface: [`DocumentAdapter`](#document-adapter).
> Every future feature (highlights, annotations, AI overlay, knowledge graph,
> learning loop, collaboration, …) hooks in through one interface:
> [`ReaderPlugin`](#plugins).
>
> **This package contains no rendering, no PDF, no EPUB, no Markdown, no
> search, no highlights, no AI.** It only describes — in TypeScript — the
> architecture those things will sit on.

It is the realization of [READER-SPEC.md](../../READER-SPEC.md) §2
(architecture), §4 (locators) and §19 (module contracts).

---

## What's in the box

| Module               | Purpose                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `ReaderEngine`       | Top-level entry point — creates and manages `ReaderSession`s.                       |
| `ReaderSession`      | A single document being read. Holds state, plugins, command/event buses, lifecycle. |
| `ReaderState`        | The single source of truth for everything visible/interactable in the reader.       |
| `ReaderLifecycle`    | Strict state-machine over `idle → opening → ready → closing → closed`.              |
| `ReaderContext`      | The narrow surface a plugin or command handler sees.                                |
| `ReaderEvents`       | Typed pub/sub bus. Plugins observe; they never mutate state directly.               |
| `ReaderCommands`     | Typed command bus with a built-in undo/redo stack.                                  |
| `ReaderPreferences`  | User-facing reading settings (theme/font/zoom/layout).                              |
| `ReaderCapabilities` | Per-adapter feature flags the Reader UI uses to decide what to render.              |
| `DocumentAdapter`    | The format boundary. One per format. The only seam between core and content.        |
| `LayoutEngine`       | Adapter-supplied module that converts a viewport to a window of content.            |
| `NavigationEngine`   | Adapter-supplied module that maps positions/locators to scroll math.                |
| `ReaderPlugin`       | The extension boundary. Highlights, AI, knowledge, learning all become plugins.     |
| `ReaderErrors`       | Typed errors for adapter / lifecycle / command / plugin failures.                   |

---

## The locator model

Every position in every document — selection start, search hit, bookmark,
highlight range, AI citation — uses the same locator shape (READER-SPEC §4):

```
Locator = Point | Range
Point   = { blockId, offset, globalOffset, docVersion, native?, quote? }
Range   = { start: Point, end: Point, docVersion, native?, quote? }
```

This means **no UI code, no plugin, no command, no event** ever has to ask
"what kind of document is this?" — they all speak the same coordinate language.

---

## Plugins

A plugin is a pure object:

```ts
interface ReaderPlugin {
  readonly name: string;
  readonly version: string;
  activate(ctx: ReaderContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
```

A plugin's only powers are what `ReaderContext` exposes — read state,
subscribe to events, dispatch commands, register command handlers,
register its own events. It can never reach inside another plugin or
mutate state directly. This is what lets Sprint 3A's platform host every
future Sprint's feature without coupling.

---

## What this package deliberately does NOT do

- Render PDF / EPUB / Markdown / anything.
- Build search indexes.
- Implement highlights / annotations / bookmarks / TOC.
- Sync to a server, store to IndexedDB / SQLite, or speak to any AI service.
- Import React, the DOM, Node-only APIs, or any rendering library.

Those are the responsibility of later milestones. They will be implemented
as `DocumentAdapter`s and `ReaderPlugin`s built on top of this platform.

If implementation reveals a missing architectural seam, **extend this
platform** — do not work around it in adapters or plugins.

---

## Status

Sprint 3A — Reader Core Platform. Pure interfaces + minimal in-process
runtime (state, lifecycle, event bus, command bus, plugin host).
Fully typed, fully tested, framework-free.
