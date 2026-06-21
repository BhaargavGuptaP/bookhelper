# BookHelper — Canonical UX Specification

> **This is the canonical UX specification.** Every designer and engineer follows it. A designer joining tomorrow should be able to build any screen from this document without asking questions.
>
> **This is not a UI document.** It defines *experience* — philosophy, behavior, flows, states, interactions, and the rules that resolve every design debate. Visual values (color, type, spacing, motion timings) live in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) ("Atlas"); product requirements in [PRD.md](PRD.md); technical behavior in [READER-SPEC.md](READER-SPEC.md) / [AI-ENGINE-SPEC.md](AI-ENGINE-SPEC.md) / [KNOWLEDGE-ENGINE-SPEC.md](KNOWLEDGE-ENGINE-SPEC.md). This document supersedes the overview in [UX-DESIGN.md](UX-DESIGN.md) as the authoritative reference.
>
> **No code.**

**Conventions used throughout:**
- *Summon* = a user-initiated reveal of AI/secondary affordances. *Canvas* = the reading surface. *Scope chip* = the AI knowledge-boundary control. *Locator* = an addressable source span.
- Motion timings reference Atlas tokens (`fast`120ms · `base`180ms · `moderate`240ms · `slow`320ms; springs `snappy/smooth/gentle`). All motion respects `prefers-reduced-motion`.
- **Global state baselines** (§4.0) and **global a11y baseline** (§12) apply to every page/component unless a section states a delta.

---

