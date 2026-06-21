# BookHelper — Complete UX Design

## An AI-First Reading & Knowledge Platform

> **Companion to** [ARCHITECTURE.md](ARCHITECTURE.md). This document defines the experience: how it looks, feels, moves, and responds. It is opinionated by design — a great product needs a point of view, not a menu.
>
> **The promise:** *Beauty, speed, zero clutter.* Reading is sacred; AI is summoned, never imposed. Every surface earns its pixels.

---

## Table of Contents

**Part I — Foundations** (read first; every surface inherits these)
- [F1. Design Philosophy](#f1-design-philosophy)
- [F2. Visual Language](#f2-visual-language)
- [F3. Navigation Model](#f3-navigation-model)
- [F4. The AI Invocation Model](#f4-the-ai-invocation-model)
- [F5. Global Command Palette & Keyboard System](#f5-global-command-palette--keyboard-system)
- [F6. Responsive Strategy](#f6-responsive-strategy)
- [F7. Global State Patterns](#f7-global-state-patterns-loading-empty-error)
- [F8. Global Accessibility Standard](#f8-global-accessibility-standard)

**Part II — The Surfaces**
1. [Dashboard](#1-dashboard)
2. [Book Library](#2-book-library)
3. [Reading Flow](#3-reading-flow)
4. [AI Chat](#4-ai-chat)
5. [Highlights](#5-highlights)
6. [Notes](#6-notes)
7. [Search](#7-search)
8. [Knowledge Graph](#8-knowledge-graph)
9. [Flashcards](#9-flashcards)
10. [Quizzes](#10-quizzes)
11. [AI Tutor](#11-ai-tutor)
12. [Reading Analytics](#12-reading-analytics)
13. [Profile](#13-profile)
14. [Settings](#14-settings)

---

# Part I — Foundations

## F1. Design Philosophy

1. **Reading is sacred.** The reading canvas is the most protected real estate in the product. At rest, it is *just text* — no chrome, no AI buttons, no progress nags. Everything else fades to the edges or disappears entirely.
2. **Summon, don't impose.** AI never interrupts. It waits behind a single, predictable gesture (select text, press a key, tap a quiet affordance). The user always initiates; the system always responds fast.
3. **Progressive disclosure.** A first-time user sees a reader. The graph, tutor, and analytics reveal themselves as the corpus and the relationship deepen. Power is *earned into view*, never dumped at onboarding.
4. **One mental model.** A PDF, a podcast, and a note are all "documents with locatable spans." Highlight, cite, jump-to-source, and ask-about-this behave identically everywhere.
5. **Calm intelligence.** The system is proactive but quiet — the right flashcard, the right connection, surfaced at the right moment, dismissible in one gesture, never a badge-screaming inbox.
6. **Speed is a feature.** Optimistic UI, local-first reads, instant transitions, streamed AI. Nothing user-initiated should feel like it's "loading" if we can help it. Perceived latency < 100 ms for interactions, < 1 s to first AI token.
7. **Trust through provenance.** Every AI claim carries a citation chip → tap to see the exact source span. No ungrounded answers. "I don't find this in your sources" is a respectable, first-class response.

## F2. Visual Language

- **Typography-first.** The product is a typography product. A curated type system: a serif for long-form reading (default), a humanist sans for UI, a mono for code/data, and a dyslexia-friendly option (OpenDyslexic / Atkinson Hyperlegible). Reader controls: size, measure (line length), line-height, letter-spacing, theme.
- **Themes:** Light, Sepia, Dark, Night (true-black OLED). Reading themes are independent of app chrome theme. Respects system `prefers-color-scheme`.
- **Color:** restrained, near-neutral canvas; a single warm accent (used sparingly — selection, active state, AI presence). AI presence has its own subtle visual signature (a soft accent shimmer/gradient) so users instantly recognize "this is the system thinking/speaking" vs. "this is my content."
- **Spacing & rhythm:** generous whitespace, an 8-pt spatial system, a vertical rhythm tied to the reading baseline grid.
- **Motion:** purposeful and restrained. Transitions ≤ 200 ms, easing on natural curves. Panels slide; overlays fade+scale from origin; AI text streams. **All motion respects `prefers-reduced-motion`** (replaced by instant cross-fades). No decorative animation in the reading canvas — ever.
- **Density:** comfortable by default; a compact mode in settings for power users (denser library, smaller chrome).
- **Iconography:** a single coherent line-icon set; icons always paired with text labels on first exposure, icon-only allowed once learned (with tooltips + accessible names).

## F3. Navigation Model

Three zones, one persistent spine.

```
┌────────────────────────────────────────────────────────────────┐
│  ░ App Rail (collapsible)  │           Workspace                 │
│  ┌──────┐                  │                                     │
│  │ Home │  ← Dashboard     │   The active surface renders here.  │
│  │ Lib  │  ← Library       │   Reader takes the FULL workspace   │
│  │ Find │  ← Search        │   (rail auto-collapses in Reader).  │
│  │ Graph│  ← Knowledge     │                                     │
│  │ Learn│  ← Tutor/Cards   │                                     │
│  │ Stats│  ← Analytics     │                                     │
│  ├──────┤                  │                                     │
│  │ ◐ me │  ← Profile/Set   │                                     │
│  └──────┘                  │                                     │
└────────────────────────────────────────────────────────────────┘
```

- **App Rail** (desktop/tablet): a slim, icon-first left rail. Collapsible; auto-collapses in the Reader to protect the canvas. Hover expands to show labels.
- **Reader is a takeover.** When reading, the rail and chrome recede; the page is the interface. A single ambient "⌘K / floating dot" returns you to navigation.
- **Mobile:** rail becomes a bottom tab bar (Home, Library, Search, Learn, Me); Reader hides it behind an upward swipe / tap.
- **Everywhere:** the **Command Palette (⌘K)** is the universal navigator and action surface — the fastest path to any document, action, or surface.

## F4. The AI Invocation Model

AI is *one consistent presence* across every surface, summoned three ways:

1. **Select-to-ask** (in any text — reader, notes, search results): selecting text raises a compact inline toolbar — `Highlight · Note · Ask · Explain · Define`. "Ask" opens the AI panel pre-scoped to the selection with a citation back to it.
2. **The Ask Bar** (`/` or click the ambient AI affordance): a persistent, minimal entry point. Pre-scoped to the current context (this page / this document / whole library — scope is shown and switchable as a chip).
3. **Proactive whispers** (opt-in, calm): subtle, dismissible suggestions ("You read about this 3 months ago — connect it?"), never modal, never more than one at a time, always one gesture to dismiss or pin.

**AI surface chrome (consistent everywhere):**
- A **scope chip** (This page ▾ / This book / This collection / Everything) — always visible so the user knows the AI's knowledge boundary.
- **Streaming** responses with a typing/shimmer indicator; first token target < 1 s.
- **Citation chips** inline `[1]` → hover/tap opens a source popover with the exact quote + "Jump to source."
- **Action affordances** on any AI message: Copy, Save as note, Make flashcard, Add to graph, Retry, Regenerate with more depth.
- **"Stop"** always available mid-stream.

## F5. Global Command Palette & Keyboard System

**Command Palette (`⌘K` / `Ctrl K`):** fuzzy search across documents, actions, settings, and surfaces. Recent + suggested at top. Supports scoped commands (type `>` for actions, `@` for documents, `#` for concepts). This is the power-user backbone and a core a11y path (everything reachable without a mouse).

**Global shortcuts (work everywhere):**

| Key | Action |
|---|---|
| `⌘K` / `Ctrl K` | Command palette |
| `/` | Focus Ask Bar (AI) |
| `g` then `h/l/f/g/t/s` | Go to Home / Library / Find / Graph / Tutor / Stats |
| `⌘\` | Toggle app rail / AI panel |
| `?` | Keyboard shortcut cheatsheet (overlay) |
| `Esc` | Dismiss overlay / panel / selection (progressive: closes innermost first) |
| `⌘,` | Settings |
| `t` | Toggle theme (light/dark) |

Surface-specific shortcuts are listed per surface below. **Discoverability:** `?` opens a searchable shortcut overlay; tooltips show the shortcut on hover; the palette shows shortcuts beside actions.

## F6. Responsive Strategy

Not "shrink the desktop" — three *distinct intents*:

- **Mobile (≤ 640 px) — Reading & capture on the go.** Single column, thumb-reachable controls, bottom sheets for AI/notes, gesture-driven. Optimized for: read a chapter, highlight, ask one question, review flashcards in line. Heavy surfaces (graph, analytics) are simplified, read-mostly views.
- **Tablet (641–1024 px) — The lean-back study device.** Dual-pane: reader + AI/notes side panel. Stylus-first highlighting and margin notes (Apple Pencil/S-Pen). Split view: read on one side, graph/notes on the other. The flashcard/quiz sweet spot.
- **Desktop (≥ 1025 px) — The deep-work cockpit.** Multi-pane, hover affordances, command-palette-driven, keyboard-first. The graph explorer, analytics, and multi-document research live here at full power.

Breakpoints are intent boundaries, not just widths; touch vs. pointer is detected and tunes hit-targets (min 44×44 px touch) and hover behavior independently of width.

## F7. Global State Patterns (Loading, Empty, Error)

These patterns are inherited by every surface; per-surface sections only note deviations.

- **Loading:** **Skeletons that match final layout** (never spinners for content). Reading content streams in progressively (text first, images lazy). AI streams token-by-token. Optimistic rendering for user actions (a highlight appears instantly, reconciles on ack). Spinners only for sub-second indeterminate micro-actions.
- **Empty:** Every empty state is an **invitation, not a void** — one illustration, one sentence of value, one primary CTA, and (where relevant) a sample/demo to try. Never a blank screen with "No data."
- **Error:** **Calm and recoverable.** Plain-language cause + the one action to fix it + Retry. Errors are inline and scoped (a failed AI answer shows in the message, not a global toast that loses your place). Network errors degrade gracefully (local-first reading keeps working). A persistent, non-alarming offline indicator when disconnected. Never a raw stack trace; never blame the user.

## F8. Global Accessibility Standard

Baseline for **every** surface (per-surface sections add specifics):

- **WCAG 2.2 AA** minimum; AAA contrast for body reading text.
- **Full keyboard operability** — every action reachable without a pointer; visible, high-contrast focus rings; logical tab order; focus trapping in modals with restore-on-close.
- **Screen readers:** semantic landmarks, ARIA roles, descriptive names. **AI streaming announced via `aria-live="polite"`** (not spammed per token — announced in sensible chunks). Citations are real links with descriptive labels.
- **Reduced motion:** `prefers-reduced-motion` removes all non-essential animation.
- **Reading accessibility:** adjustable type/measure/spacing, dyslexia fonts, high-contrast and reading-ruler options, text-to-speech (read-aloud with word highlighting).
- **Touch:** ≥ 44×44 px targets; gestures always have a non-gesture equivalent.
- **Color independence:** never color-only signaling (icons/labels accompany); tested for color-blind safety.
- **Respects system settings:** font scaling, contrast, reduced transparency.

---

# Part II — The Surfaces

---

## 1. Dashboard

*The calm home base — "what should I do now?" answered in one glance.*

**User goals**
- Resume what I was reading in one tap.
- See what needs my attention today (reviews due, an unfinished session) without anxiety.
- Re-enter any part of the platform quickly.

**Primary actions**
- **Continue reading** (hero card: current book, exact position, "X min left in chapter").
- **Start today's review** (due flashcards count, FSRS-scheduled).
- **Ask anything** (the Ask Bar, scoped to "Everything").

**Secondary actions**
- Jump to a recent document; open a saved tutor session; view a surfaced cross-source connection ("whisper"); add a new source (upload/connect).

**Empty states**
- *New user:* a warm welcome with a single CTA — **"Add your first book"** — plus an optional 60-second sample document to try AI/highlights on immediately. No dashboard widgets until there's content to fill them.
- *No reviews due:* "You're caught up. ✓ Next reviews: tomorrow" — quiet, positive, no fake urgency.

**Loading states**
- Skeleton cards in the dashboard grid; the "Continue reading" hero loads first (it's the highest-intent action). Counts (reviews, streak) fade in as data resolves.

**Error states**
- A widget that fails to load shows an inline "Couldn't load — Retry" in its own card; the rest of the dashboard remains usable. Never blocks the page.

**Keyboard shortcuts**
- `Enter` on focused hero → resume reading. `r` → start review. `/` → Ask. Number keys `1–9` jump to the corresponding recent item.

**Mobile behavior**
- Vertical stack: Continue-reading hero → Today (reviews/tutor) → Recent → Whispers. Bottom tab bar. Pull-to-refresh.

**Tablet behavior**
- Two-column: hero + Today on the left, Recent + connections on the right.

**Desktop behavior**
- A spacious bento grid; hover reveals quick actions on cards; command palette one keystroke away. The most information-dense (but still calm) version.

**Accessibility**
- Single clear `<h1>`, landmark regions per zone, cards are buttons/links with full labels ("Continue reading *Thinking, Fast and Slow*, 62% complete"). Streak/counts have text equivalents, not just rings.

---

## 2. Book Library

*The user's entire corpus — books, PDFs, papers, articles, podcasts, videos, notes — as one coherent collection.*

**User goals**
- Find a specific source fast.
- See ingestion status (is my upload ready?).
- Organize into collections; browse by recency, progress, or type.

**Primary actions**
- **Add source** (upload, paste URL, connect a service, import) — a single prominent "+ Add."
- **Open a document** (tap/click → Reader).
- **Search/filter** the library.

**Secondary actions**
- Create/edit collections; tag; sort (recent, title, progress, type, date added); switch grid/list/cover view; multi-select for bulk move/delete/export; mark finished; pin.

**Empty states**
- First-run: an inviting drop zone — **"Drag a PDF or EPUB here, paste a link, or connect a service."** Shows supported formats as friendly chips. Offers a sample book to explore the full experience instantly.
- Empty collection: "Nothing here yet — add documents or drag them in."
- Filtered-to-empty: "No sources match — clear filters" (don't show the generic empty state).

**Loading states**
- Cover/skeleton grid. **Ingesting documents show a live progress state** on their card (Parsing → Embedding → Building knowledge → Ready), so the user understands the pipeline isn't a black box. The card is openable for reading as soon as content is parsed, even while enrichment continues (with a subtle "knowledge still building" note).

**Error states**
- Failed ingestion card: clear cause ("Couldn't read this PDF — it may be a scan. Try OCR?") with a one-tap recovery (Retry / Run OCR / Replace file). Failed items are visually distinct but not alarming, and never block the rest of the library.

**Keyboard shortcuts**
- `n` → add source. `/` → search library. Arrow keys navigate grid; `Enter` opens; `Space` quick-look (peek panel); `e` edit metadata; `⌘A` select all; `Del` delete (with confirm).

**Mobile behavior**
- Single/two-column covers; sticky search; filter as a bottom sheet; long-press for multi-select; "+ Add" as a FAB. Quick-look as a bottom sheet.

**Tablet behavior**
- Three-column grid; sidebar for collections; drag-to-collection; quick-look as a side panel.

**Desktop behavior**
- Dense, sortable grid/list with a collections sidebar; drag-and-drop organize; hover reveals progress + quick actions; bulk operations via shift/cmd-select. Inline "quick look" panel without leaving the library.

**Accessibility**
- Cards expose title, author, type, progress, and status as accessible text. Grid is a proper list with arrow-key roving tabindex. Drag-and-drop has a keyboard alternative ("Move to…" menu). Upload progress announced via live region.

---

## 3. Reading Flow

*The crown jewel. The reading canvas, protected above all else, with AI a gesture away.*

**User goals**
- Read comfortably, beautifully, for a long time.
- Capture thoughts (highlight, note) without breaking flow.
- Ask about what I'm reading and get cited answers — without leaving the page.
- Always know (or never have to think about) where I am.

**Primary actions**
- **Read / navigate** (scroll or paginate — user's choice; smooth, instant).
- **Select-to-act** toolbar on text selection: `Highlight · Note · Ask · Explain · Define · Copy`.
- **Ask** (`/` or ambient AI dot) — opens AI scoped to this document / this passage.

**Secondary actions**
- Reading settings (type, theme, measure, spacing); table of contents / outline jump; read-aloud (TTS with word-sync); bookmark; toggle annotation visibility; full-screen/focus mode; adjust scope of AI; share an excerpt.

**Empty states**
- A document with no annotations yet: nothing special shown — the page *is* the experience. (No "you have no highlights" clutter in the canvas.) The margin/annotation gutter is empty and quiet.
- A still-ingesting document: readable immediately; a subtle, dismissible banner — "Knowledge features finishing up…" — disappears when ready; AI scoped to the doc is briefly disabled with a tooltip explaining why.

**Loading states**
- **Text streams in first**, images/figures lazy-load with placeholders matching their aspect ratio (no layout shift). Page position is restored instantly from local cache (you never lose your place). Fonts preloaded to avoid FOUT. Opening a doc feels like turning to a page, not "loading an app."

**Error states**
- A figure/asset fails: inline placeholder with "Couldn't load image — Retry," text reading uninterrupted.
- AI unavailable: the Ask affordance shows a calm "AI is offline — reading and notes still work" state; queued questions can be saved for when connection returns.

**Keyboard shortcuts**
- `←/→` or `Space`/`Shift+Space` page; `j/k` line scroll; `g g` top, `G` end; `h` highlight selection; `n` note on selection; `/` Ask; `b` bookmark; `o` outline/TOC; `f` focus mode; `+/-` text size; `t` theme; `a` read-aloud; `[`/`]` previous/next chapter; `Esc` exits focus/overlays.

**Mobile behavior**
- Pure full-screen reading; chrome hides on scroll-down, returns on tap/scroll-up. Selection raises a compact action bar; "Ask" opens AI as a bottom sheet (swipe up to expand, down to dismiss). Tap zones for pagination (left/right thirds) optional. Brightness/scroll gestures. One-thumb everything.

**Tablet behavior**
- **Dual-pane:** reader + AI/notes side panel that doesn't cover the text. **Stylus-first**: hover-to-preview highlight color, draw to highlight, write margin notes by hand (handwriting → searchable text optional). Split TOC + page.

**Desktop behavior**
- Centered, measure-constrained reading column (never full-bleed text — protects readability) with optional margin gutter for annotations and AI. Side panel for AI/notes slides in without reflowing the reading column (the text column holds its position). Hover reveals annotation handles. Multi-column page view for PDFs optional. Keyboard-driven.

**Accessibility**
- The reading text is real, selectable, semantic text (not images) wherever possible; PDFs expose a text layer. Read-aloud highlights the current word/sentence. Reading ruler and focus-line options. Reflowable text honors OS font scaling. The annotation/AI panels are keyboard-reachable and don't steal focus from reading. **Reading position and any AI panel state are independent** so assistive tech users don't lose place when invoking AI.

---

## 4. AI Chat

*The grounded conversation — Q&A and discussion scoped to the corpus, always cited.*

**User goals**
- Ask questions about what I'm reading (or my whole library) and trust the answers.
- Follow a thread of understanding without losing the source.
- Turn answers into durable knowledge (note, flashcard, graph link).

**Primary actions**
- **Ask** (type or speak; pre-scoped, scope switchable).
- **Read the streamed, cited answer**; tap citation chips to see/jump to source.
- **Act on the answer**: Save as note · Make flashcard · Add to graph · Copy.

**Secondary actions**
- Switch scope (passage / document / collection / everything); change depth ("explain simply" / "go deeper" — maps to model effort); retry/regenerate; branch the conversation; pin a message; voice input; attach another document to the context; view "sources used."

**Empty states**
- Fresh chat: a few **scoped suggested prompts** derived from the current context ("Summarize this chapter," "What's the main argument?," "How does this relate to what I read before?"). Makes the blank box productive, not intimidating.
- Whole-library chat with sparse corpus: gently suggests reading more or asking about the one document present.

**Loading states**
- **Streaming from first token** (< 1 s target). A thinking indicator before the first token for deeper (high-effort) questions, with the scope shown ("Searching across 12 sources…"). Retrieval step is briefly visible for trust ("Found 6 relevant passages"). Citations resolve as they stream.

**Error states**
- *Low grounding:* the system says "I couldn't find this in your sources" and offers to (a) broaden scope, (b) search the web (opt-in), or (c) answer from general knowledge with a clear "not from your library" label. **Never silently hallucinate.**
- *Model error/overload:* the message shows "Couldn't complete — Retry," preserving the question. Fallbacks happen invisibly where possible (per the gateway); only surfaced if all fail.
- *Refusal:* a calm explanation, not a dead end; offers rephrase.

**Keyboard shortcuts**
- `/` focus input; `Enter` send, `Shift+Enter` newline; `⌘Enter` send with deeper effort; `↑` edit last message; `Esc` close panel / stop stream; `⌘.` stop generating; `c` copy focused message; `s` save as note; `f` make flashcard.

**Mobile behavior**
- Bottom-sheet chat over the reader (or full-screen in standalone). Suggested prompts as chips. Voice input prominent (thumb-friendly mic). Citations open as a peek sheet over the chat; "Jump to source" navigates the reader behind it.

**Tablet behavior**
- Persistent side panel beside the reader; citations highlight the source span in the reading pane in real time (the connection between answer and source is *visible*).

**Desktop behavior**
- Docked right panel or floating; conversation history accessible; hover a citation to highlight its source span in the reader; multi-turn threads with branching; "sources used" tray.

**Accessibility**
- Streamed text announced in chunks via `aria-live="polite"`; citations are labeled links ("Citation 1: page 84, *Thinking Fast and Slow*"); the stop control is keyboard-first and always focusable; input has a clear label; voice input has a visible transcript.

---

## 5. Highlights

*Frictionless capture; a beautiful, useful collection.*

**User goals**
- Capture a passage in under a second, without thinking about color or category.
- Find and revisit my highlights across all sources.
- Turn highlights into knowledge (note, flashcard, AI explanation).

**Primary actions**
- **Highlight** (select → `Highlight`, or `h`) — instant, optimistic, default color, no dialog.
- **Browse highlights** (per-document margin list + a global highlights view).
- **Act on a highlight**: add note, ask AI about it, make flashcard, change color/tag.

**Secondary actions**
- Recolor (semantic colors optional: e.g., yellow=key, blue=question, pink=disagree — user-defined, never required); copy with citation; share excerpt; delete; filter by color/tag/document; export (Markdown/CSV/Anki).

**Empty states**
- In-document: empty annotation gutter, no nag.
- Global highlights view (no highlights yet): "Highlights you capture while reading appear here — try selecting any text." With a pointer to the reader.

**Loading states**
- Highlights render optimistically the instant you select (no wait). The global view uses skeleton rows. Cross-device sync indicator if reconciling.

**Error states**
- A highlight that fails to sync shows a subtle "pending" dot, retries automatically, and works offline regardless (local-first). Never lost; never blocks.

**Keyboard shortcuts**
- `h` highlight selection; `1–5` apply color to selection/last highlight; `n` add note to it; `/` ask about it; in the list: `j/k` navigate, `Enter` jump to source, `Del` delete.

**Mobile behavior**
- Select → compact bar → tap Highlight. Long-press a highlight for actions (recolor, note, ask, delete) in a sheet. Global highlights as a filterable list.

**Tablet behavior**
- Stylus: draw across text to highlight; color picker on the pen toolbar. Margin list beside text.

**Desktop behavior**
- Selection toolbar with color swatches on hover; margin gutter shows highlight markers; clicking a marker scrolls to it; global highlights view with rich filtering and bulk export.

**Accessibility**
- Highlight colors are never the only signal — each has an accessible name/label and optional text tag. Highlighted spans are announced ("highlighted: …") to screen readers. Creating/removing a highlight is fully keyboard-driven. Color contrast of highlight overlays maintains text legibility (tested across themes).

---

## 6. Notes

*From a margin scribble to a structured thought — captured in flow, organized later.*

**User goals**
- Jot a thought tied to a passage without leaving the page.
- Write longer, structured notes that link to sources and concepts.
- Find and connect notes across the library.

**Primary actions**
- **Add note** (on selection, or standalone) — opens a lightweight editor anchored to the source locator.
- **Write** (rich text + Markdown; supports `[[concept]]` / `[[document]]` links and `@` mentions).
- **Link** (to a concept in the graph, another note, or a source span).

**Secondary actions**
- Convert a note into a flashcard; ask AI to expand/summarize/critique the note; tag; pin; export; backlink view ("notes that reference this"); template insert.

**Empty states**
- No notes: "Notes you take while reading live here — and link automatically into your Knowledge Graph." Offers "Take a note" and shows the `[[ ]]` linking affordance.
- Empty note editor: ghost prompt "Write a thought… use `[[` to link a concept."

**Loading states**
- Editor opens instantly (local-first). Backlinks/graph links resolve in the background with a subtle loading shimmer on the links section. Autosave with a quiet "Saved" indicator.

**Error states**
- Sync failure: "Saved locally — will sync when online." Edits never lost. A broken `[[link]]` (concept deleted) shows as a soft "unresolved link" with a fix/relink option.

**Keyboard shortcuts**
- `n` new note (on selection or standalone); `⌘B/I/K` bold/italic/link; `[[` concept link autocomplete; `⌘Enter` save & close; `⌘/` toggle Markdown preview; `/` slash-command menu (insert flashcard, callout, etc.).

**Mobile behavior**
- Note editor as a bottom sheet (anchored notes) or full-screen (long notes). Markdown toolbar above the keyboard. `[[` triggers a concept picker sheet.

**Tablet behavior**
- Handwriting (stylus) → optional OCR to text; side-by-side note + source. Split editor and backlinks.

**Desktop behavior**
- Full editor with live backlinks panel, command palette for insertions, multi-note tabs/windows, drag a highlight into a note to embed it with citation.

**Accessibility**
- The editor is a labeled, ARIA-compliant rich-text region; Markdown shortcuts have menu equivalents; `[[ ]]` autocomplete is keyboard-navigable with announced options; anchored notes announce their source ("note on page 84"). Autosave state announced politely.

---

## 7. Search

*Find anything — a phrase, a concept, an idea you half-remember — across the entire corpus.*

**User goals**
- Find an exact phrase or a half-remembered idea fast.
- Search by meaning, not just keywords.
- Jump straight to the source span.

**Primary actions**
- **Search** (one input; **hybrid by default** — keyword + semantic). Results blend exact matches and meaning matches, clearly labeled.
- **Open a result** → jumps to the exact source span, highlighted.
- **Ask instead** (one tap converts the query into a cited AI answer over the same scope).

**Secondary actions**
- Scope (everything / collection / document / type); filter (source type, date, author, has-highlights); sort (relevance / recency); switch between "Passages," "Concepts," "Notes," and "Highlights" result tabs; save a search.

**Empty states**
- Before typing: recent searches + suggested concepts from the graph ("Trending in your library: …"). Productive, not blank.
- No results: "No matches for *X*. Try a broader phrase, or **ask the AI** instead" (offers the semantic/AI fallback explicitly).

**Loading states**
- Instant local results for recent/cached; server hybrid results stream in and re-rank with a subtle "refining…" indicator. Skeleton result rows. No full-page spinner — the input stays responsive (search-as-you-type with debounce).

**Error states**
- Search backend unavailable: falls back to local/cached search with a "showing offline results" note. Clear retry. Never an empty error screen.

**Keyboard shortcuts**
- `⌘K`/`/` open search; type to query; `↑/↓` navigate results; `Enter` open; `⌘Enter` "ask AI with this query"; `Tab` switch result tabs; `Esc` close.

**Mobile behavior**
- Full-screen search; recent + suggestions; result tabs as a segmented control; voice search. Tapping a result opens the reader at the span.

**Tablet behavior**
- Search overlay with results list; preview pane showing the matched span in context.

**Desktop behavior**
- Command-palette-grade speed; results with rich context snippets and source-span preview on hover; multi-tab results (Passages/Concepts/Notes/Highlights); keyboard-only operable end to end.

**Accessibility**
- Search input labeled; results are a navigable list with roving focus; each result announces source + match type ("semantic match, page 12"); the "ask AI" alternative is a clearly labeled control; live region announces result count ("12 results").

---

## 8. Knowledge Graph

*The compounding moat made visible — your concepts, entities, and claims linked across everything you've read.*

**User goals**
- See how ideas across my library connect.
- Explore "where have I encountered this concept?"
- Discover non-obvious links; find prerequisites; spot contradictions.

**Primary actions**
- **Explore** (pan/zoom an interactive graph of concepts/entities/claims; nodes sized by relevance/frequency).
- **Focus a node** → see its connections, sources, and a concept summary panel.
- **Jump to source** from any node/edge (provenance is always one click away).

**Secondary actions**
- Filter by node type (concept/entity/claim), document, time, or collection; switch layouts (force / hierarchy / timeline); "explain this connection" (AI); start a tutor session on a cluster; show prerequisites path; show contradictions; search within graph; pin/expand a subgraph.

**Empty states**
- Sparse corpus: "Your Knowledge Graph grows as you read. Add a few sources and concepts will start connecting." Shows a small illustrative example graph (clearly labeled as a sample). With one document, shows that document's intra-concept graph and invites adding more.

**Loading states**
- Progressive graph build: nodes/edges animate in as they load; a clear "building your graph" state for first-time large libraries (graph extraction is async). Layout settles with a brief, reduced-motion-aware animation, then stabilizes (no perpetual jitter). Side panel content loads on node focus.

**Error states**
- Graph compute failure: "Couldn't build the graph view — Retry," with a fallback to a simple list of top concepts so the user still gets value. Partial graphs render what's available with a note.

**Keyboard shortcuts**
- `f` fit-to-view; `+/-` zoom; arrow keys pan; `/` search nodes; `Enter` focus selected node; `e` expand node's neighbors; `Esc` deselect; `Tab` cycle nodes (keyboard exploration of the graph); `x` explain connection (AI).

**Mobile behavior**
- A **simplified, read-mostly** view: a focused node + its immediate neighbors as a tappable list/radial, not a sprawling canvas (graphs are hard on small screens). Tap a concept → its sources + summary. "Explore in full on a larger screen" hint.

**Tablet behavior**
- Touch pan/zoom/pinch; tap to focus; side panel for node detail; good for casual exploration. Split with the reader to connect reading → graph.

**Desktop behavior**
- The **full power surface**: WebGL-rendered large graph, smooth pan/zoom, multi-select, layout switching, dense filtering, side-by-side detail panel, AI "explain connection." Built for exploration sessions.

**Accessibility**
- A graph is inaccessible to many users by nature, so we provide a **first-class non-visual equivalent**: a structured, navigable tree/list view of the same data ("Concept *X* — connected to 7 concepts, appears in 3 sources") that is fully keyboard- and screen-reader-operable, with the same actions (focus, jump to source, explain). The visual graph is an *enhancement*, not the only way in. Keyboard node-cycling with announced relationships. Never color-only edge typing (line style + labels too).

---

## 9. Flashcards

*Effortless creation, delightful review — the retention engine (FSRS-scheduled).*

**User goals**
- Create cards with near-zero effort (often AI-generated from highlights/notes/concepts).
- Review what's due, fast, with a satisfying rhythm.
- Trust that the schedule is teaching me efficiently.

**Primary actions**
- **Review due cards** (the daily queue — the main loop). Reveal answer → grade (Again / Hard / Good / Easy) → next, snappy.
- **Create card** (manual, or "Make flashcard" from a highlight/note/AI answer — AI drafts front/back, user edits).
- **Generate a deck** (AI proposes a set of cards for a chapter/concept; user accepts/edits in bulk).

**Secondary actions**
- Edit a card; suspend/bury; flag for tutor; see the source span behind a card; reschedule; browse decks; filter (due/new/leech); stats per deck; export to Anki.

**Empty states**
- No cards yet: "Turn what you read into lasting memory. Highlight a passage and tap *Make flashcard*, or let AI draft cards from a chapter." Offers "Generate from a recent highlight."
- No reviews due: "All caught up. ✓ Next due: tomorrow (14 cards)." Calm, positive — *celebrates done*, doesn't manufacture urgency.

**Loading states**
- Review queue preloads the next few cards (zero wait between cards — the rhythm is the product). AI generation streams proposed cards into an editable list with skeletons. The flip animation is instant (or cross-fade under reduced motion).

**Error states**
- AI generation fails: "Couldn't draft cards — Retry," manual creation always available. A card whose source was deleted shows "source removed" but the card still works. Sync failures queue silently (review works offline).

**Keyboard shortcuts**
- `Space` reveal answer; `1/2/3/4` grade (Again/Hard/Good/Easy); `e` edit current card; `s` suspend; `u` undo last grade; `Esc` exit review; in browser: `n` new card, `j/k` navigate, `g` generate with AI.

**Mobile behavior**
- The flagship mobile loop: full-screen card, large thumb-reachable grade buttons (or swipe gestures: up=Easy, right=Good, left=Hard, down=Again — with visible button equivalents). Haptic feedback on grade. Perfect for queue-clearing on the go.

**Tablet behavior**
- Same review loop, larger canvas; deck browser in a sidebar; stylus for editing. Great for sit-down review sessions.

**Desktop behavior**
- Keyboard-driven review (fastest); rich deck management; bulk-edit AI-generated decks; per-card source preview; detailed scheduling controls for power users.

**Accessibility**
- Grade buttons are labeled and keyboard-operable (gestures are an enhancement, never the only way). Reveal/grade flow announced; card content is real text (TTS-readable). Reduced-motion replaces flips with cross-fades. Focus stays on the card through the loop so screen-reader users keep context.

---

## 10. Quizzes

*Active recall and self-assessment — the AI Tutor's checkpoint.*

**User goals**
- Test whether I actually understood a chapter/concept.
- Get immediate, cited feedback on what I got wrong.
- See my gaps feed back into study.

**Primary actions**
- **Start a quiz** (AI-generated from a document/chapter/concept/collection; choose length & type — MCQ, short answer, true/false, cloze).
- **Answer questions** (one at a time or scrollable set).
- **Review results** — score + per-question explanation **with citations** to the source.

**Secondary actions**
- Retake (new questions on the same material); focus a quiz on weak concepts (driven by mastery model); turn missed questions into flashcards; adjust difficulty; ask the tutor to explain a wrong answer; share/export results.

**Empty states**
- No quizzes: "Check your understanding. Generate a quiz from anything you've read." Offers "Quiz me on my last chapter." Requires the document to be ingested (knowledge-ready); if not, explains and offers to notify when ready.

**Loading states**
- Quiz generation shows a brief "Building your quiz from *Chapter 4*…" with skeletons; questions stream in. Submitting an answer gives instant local feedback for objective types; AI-graded short answers stream their evaluation.

**Error states**
- Generation failure: "Couldn't build the quiz — Retry." Grading failure on a short answer: shows the model answer + "couldn't auto-grade, self-assess" fallback so the session isn't blocked. Partial quizzes are recoverable (progress saved).

**Keyboard shortcuts**
- `1–9`/`a–d` select option; `Enter` submit/next; `p` previous; `s` skip; `r` retake; `Esc` exit (with save-progress confirm); on results: `f` flashcard the missed question, `x` explain with tutor.

**Mobile behavior**
- One question per screen, large touch targets, progress bar at top; swipe to advance after answering; results as a scrollable card list with expandable explanations.

**Tablet behavior**
- One- or two-column; question + source-context peek; comfortable for a focused sitting.

**Desktop behavior**
- Single-question focus or full-set view (user choice); keyboard-first answering; results page with per-question source preview on hover and one-click "make flashcards from misses."

**Accessibility**
- Questions/options are proper form controls (radio/checkbox/text) with labels and fieldset grouping; feedback announced via live region; correct/incorrect never color-only (icon + text); timer (if any) is optional and announced/pausable; keyboard-complete.

---

## 11. AI Tutor

*The personal teacher — adaptive, Socratic, grounded in your corpus and your gaps.*

**User goals**
- Learn a topic deeply, guided, not just answered.
- Have the tutor adapt to what I already know and where I struggle.
- Build a real study plan and follow it.

**Primary actions**
- **Start a session** (pick a topic/document/concept, or "teach me what I'm weak on" — driven by the mastery model).
- **Converse** (Socratic dialogue, explanations, worked examples — streamed, cited).
- **Practice on demand** (tutor generates a quick check / flashcards mid-session and folds results back into the plan).

**Secondary actions**
- Choose teaching style (Socratic / explain-then-check / worked-example); set a goal and generate a study plan; adjust pace/depth; review session history; see "what we covered" + "what to review next"; export plan; schedule reviews; jump to any cited source.

**Empty states**
- No sessions: "Your personal tutor teaches from *your* library and adapts to *your* gaps. Pick a topic, or let me choose where you're weakest." Offers a one-tap "Teach me something from my recent reading."
- New user (thin corpus/mastery data): tutor starts by asking what the user wants and reads a document with them, building the mastery model as it goes (graceful cold-start).

**Loading states**
- Session opens with the tutor's first message streaming (warm, oriented: "Let's pick up where you left off in *X*…"). Plan generation shows a structured skeleton (modules → lessons) filling in. Mastery lookups happen invisibly.

**Error states**
- Model/retrieval failure mid-session: "Let me try that again" inline retry; session state preserved (you don't lose the conversation). If grounding is weak for a sub-topic, the tutor says so and points to what to read. Long sessions use context compaction transparently (no "conversation too long" dead ends).

**Keyboard shortcuts**
- `/` focus input; `Enter` send; `⌘Enter` "go deeper"; `q` quick-quiz me now; `f` make flashcard from this; `p` show study plan; `↑` edit last; `Esc` pause session; `s` save/pin insight.

**Mobile behavior**
- Conversational full-screen with quick-reply chips (the tutor offers tappable next steps — "Show me an example," "Quiz me," "Simpler"). Voice conversation mode for hands-free learning (walking, commuting). Plan as a collapsible sheet.

**Tablet behavior**
- Tutor chat + source/whiteboard pane: the tutor can pull up the cited passage or sketch a concept beside the conversation. Stylus to annotate examples. The ideal study device.

**Desktop behavior**
- Multi-pane study cockpit: conversation + study plan + cited sources + live mastery indicator. Branch sessions; deep multi-document research mode; full keyboard control.

**Accessibility**
- Streamed tutor speech announced in chunks; quick-reply chips are real buttons; voice mode has a visible, navigable transcript; the study plan is a structured, navigable list (headings/landmarks); mastery shown as text + visual, never color-only; all "practice" interjections (quiz/cards) inherit those surfaces' a11y.

---

## 12. Reading Analytics

*Honest, motivating insight — not vanity metrics, not surveillance.*

**User goals**
- Understand my reading and learning habits.
- See retention/mastery trends — am I actually learning?
- Stay motivated without being shamed.

**Primary actions**
- **View key trends** (reading time, pages/items, completion, retention/mastery over time, streak).
- **Drill into a metric** (by document, concept, time range).
- **Act on insight** (e.g., "your retention on *X* is slipping → review now").

**Secondary actions**
- Change time range; compare periods; per-document/per-concept breakdown; export data; set goals; toggle which metrics show; see "concepts mastered" and "due soon."

**Empty states**
- Not enough data: "Read a little more and your insights will appear here — usually after your first few sessions." Shows which metrics will populate. Never shows empty charts.

**Loading states**
- Skeleton charts matching final shape; numbers count up briefly (reduced-motion: appear instantly). Heavy aggregations (whole-history) load progressively, most-recent first.

**Error states**
- Analytics pipeline lag/failure: "Insights are catching up — check back shortly," with whatever is available shown. Never blocks; never shows wrong/zeroed data as if real.

**Keyboard shortcuts**
- `1/2/3` switch time range (week/month/year); `Tab` cycle charts; `Enter` drill into focused chart; `e` export; `Esc` back.

**Mobile behavior**
- Vertical stack of focused metric cards (one insight each); swipe between time ranges; tap a card to drill in. Mobile shows the *highlights*, not everything.

**Tablet behavior**
- Two-column dashboard of charts; tap-to-expand; comfortable for review.

**Desktop behavior**
- Full analytics dashboard: rich, interactive charts, cross-filtering, period comparison, per-concept/per-document tables, export.

**Accessibility**
- **Every chart has a text/table equivalent** (accessible via a toggle and to screen readers) — data is never trapped in a visual. Charts have descriptive summaries ("reading time up 12% vs. last week"). Color-blind-safe palettes; trends conveyed by shape/label, not color alone. Goals and streaks have plain-text status. **Framing is non-punitive** — missed days are neutral, never red/shaming.

---

## 13. Profile

*Identity, account, and personal knowledge footprint.*

**User goals**
- Manage who I am and my account.
- See my knowledge footprint (what I've read, learned, mastered) — a sense of growth.
- Control privacy and connected services.

**Primary actions**
- **Edit profile** (name, avatar, reading identity/preferences).
- **View knowledge footprint** (sources read, concepts mastered, streak, milestones — celebratory, not vain).
- **Manage account** (email, password/passkeys, plan, connected services).

**Secondary actions**
- Manage subscription/billing; connected integrations (Notion, Readwise, etc.); export all data; delete account; privacy controls; sign out of devices; achievements/milestones.

**Empty states**
- New user: a friendly profile with a prompt to set an avatar/name and a "your knowledge footprint will grow here" placeholder showing the first milestone to reach ("Finish your first book").

**Loading states**
- Profile header loads first; footprint stats fade in; billing/connections load lazily in their sections.

**Error states**
- Failed save: inline field-level error ("Couldn't update — Retry"), no data loss (form state preserved). Billing fetch failure: "Couldn't load billing — Retry," rest of profile usable.

**Keyboard shortcuts**
- `e` edit; `⌘S` save; `Tab` between sections; `Esc` cancel edit.

**Mobile behavior**
- Single column: header → footprint → account sections as a grouped list; each section drills into its own screen.

**Tablet behavior**
- Two-column: nav of sections + detail pane.

**Desktop behavior**
- Sectioned page (or split nav + content) with the knowledge footprint as a richer visual (mini-graph, milestones, mastery overview).

**Accessibility**
- Standard accessible forms (labels, errors tied to fields via `aria-describedby`); avatar upload keyboard-operable with alt text; footprint stats have text equivalents; destructive actions (delete account) require explicit confirmation with clear consequences stated.

---

## 14. Settings

*Deep control, calm surface — find anything, never feel overwhelmed.*

**User goals**
- Tune reading, AI, learning, privacy, and appearance to my taste.
- Find a specific setting fast.
- Trust that defaults are sensible (most users never come here).

**Primary actions**
- **Search settings** (a search box at the top — settings are deep, so search is primary).
- **Adjust a setting** (instant apply with clear feedback; no "save" for toggles).
- **Navigate categories**: Reading · AI · Learning · Appearance · Notifications · Privacy & Data · Account · Integrations · Accessibility · Shortcuts.

**Secondary actions**
- Reset a section to defaults; preview reading settings live (changes reflect in a sample passage); manage AI provider/model preferences and per-tenant policy (advanced); export/import settings; manage notification cadence (calm by default).

**Empty states**
- N/A (settings always have content), but **search-with-no-match**: "No settings match *X* — browse categories below."

**Loading states**
- Settings render instantly from local prefs (optimistic); server-synced settings reconcile quietly. Account/integration sections lazy-load.

**Error states**
- A setting that fails to persist: reverts with a clear "Couldn't save — Retry," and the previous value is restored (never leaves an ambiguous state). Integration auth failures explain the next step.

**Keyboard shortcuts**
- `⌘,` open settings; `/` search settings; `Tab`/arrows navigate; `Enter` toggle/activate; `Esc` close; `g` then category letter to jump.

**Mobile behavior**
- iOS/Android-style grouped list → category → detail drill-down; search at top; live reading preview on its own screen.

**Tablet behavior**
- Master-detail: category list (left) + settings (right).

**Desktop behavior**
- Persistent category sidebar + content pane; search filters across all categories; live reading preview panel for appearance settings.

**Accessibility**
- A model accessible-forms surface: every control labeled, grouped in fieldsets, with help text; toggles announce state; the **Accessibility category is first-class and prominent** (font, contrast, motion, TTS, reading ruler, dyslexia font, hit-target size); changes announced via live region; keyboard-complete; respects and surfaces OS-level accessibility settings.

---

## Appendix A — Cross-Surface Interaction Principles

| Principle | How it shows up everywhere |
|---|---|
| **Optimistic everything** | Highlights, notes, grades, progress appear instantly; reconcile in background |
| **Local-first** | Reading, annotating, reviewing work offline; sync is invisible |
| **Citations are universal** | Any AI output → citation chip → source span, identically across surfaces |
| **Scope is always visible** | AI always shows its knowledge boundary (page/doc/collection/everything) |
| **One gesture to dismiss** | Esc / swipe-down / tap-away closes the innermost layer, predictably |
| **Capture → knowledge** | Highlight/note/answer → flashcard/graph/quiz is one action everywhere |
| **Calm by default** | No badges screaming, no manufactured urgency, one whisper at a time |
| **Keyboard-complete** | Every action reachable via palette + shortcuts; mouse/touch is an enhancement |

## Appendix B — Motion & Timing Budget

| Interaction | Budget |
|---|---|
| UI interaction feedback (tap/hover/focus) | < 100 ms |
| Page/surface transition | 150–200 ms |
| Panel slide (AI/notes) | ≤ 200 ms, no reading-column reflow |
| First AI token | < 1 s |
| Reader open (cached) | instant (position restored from local) |
| Flashcard advance | instant (preloaded) |
| All animation | disabled/cross-faded under `prefers-reduced-motion` |

## Appendix C — The Anti-Clutter Rules (enforced in design review)

1. The reading canvas at rest shows **only content** — no persistent AI buttons, no progress nags.
2. **One** primary action per surface, visually unambiguous.
3. Never two ways to do the same thing competing for the same space.
4. Secondary actions live behind hover, long-press, `⋯`, or the command palette — never crowd the primary view.
5. No empty state is ever a blank "no data" — always an invitation.
6. No notification without a user-set reason; max one proactive whisper at a time.
7. If a feature isn't relevant to a user's current depth, it isn't shown yet (progressive disclosure).
8. Every pixel of chrome must justify its presence against the reading experience.

---

*End of UX Design v1. This document governs experience decisions; visual specs (final type scale, color values, component states) live in the design system (`packages/design-tokens` + `packages/ui`). Load-bearing UX changes (the AI invocation model, the reading-canvas protection rules, the citation/provenance guarantee) require design review.*
