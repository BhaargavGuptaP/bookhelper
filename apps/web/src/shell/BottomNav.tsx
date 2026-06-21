"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { navDestinations } from "./navigation";

/**
 * Mobile bottom navigation — UX-SPECIFICATION §11 (mobile shell adapts the
 * rail). Shows only destinations flagged `inBottomNav`, capping at 5 so the
 * touch targets stay comfortable.
 */
function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav(): ReactElement {
  const pathname = usePathname() ?? "/";
  const items = navDestinations.filter((d) => d.inBottomNav).slice(0, 5);
  return (
    <nav className="bh-bottom-nav" aria-label="Primary (mobile)">
      {items.map((d) => {
        const current = isCurrent(d.href, pathname);
        const Icon = d.icon;
        return (
          <Link
            key={d.id}
            href={d.href}
            className="bh-bottom-nav__item"
            aria-label={d.label}
            aria-current={current ? "page" : undefined}
          >
            <Icon className="bh-bottom-nav__icon" />
            <span>{d.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
