import type { ReactElement } from "react";
import { themeStorageKey } from "./ThemeProvider.js";

/**
 * `ThemeScript` — pre-paint, inline, synchronous script.
 *
 * Goal: write `data-theme` on `<html>` *before* the first paint so users
 * never see a flash of the wrong theme. This must NOT depend on hydration.
 *
 * Behavior matches `resolveAppTheme`:
 *   • If localStorage has a stored preference → use it.
 *   • If it is "system" (or absent) → use prefers-color-scheme.
 *
 * Defensive: never throws (storage may be unavailable in private mode).
 *
 * Place this in <head>, before <body>. Next.js: render inside the Document
 * <head> via `<Script strategy="beforeInteractive">` or a raw <script>.
 */
export function ThemeScript({
  storageKey = themeStorageKey,
}: {
  readonly storageKey?: string;
}): ReactElement {
  // We hand-roll the source to keep it tiny and JSON-safe. The `\`-escape
  // for `</script>` would not apply here, but we still encode the key
  // safely.
  const safeKey = JSON.stringify(storageKey);
  const src = `(function(){try{var k=${safeKey};var s=localStorage.getItem(k);var allowed=["system","light","dark","high-contrast"];var p=allowed.indexOf(s)>=0?s:"system";var prefersDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var resolved=p==="system"?(prefersDark?"dark":"light"):p;document.documentElement.setAttribute("data-theme",resolved);}catch(_){document.documentElement.setAttribute("data-theme","light");}})();`;
  return (
    // The script content is generated from a controlled, fixed template.
    // No untrusted input is interpolated; safe to inline.
    <script dangerouslySetInnerHTML={{ __html: src }} />
  );
}
