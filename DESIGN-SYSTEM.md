# BookHelper — Enterprise Design System

## "Atlas" — the design language of an AI-first reading platform

> **Companion to** [ARCHITECTURE.md](ARCHITECTURE.md) and [UX-DESIGN.md](UX-DESIGN.md). This document is the single source of truth for the visual and interaction language. It defines tokens (values), components (specs), and rules (when/how). It is implementation-agnostic — values map cleanly to `packages/design-tokens` and `packages/ui`.
>
> **No code.** Values are expressed as design tokens (hex, rem, ms, ratios) and component specifications — the contract a UI engineer implements against, not the implementation.

---

## The Design Language: a deliberate synthesis

Atlas is not a mood board — it's a precise blend, with each influence assigned a *job*:

| Influence | What we take | Where it lives |
|---|---|---|
| **Vercel (Geist)** | Near-monochrome foundation, high contrast, sharpness, restraint | Neutral palette, type, borders |
| **Linear** | Dark-first refinement, micro-interactions, tight rhythm, subtle glows | Motion, elevation-on-dark, density |
| **Raycast** | The command palette as a hero; frosted speed; polish | Command Palette, overlays, materials |
| **Apple (HIG)** | Depth via materials/blur, clarity, fluid spring motion, accessibility | Elevation, motion, focus, a11y |
| **Notion** | Content-first warmth, calm neutrals, comfortable reading | Reading surface, spacing, tone |
| **Cursor** | Developer density, confident mono usage, dark surfaces | Tables, code, compact mode |
| **Arc** | A single expressive accent with personality; "spaces" theming | Brand accent, AI presence, theming |

**The resulting feeling:** *A calm, near-monochrome canvas (Notion/Vercel) with one intelligent accent (Arc/Linear), depth from soft materials rather than heavy shadow (Apple), keyboard-first command surfaces (Raycast), and spring-based, reduced-motion-aware motion (Apple/Linear). Dark-first, but light is a first-class peer.*

**Three rules that override everything:**
1. **Monochrome by default, accent with intent.** Color earns its place — selection, primary action, AI presence. Everything else is the neutral scale.
2. **Depth, not decoration.** Elevation communicates hierarchy (Apple materials), never ornaments.
3. **The reading canvas is sacred.** None of this chrome intrudes on text at rest.

---

## Table of Contents

