import type { ReactElement } from "react";

/**
 * Route-level loading skeleton. UX-SPEC §6 "Loading": calm progressive
 * disclosure, never a spinner blocking the whole viewport.
 *
 * We render a low-noise placeholder; the topbar/rail remain visible because
 * they live in `layout.tsx`. `aria-busy` is set on the workspace so AT users
 * know the region is loading.
 */
export default function Loading(): ReactElement {
  return (
    <main id="bh-main" className="bh-workspace" aria-busy="true" aria-live="polite" tabIndex={-1}>
      <div
        style={{
          margin: "0 auto",
          maxWidth: "var(--bh-reading-column)",
          padding: "var(--bh-space-8) 0",
          display: "flex",
          flexDirection: "column",
          gap: "var(--bh-space-3)",
        }}
      >
        <Skeleton width="40%" height={28} />
        <Skeleton width="80%" height={18} />
        <Skeleton width="70%" height={18} />
        <Skeleton width="60%" height={18} />
      </div>
    </main>
  );
}

function Skeleton({
  width,
  height,
}: {
  readonly width: string;
  readonly height: number;
}): ReactElement {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width,
        height,
        borderRadius: "var(--bh-radius-sm)",
        background: "var(--bh-color-surface-inset)",
      }}
    />
  );
}
