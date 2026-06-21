<div align="center">

<!-- LOGO PLACEHOLDER -->
<a href="#">
  <img src=".github/assets/logo.svg" alt="BookHelper" width="120" height="120" />
</a>

# BookHelper

**An AI-first Reading & Knowledge Platform.**
Turn every book, paper, article, and talk into a personal, compounding body of knowledge.

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" /></a>
  <a href=".nvmrc"><img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A520.11-43853d?logo=node.js&logoColor=white" /></a>
  <a href="package.json"><img alt="pnpm" src="https://img.shields.io/badge/pnpm-9.15-F69220?logo=pnpm&logoColor=white" /></a>
  <a href="tsconfig.base.json"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" /></a>
  <a href="apps/web/package.json"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white" /></a>
  <a href="apps/web/package.json"><img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000" /></a>
  <a href=".github/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/BhaargavGuptaP/bookhelper/ci.yml?branch=main&label=CI&logo=github" /></a>
  <a href="#"><img alt="Coverage" src="https://img.shields.io/badge/coverage-tracked%20via%20vitest-informational" /></a>
  <a href="CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" /></a>
</p>

<!-- HERO IMAGE PLACEHOLDER -->
<p align="center">
  <img src=".github/assets/hero.png" alt="BookHelper — the Library and Reader" width="100%" />
</p>

</div>

---

> [!IMPORTANT]
> **BookHelper is not an ebook reader.** It is a knowledge engine that helps people **understand, remember, connect, and apply** what they read. The reader is just the surface — the substrate is your evolving personal knowledge graph.

---

## Table of contents

