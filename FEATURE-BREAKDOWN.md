# BookHelper — Complete Feature Breakdown

## Product backlog: Epics → Features → Subfeatures → Tasks → Acceptance Criteria → Future Enhancements

> **Companion to** [ARCHITECTURE.md](ARCHITECTURE.md), [UX-DESIGN.md](UX-DESIGN.md), [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). This is the engineering/product backbone — what we build, in what order, with what definition of done. No implementation code.

### How to read this

- **Hierarchy:** `Epic → Feature → Subfeature → Tasks → Acceptance Criteria → Future Enhancements`. Tasks/AC/Future-Enhancements are stated at the **Feature** level and cover the listed subfeatures (the right granularity for a backlog; sprint-level task splitting happens per subfeature in the tracker).
- **Priority (MoSCoW):** `[MUST]` ship-blocker for a coherent release · `[SHOULD]` high-value, plan for it · `[COULD]` desirable if capacity allows · `[WON'T-NOW]` explicitly deferred (kept visible so it isn't rediscovered as "missing").
- **Acceptance Criteria** are written to be testable (a QA/PM can verify pass/fail).
- **Dependencies** reference Epic/Feature IDs (e.g., `E4.F2`) or external systems.
- **Epic priority** = the priority of getting the epic to a usable state; individual features inside it carry their own MoSCoW.

### Epic map & phasing (aligns to ARCHITECTURE.md §25)

| ID | Epic | Priority | Roadmap phase |
|---|---|---|---|
| **E1** | Platform Foundation | MUST | P0 |
| **E2** | Identity & Access | MUST | P0 |
| **E3** | AI Gateway & Cost Platform | MUST | P0 |
| **E4** | Content Ingestion Pipeline | MUST | P1–P2 |
| **E5** | Library & Content Management | MUST | P1 |
| **E6** | Reading Experience | MUST | P1 |
| **E7** | Annotations — Highlights & Notes | MUST | P1 |
| **E8** | Search & Discovery | MUST | P1–P2 |
| **E9** | AI Chat & RAG | MUST | P1 |
| **E10** | Knowledge Engine & Graph | SHOULD | P2 |
| **E11** | AI Tutor | SHOULD | P3 |
| **E12** | Learning System (Flashcards/Quizzes/SR) | SHOULD | P3 |
| **E13** | Analytics & Dashboard | SHOULD | P2–P3 |
| **E14** | Notifications & Proactive Intelligence | COULD | P3 |
| **E15** | Plugins & Integrations | COULD | P4 |
| **E16** | Multi-Platform Apps (Desktop/Mobile) | SHOULD/COULD | P3–P4 |
| **E17** | Trust, Security & Compliance | MUST | P0–ongoing |
| **E18** | VYANA OS Integration | WON'T-NOW | P5 |

---

# E1 — Platform Foundation `[MUST]`

*The repo, environments, CI/CD, observability, and design-system implementation everything else builds on.*
**Dependencies:** none (foundational).

## E1.F1 Monorepo & Tooling `[MUST]`
**Dependencies:** none.
**Subfeatures:** workspace setup (pnpm + Turborepo); Python toolchain (uv); shared config packages (tsconfig/eslint/tailwind presets); generated API contracts; remote build cache.
**Tasks:**
- Establish monorepo layout (apps/, packages/, packages-py/, infra/).
- Configure Turborepo pipelines (build/test/lint/typecheck) with remote cache.
- Set up shared config + code-gen for `api-contracts`.
- Pre-commit hooks (format, lint, typecheck on staged).
**Acceptance Criteria:**
- A new package can be scaffolded and consumed by an app with zero manual wiring.
- `turbo run build` builds only affected packages; cold vs. warm cache measurably differs.
- CI runs typecheck/lint/test on PRs and blocks on failure.
**Future Enhancements:** code-owners-based review routing; automated dependency-graph visualization; package-level changelogs.

## E1.F2 CI/CD & Environments `[MUST]`
**Dependencies:** E1.F1.
**Subfeatures:** GitHub Actions pipelines; ephemeral preview environments per PR (with DB branch); staging/prod promotion; DB migration runner (expand/contract); rollback.
**Tasks:**
- Build per-app deploy pipelines; gate on tests + eval suite + security scan.
- Ephemeral preview env per PR (DB branch via Neon/equivalent).
- Migration pipeline (pre-deploy, reversible) + rollback runbook.
- Canary + feature-flag promotion.
**Acceptance Criteria:**
- Opening a PR yields a working preview URL with an isolated database.
- A failed eval/security gate blocks merge.
- A bad deploy can be rolled back to the previous version in < 5 min.
**Future Enhancements:** progressive delivery (% traffic canaries); automated rollback on SLO breach; multi-region deploy.

## E1.F3 Observability `[MUST]`
**Dependencies:** E1.F2.
**Subfeatures:** OpenTelemetry tracing (request→retrieval→model); metrics (Prometheus/Grafana); error tracking (Sentry); LLM observability (prompt/context/citations/cost/latency); alerting & SLOs.
**Tasks:**
- Instrument services with OTel; propagate trace IDs across the queue boundary.
- Wire LLM-call tracing (prompt, retrieval set, citations, tokens, cost).
- Define SLOs (read p95, first-AI-token, ingestion lag, error rate, cache hit-rate) + alerts.
**Acceptance Criteria:**
- A single trace spans a Q&A request through retrieval and the model call.
- Every model call is visible with cost + latency + cache hit-rate.
- SLO breach triggers an alert to the on-call channel.
**Future Enhancements:** anomaly detection on cost/latency; user-facing status page; trace-linked eval failures.

## E1.F4 Design System Implementation `[MUST]`
**Dependencies:** E1.F1; DESIGN-SYSTEM.md ("Atlas").
**Subfeatures:** token packages (primitive/semantic/theme); `packages/ui` primitives; theming (light/dark); visual-regression baselines; Storybook/catalog.
**Tasks:**
- Implement token tiers + light/dark theme remap.
- Build core primitives (button, input, dropdown, card, dialog, table, tabs, toast) with all states.
- Set up visual-regression testing + component catalog.
**Acceptance Criteria:**
- Switching theme remaps semantic tokens with no component changes.
- Every core primitive documents all states in both themes and passes a11y checks.
- A visual-regression baseline blocks unintended visual diffs.
**Future Enhancements:** runtime theming/"spaces"; density mode toggle; per-tenant brand theming (for VYANA OS).

---

# E2 — Identity & Access `[MUST]`

*Auth, sessions, RBAC, tenancy, account lifecycle.*
**Dependencies:** E1.

## E2.F1 Authentication `[MUST]`
**Dependencies:** E1.F1; external auth provider (WorkOS/Clerk).
**Subfeatures:** email magic link; social (Google/Apple); passkeys/WebAuthn; session issuance (JWT + refresh); device session management; sign-out everywhere.
**Tasks:**
- Integrate OIDC provider; implement token issue/refresh/rotation.
- Edge JWT verification (JWKS cache) + Redis-backed revocation list.
- Passkey enrollment + login flow; social providers.
- Device/session list UI + revoke.
**Acceptance Criteria:**
- A user can sign up and sign in via magic link, social, and passkey.
- Access tokens expire and silently refresh; revoked sessions are rejected within seconds.
- "Sign out of all devices" invalidates all active sessions.
**Future Enhancements:** enterprise SSO (SAML/OIDC) + SCIM; MFA policies; step-up auth for sensitive actions.

## E2.F2 Authorization, RBAC & Tenancy `[MUST]`
**Dependencies:** E2.F1; E17.F1.
**Subfeatures:** roles (user/admin/org_admin); resource-ownership checks; multi-tenant data isolation (`owner_id`/`org_id`); service-to-service auth.
**Tasks:**
- Enforce ownership predicate on every data path (app guard + Postgres RLS).
- Implement signed service tokens / mTLS between services.
- Tenancy scoping in vector DB and object storage keys.
**Acceptance Criteria:**
- A user cannot read or mutate another user's document/annotation/graph (verified by automated test).
- Vector and storage queries are tenant-filtered; cross-tenant access is impossible by construction.
- Inter-service calls without a valid service token are rejected.
**Future Enhancements:** organizations & shared libraries; granular sharing/permissions; audit-grade access logs per resource.

## E2.F3 Account Lifecycle `[MUST]`
**Dependencies:** E2.F1.
**Subfeatures:** profile creation; email change/verify; account deletion (cascade); data export.
**Tasks:**
- Account create/update flows; email re-verification.
- Hard-delete cascade (blobs, vectors, graph, cache) with confirmation.
- Full data export job.
**Acceptance Criteria:**
- Account deletion removes all user data across stores within the SLA and is irreversible after confirmation.
- Data export produces a complete, machine-readable archive.
**Future Enhancements:** account recovery flows; grace-period soft delete; transfer/merge accounts.

---

# E3 — AI Gateway & Cost Platform `[MUST]`

*The provider-abstraction firewall: no feature imports a model SDK.*
**Dependencies:** E1; external model providers (Anthropic default, Voyage embeddings).

## E3.F1 Provider Abstraction & Routing `[MUST]`
**Dependencies:** E1.F1.
**Subfeatures:** unified `generate/stream/embed/rerank` interface; task-based model routing; fallback chains; capability normalization (thinking/effort/structured output/citations); provider adapters (Anthropic, Voyage, +pluggable OpenAI/Google/local).
**Tasks:**
- Define the gateway interface + request/response contracts.
- Implement Anthropic + Voyage adapters; routing table by task class + tier + budget.
- Implement fallback chains + central refusal handling.
- Resolve model IDs from config/Models API (never hardcoded in features).
**Acceptance Criteria:**
- No application package imports a model SDK directly (lint-enforced).
- Swapping the model for a task class is a config change requiring no feature edits.
- On provider overload/refusal, the configured fallback serves the request transparently.
**Future Enhancements:** per-tenant model policy; multi-provider A/B routing; local/self-hosted model adapter; automatic model upgrades behind eval gates.

## E3.F2 Prompt Caching & Batching `[MUST]`
**Dependencies:** E3.F1.
**Subfeatures:** cache-breakpoint management; silent-invalidator guards; batch routing for non-interactive jobs; cache pre-warming.
**Tasks:**
- Implement cache-control placement for stable prefixes (system/persona/doc context).
- CI lint for cache invalidators (timestamps/UUIDs/unsorted JSON in prefixes).
- Route ingestion enrichment to the Batch API; cache hit-rate reporting.
**Acceptance Criteria:**
- Repeated requests with identical prefixes show a non-zero cache-read rate.
- A cache-invalidator introduced into a prefix fails the lint check.
- Bulk enrichment runs at the discounted batch rate.
**Future Enhancements:** adaptive TTL by document heat; cross-user canonical-context caching; cache-warm on reader open at scale.

## E3.F3 Cost Accounting & Quotas `[MUST]`
**Dependencies:** E3.F1; E1.F3.
**Subfeatures:** per-call cost tagging (user/feature/task); usage metering; per-tier budgets/quotas; cost dashboards & alerts.
**Tasks:**
- Tag every model/embedding call; write to `usage_meter`.
- Enforce per-tier budgets with graceful degradation when exceeded.
- Cost dashboards (per user/feature/document) + spend alerts.
**Acceptance Criteria:**
- Cost per answer / per document / per user is queryable.
- A user exceeding their quota is down-routed or paused with a clear message (not a hard crash).
- A spend anomaly triggers an alert.
**Future Enhancements:** real-time budget UI for users; cost-aware routing optimization; bring-your-own-key.

---

# E4 — Content Ingestion Pipeline `[MUST]`

*Async, idempotent, resumable: source → parse → normalize → chunk → embed → enrich → index → graph.*
**Dependencies:** E1, E3, E11.* not required; E11 depends on this.

## E4.F1 Pipeline Orchestration `[MUST]`
**Dependencies:** E1 (queue), E11 storage.
**Subfeatures:** queue + consumer groups; versioned, idempotent steps (`content_hash, step, step_version`); retries + DLQ; resumability; backpressure/autoscale.
**Tasks:**
- Build step registry with idempotency keying + resumption.
- Wire queue consumers, retries, dead-letter handling.
- Surface per-document ingest status + step progress.
**Acceptance Criteria:**
- Re-running an unchanged document re-executes no steps (idempotent).
- Bumping a single step version reprocesses only that step and downstream.
- A failed step retries with backoff and lands in the DLQ after N attempts without losing the job.
**Future Enhancements:** priority lanes (paid users first); partial re-ingest by region; pipeline replay tooling.

## E4.F2 Multi-Format Parsing & Normalization `[MUST]` (text formats), `[SHOULD]` (media)
**Dependencies:** E4.F1.
**Subfeatures:** PDF (text+layout); EPUB; HTML/web article; OCR for scanned PDFs; audio/video transcription (timestamped) `[SHOULD]`; notes/markdown; **canonical Document Model + universal locators**.
**Tasks:**
- Implement per-format parsers → normalize to blocks with stable locators.
- OCR fallback detection + pipeline branch for scans.
- Transcription pipeline for audio/video → timestamped segments.
**Acceptance Criteria:**
- A PDF, EPUB, web article, and note each produce a consistent block model with addressable locators.
- A scanned PDF is detected and OCR'd; resulting text is locatable.
- An audio file produces a timestamped, locatable transcript.
**Future Enhancements:** table/figure structure extraction; math/LaTeX parsing; multi-language OCR; diarization for podcasts; layout-aware reading order for complex PDFs.

## E4.F3 Chunking & Embedding `[MUST]`
**Dependencies:** E4.F2, E3.F1.
**Subfeatures:** structure-aware chunking (hierarchical, parent/child); embedding (Voyage, batched, versioned); vector storage; re-embed on model/version change.
**Tasks:**
- Implement structure-aware + hierarchical chunker with overlap.
- Batch-embed chunks; store vectors with `embed_model/version`.
- Embedding cache keyed by `(content_hash, chunk, version)`.
**Acceptance Criteria:**
- Chunks respect document structure (no mid-sentence/heading splits) and retain parent context.
- Embeddings are cached; re-ingesting unchanged content reuses vectors.
- An embedding-model version bump triggers controlled re-embedding.
**Future Enhancements:** late-chunking/contextual embeddings; adaptive chunk sizing by content type; multi-vector (summary + detail) indexing.

## E4.F4 Indexing `[MUST]`
**Dependencies:** E4.F3.
**Subfeatures:** dense vector index (pgvector → Qdrant); sparse/keyword index (Postgres FTS → OpenSearch); metadata index; tenant-filtered queries.
**Tasks:**
- Build dense + sparse indexes with tenant filtering.
- Index versioning for re-index safety.
**Acceptance Criteria:**
- Both dense and sparse indexes are queryable per tenant within latency SLO.
- A re-index can run without downtime (versioned swap).
**Future Enhancements:** Qdrant migration at scale threshold; hybrid index tuning per corpus; incremental index updates.

---

# E5 — Library & Content Management `[MUST]`

*Adding, organizing, and browsing the corpus.*
**Dependencies:** E2, E4, E11.

## E5.F1 Source Intake `[MUST]`
**Dependencies:** E4.F1, E11 (object storage).
**Subfeatures:** file upload (presigned, direct-to-storage); URL/article paste; format detection + dedupe by hash; ingest status UI.
**Tasks:**
- Presigned-upload flow; completion callback → trigger ingestion.
- URL intake (article extraction); content-hash dedupe.
- Live ingest-status card (Parsing→Embedding→Knowledge→Ready).
**Acceptance Criteria:**
- A large file uploads directly to storage (not through API servers) and begins ingestion.
- Re-adding an identical file is deduped, not reprocessed.
- The user sees pipeline progress and can open the doc for reading once parsed.
**Future Enhancements:** bulk upload; folder import; drag-and-drop anywhere; email-to-library; mobile share-sheet capture.

## E5.F2 Library Browsing & Organization `[MUST]`
**Dependencies:** E5.F1.
**Subfeatures:** library views (grid/list/cover); collections (nested); tags; sort/filter; multi-select bulk actions; quick-look; pin/finish.
**Tasks:**
- Library UI with grid/list/cover, sort, filter, search-in-library.
- Collections CRUD + drag-to-organize + nesting.
- Bulk select/move/delete/export; quick-look panel.
**Acceptance Criteria:**
- A user can find a document by sort/filter/search and open it.
- Documents can be organized into nested collections via drag or menu (keyboard-accessible).
- Bulk operations apply to a multi-selection with a single action.
**Future Enhancements:** smart collections (rule-based); shared collections; reading lists/queues; cover auto-generation.

## E5.F3 Document Lifecycle `[SHOULD]`
**Dependencies:** E5.F1, E2.F2.
**Subfeatures:** metadata edit; re-ingest/replace; delete (cascade); failed-ingest recovery.
**Tasks:**
- Metadata editor; replace-file/re-ingest action.
- Delete with cascade across stores; failure-state recovery (retry/OCR/replace).
**Acceptance Criteria:**
- Editing metadata persists and reflects in library/search.
- A failed ingestion offers a clear recovery action that succeeds on retry.
- Deleting a document removes its chunks, vectors, graph nodes, and cache.
**Future Enhancements:** version history of a document; merge duplicate sources; archive (vs delete).

---

# E6 — Reading Experience `[MUST]`

*The crown jewel: calm, fast, beautiful, instrumented.*
**Dependencies:** E4.F2 (Document Model), E5, E11.

## E6.F1 Reading Surface & Navigation `[MUST]`
**Dependencies:** E4.F2.
**Subfeatures:** Document-Model renderer (text-first, lazy media); PDF/EPUB faithful render; scroll & paginate modes; virtualization; position restore; table of contents.
**Tasks:**
- Renderer for canonical blocks; faithful PDF page render path.
- Windowed rendering for large docs; instant position restore from local cache.
- TOC/outline jump; chapter navigation.
**Acceptance Criteria:**
- Opening a previously read document restores the exact position instantly.
- A 900-page document scrolls smoothly without rendering the full DOM.
- Text streams in first; images lazy-load with no layout shift.
**Future Enhancements:** two-page spread; continuous-vs-paged preference per doc; image zoom/lightbox; footnote popovers.

## E6.F2 Reading Controls & Theming `[MUST]`
**Dependencies:** E6.F1; E1.F4.
**Subfeatures:** font family/size/measure/line-height/spacing; themes (Light/Sepia/Dark/Night); live preview; per-doc/global preferences.
**Tasks:**
- Reading-controls popover with live preview.
- Reader themes independent of app chrome; persistence.
**Acceptance Criteria:**
- Adjusting type/measure/theme updates the page immediately and persists.
- Reader theme is independent of the app theme.
**Future Enhancements:** custom reading profiles; auto-theme by time of day; per-genre presets.

## E6.F3 Reading Progress & Instrumentation `[MUST]`
**Dependencies:** E6.F1.
**Subfeatures:** progress tracking (locator + %); "time left in chapter"; bookmarks; invisible reading-event capture (dwell, re-reads) feeding the learning loop.
**Tasks:**
- Progress persistence + cross-device sync.
- Reading-event stream emission (batched).
- Bookmark create/jump.
**Acceptance Criteria:**
- Progress syncs across devices; resuming on another device lands at the same place.
- Reading events are captured without any visible performance cost or UI clutter.
**Future Enhancements:** reading-speed estimation per user; heatmap of attention; goal-based progress.

## E6.F4 Read-Aloud (TTS) & Reading Accessibility `[SHOULD]`
**Dependencies:** E6.F1; E3 (optional TTS provider) or platform TTS.
**Subfeatures:** TTS with word/sentence sync-highlight; speed control; reading ruler/focus line; dyslexia font.
**Tasks:**
- TTS player with synced highlighting; rate control.
- Reading ruler + dyslexia-font options.
**Acceptance Criteria:**
- Read-aloud highlights the spoken word/sentence in sync and is pausable/seekable.
- Reading ruler and dyslexia font are togglable and persist.
**Future Enhancements:** AI narration voices; per-language voices; resume-listening across sessions; background/lock-screen audio.

---

# E7 — Annotations: Highlights & Notes `[MUST]`

*Frictionless capture → durable knowledge.*
**Dependencies:** E6, E10 (graph linking — optional), E11.

## E7.F1 Highlights `[MUST]`
**Dependencies:** E6.F1.
**Subfeatures:** select-to-highlight (instant, optimistic); colors (semantic, optional); per-doc gutter list; global highlights view; act-on-highlight (note/ask/flashcard).
**Tasks:**
- Selection toolbar + instant optimistic highlight (locator-anchored).
- Color set + recolor; per-doc gutter markers; global highlights view with filters.
- Actions: add note, ask AI, make flashcard, copy-with-citation.
**Acceptance Criteria:**
- A highlight appears instantly on selection and survives offline, syncing later.
- Highlights are listed per-document and globally, filterable by color/tag/doc.
- A highlight can be converted into a flashcard or AI question in one action.
**Future Enhancements:** highlight tags/categories; export (Markdown/CSV/Anki); shared/public highlights; highlight analytics.

## E7.F2 Notes `[MUST]`
**Dependencies:** E6.F1; E10 (concept linking — `[[ ]]`) optional.
**Subfeatures:** anchored notes (on selection); standalone notes; rich text + Markdown; `[[concept]]`/`[[doc]]` linking; backlinks; autosave (local-first).
**Tasks:**
- Note editor (rich text + Markdown), anchored + standalone.
- `[[ ]]` autocomplete + backlink resolution.
- Local-first autosave with quiet sync state.
**Acceptance Criteria:**
- A note created on a selection is anchored to its source locator and "jump to source" works.
- Notes autosave locally and never lose content offline.
- `[[concept]]` links resolve and produce backlinks.
**Future Enhancements:** note templates; AI expand/summarize/critique a note; handwriting→text (stylus); embed highlights/images in notes; note graph view.

---

# E8 — Search & Discovery `[MUST]`

*Find anything by phrase or meaning, across the corpus.*
**Dependencies:** E4.F4 (indexes), E9 (ask-instead fallback).

## E8.F1 Hybrid Search `[MUST]`
**Dependencies:** E4.F4.
**Subfeatures:** unified input (dense + sparse fused, RRF); result types (passages/concepts/notes/highlights); scope (doc/collection/everything); filters; jump-to-span; "ask AI instead" fallback.
**Tasks:**
- Hybrid retrieval + fusion; search-as-you-type with debounce.
- Result tabs by type; scope + filter controls; jump-to-source highlighting.
- "Ask AI with this query" conversion.
**Acceptance Criteria:**
- A query returns blended exact + semantic matches, clearly labeled, within latency SLO.
- Opening a result jumps to the exact source span, highlighted.
- A no-results state offers the AI-answer fallback over the same scope.
**Future Enhancements:** saved searches; search history; cross-source "compare" results; voice search; natural-language filter parsing.

## E8.F2 Command Palette `[MUST]`
**Dependencies:** E1.F4; E5; E6; E9.
**Subfeatures:** universal fuzzy search (docs/commands/concepts/nav); prefix modes (`>`,`@`,`#`,`?`); nested commands; recent/frequent ranking; keyboard-complete.
**Tasks:**
- Palette with unified search + prefix modes + nested sub-commands.
- Action registry (commands callable from palette).
- Keyboard navigation + footer hint bar.
**Acceptance Criteria:**
- `⌘K` opens the palette anywhere; any document, action, or surface is reachable in ≤ 2 keystrokes + type.
- Prefix modes filter results to the right type.
- The palette is fully operable without a mouse.
**Future Enhancements:** custom user commands/macros; AI command suggestions; recent-context ranking; palette plugins (E15).

---

# E9 — AI Chat & RAG `[MUST]`

*Grounded, cited Q&A scoped to the corpus.*
**Dependencies:** E3, E4.F4, E6 (locator binding), E8.

## E9.F1 Retrieval & Context Assembly `[MUST]`
**Dependencies:** E4.F4, E3.F2.
**Subfeatures:** query understanding (intent/scope/rewrite); hybrid retrieve + rerank; scope control (passage/doc/collection/everything); context assembly with cached prefix; confidence gating.
**Tasks:**
- Lightweight query understander (cheap model) + multi-hop decomposition.
- Hybrid retrieval + reranker; scoped retrieval.
- Context builder with cache breakpoints; retrieval-confidence threshold.
**Acceptance Criteria:**
- Retrieval is scoped per the user's selected scope and reranked before assembly.
- Below the confidence threshold, the system declines rather than answering ungrounded.
- The assembled prefix is cache-eligible (verified by cache-read on repeat).
**Future Enhancements:** query auto-scoping; retrieval over media timestamps; graph-augmented retrieval (uses E10); per-user retrieval tuning.

## E9.F2 Grounded Generation & Citations `[MUST]`
**Dependencies:** E9.F1, E3.F1, E6.F1.
**Subfeatures:** streamed answers; native citations bound to locators; citation popover + jump-to-source; answer actions (note/flashcard/graph/copy/retry/deeper); depth control (effort).
**Tasks:**
- Streamed generation with citations; bind citations → source locators.
- Citation chip + provenance popover + jump-to-source.
- Message actions; depth control mapped to effort.
**Acceptance Criteria:**
- Every grounded answer carries citation chips that open the exact source span.
- The answer streams with first token < 1s (SLO) and a stop control.
- "Save as note / make flashcard / add to graph" each work from a message.
**Future Enhancements:** web-augmented answers (opt-in); multi-document compare; voice Q&A; answer branching; "explain simpler/deeper" inline.

## E9.F3 Conversation Management `[SHOULD]`
**Dependencies:** E9.F2, E11.
**Subfeatures:** conversation history; per-message persistence (retrieval set + citations + cost); long-conversation compaction; scope switching mid-chat.
**Tasks:**
- Persist conversations/messages/citations/usage.
- Server-side context compaction for long sessions.
- Mid-conversation scope change.
**Acceptance Criteria:**
- Conversations persist and reopen with full history and citations.
- A long conversation stays within context limits via compaction without losing thread.
**Future Enhancements:** shareable conversations; conversation search; pinned insights; export Q&A as a study doc.

---

# E10 — Knowledge Engine & Graph `[SHOULD]`

*The compounding moat: structured, cross-source knowledge.*
**Dependencies:** E4 (ingestion), E3 (extraction), E11.

## E10.F1 Knowledge Extraction `[SHOULD]`
**Dependencies:** E4.F3, E3.F2 (batch).
**Subfeatures:** hierarchical summaries (doc/chapter/section); entity + concept extraction (structured output); claim extraction (stance + evidence span); entity linking/dedup.
**Tasks:**
- Batch-extract summaries/entities/concepts/claims with structured outputs.
- Normalize/dedupe against existing graph (embedding + canonical-name resolution).
**Acceptance Criteria:**
- Each ingested document yields multi-resolution summaries and extracted concepts/entities/claims with source provenance.
- Repeated concepts across sources are deduplicated to a single node.
**Future Enhancements:** relation inference (prerequisite/contradiction/support); claim verification; cross-source synthesis; ontology alignment to a canonical backbone.

## E10.F2 Knowledge Graph & Cross-Source Views `[SHOULD]`
**Dependencies:** E10.F1.
**Subfeatures:** graph storage (Postgres→Neo4j/AGE); graph explorer (canvas + layouts); concept detail panel; "where have I read about X"; provenance everywhere; accessible list/tree equivalent.
**Tasks:**
- Graph store + traversal API; WebGL explorer (force/hierarchy/timeline).
- Concept detail (summary + sources + connections + actions).
- Cross-source concept view; **mandatory accessible tree/list equivalent**.
**Acceptance Criteria:**
- A concept node shows every source it appears in, each jumpable to the exact span.
- The graph is explorable visually and via a fully keyboard/screen-reader-operable list equivalent.
- Every node/edge traces back to source provenance.
**Future Enhancements:** contradiction surfacing UI; prerequisite-path view; timeline view; graph-scoped tutoring (feeds E11); shared/global concept ontology.

---

# E11 — AI Tutor `[SHOULD]`

*Personalized, Socratic teaching from the user's corpus.*
**Dependencies:** E9 (RAG), E10 (graph/mastery scope), E12 (practice), E3.

## E11.F1 Tutor Sessions & Dialogue `[SHOULD]`
**Dependencies:** E9.F1/F2, E3.F1.
**Subfeatures:** session start (topic/doc/concept/"my weak spots"); agentic loop with gated tools (retrieve/get_span/graph_query/assess_mastery/create_cards/schedule_review/send_to_user); teaching strategies (Socratic/explain-then-check/worked-example); streamed cited dialogue; quick-reply chips.
**Tasks:**
- Tutor agent loop with typed, gated, audited tool surface.
- Strategy selector reading the mastery model.
- Streamed, cited tutor messages + quick-reply next steps.
**Acceptance Criteria:**
- A session can start from a topic/doc/concept or "teach me where I'm weak."
- The tutor teaches with citations and adapts strategy; tool calls are logged/auditable.
- Mid-session practice (quiz/cards) can be generated and folded back into the session.
**Future Enhancements:** voice tutoring (hands-free); whiteboard/sketch pane; multi-document deep tutoring; tutor personas.

## E11.F2 Study Plans `[SHOULD]`
**Dependencies:** E11.F1, E10, E12.
**Subfeatures:** goal setting; AI-generated plan (modules→lessons); pace/depth; progress tracking; "what to review next."
**Tasks:**
- Plan generation from goal + corpus + mastery.
- Plan progress tracking + review recommendations.
**Acceptance Criteria:**
- A goal produces a structured, editable study plan tied to the user's sources.
- Plan progress updates as lessons/reviews complete.
**Future Enhancements:** adaptive replanning on performance; deadline-aware scheduling; plan templates; shareable plans.

## E11.F3 Deep Research Mode `[COULD]`
**Dependencies:** E11.F1, E9, E3 (top-tier model).
**Subfeatures:** multi-document synthesis; long-horizon agent run; cited research report; web augmentation (opt-in).
**Tasks:**
- Long-horizon research orchestration across multiple sources.
- Cited report generation with progress UX.
**Acceptance Criteria:**
- A research question over multiple sources produces a synthesized, fully-cited report.
- Long runs show progress and never block the UI.
**Future Enhancements:** scheduled recurring research; export to document; collaborative research.

---

# E12 — Learning System `[SHOULD]`

*Closing the loop: retention via flashcards, quizzes, spaced repetition.*
**Dependencies:** E6 (instrumentation), E9/E10/E11 (generation sources), E11 storage.

## E12.F1 Flashcards & Spaced Repetition `[SHOULD]`
**Dependencies:** E7 (capture), E9 (AI gen), E11 storage.
**Subfeatures:** card creation (manual + from highlight/note/answer); AI deck generation; FSRS scheduling; review loop (reveal→grade); deck management; suspend/leech.
**Tasks:**
- Card model + FSRS scheduler; review queue with preloaded next cards.
- AI draft cards (editable) from highlight/note/answer/chapter.
- Deck browser, suspend/bury, source-span link.
**Acceptance Criteria:**
- A highlight or AI answer becomes an editable flashcard in one action.
- The review queue advances with zero perceptible wait between cards.
- FSRS schedules due dates; "all caught up" is shown calmly when nothing's due.
**Future Enhancements:** cloze/image-occlusion cards; Anki import/export; shared decks; audio cards; leech handling automation.

## E12.F2 Quizzes `[SHOULD]`
**Dependencies:** E9 (generation), E10 (concept targeting), E12.F1.
**Subfeatures:** AI quiz generation (MCQ/short/T-F/cloze) from doc/chapter/concept; answering flow; cited per-question feedback; AI grading for short answers; weak-concept targeting; misses→flashcards.
**Tasks:**
- Quiz generation with type/length/difficulty controls.
- Answer flow + instant objective grading + streamed short-answer evaluation.
- Cited explanations; convert misses to cards; mastery feedback.
**Acceptance Criteria:**
- A quiz can be generated from any knowledge-ready source with cited per-question feedback.
- Short answers are AI-graded with a self-assess fallback if grading fails.
- Missed questions can be turned into flashcards in one action.
**Future Enhancements:** timed/exam mode; adaptive difficulty; spaced quizzing; shareable quizzes; question bank reuse.

## E12.F3 Mastery Model `[SHOULD]`
**Dependencies:** E6.F3, E12.F1/F2, E10.
**Subfeatures:** per-concept mastery scoring; confidence; decay; feeds tutor/analytics/review targeting.
**Tasks:**
- Mastery scoring from reviews/quizzes/reading signals; decay over time.
- Expose mastery to tutor (targeting) and analytics (display).
**Acceptance Criteria:**
- Each concept has a mastery score that updates from reviews/quizzes and decays over time.
- The tutor and review queue can target low-mastery concepts.
**Future Enhancements:** mastery-based goals; predicted-recall display; knowledge-gap recommendations.

---

# E13 — Analytics & Dashboard `[SHOULD]`

*Honest, motivating insight; the calm home base.*
**Dependencies:** E6.F3 (events), E12.F3 (mastery), E11.F3 analytics (events).

## E13.F1 Dashboard (Home) `[SHOULD]`
**Dependencies:** E5, E6, E12.
**Subfeatures:** continue-reading hero; today (reviews/tutor); recent; surfaced connections (whispers); ask-anything entry.
**Tasks:**
- Resume-reading hero; today's reviews/tutor; recent items.
- Whisper surface (one at a time); global Ask bar.
**Acceptance Criteria:**
- A returning user can resume reading in one action from home.
- Due reviews and an unfinished session are shown without manufactured urgency.
- Each dashboard widget fails independently (one error doesn't break the page).
**Future Enhancements:** customizable widgets; goals on dashboard; daily-briefing AI summary.

## E13.F2 Reading & Learning Analytics `[SHOULD]`
**Dependencies:** E6.F3, E12.F3; E1.F3 (events) → ClickHouse (later).
**Subfeatures:** trends (time/pages/completion/retention/streak); drill-down (doc/concept/range); charts + **text/table equivalents**; non-punitive framing; export.
**Tasks:**
- Aggregation pipeline + analytics views/charts.
- Mandatory accessible chart equivalents; export.
**Acceptance Criteria:**
- Trends render with skeletons → data, and every chart has a text/table equivalent.
- Insufficient-data and partial states are shown instead of empty/zeroed charts.
- Framing is neutral (missed days are not shamed).
**Future Enhancements:** period comparison; cohort/benchmark (privacy-safe); predictive insights; weekly recap email.

---

# E14 — Notifications & Proactive Intelligence `[COULD]`

*Calm, user-controlled, one whisper at a time.*
**Dependencies:** E1.F3 (events), E10 (connections), E12 (reviews).

## E14.F1 Notification Center & Cadence `[COULD]`
**Dependencies:** E2, E5.
**Subfeatures:** topbar bell + panel (grouped, unread); types (ingestion done/reviews due/connections/system); per-type cadence (instant/digest/off); quiet hours; mark-read/dismiss.
**Tasks:**
- Notification model + panel UI; per-type cadence settings; quiet hours.
- Digest batching (calm defaults).
**Acceptance Criteria:**
- Notifications are grouped and reviewable; cadence is user-controlled per type.
- Default behavior is calm digests with no badge-screaming.
- Quiet hours suppress non-critical notifications.
**Future Enhancements:** push notifications (mobile/desktop); smart timing; channel routing (email/push).

## E14.F2 Proactive Whispers `[COULD]`
**Dependencies:** E10, E12, E13.
**Subfeatures:** cross-source connection suggestions; "review now" nudges; surfaced relevant prior reading; one-at-a-time, dismissible/pinnable.
**Tasks:**
- Whisper generation (connections/recall) + ranking + frequency cap.
- Pin/dismiss; opt-in controls.
**Acceptance Criteria:**
- At most one whisper appears at a time and is dismissible in one gesture.
- Whispers are opt-in and respect frequency limits.
**Future Enhancements:** learned timing per user; whisper feedback loop; surfacing in reader margins.

---

# E15 — Plugins & Integrations `[COULD]`

*Extensibility via MCP; import/export; connectors.*
**Dependencies:** E2 (grants), E3 (tool surface), E4 (connectors), E9/E11 (tools).

## E15.F1 Plugin System (MCP) `[COULD]`
**Dependencies:** E2.F2, E11.F1.
**Subfeatures:** plugin registry + signed manifests; capability (tool) plugins via MCP; scoped grants + user approval; sandboxing/egress limits; audit.
**Tasks:**
- Plugin registry + manifest schema + signing.
- MCP tool integration into the tutor/orchestrator with capability scoping.
- Grant approval UI + revoke; sandbox + audit.
**Acceptance Criteria:**
- A plugin can expose typed tools the tutor calls, limited to user-approved scopes.
- A plugin cannot access data or network beyond its declared, granted scope.
- Tool calls are audited and grants are user-revocable.
**Future Enhancements:** plugin marketplace; revenue share; plugin reviews/ratings; BookHelper-as-MCP-server (consumed externally).

## E15.F2 Source Connectors `[COULD]`
**Dependencies:** E4.F1.
**Subfeatures:** connectors (Notion/Drive/Readwise/Zotero/RSS/Kindle); auth + sync; map to ingestion.
**Tasks:**
- Connector framework (discover/fetch/normalize); per-connector auth.
- Scheduled/triggered sync.
**Acceptance Criteria:**
- A connected source imports content into the library and ingests like native sources.
- Re-sync imports only new/changed items.
**Future Enhancements:** bidirectional sync; webhook-driven ingest; more connectors.

## E15.F3 Import / Export `[COULD]`
**Dependencies:** E7, E12.
**Subfeatures:** export highlights/notes (Markdown/CSV); Anki export; Obsidian/Markdown; BibTeX; full data export.
**Tasks:**
- Export pipelines per format; full-data export job (also serves E2.F3).
**Acceptance Criteria:**
- Highlights/notes/flashcards export to the listed formats and re-import cleanly where applicable.
**Future Enhancements:** scheduled exports; cloud-destination export; round-trip sync with Obsidian.

---

# E16 — Multi-Platform Apps `[SHOULD/COULD]`

*Desktop offline-first; mobile capture & review.*
**Dependencies:** E6, E7, E12, E22 (offline/sync — see E16.F3).

## E16.F1 Desktop App (Tauri) `[SHOULD]`
**Dependencies:** E6, E16.F3.
**Subfeatures:** Tauri shell wrapping the reader; local file access; offline reading + local SQLite/vector cache; on-device semantic search (offline).
**Tasks:**
- Tauri shell + local storage; offline reading/annotation.
- Local vector cache + offline semantic search over ingested docs.
**Acceptance Criteria:**
- The desktop app reads and annotates fully offline and syncs on reconnect.
- Offline semantic search returns results over already-ingested documents without network.
**Future Enhancements:** local-only privacy mode; system-wide capture; menu-bar quick-ask.

## E16.F2 Mobile App (Expo) `[COULD]`
**Dependencies:** E6, E7, E12, E16.F3.
**Subfeatures:** native reader; mobile highlight/note; flashcard review loop (gestures); voice Q&A/tutor; share-sheet capture.
**Tasks:**
- RN reader + annotation; gesture-based flashcard review.
- Voice input; share-sheet intake.
**Acceptance Criteria:**
- A user can read, highlight, and clear their review queue on mobile, online or offline.
- Share-sheet adds a source to the library.
**Future Enhancements:** widgets; offline downloads manager; Apple Pencil parity on iPad.

## E16.F3 Offline & Sync Engine `[SHOULD]`
**Dependencies:** E6, E7.
**Subfeatures:** local-first stores (IndexedDB/SQLite); mutation queue + idempotent replay; CRDT (Yjs) for annotations; delta sync; conflict resolution; offline indicators.
**Tasks:**
- Local-first store + operation log + background sync.
- CRDT merge for annotations; LWW for progress; offline status UI.
**Acceptance Criteria:**
- Mutations made offline replay on reconnect with no duplication or loss.
- Concurrent multi-device annotations merge without conflict.
- A clear, non-alarming offline indicator is shown when disconnected.
**Future Enhancements:** selective offline (pin docs for offline); sync conflict UI; P2P sync.

---

# E17 — Trust, Security & Compliance `[MUST]`

*Cross-cutting; partly enforced inside other epics, owned here.*
**Dependencies:** E1, E2, E3.

## E17.F1 Data Isolation & Encryption `[MUST]`
**Dependencies:** E2.F2, E11.
**Subfeatures:** RLS + app tenancy guard; encryption at rest (SSE-KMS); TLS 1.3; secrets management; tenant-namespaced storage.
**Tasks:**
- RLS policies + app guard; KMS encryption; secrets manager + rotation.
**Acceptance Criteria:**
- Cross-tenant data access is impossible (automated test proves it).
- All data is encrypted at rest and in transit; no secret appears in logs/prompts/bundles.
**Future Enhancements:** per-tenant encryption keys; field-level encryption for sensitive notes; HSM-backed keys.

## E17.F2 AI Safety & Prompt-Injection Defense `[MUST]`
**Dependencies:** E9, E11, E3.
**Subfeatures:** untrusted-content wrapping (retrieved/web content never instructions); grounding guarantee; refusal handling; tool gating + confirmation for destructive/external actions; eval gates in CI.
**Tasks:**
- Treat document/web content as data, not instructions; operator instructions on system channel.
- Grounding threshold + refusal UX; gated/audited tool actions.
- CI eval suite (citation accuracy, faithfulness, regression gates).
**Acceptance Criteria:**
- A prompt-injection attempt embedded in a document cannot alter system behavior (red-team tested).
- AI never returns an ungrounded answer without a clear "not from your sources" label.
- A prompt/model change that regresses citation accuracy fails CI.
**Future Enhancements:** continuous red-team harness; per-tenant model egress policy; output safety classifiers.

## E17.F3 Privacy & Compliance `[MUST]`
**Dependencies:** E2.F3.
**Subfeatures:** GDPR/CCPA (export/delete, consent); audit log; data-processing controls; PII handling in notes/memory.
**Tasks:**
- Export/delete flows (with E2.F3); immutable audit log; consent management.
**Acceptance Criteria:**
- A user can export and hard-delete all their data, verifiably.
- Security-relevant actions are recorded in an immutable audit trail.
**Future Enhancements:** SOC 2 program; configurable data residency; DPA tooling for orgs.

## E17.F4 Abuse, Rate Limiting & Resilience `[MUST]`
**Dependencies:** E1.F3, E3.F3.
**Subfeatures:** per-user/IP rate limits; abuse/anomaly detection (token spend); graceful degradation tiers; DR/backup.
**Tasks:**
- Rate limiting (Redis token buckets); spend-anomaly detection.
- Degradation tiers (reading always up); PITR backups + restore runbook.
**Acceptance Criteria:**
- Excess requests are throttled with `429`/`Retry-After`, not failures.
- If AI/retrieval degrade, reading and annotation remain fully functional.
- A documented restore returns the system to a recent point-in-time.
**Future Enhancements:** WAF/bot mitigation; multi-AZ/region failover; chaos testing.

---

# E18 — VYANA OS Integration `[WON'T-NOW]`

*Strategic endgame; explicitly deferred to keep focus, tracked so it isn't "discovered" late.*
**Dependencies:** E2 (SSO), E3, E9, E10, E15 (MCP), mature platform.

## E18.F1 Knowledge API & MCP Server `[WON'T-NOW]`
**Dependencies:** E10, E15.F1.
**Subfeatures:** external Knowledge API; hardened MCP server; consent-scoped access.
**Acceptance Criteria (when picked up):** an external VYANA OS app can query a user's graph/corpus (with consent) via REST + MCP, returning cited results.
**Future Enhancements:** cross-app knowledge graph spanning VYANA artifacts.

## E18.F2 Shared Identity & Event Bus `[WON'T-NOW]`
**Dependencies:** E2.F1 (SSO/SCIM), E1.F3.
**Subfeatures:** federated SSO/SCIM; shared event bus to VYANA modules.
**Future Enhancements:** unified billing; cross-module automation.

## E18.F3 Embeddable Surfaces `[WON'T-NOW]`
**Dependencies:** E1.F4, E6, E11.
**Subfeatures:** embeddable reader/tutor components themed by VYANA tokens.
**Future Enhancements:** white-label theming; component SDK.

---

# Cross-Epic Dependency Summary

```
E1 Foundation ──┬──────────────────────────────────────────────┐
                ▼                                                ▼
E2 Identity   E3 AI Gateway ───────────────┐              E17 Security
   │             │                          │                (wraps all)
   ▼             ▼                          ▼
E4 Ingestion ─▶ E5 Library ─▶ E6 Reader ─▶ E7 Annotations
   │             │              │             │
   ▼             ▼              ▼             ▼
E8 Search ◀────┘   E9 AI Chat/RAG ◀─────────┘
                       │
                       ▼
            E10 Knowledge Engine ─▶ E11 Tutor ─▶ E12 Learning
                       │                │            │
                       └────────────────┴────────────┴─▶ E13 Analytics/Dashboard
                                                          │
                       E14 Notifications ◀────────────────┘
                       E15 Plugins/Integrations (extends E4/E9/E11)
                       E16 Multi-Platform (extends E6/E7/E12 + offline)
                       E18 VYANA OS [deferred] (consumes E10/E15)
```

## Release-slice priority view

| Release | Goal | Epics/Features (Must-have slice) |
|---|---|---|
| **R0 Foundations** | Dev can build/deploy/auth | E1, E2.F1–F2, E3.F1, E17.F1 |
| **R1 First lovable product** | Read + cited Q&A | E4.F1–F4 (text), E5.F1–F2, E6.F1–F3, E7.F1–F2, E8.F1–F2, E9.F1–F3, E3.F2–F3, E17.F2 |
| **R2 Knowledge Engine** | Not-a-reader | E4.F2 (media), E10.F1–F2, E8 (concepts), E13.F1–F2 |
| **R3 Tutor + Learning** | Personalized teaching + retention | E11.F1–F2, E12.F1–F3, E6.F4, E16.F1/F3 (offline desktop) |
| **R4 Scale + ecosystem** | Extensible & scalable | E15, E16.F2, E11.F3, E14, scale-outs in E4.F4/E10.F2/E13.F2 |
| **R5 VYANA OS** | Knowledge substrate | E18 (deferred) |

## Won't-Have (for now) — explicit deferrals (so they aren't rediscovered as gaps)

- Real-time multiplayer / collaborative reading & annotation (CRDT groundwork exists in E16.F3; live presence deferred).
- Social layer (sharing, public profiles, following, community decks).
- Content marketplace / bookstore (we process the user's content, not sell it).
- Plugin marketplace & revenue share (framework in E15.F1; storefront deferred).
- VYANA OS integration (E18) — entire epic deferred.
- Org/team features beyond data-model readiness (shared libraries, admin consoles).
- General-purpose (ungrounded) chatbot mode — intentionally never; the assistant stays corpus-grounded.

---

*End of Feature Breakdown v1. This backlog governs scope and sequencing. Priorities are revisited per release; moving a feature across MoSCoW tiers, or changing an epic dependency, is a planning decision recorded here and in the tracker.*
