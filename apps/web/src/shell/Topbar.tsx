"use client";

import type { ReactElement } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";

/**
 * Topbar — surface title + global actions (UX-SPECIFICATION §2.0 + §5).
 *
 * Sprint 1: a thin chrome with the current section title and the theme
 * switcher. The Command Palette (`⌘K`) and Ask bar arrive in their own
 * sprints; their slots are reserved here.
 */
export function Topbar({ title }: { readonly title: string }): ReactElement {
  return (
    <header className="bh-topbar" role="banner">
      <h1 className="bh-topbar__title">{title}</h1>
      <div className="bh-topbar__actions">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