**Foundations** · [Typography](#1-typography) · [Spacing](#2-spacing) · [Grid](#3-grid--layout) · [Radius](#4-radius) · [Colors](#5-colors) · [Icons](#6-icons) · [Elevation](#7-elevation) · [Shadows](#8-shadows) · [Motion](#9-motion) · [Transitions](#10-transitions)

**Components** · [Buttons](#11-buttons) · [Inputs](#12-inputs) · [Dropdowns](#13-dropdowns--menus) · [Cards](#14-cards) · [Dialogs](#15-dialogs) · [Tables](#16-tables) · [Tabs](#17-tabs) · [Command Palette](#18-command-palette) · [Sidebar](#19-sidebar) · [Topbar](#20-topbar)

**Domain Components** · [Reader](#21-reader-components) · [Knowledge](#22-knowledge-components) · [AI](#23-ai-components) · [Charts](#24-charts)

**Feedback & System** · [Animations](#25-animations) · [Loading](#26-loading-components) · [Skeletons](#27-skeletons) · [Toast](#28-toast) · [Notifications](#29-notifications)

**Cross-cutting** · [Accessibility](#30-accessibility) · [Dark Theme](#31-dark-theme) · [Light Theme](#32-light-theme)

---

## Token architecture

Three tiers. Components reference **semantic** tokens only — never raw values. Themes remap the semantic layer; components never change.

```
Primitive tokens        Semantic tokens              Component tokens
(raw values)            (intent, theme-aware)        (optional, scoped)
neutral.1 = #FCFCFD ──▶ surface.base    = neutral.1 ──▶ button.primary.bg
iris.9    = #5B5BD6 ──▶ accent.solid    = iris.9    ──▶ card.border = border.subtle
space.4   = 16px    ──▶ (used directly via scale)
```

---

# Foundations

## 1. Typography

### 1.1 Typefaces

| Role | Family | Fallback | Use |
|---|---|---|---|
| **UI / Sans** | Geist Sans | Inter, system-ui | All interface text, labels, buttons |
| **Reading / Serif** | Tiempos Text | Source Serif 4, Georgia | Long-form reading canvas (default) |
| **Mono** | Geist Mono | JetBrains Mono, ui-monospace | Code, data, shortcuts, IDs, tabular numerics |
| **Reading / Sans alt** | Inter | system-ui | Reader sans option |
| **Accessible** | Atkinson Hyperlegible | — | Dyslexia-friendly reader option |

- **Optical sizing & features:** `tabular-nums` for tables/metrics/timers; `cv01/ss01`-style stylistic sets on Geist where they sharpen legibility; ligatures off in mono.
- **Loading:** UI fonts preloaded; reading fonts preloaded on reader entry to prevent FOUT.

### 1.2 UI type scale (base 16px / 1rem; 1.25 modular-ish, hand-tuned)

| Token | Size | Line height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display-lg` | 48 / 3rem | 52 (1.08) | 600 | -0.02em | Marketing hero only |
| `display-md` | 36 / 2.25rem | 40 (1.11) | 600 | -0.02em | Page hero |
| `heading-xl` | 28 / 1.75rem | 34 (1.21) | 600 | -0.015em | Major page title |
| `heading-lg` | 22 / 1.375rem | 28 (1.27) | 600 | -0.01em | Section title |
| `heading-md` | 18 / 1.125rem | 24 (1.33) | 600 | -0.005em | Card / dialog title |
| `heading-sm` | 15 / 0.9375rem | 20 (1.33) | 600 | 0 | Sub-section, table header |
| `body-lg` | 16 / 1rem | 26 (1.6) | 400 | 0 | Comfortable body, AI chat |
| `body-md` | 14 / 0.875rem | 22 (1.57) | 400 | 0 | Default UI body |
| `body-sm` | 13 / 0.8125rem | 18 (1.38) | 400 | 0 | Secondary, dense UI |
| `label` | 14 / 0.875rem | 16 (1.14) | 500 | 0 | Form labels, buttons |
| `label-sm` | 12 / 0.75rem | 16 (1.33) | 500 | 0.01em | Chips, badges, captions |
| `caption` | 12 / 0.75rem | 16 (1.33) | 400 | 0.01em | Metadata, helper text |
| `overline` | 11 / 0.6875rem | 14 | 600 | 0.06em | UPPERCASE section eyebrows |
| `code` | 13 / 0.8125rem | 20 | 450 | 0 | Inline code, shortcuts |

**Weights used:** 400 (regular), 450 (mono), 500 (medium), 600 (semibold). No 700+ in UI — Vercel-style restraint; hierarchy comes from size/color/space, not heaviness.

### 1.3 Reading type scale (reader canvas only — user-adjustable)

Independent of UI scale. Defaults; the reader exposes size, measure, line-height, spacing controls.

| Token | Default | Range | Notes |
|---|---|---|---|
| `reading-body` | 19px / 1.7 lh | 16–24px | Serif default; measure-constrained |
| `reading-h1` | 30px / 1.25 | scales with body | Chapter |
| `reading-h2` | 24px / 1.3 | — | Section |
| `reading-measure` | 68ch | 50–80ch | Optimal line length |
| `reading-paragraph-gap` | 1em | — | Vertical rhythm |

### 1.4 Rules
- One `display`/`heading-xl` per view (one `<h1>`).
- Body color: `text.primary`; secondary info `text.secondary`; never below `text.tertiary` for meaningful content.
- Numerals in data contexts use `tabular-nums`.

---

## 2. Spacing

**4px base unit.** An 8px rhythm governs vertical flow; 4px allowed for fine control inside dense components.

| Token | px | rem | Typical use |
|---|---|---|---|
| `space-0` | 0 | 0 | reset |
| `space-px` | 1 | — | hairline nudges |
| `space-0.5` | 2 | 0.125 | icon/text micro-gap |
| `space-1` | 4 | 0.25 | tight inline gap |
| `space-2` | 8 | 0.5 | default inline gap, chip padding |
| `space-3` | 12 | 0.75 | input padding, compact stacks |
| `space-4` | 16 | 1 | default component padding |
| `space-5` | 20 | 1.25 | card padding |
| `space-6` | 24 | 1.5 | section gaps |
| `space-8` | 32 | 2 | block separation |
| `space-10` | 40 | 2.5 | large section |
| `space-12` | 48 | 3 | page section gaps |
| `space-16` | 64 | 4 | major layout regions |
| `space-20` | 80 | 5 | hero spacing |
| `space-24` | 96 | 6 | page top/bottom margins (desktop) |

**Density modes:** `comfortable` (default) and `compact` (Cursor-style; multiplies vertical paddings ×0.75, used in tables, dense lists, power-user mode).

**Component padding standards:** button-md `space-2`/`space-4`; input `space-3`/`space-3`; card `space-5`; dialog `space-6`; list row `space-3`.

---

## 3. Grid & Layout

### 3.1 Breakpoints (intent boundaries, not just widths)

| Token | Range | Intent |
|---|---|---|
| `xs` | ≤ 480 | small phone |
| `sm` | 481–640 | phone — reading & capture |
| `md` | 641–1024 | tablet — lean-back study |
| `lg` | 1025–1440 | desktop — deep-work cockpit |
| `xl` | 1441–1920 | large desktop |
| `2xl` | ≥ 1921 | wide / external display |

Touch vs. pointer is detected independently and tunes hit-targets (touch min 44×44) and hover behavior.

### 3.2 Grid

- **12-column** fluid grid; gutter `space-6` (24) desktop, `space-4` (16) tablet, `space-4` mobile.
- **Container max-widths:** content `1200px`; wide (graph/analytics) `1440px`; reading column `min(68ch, 720px)` — *reading is always measure-constrained, never full-bleed*.
- **App shell:** rail `64px` collapsed / `240px` expanded; AI/notes side panel `360–420px`; topbar `52px`.
- **Safe areas:** respect device insets (notch, home indicator); bottom-sheet handles within thumb reach.

### 3.3 Z-index scale

| Token | z | Layer |
|---|---|---|
| `z-base` | 0 | content |
| `z-sticky` | 100 | sticky headers, topbar |
| `z-rail` | 200 | sidebar/rail |
| `z-dropdown` | 1000 | menus, selects, popovers |
| `z-overlay` | 2000 | dialog scrim |
| `z-dialog` | 2100 | dialogs, sheets |
| `z-palette` | 3000 | command palette |
| `z-toast` | 4000 | toasts |
| `z-tooltip` | 5000 | tooltips |

---

## 4. Radius

Soft, modern, not pill-everything. Apple/Linear-calibrated.

| Token | px | Use |
|---|---|---|
| `radius-none` | 0 | flush edges, table cells |
| `radius-xs` | 4 | chips, badges, tags, inline code |
| `radius-sm` | 6 | inputs, small buttons, menu items |
| `radius-md` | 8 | buttons, cards (default) |
| `radius-lg` | 12 | large cards, dialogs, panels |
| `radius-xl` | 16 | sheets, command palette, feature cards |
| `radius-2xl` | 20 | modals on large screens, hero surfaces |
| `radius-full` | 9999 | avatars, toggles, pills, FABs |

**Rule:** nested radii follow the *concentric* rule — inner radius = outer radius − padding (so corners stay parallel).

---

## 5. Colors

12-step ramps (Radix-style: 1–2 backgrounds, 3–5 component backgrounds, 6–8 borders, 9–10 solid, 11 low-contrast text, 12 high-contrast text). Each ramp has a Light and Dark variant. Components reference **semantic tokens**, not raw steps.

### 5.1 Neutral — Slate (cool-neutral, slight warmth; the foundation)

| Step | Light | Dark | Role |
|---|---|---|---|
| 1 | `#FCFCFD` | `#0A0A0B` | app background |
| 2 | `#F8F9FA` | `#111214` | subtle background |
| 3 | `#F1F3F5` | `#17181B` | UI element bg |
| 4 | `#ECEEF0` | `#1D1F23` | hovered element bg |
| 5 | `#E6E8EB` | `#24262B` | active/selected bg |
| 6 | `#DFE2E6` | `#2C2F35` | subtle border |
| 7 | `#D3D7DD` | `#373B42` | border, separator |
| 8 | `#BCC2CB` | `#474C55` | strong border, hover border |
| 9 | `#8B919D` | `#5C626C` | solid, placeholder |
| 10 | `#6E747F` | `#7C828D` | hovered solid, icon |
| 11 | `#545A63` | `#A8AEB8` | secondary text |
| 12 | `#1A1C1F` | `#ECEEF1` | primary text |

### 5.2 Accent — Iris (the brand; intelligent, calm; used with intent)

| Step | Light | Dark | Role |
|---|---|---|---|
| 3 | `#F2F1FE` | `#1E1B33` | accent tint bg |
| 5 | `#E0DDFB` | `#2C285A` | accent selected bg |
| 7 | `#BCB4F2` | `#473E9E` | accent border |
| 9 | `#5B5BD6` | `#6E56CF` | **accent solid** (primary button) |
| 10 | `#5151CD` | `#7C66DC` | accent hover |
| 11 | `#5753C6` | `#B8A9F5` | accent text / link |

### 5.3 AI presence — the signature (Arc/Linear gradient; *only* for AI surfaces)

AI is visually distinct from both content and brand chrome.

| Token | Value |
|---|---|
| `ai.gradient` | linear 135° `#6E56CF` → `#3E63DD` (violet → blue) |
| `ai.glow` | radial soft `#6E56CF` @ 18% opacity, blur 40 |
| `ai.solid` | `#6E56CF` |
| `ai.tint` (light/dark) | `#F4F2FE` / `#1C1A33` |
| `ai.border` (light/dark) | `#D8D2F7` / `#3A3270` |
| `ai.shimmer` | animated 1.2s gradient sweep for streaming/thinking |

### 5.4 Semantic ramps (key steps shown; full 1–12 exists)

| Ramp | Solid (9) Light/Dark | Tint (3) | Text (11) | Use |
|---|---|---|---|---|
| **Success** (Green) | `#30A46C` / `#33B074` | `#E9F7EF`/`#10231A` | `#218358`/`#62C893` | confirmations, done |
| **Warning** (Amber) | `#FFB224` / `#FFB224` | `#FFF6E5`/`#2E2008` | `#946800`/`#F5C24E` | caution, pending |
| **Danger** (Red) | `#E5484D` / `#E5484D` | `#FDEBEC`/`#2A1416` | `#CE2C31`/`#FF9592` | errors, destructive |
| **Info** (Blue) | `#3E63DD` / `#3E63DD` | `#EBF0FF`/`#101A36` | `#3A5BC7`/`#8DA4EF` | neutral info |

### 5.5 Semantic tokens (what components use)

| Token | Light → step | Dark → step | Meaning |
|---|---|---|---|
| `surface.base` | neutral.1 | neutral.1 | app background |
| `surface.subtle` | neutral.2 | neutral.2 | grouped background |
| `surface.raised` | `#FFFFFF` | neutral.3 | cards, panels |
| `surface.overlay` | `#FFFFFF` | neutral.4 | dropdowns, dialogs |
| `surface.inset` | neutral.3 | neutral.2 | wells, code blocks |
| `border.subtle` | neutral.6 | neutral.6 | hairlines, dividers |
| `border.default` | neutral.7 | neutral.7 | inputs, cards |
| `border.strong` | neutral.8 | neutral.8 | emphasis, hover |
| `text.primary` | neutral.12 | neutral.12 | body, headings |
| `text.secondary` | neutral.11 | neutral.11 | supporting |
| `text.tertiary` | neutral.10 | neutral.10 | metadata, hints |
| `text.disabled` | neutral.8 | neutral.8 | disabled |
| `text.onAccent` | `#FFFFFF` | `#FFFFFF` | text on solid accent |
| `accent.solid` | iris.9 | iris.9 | primary actions |
| `accent.text` | iris.11 | iris.11 | links, accent text |
| `focus.ring` | iris.8 @ 50% | iris.8 @ 60% | focus outline |
| `selection.bg` | iris.5 | iris.5 | text selection |

### 5.6 Color rules
- **Contrast:** body text meets WCAG **AAA** (≥7:1) where feasible, AA (≥4.5:1) minimum; large text/UI ≥3:1.
- **Never color-only.** Status always pairs color with icon + text.
- **Accent budget:** ≤ ~10% of any view is accent/AI color.
- **Highlight colors** (reader) are a separate, legibility-tested palette (see §21) that preserves text contrast in all themes.

---

## 6. Icons

- **Set:** a single coherent line set (Lucide-grade), 1.5px stroke, rounded joins, 24×24 grid; optical alignment to text baseline.
- **Sizes:** `icon-xs` 14, `icon-sm` 16 (default in buttons/menus), `icon-md` 20, `icon-lg` 24, `icon-xl` 32 (empty states).
- **Color:** inherits `currentColor`; default `text.secondary`, `text.primary` on hover/active, `accent.text` for active nav.
- **Weight pairing:** 1.5px stroke pairs with 400–500 text; never heavier.
- **Rules:** icon-only controls require an accessible name + tooltip; pair icon with label on first exposure; never use an icon to carry meaning color can't (and vice-versa). Duotone reserved for AI/empty-state illustration accents only.
- **Domain icons:** consistent glyphs for source types (PDF, EPUB, web, audio, video, note), node types (concept, entity, claim), and learning (flashcard, quiz, mastery).

---

## 7. Elevation

Elevation = perceived height = importance. **On light**, height reads through shadow. **On dark** (Linear/Apple), shadows barely register, so height reads through *lighter surface + hairline border + optional glow*. Both defined per level.

| Level | Use | Light technique | Dark technique |
|---|---|---|---|
| `e0` | flush content, table rows | none | none |
| `e1` | cards, inputs | `shadow-xs` + `border.subtle` | surface.3 + `border.subtle` |
| `e2` | hover cards, popovers | `shadow-sm` | surface.4 + `border.default` |
| `e3` | dropdowns, menus | `shadow-md` + border | surface.4 + `border.default` + subtle inner top-highlight |
| `e4` | dialogs, sheets | `shadow-lg` | surface.4 + `border.default` + `shadow-lg` (softened) |
| `e5` | command palette, toasts | `shadow-xl` + backdrop blur | surface.4 + border + `shadow-xl` + `ai.glow` (palette only) |

**Materials (Apple):** overlays (`e3`+) use **backdrop blur** (`blur(20px)` + 80% surface opacity) for the frosted Raycast/Apple feel — disabled when `prefers-reduced-transparency` is set (falls back to solid `surface.overlay`).

---

## 8. Shadows

Soft, layered, low-opacity (two stacked shadows: a tight contact + a diffuse ambient). Tuned warmer/softer than Material; closer to Apple/Linear.

| Token | Light value (contact + ambient) | Dark value |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgb(0 0 0 / 0.04)` | `0 1px 2px rgb(0 0 0 / 0.3)` |
| `shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.05), 0 2px 6px rgb(0 0 0 / 0.05)` | `0 2px 6px rgb(0 0 0 / 0.4)` |
| `shadow-md` | `0 2px 4px rgb(0 0 0 / 0.05), 0 6px 16px rgb(0 0 0 / 0.08)` | `0 6px 16px rgb(0 0 0 / 0.5)` |
| `shadow-lg` | `0 4px 8px rgb(0 0 0 / 0.06), 0 12px 32px rgb(0 0 0 / 0.10)` | `0 12px 32px rgb(0 0 0 / 0.55)` |
| `shadow-xl` | `0 8px 16px rgb(0 0 0 / 0.08), 0 24px 56px rgb(0 0 0 / 0.14)` | `0 24px 56px rgb(0 0 0 / 0.6)` |
| `shadow-focus` | `0 0 0 3px focus.ring` | `0 0 0 3px focus.ring` |
| `glow-ai` | `0 0 24px rgb(110 86 207 / 0.25)` | `0 0 32px rgb(110 86 207 / 0.35)` |

**Rules:** shadows are never colored except `glow-ai`. Inner shadows only for inset wells. On dark, lead with surface/border; shadow is supportive.

---

## 9. Motion

Motion is *physical and quiet*. Spring-based for spatial moves (Apple), eased for fades (Linear). Everything respects `prefers-reduced-motion`.

### 9.1 Duration

| Token | ms | Use |
|---|---|---|
| `duration-instant` | 0 | state that must feel immediate |
| `duration-fast` | 120 | hover, focus, small toggles |
| `duration-base` | 180 | most transitions, fades |
| `duration-moderate` | 240 | panels, dropdowns, popovers |
| `duration-slow` | 320 | dialogs, sheets, page transitions |
| `duration-slower` | 480 | large spatial / first-load reveals |

### 9.2 Easing

| Token | Curve | Use |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | most UI |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | enters (decelerate) |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | exits (accelerate) |
| `ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1.2)` | playful, attention (sparingly) |

### 9.3 Springs (spatial moves — Apple feel)

| Token | Stiffness / Damping | Use |
|---|---|---|
| `spring-snappy` | 380 / 30 | menus, toggles, small pops |
| `spring-smooth` | 260 / 30 | panels, sheets, cards |
| `spring-gentle` | 180 / 26 | large overlays, graph layout settle |

### 9.4 Rules
- Enters decelerate (`ease-out`/spring), exits accelerate (`ease-in`) and are ~30% faster than enters.
- Spatial elements animate from their **origin** (a menu grows from its trigger; a dialog scales from center 0.96→1).
- **No motion in the reading canvas at rest.** Page turns are instant or a single calm fade.
- **`prefers-reduced-motion`:** all transforms → opacity-only cross-fades ≤120ms; springs → instant; shimmer/looping animations → static.

---

## 10. Transitions

Named, reusable interaction transitions composed from §9.

| Transition | Spec | Applied to |
|---|---|---|
| `t-hover` | bg/border/color `duration-fast` `ease-standard` | buttons, rows, cards |
| `t-focus` | `shadow-focus` `duration-fast` | all focusable |
| `t-press` | scale `0.98` `duration-instant` | buttons, tappables |
| `t-fade` | opacity `duration-base` `ease-standard` | tooltips, inline reveals |
| `t-menu` | opacity + scale `0.96→1` + 4px slide, `spring-snappy` | dropdowns, popovers, palette items |
| `t-panel` | translateX + fade, `spring-smooth` `duration-moderate` | AI/notes side panel (no content reflow) |
| `t-dialog` | scale `0.96→1` + fade, scrim fade, `duration-slow` | dialogs |
| `t-sheet` | translateY from bottom, `spring-smooth` | mobile bottom sheets |
| `t-page` | cross-fade + 8px slide, `duration-base` | surface/route transitions |
| `t-stream` | per-chunk opacity fade-in | AI streamed text |
| `t-skeleton` | shimmer sweep 1.4s loop (static if reduced-motion) | skeletons |

---

# Components

> Each spec lists **anatomy → variants → sizes → states → tokens → behavior → a11y**. States referenced: `default, hover, active(pressed), focus-visible, selected, disabled, loading, error`.

## 11. Buttons

**Anatomy:** `[ optional leading icon ] label [ optional trailing icon / shortcut hint / loader ]`, radius `md`, weight 500.

**Variants**

| Variant | Look | Use |
|---|---|---|
| `primary` | `accent.solid` bg, `text.onAccent` | the one primary action per view |
| `secondary` | `surface.raised` bg, `border.default`, `text.primary` | common actions |
| `ghost` | transparent, `text.secondary`, hover `surface.subtle` | toolbar, low-emphasis |
| `outline` | transparent, `border.default` | alt secondary |
| `destructive` | `danger.9` bg / or ghost-danger text | delete, irreversible |
| `ai` | `ai.gradient` bg + subtle `glow-ai` | invoke AI (the only gradient button) |
| `link` | text only, `accent.text`, underline on hover | inline navigation |

**Sizes**

| Size | Height | Padding-x | Text | Icon |
|---|---|---|---|---|
| `sm` | 28 | `space-3` | `label-sm` | 14 |
| `md` | 36 | `space-4` | `label` | 16 |
| `lg` | 44 | `space-5` | `label` | 18 |
| `icon-sm/md/lg` | 28/36/44 square | — | — | 16/18/20 |

**States:** hover (`t-hover`, +1 step bg or 4% overlay), active (`t-press` scale 0.98), focus-visible (`shadow-focus`), disabled (`text.disabled`, no shadow, `cursor: not-allowed`), loading (spinner replaces leading icon, label stays, button width locked, non-interactive).

**Behavior:** optional trailing shortcut hint in mono (Raycast style, e.g. `⌘S`). Primary auto-focuses in dialogs. Destructive in dialogs requires deliberate placement (never adjacent to default focus).

**A11y:** real `<button>`; `aria-busy` while loading; `aria-disabled` (focusable+announced) preferred over hard-disabled where the user needs to know why; min 44px touch target (`sm` gets invisible hit-padding on touch); never icon-only without `aria-label`.

---

## 12. Inputs

Covers text field, textarea, search, number, password, with-icon/affix.

**Anatomy:** `label` (above) · `[ leading icon ] input [ trailing affix / clear / status ]` · `helper / error` (below). Radius `sm`, `border.default`, `surface.base`, padding `space-3`.

**Sizes:** `sm` 32h, `md` 36h (default), `lg` 44h.

**States**

| State | Treatment |
|---|---|
| default | `border.default`, placeholder `text.tertiary` |
| hover | `border.strong` |
| focus | `border` → `accent.solid` + `shadow-focus` |
| filled | `text.primary` |
| disabled | `surface.subtle`, `text.disabled` |
| error | `border` → `danger.9`, helper → `danger.text`, error icon |
| success | optional `success.9` border + check |
| loading | trailing spinner (async validation) |

**Behavior:** clearable search shows an `×` when filled; password shows reveal toggle; number has stepper on hover/focus; textarea auto-grows to a max then scrolls. Inline validation on blur, not per-keystroke. Affixes (e.g., `https://`) sit inside the field in `text.tertiary`.

**A11y:** every input has a visible, associated `<label>`; helper/error linked via `aria-describedby`; error state sets `aria-invalid`; required marked in text not just `*`; placeholder is never the only label.

---

## 13. Dropdowns & Menus

Covers **Select**, **Menu** (actions), **Combobox** (searchable), **Popover** (rich), **Context menu**.

**Anatomy:** trigger → floating panel (`e3`, `radius-md`, backdrop blur, `t-menu`), item rows (`radius-sm`, `space-2`/`space-3`), optional sections with `overline` headers and dividers (`border.subtle`).

**Item:** `[ icon ] label [ … description ] [ trailing: shortcut / check / submenu ▸ ]`. Hover/active row bg `surface.subtle`/`neutral.5`; selected shows check + accent text.

**Variants:** single-select, multi-select (checkbox rows), grouped, searchable (combobox with inline filter + highlighted matches), with-descriptions, danger items (destructive in `danger.text`).

**States:** open/closed (`t-menu` from trigger origin), item hover/active/focus (keyboard and pointer share highlight), disabled item, loading (skeleton rows in async menus), empty ("No matches").

**Behavior:** opens on click; positions with collision-aware flipping; max-height with internal scroll + sticky search/header; typeahead jump; closes on select / `Esc` / outside-click; multi-select stays open. Selected value shown in trigger; long values truncate with tooltip.

**A11y:** `role=listbox`/`menu` with `aria-activedescendant`; full keyboard (↑↓ navigate, Enter select, →/← submenu, type-to-filter, Home/End, Esc close); focus returns to trigger on close; selection state announced; combobox follows the ARIA combobox pattern.

---

## 14. Cards

**Anatomy:** container (`surface.raised`, `border.subtle`, `radius-lg`, `e1`, padding `space-5`) → optional media → header (`heading-md` + meta) → body → footer/actions.

**Variants:** `static` (info), `interactive` (hover lift, whole-card link), `selectable` (checkbox/selected ring `accent`), `media` (cover-led — library book cards), `metric` (dashboard stat: big `tabular-nums` value + label + delta), `ai` (subtle `ai.border`/`ai.tint` for AI-generated content).

**States:** default `e1`; hover (interactive) → `e2` + `border.default`, lift `translateY(-2px)` `spring-smooth`; selected → `accent` ring + `accent.tint` bg; focus-visible ring; loading → skeleton card; disabled → 50% opacity.

**Behavior:** entire interactive card is one click target (nested actions stop propagation); media keeps aspect ratio (no layout shift); metric deltas use `success`/`danger` + arrow icon + sign (never color alone).

**A11y:** interactive card is a single labeled link/button with a complete accessible name; nested actions are reachable and separately labeled; selection via checkbox is keyboard-operable.

---

## 15. Dialogs

Covers **Modal dialog**, **Alert/confirm**, **Sheet** (side/bottom), **Drawer**.

**Anatomy:** scrim (`rgb(0 0 0 / 0.4)` light / `0.6` dark, `t-fade`) → surface (`surface.overlay`, `radius-xl`/`2xl`, `e4`, backdrop blur, max-width `480/560/720`) → header (title `heading-md` + close `×`) → body (scrolls; sticky header/footer) → footer (right-aligned actions; primary rightmost).

**Variants:** `default`, `alert` (icon + danger/confirm — destructive confirm requires typing or explicit primary), `sheet-side` (right panel, `t-panel`), `sheet-bottom` (mobile, `t-sheet`, drag handle, swipe-to-dismiss), `fullscreen` (mobile takeover).

**States:** open (`t-dialog`), closing (faster `ease-in`), loading body (skeleton), submitting (footer primary → loading, dialog non-dismissible). Nested dialogs discouraged; if needed, stack scrims.

**Behavior:** open scales 0.96→1 + scrim fade; `Esc` and scrim-click close (except mid-submit or destructive-unsaved → confirm); body scroll-locks page; on mobile, modals become bottom sheets by default.

**A11y:** `role=dialog` + `aria-modal`, labelled by title; **focus trapped**, initial focus on first input or primary (never on destructive), **focus restored** to trigger on close; `Esc` closes; scrim is `aria-hidden`; announced on open.

---

## 16. Tables

Data-dense, Cursor/Linear-grade. Built for libraries, highlights lists, analytics tables, admin.

**Anatomy:** optional toolbar (search, filters, view options, bulk-actions bar) → header row (`heading-sm`, sticky, sortable) → body rows (`space-3` padding, `border.subtle` row dividers, `tabular-nums` for numerics) → optional footer (pagination/summary).

**Variants:** `default`, `compact` (density mode), `bordered` vs `borderless` (default: row-dividers only, no vertical lines — Notion/Linear clean), `selectable` (checkbox column), `expandable` (row detail), `grouped`.

**States:** row hover (`surface.subtle`), selected (`accent.tint` + persistent checkbox), sorted column (active header + arrow), focused cell/row (keyboard), loading (skeleton rows), empty (in-table empty state), error (inline retry row). Sticky header on scroll; first column can pin.

**Behavior:** click header to sort (3-state: asc/desc/none); multi-sort with shift; column resize/reorder/show-hide (power tables); inline edit on double-click where allowed; bulk-select reveals a floating action bar; virtualized for large sets; horizontal scroll with pinned columns + shadow edge cue.

**A11y:** semantic `<table>` with `<th scope>`; sort state via `aria-sort`; row selection announced ("3 of 20 selected"); keyboard cell navigation (arrows) for grid-mode tables; pagination controls labeled; never rely on row color alone for status.

---

## 17. Tabs

**Anatomy:** tab list → tab triggers (`label`, optional icon/count badge) → animated active indicator → panels (`t-fade` on switch).

**Variants:** `underline` (default — active gets `accent` underline that slides between tabs, `spring-snappy`), `segmented` (Apple-style pill group on `surface.subtle`, active = `surface.raised` + `e1`), `pill` (chips), `vertical` (settings/side nav). Counts shown as `label-sm` badges.

**States:** active (`text.primary` + indicator), inactive (`text.secondary`), hover (`text.primary`), focus-visible (ring), disabled, overflow (scroll with edge fade + chevrons; or "more" menu).

**Behavior:** indicator animates between positions; lazy-loads panels; remembers last tab per context; on mobile, scrollable or becomes a segmented control / select.

**A11y:** ARIA tabs pattern (`role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`); arrow-key navigation; automatic vs manual activation configurable; panel focus management on switch.

---

## 18. Command Palette

The **hero surface** (Raycast/Linear). The fastest path to anything. Invoked `⌘K`.

**Anatomy:**
```
┌───────────────────────────────────────────────┐  e5, radius-xl, backdrop blur,
│ 🔍  Search or type a command…        [scope ▾] │  glow-ai, t-menu (scale+fade
├───────────────────────────────────────────────┤  from center, spring-snappy)
│  RECENT                                          │
│  📖 Thinking, Fast and Slow            ⏎        │  ← roving highlight
│  COMMANDS                                        │
│  ✦ Ask AI about current page          /         │
│  ➕ Add source                          n        │
│  GO TO                                           │
│  🏠 Home   📚 Library   🕸 Graph   ⚙ Settings   │
└───────────────────────────────────────────────┘
  ↑↓ navigate   ⏎ select   ⌘K close       <- footer hint bar
```

**Anatomy detail:** search input (auto-focused, no border, large) → optional scope chip → results grouped with `overline` section headers → result rows (`[icon] title [subtitle] [trailing shortcut/⏎]`) → footer hint bar (`label-sm`, mono shortcuts).

**Modes (prefix-driven):** plain = unified fuzzy search (docs + commands + concepts + nav); `>` = commands only; `@` = documents; `#` = concepts; `?` = help. Mode shown as a chip.

**States:** open (scale 0.96→1 + scrim + blur), typing (debounced; results re-rank live; highlighted match substrings), highlighted row (keyboard+pointer unified), loading (inline skeleton rows + subtle top progress), empty ("No results for *x* — press ⏎ to ask AI"), nested (a command can push a sub-palette, e.g. "Move to collection ▸" with breadcrumb + `←`/`Esc` back), action-running (inline loader on the row).

**Behavior:** instant local results, server results stream in; first item auto-highlighted; `Enter` runs; actions can take arguments inline; recent + frequent + contextual ranking; resilient to fast typing. Mobile: full-screen sheet from top, large input, software-keyboard aware.

**A11y:** ARIA combobox + listbox with `aria-activedescendant`; full keyboard (it *is* the keyboard surface); result count announced; focus trapped; `Esc` closes / steps back one level; descriptive labels including type and shortcut.

---

## 19. Sidebar (App Rail)

**Anatomy:** brand/space switcher (top) → primary nav items (icon + label) → optional collapsible sections (collections, recent) → spacer → profile/settings (bottom). Collapsible: `64px` (icon-only) ↔ `240px` (labeled). Surface `surface.subtle`, `border.subtle` divider.

**Variants:** `expanded`, `collapsed` (hover-expands as overlay, Arc-style), `hidden` (reader takeover), `mobile` (becomes bottom tab bar of 4–5 items).

**States:** nav item default (`text.secondary` + icon), hover (`surface.base`/+1 step bg), active (`accent.tint` bg + `accent.text` + left `accent` indicator bar), focus-visible ring, badge/count (`label-sm`), section collapsed/expanded (chevron, `spring-snappy`), drag-reorder (collections).

**Behavior:** remembers collapsed state; auto-collapses entering the reader; hover-to-peek when collapsed; collections support nesting + drag-and-drop; "spaces"/profile switcher at top (Arc) for multi-context. Keyboard `g`+letter jumps.

**A11y:** `<nav>` landmark with label; active item `aria-current="page"`; collapsed icon-only items keep accessible names + tooltips; collapse toggle labeled; full keyboard nav; mobile tab bar uses tab semantics.

---

## 20. Topbar

**Anatomy (52px):** `[ breadcrumb / page title or doc title ]  …flexible…  [ contextual actions ] [ search/⌘K affordance ] [ AI affordance ] [ notifications ] [ avatar ]`. Surface `surface.base`, `border.subtle` bottom, sticky (`z-sticky`).

**Variants:** `app` (global), `reader` (minimal — doc title, progress, reading controls, AI dot; auto-hides on scroll), `contextual` (page-specific actions), `selection` (transforms into a bulk-action bar when items selected).

**States:** default, scrolled (subtle `shadow-xs` appears under it / blur intensifies), reader-hidden (slides up on scroll-down, returns on scroll-up/tap), with-unsaved (subtle indicator), offline (calm inline pill).

**Behavior:** breadcrumb truncates middle on small widths; primary contextual action is a button, overflow into `⋯` menu; the `⌘K` and AI affordances are always present (muscle memory); progress in reader is a thin top bar, not a number nag.

**A11y:** `<header>` + `banner` landmark; breadcrumb is an ordered nav with current marked; all controls labeled; the search/AI affordances expose their shortcuts; offline state announced politely.

---

# Domain Components

## 21. Reader Components

The product's soul. Calm, typographic, instrumented invisibly.

| Component | Spec |
|---|---|
| **Reading surface** | Measure-constrained column (`reading-measure`), serif default, theme-aware (Light/Sepia/Dark/Night), zero chrome at rest. Renders the canonical Document Model blocks; PDF/EPUB faithful render available. |
| **Selection toolbar** | On text-select, a compact floating bar (`e3`, `t-menu` from selection): `Highlight · Note · Ask · Explain · Define · Copy`. Disappears on deselect. |
| **Highlight** | Translucent overlay in one of 5 legibility-tested colors (yellow/green/blue/pink/purple at theme-tuned opacity preserving text contrast); marker dot in the gutter; semantic labels optional, never color-only. |
| **Margin / annotation gutter** | Quiet column for highlight/note markers; empty by default; click marker → scroll + open. |
| **Reading controls** | A popover (font family/size/measure/line-height/spacing/theme) with a **live preview**; calm, immediate apply. |
| **Table of contents** | Slide-in outline; current section highlighted; jump on click; nested, collapsible. |
| **Progress** | Thin top bar + "X min left in chapter" on demand — never a persistent percentage nag. |
| **Read-aloud (TTS)** | Floating mini-player; current word/sentence highlighted in sync; speed control. |
| **Reading ruler / focus line** | Optional a11y aid dimming non-current lines. |
| **Bookmark** | Single-tap; subtle ribbon glyph. |

**Tokens:** reading typography scale (§1.3); reader themes are *independent* token sets from app chrome. Motion: none at rest; page transitions instant/single fade.

**A11y:** real selectable semantic text; TTS with word sync; ruler; reflow honors OS font scale; AI/notes panels never steal reading focus or position.

---

## 22. Knowledge Components

| Component | Spec |
|---|---|
| **Graph canvas** | WebGL force/hierarchy/timeline layouts; nodes sized by relevance; edges typed by *style + label* (never color alone). Pan/zoom/focus. Reduced-motion: static layout, no jitter. Desktop = full power; mobile = simplified neighbor list. |
| **Node** | Circle/chip by type (concept/entity/claim icon), label, `accent`/`ai` ring when focused; hover tooltip; selected → opens detail panel. |
| **Concept detail panel** | Side panel: concept summary (AI, cited), source list ("appears in 3 sources" → jump), connections, actions (Explain connection, Tutor this, Make flashcards). |
| **Concept chip** | Inline pill (`radius-xs`, `surface.subtle`) used in notes/search/answers; click → graph focus or peek. |
| **Provenance popover** | From any node/edge/citation: exact source quote + locator + "Jump to source." The trust primitive. |
| **Graph (accessible) list view** | First-class non-visual equivalent: navigable tree of nodes + relationships + actions; the graph is an enhancement, not the only way in. |

**A11y:** the list/tree equivalent is mandatory and feature-complete; keyboard node cycling announces relationships; edge meaning carried by label + line style.

---

## 23. AI Components

The AI presence is *one recognizable system* across surfaces, visually distinct (`ai.*` tokens).

| Component | Spec |
|---|---|
| **Ask Bar** | Persistent minimal entry (`/` to focus). `[ ✦ ] input [ scope chip ▾ ] [ send ]`. Subtle `ai.border`; expands into the panel/sheet on submit. |
| **Scope chip** | Always-visible knowledge-boundary control: `This page ▾ / This book / Collection / Everything`. The user always knows what AI can "see." |
| **AI panel** | Side panel (desktop/tablet, `t-panel`, no reading reflow) or bottom sheet (mobile). Conversation + input + sources tray. `ai.tint` header accent. |
| **AI message** | Streamed text (`t-stream`), `body-lg`, with inline citation chips. Hover/long-press reveals actions: Copy · Save as note · Make flashcard · Add to graph · Retry · Go deeper. |
| **Citation chip** | Inline `[1]` superscript pill (`accent`/`ai`); hover/tap → provenance popover; "Jump to source" highlights the span. |
| **Streaming / thinking indicator** | `ai.shimmer` gradient pulse + optional status ("Searching 12 sources…", "Found 6 passages"). Stop control always present. |
| **Suggested prompts** | Context-derived chips in empty chat/tutor; tappable; disappear once typing. |
| **AI whisper** | A single, calm, dismissible proactive suggestion (toast-adjacent but quieter); never more than one; one gesture to pin/dismiss. |
| **Quick-reply chips** | Tutor next-step buttons ("Show an example", "Quiz me", "Simpler"). Real buttons. |
| **Mastery indicator** | Concept mastery as bar + label + text value (never color-only); used in tutor/analytics. |

**Motion:** `ai.shimmer` for thinking; per-chunk fade for tokens; gentle glow on AI surfaces. All reduced under `prefers-reduced-motion`.

**A11y:** streaming announced in chunks via `aria-live="polite"`; citations are labeled links; scope chip and stop control keyboard-first; voice input has a visible transcript.

---

## 24. Charts

For Reading Analytics + mastery. Calm, legible, never decorative.

- **Types:** line/area (trends), bar (comparisons), heatmap (reading calendar/streak), radial/ring (mastery — with text value), sparkline (inline metrics), distribution.
- **Palette:** primary series = `accent`; additional series from a **color-blind-safe categorical set** (6 hues, distinguishable in grayscale); positive/negative = `success`/`danger` *with* sign/arrow. Gridlines `border.subtle`; axes/labels `text.tertiary`; `tabular-nums`.
- **Style:** minimal axes, no chartjunk, soft area gradients (low opacity), rounded bar caps `radius-xs`, generous label spacing. Tooltip on hover/focus (`e3`).
- **States:** loading (skeleton matching final shape), empty ("not enough data yet — read more"), partial ("insights catching up"), error (inline retry, show partial). Numbers count-up on enter (instant under reduced-motion).
- **A11y (mandatory):** every chart has a **text/table equivalent** toggle + screen-reader summary ("reading time up 12% vs last week"); keyboard-navigable data points with announced values; never color-only encoding; non-punitive framing (missed days neutral, not red).

---

# Feedback & System

## 25. Animations

A small, intentional catalog (compose from §9; all reduced-motion aware).

| Animation | Where | Spec |
|---|---|---|
| **Reveal** | first content load, dashboard cards | staggered fade + 8px rise, `ease-out`, 40ms stagger |
| **Pop** | menus, popovers, palette | scale `0.96→1` + fade from origin, `spring-snappy` |
| **Slide-in panel** | AI/notes/TOC | translateX/Y, `spring-smooth`, no reflow |
| **Sheet** | mobile | translateY from bottom, drag-tracked |
| **Indicator slide** | tabs/segmented | active marker springs between positions |
| **Stream** | AI text | per-chunk opacity fade |
| **Shimmer** | skeletons, AI thinking | gradient sweep 1.4s loop |
| **Count-up** | metrics | number tween 600ms `ease-out` |
| **Check/success** | confirmations | draw-on check 300ms (static under reduced-motion) |
| **Press** | tappables | scale 0.98 down/up |
| **Lift** | interactive cards | translateY(-2px) + elevation step |
| **Graph settle** | knowledge graph | layout converges then stops (no perpetual motion) |

**Rule:** no looping/decorative animation in the reading canvas, and never more than one attention-seeking animation on screen at once.

---

## 26. Loading Components

Hierarchy of loading feedback, **fastest-perceived chosen first**:

1. **Optimistic UI** (preferred) — action result shows instantly, reconciles silently (highlights, grades, progress, notes).
2. **Skeletons** (§27) — for content with known layout.
3. **Streaming** — AI text, search results, graph nodes appear progressively.
4. **Inline spinner** — sub-second indeterminate micro-actions (button loading, async validation, menu fetch). `icon-sm`, `accent`/`currentColor`, 0.8s rotation.
5. **Top progress bar** — route/page transitions (thin `accent` bar, indeterminate then completes — Vercel/YouTube style).
6. **Full-state loader** — only for genuine first-load of a heavy view; always paired with context ("Building your graph…").

**Rules:** never a bare full-screen spinner for content; show *what* is loading; lock layout to prevent shift; spinners only when nothing more informative is possible.

---

## 27. Skeletons

- **Principle:** skeletons mirror the **exact final layout** (block sizes, positions, radii) so content swaps in without shift.
- **Style:** `surface.subtle`/`neutral.3` blocks at component radii, with `t-skeleton` shimmer sweep (static block under `prefers-reduced-motion`).
- **Patterns:** text lines (varied widths, last line 60%), avatar circles, card skeletons, table rows, chart shape, reader text-block skeleton, list rows. Cap at a sensible count (e.g., 6–8 rows) — don't fake an infinite list.
- **Timing:** appear after ~120ms delay (avoid flash on instant loads); cross-fade to real content (`duration-base`).
- **A11y:** skeleton containers `aria-busy="true"` + `aria-hidden` on the placeholder shapes; a polite "loading" announcement; real content announced on arrival.

---

## 28. Toast

Transient, non-blocking confirmations and errors. Bottom-right (desktop) / top (mobile), stacked, `z-toast`.

**Anatomy:** `[ status icon ] message [ optional action ] [ × ]`, `surface.overlay`, `e5`, `radius-lg`, backdrop blur, max-width 380.

**Variants:** `success`, `error`, `warning`, `info`, `loading→resolve` (promise toast: spinner → check/error), `ai` (AI-related, `ai` accent). Status carried by icon + text + subtle left accent bar (never color-only).

**States:** enter (`t-sheet`-like slide+fade from edge, `spring-smooth`), auto-dismiss (success ~4s; error persists until dismissed or has an action; pause-on-hover/focus), stacking (max ~3 visible, older collapse into "+N"), with-action ("Undo", "Retry", "View" — `duration` extends while actionable), exit (fade+slide, `ease-in`).

**Behavior:** **destructive actions show an "Undo" toast** rather than a pre-confirm where reversible (Linear/Gmail pattern); errors prefer toast only for transient/global issues — *form/inline errors stay inline* (don't make users chase a toast).

**A11y:** `role="status"` (polite) for success/info, `role="alert"` (assertive) for errors; never the *only* place critical info appears; actions are real focusable buttons; auto-dismiss pauses on hover/focus; dismiss is keyboard-reachable; respects time-out a11y (extendable).

---

## 29. Notifications

Persistent, reviewable events (vs. transient toasts). Calm by default — *no badge-screaming inbox*.

**Anatomy:** topbar bell with subtle count (only when meaningful) → notification panel/popover (`e3`): grouped list (Today / Earlier), each row `[ icon/avatar ] title + body + timestamp [ action / unread dot ]`. Empty state: "You're all caught up."

**Types:** ingestion done ("*Atomic Habits* is ready"), reviews due (digest, not per-card), tutor/study-plan nudges, knowledge connections ("New link found across 2 sources"), system/account. **AI whispers** are surfaced here too (and optionally inline), one at a time.

**States:** unread (subtle dot, not loud), read (muted), grouped/collapsed, loading (skeleton rows), empty (positive), error (inline retry per item). Mark-all-read, per-item dismiss, settings link.

**Behavior:** **cadence is user-controlled** (Settings → Notifications: instant / daily digest / off per type); default = calm digests, no manufactured urgency; never more than a quiet dot. Respects quiet hours.

**A11y:** panel is a labeled list/feed; unread state has a text equivalent (not just a dot); each item's action labeled; count announced; keyboard-navigable; honors OS notification + reduce-motion settings.

---

# Cross-cutting

## 30. Accessibility

A floor for the whole system (each component adds specifics above).

- **Standard:** WCAG **2.2 AA** minimum; **AAA contrast** for body reading text.
- **Keyboard:** 100% operable without a pointer; the Command Palette + shortcuts are first-class a11y paths; visible high-contrast `focus.ring` on every focusable; logical tab order; focus trap + restore in overlays; `Esc` closes innermost layer.
- **Screen readers:** semantic landmarks (`banner/nav/main/complementary/contentinfo`), correct roles, descriptive accessible names; AI streaming via chunked `aria-live="polite"`; live regions for async results/counts (never per-token spam); skip-to-content link.
- **Color & contrast:** never color-only signaling (icon + text always); color-blind-safe data palettes; AA/AAA verified per token pair across both themes; `forced-colors`/high-contrast mode supported.
- **Motion:** `prefers-reduced-motion` → opacity-only/instant; no parallax/auto-playing motion; looping animation stilled.
- **Transparency:** `prefers-reduced-transparency` → solid surfaces replace blur materials.
- **Targets:** ≥ 44×44px on touch; gestures always have a button/keyboard equivalent.
- **Reading a11y:** adjustable type/measure/spacing, dyslexia font (Atkinson Hyperlegible), reading ruler, high-contrast theme, TTS with word sync.
- **Forms:** visible labels, `aria-describedby` help/errors, `aria-invalid`, required-in-text, error summaries.
- **Text:** supports 200% zoom and OS font scaling without loss of function; no text in images for meaningful content.
- **Respects OS settings:** color scheme, contrast, reduce-motion/transparency, font size.

---

## 31. Dark Theme

Dark-first refinement (Linear/Cursor). The default the product is designed *in*.

**Principles**
- **Layered surfaces, not shadows.** Hierarchy reads through progressively lighter `surface` steps (`base #0A0A0B` → `raised #17181B` → `overlay #1D1F23`) + hairline `border.subtle`; shadows are supportive, not primary.
- **Never pure black for large areas** of UI chrome (`#0A0A0B`, not `#000`) — except the optional reader **Night** theme (true black for OLED).
- **Tame contrast & glow.** Avoid pure-white text (`text.primary = #ECEEF1`); accent/AI surfaces get a restrained `glow-ai` for depth; borders carry more weight than in light mode.
- **Elevated = lighter + bordered + faint top inner-highlight** (the Apple/Linear "lit from above" cue), plus softened large shadow on dialogs/palette.

**Mappings:** all semantic tokens resolve to the **Dark** column in §5; reader Dark/Night themes are separate token sets. Images/figures get a subtle dimming option to reduce glare. Code blocks use a dark syntax theme tuned to the neutral ramp.

**Verification:** every semantic pair re-checked for AA/AAA in dark; `glow-ai` and accent never reduce text contrast below threshold.

---

## 32. Light Theme

A first-class peer (Notion/Vercel/Apple), not an afterthought.

**Principles**
- **Warm-neutral, paper-calm.** `surface.base #FCFCFD`, grouped `surface.subtle #F8F9FA`; cards are pure white (`#FFFFFF`) lifted by soft `shadow-sm` — depth via shadow, not borders alone.
- **Crisp hairlines** (`border.subtle #DFE2E6`); generous whitespace; high text contrast (`text.primary #1A1C1F`, AAA on white).
- **Restrained accent.** Iris `#5B5BD6` reads confident but not loud; AI gradient softened; selection `iris.5`.
- **Sepia reading** sits between light and dark for long sessions (separate reader theme).

**Mappings:** semantic tokens resolve to the **Light** column in §5; shadows carry hierarchy (more than in dark); backdrop-blur materials give overlays the frosted Apple/Raycast quality.

**Verification:** body text AAA; UI/large text ≥3:1; accent/semantic solids legible with `text.onAccent`; both themes share identical component structure — only the semantic layer remaps.

---

## Appendix A — Token naming convention

`category.role[.variant][.state]` — e.g., `surface.raised`, `text.secondary`, `accent.solid`, `border.subtle`, `button.primary.bg.hover`. Primitive ramps: `neutral.{1..12}`, `iris.{1..12}`, `green/amber/red/blue.{1..12}`. Scales: `space-{n}`, `radius-{size}`, `duration-{name}`, `shadow-{size}`, `z-{layer}`. Themes remap **semantic** tokens only; components never reference primitives or theme directly.

## Appendix B — Component status & governance

| Tier | Components | Governance |
|---|---|---|
| **Primitives** | tokens, type, color, motion | change = design-system review + visual regression |
| **Core** | button, input, dropdown, card, dialog, table, tabs, toast | versioned; breaking change = migration note |
| **Navigation** | sidebar, topbar, command palette | |
| **Domain** | reader, knowledge, AI, charts | owned by product squads, reviewed by DS |
| **Feedback** | loading, skeleton, notifications | |

Every component ships with: all states documented, both themes, keyboard map, a11y notes, and a visual-regression baseline. New components require a proposal showing why an existing one can't compose to the need (anti-sprawl).

## Appendix C — Design principles (enforced in review)

1. **Monochrome by default; accent with intent** (≤10% color per view).
2. **Depth communicates hierarchy** (materials/elevation), never decorates.
3. **The reading canvas is sacred** — no chrome at rest, no motion at rest.
4. **AI is one recognizable, distinct presence** (`ai.*` tokens) — summoned, never imposed.
5. **Provenance is always one interaction away** (citation → source).
6. **Never color-only; never motion-required; never keyboard-excluded.**
7. **Speed is design** — optimistic, skeleton-first, streamed; budgets in [UX-DESIGN.md](UX-DESIGN.md) App. B.
8. **Restraint over richness** — if a pixel doesn't serve reading or the task, it's removed.

---

*End of Design System v1 ("Atlas"). Token values here are the contract; the implementation lives in `packages/design-tokens` (primitive + semantic + theme) and `packages/ui` (components). Changes to primitives or the semantic layer require design-system review and visual-regression sign-off.*
