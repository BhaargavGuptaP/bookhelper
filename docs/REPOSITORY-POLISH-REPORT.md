# Repository Polish Sprint — Report

> **Sprint:** Repository Polish (v0.1.0).
> **Outcome:** BookHelper is now production-quality and open-source ready.
> **Constraint honored:** no architecture changes, no feature work, no EPUB,
> no AI, no Knowledge Engine, no Reader changes.

---

## 1. Sprint goal

Take the repository from "the end-to-end Reader flow works on `main`" to
"a project a senior engineer can land in, understand, and contribute to in
a single afternoon." Match the production-quality bar of Next.js,
Turborepo, Cal.com, Payload CMS.

Specifically:

1. Establish the full open-source operating surface (Code of Conduct,
   Security, Changelog, Governance, Issue/PR templates, labels,
   milestones, board).
2. Tighten the repository hygiene (`.gitattributes`, `.vscode`, Dependabot,
   CodeQL).
3. Audit the documentation set and surface any drift without making
   spec changes.
4. Improve developer experience documentation (onboarding, command
   discoverability, folder discoverability, docs navigation).
5. Recommend repository metadata for discoverability.

---

## 2. Files created

| Path                                         | Purpose                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `CHANGELOG.md`                               | Keep a Changelog-formatted release notes; baselined at `v0.1.0`.                                        |
| `CODE_OF_CONDUCT.md`                         | Contributor Covenant 2.1 + project-specific reporting flow.                                             |
| `SECURITY.md`                                | Vulnerability reporting, supported versions, coordinated disclosure SLAs.                               |
| `GOVERNANCE.md`                              | Roles, labels, milestones (v0.1 → v1.0), project board, branch protection, release & dependency policy. |
| `.gitattributes`                             | LF normalization, lockfile diff suppression, linguist hints.                                            |
| `.vscode/settings.json`                      | Shared workspace settings — formatter, ESLint flat config, Tailwind regex.                              |
| `.vscode/extensions.json`                    | Recommended VS Code extensions.                                                                         |
| `.github/dependabot.yml`                     | Weekly npm + GitHub Actions updates with sensible groups & manual-major guards.                         |
| `.github/workflows/codeql.yml`               | CodeQL `security-and-quality` scanning on push/PR/weekly.                                               |
| `.github/ISSUE_TEMPLATE/bug_report.yml`      | Issue Forms-based bug template.                                                                         |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Issue Forms-based feature template.                                                                     |
| `.github/ISSUE_TEMPLATE/question.yml`        | Issue Forms-based question template.                                                                    |
| `.github/ISSUE_TEMPLATE/config.yml`          | Disables blank issues; surfaces Discussions, security advisories, docs.                                 |
| `.github/PULL_REQUEST_TEMPLATE.md`           | Mandatory PR contract — type, areas, tests, spec impact, checklist.                                     |
| `docs/DOCUMENTATION-REVIEW.md`               | Audit of every Markdown doc, cross-link, term, version. Findings + remediation tickets.                 |
| `docs/DEVELOPER-EXPERIENCE.md`               | DX playbook — day-1, folder/command discoverability, docs navigation, recommended improvements.         |
| `docs/REPOSITORY-METADATA.md`                | Description, topics, social preview, About-section checklist, `gh` one-liners.                          |
| `docs/REPOSITORY-POLISH-REPORT.md`           | **This document.**                                                                                      |

---

## 3. Files modified

| Path         | Change                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `.gitignore` | Allowed `settings.json`, `launch.json`, `tasks.json` under `.vscode/` to be tracked alongside `extensions.json`. No other behavior change. |

That is the only existing file touched. The `README.md`, `CONTRIBUTING.md`,
`LICENSE`, root specs, `package.json`, CI workflow, `editorconfig`,
`.nvmrc`, `.npmrc`, `.prettierignore`, `eslint.config.mjs`,
`prettier.config.mjs`, `commitlint.config.cjs`, `lefthook.yml`,
`turbo.json`, `tsconfig.base.json`, `docker-compose.yml`, and `.env.example`
were reviewed and **kept as-is** — they already meet the production bar
for this sprint.

---

## 4. Implementation summary

### 4.1 README

Reviewed in detail. The existing `README.md` already contains every
required section (logo & hero placeholders, badges, vision, features,
screenshots placeholders, architecture overview & ASCII diagram, tech
stack, folder structure, local development, build instructions, testing,
packages, roadmap, contribution guide, license, acknowledgements, and a
"Discussions / Roadmap / Changelog" footer). Quality is comparable to the
reference projects — **no rewrite was necessary or warranted.** Changes
beyond what is already there would have been pure churn.

