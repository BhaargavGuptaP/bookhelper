# Developer Experience (DX)

> Companion to [`README.md`](../README.md) and [`CONTRIBUTING.md`](../CONTRIBUTING.md).
> This doc is the **opinionated DX baseline** for BookHelper contributors —
> what your day-1 path looks like, what each folder is for, what every
> command does, and how to find your way around the docs without asking.

If something here is wrong or out of date, fix it in the same PR as the
behavior change. Docs are part of the product.

---

## 1. Day-1 onboarding (15 minutes)

```bash
# 1. Clone
git clone https://github.com/BhaargavGuptaP/bookhelper.git
cd bookhelper

# 2. Toolchain
corepack enable
nvm use            # picks up .nvmrc -> Node 22

# 3. Install + git hooks (lefthook)
pnpm install

# 4. Env
cp .env.example .env
# Edit .env if you need OIDC / non-default Postgres / non-default S3.

# 5. (Optional) Local Postgres + MinIO
docker compose up -d

# 6. Run everything
pnpm dev
```

Open:

- Web: <http://localhost:3000>
- Core API: <http://localhost:4000/health>
- MinIO console: <http://localhost:9001> (`minioadmin` / `minioadmin`)

**You're done.** If `pnpm dev` is green and `pnpm test` passes, your
environment is correct.

### What the install actually does

| Step                   | What happens                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack enable`      | Activates the pnpm shim pinned via `package.json#packageManager`.                                                                       |
| `nvm use`              | Switches to Node 22 (`.nvmrc`).                                                                                                         |
| `pnpm install`         | Hydrates `node_modules` for every workspace from the frozen lockfile, then runs the `prepare` script which installs lefthook git hooks. |
| `cp .env.example .env` | Templated env for local dev. Validated at boot via the per-app env modules.                                                             |
| `docker compose up -d` | Starts Postgres 16 + MinIO containers — only needed if you touch storage/auth or want to test the API end-to-end.                       |

---

## 2. Folder discoverability — what lives where

| You want to…                                     | Look in                                                | Why                                                                              |
| ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Touch the **Reader UI**                          | `packages/reader-ui/`                                  | Toolbar, viewport, sidebar, TOC, status bar, preferences.                        |
| Touch the **Reader engine** (format-agnostic)    | `packages/reader-core/`                                | Lifecycle, state, commands, events, plugin host, `DocumentAdapter`.              |
| Touch the **PDF rendering**                      | `packages/pdf-adapter/`                                | `pdfjs-dist`-backed adapter. Owns text/TOC/destinations/links.                   |
| Touch the **rendering runtime**                  | `packages/render-engine/`                              | Viewport, virtualization, zoom — shared across formats.                          |
| Touch a **token / theme**                        | `packages/design-tokens/`                              | Atlas tokens + `styles/tokens.css`.                                              |
| Touch a **shared primitive**                     | `packages/ui/`                                         | Buttons, inputs, `ThemeProvider`.                                                |
| Touch the **web/API contract**                   | `packages/api-contracts/`                              | Zod schemas — the only shared types between web ↔ api.                           |
| Touch the **logger / errors**                    | `packages/telemetry/`                                  | Logger + RFC 9457 Problem Details.                                               |
| Touch the **Library**                            | `apps/web/src/library/` + `apps/core-api/src/library/` | Upload, list, detail, server-side persistence.                                   |
| Touch the **shell** (rail, topbar, theme switch) | `apps/web/src/shell/`                                  |                                                                                  |
| Touch a **route**                                | `apps/web/src/app/`                                    | Next.js App Router pages.                                                        |
| Add an **API module**                            | `apps/core-api/src/<module>/`                          | Each module is self-contained Nest module + controller + service + zod contract. |
| Add a **migration**                              | `apps/core-api/src/db/`                                | Drizzle schema + migrations live next to the service module.                     |
| Change **lint / TS / prettier presets**          | `packages/config/`                                     | One source of truth for every workspace.                                         |
| Change **CI**                                    | `.github/workflows/ci.yml`                             |                                                                                  |
| Change **dependency policy**                     | `.github/dependabot.yml` + `GOVERNANCE.md` §7          |                                                                                  |
| Change a **spec**                                | Root `*.md` files                                      | Canonical specs are at the root by design — they are first-class.                |

### The dependency direction (memorize this)

```
apps/web ─▶ reader-ui ─▶ render-engine ─▶ reader-core ─▶ pdf-adapter
                  │              │
                  ▼              ▼
            design-tokens / ui (no further down)
```

`apps/core-api` only imports from `packages/api-contracts`, `telemetry`,
and `config`. Anything else is a smell — open an issue first.

---

## 3. Command discoverability

| Command             | Use it when                         | What it actually does                                                 |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`          | Daily.                              | Runs `turbo run dev` — boots `apps/web` and `apps/core-api` together. |
| `pnpm build`        | Before opening a PR.                | `turbo run build` — full pipeline, package-aware.                     |
| `pnpm lint`         | Before opening a PR.                | `turbo run lint` — ESLint 9 flat config across the monorepo.          |
| `pnpm lint:fix`     | When the lint output is mechanical. | Same as `lint` but with `--fix`.                                      |
| `pnpm typecheck`    | Before opening a PR.                | `turbo run typecheck` — project-reference typecheck per workspace.    |
| `pnpm test`         | Before opening a PR.                | `turbo run test` — Vitest per package.                                |
| `pnpm format`       | When the formatter is angry.        | Prettier write across the repo.                                       |
| `pnpm format:check` | In CI parity check.                 | Prettier check — non-zero exit if anything drifts.                    |
| `pnpm clean`        | When `node_modules` rot.            | `turbo run clean` + delete root `node_modules`.                       |

### Focused commands (faster feedback)

```bash
# Run only one package's tests, in watch mode
pnpm --filter @bookhelper/reader-core test --watch

