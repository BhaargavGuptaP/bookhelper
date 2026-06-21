# BookHelper — Sprint Plan (Small Startup Team)

> **From the Engineering Manager.** This decomposes the whole project ([FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md), [ROADMAP.md](ROADMAP.md)) into executable 2-week sprints sized for a **small team**. The ROADMAP assumed a larger ramping org with parallel squads; this plan is the *small-team reality*: fewer concurrent threads, tighter scope per sprint, honest durations.
>
> **Planning horizon:** detailed sprints **0–22** (zero → launched, differentiated product: Reader + cited Q&A + Knowledge Engine + Tutor + Learning). Phase 4+ is a **directional backlog** of sprint themes — I refuse to fake sprint-level precision a year out.

---

## Team, Cadence & Assumptions

**The team (~5–6 people):**
| Role | Count | Focus |
|---|---|---|
| EM / Lead (hands-on) | 1 | architecture, platform, code, reviews |
| Full-stack TS (frontend-leaning) | 1 | reader, web UI |
| Full-stack TS (backend-leaning) | 1 | core-api, sync, search |
| Python/ML engineer | 1 | ingestion, knowledge engine, RAG |
| Full-stack / AI engineer | 1 | AI engine, tutor, learning |
| Product designer (eng-adjacent) | 0.5–1 | design system, UX, a11y |

