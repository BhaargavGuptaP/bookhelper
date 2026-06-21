import type { ReactElement, SVGProps } from "react";

/**
 * Inline SVG icon set for the App Rail (Sprint 1 subset).
 *
 * Stroke 1.5px per DSS §2.16. `currentColor` inherits the parent's color so
 * active-state / theme color flow naturally. All icons are `aria-hidden` —
 * the consuming link/button supplies the accessible name.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({
  children,
  ...props
}: IconProps & { children: ReactElement | ReactElement[] }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </Icon>
  );
}

export function LibraryIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 5h4v15H4z" />
      <path d="M10 5h4v15h-4z" />
      <path d="m16.5 5.5 3.4.9-3.2 13.3-3.4-.9z" />
    </Icon>
  );
}

export function SearchIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function KnowledgeIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="5" cy="17" r="2.5" />
      <circle cx="19" cy="17" r="2.5" />
      <path d="M12 8.5v6M11 16l-4.3-1M13 16l4.3-1" />
    </Icon>
  );
}

export function LearningIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M3 9 12 4l9 5-9 5z" />
      <path d="M7 11v5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-5" />
    </Icon>
  );
}

export function AnalyticsIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Icon>
  );
}

export function SettingsIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Icon>
  );
}

export function SunIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
    </Icon>
  );
}

export function MoonIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Icon>
  );
}

export function ContrastIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" stroke="none" />
    </Icon>
  );
}
