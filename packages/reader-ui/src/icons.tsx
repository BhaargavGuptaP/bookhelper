/**
 * Reader icon set. Inline SVGs that inherit `currentColor` and accept
 * `SVGProps` for sizing — same convention as the web shell's icons so the
 * reader looks native to the app.
 */

import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({
  children,
  ...props
}: IconProps & { readonly children: ReactElement | ReactElement[] }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
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

export function BackIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

export function TocIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </Icon>
  );
}

export function ZoomInIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v6M8 11h6M20 20l-3.5-3.5" />
    </Icon>
  );
}

export function ZoomOutIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M8 11h6M20 20l-3.5-3.5" />
    </Icon>
  );
}

export function FitWidthIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M7 9l-2 3 2 3M17 9l2 3-2 3" />
    </Icon>
  );
}

export function FitPageIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <path d="M9 7l3-2 3 2M9 17l3 2 3-2" />
    </Icon>
  );
}

export function ThemeIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

export function PreferencesIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="14" cy="18" r="2" />
    </Icon>
  );
}

export function FocusIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
    </Icon>
  );
}

export function CloseIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function ChevronRightIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function SearchIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}

export function BookmarkIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M6 4h12v16l-6-4-6 4z" />
    </Icon>
  );
}

export function HighlightIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 20h16M5 16l8-8 3 3-8 8H5z" />
    </Icon>
  );
}

export function AiIcon(p: IconProps): ReactElement {
  return (
    <Icon {...p}>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15z" />
    </Icon>
  );
}