## Table of Contents
1. [UX Philosophy](#section-1--ux-philosophy)
2. [Information Architecture](#section-2--information-architecture)
3. [User Flows](#section-3--user-flows)
4. [Page Specifications](#section-4--page-specifications)
5. [Reader Experience](#section-5--reader-experience)
6. [AI Experience](#section-6--ai-experience)
7. [Knowledge Experience](#section-7--knowledge-experience)
8. [Learning Experience](#section-8--learning-experience)
9. [Search Experience](#section-9--search-experience)
10. [Design Patterns](#section-10--design-patterns)
11. [Responsive UX](#section-11--responsive-ux)
12. [Accessibility](#section-12--accessibility)
13. [Microinteractions](#section-13--microinteractions)
14. [Edge Cases](#section-14--edge-cases)
15. [UX Principles Checklist](#section-15--ux-principles-checklist)

---

# SECTION 1 — UX PHILOSOPHY

Each principle states **what**, **why it exists**, and **how it manifests**. When two principles conflict, the lower-numbered one wins (Reading and Trust outrank everything).

### 1.1 Product UX Philosophy
**What:** BookHelper is a *calm instrument for thinking*, not an app that competes for attention. It is a tool a serious person reaches for, that gets out of the way, and that compounds in value.
**Why:** Our users (PRD §3) are doing deep cognitive work. Engagement-maximizing patterns (badges, streaks-as-pressure, infinite feeds) are actively harmful to learning and erode trust. We win by being the tool people *trust with their intellectual life*, not the one that's hardest to put down.
**How:** No dark patterns. No manufactured urgency. Optimize for *understanding and retention*, never time-on-app. Every surface earns its pixels against the reading experience.

### 1.2 Reading Philosophy — *the canvas is sacred*
**What:** The reading surface at rest is *only content* — beautiful typography, generous whitespace, zero chrome, zero AI buttons.
**Why:** Reading is the foundation; if it isn't a joy, nothing built on top matters. Attention is the scarce resource — every pixel of UI on the page is a tax on comprehension. We earn the right to add intelligence by first protecting the page.
**How:** Chrome recedes/hides while reading. AI and annotation are *summoned* by predictable gestures (select text, press a key), never persistently displayed. Measure-constrained columns, reader themes, typographic control. (§5.)

### 1.3 AI Interaction Philosophy — *assist, never interrupt*
**What:** AI waits behind a single, predictable gesture and responds fast. It never initiates uninvited (the one exception: calm, opt-in "whispers," one at a time, dismissible in one gesture).
**Why:** An assistant that demands attention is a liability. Interruption destroys flow. Trust comes from the AI being *summonable and grounded*, not omnipresent and chatty.
**How:** Three summon paths (select-to-ask, the `/` Ask bar, opt-in whispers). Always show scope. Always cite. "Not in your sources" is a respectable answer. Stop is always available. (§6.)

### 1.4 Learning Philosophy — *close the loop*
**What:** The product exists to move users from *read → understand → remember → apply*. Every feature should advance that loop.
**Why:** Reading without retention is leaky; the value is in what persists and connects. We are a learning system, not a consumption system.
**How:** Frictionless capture → automatic structured knowledge → spaced reinforcement → applied tutoring. Track both *memory* and *understanding* (§8). Reinforce calmly, never punitively.

### 1.5 Cognitive Load Principles
**What:** Minimize extraneous load so the user spends mental effort on the *material*, not the *interface*.
**Why:** Cognitive load is finite; every decision, every ambiguous control, every visual distraction steals capacity from learning.
**How (the rules):** one primary action per surface · never two ways to do the same thing competing for the same space · recognition over recall (the command palette + visible affordances) · sensible defaults (most users never open Settings) · chunk information; never wall-of-text a UI · defer complexity (progressive disclosure §1.9) · consistent patterns so users learn an interaction once and reuse it everywhere.

### 1.6 Accessibility Philosophy — *accessibility is the design, not a layer*
**What:** Every experience is designed to be operable by everyone — keyboard-only, screen-reader, low-vision, dyslexic, motor-impaired, color-blind — from the first sketch.
**Why:** A reading/learning product that excludes people is a moral and product failure; and accessible design (clear hierarchy, keyboard paths, high contrast, reduced motion) is *better design for everyone*.
**How:** WCAG 2.2 AA floor; AAA contrast for body reading text. Keyboard-complete. The Knowledge Graph ships a first-class non-visual equivalent. Charts have text equivalents. Accessibility is a release gate (§12).

### 1.7 Motion Philosophy — *motion clarifies, never decorates*
**What:** Motion exists to explain spatial relationships and provide feedback — where things come from, where they go, that an action registered. It is restrained, physical, and fast.
**Why:** Purposeful motion reduces cognitive load (it answers "what just happened?"); decorative motion adds load and, in a reading product, breaks flow. The canvas must be perfectly still.
**How:** Atlas timings (≤320ms); spring for spatial moves, ease for fades; enters decelerate, exits accelerate; elements animate from their origin. **No motion in the reading canvas at rest.** **Reduced-motion → opacity-only/instant.** Never more than one attention-seeking animation at once.

### 1.8 Information Density Principles
**What:** Density is *adaptive to context and persona*: the reading canvas is spacious; power surfaces (graph, tables, analytics) are dense; a compact mode serves power users.
**Why:** Eleanor (lifelong learner) needs calm space; Dr. Chen (researcher) needs to see a lot at once. One density fails one of them. Density should match the user's task and expertise.
**How:** Comfortable default; opt-in compact mode (Cursor-style) for tables/lists/power surfaces; the reader is always spacious regardless. Density increases *with the user's depth and screen size*, never imposed on beginners.

### 1.9 Progressive Disclosure Rules
**What:** Beginners see a reader; power surfaces reveal as the relationship deepens.
**Why:** We serve both Eleanor and Dr. Chen. Power must never intimidate the newcomer; simplicity must never limit the expert.
**How (the rules):**
1. A feature appears only when it has data to be useful (the Knowledge Graph nav item activates after the first source builds; Analytics after enough reading).
2. Advanced controls live behind hover, `⋯`, long-press, or the command palette — never crowding the primary view.
3. Defaults are excellent; configuration is optional.
4. Complexity is layered: a highlight is one tap; its color/tag/note/ask actions reveal on demand.
5. Never gate *core value* behind disclosure — the magic moment (cited answer) must be reachable in session 1.

### 1.10 Error Prevention Strategy — *prevent, then forgive*
**What:** Design so errors are hard to make; when they happen, they're calm, scoped, and recoverable.
**Why:** Errors break trust and flow. The best error is the one that can't occur; the second best is one the user can undo in a gesture.
**How:** prefer *undo* over *confirm* for reversible destructive actions (e.g., delete → toast with Undo) · *confirm* (with consequences stated, or type-to-confirm) only for irreversible ones (account/library deletion) · validate inline on blur, not per-keystroke · disable-with-reason (and a path to enable) over silent failure · autosave everything (notes, settings) · optimistic UI that reconciles, never loses · local-first so connectivity loss never destroys work · errors are inline + scoped (a failed answer shows in the message, not a global toast that loses your place).

---

# SECTION 2 — INFORMATION ARCHITECTURE

### 2.0 The IA model

Three zones on one persistent spine (the App Rail), with the Reader as a full-canvas takeover. The Command Palette (`⌘K`) is the universal cross-cutting navigator — *any* destination is reachable from it.

```
┌─ App Rail ─┐   ┌──────────── Workspace ─────────────┐
│ Home       │   │  The active section renders here.   │
│ Library    │   │  Reader & AI Workspace take the     │
│ Search     │   │  FULL workspace (rail auto-hides).   │
│ Knowledge  │   │                                     │
│ Learning   │   │                                     │
│ Analytics  │   │                                     │
│ ────────── │   │                                     │
│ ◐ Profile  │   │                                     │
│   Settings │   │                                     │
└────────────┘   └─────────────────────────────────────┘
   (Collections live inside Library; AI Workspace is summoned, not a rail item)
```

Top-level destinations and their IA contract:

### Home
- **Purpose:** The calm launchpad — resume reading, today's reviews, recent, surfaced connections. Answers "what should I do now?" in one glance.
- **Entry points:** app launch (default), logo/Home in rail, `g h`.
- **Exit points:** any card → its destination (Reader, Review, Tutor, a connection → Knowledge).
- **Relationships:** aggregates Library (continue reading), Learning (reviews due), Knowledge (connections), AI (Ask bar scoped to Everything).
- **Navigation rules:** never a dead end; every widget links somewhere; failing widget fails alone.
- **Permissions:** authenticated user; own data only.
- **Future expansion:** customizable widgets; daily AI briefing; goals.

### Library
- **Purpose:** The home of the entire corpus; organize, browse, find, add sources.
- **Entry points:** rail, `g l`, "Add source" from anywhere, search result → "open in library."
- **Exit points:** a document → Reader; a collection → Collection view; "Add" → upload flow.
- **Relationships:** parent of Collections; feeds Reader; source of Search scope and Knowledge.
- **Navigation rules:** the default landing for returning users with a corpus (configurable vs. Home); deep-linkable per document/collection.
- **Permissions:** own library; (future) shared collections with role-based access.
- **Future expansion:** smart collections; shared/team libraries; reading queues.

### Reader *(full-canvas takeover)*
- **Purpose:** Read any source; the product's soul.
- **Entry points:** open a document (Library, Home, Search, citation jump, deep link).
- **Exit points:** back to origin (Library/Home), follow a citation to another doc, open AI Workspace, jump to a Knowledge concept.
- **Relationships:** hosts the AI Side Panel (AI), produces Highlights/Notes (Learning/Knowledge inputs), feeds Progress/instrumentation (Analytics/Learning).
- **Navigation rules:** rail + chrome auto-hide; a single ambient return affordance + `⌘K`; never traps the user.
- **Permissions:** documents the user owns/has access to.
- **Future expansion:** multi-doc split view; embedded media; collaborative reading (later).

### Knowledge
- **Purpose:** Explore the personal knowledge graph and all extracted artifacts (concepts, entities, definitions, frameworks, vocabulary, timeline, skills) across the corpus.
- **Entry points:** rail (activates after first source builds), `g g`, concept chip anywhere, "where have I read about X," citation → concept.
- **Exit points:** concept/entity → its sources (Reader), → Tutor on this concept, → flashcards.
- **Relationships:** built from Library content; powers AI grounding, Tutor sequencing, Learning targeting, Search (concept results).
- **Navigation rules:** graph view + a mandatory non-visual list/tree equivalent; every node → provenance.
- **Permissions:** own graph; canonical backbone shared (no user content exposed).
- **Future expansion:** contradiction view; prerequisite paths; shared knowledge (consented).

### Learning
- **Purpose:** Review (flashcards/quizzes), the AI Tutor, study plans, and progress toward mastery.
- **Entry points:** rail, `g t`, Home "today's review," a concept → "tutor this," highlight → "make flashcard."
- **Exit points:** a review/quiz session, a tutor session, a study plan; jump-to-source from any cited tutor message.
- **Relationships:** consumes Knowledge (concepts/vocab/skills) + reading instrumentation; feeds Analytics (mastery).
- **Navigation rules:** review is a focused session (chrome minimal, like Reader); tutor is conversational.
- **Permissions:** own learning data.
- **Future expansion:** learning paths; deadline/exam mode; deep research.

### Search *(also a global overlay)*
- **Purpose:** Find anything by phrase or meaning across the corpus; land on the exact span.
- **Entry points:** rail, `/`-adjacent, `⌘K` (palette) / `⌘F` (in-doc), search affordance in topbar.
- **Exit points:** a result → Reader at span / a concept → Knowledge / "ask AI instead" → AI.
- **Relationships:** spans Library, Knowledge, Notes, Highlights; converts to AI Q&A.
- **Navigation rules:** available everywhere as an overlay; scoped to context by default, switchable.
- **Permissions:** own content.
- **Future expansion:** saved searches; voice; NL filters.

### Collections *(within Library)*
- **Purpose:** User-defined groupings of sources (by topic/project/client/course).
- **Entry points:** Library sidebar, drag-to-collection, a collection deep link.
- **Exit points:** a document → Reader; collection-scoped Search/AI.
- **Relationships:** child of Library; defines a scope for Search and AI.
- **Navigation rules:** nestable; a collection is a first-class scope.
- **Permissions:** own; (future) shared.
- **Future expansion:** smart/rule-based; shared/team; collection-level analytics.

### AI Workspace *(summoned panel/surface, not a rail item)*
- **Purpose:** The grounded conversation surface — Q&A, tutor, compare/debate, deep research — scoped to the corpus.
- **Entry points:** the `/` Ask bar (any surface), select-to-ask in the Reader, "Ask AI" from Search, a concept → "ask about this." Standalone full view via palette ("Open AI Workspace").
- **Exit points:** citation → Reader at span; "save as note" → Notes; "make flashcard" → Learning; close → return to prior surface with position intact.
- **Relationships:** reads Knowledge + corpus; writes Notes/Flashcards/Graph; never an island.
- **Navigation rules:** side panel (desktop/tablet, no canvas reflow) or bottom sheet (mobile) when summoned in-context; full view when standalone.
- **Permissions:** own corpus; scope explicit + switchable.
- **Future expansion:** multi-doc research; voice; shareable conversations.

### Settings
- **Purpose:** Tune reading, AI, learning, privacy, appearance, accessibility, shortcuts.
- **Entry points:** profile menu, `⌘,`, deep links from contextual "configure" affordances.
- **Exit points:** back to prior surface; live reading preview.
- **Relationships:** configures every feature.
- **Navigation rules:** searchable; categorized; instant apply.
- **Permissions:** own settings; (future) org policy overrides.
- **Future expansion:** profiles/presets; team policy.

### Profile
- **Purpose:** Identity, account, knowledge footprint, plan, connected services, data export/delete.
- **Entry points:** rail avatar, profile menu.
- **Exit points:** account sub-flows; data export.
- **Relationships:** account spans auth, billing, integrations, analytics (footprint).
- **Permissions:** own account.
- **Future expansion:** achievements; opt-in public profile; device sessions.

### Analytics
- **Purpose:** Honest, motivating insight — reading + learning trends, mastery, knowledge growth.
- **Entry points:** rail (activates after enough data), Home stats, Profile footprint, `g s`.
- **Exit points:** drill into a doc/concept (Knowledge/Library), "review now" → Learning.
- **Relationships:** reads Progress + Learning + Knowledge; feeds recommendations.
- **Navigation rules:** every chart has a text/table equivalent; non-punitive framing.
- **Permissions:** own data.
- **Future expansion:** comparisons; predictive insights; weekly recap; (privacy-safe) benchmarks.

### Global navigation rules
- **Command Palette is the universal accelerator** — every destination/action reachable, keyboard-first.
- **Back always works** and returns with state intact (scroll, selection, panel state preserved).
- **Deep links** to documents, positions, concepts, conversations, collections.
- **Reader & review sessions hide the rail** to protect focus; everything else shows it.
- **Progressive activation:** Knowledge, Learning, Analytics rail items reveal/activate when they have value (PRD progressive disclosure).

---

# SECTION 3 — USER FLOWS

Format per flow: **Goal · Starting State · Steps · Decision Points · Success State · Failure States → Recovery.** Steps are the canonical happy path; decision points branch it.

### 3.1 First Launch
- **Goal:** Get a new user to understand the category and reach the magic moment fast.
- **Starting state:** unauthenticated, landing page.
- **Steps:** 1) See the value-demo (upload→ask→cited answer→flashcards). 2) Try the interactive sample (no signup) *or* click Sign Up. 3) If sample: experience a cited answer on a provided doc. 4) Prompt to sign up to "keep this."
- **Decision points:** sample vs. signup; learner-intent question (skippable).
- **Success state:** account created with intent seeded, landed on an inviting Home with a clear "Add your first source."
- **Failure states → recovery:** sample fails to load → fallback static demo + "try again"; bounce → no penalty, return anytime.

### 3.2 Sign Up
- **Goal:** Account in seconds.
- **Starting state:** signup screen.
- **Steps:** 1) Choose method (passkey / Google / Apple / magic link). 2) Authenticate. 3) (Optional) one personalization question. 4) Land on Home.
- **Decision points:** method choice; skip personalization.
- **Success state:** authenticated; session persisted; Home.
- **Failure states → recovery:** email already exists via another method → offer account linking; magic-link expired → resend; social auth denied → choose another method; passkey unsupported device → fall back to magic link.

### 3.3 Upload Book
- **Goal:** Add a source and start reading ASAP.
- **Starting state:** Home/Library, authenticated.
- **Steps:** 1) "Add source" (drag-drop / file / URL). 2) File validates + uploads (progress). 3) Ingestion begins; status card shows pipeline. 4) Document becomes readable when parsed; "knowledge building" continues. 5) "Ready."
- **Decision points:** format detected; scanned-PDF → OCR offered; duplicate → "already in library, open it?"
- **Success state:** document in library, openable, knowledge-ready.
- **Failure states → recovery:** unsupported format → message + suggestion; corrupt file → retry/replace; OCR needed → one-tap OCR; network drop → resumable upload; ingest failure → recoverable card (retry/replace) without blocking the library.

### 3.4 Open Reader
- **Goal:** Begin reading instantly at the right place.
- **Starting state:** a document in Library/Home/Search.
- **Steps:** 1) Open. 2) Reader loads (cached → instant; uncached → first window fast). 3) Position restored. 4) Rail/chrome recede.
- **Decision points:** first open (start at top) vs. return (restore position); multi-device divergence (prompt if large gap).
- **Success state:** reading, position correct, canvas calm.
- **Failure states → recovery:** asset/image fails → placeholder+retry, text uninterrupted; not-yet-ingested → readable with "knowledge finishing" banner; offline never-opened → "needs connection" with queue option.

