# Governance

> **Status:** v1 — applies from `v0.1.0` onward. Revisited at every major
> milestone gate. Sister documents: [`CONTRIBUTING.md`](./CONTRIBUTING.md),
> [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md), [`SECURITY.md`](./SECURITY.md),
> [`CHANGELOG.md`](./CHANGELOG.md), [`ROADMAP.md`](./ROADMAP.md).

This document defines **how decisions get made** in BookHelper and **how the
repository is operated** — roles, labels, milestones, the project board,
branch-protection rules, release flow, and dependency hygiene. If something
about _running_ the project is not answered in one of the documents above,
it is answered here.

---

## Table of contents

1. [Roles & decision-making](#1-roles--decision-making)
2. [Issue labels](#2-issue-labels)
3. [Milestones](#3-milestones-through-v10)
4. [Project board](#4-project-board)
5. [Branch protection & release flow](#5-branch-protection--release-flow)
6. [Versioning policy](#6-versioning-policy)
7. [Dependency policy](#7-dependency-policy)
8. [Meeting & decision cadence](#8-meeting--decision-cadence)

---

## 1. Roles & decision-making

| Role                   | Who                                               | Authority                                                                      |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Maintainer(s)**      | Repository owner(s) listed in `CODEOWNERS` (TBD). | Merge, release, label, ban. Final call on architecture & roadmap.              |
| **Reviewer**           | Trusted contributors granted PR-review rights.    | Approve / request changes. Cannot merge own PRs.                               |
| **Contributor**        | Anyone opening an issue or PR.                    | Propose, implement, discuss.                                                   |
| **Security responder** | Subset of maintainers.                            | Triage and remediate vulnerability reports per [`SECURITY.md`](./SECURITY.md). |

**Decisions.** Day-to-day technical decisions are made by the maintainer
group via lazy consensus on the PR. Cross-cutting or architectural changes
(boundary changes, new packages, public API removals, new dependencies in
the root) require:

1. An issue with a written proposal.
2. Acknowledgement from at least one maintainer outside the proposer.
3. An update to the relevant spec(s) in the implementing PR.

ADRs (Architecture Decision Records) live in `docs/adr/`. Any decision that
constrains future choices ships an ADR.

---

## 2. Issue labels

Labels are the operating language of the issue tracker. They are
**flat**, **lowercase except acronyms**, and **never overloaded**.

### 2.1 Type (one required)

| Label           | Color     | Used for                               |
| --------------- | --------- | -------------------------------------- |
| `Bug`           | `#d73a4a` | Defects in shipped behavior.           |
| `Feature`       | `#5319e7` | New capability not yet in the product. |
| `Enhancement`   | `#a2eeef` | Improvement to an existing capability. |
| `Documentation` | `#0075ca` | Docs-only change.                      |

### 2.2 Domain / area (zero or more)

| Label           | Color     | Scope                                                       |
| --------------- | --------- | ----------------------------------------------------------- |
| `Architecture`  | `#1d76db` | Architectural seams, layering, boundaries.                  |
| `Reader`        | `#0e8a16` | `reader-core`, `reader-ui`, `render-engine`, `pdf-adapter`. |
| `Library`       | `#0e8a16` | Library surface in `apps/web` and core-api `library/`.      |
| `Knowledge`     | `#0052cc` | Knowledge Engine (forward-looking).                         |
| `AI`            | `#7057ff` | AI Tutor & RAG (forward-looking).                           |
| `Learning`      | `#fbca04` | Spaced repetition / FSRS (forward-looking).                 |
| `Accessibility` | `#bfdadc` | WCAG, keyboard, screen reader, high contrast.               |
| `Performance`   | `#fbca04` | Latency, memory, bundle size, INP/LCP.                      |

### 2.3 Triage / status (zero or one)

| Label              | Color     | Meaning                                 |
| ------------------ | --------- | --------------------------------------- |
| `Good First Issue` | `#7057ff` | Well-scoped, low-context entry point.   |
| `Help Wanted`      | `#008672` | Maintainers welcome external help here. |
| `Blocked`          | `#b60205` | Cannot proceed until X is resolved.     |
| `Needs Discussion` | `#e99695` | Default new-issue state until triaged.  |

### 2.4 Priority (zero or one)

| Label           | Color     | Meaning                                       |
| --------------- | --------- | --------------------------------------------- |
| `High Priority` | `#b60205` | Worked on this cycle; bumps queue.            |
| `Low Priority`  | `#c2e0c6` | Backlog candidate; revisit at milestone gate. |

> No "Medium" — the absence of a priority label _is_ medium. We avoid
> labels that everyone applies to everything.

### 2.5 Suggested additional labels

These are not in the request but pay for themselves quickly. Add when
needed:

- `Dependencies` (Dependabot PRs)
- `Regression` (worked before, broken now)
- `Breaking Change`
- `Spec Drift` (code and spec disagree)
- `Triage` (auto-applied to new issues until a maintainer reviews)

### 2.6 One-shot setup

A maintainer can apply this label set with the `gh` CLI:

```bash
# From the repo root, after `gh auth login`.
gh label create "Bug"               -c "#d73a4a" -d "Defects in shipped behavior."
gh label create "Feature"           -c "#5319e7" -d "New capability."
gh label create "Enhancement"       -c "#a2eeef" -d "Improvement to existing capability."
gh label create "Documentation"     -c "#0075ca" -d "Docs-only change."
gh label create "Architecture"      -c "#1d76db" -d "Layering, seams, boundaries."
gh label create "Reader"            -c "#0e8a16" -d "Reader stack."
gh label create "Library"           -c "#0e8a16" -d "Library surface."
gh label create "Knowledge"         -c "#0052cc" -d "Knowledge Engine."
gh label create "AI"                -c "#7057ff" -d "AI Tutor & RAG."
gh label create "Learning"          -c "#fbca04" -d "Spaced repetition / FSRS."
gh label create "Accessibility"     -c "#bfdadc" -d "WCAG, keyboard, SR, HC."
gh label create "Performance"       -c "#fbca04" -d "Latency, memory, bundle, INP/LCP."
gh label create "Good First Issue"  -c "#7057ff" -d "Well-scoped entry point."
gh label create "Help Wanted"       -c "#008672" -d "External help welcomed."
gh label create "Blocked"           -c "#b60205" -d "Cannot proceed."
gh label create "Needs Discussion"  -c "#e99695" -d "Default until triaged."
gh label create "High Priority"     -c "#b60205" -d "This cycle."
gh label create "Low Priority"      -c "#c2e0c6" -d "Backlog."
gh label create "Dependencies"      -c "#0366d6" -d "Dependabot / supply chain."
```

---

## 3. Milestones through v1.0

Milestones map 1:1 to releases in `CHANGELOG.md`. Each ships a tag and a
GitHub Release.

| Milestone                                                | Theme                                  | Exit criteria (Definition of Done)                                                                                         |
| -------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **v0.1 — Foundation + PDF Reader** _(shipped)_           | First public milestone.                | Library + PDF Reader end-to-end. Atlas tokens. CI green. Specs published.                                                  |
| **v0.2 — EPUB Adapter**                                  | Second format proves the seams.        | `@bookhelper/epub-adapter` ships. Reader works on EPUB. PDF behavior unchanged. Adapter capability matrix updated.         |
| **v0.3 — Reading Polish & Persistence**                  | The reader earns daily use.            | Highlights, notes, bookmarks, reading positions persisted server-side. Keyboard parity across formats. WCAG-AA audit pass. |
| **v0.4 — Knowledge Engine (concepts, entities, claims)** | Per-document knowledge structure.      | Concept extraction pipeline. Sidecar knowledge view. Source-attributed everywhere.                                         |
| **v0.5 — AI Tutor + Grounded Q&A**                       | Cited answers over the user’s library. | RAG over manifest + text layer. Source citations clickable to locator. AI provider abstraction documented.                 |
| **v0.6 — Learning Loop (FSRS)**                          | Reading → durable memory.              | Card generation from highlights & concepts. Daily review queue. Mastery state.                                             |
| **v0.7 — Cross-Source Knowledge Graph**                  | Knowledge that compounds.              | Cross-document linking. Graph explorer view. Conflict / agreement signals.                                                 |
| **v0.8 — Search & Personalization**                      | Find anything you read.                | Unified semantic + keyword search. Saved searches. Per-user preferences.                                                   |
| **v0.9 — Hardening & Beta**                              | Production posture.                    | Performance budgets met. Telemetry budgets met. Public beta opened.                                                        |
| **v1.0 — First Lovable Product GA**                      | General availability.                  | All v0.x scopes stable. Migration story written. SLAs published.                                                           |

> A milestone is **closed** only when every issue assigned to it is closed
> _or_ explicitly moved. No silent slips.

---

## 4. Project board

Single board: **BookHelper Delivery**. Columns are pull-based.

| Column          | Enter when…                                                          | Exit when…                                      |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| **Backlog**     | Issue is filed and triaged.                                          | A maintainer commits to it for the cycle.       |
| **Ready**       | Scoped, labeled, acceptance criteria written, no `Blocked`.          | A contributor picks it up.                      |
| **In Progress** | A branch exists / a contributor is actively working.                 | A PR is opened linking the issue.               |
| **Review**      | Open PR is out of draft and CI is green.                             | At least one maintainer approves; merge queued. |
| **Testing**     | Merged but awaiting verification on a staged build / release.        | Verified or rolled back.                        |
| **Done**        | Verified and either released or merged into the next release branch. | (terminal)                                      |

**WIP limits** — soft, enforced socially:

- `In Progress` ≤ 1 per active contributor.
- `Review` ≤ 5 globally; if the column grows past 5, reviewers stop new
  work and clear it.

Automation:

- New issues → `Backlog`.
- PR opened → linked issue moves to `In Progress`.
- PR merged → linked issue moves to `Testing`.
- Release published → all linked issues move to `Done`.

---

## 5. Branch protection & release flow

### 5.1 Branches

- `main` is the only long-lived branch and is **always releasable**.
- Topic branches use the naming convention from
  [`CONTRIBUTING.md`](./CONTRIBUTING.md#branch-strategy).
- We do not maintain release branches at this stage. Once `1.0` ships,
  patch releases will use short-lived `release/x.y` branches.

### 5.2 Branch-protection rules (apply to `main`)

> The maintainer applies these in **Settings → Branches → Protection rules**.
> They are not currently expressible as code, so they live here as the
> normative source.

- Require pull request before merging:
  - **Required reviewers:** 1 (maintainer).
  - **Dismiss stale approvals on push:** ✅
  - **Require review from Code Owners:** ✅ (once `CODEOWNERS` ships).
- Require status checks to pass before merging:
  - `CI / Lint · Typecheck · Test · Build`
  - `CodeQL / Analyze (javascript-typescript)`
  - **Strict:** branches must be up to date before merge.
- Require conversation resolution before merging: ✅
- Require linear history: ✅ (squash-only).
- Require signed commits: ✅ (recommended).
- Lock branch (force-push, deletion): ✅
- Apply to administrators: ✅
- Allowed merge method: **Squash only**. Disable merge commit & rebase.

### 5.3 Release flow

1. Open a `chore(repo): release vX.Y.Z` PR that:
   - Moves `CHANGELOG.md` `[Unreleased]` → `[X.Y.Z] — YYYY-MM-DD`.
   - Bumps any user-facing version strings.
2. Merge once CI is green.
3. Tag `vX.Y.Z` on `main`, signed.
4. Publish a GitHub Release using the changelog section as the body.
5. Move the milestone’s remaining issues; close the milestone.
6. Open the next milestone if not already open.

---

## 6. Versioning policy

The repo follows **SemVer 2.0.0** with the pre-`1.0` clause: minor versions
may include breaking changes; they will be explicitly called out as
**Breaking changes** in the changelog.

Public surface = anything documented in:

- A package `src/index.ts` export.
- A spec (`PRD.md`, `ARCHITECTURE.md`, `UX-SPECIFICATION.md`,
  `DESIGN-SYSTEM-SPEC.md`, `FEATURE-SPECIFICATION.md`, `READER-SPEC.md`).
- A REST/HTTP contract under `@bookhelper/api-contracts`.

Internal modules under `internal/` directories are **not** public; we may
break them without notice.

---

## 7. Dependency policy

- New dependencies require justification in the PR description.
- Prefer workspace packages over external ones for shared code.
- Dependabot proposes updates weekly (see
  [`.github/dependabot.yml`](./.github/dependabot.yml)) and groups related
  ecosystems together.
- Major updates of load-bearing dependencies (Next.js, React, NestJS,
  TypeScript) are reviewed manually and require a passing run of
  `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  locally before merge.

---

## 8. Meeting & decision cadence

We optimize for **async**. The cadence is:

- **Daily (async):** PR review and triage.
- **Weekly:** maintainers sync (30 min) on PR queue, blockers, milestone
  burn-down. Notes posted in Discussions.
- **At every milestone gate:** retrospective + roadmap re-forecast against
  `ROADMAP.md` and the KPI dashboard in `ROADMAP.md §9`.

Decisions worth keeping become ADRs in `docs/adr/`. Decisions that don’t
last are not worth a meeting.

---

_If anything in this document conflicts with [`CONTRIBUTING.md`](./CONTRIBUTING.md)
or a spec, the spec wins. Then `CONTRIBUTING.md`. Then this file. Open a
PR to reconcile._
