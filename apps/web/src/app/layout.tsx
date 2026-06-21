import type { Metadata, Viewport } from "next";
import { ThemeProvider, ThemeScript } from "@bookhelper/ui";
import { publicEnv } from "~/env";
import type { ReactNode } from "react";
import { QueryProvider } from "~/lib/query-client";
import "./globals.css";
import "./shell.css";

export const metadata: Metadata = {
  title: {
    default: publicEnv.NEXT_PUBLIC_APP_NAME,
    template: `%s · ${publicEnv.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "An AI-first reading & knowledge platform — understand, remember, connect, and apply what you read.",
  applicationName: publicEnv.NEXT_PUBLIC_APP_NAME,
  robots: { index: false, follow: false }, // Sprint 1: pre-launch.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Match the painted background so iOS Safari's status bar blends correctly.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFCFD" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0B" },
  ],
};

/**
 * Root layout — the only place where <html>/<body> are rendered.
 *
 * Key responsibilities:
 *   1. Run `ThemeScript` *before* hydration so the correct theme is painted.
 *   2. Wrap the app in `ThemeProvider` (single authority for `data-theme`).
 *   3. Provide the "skip to content" link (WCAG 2.4.1).
 */
export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <a href="#bh-main" className="bh-skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