### 3.5 Highlight Text
- **Goal:** Capture a passage in under a second.
- **Starting state:** reading, text visible.
- **Steps:** 1) Select text. 2) Selection toolbar appears. 3) Tap Highlight (or `h`). 4) Highlight renders instantly (default color), persists.
- **Decision points:** color (later, optional); add note/ask now or later.
- **Success state:** highlight saved, visible, synced (or queued offline).
- **Failure states → recovery:** sync fails → "pending" dot, auto-retry, never lost; selection spans pages (PDF) → handled or clamped with feedback.

### 3.6 Ask AI
- **Goal:** Get a trustworthy, cited answer without leaving the page.
- **Starting state:** reading (optionally with a selection).
- **Steps:** 1) Summon AI (select→Ask, or `/`). 2) Scope shown (selection/doc). 3) Type/confirm question. 4) Answer streams with citations. 5) Tap a citation → jump to source; or act on the answer (note/flashcard/copy).
- **Decision points:** scope choice; depth ("simpler"/"deeper"); broaden scope if weak.
- **Success state:** cited answer received and trusted; optional capture. *(The activation event.)*
- **Failure states → recovery:** weak grounding → "not in your sources" + broaden/web-opt-in/labeled-general; model error → inline retry (question preserved); refusal → calm rephrase; offline → queue or "AI offline, reading works."

### 3.7 Create Note
- **Goal:** Capture a thought tied to the source.
- **Starting state:** reading or an AI answer.
- **Steps:** 1) Select → Note (or "save as note" from an answer). 2) Editor opens (anchored). 3) Write (rich text/Markdown, `[[ ]]` links). 4) Autosaves; jump-to-source works.
- **Decision points:** anchored vs. standalone; link to concepts.
- **Success state:** note saved (local-first), linked, backlinked.
- **Failure states → recovery:** offline → "saved locally, will sync"; broken `[[link]]` → unresolved-link fix; orphaned anchor → body preserved, re-place offered.

### 3.8 Generate Flashcards
- **Goal:** Turn reading into reviewable cards effortlessly.
- **Starting state:** a highlight, an AI answer, or a chapter/concept.
- **Steps:** 1) "Make flashcard" (from highlight/answer) or "Generate deck" (from chapter/concept). 2) AI drafts card(s) front/back. 3) User reviews/edits in a list. 4) Accept → cards scheduled (FSRS).
- **Decision points:** single card vs. deck; edit vs. accept; difficulty.
- **Success state:** cards created, scheduled, source-linked.
- **Failure states → recovery:** AI gen fails → manual create always available + retry; source deleted later → card still works.

### 3.9 Review Knowledge (Daily Review)
- **Goal:** Reinforce due material fast and satisfyingly.
- **Starting state:** Home/Learning, reviews due.
- **Steps:** 1) Start review. 2) Card shown → reveal answer → grade (Again/Hard/Good/Easy). 3) Next card (preloaded, zero wait). 4) Session summary.
- **Decision points:** grade per card; end early.
- **Success state:** queue cleared (or progressed); mastery updated; "all caught up" if done.
- **Failure states → recovery:** offline → grades queued; long absence → graceful re-onboarding, not a wall; AI-graded short answer fails → model answer + self-assess.

### 3.10 Export Notes
- **Goal:** Take knowledge out; prove ownership.
- **Starting state:** Notes/Highlights view, or Settings → data.
- **Steps:** 1) Choose what (highlights/notes/flashcards/all) + format (Markdown/CSV/Anki/BibTeX). 2) Confirm. 3) Export generated (async if large). 4) Download/link.
- **Decision points:** scope + format.
- **Success state:** complete, re-importable export delivered.
- **Failure states → recovery:** huge export → async job + notify when ready; partial failure → clear what succeeded + retry the rest.

### 3.11 Share Book *(deferred to v1.x; flow defined)*
- **Goal:** Share an insight/excerpt/cited answer (read-only), respecting copyright.
- **Starting state:** an answer, excerpt, or document.
- **Steps:** 1) Share. 2) Choose what (cited answer / excerpt — within excerpt limits / a public note). 3) Generate read-only link or copy-with-citation. 4) Manage/revoke.
- **Decision points:** what to share; link vs. copy.
- **Success state:** shareable artifact created; private library not exposed.
- **Failure states → recovery:** copyright limit hit → clipped excerpt + explanation; revoke → link dies cleanly.

### 3.12 Delete Book
- **Goal:** Remove a source and all derived data, safely.
- **Starting state:** Library, a document selected.
- **Steps:** 1) Delete. 2) Calm confirm ("This removes the document, its highlights, notes, and knowledge. Undo for 10s.") 3) Optimistic remove + Undo toast. 4) On toast expiry, cascade delete (blobs/vectors/graph).
- **Decision points:** undo vs. commit; "delete annotations too?" (default yes, clearly stated).
- **Success state:** document + derived data gone; graph re-linked.
- **Failure states → recovery:** Undo within window restores everything; delete fails server-side → revert + error.

### 3.13 Search
- **Goal:** Find anything fast and land on the exact span.
- **Starting state:** any surface.
- **Steps:** 1) Invoke (`⌘K` / search). 2) Type (results stream, hybrid). 3) Pick result type tab if needed. 4) Open → jump to span (highlighted) or → concept/note.
- **Decision points:** scope; result type; "ask AI instead."
- **Success state:** landed on the exact source/answer.
- **Failure states → recovery:** no results → AI fallback + broaden; backend down → local/cached results note.

### 3.14 Settings
- **Goal:** Find and change a setting confidently.
- **Starting state:** any surface.
- **Steps:** 1) Open (`⌘,`). 2) Search or browse category. 3) Toggle/adjust (instant apply; live preview for reading). 4) Done (no save needed).
- **Decision points:** which category; reset-to-default.
- **Success state:** setting applied + persisted.
- **Failure states → recovery:** save fails → revert to prior value + retry (no ambiguous state); search no-match → browse categories.

### 3.15 Notifications
- **Goal:** Stay informed on the user's terms.
- **Starting state:** any surface; a bell with optional count.
- **Steps:** 1) Open notification center. 2) Review grouped items (Today/Earlier). 3) Act (open / dismiss / mark all read). 4) (Optional) adjust cadence in Settings.
- **Decision points:** act vs. dismiss; cadence change.
- **Success state:** informed; inbox calm.
- **Failure states → recovery:** overload → digested/capped; long absence → gentle, not guilt.

