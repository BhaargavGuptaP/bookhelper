/**
 * Keyboard shortcut resolution — a **pure** mapping from a keyboard event
 * to a reader intent. The provider translates the intent into a Reader
 * Command dispatch; this module knows nothing about the session, so it is
 * trivially unit-testable.
 *
 * READER-SPEC §17 keyboard map (subset implemented this sprint) + the
 * Sprint 3C.2 required set: arrows, PageUp/PageDown, Home/End,
 * Cmd/Ctrl +/-/0, Esc, F11.
 */

/** The intents the reader shell understands. */
export type ReaderIntent =
  | "next-page"
  | "previous-page"
  | "first-page"
  | "last-page"
  | "zoom-in"
  | "zoom-out"
  | "zoom-reset"
  | "toggle-toc"
  | "toggle-preferences"
  | "toggle-focus-mode"
  | "cycle-theme"
  | "dismiss";

/** Minimal shape we read off a KeyboardEvent — keeps the resolver pure. */
export interface KeyChord {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

/**
 * True if the event target is a place the user is typing — we must not
 * hijack keys there (find bars, note editors, form fields land later).
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  // `isContentEditable` isn't computed in every environment; fall back to the
  // attribute (`contenteditable` / `contenteditable=""` / `="true"`).
  const ce = target.getAttribute("contenteditable");
  if (ce === "" || ce === "true") return true;
  return false;
}

/**
 * Resolve a key chord to a reader intent, or `null` if unhandled. The
 * caller is responsible for `preventDefault()` when an intent is returned.
 */
export function resolveReaderIntent(chord: KeyChord): ReaderIntent | null {
  const mod = chord.metaKey || chord.ctrlKey;

  // ── Zoom (Cmd/Ctrl + +/-/0) ────────────────────────────────────────
  if (mod) {
    switch (chord.key) {
      case "=":
      case "+":
        return "zoom-in";
      case "-":
      case "_":
        return "zoom-out";
      case "0":
        return "zoom-reset";
      default:
        return null; // leave other Cmd/Ctrl combos to the browser
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────
  switch (chord.key) {
    case "ArrowRight":
    case "ArrowDown":
    case "PageDown":
      return "next-page";
    case "ArrowLeft":
    case "ArrowUp":
    case "PageUp":
      return "previous-page";
    case " ": // Space / Shift+Space
      return chord.shiftKey ? "previous-page" : "next-page";
    case "Home":
      return "first-page";
    case "End":
      return "last-page";
    case "Escape":
      return "dismiss";
    case "F11":
      return "toggle-focus-mode";
    // ── Single-key affordances (READER-SPEC §17) ─────────────────────
    case "o":
    case "O":
      return "toggle-toc";
    case "f":
    case "F":
      return "toggle-focus-mode";
    case "t":
    case "T":
      return "cycle-theme";
    case ",":
      return "toggle-preferences";
    default:
      return null;
  }
}
