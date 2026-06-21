import { useId, type ReactElement, type ReactNode } from "react";

/**
 * `EmptyState` — the calm "nothing here yet" affordance from UX-SPEC §6.
 *
 * Used:
 *   • For unbuilt sections (Sprint 1 placeholders).
 *   • For genuinely empty user data (e.g. fresh library).
 *
 * The component prescribes structure: title, optional description, optional
 * action. Avoids illustration noise — content-led product (DSS §2.17).
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}): ReactElement {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      style={{
        margin: "var(--bh-space-12) auto 0",
        maxWidth: "var(--bh-reading-column)",
        padding: "var(--bh-space-8)",
        textAlign: "center",
        background: "var(--bh-color-surface-raised)",
        border: "var(--bh-border-hairline) solid var(--bh-color-border-subtle)",
        borderRadius: "var(--bh-radius-xl)",
        boxShadow: "var(--bh-shadow-sm)",
      }}
    >
      <h2
        id={titleId}
        style={{
          margin: 0,
          fontSize: 22,
          lineHeight: "28px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--bh-color-text-primary)",
        }}
      >
        {title}
      </h2>
      {description ? (
        <p
          style={{
            margin: "var(--bh-space-3) 0 0",
            color: "var(--bh-color-text-secondary)",
            fontSize: 14,
            lineHeight: "22px",
          }}
        >
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: "var(--bh-space-6)" }}>{action}</div> : null}
    </section>
  );
}
