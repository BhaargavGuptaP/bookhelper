# Documentation Review (v0.1.0)

> **Audit date:** 2026-06-21. **Auditor:** repo polish sprint.
> **Scope:** every Markdown document at the repository root, every package
> `README.md`, every doc cross-link, and every reference made by code/specs
> to a sibling document.

This is a **report**, not a change. Where issues are identified,
remediation tickets are listed at the bottom. None of these block the
`v0.1.0` release; they will be addressed in follow-up PRs and/or rolled
into the `v0.2` documentation work.

---

## 1. Document map

| Document                   | Role                                                   | Audience                  | Status                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                | Hero / landing page.                                   | Everyone.                 | ✅ Production-quality.                                                                                                                                    |
| `ARCHITECTURE.md`          | System architecture (the _how_).                       | Engineering.              | ✅ Authoritative.                                                                                                                                         |
| `PRD.md`                   | Product requirements (the _what_ & _why_).             | Product, design, eng.     | ✅ Authoritative.                                                                                                                                         |
| `UX-SPECIFICATION.md`      | Canonical UX (experience & behavior).                  | Design, eng.              | ✅ Authoritative. **Supersedes** `UX-DESIGN.md`.                                                                                                          |
| `DESIGN-SYSTEM-SPEC.md`    | Canonical Atlas design language.                       | Design, frontend.         | ✅ Authoritative. **Supersedes** `DESIGN-SYSTEM.md`.                                                                                                      |
| `FEATURE-SPECIFICATION.md` | Canonical feature catalog by domain.                   | Eng, QA, AI, product.     | ✅ Authoritative. **Complements** `FEATURE-BREAKDOWN.md`.                                                                                                 |
| `FEATURE-BREAKDOWN.md`     | MoSCoW / epic view of the feature catalog.             | Planning.                 | ✅ Active.                                                                                                                                                |
| `READER-SPEC.md`           | Reader behavioral contract.                            | Reader stack engineers.   | ✅ Active.                                                                                                                                                |
| `AI-ENGINE-SPEC.md`        | Forward-looking AI engine.                             | Engineering.              | 🟡 Forward-looking, not yet implemented.                                                                                                                  |
| `KNOWLEDGE-ENGINE-SPEC.md` | Forward-looking knowledge engine.                      | Engineering.              | 🟡 Forward-looking, not yet implemented.                                                                                                                  |
| `ROADMAP.md`               | Execution & delivery plan.                             | Eng managers, leadership. | ✅ Active.                                                                                                                                                |
| `SPRINT-PLAN.md`           | Sprint decomposition (small team).                     | Eng managers.             | ✅ Active.                                                                                                                                                |
| `UX-DESIGN.md`             | Earlier UX overview.                                   | n/a                       | ⚠ **Superseded** by `UX-SPECIFICATION.md`. Keep as historical context; cross-link to successor.                                                           |
| `DESIGN-SYSTEM.md`         | Earlier design overview.                               | n/a                       | ⚠ **Superseded** by `DESIGN-SYSTEM-SPEC.md`. Keep as historical context; cross-link to successor.                                                         |
| `CONTRIBUTING.md`          | Contributor guide.                                     | Contributors.             | ✅ Production-quality.                                                                                                                                    |
| `CODE_OF_CONDUCT.md`       | Community standards.                                   | Community.                | ✅ New, v1.                                                                                                                                               |
| `SECURITY.md`              | Vulnerability reporting.                               | Researchers, operators.   | ✅ New, v1.                                                                                                                                               |
| `CHANGELOG.md`             | Release notes.                                         | Everyone.                 | ✅ New, `v0.1.0` baseline.                                                                                                                                |
| `GOVERNANCE.md`            | Repo operation: labels, milestones, board, protection. | Maintainers.              | ✅ New, v1.                                                                                                                                               |
| `packages/*/README.md`     | Per-package contract.                                  | Package consumers.        | 🟡 Present for `reader-core`, `reader-ui`, `pdf-adapter`, `render-engine`; **missing** for `design-tokens`, `ui`, `telemetry`, `api-contracts`, `config`. |

---

## 2. Cross-reference audit

### 2.1 Document references between canonical specs

