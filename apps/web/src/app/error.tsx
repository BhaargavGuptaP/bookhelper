"use client";

import { useEffect, type ReactElement } from "react";
import { Button } from "@bookhelper/ui";

/**
 * Global error boundary (Next.js convention).
 *
 * UX-SPECIFICATION §6 "Errors": calm, actionable, never blames the user.
 * The full error (with `digest`) is logged server-side; the UI only shows a
 * short title + recovery action.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}): ReactElement {
  useEffect(() => {
    // Surface to the browser console for dev; in prod, Next emits the digest
    // server-side already.
    if (process.env.NODE_ENV !== "production") {
      console.error("[bh.web] route error:", error);
    }
  }, [error]);

  return (
    <section
      role="alert"
      aria-live="assertive"
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
        style={{
          margin: 0,
          fontSize: 22,
          lineHeight: "28px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--bh-color-text-primary)",
        }}
      >
        Something went wrong on our end.
      </h2>
      <p
        style={{
          margin: "var(--bh-space-3) 0 0",
          color: "var(--bh-color-text-secondary)",
          fontSize: 14,
          lineHeight: "22px",
        }}
      >
        The page didn't load correctly. You can try again, or head back home.
        {error.digest ? (
          <>
            <br />
            <span style={{ fontSize: 12, color: "var(--bh-color-text-tertiary)" }}>
              Reference: <code>{error.digest}</code>
            </span>
          </>
        ) : null}
      </p>
      <div
        style={{
          marginTop: "var(--bh-space-6)",
          display: "inline-flex",
          gap: "var(--bh-space-3)",
        }}
      >
        <Button onClick={reset}>Try again</Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Go home
        </Button>
      </div>
    </section>
  );
}
