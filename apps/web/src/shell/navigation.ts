/**
 * Canonical top-level destinations (UX-SPECIFICATION §2.0).
 *
 * Single source of truth for the App Rail AND the mobile bottom nav. Routes
 * map 1:1 onto `src/app/(shell)/<dest>/page.tsx`.
 *
 * Sprint 1 ships the structure + Home; the other destinations land in their
 * own sprints. Each unbuilt page renders a calm "coming soon" placeholder
 * (see UX §6 "Empty states") so the IA is browsable from day one.
 */
import type { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  LibraryIcon,
  SearchIcon,
  KnowledgeIcon,
  LearningIcon,
  AnalyticsIcon,
  SettingsIcon,
} from "./icons";

export type NavId =
  | "home"
  | "library"
  | "search"
  | "knowledge"
  | "learning"
  | "analytics"
  | "settings";

export interface NavDestination {
  readonly id: NavId;
  readonly label: string;
  readonly href: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Surface in mobile bottom-nav (limited to 5 — Reader/Settings excluded). */
  readonly inBottomNav: boolean;
}

export const navDestinations: readonly NavDestination[] = [
  { id: "home", label: "Home", href: "/", icon: HomeIcon, inBottomNav: true },
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: LibraryIcon,
    inBottomNav: true,
  },
  {
    id: "search",
    label: "Search",
    href: "/search",
    icon: SearchIcon,
    inBottomNav: true,
  },
  {
    id: "knowledge",
    label: "Knowledge",
    href: "/knowledge",
    icon: KnowledgeIcon,
    inBottomNav: false,
  },
  {
    id: "learning",
    label: "Learning",
    href: "/learning",
    icon: LearningIcon,
    inBottomNav: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: AnalyticsIcon,
    inBottomNav: false,
  },
];

/** Settings is rail-anchored at the bottom; not a primary destination. */
export const settingsDestination: NavDestination = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: SettingsIcon,
  inBottomNav: false,
};
