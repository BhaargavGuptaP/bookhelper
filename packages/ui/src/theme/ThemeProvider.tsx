"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
/**
 * The *resolved* theme applied to the document. We redeclare it locally to
 * avoid an unnecessary runtime import of `@bookhelper/design-tokens`: the
 * tokens package owns the values; we only need the union literal here.
 *
 * Keep this in sync with `@bookhelper/design-tokens` `AppTheme`.
 */
export type AppTheme = "light" | "dark" | "high-contrast";

/**
 * User-selectable preference. `system` follows OS `prefers-color-scheme`.
 *
 * UX-SPECIFICATION §13 / DSS §3.15–§3.17 commit us to: light, dark,
 * high-contrast — plus the obvious "follow system" affordance.
 */
export const themePreferences = ["system", "light", "dark", "high-contrast"] as const;
export type ThemePreference = (typeof themePreferences)[number];

/** Key under which the user's preference is persisted (localStorage). */
export const themeStorageKey = "bh.theme" as const;

/**
 * Resolve the *applied* AppTheme from a preference + the OS signal.
 * - `system` → light or dark based on prefers-color-scheme.
 * - Everything else is identity.
 *
 * Note: forced-colors and high-contrast are intentionally orthogonal —
 * the user may explicitly choose "high-contrast" regardless of OS.
 */
export function resolveAppTheme(preference: ThemePreference, systemPrefersDark: boolean): AppTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

interface ThemeContextValue {
  /** What the user picked. */
  readonly preference: ThemePreference;
  /** What is actually applied to <html> right now. */
  readonly resolved: AppTheme;
  /** Setter — persists to localStorage and updates the DOM attribute. */
  setPreference(preference: ThemePreference): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  readonly children: ReactNode;
  /**
   * SSR-rendered initial preference. The pre-hydration script in
   * `ThemeScript` already writes the correct `data-theme` attribute, so the
   * tree never flashes.
   */
  readonly initialPreference?: ThemePreference;
  /** Storage key override (rare — useful in tests). */
  readonly storageKey?: string;
}

/**
 * `ThemeProvider`
 *
 * Single authority for the `data-theme` attribute on `<html>` (Atlas tokens
 * key off this attribute — see `tokens.css`). Listens to OS theme changes
 * while preference === "system", writes localStorage on change, and exposes
 * a tiny imperative API via `useTheme()`.
 *
 * SSR-safe: state initialization avoids reading `window`/`localStorage`. The
 * companion `ThemeScript` (inserted in <head>) handles pre-paint sync.
 */
export function ThemeProvider({
  children,
  initialPreference = "system",
  storageKey = themeStorageKey,
}: ThemeProviderProps): ReactElement {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  // Sync from localStorage + system on mount. Doing this in an effect (not
  // useState init) keeps SSR output deterministic — the pre-paint script
  // already prevented a flash by the time we hydrate.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored && (themePreferences as readonly string[]).includes(stored)) {
        setPreferenceState(stored as ThemePreference);
      }
    } catch {
      // Storage may be unavailable (private mode, ITP). Fall through silently.
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mq.matches);
    const onChange = (e: MediaQueryListEvent): void => {
      setSystemPrefersDark(e.matches);
    };
    // Older Safari uses `addListener`; the modern path is `addEventListener`.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } else {
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }
  }, [storageKey]);

  const resolved = useMemo(
    () => resolveAppTheme(preference, systemPrefersDark),
    [preference, systemPrefersDark],
  );

  // Apply to <html data-theme="…"> whenever the resolved theme changes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, next);
        }
      } catch {
        // Same rationale as above — never crash on storage failure.
      }
    },
    [storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Read + mutate the current theme. Must be inside a `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      "useTheme() must be used inside <ThemeProvider>. Did you forget to wrap your root?",
    );
  }
  return ctx;
}