### 4.2 License — recommendation & rationale

**Recommended (and already in place): Apache License 2.0.**

Why:

- **Inbound = outbound for contributions** (Apache-2.0 §5), so no separate
  CLA is needed for `v0.1`.
- **Patent grant** is explicit (Apache-2.0 §3), which matters when the
  product roadmap touches AI/Knowledge — areas where patent ambiguity is
  costly.
- **Compatibility with downstream commercial use** is permissive,
  matching the product ambition (eventual VYANA OS module per
  `ARCHITECTURE.md` §1).
- **Trademark / attribution clarity** (Apache-2.0 §4, §6) protects the
  "BookHelper" mark and the "Atlas" design system codename.
- **Industry alignment.** Most modern reader/knowledge OSS (e.g. Next.js
  is MIT, but most enterprise-OSS such as Kubernetes, Apache Kafka,
  Cassandra, TanStack, OpenTelemetry use Apache-2.0) ships under
  Apache-2.0 for these exact reasons.

MIT was considered and rejected: similar permission profile, but no
patent grant. BSL / SSPL / AGPL were considered and rejected: they
restrict commercial reuse in ways that conflict with PRD §6 (open
ecosystem).

No action required — `LICENSE` already contains the full Apache-2.0 text.

### 4.3 CONTRIBUTING

Reviewed in detail. The existing `CONTRIBUTING.md` already covers every
required topic: branch strategy, Conventional Commits (with the project
scope allowlist), PR workflow, coding standards, architecture
expectations (with the canonical layering diagram), testing
expectations, documentation expectations, accessibility & UX
expectations, license-of-contributions. **No rewrite was necessary.**

### 4.4 CODE_OF_CONDUCT

Adopted **Contributor Covenant v2.1** with project-specific reporting
guidance and the standard four-tier enforcement ladder. New file.

### 4.5 SECURITY

Coordinated-disclosure policy with:

- **Supported versions** matrix (`0.1.x`, `main` get security fixes;
  earlier prerelease does not).
- **Reporting channels**: GitHub Private Vulnerability Reporting
  (preferred) + email.
- **Disclosure SLAs**: acknowledge ≤ 3 days, triage ≤ 7 days, fix ≤ 30
  days for High/Critical and ≤ 90 days for Medium/Low, disclose ~7 days
  after patch release.
- **In-scope / out-of-scope** explicit.
- **Operator hardening guidance** (TLS termination, OIDC, IAM, key
  rotation, backups).
- **Safe-harbor commitment** for good-faith research.

### 4.6 CHANGELOG

Baseline `v0.1.0` entry describing every app, package, tooling, and
documentation artifact that ships in this milestone. Follows Keep a
Changelog 1.1.0. `[Unreleased]` section primed for the EPUB Adapter
sprint.

### 4.7 GitHub templates

Issue Forms (YAML) for **Bug**, **Feature**, **Question**, with a
`config.yml` that disables blank issues and surfaces Discussions, the
private vulnerability flow, and the docs. PR template enforces the
project's contract (type, areas, tests, spec-impact, checklist), including
the rule that user-visible changes must update `CHANGELOG.md` `[Unreleased]`.

### 4.8 GOVERNANCE

The single source of truth for **how the repo operates** alongside
`CONTRIBUTING.md`. Includes:

- Roles & decision-making (maintainer, reviewer, contributor, security
  responder; ADR usage).
- The full **label catalog** as specified in the sprint brief, with
  colors and descriptions, plus a five-recommended-extras list
  (`Dependencies`, `Regression`, `Breaking Change`, `Spec Drift`,
  `Triage`) and a `gh label create` one-shot script.
- **Milestones v0.1 → v1.0** with explicit exit criteria (Definition of
  Done) per milestone.
- The **Backlog → Ready → In Progress → Review → Testing → Done**
  project board with WIP limits and automation.
- **Branch-protection rules** for `main` (required reviewers, required
  status checks including the new CodeQL job, signed commits, linear
  history, squash-only, admin-included), since these cannot be expressed
  as code.
- Release flow, SemVer policy, dependency policy, async meeting cadence.

### 4.9 Repository cleanup

- `.gitignore` — already correct; broadened the `.vscode/*` allowlist by
  three filenames to track the shared workspace settings added this
  sprint.
- `.editorconfig`, `.nvmrc`, `.npmrc`, `.prettierignore`,
  `eslint.config.mjs`, `prettier.config.mjs`, `commitlint.config.cjs`,
  `lefthook.yml`, `turbo.json`, `tsconfig.base.json`,
  `docker-compose.yml`, `.env.example` — reviewed; no changes.
