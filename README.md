# BookHelper

An **AI-first Reading & Knowledge Platform** — transform books (and every other source) into personalized learning experiences. Not an ebook reader; a knowledge engine that helps people understand, remember, connect, and apply what they read.

This repository is the product monorepo. The canonical product documents are the single source of truth:

| Doc                                                      | Authority                               |
| -------------------------------------------------------- | --------------------------------------- |
| [`PRD.md`](./PRD.md)                                     | What & why (product requirements)       |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                   | How it's built (system design)          |
| [`UX-SPECIFICATION.md`](./UX-SPECIFICATION.md)           | Experience & behavior                   |
| [`DESIGN-SYSTEM-SPEC.md`](./DESIGN-SYSTEM-SPEC.md)       | Visual & interaction language ("Atlas") |
| [`FEATURE-SPECIFICATION.md`](./FEATURE-SPECIFICATION.md) | Canonical feature catalog               |

> **Rule:** code never contradicts these documents. If implementation reveals a flaw, the documentation is updated in the same change.

## Tech stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** Next.js 15 (App Router, React 19, RSC) + Tailwind CSS v4
- **Core API:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL + Drizzle ORM
- **Storage:** S3 / Cloudflare R2 (abstracted; local-filesystem driver for dev)
- **Auth:** OIDC (WorkOS-compatible) JWT verification
- **Quality:** TypeScript (strict), ESLint 9 (flat), Prettier, Vitest, lefthook, commitlint, GitHub Actions

## Repository layout

```
apps/
  web/         # Next.js 15 web app (shell, theme, reader — built incrementally)
  core-api/    # NestJS API (auth, storage, health, db foundation)
packages/
  config/         # shared eslint / prettier / tsconfig presets
  design-tokens/  # "Atlas" design tokens + theme CSS (light/dark/high-contrast)
  ui/             # shared React primitives + ThemeProvider
  telemetry/      # logger + structured errors (RFC 9457 Problem Details)
  api-contracts/  # shared zod schemas (the web↔api contract boundary)
  reader-core/    # format-agnostic Reader platform (lifecycle, state, commands, adapter seam)
  render-engine/  # format-agnostic rendering runtime (viewport, zoom, virtualization)
  pdf-adapter/    # PDF DocumentAdapter (pdfjs-dist) — parsing/text/TOC/navigation
  reader-ui/      # Reader shell UI (toolbar, viewport, TOC, status bar, preferences)
```

## Getting started

Requirements: Node `>=20.11` (use `.nvmrc`), pnpm `9.15` (via `corepack enable pnpm`), Docker (optional, for local Postgres + MinIO).

```bash
corepack enable pnpm
pnpm install                 # installs deps + git hooks (lefthook)
cp .env.example .env         # fill in as needed
docker compose up -d         # optional: Postgres + MinIO for local dev

pnpm dev                     # run web + core-api in dev
pnpm build                   # build everything
pnpm lint && pnpm typecheck && pnpm test
```

## Conventions

- **Commits:** Conventional Commits, scoped to a package/domain (`feat(web): …`). Enforced by commitlint.
- **Hooks:** pre-commit formats + lints staged files; pre-push runs typecheck + tests.
- **Accessibility & responsiveness are not optional** — every UI change ships keyboard-operable, screen-reader-labeled, themed (light/dark/high-contrast), and responsive (see `UX-SPECIFICATION.md` §12, §11).

Built sprint by sprint per [`SPRINT-PLAN.md`](./SPRINT-PLAN.md). Current baseline: **Sprint 3C.2 — Reader Shell UI** (the first complete Library → Reader experience over the PDF adapter; route `/read/[docId]`).
