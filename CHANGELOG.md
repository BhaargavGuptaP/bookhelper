# Changelog

All notable changes to **BookHelper** are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

> **Scope.** This changelog tracks the public product surface (apps, packages,
> documented behavior). Internal refactors that do not affect the public API
> are not listed. Pre-`1.0` minor versions may include breaking changes — they
> will be called out explicitly under **Breaking changes**.

---

## [Unreleased]

### Added

- _Nothing yet — `v0.2` work (EPUB Adapter) tracked in [ROADMAP.md](./ROADMAP.md)._

### Changed

- _n/a_

### Fixed

- _n/a_

---

## [0.1.0] — 2026-06-21

> **First public milestone — “Foundation + Library + PDF Reader”.**
> The end-to-end Reader flow works: upload a PDF in the Library, open it from
> `/read/[docId]`, navigate via TOC and keyboard, change preferences and theme.
> This release establishes the architectural seams, design system, and
> developer-experience baseline for everything that follows.

### Added

#### Apps

- **`apps/web`** — Next.js 15 (App Router) + React 19 web app.
  - Shell (rail, topbar, theme switching: light / dark / high-contrast).
  - Library surface: upload, list, document detail.
  - Reader route `/read/[docId]` mounting the format-agnostic Reader.
  - Test setup with Vitest + jsdom + React Testing Library.
- **`apps/core-api`** — NestJS 11 service.
  - OIDC/JWT authentication module.
  - Storage abstraction (S3-compatible + local dev driver).
  - Library module (document CRUD, ingestion handoff).
  - Extraction module wiring (PDF text extraction surface).
  - Health endpoint, structured audit trail.
  - Drizzle ORM + PostgreSQL schema scaffolding.

#### Packages

- **`@bookhelper/reader-core`** — format-agnostic reader engine:
  lifecycle, state, commands, events, navigation, locator, plugin host,
  session, capabilities, and the `DocumentAdapter` seam.
- **`@bookhelper/render-engine`** — viewport, virtualization, zoom, theming
  runtime shared across formats.
- **`@bookhelper/pdf-adapter`** — PDF implementation of `DocumentAdapter`
  on `pdfjs-dist`: manifest builder, text layer, TOC, navigation engine,
  destinations, links, images, page cache, locator codec.
- **`@bookhelper/reader-ui`** — Reader shell UI: `Reader`, `ReaderShell`,
  `ReaderToolbar`, `ReaderViewport`, `ReaderSidebar`, `ReaderStatusBar`,
  `ReaderPage`, `ReaderPreferencesPanel`, `TableOfContents`, content cache.
- **`@bookhelper/design-tokens`** — Atlas tokens + generated theme CSS
  (light / dark / high-contrast), token TypeScript exports.
- **`@bookhelper/ui`** — shared React primitives and `ThemeProvider`.
- **`@bookhelper/api-contracts`** — zod schemas for the web ↔ API boundary
  (auth, documents, storage, health, audit, errors).
- **`@bookhelper/telemetry`** — logger + structured errors (RFC 9457
  Problem Details).
- **`@bookhelper/config`** — shared ESLint 9 (flat) / Prettier 3 /
  TypeScript presets (`base`, `node`, `nextjs`, `react-library`).

#### Tooling & Repository

- pnpm workspaces + Turborepo 2 pipeline (`dev`, `build`, `lint`,
  `typecheck`, `test`, `clean`).
- ESLint 9 flat config with `eslint-plugin-react-hooks` and
  `eslint-plugin-jsx-a11y`.
- Prettier 3 with workspace-wide config.
- Vitest per-package configuration.
- lefthook pre-commit and commit-msg hooks.
- commitlint with Conventional Commits + repo scope allowlist.
- GitHub Actions CI: format check → lint → typecheck → test → build.
- `docker-compose.yml` for local PostgreSQL + MinIO.
- Environment template (`.env.example`).
- `.editorconfig`, `.nvmrc` (Node 22), `.npmrc`, `.prettierignore`.

#### Documentation

- `README.md` — vision, features, architecture, packages, dev guide.
- `ARCHITECTURE.md` — full system architecture.
- `PRD.md` — product requirements.
- `UX-SPECIFICATION.md`, `DESIGN-SYSTEM-SPEC.md` — canonical UX & Atlas.
- `FEATURE-SPECIFICATION.md`, `FEATURE-BREAKDOWN.md` — feature catalog.
- `READER-SPEC.md` — Reader behavioral contract.
- `AI-ENGINE-SPEC.md`, `KNOWLEDGE-ENGINE-SPEC.md` — forward-looking specs.
- `ROADMAP.md`, `SPRINT-PLAN.md` — execution plan.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`.
- Package READMEs for `reader-core`, `reader-ui`, `pdf-adapter`,
  `render-engine`.

### Known limitations

- **EPUB adapter is not shipped.** Tracked for `v0.2`.
- **No AI / Knowledge Engine yet.** Tracked for `v0.3`–`v0.5`.
- **No mobile/desktop clients.** Web only at this stage.
- Test coverage is enforced by review, not by a coverage gate (planned for
  `v0.2`).
- The reader currently supports only the PDF adapter. The format-agnostic
  seams exist, but no second adapter has yet exercised them.

### Security

- OIDC/JWT verification path established; secrets never logged.
- `.env` excluded from VCS by `.gitignore`; only `.env.example` is tracked.
- Vulnerability reporting policy: see [`SECURITY.md`](./SECURITY.md).

---

## Release tagging

Releases are tagged on `main` as `vMAJOR.MINOR.PATCH` (e.g. `v0.1.0`). Each
tag corresponds to a section in this file and a GitHub Release with the same
notes.

## Diff links

[Unreleased]: https://github.com/BhaargavGuptaP/bookhelper/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BhaargavGuptaP/bookhelper/releases/tag/v0.1.0