- `.gitattributes` — **added** to normalize line endings and mark
  generated files (lockfiles, `dist/`, `.next/`) so they don't pollute
  PR diffs or language stats.
- `.vscode/settings.json` & `.vscode/extensions.json` — **added** as
  shared workspace defaults; intentionally minimal and formatter-driven.
- `.github/workflows/ci.yml` — already correct, kept as-is.
- `.github/workflows/codeql.yml` — **added** as a separate scheduled +
  on-push CodeQL scan.
- `.github/dependabot.yml` — **added** to manage npm and GitHub Actions
  updates with grouping and manual-major guards.

No unnecessary files were introduced.

### 4.10 Documentation review

See [`DOCUMENTATION-REVIEW.md`](./DOCUMENTATION-REVIEW.md) for the full
report. Headline findings (no release blockers):

- Two superseded specs (`UX-DESIGN.md`, `DESIGN-SYSTEM.md`) are still
  cited by `PRD.md` and `ROADMAP.md`; add canonical-successor cross-links
  in a follow-up PR.
- Five packages (`design-tokens`, `ui`, `telemetry`, `api-contracts`,
  `config`) lack a `README.md`; add minimal ones.
- Add a milestone-mapping section to `ROADMAP.md` translating R0–R5 to
  v0.x → v1.0.
- Add `CODEOWNERS` and an `docs/adr/` scaffold once the maintainer
  roster is confirmed.

### 4.11 Developer experience

See [`DEVELOPER-EXPERIENCE.md`](./DEVELOPER-EXPERIENCE.md). Captures:

- A 15-minute day-1 path with a per-step explanation.
- A "I want to touch X, where is it?" table covering every package and
  every `apps/*` surface.
- A command discoverability table — what each `pnpm <task>` actually does
  and when to use it, including the **CI-parity one-liner**.
- A three-tier docs navigation map (Surface → Behavior → Implementation)
  with operational docs called out separately.
- Suggested DX improvements for `v0.2+` (one-shot setup, devcontainer,
  `pnpm doctor`, Storybook/Ladle, Playwright smoke, Turbo remote cache,
  CODEOWNERS, ADR scaffold).
- Common-symptom troubleshooting table.

### 4.12 Badges & metadata

- README badges already cover License, Node, pnpm, TypeScript, Next.js,
  React, CI, Coverage placeholder, and PRs-welcome — exactly the set
  requested. **No change.**
- [`REPOSITORY-METADATA.md`](./REPOSITORY-METADATA.md) provides the
  recommended `description`, 20 topics, social-preview composition,
  About-section + General + Security checklists, and copy-pasteable
  `gh repo edit` / `gh api` scripts.

---

## 5. Review checklist

- [x] **README** — reviewed; meets the production bar without change.
- [x] **LICENSE** — Apache-2.0 in place; rationale documented.
- [x] **CONTRIBUTING** — reviewed; meets the production bar without change.
- [x] **CODE_OF_CONDUCT** — Contributor Covenant 2.1 adopted.
- [x] **SECURITY** — coordinated-disclosure policy with SLAs.
- [x] **CHANGELOG** — `v0.1.0` baseline.
- [x] **Issue templates** — Bug, Feature, Question, config.
- [x] **PR template** — contractual.
- [x] **Labels** — recommended set with colors + `gh` script (`GOVERNANCE.md` §2).
- [x] **Milestones** — v0.1 → v1.0 with exit criteria (`GOVERNANCE.md` §3).
- [x] **Project board** — Backlog → Done with WIP limits + automation
      (`GOVERNANCE.md` §4).
- [x] **Repository hygiene** — `.gitignore`, `.editorconfig`, `.vscode`,
      `.gitattributes`, workflows reviewed/updated.
- [x] **CI** — kept; added scheduled CodeQL.
- [x] **Dependabot** — added with grouping and manual-major guards.
- [x] **Documentation review** — produced as a standalone report.
- [x] **DX improvements** — captured in `docs/DEVELOPER-EXPERIENCE.md`.
- [x] **Badges** — already in README; recommendation matches.
- [x] **Repository metadata** — description, topics, social, About
      checklist documented.
- [x] **No architecture changes.** ✓
- [x] **No code refactors.** ✓
- [x] **No feature work.** ✓
- [x] **No EPUB / AI / Knowledge / Reader changes.** ✓
- [x] **No dependency upgrades.** ✓ (Dependabot will propose them.)

---

## 6. Documentation improvements (summary)

1. Three new top-level operational docs (`CODE_OF_CONDUCT.md`,
   `SECURITY.md`, `GOVERNANCE.md`) plus `CHANGELOG.md`.
