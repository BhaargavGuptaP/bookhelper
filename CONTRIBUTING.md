# Contributing to BookHelper

First — thank you. BookHelper is built in the open, and every issue, design discussion, and pull request makes it better.

This guide describes **how** we work, so contributions land cleanly and the codebase stays coherent. The rules are designed to keep the bar high without making it hard to start.

> If anything here is unclear, open a [Discussion](https://github.com/BhaargavGuptaP/bookhelper/discussions) or a [Question issue](./.github/ISSUE_TEMPLATE/question.yml). Doc bugs are bugs.

---

## Table of contents

1. [Code of Conduct](#code-of-conduct)
2. [Ways to contribute](#ways-to-contribute)
3. [Project ground rules](#project-ground-rules)
4. [Local setup](#local-setup)
5. [Branch strategy](#branch-strategy)
6. [Commit conventions](#commit-conventions)
7. [Pull request workflow](#pull-request-workflow)
8. [Coding standards](#coding-standards)
9. [Architecture expectations](#architecture-expectations)
10. [Testing expectations](#testing-expectations)
11. [Documentation expectations](#documentation-expectations)
12. [Accessibility & UX expectations](#accessibility--ux-expectations)
13. [License of contributions](#license-of-contributions)

---

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Report unacceptable behavior to the maintainers via the channels listed in `CODE_OF_CONDUCT.md`.

---

## Ways to contribute

| Path                             | Where to start                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 🐛 **Report a bug**              | [Bug report](./.github/ISSUE_TEMPLATE/bug_report.yml)                                                                        |
| ✨ **Propose a feature**         | [Feature request](./.github/ISSUE_TEMPLATE/feature_request.yml)                                                              |
| ❓ **Ask a question**            | [Question](./.github/ISSUE_TEMPLATE/question.yml) or [Discussions](https://github.com/BhaargavGuptaP/bookhelper/discussions) |
| 🧹 **Improve docs**              | Open a PR — docs are first-class                                                                                             |
| 🛠 **Pick a `good first issue`** | Browse [labels](https://github.com/BhaargavGuptaP/bookhelper/labels)                                                         |
| 🔒 **Report a vulnerability**    | See [SECURITY.md](./SECURITY.md) — _do not_ open a public issue                                                              |

For non-trivial changes (new features, refactors, anything that touches a public API or an architectural seam), **open an issue first** to align on scope before writing code.

---

## Project ground rules

These are the few rules we don't bend.

1. **Specs are the source of truth.** Code never contradicts:
   - [`PRD.md`](./PRD.md)
   - [`ARCHITECTURE.md`](./ARCHITECTURE.md)
   - [`UX-SPECIFICATION.md`](./UX-SPECIFICATION.md)
   - [`DESIGN-SYSTEM-SPEC.md`](./DESIGN-SYSTEM-SPEC.md)
   - [`FEATURE-SPECIFICATION.md`](./FEATURE-SPECIFICATION.md)

   If implementation reveals a flaw, the spec is updated _in the same PR_ as the code change.

2. **Architectural boundaries are inviolable.** No upward imports. No reaching into another package's internals.
3. **Accessibility is not optional.** Every UI change ships keyboard-operable, screen-reader-labeled, themed (light/dark/high-contrast), and responsive. See [UX-SPECIFICATION.md §11–12](./UX-SPECIFICATION.md).
4. **Public APIs are tested.** Anything exported from a package has a test.
5. **One PR = one concern.** Refactors do not piggyback on feature PRs.

---

## Local setup

See the **[Local development](./README.md#local-development)** section in the README.

Quick version:

```bash
corepack enable
pnpm install                 # installs deps + git hooks (lefthook)
cp .env.example .env
docker compose up -d         # optional Postgres + MinIO
pnpm dev
```

Before submitting a PR, locally run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The same checks run in CI on every PR.

---

## Branch strategy

We use a **trunk-based** model.

- `main` is always releasable. CI must be green; releases are tagged from here.
- Work happens on short-lived branches off `main`, named:

  ```
  <type>/<scope>-<short-summary>
  ```

  Examples:
  - `feat/reader-ui-toc-keyboard-shortcuts`
  - `fix/pdf-adapter-empty-toc-crash`
  - `docs/architecture-link-fix`
  - `chore/repo-add-dependabot`

- Open PRs early; mark as **Draft** while iterating.
- Rebase (don't merge) `main` into your branch to keep history linear.
- Squash-merge into `main`. The squash subject must follow [Conventional Commits](#commit-conventions).

We do not maintain long-lived release branches at this stage. Hotfixes go through the same PR flow.

---

## Commit conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), enforced by **commitlint** on the `commit-msg` hook.

```
<type>(<scope>): <short, imperative summary>

[optional body — what & why, not how]

[optional footer — BREAKING CHANGE:, Refs:, Closes:]
```

**Types** (`@commitlint/config-conventional`): `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`, `build`, `ci`, `style`, `revert`.

**Scopes** (from [`commitlint.config.cjs`](./commitlint.config.cjs)):

```
repo · config · tokens · ui · telemetry · contracts
web · core-api · auth · db · storage · ci · deps
```

Add a scope when one is appropriate (`feat(reader-ui): …`, `fix(pdf-adapter): …`). New top-level scopes go into `commitlint.config.cjs` _in the same PR_ that introduces them.

**Examples**

```
feat(reader-ui): add keyboard shortcut for TOC toggle
fix(pdf-adapter): handle PDFs with empty outline
docs(repo): add architecture diagram to README
chore(deps): bump pdfjs-dist to 4.6.x
```

---

## Pull request workflow

1. **Open an issue first** for anything non-trivial (new feature, public-API change, architectural touchpoint).
2. **Fork or branch** from `main` using the [naming convention](#branch-strategy).
3. **Write code + tests + docs together.** A feature PR includes its own tests and its own doc updates.
4. **Run the local pre-flight** (`format:check`, `lint`, `typecheck`, `test`, `build`).
5. **Open the PR** using the [PR template](./.github/PULL_REQUEST_TEMPLATE.md). Link the issue it closes.
6. **Keep PRs small.** A reviewable PR is roughly **<400 lines of diff** excluding generated files; if it's bigger, split it.
7. **CI must pass.** No exceptions.
8. **Request review** from a maintainer once CI is green and the PR is out of draft.
9. **Address review feedback by pushing more commits** — don't force-push in the middle of review unless asked.
10. **Squash-merge** with a Conventional Commit subject.

**PR checklist** (also in the PR template):

- [ ] CI is green
- [ ] Tests added/updated
- [ ] Docs and specs updated where they drift
- [ ] No upward imports / no architectural boundary violations
- [ ] Accessibility considered (keyboard, screen reader, theme, responsive)
- [ ] Screenshots/recordings included for UI changes
- [ ] No unrelated changes

---

## Coding standards

### Language & style

- **TypeScript everywhere**, `strict: true`. No implicit `any`.
- **ESLint 9 (flat config)** + **Prettier 3** are the source of truth for style. Don't argue with the formatter; configure it.
- **No `// eslint-disable` without a comment explaining why.**
- Prefer **named exports**. Default exports are reserved for framework conventions (Next.js pages, etc.).
- Prefer **explicit return types** on exported functions; let TypeScript infer locals.
- **`zod` for runtime validation** at every external boundary (network, file, env). Internal data may rely on TS types.

### Naming & shape

- Files: `kebab-case.ts`, React components `PascalCase.tsx`.
- Types/interfaces: `PascalCase`. Constants: `SCREAMING_SNAKE_CASE` only when truly constant (env names, magic strings).
- Public functions in packages live in `src/index.ts` exports — _that's_ the API contract.

### Errors & logging

- Use the shared logger from `@bookhelper/telemetry`. **No `console.log` in committed code** (tests excepted with intent).
- Throw typed errors from `@bookhelper/telemetry` or domain-specific error classes. Surface user-facing errors as **RFC 9457 Problem Details**.

### Dependencies

- New dependencies need a one-line justification in the PR description. Bias toward zero.
- Prefer workspace packages over copy-paste.
- Don't add a dependency to the root `package.json` unless every workspace truly needs it.

---

## Architecture expectations

The [ARCHITECTURE.md](./ARCHITECTURE.md) document is binding. In particular:

- **Layers flow downward only.**
  ```
  apps/web ─▶ reader-ui ─▶ render-engine ─▶ reader-core ─▶ pdf-adapter (and friends)
  ```
  Reverse imports are rejected at review.
- **`reader-core` is format-agnostic.** It must not import `pdfjs-dist`, EPUB libs, or any format-specific code. The `DocumentAdapter` interface is the only seam.
- **`reader-ui` is rendering-agnostic to format.** It speaks to the engine via commands/events, not to adapters directly.
- **`api-contracts` is the only place** `web` and `core-api` share types. Don't reach across the boundary any other way.
- **Storage, auth, telemetry are abstracted** — don't hard-code S3/JWT/console; go through the provided ports.

If a new boundary is needed, propose it in an issue first.

---

## Testing expectations

- **Runner:** Vitest, per-package config.
- **UI tests:** React Testing Library (jsdom).
- Every **public API** in a package has a test (happy path + at least one failure mode).
- Every **reader command**, **lifecycle transition**, and **adapter capability** is covered.
- **Don't snapshot what you can assert.** Snapshots are reserved for stable, intentional outputs (e.g., rendered SVG, token CSS).
- Tests are co-located: `foo.ts` ↔ `foo.test.ts`.
- **No skipped tests** in `main`. If a test must be skipped, open an issue and link it from the `skip` call.

Run a focused package:

```bash
pnpm --filter @bookhelper/reader-core test --watch
```

---

## Documentation expectations

- **Specs are code.** A PR that changes behavior covered by a spec must update the spec.
- READMEs inside `packages/*` are the package contract — keep them current with public API changes.
- Use **relative links** between docs (`./PRD.md`, not absolute URLs).
- New top-level docs need a one-line entry in the README's folder structure section.

---

## Accessibility & UX expectations

These are not aspirational — they are review-blocking.

- **Keyboard:** every action reachable; focus order matches reading order; visible focus ring.
- **Screen reader:** semantic HTML first; ARIA only to _fix_ HTML, not replace it; meaningful labels.
- **Color:** WCAG-AA contrast at minimum; **never color-only** to convey state.
- **Motion:** respect `prefers-reduced-motion`; no required motion.
- **Themes:** light, dark, and **high-contrast** must all be tested. Use semantic tokens from `@bookhelper/design-tokens`; never hard-code colors.
- **Responsive:** breakpoints per [UX-SPECIFICATION.md §11](./UX-SPECIFICATION.md).

For Reader-surface changes: **the reading canvas is sacred** — no decoration, no idle motion. See the Atlas principles in [DESIGN-SYSTEM-SPEC.md](./DESIGN-SYSTEM-SPEC.md).

---

## License of contributions

BookHelper is licensed under the **Apache License 2.0** ([LICENSE](./LICENSE)). By submitting a contribution, you agree that your contribution is licensed under the same terms (Apache-2.0 §5 — inbound = outbound).

We do not currently require a separate CLA. If a project-level CLA is ever introduced, existing contributions remain under Apache-2.0.

---

Thank you for reading this far. Now — open that PR. 💛
