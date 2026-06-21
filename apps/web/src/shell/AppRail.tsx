"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { navDestinations, settingsDestination } from "./navigation";

/**
 * App Rail — persistent left spine (UX-SPECIFICATION §2.0).
 *
 * Sprint 1: collapsed (64px) icon-only rail. Expansion to 240px (labels)
 * lands when we wire user-preference for rail mode. The rail is hidden on
 * narrow viewports — the bottom nav takes over (see `shell.css`).
 */
function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppRail(): ReactElement {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="bh-rail" aria-label="Primary">
      <Link href="/" className="bh-rail__brand" aria-label="BookHelper home">
        B
      </Link>

      <ul className="bh-rail__nav">
        {navDestinations.map((d) => {
          const current = isCurrent(d.href, pathname);
          const Icon = d.icon;
          return (
            <li key={d.id}>
              <Link
                href={d.href}
                className="bh-rail-item"
                aria-label={d.label}
                aria-current={current ? "page" : undefined}
                title={d.label}
              >
                <Icon className="bh-rail-item__icon" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="bh-rail__spacer" />
      <div className="bh-rail__divider" role="presentation" />

      <Link
        href={settingsDestination.href}
        className="bh-rail-item"
        aria-label={settingsDestination.label}
        aria-current={isCurrent(settingsDestination.href, pathname) ? "page" : undefined}
        title={settingsDestination.label}
      >
        <settingsDestination.icon className="bh-rail-item__icon" />
      </Link>
    </nav>
  );
}