2. A `docs/` index with:
   - The first **documentation audit** (`DOCUMENTATION-REVIEW.md`).
   - A **DX playbook** (`DEVELOPER-EXPERIENCE.md`).
   - A **metadata cookbook** (`REPOSITORY-METADATA.md`).
   - This **sprint report**.
3. Cross-link audit covering every spec, every package README, every
   template; drift findings logged with remediation owners.
4. Terminology consistency audit across the canonical specs.
5. Version-and-date consistency audit across `package.json`, `.nvmrc`,
   `CHANGELOG.md`, `README.md`, and `commitlint.config.cjs`.

## 7. Repository improvements (summary)

1. **Issue Forms + PR template** make contribution well-shaped from the
   first interaction.
2. **Dependabot + CodeQL** add supply-chain and code-scanning baselines.
3. **`.gitattributes`** normalizes line endings and stops lockfiles from
   polluting PR diffs.
4. **Shared VS Code settings** turn the recommended-extension list into a
   working environment by default.
5. **GOVERNANCE.md** turns the implicit operating model into explicit,
   reviewable rules — labels, milestones, board, branch protection,
   release flow, dependency policy.

## 8. Developer experience improvements (summary)

1. **15-minute day-1 path** documented with per-step rationale.
2. **Folder & command discoverability tables** so engineers don't need to
   read every package to find their entry point.
3. **CI-parity one-liner** (`pnpm format:check && pnpm lint && pnpm
typecheck && pnpm test && pnpm build`) prominently surfaced in three
   places (README, CONTRIBUTING, DX doc).
4. **Three-tier docs navigation** (Surface / Behavior / Implementation)
   removes the "where do I start?" cliff.
5. **Recommended next steps** for the next DX inflection
   (devcontainer, `pnpm doctor`, Storybook, Playwright smoke, Turbo
   remote cache, CODEOWNERS, ADR scaffold) tracked as `Enhancement`
   issues for `v0.2+`.

---

## 9. Open questions

These need a maintainer decision before they can become tickets.

1. **`security@bookhelper.dev` mailbox** — is the domain live, and which
   addresses are routable (`security@`, `conduct@`, `hello@`)? Until
   that's confirmed, the docs route reporters via GitHub Private
   Vulnerability Reporting + repo-owner DM.
2. **Website URL** — `bookhelper.dev` is referenced as the marketing
   homepage in `README.md` and `REPOSITORY-METADATA.md`. Is it live?
   If not, do we want to point the GitHub homepage at the GitHub
   project page instead until it ships?
3. **Maintainer roster** — `GOVERNANCE.md` references a `CODEOWNERS` file
   not yet present. Who is on the initial maintainer list?
4. **GitHub Pages** — do we want a docs site at `bookhelper.dev/docs`
   (or `docs.bookhelper.dev`)? If yes, that becomes a `v0.2` task with
   a `next-mdx` or `nextra` site fed from the root `*.md` files.
5. **Turborepo remote cache** — there is an obvious DX win available
   (Vercel-hosted remote cache, or a self-hosted one). Worth doing this
   cycle, or wait for the Cal.com-style infra sprint?

## 10. Known limitations

1. **No code change has been made** beyond a three-line `.gitignore`
   allowlist for VS Code workspace files. By design — the sprint brief
   forbids architecture / refactor / feature work.
2. **Labels, milestones, project board, branch-protection rules, and
   repository metadata are documented as recommendations + `gh` scripts**
   — not auto-applied. Applying them is a maintainer action since they
   touch repository-level settings and reputation.
3. **`CODEOWNERS` is referenced but not created.** Waiting for the
   maintainer roster (see Open Question 3).
4. **The two superseded specs (`UX-DESIGN.md`, `DESIGN-SYSTEM.md`) still
   exist** at the root by design — the audit recommends adding
   succession banners but not deleting them, since they remain useful
   historical context. The actual banner edit is a follow-up
   `Documentation` PR per the audit.
5. **Coverage badge in the README is a placeholder** — wiring an actual
   coverage report (Codecov / Coveralls) is a `v0.2` ticket.
6. **Social preview image is described, not committed** — design
   produces the artifact; we shipped the recipe.

---

## 11. Stopping criterion

Per the sprint brief: **stop after Repository Polish. Do not begin the
EPUB Adapter.** Confirmed — no source files in `apps/*` or `packages/*`
were modified.

---

_End of report. Next sprint: **v0.2 — EPUB Adapter** per `GOVERNANCE.md`
§3 and `ROADMAP.md` R1._
