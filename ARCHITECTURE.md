# BookHelper — AI Knowledge Platform

## Complete Product & Technical Architecture

> **Status:** Architecture v1 (foundational). Audience: senior engineers.
> **Codename:** internal `bookhelper`; product surface TBD.
> **North star:** Transform any source of knowledge — books, PDFs, papers, articles, podcasts, videos, personal notes — into a personalized learning experience powered by a Personal AI Tutor and a living Knowledge Graph. Eventually a first-class module inside **VYANA OS**.

This document is the single source of truth for *how* we build. It is opinionated on purpose — a team of senior engineers needs decisions, not a survey of options. Where a choice is reversible, it is flagged as such. Where it is load-bearing, the rationale is given so we can revisit it deliberately rather than by accident.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Design Principles](#2-design-principles)
3. [Engineering Principles](#3-engineering-principles)
4. [Technical Architecture](#4-technical-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [AI Architecture](#7-ai-architecture)
8. [Knowledge Engine Architecture](#8-knowledge-engine-architecture)
9. [RAG Pipeline](#9-rag-pipeline)
10. [Authentication](#10-authentication)
11. [Storage](#11-storage)
12. [Database Schema](#12-database-schema)
13. [Folder Structure](#13-folder-structure)
14. [API Structure](#14-api-structure)
15. [State Management](#15-state-management)
16. [Caching Strategy](#16-caching-strategy)
17. [Security](#17-security)
18. [Scalability](#18-scalability)
19. [AI Provider Abstraction](#19-ai-provider-abstraction)
20. [Plugin System](#20-plugin-system)
21. [Future Integrations](#21-future-integrations)
22. [Offline Support](#22-offline-support)
23. [Deployment Strategy](#23-deployment-strategy)
24. [Monorepo Structure](#24-monorepo-structure)
25. [Development Roadmap](#25-development-roadmap)

---

## 1. Product Vision

### 1.1 The thesis

Reading is the lowest-bandwidth, highest-value activity humans do, and it has barely changed in 500 years. The bottleneck is not *access* to text — it is *conversion of text into durable understanding*. Most knowledge consumed is forgotten within weeks. PDF readers digitized the page; AI chatbots answer one-off questions. Neither builds knowledge.

**BookHelper is a Knowledge Engine, not a reader and not a chatbot.** The product converts any source into structured knowledge, threads it into a personal Knowledge Graph that grows across everything the user has ever read, and drives an AI Tutor that teaches *from the user's own corpus* with full source attribution and spaced reinforcement.

### 1.2 The value chain

```
  Sources                Engine                 Experience              Outcome
┌──────────┐         ┌────────────┐         ┌──────────────┐       ┌──────────────┐
│ Books     │        │ Ingestion  │         │ Reader       │       │              │
│ PDFs      │        │ Parsing    │         │ AI Tutor     │       │  Durable     │
│ Papers    │───────▶│ Knowledge  │────────▶│ Q&A + Cited  │──────▶│  personal    │
│ Articles  │        │ Extraction │         │ Flashcards   │       │  knowledge   │
│ Podcasts  │        │ Embedding  │         │ Quizzes      │       │  + recall    │
│ Videos    │        │ Graphing   │         │ Knowledge    │       │              │
│ Notes     │        │ Retrieval  │         │ Graph view   │       │              │
└──────────┘         └────────────┘         └──────────────┘       └──────────────┘
```

### 1.3 What we are building (layered)

| Layer | Capability | Differentiator |
|---|---|---|
| **L0 Reader** | Beautiful, fast, multi-format reading surface | Format-agnostic internal document model; reading is *instrumented* (what you read, dwell, highlight) |
| **L1 Q&A** | Ask anything about the current document | Grounded, **cited** answers (page + exact quote), not hallucinated summaries |
| **L2 Knowledge Engine** | Every source decomposed into concepts, entities, claims, summaries | Cross-source: "where else have I read about *X*?" |
| **L3 AI Tutor** | Personalized teaching, Socratic dialogue, study plans | Teaches from *your* corpus, adapts to *your* gaps, schedules *your* reviews |
| **L4 Knowledge Graph** | Concepts/entities/claims linked across the entire library | The compounding moat — the more you read, the smarter it gets |
| **L5 Learning System** | Spaced repetition, mastery tracking, recall analytics | Closes the loop: reading → understanding → retention |
| **L6 VYANA OS** | Knowledge as an OS-level primitive available to other apps | Knowledge Engine exposed via API + MCP |

### 1.4 Non-goals (v1)

- Not a social network. Sharing/collaboration is a later layer.
- Not a content store/marketplace. We process *the user's* content; we are not a bookseller.
- Not a general-purpose chatbot. The assistant is always grounded in the corpus.
- Not building our own foundation model. We orchestrate frontier models behind an abstraction.

### 1.5 The moat

Three compounding assets, in order of defensibility:
1. **The personal Knowledge Graph** — proprietary, per-user, grows monotonically, expensive to recreate elsewhere.
2. **The learning loop data** — what each user knows, forgets, and re-learns, enabling tutoring that competitors cannot replicate without the history.
3. **The ingestion quality** — the multi-format normalization + extraction pipeline is hard engineering that determines everything downstream.

---

## 2. Design Principles

1. **Reading is sacred.** The reading surface is calm, typographically excellent, and never cluttered by AI affordances. AI is *summoned*, not *imposed*. Default to a clean page.
2. **Every claim is cited.** No AI output is shown without traceable provenance (document → page/timestamp → exact span). Trust is the product.
3. **Progressive disclosure.** A first-time reader sees a reader. Power surfaces (graph, tutor, analytics) reveal themselves as the user goes deeper. Never overwhelm L0 users with L4 capability.
4. **The corpus is the context.** The assistant's knowledge boundary is the user's library. "I don't find this in your sources" is a first-class, respectable answer.
5. **Local-first feel.** Interactions feel instantaneous. Optimistic UI, offline reading, background sync. Network is an enhancement, not a prerequisite for reading and annotating.
6. **One mental model across formats.** A podcast, a PDF, and a note are all "documents" with "locatable spans." The user learns the interaction once.
7. **Calm intelligence.** The system is proactive but quiet — surfacing the right flashcard, the right connection, at the right moment, without nagging.
8. **Accessibility is not optional.** WCAG 2.2 AA minimum: keyboard-navigable reader, screen-reader support, dyslexia-friendly typography options, adjustable contrast.
9. **Design tokens, not pixels.** Everything renders from a shared token system so web/desktop/mobile and future VYANA OS surfaces stay coherent.

---

## 3. Engineering Principles

1. **Typed end-to-end.** TypeScript across web/BFF/edge; Python for ML services with Pydantic + typed contracts. Schemas (Zod / Pydantic / JSON Schema) are the contract boundary, generated into clients.
2. **Boring core, sharp edges.** PostgreSQL, Redis, S3-compatible storage, containers. Innovate where it differentiates (Knowledge Engine, RAG, tutor); use proven infrastructure everywhere else.
3. **Provider-agnostic AI.** No model SDK is imported outside the `ai-gateway` package. Swapping or adding a model is a config change, not a refactor. (See §19.)
4. **Event-driven ingestion, request-driven reading.** Heavy work (parse/embed/extract) is async, idempotent, resumable, observable. The read/chat path is low-latency and synchronous.
5. **Idempotency & determinism in pipelines.** Every ingestion step is keyed by `(content_hash, step_version)` so re-runs are safe and cache-friendly. Pipeline steps are versioned; bumping a version triggers targeted reprocessing only.
6. **Cost is a first-class metric.** Token spend, embedding spend, and storage are tracked per user/document/feature and visible on dashboards. Model routing optimizes cost/quality explicitly. (See §16, §19.)
7. **Observability before scale.** OpenTelemetry traces span the request → RAG → model call. LLM-specific observability (prompt, retrieval set, citations, cost, latency) is captured for every generation.
8. **Security by default.** Tenant isolation at the data layer, least privilege, secrets never in prompts or logs, encryption at rest and in transit. (See §17.)
9. **Reversible decisions get adapters; irreversible ones get review.** Vector DB, auth provider, and queue are behind interfaces so they can be swapped. Data model changes go through migration review.
10. **Test the contracts and the money paths.** Contract tests on every API/queue boundary; eval suites on RAG/tutor quality (golden questions, citation accuracy, regression gates). CI blocks on both.

---

## 4. Technical Architecture

### 4.1 System context (C4 Level 1)

```
        ┌────────────────────────────────────────────────────────────┐
        │                         Clients                            │
        │   Web (Next.js)   Desktop (Tauri)   Mobile (Expo)  CLI/MCP │
        └───────────────────────────┬────────────────────────────────┘
                                     │ HTTPS / WSS
                          ┌──────────▼───────────┐
                          │   Edge / API Gateway  │  auth, rate-limit, routing
                          │   (CDN + BFF)         │
                          └──────────┬───────────┘
             ┌───────────────────────┼────────────────────────────┐
             │                       │                            │
     ┌───────▼───────┐      ┌────────▼────────┐         ┌─────────▼─────────┐
     │  Core API      │      │  AI Orchestrator │        │ Ingestion Workers │
     │  (NestJS / TS) │      │  (Python/FastAPI)│        │  (Python)         │
     │  library, anno │      │  RAG, tutor,     │        │  parse/chunk/embed│
     │  users, chat   │      │  agents          │        │  extract/graph    │
     └───┬────────┬───┘      └───┬─────────┬────┘        └────┬─────────┬────┘
         │        │              │         │                  │         │
   ┌─────▼──┐ ┌───▼───┐    ┌─────▼───┐ ┌───▼────┐      ┌──────▼──┐ ┌────▼─────┐
   │Postgres│ │ Redis │    │ Vector  │ │  LLM    │      │ Object  │ │  Queue   │
   │ (OLTP) │ │cache/ │    │  DB     │ │ Gateway │      │ Storage │ │ (streams)│
   │+pgvector│ │queue │    │(Qdrant) │ │(Anthropic│     │  (S3/R2)│ │          │
   └────────┘ └───────┘    └─────────┘ │ +others)│      └─────────┘ └──────────┘
                                        └────┬────┘
                                   ┌──────────▼──────────┐
                                   │  Model providers     │
                                   │  Anthropic (default) │
                                   │  Voyage (embeddings) │
                                   │  OpenAI/Google/local │
                                   └──────────────────────┘
```

### 4.2 Service decomposition

A pragmatic **modular monolith → services** path. We do **not** start with microservices. We start with two deployables plus workers, with clear internal module boundaries, and extract services only when scaling or team boundaries demand it.

| Service | Runtime | Responsibility |
|---|---|---|
| **`core-api`** | Node 22 / NestJS | Transactional domain: users, library, documents (metadata), annotations, collections, chat sessions/history, billing, plugin registry. Owns Postgres. |
| **`ai-orchestrator`** | Python 3.12 / FastAPI | RAG retrieval + generation, tutor agent loops, deep research, quiz/flashcard generation, structured extraction at query time. Stateless; reads vector DB + calls `ai-gateway`. |
| **`ingestion-workers`** | Python 3.12 | Async pipeline: fetch → parse → normalize → chunk → embed → extract → graph-link → index. Consumes the queue, writes object storage + Postgres + vector DB. |
| **`ai-gateway`** | Node or Python lib + optional sidecar | Provider abstraction: model routing, fallback, prompt caching, batching, cost accounting, rate limiting per provider. (See §19.) |
| **`edge/bff`** | Next.js Route Handlers / edge functions | Auth verification, request shaping, SSE/WebSocket fan-out, response caching, light aggregation for the web client. |
| **`realtime`** | Node (WS) | Streaming tokens, sync events, presence (future collaboration). |

**Why polyglot (TS + Python):** The reading/transactional path benefits from one language across client and server (shared types, fast iteration). The ML/ingestion path lives in Python because that is where document parsing (PyMuPDF, `unstructured`, `pdfplumber`), media transcription, and ML tooling are strongest. The boundary between them is the **queue** and the **typed HTTP contract** — never a shared database write path.

### 4.3 Communication patterns

- **Sync, low-latency (read/chat):** HTTP/JSON (REST) + SSE for token streaming. tRPC for the internal web↔BFF typed boundary.
- **Async, durable (ingestion):** message queue (Redis Streams at start; NATS JetStream or Kafka at scale) with consumer groups, retries, DLQ.
- **Internal service-to-service:** typed HTTP with OpenAPI contracts + generated clients. Promote to gRPC only if a hot path demands it.
- **Events (analytics/learning loop):** an append-only event stream (`reading.*`, `tutor.*`, `recall.*`) feeding both the learning system and analytics (ClickHouse later).

---

## 5. Frontend Architecture

### 5.1 Platforms & stack

| Surface | Stack | Notes |
|---|---|---|
| **Web** | Next.js 15 (App Router, React 19, RSC) + TypeScript | Primary surface. Server Components for shell/library; client components for reader/tutor. |
| **Desktop** | Tauri 2 (Rust shell + web UI) | Offline-first reading, local file system access, local SQLite + vector cache. Reuses the web reader. |
| **Mobile** | Expo / React Native (Phase 3) | Shares design tokens, domain types, and API client; native reader rendering. |
| **CLI / Headless** | Node CLI + MCP server | Power users, scripting, and the VYANA OS bridge. |

### 5.2 The Reader: the heart of the product

The reader is **format-agnostic** by design. Every source is normalized into an internal **Document Model** so the rendering and interaction layer is written once.

```
Raw source ──▶ Ingestion ──▶ Document Model (canonical) ──▶ Renderer
 (PDF/EPUB/                    blocks: heading, paragraph,    (web/native)
  HTML/audio/                  figure, table, code, quote,
  video/note)                  list, footnote; each block
                               carries a stable `locator`
                               (page/CFI/char-range/timestamp)
```

- **Locator model:** every span is addressable by a universal locator: `{docId, blockId, charStart, charEnd}` plus a format-native anchor (PDF page+rect, EPUB CFI, media timestamp). This makes highlights, citations, and "jump to source" work identically across formats.
- **Rendering layers (stacked, independent):**
  1. Content layer (the normalized blocks; PDF.js/pdfium-wasm for faithful PDF page rendering when needed).
  2. Annotation layer (highlights, notes — absolutely positioned over content via locators).
  3. AI overlay layer (inline explanations, citation popovers, tutor prompts) — summoned, dismissible.
  4. Reading-instrumentation layer (invisible; captures dwell, scroll velocity, re-reads → feeds learning system).
- **Virtualization:** windowed rendering for large documents (TanStack Virtual). Never render a 900-page PDF's DOM at once.

### 5.3 Component & module structure (web)

```
apps/web/
  app/                      # App Router routes
    (marketing)/
    (app)/
      library/              # collections, recent, search
      read/[docId]/         # the reader (the core experience)
      tutor/                # study sessions, plans
      graph/                # knowledge graph explorer
      review/               # spaced-repetition queue
      settings/
  components/
    reader/                 # renderer, annotation layer, locator utils
    tutor/                  # chat, socratic, citations panel
    graph/                  # graph canvas (WebGL via sigma.js/cosmograph)
    library/
    ui/                     # design-system primitives (re-exported from packages/ui)
  lib/
    api/                    # typed client (generated)
    state/                  # zustand stores, query hooks
    offline/                # service worker, sync engine
```

### 5.4 Rendering strategy

- **RSC for shell, library, settings** (data-heavy, SEO-relevant, cacheable).
- **Client components for reader, tutor, graph** (high interactivity, local state, streaming).
- **Streaming SSR + Suspense** for perceived performance; skeletons for library/reader chrome.
- **Edge-rendered** auth gates and personalization headers; origin for heavy data.

### 5.5 Design system

- **Tokens** (`packages/design-tokens`): color, type scale, spacing, radii, motion — emitted to CSS variables + a JS object, shared by web/desktop/mobile and future VYANA OS.
- **Primitives:** Radix UI (accessible, unstyled) + Tailwind, wrapped into `packages/ui`. Headless logic, themeable skins.
- **Reading-specific:** typographic presets (serif/sans/dyslexic), line-length and measure controls, light/sepia/dark/night themes, font-size + line-height + letter-spacing controls.
- **Motion:** restrained, purposeful (Framer Motion); respects `prefers-reduced-motion`.

---

## 6. Backend Architecture

### 6.1 `core-api` (NestJS) — domain modules

Modular monolith with strict module boundaries (each module owns its tables; cross-module access via service interfaces, never direct table reads).

```
core-api/src/
  modules/
    identity/        # users, orgs, sessions, RBAC
    library/         # documents (metadata), collections, tags, ingestion status
    annotations/     # highlights, notes, bookmarks (CRDT-aware)
    reading/         # progress, reading sessions, instrumentation ingest
    chat/            # conversations, messages, citations (history of tutor/Q&A)
    learning/        # flashcards, reviews, mastery, schedules (SR engine)
    knowledge/       # concept/entity/claim read-models, graph queries
    plugins/         # plugin registry, manifests, capability grants
    billing/         # plans, usage metering, quotas
  shared/
    db/ (prisma or drizzle), events/, auth/, telemetry/, errors/
```

- **ORM:** Drizzle (TS-first, SQL-transparent, great migrations) or Prisma. **Recommendation: Drizzle** for explicit SQL and pgvector friendliness.
- **Validation:** Zod schemas at every boundary; DTOs generated from them.
- **Transactions:** domain operations are transactional; ingestion side effects are emitted as events post-commit (transactional outbox pattern).

### 6.2 `ai-orchestrator` (FastAPI) — query-time intelligence

Stateless. Owns no source-of-truth data; reads from vector DB + Postgres read-models + object storage; all model calls go through `ai-gateway`.

```
ai-orchestrator/app/
  retrieval/        # hybrid search, reranking, context assembly
  generation/       # answer synthesis, citation binding, streaming
  tutor/            # agent loops, socratic strategy, study-plan generation
  research/         # multi-doc deep research (long-horizon)
  extraction/       # query-time structured extraction
  prompts/          # versioned prompt templates + caching breakpoints
  evals/            # golden sets, citation-accuracy harness
```

### 6.3 `ingestion-workers` — the pipeline (see §9 for detail)

- Consumes queue jobs; each job is one pipeline step for one document.
- Steps are **independent, versioned, idempotent**, resumable from any step.
- Backpressure via consumer-group lag; autoscale on queue depth.
- Bulk enrichment (summaries, entity extraction across many chunks) routed through the **Batch API at 50% cost** when not latency-sensitive.

### 6.4 Cross-cutting

- **Outbox + event bus:** every state change that downstream cares about (document ingested, annotation created, review completed) is published as a domain event.
- **Idempotency keys** on all mutating endpoints and all queue consumers.
- **Feature flags** (Unleash/OpenFeature) gate risky model/pipeline changes for staged rollout + A/B of prompt versions.

---

## 7. AI Architecture

### 7.1 Model strategy & routing

We default to **Claude** models behind the `ai-gateway`, with a routing policy by task class. (Exact IDs/prices below are current as of this writing; the gateway resolves them from config and the Models API, never hardcoded in feature code.)

| Task class | Default model | Why | Cost (in/out per MTok) |
|---|---|---|---|
| **AI Tutor / reasoning / Socratic dialogue** | `claude-opus-4-8` | Most capable Opus-tier; long-horizon, strong pedagogy | $5 / $25 |
| **RAG answers (high volume)** | `claude-sonnet-4-6` | Best speed/intelligence balance for grounded Q&A | $3 / $15 |
| **Classification, routing, metadata, light extraction** | `claude-haiku-4-5` | Fast and cheap for high-frequency small tasks | $1 / $5 |
| **Deep research / multi-doc synthesis (hardest)** | `claude-fable-5` | Most capable widely-released model; long autonomous runs | $10 / $50 |
| **Embeddings** | Voyage (`voyage-3`-class) | Anthropic-recommended embeddings; provider-abstracted | — |

Routing is **policy-driven** (per task + per user tier + per cost budget), with automatic **fallback** chains (e.g., Opus → Sonnet on overload). Quality-sensitive tasks can be escalated; cost-sensitive tasks down-routed. All models in the Claude 4.6+ family share a 1M-token context window (Haiku: 200K), which underwrites large grounded contexts.

### 7.2 Inference techniques we standardize on

- **Adaptive thinking** (`thinking: {type: "adaptive"}`) for tutor and research — the model decides how much to reason. We do **not** use fixed thinking budgets (deprecated/removed on current models).
- **Effort parameter** (`output_config.effort`): `low`/`medium` for routine RAG, `high`/`xhigh` for tutoring and research, tuned per route. Effort is the primary intelligence↔cost↔latency lever.
- **Prompt caching** as a core cost strategy: the system prompt, the per-document context, and the tutor persona are cached prefixes. Reads cost ~0.1× and writes ~1.25× (5-min) — see §16.
- **Structured outputs** (`output_config.format` with JSON Schema) for everything machine-consumed: entity/concept extraction, flashcards, quiz items, study plans. No regex parsing of free text.
- **Citations** (native citation support): grounded answers carry source spans we bind back to locators.
- **Batch API** (50% discount) for non-interactive bulk enrichment during ingestion.
- **Server-side tools** where useful: `web_search`/`web_fetch` for "augment my reading with current sources" (gated, opt-in), `code_execution` for data/figure analysis on documents with datasets.
- **Streaming** everywhere user-facing (SSE), with `.get_final_message()` style accumulation server-side.

### 7.3 The AI Tutor (agentic)

The tutor is an **agent loop** with a constrained, auditable tool surface — it is the highest-value, highest-risk surface, so it gets dedicated treatment.

**Tool surface (typed, gated):**
- `retrieve(query, scope)` — hybrid retrieval over the user's corpus (scoped to a doc, collection, or whole library).
- `get_span(locator)` — fetch exact source text for citation.
- `knowledge_graph_query(...)` — traverse the user's graph ("what connects to X?").
- `assess_mastery(concept)` — read the learning model for the user's current grasp.
- `create_flashcards(...)` / `create_quiz(...)` — structured-output generators.
- `schedule_review(...)` — write into the SR engine.
- `send_to_user(message)` — verbatim delivery for tutor messages the user must see exactly.

**Orchestration choice:** we implement the loop in `ai-orchestrator` using the **manual agentic loop** for full control (gating, logging, per-step eval, human-in-the-loop where needed). For server-managed, long-running study sessions with their own workspace, **Managed Agents** is the evaluated alternative (persisted agent config, session streaming, outcome rubrics) — kept behind the same internal interface so we can move workloads there without changing callers.

**Pedagogical strategies** (selectable per session): Socratic questioning, explain-then-check, worked-example→faded-example, retrieval practice, elaborative interrogation. The strategy selector reads the user's mastery model and recent errors.

### 7.4 AI safety & quality gates

- **Grounding guarantee:** RAG answers must cite. If retrieval confidence is below threshold, the system says so rather than answering ungrounded.
- **Refusal handling:** handle `stop_reason: "refusal"` explicitly; for the hardest model (`fable-5`) enable server-side **fallbacks** to `opus-4-8` by default so a benign-but-flagged request still completes.
- **Eval harness in CI:** golden Q&A sets with expected citations; citation-accuracy, faithfulness, and answer-quality metrics gate prompt/model changes. Regressions block deploy.
- **Prompt-injection defense:** retrieved document content is untrusted input — wrapped, never interpreted as instructions; operator instructions ride the system channel, not user/document content.

---

## 8. Knowledge Engine Architecture

The Knowledge Engine is what makes this *not a reader*. It decomposes every source into a structured, queryable, cross-linked knowledge representation.

### 8.1 Knowledge primitives

| Primitive | Definition | Example |
|---|---|---|
| **Chunk** | A retrievable, embedded span of source content | A 400-token passage with its locator |
| **Concept** | A normalized idea/topic, deduplicated across the corpus | "Spaced repetition" |
| **Entity** | A named thing (person, org, place, work, term) | "Hermann Ebbinghaus" |
| **Claim** | An assertion the source makes, with stance + evidence span | "Forgetting is exponential over time" |
| **Summary** | Multi-resolution summaries (doc, chapter, section) | Chapter abstract |
| **Relation** | A typed edge between primitives | `Concept —discussed_in→ Document`, `Claim —supports→ Claim`, `Concept —prerequisite_of→ Concept` |

### 8.2 Extraction pipeline (during ingestion)

1. **Summarize hierarchically** (section → chapter → document) — multi-resolution, used for context assembly and graph nodes.
2. **Extract entities & concepts** with structured outputs; **normalize/dedupe** against the user's existing graph via embedding similarity + canonical-name resolution (entity linking).
3. **Extract claims** with stance and supporting span; link claims to the concepts/entities they involve.
4. **Infer relations** — prerequisite ordering, contradiction/support between claims across sources, concept co-occurrence.
5. **Link into the graph** — upsert nodes, create edges, attach provenance (every node/edge points back to source locators).

Bulk extraction across a document's chunks is dispatched via the **Batch API** to cut cost in half on this large, non-interactive workload.

### 8.3 The Knowledge Graph

- **Storage (start):** relational in Postgres — `kg_nodes`, `kg_edges` with `jsonb` properties, plus `pgvector` columns on nodes for semantic node search. Graph traversals via recursive CTEs for shallow depths.
- **Storage (scale):** dedicated graph store (Neo4j or Postgres + Apache AGE) when traversal depth/volume outgrows recursive CTEs. The graph repository interface hides this so the migration is contained.
- **Per-user by default, shared optionally:** each user's graph is private. A *global/canonical* concept ontology (shared backbone of well-known concepts) lets per-user nodes attach to canonical concepts for cross-user features later — without exposing any user's content.
- **Provenance everywhere:** no node/edge exists without a source. "Where did I read this?" is always answerable.

### 8.4 What the graph powers

- "Show everything I've read about *X*" (cross-source concept view).
- "What should I learn before *X*?" (prerequisite chains).
- "These two sources disagree about *Y*" (contradiction detection).
- "You read about *Z* three months ago — connect it to today's chapter" (proactive linking).
- Tutor context: the tutor traverses the graph to scope retrieval and sequence teaching.

---

## 9. RAG Pipeline

The RAG pipeline has two halves: **ingestion (write path, async)** and **retrieval+generation (read path, sync)**.

### 9.1 Ingestion (write path)

```
1. INGEST     Receive source (upload / URL / connector). Compute content_hash.
              Dedupe by hash. Store raw blob in object storage.
2. PARSE      Format-specific extraction →
                PDF: PyMuPDF/pdfplumber (text+layout); OCR (Tesseract/cloud) for scans
                EPUB/HTML: structural parse → blocks
                Audio/Video: transcription (Whisper-class) → timestamped segments
                Notes: markdown/rich-text → blocks
3. NORMALIZE  Map to the canonical Document Model (blocks + universal locators).
4. CHUNK      Structure-aware chunking: respect headings/paragraphs/sentences;
              hierarchical (parent section + child passages); ~256–512 tokens with
              overlap; late-chunking-aware so chunk embeddings keep doc context.
5. EMBED      Voyage embeddings (provider-abstracted), batched. Store vectors.
6. ENRICH     (Batch API, 50% off) hierarchical summaries, entities, concepts,
              claims → structured outputs.
7. INDEX      Write to vector DB (dense), Postgres FTS/OpenSearch (sparse/BM25),
              and the keyword/metadata index.
8. GRAPH      Link extracted primitives into the Knowledge Graph (§8).
9. FINALIZE   Mark document `ready`; emit `document.ingested`; warm caches.
```

Every step is keyed by `(content_hash, step, step_version)` → idempotent, resumable, and re-runs only the steps whose version changed.

### 9.2 Retrieval + generation (read path)

```
Query
  │
  ├─▶ 1. UNDERSTAND   Lightweight (Haiku) intent + scope detection;
  │                   query rewrite / decomposition for multi-hop questions.
  │
  ├─▶ 2. RETRIEVE     Hybrid search:
  │                     • dense (vector) over chunks
  │                     • sparse (BM25/FTS) for exact terms/names
  │                     • graph expansion (pull neighbors of matched concepts)
  │                   Fuse via Reciprocal Rank Fusion.
  │
  ├─▶ 3. RERANK       Cross-encoder / Voyage reranker on top-K → top-N.
  │
  ├─▶ 4. ASSEMBLE     Build context window:
  │                     • cached prefix: system prompt + persona + doc summary
  │                     • volatile suffix: reranked passages + question
  │                   (cache breakpoints placed per §16)
  │
  ├─▶ 5. GENERATE     Sonnet (default) / Opus (tutor) with adaptive thinking,
  │                   streaming, native citations.
  │
  ├─▶ 6. BIND         Map model citations → source locators → UI "jump to source".
  │
  └─▶ 7. PERSIST      Store turn + retrieval set + citations + cost; update
                      semantic cache; emit learning-loop events.
```

### 9.3 Retrieval quality measures

- **Hybrid by default** — dense alone misses exact names/quotes; sparse alone misses paraphrase. Always fuse.
- **Reranking** — the single biggest precision lever; always rerank before context assembly.
- **Scoping** — retrieval is scoped (current doc / collection / whole library) so the tutor doesn't drown signal in a large corpus.
- **Confidence gating** — below a retrieval-score threshold, prefer "not in your sources" over a low-grounding answer.
- **Multi-resolution** — when a question is broad, retrieve summaries; when specific, retrieve passages. The query understander chooses.

---

## 10. Authentication

### 10.1 Strategy

- **Phase 1 (speed):** managed auth provider — **WorkOS** (best for future B2B/SSO + VYANA OS) or **Clerk** (best DX for B2C). Recommendation: **WorkOS AuthKit** to keep enterprise SSO/SCIM on the table for VYANA OS without a rebuild.
- **Token model:** OIDC/OAuth2. Short-lived **JWT access tokens** (~10 min) + rotating **refresh tokens** (httpOnly, secure cookie on web; secure storage on desktop/mobile).
- **Methods:** email magic link, social (Google/Apple), **passkeys/WebAuthn** (primary push), enterprise SSO (SAML/OIDC) for VYANA OS tenants.
- **Session:** stateless verification at the edge (JWKS-cached public keys); server-side session list in Redis for revocation.

### 10.2 Authorization

- **RBAC** (roles: `user`, `admin`, `org_admin`) + **resource-level checks** (a user can only touch their own documents/annotations/graph).
- **Multi-tenant ready:** every row carries `owner_id` (and later `org_id`); a tenancy guard enforces isolation in the data layer (see §17). This is mandatory from day one even though orgs ship later — retrofitting tenancy is painful.
- **Service-to-service:** signed service tokens (mTLS or signed JWT) between `core-api`, `ai-orchestrator`, and workers. No service trusts a request without verification.
- **Plugin/MCP auth:** capability-scoped tokens; a plugin gets only the grants its manifest declares and the user approved (see §20).

---

## 11. Storage

| Data | Store | Rationale |
|---|---|---|
| **Raw sources** (PDF/EPUB/audio/video) | Object storage — **Cloudflare R2** (or S3) | Cheap, durable, no egress fees (R2); presigned uploads direct from client |
| **Derived artifacts** (normalized blocks, page images, transcripts, thumbnails) | Object storage | Regenerable; lifecycle-tiered |
| **Transactional data** (users, library, annotations, chat, learning) | **PostgreSQL** | ACID, relational integrity, the backbone |
| **Embeddings / vectors** | **pgvector** (start) → **Qdrant** (scale) | Start co-located for simplicity; extract to Qdrant when index size/QPS demands |
| **Keyword/full-text** | Postgres `tsvector` (start) → **OpenSearch/Typesense** (scale) | Hybrid retrieval sparse half |
| **Knowledge graph** | Postgres (`kg_nodes`/`kg_edges`) → Neo4j/AGE (scale) | Per §8.3 |
| **Cache / queue / rate-limit / sessions** | **Redis** | Hot path cache, Streams queue, token buckets, session revocation |
| **Analytics / events** | **ClickHouse** (Phase 2+) | Reading instrumentation, usage, learning-loop analytics at volume |
| **Secrets** | Cloud KMS + secrets manager (Doppler/Vault) | Never in env files committed; rotated |

**Upload flow:** client requests a presigned URL from `core-api` → uploads directly to object storage → posts completion → `core-api` emits `document.uploaded` → ingestion begins. Large files never transit our API servers.

**Data residency / lifecycle:** raw blobs encrypted at rest (SSE-KMS); derived artifacts lifecycle-tiered (hot → infrequent-access). User deletion cascades to blobs, vectors, graph nodes, and cache (see §17).

---

## 12. Database Schema

Postgres, illustrative (Drizzle-style). Every user-owned table carries `owner_id`; RLS or an application tenancy guard enforces isolation. Timestamps and soft-delete (`deleted_at`) omitted for brevity but present on all tables.

```sql
-- ── Identity ───────────────────────────────────────────────
users            (id, email, display_name, auth_provider_id, plan, created_at)
orgs             (id, name, plan)                      -- future B2B / VYANA OS
org_members      (org_id, user_id, role)

-- ── Library / Sources ──────────────────────────────────────
documents        (id, owner_id, org_id?, title, author, source_type,   -- pdf|epub|web|audio|video|note
                  content_hash, storage_key, lang, page_count|duration,
                  ingest_status, ingest_step_version, metadata jsonb)
collections      (id, owner_id, name, parent_id?)
collection_items (collection_id, document_id, position)
document_blocks  (id, document_id, ord, block_type,    -- canonical Document Model
                  text, locator jsonb)                 -- {page, cfi, char_range, ts}

-- ── Retrieval ──────────────────────────────────────────────
chunks           (id, document_id, owner_id, ord, text, token_count,
                  locator jsonb, parent_block_id,
                  embedding vector(1024),               -- pgvector
                  fts tsvector,                         -- sparse half
                  embed_model, embed_version)
-- index: ivfflat/hnsw on embedding; GIN on fts; btree on (document_id, ord)

-- ── Knowledge Engine ───────────────────────────────────────
summaries        (id, document_id, scope,              -- document|chapter|section
                  ref_block_id?, text, embedding vector(1024))
kg_nodes         (id, owner_id, node_type,             -- concept|entity|claim
                  canonical_id?, name, props jsonb,
                  embedding vector(1024))
kg_edges         (id, owner_id, src_node_id, dst_node_id, edge_type,  -- discusses|supports|contradicts|prerequisite_of|mentions
                  weight, props jsonb)
node_provenance  (node_id, document_id, locator jsonb, confidence)

-- ── Annotations / Reading ──────────────────────────────────
annotations      (id, owner_id, document_id, kind,     -- highlight|note|bookmark
                  locator jsonb, color, body, crdt_state bytea?)
reading_progress (owner_id, document_id, locator jsonb, percent, last_read_at)
reading_events   (id, owner_id, document_id, event_type, locator jsonb, ts, meta jsonb)

-- ── Conversations (Tutor / Q&A) ────────────────────────────
conversations    (id, owner_id, scope_type, scope_id, title, mode)  -- qa|tutor|research
messages         (id, conversation_id, role, content jsonb,
                  model, usage jsonb, created_at)
message_citations(id, message_id, document_id, locator jsonb, quote, score)

-- ── Learning System ────────────────────────────────────────
flashcards       (id, owner_id, concept_node_id?, front, back, source_locator jsonb,
                  ease, interval_days, due_at, reps, lapses)        -- FSRS/SM-2 fields
reviews          (id, owner_id, flashcard_id, grade, reviewed_at, latency_ms)
mastery          (owner_id, concept_node_id, score, confidence, last_assessed_at)
study_plans      (id, owner_id, goal, schedule jsonb, status)

-- ── Plugins / Billing ──────────────────────────────────────
plugins          (id, name, version, manifest jsonb, status)
plugin_grants    (owner_id, plugin_id, scopes jsonb, granted_at)
usage_meter      (owner_id, period, feature, tokens_in, tokens_out, cost_cents)
```

**Schema notes:**
- `chunks` holds **both** the dense vector and the `tsvector`, enabling hybrid retrieval from one table early on; the vector half migrates to Qdrant later with `chunk_id` as the join key.
- `locator jsonb` is the universal addressing scheme tying chunks/annotations/citations/blocks to exact source positions.
- `kg_nodes.canonical_id` links a per-user node to a shared canonical concept (enables cross-user features without sharing content).
- Learning tables carry **FSRS** scheduling fields (modern spaced-repetition algorithm; SM-2 as fallback).
- `ingest_step_version` enables targeted reprocessing when a pipeline step is bumped.

---

## 13. Folder Structure

Per-app internal structure (the monorepo layout is §24). Example for `core-api` and `ai-orchestrator`:

```
core-api/                         # NestJS modular monolith
  src/
    modules/<domain>/             # identity, library, annotations, reading,
      <domain>.controller.ts      #   chat, learning, knowledge, plugins, billing
      <domain>.service.ts
      <domain>.repository.ts      # owns its tables; no cross-module table reads
      <domain>.events.ts
      dto/  (zod schemas)
    shared/
      db/ (drizzle schema, migrations)
      events/ (outbox, bus)
      auth/  telemetry/  errors/  config/
    main.ts
  test/ (unit + contract)

ai-orchestrator/                  # FastAPI
  app/
    api/ (routers: qa, tutor, research, extract)
    retrieval/ (hybrid, rerank, assemble)
    generation/ (synthesize, cite, stream)
    tutor/ (agent loop, strategies, tools)
    knowledge/ (graph queries)
    prompts/ (versioned templates, cache config)
    gateway/ (ai-gateway client)
    evals/ (golden sets, harness)
  tests/

ingestion-workers/
  workers/ (parse, chunk, embed, enrich, index, graph)
  pipeline/ (step registry, idempotency, retry)
  parsers/ (pdf, epub, html, audio, video, note)
  tests/
```

---

## 14. API Structure

### 14.1 Surfaces

| Surface | Protocol | Consumer |
|---|---|---|
| **Public REST** | HTTP/JSON, versioned `/v1` | Mobile, third-party, VYANA OS |
| **Web BFF** | tRPC (typed) + SSE | Next.js web app |
| **Streaming** | SSE (tokens) / WebSocket (sync, presence) | All clients |
| **Internal** | HTTP + OpenAPI contracts | service-to-service |
| **MCP server** | Model Context Protocol | Claude, VYANA OS, agentic clients |

### 14.2 Representative REST endpoints (`/v1`)

```
# Library
POST   /documents                 # create (returns presigned upload URL)
POST   /documents/:id/complete     # finalize upload → trigger ingestion
GET    /documents                  # list (filter, search, pagination)
GET    /documents/:id              # metadata + ingest status
GET    /documents/:id/content      # normalized blocks (paged)
DELETE /documents/:id              # cascade delete (blobs/vectors/graph)
GET    /collections ; POST /collections ; ...

# Reading & annotations
GET/PUT /documents/:id/progress
POST   /documents/:id/annotations ; PATCH/DELETE /annotations/:id
POST   /documents/:id/events       # reading instrumentation (batched)

# Q&A / Tutor (streaming)
POST   /conversations              # {scope, mode: qa|tutor|research}
POST   /conversations/:id/messages # SSE stream of tokens + citations
GET    /conversations/:id/messages

# Knowledge graph
GET    /knowledge/concepts?docId|collectionId
GET    /knowledge/graph?focus=:nodeId&depth=2
GET    /knowledge/concepts/:id/sources   # "where have I read about X"

# Learning system
GET    /review/queue               # due flashcards (FSRS)
POST   /review/:cardId             # submit grade
GET    /mastery                    # mastery map
POST   /study-plans

# Plugins / MCP
GET    /plugins ; POST /plugins/:id/grant
```

### 14.3 Conventions

- **Versioning:** URL-prefixed (`/v1`); additive changes only within a version; deprecations announced + sunset windows.
- **Errors:** RFC 9457 Problem Details (`type`, `title`, `status`, `detail`, `instance`).
- **Pagination:** cursor-based (`?cursor=&limit=`), never offset for large sets.
- **Idempotency:** `Idempotency-Key` header on all POSTs.
- **Streaming contract:** SSE events typed (`token`, `citation`, `tool_use`, `done`, `error`); clients reconcile partials.
- **Rate limits:** per-user + per-IP token buckets in Redis; `429` with `Retry-After`.

---

## 15. State Management

### 15.1 Client (web)

| Concern | Tool | Why |
|---|---|---|
| **Server cache / async data** | **TanStack Query** | Caching, dedupe, background refetch, optimistic updates, offline persistence |
| **Typed RPC** | **tRPC** | End-to-end types web↔BFF; no client/contract drift |
| **Local UI state** | **Zustand** | Reader settings, panel open/closed, selection — lightweight, no boilerplate |
| **Reader/annotation state** | **Zustand + IndexedDB** | Local-first; persists offline, syncs in background |
| **Collaborative annotations (future)** | **Yjs (CRDT)** | Conflict-free merge for multi-device + future collaboration |
| **Streaming chat** | local reducer over SSE | Append tokens/citations; reconcile final message |
| **Forms** | React Hook Form + Zod | Validation parity with server |

**Principles:** server state lives in TanStack Query (never duplicated into Zustand); UI/ephemeral state in Zustand; document/annotation state is local-first (IndexedDB) with a sync engine reconciling to the server. Optimistic UI for annotations/progress; reconcile on ack.

### 15.2 Server

- `core-api` is the source of truth (Postgres). `ai-orchestrator` is **stateless** (state lives in vector DB + Postgres read-models + Redis).
- Conversation state is persisted per message; long tutor sessions use **server-side context compaction** (beta) to stay within context while preserving history — append the compaction block back each turn.

---

## 16. Caching Strategy

A layered cache, optimized for the two cost centers: **model tokens** and **retrieval**.

| Layer | What | TTL / policy |
|---|---|---|
| **CDN / edge** | Static assets, marketing, public doc shells | Long; immutable hashed assets |
| **HTTP / data** | Library lists, doc metadata, graph views | Short (30–120s) + SWR; invalidate on mutation |
| **Application (Redis)** | Hot read-models, mastery maps, due-card counts | Minutes; event-invalidated |
| **Prompt caching (model)** | **Primary LLM cost lever.** Cache the stable prefix: system prompt + tutor persona + per-document summary/context | 5-min ephemeral (1-hr for hot docs); reads ~0.1×, writes ~1.25× |
| **Semantic answer cache** | Embed incoming question; if cosine ≥ threshold to a prior answered question on the same scope, return cached answer | Per-scope; invalidated when the doc/graph changes |
| **Embedding cache** | `(content_hash, chunk, embed_version)` → vector | Permanent until version bump (idempotent ingestion) |
| **Retrieval cache** | `(query_hash, scope, index_version)` → reranked passage IDs | Minutes; invalidated on re-index |
| **Browser / offline** | IndexedDB (web), SQLite (desktop): documents, annotations, recent answers | Local-first; synced |

**Prompt-caching discipline** (this is where real money is saved):
- Render order is `tools → system → messages`. Stable content first (frozen system prompt, deterministic tool list, document summary), volatile content (the question, retrieved passages) after the last cache breakpoint.
- **No silent invalidators** in the prefix: no `now()`, no per-request UUIDs, no unsorted JSON, no per-request tool reshuffling. CI lints the prompt-builder for these.
- Verify hits via `usage.cache_read_input_tokens`; alert if hit-rate drops (a silent invalidator regression).
- **Pre-warm** the cache for a document when a user opens it (a `max_tokens: 0` prefill at reader-open), so the first question is fast.

**Batch + cost:** non-interactive ingestion enrichment uses the **Batch API (50% off)**; bulk per-document context is cached so re-asks across a reading session are near-free on the prefix.

---

## 17. Security

### 17.1 Tenancy & data isolation (most important)
- **Every user-owned row carries `owner_id`** (+ `org_id` for B2B). Enforced by **Postgres Row-Level Security** policies *and* an application tenancy guard (defense in depth). No query reaches user data without the tenant predicate.
- Vector DB queries are filtered by `owner_id` (Qdrant payload filter). Object storage keys are namespaced by tenant; access only via short-lived presigned URLs.

### 17.2 Application security
- **Transport:** TLS 1.3 everywhere; HSTS. Internal traffic mTLS or signed service JWTs.
- **AuthZ:** RBAC + resource ownership checks on every mutating/read path (§10).
- **Input:** all inputs validated (Zod/Pydantic); file uploads type/size-checked, AV-scanned, parsed in sandboxed workers.
- **Secrets:** KMS + secrets manager; rotated; **never** placed in prompts, logs, or client bundles.
- **Headers/CSP:** strict CSP, `X-Content-Type-Options`, frame-ancestors, etc.
- **Rate limiting & abuse:** per-user/IP buckets; anomaly detection on token spend.

### 17.3 AI-specific security
- **Prompt injection:** retrieved document content and web-fetched content are **untrusted data**, wrapped and never interpreted as instructions. Operator/system instructions ride the system channel (or mid-conversation system messages), never user/document content.
- **Tool gating:** the tutor's tools that mutate state (`schedule_review`, plugin actions) are gated and audited; destructive/external actions require confirmation.
- **PII in memory/notes:** the learning/memory layers never store secrets; PII handling follows GDPR/CCPA; per-user memory directories with access control.
- **Model egress:** by default, user content goes only to contracted model providers under data-processing agreements (Anthropic etc.); a per-tenant policy can restrict providers (e.g., self-hosted only) for sensitive orgs.

### 17.4 Privacy & compliance
- **Data ownership:** users own their content and graph; full export and hard-delete (cascading to blobs, vectors, graph, caches) on request.
- **Encryption at rest:** SSE-KMS on object storage; Postgres + backups encrypted.
- **Audit log:** security-relevant actions (auth, grants, deletions, plugin installs) appended to an immutable audit trail.
- **Compliance posture:** GDPR/CCPA from day one; SOC 2 path for VYANA OS/B2B.

---

## 18. Scalability

### 18.1 Scaling axes & tactics

| Axis | Bottleneck | Tactic |
|---|---|---|
| **Read/chat traffic** | API + model latency | Stateless `core-api`/`ai-orchestrator` behind autoscaling; prompt + semantic caching; SSE streaming for perceived speed |
| **Ingestion volume** | CPU/IO of parse/embed | Queue + autoscaling worker pool on queue depth; Batch API for enrichment; idempotent steps |
| **Vector search** | index size/QPS | pgvector → **Qdrant** (HNSW, payload-filtered, horizontally sharded by tenant); per-user namespaces |
| **Graph queries** | traversal depth/volume | recursive CTE → Neo4j/AGE; precompute hot neighborhoods |
| **Hot documents** | repeated context loads | 1-hr prompt cache + pre-warm; cached normalized blocks |
| **Database** | write/read volume | read replicas; partition large tables (`chunks`, `reading_events`) by `owner_id`/time; move analytics to ClickHouse |
| **Model rate limits** | provider TPM/RPM | gateway-level queueing, multi-provider fallback, per-tier budgets, Batch for bulk |

### 18.2 Principles
- **Stateless services, scale horizontally.** No sticky state in API/orchestrator.
- **Async by default for heavy work.** The read path never blocks on ingestion.
- **Backpressure, not collapse.** Queue depth drives autoscaling and, at the limit, graceful degradation (defer enrichment, keep core reading/Q&A up).
- **Tenant sharding from the start in the data model** (even if physically co-located early) so the vector DB and Postgres can shard later without a model change.
- **Graceful degradation tiers:** if a model provider is down → fallback chain; if retrieval is degraded → smaller/cached context with a visible "limited" notice; reading + annotation always work (local-first).

---

## 19. AI Provider Abstraction

The single most important architectural firewall: **no feature code imports a model SDK.** Everything goes through `packages/ai-gateway`.

### 19.1 Interface (conceptual)

```ts
interface LLMGateway {
  generate(req: GenerateRequest): Promise<GenerateResult>      // non-streaming
  stream(req: GenerateRequest): AsyncIterable<StreamEvent>     // SSE
  embed(req: EmbedRequest): Promise<EmbedResult>
  rerank(req: RerankRequest): Promise<RerankResult>
}

interface GenerateRequest {
  task: TaskClass            // 'tutor' | 'rag_answer' | 'classify' | 'research' | 'extract'
  messages: Message[]
  system?: CacheableBlock[]  // prefix, cache-controlled
  tools?: ToolDef[]
  schema?: JSONSchema        // → structured output
  thinking?: 'adaptive' | 'off'
  effort?: 'low'|'medium'|'high'|'xhigh'|'max'
  budget?: CostBudget
  policy?: RoutingOverride
}
```

### 19.2 What the gateway owns

- **Model resolution & routing:** maps `TaskClass` + user tier + budget → concrete model (resolved from config + the provider's Models API, never hardcoded in features). Default provider **Anthropic**; routing table per §7.1.
- **Fallback chains:** on overload/refusal/error → next model (e.g., Opus→Sonnet; Fable→Opus via server-side fallbacks). Refusal (`stop_reason: "refusal"`) handled centrally.
- **Capability normalization:** a uniform surface over provider quirks (thinking modes, effort, structured outputs, citations, caching) so features express *intent*, not provider syntax.
- **Prompt caching management:** applies cache breakpoints, guards against silent invalidators, reports hit-rates.
- **Batching:** routes non-interactive jobs to the Batch API (50% off) transparently.
- **Cost accounting & quotas:** every call tagged with `user/feature/task`; spend metered to `usage_meter`; per-tier budgets enforced.
- **Observability:** prompt, retrieval set, output, citations, tokens, latency, cost → LLM observability (Langfuse/Helicone) per call.
- **Provider adapters:** `anthropic` (default), `voyage` (embeddings/rerank), and `openai`/`google`/`local (Ollama/vLLM)` adapters behind the same interface. Self-hosted/open models become an option for cost or data-residency without touching features.

### 19.3 Why this matters
Models change monthly. New capabilities (effort tiers, thinking, caching, fallbacks, agents) arrive continuously. By concentrating all of it in one package with eval coverage, we adopt improvements as config changes and keep the product code stable. It is also the seam where **per-tenant model policy** (e.g., a privacy-sensitive org pinned to specific providers) is enforced.

---

## 20. Plugin System

Two plugin classes, one registry. Designed so the community (and VYANA OS) can extend BookHelper without touching core.

### 20.1 Source connectors (ingest plugins)
Bring content *in*. Each implements a typed contract: `discover()`, `fetch(ref)`, `toRawDocument()`. Output normalizes into the ingestion pipeline (§9) like any native source.
- v1 first-party: PDF, EPUB, web article (Readability), YouTube/podcast (transcript), plain notes/markdown.
- Later: Notion, Google Drive, Readwise, Zotero, RSS, Kindle highlights.

### 20.2 Capability plugins (tool plugins) — **MCP-native**
Extend what the AI Tutor can *do*. We adopt the **Model Context Protocol (MCP)** as the tool-plugin standard — this aligns with Claude, with VYANA OS, and with the agent loop.
- A plugin is an MCP server exposing typed tools (`input_schema`) the orchestrator can call.
- **Manifest** declares: identity, tools, required scopes, network egress, data access. Users grant scopes explicitly (`plugin_grants`).
- **Sandboxing:** plugin tools run isolated; capability-scoped tokens; egress allow-lists; no ambient access to other users' data.
- Examples: "explain like a flashcard," "translate passage," "find the paper this cites on the web," "export to Anki," "create a mind map."

### 20.3 Plugin runtime & safety
- Versioned, signed manifests; review/approval before listing.
- Resource limits (CPU/mem/time); audited tool calls; user-revocable grants.
- The same MCP interface lets **BookHelper itself act as an MCP server** to external agents (see §21) — symmetry by design.

---

## 21. Future Integrations

### 21.1 VYANA OS (the strategic endgame)
BookHelper becomes the **knowledge substrate** of VYANA OS:
- **Knowledge API + MCP server:** VYANA OS apps query the user's Knowledge Graph and corpus ("what does the user know about X?", "cite from their library") via REST + MCP.
- **Shared identity:** WorkOS/OIDC SSO; one account, federated across VYANA modules; SCIM for org provisioning.
- **Shared event bus:** reading/learning/knowledge events flow to VYANA OS so other modules react (e.g., a task manager surfaces relevant reading).
- **Embeddable surfaces:** the reader and tutor as embeddable components/web-components themed by VYANA tokens.
- **Cross-app knowledge:** the graph spans not just books but VYANA OS artifacts (docs, tasks, notes) — the engine is content-source-agnostic by construction.

### 21.2 Other integrations
- **Import/export:** Readwise, Anki, Obsidian/Markdown, Zotero, BibTeX.
- **Capture:** browser extension (clip articles), mobile share sheet, email-to-library.
- **Productivity:** Notion, Google Drive, Slack (share an answer with citations).
- **Open ecosystem:** public API + MCP for third-party agents to read (with consent) from a user's knowledge.

---

## 22. Offline Support

Reading and annotating must work on a plane. AI features degrade gracefully.

### 22.1 What works offline
- **Reading:** opened documents cached locally (IndexedDB on web; SQLite + file cache on desktop/mobile). Normalized blocks + assets stored.
- **Annotating:** highlights, notes, bookmarks, reading progress created locally; queued as mutations.
- **Review (partial):** due flashcards cached; grades queued.
- **Recent answers:** previously generated answers/citations cached and re-readable.

### 22.2 What requires connectivity
- New Q&A / tutor turns, deep research, ingestion of new sources, graph recomputation. These show a clear "needs connection" state and queue where sensible.

### 22.3 Sync engine
- **Local-first store** with a mutation log (operation queue). On reconnect, the sync engine replays ops with idempotency keys.
- **Conflict resolution:** annotations use **CRDTs (Yjs)** for conflict-free merge across devices; progress uses last-writer-wins with max-position bias.
- **Background sync:** Service Worker (web) / native background tasks; delta sync (only changed since `cursor`).
- **Desktop edge:** Tauri can run a **local embedding/vector cache** so on-device semantic search over already-ingested documents works offline (open-model embeddings via the gateway's local adapter).

---

## 23. Deployment Strategy

### 23.1 Topology

| Component | Phase 1 (speed) | Phase 2+ (scale) |
|---|---|---|
| **Web (Next.js)** | Vercel | Vercel or self-managed edge |
| **core-api / ai-orchestrator / realtime** | Fly.io / Railway / Render (containers) | Kubernetes (EKS/GKE) |
| **Workers** | same platform, scale-to-queue | K8s jobs + KEDA (queue-depth autoscaling) |
| **Postgres** | managed (Neon/Supabase/RDS) | RDS/Cloud SQL + read replicas + PgBouncer |
| **Redis** | managed (Upstash) | managed cluster |
| **Vector DB** | pgvector (in Postgres) | Qdrant Cloud / self-hosted |
| **Object storage** | Cloudflare R2 | R2 / S3 |
| **Analytics** | — | ClickHouse Cloud |

Start managed and consolidated; move to Kubernetes only when scale/cost/control justify it. Everything is containerized from day one so the move is a deployment change, not a rewrite.

### 23.2 CI/CD
- **GitHub Actions** monorepo pipelines, **Turborepo remote cache** for fast affected-only builds/tests.
- **Gates:** typecheck, lint, unit, contract tests, **RAG/tutor eval suite** (citation accuracy + faithfulness regression gates), security scan (SAST + dependency audit), IaC plan review.
- **Migrations:** expand/contract pattern, run pre-deploy, reversible.
- **Releases:** trunk-based; preview environments per PR (ephemeral DB branch via Neon); **canary + feature flags** for risky model/prompt/pipeline changes; instant rollback.

### 23.3 Infrastructure & ops
- **IaC:** Terraform (+ Helm at K8s stage). Environments: `dev`, `staging`, `prod`, ephemeral previews.
- **Observability:** OpenTelemetry traces (request → retrieval → model), Prometheus/Grafana metrics, Sentry errors, **Langfuse/Helicone** for LLM traces (prompt, context, citations, cost). SLOs + alerting on latency, error rate, cache hit-rate, cost-per-answer.
- **Secrets:** Doppler/Vault + cloud KMS.
- **DR:** automated Postgres PITR backups, object-storage versioning, documented restore runbooks; multi-AZ at scale.

---

## 24. Monorepo Structure

**Tooling:** **pnpm workspaces + Turborepo** (JS/TS); Python services managed with **uv** and included in the same repo with their own toolchain. One repo, many deployables, shared contracts.

```
bookhelper/
├── apps/
│   ├── web/                  # Next.js 15 web app
│   ├── desktop/              # Tauri 2 shell (wraps web reader)
│   ├── mobile/               # Expo / React Native (Phase 3)
│   ├── core-api/             # NestJS modular monolith (TS)
│   ├── ai-orchestrator/      # FastAPI (Python) — RAG, tutor, research
│   ├── ingestion-workers/    # Python pipeline workers
│   └── mcp-server/           # MCP surface (knowledge API for agents/VYANA OS)
│
├── packages/                 # shared TS libraries
│   ├── ai-gateway/           # provider abstraction (§19) — the AI firewall
│   ├── ui/                   # design-system components (Radix + Tailwind)
│   ├── design-tokens/        # shared tokens (web/desktop/mobile/VYANA)
│   ├── document-model/       # canonical Document Model + locator utils
│   ├── api-contracts/        # zod/OpenAPI schemas → generated clients
│   ├── api-client/           # typed client (tRPC + REST)
│   ├── sync-engine/          # local-first mutation log + CRDT
│   ├── config/               # tsconfig, eslint, tailwind presets
│   └── telemetry/            # OTel + LLM observability helpers
│
├── packages-py/              # shared Python libraries
│   ├── doc_parsers/          # pdf/epub/html/audio/video/note parsers
│   ├── chunking/             # structure-aware + hierarchical chunking
│   ├── kg/                   # knowledge-graph extraction + linking
│   └── eval/                 # RAG/tutor eval harness
│
├── infra/                    # Terraform, Helm, Dockerfiles
├── docs/                     # this file, ADRs, runbooks
│   └── adr/                  # architecture decision records
├── turbo.json  pnpm-workspace.yaml  package.json
```

**Boundaries enforced by lint/CI:**
- Feature apps may not import provider SDKs (only `ai-gateway`).
- `document-model` and `api-contracts` are the only cross-cutting type sources.
- Each `core-api` module owns its tables; cross-module access only via services.

---

## 25. Development Roadmap

Phased to ship a *coherent product* at each step, with the moat (graph + learning) compounding. Each phase is releasable.

### Phase 0 — Foundations (Weeks 1–4)
- Monorepo, CI/CD, IaC, auth (WorkOS), Postgres + pgvector, object storage, `ai-gateway` skeleton with Anthropic + Voyage adapters, observability baseline.
- **Exit:** a developer can log in, upload a file, and see it stored; one end-to-end traced model call works through the gateway.

### Phase 1 — Reader + grounded Q&A (Weeks 5–12) — *first lovable product*
- Ingestion v1 (PDF + EPUB), canonical Document Model, reader (web) with annotations + progress.
- RAG v1: hybrid retrieval + rerank + **cited** answers; streaming chat scoped to the open document.
- Prompt caching + semantic cache; cost dashboard.
- **Exit:** "Upload a book, read it beautifully, ask anything, get cited answers." Public/private beta.

### Phase 2 — Knowledge Engine + multi-format (Weeks 13–22)
- Extraction pipeline (summaries, concepts, entities, claims) via Batch API.
- Knowledge Graph v1 (Postgres) + graph explorer; "where have I read about X" cross-source view.
- Connectors: web articles, podcasts/YouTube (transcripts), notes.
- **Exit:** Library-wide knowledge — the product is now demonstrably *not a reader*.

### Phase 3 — AI Tutor + Learning System (Weeks 23–34)
- Tutor agent loop (Opus) with Socratic strategies, graph-scoped retrieval, mastery assessment.
- Flashcards + FSRS spaced repetition + review queue + mastery map.
- Reading instrumentation → learning loop closed (read → understand → retain).
- Offline reading/annotation (web + desktop via Tauri).
- **Exit:** Personalized teaching that adapts to the user's corpus and gaps.

### Phase 4 — Scale, plugins, deep research (Weeks 35–48)
- Extract vector DB to Qdrant; graph to Neo4j/AGE if needed; ClickHouse analytics; K8s.
- MCP plugin system (source connectors + capability plugins); first-party integrations (Readwise/Anki/Notion).
- Deep research mode (Fable 5, long-horizon multi-doc synthesis).
- Mobile (Expo).
- **Exit:** Extensible, scalable platform with an ecosystem.

### Phase 5 — VYANA OS integration (Weeks 49+)
- Knowledge API + MCP server hardened for external consumption; SSO/SCIM; shared event bus; embeddable reader/tutor.
- Cross-app knowledge graph spanning VYANA OS artifacts.
- **Exit:** BookHelper is the knowledge substrate of VYANA OS.

---

### Appendix A — Key technology decisions (summary)

| Area | Decision | Reversibility |
|---|---|---|
| Monorepo | pnpm + Turborepo (+ uv for Python) | Low churn |
| Web | Next.js 15 / React 19 | Medium |
| Desktop/Mobile | Tauri 2 / Expo | Medium |
| Core API | NestJS modular monolith (TS) | Medium |
| AI/ML | FastAPI + Python workers | Medium |
| DB | PostgreSQL + Drizzle | Low (load-bearing) |
| Vectors | pgvector → Qdrant | High (behind interface) |
| Graph | Postgres → Neo4j/AGE | High (behind interface) |
| Cache/Queue | Redis (+ NATS/Kafka at scale) | High |
| Object storage | Cloudflare R2 / S3 | High |
| Auth | WorkOS (OIDC) | Medium |
| Default LLM | Claude (Opus 4.8 / Sonnet 4.6 / Haiku 4.5 / Fable 5) via `ai-gateway` | High (abstracted) |
| Embeddings | Voyage (abstracted) | High |
| Plugins/Tools | MCP | Medium |

### Appendix B — Open questions to resolve via ADR
1. tRPC vs. pure REST for the web BFF (lean tRPC; REST stays public/versioned).
2. Drizzle vs. Prisma (lean Drizzle for pgvector + SQL transparency).
3. When to extract Qdrant (trigger: index > ~5M vectors or p95 search latency SLO breach).
4. Managed Agents vs. self-hosted agent loop for the tutor (start self-hosted; evaluate Managed Agents for long study sessions).
5. FSRS vs. SM-2 default (lean FSRS).

---

*End of Architecture v1. Changes to load-bearing decisions (DB schema, tenancy model, the AI-gateway boundary) require an ADR in `docs/adr/`.*