### 3.16 Account
- **Goal:** Manage identity, plan, data.
- **Starting state:** Profile.
- **Steps:** 1) Edit profile / change email / manage plan / connected services / export / delete. 2) Confirm sensitive changes. 3) Apply.
- **Decision points:** plan up/downgrade; delete account (type-to-confirm).
- **Success state:** account updated; clear confirmation.
- **Failure states → recovery:** payment failure → clear next step, no data loss; email change → re-verify; delete → consequences stated, irreversible after confirm.

---

# SECTION 4 — PAGE SPECIFICATIONS

### 4.0 Global state baselines (apply to every page unless a delta is noted)
- **Loading:** skeletons matching final layout (never bare spinners for content); content streams in; optimistic for user actions; ≥120ms delay before showing a skeleton (avoid flash).
- **Empty:** an *invitation* — one line of value + one primary CTA (+ sample where relevant). Never a blank "no data."
- **Error:** calm, plain-language cause + the one fixing action + Retry; inline + scoped (never a global toast that loses place); never a raw stack trace.
- **Offline:** local-first content works; a non-alarming offline indicator; network-only actions show "needs connection" with queue where sensible.
- **Accessibility:** §12 baseline (one `<h1>`, landmarks, keyboard-complete, SR labels, focus management, reduced-motion).
- **Performance:** interaction feedback <100ms; page transition 150–200ms; data via skeleton→content; budgets in [DESIGN-SYSTEM](DESIGN-SYSTEM.md)/UX App.

Per page below: **Purpose · Primary goal · Secondary goals · Required components · Optional components · State deltas · Keyboard · Responsive · Perf · Future.** (States/a11y inherit §4.0 + §12 unless noted.)

### 4.1 Landing Page
- **Purpose:** Convert a skeptic by demonstrating the category.
- **Primary:** start the value demo / sign up. **Secondary:** try sample; learn more.
- **Required:** hero value statement; interactive/animated demo; primary CTA; social proof; footer.
- **Optional:** pricing teaser; comparison.
- **Deltas:** Empty/Offline n/a (public, static-cacheable). Error → static fallback demo.
- **Keyboard:** tab through CTAs; demo operable.
- **Responsive:** single-column mobile; demo adapts.
- **Perf:** fast first paint; demo lazy-loaded.
- **Future:** personalized landing by referral.

### 4.2 Auth (Sign up / Sign in)
- **Purpose:** Effortless, secure entry.
- **Primary:** authenticate. **Secondary:** switch method; recover.
- **Required:** method buttons (passkey/social/magic-link); status; legal links.
- **Optional:** one personalization question (signup).
- **Deltas:** Error → method-specific (expired link, denied social, linking).
- **Keyboard:** full; primary method focused.
- **Responsive:** centered card all sizes.
- **Perf:** instant; auth round-trip <2s perceived.
- **Future:** SSO; MFA.

### 4.3 Home / Dashboard
- **Purpose:** Calm launchpad. **Primary:** resume reading. **Secondary:** today's review; recent; a connection; Ask.
- **Required:** continue-reading hero; today (reviews/tutor); recent list; Ask bar; (one) whisper slot.
- **Optional:** streak/footprint; goals; recommendation.
- **Deltas:** Empty (new user) → welcome + "Add your first source" + sample. Loading → hero first.
- **Keyboard:** `Enter` resume; `r` review; `/` ask; `1–9` recents.
- **Responsive:** desktop bento; tablet 2-col; mobile vertical stack + bottom bar.
- **Future:** customizable widgets; AI daily briefing.

### 4.4 Library
- **Purpose:** Manage corpus. **Primary:** open a document. **Secondary:** add, organize, search, filter.
- **Required:** view grid/list/cover; "Add source"; sort/filter; collections sidebar; search-in-library; ingest-status on cards.
- **Optional:** bulk-action bar; quick-look panel.
- **Deltas:** Empty → drop zone + formats + sample. Failed-ingest cards distinct + recoverable.
- **Keyboard:** arrows navigate, `Enter` open, `Space` quick-look, `n` add, `/` search, `⌘A` select-all, `Del` delete.
- **Responsive:** desktop dense grid + sidebar; tablet 3-col + collapsible collections; mobile 2-col + filter sheet + FAB.
- **Perf:** virtualized; covers lazy.
- **Future:** smart collections; shared libraries.

### 4.5 Collection (detail)
- **Purpose:** A focused subset + a scope for AI/Search.
- **Primary:** open a document in context. **Secondary:** edit collection; scope AI/search to it.
- **Required:** collection header (name, count, scope-AI button); document grid/list; sort/filter.
- **Deltas:** Empty → "add documents or drag them here."
- **Keyboard:** as Library.
- **Responsive:** as Library.
- **Future:** collection analytics; sharing.

### 4.6 Reader *(see §5 for full depth)*
- **Purpose:** Read. **Primary:** read comfortably with position restore. **Secondary:** capture, ask, navigate.
- **Required:** reading canvas; minimal auto-hiding topbar (title, progress, controls, AI dot); selection toolbar (on select); TOC; reading controls; thin progress bar.
- **Optional:** AI side panel; notes margin; annotation gutter; read-aloud mini-player; focus mode.
- **Deltas:** Loading → text first, images lazy, position pre-restored. Empty (no annotations) → nothing shown (canvas only). Offline → reads cached docs; AI affordance shows offline state.
- **Keyboard:** full reader map (§5.x): `←/→`/`Space` page, `j/k` scroll, `g g`/`G`, `h` highlight, `n` note, `/` ask, `b` bookmark, `o` TOC, `f` focus, `⌘F` find, `t` theme, `a` read-aloud, `Esc`.
- **Responsive:** desktop centered measure + side panel (no reflow); tablet dual-pane + stylus; mobile full-screen + bottom sheets + tap zones.
- **Perf:** instant cached open; 60fps; no layout shift.
- **Future:** split view; embedded media; collaboration.

### 4.7 AI Workspace *(see §6)*
- **Purpose:** Grounded conversation. **Primary:** ask + get cited answers. **Secondary:** compare/debate/research; act on answers.
- **Required:** scope chip; message stream (cited); input; stop control; suggested prompts (empty); message actions; sources tray.
- **Optional:** conversation history; mind-map view; compare view.
- **Deltas:** Empty → scoped suggested prompts. Loading → streaming + retrieval status. Error → inline per-message retry. Offline → "AI offline," queue option.
- **Keyboard:** `/` focus, `Enter` send, `⌘Enter` deeper, `↑` edit last, `Esc`/`⌘.` stop, `c` copy, `s` save-note, `f` flashcard.
- **Responsive:** desktop right panel/float; tablet side panel beside reader; mobile bottom sheet.
- **Perf:** first token <1s.
- **Future:** voice; multi-doc research; sharing.

### 4.8 Knowledge Graph *(see §7)*
- **Purpose:** Explore connections. **Primary:** explore + focus a node. **Secondary:** filter, jump to source, tutor/cards from a node.
- **Required:** graph canvas (desktop/tablet); node detail panel; filter/layout controls; search-in-graph; **list/tree equivalent** (all platforms).
- **Optional:** layout switcher; contradiction/prerequisite views.
- **Deltas:** Empty → sample/illustrative graph + "grows as you read." Loading → progressive build + "building your graph." Error → fallback concept list. Mobile → simplified neighbor list (read-mostly).
- **Keyboard:** `f` fit, `+/-` zoom, arrows pan, `/` search nodes, `Enter` focus, `e` expand, `Tab` cycle nodes, `Esc`.
- **Responsive:** desktop full WebGL; tablet touch graph; mobile focused list.
- **Perf:** settles then stops (no perpetual motion); reduced-motion → static.
- **Future:** timeline/contradiction/prerequisite layouts; shared knowledge.

### 4.9 Concept Page *(see §7.2)*
- **Purpose:** Everything about one concept. **Primary:** understand it + see all sources. **Secondary:** tutor it; make cards; explore neighbors.
- **Required:** concept summary (AI, cited); source list (jump); definitions; related concepts; actions (tutor/cards/ask).
- **Optional:** mini-graph; quotes; vocabulary.
- **Deltas:** Empty (thin) → what's known so far + "read more to enrich."
- **Keyboard:** standard; `Tab` through sources/related.
- **Responsive:** desktop two-column (summary + sources/related); mobile stacked.
- **Future:** mastery on the page; learning-path entry.