# Typecheck only the web app
pnpm --filter web typecheck

# Build only the pdf-adapter
pnpm --filter @bookhelper/pdf-adapter build
```

### Pre-PR pre-flight (one-liner)

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

This is **exactly** what CI runs. If it passes locally, CI will pass.

---

## 4. Documentation navigation

The docs are organized in three tiers — when in doubt, walk them in this
order:

1. **Surface** — what & why.
   - [`README.md`](../README.md) — landing.
   - [`PRD.md`](../PRD.md) — product requirements.
2. **Behavior** — what each feature does.
   - [`UX-SPECIFICATION.md`](../UX-SPECIFICATION.md) — canonical UX.
   - [`DESIGN-SYSTEM-SPEC.md`](../DESIGN-SYSTEM-SPEC.md) — Atlas.
   - [`FEATURE-SPECIFICATION.md`](../FEATURE-SPECIFICATION.md) — feature catalog.
   - [`READER-SPEC.md`](../READER-SPEC.md) — reader behavior contract.
3. **Implementation** — how it's built.
   - [`ARCHITECTURE.md`](../ARCHITECTURE.md).
   - Package READMEs.
   - Code.

Operational docs are at the root:

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — how to land a PR.
- [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md).
- [`SECURITY.md`](../SECURITY.md).
- [`GOVERNANCE.md`](../GOVERNANCE.md) — labels, milestones, release flow.
- [`CHANGELOG.md`](../CHANGELOG.md) — what shipped when.
- [`ROADMAP.md`](../ROADMAP.md), [`SPRINT-PLAN.md`](../SPRINT-PLAN.md).

This `docs/` directory holds documents _about_ the documentation:

- [`DOCUMENTATION-REVIEW.md`](./DOCUMENTATION-REVIEW.md) — audit & drift.
- [`REPOSITORY-METADATA.md`](./REPOSITORY-METADATA.md) — GitHub "About" section.
- [`REPOSITORY-POLISH-REPORT.md`](./REPOSITORY-POLISH-REPORT.md) — this sprint.

---

## 5. Editor setup

- **VS Code** is the reference editor. The repo ships
  `.vscode/extensions.json` (recommendations) and `.vscode/settings.json`
  (shared workspace settings). Both are intentionally minimal and
  formatter-driven.
- **Other editors** — `.editorconfig` covers indentation, EOL, trailing
  whitespace. Run Prettier + ESLint on save and you'll be fine.

---

## 6. Recommended improvements (post-`v0.1.0`)

These are **suggestions** — not part of `v0.1.0`, but they unlock the next
DX inflection. Track them as `Enhancement` issues.

| Idea                                                                | Win                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pnpm setup` one-shot**                                           | A short Node script that runs `corepack enable`, prints the toolchain it expects, validates `.env`, and starts Docker if requested. Cuts onboarding to one command. |
| **Devcontainer / Codespaces**                                       | `.devcontainer/devcontainer.json` + a `postCreate` script reusing the one-shot setup. First-time contributors don't need to install anything.                       |
| **`pnpm doctor`**                                                   | A diagnostic script: Node version, pnpm version, `.env` validity, port availability (3000/4000/5432/9000/9001), Docker reachability. Replaces the FAQ.              |
| **Storybook (or Ladle) for `packages/ui` and `packages/reader-ui`** | Visual playground per component / theme — cheap once tokens land.                                                                                                   |
| **Playwright smoke for the Reader**                                 | One e2e test: upload a PDF → open it → page through. Locks in the end-to-end flow.                                                                                  |
| **`turbo` remote cache**                                            | Faster CI; documented switch when the maintainer adds it.                                                                                                           |
| **CODEOWNERS**                                                      | Auto-route reviews. Tracked in `GOVERNANCE.md`.                                                                                                                     |
| **ADR scaffold**                                                    | `docs/adr/0000-template.md`. Tracked in `DOCUMENTATION-REVIEW.md`.                                                                                                  |

---

## 7. Troubleshooting (quick)

| Symptom                             | First thing to try                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm install` is slow / weird      | `corepack enable` (you might be on the wrong pnpm).                                                     |
| `lefthook` hooks didn't install     | `pnpm exec lefthook install`.                                                                           |
| Lint complains about flat config    | Ensure VS Code ESLint uses **flat config** (set in `.vscode/settings.json`).                            |
| Postgres won't start                | Free up port 5432, or override in `.env` + `docker-compose.yml`.                                        |
| `pdfjs` worker complains in tests   | Make sure the test imports the package via its public entry, not deep paths.                            |
| Tailwind classes not autocompleting | Install the `bradlc.vscode-tailwindcss` extension; the workspace settings already wire the regex hooks. |

For anything else — open a [Question issue](../.github/ISSUE_TEMPLATE/question.yml).
