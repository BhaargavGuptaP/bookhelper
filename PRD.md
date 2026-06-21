# Product Requirements Document — BookHelper

## An AI-First Reading & Knowledge Platform

> **Mission:** Transform books into personalized learning experiences.
> **This is not an ebook reader.** It is an AI-first Knowledge Platform that helps people *understand, remember, connect, and apply* knowledge.
>
> **Document status:** PRD v1 — build-ready. **Authors:** Principal PM · Staff UX · Principal AI Architect · CTO.
> **Companion specs** (the *how*; this PRD is the *what* and *why*): [ARCHITECTURE](ARCHITECTURE.md) · [UX-DESIGN](UX-DESIGN.md) · [DESIGN-SYSTEM](DESIGN-SYSTEM.md) · [FEATURE-BREAKDOWN](FEATURE-BREAKDOWN.md) · [ROADMAP](ROADMAP.md) · [READER-SPEC](READER-SPEC.md) · [AI-ENGINE-SPEC](AI-ENGINE-SPEC.md) · [KNOWLEDGE-ENGINE-SPEC](KNOWLEDGE-ENGINE-SPEC.md) · [SPRINT-PLAN](SPRINT-PLAN.md).
>
> **Constraints honored:** no code, no database schemas, no API endpoints. Product requirements only.

