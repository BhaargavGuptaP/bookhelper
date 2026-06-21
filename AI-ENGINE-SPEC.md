# BookHelper — Modular AI Engine: Architecture Specification

> **Deep-dive companion** to [ARCHITECTURE.md](ARCHITECTURE.md) (§7, §16, §19), [FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md) (E3, E9), [ROADMAP.md](ROADMAP.md). This generalizes the `ai-gateway` package into the platform's complete, **provider-independent** AI engine.
>
> **Architecture only.** Components, contracts, flows, strategies, and data shapes (as tables/diagrams). No implementation code, no provider SDK calls.
>
> **The one rule everything serves:** *No feature code ever speaks a provider's dialect.* Features speak the **canonical model**; adapters translate. Swapping or adding a provider/model is configuration + one adapter — never a feature change.

---

## Table of Contents

1. [Design Goals & Principles](#1-design-goals--principles)
2. [High-Level Architecture](#2-high-level-architecture)
3. [The Canonical Model (the linchpin)](#3-the-canonical-model-the-linchpin)
4. [Provider Abstraction & Adapters](#4-provider-abstraction--adapters)
5. [Capability Registry & Model Catalog](#5-capability-registry--model-catalog)
6. [Public API Surface](#6-public-api-surface)
7. [Prompt Template System](#7-prompt-template-system)
8. [Conversation Memory](#8-conversation-memory)
9. [Streaming](#9-streaming)
10. [Tool Calling & Agentic Loop](#10-tool-calling--agentic-loop)
11. [Embeddings](#11-embeddings)
12. [Vector Search](#12-vector-search)
13. [Model Routing & Policy Engine](#13-model-routing--policy-engine)
14. [Cost Optimization](#14-cost-optimization)
15. [Rate Limiting & Concurrency](#15-rate-limiting--concurrency)
16. [Fallback, Resilience & Health](#16-fallback-resilience--health)
17. [Safety & Guardrails](#17-safety--guardrails)
18. [Caching](#18-caching)
19. [Observability & Cost Accounting](#19-observability--cost-accounting)
20. [Configuration & Extensibility](#20-configuration--extensibility)
21. [Request Lifecycle (end-to-end)](#21-request-lifecycle-end-to-end)
22. [Multi-Tenancy & Security](#22-multi-tenancy--security)
23. [Module Structure](#23-module-structure)

---

## 1. Design Goals & Principles

1. **Provider-independent by construction.** Every capability — chat, streaming, tools, embeddings, structured output, reasoning, caching — is expressed in a canonical form. Providers are plugins behind a uniform contract.
2. **Capability-driven, not provider-driven.** Features declare *what they need* (vision, tools, JSON schema, reasoning, 200k context, ≤$X). The router picks a model that satisfies it. Features never name a provider.
3. **Policy as data.** Model catalog, routing rules, fallback chains, budgets, and tenant policy are declarative configuration, hot-reloadable — not hardcoded in code paths.
4. **Resilient by default.** Every call has a fallback chain, circuit breakers, retries, and graceful degradation. A provider outage degrades quality, never availability.
5. **Cost is a first-class signal.** Caching, batching, routing, and budgets are built in; every call is metered and attributable.
6. **Safety is a pipeline, not a checkbox.** Pluggable pre/post guards; untrusted content is data, never instructions; tool actions are gated.
7. **Observable end-to-end.** Every request carries a trace: rendered prompt + version, routing decision, model, tokens, cost, cache hits, safety flags, latency, fallbacks.
8. **Extensible at every seam.** Adding a provider, model, guard, vector store, embedding model, or prompt template is registration, not refactoring.

---

## 2. High-Level Architecture

Five layers + cross-cutting services. Features call only the **Public API**; everything below is internal.

```
┌──────────────────────────────────────────────────────────────────────┐
│  FEATURES (RAG, Tutor, Quiz, Extraction, Summarize, Classify, …)        │
│  speak ONLY the canonical model + task classes                         │
└───────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  L1  PUBLIC API           generate · stream · embed · search · runTools │
├──────────────────────────────────────────────────────────────────────┤
│  L2  ORCHESTRATION        Prompt Templates · Memory · Tool Loop ·        │
│                           Retriever (embed+vector+rerank) · Structured   │
│                           Output · Conversation Manager                 │
├──────────────────────────────────────────────────────────────────────┤
│  L3  ROUTING & POLICY     Router · Policy Engine · Budget/Quota ·        │
│                           Rate Limiter · Fallback/Failover · Health      │
├──────────────────────────────────────────────────────────────────────┤
│  L4  PROVIDER ABSTRACTION Adapter contract · Capability Registry ·       │
│                           Canonical⇄Native translation · Error mapping   │
├──────────────────────────────────────────────────────────────────────┤
│  L5  PROVIDER ADAPTERS    Anthropic · OpenAI · Google · OpenRouter ·     │
│                           Local(Ollama/vLLM) │ Embeddings adapters │     │
│                           Vector stores │ Rerankers                     │
└──────────────────────────────────────────────────────────────────────┘
   CROSS-CUTTING (span all layers):
   Safety Guard Pipeline · Caching (prompt+semantic+embedding) ·
   Observability/Tracing · Cost Ledger · Config/Registry · Secrets
```

**Separation of concerns:**
- **L2 Orchestration** composes capabilities into workflows (a RAG answer = render template → retrieve → assemble → generate → bind citations). It is provider-agnostic.
- **L3 Routing** decides *which model* and *how to call it resiliently* — the only layer that reasons about providers in the abstract (via capabilities), never their dialects.
- **L4/L5** are the only place provider-specific code exists, fully contained behind the adapter contract.

---

## 3. The Canonical Model (the linchpin)

All providers map to/from these neutral shapes. If a concept can't be expressed canonically, it doesn't exist to features.

### 3.1 Canonical Request

| Field | Type | Purpose |
|---|---|---|
| `task` | enum | semantic task class for routing (`chat`, `rag_answer`, `tutor`, `classify`, `extract`, `summarize`, `title`, `research`, `embed`, `rerank`) |
| `system` | Block[] | structured system instruction (cache-markable) |
| `messages` | Message[] | conversation turns |
| `tools` | ToolDef[] | provider-neutral tool definitions (JSON Schema) |
| `toolChoice` | enum | `auto` · `required` · `none` · `{tool}` |
| `outputSchema` | JSONSchema? | structured-output contract |
| `params` | GenParams | normalized generation controls (below) |
| `stream` | bool | streaming requested |
| `routing` | RoutingHints? | tier, budget cap, latency class, provider/data-residency policy, model override |
| `cache` | CacheHints? | which prefix is stable/cacheable |
| `context` | RequestContext | `tenantId, userId, conversationId, requestId, feature` (for routing, quota, audit) |
| `safety` | SafetyOverrides? | per-call guard config (within tenant policy bounds) |

**GenParams (normalized; capability-gated per model):**
`maxOutputTokens` · `reasoning: none|low|medium|high|max` (maps to thinking/effort/reasoning-tokens per provider) · `temperature?` · `topP?` · `stop[]` · `seed?`. Params unsupported by the chosen model are dropped or mapped with a logged note (never passed through to 400).

### 3.2 Message & ContentPart

`Message = { role: system|user|assistant|tool, content: ContentPart[] }`

| ContentPart | Fields | Notes |
|---|---|---|
| `text` | `text` | |
| `image` | `source(url|base64), mime` | vision |
| `document` | `ref/data, mime, citationsEnabled?` | PDFs/files |
| `toolUse` | `id, name, input` | model→tool call |
| `toolResult` | `toolUseId, content[], isError` | tool→model result |
| `reasoning` | `summary?, signature?` | normalized thinking block (opaque, replay-safe) |
| `citation` | `sourceRef, quote, locator` | grounded-answer provenance (binds to Reader locators) |

### 3.3 Canonical Response

| Field | Type | Notes |
|---|---|---|
| `id`, `model`, `provider` | — | resolved actuals |
| `content` | ContentPart[] | text + toolUse + reasoning + citations |
| `stopReason` | enum | `end` · `max_tokens` · `tool_use` · `stop` · `refusal` · `content_filter` · `error` |
| `usage` | Usage | `inputTokens, outputTokens, cachedReadTokens, cachedWriteTokens, reasoningTokens` |
| `cost` | Cost | amount + per-component breakdown |
| `routing` | RoutingResult | attempts[], model chosen, fallbacks used, cacheHit |
| `safety` | SafetyResult | flags, redactions, actions taken |
| `latency` | Latency | firstToken, total |

### 3.4 Error taxonomy (normalized across providers)
`rate_limit` · `overloaded` · `timeout` · `auth` · `invalid_request` · `content_filter` · `context_overflow` · `provider_unavailable` · `budget_exceeded` · `internal`. Each adapter maps native errors into this set so routing/fallback logic is provider-agnostic.

> **Why this matters:** routing, fallback, memory, caching, safety, and observability all operate on these canonical shapes. A new provider becomes a translation problem (L5), never a change to L1–L3.

---

## 4. Provider Abstraction & Adapters

### 4.1 The Adapter contract (every provider implements)

| Method | Inputs → Outputs | Responsibility |
|---|---|---|
| `complete` | CanonicalRequest → CanonicalResponse | non-streaming generation |
| `stream` | CanonicalRequest → CanonicalStream | streaming generation (normalized events) |
| `embed` | EmbedRequest → EmbedResult | embeddings (if supported) |
| `rerank` | RerankRequest → RerankResult | reranking (if supported) |
| `capabilities` | → CapabilityDescriptor[] | declare models + features + costs + limits |
| `mapError` | nativeError → CanonicalError | error normalization |
| `health` | → HealthSignal | liveness/latency for routing + breakers |

Adapters own: native request/response translation, auth/secret handling, provider-specific features (caching breakpoints, reasoning modes, refusal handling), and quirk normalization. **Nothing above L4 imports a provider SDK** (lint-enforced).

### 4.2 Provider notes (each behind the same contract)

| Provider | Adapter notes |
|---|---|
| **Anthropic** | Content-block messages; **adaptive thinking + effort** → `reasoning`; **prompt caching** breakpoints → cache hints; native **citations** → `citation` parts; `refusal` stopReason + optional **server-side fallback**; structured output via output config. The platform's quality default for tutor/reasoning. |
| **OpenAI** | Chat/Responses API; tool/function calling; JSON-schema structured outputs; reasoning models map to `reasoning` effort; automatic prompt caching (no explicit breakpoints); embeddings family. |
| **Google (Gemini)** | `contents`/`parts` + system instruction; function calling; safety settings → safety guards; context caching → cache hints; multimodal; embeddings. |
| **OpenRouter** | **Meta-provider**: a single adapter exposing a broad catalog of third-party models via an OpenAI-compatible surface. Used for breadth, price/availability arbitrage, and as a wide fallback pool. Capability/cost sourced from its catalog; per-model quirks flagged in the registry. |
| **Local** | Ollama / vLLM / llama.cpp via OpenAI-compatible endpoints. Zero marginal cost; for privacy/offline/cost-sensitive tenants and desktop. Capabilities declared in config (no live catalog). Powers offline desktop semantic features. |

### 4.3 Normalization examples (handled in adapters, invisible above)
- **Reasoning:** `reasoning: high` → Anthropic adaptive thinking + effort; → OpenAI reasoning effort; → Gemini thinking config; → ignored on models without it (logged).
- **Caching:** `cache` hints → Anthropic explicit breakpoints; → automatic on OpenAI; → Gemini context cache; → no-op locally.
- **Refusal:** every provider's refusal/content-filter maps to `stopReason: refusal|content_filter` → uniform handling + fallback eligibility (§16, §17).
- **Tools:** one canonical ToolDef → each provider's native tool schema; tool-call/tool-result round-trip normalized.

---

## 5. Capability Registry & Model Catalog

The brain the router reasons over. **Config-as-data**, merged from declared config + live provider model APIs where available, hot-reloadable.

**CapabilityDescriptor (per model)**

| Field | Example |
|---|---|
| `modelId`, `provider`, `family` | resolved IDs (never hardcoded in features) |
| `contextWindow`, `maxOutputTokens` | for fit checks + compaction triggers |
| `modalities` | input/output (text, image, audio) |
| `supports` | streaming, tools, parallelTools, structuredOutput, reasoning, promptCaching, vision, systemPrompt, stopSequences |
| `reasoningControl` | `effort` · `budget` · `none` |
| `cost` | input/output/cachedRead/cachedWrite per-1M; (embeddings: per-1M + dims) |
| `limits` | declared rpm/tpm (per key) |
| `quality` | task-tier scores (from eval harness — ROADMAP §7) |
| `status` | active · preview · deprecated |
| `dataPolicy` | retention/residency attributes (tenant policy filtering) |

**Resolution:** never construct model IDs in code; resolve from the registry by task + capabilities. Registry refresh detects new models/prices; routing can pick them up behind eval gates without code changes.

---

## 6. Public API Surface

What features call (L1). Provider-, model-, and transport-agnostic.

| Operation | Inputs → Outputs | Notes |
|---|---|---|
| `generate(req)` | CanonicalRequest → CanonicalResponse | non-streaming; routing+fallback+safety+caching applied |
| `stream(req)` | CanonicalRequest → CanonicalStream | streaming events (§9) |
| `embed(req)` | texts + model-policy → vectors | batched, cached (§11) |
| `search(req)` | query + scope/filters → ranked hits | embed→vector→rerank pipeline (§12) |
| `runTools(req, tools)` | → final response | managed agentic loop (§10) |
| `parse(req, schema)` | → typed object | structured output + validation |
| `countTokens(req)` | → tokens | model-correct counting for budgeting |

All accept `RequestContext` (tenant/user/feature) and `routing` hints; all return cost + routing + safety metadata.

---

## 7. Prompt Template System

Provider-neutral, versioned, typed, cache-aware. Rendering produces canonical `system`/`messages`.

**Architecture:**
- **Template = `{ id, version, role-structured blocks, typed variables, partials }`** authored in a templating dialect (no logic beyond simple conditionals/loops). Stored in a versioned repo (`packages/prompts`).
- **Typed variables:** declared schema; render validates inputs (missing/extra → error, not a malformed prompt).
- **Composition:** partials/fragments for shared snippets (persona, formatting rules, safety preamble) → DRY across templates.
- **Cache-aware structure:** templates mark the **stable prefix** (system + persona + frozen instructions) separate from the **volatile suffix** (retrieved context, user input) so the engine can place cache breakpoints correctly (§18) — *templates are written to never put volatile data in the cacheable prefix*.
- **Safe interpolation:** all interpolated content (especially document/RAG/user content) is inserted as **data**, escaped/wrapped, never as instructions (injection defense, §17).
- **Versioning & A/B:** multiple versions coexist; routing/experiments select a version; eval harness (ROADMAP §7) gates promotion; the rendered version is recorded in the trace.
- **Output:** a `RenderedPrompt` (canonical `system` + `messages` + declared cache breakpoints), handed to L2/L3.

**What it deliberately is not:** a place for business logic. Branching beyond trivial conditionals lives in orchestration code, not templates.

---

## 8. Conversation Memory

Four tiers behind a `MemoryStore` abstraction; orchestration assembles a budget-fitted context per turn.

| Tier | What | Mechanism |
|---|---|---|
| **Working memory** | recent turns in the active session | in-context message window |
| **Episodic (long)** | older turns beyond the window | **summarization/compaction** into a running summary block; server-side compaction where the provider supports it (Anthropic), else engine-managed |
| **Semantic memory** | facts/passages relevant to the current turn from past conversations & the corpus | vector retrieval (§12) injected as context |
| **Structured memory** | durable facts/preferences (user's goals, known concepts, mastery) | typed key-value store; retrieved by relevance; written via explicit memory tools |

**Context assembly (per turn):**
1. Start with the cacheable prefix (system + persona + structured-memory facts that are stable).
2. Add the running episodic summary (if any).
3. Retrieve semantic memory relevant to the new input (vector search) → add as the volatile suffix.
4. Add the working-memory window + new input.
5. **Budget check:** if the assembled context exceeds the model's window (minus output headroom), apply the eviction/compaction strategy (below).

**Window management strategies (configurable per task):**
- **Compaction** (preferred): summarize the oldest turns into the episodic summary; preserve provider compaction blocks where used.
- **Sliding window:** drop oldest verbatim turns once summarized.
- **Recency + salience eviction:** keep recent + high-salience (referenced) turns; evict the rest to semantic memory.
- **Tool-result pruning:** clear stale large tool outputs from context once consumed.

**Properties:** memory is per-tenant/user isolated; stored locally on desktop for offline; never stores secrets/PII beyond policy (§17, §22).

---

## 9. Streaming

A **single normalized stream event model** hides every provider's wire format (SSE/chunk/proto differences).

**Canonical stream events:**
`start` (resolved model) · `text_delta` · `reasoning_delta` · `tool_call_start` · `tool_call_delta` (partial JSON args) · `tool_call_stop` · `citation` · `usage` · `fallback_switch` (a fallback model took over mid-stream) · `stop` (stopReason) · `error`.

**Engine responsibilities:**
- **Normalization:** each adapter emits canonical events; partial tool-call argument fragments are assembled into complete tool calls before `tool_call_stop`.
- **Accumulation:** the engine assembles the final canonical response from the stream (a `getFinal()` equivalent) so callers can stream *and* get the structured result.
- **Backpressure:** respects slow consumers; bounded buffers.
- **Mid-stream fallback:** if a provider fails/refuses mid-stream, the engine can switch to a fallback and continue the same logical stream, emitting `fallback_switch` (already-streamed content is preserved or discarded per policy; §16).
- **Reconnect/resume:** for long generations behind the BFF, the client stream can reconnect; the engine replays from the last acknowledged event where the transport allows.
- **Default to streaming** for any long-output or high-`maxOutputTokens` call to avoid timeouts; non-streaming wraps the stream internally for safety.

The downstream UI contract (SSE events `token`/`citation`/`tool_use`/`done`/`error`, UX §4) is a thin mapping of these canonical events.

---

## 10. Tool Calling & Agentic Loop

Provider-neutral tools; the engine runs the loop or exposes one-shot calls.

**ToolDef (canonical):** `{ name, description (when-to-call), inputSchema (JSON Schema), strict?, sideEffects: none|read|write|external, gating: none|confirm|policy }`.

**Tool registry:** central, typed; tools declare side-effects + gating so the engine can schedule (read-only tools parallelize) and gate (write/external tools require approval per policy). **MCP** tools are first-class — an MCP server's tools are imported as canonical ToolDefs (ties to the platform Plugin System, E15).

**Managed agentic loop (`runTools`):**
1. `generate` with tools → response.
2. If `stopReason == tool_use`: extract tool calls; for each, **apply gating** (auto-run read-only; pause for confirmation on gated write/external actions); execute (in-process, via MCP, or hand to the caller for client-side tools).
3. Append `toolResult` parts; continue the loop.
4. Repeat until `end_turn`, a max-iteration cap, or a budget/iteration guard (prevents runaway loops).
- **Parallel tools:** independent read-only calls execute concurrently; write/external calls serialize.
- **Manual mode:** callers needing fine control (custom logging, human-in-the-loop, programmatic tool calling) drive the loop themselves via `generate` + the engine's tool-result helpers.
- **Structured output** is a degenerate "tool": `parse(req, schema)` constrains output to a schema and validates; on validation failure → bounded retry/repair.

**Safety:** every tool execution passes the guard pipeline (§17); destructive/external actions are audited and (per policy) require explicit approval. Retrieved tool outputs are untrusted data.

---

## 11. Embeddings

Provider-abstracted, cached, versioned.

**`EmbedRequest`:** `{ texts[], modelPolicy (task/dims/quality), context }` → `{ vectors[], model, dims, usage, cost }`.

**Architecture:**
- **Provider-neutral:** Voyage (recommended), OpenAI, Google, Cohere, local (BGE/nomic) behind one contract; chosen by policy (quality/cost/dims/residency).
- **Caching:** keyed by `(contentHash, embedModel, embedVersion)` → re-embedding unchanged text is free; survives re-ingestion (Reader §4, ingestion E4).
- **Batching:** automatic batching to provider limits; large jobs route to async/batch tiers (cost §14).
- **Versioning:** embedding model + version stamped on every vector; a model change triggers controlled, namespaced re-embedding — never a silent mixed-dimension index.
- **Normalization:** L2-normalize for cosine; dimension recorded for index compatibility.
- **Mixed-dim safety:** the vector store namespaces by `(embedModel, version)`; queries only compare same-space vectors.

---

## 12. Vector Search

A `VectorStore` abstraction + a composed `Retriever`. Backend-independent.

**`VectorStore` contract:** `upsert(items, namespace)` · `query(vector, k, filter, namespace)` · `hybridQuery(vector, sparseTerms, k, filter)` · `delete(ids|filter)` · `health()`.

**Backends (pluggable):** pgvector (start), Qdrant (scale), Pinecone/Weaviate (options), local sqlite-vss/in-memory (desktop/offline). The platform's scale trigger (ARCHITECTURE §18) swaps pgvector→Qdrant behind this contract with no caller change.

**The `Retriever` pipeline (composes embeddings + store + rerank):**
1. **Embed** the query (§11).
2. **Hybrid query:** dense (vector) + sparse (BM25/FTS) with metadata + **tenant filter** (mandatory `owner_id` predicate — §22) → candidate set.
3. **Fuse** (Reciprocal Rank Fusion).
4. **Rerank** via a reranker adapter (cross-encoder / Cohere / Voyage rerank) → top-N.
5. Return hits with scores + source refs/locators (for citation binding).

**Properties:** namespaces by tenant + embedding-space; metadata filtering (doc/collection/type/time); reranking is the primary precision lever; the whole pipeline is what `search(req)` (L1) and RAG/memory call.

---

## 13. Model Routing & Policy Engine

The decision layer: *which model, with what fallback chain, for this request?* Declarative, capability-driven.

**Inputs:** `task` class · derived **required capabilities** (needs vision? tools? structured output? reasoning? context size?) · tenant policy (allowed providers, data residency, model allow/deny) · budget cap · latency class · quality tier · live provider **health** · per-model **cost**.

**Pipeline:**
```
required capabilities ─▶ CAPABILITY FILTER  (drop models that can't satisfy)
tenant policy        ─▶ POLICY FILTER       (residency/allow-list/deny-list)
health + breakers    ─▶ AVAILABILITY FILTER (drop unhealthy/circuit-open)
cost·quality·latency ─▶ SCORE & RANK        (weighted by tier + budget)
                     ─▶ ORDER → primary + ordered FALLBACK CHAIN
```

**Routing strategies (selectable per task/tenant):**
- **Capability-match** (always first): never route to a model that can't do the job.
- **Quality-tier:** map task → tier (e.g., tutor→top, RAG→balanced, classify→cheap-fast) → best model in tier. (Defaults mirror ARCHITECTURE §7.1: cheap model for classify/route, balanced for high-volume RAG, top-tier for tutor, frontier for deep research.)
- **Cost-optimized:** cheapest model meeting quality threshold within budget.
- **Latency-optimized:** fastest healthy model meeting quality (interactive surfaces).
- **Weighted / canary:** split traffic across model versions for A/B; eval-gated promotion (ROADMAP §7).
- **Sticky (conversation affinity):** keep a conversation on one model/provider to preserve prompt-cache + reasoning continuity; deviate only on failure.

**Outputs:** a `RoutingPlan` = primary model + ordered fallbacks + per-attempt overrides (e.g., smaller context on a fallback). Recorded in the trace.

---

## 14. Cost Optimization

Built into the request path; levers in priority order.

1. **Prompt caching** (§18): cache stable prefixes (system/persona/doc context) — large savings on repeated reads; the dominant lever for RAG/tutor.
2. **Semantic answer cache** (§18): vector-keyed; return a prior answer for near-duplicate questions on the same scope.
3. **Request coalescing:** dedupe concurrent identical in-flight requests → one provider call, fanned out.
4. **Batch tier:** route non-interactive bulk work (ingestion enrichment, embeddings) to async/batch APIs (≈50% cheaper).
5. **Quality-tier down-routing:** cheap-fast models for classify/route/title; reserve frontier models for genuinely hard tasks.
6. **Context economy:** compaction + tool-result pruning + retrieval scoping shrink input tokens (memory §8).
7. **Reasoning economy:** `reasoning` effort tuned per task — high only where quality demands it.
8. **Budgeting:** per-tenant/user/feature budgets; `countTokens` pre-flight for large requests; over-budget → down-route or queue (not crash).

**Cost ledger:** every call tagged `(tenant, user, feature, task, model)` with full token + cost breakdown → cost-per-answer/-document/-user dashboards + anomaly alerts (§19).

---

## 15. Rate Limiting & Concurrency

Two scopes, both enforced before a provider call.

**Provider-side (protect provider limits):**
- Token-bucket per `(provider, model, apiKey)` for both **RPM and TPM** (token-aware, using `countTokens` estimates).
- **Adaptive throttling:** on `rate_limit`/`overloaded`, read `Retry-After`, back off with jitter, and *reduce concurrency* dynamically; recover gradually.
- **Request queue** with **priority lanes** (interactive > background > batch); bounded with backpressure to callers.
- Multiple keys/regions per provider pooled for headroom.

**Tenant-side (fairness + cost control):**
- Per-tenant/user quotas + budgets (requests, tokens, spend) with token-bucket enforcement.
- Over-quota → throttle/queue/down-route, or a clear `429`-equivalent with `Retry-After` (never a silent failure).

**Concurrency:** global + per-provider concurrency caps; hedging budget (for §16) accounted so retries/hedges don't blow limits.

---

## 16. Fallback, Resilience & Health

Availability is the contract; quality degrades before availability does.

**Fallback triggers** (canonical errors, §3.4): `overloaded`/`provider_unavailable`/`timeout` (after bounded retry) · `rate_limit` (after retry) · `refusal`/`content_filter` (benign false-positive → try a different model) · `budget_exceeded` (down-route to cheaper) · `context_overflow` (compact or route to a larger-context model).

**Mechanisms:**
- **Ordered fallback chain** from the RoutingPlan (§13): next candidate on trigger; per-hop overrides (smaller context, lower effort).
- **Retry with jitter** for transient errors (capped, idempotency-keyed).
- **Circuit breakers** per `(provider, model)`: open on sustained failures → routing skips it → half-open probes → close on recovery.
- **Hedged requests** (opt-in, latency-critical): fire to 2 providers, take the first, cancel the loser (budgeted, off by default to control cost).
- **Cross-provider failover:** because the chain spans providers (e.g., Anthropic → OpenAI → OpenRouter → local), a single provider outage is survivable.
- **Mid-stream fallback** (§9): switch providers without dropping the user's stream.

**Graceful degradation tiers** (when the chain is exhausted): down-tier model → smaller context/cached partial → semantic-cache answer → clear "AI temporarily unavailable" (and, platform-wide, reading/annotation keep working — ARCHITECTURE §18).

**Health monitor:** rolling per-provider error rate + latency + 429 frequency feeds the breakers and the routing availability filter.

---

## 17. Safety & Guardrails

A **pluggable, ordered guard pipeline** — pre-request and post-response. Each guard can `pass | redact | annotate | block | escalate`.

**Pre-request guards:**
- **Input moderation:** classify user input for disallowed content per tenant policy.
- **Prompt-injection defense:** untrusted content (retrieved passages, tool outputs, web/document text) is **wrapped and tagged as data**, never interpreted as instructions; operator/system instructions ride the system channel only. Injection-pattern detection on untrusted spans.
- **PII detection/redaction:** detect + redact PII before it reaches a provider (per residency/privacy policy); never log secrets/PII.
- **Policy & budget checks:** tenant allow/deny, residency, per-call token/cost limits.

**Post-response guards:**
- **Output moderation:** classify generated content; block/annotate per policy.
- **Grounding/faithfulness check** (RAG): verify cited spans support claims; below threshold → "not in your sources" rather than ungrounded output (trust guarantee, ARCHITECTURE §7.4).
- **PII-leak check:** scan output for leaked secrets/PII.
- **Structured-output validation:** enforce the schema; repair/retry on violation.
- **Tool-action gating:** destructive/external tool calls require approval per gating policy; all tool calls audited.

**Refusal handling:** normalized refusals (§3.4) trigger eligibility for a fallback model on benign false-positives (e.g., security-tooling/life-sciences adjacent), bounded and audited — quality degrades to a different model, the request doesn't silently die.

**Properties:** guards are config-ordered and tenant-scoped; every block/redact/escalate is written to an immutable audit log; the guard pipeline is itself observable (which guard fired, why) and red-team tested (ROADMAP §10 R-5).

---

## 18. Caching

Three caches, all keyed safely and observable.

| Cache | Key | Effect |
|---|---|---|
| **Prompt cache** | stable prefix bytes per model | provider-abstracted; reads ≈0.1× cost. Engine places breakpoints on template-marked stable prefixes (§7); **guards against invalidators** (no timestamps/UUIDs/unsorted JSON/varying tool order in the prefix — lint + runtime check); pre-warm on context open. |
| **Semantic answer cache** | embedding of `(question, scope)` | near-duplicate questions return a prior answer; invalidated when the doc/graph version changes. |
| **Embedding cache** | `(contentHash, model, version)` | re-embedding unchanged content is free (§11). |

Plus **request coalescing** (in-flight dedupe, §14). Cache hit-rate is a tracked metric; a drop alerts (likely a silent invalidator regression).

---

## 19. Observability & Cost Accounting

Every request emits a structured trace:
- **Identity:** requestId, tenant, user, feature, task, conversationId.
- **Prompt:** rendered template id+version, message shapes (content hashed/redacted per privacy).
- **Routing:** RoutingPlan, attempts, model(s) chosen, fallbacks used, circuit state.
- **Retrieval:** query, candidate count, reranked set (for RAG).
- **Generation:** tokens (in/out/cached/reasoning), cost breakdown, stopReason.
- **Caching:** prompt-cache read/write, semantic-cache hit.
- **Safety:** guards fired, actions taken.
- **Latency:** first-token, total, per-attempt.

Wired to **LLM observability** (Langfuse/Helicone) + OTel traces (span the full feature→engine→provider path) + metrics/alerts (cost-per-X, cache hit-rate, fallback rate, refusal rate, p95 first-token). The **cost ledger** (§14) is the billing/quota source of truth.

---

## 20. Configuration & Extensibility

Everything that varies is **data**, hot-reloadable, versioned:

| Extension point | How to add |
|---|---|
| **Provider** | implement the Adapter contract (§4.1); register; declare models in the catalog |
| **Model** | add a CapabilityDescriptor to the registry (§5) — routing picks it up behind eval gates |
| **Routing policy** | edit declarative policy (task→tier, weights, fallback chains, tenant rules) |
| **Guard** | implement the guard contract; insert into the pipeline order (§17) |
| **Vector store / reranker** | implement the contract (§12); swap via config |
| **Embedding provider** | implement the embed contract (§11); select by policy |
| **Prompt template** | add a versioned template to `packages/prompts`; eval-gate promotion |

No extension above requires changing feature code. Adding OpenRouter or a local model is: write/configure the adapter + register its catalog → it becomes routable.

---

## 21. Request Lifecycle (end-to-end)

A representative `generate`/`stream` flow:

```
feature.generate(canonicalRequest)                         [L1 Public API]
  │
  ├─▶ Quota/Budget check (tenant) ──────────────────────── [L3]
  ├─▶ Prompt render (template+version) ─────────────────── [L2]
  ├─▶ Memory assembly (working+episodic+semantic) ──────── [L2]
  ├─▶ Retrieval if RAG (embed→vector→rerank) ───────────── [L2/L12]
  ├─▶ PRE-SAFETY guards (moderation, injection-wrap, PII) ─ [cross-cut]
  ├─▶ Cache lookup (prompt prefix / semantic answer) ───── [L18]  ──hit──▶ return
  ├─▶ Router → RoutingPlan (primary + fallback chain) ──── [L3]
  ├─▶ Rate-limit admit (provider + tenant buckets) ─────── [L3]
  │
  ├─▶ Adapter.complete/stream (primary model) ──────────── [L4/L5]
  │     ├─ ok ─────────────────────────────────────────────┐
  │     └─ canonical error → retry/breaker/FALLBACK ────────┤  (loop the chain)
  │                                                         │
  ├─▶ POST-SAFETY guards (moderation, grounding, schema) ── [cross-cut]
  ├─▶ Tool loop if tool_use (gate→execute→continue) ─────── [L10]
  ├─▶ Cache write (prefix/semantic) ────────────────────── [L18]
  ├─▶ Cost ledger + trace emit ─────────────────────────── [L19]
  └─▶ CanonicalResponse / normalized stream ────────────── [L1]
```

---

## 22. Multi-Tenancy & Security

- **Tenant isolation:** every request carries `tenantId/userId`; vector queries and memory reads are tenant-filtered by predicate (mirrors platform RLS, ARCHITECTURE §17); caches and ledgers are tenant-scoped.
- **Per-tenant model policy:** allow/deny providers, enforce data residency, pin privacy-sensitive tenants to specific providers (e.g., local-only) — enforced in the routing policy filter (§13).
- **Secrets:** provider keys in a secrets manager/KMS; never in prompts, logs, or traces; key rotation supported; multiple keys pooled per provider.
- **Data handling:** PII redaction pre-provider (§17); content hashed/redacted in traces per policy; honor zero-retention/residency requirements per tenant (some models gated by data-policy attributes in the registry).
- **Audit:** safety decisions, tool actions, and policy denials written to an immutable audit log.

---

## 23. Module Structure

```
packages/ai-engine/
  core/            canonical types · errors · request lifecycle
  api/             public surface (generate/stream/embed/search/runTools/parse)
  orchestration/
    prompts/       template engine + render (consumes packages/prompts)
    memory/        working · episodic(compaction) · semantic · structured
    tools/         registry · agentic loop · MCP import · structured output
    retriever/     embed→vector→rerank composition
  routing/         policy engine · router · sticky/canary · budget/quota
  ratelimit/       token buckets · queues · adaptive throttle · concurrency
  resilience/      fallback chains · retries · circuit breakers · health · hedging
  safety/          guard pipeline · moderation · injection · PII · gating · audit
  caching/         prompt cache · semantic cache · coalescing
  providers/       adapter contract · capability registry
    anthropic/  openai/  google/  openrouter/  local/        (provider adapters)
  embeddings/      embed contract + provider adapters + cache
  vectorstores/    store contract + pgvector/qdrant/pinecone/local + rerankers
  observability/   tracing · LLM telemetry · cost ledger
  config/          model catalog · routing policy · tenant policy (config-as-data)

packages/prompts/  versioned, typed prompt templates (eval-gated)
```

**Boundary rules (lint-enforced):** only `providers/*/` may import a provider SDK; everything else imports `core` canonical types. Features depend only on `api`. Provider adapters never import each other.

---

*End of AI Engine Architecture v1. The canonical model (§3) + capability registry (§5) + adapter contract (§4.1) are the load-bearing seams — they are what make every other capability (routing, memory, tools, safety, cost, fallback) provider-independent. Adding OpenAI, Google, OpenRouter, or a local model is a contained L5 task: implement the adapter, register the catalog, set policy — no change above L4.*
