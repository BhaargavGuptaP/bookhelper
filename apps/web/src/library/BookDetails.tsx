"use client";

import { type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, IconButton, Skeleton, ToastRegion, useToasts } from "@bookhelper/ui";
import { EmptyState } from "~/shell/EmptyState";
import { api } from "~/lib/api-client";
import {
  useActivity,
  useDocument,
  useFavorite,
  useLifecycle,
  useDeleteDocument,
} from "~/lib/library-hooks";
import { ArchiveIcon, OpenIcon, RestoreIcon, StarIcon, TrashIcon } from "./icons";
import { coverAccent, formatBytes, formatDate, sourceLabel, timeAgo } from "./format";

import "./library.css";

/**
 * Book details page (UX-SPEC §4.4 + Sprint 2 spec).
 *
 * Renders metadata, an Open Reader button (stubbed — the Reader lands in a
 * later sprint and records a `document.opened` audit), favorite/archive/
 * delete actions, the metadata grid, an activity timeline, and a placeholder
 * box for future AI/Knowledge/Learning surfaces.
 */
export function BookDetails({ id }: { readonly id: string }): ReactElement {
  const router = useRouter();
  const doc = useDocument(id);
  const activity = useActivity(id);
  const fav = useFavorite();
  const lifecycle = useLifecycle();
  const del = useDeleteDocument();
  const { toasts, dismiss } = useToasts();

  if (doc.isLoading) {
    return (
      <div className="bh-details">
        <Skeleton height={280} radius="var(--bh-radius-lg)" />
        <div>
          <Skeleton height={36} width="60%" />
          <div style={{ height: 12 }} />
          <Skeleton height={20} width="40%" />
          <div style={{ height: 24 }} />
          <Skeleton height={120} />
        </div>
      </div>
    );
  }

  if (doc.isError || !doc.data) {
    return (
      <EmptyState
        title="Document not found"
        description="It may have been deleted, or the link is incorrect."
        action={
          <Button variant="secondary" onClick={() => router.push("/library")}>
            Back to library
          </Button>
        }
      />
    );
  }

  const d = doc.data;
  const hasCover = Boolean(d.coverStorageKey);

  return (
    <div>
      <div className="bh-details">
        <div
          className="bh-details__cover"
          style={hasCover ? undefined : { background: coverAccent(d.id) }}
        >
          {hasCover ? (
            <img alt="" src={api.documents.coverUrl(d.id)} />
          ) : (
            <span className="bh-book-card__cover-title">{d.title}</span>
          )}
        </div>

        <div>
          <h1 className="bh-details__title">{d.title}</h1>
          <p className="bh-details__author">{d.author ?? "Unknown author"}</p>

          <div className="bh-details__row">
            <Badge tone="accent">{sourceLabel(d.sourceType)}</Badge>
            {d.language ? <Badge>{d.language}</Badge> : null}
            {(d.metadata.tags ?? []).map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
            {d.ingestStatus === "failed" ? (
              <Badge tone="danger">Extraction failed</Badge>
            ) : d.ingestStatus !== "ready" ? (
              <Badge tone="warning">{d.ingestStatus}</Badge>
            ) : null}
          </div>

          <div className="bh-details__row">
            <Button
              leadingIcon={<OpenIcon />}
              onClick={() => {
                // Record the open (audit + "Continue reading"), then enter
                // the Reader. Fire-and-forget the audit so navigation is
                // instant; the Reader records its own session too.
                void api.documents.open(d.id).catch(() => {});
                router.push(`/read/${d.id}`);
              }}
            >
              Open
            </Button>

            <IconButton
              label={d.isFavorite ? "Unfavorite" : "Favorite"}
              variant="secondary"
              onClick={() => fav.mutate({ id: d.id, favorite: !d.isFavorite })}
            >
              <StarIcon filled={d.isFavorite} />
            </IconButton>

            {d.lifecycle === "active" ? (
              <IconButton
                label="Archive"
                variant="secondary"
                onClick={() => lifecycle.mutate({ id: d.id, lifecycle: "archived" })}
              >
                <ArchiveIcon />
              </IconButton>
            ) : (
              <IconButton
                label="Restore"
                variant="secondary"
                onClick={() => lifecycle.mutate({ id: d.id, lifecycle: "active" })}
              >
                <RestoreIcon />
              </IconButton>
            )}

            {d.lifecycle === "trashed" ? (
              <Button
                variant="danger"
                leadingIcon={<TrashIcon />}
                onClick={async () => {
                  if (!confirm("Permanently delete this document? This cannot be undone.")) return;
                  await del.mutateAsync(d.id);
                  router.push("/library");
                }}
              >
                Delete forever
              </Button>
            ) : (
              <IconButton
                label="Move to trash"
                variant="secondary"
                onClick={() => lifecycle.mutate({ id: d.id, lifecycle: "trashed" })}
              >
                <TrashIcon />
              </IconButton>
            )}
          </div>

          {d.metadata.description ? (
            <p
              style={{ color: "var(--bh-color-text-secondary)", fontSize: 14, lineHeight: "22px" }}
            >
              {d.metadata.description}
            </p>
          ) : null}

          <h2 style={{ fontSize: 14, marginTop: "var(--bh-space-6)", marginBottom: 0 }}>
            Metadata
          </h2>
          <div className="bh-details__meta">
            <Row k="Publisher" v={d.metadata.publisher} />
            <Row k="ISBN" v={d.metadata.isbn} />
            <Row k="Language" v={d.language} />
            <Row k="Pages" v={d.pageCount?.toString()} />
            <Row k="Words" v={d.wordCount?.toLocaleString()} />
            <Row k="File size" v={formatBytes(d.fileSizeBytes)} />
            <Row
              k="Progress"
              v={d.progressPercent > 0 ? `${Math.round(d.progressPercent * 100)}%` : "—"}
            />
            <Row k="Last opened" v={d.lastOpenedAt ? formatDate(d.lastOpenedAt) : "—"} />
            <Row k="Added" v={formatDate(d.createdAt)} />
            <Row k="Document ID" v={d.id} />
          </div>

          <h2 style={{ fontSize: 14, marginTop: "var(--bh-space-6)", marginBottom: 8 }}>
            Activity
          </h2>
          {activity.isLoading ? (
            <Skeleton height={80} />
          ) : (
            <ol className="bh-activity">
              {(activity.data?.items ?? []).map((a) => (
                <li key={a.id} className="bh-activity__item">
                  <span className="bh-activity__when">{timeAgo(a.createdAt)}</span>
                  <span className="bh-activity__what">{prettyAction(a.action)}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="bh-details__future" aria-label="Future surfaces placeholder">
            <strong>Coming soon to this page:</strong> AI Q&A on your book, Knowledge connections
            between sources, and Learning plans tuned to what you read. The plumbing is in place —
            these surfaces ship in their own sprints.
          </div>
        </div>
      </div>
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function Row({ k, v }: { readonly k: string; readonly v?: string | null }): ReactElement {
  return (
    <>
      <span className="bh-details__meta-key">{k}</span>
      <span className="bh-details__meta-val">{v && v.length > 0 ? v : "—"}</span>
    </>
  );
}

function prettyAction(a: string): string {
  return a
    .replace(/^document\./, "")
    .replace(/^collection\./, "collection: ")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}
