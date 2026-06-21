# BookHelper — Execution & Delivery Plan

## How we actually ship it: sequencing, teams, milestones, estimates, risks, and the metrics that prove it works

> **Capstone companion** to [ARCHITECTURE.md](ARCHITECTURE.md), [UX-DESIGN.md](UX-DESIGN.md), [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), [FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md). This turns the backlog into a delivery plan: *who builds what, in what order, to what definition of done, and how we know it's working.*
>
> **Kickoff anchor:** Month 0 = **July 2026**. Timeline is expressed in months from kickoff; calendar dates are illustrative. Durations assume the staffing ramp in §3. No implementation code.

---

## Table of Contents

1. [Execution Principles](#1-execution-principles)
2. [The Critical Path](#2-the-critical-path)
3. [Team Topology & Staffing Ramp](#3-team-topology--staffing-ramp)
4. [Milestones (R0–R5) with Exit Criteria](#4-milestones-r0r5-with-exit-criteria)
5. [Early-Phase Sprint Plan (R0–R1)](#5-early-phase-sprint-plan-r0r1)
6. [Estimation Model](#6-estimation-model)
7. [AI Quality & Evaluation Strategy](#7-ai-quality--evaluation-strategy)
8. [Quality Gates & Definition of Done](#8-quality-gates--definition-of-done)
9. [Success Metrics & KPIs](#9-success-metrics--kpis)
10. [Risk Register](#10-risk-register)
11. [Cost Model & Guardrails](#11-cost-model--guardrails)
12. [Decisions, ADRs & Cadence](#12-decisions-adrs--cadence)

---

## 1. Execution Principles

1. **Ship a coherent product at every milestone.** Each release (R0–R5) is independently demoable and lovable, not a half-built layer. We never ship "the database for a feature that doesn't exist yet."
2. **Dependency-driven sequencing, not feature-popularity.** The order is dictated by the dependency graph (FEATURE-BREAKDOWN cross-epic summary). Foundation and the AI gateway come first because everything imports them.
3. **The AI firewall is built before the first AI feature.** `ai-gateway` (E3) lands in R0 so no feature ever imports a model SDK — this is non-negotiable and cheap early, painful late.
4. **Vertical slices over horizontal layers.** We build "upload → read → ask a cited question" end-to-end early (R1) rather than perfecting ingestion before any reading exists. Each slice touches the full stack.
5. **Evals gate AI changes from day one.** The golden-question eval harness exists before grounded Q&A ships; citation accuracy and faithfulness are CI gates, not a later "quality pass."
6. **Reversible decisions move fast; irreversible ones get an ADR.** Vector DB, queue, auth provider are behind interfaces (move fast). Data model / tenancy / the gateway boundary get review.
7. **Measure activation relentlessly.** The R1 north-star (upload → first cited answer) is instrumented before launch; we optimize the funnel, not vanity metrics.
8. **Trust is a release gate.** No grounded-answer feature ships without the citation/provenance guarantee and prompt-injection defense (E17.F2) passing.

---

## 2. The Critical Path

The longest dependency chain that determines minimum time-to-R1 (first lovable product):

```
E1 Foundation ▶ E3 AI Gateway ▶ E4 Ingestion (parse→chunk→embed→index)
   ▶ E6 Reader ▶ E9 RAG (retrieve→rerank→generate→cite) ▶ R1 launch
                              ▲
            E17.F2 AI safety/eval harness (parallel, gates E9)
```

**Implications:**
- **E4 (ingestion) and E6 (reader) are the long poles.** Ingestion quality on messy real-world PDFs is the single biggest schedule risk (see §10 R-2). Reader rendering across formats is the second.
- **E3 must finish before E9 starts** — but E3 is small and front-loadable.
- **Search (E8) and Annotations (E7) parallelize** with the critical path once the Document Model (E4.F2) exists.
- **Knowledge Engine (E10) is off the R1 critical path** — it's the R2 differentiator and can be developed in parallel by a dedicated squad while R1 hardens.

Anything not on this chain (analytics, notifications, plugins, multi-platform) is scheduled to fill squad capacity, never to block R1.

---

## 3. Team Topology & Staffing Ramp

Organized as **stream-aligned squads** (Team Topologies) with a **platform squad** as the enabling foundation. Squads own epics end-to-end (design → build → eval → operate).

| Squad | Owns (Epics) | Core skills | R0 size → R3 size |
|---|---|---|---|
| **Platform** (enabling) | E1, E2, E3, E17 | Infra, TS backend, security, DevEx | 3 → 4 |
| **Ingestion & Knowledge** | E4, E10 | Python, ML, doc parsing, retrieval | 2 → 4 |
| **Reading** | E5, E6, E7, E16 | Frontend, reader rendering, offline/CRDT | 3 → 5 |
| **AI Experiences** | E9, E11, E12 | RAG, prompt/agent eng, full-stack | 2 → 5 |
| **Discovery & Insights** | E8, E13, E14 | Search, data/analytics, frontend | 0 → 3 |
| **Design & A11y guild** (cross-cutting) | DESIGN-SYSTEM, UX, a11y | Product design, design eng, a11y | 2 → 3 |

**Ramp:** Start lean (~12) through R0–R1, grow to ~24 by R3. Discovery & Insights squad spins up at R2. Hire ahead of need on the critical path (ingestion + reader). A dedicated **AI-eval owner** (within AI Experiences) from R1.

**Operating rhythm:** 2-week sprints; squad demos every sprint; cross-squad architecture review weekly; design review weekly; an on-call rotation per squad from R1.

---

## 4. Milestones (R0–R5) with Exit Criteria

```
Month:   0    1    2    3    4    5    6    7    8    9   10   11   12 ...
R0  ████                Foundations
R1       ██████████████ First lovable product (read + cited Q&A)
R2                      ████████████ Knowledge Engine (not-a-reader)
R3                                   ████████████ Tutor + Learning
R4                                                ██████████ Scale + ecosystem
R5                                                            ░░░ VYANA OS (deferred)
```

### R0 — Foundations · Months 0–1 · `[MUST]`
**Goal:** A developer can log in, upload a file, see it stored; one traced model call works through the gateway.
**Scope:** E1.F1–F4, E2.F1–F2, E3.F1, E17.F1.
**Exit criteria:**
- CI/CD with preview-per-PR and rollback operational; design-system core primitives + theming live.
- Auth (magic link + social + passkey) works; tenancy isolation provable by test.
- `ai-gateway` resolves a model and returns a streamed completion; lint blocks direct SDK imports.
- One end-to-end OTel trace spans request → model call with cost captured.

### R1 — First Lovable Product · Months 1–4 · `[MUST]`
**Goal:** *"Upload a book, read it beautifully, ask anything, get cited answers."* Private → public beta.
**Scope:** E4.F1–F4 (text formats), E5.F1–F2, E6.F1–F3, E7.F1–F2, E8.F1–F2, E9.F1–F3, E3.F2–F3, E17.F2.
**Exit criteria:**
- PDF + EPUB ingest end-to-end; reader restores position instantly; highlights/notes work offline-tolerant.
- Hybrid search + command palette functional.
- Grounded Q&A streams cited answers (first token < 1s p50); **citation-accuracy eval ≥ target gate**; "not in your sources" path verified.
- Cost-per-answer dashboard live; prompt-cache hit-rate non-zero on repeat.
- Beta cohort hits the **activation north-star** (§9) above threshold.

### R2 — Knowledge Engine · Months 4–7 · `[SHOULD]`
**Goal:** Demonstrably *not a reader* — library-wide knowledge.
**Scope:** E4.F2 (media: audio/video/web), E10.F1–F2, E8 (concept results), E13.F1–F2.
**Exit criteria:**
- Concepts/entities/claims extracted per document with provenance; dedup across sources.
- Knowledge Graph explorer + accessible list equivalent; "where have I read about X" works cross-source.
- Podcast/YouTube/article ingestion produces locatable transcripts.
- Dashboard + reading analytics live with accessible chart equivalents.

### R3 — Tutor + Learning · Months 7–10 · `[SHOULD]`
**Goal:** Personalized teaching that adapts to corpus + gaps; retention loop closed.
**Scope:** E11.F1–F2, E12.F1–F3, E6.F4 (TTS), E16.F1+F3 (offline desktop).
**Exit criteria:**
- Tutor agent loop with gated/audited tools; Socratic + explain-then-check strategies; cited dialogue.
- Flashcards (FSRS) + quizzes + mastery model; highlight/answer → card in one action.
- Desktop app reads/annotates/reviews fully offline and syncs on reconnect.
- Mastery model targets weak concepts in tutor + review queue.

### R4 — Scale + Ecosystem · Months 10–13 · `[COULD]`
**Goal:** Extensible, scalable platform with an ecosystem.
**Scope:** E15 (MCP plugins + connectors + import/export), E16.F2 (mobile), E11.F3 (deep research), E14 (notifications), scale-outs (Qdrant migration E4.F4, graph store E10.F2, ClickHouse E13.F2), K8s.
**Exit criteria:**
- MCP plugin system with scoped grants + sandbox; ≥2 first-party connectors (Readwise/Notion).
- Mobile app: read/highlight/review online+offline.
- Vector DB extracted to Qdrant at the scale trigger; analytics on ClickHouse.

### R5 — VYANA OS · Months 13+ · `[WON'T-NOW]`
**Goal:** Knowledge substrate of VYANA OS. **Deferred**; tracked so it isn't rediscovered late.
**Scope:** E18 (Knowledge API + MCP server, SSO/SCIM, embeddable surfaces).

---

## 5. Early-Phase Sprint Plan (R0–R1)

Sprint-level detail for the phases that are most actionable now. Later phases are planned at milestone granularity and decomposed as they approach.

### R0 (Months 0–1) — 2 sprints

| Sprint | Platform | Reading | Ingestion/AI |
|---|---|---|---|
| **S1** | Monorepo + CI/CD + preview envs; design-tokens + 4 core primitives | App shell, rail, topbar, theming | `ai-gateway` interface + Anthropic adapter (stream) |
| **S2** | Auth (magic link/social/passkey) + tenancy + RLS; OTel + LLM tracing | Library shell, command palette skeleton | Voyage embedding adapter; cost tagging stub; storage + presigned upload |

**R0 demo:** log in → upload a file → it lands in storage → a streamed model call shows in a trace with cost.

### R1 (Months 1–4) — 6 sprints

| Sprint | Theme | Headline deliverables |
|---|---|---|
| **S3** | Ingestion v1 | Pipeline orchestration (idempotent steps); PDF parse → Document Model + locators |
| **S4** | Ingestion v1 | EPUB parse; structure-aware chunking; batch embedding; dense + sparse indexing |
| **S5** | Reader | Renderer (text-first, lazy media), position restore, TOC, reading controls + themes |
| **S6** | Annotations + Search | Highlights (optimistic) + notes (local-first); hybrid search + jump-to-span |
| **S7** | RAG | Retrieval + rerank + context assembly + cached prefix; **eval harness + golden set** |
| **S8** | RAG + harden | Grounded streamed generation + citations + jump-to-source; confidence gating; beta polish, perf, a11y pass |

**R1 demo / beta gate:** upload PDF/EPUB → read → highlight → ask a question → receive a streamed, cited answer → jump to the source span. Activation funnel instrumented.

**Parallel track (Ingestion & Knowledge squad, from S5):** begin E10 extraction R&D against R1 documents so R2 starts warm.

---

## 6. Estimation Model

T-shirt sizing per feature → rough engineering-weeks (1 squad-week = ~3–4 eng working in parallel). Calibrated, not committed — re-estimated at sprint planning.

| Size | Eng-weeks | Example features |
|---|---|---|
| **S** | ≤ 1 | E7.F1 Highlights core, E8.F2 palette modes |
| **M** | 2–3 | E6.F2 reading controls, E9.F3 conversation mgmt |
| **L** | 4–6 | E4.F2 parsing+normalization, E6.F1 reader render, E9.F2 grounded generation |
| **XL** | 7–12 | E4 pipeline+chunk+embed+index (sum), E10.F2 graph, E11.F1 tutor loop |

**Rules:** anything **XL** is split before commitment; estimates include eval + a11y + tests in the Definition of Done (§8), not as add-ons; ingestion/parsing features carry a +30% uncertainty buffer (messy real-world inputs — see R-2).

---

## 7. AI Quality & Evaluation Strategy

AI quality is engineered, not hoped for. The eval harness (E17.F2) is a **release gate**, not a report.

**What we measure (per change to prompt/model/retrieval):**
| Metric | Definition | Gate |
|---|---|---|
| **Citation accuracy** | % of cited spans that actually support the claim | Regression blocks deploy |
| **Faithfulness/groundedness** | % of answer statements supported by retrieved context | Threshold gate |
| **Answer quality** | LLM-judge + human-rated on a golden set | Tracked; regression flagged |
| **Refusal correctness** | Correctly declines ungrounded questions ("not in sources") | Gate |
| **Retrieval recall@k** | % of questions whose answer span is in top-k retrieved | Tracked |
| **Latency** | First-token p50/p95 | SLO gate |
| **Cost/answer** | Tokens × price, post-cache | Budget gate |

**How:**
- **Golden sets** per surface (Q&A, tutor, quiz generation) with expected citations — curated from real beta documents, version-controlled.
- **CI eval** runs the golden set on every prompt/model/retrieval change; regressions block merge (per the Opus-4.8 code-review guidance: report-everything-then-filter, not conservative self-filtering).
- **Adversarial / red-team set** for prompt injection (E17.F2) — embedded-instruction documents that must not alter behavior.
- **Offline → online:** offline eval gates deploy; online A/B (feature-flagged prompt versions) confirms on real traffic with the same metrics + engagement.
- **Human-in-the-loop** review weekly on a sampled trace set (Langfuse/Helicone) for qualities evals miss.

---

## 8. Quality Gates & Definition of Done

A feature is **Done** only when all apply (enforced in CI + review):

- [ ] Meets its Acceptance Criteria (FEATURE-BREAKDOWN).
- [ ] All component states implemented in **both themes** (light/dark) per Atlas.
- [ ] **Accessibility:** keyboard-complete, screen-reader-labeled, WCAG 2.2 AA, reduced-motion honored (per surface a11y notes).
- [ ] **Tests:** unit + contract on every boundary; AI features pass the eval gate (§7).
- [ ] **Observability:** traced, with metrics + (for AI) cost/citation capture.
- [ ] **Security:** tenancy-isolated; inputs validated; no secret in logs/prompts; injection-safe for AI features.
- [ ] **Performance:** within the latency/motion budgets (UX-DESIGN App. B).
- [ ] **Empty / loading / error states** designed and implemented (no bare spinners, no blank "no data").
- [ ] **Docs:** API contract published; component in the catalog with states; ADR if a load-bearing decision changed.

**Release gate (per milestone):** exit criteria met + eval gates green + p95 SLOs met + security review + a11y audit + the milestone's KPI threshold (§9).

---

## 9. Success Metrics & KPIs

One **north-star per phase**, with guardrails so we don't optimize the star into a worse product.

| Phase | North-star | Supporting (drivers) | Guardrails (don't regress) |
|---|---|---|---|
| **R1** | **Activation:** % of new users who upload a doc **and** get ≥1 cited answer in session 1 | time-to-first-answer, answers/session, highlights/session | first-token latency p95, **citation accuracy**, cost/active user |
| **R2** | **Engagement depth:** % of users who view a cross-source connection / use the graph weekly | concepts surfaced/user, multi-doc questions | ingestion success rate, extraction precision, cost/document |
| **R3** | **Retention via learning:** D30 retention of users with an active review queue | reviews completed/week, quiz attempts, mastery growth | review-loop latency, schedule adherence, false-mastery rate |
| **R4** | **Platform stickiness:** weekly active across ≥2 surfaces; plugins installed | connector imports, mobile DAU, deep-research runs | scale SLOs (search/graph latency), cost/active user |

**Product-wide guardrails (always-on):**
- **Trust:** citation accuracy ≥ gate; ungrounded-answer rate ≈ 0 (every answer cited or explicitly "not in sources").
- **Speed:** reader open instant (cached); first AI token p95 within SLO.
- **Cost:** cost-per-active-user within target; cache hit-rate above floor.
- **Reliability:** reading + annotation available even when AI/retrieval degrade (graceful degradation).

**Counter-metrics (watch for gaming):** answers/session up but citation accuracy down = bad; reviews up but D30 flat = busywork.

---

## 10. Risk Register

| ID | Risk | Likelihood / Impact | Mitigation | Owner |
|---|---|---|---|---|
| **R-1** | **Model cost overruns** at scale | Med / High | Cost as first-class metric (E3.F3); prompt caching + Batch API + task-based routing (Haiku→Fable); per-tier budgets + alerts; cost-per-answer gate | Platform |
| **R-2** | **Ingestion quality on messy/scanned PDFs** (the #1 schedule risk) | High / High | +30% estimate buffer; OCR fallback; structure-aware parsing; quality eval on a corpus of "hard" PDFs; readable-while-enriching UX so users aren't blocked | Ingestion |
| **R-3** | **RAG hallucination / wrong citations** erode trust | Med / High | Citation-accuracy + faithfulness eval gates; confidence-gated "not in sources"; provenance binding; human-in-loop review | AI Experiences |
| **R-4** | **Vector/graph scale** (latency/cost as corpus grows) | Med / Med | pgvector→Qdrant behind interface with a defined trigger; tenant sharding in the model from day one; graph store swap path | Platform/Ingestion |
| **R-5** | **Prompt injection** via document/web content | Med / High | Untrusted-content wrapping; system-channel operator instructions; red-team eval set; tool gating | AI Experiences/Security |
| **R-6** | **Scope creep** (the product wants to be everything) | High / Med | MoSCoW discipline; explicit Won't-Now list; milestone exit criteria; "coherent product per release" rule | All leads |
| **R-7** | **Offline sync conflicts** (multi-device annotations) | Med / Med | CRDT (Yjs) for annotations; idempotent mutation replay; LWW+max-position for progress; conflict tests | Reading |
| **R-8** | **Vendor/model lock-in** | Low / Med | `ai-gateway` abstraction; pluggable adapters; model IDs from config | Platform |
| **R-9** | **Latency SLO misses** (perceived slowness) | Med / High | Optimistic UI, local-first, streaming, skeletons; latency budgets in DoD; pre-warm caches | All |
| **R-10** | **Hiring on the critical path** (ingestion/reader) | Med / High | Hire ahead of need; contract specialists for OCR/parsing if needed; keep critical path on senior staff | Eng leadership |
| **R-11** | **Eval-set rot / overfitting to golden questions** | Med / Med | Rotate/expand golden sets from real traffic; hold-out set; online A/B confirmation; human review | AI-eval owner |

---

## 11. Cost Model & Guardrails

The two cost centers are **model tokens** and **storage/compute**. Both are budgeted and instrumented from R0.

**Token-cost levers (in priority order):**
1. **Prompt caching** — cache system prompt + per-doc context (reads ~0.1×). Primary lever.
2. **Task-based routing** — Haiku for classify/route, Sonnet for high-volume RAG, Opus for tutor, Fable only for hardest research.
3. **Batch API (50%)** — all non-interactive ingestion enrichment.
4. **Semantic answer cache** — dedupe repeated questions per scope.
5. **Effort tuning** — `low/medium` for routine RAG, `high/xhigh` only where quality demands.

**Budget discipline:** cost-per-active-user is a tracked KPI with an alert; per-tier quotas with graceful degradation; ingestion enrichment cost-per-document tracked and capped. A spend anomaly pages the platform on-call.

**Storage:** raw blobs lifecycle-tiered (hot→IA); derived artifacts regenerable; vectors the main growth driver (trigger Qdrant migration at the defined index-size/QPS threshold).

---

## 12. Decisions, ADRs & Cadence

**Open ADRs to resolve early (from ARCHITECTURE App. B + new):**
1. tRPC vs. pure REST for the web BFF — *resolve before R1 S5.*
2. Drizzle vs. Prisma — *resolve before R1 S3 (blocks schema).*
3. Vector-DB extraction trigger (index size / QPS) — *define metric in R1, execute in R4.*
4. Self-hosted agent loop vs. Managed Agents for the tutor — *resolve before R3.*
5. FSRS vs. SM-2 default — *resolve before R3.*
6. Queue: Redis Streams → NATS/Kafka trigger — *define in R1, revisit at R4 scale.*

**Cadence:**
- **Sprint** (2 wks): planning, demo, retro per squad.
- **Weekly:** cross-squad architecture review; design review; AI-eval review.
- **Per milestone:** release gate (§8), KPI review (§9), risk-register review (§10), roadmap re-forecast.
- **ADRs** live in `docs/adr/`; load-bearing changes (schema, tenancy, gateway boundary, AI-quality gates) require an ADR before merge.

---

## What this plan deliberately does **not** commit to yet

- Calendar dates beyond directional months (re-forecast each milestone from actual velocity).
- Exact headcount per hire (ramp shape is fixed; individual reqs follow the critical path).
- R4/R5 sprint-level detail (decomposed as they approach — planning at the last responsible moment).
- VYANA OS (R5) scope — intentionally deferred; the integration seams (Knowledge API, MCP, SSO) are kept warm via E10/E15.

---

*End of Execution & Delivery Plan v1. This is the operating document — re-forecast at every milestone gate against actual velocity and the KPI dashboard. The five documents together (Architecture · UX · Design System · Feature Breakdown · Roadmap) form the complete product specification for a team of senior engineers to build from.*
