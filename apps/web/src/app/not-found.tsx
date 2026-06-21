import Link from "next/link";
import type { ReactElement } from "react";

/**
 * Global 404 — calm, content-led (UX-SPEC §6). No giant "404", just an
 * honest description and a way out.
 */
export default function NotFound(): ReactElement {
  return (
    <main id="bh-main" className="bh-workspace" tabIndex={-1} role="main">
      <section
        aria-labelledby="bh-notfound-title"
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
          id="bh-notfound-title"
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: "28px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--bh-color-text-primary)",
          }}
        >
          We couldn't find that page.
        </h2>
        <p
          style={{
            margin: "var(--bh-space-3) 0 0",
            color: "var(--bh-color-text-secondary)",
            fontSize: 14,
            lineHeight: "22px",
          }}
        >
          The link may have moved, or it might not exist yet.
        </p>
        <div style={{ marginTop: "var(--bh-space-6)" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0 var(--bh-space-4)",
              height: "var(--bh-size-md)",
              borderRadius: "var(--bh-radius-md)",
              background: "var(--bh-color-accent-solid)",
              color: "#ffffff",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