- `PRD.md` cites: `ARCHITECTURE.md`, **`UX-DESIGN.md`**, **`DESIGN-SYSTEM.md`**,
  `FEATURE-BREAKDOWN.md`, `ROADMAP.md`, `READER-SPEC.md`, `AI-ENGINE-SPEC.md`,
  `KNOWLEDGE-ENGINE-SPEC.md`, `SPRINT-PLAN.md`.
  ⚠ **Drift:** references the _superseded_ UX-DESIGN.md and DESIGN-SYSTEM.md
  rather than the canonical `UX-SPECIFICATION.md` / `DESIGN-SYSTEM-SPEC.md`.
  Should reference both — successor first, predecessor parenthesized.

- `UX-SPECIFICATION.md` correctly references `DESIGN-SYSTEM.md`
  (predecessor) while declaring itself the canonical UX doc. ⚠ Same
  consideration — should point to `DESIGN-SYSTEM-SPEC.md` as canonical.

- `DESIGN-SYSTEM-SPEC.md` correctly references `UX-SPECIFICATION.md`,
  `PRD.md`, and the predecessor `DESIGN-SYSTEM.md`. ✅

- `FEATURE-SPECIFICATION.md` correctly references PRD + deep-dive specs +
  the complementary `FEATURE-BREAKDOWN.md`. ✅

- `ROADMAP.md` references `ARCHITECTURE.md`, **`UX-DESIGN.md`**,
  **`DESIGN-SYSTEM.md`**, `FEATURE-BREAKDOWN.md`. ⚠ Same predecessor drift.

- `SPRINT-PLAN.md` references `FEATURE-BREAKDOWN.md`, `ROADMAP.md`. ✅

### 2.2 README / CONTRIBUTING links

- `README.md` references documentation map entry **`docs/DOCUMENTATION-REVIEW.md`**.
  This file is created by _this_ document review and now exists. ✅
- `README.md` links to `.env.example`, `docker-compose.yml`, `.nvmrc`,
  package READMEs, and CI workflow. All present. ✅
- `CONTRIBUTING.md` links to `.github/ISSUE_TEMPLATE/*.yml` and
  `.github/PULL_REQUEST_TEMPLATE.md`. Now present after this sprint. ✅
- `CONTRIBUTING.md` references `commitlint.config.cjs`. Present. ✅

### 2.3 Code → docs references

- Package READMEs reference `ARCHITECTURE.md` and `READER-SPEC.md` —
  paths resolve from `packages/<name>/README.md` as `../../ARCHITECTURE.md`
  (verified by inspection). ✅
- `.github/ISSUE_TEMPLATE/*.yml` use `../../FILE.md` for repo-relative
  links — GitHub renders these correctly from the issue form preview. ✅

---

## 3. Terminology consistency

The product uses a small, deliberate vocabulary. The audit cross-checked
the canonical specs for consistent use.

| Term                                            | Canonical definition                                     | Usage status                                                                   |
| ----------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Reader**                                      | Format-agnostic reading surface; not the engine.         | ✅ Consistent in `UX-SPECIFICATION.md`, `READER-SPEC.md`, `reader-ui` package. |
| **Reader Core**                                 | The format-agnostic engine in `@bookhelper/reader-core`. | ✅                                                                             |
| **DocumentAdapter**                             | The format seam interface.                               | ✅                                                                             |
| **Locator**                                     | Addressable source span.                                 | ✅ Defined in UX-SPEC §1 conventions and used uniformly.                       |
| **Canvas**                                      | The reading surface.                                     | ✅                                                                             |
| **Summon**                                      | User-initiated reveal of secondary affordances.          | ✅                                                                             |
| **Scope chip**                                  | AI knowledge-boundary control.                           | ✅ Future-tense in v0.1; defined in UX-SPEC.                                   |
| **Atlas**                                       | The design system codename.                              | ✅                                                                             |
| **BookHelper**                                  | Product name.                                            | ✅                                                                             |
| **Knowledge Engine / AI Tutor / Learning Loop** | Future capabilities.                                     | ✅ Consistently marked forward-looking.                                        |

⚠ **Drift to track:**

- The product is described variously as "AI-first Reading & Knowledge
  Platform" (PRD), "AI Knowledge Platform" (Architecture title), and
  "Knowledge Engine" (PRD subtitle / Architecture §1). These are
  _complementary_ but the **README's tagline** should be considered the
  marketing-canonical phrasing. Action: cross-link the three documents'
  opening lines so future edits keep them aligned.

---

## 4. Version & date consistency

