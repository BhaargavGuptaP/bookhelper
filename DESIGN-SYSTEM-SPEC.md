# BookHelper — Canonical Design System Specification

## "Atlas" — the single source of truth for design & frontend

> **This is the canonical design system.** Every designer and frontend engineer builds against it. It is authoritative for visual + interaction language; the [UX-SPECIFICATION.md](UX-SPECIFICATION.md) is authoritative for experience/behavior, the [PRD.md](PRD.md) for product scope.
>
> This document **absorbs and supersedes** the earlier overview ([DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)) — same codename, same token values, expanded to canonical depth (full component library, content design, governance).
>
> **No code. No Figma. Documentation only.** Tokens are expressed as design values (hex, rem, ms, ratios) — the contract a frontend engineer implements; not the implementation.

**Design language in one line:** *A calm, near-monochrome canvas (Vercel/Notion) with one intelligent accent (Arc/Linear), depth from soft materials not heavy shadow (Apple), keyboard-first command surfaces (Raycast), and spring-based, reduced-motion-aware motion — dark-first, light a first-class peer.*

**Token architecture (3 tiers):** Primitive (raw values) → Semantic (intent, theme-aware) → Component (scoped). Components reference **semantic** tokens only; themes remap the semantic layer; components never change.

---

## Table of Contents
1. [Design Philosophy](#section-1--design-philosophy)
2. [Design Tokens](#section-2--design-tokens)
3. [Color System](#section-3--color-system)
4. [Typography](#section-4--typography)
5. [Iconography](#section-5--iconography)
6. [Component Library](#section-6--component-library)
7. [Reader Components](#section-7--reader-components)
8. [AI Components](#section-8--ai-components)
9. [Knowledge Components](#section-9--knowledge-components)
10. [Learning Components](#section-10--learning-components)
11. [Motion System](#section-11--motion-system)
12. [Responsive Design](#section-12--responsive-design)
13. [Accessibility](#section-13--accessibility)
14. [Content Design](#section-14--content-design)
15. [Design Governance](#section-15--design-governance)

---

# SECTION 1 — DESIGN PHILOSOPHY

Each statement includes **what** and **why it exists**. When principles conflict, *Reading* and *Trust* win.

### 1.1 Brand Personality
**What:** Intelligent, calm, trustworthy, precise, warm-but-not-cute. A brand that feels like a knowledgeable companion — confident, never loud; helpful, never needy.
**Why:** Our users entrust us with their intellectual life. The brand must read as *credible and serious* (so a researcher trusts the citations) yet *inviting and human* (so a lifelong learner isn't intimidated). We are the quiet expert in the room, not the salesperson.

### 1.2 Product Personality
**What:** A precision instrument that disappears in use. Fast, focused, keyboard-fluent for experts; gentle and progressively-disclosed for newcomers. Opinionated defaults, deep configurability.
**Why:** The product is a *tool for thinking*. Great tools have personality through craft and restraint, not decoration. It should feel like Linear's speed, Notion's flexibility, and Apple's polish — applied to reading and learning.

### 1.3 Visual Philosophy
**What:** Near-monochrome foundation; one expressive accent used with intent (≤10% of any view); depth through soft materials and elevation, not heavy shadow or ornament; typography-led hierarchy; generous whitespace.
**Why:** Color and ornament are cognitive load. A monochrome canvas lets *content* (the user's books and knowledge) be the color. Restraint is what makes the rare accent meaningful and the reading surface calm.

### 1.4 Interaction Philosophy
**What:** Direct, responsive, keyboard-first, forgiving. Optimistic UI; instant feedback (<100ms); undo over confirm; recognition over recall (command palette + visible affordances). Summon, don't impose.
**Why:** Interactions should feel like extensions of thought, not transactions with software. Latency and friction break flow; forgiveness builds trust; keyboard-first respects power users without excluding anyone.

### 1.5 Motion Philosophy
**What:** Motion clarifies relationships and confirms actions — never decorates. Restrained, physical, fast (≤320ms); spring for spatial, ease for fades; elements animate from their origin. **The reading canvas is perfectly still at rest.**
**Why:** Purposeful motion *reduces* load by answering "what just happened / where did it go?" Decorative motion *adds* load and, in a reading product, destroys the calm. Every animation must earn its place.

### 1.6 AI Philosophy
**What:** AI has a distinct, recognizable visual signature (the violet→blue gradient + soft glow) so users always know "this is the system thinking/speaking." It is summoned, grounded, and always cited. Calm presence, never ambient noise.
**Why:** Users must instantly distinguish *their content* from *AI output* — for trust and clarity. A consistent, unmistakable AI identity makes provenance legible and the assistant feel like one coherent companion, not scattered features.

### 1.7 Reading Philosophy
**What:** The reading surface is sacred: only content at rest, typographic excellence, measure-constrained columns, reader-specific themes (independent of app chrome), full typographic control, zero distraction.
**Why:** Reading is the foundation of everything we build. If reading isn't beautiful and calm, no amount of intelligence on top matters. We earn the right to add features by first protecting the page.

---

# SECTION 2 — DESIGN TOKENS

### 2.1 Typography (families)
| Role | Family | Fallback |
|---|---|---|
| UI / Sans | Geist Sans | Inter, system-ui |
| Reading / Serif | Tiempos Text | Source Serif 4, Georgia |
| Reading / Sans alt | Inter | system-ui |
| Mono | Geist Mono | JetBrains Mono, ui-monospace |
| Accessible reading | Atkinson Hyperlegible | — |

Features: `tabular-nums` for data/tables/timers; ligatures off in mono. Weights used: 400, 450 (mono), 500, 600 — **no 700+ in UI** (hierarchy via size/color/space).

### 2.2 Font Scale (UI; base 16px / 1rem)
| Token | Size | Line height | Weight | Tracking |
|---|---|---|---|---|
| `display-lg` | 48 | 52 | 600 | -0.02em |
| `display-md` | 36 | 40 | 600 | -0.02em |
| `heading-xl` | 28 | 34 | 600 | -0.015em |
| `heading-lg` | 22 | 28 | 600 | -0.01em |
| `heading-md` | 18 | 24 | 600 | -0.005em |
| `heading-sm` | 15 | 20 | 600 | 0 |
| `body-lg` | 16 | 26 | 400 | 0 |
| `body-md` | 14 | 22 | 400 | 0 |
| `body-sm` | 13 | 18 | 400 | 0 |
| `label` | 14 | 16 | 500 | 0 |
| `label-sm` | 12 | 16 | 500 | 0.01em |
| `caption` | 12 | 16 | 400 | 0.01em |
| `overline` | 11 | 14 | 600 | 0.06em (UPPERCASE) |
| `code` | 13 | 20 | 450 | 0 |

### 2.3 Spacing Scale (4px base, 8px rhythm)
`0`=0 · `px`=1 · `0.5`=2 · `1`=4 · `2`=8 · `3`=12 · `4`=16 · `5`=20 · `6`=24 · `8`=32 · `10`=40 · `12`=48 · `16`=64 · `20`=80 · `24`=96. Density modes: `comfortable` (default), `compact` (×0.75 vertical paddings — power surfaces).

### 2.4 Border Radius
`none`=0 · `xs`=4 · `sm`=6 · `md`=8 · `lg`=12 · `xl`=16 · `2xl`=20 · `full`=9999. **Concentric rule:** inner radius = outer − padding.

### 2.5 Border Widths
`hairline`=1 (default borders/dividers) · `thin`=1.5 (icon stroke) · `medium`=2 (focus emphasis, active indicators) · `thick`=3 (selection rings). Never decorative; carry meaning (separation, focus, selection).

### 2.6 Elevation (perceived height = importance)
| Level | Use | Light | Dark |
|---|---|---|---|
| `e0` | flush content | none | none |
| `e1` | cards, inputs | `shadow-xs` + subtle border | surface.3 + subtle border |
| `e2` | hover cards, popovers | `shadow-sm` | surface.4 + default border |
| `e3` | dropdowns, menus | `shadow-md` + border | surface.4 + border + top-highlight |
| `e4` | dialogs, sheets | `shadow-lg` | surface.4 + border + softened shadow |
| `e5` | command palette, toasts | `shadow-xl` + blur | surface.4 + border + shadow-xl + `glow-ai` (palette) |

On **dark**, elevation reads via lighter surface + hairline border + faint top inner-highlight (Apple "lit from above"); shadow is supportive.

### 2.7 Shadow System (two-layer: contact + ambient; low opacity)
| Token | Light | Dark |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgb(0 0 0 /.04)` | `0 1px 2px rgb(0 0 0 /.3)` |
| `shadow-sm` | `0 1px 2px /.05, 0 2px 6px /.05` | `0 2px 6px /.4` |
| `shadow-md` | `0 2px 4px /.05, 0 6px 16px /.08` | `0 6px 16px /.5` |
| `shadow-lg` | `0 4px 8px /.06, 0 12px 32px /.10` | `0 12px 32px /.55` |
| `shadow-xl` | `0 8px 16px /.08, 0 24px 56px /.14` | `0 24px 56px /.6` |
| `shadow-focus` | `0 0 0 3px focus.ring` | same |
| `glow-ai` | `0 0 24px rgb(110 86 207 /.25)` | `0 0 32px rgb(110 86 207 /.35)` |
Shadows are never colored except `glow-ai`. Inner shadow only for inset wells.

### 2.8 Blur System (materials — Apple/Raycast frost)
`blur-sm`=8px · `blur-md`=20px (default overlay frost) · `blur-lg`=40px (full-screen scrims). Applied to `e3+` overlays with ~80% surface opacity. **Disabled under `prefers-reduced-transparency`** → solid `surface.overlay`.

### 2.9 Opacity Scale
`0`=0 · `subtle`=0.04 (hover overlay) · `muted`=0.08 · `disabled`=0.4 (disabled content) · `secondary`=0.6 · `scrim-light`=0.4 · `scrim-dark`=0.6 · `full`=1. Semantic uses: hover-overlay `subtle`, disabled `disabled`, scrim per theme.

### 2.10 Animation Timing
`instant`=0 · `fast`=120ms · `base`=180ms · `moderate`=240ms · `slow`=320ms · `slower`=480ms. Exits ~30% faster than enters.

### 2.11 Animation Curves
`ease-standard` `cubic-bezier(.2,0,0,1)` · `ease-out` `(0,0,.2,1)` (enters) · `ease-in` `(.4,0,1,1)` (exits) · `ease-emphasized` `(.2,0,0,1.2)` (rare). Springs: `snappy` (380/30 — menus/toggles) · `smooth` (260/30 — panels/cards) · `gentle` (180/26 — large overlays/graph settle).

### 2.12 Z-index Strategy
`base`=0 · `sticky`=100 · `rail`=200 · `dropdown`=1000 · `overlay`=2000 · `dialog`=2100 · `palette`=3000 · `toast`=4000 · `tooltip`=5000. Never ad-hoc z-values; always a token.

### 2.13 Breakpoints (intent boundaries)
`xs`≤480 · `sm`481–640 (mobile) · `md`641–1024 (tablet) · `lg`1025–1440 (desktop) · `xl`1441–1920 · `2xl`≥1921 (ultra-wide). Touch vs. pointer detected independently of width.

### 2.14 Grid System
12-column fluid; gutter `space-6`(24) desktop / `space-4`(16) tablet+mobile. Container max: content `1200` · wide (graph/analytics) `1440` · **reading column `min(68ch, 720px)`** (always measure-constrained, never full-bleed). App shell: rail `64`/`240` · side panel `360–420` · topbar `52`.

### 2.15 Sizing System (control heights)
`xs`=24 · `sm`=28 · `md`=32 · `lg`=36 · `xl`=44 (default touch target). Inputs/buttons map to these; min touch target 44×44 (invisible hit-padding on smaller controls).

### 2.16 Icon Sizes
`xs`=14 · `sm`=16 (default in buttons/menus) · `md`=20 · `lg`=24 · `xl`=32 (empty states). Stroke 1.5px; align to text baseline.

### 2.17 Illustration Style
Spot illustrations only for empty states, onboarding, and AI/celebration moments. Style: minimal, geometric line-work with a single duotone accent (neutral + iris/AI gradient); warm, optimistic, never cartoonish or stocky. Consistent line weight matching icon stroke. Dark/light variants. Used sparingly — the product is content-led, not illustration-led.

### 2.18 Avatar Sizes
`xs`=20 · `sm`=24 · `md`=32 (default) · `lg`=40 · `xl`=64 (profile). Shape `radius-full`; fallback = monogram on a deterministic neutral/accent tint; never a generic silhouette where a monogram is possible.

### 2.19 Image Ratios
`square`=1:1 (avatars, node thumbnails) · `book`=2:3 (covers) · `wide`=16:9 (media, video) · `card`=3:2 (cover cards) · `banner`=21:9 (rare hero). Always reserve aspect ratio to prevent layout shift; lazy-load with placeholder.

---

# SECTION 3 — COLOR SYSTEM

12-step ramps (1–2 backgrounds · 3–5 component bg · 6–8 borders · 9–10 solid · 11 low-contrast text · 12 high-contrast text), light + dark per ramp. Components use **semantic** tokens, not raw steps.

### 3.1 Neutral — Slate (foundation)
| Step | Light | Dark | | Step | Light | Dark |
|---|---|---|---|---|---|---|
| 1 | `#FCFCFD` | `#0A0A0B` | | 7 | `#D3D7DD` | `#373B42` |
| 2 | `#F8F9FA` | `#111214` | | 8 | `#BCC2CB` | `#474C55` |
| 3 | `#F1F3F5` | `#17181B` | | 9 | `#8B919D` | `#5C626C` |
| 4 | `#ECEEF0` | `#1D1F23` | | 10 | `#6E747F` | `#7C828D` |
| 5 | `#E6E8EB` | `#24262B` | | 11 | `#545A63` | `#A8AEB8` |
| 6 | `#DFE2E6` | `#2C2F35` | | 12 | `#1A1C1F` | `#ECEEF1` |

### 3.2 Primary / Accent — Iris (brand)
Key steps — 3 (tint) L`#F2F1FE`/D`#1E1B33` · 5 (selected) L`#E0DDFB`/D`#2C285A` · 7 (border) L`#BCB4F2`/D`#473E9E` · **9 (solid)** L`#5B5BD6`/D`#6E56CF` · 10 (hover) L`#5151CD`/D`#7C66DC` · 11 (text/link) L`#5753C6`/D`#B8A9F5`.

### 3.3 Secondary
We deliberately run a **single-accent system** (Iris). "Secondary" = the neutral scale at steps 9–12 (used for secondary buttons, secondary text). Introducing a second brand hue is governed (§15) — denied by default to protect monochrome calm.

### 3.4–3.7 Semantic ramps (Success/Warning/Danger/Info)
| Ramp | Solid (9) L/D | Tint (3) L/D | Text (11) L/D |
|---|---|---|---|
| **Success** Green | `#30A46C`/`#33B074` | `#E9F7EF`/`#10231A` | `#218358`/`#62C893` |
| **Warning** Amber | `#FFB224`/`#FFB224` | `#FFF6E5`/`#2E2008` | `#946800`/`#F5C24E` |
| **Danger** Red | `#E5484D`/`#E5484D` | `#FDEBEC`/`#2A1416` | `#CE2C31`/`#FF9592` |
| **Info** Blue | `#3E63DD`/`#3E63DD` | `#EBF0FF`/`#101A36` | `#3A5BC7`/`#8DA4EF` |
Always paired with icon + text (never color-only).

### 3.8 Neutral / Surface / Background (semantic)
| Token | Light → | Dark → |
|---|---|---|
| `background` (app) | neutral.1 | neutral.1 |
| `surface.subtle` | neutral.2 | neutral.2 |
| `surface.raised` (cards/panels) | `#FFFFFF` | neutral.3 |
| `surface.overlay` (menus/dialogs) | `#FFFFFF` | neutral.4 |
| `surface.inset` (wells/code) | neutral.3 | neutral.2 |
| `border.subtle` | neutral.6 | neutral.6 |
| `border.default` | neutral.7 | neutral.7 |
| `border.strong` | neutral.8 | neutral.8 |
| `text.primary` | neutral.12 | neutral.12 |
| `text.secondary` | neutral.11 | neutral.11 |
| `text.tertiary` | neutral.10 | neutral.10 |
| `text.disabled` | neutral.8 | neutral.8 |
| `focus.ring` | iris.8 @50% | iris.8 @60% |

### 3.9 Reader Theme (independent of app chrome)
| Theme | Surface | Text | Use |
|---|---|---|---|
| **Light** | `#FCFCFD` | `#1A1C1F` | default day |
| **Sepia** | `#F4ECD8` | `#433422` | long sessions, low strain |
| **Dark** | `#16171A` | `#D7DBE0` | low-light (not pure black) |
| **Night** | `#000000` | `#B8BCC2` | OLED true-black |
Reading text targets **AAA** contrast in every theme. Reader themes are a separate token set from app semantic tokens.

### 3.10 Selection Colors
Text selection: `selection.bg` = iris.5 (light) / iris.5 (dark) at legibility-tested opacity; selection in the reader uses a theme-tuned tint preserving text contrast.

### 3.11 Highlight Colors (5, legibility-tested in all reader themes)
`yellow` (key) · `green` (agree/important) · `blue` (question/look-up) · `pink` (disagree/caution) · `purple` (connection). Each: a translucent overlay tuned per theme to preserve text contrast; carries an optional text label (never color-only meaning). Semantic mapping is user-configurable, never forced.

### 3.12 Knowledge Colors (categorical node types — supportive, never sole signal)
`concept` iris · `entity` blue · `claim` amber · `framework` teal `#10A4A4` · `skill` green · `timeline` violet `#8B5CF6`. **Always paired with a distinct icon + label** (color-blind safety; the graph never relies on hue). Edges typed by line-style + label, not color.

### 3.13 Learning Colors (meters — color-blind-safe + always with value)
`memory` blue scale · `understanding` green scale · `knowledge` iris scale · mastery gradient low→high uses lightness + a value label (never red/green alone). Progress framing is **neutral/positive** — no punitive red for "behind."

### 3.14 AI Colors (the signature — only for AI surfaces)
`ai.gradient` linear 135° `#6E56CF`→`#3E63DD` · `ai.solid` `#6E56CF` · `ai.tint` L`#F4F2FE`/D`#1C1A33` · `ai.border` L`#D8D2F7`/D`#3A3270` · `ai.glow` (per §2.7) · `ai.shimmer` animated 1.2s gradient sweep (streaming/thinking). Used *only* for AI presence — never for general UI.

### 3.15 Dark Theme
Layered surfaces over shadow; never pure black for chrome (`#0A0A0B`, true black only for reader Night); tamed contrast (`text.primary #ECEEF1`, not pure white); borders carry more weight; elevated = lighter + bordered + faint top-highlight; restrained `glow-ai`. **The default the product is designed in.**

### 3.16 Light Theme
Warm-neutral paper; cards pure white lifted by soft shadow (depth via shadow); crisp hairlines; high contrast (AAA body); restrained iris; frosted-blur materials for overlays. A first-class peer, not an afterthought.

### 3.17 High Contrast Theme
Maximized contrast (text/bg ≥ 7:1 everywhere); borders thickened (`medium`/`thick`); focus rings amplified; transparency removed (solid surfaces); accent darkened/strengthened for ≥7:1 against bg; honors OS forced-colors. A dedicated theme *and* respect for OS high-contrast mode.

### 3.18 Color Accessibility Rules
1. **Never color-only.** Status/type always = color + icon + text.
2. **Contrast:** body reading AAA (≥7:1); UI text AA (≥4.5:1); large/UI elements ≥3:1. Verified per token pair, both themes.
3. **Color-blind safe:** categorical palettes distinguishable in grayscale; tested for deuteranopia/protanopia/tritanopia.
4. **Accent budget:** ≤10% of any view is accent/AI color.
5. **Highlights/overlays** must preserve underlying text legibility in every theme.
6. **Meaning via redundant cues** (shape/icon/label/position), never hue alone.

---

# SECTION 4 — TYPOGRAPHY

(Scale in §2.2; families in §2.1.)

- **Heading Hierarchy:** `display-lg/md` (marketing/page hero, ≤1 per view) → `heading-xl` (page title, the single `<h1>`) → `lg` (section) → `md` (card/dialog) → `sm` (subsection/table header). Hierarchy from size + weight(600) + color + space — never from heavier-than-600 weight.
- **Body:** `body-md`(14) default UI; `body-lg`(16) for comfortable reading contexts (AI chat); `body-sm`(13) dense UI. Color `text.primary`; supporting `text.secondary`.
- **Labels:** `label`(14/500) for form labels + buttons; `label-sm`(12/500) for chips/badges. Always present (placeholder is never the only label).
- **Captions:** `caption`(12/400) metadata, helper text, timestamps — `text.tertiary`.
- **Code:** `code`(13/450 mono); inline code on `surface.inset` `radius-xs`; blocks with horizontal scroll + optional syntax highlight.
- **Math:** rendered (MathML/pre-rendered), inline aligned to baseline; block centered; never raw LaTeX; SR-readable.
- **Tables:** `heading-sm` headers, `body-sm` cells, `tabular-nums` for numerics; row-dividers only (no vertical lines by default).
- **Quotes:** serif, slightly larger, indented with an accent left-border; attribution in `caption`.
- **Reader Typography:** serif default (Tiempos); user-adjustable size (16–24), measure (50–80ch, default 68), line-height, letter-spacing; dyslexia font option; theme-aware. Separate scale from UI (§ UX/Reader).
- **AI Typography:** `body-lg`(16/1.6) for readability of generated prose; citations as superscript chips; clear visual separation from user content (AI tint/accent treatment).
- **Knowledge Typography:** concept/entity names `heading-md`; definitions `body-md`; metadata `caption`; consistent across concept/entity/framework pages.
- **Accessibility Rules:** scalable to 200% + OS font scaling without breakage; line length capped for readability; never justify body text (ragged-right for even spacing); minimum 14px for sustained UI reading; sufficient line-height (≥1.5 body); never text-in-images for meaningful content.

---

# SECTION 5 — ICONOGRAPHY

- **Icon Philosophy:** one coherent line set (Lucide-grade); icons clarify, never decorate; always have an accessible name; paired with text on first exposure, icon-only allowed once learned (with tooltip).
- **Sizes:** §2.16 (`xs`14 · `sm`16 default · `md`20 · `lg`24 · `xl`32).
- **Stroke Width:** 1.5px, rounded joins, 24×24 grid, optical baseline alignment; pairs with 400–500 text weight; never heavier.
- **Filled vs Outline:** **outline default** (calm, precise). **Filled** reserved for *active/selected* states (active nav item, toggled control, selected tab) — the fill communicates "on." Never mix arbitrarily; the outline→fill transition *is* the state signal.
- **Animated Icons:** sparingly, purposeful — e.g., a check that draws on success, a subtle spin on loading, a morph on play/pause. ≤300ms; static under reduced-motion. Never looping/ambient in the canvas.
- **Knowledge Icons:** distinct glyphs per node type (concept/entity/claim/framework/skill/timeline) — the redundant cue that makes the categorical color safe.
- **Reader Icons:** TOC, theme, font, bookmark, highlight, read-aloud, focus — quiet, recede with chrome.
- **AI Icons:** a single sparkle/✦ mark is the AI signifier (paired with the gradient); consistent everywhere AI appears so users recognize "this is the system."
- **Status Icons:** success ✓ / warning △ / danger ✕-in-circle / info i — each paired with its semantic color + text (never icon-or-color alone).

---

# SECTION 6 — COMPONENT LIBRARY

**Baselines (every component inherits; blocks note only deltas):**
- **States baseline:** `default · hover · active(pressed) · focus-visible · disabled · loading` (where applicable) · `error` (inputs).
- **Accessibility baseline:** keyboard-operable; visible `shadow-focus` ring; correct role + accessible name; AA+ contrast; reduced-motion honored; ≥44px touch target.
- **Responsive baseline:** touch targets grow on touch; layout adapts per §12; hover affordances become tap/long-press on touch.

Format per component: **Purpose · Variants · Sizes · States(Δ) · Interaction · A11y(Δ) · Responsive(Δ) · Composition · Anti-patterns.**

### Buttons
- **Purpose:** trigger an action. **Variants:** primary · secondary · ghost · outline · destructive · ai (gradient + glow) · link. **Sizes:** sm28/md36/lg44. **States Δ:** loading = spinner replaces leading icon, width locked, non-interactive; active = scale 0.98. **Interaction:** optional trailing shortcut hint (mono); primary auto-focuses in dialogs. **A11y Δ:** `aria-busy` while loading; prefer `aria-disabled` (focusable, announces why) where the user needs to know why. **Composition:** `[icon] label [trailing icon/shortcut/loader]`. **Anti-patterns:** >1 primary per surface; destructive adjacent to default focus; icon-only without label; gradient `ai` variant for non-AI actions.

### Icon Buttons
- **Purpose:** compact icon-only action (toolbars). **Variants:** ghost (default) · solid · ai. **Sizes:** 28/36/44 square. **Interaction:** tooltip on hover (name + shortcut). **A11y Δ:** mandatory `aria-label`. **Anti-patterns:** ambiguous icon without tooltip; using for primary CTAs that need a label.

### Inputs (text/number/password/email)
- **Purpose:** single-line entry. **Variants:** default · with leading icon · with affix · search · password (reveal). **Sizes:** 32/36/44h. **States Δ:** error = danger border + helper + icon; success optional; loading = trailing spinner (async validate). **Interaction:** validate on blur not keystroke; clearable when filled. **A11y Δ:** visible associated label; `aria-describedby` for helper/error; `aria-invalid` on error. **Anti-patterns:** placeholder as label; per-keystroke error nagging.

### Textareas
- **Purpose:** multi-line entry. **Variants:** default · auto-grow · with toolbar (notes). **Interaction:** auto-grow to max then scroll. **Anti-patterns:** fixed tiny height forcing scroll for short content.

### Checkboxes
- **Purpose:** independent multi-select / toggle a setting. **Variants:** default · indeterminate. **Sizes:** sm16/md20. **Interaction:** label is part of the hit target. **Anti-patterns:** using for mutually-exclusive choice (use radio); using a checkbox where a switch (immediate effect) is meant.

### Switches
- **Purpose:** immediate on/off of a setting (applies instantly). **Sizes:** sm/md. **Interaction:** state change is instant (no save); spring thumb. **Anti-patterns:** using where a form-submit is required (use checkbox); ambiguous on/off without a label.

### Radio
- **Purpose:** one-of-many. **Variants:** default · card-radio (rich options). **Anti-patterns:** >~6 options (use select); single radio (use checkbox).

### Dropdown / Menu
- **Purpose:** action list. **Variants:** menu (actions) · grouped · with-descriptions · danger items · submenus. **States Δ:** keyboard + pointer share highlight. **Interaction:** `t-menu` from trigger origin; closes on select/Esc/outside; typeahead. **Composition:** sections (`overline` headers) + dividers + items `[icon] label [trailing shortcut/▸]`. **Anti-patterns:** >15 items without search; nav inside an action menu.

### Select
- **Purpose:** choose one value. **Variants:** single · with-icons · grouped. **Interaction:** selected value in trigger; long values truncate + tooltip. **Anti-patterns:** many options without search (use combobox).

### Combobox
- **Purpose:** searchable single/multi select. **Variants:** single · multi (chips) · async. **States Δ:** loading rows; empty "no matches." **A11y Δ:** ARIA combobox pattern; `aria-activedescendant`. **Anti-patterns:** using for a free 2-option choice.

### Search (component)
- **Purpose:** query input. **Variants:** inline · overlay · palette-embedded. **Interaction:** debounced; clear button; streaming results. (Full behavior §9.)

### Cards
- **Purpose:** self-contained, often-clickable unit. **Variants:** static · interactive (hover lift e1→e2, translateY-2) · selectable (accent ring) · media (cover-led) · metric · ai (ai.border/tint). **Composition:** media → header(`heading-md`+meta) → body → footer/actions. **Interaction:** whole card is one target; nested actions stop propagation. **Anti-patterns:** card for dense tabular data; deeply nested clickable regions.

### Dialogs / Modals
- **Purpose:** focused, blocking decision/task. **Variants:** default · alert (destructive = type-to-confirm or explicit primary) · form. **Sizes:** 480/560/720 max-width. **States Δ:** submitting = primary loading, dialog non-dismissible. **Interaction:** scale 0.96→1 + scrim fade; Esc/scrim close (except mid-submit/destructive-unsaved → confirm). **A11y Δ:** `role=dialog` `aria-modal`; focus trapped + restored; initial focus on first input/primary (never destructive). **Anti-patterns:** routine flows in a modal; stacking >2; destructive as default focus.

### Drawers
- **Purpose:** secondary content from an edge. **Variants:** side · bottom (mobile sheet, drag handle, swipe-dismiss). **Anti-patterns:** blocking decisions (use dialog); desktop where a panel reads better.

### Tabs
- **Purpose:** switch views within a context. **Variants:** underline (default, sliding indicator) · segmented (pill group) · pill · vertical. **States Δ:** active = text.primary + indicator; overflow = scroll + fade or "more." **A11y Δ:** ARIA tabs pattern; arrow-key nav. **Anti-patterns:** tabs for sequential steps (use a stepper); >~7 tabs without overflow handling.

### Accordion
- **Purpose:** progressively disclose stacked sections. **Variants:** single-open · multi-open. **Interaction:** spring expand/collapse; chevron rotates. **Anti-patterns:** hiding critical/primary content; nesting deeply.

### Tree
- **Purpose:** hierarchical navigation/data (collections, TOC, the Knowledge list-equivalent). **Variants:** nav-tree · data-tree (selectable). **A11y Δ:** ARIA tree; arrow-key expand/collapse/navigate. **Anti-patterns:** flat lists forced into a tree.

### Timeline (component)
- **Purpose:** ordered events on a track. **Variants:** vertical · horizontal (zoomable). **Composition:** event nodes + connector + detail-on-select. (Knowledge timeline §9.)

### Tables
- **Purpose:** dense structured data. **Variants:** default · compact · bordered/borderless · selectable · expandable. **States Δ:** row hover/selected; sorted column; sticky header. **Interaction:** click header to sort (asc/desc/none); resize/reorder/hide columns (power); virtualized; pinned first column. **A11y Δ:** semantic table, `scope`, `aria-sort`. **Anti-patterns:** vertical gridlines everywhere (noise); tables for layout.

### Pagination
- **Purpose:** navigate large sets. **Variants:** cursor (default — "load more"/infinite) · numbered (when total matters). **Anti-patterns:** offset pagination for very large/changing sets.

### Badges
- **Purpose:** small status/count marker. **Variants:** count · dot · status (semantic). **Anti-patterns:** badge-screaming counts (calm by default); color-only status.

### Tags
- **Purpose:** categorize/label (collections, topics). **Variants:** static · removable · selectable. **Anti-patterns:** tags as buttons for primary actions.

### Breadcrumbs
- **Purpose:** show + navigate hierarchy. **Interaction:** truncate middle on narrow widths. **A11y Δ:** ordered nav, current marked `aria-current`. **Anti-patterns:** breadcrumbs for flat structures.

### Tooltips
- **Purpose:** name an icon control / brief hint + shortcut. **Interaction:** ~400ms hover delay; instant on focus. **A11y Δ:** not the only place for essential info; keyboard-focus reveals. **Anti-patterns:** long content (use popover); essential instructions hover-gated.

### Popover
- **Purpose:** rich, interactive transient content (define, citation, hover-card). **Variants:** hover-card · click-popover. **Interaction:** collision-aware positioning. **Anti-patterns:** blocking decisions (use dialog).

### Toast
- **Purpose:** transient confirmation/error + optional undo/retry. **Variants:** success · error (persists) · warning · info · loading→resolve · ai. **Interaction:** slide+fade from edge; auto-dismiss success ~4s, pause on hover/focus; stack max 3 (+N). **A11y Δ:** `role=status` (polite) / `role=alert` (error); actions focusable; never the only place for critical info. **Anti-patterns:** form/inline errors as toasts (chasing); critical persistent info as a toast.

### Notifications (center)
- **Purpose:** persistent, reviewable events. **Variants:** grouped list; unread states. **Interaction:** mark-read/dismiss; cadence in settings. **Anti-patterns:** loud badge counts; per-event spam (digest).

### Progress
- **Purpose:** communicate ongoing/quantified progress. **Variants:** linear (top route bar) · ring (learning meters) · stepped (pipeline: Parsing→Embedding→…) · indeterminate. **A11y Δ:** `role=progressbar` with value text. **Anti-patterns:** spinner where determinate progress is known.

### Skeletons
- **Purpose:** structured loading. **Interaction:** mirror final layout; shimmer 1.4s (static under reduced-motion); ≥120ms delay before showing. **A11y Δ:** container `aria-busy`; placeholders `aria-hidden`; announce loading + arrival. **Anti-patterns:** generic spinner for content; faking infinite lists.

### Empty States
- **Purpose:** an invitation, not a void. **Composition:** illustration + one value line + one primary CTA (+ sample where relevant). **Anti-patterns:** blank "No data"; multiple competing CTAs.

### Loading Indicators
- **Purpose:** sub-second/indeterminate feedback. **Variants:** inline spinner · top progress bar · button loading. **Anti-patterns:** full-screen spinner for content (use skeleton).

### Error States
- **Purpose:** calm recovery. **Composition:** plain cause + the one fixing action + Retry; inline + scoped. **Anti-patterns:** raw stack trace; blaming the user; global toast that loses place.

### Command Palette
- **Purpose:** keyboard-first universal navigator/action surface (`⌘K`). **Variants:** unified · prefix modes (`>` `@` `#` `?`) · nested. **States Δ:** typing re-ranks; loading rows; empty → "ask AI." **A11y Δ:** ARIA combobox+listbox; `aria-activedescendant`; fully keyboard. **Composition:** input → scope chip → grouped results → footer hint bar. **Anti-patterns:** the *only* path to an action; slow/janky results.

### Context Menu
- **Purpose:** object-specific actions (right-click/long-press/`⋯`). **Anti-patterns:** only path to an action; >~10 flat items without grouping.

### Split View
- **Purpose:** two surfaces side by side. **Variants:** fixed · resizable. **Responsive Δ:** collapses to one + switcher on small screens. **Anti-patterns:** split on mobile.

### Resizable Panels
- **Purpose:** user-tuned workspace. **Interaction:** drag divider; sensible defaults + reset; reader column never reflows. **A11y Δ:** keyboard-resizable (arrow keys on the separator). **Anti-patterns:** no default/reset; allowing a panel to crush content unusable.

### Inspector
- **Purpose:** view/edit properties of a selected object (highlight, node, card). **Composition:** header (object) → grouped properties → actions. **Anti-patterns:** using for navigation.

### Floating Toolbar
- **Purpose:** contextual actions on selection (reader selection toolbar). **Interaction:** appears above selection (fade+rise); repositions to avoid system menus; dismiss on deselect. **Anti-patterns:** persistent (must be summoned); covering the selection.

### AI Response Card
- **Purpose:** render a streamed, cited AI answer. **Composition:** AI signifier + streamed body (`body-lg`) + inline citation chips + action row (copy/save-note/flashcard/graph/retry/deeper) + sources tray. **States Δ:** thinking (shimmer + status) → streaming → complete → error (inline retry). **A11y Δ:** `aria-live=polite` chunked; citations are labeled links. **Anti-patterns:** showing an answer without citations; no stop control.

### Citation Card / Chip
- **Purpose:** provenance for an AI claim. **Variants:** inline chip `[n]` · expanded popover (quote + locator + jump). **Interaction:** hover highlights source span in reader. **Anti-patterns:** decorative citations that don't resolve; citation without a jump target.

### Knowledge Card
- **Purpose:** summarize a concept/entity/framework in lists/related rails. **Composition:** type icon + name + short description + source count + actions. **Anti-patterns:** color-only type signaling.

### Book / Source Card
- **Purpose:** represent a library source. **Variants:** cover · list-row · compact. **Composition:** cover (2:3) + title + author + progress + type + status. **States Δ:** ingesting (stepped progress); failed (recoverable). **Anti-patterns:** hiding ingest status; no progress affordance.

### Collection Card
- **Purpose:** represent a collection. **Composition:** stacked-cover motif + name + count + scope-AI action. **Anti-patterns:** indistinguishable from a book card.

### Flashcard (component)
- **Purpose:** review unit. **Variants:** front/back · cloze · (future) image. **States Δ:** unrevealed → revealed → graded. **Interaction:** flip (instant/cross-fade under reduced-motion); grade buttons + swipe (mobile, with button equivalents). **A11y Δ:** real text (TTS-able); grade buttons labeled; focus stays on card. **Anti-patterns:** gesture-only grading; animated flips under reduced-motion.

### Quiz Card
- **Purpose:** a quiz question. **Variants:** MCQ · short-answer · true/false · cloze. **Composition:** question + typed controls (radio/checkbox/text) + submit; feedback with cited explanation. **A11y Δ:** fieldset/legend grouping; feedback via live region; never color-only correct/incorrect. **Anti-patterns:** color-only feedback; ambiguous grading.

### Statistic / Metric Card
- **Purpose:** a single number + context. **Composition:** big `tabular-nums` value + label + delta (arrow + sign + semantic color). **Anti-patterns:** delta color-only (always sign + arrow); vanity-metric framing.

### Graph Node (component)
- **Purpose:** a knowledge-graph vertex. **Variants:** by type (icon + categorical color) · focused (accent/ai ring) · selected. **A11y Δ:** reachable + labeled in the list-equivalent; node name announced with type + connection count. **Anti-patterns:** hue-only typing; nodes with no provenance path.

### Timeline Event (component)
- **Purpose:** one event on a timeline. **Composition:** date (normalized) + label + entities/concepts + locator. **States Δ:** fuzzy/approximate date marked. **Anti-patterns:** dropping uncertain dates instead of marking them.

### Reader Toolbar
- **Purpose:** minimal, auto-hiding reading controls. **Composition:** title + thin progress + controls (TOC/theme/font/read-aloud) + AI dot. **Interaction:** hides on scroll-down, returns on scroll-up/tap. **Anti-patterns:** persistent chrome on the canvas; AI buttons shouting.

### Annotation Card
- **Purpose:** display/edit a note or highlight detail. **Composition:** source quote + locator (jump) + body (rich text) + actions. **Anti-patterns:** losing the source link; no jump-to-source.

---

# SECTION 7 — READER COMPONENTS

(Interaction depth in [UX-SPECIFICATION §5](UX-SPECIFICATION.md); technical in [READER-SPEC](READER-SPEC.md).)

| Component | Spec |
|---|---|
| **Book Viewer** | the content layer host; reflow DOM *or* PDF canvas+text-layer; measure-constrained; theme-aware; renders the Document Model; zero chrome at rest. |
| **Page** | a paginated unit (page mode); discrete turn (instant/calm fade); two-page spread on wide; page identity = locator. |
| **Scroll** | continuous virtualized flow; chrome hides on scroll-down; position index for O(log n) jump/restore. |
| **Selection** | floating toolbar on settle (`Highlight·Note·Ask·Explain·Define·Copy`); cross-block/cross-page; touch handles; stylus draw-to-select. |
| **Highlight** | translucent overlay (5 colors, contrast-preserving) drawn from locators (no DOM mutation — Custom Highlight API); gutter marker; recompute on reflow. |
| **Annotation** | anchored note marker → opens Annotation Card; margin (desktop) / sheet (mobile). |
| **Bookmark** | ribbon glyph at position; list in TOC; instant; haptic on mobile. |
| **Table of Contents** | slide-in outline; current section highlighted; nested/collapsible; jump + flash. |
| **Mini Map** | (long docs) a slim scrollbar-overview with chapter ticks, highlight markers, and current-position thumb; click to jump; hover preview. |
| **Progress** | thin top bar + "X min left" on demand; char-offset %; never a nag. |
| **Footnotes** | superscript → popover preview; "go to note" + back-link. |
| **References** | inline link → preview popover; "find this source" / "in my library?"; resolved bibliography (papers). |
| **Code Block** | mono, horizontal scroll, optional highlight, copy-on-hover, "explain this code." |
| **Math Block** | rendered MathML/pre-rendered; inline baseline-aligned; "explain this equation"; SR-readable. |
| **Diagram Block** | rendered figure; zoom; alt text; "explain this diagram." |
| **Image Viewer** | aspect-reserved inline; tap → lightbox (zoom/pan); "ask about this figure"; alt text; failed → placeholder+retry. |
| **Media Player** | audio/video synced to transcript; tap transcript to seek; annotate/ask anchored to timestamps; read-along highlight. |

---

# SECTION 8 — AI COMPONENTS

(Behavior in [UX-SPECIFICATION §6](UX-SPECIFICATION.md); engine in [AI-ENGINE-SPEC](AI-ENGINE-SPEC.md). All carry the AI signature.)

| Component | Spec |
|---|---|
| **AI Chat** | the conversation surface; scope chip + message stream + input + sources tray; side panel (no reader reflow) / bottom sheet (mobile). |
| **Prompt Box** | the `/` Ask input; scope chip; send + stop; suggested-prompt chips when empty; voice input (mobile). |
| **Streaming Response** | the AI Response Card (§6) streaming token-by-token; citations resolve inline; stop always present. |
| **Thinking State** | `ai.shimmer` pulse + status text ("Searching 12 sources… Found 6 passages") before first token; not a generic spinner. |
| **Citation** | inline chip `[n]` → provenance popover (quote + locator + jump); hover highlights span in reader. |
| **Reasoning Display** | (optional, opt-in) a collapsible "show reasoning" summary; off by default (calm); never the raw chain-of-thought. |
| **Suggestion Chips** | context-derived next-step prompts/quick-replies; tappable; disappear on typing. |
| **Model Selector** | (advanced/settings, hidden by default — routing is automatic) lets power users/tenants pin a model/tier; shows capability + cost hints. |
| **Conversation Timeline** | history of conversations (scoped by doc/collection); searchable; resume. |
| **Conversation Memory** | a subtle "earlier context summarized" affordance on long chats; transparent, not alarming; no "too long" wall. |
| **Source Preview** | the sources-used tray + per-citation preview; the trust surface. |
| **Error State** | inline "Couldn't complete — Retry" preserving the question; invisible fallback; surfaced only if all fail. |
| **Rate Limit** | calm ahead-of-time notice + at-limit block with path (wait/upgrade); reading/notes keep working; never a raw 429. |
| **Hallucination Warning** | the "not in your sources" state + options (broaden / web opt-in / labeled-general); the anti-fabrication guardrail made visible. |

---

# SECTION 9 — KNOWLEDGE COMPONENTS

(Behavior in [UX-SPECIFICATION §7](UX-SPECIFICATION.md); model in [KNOWLEDGE-ENGINE-SPEC](KNOWLEDGE-ENGINE-SPEC.md).)

| Component | Spec |
|---|---|
| **Knowledge Graph** | WebGL canvas (desktop/tablet) — pan/zoom/focus, filters, layouts; **+ mandatory list/tree equivalent** (all platforms); every node→provenance. |
| **Node** | typed (icon + categorical color + label); focused/selected rings; hover preview; mobile = list item. |
| **Edge** | typed by line-style + label (never color-only); click → evidence (quote + locator). |
| **Relationship Card** | a relation's detail: src→type→dst + evidence + "explain this connection." |
| **Entity Card** | person/org/work: name + type icon + description + appearances + external refs + actions. |
| **Concept Card** | concept: name + cited summary + source count + related + actions (tutor/cards/ask). |
| **Definition Card** | term + definition + source(s) + "add to vocabulary"; multiple defs ranked. |
| **Timeline** | chronological track (zoomable); event nodes; fuzzy dates marked; click→source. |
| **Framework** | structured component map (ordered/typed parts); each part → description + source; "teach me this." |
| **Skill Card** | skill + level + mapped concepts + mastery meter + "practice." |
| **Vocabulary Card** | term + definition + difficulty + example (locator) + flashcard action. |
| **Mind Map** | a focused, AI-generated concept map for a chapter/topic (a scoped graph view) linking to the full graph + sources. |
| **Cross-links** | the "related / you read about this before / these disagree" surface; calm, one-at-a-time when proactive; each → source. |

---

# SECTION 10 — LEARNING COMPONENTS

(Behavior in [UX-SPECIFICATION §8](UX-SPECIFICATION.md).)

| Component | Spec |
|---|---|
| **Flashcards** | review unit (§6 Flashcard); created from highlight/answer/AI deck; FSRS-scheduled. |
| **Quiz** | quiz session of Quiz Cards (§6); cited feedback; misses→cards; adaptive difficulty. |
| **Progress Ring** | circular progress for a goal/concept/session; always paired with a numeric value; color-blind safe. |
| **Learning Dashboard** | the Learning home: due review, tutor, plans, mastery overview, achievements. |
| **Daily Review** | the focused review session surface (preloaded cards, grade controls, summary). |
| **Streak** | a calm habit indicator (days reading/reviewing) — celebratory, **never punitive or pressuring**; opt-out-able; missed days neutral. |
| **Achievement** | meaningful milestone badge (first book, 100 concepts, 30-day habit); celebratory moment (brief, dignified animation); not manipulative. |
| **Memory Meter** | per-concept recall (FSRS) as bar + value; blue scale; "slipping" cue (with text, not red-alarm). |
| **Understanding Meter** | per-concept comprehension as bar + value; green scale. |
| **Knowledge Meter** | overall structured-knowledge built (graph density/breadth) as bar/ring + value; iris scale; the "growing" signal. |
| **Learning Calendar** | a calm calendar/heatmap of reading + review activity; neutral framing (no shaming empty days); color-blind safe + text equivalents. |

---

# SECTION 11 — MOTION SYSTEM

(Tokens §2.10–2.11.) Every motion: purpose + duration + curve; all reduced-motion aware.

| Motion | Spec |
|---|---|
| **Page Transitions** | cross-fade + 8px slide, `base`(180) `ease-standard`; preserve scroll/state. |
| **Hover** | bg/border/color, `fast`(120); rich hover-card after ~400ms dwell. |
| **Focus** | `shadow-focus` appears `fast`; never animated distractingly. |
| **Selection** | toolbar fade+rise from selection, `base`; instant highlight paint. |
| **Expand** | accordion/tree/panel grow from origin, `spring-snappy`/`smooth`. |
| **Collapse** | reverse, ~30% faster, `ease-in`. |
| **Navigation** | rail active-indicator slides between items `spring-snappy`; surface cross-fade. |
| **AI Streaming** | per-chunk text fade-in; `ai.shimmer` 1.2s loop while thinking. |
| **Loading** | skeleton shimmer 1.4s; top progress bar; count-up 600ms for metrics. |
| **Knowledge Graph** | layout converges then **stops** (no perpetual jitter); `spring-gentle`; reduced-motion → static. |
| **Cards** | hover lift translateY(-2) + e1→e2 `spring-smooth`; press scale 0.98. |
| **Dialogs** | scale 0.96→1 + scrim fade, `slow`(320); sheet = translateY spring. |
| **Motion Principles** | clarifies relationships + confirms actions, never decorates · enters decelerate / exits accelerate (~30% faster) · animate from origin · ≤320ms · ≤1 attention-seeking animation at once · **canvas perfectly still at rest**. |
| **Reduced Motion** | `prefers-reduced-motion` → all non-essential motion becomes opacity-only/instant; springs→instant; shimmer/loops stilled; no parallax/auto-play. |

---

# SECTION 12 — RESPONSIVE DESIGN

(Breakpoints §2.13; UX intents in [UX-SPECIFICATION §11](UX-SPECIFICATION.md).)

| Device | Layout & adaptation |
|---|---|
| **Desktop (lg 1025–1440)** | multi-pane cockpit; persistent rail; hover affordances; resizable splits; reader = centered measure + side panel (no reflow) + gutter; full graph/analytics. |
| **Laptop** | same as desktop, denser; rail may default collapsed; panels narrower; compact mode available. |
| **Tablet (md 641–1024)** | dual-pane (reader + AI/notes); stylus-first; split view; touch targets ≥44; hover→tap/long-press; bottom sheets for transient surfaces. |
| **Mobile (sm ≤640)** | single column; bottom tab bar; AI/notes/filters as sheets; reader full-screen with auto-hide chrome + tap zones; gestures (swipe page, swipe-grade) with button equivalents; graph/analytics simplified to focused/read-mostly. |
| **Ultra Wide (2xl ≥1921)** | never widen text (reading stays measure-constrained, centered); extra space → *more panes* (reader + AI + notes + graph) or wider data canvases; optional multi-column library. |
| **Future Foldables** | unfolded = small-tablet dual-pane (reader / AI-graph), hinge as natural divider; folded = mobile; continuity across fold (no state loss). |

**Component adaptation rules:** split view → single + switcher on small screens · panels → sheets on mobile · tables → cards or horizontal-scroll with pinned column on mobile · menus → sheets on touch · hover-cards → tap-to-preview on touch · the reading column is *always* measure-constrained regardless of width · density increases with screen size + user expertise, never imposed on beginners.

---

# SECTION 13 — ACCESSIBILITY

(Full baseline in [UX-SPECIFICATION §12](UX-SPECIFICATION.md); this is the design-system contract.)

- **WCAG AA+:** AA floor; **AAA contrast for body reading text**; reviewed every release; AA is the minimum, not the goal.
- **Focus:** visible high-contrast `shadow-focus` on every focusable; logical order; trapped + restored in overlays; `Esc` closes innermost; skip-to-content.
- **Contrast:** verified per semantic token pair, both themes (+ high-contrast theme); body AAA, UI text AA, elements ≥3:1.
- **Keyboard Navigation:** 100% operable without a pointer; command palette + per-surface shortcut maps as first-class paths.
- **Screen Readers:** semantic landmarks + roles + names; `aria-live` (chunked) for AI streaming + async results; Knowledge Graph list-equivalent; charts text/table equivalents.
- **Touch Targets:** ≥44×44px; spacing; gesture↔button equivalence.
- **Reduced Motion:** §11; opacity-only/instant; loops stilled; honors OS setting.
- **Font Scaling:** 200% zoom + OS scaling without loss of function; reader reflows; PDF Clean Read at zoom.
- **Color Blind Support:** categorical palettes distinguishable in grayscale; redundant cues (icon/shape/label) on every color-coded element; tested across CVD types.
- **Reduced Transparency:** honored — solid surfaces replace blur.

---

# SECTION 14 — CONTENT DESIGN

The product's *voice* — as much a design token as color. Consistency here is brand.

- **Voice (constant):** clear, calm, knowledgeable, respectful, human. We are a trusted expert companion — precise without jargon, warm without cutesiness, confident without arrogance. We never condescend, never hype, never use fear.
- **Tone (varies by context):** *Reading/empty:* inviting, encouraging. *AI:* helpful, grounded, honest ("I couldn't find this in your sources"). *Errors:* calm, blameless, solution-first. *Success/achievement:* warm, genuine, brief. *Learning:* supportive, non-punitive. Tone shifts; voice never does.
- **Button Labels:** verbs, specific, ≤3 words ("Add source," "Make flashcard," "Jump to source"). Never "OK/Submit" where a specific verb fits. Destructive labels name the act ("Delete book"), never just "Yes."
- **Error Messages:** *cause (plain) → fix (one action) → reassurance.* "Couldn't read this PDF — it may be a scan. Run OCR?" Never codes, never "Something went wrong" alone, never blame.
- **AI Messages:** grounded, cited, honest about limits; decline gracefully ("That's not in your sources — want me to broaden the search?"); never fabricate confidence; refusals are brief + offer a rephrase, never a lecture.
- **Loading Messages:** specific + transparent. "Building your knowledge graph…" not "Loading…"; show *what* is happening (the ingestion pipeline steps).
- **Success Messages:** brief, warm, non-intrusive. "Saved," "Added to your library," "All caught up ✓." Celebrate milestones genuinely, never manufacture them.
- **Empty States:** value + invitation. "Highlights you capture while reading appear here — try selecting any text." Never "No data."
- **Notifications:** calm, useful, dismissible; user-controlled cadence; "Atomic Habits is ready to read" not an urgent-feeling alert. Never manufactured urgency.
- **Microcopy:** consistent terminology (a "source" is always a "source," not sometimes "book/document/file"); sentence case for everything except proper nouns; oxford comma; no exclamation-point inflation; numerals for counts; "you/your" (address the user directly).

**Terminology glossary (use consistently):** Source (any uploaded item) · Library · Highlight · Note · Concept · Knowledge Graph · Flashcard · Review · Tutor · Memory/Understanding/Knowledge Score · Scope (AI boundary) · Citation. (Maintained in §15 governance.)

---

# SECTION 15 — DESIGN GOVERNANCE

How the system stays coherent as it grows. This is what makes it a *system*, not a sticker sheet.

### Naming Conventions
- **Tokens:** `category.role[.variant][.state]` (e.g., `surface.raised`, `button.primary.bg.hover`). Primitive ramps `neutral.{1–12}`, `iris.{1–12}`. Scales `space-{n}`, `radius-{size}`, `duration-{name}`, `z-{layer}`. Themes remap **semantic** only.
- **Components:** PascalCase, descriptive, domain-prefixed where needed (`AIResponseCard`, `KnowledgeCard`, `ReaderToolbar`). Variants are props/modifiers, not new components.
- **Icons:** kebab-case, semantic (`concept`, `highlight`, `ai-sparkle`), not visual (`star-2`).
- **Content terms:** the §14 glossary is authoritative; new terms require governance approval.

### Versioning
- Semantic versioning for the system (`MAJOR.MINOR.PATCH`): MAJOR = breaking token/component contract change; MINOR = additive (new component/variant/token); PATCH = fixes.
- Changelog per release; tokens and components carry a version + status; consumers pin or track.

### Deprecation Rules
- A deprecated token/component is marked, documented with its replacement + migration note, and kept for ≥2 minor versions (a grace window) before removal in a MAJOR.
- Deprecations are announced; never silent removal. Linting flags use of deprecated items.

### Component Approval Process
A new component is approved only if it passes the **anti-sprawl gate**: 1) no existing component (or composition of components) can meet the need; 2) it serves ≥2 real use cases; 3) it has all states + both themes + a11y + responsive specified; 4) it's named per conventions; 5) it passes the Review Checklist below. Proposals show *why composition won't work*.

### Contribution Guidelines
- Anyone may propose; the design-systems owner(s) review. Proposals include: problem, prior-art (Apple/Linear/Notion/Stripe reference), full spec (all 9 component fields), and the use cases.
- New patterns reuse existing tokens; introducing a new *primitive* (a new color hue, a new radius) is a high bar requiring explicit sign-off (protects the monochrome/calm identity).
- Visual-regression baseline + a11y check required before merge.

### Review Checklist (every component/token change)
- [ ] Uses semantic tokens (no raw values / one-off hexes).
- [ ] All states defined (default/hover/active/focus/disabled/loading/error as applicable).
- [ ] Both light + dark + high-contrast verified.
- [ ] Accessibility: keyboard, focus, SR role+name, AA+ contrast, reduced-motion, 44px touch.
- [ ] Responsive across all breakpoints (adaptation rules followed).
- [ ] Motion within tokens; reduced-motion handled; canvas-still respected.
- [ ] Content/microcopy follows §14 voice + glossary.
- [ ] Composes with existing components; no duplication.
- [ ] Anti-patterns documented.
- [ ] Visual-regression baseline added/updated.

### Quality Gates
A change ships only when: review checklist green · visual-regression passes · a11y audit passes · documented (this doc + catalog) · changelog entry · (for breaking changes) migration note + deprecation path. **No undocumented component reaches production.**

### Design Audit Process
- Quarterly audit: scan production for off-system values (one-off colors/spacing/shadows), inconsistent components, contrast failures, missing states, and drift from the spec; file remediation.
- Tooling: lint for raw values outside tokens; automated contrast checks per theme; component-usage inventory; "off-system" report.
- Drift is treated as debt with an owner and a deadline.

### Future Evolution Strategy
- **Theming/"spaces":** the semantic-token architecture is built so new themes (seasonal, per-tenant brand for future VYANA OS, user-custom) are added by remapping semantic tokens — components never change.
- **Density modes** expand (ultra-compact for power users).
- **Component maturity tiers:** experimental → stable → deprecated; experimental components are flagged and not yet contract-stable.
- **Cadence:** the system evolves additively and deliberately; we add slowly, deprecate carefully, and protect the core identity (calm, monochrome + one accent, reading-sacred, AI-distinct). Growth must never erode coherence — *the system's job is to make the right thing the easy thing.*

---

*End of Canonical Design System Specification v1 ("Atlas"). This is the single source of truth for design + frontend. The token tiers (primitive → semantic → component) are the load-bearing contract; changes to primitives or the semantic layer require governance review (§15) + visual-regression sign-off. Experience behavior lives in [UX-SPECIFICATION.md](UX-SPECIFICATION.md); product scope in [PRD.md](PRD.md). Build every pixel from here.*