1. [Vision](#vision)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Architecture overview](#architecture-overview)
5. [Tech stack](#tech-stack)
6. [Folder structure](#folder-structure)
7. [Local development](#local-development)
8. [Build instructions](#build-instructions)
9. [Testing](#testing)
10. [Packages](#packages)
11. [Roadmap](#roadmap)
12. [Contributing](#contributing)
13. [License](#license)
14. [Acknowledgements](#acknowledgements)

---

## Vision

> _"A world where reading reliably becomes understanding that lasts."_

Most reading is **forgotten within weeks**. Most knowledge tools are either passive (ebook readers, highlights) or shallow (one-shot chat over a PDF). BookHelper takes a different bet:

- Every source — book, paper, article, podcast, video — becomes a **first-class document** with a stable locator, a typed adapter, and a reading surface.
- An **AI tutor** that actually knows what you've read and what you've forgotten, grounded in cited passages from your library.
- A **personal knowledge graph** that compounds across sources, surfacing concepts, claims, and contradictions.
- A **learning loop** (spaced repetition, mastery) that turns reading into durable memory.

The full product vision, principles, and personas live in **[PRD.md](./PRD.md)**.

---

## Features

Currently shipped in `v0.1.0` (this milestone):

- ✅ **Library** — upload, list, organize PDFs with metadata and progress.
- ✅ **PDF reader** — fast, virtualized, keyboard-first reading surface (`/read/[docId]`).
- ✅ **Reader Core** — format-agnostic engine (lifecycle, state, commands, events, plugins).
- ✅ **PDF Adapter** — TOC, text layer, navigation, capabilities, locators (built on `pdfjs-dist`).
- ✅ **Render Engine** — viewport, virtualization, zoom, theming.
- ✅ **Reader UI** — toolbar, viewport, sidebar, status bar, TOC, preferences.
- ✅ **Design system "Atlas"** — light / dark / high-contrast, token-driven, WCAG-AA at minimum.
- ✅ **API foundation** — NestJS core API with auth (OIDC/JWT), storage, health, audit.
- ✅ **Monorepo infrastructure** — pnpm workspaces, Turborepo, ESLint 9 flat config, Vitest, lefthook, commitlint, GitHub Actions CI.

Planned and on the roadmap (**not shipped yet**):

- 🔜 EPUB Adapter
- 🔜 Knowledge Engine (concepts, entities, claims)
- 🔜 AI Tutor & grounded Q&A
- 🔜 Spaced repetition / FSRS learning loop
- 🔜 Cross-source Knowledge Graph
- 🔜 Mobile and desktop clients

The canonical catalog lives in **[FEATURE-SPECIFICATION.md](./FEATURE-SPECIFICATION.md)** and **[FEATURE-BREAKDOWN.md](./FEATURE-BREAKDOWN.md)**.

---

## Screenshots

<!-- SCREENSHOT PLACEHOLDERS -->

|                      Library                       |                         Reader                         |                       Reader (dark)                        |
| :------------------------------------------------: | :----------------------------------------------------: | :--------------------------------------------------------: |
| ![Library](.github/assets/screenshots/library.png) | ![Reader](.github/assets/screenshots/reader-light.png) | ![Reader dark](.github/assets/screenshots/reader-dark.png) |

|                 Table of Contents                 |                            Preferences                            |                       High contrast                        |
| :-----------------------------------------------: | :---------------------------------------------------------------: | :--------------------------------------------------------: |
| ![TOC](.github/assets/screenshots/reader-toc.png) | ![Preferences](.github/assets/screenshots/reader-preferences.png) | ![High contrast](.github/assets/screenshots/reader-hc.png) |

> Replace these placeholders by dropping images into `.github/assets/screenshots/`.

---

## Architecture overview

BookHelper is a **modular monolith → services** monorepo. The frontend is a Next.js 15 App Router app; the backend is a NestJS 11 service; shared packages are strict, framework-agnostic boundaries.

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                       apps/web                          │
                     │  Next.js 15 · App Router · React 19 · Tailwind v4       │
                     │  ├─ shell (rail, topbar, theme)                         │
                     │  ├─ library (upload, list, details)                    │
                     │  └─ reader (route /read/[docId])                        │
                     └───────┬──────────────────────────────────────┬──────────┘
                             │ uses                                 │ calls
                             ▼                                      ▼
   ┌──────────────────────────────────────────────┐     ┌────────────────────────────────┐
   │           packages/reader-ui                  │     │       apps/core-api            │
   │  Reader shell · Toolbar · Viewport · TOC      │     │  NestJS · OIDC/JWT · Drizzle   │
   └───────┬───────────────┬─────────────────┬─────┘     │  Storage · Library · Audit     │
           │ uses          │ uses            │ uses      └───────────┬────────────────────┘
           ▼               ▼                 ▼                       │
 ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐      │
 │ render-engine    │ │ reader-core      │ │ design-tokens/ui │      │
 │ viewport · zoom  │ │ lifecycle · state│ │ Atlas tokens     │      │
 │ virtualization   │ │ commands · plugin│ │ React primitives │      │
 └─────────┬────────┘ └─────────┬────────┘ └──────────────────┘      │
           │ implements         │ adapter seam                       │
           ▼                    ▼                                    │
 ┌─────────────────────────────────────────────┐                     │
 │              packages/pdf-adapter            │                     │
 │  pdfjs-dist · manifest · text · TOC · links  │                     │
 └─────────────────────────────────────────────┘                     │
                                                                     │
 ┌─────────────────────────────────────────────┐  shared contracts   │
 │  packages/api-contracts  (zod schemas)      │◀────────────────────┘
 └─────────────────────────────────────────────┘
```

**Dependency direction is strictly downward.** UI never reaches into adapters; adapters never reach into UI. The seam between the format-agnostic reader and the format-specific implementation is the `DocumentAdapter` interface in `@bookhelper/reader-core`.

The full architecture (layering, transports, data stores, deployment targets) is documented in **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Tech stack

| Layer             | Tooling                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Monorepo**      | pnpm workspaces · Turborepo 2                                                                   |
| **Web**           | Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · TanStack Query                           |
| **Core API**      | NestJS 11 · TypeScript (strict)                                                                 |
| **Database**      | PostgreSQL 16 · Drizzle ORM                                                                     |
| **Storage**       | S3 / Cloudflare R2 (abstracted) · MinIO for local dev                                           |
| **Auth**          | OIDC (WorkOS-compatible) JWT verification                                                       |
| **PDF**           | `pdfjs-dist`                                                                                    |
| **Quality**       | TypeScript 5.7 · ESLint 9 (flat) · Prettier 3 · Vitest · lefthook · commitlint · GitHub Actions |
| **Design system** | "Atlas" — token-driven · light / dark / high-contrast                                           |

---

## Folder structure

```
bookhelper/
├─ apps/
│  ├─ web/                # Next.js 15 web app (shell, library, reader)
│  └─ core-api/           # NestJS API (auth, storage, library, audit, health)
├─ packages/
│  ├─ config/             # shared eslint / prettier / tsconfig presets
│  ├─ design-tokens/      # Atlas tokens + theme CSS (light/dark/high-contrast)
│  ├─ ui/                 # shared React primitives + ThemeProvider
│  ├─ telemetry/          # logger + structured errors (RFC 9457 Problem Details)
│  ├─ api-contracts/      # shared zod schemas (web ↔ api boundary)
│  ├─ reader-core/        # format-agnostic reader engine + adapter seam
│  ├─ render-engine/      # viewport, zoom, virtualization
│  ├─ pdf-adapter/        # PDF DocumentAdapter (pdfjs-dist)
│  └─ reader-ui/          # Reader shell UI (toolbar, viewport, TOC, prefs)
├─ .github/               # CI workflows, issue & PR templates, assets
├─ docs/                  # extended documentation (generated from specs)
├─ ARCHITECTURE.md        # system design
├─ PRD.md                 # product requirements
├─ UX-SPECIFICATION.md    # experience & behavior
├─ DESIGN-SYSTEM-SPEC.md  # Atlas design language
├─ FEATURE-SPECIFICATION.md
├─ FEATURE-BREAKDOWN.md
├─ READER-SPEC.md
├─ ROADMAP.md
└─ SPRINT-PLAN.md
```

> See [DOCUMENTATION-REVIEW.md](./docs/DOCUMENTATION-REVIEW.md) for the canonical map of every document and its role.

---

## Local development

### Prerequisites

- **Node.js** `>=20.11` (project pins via [`.nvmrc`](./.nvmrc) — `22`)
- **pnpm** `9.15` (via `corepack enable pnpm`)
- **Docker** (optional, for local Postgres + MinIO via `docker-compose.yml`)

### Setup

```bash
# 1. Clone
git clone https://github.com/BhaargavGuptaP/bookhelper.git
cd bookhelper

# 2. Toolchain
corepack enable
nvm use            # if you use nvm

# 3. Install (also installs git hooks via lefthook)
pnpm install

# 4. Env
cp .env.example .env

# 5. Optional: start Postgres + MinIO
docker compose up -d

# 6. Run the full dev stack (web + core-api)
pnpm dev
```

Then open:

- Web: <http://localhost:3000>
- Core API: <http://localhost:4000/health>
- MinIO console: <http://localhost:9001> (`minioadmin` / `minioadmin`)

### Common commands

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Run all apps in dev mode (Turborepo)    |
| `pnpm build`        | Build every app and package             |
| `pnpm lint`         | ESLint across the monorepo              |
| `pnpm typecheck`    | TypeScript project references typecheck |
| `pnpm test`         | Vitest across every package             |
| `pnpm format`       | Prettier write                          |
| `pnpm format:check` | Prettier check (CI)                     |
| `pnpm clean`        | Remove build outputs and `node_modules` |

### Editor

A recommended VS Code extension list lives in `.vscode/extensions.json`. The repository ships an `.editorconfig` and Prettier/ESLint configs — no editor-specific setup is required beyond the recommended extensions.

---

## Build instructions

Production builds are driven by Turborepo. The build is deterministic given a clean `node_modules` and a frozen lockfile.

```bash
pnpm install --frozen-lockfile
pnpm build
```

Build outputs:

- `apps/web/.next/` — Next.js production build
- `apps/core-api/dist/` — NestJS compiled output
- `packages/*/dist/` — Tsup/tsc package builds
- `packages/design-tokens/styles/tokens.css` — generated theme CSS

CI runs the equivalent of: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every push and PR to `main` (see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

---

## Testing

- **Test runner:** Vitest (per-package config).
- **UI tests:** React Testing Library on top of Vitest (jsdom).
- **Contracts:** zod schema tests live next to their schemas in `packages/api-contracts`.

```bash
pnpm test                       # all packages
pnpm --filter @bookhelper/reader-core test
pnpm --filter @bookhelper/pdf-adapter test --watch
```

**Expectations** (enforced by review, not yet by a coverage gate):

- Every public API in a package has a test.
- Every reader command, lifecycle transition, and adapter capability is covered.
- Snapshot tests are reserved for stable, intentional outputs.

---

## Packages

| Package                                                 | Purpose                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`@bookhelper/reader-core`](./packages/reader-core)     | Format-agnostic reader engine: lifecycle, state, commands, events, plugins, the `DocumentAdapter` seam. |
| [`@bookhelper/render-engine`](./packages/render-engine) | Viewport, virtualization, zoom — the format-agnostic rendering runtime.                                 |
| [`@bookhelper/pdf-adapter`](./packages/pdf-adapter)     | PDF implementation of `DocumentAdapter` (manifest, text, TOC, navigation, links).                       |
| [`@bookhelper/reader-ui`](./packages/reader-ui)         | Reader shell UI: toolbar, viewport, sidebar, TOC, status bar, preferences.                              |
| [`@bookhelper/design-tokens`](./packages/design-tokens) | Atlas tokens + theme CSS (light/dark/high-contrast).                                                    |
| [`@bookhelper/ui`](./packages/ui)                       | Shared React primitives and `ThemeProvider`.                                                            |
| [`@bookhelper/api-contracts`](./packages/api-contracts) | Zod schemas — the canonical web ↔ api contract boundary.                                                |
| [`@bookhelper/telemetry`](./packages/telemetry)         | Logger + structured errors (RFC 9457 Problem Details).                                                  |
| [`@bookhelper/config`](./packages/config)               | Shared ESLint / Prettier / tsconfig presets.                                                            |

---

## Roadmap

| Milestone | Theme                                         | Status     |
| --------- | --------------------------------------------- | ---------- |
| **v0.1**  | Foundations + Library + PDF Reader            | ✅ shipped |
| **v0.2**  | EPUB Adapter + reader polish                  | 🔜 next    |
| **v0.3**  | Knowledge Engine (concepts, entities, claims) | planned    |
| **v0.4**  | AI Tutor + grounded Q&A                       | planned    |
| **v0.5**  | Spaced repetition / FSRS learning loop        | planned    |
| **v0.6**  | Cross-source Knowledge Graph                  | planned    |
| **v0.7**  | Mobile + desktop clients                      | planned    |
| **v1.0**  | First Lovable Product GA                      | planned    |

See **[ROADMAP.md](./ROADMAP.md)** for the full execution plan, and **[CHANGELOG.md](./CHANGELOG.md)** for what shipped when.

---

## Contributing

Contributions are very welcome — bug reports, feature requests, and pull requests alike.

- Start with **[CONTRIBUTING.md](./CONTRIBUTING.md)** (branch strategy, commit conventions, PR workflow, coding standards).
- Be excellent to each other — see **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)**.
- For vulnerabilities, see **[SECURITY.md](./SECURITY.md)**.
- Issues are labeled (`good first issue`, `help wanted`, `Reader`, `Library`, `Architecture`, …) — start there.

> **One rule:** code never contradicts the canonical specs (`PRD.md`, `ARCHITECTURE.md`, `UX-SPECIFICATION.md`, `DESIGN-SYSTEM-SPEC.md`, `FEATURE-SPECIFICATION.md`). If implementation reveals a flaw, the documentation is updated in the same change.

---

## License

BookHelper is licensed under the **Apache License 2.0** — see [LICENSE](./LICENSE). See [CONTRIBUTING.md](./CONTRIBUTING.md#license-of-contributions) for contributor notes.

---

## Acknowledgements

BookHelper stands on the shoulders of giants and would not exist without:

- [Mozilla `pdf.js`](https://github.com/mozilla/pdf.js) — the PDF rendering engine that powers the PDF adapter.
- [Next.js](https://nextjs.org), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com) — the web foundation.
- [NestJS](https://nestjs.com), [Drizzle ORM](https://orm.drizzle.team) — the API foundation.
- [Turborepo](https://turbo.build/repo), [pnpm](https://pnpm.io), [Vitest](https://vitest.dev), [lefthook](https://github.com/evilmartians/lefthook), [commitlint](https://commitlint.js.org) — the developer-experience scaffolding.
- The product, design, and engineering inspirations that shape the **Atlas** design language: Vercel (Geist), Linear, Raycast, Apple HIG, Notion, Cursor, Arc.

---

<div align="center">

**[Website](https://bookhelper.dev)** · **[Docs](./PRD.md)** · **[Roadmap](./ROADMAP.md)** · **[Changelog](./CHANGELOG.md)** · **[Discussions](https://github.com/BhaargavGuptaP/bookhelper/discussions)**

</div>
