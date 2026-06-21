import type { ReactElement, ReactNode } from "react";
import { Topbar } from "./Topbar";

/**
 * `Surface` — the standard top-level scaffolding for a destination page.
 * Renders the Topbar + a `<main id="bh-main">` workspace so the global
 * "Skip to content" link lands inside content.
 */
export function Surface({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <>
      <Topbar title={title} />
      <main id="bh-main" className="bh-workspace" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
