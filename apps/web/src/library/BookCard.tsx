"use client";

import { type ReactElement } from "react";
import type { Documents } from "@bookhelper/api-contracts";
import { Badge, Checkbox } from "@bookhelper/ui";
import { api } from "~/lib/api-client";
import { coverAccent, sourceLabel } from "./format";
import { StarIcon } from "./icons";

/**
 * Visual book card — typographic when no cover is available (PDFs and TXT
 * lack an embedded image), otherwise rendered from the API's cover endpoint.
 *
 * The whole card is a single button (keyboard-accessible). The favorite glyph
 * is purely decorative; selection happens via the checkbox slot rendered by
 * the parent (we only show the checkmark when `selected`).
 */
export interface BookCardProps {
  readonly doc: Documents.Document;
  readonly onOpen: (id: string) => void;
  readonly onContextMenu?: (e: React.MouseEvent, doc: Documents.Document) => void;
  readonly selectable?: boolean;
  readonly selected?: boolean;
  readonly onSelectChange?: (id: string, next: boolean) => void;
}

export function BookCard({
  doc,
  onOpen,
  onContextMenu,
  selectable,
  selected = false,
  onSelectChange,
}: BookCardProps): ReactElement {
  const accent = coverAccent(doc.id);
  const hasCover = Boolean(doc.coverStorageKey);
  return (
    <div className="bh-book-card" style={{ position: "relative" }}>
      {selectable ? (
        <span className="bh-book-card__select">
          <Checkbox
            label={`Select ${doc.title}`}
            checked={selected}
            onChange={(v) => onSelectChange?.(doc.id, v)}
          />
        </span>
      ) : null}
      <button
        type="button"
        className="bh-book-card"
        style={{ background: "transparent", border: "none", padding: 0 }}
        onClick={() => onOpen(doc.id)}
        onContextMenu={(e) => onContextMenu?.(e, doc)}
        aria-label={`Open ${doc.title}`}
      >
        <div className="bh-book-card__cover" style={{ background: hasCover ? undefined : accent }}>
          {hasCover ? (
            <img alt="" src={api.documents.coverUrl(doc.id)} loading="lazy" />
          ) : (
            <span className="bh-book-card__cover-title">{doc.title}</span>
          )}
          <span className="bh-book-card__cover-source">
            <Badge tone="neutral">{sourceLabel(doc.sourceType)}</Badge>
          </span>
          {doc.isFavorite ? (
            <span className="bh-book-card__cover-fav" aria-hidden="true">
              <StarIcon filled />
            </span>
          ) : null}
        </div>
        <div className="bh-book-card__meta">
          <span className="bh-book-card__title">{doc.title}</span>
          <span className="bh-book-card__author">{doc.author ?? "Unknown"}</span>
          {doc.progressPercent > 0 ? (
            <div
              className="bh-book-card__progress"
              role="progressbar"
              aria-valuenow={Math.round(doc.progressPercent * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Reading progress"
            >
              <div
                className="bh-book-card__progress-bar"
                style={{ width: `${Math.round(doc.progressPercent * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      </button>
    </div>
  );
}
