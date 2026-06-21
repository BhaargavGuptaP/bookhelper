# BookHelper — Knowledge Engine: Architecture Specification

> **Deep-dive companion** to [ARCHITECTURE.md](ARCHITECTURE.md) (§8), [FEATURE-BREAKDOWN.md](FEATURE-BREAKDOWN.md) (E10), [READER-SPEC.md](READER-SPEC.md) (Document Model §3, Locators §4), [AI-ENGINE-SPEC.md](AI-ENGINE-SPEC.md) (structured outputs §10, embeddings §11, batch §14).
>
> **What it is:** the system that turns every ingested document into structured, cross-linked, queryable knowledge. It is the layer that makes BookHelper *not a reader and not a chatbot* — the compounding moat (ARCHITECTURE §1.5).
>
> **Design only.** Artifact schemas as field tables, the pipeline as staged phases, extraction passes described as contracts. No implementation code.

Every uploaded document automatically yields eleven knowledge products, unified into one graph:

> **Concepts · Entities · Relationships · Definitions · Quotes · Frameworks · Action Items · Skills · Vocabulary · Timeline · Knowledge Graph**

---

## Table of Contents

1. [Goals & Principles](#1-goals--principles)
2. [Where It Sits](#2-where-it-sits)
3. [The Knowledge Artifacts](#3-the-knowledge-artifacts)
4. [Node & Record Taxonomy](#4-node--record-taxonomy)
5. [Genre-Adaptive Extraction](#5-genre-adaptive-extraction)
6. [The Processing Pipeline](#6-the-processing-pipeline)
7. [Extraction Architecture (multi-pass map-reduce)](#7-extraction-architecture-multi-pass-map-reduce)
8. [Resolution, Dedup & Linking](#8-resolution-dedup--linking)
9. [Relationship & Structure Inference](#9-relationship--structure-inference)
10. [Verification & Quality](#10-verification--quality)
11. [The Knowledge Graph](#11-the-knowledge-graph)
12. [Provenance Model](#12-provenance-model)
13. [Incremental & Cross-Corpus Processing](#13-incremental--cross-corpus-processing)
14. [Cost, Performance & Idempotency](#14-cost-performance--idempotency)
15. [Downstream Consumers](#15-downstream-consumers)
16. [Edge Cases](#16-edge-cases)
17. [Module Structure & Contracts](#17-module-structure--contracts)

---

## 1. Goals & Principles

1. **Automatic & comprehensive.** Upload → the eleven artifacts appear without the user lifting a finger. Extraction is a background pipeline, not a feature the user invokes.
2. **Provenance is mandatory.** Nothing exists in the graph without a source — every node, edge, definition, quote, and timeline event traces to an exact locator (Reader §4). "Where did I read this?" is always answerable. This is the trust contract.
3. **Cross-source by design.** A concept extracted from book A is the *same node* as in paper B. The value compounds with corpus size; dedup/linking is not optional polish — it is the product.
4. **Genre-adaptive.** A history book yields a rich Timeline; a business book yields Frameworks and Action Items; a textbook yields Vocabulary and prerequisite chains. The pipeline tunes extraction to the document's genre rather than forcing all eleven equally on every doc.
5. **Verified, not just generated.** Every artifact is grounded-checked against its source span before it enters the graph. Hallucinated knowledge is worse than no knowledge.
6. **Idempotent & versioned.** Same document + same extractor versions → same result, no rework. Extractor version bumps reprocess only what changed (mirrors ingestion, E4).
7. **Per-user private, canonically linked.** Each user's graph is theirs alone; nodes attach to a shared *canonical backbone* of well-known concepts/entities for cross-user features later — without exposing any user's content.
8. **Cost-aware.** Extraction is the platform's largest non-interactive LLM workload → routed through the Batch API (≈50% off) with caching and incremental reprocessing.

---

## 2. Where It Sits

The Knowledge Engine is the **ENRICH + GRAPH** stages of the ingestion pipeline (ARCHITECTURE §9.1, E4). It consumes ingestion outputs and produces graph + artifact read-models.

```
INGESTION (E4)                          KNOWLEDGE ENGINE (this doc)        CONSUMERS
─────────────                          ──────────────────────────         ─────────
parse → normalize → chunk → embed ──▶  classify → extract → resolve  ──▶   Reader overlays
   │                          │         → infer → verify → materialize     Graph explorer
   ▼                          ▼              │                              Tutor / Quizzes
Document Model           chunk vectors       ▼                              Flashcards / Vocab
+ hierarchical summaries  + indexes      Knowledge Graph + artifact          Search (concepts)
                                          read-models + provenance           Analytics / Timeline
```

**Inputs it requires** (the contract from ingestion):
- The **Document Model** (blocks, normalized text, stable `blockId`s, locators — Reader §3).
- **Chunks + embeddings** (AI Engine §11).
- **Hierarchical summaries** (document / chapter / section).

**Outputs it produces:**
- The **Knowledge Graph** (nodes + edges, per-user, provenance-bound).
- **Artifact read-models** (concept lists, glossary, quotes, frameworks, action items, vocabulary decks, timeline) — denormalized views the UI reads directly.
- **Events** (`knowledge.extracted`, `concept.linked`, `contradiction.detected`) for downstream features.

All model calls go through the **AI Engine** (provider-independent; structured outputs, batch, embeddings, verification). The Knowledge Engine never imports a model SDK.

---

## 3. The Knowledge Artifacts

Each artifact: definition · key fields · how it's extracted · provenance. (Full graph modeling in §4; schema summary in §11.)

### 3.1 Concepts
*Normalized ideas/topics the document discusses — the backbone of the graph.*
| Field | Notes |
|---|---|
| `name` (canonical), `aliases[]` | normalized; deduped across corpus |
| `kind` | topic · theory · principle · method · phenomenon |
| `description` | 1–2 sentence neutral summary (generated) |
| `salience` | importance score within the doc (frequency × centrality × prominence in summaries) |
| `embedding` | for semantic dedup/linking/search |
| `canonicalId?` | link to shared canonical concept |
| `provenance[]` | every passage where it appears |
**Extraction:** map pass over chunks (structured output) → candidate concepts; reduced + deduped (§8); salience from cross-doc frequency + summary prominence.

### 3.2 Entities
*Named things: people, organizations, places, works, products, events, domain terms.*
| Field | Notes |
|---|---|
| `name`, `aliases[]` | surface forms |
| `type` | person · org · place · work · product · event · term |
| `description` | generated, source-grounded |
| `externalRefs?` | Wikidata/DOI/ISBN where confidently resolvable |
| `embedding`, `provenance[]` | |
**Extraction:** NER pass (structured output) + **entity linking/resolution** (§8) to merge surface forms ("Kahneman", "Daniel Kahneman", "the author") into one entity.

### 3.3 Relationships
*Typed, directed edges between any nodes — the graph's connective tissue.*
| Field | Notes |
|---|---|
| `srcId`, `dstId`, `type` | see edge taxonomy §11 (prerequisite_of, supports, contradicts, part_of, causes, defines, example_of, mentions, influenced_by, related_to …) |
| `directed` | bool |
| `confidence`, `weight` | |
| `evidence` | locator + quote supporting the relation |
**Extraction:** inferred (§9) from co-occurrence, explicit statements, claim analysis, and cross-document comparison — not a simple per-chunk pass.

### 3.4 Definitions
*Term → meaning pairs as stated in the source — a per-document and cross-corpus glossary.*
| Field | Notes |
|---|---|
| `term`, `definition` | the definition as the source gives it |
| `conceptId?` / `entityId?` | linked node (term-as-concept) |
| `sourceLocator`, `quote` | exact span |
| `confidence` | |
**Extraction:** definition-detection pass (structured output), preferring explicit "X is/means…" statements; multiple definitions of one term reconciled (§8), best-ranked, all retained with provenance.

### 3.5 Quotes
*Notable, quotable, or thesis-bearing passages — verbatim, attributed, locatable.*
| Field | Notes |
|---|---|
| `text` | **verbatim** (exact span; never paraphrased) |
| `attribution?` | speaker/author if not the document author |
| `theme` | why it's notable (1 phrase) |
| `conceptIds[]`, `locator` | |
**Extraction:** salience pass scoring passages for quotability (rhetorical weight, thesis statements, memorable phrasing); verbatim text pulled from the Document Model span (not regenerated → no hallucinated quotes).

### 3.6 Frameworks
*Structured mental models / methodologies / step-processes / matrices the document teaches.*
| Field | Notes |
|---|---|
| `name`, `kind` | process · model · matrix · principle-set · checklist |
| `description` | what it's for |
| `components[]` | ordered or typed parts, each `{label, description, locator}` |
| `conceptIds[]`, `provenance` | |
**Extraction:** a dedicated structured pass that recognizes enumerated/step/component structures and named models, assembling scattered mentions into one coherent framework node (§9). Examples it captures: a numbered methodology, a 2×2 matrix, a set of principles, a decision checklist.

### 3.7 Action Items
*Applicable takeaways — practices, habits, experiments, or decisions the reader could act on.*
| Field | Notes |
|---|---|
| `text` | actionable, imperative phrasing |
| `category` | practice · habit · experiment · decision · rule |
| `difficulty?`, `conceptIds[]` | |
| `sourceLocator` | |
**Extraction:** actionability pass over chunks + chapter summaries (structured output), filtered to genuinely actionable items (not generic advice); feeds the "apply what you read" surfaces and study plans.

### 3.8 Skills
*Competencies the document develops — mapped to a canonical skill taxonomy; feed the mastery model.*
| Field | Notes |
|---|---|
| `name`, `taxonomyRef` | canonical skill node |
| `level` | intro · intermediate · advanced |
| `relatedConceptIds[]` | concepts that compose the skill |
| `developedBy` | this document (+ degree) |
**Extraction:** mapping pass — concepts + frameworks + action items → skills via the canonical skill taxonomy (semantic match + LLM classification); links into the learning system so the tutor/mastery model can target skill gaps (E12).

### 3.9 Vocabulary
*Domain terms worth learning — the learning-oriented subset of terms, sized for spaced repetition.*
| Field | Notes |
|---|---|
| `term`, `definition` | learner-facing definition |
| `partOfSpeech?`, `domain` | |
| `difficulty` | for SR scheduling/ordering |
| `exampleUsage` | locator + quote from the doc |
| `flashcardCandidate` | bool — eligible for auto-generated cards |
| `conceptId?` | |
**Extraction:** vocabulary pass identifying domain-specific/technical/jargon terms (vs. common words), with difficulty scoring; overlaps Definitions but is *learning-targeted* (becomes flashcard/quiz fodder, E12). Deduped against the user's already-known vocabulary (mastery model) to avoid re-teaching.

### 3.10 Timeline
*Chronology of events — dates → events, normalized and ordered.*
| Field | Notes |
|---|---|
| `date` | normalized: point · range · fuzzy · relative (resolved where possible) |
| `label`, `description` | |
| `entityIds[]`, `conceptIds[]` | who/what |
| `certainty` | exact · approximate · inferred |
| `locator` | |
**Extraction:** temporal pass extracting date/event pairs; **date normalization** (ISO; resolve "three years later", "the following spring", century/era references, BCE/CE); ordered into a chronology; most valuable for history/biography/narrative genres (§5).

### 3.11 Knowledge Graph
*The unifying structure into which all of the above resolve — nodes + typed edges + provenance, per-user, canonically linked.* Detailed in §11.

---

## 4. Node & Record Taxonomy

A deliberate split: some artifacts are **first-class graph nodes** (they participate in traversal and relationships); others are **knowledge records** attached to nodes (queryable, render in views, carry provenance, but lighter than full nodes). This keeps the graph traversable without exploding it.

| Artifact | Modeled as | Anchored to |
|---|---|---|
| Concept | **Node** | — |
| Entity | **Node** | — |
| Claim *(implicit; supports relationships)* | **Node** | — |
| Framework | **Node** | concepts (has_component → component records) |
| Skill | **Node** | canonical skill taxonomy |
| TimelineEvent | **Node** (temporal) | entities/concepts |
| Document / Passage | **Anchor Node** | the source (provenance root) |
| Relationship | **Edge** | connects two nodes |
| Definition | **Record** | attaches to a Concept/Term node |
| Quote | **Record** | attaches to a Passage + Concepts |
| Action Item | **Record** | attaches to Concept/Skill |
| Vocabulary term | **Record** (+ flashcard link) | attaches to a Term/Concept node |

Every node and record carries provenance (§12). Records are first-class in *views* (glossary, quotes panel, vocab deck) and reachable from their anchor nodes in the graph.

---

## 5. Genre-Adaptive Extraction

Not every document yields all eleven artifacts equally. A **genre classifier** (cheap-model pass on the doc summary + structure) routes the document to a tuned extraction profile, controlling which passes run at what depth. This raises quality and cuts cost (no forcing a Timeline onto a self-help book).

**Extraction-emphasis matrix** (● primary · ◐ secondary · ○ light/skip):

| Genre | Concepts | Entities | Reln | Defs | Quotes | Frameworks | Actions | Skills | Vocab | Timeline |
|---|---|---|---|---|---|---|---|---|---|---|
| Textbook / educational | ● | ◐ | ● | ● | ◐ | ◐ | ○ | ● | ● | ○ |
| Research paper | ● | ● | ● | ● | ◐ | ◐ | ○ | ◐ | ◐ | ○ |
| Business / self-help | ● | ◐ | ◐ | ◐ | ● | ● | ● | ● | ◐ | ○ |
| History / biography | ◐ | ● | ● | ◐ | ● | ○ | ○ | ○ | ◐ | ● |
| Technical / reference | ● | ◐ | ◐ | ● | ○ | ◐ | ◐ | ● | ● | ○ |
| Narrative / fiction | ◐ | ● | ● | ○ | ● | ○ | ○ | ○ | ◐ | ◐ |
| Article / essay | ● | ◐ | ◐ | ◐ | ● | ◐ | ◐ | ○ | ◐ | ○ |

The profile is a default; users can request a full extraction, and the classifier's choice is recorded for transparency. Genre is multi-label (a doc can be "history + biography").

---

## 6. The Processing Pipeline

Seven phases. Each is **idempotent, versioned, resumable** (keyed by `content_hash + phase + phase_version`), consistent with ingestion (E4.F1). Bulk extraction runs through the **Batch API**.

```
A. PREPARE     ┌─ inputs ready: Document Model, chunks+embeddings, summaries
   classify    └─ genre classification → extraction profile (§5)

B. EXTRACT     ┌─ map over chunks (parallel, batched): grouped structured-output
   (map)       │  passes produce CANDIDATE artifacts per chunk, each with locator
               └─ + doc/chapter-level passes (frameworks, action items, timeline)

C. RESOLVE     ┌─ reduce candidates: dedup within doc; entity/concept resolution;
   (reduce)    │  link to user's existing graph + canonical backbone (§8)
               └─ definition/vocabulary reconciliation

D. INFER       ┌─ relationships (co-occurrence, claims, explicit, cross-doc) (§9)
   (structure) │  framework assembly · timeline ordering · skill mapping
               └─ prerequisite chains · contradiction candidates

E. VERIFY      ┌─ ground every artifact against its source span (faithfulness)
   (quality)   │  drop/flag unsupported; confidence scoring; conflict detection (§10)

F. MATERIALIZE ┌─ upsert nodes/edges + records with provenance into the graph
   (graph)     │  attach node embeddings; build artifact read-models; index
               └─ mark document knowledge-ready; emit knowledge.* events

G. CROSS-CORPUS┌─ link new nodes to the rest of the corpus; recompute cross-source
   (continuous)│  relationships; surface connections (whispers) & contradictions (§13)
               └─ (runs on new-doc arrival + on schedule)
```

### Phase detail

**A. PREPARE & CLASSIFY** — confirm inputs exist; run the genre classifier (cheap model, on the doc summary + TOC + sample) → extraction profile; build the worklist of passes to run.

**B. EXTRACT (map)** — the heavy, parallel, batched phase. Two granularities:
- *Chunk-level passes* (map over chunks with section context): concepts/entities/definitions/quotes/vocabulary/timeline-events. Grouped into a few structured-output passes for cost (§7).
- *Document/chapter-level passes*: frameworks, action items, skills, and salience scoring — these need broader context than a single chunk, so they run over hierarchical summaries + relevant chunk windows.
Output: typed **candidates**, each carrying source locator(s), confidence, and originating chunk.

**C. RESOLVE (reduce)** — collapse candidates into canonical artifacts: intra-document dedup → link against the user's existing graph → link to the canonical backbone (§8). Definitions/vocabulary reconciled. This is where "the same concept across sources" becomes one node.

**D. INFER (structure)** — derive what isn't stated atomically: typed relationships, prerequisite ordering, framework assembly from scattered parts, timeline ordering with normalized dates, and skill mapping. Includes cross-document relationship candidates (§9).

**E. VERIFY (quality)** — each artifact is checked against its cited span (does the source support it?); unsupported/low-confidence artifacts are dropped or flagged; contradictions against existing knowledge are detected (§10). Quality gate before anything is written.

**F. MATERIALIZE (graph)** — upsert verified nodes/edges/records with provenance; attach node embeddings (semantic node search); build denormalized read-models for the UI; index; mark the document knowledge-ready; emit events.

**G. CROSS-CORPUS (continuous)** — the compounding step: link this document's new nodes into the existing graph, recompute cross-source relationships, and surface new connections/contradictions. Runs on each new document and on a schedule as the corpus grows (§13).

---

## 7. Extraction Architecture (multi-pass map-reduce)

A single LLM pass cannot reliably produce eleven high-quality artifact types. The engine uses a **staged, multi-pass map-reduce** with structured outputs.

**Pass grouping (cost-quality balance):** related extractions that share context are grouped into one structured-output call to avoid re-reading the same chunk many times:
- **Pass 1 (per chunk):** concepts + entities + definitions + vocabulary candidates (one structured schema).
- **Pass 2 (per chunk):** quotes + claims + timeline-event candidates.
- **Pass 3 (per chapter/summary):** frameworks + action items + skills (needs broader context).
- **Pass 4 (global/reduce):** relationships + prerequisite inference + cross-doc candidates.
- **Pass 5 (per artifact, sampled/high-value):** verification (§10).

**Map-reduce mechanics:**
- **Map:** passes 1–2 fan out over chunks in parallel via the Batch API (≈50% off); pass 3 over chapters. Section context is prepended (cached prefix) so chunk extraction isn't context-blind.
- **Reduce:** candidates aggregated per document, then resolved (§8) and structured (§9).
- **Structured outputs everywhere:** each pass emits a validated JSON-Schema object (AI Engine §10) — no free-text parsing; schema-invalid → bounded repair/retry.
- **Prompt caching:** the genre-tuned extraction instructions + the document/section context form a cached prefix across the document's many chunk calls (AI Engine §18) — large savings on this fan-out.
- **Model routing:** cheap-fast model for high-volume per-chunk extraction; mid/strong model for reduce/inference/verification (AI Engine §13). Hardest cross-corpus synthesis can escalate to a frontier model.

---

## 8. Resolution, Dedup & Linking

The step that makes the graph cross-source rather than a pile of per-document fragments.

**Three resolution scopes, in order:**
1. **Intra-document dedup:** cluster candidate concepts/entities by embedding similarity + normalized name; merge, union provenance, keep best description.
2. **User-graph linking:** match document candidates against the user's existing nodes (vector nearest-neighbor + canonical-name match + LLM disambiguation for ambiguous cases). Match → attach new provenance to the existing node (the concept now spans two sources). No match → new node.
3. **Canonical-backbone linking:** attach the user's node to a shared canonical concept/entity (and external KB refs where confident — Wikidata/DOI). Enables cross-user features later *without* sharing any user's content (only the canonical link is shared, never the user's passages).

**Entity resolution specifics:** coreference within a document ("the author", "she", "Kahneman") resolved to one entity; surface-form variants merged; type conflicts (is "Apple" a company or fruit?) disambiguated by context.

**Reconciliation:** multiple definitions of one term → all retained with provenance, ranked (explicitness, source authority, recency); the canonical definition is the top-ranked. Vocabulary deduped against the user's known terms (mastery model) so the system doesn't re-teach.

**Confidence & ambiguity:** uncertain merges are flagged, not forced; a low-confidence link is kept separate with a "possibly same as" soft edge that a later pass (or user) can confirm — avoids the classic over-merging failure that corrupts graphs.

---

## 9. Relationship & Structure Inference

Deriving structure that isn't stated atomically.

**Relationship inference (edges):**
- **Explicit:** "X causes Y", "A is a type of B", "this builds on…" → typed edges with the sentence as evidence.
- **Co-occurrence:** concepts repeatedly appearing together → `related_to` (weighted by frequency/proximity).
- **Claim-based:** claims that agree/disagree → `supports`/`contradicts` edges (within and across documents).
- **Prerequisite inference:** ordering signals (a concept defined before it's used; "you'll need to understand X first") → `prerequisite_of` chains — powers the tutor's sequencing and "what to learn before X".
- **Cross-document:** the same concept's neighborhoods across sources merged; contradictory claims across sources surfaced.

**Framework assembly:** scattered mentions of a model's parts (across chunks) are clustered into one Framework node with ordered/typed `components`; named models are recognized and consolidated.

**Timeline ordering:** extracted date/event pairs are date-normalized (point/range/fuzzy/relative; era/BCE-CE; relative→absolute where resolvable), de-duplicated, and totally ordered into a chronology; uncertain dates carry `certainty: approximate|inferred`.

**Skill mapping:** concepts + frameworks + action items mapped to canonical skill nodes (semantic match + classification) → the skills a document develops, with level — fed to the mastery model (E12).

---

## 10. Verification & Quality

Generation without verification corrupts the moat. Every artifact passes a quality gate before materialization.

- **Grounding/faithfulness check:** each artifact (definition, claim, framework component, timeline event, etc.) is verified against its cited span — does the source actually support it? Reuses the AI Engine's grounding guard (AI-ENGINE §17). Unsupported → dropped; weakly supported → flagged low-confidence.
- **Verbatim guarantee for quotes:** quotes are pulled from the Document Model span, never regenerated → zero fabricated quotes by construction.
- **Adversarial verification (high-value/uncertain artifacts):** a second independent pass attempts to refute the extraction; survives only if not refuted (used selectively for cost).
- **Contradiction/conflict detection:** new claims compared against the existing graph; genuine contradictions become `contradicts` edges and feed the "these sources disagree" feature (a *feature*, not an error).
- **Confidence scoring:** every node/edge/record carries a confidence; low-confidence items are materialized but visually de-emphasized and excluded from high-stakes uses (e.g., quiz generation) until corroborated.
- **Eval harness (CI):** a golden corpus with expected concepts/entities/relations measures extraction precision/recall and linking accuracy; regressions gate extractor/prompt changes (ROADMAP §7).

---

## 11. The Knowledge Graph

### 11.1 Node model
| Field | Notes |
|---|---|
| `id`, `ownerId` | per-user isolation |
| `nodeType` | concept · entity · claim · framework · skill · timeline_event · document · passage |
| `name`, `aliases[]`, `description` | |
| `props` (jsonb) | type-specific (e.g., framework components, entity type, event date) |
| `embedding` | semantic node search + linking |
| `canonicalId?` | shared backbone link |
| `salience`, `confidence` | ranking + quality |
| `provenance[]` | §12 |

### 11.2 Edge model
| Field | Notes |
|---|---|
| `id`, `ownerId`, `srcId`, `dstId` | |
| `edgeType` | structural: `part_of`, `has_component`, `defined_in` · semantic: `related_to`, `prerequisite_of`, `example_of`, `causes`, `influenced_by` · epistemic: `supports`, `contradicts`, `refines` · authorship: `authored_by`, `mentions` · temporal: `precedes`, `during` |
| `directed`, `weight`, `confidence` | |
| `evidence` | locator + quote |

### 11.3 Storage & query
- **Start:** Postgres `kg_nodes`/`kg_edges` (jsonb props) + `pgvector` on nodes; shallow traversals via recursive CTEs (ARCHITECTURE §8.3, §12).
- **Scale:** dedicated graph store (Neo4j / Postgres+AGE) behind the graph-repository interface when traversal depth/volume outgrows CTEs — contained migration.
- **Query surface:** semantic node search (vector), neighborhood/traversal (k-hop), path queries (prerequisite chains), filtered subgraphs (by type/doc/time), and "concept → all sources" (provenance fan-out). These power the graph explorer and the tutor's graph-scoped retrieval (E10.F2, E11).

### 11.4 Per-user vs canonical
- **Per-user graph:** private; the only graph a user sees; grows monotonically with their corpus.
- **Canonical backbone:** a shared ontology of well-known concepts/entities that user nodes *link to* (not merge into). Enables future cross-user/discovery features and better linking — never exposes a user's content or passages.

---

## 12. Provenance Model

Every node, edge, and record points back to its source — the trust spine.

| Provenance field | Notes |
|---|---|
| `documentId` | source document |
| `locator` | exact span (Reader §4 universal locator) |
| `quote` | the supporting text (for verification + display) |
| `confidence` | extraction confidence for this evidence |
| `extractorVersion` | which pass/version produced it |

- A node accumulates **multiple provenances** as it appears across sources (the cross-source value).
- "Jump to source" from any artifact resolves the locator into the Reader (Reader §7.3).
- On document re-ingestion (version bump), provenances re-anchor via the locator cascade (Reader §4.3); orphaned provenance surfaces for review, never silently dropped.
- Provenance is what lets the platform *never* show an unsourced claim.

---

## 13. Incremental & Cross-Corpus Processing

The graph is alive, not a one-shot per document.

- **New document arrival:** after its Phase F, a **cross-corpus linking pass** (Phase G) attaches its new nodes to the existing graph (resolution §8 against the whole corpus), creates cross-source relationships, and recomputes affected neighborhoods — so book #20 immediately connects to books #1–19.
- **Connection surfacing (whispers):** newly discovered cross-source links feed the proactive-intelligence layer ("You read about this 3 months ago — connect it?", UX §1, E14) — one at a time, calm.
- **Contradiction surfacing:** new `contradicts` edges across sources power "these two disagree about Y".
- **Re-extraction triggers:** document `docVersion` bump (re-ingest) → re-run affected phases for that doc; **extractor version bump** → targeted reprocessing of just that artifact type across the corpus (idempotent — only changed phases re-run).
- **Scheduled synthesis:** periodic recompute of cross-corpus relationships and salience as the corpus + the user's mastery evolve.

---

## 14. Cost, Performance & Idempotency

- **Batch API (≈50% off)** for all map-phase extraction — the dominant cost, and non-interactive.
- **Prompt caching** of genre-tuned instructions + document/section context across the chunk fan-out (AI Engine §18).
- **Tiered routing:** cheap-fast model for per-chunk extraction; stronger models only for reduce/inference/verification; frontier only for hardest cross-corpus synthesis (AI Engine §13).
- **Embedding reuse:** dedup/linking reuses the ingestion embeddings (no re-embedding) (AI Engine §11).
- **Idempotency & versioning:** keyed by `(content_hash, phase, phase_version)`; re-running an unchanged doc does nothing; a version bump reprocesses only the affected phase + downstream — controlled, cheap reprocessing.
- **Incremental over full:** cross-corpus linking touches only affected neighborhoods, not the whole graph.
- **Performance posture:** extraction is async/background (the user reads immediately while knowledge "finishes building" — Reader §5.2, Library status E5.F1); knowledge-ready is signaled when Phase F completes. Cost-per-document is metered (AI Engine §19) and capped per tier.

---

## 15. Downstream Consumers

The artifacts are not an end in themselves — they power the product:

| Artifact | Powers |
|---|---|
| Concepts + Graph | Graph explorer; "where have I read about X"; tutor graph-scoped retrieval; concept search results (E8) |
| Relationships | Prerequisite sequencing (tutor), contradiction surfacing, related-reading |
| Definitions + Vocabulary | In-reader define popover; auto-glossary; **flashcard/quiz generation** (E12) |
| Quotes | Reader highlights suggestions, shareable excerpts, "best of this book" |
| Frameworks | Tutor teaching units; study-plan modules; framework cards |
| Action Items | "Apply what you read" surfaces; study plans (E11) |
| Skills + (mastery) | Tutor targeting; skill-gap recommendations; analytics (E12, E13) |
| Timeline | Timeline view; history/biography navigation; temporal context for the tutor |
| Provenance | The universal "jump to source"; the trust guarantee across every feature |

---

## 16. Edge Cases

- **Thin/short documents (TXT note, single article):** run a reduced profile; produce few artifacts gracefully; never fabricate to "fill" the eleven categories.
- **Genre ambiguity / multi-genre:** multi-label genre; union of relevant profiles; transparency about what was emphasized.
- **Non-English / mixed-language:** extraction in source language; canonical concepts language-agnostic via embeddings; entity linking cross-language where confident.
- **Dense reference works (dictionaries, encyclopedias):** vocabulary/definition-heavy; cap artifact volume per document to avoid graph bloat; sample + rank.
- **Fiction/narrative:** entities (characters) + relationships + timeline + quotes emphasized; concepts/skills light; avoid forcing "action items".
- **Over-extraction (everything looks like a concept):** salience thresholds + dedup + verification prune noise; per-document caps with ranking keep the graph signal-rich.
- **Bad merges / over-linking:** confidence-gated linking + "possibly same as" soft edges + user-correctable merges prevent graph corruption (the worst failure mode).
- **Contradictions within one document:** captured as intra-doc `contradicts` (authors do contradict themselves) rather than discarded.
- **Re-ingestion churn:** version-keyed idempotency; locator re-anchoring; orphan review — knowledge survives document edits.
- **Ambiguous/relative dates:** normalized with `certainty`; unresolvable dates kept as fuzzy timeline entries, not dropped.
- **Scanned/OCR'd source:** extraction waits for OCR (E4); lower OCR confidence propagates to artifact confidence.
- **PII/sensitive content:** entity extraction respects privacy policy (AI Engine §17, §22); sensitive entities handled per tenant policy.

---

## 17. Module Structure & Contracts

```
packages-py/kg/                         (Python; runs in ingestion-workers, E4)
  classify/        genre classifier → extraction profile
  extract/         per-artifact passes (structured-output contracts)
                   concepts · entities · definitions · quotes · vocabulary
                   frameworks · action_items · timeline · claims
  resolve/         dedup · entity/concept resolution · canonical linking
  infer/           relationships · prerequisites · framework assembly ·
                   timeline ordering · skill mapping
  verify/          grounding · adversarial · contradiction detection · confidence
  graph/           node/edge/record upsert · provenance · read-model builders
  crosscorpus/     incremental linking · connection & contradiction surfacing
  pipeline/        phase orchestration · idempotency · versioning · batch routing

(server, TS) core-api/modules/knowledge/   graph query API + artifact read-models for the UI
```

**Key contracts:**
| Contract | Inputs → Outputs | Purpose |
|---|---|---|
| `Extractor<T>` | (chunk \| summary, context) → Candidate<T>[] | one structured-output pass per artifact group |
| `Resolver` | Candidate[] + existing graph → ResolvedNodes/Records | dedup + link (§8) |
| `Inferencer` | resolved nodes + corpus → Edges/Structures | relationships/frameworks/timeline/skills (§9) |
| `Verifier` | artifact + source span → {supported, confidence} | grounding gate (§10) |
| `GraphRepo` | upsert/query nodes/edges/provenance | storage abstraction (Postgres→Neo4j) |
| `GenreClassifier` | doc summary/structure → profile | route extraction (§5) |

All LLM/embedding calls go through the **AI Engine** (provider-independent). The Knowledge Engine is a consumer of that engine and a producer for the graph + read-models.

---

*End of Knowledge Engine Specification v1. The load-bearing decisions are: (1) **resolution/linking** (§8) — what makes knowledge cross-source rather than per-document fragments; (2) **verification** (§10) — what keeps the graph trustworthy; (3) **provenance** (§12) — what makes every artifact traceable. Genre-adaptive extraction (§5) and the staged map-reduce pipeline (§6–7) are what make eleven artifact types tractable and affordable on every upload.*
