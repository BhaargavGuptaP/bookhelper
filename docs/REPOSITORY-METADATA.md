# Repository Metadata Recommendations

> These values configure the GitHub repository's discoverability surface —
> the "About" sidebar, search results, and link previews. Apply them via
> **Settings → General** (or `gh repo edit`) and **Settings → Code → About**.
> They are recommendations; the maintainer has final authority.

---

## 1. Repository description

Pick one — both are <350 chars, the GitHub limit is 350.

**Primary (recommended):**

> An AI-first reading & knowledge platform — turn every book, paper, article, and talk into a personal, compounding body of knowledge. v0.1: Library + PDF Reader. Roadmap: EPUB · Knowledge Engine · AI Tutor · Spaced repetition.

**Shorter alternative:**

> Turn every book, paper, article, and talk into a personal, compounding body of knowledge. A calm, AI-first reader → knowledge engine → learning loop. TypeScript monorepo.

---

## 2. Website

`https://bookhelper.dev` _(placeholder — replace with the actual marketing
URL when it ships; until then, set to the GitHub Pages site if any, or
leave blank — do **not** point at a placeholder that 404s)._

---

## 3. Topics (GitHub "Topics" tags)

GitHub allows up to 20 topics. Prefer **all-lowercase, hyphenated**.
Recommended set — chosen for discoverability over cleverness:

```
bookhelper
reading
ai
knowledge-graph
knowledge-management
pdf
pdfjs
epub
spaced-repetition
rag
tutor
nextjs
react
typescript
nestjs
turborepo
pnpm
monorepo
design-system
accessibility
```

Apply via the CLI:

```bash
gh repo edit BhaargavGuptaP/bookhelper \
  --add-topic bookhelper,reading,ai,knowledge-graph,knowledge-management,pdf,pdfjs,epub,spaced-repetition,rag,tutor,nextjs,react,typescript,nestjs,turborepo,pnpm,monorepo,design-system,accessibility
```

---

## 4. Social preview image

Repository → **Settings → General → Social preview** accepts a 1280×640
PNG/JPG (≤ 1 MB). Recommended composition (matches Atlas):

- **Background:** `--bg-canvas` dark (`#0B0D10`).
- **Logo:** centered upper third, monochrome.
- **Wordmark:** `BookHelper` set in Geist Sans 96 px, color `--fg-default`.
- **Tagline:** `An AI-first Reading & Knowledge Platform.` 32 px,
  `--fg-muted`.
- **Accent:** a single Atlas accent stripe (`--accent-default`) along the
  bottom edge — no other color.
- **Bleed:** 64 px safe margin on all sides.

Save the source under `.github/assets/social-preview/` and upload via
the GitHub UI.

---

## 5. "About" section checklist

In **Settings → Code → About**, tick the following:

- [x] Description: from §1.
- [x] Website: from §2 (only when live).
- [x] Topics: from §3.
- [x] **Use your GitHub Pages website** — only if/when Pages is wired.
- [x] Releases — enabled.
- [x] Packages — enabled (will surface once anything is published).
- [x] Deployments — enabled.

In **Settings → General**:

- [x] Default branch: `main`.
- [x] Allow merge commits: ❌ disabled.
- [x] Allow squash merging: ✅ enabled (default).
- [x] Allow rebase merging: ❌ disabled.
- [x] **Always suggest updating pull request branches:** ✅
- [x] **Allow auto-merge:** ✅
- [x] **Automatically delete head branches:** ✅

In **Settings → Code & automation**:

- [x] **Issues:** enabled, blank issues disabled (see `.github/ISSUE_TEMPLATE/config.yml`).
- [x] **Discussions:** enabled (already referenced from templates).
- [x] **Pull requests:** ✅
- [x] **Wiki:** disabled — docs live in the repo.
- [x] **Projects:** enabled (single board per `GOVERNANCE.md` §4).

In **Settings → Security**:

- [x] **Private vulnerability reporting:** ✅ (see `SECURITY.md`).
- [x] **Dependabot alerts:** ✅
- [x] **Dependabot security updates:** ✅
- [x] **Dependabot version updates:** ✅ (controlled by `.github/dependabot.yml`).
- [x] **Secret scanning:** ✅
- [x] **Push protection:** ✅
- [x] **Code scanning:** ✅ (CodeQL workflow already present).
- [x] **Branch protection on `main`:** see `GOVERNANCE.md` §5.2.

---

## 6. Pinned items

In the user/org profile, pin this repository. Inside the repo, **pin three
issues** when the labels are applied:

1. A `Good First Issue` discovery issue.
2. The active milestone tracking issue (e.g. "v0.2 — EPUB Adapter").
3. A `Documentation` issue linking to `docs/DOCUMENTATION-REVIEW.md`.

---

## 7. Quick-apply script (`gh`)

```bash
# Description + homepage + topics
gh repo edit BhaargavGuptaP/bookhelper \
  --description "An AI-first reading & knowledge platform — turn every book, paper, article, and talk into a personal, compounding body of knowledge. v0.1: Library + PDF Reader. Roadmap: EPUB · Knowledge Engine · AI Tutor · Spaced repetition." \
  --homepage "https://bookhelper.dev" \
  --add-topic bookhelper,reading,ai,knowledge-graph,knowledge-management,pdf,pdfjs,epub,spaced-repetition,rag,tutor,nextjs,react,typescript,nestjs,turborepo,pnpm,monorepo,design-system,accessibility

# Default branch + merge rules
gh api -X PATCH repos/BhaargavGuptaP/bookhelper \
  -f allow_merge_commit=false \
  -f allow_rebase_merge=false \
  -f allow_squash_merge=true \
  -f allow_auto_merge=true \
  -f delete_branch_on_merge=true \
  -f has_wiki=false \
  -f has_projects=true
```

Branch-protection rules and security toggles still require the UI in the
current GitHub product — see `GOVERNANCE.md` §5.2.