| Reference                       | Value                                                                                                    | Verified                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `package.json` `version`        | `0.1.0`                                                                                                  | ✅ Matches CHANGELOG `v0.1.0`.       |
| `.nvmrc`                        | `22`                                                                                                     | ✅                                   |
| `package.json` `engines.node`   | `>=20.11.0 <26`                                                                                          | ✅ Aligns with README "Node ≥20.11". |
| `package.json` `packageManager` | `pnpm@9.15.0`                                                                                            | ✅ Matches README "pnpm 9.15" badge. |
| `commitlint.config.cjs` scopes  | `repo · config · tokens · ui · telemetry · contracts · web · core-api · auth · db · storage · ci · deps` | ✅ Matches `CONTRIBUTING.md`.        |

⚠ **One drift identified:**

- `package.json` engine range allows up to Node 25.x; `.nvmrc` pins `22`.
  The README states "≥20.11" and links `.nvmrc` for the actual pin. This
  is fine but worth noting — if Node 26 ships before `v0.2` we will need
  to bump `engines.node` deliberately.

---

## 5. Duplicated concepts

| Topic                                | Documented in…                                                                                          | Recommendation                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architectural layering / boundaries  | `ARCHITECTURE.md`, `CONTRIBUTING.md` §Architecture, `README.md` Architecture overview.                  | Keep all three — they serve different readers. The `CONTRIBUTING.md` version is intentionally a précis. ✅ No change.                                                                                          |
| Branch strategy & commit conventions | `CONTRIBUTING.md`, `commitlint.config.cjs`, `GOVERNANCE.md` §5.                                         | Single source = `CONTRIBUTING.md`. `GOVERNANCE.md` references it; `commitlint.config.cjs` enforces it. ✅                                                                                                      |
| Milestones / releases                | `ROADMAP.md` (R0–R5), `README.md` (v0.1–v1.0), `GOVERNANCE.md` §3 (v0.1–v1.0 with DoD), `CHANGELOG.md`. | Mapping: README → public framing; ROADMAP → execution plan; GOVERNANCE → per-milestone DoD; CHANGELOG → historical. ⚠ Action: add a short note in `ROADMAP.md` mapping R0–R5 ↔ v0.x → v1.0 to avoid confusion. |
| Reader behavior                      | `READER-SPEC.md`, `UX-SPECIFICATION.md` §5, `FEATURE-SPECIFICATION.md` §3.                              | Roles distinct (contract / experience / catalog). ✅                                                                                                                                                           |
| Testing expectations                 | `CONTRIBUTING.md`, `README.md` Testing section.                                                         | README is a summary; CONTRIBUTING is the source. ✅                                                                                                                                                            |

---

## 6. Findings & remediation tickets

Each finding below should become a `Documentation`-labeled issue.

1. **[Spec-link drift]** `PRD.md` and `ROADMAP.md` still link to the
   superseded `UX-DESIGN.md` / `DESIGN-SYSTEM.md` rather than their
   canonical successors. Update the citation list to reference the
   _canonical_ doc with the predecessor as historical context.
2. **[Predecessor signposting]** Add a one-line, top-of-document banner
   to `UX-DESIGN.md` and `DESIGN-SYSTEM.md` explicitly stating they are
   **superseded** and pointing to the canonical spec.
3. **[Package READMEs]** Add minimal `README.md` files for `design-tokens`,
   `ui`, `telemetry`, `api-contracts`, and `config` packages. Each should
   state: purpose, public exports, dependency rules, link to the
   architectural seam they implement.
4. **[Roadmap ↔ release mapping]** Add a short section to `ROADMAP.md`
   mapping `R0–R5` milestones to the `v0.x → v1.0` releases defined in
   `GOVERNANCE.md` and `CHANGELOG.md`.
5. **[CODEOWNERS]** Add a `CODEOWNERS` file once the maintainer roster is
   confirmed. `GOVERNANCE.md` already references it.
6. **[ADR scaffold]** Create `docs/adr/` with a template (`0000-template.md`)
   and an inaugural ADR (`0001-modular-monolith-monorepo.md`) recording
   the load-bearing architectural decisions already made.
7. **[Docs index]** Eventually move forward-looking specs
   (`AI-ENGINE-SPEC`, `KNOWLEDGE-ENGINE-SPEC`) under `docs/specs/` once
   they begin to mutate frequently — the root is getting busy. Not
   urgent.

---

## 7. Verdict

The documentation set is **production-ready for `v0.1.0`**: every
canonical spec is consistent, internally coherent, and externally
discoverable. The findings above are quality-of-life issues that compound
if ignored but are not release-blockers. They are tracked as `Documentation`
issues against the `v0.2` milestone.
