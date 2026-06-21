# BookHelper — Canonical Feature Specification

> **The company-wide source of truth for every feature.** This document sits **between the PRD and Engineering**: the [PRD](PRD.md) says *what & why*; the deep-dive specs ([ARCHITECTURE](ARCHITECTURE.md), [READER-SPEC](READER-SPEC.md), [AI-ENGINE-SPEC](AI-ENGINE-SPEC.md), [KNOWLEDGE-ENGINE-SPEC](KNOWLEDGE-ENGINE-SPEC.md)) say *how it's built*; this says **exactly what each feature is, does, and must satisfy** — unambiguous enough for engineering, design, QA, product, and AI to implement from the same page.
>
> Organized by **domain** (complementary to the MoSCoW/epic view in [FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md)).
>
> **No code. No database schemas. No API specifications. Product features only.**

---

## Table of Contents
1. [Feature Taxonomy](#section-1--feature-taxonomy)
2. [Library Domain](#section-2--library-domain) *(full exemplar)*
3. [Reader Domain](#section-3--reader-domain)
4. [AI Domain](#section-4--ai-domain)
5. [Knowledge Domain](#section-5--knowledge-domain)
6. [Learning Domain](#section-6--learning-domain)
7. [Collaboration Domain](#section-7--collaboration-domain)
8. [Search Domain](#section-8--search-domain)
9. [Personalization Domain](#section-9--personalization-domain)
10. [Analytics Domain](#section-10--analytics-domain)
11. [Platform Domain](#section-11--platform-domain)
12. [Future Platform](#section-12--future-platform)
13. [Cross-Feature Rules](#section-13--cross-feature-rules)
14. [Feature Dependencies](#section-14--feature-dependencies)
15. [Feature Lifecycle](#section-15--feature-lifecycle)

---

# SECTION 1 — Feature Taxonomy

### 1.1 The seven-level hierarchy

```
Platform ─▶ Domain ─▶ Module ─▶ Feature ─▶ Subfeature ─▶ Capability ─▶ Interaction
```

| Level | Definition | Example | Answers the question… |
|---|---|---|---|
| **Platform** | The whole product — one coherent surface family | BookHelper | "What are we building?" |
| **Domain** | A major area of user value with its own conceptual model + (usually) an owning team | Reader | "Who owns this area?" |
| **Module** | A cohesive grouping of features within a domain | Annotation | "What's the natural feature cluster?" |
| **Feature** | A discrete, user-facing capability with its own spec record | Highlights | "What does the user get?" (the unit of this doc) |
| **Subfeature** | A meaningful part of a feature | Highlight colors | "What's a shippable slice of the feature?" |
| **Capability** | A specific thing a subfeature can do | Recolor a highlight | "What can the user accomplish?" (the unit of estimation) |
| **Interaction** | The atomic user action that triggers a capability | Long-press highlight → swatch → tap color | "What does the user actually do?" (the unit of QA) |

**Worked example:** `BookHelper (Platform) → Reader (Domain) → Annotation (Module) → Highlights (Feature) → Highlight Colors (Subfeature) → Recolor (Capability) → long-press a highlight, pick a swatch (Interaction).`

### 1.2 Why this taxonomy

Each level maps to a distinct organizational need, so one structure serves everyone:
- **Domain → team ownership** (a domain has an owning squad — see §15). Conway's-law-aligned.
- **Module → roadmap grouping** (what ships together as a coherent slice).
- **Feature → the spec record** (the unit of this document; the unit of design + the PR-sized chunk).
- **Capability → estimation** (the unit a planner sizes; what a sprint task covers).
- **Interaction → QA** (the unit a test case verifies; every interaction is a testable assertion).

It scales: new value attaches at the right altitude (a whole new Domain like Collaboration; a new Feature in an existing Module; a new Capability on an existing Feature) without reorganizing the rest. It prevents the two classic failures — features with no home (taxonomy gap) and features that overlap (duplication), both caught by the anti-sprawl gate (§15).

### 1.3 The canonical feature-record template

Every **Feature** in this document is specified with these fields (Library §2 shows all nine in full as the exemplar; other domains use the compact record, which folds States/Constraints into Rules — every field remains recoverable and the full template applies to all features in the tracker):

`Purpose · User Story · States · Rules · Constraints · Dependencies · Acceptance Criteria · Edge Cases · Future Enhancements`

### 1.4 Global baselines (inherited by every feature; records note only deltas)

- **Baseline States (BS):** `empty · loading · ready · error · offline · syncing · disabled`. Capture/edit features add `pending` (optimistic, reconciles on sync). Per [UX-SPECIFICATION §4.0](UX-SPECIFICATION.md): skeleton loading, inviting empty, calm-recoverable error, local-first offline.
- **Baseline Acceptance Criteria (BAC):** keyboard-operable + screen-reader labeled (WCAG 2.2 AA; AAA reading text) · works in light/dark/high-contrast · optimistic + never loses user work · tenancy-isolated (own data only) · traced/observable · designed empty/loading/error states · within perf + motion budgets (Atlas/UX App).
- **Baseline Constraints (BC):** user accesses only their own data · AI-touching features draw on the user's quota + rate limits and pass safety/eval gates · respects perf budgets · honors per-tenant policy where applicable.
- **Baseline Dependencies:** all features depend on **Authentication + Tenancy** (§11) and the **Design System** (Atlas). Records list only *additional* dependencies.

### 1.5 The domains

`Library · Reader · AI · Knowledge · Learning · Collaboration · Search · Personalization · Analytics · Platform` (current) + `Future Platform` (directional). Each domain below.

---

# SECTION 2 — Library Domain

*The home of the entire corpus: import, organize, find, manage sources.* **Owning team:** Reading squad. **Modules:** Intake · Organization · Management · Continuity.

> Specified in full nine-field depth (the canonical exemplar). BS/BAC/BC = global baselines (§1.4).

### 2.1 Book Import *(Intake)*
- **Purpose:** Get any supported source into the platform effortlessly and start reading ASAP.
- **User Story:** *As a reader, I want to add a source by drag-drop, file picker, or pasting a URL so that I can start reading immediately.*
- **States:** BS + `validating · uploading(progress) · ingesting(stepped: Parsing→Embedding→Building knowledge→Ready) · readable-but-enriching · ready · failed(recoverable)`.
- **Rules:** readable the moment parsed (don't wait for knowledge); transparent stepped progress; one "Add" entry point everywhere; supported formats (PDF/EPUB/MD/TXT v1).
- **Constraints:** BC + max file size per plan tier; large files upload direct-to-storage (never block UI); per-tier source limit (freemium).
- **Dependencies:** Storage (§11), Ingestion pipeline (Architecture E4), Duplicate Detection (§2.13).
- **Acceptance Criteria:** BAC + drag-drop/file/URL all work · progress visible · document openable when parsed while enrichment continues · failure is recoverable without blocking the library.
- **Edge Cases:** unsupported format (message + suggestion); corrupt file (retry/replace); scanned PDF (OCR offered); network drop (resumable); over quota (clear upgrade path).
- **Future Enhancements:** bulk/folder import; email-to-library; mobile share-sheet; connectors (Readwise/Drive/Notion); paste raw text.

### 2.2 Collections *(Organization)*
- **Purpose:** User-defined, nestable groupings of sources (by topic/project/course/client) that also act as an AI/Search scope.
- **User Story:** *As a user with a large library, I want to group sources into (nestable) collections so that my library stays organized and I can scope AI/search to a topic.*
- **States:** BS + `editing · reordering`.
- **Rules:** nestable; a source may belong to multiple collections; a collection is a first-class scope for AI + Search; drag or menu to add (keyboard-accessible).
- **Constraints:** BC + reasonable nesting depth.
- **Dependencies:** Book Import; Search scope; AI scope.
- **Acceptance Criteria:** BAC + create/rename/nest/delete · add/remove sources via drag or menu · scope AI/search to a collection · keyboard-accessible reorganize.
- **Edge Cases:** deleting a non-empty collection (confirm; sources remain in library); a source in many collections (handled, not duplicated); deep nesting (UI stays usable).
- **Future Enhancements:** smart/rule-based collections; shared/team collections; collection-level analytics; templates.

### 2.3 Folders *(Organization)*
- **Purpose:** A simpler hierarchical organization for users who prefer file-system mental models (folders are the structural skeleton; collections are flexible/overlapping).
- **User Story:** *As a user who thinks in folders, I want a folder hierarchy for my sources so organization feels familiar.*
- **States:** BS + `editing · reordering`.
- **Rules:** a source lives in exactly one folder (vs. many collections); folders nest; folders and collections coexist (folder = home; collections = cross-cutting tags-as-groups). *Decision: ship Collections first; Folders are a `[COULD]` simplification if user research shows demand.*
- **Constraints:** BC.
- **Dependencies:** Book Import; Collections (conceptual coexistence).
- **Acceptance Criteria:** BAC + create/nest/move; a source has one folder; move updates everywhere.
- **Edge Cases:** moving a folder with children; deleting a folder (move-children-up vs. trash, user choice).
- **Future Enhancements:** unify folders + collections behind one mental model if research favors it.

### 2.4 Tags *(Organization)*
- **Purpose:** Lightweight, many-to-many labels for cross-cutting categorization + filtering.
- **User Story:** *As a user, I want to tag sources (and notes/highlights) so I can filter and find by my own categories.*
- **States:** BS + `editing`.
- **Rules:** many-to-many; user-defined + suggested (from Knowledge concepts); color/label optional (never color-only meaning); filterable.
- **Constraints:** BC.
- **Dependencies:** Filtering (§2.11); Knowledge (suggested tags).
- **Acceptance Criteria:** BAC + create/apply/remove tags · filter library by tag · tag autocomplete.
- **Edge Cases:** orphaned tag (no sources); renaming a tag updates all uses; many tags (manageable list).
- **Future Enhancements:** auto-tagging from extracted concepts; tag hierarchies; shared tag vocabularies.

### 2.5 Favorites *(Organization)*
- **Purpose:** One-tap mark a source as a favorite for quick access.
- **User Story:** *As a user, I want to favorite sources I return to often so they're one tap away.*
- **States:** BS + `pending`.
- **Rules:** boolean per source; a "Favorites" smart view; instant/optimistic.
- **Constraints:** BC.
- **Dependencies:** Library views.
- **Acceptance Criteria:** BAC + toggle favorite (instant) · Favorites view lists them.
- **Edge Cases:** favoriting a not-yet-ready source (allowed).
- **Future Enhancements:** favorite collections/concepts too.

### 2.6 Recent *(Continuity)*
- **Purpose:** Surface recently opened sources for fast resumption.
- **User Story:** *As a returning user, I want to see what I recently read so I can jump back in.*
- **States:** BS.
- **Rules:** ordered by last-opened; auto-maintained; appears on Home + a Recent view.
- **Constraints:** BC + privacy (clearable).
- **Dependencies:** Reading History (§2.18).
- **Acceptance Criteria:** BAC + recent list reflects actual last-opened order, cross-device.
- **Edge Cases:** deleted source drops from recent; cleared history empties it.
- **Future Enhancements:** "recently in this collection"; recent across content types.

### 2.7 Pinned *(Organization)*
- **Purpose:** Keep important sources at the top regardless of sort.
- **User Story:** *As a user, I want to pin key sources so they stay visible.*
- **States:** BS + `pending`.
- **Rules:** pinned sources sort above others; visual pin indicator; distinct from favorites (pin = position; favorite = a list).
- **Constraints:** BC + reasonable pin count.
- **Dependencies:** Sorting (§2.11).
- **Acceptance Criteria:** BAC + pin/unpin (instant) · pinned stays atop sort.
- **Edge Cases:** many pins (UI degrades gracefully); pin + sort interaction is clear.
- **Future Enhancements:** pin collections; pin to Home.

### 2.8 Archive *(Management)*
- **Purpose:** Remove finished/inactive sources from the main view without deleting them.
- **User Story:** *As a user, I want to archive sources I'm done with so my library stays focused but nothing is lost.*
- **States:** BS + `archived`.
- **Rules:** archived sources hidden from default views, retained fully (data, annotations, knowledge intact), restorable; an Archive view.
- **Constraints:** BC.
- **Dependencies:** Library views; Trash (distinct — archive ≠ delete).
- **Acceptance Criteria:** BAC + archive/restore (no data loss) · archived excluded from default library + search-by-default (toggle to include).
- **Edge Cases:** archiving mid-read (keeps progress); search including archived (opt-in).
- **Future Enhancements:** auto-archive on finish (optional); archived-knowledge still queryable.

### 2.9 Trash *(Management)*
- **Purpose:** A safety net before permanent deletion.
- **User Story:** *As a user, I want deleted sources to go to trash first so I can recover from mistakes.*
- **States:** BS + `trashed · purging`.
- **Rules:** delete → trash (recoverable for N days, e.g., 30) → auto-purge or manual empty → cascade delete (blobs/vectors/graph); also an immediate Undo toast on delete (§13).
- **Constraints:** BC + retention window.
- **Dependencies:** Delete flow; cascade deletion (Knowledge re-link).
- **Acceptance Criteria:** BAC + delete → trash → restore works fully · purge cascades everywhere · auto-purge after window.
- **Edge Cases:** restore after partial cascade; purge of a source referenced by flashcards/citations (graceful — cards still work, citations show "source removed").
- **Future Enhancements:** configurable retention; bulk restore.

### 2.10 Bulk Operations *(Management)*
- **Purpose:** Act on many sources at once.
- **User Story:** *As a user with many sources, I want to multi-select and act in bulk so management isn't tedious.*
- **States:** BS + `selection-mode · acting(progress)`.
- **Rules:** multi-select (shift/cmd, long-press on touch); a floating bulk-action bar; actions: move/tag/favorite/archive/delete/export; keyboard-operable.
- **Constraints:** BC + bulk-action progress for large sets.
- **Dependencies:** Collections, Tags, Archive, Trash, Export.
- **Acceptance Criteria:** BAC + multi-select via mouse/keyboard/touch · bulk move/tag/archive/delete/export with progress · partial-failure reported (what succeeded).
- **Edge Cases:** huge selection (batched, progress); mixed-state selection (e.g., some already archived); bulk delete → single Undo.
- **Future Enhancements:** saved bulk-action presets; bulk re-ingest.

### 2.11 Sorting & Filtering *(Organization)*
- **Purpose:** Order and narrow the library to find sources fast.
- **User Story:** *As a user, I want to sort and filter my library so I can find any source quickly.*
- **States:** BS + `filtered · filtered-empty`.
- **Rules:** sort by recency/title/author/progress/date-added/type; filter by type/tag/collection/progress/has-highlights/status; combinable; persisted per view.
- **Constraints:** BC + performant on large libraries (virtualized).
- **Dependencies:** Tags, Collections, Reading History.
- **Acceptance Criteria:** BAC + sort + multi-filter combine correctly · filtered-empty shows "clear filters" (not generic empty) · fast on large libraries.
- **Edge Cases:** filter to empty; conflicting filters; sort + pin interaction clear.
- **Future Enhancements:** saved filter views (smart collections); natural-language filters.

### 2.12 Sync *(Management)*
- **Purpose:** The library (and all derived data) is identical and current across devices.
- **User Story:** *As a multi-device user, I want my library, progress, and annotations to sync invisibly so everything is everywhere.*
- **States:** BS + `syncing · conflict(rare) · offline-queued`.
- **Rules:** local-first; background sync; annotations merge conflict-free (CRDT); progress LWW+max-position; idempotent replay; subtle sync indicator.
- **Constraints:** BC + no data loss; works offline (queue).
- **Dependencies:** Platform Sync (§11), Offline (§11).
- **Acceptance Criteria:** BAC + changes on one device appear on others · offline changes replay on reconnect with no loss/dup · annotations merge without conflict.
- **Edge Cases:** divergent progress (prompt on large gap); long offline; clock skew (logical clocks).
- **Future Enhancements:** selective sync; sync status detail; real-time presence (Collaboration).

### 2.13 Duplicate Detection *(Intake)*
- **Purpose:** Avoid reprocessing/storing the same source twice.
- **User Story:** *As a user, I want re-adding a source I already have to be recognized so I don't get duplicates or waste processing.*
- **States:** BS + `duplicate-detected`.
- **Rules:** content-hash dedupe on import; "already in your library — open it?" prompt; near-duplicate (same book, different edition) flagged as a soft suggestion, not auto-merged.
- **Constraints:** BC.
- **Dependencies:** Book Import.
- **Acceptance Criteria:** BAC + identical file detected + not reprocessed · user offered to open existing.
- **Edge Cases:** same content different filename (detected by hash); different edition (soft suggestion only); intentional re-add (allowed with confirm).
- **Future Enhancements:** edition merging; cross-format dedupe (same book as PDF + EPUB).

### 2.14 Metadata Editing *(Management)*
- **Purpose:** Correct/enrich source metadata (title, author, etc.).
- **User Story:** *As a user, I want to edit a source's title/author/metadata so my library is accurate.*
- **States:** BS + `editing · saving`.
- **Rules:** edit title/author/type/tags/cover; auto-extracted metadata is editable; changes reflect in library/search/citations.
- **Constraints:** BC.
- **Dependencies:** Book Covers (§2.15), Search index.
- **Acceptance Criteria:** BAC + edits persist + propagate to library/search/citations.
- **Edge Cases:** failed save (revert, no loss); editing during ingestion (queued).
- **Future Enhancements:** auto-enrich from external metadata sources; batch metadata edit.

### 2.15 Book Covers *(Management)*
- **Purpose:** Visual recognition of sources.
- **User Story:** *As a user, I want recognizable covers so I can scan my library visually.*
- **States:** BS + `generating · custom`.
- **Rules:** use embedded/source cover when available; else auto-generate a clean typographic cover (title+author on a deterministic tint); user can replace with a custom image.
- **Constraints:** BC + cover image ratio 2:3.
- **Dependencies:** Metadata Editing.
- **Acceptance Criteria:** BAC + every source has a cover (real or generated) · custom upload works · no broken-image states.
- **Edge Cases:** missing cover (generated, never blank); low-res cover (handled).
- **Future Enhancements:** AI-generated thematic covers; cover themes.

### 2.16 Recently Added *(Continuity)*
- **Purpose:** Surface newly imported sources.
- **User Story:** *As a user, I want to see what I just added so I can start on new material.*
- **States:** BS.
- **Rules:** ordered by date-added; a smart view + a Home rail; distinct from Recent (opened).
- **Constraints:** BC.
- **Dependencies:** Book Import.
- **Acceptance Criteria:** BAC + reflects add-order; shows ingest status.
- **Edge Cases:** bulk import (grouped); failed-ingest item visible + recoverable.
- **Future Enhancements:** "added but not started" nudge.

### 2.17 Continue Reading *(Continuity)*
- **Purpose:** One-tap resume of in-progress sources at the exact position.
- **User Story:** *As a reader, I want to resume exactly where I left off so I never lose my place.*
- **States:** BS + `position-restoring`.
- **Rules:** the hero action on Home; lists in-progress sources by last-read; opens at exact locator position; cross-device furthest-position.
- **Constraints:** BC.
- **Dependencies:** Reading Progress (§3), Reading History.
- **Acceptance Criteria:** BAC + resume opens at the exact saved position (instant from cache) · cross-device.
- **Edge Cases:** divergent multi-device position (prompt); finished source (drops from continue).
- **Future Enhancements:** "time left" + smart "what to read next."

### 2.18 Reading History *(Continuity)*
- **Purpose:** A record of what was read and when (feeds Recent, Continue, Analytics).
- **User Story:** *As a user, I want my reading history tracked so the product can resume, recommend, and report honestly.*
- **States:** BS + `clearable`.
- **Rules:** per-source last-opened + session log; privacy-respecting; user-clearable; feeds Recent/Continue/Analytics.
- **Constraints:** BC + privacy (clear history; not used for ads).
- **Dependencies:** Reading Sessions (§3), Analytics (§10).
- **Acceptance Criteria:** BAC + history accurately powers Recent/Continue/Analytics · user can clear it.
- **Edge Cases:** cleared history (graceful); deleted source removed from history.
- **Future Enhancements:** history search; "on this day" reading memories.

### 2.19 Storage Management *(Management)*
- **Purpose:** Visibility + control over local (offline) and account storage.
- **User Story:** *As a user, I want to see and manage storage so the app stays fast and within limits.*
- **States:** BS + `near-full · full · evicting`.
- **Rules:** show account usage (per plan) + local offline cache usage; pin docs for offline; LRU-evict unpinned cache under pressure (never annotations/queue); clear storage controls.
- **Constraints:** BC + per-plan account storage; device storage limits.
- **Dependencies:** Offline (§11), Storage (§11).
- **Acceptance Criteria:** BAC + usage visible · pin-for-offline works · eviction protects annotations/queue · near-full/full handled gracefully.
- **Edge Cases:** device storage full (notice + manage, no data loss); account over quota (upgrade path; reading still works).
- **Future Enhancements:** per-collection offline pinning; storage insights.

### 2.20 Library Future Expansion *(directional)*
Smart collections (rule-based) · shared/team libraries · reading queues/playlists · cross-content-type library (papers/podcasts/videos as first-class) · import connectors · library-level AI ("summarize my Psychology shelf"). (Cross-ref §12.)

---

# SECTION 3 — Reader Domain

*Read any source: calm, fast, annotatable. The product's soul.* **Owning team:** Reading squad. **Modules:** Rendering · Navigation · Annotation · Rich Content · Session · Preferences. (Technical depth: [READER-SPEC](READER-SPEC.md); interactions: [UX-SPEC §5](UX-SPECIFICATION.md).)

> Compact record: **Purpose · Capabilities/Interactions · Rules · Deps · AC · Edge · Future.** BS/BAC/BC inherited.

### 3.1 Reader Modes
- **Purpose:** Let the user read the way that suits them + the source.
- **Capabilities:** Page mode (paginated, book-like, two-page spread on wide) · Continuous Scroll (virtualized flow) · Focus Mode (`f`, dims all but current paragraph) · Study Mode (reader + knowledge sidebar) · Split View (reader + AI/notes/graph/second doc, resizable).
- **Rules:** mode persists per document; switching preserves exact position; reader column never reflows when a panel opens.
- **Deps:** Rendering, Annotation, AI/Knowledge panels.
- **AC:** BAC + each mode renders + restores position correctly · switching modes keeps position · Focus dims non-current content · Split resizes without canvas reflow.
- **Edge:** huge doc in scroll (virtualized); split on small screen (collapses to one + switcher).
- **Future:** multi-doc split; per-genre default modes.

### 3.2 Pagination
- **Purpose:** Discrete, book-like page turns.
- **Capabilities:** turn (←/→, Space, tap-zones) · two-page spread (wide) · page-of-N estimate · jump to page.
- **Rules:** instant or single calm fade; page identity = locator (reflowable "page X" is an estimate); never persist page number as position.
- **Deps:** Rendering, Reading Progress.
- **AC:** BAC + turns are instant/smooth · position is a stable locator · spread on wide screens.
- **Edge:** reflowable repagination on font change (position preserved); last page.
- **Future:** page-flip animation option; PDF page-fit modes.

### 3.3 Continuous Scroll
- **Purpose:** Smooth uninterrupted reading.
- **Capabilities:** virtualized vertical flow · momentum scroll · scroll-linked progress · chrome auto-hide on scroll-down.
- **Rules:** windowed rendering (never full-DOM); position index for jump/restore; no layout shift.
- **Deps:** Rendering (virtualization).
- **AC:** BAC + 60fps on large docs · no jump on height correction · chrome hides/returns.
- **Edge:** 1000-page PDF (bounded memory); fling (adaptive buffer).
- **Future:** mini-map scrubber; reading-speed-aware prefetch.

### 3.4 Focus Mode
- **Purpose:** Maximum-concentration, distraction-free reading.
- **Capabilities:** dim non-current paragraph(s) · optional line ruler · enter/exit (`f`/`Esc`).
- **Rules:** everything but the active region recedes; opt-in; persists per session.
- **Deps:** Reader Modes.
- **AC:** BAC + only current region emphasized · exits cleanly preserving position.
- **Edge:** very short content; rapid scrolling in focus.
- **Future:** typewriter scrolling; ambient focus timer.

### 3.5 Split View
- **Purpose:** Work across two surfaces simultaneously (tablet/desktop).
- **Capabilities:** reader + (AI / notes / graph / second document) · resizable divider · keyboard-resizable.
- **Rules:** reader column never reflows; sensible default + reset; collapses to single + switcher on small screens.
- **Deps:** Reader Modes, AI/Knowledge/Notes panels.
- **AC:** BAC + panes resize without canvas reflow · reset works · mobile collapses.
- **Edge:** tiny viewport (min readable measure enforced).
- **Future:** 3-pane on ultra-wide; saved layouts.

### 3.6 Table of Contents (TOC)
- **Purpose:** Navigate a source's structure.
- **Capabilities:** slide-in outline · current-section highlight · nested/collapsible · jump (+ flash) · includes bookmarks (+ Study-mode concept counts).
- **Rules:** `o` toggles; jump scrolls + flashes target.
- **Deps:** Document Model (structure), Bookmarks.
- **AC:** BAC + TOC reflects structure · jump lands + flashes · current section tracked.
- **Edge:** no TOC in source (generate from headings); deeply nested.
- **Future:** TOC search; reading-progress per section.

### 3.7 Bookmarks
- **Purpose:** Mark positions to return to.
- **Capabilities:** create (`b`/tap) · list (in TOC) · jump · sync.
- **Rules:** instant ribbon glyph; ordered by locator; last-read auto-restores independent of bookmarks.
- **Deps:** Locators, Sync.
- **AC:** BAC + one-tap create · list + jump · syncs · survives re-ingestion (re-anchor).
- **Edge:** bookmark in re-ingested doc; many bookmarks.
- **Future:** labeled bookmarks; bookmark folders.

### 3.8 Highlights
- **Purpose:** Frictionless passage capture.
- **Capabilities:** select→highlight (`h`, instant/optimistic) · 5 colors · recolor · gutter markers · per-doc + global views · actions (note/ask/flashcard/copy-with-citation).
- **Rules:** default color no-dialog; survives reflow/theme/resize/re-ingestion; colors carry optional labels (never color-only).
- **Deps:** Selection, Locators, Sync.
- **AC:** BAC + instant highlight · survives reflow + re-ingest · convertible to flashcard/ask in one action · offline-tolerant.
- **Edge:** overlapping (merge/layer, contrast-safe); cross-page; sync fail (pending, never lost); orphan on re-ingest (surfaced).
- **Future:** semantic color tags; export; auto-highlights ("key passages").

### 3.9 Annotations (Notes)
- **Purpose:** Capture thoughts tied to the source.
- **Capabilities:** anchored + standalone notes · rich text + Markdown · `[[concept]]`/`[[doc]]` links + backlinks · gutter markers · jump-to-source · handwriting (stylus → OCR).
- **Rules:** autosave (local-first, never lost); margin (desktop) / sheet (mobile).
- **Deps:** Selection, Locators, Knowledge (links), Sync.
- **AC:** BAC + anchored note jumps to source · autosaves offline · `[[ ]]` resolves + backlinks · concurrent edits merge.
- **Edge:** broken link (fixable); orphaned anchor (body preserved); huge note (fast).
- **Future:** templates; AI expand/critique; note graph.

### 3.10 Text Selection
- **Purpose:** Select text to act on it (the gateway to highlight/note/ask/define).
- **Capabilities:** select (mouse/keyboard/touch handles/stylus draw) · floating toolbar (Highlight·Note·Ask·Explain·Define·Copy) · cross-block + cross-page (continuous PDF).
- **Rules:** toolbar above selection, repositioned to avoid system menus; Esc/tap-away clears; survives minor scroll.
- **Deps:** Rendering, Locators.
- **AC:** BAC + selection → toolbar · maps to a locator · cross-block works · touch + stylus supported.
- **Edge:** zero-width selection (point, not highlight); selection across page boundary.
- **Future:** smart selection (sentence/paragraph snap); multi-selection.

### 3.11 Context Menu (Reader)
- **Purpose:** Object-specific actions on selection/highlight/annotation.
- **Capabilities:** right-click/long-press/`⋯` → contextual actions (the selection/highlight/annotation actions).
- **Rules:** mirrors the floating toolbar + more; never the only path (also palette/visible).
- **Deps:** Selection, Highlights, Annotations.
- **AC:** BAC + context-appropriate actions · keyboard-accessible.
- **Edge:** empty context; touch long-press timing.
- **Future:** customizable actions.

### 3.12 Search (in-document)
- **Purpose:** Find any phrase within the open source, offline.
- **Capabilities:** `⌘F` find bar · count ("3 of 47") · next/prev (+ flash) · options (case/whole-word/regex) · works offline.
- **Rules:** worker-built index (cached per doc version); match highlights distinct from user highlights; PDF maps via text layer.
- **Deps:** Document Model, in-doc index.
- **AC:** BAC + finds matches + navigates + counts · offline · distinct match style.
- **Edge:** no matches; huge doc (incremental); PDF text-layer mapping.
- **Future:** fuzzy/semantic in-doc; search within selection.

### 3.13 Dictionary
- **Purpose:** Define a word/term inline without leaving the page.
- **Capabilities:** select word → Define (or double-tap) · popover (definition, POS, "add to vocabulary," "ask AI for more").
- **Rules:** prefers the *source's own* definition (grounded) for domain terms, else general; dismissible; never navigates.
- **Deps:** Selection, Knowledge (definitions/vocabulary).
- **AC:** BAC + define popover for any word · prefers source definition · add-to-vocabulary.
- **Edge:** unknown word; phrase vs. word.
- **Future:** etymology; pronunciation audio.

### 3.14 Translation
- **Purpose:** Translate a selected passage (or the reading view) for non-native readers.
- **Capabilities:** select → Translate (to user's language) · inline result · (later) full-view translation toggle.
- **Rules:** translation is clearly labeled as such (not the source); cited as a transformation; opt-in.
- **Deps:** Selection, AI Engine.
- **AC:** BAC + selection translated inline · target language from preferences · clearly labeled.
- **Edge:** already-target-language; mixed-language passage; idioms.
- **Future:** bilingual side-by-side; full-document translation; language learning mode.

### 3.15 Images
- **Purpose:** Render + interact with images/figures.
- **Capabilities:** lazy-load (aspect-reserved) · lightbox zoom/pan · "ask about this figure" · alt text · failed→placeholder+retry.
- **Rules:** no layout shift; off-thread decode.
- **Deps:** Rendering, AI.
- **AC:** BAC + images load without shift · zoomable · alt text · failure recoverable.
- **Edge:** huge image; missing alt (generated where possible); broken source.
- **Future:** figure extraction to Knowledge; diagram explanation.

### 3.16 Tables
- **Purpose:** Render + interact with tabular content.
- **Capabilities:** horizontal scroll (edge cue) · cell focus · "explain this table" · SR-navigable.
- **Rules:** preserved structure; never break layout.
- **Deps:** Rendering, AI.
- **AC:** BAC + tables scroll + are SR-navigable · explain action.
- **Edge:** very wide/large tables; nested tables.
- **Future:** table → data extraction; sortable rendered tables.

### 3.17 Footnotes
- **Purpose:** Access footnotes without losing place.
- **Capabilities:** superscript → popover preview · "go to note" · back-link returns.
- **Rules:** anchored as their own blocks; locator-resolvable.
- **Deps:** Document Model, Locators.
- **AC:** BAC + footnote preview on tap · back-link returns to position.
- **Edge:** endnotes vs. footnotes; nested notes.
- **Future:** footnote density toggle.

### 3.18 Code Blocks
- **Purpose:** Readable, interactive code.
- **Capabilities:** mono + horizontal scroll · optional syntax highlight · copy-on-hover · "explain this code."
- **Rules:** never wraps illegibly.
- **Deps:** Rendering, AI.
- **AC:** BAC + code legible + copyable · explain action · SR-readable.
- **Edge:** very long lines; unknown language.
- **Future:** runnable snippets (sandbox); language detection.

### 3.19 Math
- **Purpose:** Render + explain mathematical notation.
- **Capabilities:** rendered MathML/pre-rendered · inline baseline-aligned · "explain this equation" · SR-readable.
- **Rules:** never raw LaTeX shown.
- **Deps:** Rendering, AI.
- **AC:** BAC + math renders correctly · explain action · accessible.
- **Edge:** complex/multiline equations; malformed math.
- **Future:** step-by-step equation walkthrough; interactive plots.

### 3.20 Media (audio/video sources)
- **Purpose:** Read-along + annotate time-based sources.
- **Capabilities:** player synced to transcript · tap transcript to seek · annotate/ask/highlight anchored to timestamps · read-along highlighting · speed control.
- **Rules:** transcript is the locatable content; timestamps are locators.
- **Deps:** Ingestion (transcription), Reader, Annotation.
- **AC:** BAC + transcript synced to playback · seek by transcript · timestamp-anchored annotations.
- **Edge:** no transcript yet (processing); long media; background/lock-screen playback.
- **Future:** chapter markers; clip-and-quote; AI narration.

### 3.21 Reading Progress
- **Purpose:** Track + restore position; communicate progress calmly.
- **Capabilities:** char-offset % (stable across font) · thin top bar · "time left in chapter" on demand · furthest-position restore · cross-device.
- **Rules:** never a nag; persists continuously (debounced); syncs.
- **Deps:** Locators, Sync, Reading Sessions.
- **AC:** BAC + % stable across font changes · position restores cross-device · no nagging.
- **Edge:** divergent device position (prompt); re-ingested doc (re-anchor).
- **Future:** reading-speed personalization; attention heatmap.

### 3.22 Reading Sessions
- **Purpose:** Record discrete reading sittings (feeds Analytics + Learning loop).
- **Capabilities:** auto-detect session start/end · capture duration, range, dwell (invisible) · emit reading events.
- **Rules:** zero visible cost/UI; sampled/debounced; privacy-respecting.
- **Deps:** Reading Progress, Analytics, Learning.
- **AC:** BAC + sessions captured accurately without visible cost.
- **Edge:** backgrounded app; idle detection; very short sessions.
- **Future:** session goals; focus-session timer.

### 3.23 Reader Preferences
- **Purpose:** Tailor the reading experience.
- **Capabilities:** font family/size/measure/line-height/spacing · theme (Light/Sepia/Dark/Night) · dyslexia font · live preview · per-doc + global.
- **Rules:** instant apply; reader theme independent of app theme; persists.
- **Deps:** Personalization (§9), Design System.
- **AC:** BAC + changes apply instantly + persist · per-doc overrides · live preview.
- **Edge:** extreme settings (clamped to readable); conflicting per-doc vs. global (per-doc wins).
- **Future:** reading profiles; auto-theme by time.

### 3.24 Accessibility (Reader)
- **Purpose:** Make reading operable by everyone.
- **Capabilities:** semantic text · screen-reader support · TTS read-aloud with word-sync · reading ruler/focus-line · 200% zoom reflow · keyboard nav · PDF Clean Read (accessible reflowable view).
- **Rules:** PDF accessible path = derived Clean Read; AI panel never steals reading focus/position.
- **Deps:** Rendering, TTS, Knowledge (Clean Read derivation).
- **AC:** BAC + reader is fully keyboard + SR operable · TTS word-sync · 200% reflow · PDF Clean Read available.
- **Edge:** scanned PDF (OCR-gated); complex layout (reading order).
- **Future:** AI narration voices; sign-language (far future).

### 3.25 Offline Reading
- **Purpose:** Read without a connection.
- **Capabilities:** opened/pinned docs read fully offline · in-doc search offline · annotate offline (queued) · clear offline indicator.
- **Rules:** local-first; nothing lost; pinned never evicted.
- **Deps:** Storage, Sync, Offline (§11).
- **AC:** BAC + cached/pinned docs read offline · annotations queue · never-opened doc shows "needs connection."
- **Edge:** storage full (evict unpinned); offline AI (graceful).
- **Future:** offline semantic search (desktop); offline downloads manager.

### 3.26 Reader Sync
- **Purpose:** Reading state (position, annotations, bookmarks, prefs) consistent across devices.
- **Capabilities:** background sync · conflict-free annotation merge · progress reconcile · pref sync.
- **Rules:** local-first; idempotent; subtle indicator.
- **Deps:** Platform Sync (§11).
- **AC:** BAC + reading state syncs · offline replays · annotations merge.
- **Edge:** conflicts (CRDT/LWW); long offline.
- **Future:** real-time multi-device presence.

---

# SECTION 4 — AI Domain

*Grounded, cited intelligence over the corpus.* **Owning team:** AI Experiences. (Engine: [AI-ENGINE-SPEC](AI-ENGINE-SPEC.md); behavior: [UX-SPEC §6](UX-SPECIFICATION.md).)

> Compact record. BS/BAC/BC inherited. All AI features: **grounded + cited + streamed + scope-visible + stop-able + safety-gated**.

### 4.1 AI Chat
- **Purpose:** Converse about the corpus; get cited answers.
- **Capabilities:** Ask (select-to-ask / `/` bar) · scope chip · streamed cited answer · message actions (note/flashcard/graph/copy/retry/deeper) · suggested prompts (empty).
- **Rules:** grounded by default; first token <1s; stop always present; "not in your sources" when weak.
- **Deps:** Retrieval, AI Engine, Knowledge, Reader (citation jump).
- **AC:** BAC + cited streamed answers · scope visible/switchable · actions work · weak-grounding decline.
- **Edge:** weak grounding; model error; refusal; offline; very long chat.
- **Future:** voice; multi-doc compare; sharing.

### 4.2 Context Awareness
- **Purpose:** The AI knows where the user is + what they know.
- **Capabilities:** current doc/passage/scope awareness · uses graph + mastery · retrieves the right context per question.
- **Rules:** scope explicit + switchable; retrieval scoped to avoid noise.
- **Deps:** Reader, Knowledge, Mastery.
- **AC:** BAC + answers reflect current context + scope · retrieves appropriate granularity.
- **Edge:** ambiguous scope; thin corpus.
- **Future:** auto-scoping; goal-aware context.

### 4.3 Selection Actions
- **Purpose:** Act on selected text via AI.
- **Capabilities:** Explain · Define · Ask (scoped to selection) · Summarize · Translate — from the selection toolbar.
- **Rules:** answer cited back to the selection; one tap.
- **Deps:** Selection, AI Chat.
- **AC:** BAC + each action returns a cited answer scoped to the selection.
- **Edge:** large selection; cross-block selection.
- **Future:** more selection verbs; custom actions.

### 4.4 Explain
- **Purpose:** Clarify a passage/concept at the right level.
- **Capabilities:** explain (default) · Explain-Like-I'm-5 (simpler) · "go deeper" · analogy on request.
- **Rules:** grounded; depth control maps to effort.
- **Deps:** AI Chat.
- **AC:** BAC + cited explanation at chosen depth.
- **Edge:** already-simple content; highly technical.
- **Future:** adaptive depth from mastery.

### 4.5 Summarize
- **Purpose:** Condense a selection/chapter/document.
- **Capabilities:** summarize selection/chapter/doc · structured (key points → citations) · "make flashcards from this."
- **Rules:** cited; faithful (verified); never fabricates.
- **Deps:** AI Chat, Retrieval.
- **AC:** BAC + cited structured summary · one-tap flashcards.
- **Edge:** very long doc (hierarchical); thin content.
- **Future:** progressive summary (1-line→1-para→1-page); cross-doc summary.

### 4.6 Examples
- **Purpose:** Make abstract concepts concrete.
- **Capabilities:** "give me an example" → cited example from source, or clearly-labeled generated example.
- **Rules:** source examples cited; generated examples labeled.
- **Deps:** AI Chat.
- **AC:** BAC + relevant example, sourced or labeled.
- **Edge:** no example in source.
- **Future:** worked examples; domain-tailored.

### 4.7 Analogies
- **Purpose:** Explain by relatable comparison.
- **Capabilities:** analogy + mapping + where it breaks down.
- **Rules:** always note the analogy's limits (avoid misleading).
- **Deps:** AI Chat.
- **AC:** BAC + analogy with explicit mapping + caveats.
- **Edge:** concept resistant to analogy.
- **Future:** analogies tuned to the user's known domains.

### 4.8 Quiz (generation)
- **Purpose:** Generate self-assessment from material.
- **Capabilities:** generate quiz (scope/length/type) · cited feedback. (Detail §6.2.)
- **Rules:** generated content passes eval gate; cited feedback.
- **Deps:** Knowledge, AI Engine, Learning.
- **AC:** BAC + generates a valid cited quiz.
- **Edge:** doc not knowledge-ready.
- **Future:** adaptive generation.

### 4.9 Flashcards (generation)
- **Purpose:** Draft cards effortlessly.
- **Capabilities:** card from selection/answer · deck from chapter/concept (editable).
- **Rules:** editable before accept; source-linked.
- **Deps:** Highlights, Knowledge, Learning.
- **AC:** BAC + drafts editable cards in one action.
- **Edge:** gen failure (manual fallback).
- **Future:** card-type variety.

### 4.10 Mind Maps
- **Purpose:** Visualize a topic's concept structure.
- **Capabilities:** "map this" → focused concept map (scoped graph view) linking to source + full graph.
- **Rules:** nodes cited; links to Knowledge.
- **Deps:** Knowledge Graph, AI.
- **AC:** BAC + a navigable map with source links.
- **Edge:** sparse topic.
- **Future:** editable mind maps; export.

### 4.11 Compare
- **Purpose:** Contrast two concepts/sources.
- **Capabilities:** "compare X and Y" → structured side-by-side (similarities/differences/when-to-use), each row cited.
- **Rules:** every claim cited to its source.
- **Deps:** AI Chat, Retrieval, Knowledge.
- **AC:** BAC + structured cited comparison.
- **Edge:** incomparable items; one side thin.
- **Future:** multi-way compare; compare across the whole library.

### 4.12 Debate
- **Purpose:** Explore both sides of a contested idea.
- **Capabilities:** "argue both sides" → balanced cited steelman of each; surfaces real corpus contradictions.
- **Rules:** explicitly labeled exploration; balanced; cited.
- **Deps:** AI Chat, Knowledge (contradictions).
- **AC:** BAC + balanced cited both-sides; corpus contradictions surfaced where present.
- **Edge:** no genuine opposing view in corpus.
- **Future:** interactive debate (user takes a side).

### 4.13 Source Citations
- **Purpose:** Make every AI claim traceable.
- **Capabilities:** inline `[n]` chips · provenance popover (quote + locator + jump) · hover highlights span in reader · sources-used tray.
- **Rules:** **every grounded claim is cited**; citations resolve to exact spans; non-negotiable (§13).
- **Deps:** Retrieval, Reader (locators).
- **AC:** BAC + every answer cited · citation jumps to exact span · sources tray complete.
- **Edge:** re-ingested source (re-anchor); citation to deleted source (graceful).
- **Future:** citation confidence display; export citations.

### 4.14 Conversation Memory
- **Purpose:** Coherent multi-turn + cross-session memory.
- **Capabilities:** working + episodic (compaction) + semantic (relevant past turns) + structured (facts/prefs); transparent compaction.
- **Rules:** no "too long" wall; scope/context visible; per-user isolated.
- **Deps:** AI Engine (memory), Knowledge.
- **AC:** BAC + remembers session + relevant history · long chats compact transparently.
- **Edge:** very long chat (compaction); cross-session recall.
- **Future:** durable preference memory; memory inspection/edit.

### 4.15 Model Switching
- **Purpose:** Routing is automatic; advanced users/tenants can influence it.
- **Capabilities:** automatic task-based routing (hidden) · advanced model/tier selector (settings) · per-tenant policy.
- **Rules:** default is automatic + invisible; manual selection is opt-in/advanced; shows capability + cost hints.
- **Deps:** AI Engine (routing), Personalization.
- **AC:** BAC + routing is automatic + correct · advanced selector works · tenant policy respected.
- **Edge:** selected model lacks a needed capability (warn/fallback).
- **Future:** per-task model preferences; bring-your-own-key.

### 4.16 Streaming
- **Purpose:** Responsive, readable answer delivery.
- **Capabilities:** token-by-token stream · thinking indicator + status before first token · stop · citations resolve inline.
- **Rules:** first token <1s; default to streaming for long output.
- **Deps:** AI Engine.
- **AC:** BAC + streams with status · stop works · first token <1s p50.
- **Edge:** slow model (status); mid-stream error (preserve partial / retry).
- **Future:** reasoning-summary stream (opt-in).

### 4.17 Suggestions
- **Purpose:** Make a blank prompt productive + offer next steps.
- **Capabilities:** context-derived suggested prompts (empty chat) · quick-reply chips (tutor next steps).
- **Rules:** derived from current context; disappear on typing; tappable.
- **Deps:** Context Awareness.
- **AC:** BAC + relevant suggestions · quick-replies advance the conversation.
- **Edge:** thin context (fewer/generic).
- **Future:** learned suggestions from usage.

### 4.18 Rate Limits
- **Purpose:** Communicate + handle AI usage limits gracefully.
- **Capabilities:** ahead-of-time "near limit" notice · at-limit calm block (wait/upgrade) · invisible provider-rate handling.
- **Rules:** reading/notes/search/review keep working at limit; never a raw 429.
- **Deps:** AI Engine (quota), Personalization (plan).
- **AC:** BAC + calm proactive + at-limit messaging · core features unaffected.
- **Edge:** burst usage; quota reset timing.
- **Future:** usage dashboard; per-feature budgets.

### 4.19 Fallbacks
- **Purpose:** Survive provider failures without losing the conversation.
- **Capabilities:** invisible cross-provider fallback · retry · graceful degradation (down-tier/cached) · surfaced only if all fail.
- **Rules:** conversation never lost; reading/notes always work.
- **Deps:** AI Engine (resilience).
- **AC:** BAC + provider outage degrades quality not availability · conversation preserved.
- **Edge:** all providers down (clear "AI unavailable," reading works).
- **Future:** user-visible model-served indicator.

### 4.20 Safety
- **Purpose:** Safe, trustworthy AI behavior.
- **Capabilities:** input/output moderation · prompt-injection defense (untrusted content = data) · PII redaction · refusal handling (calm + rephrase) · tool-action gating · audit.
- **Rules:** untrusted content never interpreted as instructions; destructive/external actions gated; refusals dignified.
- **Deps:** AI Engine (guard pipeline), Security (§11).
- **AC:** BAC + injection attempts neutralized (red-team verified) · refusals calm + recoverable · actions gated + audited.
- **Edge:** benign false-positive refusal (fallback model); jailbreak attempts.
- **Future:** per-tenant safety policy; safety transparency.

### 4.21 Prompt History
- **Purpose:** Revisit + reuse past questions/conversations.
- **Capabilities:** conversation list (scoped by doc/collection) · search history · resume · pin.
- **Rules:** per-user; searchable; deletable.
- **Deps:** Conversation Memory, Search.
- **AC:** BAC + history listed + searchable + resumable.
- **Edge:** very long history; deleted source's conversations (orphan handling).
- **Future:** prompt templates/library.

### 4.22 Conversation Export
- **Purpose:** Take a conversation out (with citations).
- **Capabilities:** export a conversation (Markdown, with citations) · copy a single answer with citation.
- **Rules:** citations preserved; ownership.
- **Deps:** Export (§11), Citations.
- **AC:** BAC + exported conversation includes citations + sources.
- **Edge:** long conversation; conversation referencing deleted sources.
- **Future:** export as a study doc; shareable cited answers.

---

# SECTION 5 — Knowledge Domain

*Structured, cross-source knowledge.* **Owning team:** Ingestion & Knowledge. (Model: [KNOWLEDGE-ENGINE-SPEC](KNOWLEDGE-ENGINE-SPEC.md).)

> Compact record. All knowledge features: **provenance-bound (jump to source) + cross-source + dual-rendered (visual + accessible equivalent)**.

### 5.1 Concept Explorer
- **Purpose:** Browse + explore the concepts the corpus contains.
- **Capabilities:** browse/search concepts · filter (doc/collection/type) · open a concept page.
- **Rules:** deduped across sources; salience-ranked.
- **Deps:** Extraction, Knowledge Graph.
- **AC:** BAC + concepts listed + searchable + openable.
- **Edge:** sparse corpus; huge concept count (ranked/filtered).
- **Future:** concept recommendations.

### 5.2 Knowledge Graph
- **Purpose:** Visualize + explore connections across the corpus.
- **Capabilities:** interactive canvas (pan/zoom/focus) · filters · layouts (force/hierarchy/timeline) · "explain connection" · **list/tree equivalent (all platforms)**.
- **Rules:** every node/edge → provenance; never color-only typing; mobile = focused list.
- **Deps:** Extraction, Relationships, Reader (jump).
- **AC:** BAC + explore visually + via accessible list · provenance on everything.
- **Edge:** sparse (sample); huge (filtered/performant); compute fail (fallback list).
- **Future:** contradiction/prerequisite/timeline layouts; shared knowledge.

### 5.3 Entity Pages
- **Purpose:** Everything about a person/org/place/work.
- **Capabilities:** description · appearances across sources · related entities · external refs · mention timeline.
- **Rules:** coreference-resolved; cited.
- **Deps:** Entity recognition, Graph.
- **AC:** BAC + entity page with cross-source appearances + provenance.
- **Edge:** ambiguous entity (disambiguated); thin entity.
- **Future:** external KB enrichment.

### 5.4 Definitions
- **Purpose:** A per-source + corpus glossary.
- **Capabilities:** browsable glossary · inline define popover · multiple definitions ranked + sourced.
- **Rules:** source's own definition preferred; cited.
- **Deps:** Extraction, Dictionary.
- **AC:** BAC + glossary + inline define · multiple defs shown/ranked.
- **Edge:** conflicting definitions (all shown); no definition (general fallback).
- **Future:** definition evolution across sources.

### 5.5 Vocabulary
- **Purpose:** Learning-oriented domain terms → flashcards.
- **Capabilities:** vocab deck (per-doc + corpus) · difficulty · example (locator) · "add to flashcards" · deduped vs. known.
- **Rules:** distinct from definitions (learning-targeted); deduped against mastery.
- **Deps:** Extraction, Learning (mastery), Flashcards.
- **AC:** BAC + vocab list with difficulty + examples · add-to-flashcards.
- **Edge:** common-word filtering; already-known terms.
- **Future:** language-learning mode.

### 5.6 Quotes
- **Purpose:** Notable verbatim passages.
- **Capabilities:** browse quotes · attribution + locator · "best of this book" · share.
- **Rules:** **verbatim** (from source span, never regenerated); cited.
- **Deps:** Extraction, Reader.
- **AC:** BAC + verbatim quotes with attribution + jump-to-source.
- **Edge:** misattribution (verified); long passages.
- **Future:** quote collections; shareable quote cards.

### 5.7 Frameworks
- **Purpose:** Structured mental models/methodologies.
- **Capabilities:** framework explorer · component map (ordered/typed) · each part → source · "teach me this."
- **Rules:** assembled from scattered mentions; cited.
- **Deps:** Extraction, Tutor.
- **AC:** BAC + coherent framework with components + sources.
- **Edge:** partial framework; named-model recognition.
- **Future:** apply-framework workflows.

### 5.8 Skills
- **Purpose:** Competencies the corpus develops.
- **Capabilities:** skill explorer · level · mapped concepts · mastery meter · "practice."
- **Rules:** mapped to canonical taxonomy; feeds tutor targeting.
- **Deps:** Extraction, Learning (mastery).
- **AC:** BAC + skills listed + leveled + mastery shown + practice.
- **Edge:** ambiguous skill mapping.
- **Future:** skill-based learning paths.

### 5.9 Timeline
- **Purpose:** Chronological view of events.
- **Capabilities:** zoomable track · event detail · fuzzy/relative dates marked · jump to source.
- **Rules:** date-normalized; cited; prominent for history/biography genres.
- **Deps:** Extraction (timeline), Reader.
- **AC:** BAC + ordered timeline with sourced events.
- **Edge:** uncertain dates (marked); BCE/relative dates.
- **Future:** cross-source merged timelines.

### 5.10 Relationships
- **Purpose:** Typed connections between knowledge nodes.
- **Capabilities:** view typed/directed/labeled edges · edge evidence (quote+locator) · filter by type.
- **Rules:** line-style + label (never color-only); evidence-backed.
- **Deps:** Inference, Graph.
- **AC:** BAC + relationships shown with type + evidence.
- **Edge:** low-confidence relations (de-emphasized).
- **Future:** relationship strength visualization.

### 5.11 Cross-document Links
- **Purpose:** Surface connections across sources (the compounding moat).
- **Capabilities:** "you read about this in N sources" · "these disagree about Y" · related-across-corpus.
- **Rules:** calm, one-at-a-time when proactive; each → source.
- **Deps:** Cross-corpus linking, Graph.
- **AC:** BAC + cross-source connections + contradictions surfaced + sourced.
- **Edge:** thin corpus (few links); false connection (confidence-gated).
- **Future:** connection feed; serendipity engine.

### 5.12 Knowledge Search
- **Purpose:** Find knowledge artifacts by name/meaning.
- **Capabilities:** search concepts/entities/frameworks · lands on the knowledge page (not just a passage).
- **Rules:** semantic + keyword.
- **Deps:** Search (§8), Knowledge.
- **AC:** BAC + knowledge search lands on knowledge pages.
- **Edge:** ambiguous query.
- **Future:** NL knowledge queries.

### 5.13 Bookmarks (Knowledge)
- **Purpose:** Pin knowledge items for quick return.
- **Capabilities:** bookmark a concept/entity/framework · a knowledge-bookmarks view.
- **Rules:** distinct from reading bookmarks.
- **Deps:** Knowledge pages.
- **AC:** BAC + bookmark + view knowledge items.
- **Edge:** bookmarked item changes on re-ingest.
- **Future:** knowledge boards.

### 5.14 Collections (Knowledge)
- **Purpose:** Scope knowledge views to a collection.
- **Capabilities:** "concepts in my Psychology collection" etc.
- **Rules:** uses Library collections as scope.
- **Deps:** Library Collections, Knowledge.
- **AC:** BAC + knowledge scoped to a collection.
- **Edge:** empty collection.
- **Future:** knowledge comparison across collections.

### 5.15 Semantic Search
- **Purpose:** Meaning-based retrieval (the substrate for AI + discovery).
- **Capabilities:** vector + keyword hybrid · reranked · powers grounding + "where have I read about X."
- **Rules:** scoped; tenant-filtered.
- **Deps:** Embeddings, Vector store.
- **AC:** BAC + meaning-based results with source spans.
- **Edge:** paraphrase vs. exact; huge corpus.
- **Future:** multimodal semantic search.

### 5.16 Related Knowledge
- **Purpose:** Surface related items on any concept/passage.
- **Capabilities:** "related" rail (semantic + graph) across the corpus → discovery.
- **Rules:** sourced.
- **Deps:** Semantic Search, Graph.
- **AC:** BAC + relevant related items with sources.
- **Edge:** thin relations.
- **Future:** "rabbit hole" exploration mode.

### 5.17 Knowledge Insights
- **Purpose:** Proactive, calm insights about the user's knowledge.
- **Capabilities:** "you've built deep knowledge in X" · "a gap in Y" · "Z connects three of your books" — surfaced calmly.
- **Rules:** one at a time; dismissible; honest.
- **Deps:** Graph, Mastery, Analytics.
- **AC:** BAC + honest, calm, sourced insights.
- **Edge:** thin data (no false insights).
- **Future:** insight feed; knowledge reports.

---

# SECTION 6 — Learning Domain

*Close the loop: remember + apply.* **Owning team:** AI Experiences (Learning). (UX §8.)

> Compact record. **Memory ≠ Understanding** (both tracked).

### 6.1 Flashcards
- **Purpose:** Reviewable memory units, effortlessly created.
- **Capabilities:** create from highlight/answer (1 tap) · AI deck (editable) · review (reveal→grade) · deck management · suspend/leech · source-link.
- **Rules:** preloaded next card (zero wait); FSRS-scheduled; offline.
- **Deps:** Highlights, AI, Knowledge (vocab), Spaced Repetition.
- **AC:** BAC + 1-tap create · instant review advance · offline grades queue.
- **Edge:** gen fail (manual); deleted source (card works).
- **Future:** cloze/image/audio cards; Anki sync.

### 6.2 Adaptive Quiz
- **Purpose:** Active-recall self-assessment that adapts.
- **Capabilities:** generate (type/length) · cited feedback · AI-graded short answers (self-assess fallback) · misses→cards · difficulty adapts to mastery.
- **Rules:** generated content eval-gated; difficulty targets weak concepts.
- **Deps:** Knowledge, AI, Mastery.
- **AC:** BAC + cited quiz + feedback · adapts difficulty · misses→cards.
- **Edge:** doc not ready; grading fail (model answer).
- **Future:** exam/timed mode.

### 6.3 Daily Review
- **Purpose:** The focused daily reinforcement loop.
- **Capabilities:** due queue (cards + targeted quizzes) · fast review · session summary · "all caught up."
- **Rules:** calm, non-punitive; respects cadence + quiet hours.
- **Deps:** Spaced Repetition, Flashcards, Quiz.
- **AC:** BAC + due queue + fast loop + calm done-state.
- **Edge:** long absence (graceful, not a wall); nothing due (positive).
- **Future:** smart session sizing.

### 6.4 Spaced Repetition
- **Purpose:** Schedule reviews for maximum retention, minimum time.
- **Capabilities:** FSRS scheduling · per-card intervals · invisible to user ("what's due").
- **Rules:** algorithm hidden; calm surfacing.
- **Deps:** Flashcards, Mastery, Memory Score.
- **AC:** BAC + scheduling demonstrably improves retention; due-dates accurate.
- **Edge:** lapses; leeches; long gaps.
- **Future:** algorithm tuning per user.

### 6.5 Revision
- **Purpose:** Combined focused revision sessions.
- **Capabilities:** combined card+quiz session · deadline-aware (exam mode) · targeted (weak concepts).
- **Rules:** respects cadence; non-punitive.
- **Deps:** Daily Review, Mastery.
- **AC:** BAC + combined revision session targeting gaps.
- **Edge:** exam crunch (intensive mode).
- **Future:** revision plans.

### 6.6 Learning Goals
- **Purpose:** Goal-driven learning.
- **Capabilities:** set a goal ("understand X by date") → drives a path + review emphasis.
- **Rules:** optional, never imposed.
- **Deps:** Learning Plans, Mastery.
- **AC:** BAC + goal drives path + emphasis.
- **Edge:** unrealistic goal (gentle guidance).
- **Future:** goal templates; accountability.

### 6.7 Progress Tracking
- **Purpose:** See learning progress honestly.
- **Capabilities:** per-concept + overall progress (reading + review combined) · on Home/Analytics.
- **Rules:** honest, non-punitive.
- **Deps:** Mastery, Analytics.
- **AC:** BAC + accurate, honest progress.
- **Edge:** thin data.
- **Future:** predicted-recall display.

### 6.8 Achievements
- **Purpose:** Celebrate meaningful milestones.
- **Capabilities:** milestone badges (first book, 100 concepts, habit) · brief celebration · opt-out.
- **Rules:** meaningful + dignified, never manipulative.
- **Deps:** Analytics, Knowledge.
- **AC:** BAC + genuine milestones, non-manipulative, opt-out-able.
- **Edge:** milestone gaming.
- **Future:** shareable achievements (opt-in).

### 6.9 Streaks
- **Purpose:** Gentle habit reinforcement.
- **Capabilities:** reading/review streak · calm indicator · missed-day neutral.
- **Rules:** **never punitive or pressuring**; opt-out.
- **Deps:** Reading Sessions, Daily Review.
- **AC:** BAC + streak shown calmly · missed days neutral · opt-out.
- **Edge:** broken streak (no shame); timezone handling.
- **Future:** streak freeze/grace.

### 6.10 Memory Score
- **Purpose:** Per-concept recall estimate.
- **Capabilities:** FSRS-derived score · decays over time · "slipping" cue (text, not red-alarm) · drives review queue.
- **Rules:** bar + value (never color-only).
- **Deps:** Spaced Repetition, Reviews.
- **AC:** BAC + score updates from reviews + decays + drives queue.
- **Edge:** new concept (no data); long gap.
- **Future:** memory forecasting.

### 6.11 Understanding Score
- **Purpose:** Per-concept comprehension depth (distinct from memory).
- **Capabilities:** assessed via tutor dialogue + applied quizzes · bar + value.
- **Rules:** distinct from memory; the pair = mastery.
- **Deps:** Tutor, Quiz.
- **AC:** BAC + understanding distinct from memory + assessed appropriately.
- **Edge:** memory-high/understanding-low (surfaced).
- **Future:** understanding via teaching-back.

### 6.12 Knowledge Score
- **Purpose:** Overall structured knowledge built (the "growing" signal).
- **Capabilities:** graph density/breadth measure · bar/ring + value · on Home/Profile.
- **Rules:** celebratory, not competitive.
- **Deps:** Knowledge Graph, Analytics.
- **AC:** BAC + reflects knowledge growth honestly.
- **Edge:** thin corpus.
- **Future:** knowledge-domain breakdown.

### 6.13 Learning Dashboard
- **Purpose:** The learning home.
- **Capabilities:** due review · tutor entry · plans · mastery overview · achievements.
- **Rules:** calm; one primary action (review).
- **Deps:** all Learning features.
- **AC:** BAC + a clear learning home with the right primary action.
- **Edge:** new user (onboarding state).
- **Future:** customizable.

### 6.14 Personal Tutor
- **Purpose:** Adaptive teaching from the corpus (the synthesis feature).
- **Capabilities:** Socratic/explain-then-check/worked-example dialogue (cited) · adapts to mastery · generates practice mid-session · schedules reviews · sequences via graph · quick-replies.
- **Rules:** grounded + cited; gated/audited tools; adapts to gaps.
- **Deps:** AI, Knowledge, Mastery, Learning.
- **AC:** BAC + teaches from corpus + adapts + cited + practice integration.
- **Edge:** cold-start (reads with user); thin corpus.
- **Future:** voice tutoring; longitudinal companion.

### 6.15 Learning Plans
- **Purpose:** Structured learning sequences.
- **Capabilities:** AI-generated module→lesson plan tied to sources · prerequisite-ordered · progress-tracked · adapts.
- **Rules:** ordered by graph prerequisites; editable.
- **Deps:** Tutor, Knowledge (prerequisites), Goals.
- **AC:** BAC + a followable plan tied to the user's sources.
- **Edge:** goal change (replan).
- **Future:** plan templates; deadline-aware.

---

# SECTION 7 — Collaboration Domain

*Shared knowledge + reading.* **Status:** `[WON'T-NOW]` for v1 (deferred — PRD §6); specified so the domain exists, has a coherent model, and isn't rediscovered. **Owning team:** TBD (post-PMF). CRDT groundwork (Sync) exists.

> Compact record; AC stated as "when built."

### 7.1 Shared Notes
- **Purpose:** Share/co-author notes. **Capabilities:** share a note (read-only/comment/edit) · shared note view. **Rules:** respects source copyright; private-by-default. **Deps:** Notes, Permissions, Sync(CRDT). **AC (when built):** shared notes merge conflict-free + respect permissions. **Edge:** concurrent edits; revoked access. **Future:** team note spaces.

### 7.2 Shared Highlights
- **Purpose:** Share highlights with a group. **Capabilities:** share a highlight/set · see others' highlights (distinct style) in a shared doc. **Rules:** opt-in; private library not exposed. **Deps:** Highlights, Permissions. **AC:** shared highlights visible + attributed + permissioned. **Edge:** highlight on a doc others lack. **Future:** group highlight heatmaps.

### 7.3 Reading Groups
- **Purpose:** Read + discuss together. **Capabilities:** create a group · shared collection · group discussion · progress. **Rules:** copyright-respecting (each member needs the source). **Deps:** Collections, Comments, Permissions. **AC:** group with shared collection + discussion. **Edge:** member lacks a source. **Future:** book clubs; cohorts.

### 7.4 Comments
- **Purpose:** Discuss at a passage/note. **Capabilities:** comment threads anchored to a locator/note · reply. **Rules:** anchored; notify mentioned users. **Deps:** Locators, Mentions, Permissions. **AC:** anchored threaded comments + jump-to-source. **Edge:** comment on re-ingested doc (re-anchor). **Future:** reactions; resolve.

### 7.5 Mentions
- **Purpose:** Pull someone into a discussion. **Capabilities:** `@user` in comments/notes · notification. **Rules:** within a shared context only. **Deps:** Comments, Notifications, Permissions. **AC:** mention notifies + links. **Edge:** mention of non-member. **Future:** mention groups.

### 7.6 Permissions
- **Purpose:** Control access to shared artifacts. **Capabilities:** per-artifact access (view/comment/edit) · link sharing. **Rules:** private-by-default; least-privilege. **Deps:** Authorization (§11). **AC:** access enforced at data layer. **Edge:** revoked mid-session. **Future:** granular field-level.

### 7.7 Roles
- **Purpose:** Group/team roles. **Capabilities:** owner/editor/commenter/viewer. **Rules:** role → permission set. **Deps:** Permissions, Authorization. **AC:** roles map to enforced permissions. **Edge:** last-owner removal. **Future:** custom roles; org admin.

### 7.8 Live Collaboration
- **Purpose:** Real-time co-presence. **Capabilities:** presence indicators · live cursors/highlights · real-time note co-edit. **Rules:** CRDT-backed; performant. **Deps:** Sync (real-time), Notes(CRDT). **AC:** real-time co-edit without conflict/loss. **Edge:** network blips; many collaborators. **Future:** live reading sessions.

### 7.9 Version History
- **Purpose:** Track + restore note/artifact versions. **Capabilities:** version timeline · diff · restore. **Rules:** per shared artifact. **Deps:** Notes, Sync. **AC:** versions tracked + restorable. **Edge:** large history. **Future:** branching.

### 7.10 Conflict Resolution
- **Purpose:** Resolve concurrent edits gracefully. **Capabilities:** CRDT auto-merge (notes) · LWW (simple) · surfaced conflicts only when genuine. **Rules:** no data loss; minimal user intervention. **Deps:** Sync. **AC:** concurrent edits converge without loss. **Edge:** genuine semantic conflict (surface). **Future:** conflict UI.

---

# SECTION 8 — Search Domain

*Find anything, instantly.* **Owning team:** Discovery & Insights. (UX §9.)

> Compact record.

### 8.1 Universal Search
- **Purpose:** One search across everything. **Capabilities:** docs + passages + concepts + notes + highlights + actions · `⌘K` palette + search surface · search-as-you-type. **Rules:** scoped to context by default, switchable. **Deps:** Indexes, Knowledge. **AC:** BAC + finds across all types + lands on exact target. **Edge:** huge corpus; no results (AI fallback). **Future:** voice; NL queries.

### 8.2 Semantic Search
- **Purpose:** Meaning-based search. **Capabilities:** hybrid (dense+sparse) + rerank · labeled match type. **Rules:** finds paraphrase + exact. **Deps:** Embeddings, Vector store. **AC:** BAC + meaning matches + exact matches, labeled. **Edge:** ambiguous query. **Future:** multimodal.

### 8.3 Filters
- **Purpose:** Narrow results. **Capabilities:** scope/type/date/author/tag/collection/has-highlights · result-type tabs. **Rules:** combinable; persisted. **Deps:** Universal Search, Tags, Collections. **AC:** BAC + filters combine + persist. **Edge:** filter-to-empty (clear). **Future:** NL filters.

### 8.4 Saved Searches
- **Purpose:** Reuse complex searches. **Capabilities:** save query+scope+filters · pin · (later) notify on new matches. **Rules:** per-user. **Deps:** Universal Search. **AC:** BAC + save + re-run. **Edge:** stale saved search. **Future:** alerting.

### 8.5 Search Ranking
- **Purpose:** Best result first. **Capabilities:** semantic+keyword fusion + recency + scope signals · auto-highlight top result. **Rules:** reranked. **Deps:** Retrieval. **AC:** BAC + relevant ranking; top result `Enter`-able. **Edge:** tie-breaking. **Future:** personalized ranking.

### 8.6 Suggestions
- **Purpose:** Productive blank/while-typing search. **Capabilities:** recent + trending concepts + completions. **Rules:** context-derived. **Deps:** History, Knowledge. **AC:** BAC + useful suggestions. **Edge:** thin history. **Future:** learned suggestions.

### 8.7 Recent Searches
- **Purpose:** Re-run recent queries. **Capabilities:** recent list · one-tap re-run · clearable. **Rules:** privacy-respecting. **Deps:** Search History. **AC:** BAC + recent shown + re-runnable + clearable. **Edge:** cleared. **Future:** cross-device recents.

### 8.8 History
- **Purpose:** Record of searches (powers recents/suggestions). **Capabilities:** searchable history · clearable. **Rules:** private; not for ads. **Deps:** Search. **AC:** BAC + history powers recents + clearable. **Edge:** cleared. **Future:** search insights.

### 8.9 Keyboard Navigation
- **Purpose:** Mouse-free search. **Capabilities:** `⌘K`/`/` open · type · `↑/↓` · `Enter` open · `⌘Enter` ask AI · `Tab` tabs · `Esc`. **Rules:** fully keyboard-operable. **Deps:** Command Palette. **AC:** BAC + complete keyboard operation. **Edge:** rapid typing. **Future:** custom shortcuts.

---

# SECTION 9 — Personalization Domain

*Make the product fit the user.* **Owning team:** Reading squad + Design. (UX Settings §4.19.)

> Compact record.

### 9.1 Themes
- **Purpose:** Visual preference. **Capabilities:** app theme (light/dark/system/high-contrast) · separate reader themes (Light/Sepia/Dark/Night). **Rules:** reader theme independent of app; respects OS. **Deps:** Design System. **AC:** BAC + theme applies + persists + respects OS. **Edge:** OS theme change mid-session. **Future:** custom/seasonal themes ("spaces").

### 9.2 Reader Preferences
- **Purpose:** Tailor reading. **Capabilities:** font/size/measure/spacing/line-height/dyslexia font/mode · live preview · per-doc + global. **Rules:** instant apply. **Deps:** Reader (§3.23). **AC:** BAC + applies instantly + persists + per-doc override. **Edge:** extremes (clamped). **Future:** profiles.

### 9.3 AI Preferences
- **Purpose:** Tune AI behavior. **Capabilities:** default scope · default depth/verbosity · (advanced) model/tier · web-augmentation opt-in. **Rules:** sensible defaults; advanced hidden. **Deps:** AI Engine. **AC:** BAC + preferences honored. **Edge:** preference vs. capability conflict. **Future:** persona/voice.

### 9.4 Learning Preferences
- **Purpose:** Tune learning. **Capabilities:** review cadence · daily target · quiet hours · teaching style · achievements/streak opt-out. **Rules:** non-punitive defaults. **Deps:** Learning. **AC:** BAC + preferences honored. **Edge:** zero target. **Future:** adaptive defaults.

### 9.5 Accessibility (Preferences)
- **Purpose:** Personal a11y settings (prominent, first-class). **Capabilities:** font scaling · contrast · reduced motion · reduced transparency · TTS · reading ruler · dyslexia font · target size. **Rules:** respects + surfaces OS settings; prominent category. **Deps:** Design System, Reader. **AC:** BAC + all a11y prefs apply + persist + respect OS. **Edge:** conflicting OS vs. app. **Future:** a11y profiles.

### 9.6 Notifications (Preferences)
- **Purpose:** Control notification cadence. **Capabilities:** per-type cadence (instant/digest/off) · quiet hours · channels (in-app/push/email). **Rules:** calm defaults. **Deps:** Notifications (§11). **AC:** BAC + cadence honored + quiet hours respected. **Edge:** all-off. **Future:** smart timing.

### 9.7 Language
- **Purpose:** UI + translation language. **Capabilities:** UI language (localization-ready) · translation target language · per-content reading language. **Rules:** locale-aware formatting. **Deps:** i18n, Translation. **AC:** BAC + language applies to UI + translation. **Edge:** partial localization (fallback). **Future:** full localization.

### 9.8 Profile (Personalization)
- **Purpose:** Identity + knowledge footprint. **Capabilities:** name/avatar · footprint (sources/concepts/milestones) · plan · connections. **Rules:** own data. **Deps:** Profile (§11). **AC:** BAC + profile + footprint shown. **Edge:** new user (placeholder). **Future:** public profile.

### 9.9 Customization
- **Purpose:** Tailor the workspace. **Capabilities:** rail collapse · density (comfortable/compact) · (later) Home widgets · default landing (Home/Library). **Rules:** sensible defaults. **Deps:** Design System. **AC:** BAC + customizations persist. **Edge:** reset-to-default. **Future:** custom layouts; widget board.

---

# SECTION 10 — Analytics Domain

*Honest, motivating insight.* **Owning team:** Discovery & Insights. (UX §12.)

> Compact record. **All charts have text/table equivalents; framing non-punitive.**

### 10.1 Reading Analytics
- **Purpose:** Understand reading habits. **Capabilities:** time/pages/completion/sessions trends · drill-down (doc/range). **Rules:** non-punitive; text equivalents. **Deps:** Reading Sessions. **AC:** BAC + accurate trends + text equivalents + insufficient-data state. **Edge:** thin data; pipeline lag. **Future:** comparisons.

### 10.2 Learning Analytics
- **Purpose:** Understand learning. **Capabilities:** retention/mastery/review trends · per-concept. **Rules:** honest; non-punitive. **Deps:** Learning, Mastery. **AC:** BAC + learning trends + text equivalents. **Edge:** thin data. **Future:** predictive.

### 10.3 AI Usage
- **Purpose:** Visibility into AI usage (+ cost/quota). **Capabilities:** usage vs. quota · per-feature breakdown · reset timing. **Rules:** transparent. **Deps:** AI Engine (cost ledger). **AC:** BAC + usage + quota shown. **Edge:** near/at limit. **Future:** budget controls.

### 10.4 Knowledge Growth
- **Purpose:** Show the compounding knowledge. **Capabilities:** graph density/breadth over time · concepts/connections growth. **Rules:** celebratory. **Deps:** Knowledge Graph. **AC:** BAC + growth trend. **Edge:** thin corpus. **Future:** domain breakdown.

### 10.5 Reading Speed
- **Purpose:** Personalize estimates + insight. **Capabilities:** per-user speed estimate · trend · powers "time left." **Rules:** descriptive, not pressuring. **Deps:** Reading Sessions. **AC:** BAC + speed estimate + powers time-left. **Edge:** varied content types. **Future:** comprehension-vs-speed.

### 10.6 Retention
- **Purpose:** Prove learning happens. **Capabilities:** recall trends · retention-lift vs. baseline. **Rules:** honest. **Deps:** Reviews, Quizzes. **AC:** BAC + retention measured. **Edge:** thin data. **Future:** retention forecasting.

### 10.7 Goals (Analytics)
- **Purpose:** Track goal progress. **Capabilities:** goal progress + projection. **Rules:** encouraging, non-punitive. **Deps:** Learning Goals. **AC:** BAC + goal progress shown. **Edge:** missed goal (gentle). **Future:** goal recommendations.

### 10.8 Weekly Reports
- **Purpose:** A calm weekly recap. **Capabilities:** week summary (read/learned/connected) · highlights · gentle suggestions. **Rules:** opt-in cadence; non-pressuring. **Deps:** all Analytics. **AC:** BAC + accurate, calm weekly recap. **Edge:** inactive week (gentle). **Future:** email delivery.

### 10.9 Monthly Reports
- **Purpose:** A bigger-picture recap. **Capabilities:** month summary + knowledge-growth narrative + milestones. **Rules:** celebratory, honest. **Deps:** all Analytics. **AC:** BAC + monthly recap. **Edge:** inactive month. **Future:** year-in-review.

---

# SECTION 11 — Platform Domain

*The foundation every feature stands on.* **Owning team:** Platform. (Architecture; UX §4.)

> Compact record.

### 11.1 Authentication
- **Purpose:** Secure, frictionless access. **Capabilities:** magic link/social/passkey · session refresh · sign-out-everywhere · device sessions. **Rules:** ≤2 steps; secure. **Deps:** none (foundational). **AC:** BAC + all methods work + sessions refresh/revoke. **Edge:** lost device; method conflict (linking). **Future:** SSO/MFA.

### 11.2 Authorization
- **Purpose:** Enforce who-can-do-what. **Capabilities:** RBAC · resource-ownership checks · tenant isolation. **Rules:** least-privilege; enforced at data layer. **Deps:** Authentication. **AC:** BAC + cross-tenant access impossible (tested). **Edge:** permission change mid-session. **Future:** org/team roles.

### 11.3 Storage
- **Purpose:** Durable storage of sources + derived data. **Capabilities:** direct-to-storage upload · per-plan quota · lifecycle tiering. **Rules:** encrypted at rest; tenant-namespaced. **Deps:** Authentication. **AC:** BAC + reliable storage + quota enforcement. **Edge:** over quota; large files. **Future:** BYO storage.

### 11.4 Offline
- **Purpose:** Work without a connection. **Capabilities:** local-first store · capability matrix (read/annotate/review/search offline) · pin-for-offline. **Rules:** nothing lost; pinned protected. **Deps:** Storage, Sync. **AC:** BAC + offline matrix works + graceful degradation. **Edge:** storage full; never-cached doc. **Future:** offline semantic search (desktop).

### 11.5 Sync
- **Purpose:** Cross-device consistency. **Capabilities:** background sync · CRDT (annotations) · LWW (progress) · idempotent replay · delta sync. **Rules:** local-first; no loss. **Deps:** Offline, Authentication. **AC:** BAC + sync without loss/dup + conflict-free merge. **Edge:** conflicts; long offline; clock skew. **Future:** real-time presence.

### 11.6 Notifications
- **Purpose:** Inform on the user's terms. **Capabilities:** in-app center · push/email (later) · types (ingestion/reviews/connections/system) · cadence control. **Rules:** calm; user-controlled; quiet hours. **Deps:** Notification preferences. **AC:** BAC + grouped + cadence-respecting + calm. **Edge:** overload; long absence. **Future:** smart timing; push.

### 11.7 Import
- **Purpose:** Bring content + data in. **Capabilities:** source import (formats) · (later) connectors · settings import. **Rules:** dedupe; transparent. **Deps:** Book Import, Storage. **AC:** BAC + reliable import. **Edge:** unsupported; corrupt. **Future:** connectors; bulk.

### 11.8 Export
- **Purpose:** The user can take their data. **Capabilities:** export highlights/notes/flashcards (MD/CSV/Anki/BibTeX) · full account export · conversation export. **Rules:** complete; re-importable; ownership. **Deps:** all data domains. **AC:** BAC + complete, re-importable exports. **Edge:** huge export (async). **Future:** scheduled; cloud destinations.

### 11.9 Sharing
- **Purpose:** Share artifacts (deferred; defined). **Capabilities:** share cited answer/excerpt (read-only) · copy-with-citation · revoke. **Rules:** copyright-respecting; no private-library exposure. **Deps:** Citations, Permissions. **AC (when built):** read-only shares respect copyright + privacy. **Edge:** copyright limits. **Future:** collaboration (§7).

### 11.10 Backup
- **Purpose:** Protect against data loss. **Capabilities:** automated backups · point-in-time. **Rules:** encrypted; tested. **Deps:** Storage. **AC:** BAC + verified restorable backups. **Edge:** restore drill. **Future:** user-triggered backup.

### 11.11 Recovery
- **Purpose:** Recover from loss/error. **Capabilities:** account recovery · trash restore · undo · sync replay. **Rules:** forgiving; never permanent without confirm. **Deps:** Backup, Trash, Sync. **AC:** BAC + recoverable from common failures. **Edge:** account lockout. **Future:** self-service recovery.

### 11.12 Device Management
- **Purpose:** See + control devices/sessions. **Capabilities:** session list · revoke · per-device offline storage view. **Rules:** own devices. **Deps:** Authentication, Storage. **AC:** BAC + device list + revoke. **Edge:** stale sessions. **Future:** device-specific settings.

### 11.13 Security Settings
- **Purpose:** User-facing security controls. **Capabilities:** passkeys/MFA · active sessions · data export/delete · privacy controls. **Rules:** transparent; secure. **Deps:** Authentication, Privacy. **AC:** BAC + security controls work + export/delete. **Edge:** last auth method removal. **Future:** security log; alerts.

---

# SECTION 12 — Future Platform

*Directional; specified lightly (Purpose · adds · deps · when). Cross-ref [PRD §14](PRD.md), [FEATURE-BREAKDOWN](FEATURE-BREAKDOWN.md) E15–E18.*

| Feature | Purpose / what it adds | Depends on | When |
|---|---|---|---|
| **Research Papers** | First-class paper support: section structure, resolved references, figures, dual-view (PDF + Clean Read) | Ingestion adapter; Knowledge | v1.x |
| **YouTube / Videos** | Video as a source: transcript-synced reading, timestamp annotations | Transcription pipeline; Reader media | v2 |
| **Podcasts** | Audio as a source: transcript reading + annotation | Transcription; Reader media | v2 |
| **Web Articles** | Article capture + clean reading | Article extraction; Reader | v1.x |
| **Browser Extension** | One-click capture of any web page/article into the library | Web ingestion; Auth | v1.x–v2 |
| **Mobile Apps** | Native read/capture/review on the go (flashcards flagship) | Reader, Sync, Offline | v2 |
| **Desktop Apps** | Offline-first reading + local semantic search | Reader, Sync, local vector cache | v1.x–v2 |
| **Public API** | Programmatic access to the user's knowledge (with consent) | All domains; Auth scopes | v2–v3 |
| **Plugin Marketplace** | Third-party connectors + capability plugins (MCP) | Plugin system; API | v2–v3 |
| **Team Workspace** | Shared libraries + collaboration for teams | Collaboration (§7); Orgs | v2–v3 |
| **Enterprise** | SSO/SCIM, admin, residency, security controls | Auth (SSO); Security; Orgs | v3 |
| **VYANA Integration** | Knowledge as an OS-level primitive for other apps | Public API; MCP server; SSO | v3 (strategic endgame) |

---

# SECTION 13 — Cross-Feature Rules

Universal product invariants. **Every feature must satisfy these; they override local convenience.** (Enforced via the UX checklist [UX-SPEC §15](UX-SPECIFICATION.md) and design governance [DESIGN-SYSTEM-SPEC §15](DESIGN-SYSTEM-SPEC.md).)

1. **Every AI answer must be citable.** No grounded output without a traceable citation to an exact source span; "not in your sources" is a valid answer. (Trust is the product.)
2. **Every highlight can become a flashcard.** Capture → learning is always one action. (More broadly: every capture flows into knowledge + learning.)
3. **Every concept has a page.** Any extracted concept/entity/framework is a navigable destination with provenance.
4. **Every document is searchable.** By phrase and by meaning, with a jump to the exact span — the moment it's ingested.
5. **Every interaction preserves user work.** Optimistic + autosaved + local-first; nothing is ever lost to a network drop, error, or close.
6. **Every feature works offline where possible.** Reading, annotation, review, and in-doc search degrade gracefully offline; network-only features fail calmly with a queue where sensible.
7. **Every artifact has provenance.** Highlights, notes, citations, concepts, quotes, timeline events — all trace to an exact locator. Nothing unsourced.
8. **Every destructive action is reversible or confirmed.** Undo for reversible; explicit confirm (consequences stated) for irreversible. Never silent permanent loss.
9. **Every surface is keyboard-operable and accessible.** WCAG 2.2 AA floor; AAA reading text; nothing color-only or motion-required; reachable via the command palette.
10. **Every feature respects the calm.** AI never imposes; ≤1 proactive interruption at a time; no manufactured urgency; the reading canvas is sacred.
11. **Every AI-generated artifact is verified before it's trusted.** Extracted knowledge, generated cards/quizzes, and answers are grounded-checked; unverified content is excluded from high-stakes uses (quizzes, the graph) or clearly labeled.
12. **Every piece of user data is owned by the user.** Private by default, exportable, deletable; no training without explicit opt-in.
13. **Every feature is scoped to the user's tenant.** Cross-tenant access is impossible by construction; AI's knowledge boundary is the user's corpus.
14. **Every state is designed.** Empty (invitation), loading (skeleton), error (calm + recoverable), offline (graceful) — no bare spinners, blank "no data," or raw errors.
15. **Every quantity that's color-coded is also labeled.** Status, mastery, node type, deltas — color + icon + text, never hue alone.

---

# SECTION 14 — Feature Dependencies

### 14.1 Dependency graph (domain level)

```
                        ┌──────────────────────────────────────┐
   FOUNDATION ──────────┤ Authentication · Authorization ·       │ (every feature depends on these)
   (must exist first)    │ Storage · AI Engine · Design System    │
                        └───────────────┬────────────────────────┘
                                        ▼
   INGESTION ─────────▶ Document Model + Locators + Chunks/Embeddings + Indexes
   (the upstream)              │ (Reader & Knowledge & Search all consume this)
        ┌───────────────┬──────┴───────────────┬──────────────────┐
        ▼               ▼                       ▼                  ▼
   LIBRARY ─────────▶ READER ─────────────▶ SEARCH            KNOWLEDGE
   (organize)         (read+annotate)        (find)            (structure)
        │               │                       │                  │
        │               ▼                       │                  ▼
        │            AI (Chat/RAG) ◀────────────┴────────────── (grounding)
        │               │                                          │
        │               ▼                                          ▼
        └──────────▶ LEARNING (flashcards/quiz/tutor) ◀──────── (concepts/vocab/skills)
                        │
                        ▼
                  ANALYTICS ◀── (reading + learning + knowledge signals)
                        │
   PERSONALIZATION (cross-cuts all) · NOTIFICATIONS · SYNC/OFFLINE (cross-cut Library/Reader/Learning)
   COLLABORATION (extends Reader/Notes/Knowledge — deferred)
```

### 14.2 Foundational features (build first; everything blocks on these)
**Authentication, Authorization/Tenancy, Storage, AI Engine (gateway), Design System, and the Ingestion pipeline (Document Model + Locators).** No user-facing domain can ship without these. The **universal locator** and the **canonical Document Model** are the single most depended-upon contracts (Reader, Knowledge, AI citations, Search all bind to them).

### 14.3 Blockers (a → blocks → b)
- Ingestion (Document Model) → **blocks** Reader, Knowledge, Search, AI grounding.
- AI Engine → **blocks** all AI, Tutor, Knowledge extraction, generated cards/quizzes.
- Retrieval/Indexes → **blocks** AI Chat (RAG) + Search.
- Knowledge extraction → **blocks** Concept pages, Graph, Vocabulary→Flashcards, Tutor sequencing.
- Mastery model → **blocks** adaptive quizzes, tutor targeting, Memory/Understanding scores.
- Sync/Offline (local-first) → **blocks** the offline guarantees of Reader/Annotation/Review.
- Collaboration → **blocked by** Permissions/Roles + real-time Sync (hence deferred).

### 14.4 Parallelizable work (no inter-dependency; can run concurrently)
- **Library organization** (collections/tags/sort/filter) ∥ **Reader rendering** (once Document Model exists).
- **Highlights/Notes** ∥ **In-doc & hybrid Search** (both need only Reader + indexes).
- **Knowledge extraction** (Ingestion squad) ∥ **R1 Reader+RAG hardening** (other squads) — the canonical example: knowledge R&D runs in parallel with the first lovable product.
- **Personalization, Notifications, Analytics** are largely cross-cutting and parallelizable once their input signals exist.
- **Learning** (flashcards/SR) can start once Highlights + Knowledge-vocab exist, in parallel with Tutor (which additionally needs the graph + mastery).

(Sequencing detail: [ROADMAP §2](ROADMAP.md), [SPRINT-PLAN](SPRINT-PLAN.md).)

---

# SECTION 15 — Feature Lifecycle

Every feature moves through a defined lifecycle and carries standing metadata. This is the operating contract for how features are born, shipped, measured, owned, and retired.

### 15.1 Lifecycle stages

| Stage | What happens | Exit criteria |
|---|---|---|
| **1. Discovery** | Problem validated (user research, persona need from PRD); feature record drafted (this doc's template); design explored; anti-sprawl check (does it already exist?); success metrics defined. | Feature record approved; metrics + owner assigned; passes the UX checklist (UX-SPEC §15) on paper. |
| **2. Implementation** | Engineering builds against this record + the deep-dive specs; design delivers states (all of them, both themes); behind a feature flag. | Code complete behind flag; all states + a11y + responsive built; matches the record. |
| **3. Testing** | Unit + contract tests; QA verifies every *interaction* (the taxonomy's testable unit); AI features pass eval gates; a11y audit; perf within budget; edge cases from the record verified. | All gates green; edge cases handled; eval/a11y/perf pass; QA sign-off. |
| **4. Release** | Staged rollout (flag → % canary → GA); docs updated; metrics instrumented + live; changelog entry. | GA; metrics flowing; docs published; no SLO/quality regression. |
| **5. Iteration** | Measured against its success metrics; refined; bugs fixed; A/B improvements; scope expands per the record's Future Enhancements. | Metrics meet target (or a decision to pivot/cut); steady state. |
| **6. Deprecation** | Feature retired when it fails its metrics, is superseded, or no longer fits scope; users migrated; grace window; removal. | Replacement/migration path provided; announced; removed after grace; record archived. |

### 15.2 Standing metadata (every feature carries this in the tracker)

| Attribute | Definition |
|---|---|
| **Metrics** | The specific success metric(s) this feature is measured by (tied to PRD §12 — e.g., a citation feature → citation-accuracy; review → retention/adherence). A feature without a metric doesn't ship. |
| **Ownership** | One accountable owning team (its domain's squad — §1.2) + a DRI. Cross-cutting features name a primary owner. |
| **Documentation** | This feature record (canonical) + design states (in the catalog) + the relevant deep-dive spec + user-facing help where applicable. "No undocumented feature reaches production." |

### 15.3 Governance rules
- **Discovery gate:** no feature enters Implementation without an approved record + metrics + owner + an anti-sprawl check (couldn't an existing feature/capability be extended?).
- **Quality gate (Release):** the [UX checklist](UX-SPECIFICATION.md) §15 (7 non-negotiables) + eval/a11y/perf gates must pass. A single non-negotiable "no" blocks release.
- **Metric review:** features are reviewed against their metrics at each milestone; chronic underperformers are iterated or deprecated — features are not kept out of sentiment.
- **Deprecation is humane:** always a migration path + grace window + announcement; never silent removal of something users rely on.
- **This document is living:** new features are added at the right taxonomy altitude (§1) with the full record; changes are versioned; the domain owner maintains their section. The PRD governs *why*; this governs *what*; the deep-dive specs govern *how*.

---

*End of Canonical Feature Specification v1. This is the company-wide source of truth for what every feature is and must satisfy. It is maintained per-domain by owning teams (§15), governed by the cross-feature rules (§13) and the UX/design-system checklists, and sits between the [PRD](PRD.md) (why) and the deep-dive specs (how). Every feature here is implementable by engineering, design, QA, product, and AI from this record without ambiguity.*