### 4.10 Entity Page — as Concept Page, tuned to entities (people/orgs/works): description, appearances across sources, related entities, external refs.

### 4.11 Timeline / Framework Explorer / Skill Explorer *(see §7)*
- **Purpose:** Specialized knowledge views. **Primary:** navigate the structure (chronology / framework components / skills). **Secondary:** jump to source; tutor/cards.
- **Required:** the structure view (timeline track / framework component map / skill tree); detail-on-select; provenance.
- **Deltas:** Empty → genre-appropriate "not present in this corpus yet."
- **Responsive:** desktop rich; mobile simplified list.
- **Future:** cross-source merged views.

### 4.12 Search *(see §9)*
- **Purpose:** Find anything. **Primary:** find + jump to source. **Secondary:** filter; ask instead.
- **Required:** input; result list (typed, snippet, source); scope; result-type tabs; filters.
- **Optional:** preview pane; saved/recent.
- **Deltas:** Empty (pre-type) → recent + suggested concepts. No-results → AI fallback. Offline → cached results note.
- **Keyboard:** type; `↑/↓`; `Enter` open; `⌘Enter` ask AI; `Tab` tabs; `Esc`.
- **Responsive:** desktop palette-grade + preview; tablet overlay + preview; mobile full-screen + segmented tabs.
- **Future:** voice; saved searches.

### 4.13 Flashcards / Daily Review *(see §8)*
- **Purpose:** Reinforce. **Primary:** clear the due queue. **Secondary:** browse decks; edit; stats.
- **Required:** focused card view; reveal/grade controls; progress; session summary.
- **Optional:** deck browser; source preview.
- **Deltas:** Empty (no cards) → "make a card from a highlight"; No reviews due → "all caught up ✓ next due X."
- **Keyboard:** `Space` reveal; `1–4` grade; `e` edit; `s` suspend; `u` undo; `Esc`.
- **Responsive:** mobile flagship (big buttons + swipe gestures + haptics); tablet larger; desktop keyboard-fast.
- **Perf:** preloaded next card (zero wait).
- **Future:** card types; Anki sync.

### 4.14 Quizzes *(see §8)*
- **Purpose:** Self-assess. **Primary:** answer + get cited feedback. **Secondary:** retake; misses→cards; explain.
- **Required:** question view (typed controls); progress; results with cited explanations.
- **Deltas:** Empty → "quiz me on my last chapter"; doc-not-ready → explain + notify.
- **Keyboard:** `1–9/a–d` select; `Enter` submit/next; `p` prev; `r` retake; `f` flashcard miss.
- **Responsive:** mobile one-per-screen + swipe; desktop single or full-set.
- **Future:** exam/timed mode.

### 4.15 AI Tutor *(see §8)*
- **Purpose:** Personalized teaching. **Primary:** learn via dialogue. **Secondary:** practice; plan; jump to source.
- **Required:** conversation (cited); quick-reply chips; strategy/depth controls; study-plan access; mastery indicator.
- **Optional:** source/whiteboard pane; session history.
- **Deltas:** Empty → "teach me from my reading / where I'm weak." Cold-start → tutor reads with the user.
- **Keyboard:** `/` input; `Enter` send; `⌘Enter` deeper; `q` quiz me; `f` flashcard; `p` plan; `Esc` pause.
- **Responsive:** mobile conversational + voice; tablet chat + source pane; desktop multi-pane cockpit.
- **Future:** voice tutoring; longitudinal companion.

### 4.16 Learning Paths *(see §8)* — structured module→lesson view tied to sources; progress; "next." Empty → "set a goal." Responsive: list on mobile, board on desktop.

### 4.17 Analytics
- **Purpose:** Honest insight. **Primary:** see key trends. **Secondary:** drill in; act.
- **Required:** trend cards/charts (with text equivalents); time-range; drill-down.
- **Deltas:** Insufficient data → "read more, insights appear after a few sessions"; pipeline lag → "catching up."
- **Keyboard:** `1/2/3` ranges; `Tab` charts; `Enter` drill; `e` export.
- **Responsive:** mobile metric cards (swipe ranges); desktop dashboard.
- **Future:** comparisons; predictive; recap.

### 4.18 Profile
- **Purpose:** Account + footprint. **Primary:** manage account. **Secondary:** see footprint; export.
- **Required:** header; knowledge footprint; account sections (email/auth/plan/connections); export; delete.
- **Deltas:** New user → first milestone placeholder.
- **Keyboard:** `e` edit; `⌘S` save; `Tab`.
- **Responsive:** mobile grouped-list drill-down; desktop sectioned.
- **Future:** achievements; device sessions.

### 4.19 Settings
- **Purpose:** Control. **Primary:** find + change a setting. **Secondary:** navigate categories.
- **Required:** settings search; category nav; controls (instant apply); reading live preview; prominent Accessibility category.
- **Deltas:** Search no-match → browse categories.
- **Keyboard:** `⌘,` open; `/` search; arrows; `Enter`; `Esc`.
- **Responsive:** mobile grouped-list; desktop master-detail.
- **Future:** profiles; team policy.

### 4.20 Notifications (center)
- **Purpose:** Reviewable events, calm. **Primary:** review + act. **Secondary:** cadence.
- **Required:** grouped list (Today/Earlier); item rows (icon/title/time/unread); mark-all-read; settings link.
- **Deltas:** Empty → "all caught up."
- **Keyboard:** navigable list; `Enter` act; `Esc`.
- **Responsive:** desktop popover; mobile full-screen.
- **Future:** push; smart timing.

---

# SECTION 5 — READER EXPERIENCE

The product's soul. Every interaction below assumes the *canvas-is-sacred* principle: at rest, only content.

### 5.1 Reading Modes
| Mode | What | Enter | Behavior |
|---|---|---|---|
| **Page Mode** | paginated, book-like | controls / `p` toggle | discrete page turns (instant/calm fade); tap-zones (mobile); two-page spread on wide screens; page identity is a locator, "page X of Y" is an estimate for reflowable |
| **Scroll Mode** | continuous flow | controls / `p` toggle | virtualized vertical flow; chrome hides on scroll-down; momentum; default for web/articles |
| **Focus Mode** | distraction-free | `f` | everything but the current paragraph(s) dims; optional line-by-line ruler; exits on `Esc`/scroll; ideal for deep/ADHD reading |
| **Study Mode** | read + learn together | controls | reader + persistent knowledge sidebar (concepts on this page, key terms, "make cards from this chapter"); for active study sessions |
| **Split View** | two surfaces | controls (tablet/desktop) | reader + (AI / notes / graph / a second doc); resizable; reader column never reflows when the panel opens/resizes |

Mode preference persists per document. Switching modes preserves position exactly.

### 5.2 AI Side Panel
Summoned (select→Ask, `/`, or AI dot). Slides in (`spring-smooth`, ≤240ms) **without reflowing the reading column** (it overlays the margin/gutter or pushes within reserved space). Shows scope chip + streamed cited conversation. Hovering a citation highlights the source span *in the reader* in real time. Dismiss: `Esc` / tap-away / close — reading position untouched. Mobile: bottom sheet instead.

