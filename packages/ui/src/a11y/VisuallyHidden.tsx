import type { ReactElement, ReactNode } from "react";

/**
 * `VisuallyHidden` — hide content visually while keeping it in the
 * accessibility tree. Used for screen-reader-only labels and "skip to
 * content" links before they're focused.
 *
 * Implementation: the inline CSS is the standard 1px-trick accepted by all
 * AT (WebAIM). We avoid `display:none` (would remove from a11y tree) and
 * `visibility:hidden` (same).
 */
export function VisuallyHidden({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <span
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {children}
    </span>
  );
}
