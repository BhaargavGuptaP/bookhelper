/**
 * Atlas — the single source of truth for design tokens.
 *
 * Mirrors DESIGN-SYSTEM-SPEC.md §2 "Design Tokens" and §3 "Color System".
 * Numeric values in pixels unless otherwise stated. Color values are sRGB hex.
 *
 * Consumers should generally consume tokens via CSS variables (`./tokens.css`)
 * so that themes can switch live. This module is the TS-typed mirror used for
 * tests, codegen, and (where unavoidable) inline access from JS.
 *
 * If a token here diverges from the spec, the spec wins — open a doc change
 * in the same commit and update this file.
 */

// ──────────────────────────────────────────────────────────────────────────
// §2.1 Typography — families
// ──────────────────────────────────────────────────────────────────────────
export const fontFamilies = {
  ui: '"Geist Sans", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  readingSerif: '"Tiempos Text", "Source Serif 4", Georgia, serif',
  readingSansAlt: "Inter, system-ui, sans-serif",
  mono: '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  accessibleReading: '"Atkinson Hyperlegible", system-ui, sans-serif',
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.2 Font scale (UI; base 16px / 1rem)
// ──────────────────────────────────────────────────────────────────────────
export interface TypeStyle {
  readonly size: number; // px
  readonly lineHeight: number; // px
  readonly weight: 400 | 450 | 500 | 600;
  readonly tracking: string; // em
}

export const fontScale = {
  "display-lg": { size: 48, lineHeight: 52, weight: 600, tracking: "-0.02em" },
  "display-md": { size: 36, lineHeight: 40, weight: 600, tracking: "-0.02em" },
  "heading-xl": { size: 28, lineHeight: 34, weight: 600, tracking: "-0.015em" },
  "heading-lg": { size: 22, lineHeight: 28, weight: 600, tracking: "-0.01em" },
  "heading-md": { size: 18, lineHeight: 24, weight: 600, tracking: "-0.005em" },
  "heading-sm": { size: 15, lineHeight: 20, weight: 600, tracking: "0" },
  "body-lg": { size: 16, lineHeight: 26, weight: 400, tracking: "0" },
  "body-md": { size: 14, lineHeight: 22, weight: 400, tracking: "0" },
  "body-sm": { size: 13, lineHeight: 18, weight: 400, tracking: "0" },
  label: { size: 14, lineHeight: 16, weight: 500, tracking: "0" },
  "label-sm": { size: 12, lineHeight: 16, weight: 500, tracking: "0.01em" },
  caption: { size: 12, lineHeight: 16, weight: 400, tracking: "0.01em" },
  overline: { size: 11, lineHeight: 14, weight: 600, tracking: "0.06em" },
  code: { size: 13, lineHeight: 20, weight: 450, tracking: "0" },
} as const satisfies Record<string, TypeStyle>;

export type FontScaleToken = keyof typeof fontScale;

// ──────────────────────────────────────────────────────────────────────────
// §2.3 Spacing scale (4px base, 8px rhythm)
// ──────────────────────────────────────────────────────────────────────────
export const spacing = {
  "0": 0,
  px: 1,
  "0.5": 2,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64,
  "20": 80,
  "24": 96,
} as const;

export type SpacingToken = keyof typeof spacing;

// ──────────────────────────────────────────────────────────────────────────
// §2.4 Border radius
// ──────────────────────────────────────────────────────────────────────────
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

// ──────────────────────────────────────────────────────────────────────────
// §2.5 Border widths
// ──────────────────────────────────────────────────────────────────────────
export const borderWidth = {
  hairline: 1,
  thin: 1.5,
  medium: 2,
  thick: 3,
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.7 Shadows — two-layer, low-opacity. Light + Dark variants. Plus glow-ai.
// ──────────────────────────────────────────────────────────────────────────
export const shadows = {
  light: {
    xs: "0 1px 2px rgb(0 0 0 / 0.04)",
    sm: "0 1px 2px rgb(0 0 0 / 0.05), 0 2px 6px rgb(0 0 0 / 0.05)",
    md: "0 2px 4px rgb(0 0 0 / 0.05), 0 6px 16px rgb(0 0 0 / 0.08)",
    lg: "0 4px 8px rgb(0 0 0 / 0.06), 0 12px 32px rgb(0 0 0 / 0.10)",
    xl: "0 8px 16px rgb(0 0 0 / 0.08), 0 24px 56px rgb(0 0 0 / 0.14)",
    glowAi: "0 0 24px rgb(110 86 207 / 0.25)",
  },
  dark: {
    xs: "0 1px 2px rgb(0 0 0 / 0.3)",
    sm: "0 2px 6px rgb(0 0 0 / 0.4)",
    md: "0 6px 16px rgb(0 0 0 / 0.5)",
    lg: "0 12px 32px rgb(0 0 0 / 0.55)",
    xl: "0 24px 56px rgb(0 0 0 / 0.6)",
    glowAi: "0 0 32px rgb(110 86 207 / 0.35)",
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.8 Blur — overlay materials
// ──────────────────────────────────────────────────────────────────────────
export const blur = {
  sm: 8,
  md: 20,
  lg: 40,
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.9 Opacity scale
// ──────────────────────────────────────────────────────────────────────────
export const opacity = {
  "0": 0,
  subtle: 0.04,
  muted: 0.08,
  disabled: 0.4,
  secondary: 0.6,
  scrimLight: 0.4,
  scrimDark: 0.6,
  full: 1,
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.10 Animation timing
// ──────────────────────────────────────────────────────────────────────────
export const duration = {
  instant: 0,
  fast: 120,
  base: 180,
  moderate: 240,
  slow: 320,
  slower: 480,
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.11 Easing curves
// ──────────────────────────────────────────────────────────────────────────
export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1.2)",
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.12 Z-index strategy (no ad-hoc values; always a token)
// ──────────────────────────────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  sticky: 100,
  rail: 200,
  dropdown: 1000,
  overlay: 2000,
  dialog: 2100,
  palette: 3000,
  toast: 4000,
  tooltip: 5000,
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.13 Breakpoints (intent boundaries, px)
// ──────────────────────────────────────────────────────────────────────────
export const breakpoints = {
  xs: 480, // max-width
  sm: 640, // max
  md: 1024, // max
  lg: 1440, // max
  xl: 1920, // max
  "2xl": 1921, // min
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.14 Grid + shell sizing
// ──────────────────────────────────────────────────────────────────────────
export const layout = {
  container: { content: 1200, wide: 1440 },
  readingColumn: { maxCh: 68, maxPx: 720 },
  shell: {
    railCollapsed: 64,
    railExpanded: 240,
    sidePanelMin: 360,
    sidePanelMax: 420,
    topbar: 52,
  },
  grid: { columns: 12, gutterDesktop: 24, gutterMobile: 16 },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.15 Control sizing (heights)
// ──────────────────────────────────────────────────────────────────────────
export const controlSize = {
  xs: 24,
  sm: 28,
  md: 32,
  lg: 36,
  xl: 44, // default touch target — also enforced minimum
} as const;

export const minTouchTarget = 44 as const;

// ──────────────────────────────────────────────────────────────────────────
// §2.16 Icon sizes
// ──────────────────────────────────────────────────────────────────────────
export const iconSize = { xs: 14, sm: 16, md: 20, lg: 24, xl: 32 } as const;

// ──────────────────────────────────────────────────────────────────────────
// §3.1 Neutral — Slate (12-step ramp, light + dark)
// ──────────────────────────────────────────────────────────────────────────
export const slate = {
  light: {
    "1": "#FCFCFD",
    "2": "#F8F9FA",
    "3": "#F1F3F5",
    "4": "#ECEEF0",
    "5": "#E6E8EB",
    "6": "#DFE2E6",
    "7": "#D3D7DD",
    "8": "#BCC2CB",
    "9": "#8B919D",
    "10": "#6E747F",
    "11": "#545A63",
    "12": "#1A1C1F",
  },
  dark: {
    "1": "#0A0A0B",
    "2": "#111214",
    "3": "#17181B",
    "4": "#1D1F23",
    "5": "#24262B",
    "6": "#2C2F35",
    "7": "#373B42",
    "8": "#474C55",
    "9": "#5C626C",
    "10": "#7C828D",
    "11": "#A8AEB8",
    "12": "#ECEEF1",
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §3.2 Primary / Accent — Iris (key steps; §3.2)
// ──────────────────────────────────────────────────────────────────────────
export const iris = {
  light: {
    "3": "#F2F1FE",
    "5": "#E0DDFB",
    "7": "#BCB4F2",
    "9": "#5B5BD6",
    "10": "#5151CD",
    "11": "#5753C6",
  },
  dark: {
    "3": "#1E1B33",
    "5": "#2C285A",
    "7": "#473E9E",
    "9": "#6E56CF",
    "10": "#7C66DC",
    "11": "#B8A9F5",
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §3.4–§3.7 Semantic ramps (light/dark; solid/tint/text only — additional
// steps are derived in CSS where needed)
// ──────────────────────────────────────────────────────────────────────────
export const semanticRamps = {
  success: {
    light: { tint: "#E9F7EF", solid: "#30A46C", text: "#218358" },
    dark: { tint: "#10231A", solid: "#33B074", text: "#62C893" },
  },
  warning: {
    light: { tint: "#FFF6E5", solid: "#FFB224", text: "#946800" },
    dark: { tint: "#2E2008", solid: "#FFB224", text: "#F5C24E" },
  },
  danger: {
    light: { tint: "#FDEBEC", solid: "#E5484D", text: "#CE2C31" },
    dark: { tint: "#2A1416", solid: "#E5484D", text: "#FF9592" },
  },
  info: {
    light: { tint: "#EBF0FF", solid: "#3E63DD", text: "#3A5BC7" },
    dark: { tint: "#101A36", solid: "#3E63DD", text: "#8DA4EF" },
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// §3.9 Reader theme (independent of app chrome)
// ──────────────────────────────────────────────────────────────────────────
export const readerThemes = {
  light: { surface: "#FCFCFD", text: "#1A1C1F" },
  sepia: { surface: "#F4ECD8", text: "#433422" },
  dark: { surface: "#16171A", text: "#D7DBE0" },
  night: { surface: "#000000", text: "#B8BCC2" },
} as const;

export type ReaderTheme = keyof typeof readerThemes;

// ──────────────────────────────────────────────────────────────────────────
// §3.11 Highlight colors (5; user-relabelable, never color-only)
// ──────────────────────────────────────────────────────────────────────────
export const highlightSlots = ["yellow", "green", "blue", "pink", "purple"] as const;
export type HighlightSlot = (typeof highlightSlots)[number];

// ──────────────────────────────────────────────────────────────────────────
// §3.14 AI signature colors
// ──────────────────────────────────────────────────────────────────────────
export const aiColors = {
  solid: "#6E56CF",
  gradient: "linear-gradient(135deg, #6E56CF 0%, #3E63DD 100%)",
  tint: { light: "#F4F2FE", dark: "#1C1A33" },
  border: { light: "#D8D2F7", dark: "#3A3270" },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// App-level theme identifiers (UX §3 / DSS §3.15–§3.17). Note: this is the
// *app chrome* theme. The Reader theme is independent (`ReaderTheme`).
// ──────────────────────────────────────────────────────────────────────────
export const appThemes = ["light", "dark", "high-contrast"] as const;
export type AppTheme = (typeof appThemes)[number];
