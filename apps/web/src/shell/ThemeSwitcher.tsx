"use client";

import { useId, type ReactElement } from "react";
import { themePreferences, useTheme, type ThemePreference } from "@bookhelper/ui";

const LABELS: Record<ThemePreference, string> = {
  system: "Follow system",
  light: "Light",
  dark: "Dark",
  "high-contrast": "High contrast",
};

/**
 * Theme switcher — Sprint 1 affordance for cycling app theme. A native
 * <select> is intentional: keyboard-operable, screen-reader-friendly, and
 * indistinguishable from any other form control. Settings-deep configuration
 * will land alongside the Settings page (later sprint).
 */
export function ThemeSwitcher(): ReactElement {
  const { preference, setPreference } = useTheme();
  const id = useId();
  return (
    <label htmlFor={id} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          color: "var(--bh-color-text-secondary)",
        }}
      >
        Theme
      </span>
      <select
        id={id}
        value={preference}
        onChange={(e) => setPreference(e.target.value as ThemePreference)}
        style={{
          height: "var(--bh-size-md)",
          padding: "0 var(--bh-space-3)",
          borderRadius: "var(--bh-radius-md)",
          border: "var(--bh-border-hairline) solid var(--bh-color-border-default)",
          background: "var(--bh-color-surface-raised)",
          color: "var(--bh-color-text-primary)",
        }}
      >
        {themePreferences.map((p) => (
          <option key={p} value={p}>
            {LABELS[p]}
          </option>
        ))}
      </select>
    </label>
  );
}