**Supported sources (lifecycle):** Books · PDFs · EPUBs · Markdown · TXT *(v1)* → Research Papers · Articles · Web Pages · Personal Notes *(v1.x)* → Videos · Podcasts *(v2)*.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Goals](#2-goals)
3. [Target Users](#3-target-users)
4. [User Journey](#4-user-journey)
5. [Core Product Principles](#5-core-product-principles)
6. [Product Scope](#6-product-scope)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [AI Capabilities](#9-ai-capabilities)
10. [Knowledge Engine](#10-knowledge-engine)
11. [Learning System](#11-learning-system)
12. [Success Metrics](#12-success-metrics)
13. [Risks](#13-risks)
14. [Future Vision](#14-future-vision)

---

# 1. Executive Summary

### Vision
A world where reading reliably becomes *understanding that lasts*. Every book, paper, article, and talk a person consumes compounds into a personal body of knowledge they can recall, connect, and apply — guided by an AI tutor that knows what they've read and what they've forgotten.

### Mission
Transform books (and every other source) into personalized learning experiences — by turning passive reading into structured knowledge, grounded conversation, and durable memory.

### Problem Statement
Reading is humanity's highest-leverage learning activity and its most leaky. Three failures compound:
1. **Comprehension is unaided.** When a reader hits a hard passage, an unfamiliar term, or a connection to something they read before, they're alone. Search engines answer the internet's questions, not *this book's* in *this reader's* context.
2. **Retention collapses.** Most of what we read is forgotten within weeks (the forgetting curve). Highlights pile up unread; notes rot in silos. There is no system that closes the loop from *read → understand → remember → apply*.
3. **Knowledge doesn't connect.** Insight lives in the connections *across* sources, but every book is an island. Nobody can answer "where else have I read about this?" across their own library.

Existing tools each solve a sliver and stop: **e-readers** render pages; **AI chatbots** answer ungrounded questions and hallucinate; **note apps** store text you never revisit; **flashcard apps** demand manual card-making nobody sustains. None turn reading into compounding, applied knowledge.

### Opportunity
The frontier-model inflection makes a genuinely new product category possible: a **Knowledge Engine** that ingests anything, decomposes it into structured knowledge with full provenance, threads it into a personal knowledge graph, and drives an AI tutor and spaced-repetition system from the user's own corpus. The moat is **proprietary, per-user, compounding**: the graph and the learning history get more valuable with every source and every review — and are expensive to recreate elsewhere. We are not competing on page rendering or on chat; we are creating the category of *personal knowledge infrastructure*.

### Success Metrics (the five that matter; full set in §12)
| Metric | What it proves | v1 target |
|---|---|---|
| **Activation** — % who upload a source *and* get ≥1 cited answer in session 1 | the core loop lands | ≥ 55% |
| **Week-4 retention** — % of activated users active in week 4 | habit + value compounding | ≥ 35% |
| **Citation accuracy** — % of AI-cited spans that truly support the claim | the trust guarantee holds | ≥ 95% |
| **Retention lift** — recall on quizzed material vs. unaided baseline | learning actually happens | ≥ 2× baseline |
| **Knowledge density** — verified graph nodes per active user, growing | the moat compounds | monotonic growth |

---

# 2. Goals

### Business Goals
- **B1.** Establish a new category ("personal knowledge platform") with a defensible, compounding moat (the per-user graph + learning history).
- **B2.** Reach product-market fit on the prosumer learner segment (students, engineers, researchers, knowledge workers) before expanding to teams/enterprise.
- **B3.** Sustainable unit economics: AI cost-per-active-user within target via caching/routing/batching (§9); a freemium → subscription model where the paid tier unlocks unlimited sources, the tutor, and advanced learning.
- **B4.** Build the substrate for future ecosystem (plugins, integrations) and eventual VYANA OS integration without re-platforming.

### User Goals
- **U1.** Understand hard material faster, in context, without leaving the page.
- **U2.** Remember what they read — durably, with minimal effort.
- **U3.** Connect ideas across everything they've ever read.
- **U4.** Apply knowledge (frameworks, action items, skills) to real work and life.
- **U5.** Trust every AI answer (always cited, always traceable).
- **U6.** Own their knowledge — portable, private, exportable.

### Engineering Goals
- **E1.** Format-agnostic by construction: one Document Model + one locator system; adding a format is one adapter.
- **E2.** Provider-independent AI: no feature couples to a model vendor; capabilities and routing are configuration.
- **E3.** Local-first reading: instant, offline, optimistic; the network is an enhancement.
- **E4.** Trust + quality as release gates: citation accuracy, faithfulness, and prompt-injection defense are CI blockers, not aspirations.
- **E5.** Observability and cost attribution on every AI call from day one.

### AI Goals
- **AI1.** Grounded-by-default: the assistant's knowledge boundary is the user's corpus; ungrounded answers are explicitly labeled or declined.
- **AI2.** A tutor that teaches *from the user's sources* and adapts to *the user's gaps*.
- **AI3.** Automatic, verified knowledge extraction (eleven artifact types) on every upload.
- **AI4.** Quality that improves as models improve, with zero feature rewrites.

### Long-term Vision
Become the **operating system for personal knowledge** — the place all of a person's reading, learning, and thinking lives and compounds, accessible to them and (with consent) to the tools they use. Ultimately a first-class module of **VYANA OS**.

---

# 3. Target Users

Six personas. Each is a real design target; features trace to their needs. (Names are personas, not customers.)

### 3.1 Maya — The Student (Graduate, 24)
- **Goals:** Master dense course material; pass exams; synthesize across readings for papers; retain knowledge past the test.
- **Pain Points:** Volume overwhelms; highlights never revisited; can't connect lecture + textbook + papers; cramming → fast forgetting; expensive tutoring.
- **Daily Workflow:** 3–5 hrs reading textbooks/papers across devices; takes scattered notes; makes manual flashcards (rarely sustains); searches PDFs by Ctrl-F.
- **Reading Habits:** Heavy highlighter; re-reads before exams; reads on laptop + tablet; deadline-driven bursts.
- **AI Expectations:** "Explain this passage simply." "Quiz me on chapter 4." "What do I need to review before the exam?" Wants cited, trustworthy answers (academic integrity matters) and *teaching*, not just answers.

### 3.2 Raj — The Software Engineer (28)
- **Goals:** Learn new technologies/architectures deeply; retain technical concepts; extract applicable patterns; build a durable mental model.
- **Pain Points:** Reads docs/books/papers but forgets specifics; technical PDFs render badly; no way to connect a concept in a book to a real problem at work; jargon overload.
- **Daily Workflow:** Reads technical books, papers (arXiv), docs, long-form articles; bounces between sources; keeps a messy notes file; learns in short focused sessions.
- **Reading Habits:** Skims then deep-reads; values code/diagram fidelity; dark mode; keyboard-driven everything; reads on desktop + occasionally mobile.
- **AI Expectations:** Power-user: command palette, keyboard shortcuts, fast. "Explain this algorithm." "How does this relate to [pattern]?" "Make flashcards from this chapter." Expects accuracy and speed; allergic to fluff and hallucination.

### 3.3 Sofia — The Founder (35)
- **Goals:** Extract actionable frameworks fast; apply ideas to the business immediately; learn broadly but efficiently; never re-learn the same thing.
- **Pain Points:** No time for slow reading; wants the *applicable* core, not every detail; reads across business/psychology/strategy and forgets which book said what; action items never make it into execution.
- **Daily Workflow:** Reads in fragments (commute, between meetings); audiobooks/podcasts too; wants TL;DRs and frameworks; revisits notes when facing a decision.
- **Reading Habits:** Skim-heavy, applies the 80/20; mobile-first; listens as much as reads; bookmarks "to apply later."
- **AI Expectations:** "What's the core framework here?" "Give me the action items." "What did [book] say about pricing?" Wants synthesis, frameworks, action items, and instant retrieval across her library. Values calm, not clutter.

### 3.4 Dr. Chen — The Researcher (41)
- **Goals:** Stay current across a literature; find connections/contradictions across papers; build a citable knowledge base; synthesize for writing.
- **Pain Points:** Drowning in papers; can't track which finding came from where; contradictions across studies are invisible; reference management is fragmented from reading.
- **Daily Workflow:** Reads dozens of papers; annotates heavily; maintains a literature graph in her head; writes lit reviews; needs exact citations.
- **Reading Habits:** Deep, critical reading; cross-references constantly; cares about exact provenance and quotes; desktop-centric; large libraries.
- **AI Expectations:** "Summarize the methodology." "Which papers contradict this finding?" "Find every source that discusses [concept]." Demands *exact citations*, contradiction detection, and cross-document synthesis. Zero tolerance for fabricated references.

### 3.5 James — The Knowledge Worker (38, consultant/PM)
- **Goals:** Turn reading into applicable expertise for clients/work; build a personal knowledge base; retrieve the right insight at the right moment.
- **Pain Points:** Reads a lot but it evaporates; knowledge scattered across apps; can't surface "what I know about X" when a client asks; no system that connects reading to work.
- **Daily Workflow:** Reads business books, reports, articles, internal docs; takes notes; needs fast recall in meetings; juggles many topics.
- **Reading Habits:** Purposeful, topic-driven reading; highlights + notes; cross-device; values organization (collections by client/topic).
- **AI Expectations:** "Summarize what I've read on [topic]." "What are the key takeaways across these three reports?" Wants cross-source synthesis, strong search, and organization. Treats it as a thinking tool.

### 3.6 Eleanor — The Lifelong Learner (54)
- **Goals:** Learn for joy and growth; understand deeply; remember meaningfully; follow curiosity across topics.
- **Pain Points:** Reads widely but retains little; intimidated by complex AI tools; wants understanding, not productivity pressure; forgets and feels it.
- **Reading Habits:** Reads broadly (history, science, philosophy, fiction); savoring pace; comfort matters (font, theme, calm); tablet + e-reader feel.
- **Daily Workflow:** Evening/weekend reading; reflective note-taking; revisits favorites; not deadline-driven.
- **AI Expectations:** Gentle, encouraging, never overwhelming. "Help me understand this." "What's the big idea?" "Remind me what I learned." Wants a patient tutor and calm, beautiful reading — *progressive disclosure* so power never intimidates.

**Cross-persona design implications:** power-users (Raj, Dr. Chen) need keyboard/speed/exactness; casual users (Eleanor) need calm/progressive disclosure; appliers (Sofia, James) need synthesis/frameworks/action-items; learners (Maya, Eleanor) need teaching/retention. The product must serve all via **progressive disclosure** (UX P3) without compromising the calm reading core.

---

# 4. User Journey

The end-to-end arc, step by step. Each step states: *what the user does · the product's job · the emotional goal · the success signal.*

### Step 1 — Landing Page
- **User:** Arrives (referral, search, social). Skeptical: "another reading app?"
- **Product's job:** In one screen, communicate the category shift — *not a reader; a knowledge platform* — with a concrete, believable demo (upload → ask → cited answer → it becomes flashcards). Offer a no-signup interactive sample.
- **Emotional goal:** "Oh — this is different." Curiosity > skepticism.
- **Success signal:** Click-through to signup or sample.

### Step 2 — Signup
- **User:** Creates an account (magic link / social / passkey). Minimal friction; no long form.
- **Product's job:** ≤ 2 steps to an account; passkey/social one-tap; immediately ask the *one* useful question — "What do you want to learn?" or "Add your first source" — to seed personalization (light, skippable).
- **Emotional goal:** "That was effortless."
- **Success signal:** Account created; reaches the empty-but-inviting home.

### Step 3 — First Source
- **User:** Adds their first book/PDF (drag-drop, file, URL) — or tries the provided sample to skip the wait.
- **Product's job:** Make upload trivial (drag anywhere, paste a link); show *transparent* ingestion progress (Parsing → Embedding → Building knowledge → Ready) so the pipeline isn't a black box; let them start reading the moment it's parsed, even while knowledge finishes building.
- **Emotional goal:** "It's working, and I can already start."
- **Success signal:** First document reaches readable state; user opens it.

### Step 4 — Reading
- **User:** Reads. This is sacred — calm, beautiful, distraction-free.
- **Product's job:** Render faithfully + comfortably (themes, type, measure); restore position instantly; *no AI buttons shouting at them*. AI waits behind one predictable gesture (select text, press `/`).
- **Emotional goal:** "This is the nicest reading experience I've had." Flow, not friction.
- **Success signal:** Sustained reading session; time-in-reader.

### Step 5 — AI Assistance
- **User:** Hits something hard → selects text → "Explain" / "Ask." Or asks a question about the chapter.
- **Product's job:** Respond fast (< 1s to first token), *grounded in this source*, with citation chips that jump to the exact span. Show scope ("This book"). Offer depth ("simpler" / "go deeper"). Decline gracefully if not in the source.
- **Emotional goal:** "I can trust this — and it actually helped me understand." The first *magic moment*.
- **Success signal:** First cited answer received (the **activation event**).

### Step 6 — Knowledge Capture
- **User:** Highlights a passage; saves an insight; an AI answer → "Save as note" / "Make flashcard." Behind the scenes, the Knowledge Engine extracts concepts/entities/frameworks/etc.
- **Product's job:** Make capture frictionless (instant, optimistic highlights; one-tap note/flashcard); automatically build structured knowledge (the eleven artifacts) without asking; surface the first cross-source connection when it appears.
- **Emotional goal:** "My reading is turning into something." A sense of *accumulation*.
- **Success signal:** First highlight/note/flashcard; first knowledge artifacts visible; first graph connection.

### Step 7 — Revision
- **User:** Days later, returns to a small, calm review queue (due flashcards) and/or a quick quiz.
- **Product's job:** Schedule reviews intelligently (spaced repetition); make the review loop fast and satisfying; show what they're mastering and what's slipping — *without shame*. Generate cards/quizzes from their highlights and the extracted knowledge so they don't have to.
- **Emotional goal:** "I'm actually remembering this." Reinforcement, momentum.
- **Success signal:** First review completed; return visit for revision.

### Step 8 — Long-term Learning
- **User:** Over weeks/months, reads more, reviews regularly, asks the tutor to teach topics, watches their knowledge graph and mastery grow. Retrieves "what I know about X" across everything.
- **Product's job:** Compound the value: cross-source connections, a tutor that adapts to their growing mastery, a graph that gets richer, analytics that motivate. Make leaving costly (their knowledge lives here).
- **Emotional goal:** "This has become how I learn." Identity-level adoption.
- **Success signal:** Sustained retention (week-4+), growing graph, recurring tutor/review use, multi-source library.

**The loop:** Steps 4–8 are a flywheel — read → assist → capture → revise → learn — that strengthens with every cycle and every source. The product's North Star is users *completing this loop repeatedly*.

---

# 5. Core Product Principles

Non-negotiable beliefs that resolve every design debate. (Mirrors UX §1 / DESIGN-SYSTEM Appendix C.)

1. **AI should assist, not interrupt.** The reading canvas at rest is *only content* — no AI buttons, no nags. AI is *summoned* (select text, press a key), never imposed. *Why:* attention is the scarce resource; interruption destroys the flow that makes reading valuable. An assistant that demands attention is a liability.
2. **Reading should feel distraction-free.** Typography-first, calm, measure-constrained, themed for comfort; chrome recedes. *Why:* the reading experience is the foundation; if reading isn't a joy, nothing built on top matters. We earn the right to add intelligence by first protecting the page.
3. **Every interaction should increase understanding.** Every AI answer, highlight, quiz, and connection should leave the user understanding more than before — not just informed, *changed*. *Why:* understanding is the product, not engagement-for-its-own-sake. We optimize for learning, not time-on-app.
4. **Every book should become structured knowledge.** Automatically, on every upload, a source decomposes into concepts, entities, relationships, definitions, quotes, frameworks, action items, skills, vocabulary, and a timeline. *Why:* this is what makes us a knowledge platform, not a reader. The transformation is the value.
5. **Everything should be searchable.** Every passage, concept, note, and highlight — findable by phrase *and* by meaning, instantly, with a jump to the exact source. *Why:* knowledge you can't retrieve is knowledge you don't have. Retrieval is the precondition for everything downstream.
6. **Knowledge should compound over time.** Each new source links into the existing graph; the tutor learns the user's gaps; the more you use it, the smarter and more valuable it gets. *Why:* this is the moat *and* the user value — a system that rewards continued use with compounding returns, expensive to replicate elsewhere.
7. **Trust through provenance.** No AI output without a traceable citation to the exact source span. "Not in your sources" is a respectable answer. *Why:* in a world of hallucination, *trust is the product*. One fabricated citation can break the relationship; provenance is how we never do.
8. **The corpus is the boundary.** The assistant's knowledge is the user's library (with explicit, labeled exceptions). *Why:* a grounded assistant is trustworthy and differentiated; a general chatbot is a commodity and a liability.
9. **Progressive disclosure.** Beginners see a reader; power surfaces (graph, tutor, analytics) reveal as the relationship deepens. *Why:* we serve both Eleanor and Dr. Chen — power must never intimidate, and simplicity must never limit.
10. **The user owns their knowledge.** Private by default, portable, exportable, deletable. *Why:* this is *their* intellectual life; trust requires ownership. Lock-in must come from value, never from captivity.

---

# 6. Product Scope

MoSCoW for v1, with rationale. (Detailed backlog: [FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md).)

### Must Have (v1 — the coherent core loop)
Multi-format ingestion (PDF/EPUB/MD/TXT) · the Reader (calm, fast, position-restore, themes) · Highlights & Notes · Library & collections · Hybrid Search · Command Palette · Grounded AI Chat with citations · Auth + tenancy · Offline reading/annotation + sync · Cost/safety/eval gates.
**Why:** This is the minimum that is *lovable and differentiated* — "upload a book, read it beautifully, ask anything, get cited answers." Without all of it, the core promise doesn't hold. Citations and trust gates are Must because the product *is* trust.

### Should Have (the differentiators that make it not-a-reader)
Knowledge Engine (the eleven artifacts) · Knowledge Graph + cross-source views · AI Tutor · Flashcards + spaced repetition · Quizzes · Mastery model · Dashboard + Reading analytics · Multi-format (audio/video, web articles) · Desktop app (offline-first).
**Why:** These are what move us from "great reader with AI" to "knowledge platform." They're Should (not Must) because the Must loop must ship and prove activation first; these compound the moat immediately after.

### Could Have (high value if capacity allows)
Plugins/MCP + connectors (Readwise/Notion) · Mobile app · Deep research mode · Notifications + proactive whispers · Import/export (Anki/Obsidian/BibTeX) · Recommendations · Sharing.
**Why:** Extensibility and reach amplify the platform but aren't required to prove the thesis. Sequenced after the differentiators land.

### Won't Have (v1) — explicit, so it isn't rediscovered as a gap
Real-time collaborative/multiplayer reading · Social network/public profiles · Content marketplace/bookstore · Plugin marketplace + revenue share · Org/team admin beyond data-model readiness · A general-purpose (ungrounded) chatbot mode · VYANA OS integration.
**Why:** Each is a distinct product with its own complexity; including any would dilute focus and delay the core loop. *Ungrounded chat we will never build* — it contradicts Principle 7/8. Collaboration and teams come after PMF with individuals. VYANA OS is the strategic endgame (§14), deliberately deferred.

---

# 7. Functional Requirements

Each capability: **Purpose · User Story · Acceptance Criteria (testable) · Dependencies · Edge Cases · Future Improvements.** Priority in brackets.

### 7.1 Authentication `[MUST]`
- **Purpose:** Frictionless, secure access; the basis for per-user data isolation.
- **User Story:** *As a new user, I want to sign up in seconds with passkey/social/magic-link, so that I can start without friction or password management.*
- **Acceptance Criteria:** Sign up + sign in via magic link, social (Google/Apple), and passkey, each in ≤ 2 steps · sessions persist and silently refresh · "sign out everywhere" invalidates all sessions within seconds · a user can only ever access their own data (verified).
- **Dependencies:** none (foundational).
- **Edge Cases:** lost device/passkey (recovery via email); email already registered via different method (account linking); expired session mid-action (silent refresh, no data loss).
- **Future Improvements:** enterprise SSO/SCIM; MFA policies; step-up auth for sensitive actions.

### 7.2 File Upload `[MUST]`
- **Purpose:** Get any source into the platform effortlessly.
- **User Story:** *As a reader, I want to add a book by drag-drop, file picker, or pasting a URL, so that I can start reading immediately.*
- **Acceptance Criteria:** Drag-drop anywhere, file picker, and URL paste all work · supported formats accepted (PDF/EPUB/MD/TXT v1) · large files upload reliably without blocking the UI · duplicate content (same file) is detected and not reprocessed · transparent ingestion progress shown; document is readable as soon as parsed.
- **Dependencies:** Authentication; ingestion pipeline.
- **Edge Cases:** unsupported format (clear message + suggestion); corrupt/malformed file (recoverable error + retry/replace); scanned PDF (OCR offered); huge file (progress + no timeout); flaky network (resumable upload).
- **Future Improvements:** bulk/folder upload; email-to-library; mobile share-sheet; connectors (Readwise/Drive/Notion).

### 7.3 Library `[MUST]`
- **Purpose:** The home for the user's entire corpus, organized and findable.
- **User Story:** *As a reader with many sources, I want to organize, sort, filter, and find any document fast, so that my growing library stays usable.*
- **Acceptance Criteria:** view as grid/list/cover · organize into (nestable) collections via drag or menu (keyboard-accessible) · sort/filter by recency/title/progress/type · multi-select bulk actions · live ingest-status per document · find a document by search-in-library.
- **Dependencies:** File Upload.
- **Edge Cases:** empty library (inviting first-run + sample); failed-ingest item (distinct, recoverable, non-blocking); very large library (virtualized, fast); filtered-to-empty (clear-filters, not generic empty).
- **Future Improvements:** smart/rule-based collections; shared collections; reading queues; cover auto-generation.

### 7.4 Reader `[MUST]`
- **Purpose:** A calm, fast, beautiful, format-agnostic reading surface — the product's soul. (Full spec: [READER-SPEC.md](READER-SPEC.md).)
- **User Story:** *As a reader, I want to read any format comfortably with my position always restored, so that reading is a joy and I never lose my place.*
- **Acceptance Criteria:** PDF/EPUB/MD/TXT render faithfully + comfortably · adjustable type/size/measure/line-height/theme (Light/Sepia/Dark/Night) with live preview · exact position restore on open (instant from cache) · scroll *and* paginate modes · TOC/outline jump · no AI chrome at rest · large documents perform smoothly (60fps, no layout shift).
- **Dependencies:** ingestion (Document Model + locators); design system.
- **Edge Cases:** scanned/OCR PDF; RTL/vertical text; multi-column papers; huge docs; broken images (placeholder+retry); font-load failure (fallback).
- **Future Improvements:** two-page spread; PDF "Clean Read" reflowable view (accessibility + research papers); read-aloud; focus mode; stylus annotation.

### 7.5 AI Chat `[MUST]`
- **Purpose:** Grounded, cited conversation about the user's sources. (Spec: [AI-ENGINE-SPEC.md](AI-ENGINE-SPEC.md).)
- **User Story:** *As a reader, I want to ask questions about what I'm reading and get trustworthy, cited answers, so that I understand without leaving the page or doubting the answer.*
- **Acceptance Criteria:** ask via select-to-ask or the Ask bar · scope visible + switchable (passage/document/collection/everything) · answers stream (first token < 1s p50) · every grounded answer carries citation chips that open the exact source span · "not in your sources" when retrieval is weak (never silent hallucination) · message actions: save-as-note, make-flashcard, add-to-graph, copy, retry, go-deeper · stop control always available.
- **Dependencies:** Reader (locators), Search/retrieval, AI Engine, Knowledge Engine (scoping).
- **Edge Cases:** weak grounding (decline/broaden/web-opt-in/labeled-general); model error (retry, preserve question, invisible fallback); refusal (calm rephrase offer); very long conversation (compaction, no dead-end); offline (queue or graceful "AI offline").
- **Future Improvements:** voice Q&A; web-augmented answers (opt-in); multi-document compare; conversation branching/sharing.

### 7.6 Highlights `[MUST]`
- **Purpose:** Frictionless capture of passages that matter.
- **User Story:** *As a reader, I want to highlight in under a second without thinking about color, so that capturing doesn't break my flow.*
- **Acceptance Criteria:** select → highlight is instant + optimistic (default color, no dialog) · survives reflow/theme/resize and re-ingestion · per-document gutter list + cross-document highlights view · works offline (queued) · actions on a highlight: note, ask AI, make flashcard, recolor, copy-with-citation.
- **Dependencies:** Reader (locators), Sync.
- **Edge Cases:** overlapping highlights (merge/layer, contrast-preserving); selection spanning pages/blocks; sync failure (pending, never lost); source removed on re-ingest (orphan surfaced, not dropped).
- **Future Improvements:** semantic color tags; export (Anki/Markdown); "best of this book" auto-highlights.

### 7.7 Notes `[MUST]`
- **Purpose:** Capture thoughts — from a margin scribble to a linked, structured note.
- **User Story:** *As a reader, I want to jot a note tied to a passage and link it to concepts, so that my thinking connects to my reading and my knowledge graph.*
- **Acceptance Criteria:** anchored (on selection) + standalone notes · rich text + Markdown · `[[concept]]`/`[[doc]]` linking with backlinks · autosave (local-first, never lost offline) · jump-to-source from anchored notes.
- **Dependencies:** Reader, Knowledge Engine (concept links), Sync.
- **Edge Cases:** concurrent multi-device edits (conflict-free merge); broken link (deleted concept → unresolved-link fix); orphaned anchor (note body preserved, re-place offered).
- **Future Improvements:** templates; AI expand/summarize/critique; handwriting→text (stylus); note graph view.

### 7.8 Bookmarks `[MUST]`
- **Purpose:** Mark positions to return to.
- **User Story:** *As a reader, I want to bookmark a spot in one tap and jump back later, so that I can navigate long sources easily.*
- **Acceptance Criteria:** one-tap create at a position · per-document bookmark list, ordered, with jump · syncs across devices · auto-restore of last-read position independent of explicit bookmarks.
- **Dependencies:** Reader (locators), Sync.
- **Edge Cases:** bookmark in re-ingested doc (re-anchors); many bookmarks (organized list).
- **Future Improvements:** labeled/tagged bookmarks; bookmark folders.

### 7.9 Search `[MUST]`
- **Purpose:** Find anything by phrase or meaning, across the corpus, with a jump to source.
- **User Story:** *As a user, I want to find an exact phrase or a half-remembered idea across all my sources and land on the exact spot, so that retrieval is instant and reliable.*
- **Acceptance Criteria:** hybrid (keyword + semantic) by default, results labeled by match type · scope (doc/collection/everything) + filters · result types (passages/concepts/notes/highlights) · open result → jump to exact span, highlighted · in-document find (`⌘F`) works offline · "ask AI instead" fallback on no results.
- **Dependencies:** ingestion (indexes), Knowledge Engine (concepts).
- **Edge Cases:** no results (AI fallback); backend down (local/cached results); huge corpus (fast, ranked); PDF text-layer mapping.
- **Future Improvements:** saved searches; voice search; natural-language filters; cross-source compare.

### 7.10 Knowledge Graph `[SHOULD]`
- **Purpose:** Make cross-source connections visible and navigable. (Spec: [KNOWLEDGE-ENGINE-SPEC.md](KNOWLEDGE-ENGINE-SPEC.md).)
- **User Story:** *As a learner, I want to see how ideas connect across everything I've read and find where I encountered a concept, so that my knowledge becomes a connected whole.*
- **Acceptance Criteria:** explore an interactive graph of concepts/entities/claims · focus a node → summary + all sources + connections · "where have I read about X" cross-source view · every node/edge traces to provenance (jump to source) · a fully keyboard/screen-reader-operable list/tree equivalent (the graph is not the only way in).
- **Dependencies:** Knowledge Engine.
- **Edge Cases:** sparse corpus (sample/illustrative graph); huge graph (filtered/focused, performant); compute failure (fallback concept list).
- **Future Improvements:** contradiction view; prerequisite-path view; timeline view; graph-scoped tutoring.

### 7.11 Flashcards `[SHOULD]`
- **Purpose:** Effortless creation + delightful spaced-repetition review. (Learning System §11.)
- **User Story:** *As a learner, I want cards created for me from my highlights and reading, and a fast daily review, so that I remember without manual card-making.*
- **Acceptance Criteria:** create from highlight/note/AI-answer in one action; AI can draft a deck from a chapter/concept (editable) · review queue (reveal → grade) advances with zero perceptible wait · spaced-repetition scheduling (FSRS) · "all caught up" shown calmly when nothing due · works offline (grades queued).
- **Dependencies:** Highlights, AI Chat, Knowledge Engine (vocab/concepts), Learning System.
- **Edge Cases:** AI gen failure (manual always available); source deleted (card still works); many due (no overwhelm — calm digest).
- **Future Improvements:** cloze/image cards; Anki import/export; shared decks; audio cards.

### 7.12 Quizzes `[SHOULD]`
- **Purpose:** Active-recall self-assessment with cited feedback.
- **User Story:** *As a learner, I want to test my understanding of a chapter/concept and get cited feedback on what I missed, so that I find and fix my gaps.*
- **Acceptance Criteria:** generate from doc/chapter/concept (MCQ/short/T-F/cloze; choose length/difficulty) · per-question feedback with citations to source · short answers AI-graded with a self-assess fallback · misses → flashcards in one action · weak-concept targeting via mastery model.
- **Dependencies:** Knowledge Engine, AI Engine, Flashcards, Mastery model.
- **Edge Cases:** generation failure (retry); grading failure (model answer + self-assess); doc not knowledge-ready (explain + notify); partial progress saved.
- **Future Improvements:** timed/exam mode; adaptive difficulty; spaced quizzing; question-bank reuse.

### 7.13 Revision (Review Scheduler) `[SHOULD]`
- **Purpose:** Bring the right material back at the right time.
- **User Story:** *As a learner, I want the system to schedule what I review and when, so that I retain efficiently without planning it myself.*
- **Acceptance Criteria:** a daily review queue driven by spaced repetition + mastery · clear "what's due / next due" · combines flashcards + targeted quizzes · non-punitive (no shame for missed days) · respects user-set cadence.
- **Dependencies:** Flashcards, Quizzes, Mastery model, Notifications.
- **Edge Cases:** long absence (graceful re-onboarding, not a wall of due cards); nothing due (positive state).
- **Future Improvements:** deadline-aware scheduling (exam mode); review reminders by channel; adaptive load.

### 7.14 Progress Tracking `[MUST]`
- **Purpose:** Always know (or never have to think about) where you are.
- **User Story:** *As a reader, I want my reading position and progress tracked across devices, so that I can pick up anywhere.*
- **Acceptance Criteria:** position persists continuously + syncs · progress shown as % (stable across font changes) + "time left in chapter" on demand · furthest-position restore across devices · no persistent nagging.
- **Dependencies:** Reader, Sync.
- **Edge Cases:** divergent multi-device position (prompt on large divergence); re-ingested doc (re-anchor).
- **Future Improvements:** reading-speed personalization; attention heatmap; goal-based progress.

### 7.15 Recommendations `[COULD]`
- **Purpose:** Surface the right next thing — to read, review, or connect.
- **User Story:** *As a learner, I want suggestions for what to review, what connects to my current reading, and what to read next, so that I learn more without deciding everything.*
- **Acceptance Criteria:** surface relevant prior reading ("you read about this before") · suggest reviews when retention is slipping · (later) suggest next sources based on the graph + goals · all calm, dismissible, one at a time.
- **Dependencies:** Knowledge Engine, Learning System, Notifications.
- **Edge Cases:** thin corpus (few/no recs, no noise); over-recommending (frequency cap).
- **Future Improvements:** goal-driven learning paths; external content suggestions; collaborative recs (privacy-safe).

### 7.16 Settings `[MUST]`
- **Purpose:** Deep control, calm surface.
- **User Story:** *As a user, I want to tune reading, AI, learning, privacy, and appearance, and find any setting fast, so that the product fits me.*
- **Acceptance Criteria:** searchable settings · categories (Reading/AI/Learning/Appearance/Notifications/Privacy/Account/Integrations/Accessibility/Shortcuts) · instant apply (no save for toggles) · live reading preview · sensible defaults (most users never visit) · prominent Accessibility category.
- **Dependencies:** all features (it configures them).
- **Edge Cases:** failed save (revert + retry, no ambiguous state); search-no-match (browse categories).
- **Future Improvements:** profiles/presets; import/export settings; per-tenant policy (teams).

### 7.17 Analytics (Reading & Learning) `[SHOULD]`
- **Purpose:** Honest, motivating insight — am I learning?
- **User Story:** *As a learner, I want to see my reading and retention trends, so that I understand my habits and stay motivated.*
- **Acceptance Criteria:** trends (time, completion, retention/mastery, streak) · drill-down (doc/concept/range) · **every chart has a text/table equivalent** · non-punitive framing · insufficient-data + partial states (never empty/wrong charts) · export.
- **Dependencies:** Progress, Learning System.
- **Edge Cases:** not enough data (clear "coming soon"); pipeline lag (catching-up state).
- **Future Improvements:** period comparison; predictive insights; weekly recap; privacy-safe benchmarks.

### 7.18 Profile `[MUST]`
- **Purpose:** Identity, account, and a motivating knowledge footprint.
- **User Story:** *As a user, I want to manage my account and see my knowledge footprint, so that I feel ownership and growth.*
- **Acceptance Criteria:** edit profile · knowledge footprint (sources read, concepts mastered, milestones — celebratory, not vain) · account management (email, auth, plan, connected services) · export all data · delete account (cascade, confirmed).
- **Dependencies:** Authentication, Analytics.
- **Edge Cases:** failed save (field-level, no loss); billing fetch failure (rest usable).
- **Future Improvements:** achievements; device session management; public (opt-in) profile.

### 7.19 Notifications `[COULD]`
- **Purpose:** Calm, user-controlled, helpful — never noisy.
- **User Story:** *As a user, I want timely, relevant nudges (reviews due, a source is ready, a new connection) on my terms, so that I stay engaged without being spammed.*
- **Acceptance Criteria:** notification center (grouped, unread) · per-type cadence (instant/digest/off) + quiet hours · types: ingestion done, reviews due (digest), connections, system · default = calm digests, no badge-screaming · ≤ 1 proactive whisper at a time.
- **Dependencies:** Knowledge Engine (connections), Learning System (reviews).
- **Edge Cases:** notification overload (capped, digested); long absence (gentle, not guilt).
- **Future Improvements:** push (mobile/desktop); smart timing; channel routing.

### 7.20 Offline Mode `[MUST]` (reading) / `[SHOULD]` (full)
- **Purpose:** Reading and capture work without a connection.
- **User Story:** *As a reader, I want to read, highlight, and review offline, so that a flaky connection or a flight never stops me.*
- **Acceptance Criteria:** opened/pinned documents read fully offline · highlight/note/bookmark/progress work offline (queued) · in-document search works offline · clear offline indicator · AI features show graceful "offline" state (queue where sensible) · nothing lost offline.
- **Dependencies:** Reader, Sync, local-first storage.
- **Edge Cases:** storage full (LRU evict unpinned, never annotations); never-opened doc offline (clear "needs connection"); desktop offline semantic search (local cache).
- **Future Improvements:** selective offline (pin for offline); offline downloads manager.

### 7.21 Sync `[MUST]`
- **Purpose:** Seamless, conflict-free continuity across devices.
- **User Story:** *As a multi-device user, I want my reading, annotations, and progress to sync invisibly, so that everything is everywhere, always current.*
- **Acceptance Criteria:** mutations apply locally first + sync in background (no waiting) · annotations merge conflict-free across devices · progress reconciles (furthest/most-recent) · reconnect replays queued changes with no duplication/loss · subtle, non-alarming sync state.
- **Dependencies:** Offline/local-first storage, Authentication.
- **Edge Cases:** concurrent edits (CRDT merge); divergent progress (prompt on large gap); long offline period (clean reconciliation); clock skew (logical clocks).
- **Future Improvements:** selective sync; sync conflict UI; real-time presence (later, for collaboration).

### 7.22 Export `[COULD]`
- **Purpose:** The user owns and can take their knowledge.
- **User Story:** *As a user, I want to export my highlights, notes, flashcards, and all my data, so that I'm never locked in.*
- **Acceptance Criteria:** export highlights/notes (Markdown/CSV), flashcards (Anki), notes (Obsidian/Markdown), references (BibTeX) · full account data export (machine-readable) · exports are complete and re-importable where applicable.
- **Dependencies:** Highlights, Notes, Flashcards, Profile.
- **Edge Cases:** huge export (async job + download link); partial-data export.
- **Future Improvements:** scheduled exports; cloud-destination export; round-trip sync (Obsidian).

### 7.23 Sharing `[WON'T-NOW / COULD later]`
- **Purpose:** Share an insight, answer, or excerpt (read-only) — collaboration deferred.
- **User Story:** *As a user, I want to share a cited answer or an excerpt with a colleague, so that I can pass on what I learned.*
- **Acceptance Criteria (when built):** share a cited answer/excerpt as a read-only link or copy-with-citation · sharing respects source copyright (excerpt limits) · no exposure of the user's private library.
- **Dependencies:** AI Chat, Highlights; (later) collaboration infra.
- **Edge Cases:** copyright limits on shared excerpts; revoking a shared link.
- **Future Improvements:** shared collections; collaborative annotation; shared decks; team libraries.

### 7.24 Command Palette `[MUST]` (cross-cutting power surface)
- **Purpose:** The fastest path to any document, action, or surface — keyboard-first.
- **User Story:** *As a power user, I want to reach anything in two keystrokes, so that the product never slows me down.*
- **Acceptance Criteria:** `⌘K` anywhere · unified fuzzy search (docs/commands/concepts/nav) + prefix modes · any document/action/surface reachable in ≤ 2 keystrokes + type · fully operable without a mouse · "ask AI" fallback on no match.
- **Dependencies:** Library, Search, all action-bearing features.
- **Edge Cases:** huge result set (ranked, fast); nested commands (breadcrumb + back).
- **Future Improvements:** custom commands/macros; AI command suggestions; palette plugins.

---

# 8. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | Reader opens instantly from cache (position restored, < 200ms perceived); first AI token < 1s p50, < 2.5s p95; search results < 300ms; 60fps reading scroll; interaction feedback < 100ms; no layout shift. Budgets in [UX-DESIGN](UX-DESIGN.md) App. B. |
| **Accessibility** | **WCAG 2.2 AA** minimum; AAA contrast for body reading text. Full keyboard operability; screen-reader support with semantic landmarks; AI streaming announced politely (chunked); reduced-motion honored; the Knowledge Graph ships a first-class non-visual equivalent; every chart has a text/table equivalent; reading a11y (dyslexia font, reading ruler, TTS, adjustable type, 200% zoom). Accessibility is a release gate, not a backlog item. |
| **Reliability** | Reading + annotation available even when AI/retrieval/network degrade (graceful degradation; local-first). Target 99.9% availability for core read/sync; AI features degrade, never hard-fail the app. Automated backups + tested restore. |
| **Scalability** | Scales to large libraries (thousands of sources/user) and growing corpora without latency regression; stateless services scale horizontally; vector/graph stores swappable behind interfaces at defined thresholds; async ingestion autoscales on load. |
| **Security** | TLS everywhere; per-user data isolation enforced at the data layer (defense in depth); least privilege; encryption at rest; secrets never in prompts/logs/bundles; rate limiting + abuse detection; prompt-injection defense (untrusted content is data). Details: [ARCHITECTURE](ARCHITECTURE.md) §17. |
| **Privacy** | The user owns their content + knowledge; private by default; full export + hard-delete (cascading); GDPR/CCPA from day one; user content goes only to contracted model providers under DPAs; per-tenant model/residency policy possible; no training on user data without explicit opt-in. |
| **Offline Support** | Reading, annotation, in-doc search, and review work offline; local-first with background sync; desktop adds offline semantic search. (§7.20.) |
| **Cross-platform** | Web (primary), Desktop (Tauri, offline-first), Mobile (later) — shared design tokens, domain model, and behavior; responsive as three distinct intents (mobile = read/capture, tablet = study, desktop = deep-work). |
| **Internationalization** | Multi-language content supported (reading, extraction, search in source language); RTL/vertical text in the reader; UI localization-ready (externalized strings, locale-aware formatting). Full UI localization is post-v1 but the architecture must not preclude it. |
| **Maintainability** | Format-agnostic (one adapter per format); provider-independent AI (one adapter per provider); modular monolith with clear module boundaries; config-as-data for models/routing/policy; ADRs for load-bearing decisions. |
| **Testability** | Contract tests on every boundary; AI quality eval suites (citation accuracy, faithfulness, refusal) as CI gates; golden corpora for ingestion/extraction; reflow-stability and sync/offline test suites; visual regression for the design system. |
| **Observability** | OpenTelemetry traces spanning request → retrieval → model; LLM observability (prompt, retrieval set, citations, cost, latency) on every generation; SLOs + alerting (latency, error rate, cache hit-rate, cost-per-answer, eval scores). |

---

# 9. AI Capabilities

(Full design: [AI-ENGINE-SPEC.md](AI-ENGINE-SPEC.md). All capabilities are **provider-independent** — no feature couples to a vendor.)

- **Context Awareness:** The assistant always knows *where the user is* (current document, passage, scope) and *what they know* (the graph + mastery model). Scope is explicit and switchable; the assistant retrieves the right context for the question (passage vs. document vs. library) and assembles it within the model's window.
- **Conversation Memory:** Four tiers — working memory (recent turns), episodic (summarized older turns), semantic (relevant past turns/passages retrieved by meaning), and structured (durable facts/preferences/goals). Long conversations compact transparently; the user never hits a "conversation too long" wall.
- **Citation System:** *Every grounded claim cites its exact source span.* Citations are interactive (jump to the highlighted passage). This is the trust primitive — non-negotiable. Fabricated citations are a sev-1 quality failure.
- **Document Grounding:** The assistant answers from the user's corpus by default. Retrieval (hybrid + rerank) supplies the evidence; generation is constrained to it. The knowledge boundary is the user's library, with explicit, labeled exceptions (e.g., opt-in web augmentation).
- **Prompt Strategy:** Versioned, typed, cache-aware prompt templates; untrusted content (passages, tool outputs) inserted as *data*, never instructions; depth controlled by effort; structured outputs for machine-consumed results; templates A/B-tested and eval-gated.
- **Hallucination Prevention:** Grounding + retrieval-confidence gating ("not in your sources" below threshold) + post-generation faithfulness verification (cited spans must support claims) + verbatim quotes pulled from source (never regenerated). Faithfulness is measured and gated in CI.
- **Model Routing:** Capability- and policy-driven selection per task (cheap-fast for classification/routing, balanced for high-volume Q&A, top-tier for tutoring, frontier for deep research), within cost/latency/quality constraints and tenant policy. Routing is configuration; features express *intent*, not models.
- **Fallback Strategy:** Ordered, cross-provider fallback chains; circuit breakers; retries with backoff; graceful degradation (down-tier, smaller context, cached partial) so a provider outage degrades quality, never availability. Reading/annotation always survive.
- **Explainability:** The user can see *why* an answer was given — the sources used, the scope, and a path to each cited span. The system is transparent about confidence and about when it's answering outside the corpus.
- **Safety:** A pluggable guard pipeline (input moderation, prompt-injection defense, PII redaction; output moderation, grounding check, PII-leak check, tool-action gating). Refusals handled gracefully (benign false-positives can fall back to another model). All safety decisions audited. Destructive/external tool actions are gated.
- **Cost Optimization:** Prompt caching (stable prefixes), semantic answer cache, request coalescing, batch processing for non-interactive work (≈50% off), quality-tier down-routing, context economy. Every call metered and attributed; per-tier budgets with graceful enforcement.

---

# 10. Knowledge Engine

*How documents become structured knowledge.* (Full design: [KNOWLEDGE-ENGINE-SPEC.md](KNOWLEDGE-ENGINE-SPEC.md).)

On every upload, after parsing, an automatic background pipeline decomposes the source into eleven artifact types, verifies each against its source, and threads them into the user's knowledge graph — all without the user lifting a finger. The pipeline is **genre-adaptive** (a history book yields a rich timeline; a business book yields frameworks and action items), uses verified extraction (nothing enters the graph unsupported by its source), and is cost-efficient (batch processing, caching, incremental).

- **Concept Extraction:** Normalized ideas/topics the source discusses, deduplicated across the corpus (the same concept in book A and paper B becomes one node). Scored for salience.
- **Entity Recognition:** People, organizations, places, works, products, events, and domain terms — with coreference resolution and entity linking (surface variants merge into one entity; linked to canonical/external references where confident).
- **Relationship Mapping:** Typed, directed connections (prerequisite-of, supports, contradicts, part-of, causes, defines, example-of, influences, related-to) inferred from explicit statements, co-occurrence, and claim analysis — within and across documents.
- **Definitions:** Term → meaning pairs as the source states them, with exact source spans; a per-document and cross-corpus glossary.
- **Quotes:** Notable, thesis-bearing passages captured *verbatim* (from the source span, never regenerated) with attribution and locator.
- **Vocabulary:** Learning-oriented domain terms with definitions, difficulty, and example usage — the candidates for flashcards/quizzes — deduplicated against what the user already knows.
- **Skills:** Competencies the source develops, mapped to a canonical skill taxonomy and leveled — feeding the mastery model and tutor targeting.
- **Frameworks:** Structured mental models, methodologies, step-processes, and matrices — assembled from scattered mentions into coherent, ordered/typed components.
- **Action Items:** Applicable takeaways (practices, habits, experiments, decisions) — the "apply what you read" layer.
- **Knowledge Graph:** The unifying structure — concepts, entities, claims, frameworks, skills, and timeline events as nodes; typed relationships as edges; definitions, quotes, action items, and vocabulary as attached records — all carrying provenance, per-user, linked to a shared canonical backbone (without exposing any user's content).
- **Semantic Search:** Meaning-based retrieval over the whole corpus (hybrid with keyword, reranked) — the substrate for AI grounding, "where have I read about X," and concept discovery.
- **Cross-document Connections:** As the corpus grows, each new source links into the existing graph; cross-source relationships and contradictions are surfaced ("you read about this before"; "these two sources disagree"). *This is the compounding moat* — the graph gets more valuable with every source.

**Trust guarantees:** every artifact is grounded-verified against its source before entering the graph; quotes are verbatim by construction; everything traces to an exact locator; contradictions are a feature, not an error; over-merging is prevented by confidence-gated, user-correctable linking.

---

# 11. Learning System

*Closing the loop: read → understand → remember → apply.* (Backlog: [FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md) E12; UX [§9–11](UX-DESIGN.md).)

- **Flashcards:** Created with near-zero effort — from highlights, AI answers, or auto-generated from the extracted vocabulary/concepts (editable). The user almost never makes a card from scratch.
- **Spaced Repetition:** A modern scheduling algorithm (FSRS) determines *what* to review and *when*, maximizing retention for minimal time. The review loop is fast and satisfying; "all caught up" is celebrated, not nagged.
- **Adaptive Quizzes:** Generated from any knowledge-ready source (multiple types), with cited per-question feedback; difficulty and topic adapt to the mastery model — targeting weak concepts. Missed questions become flashcards.
- **Memory Score:** A per-concept estimate of how well the user will *recall* the material now, derived from review/quiz performance and decaying over time (the forgetting curve). Drives the review queue and surfaces "this is slipping."
- **Understanding Score:** Distinct from memory — a per-concept estimate of *comprehension depth* (can they explain it, apply it, connect it?), assessed via tutor dialogue and applied quizzes. Memory without understanding is hollow; we track both.
- **Learning Path:** A goal-driven, AI-generated sequence (modules → lessons) tied to the user's sources, ordered by prerequisite relationships from the graph, adapting to progress and gaps.
- **Revision Scheduler:** Orchestrates flashcards + targeted quizzes into a single daily queue, respecting user cadence and quiet hours, non-punitive, deadline-aware (exam mode) when set.
- **Personal Tutor:** An AI tutor that teaches *from the user's corpus* and adapts to *the user's mastery* — Socratic dialogue, worked examples, explanations, all cited. It assesses understanding, generates practice on the fly, schedules reviews, and sequences learning via the graph. The tutor is the synthesis of everything above — the embodiment of "transform reading into a personalized learning experience."

---

# 12. Success Metrics

Concrete, instrumented from launch. One North Star: **users completing the read → assist → capture → revise → learn loop repeatedly.**

### User Metrics
- **Activation:** % who upload a source *and* get ≥1 cited answer in session 1 — **target ≥ 55%**.
- **Week-1 / Week-4 retention:** **≥ 50% / ≥ 35%** of activated users.
- **Core-loop completion:** % of weekly-active users who read + capture + review in a week — **≥ 40%**.
- **Reading depth:** median reading minutes/active week — growing.
- **Library growth:** median sources per active user, monotonically increasing.

### Business Metrics
- **Free → paid conversion:** **≥ 5%** of activated free users within 60 days (prosumer benchmark).
- **Paid retention / churn:** monthly churn **< 4%**; net revenue retention **> 100%** (expansion via usage tiers).
- **CAC payback:** within target months; **LT:CAC ≥ 3:1**.
- **Cost-per-active-user (AI):** within budget envelope (the guardrail on unit economics).

### AI Metrics
- **Citation accuracy:** **≥ 95%** of cited spans truly support the claim (CI-gated).
- **Faithfulness/groundedness:** **≥ 95%** of answer statements supported by retrieved context.
- **Ungrounded-answer rate:** ≈ **0%** (every answer cited or explicitly labeled "not in sources").
- **First-token latency:** p50 **< 1s**, p95 **< 2.5s**.
- **Refusal correctness:** correctly declines ungrounded questions; false-refusal rate low.

### Learning Metrics
- **Retention lift:** recall on quizzed material **≥ 2×** an unaided baseline.
- **Review adherence:** % of due reviews completed — **≥ 60%** among active learners.
- **Mastery growth:** measurable upward trend in memory + understanding scores per active learner.
- **Knowledge density:** verified graph nodes/edges per active user, growing (the moat metric).
- **Connection discovery:** cross-source connections surfaced + engaged per active user/month.

### Technical Metrics
- **Availability:** core read/sync **≥ 99.9%**; AI features degrade gracefully (never hard-down).
- **Ingestion success rate:** **≥ 98%** of supported uploads reach knowledge-ready (excluding genuinely unsupported/corrupt).
- **Cache hit-rate:** prompt + semantic caches above a defined floor (cost control).
- **Sync reliability:** zero data loss; conflict rate negligible; reconnect convergence verified.
- **Eval-gate pass rate:** AI/extraction changes pass CI quality gates before deploy.

---

# 13. Risks

| # | Risk | Type | Severity | Mitigation |
|---|---|---|---|---|
| 1 | **Ingestion quality on messy/scanned PDFs** is poor → bad downstream everything | Technical | High | Hard "golden corpus" of difficult docs; OCR branch; structure-aware parsing; +buffer in plan; readable-while-enriching UX; ingestion success-rate SLO. |
| 2 | **AI hallucination / wrong citations** erode trust irreparably | AI | High | Grounding + confidence gating + faithfulness verification + verbatim quotes; citation-accuracy as a CI gate (≥95%); human review; "not in sources" default. |
| 3 | **Prompt injection** via document/web content manipulates the assistant | AI | High | Untrusted content treated as data, never instructions; operator instructions on the system channel; red-team eval set; tool-action gating. |
| 4 | **Model costs** make unit economics unworkable at scale | Business | High | Caching (prompt + semantic), batch (≈50%), tiered routing, budgets, cost-per-active-user as a tracked guardrail; provider-independent routing for price arbitrage. |
| 5 | **Vendor lock-in / model deprecation** | Technical/Business | Medium | Provider-independent AI engine (one adapter per provider); capabilities + routing as config; multi-provider fallback; no feature couples to a vendor. |
| 6 | **Scope creep** — the product tries to be everything | Product | High | Strict MoSCoW; explicit "Won't-Have"; milestone exit criteria; "coherent product per release"; cut scope-within-a-release, never trust/quality gates. |
| 7 | **Activation fails** — users don't reach the magic moment | Product | High | Obsess the onboarding funnel (landing → first cited answer); sample-document fast path; transparent ingestion; instrument and optimize relentlessly. |
| 8 | **Retention fails** — users read but don't return | Product | High | The compounding loop (capture → revise → learn) is the retention engine; spaced repetition + tutor + growing graph create returning reasons; non-punitive, calm cadence. |
| 9 | **Copyright / content liability** — users upload copyrighted books; we process them | Legal | High | We process *user-provided* content for *their personal use* (like a notebook); we do not distribute/sell content; excerpt limits on sharing; DMCA process; clear ToS; no public redistribution; honor DRM (no circumvention). |
| 10 | **Privacy / data misuse perception** — users fear their reading is mined | Legal/Business | Medium | Private by default; no training on user data without explicit opt-in; full export/delete; DPAs with providers; transparent privacy policy; per-tenant residency options. |
| 11 | **AI safety incidents** (harmful output, PII leak) | AI/Legal | Medium | Guard pipeline (moderation, PII redaction, output checks); audit log; refusal handling; per-tenant policy; incident response runbook. |
| 12 | **Over-merging corrupts the knowledge graph** | Technical | Medium | Confidence-gated linking; "possibly same as" soft edges; user-correctable merges; extraction eval harness. |
| 13 | **Offline/sync conflicts** lose user data | Technical | Medium | CRDT for annotations; idempotent mutation replay; LWW+max-position for progress; never-lose-offline guarantee; conflict tests. |
| 14 | **Hiring on the critical path** (ingestion/reader/AI) for a small team | Business | Medium | Hire ahead of need on the critical path; senior staff on the 🔴 clusters; de-risk spikes before build sprints; contract specialists if needed. |

---

# 14. Future Vision

### The 3-Year Arc — from a great reader to the world's best AI Knowledge Platform

**Year 1 — Prove the loop. (Reader → Knowledge → Tutor → Learning.)**
Ship the differentiated v1: beautiful multi-format reading, grounded cited Q&A, the automatic Knowledge Engine, the AI tutor, and the spaced-repetition learning system. Reach product-market fit on the prosumer learner. Establish the trust guarantee (provenance everywhere) and the compounding moat (the per-user graph). Expand sources to research papers, articles, web pages, and personal notes. *Outcome: the best place to read and actually learn from anything — for individuals.*

**Year 2 — Compound and connect. (Multi-modal, ecosystem, intelligence depth.)**
Add **videos and podcasts** (the platform becomes source-agnostic — *anything you consume becomes structured knowledge*). Mobile app for read/capture/review anywhere. **Plugins + MCP** so the platform connects to the user's tools (Notion, Readwise, Drive, the browser) and so the user's knowledge becomes available to *their* AI agents. **Deep research mode** for multi-source synthesis. The tutor deepens — proactive, longitudinal, genuinely personalized teaching. Begin **teams** (shared libraries, collaborative annotation). The Knowledge Engine gets dramatically better as models improve — at zero feature cost (provider-independent architecture). *Outcome: the system of record for what a person knows, connected to how they work.*

**Year 3 — Become the knowledge layer. (Platform, network, OS.)**
The personal knowledge graph becomes a **queryable knowledge layer** other applications build on (with consent) — via API and MCP. **Organizations** adopt it as shared institutional memory. The tutor becomes a true **personalized learning companion** that plans curricula, tracks long-term mastery, and adapts across years of a person's intellectual life. Privacy-preserving cross-user intelligence (canonical concept backbone) powers discovery without exposing any individual's content. Finally, integration into **VYANA OS** — knowledge as an OS-level primitive available to every app a person uses, so reading, learning, and thinking are woven into their entire digital life. *Outcome: the world's best AI Knowledge Platform — the operating system for personal knowledge.*

**The throughline:** every step compounds the same core asset — *structured, connected, remembered, applied personal knowledge* — and every step is made better, not obsolete, by advancing AI. We don't bet on a model; we bet on the user's compounding knowledge, and we make the best models serve it.

---

*End of PRD v1. This document defines the product (what + why). The companion specs define the implementation (how). Load-bearing product changes — the trust/provenance guarantee, the corpus-as-boundary principle, the core loop, the MoSCoW scope — require PRD review. Build from here.*
