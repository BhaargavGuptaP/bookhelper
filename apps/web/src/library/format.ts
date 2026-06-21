import type { Documents } from "@bookhelper/api-contracts";

/** Human-readable file size. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"] as const;
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

const sourceLabels: Record<Documents.SourceType, string> = {
  pdf: "PDF",
  epub: "EPUB",
  text: "Text",
  markdown: "Markdown",
};
export function sourceLabel(s: Documents.SourceType): string {
  return sourceLabels[s];
}

/** Compact relative-time string ("3h", "2d", "Apr 4"). */
export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const delta = (Date.now() - t) / 1000;
  if (delta < 60) return "just now";
  if (delta < 3600) return `${Math.floor(delta / 60)}m`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h`;
  if (delta < 7 * 86400) return `${Math.floor(delta / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso);
  if (!Number.isFinite(t.getTime())) return "—";
  return t.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Pick a stable, deterministic accent for a typographic cover. */
export function coverAccent(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 30%, 92%)`;
}