### 5.3 Dictionary / Define
Select a word → "Define" (or double-tap word + Define). A lightweight popover (`pop`, `spring-snappy`) shows: definition (from the document's own definitions/vocabulary if present, else general), part of speech, and "Ask AI for more / Add to vocabulary." Inline, dismissible, never navigates away. For domain terms, prefers the *source's* definition (grounded).

### 5.4 Selection
On selection settle, the **selection toolbar** appears above the selection (`Highlight · Note · Ask · Explain · Define · Copy`). Touch: native handles + repositioned toolbar (avoid system menu). Stylus: draw-across to select → highlight. Cross-block selection supported; cross-page in continuous PDF supported (clamped to page in single-page mode). `Esc`/tap-away clears. Selection survives minor scroll; clears on navigation.

### 5.5 Highlight
Select → Highlight (`h`) → **instant optimistic** render (default color), no dialog. Gutter marker for off-screen highlights. Hover/long-press a highlight → actions (recolor to 5 legibility-tested colors, note, ask, flashcard, copy-with-citation, delete). Survives reflow/theme/resize/re-ingestion. Colors carry optional labels (never color-only meaning).

### 5.6 Bookmark
`b` or tap → ribbon glyph at the position, instant. Bookmark list in TOC/outline, ordered, jump on select. Last-read position auto-restores regardless of bookmarks.

### 5.7 Annotation (Notes)
Select → Note → anchored editor (margin on desktop/tablet, bottom sheet on mobile). Rich text + Markdown + `[[ ]]` links. Autosaves (local-first). Gutter marker; click → scroll + open. Handwriting (stylus) → optional OCR. Jump-to-source always works.

### 5.8 Reading Progress
Thin top progress bar (not a number nag). "X min left in chapter" on demand. Char-offset-based % (stable across font changes). Persists + syncs continuously; furthest-position restore across devices.

### 5.9 Table of Contents (TOC)
`o` or control → slide-in outline; current section highlighted; nested/collapsible; jump on click (scroll + brief target flash). Includes bookmarks + (Study Mode) chapter concept counts.

### 5.10 In-Document Search
`⌘F` → find bar (query, count "3 of 47", next/prev, options: case/whole-word/regex). Matches highlighted (distinct from user highlights), navigation cycles + flashes active match. Works offline. `Esc` closes + clears.

### 5.11–5.20 Rich content interactions
| Content | Interaction |
|---|---|
| **Images** | lazy-load with aspect placeholder (no shift); tap → lightbox zoom/pan; "Ask AI about this figure"; alt text for SR; failed → placeholder+retry |
| **Tables** | preserved; horizontal scroll with edge cue; tap cell to focus; "explain this table" AI action; SR-navigable as a real table |
| **Footnotes** | superscript → popover preview (no navigation); "go to note" for full; back-link returns to position |
| **References / Citations (source's own)** | inline link → preview popover; "find this source" (web, opt-in) / "is this in my library?"; (research papers) resolved bibliography |
| **Code Blocks** | monospace, horizontal scroll, optional syntax highlighting, copy button on hover; "explain this code" AI action; never wraps illegibly |
| **Math** | rendered (MathML/pre-rendered), never raw LaTeX; "explain this equation" AI action; SR-readable |
| **Diagrams** | rendered image/figure treatment; zoom; "explain this diagram"; alt text |
| **Media (audio/video sources)** | inline player synced to the transcript; tapping transcript seeks; highlight/note/ask anchored to timestamps; read-along highlighting |

Every rich element supports the same universal actions where meaningful: **highlight · note · ask · jump-to (provenance)**.

---

# SECTION 6 — AI EXPERIENCE

All AI interactions: grounded, cited, streamed, scope-visible, stop-able, calm. (Engine: [AI-ENGINE-SPEC.md](AI-ENGINE-SPEC.md).)

| Interaction | UX |
|---|---|
| **Ask AI** | `/` Ask bar or select→Ask. Scope chip visible/switchable. Streams cited answer (first token <1s). Suggested prompts when empty. Message actions (note/flashcard/graph/copy/retry/deeper). |
| **Selection Actions** | from the selection toolbar: Explain (this passage), Define, Ask (free question scoped to selection), Summarize. One tap, answer in the panel, cited back to the selection. |
| **Chapter Summary** | "Summarize this chapter" (TOC action or prompt). Streams a structured, cited summary (key points → citations). One-tap "make flashcards from this." |
| **Explain Like I'm 5** | depth control / prompt. Re-explains the current concept simply with an everyday analogy; "go deeper" returns to full depth. Same content, dialed accessibility. |
| **Examples** | "Give me an example" → concrete, cited example(s) from the source or, if absent, clearly-labeled generated examples. |
| **Analogies** | "Explain by analogy" → a relatable analogy + how it maps + where it breaks down (so the analogy doesn't mislead). |
| **Quiz Generation** | "Quiz me" → choose scope/length/type; generated quiz with cited feedback (§8). |
| **Flashcards** | "Make flashcards" → AI drafts editable cards from selection/chapter/concept (§8). |
| **Mind Maps** | "Map this" → a visual concept map of the chapter/topic (a focused graph view) with nodes linking to source + the full Knowledge Graph. |
| **Compare Concepts** | "Compare X and Y" → a structured side-by-side (similarities/differences/when-to-use), each row cited to its source. |
| **Debate Concepts** | "Argue both sides" → a balanced, cited steelman of each position; explicitly labeled as exploration; surfaces real contradictions from the corpus where they exist. |
| **Conversation Memory** | the assistant remembers the session + relevant prior turns + the user's known concepts; long chats compact transparently (no "too long" wall); scope/context always visible. |
| **Citation Display** | inline `[n]` chips; hover/tap → provenance popover (exact quote + locator) + "Jump to source." Hovering in the reader highlights the span live. Sources tray lists all sources used. |
| **Hallucination Handling** | below grounding threshold → "I couldn't find this in your sources" + options (broaden scope / search web (opt-in) / answer from general knowledge *clearly labeled*). Never silent fabrication. |
| **Streaming Responses** | token-by-token with a thinking/shimmer indicator before first token (for deeper questions, with status: "Searching 12 sources… Found 6 passages"). Stop always available. |
| **Error Recovery** | model error → inline "Couldn't complete — Retry" with the question preserved; fallbacks happen invisibly; only surfaced if all fail; never loses the conversation. |
| **Rate Limits** | approaching a limit → a calm, proactive note ("You've used most of today's AI — resets in 4h" or "Upgrade for more"); at the limit → graceful block with a clear path (wait/upgrade), reading/notes still fully work. Never a cryptic 429. |
| **Safety Messages** | a refusal is a calm, brief explanation + a rephrase offer, never a dead end or a lecture; content the model declines is handled with dignity; benign false-positives quietly fall back to another model where possible. |

---

# SECTION 7 — KNOWLEDGE EXPERIENCE

Every knowledge surface: provenance-bound (jump to source), cross-source, and dual-rendered (visual + accessible equivalent).

| Surface | UX |
|---|---|
| **Knowledge Graph** | interactive canvas (desktop/tablet) — pan/zoom, focus a node → detail panel; filter by type/doc/time; layouts (force/hierarchy/timeline); "explain this connection" (AI). Mobile: focused neighbor list. **Mandatory keyboard/SR list-tree equivalent everywhere.** Every node/edge → provenance. |
| **Concept Pages** | one concept's home: AI cited summary, all sources (jump), definitions, related concepts, quotes, vocabulary, actions (tutor/cards/ask). |
| **Entity Pages** | a person/org/work: description, appearances across sources, related entities, external refs, timeline of mentions. |
| **Relationships** | typed, directed, labeled edges (line style + label, never color-only); click an edge → evidence (the quote + locator that supports it); filter by relation type. |
| **Vocabulary** | a domain glossary deck per doc + corpus-wide; term, definition, difficulty, example (with locator); "add to flashcards"; deduped against known terms. |
| **Definitions** | inline (reader define popover) + a browsable glossary; multiple definitions of a term shown with sources, best-ranked first. |
| **Timeline** | a chronological track of events (date → event → entities/concepts); zoomable; fuzzy/relative dates marked; click → source. Most prominent for history/biography. |
| **Framework Explorer** | a framework as a structured map of its components (ordered/typed); each component → description + source; "teach me this framework" (tutor). |
| **Skill Explorer** | skills the corpus develops, leveled, mapped to concepts; shows mastery (§8); "practice this skill." |
| **Related Knowledge** | on any concept/passage, a "related" rail (semantically + graph-related items across the corpus) → discovery. |
| **Cross-document Links** | surfaced connections ("you read about this in 3 sources"; "these two disagree about Y"); the compounding-value surface; calm, one-at-a-time when proactive. |
| **Bookmarks** | (knowledge bookmarks) pin a concept/entity/framework for quick return; distinct from reading bookmarks. |
| **Collections** | scope knowledge views to a collection ("concepts in my Psychology collection"). |
| **Knowledge Search** | search concepts/entities/frameworks by name + meaning; lands on the knowledge page (not just a passage). |

---

# SECTION 8 — LEARNING EXPERIENCE

| Surface | UX |
|---|---|
| **Flashcards** | created from highlight/answer (1 tap) or AI-drafted decks (editable); front/back; source-linked; deck management; never forced manual creation. |
| **Spaced Repetition** | FSRS scheduling, invisible to the user — they just see "what's due." Calm: "all caught up ✓ next due X." Never a guilt-inducing pile. |
| **Daily Review** | a focused session (reveal → grade Again/Hard/Good/Easy), preloaded next card (zero wait), haptics on mobile, swipe gestures (+ button equivalents), session summary. |
| **Learning Goals** | set a goal ("understand X by date") → drives a learning path + review emphasis; optional, never imposed. |
| **Progress Tracking** | per-concept and overall progress; reading + review combined; honest, non-punitive; visible on Home/Analytics. |
| **Knowledge Score** | a high-level, motivating measure of how much structured knowledge the user has built (graph density + breadth); the "your knowledge is growing" signal — celebratory, not competitive. |
| **Memory Score** | per-concept *recall* estimate (FSRS-derived, decays over time); drives the review queue; surfaces "this is slipping." Shown as bar + text value (never color-only). |
| **Understanding Score** | per-concept *comprehension depth* (can you explain/apply/connect it?), assessed via tutor dialogue + applied quizzes; distinct from memory. The pair (memory × understanding) defines mastery. |
| **Learning Paths** | AI-generated module→lesson sequence tied to the user's sources, ordered by prerequisite relationships, adapting to progress; a board (desktop) / list (mobile). |
| **AI Tutor** | the synthesis: teaches from the corpus, adapts to mastery, Socratic/explain-then-check/worked-example strategies, cited dialogue, generates practice mid-session, schedules reviews, sequences via the graph. Quick-reply chips offer next steps. |
| **Adaptive Difficulty** | quizzes/tutoring scale difficulty to the mastery model — harder where strong, foundational where weak; the user feels appropriately challenged, never crushed or bored. |
| **Revision Sessions** | a combined queue (cards + targeted quizzes) for a focused sitting; respects cadence + quiet hours; deadline-aware in exam mode. |
| **Achievements** | meaningful, calm milestones ("finished your first book," "100 concepts learned," "30-day reading habit") — celebratory and identity-affirming, never manipulative streak-pressure; opt-out-able. |

---

# SECTION 9 — SEARCH EXPERIENCE

| Aspect | UX |
|---|---|
| **Universal Search** | one input (`⌘K` palette or search surface) across documents, passages, concepts, notes, highlights, and actions. Search-as-you-type, debounced; results stream. |
| **Semantic Search** | hybrid (keyword + meaning) by default; results labeled by match type ("exact" vs "semantic match"); finds paraphrase and exact names alike. |
| **Filters** | scope (doc/collection/everything), source type, date, author, has-highlights; result-type tabs (Passages/Concepts/Notes/Highlights). |
| **Recent Searches** | shown before typing; one-tap re-run; clearable. |
| **Saved Searches** | save a query+scope+filters; pin to the search surface; (future) notify on new matches. |
| **Suggestions** | before/while typing: recent + trending concepts from the graph + query completions; makes a blank search productive. |
| **No Results** | never a dead end: "No matches for X — try broader, or **ask the AI**" (the semantic/AI fallback) + "remove a filter." |
| **Ranking** | reranked relevance (semantic + keyword fusion), with recency and scope as signals; the best result is auto-highlighted for `Enter`. |
| **Keyboard Shortcuts** | `⌘K`/`/` open; type; `↑/↓` navigate; `Enter` open; `⌘Enter` ask AI with the query; `Tab` switch result tabs; `Esc` close. Fully operable without a mouse. |

---

# SECTION 10 — DESIGN PATTERNS

When to use each (the *UX decision*; visual specs in Atlas §10–29).

| Pattern | Use when | Don't use when |
|---|---|---|
| **Cards** | grouping a self-contained, often-clickable unit (a book, a metric, an AI-generated item) | for dense tabular data (use a table); for a single linear list (use a list) |
| **Lists** | ordered/linear collections, dense and scannable (search results, settings rows, notes) | when items need rich media/preview (cards) |
| **Panels** | persistent contextual content beside the main surface (AI, notes, inspector) | for transient choices (menu) or blocking decisions (dialog) |
| **Dialogs (modal)** | a focused decision/task requiring full attention, blocking the background | for non-blocking info (toast) or rich ongoing work (panel/drawer) |
| **Context Menus** | object-specific actions on right-click/long-press/`⋯` | as the *only* path to an action (also expose via palette/visible affordance) |
| **Dropdowns/Selects/Menus** | choosing from a set, or a compact action list | for >~15 options without search (use a searchable combobox/palette) |
| **Hover Cards** | a rich preview of a referenced object (a concept chip, a citation, a doc) on hover | on touch-only contexts (provide tap-to-preview); for critical info (must be reachable without hover) |
| **Split Views** | comparing/working across two surfaces (reader + AI, two docs, graph + detail) | on small screens (collapse to one + a switcher) |
| **Resizable Panels** | power users tuning their workspace (reader/AI split, graph/detail) | where a fixed layout is clearly better; always provide sensible defaults + reset |
| **Command Palette** | fast, keyboard-first access to any destination/action; power-user accelerator | as the *only* way to do something (it complements, never replaces, visible UI) |
| **Inspector** | viewing/editing properties of a selected object (a highlight, a node, a card) | for navigation (use nav) |
| **Tooltips** | naming an icon-only control or adding a brief hint/shortcut | for essential instructions (must be visible, not hover-gated) or long content (popover) |
| **Progress Indicators** | communicating ongoing work (ingestion pipeline, export job, top-bar route load) | for instant actions (just do it optimistically) |
| **Toast** | transient confirmation/error + optional undo/retry; non-blocking | for critical info that must persist (notification/inline) or decisions (dialog) |
| **Modals** | (= modal dialog) see Dialogs | for routine flows that interrupt (prefer inline/panel) |
| **Drawers / Sheets** | secondary content slid from an edge (mobile AI/notes, filters, mobile menus) | on desktop where a panel reads better; for blocking decisions (dialog) |

**Cross-pattern rules:** one primary action per surface · every pattern keyboard-operable + SR-labeled · transient ≠ critical (never put must-not-miss info only in a toast) · prefer the *least interruptive* pattern that fits · destructive → undo-toast over confirm-dialog when reversible.

---

# SECTION 11 — RESPONSIVE UX

Not "shrink the desktop" — three (soon five) *intents*. (Breakpoints in Atlas §3.)

### Desktop (≥1025px) — *the deep-work cockpit*
Multi-pane; persistent rail; hover affordances; command-palette-driven; keyboard-first. Reader = centered measure column + optional side panel (no reflow) + margin gutter. Graph/analytics at full power. Resizable split views. The expert's environment.

### Tablet (641–1024px) — *the lean-back study device*
Dual-pane (reader + AI/notes side panel); stylus-first highlighting + handwriting; split view (read + graph/notes). The flashcard/quiz/tutor sweet spot. Touch targets ≥44px; hover affordances become tap/long-press.

### Mobile (≤640px) — *read & capture on the go*
Single column; bottom tab bar; AI/notes/filters as bottom sheets; thumb-reachable controls; gesture-driven (swipe to advance, swipe-to-grade cards). Reader = pure full-screen, chrome hides on scroll, tap-zones for paging. Heavy surfaces (graph, analytics) simplified to focused/read-mostly views. Flashcard review is the flagship mobile loop.

### Large Monitors (≥1921px) — *the panorama*
Don't stretch line length (reading stays measure-constrained, centered). Use the extra space for *more panes* (reader + AI + notes + graph simultaneously) or wider graph/analytics canvases — never for wider text. Optional multi-column library.

### Foldables (future)
Treat the unfolded state as a small tablet (dual-pane: reader on one panel, AI/graph on the other); respect the hinge/fold as a natural pane divider; folded state behaves as mobile. Continuity across fold (no state loss).

**Universal:** touch vs. pointer detected independently of width (tunes hit-targets + hover). Every gesture has a non-gesture equivalent. The reading column is *always* measure-constrained regardless of screen size.

---

# SECTION 12 — ACCESSIBILITY

The release-gate baseline (every page/component inherits this).

- **Keyboard-first Navigation:** 100% operable without a pointer; the Command Palette + per-surface shortcut maps are first-class a11y paths; logical tab order; `Esc` closes innermost layer; skip-to-content link.
- **Screen Readers:** semantic landmarks (banner/nav/main/complementary/contentinfo); correct roles + descriptive accessible names; AI streaming announced via `aria-live="polite"` in sensible chunks (never per-token spam); live regions for async results/counts; citations are labeled links; the Knowledge Graph's list/tree equivalent is fully SR-operable; charts have text/table equivalents + summaries.
- **Color Contrast:** WCAG 2.2 **AA** minimum; **AAA** for body reading text; large/UI text ≥3:1. Never color-only signaling (icon + text always). Color-blind-safe data palettes. Verified per token pair in both themes.
- **Reduced Motion:** `prefers-reduced-motion` → all non-essential animation becomes opacity-only/instant; no parallax/auto-play; looping animation (shimmer) stilled.
- **Focus Management:** visible high-contrast focus rings on everything focusable; focus trapped in modals/sheets with restore-to-trigger on close; opening the AI panel preserves and restores reading focus/position (SR users never lose their place).
- **ARIA Expectations:** use native semantics first; ARIA only to fill gaps; correct patterns for tabs/listbox/combobox/dialog/menu; `aria-current` for active nav; `aria-invalid`/`aria-describedby` for form errors; `aria-busy` while loading.
- **Touch Targets:** ≥44×44px on touch; adequate spacing; gestures have button equivalents.
- **Zoom:** supports 200% zoom and OS font scaling without loss of function; reflowable text reflows; PDF offers Clean Read reflowable view at zoom.
- **High Contrast:** supports forced-colors / OS high-contrast mode; a dedicated high-contrast reading theme; respects reduced-transparency (solid surfaces replace blur).
- **WCAG AA+:** AA is the floor, not the goal; reading text targets AAA; accessibility reviewed every release; the Accessibility settings category is prominent and first-class (font, contrast, motion, TTS, ruler, dyslexia font, target size).

---

# SECTION 13 — MICROINTERACTIONS

Each: **duration · purpose · feedback.** (Tokens from Atlas §9–10; all reduced-motion aware.)

| Interaction | Duration | Purpose | Feedback |
|---|---|---|---|
| **Hover** | `fast` 120ms | signal interactivity / preview | bg/border/color shift; cursor; rich hover-card after ~400ms dwell |
| **Click/Tap** | instant + `press` | confirm action registered | scale 0.98 down/up; immediate optimistic result |
| **Selection (text)** | instant | show what's selected; offer actions | selection highlight + toolbar appears above (fade+rise) |
| **Drag** | follows pointer | move/reorder | element lifts (elevation+slight scale); valid drop zones highlight |
| **Drop** | `base` 180ms | confirm placement | element settles into place (spring); invalid → springs back |
| **Loading** | — | communicate ongoing work | skeleton (content) / top progress bar (route) / inline spinner (sub-second); streaming where possible |
| **Success** | 300ms | confirm completion | check draw-on / brief toast / subtle pulse; never blocks |
| **Failure** | — | communicate + recover | inline scoped error + retry; gentle shake on invalid input; never a raw error |
| **AI Thinking** | loop until first token | show the AI is working (not frozen) | `ai.shimmer` gradient pulse + status text ("Searching 12 sources…") |
| **Streaming** | per chunk | show progress + let the user start reading | text fades in per chunk; citations resolve inline; stop always visible |
| **Bookmark** | 200ms | confirm save | ribbon glyph animates in; subtle haptic (mobile) |
| **Highlight** | instant | frictionless capture | color paints onto text immediately (optimistic); gutter marker appears |
| **Search** | debounced ~150ms | responsive results | results stream/re-rank with a subtle "refining" cue; count updates; match highlight |
| **Navigation** | `base` 150–200ms | orient the user across surfaces | cross-fade + slight slide; rail active-state indicator slides; jump-to flashes target |

**Rules:** every microinteraction has a *purpose* (feedback or orientation) — none is decorative. The reading canvas at rest has *zero* microinteraction motion. Never more than one attention-seeking microinteraction on screen at once. All disable/simplify under reduced-motion.

---

# SECTION 14 — EDGE CASES

UX handling for each (technical handling in [READER-SPEC §18](READER-SPEC.md) / [AI-ENGINE-SPEC §16–17](AI-ENGINE-SPEC.md)).

| Edge case | UX behavior |
|---|---|
| **No Internet** | persistent calm offline indicator; reading/annotation/review/in-doc-search work (local-first); network-only actions show "needs connection" + queue where sensible; nothing lost; auto-resumes on reconnect. |
| **Huge PDF** | opens fast (windowed); progress for first-time ingestion; smooth scroll; thumbnails lazy; never freezes; memory bounded. |
| **Broken EPUB** | ingestion surfaces a clear, recoverable error in the library ("Couldn't fully read this EPUB"); offers retry/replace; renders what it can; never a crash. |
| **Scanned Book (image-only PDF)** | detected → "This looks scanned — run OCR to enable search, AI, and selection?" one-tap; readable as images meanwhile; text features activate when OCR completes (banner). |
| **Corrupted File** | rejected at upload or flagged in library with plain cause + retry/replace; never blocks the rest of the library. |
| **No AI Credits** | calm, ahead-of-time notice ("You're near today's AI limit"); at limit → clear block with path (wait until reset / upgrade); reading, notes, search, review all keep working; never a cryptic error. |
| **Rate Limits** | invisible where possible (queue + retry); if user-facing, a calm "AI is busy, retrying…" then result; never a raw 429; provider fallback handled silently. |
| **Model Failure** | inline "Couldn't complete — Retry" with the question/context preserved; fallback model used invisibly; only surfaced if all fail; conversation never lost. |
| **Sync Conflict** | annotations merge silently (CRDT, no user action); divergent reading position across devices → a gentle prompt ("Continue from page 210 (laptop) or here?"); never a scary "conflict" dialog. |
| **Storage Full** (local/offline) | clear notice + one-tap manage (evict unpinned cached docs — annotations/queue never evicted); pinned content protected; graceful, not data-threatening. |
| **Deleted Book** | Undo toast (10s) before cascade; after commit, references (citations/cards) handle gracefully ("source removed" but card still works); graph re-links. |
| **Large Notes** | editor stays fast (virtualized if huge); autosaves; no truncation; export works async. |
| **Very Long AI Chat** | transparent context compaction (no "conversation too long" wall); a subtle "earlier context summarized" note; user can start a fresh scoped chat anytime; history retrievable. |

**Universal edge-case rules:** never blame the user · never show a raw error/stack · always state the cause in plain language + the one action to fix it · always preserve the user's work and place · reading and capture degrade last (they're local-first) · the calmest possible framing.

---

# SECTION 15 — UX PRINCIPLES CHECKLIST

**Every feature must pass this gate before it is approved for implementation.** A "no" on any non-negotiable is a blocker; a "no" on a quality bar requires explicit sign-off with rationale.

### Non-negotiable (a single "no" blocks the feature)
1. **Does it protect the reading canvas?** (No AI/chrome imposed on the page at rest. AI is summoned, not pushed.)
2. **Is every AI claim cited and traceable to a source span?** (No ungrounded output without an explicit "not from your sources" label.)
3. **Can it be completed with the keyboard only?** (And is it screen-reader operable, with no color-only or motion-required meaning?)
4. **Does it meet the accessibility floor?** (WCAG 2.2 AA; AAA for reading text; reduced-motion + reduced-transparency honored.)
5. **Does it preserve the user's work and place?** (Local-first, optimistic, autosaved; nothing lost offline or on error.)
6. **Is the user's data private and theirs?** (Private by default; exportable; no training without opt-in.)
7. **Does it have designed empty, loading, error, and offline states?** (No bare spinners, no blank "no data," no raw errors.)

### Quality bar (each "no" requires justification + sign-off)
8. **Does it reduce cognitive load?** (One primary action; recognition over recall; sensible defaults; no clutter.)
9. **Can a first-time user understand it without instruction?** (Progressive disclosure — power doesn't intimidate.)
10. **Does it improve understanding, retention, or application?** (It advances the read→understand→remember→apply loop — not engagement for its own sake.)
11. **Does it compound?** (Does using it make the product more valuable over time — feed the graph, the mastery model, the corpus?)
12. **Is it the calmest design that works?** (No manufactured urgency, no badge-screaming, ≤1 proactive interruption at a time.)
13. **Is motion purposeful?** (Clarifies a relationship or gives feedback; the canvas stays still; nothing decorative.)
14. **Does it respond instantly?** (Within the latency/motion budgets; optimistic; streamed; skeleton-first.)
15. **Is it consistent?** (Reuses an existing pattern; doesn't invent a new way to do an existing thing.)

### The taste test (the gut-check trio)
16. **Would Apple ship this?** (Is it crafted, clear, and delightful — or merely functional?)
17. **Would Linear keep this?** (Is it fast, focused, and free of bloat — or feature-creep?)
18. **Would Notion simplify this?** (Is it as simple as it can be while still powerful — or over-built?)

> **If a feature can't pass 1–7, it does not ship. If it can't pass 8–15 without strong justification, it goes back to design. If it fails the taste test, it isn't done.** This checklist is the contract between design, product, and engineering — and the standard for a billion-dollar product.

---

*End of Canonical UX Specification v1. This document is authoritative for experience decisions. It is reviewed when a load-bearing principle changes (the canvas-is-sacred rule, the trust/provenance guarantee, the accessibility floor, the assist-not-interrupt model). Visual values live in Atlas; product scope in the PRD; technical behavior in the deep-dive specs. Build every screen from here.*