**Cadence:** 2-week sprints. ~2 concurrent threads max (a small team can't run 5 squads). Each sprint plans to ~70% capacity — the rest absorbs reviews, bugs, support, and the inevitable unknowns. Ceremonies kept light: sprint planning (½ day), daily 10-min async standup, demo + retro (1 hr) at sprint end.

**Buffer policy:** every 5th–6th sprint is partly a **hardening/buffer sprint** (debt, perf, a11y, flaky tests, support) — explicitly scheduled, not hoped for. Estimates assume this; ignore it and the plan slips.

**Timeline reality:** ~22 sprints ≈ **~11 months** to a launched, differentiated v1. Private beta around **Sprint 10 (~month 5)**. This is slower in calendar than the larger-team ROADMAP — that's the honest cost of a small team, and the right trade for runway.

---

## How to read this (baselines, so sprints stay tight)

Three things are **global baselines** — every sprint inherits them; per-sprint sections list only *additions/deltas*. (Full versions in ROADMAP §8.)

**Baseline Definition of Done (all sprints):**
- Acceptance criteria met (FEATURE-BREAKDOWN); merged to main behind a flag if risky.
- Tests written (unit + contract on boundaries) and green in CI; coverage not regressed.
- Both light/dark themes; **WCAG 2.2 AA** for any UI; reduced-motion honored.
- Traced/observable; errors handled with empty/loading/error states (no bare spinners, no blank "no data").
- Security: tenancy-isolated, inputs validated, no secret in logs/prompts.
- Within latency/motion budgets (UX-DESIGN App. B); demoed at sprint review; docs/ADR updated if a load-bearing decision changed.

**Baseline Testing (all sprints):** unit + integration + contract tests; CI gates on typecheck/lint/test/security-scan; AI-touching work additionally passes the **eval gate** (citation accuracy / faithfulness / refusal correctness) once that harness exists (Sprint 9+).

**Baseline Review Checklist (all sprints):** correctness vs. AC · readable & matches surrounding code · no provider-SDK import outside `ai-engine` · tenancy predicate present on data paths · a11y + both themes · error/empty/loading states · tests meaningful (not coverage theater) · no new flakiness · telemetry added · perf budget respected.

**Risk legend:** 🟢 Low (well-understood) · 🟡 Medium (some unknowns/integration) · 🔴 High (research, hard quality bar, or external dependency).

---

# Phase 0 — Foundations (Sprints 0–2)

## Sprint 0 — Repo, Pipeline & Skeleton 🟢
**Duration:** 1–2 weeks (kickoff sprint; partly setup)
**Goals:** A developer can clone, build, deploy a preview, and log in to an empty shell.
**Deliverables:** monorepo (pnpm+Turbo, uv for Python); CI/CD with preview-per-PR + rollback; design-token packages + 4 primitives (button/input/card/dialog) with theming; auth provider (WorkOS) integrated to a placeholder login.
**Tasks:** scaffold apps/packages; Turbo pipelines + remote cache; GitHub Actions (typecheck/lint/test/scan); preview env w/ DB branch; tokens + theme remap; auth provider wiring; pre-commit hooks. *(E1.F1–F4, E2.F1 start)*
**Dependencies:** none.
**Testing (delta):** CI smoke test; one component visual-regression baseline; login round-trip e2e.
**Review checklist (delta):** package boundaries enforced by lint; secrets via env/secrets-manager only.
**DoD (delta):** new package scaffolds with zero manual wiring; preview URL works with isolated DB; login succeeds.
**Risk:** 🟢 (standard setup; only risk is over-engineering — timebox it).

## Sprint 1 — Identity, Tenancy, Observability, AI Gateway Skeleton 🟡
**Duration:** 2 weeks
**Goals:** Real auth + provable tenant isolation; one traced streamed model call through the gateway.
**Deliverables:** auth complete (magic link/social/passkey); RBAC + RLS + app tenancy guard; OTel + LLM tracing + Sentry; `ai-engine` interface + Anthropic adapter (streaming) + cost tagging stub; object storage + presigned upload.
**Tasks:** token issue/refresh/revoke; session list; RLS policies + guard; service-to-service auth; tracing across the queue boundary; canonical request/response types; Anthropic adapter; storage + presigned flow. *(E2.F1–F2, E1.F3, E3.F1 partial, E17.F1, E11 storage)*
**Dependencies:** Sprint 0.
**Testing (delta):** **cross-tenant access test (must fail to access)**; auth flows e2e; trace spans request→model; presigned upload integration.
**Review checklist (delta):** every data path carries the tenant predicate; no model SDK outside `ai-engine`.
**DoD (delta):** a user cannot touch another user's data (test proves it); a streamed completion shows in a trace with cost.
**Risk:** 🟡 (auth + tenancy are foundational; getting RLS right early is critical, painful later).

## Sprint 2 — App Shell, Primitives, Embeddings 🟢
**Duration:** 2 weeks
**Goals:** Navigable app shell; command palette skeleton; embeddings adapter working.
**Deliverables:** rail + topbar + theming; command palette (nav + fuzzy search skeleton); remaining core primitives (dropdown/table/tabs/toast); Voyage embedding adapter + content-hash cache; component catalog.
**Tasks:** app shell + responsive rail/bottom-bar; palette with `⌘K`; primitives + states; embeddings contract + adapter + cache; visual-regression coverage. *(E1.F4, E8.F2 skeleton, E3.F1 embeddings)*
**Dependencies:** Sprint 1.
**Testing (delta):** palette keyboard nav; primitive a11y (keyboard/SR); embedding cache hit on repeat.
**DoD (delta):** shell navigable by keyboard end-to-end; embeddings cached idempotently.
**Risk:** 🟢.

---

# Phase 1 — Reader + Cited Q&A (Sprints 3–10) → Private Beta

## Sprint 3 — Ingestion Orchestration + PDF Parse 🔴
**Duration:** 2 weeks
**Goals:** Idempotent pipeline; PDF → canonical Document Model with locators.
**Deliverables:** pipeline orchestration (versioned/idempotent/resumable steps, queue, retries, DLQ); PDF parser → blocks + universal locators; ingest status surfaced.
**Tasks:** step registry + idempotency keying; queue consumers + DLQ; PDF text+layout extraction; normalization rules (hyphen-join, whitespace, NFC); locator/`blockId` generation. *(E4.F1, E4.F2 PDF)*
**Dependencies:** Sprint 1 (storage), Sprint 2.
**Testing (delta):** **golden "hard PDF" corpus** (scanned, multi-column, dense) — parse + locator stability; idempotency test (re-run does nothing); DLQ on poison job.
**Review checklist (delta):** locators stable across re-parse; normalization correct.
**DoD (delta):** a PDF produces a locatable Document Model; re-ingesting reprocesses nothing.
**Risk:** 🔴 (**the #1 schedule risk** — messy real-world PDFs; +30% buffer baked in; OCR branch may slip to Sprint 4).

## Sprint 4 — EPUB/MD/TXT + Chunking + Indexing 🟡
**Duration:** 2 weeks
**Goals:** All v1 text formats ingest; chunked, embedded, indexed.
**Deliverables:** EPUB parser (+CFI anchors); MD/TXT client fast-path; structure-aware hierarchical chunking; batch embedding; dense (pgvector) + sparse (FTS) indexes.
**Tasks:** EPUB spine→blocks; MD/TXT worker parse; chunker (parent/child, overlap); batch embed via gateway; index build + tenant filter; OCR fallback for scanned PDFs (carryover). *(E4.F2 remaining, E4.F3–F4)*
**Dependencies:** Sprint 3.
**Testing (delta):** per-format parse golden tests; chunk-boundary correctness; hybrid index query returns expected spans; OCR path on a scanned doc.
**DoD (delta):** PDF/EPUB/MD/TXT all reach indexed state; chunks respect structure.
**Risk:** 🟡.

## Sprint 5 — Reader Core 🔴
**Duration:** 2–3 weeks (the crown jewel; allow extra)
**Goals:** Read any format beautifully, with instant position restore.
**Deliverables:** Document-Model renderer (reflow DOM + PDF canvas+text-layer); virtualization; scroll restore; TOC/outline.
**Tasks:** reflow renderer with `data-block/offset` markers; PDF.js integration + aligned text layer; windowed rendering + position index; scroll-to-locator + restore; TOC jump. *(E6.F1)*
**Dependencies:** Sprint 4.
**Testing (delta):** 900-page PDF scroll perf (60fps, bounded memory); position-restore exactness; reflow doesn't shift layout; large-TXT virtualization.
**Review checklist (delta):** no whole-document DOM render; workers for heavy work.
**DoD (delta):** opening a cached doc restores exact position instantly; huge docs scroll smoothly.
**Risk:** 🔴 (cross-format rendering + virtualization is hard; the product lives or dies here).

## Sprint 6 — Reader Controls, Progress, Library Intake 🟡
**Duration:** 2 weeks
**Goals:** Comfortable reading + working library upload→read loop.
**Deliverables:** reading controls (type/measure/theme, live preview); locator-based progress + instrumentation + bookmarks; library intake (upload/URL/dedupe) + live ingest-status card.
**Tasks:** controls popover + persistence; reader themes; progress tracker (char-offset %) + reading-event emission; bookmarks; presigned upload→complete→ingest; status UI. *(E6.F2–F3, E5.F1)*
**Dependencies:** Sprint 5, Sprint 3.
**Testing (delta):** progress stable across font change; upload→ingest→ready e2e; instrumentation fires without UI cost.
**DoD (delta):** upload a book → watch it become ready → read it with adjustable settings → progress persists.
**Risk:** 🟡.

## Sprint 7 — Library Management + Highlights 🟢
**Duration:** 2 weeks
**Goals:** Organize the corpus; capture highlights frictionlessly.
**Deliverables:** library views (grid/list), collections, sort/filter, bulk actions, quick-look; highlights (optimistic, locator-anchored, CSS Custom Highlight API) + gutter markers + colors.
**Tasks:** library UI + collections CRUD + drag-organize; selection toolbar; optimistic highlight create/render; recolor; global highlights view. *(E5.F2, E7.F1, E12 selection)*
**Dependencies:** Sprint 6.
**Testing (delta):** highlight survives reflow/theme change (rect recompute); optimistic create < 16ms; collections keyboard-accessible.
**DoD (delta):** select text → instant highlight that persists and survives resize; library organizable by keyboard.
**Risk:** 🟢.

## Sprint 8 — Notes + In-Doc Search + Hybrid Search 🟡
**Duration:** 2 weeks
**Goals:** Note-taking + finding anything by phrase or meaning.
**Deliverables:** notes (anchored + standalone, local-first autosave, `[[ ]]` skeleton); in-document search (worker index, match→locator→navigate); hybrid search v1 (dense+sparse fused) + jump-to-span.
**Tasks:** note editor + anchoring; autosave; in-doc search index + UI (`⌘F`); hybrid retrieval + RRF + result tabs + jump-to-source. *(E7.F2, E8.F1)*
**Dependencies:** Sprint 7.
**Testing (delta):** note never lost offline; in-doc search correctness incl. PDF text layer; hybrid search returns expected spans; jump highlights span.
**DoD (delta):** notes autosave locally; find-in-doc and cross-doc search both land on exact spans.
**Risk:** 🟡.

## Sprint 9 — RAG Retrieval + Eval Harness 🔴
**Duration:** 2 weeks
**Goals:** Retrieval that feeds grounded answers; the eval gate exists before generation ships.
**Deliverables:** query understanding + hybrid retrieve + rerank + context assembly (cached prefix) + confidence gating; **golden Q&A set + citation/faithfulness eval harness wired into CI**.
**Tasks:** query understander (cheap model); reranker adapter; context builder + cache breakpoints; confidence threshold; eval harness + golden set from beta docs. *(E9.F1, E17.F2 eval, E3.F2 caching)*
**Dependencies:** Sprint 8.
**Testing (delta):** retrieval recall@k on golden set; eval harness runs in CI and can fail a build; cache-read non-zero on repeat.
**Review checklist (delta):** retrieval tenant-scoped; cache prefix has no invalidators.
**DoD (delta):** retrieval is scoped + reranked; below threshold it declines; eval gate is live.
**Risk:** 🔴 (retrieval quality determines answer quality; eval rigor is non-negotiable).

## Sprint 10 — Grounded Generation + Citations + Beta Hardening 🔴
**Duration:** 2–3 weeks (beta gate; allow hardening)
**Goals:** Cited, streamed answers; private beta launch.
**Deliverables:** grounded streamed generation + native citations bound to locators + citation popover + jump-to-source; AI chat UI (scope chip, streaming, message actions); cost dashboard; perf/a11y/offline-tolerant hardening pass.
**Tasks:** generation + citation binding; chat panel (desktop side / mobile sheet); save-as-note / make-flashcard hooks; depth control (effort); cost-per-answer dashboard; beta bug-bash + a11y audit. *(E9.F2–F3, E3.F3)*
**Dependencies:** Sprint 9.
**Testing (delta):** **citation accuracy ≥ gate** on golden set; first-token < 1s p50; "not in sources" path; injection red-team smoke; e2e: upload→read→ask→cited answer→jump.
**Review checklist (delta):** every answer cited or explicitly ungrounded; stop control works; cost captured.
**DoD (delta):** the full R1 loop works end-to-end; beta cohort hits the activation north-star; eval + a11y + SLO gates green.
**Risk:** 🔴 (the make-or-break release; trust + latency bars are hard).

> **🎯 Milestone: Private Beta (~end Sprint 10, ~month 5).** "Upload a book, read it beautifully, ask anything, get cited answers."

---

# Phase 2 — Knowledge Engine (Sprints 11–15)

## Sprint 11 — Sync & Offline (Hardening + Foundation) 🟡
**Duration:** 2 weeks
**Goals:** Beta is solid across devices; offline reading/annotation works.
**Deliverables:** local-first store (IndexedDB) + mutation queue + idempotent replay; CRDT (Yjs) annotations; delta sync; offline indicator; beta debt cleanup.
**Tasks:** local store + op log + background sync; CRDT for notes; LWW for highlights/progress; reconnect consolidation; service worker. *(E16.F3, beta debt)*
**Dependencies:** Sprint 10.
**Testing (delta):** offline-mutate on two simulated devices → converge, no loss; reconnect dedupe; conflict resolution.
**DoD (delta):** annotate offline → reconnect → no duplication/loss; multi-device annotations merge.
**Risk:** 🟡 (CRDT/sync correctness; contained by good tests).

## Sprint 12 — Knowledge Extraction (Map phase) 🔴
**Duration:** 2–3 weeks
**Goals:** Documents auto-yield core artifacts (concepts/entities/definitions/quotes).
**Deliverables:** genre classifier + extraction profiles; map-reduce extraction passes (structured outputs, batch API) producing candidates with locators + confidence.
**Tasks:** classifier; grouped extraction passes (concepts/entities/defs/vocab; quotes/claims/timeline); batch routing; prompt caching of instructions+context. *(E10.F1 extraction, KNOWLEDGE-ENGINE §6–7)*
**Dependencies:** Sprint 4 (chunks/summaries), Sprint 9 (structured-output infra).
**Testing (delta):** extraction precision/recall on a labeled golden corpus; verbatim-quote check; batch cost within cap.
**Review checklist (delta):** every artifact carries a locator; structured-output schemas validated.
**DoD (delta):** an uploaded doc produces candidate concepts/entities/definitions/quotes with provenance.
**Risk:** 🔴 (extraction quality + cost; new ML-heavy surface).

## Sprint 13 — Resolution, Inference, Graph Materialization 🔴
**Duration:** 2 weeks
**Goals:** Candidates become a cross-source, verified, persisted graph.
**Deliverables:** dedup + entity/concept resolution + canonical linking; relationship inference + prerequisite chains; verification (grounding + contradiction); graph materialization (Postgres kg_nodes/edges + node embeddings).
**Tasks:** resolver (embedding + name + LLM disambiguation, confidence-gated); inferencer; verifier; graph upsert + provenance + read-models. *(E10.F1 resolve/infer, §8–10)*
**Dependencies:** Sprint 12.
**Testing (delta):** dedup precision (no over-merging); cross-doc concept = one node; unsupported artifacts dropped; contradiction detection.
**DoD (delta):** the same concept across two docs is one node with two provenances; unverified artifacts excluded.
**Risk:** 🔴 (over-merging corrupts the graph; verification is essential).

## Sprint 14 — Graph Explorer + Cross-Source Views 🟡
**Duration:** 2 weeks
**Goals:** Users see and explore their knowledge.
**Deliverables:** graph explorer (WebGL, layouts) + concept detail panel + "where have I read about X" + **accessible list/tree equivalent**.
**Tasks:** graph canvas + pan/zoom/focus; node detail (summary+sources+connections+actions); cross-source view; mandatory a11y tree view; jump-to-source. *(E10.F2)*
**Dependencies:** Sprint 13.
**Testing (delta):** graph renders within perf budget; **list equivalent fully keyboard/SR-operable**; provenance jumps correctly.
**Review checklist (delta):** graph is not the only way in (list equivalent complete); edges not color-only.
**DoD (delta):** a concept shows all its sources; the graph is usable without a mouse.
**Risk:** 🟡.

## Sprint 15 — Multi-Format + Remaining Artifacts + Dashboard/Analytics 🟡
**Duration:** 2–3 weeks
**Goals:** Podcasts/videos/articles ingest; full artifact set; the calm home + first insights.
**Deliverables:** audio/video transcription + web-article ingestion; remaining artifacts (frameworks/action-items/vocabulary/skills/timeline); dashboard v1 (continue-reading, today, recent); reading + learning analytics v1 (with text equivalents).
**Tasks:** transcription pipeline (timestamped locators); article extractor; doc/chapter-level artifact passes + skill mapping + timeline normalization; dashboard; analytics aggregation + charts + accessible equivalents. *(E4.F2 media, E10 remaining, E13.F1–F2)*
**Dependencies:** Sprint 13, Sprint 11.
**Testing (delta):** transcript locatability; timeline date normalization; chart text-equivalents; dashboard widgets fail independently.
**DoD (delta):** a podcast becomes locatable knowledge; all eleven artifacts present per applicable genre; dashboard + analytics live.
**Risk:** 🟡.

> **🎯 Milestone: Knowledge Engine (~end Sprint 15, ~month 8).** Demonstrably *not a reader.*

---

# Phase 3 — Tutor + Learning (Sprints 16–22) → Public Launch

## Sprint 16 — Flashcards + Spaced Repetition 🟡
**Duration:** 2 weeks
**Goals:** Capture → retain loop with FSRS scheduling.
**Deliverables:** flashcard model + FSRS scheduler + review loop (reveal→grade, preloaded queue); card creation from highlight/answer; deck management.
**Tasks:** card + FSRS; review UI (keyboard + mobile gestures); create-from-highlight/answer; suspend/leech; source-span link. *(E12.F1)*
**Dependencies:** Sprint 7 (highlights), Sprint 10 (answers).
**Testing (delta):** FSRS scheduling correctness; zero-wait between cards; offline review + queued grades.
**DoD (delta):** a highlight becomes a card in one action; review queue advances instantly; "all caught up" shown calmly.
**Risk:** 🟡.

## Sprint 17 — AI Decks + Quizzes 🟡
**Duration:** 2 weeks
**Goals:** AI-generated study material with cited feedback.
**Deliverables:** AI deck generation (editable); quizzes (MCQ/short/T-F/cloze) + answer flow + cited per-question feedback + AI short-answer grading; misses→flashcards.
**Tasks:** deck generation (from vocab/concepts/chapter); quiz generation + grading + cited explanations; convert-misses; difficulty controls. *(E12.F1 gen, E12.F2)*
**Dependencies:** Sprint 16, Sprint 12 (vocab/concepts).
**Testing (delta):** generated cards/quizzes pass eval gate; short-answer grading + self-assess fallback; cited feedback resolves to source.
**DoD (delta):** generate a quiz from any knowledge-ready doc; missed questions become cards.
**Risk:** 🟡 (generation quality on eval gate).

## Sprint 18 — Mastery Model + Analytics Deepening 🟢
**Duration:** 2 weeks
**Goals:** Track what the user knows; richer honest insight.
**Deliverables:** mastery model (per-concept scoring + decay) feeding tutor/review targeting; deepened analytics (retention/mastery trends, drill-down); buffer/hardening.
**Tasks:** mastery scoring from reviews/quizzes/reading; decay; weak-concept targeting; analytics trends + comparisons; debt cleanup. *(E12.F3, E13.F2)*
**Dependencies:** Sprint 17.
**Testing (delta):** mastery updates from reviews/quizzes + decays; targeting picks low-mastery concepts; analytics non-punitive framing.
**DoD (delta):** mastery scores drive the review queue; analytics show retention honestly.
**Risk:** 🟢.

## Sprint 19 — AI Tutor (Agent Loop) 🔴
**Duration:** 2–3 weeks
**Goals:** Personalized, Socratic, cited tutoring from the user's corpus.
**Deliverables:** tutor agent loop with gated/audited tools (retrieve/get_span/graph_query/assess_mastery/create_cards/schedule_review/send_to_user); strategies (Socratic, explain-then-check); cited dialogue + quick-reply chips.
**Tasks:** agent loop + tool gating + audit; strategy selector reading mastery; streamed cited messages; quick-replies; session persistence + compaction. *(E11.F1)*
**Dependencies:** Sprint 13 (graph), Sprint 18 (mastery), Sprint 10 (RAG).
**Testing (delta):** tool calls gated + logged; eval gate for tutor quality; cited dialogue resolves to source; long-session compaction.
**Review checklist (delta):** destructive/external tool actions gated; untrusted content not treated as instructions.
**DoD (delta):** start a session from a topic or "teach my weak spots"; tutor teaches with citations and adapts.
**Risk:** 🔴 (highest-value, highest-risk AI surface; agent reliability + safety).

## Sprint 20 — Study Plans + Practice Integration + Read-Aloud 🟡
**Duration:** 2 weeks
**Goals:** Goal-driven learning + accessibility win.
**Deliverables:** study plans (AI-generated, progress-tracked); mid-session practice (tutor generates quiz/cards, folds results back); read-aloud (TTS, word-sync) + reading a11y options.
**Tasks:** plan generation + progress; practice interjections wired to E12; TTS player + sync-highlight; reading ruler/dyslexia font. *(E11.F2, E6.F4)*
**Dependencies:** Sprint 19, Sprint 17.
**Testing (delta):** plan ties to corpus + mastery; TTS word-sync; a11y options persist.
**DoD (delta):** a goal produces a followable plan; tutor practice updates mastery; read-aloud works with sync.
**Risk:** 🟡.

## Sprint 21 — Desktop App (Offline-First) 🟡
**Duration:** 2–3 weeks
**Goals:** A great offline reading/study device.
**Deliverables:** Tauri desktop shell wrapping the reader; local SQLite/file cache; offline reading/annotation/review; local vector cache for offline semantic search.
**Tasks:** Tauri shell + local storage; reuse web reader; sync engine on desktop; local embeddings/vector cache; offline search. *(E16.F1, builds on E16.F3)*
**Dependencies:** Sprint 11 (sync), Sprint 5 (reader).
**Testing (delta):** full offline read/annotate/review → sync on reconnect; offline semantic search over ingested docs.
**DoD (delta):** desktop app works fully offline and syncs cleanly.
**Risk:** 🟡 (new platform/runtime).

## Sprint 22 — Notifications, Whispers + Launch Hardening 🟡
**Duration:** 2–3 weeks (launch sprint)
**Goals:** Calm proactive intelligence; public launch readiness.
**Deliverables:** notification center (user-controlled cadence, digests, quiet hours); proactive whispers (cross-source connections, one at a time); full launch hardening (perf, a11y, security review, load test, DR drill).
**Tasks:** notification model + cadence settings; whisper generation (from cross-corpus links) + frequency cap; launch bug-bash; security review; restore-runbook drill; KPI dashboards verified. *(E14.F1–F2, launch)*
**Dependencies:** Sprint 13 (graph connections), all prior.
**Testing (delta):** cadence respected; ≤1 whisper at a time; load/soak test; full a11y audit; DR restore verified.
**Review checklist (delta):** no manufactured urgency; launch security + privacy (export/delete) verified.
**DoD (delta):** launch gates green (eval, SLO, security, a11y, DR); product is publicly demoable end-to-end.
**Risk:** 🟡 (launch coordination; risk concentrated in scope creep — freeze and harden).

> **🎯 Milestone: Public Launch (~end Sprint 22, ~month 11).** Reader + Knowledge Engine + Tutor + Learning System — the differentiated product.

---

# Phase 4+ — Scale & Ecosystem (Directional Backlog)

Beyond launch I plan in **themes**, not pre-baked sprints — priorities will shift with real usage data. Each theme is ~1–3 sprints when picked up, scoped at the time:

| Theme | What | Trigger |
|---|---|---|
| **Scale-outs** | pgvector→Qdrant; graph→Neo4j/AGE; ClickHouse analytics; K8s | hit the defined scale thresholds (ROADMAP §12) |
| **Plugins & MCP** | plugin system (scoped grants, sandbox) + 1–2 connectors (Readwise/Notion) | post-launch demand |
| **Mobile app** | Expo: read/highlight/review online+offline | after desktop validates the offline core |
| **Deep research** | multi-doc synthesis, long-horizon agent, cited reports | when tutor is stable |
| **Import/export** | Anki, Obsidian/Markdown, BibTeX, full data export | user pull |
| **Orgs/teams** | shared libraries, admin (data-model already tenant-ready) | first B2B interest |
| **VYANA OS** | Knowledge API + MCP server + SSO + embeddable surfaces | strategic, deferred (ROADMAP R5) |

**Why directional:** an honest EM doesn't commit a small team to sprint-level detail 6+ months out. We re-forecast at each milestone against actual velocity and the KPI dashboard.

---

## Summary Timeline

| Sprint(s) | Phase | Outcome | Peak risk |
|---|---|---|---|
| 0–2 | Foundations | shell + auth + tenancy + AI gateway + storage | 🟡 |
| 3–4 | Ingestion | all v1 formats → indexed | 🔴 (PDF) |
| 5–6 | Reader | beautiful reading + library loop | 🔴 (reader) |
| 7–8 | Annotations + Search | highlights/notes + hybrid search | 🟡 |
| 9–10 | RAG | **cited Q&A → Private Beta** | 🔴 (trust/latency) |
| 11 | Sync/Offline | solid multi-device + offline | 🟡 |
| 12–15 | Knowledge Engine | **graph + 11 artifacts → not-a-reader** | 🔴 (extraction) |
| 16–18 | Learning | flashcards/quizzes/mastery | 🟡 |
| 19–20 | Tutor | **personalized cited tutoring** | 🔴 (agent) |
| 21–22 | Desktop + Launch | offline app + **Public Launch** | 🟡 |
| 23+ | Scale/Ecosystem | directional themes | — |

## EM Notes (how I'll actually run this)

- **Protect the critical path** (ingestion → reader → RAG → knowledge → tutor). Staff senior people there; let lower-risk work fill gaps.
- **The three 🔴 clusters** (PDF ingestion S3, reader S5, RAG/trust S9–10, extraction S12–13, tutor S19) get extra buffer and a spike/de-risk task *before* the build sprint where feasible.
- **Eval gates from Sprint 9 on** are non-negotiable CI blockers — AI quality is engineered, not hoped for.
- **Flag-gate risky work**; ship dark, enable gradually, roll back instantly.
- **Re-forecast every milestone** against velocity. If we're slow, we cut *scope within a release* (drop Should/Could features), never the *trust/quality gates*.
- **Hardening is scheduled, not heroic** — Sprints 11, 18, and the launch sprint absorb debt explicitly.

---

*End of Sprint Plan v1. Sprints 0–22 are committed at decreasing confidence (high near-term, directional past ~S15); Phase 4+ is a backlog re-planned at each milestone. This plan governs day-to-day execution; the milestone gates (Private Beta S10, Knowledge S15, Launch S22) are where we stop, measure, and re-forecast.*
