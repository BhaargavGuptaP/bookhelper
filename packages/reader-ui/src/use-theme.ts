/**
 * Reader theme + motion resolution.
 *
 * The reader surface theme is **independent of the app chrome theme**
 * (DESIGN-SYSTEM §3.9). It is applied as `data-reader-theme` on the reader
 * root, scoping a separate set of CSS variables. `system` resolves against
 * `prefers-color-scheme`; reduced motion is the OR of the user preference
 * and the OS setting.
 */

import { useEffect, useState } from "react";
import type { ReadingTheme } from "@bookhelper/reader-core";

/** Concrete reader theme actually rendered (never `system`). */
export type ResolvedReaderTheme = "light" | "sepia" | "dark" | "high-contrast";

function matches(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(query).matches;
}

function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState<boolean>(() => matches(query));
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const onChange = (): void => setValue(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return value;
}

/** Resolve a reading-theme preference to a concrete reader theme. */
export function useResolvedReaderTheme(preference: ReadingTheme): ResolvedReaderTheme {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

/** Effective reduced-motion = user preference OR OS setting. */
export function useEffectiveReducedMotion(userPreference: boolean): boolean {
  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return userPreference || systemReduced;
}
