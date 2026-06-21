import type { ReactElement, SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P & { children: React.ReactNode }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
      focusable="false"
      {...p}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const GridIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Svg>
);
export const ListIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);
export const StarIcon = ({ filled, ...p }: P & { filled?: boolean }): ReactElement => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3 2.6 5.6 6.1.7-4.5 4 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4 6.1-.7z" />
  </Svg>
);
export const PlusIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const MoreIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </Svg>
);
export const ArchiveIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M3 6h18v3H3zM4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M10 13h4" />
  </Svg>
);
export const TrashIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
  </Svg>
);
export const RestoreIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
  </Svg>
);
export const OpenIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M4 5h16v14H4zM4 8h16" />
  </Svg>
);
export const UploadIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M12 4v12M7 9l5-5 5 5M4 19h16" />
  </Svg>
);
export const SortIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />
  </Svg>
);
export const FilterIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M4 6h16l-6 8v6l-4-2v-4z" />
  </Svg>
);
export const HomeIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </Svg>
);
export const FolderIcon = (p: P): ReactElement => (
  <Svg {...p}>
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
  </Svg>
);
