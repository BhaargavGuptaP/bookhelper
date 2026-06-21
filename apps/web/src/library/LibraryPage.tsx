"use client";

import { useCallback, useState, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Documents } from "@bookhelper/api-contracts";
import {
  Badge,
  Button,
  Checkbox,
  IconButton,
  Input,
  Menu,
  SegmentedControl,
  Skeleton,
  ToastRegion,
  useToasts,
  type ToastDescriptor,
} from "@bookhelper/ui";
import { EmptyState } from "~/shell/EmptyState";
import {
  useCollections,
  useDocuments,
  useFacets,
  useFavorite,
  useLifecycle,
  useDeleteDocument,
} from "~/lib/library-hooks";
import { BookCard } from "./BookCard";
import { UploadDialog } from "./UploadDialog";
import { formatBytes, sourceLabel, timeAgo } from "./format";
import {
  ArchiveIcon,
  FilterIcon,
  FolderIcon,
  GridIcon,
  HomeIcon,
  ListIcon,
  RestoreIcon,
  SearchIcon,
  SortIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
} from "./icons";

import "./library.css";

/**
 * Library page (UX-SPEC §4 Library).
 *
 * Single-source state lives in the URL (search params) so deep-linking works
 * — refreshing keeps the user where they were. The page composes:
 *   • Sidebar — All / Favorites / Recently opened / Archive / Trash + Collections.
 *   • Toolbar — search, source-type filters, sort, view (grid/list), Upload.
 *   • Sections for the All view — Continue reading, Recently opened, Recently added.
 *   • A grid or list of the result set.
 *   • Bulk selection bar (visible only with a selection).
 *   • A context menu on each card (favorite / archive / trash / restore / delete).
 *   • Upload dialog (drag & drop, progress).
 */

type View = "grid" | "list";
type Section = "all" | "favorites" | "continue" | "archive" | "trash" | { collection: string };

interface Filters {
  readonly q: string;
  readonly section: Section;
  readonly sources: readonly Documents.SourceType[];
  readonly sortBy: Documents.SortField;
  readonly sortOrder: Documents.SortOrder;
  readonly view: View;
}

export function LibraryPage(): ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const filters = parseFilters(params);
  const setFilters = useCallback(
    (next: Partial<Filters>) => {
      const merged = { ...filters, ...next };
      router.replace(`/library?${stringifyFilters(merged)}`, { scroll: false });
    },
    [filters, router],
  );

  const facets = useFacets();
  const collections = useCollections();

  const listQuery = buildListQuery(filters);
  const docs = useDocuments(listQuery);
  const recent = useDocuments({
    sortBy: "createdAt",
    sortOrder: "desc",
    lifecycle: "active",
    limit: 8,
  });
  const continueReading = useDocuments({
    hasProgress: true,
    sortBy: "lastOpenedAt",
    sortOrder: "desc",
    lifecycle: "active",
    limit: 8,
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const { toasts, push, dismiss } = useToasts();

  const fav = useFavorite();
  const lifecycle = useLifecycle();
  const del = useDeleteDocument();

  const onToast = useCallback((t: Omit<ToastDescriptor, "id">) => push(t), [push]);

  const items = docs.data?.items ?? [];
  const total = docs.data?.total ?? 0;

  const onCardOpen = (id: string): void => router.push(`/library/${id}`);

  const onSelectChange = useCallback((id: string, next: boolean) => {
    setSelection((cur) => {
      const nextSet = new Set(cur);
      if (next) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });
  }, []);

  const clearSelection = (): void => setSelection(new Set());

  const bulkLifecycle = async (target: Documents.Lifecycle): Promise<void> => {
    await Promise.all([...selection].map((id) => lifecycle.mutateAsync({ id, lifecycle: target })));
    push({
      title: `Moved ${selection.size} ${selection.size === 1 ? "item" : "items"} to ${target}`,
      tone: "success",
    });
    clearSelection();
  };
  const bulkFavorite = async (favorite: boolean): Promise<void> => {
    await Promise.all([...selection].map((id) => fav.mutateAsync({ id, favorite })));
    clearSelection();
  };
  const bulkDelete = async (): Promise<void> => {
    if (!confirm(`Permanently delete ${selection.size} document(s)? This cannot be undone.`))
      return;
    await Promise.all([...selection].map((id) => del.mutateAsync(id)));
    push({
      title: "Deleted",
      description: `${selection.size} document(s) removed.`,
      tone: "danger",
    });
    clearSelection();
  };

  // ── Sidebar ──────────────────────────────────────────────────────────
  const sidebar = (
    <aside className="bh-lib__sidebar" aria-label="Library navigation">
      <div role="group" aria-labelledby="bh-lib-views">
        <div id="bh-lib-views" className="bh-lib__section-label">
          Library
        </div>
        <NavItem
          icon={<HomeIcon />}
          label="All"
          count={facets.data?.active}
          current={isSection(filters.section, "all")}
          onClick={() => setFilters({ section: "all" })}
        />
        <NavItem
          icon={<StarIcon />}
          label="Favorites"
          count={facets.data?.favorites}
          current={isSection(filters.section, "favorites")}
          onClick={() => setFilters({ section: "favorites" })}
        />
        <NavItem
          icon={<OpenLeafIcon />}
          label="Continue reading"
          current={isSection(filters.section, "continue")}
          onClick={() => setFilters({ section: "continue" })}
        />
        <NavItem
          icon={<ArchiveIcon />}
          label="Archive"
          count={facets.data?.archived}
          current={isSection(filters.section, "archive")}
          onClick={() => setFilters({ section: "archive" })}
        />
        <NavItem
          icon={<TrashIcon />}
          label="Trash"
          count={facets.data?.trashed}
          current={isSection(filters.section, "trash")}
          onClick={() => setFilters({ section: "trash" })}
        />
      </div>

      <div role="group" aria-labelledby="bh-lib-collections" style={{ marginTop: 8 }}>
        <div id="bh-lib-collections" className="bh-lib__section-label">
          Collections
        </div>
        {collections.data?.length === 0 ? (
          <div
            style={{ padding: "8px 12px", fontSize: 12, color: "var(--bh-color-text-tertiary)" }}
          >
            No collections yet.
          </div>
        ) : (
          collections.data?.map((c) => (
            <NavItem
              key={c.id}
              icon={<FolderIcon />}
              label={c.name}
              count={c.documentCount}
              current={typeof filters.section === "object" && filters.section.collection === c.id}
              onClick={() => setFilters({ section: { collection: c.id } })}
            />
          ))
        )}
      </div>
    </aside>
  );

  // ── Toolbar ──────────────────────────────────────────────────────────
  const sourceMenuItems = (["pdf", "epub", "text", "markdown"] as const).map((s) => ({
    id: s,
    label: (
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox
          checked={filters.sources.includes(s)}
          label={sourceLabel(s)}
          onChange={(on) =>
            setFilters({
              sources: on ? [...filters.sources, s] : filters.sources.filter((x) => x !== s),
            })
          }
        />
      </span>
    ),
    onSelect: () => {
      /* selection handled by the embedded checkbox */
    },
  }));

  const sortMenuItems: Array<{
    id: string;
    label: string;
    field: Documents.SortField;
    order: Documents.SortOrder;
  }> = [
    { id: "added-desc", label: "Recently added", field: "createdAt", order: "desc" },
    { id: "opened-desc", label: "Recently opened", field: "lastOpenedAt", order: "desc" },
    { id: "title-asc", label: "Title (A–Z)", field: "title", order: "asc" },
    { id: "author-asc", label: "Author (A–Z)", field: "author", order: "asc" },
    { id: "progress-desc", label: "Reading progress", field: "progressPercent", order: "desc" },
    { id: "size-desc", label: "File size", field: "fileSizeBytes", order: "desc" },
  ];

  const toolbar = (
    <div className="bh-lib__toolbar" role="toolbar" aria-label="Library tools">
      <div className="bh-lib__search">
        <Input
          placeholder="Search by title, author, tag, description…"
          aria-label="Search library"
          leading={<SearchIcon />}
          value={filters.q}
          onChange={(e) => setFilters({ q: e.currentTarget.value })}
        />
      </div>

      <Menu
        trigger={({ ref, onClick }) => (
          <Button
            ref={ref}
            variant="secondary"
            size="sm"
            leadingIcon={<FilterIcon />}
            onClick={onClick}
          >
            Source
            {filters.sources.length > 0 ? ` · ${filters.sources.length}` : ""}
          </Button>
        )}
        items={sourceMenuItems}
      />

      <Menu
        trigger={({ ref, onClick }) => (
          <Button
            ref={ref}
            variant="secondary"
            size="sm"
            leadingIcon={<SortIcon />}
            onClick={onClick}
          >
            Sort
          </Button>
        )}
        items={sortMenuItems.map((s) => ({
          id: s.id,
          label: s.label,
          onSelect: () => setFilters({ sortBy: s.field, sortOrder: s.order }),
        }))}
      />

      <SegmentedControl<View>
        ariaLabel="Layout"
        value={filters.view}
        onChange={(v) => setFilters({ view: v })}
        options={[
          { value: "grid", label: <GridIcon />, ariaLabel: "Grid layout" },
          { value: "list", label: <ListIcon />, ariaLabel: "List layout" },
        ]}
      />

      <span style={{ flex: 1 }} />

      <Button leadingIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
        Upload
      </Button>
    </div>
  );

  // ── Empty / loading / error states ───────────────────────────────────
  const lifecycleLabel: Record<Documents.Lifecycle, string> = {
    active: "All documents",
    archived: "Archive",
    trashed: "Trash",
  };
  const queryLabel = (() => {
    const s = filters.section;
    if (typeof s === "object") {
      return collections.data?.find((c) => c.id === s.collection)?.name ?? "Collection";
    }
    if (s === "favorites") return "Favorites";
    if (s === "continue") return "Continue reading";
    return lifecycleLabel[listQuery.lifecycle ?? "active"];
  })();

  const list = (
    <section aria-busy={docs.isFetching || undefined}>
      <header className="bh-lib__section-header">
        <h2 className="bh-lib__section-title">
          {queryLabel}
          <span
            style={{
              marginLeft: 8,
              color: "var(--bh-color-text-tertiary)",
              fontWeight: 400,
            }}
          >
            {docs.isLoading ? "" : `· ${total}`}
          </span>
        </h2>
      </header>

      {docs.isError ? (
        <div className="bh-lib__error" role="alert">
          <strong>We couldn't load your library.</strong>{" "}
          <Button variant="ghost" size="sm" onClick={() => docs.refetch()}>
            Try again
          </Button>
        </div>
      ) : docs.isLoading ? (
        filters.view === "grid" ? (
          <div className="bh-lib__grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={260} />
            ))}
          </div>
        ) : (
          <Skeleton height={280} />
        )
      ) : items.length === 0 ? (
        <EmptyState
          title={emptyTitle(filters)}
          description={emptyDescription(filters)}
          action={
            filters.section === "all" ? (
              <Button leadingIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
                Upload your first book
              </Button>
            ) : null
          }
        />
      ) : filters.view === "grid" ? (
        <div className="bh-lib__grid">
          {items.map((d) => (
            <BookCard
              key={d.id}
              doc={d}
              onOpen={onCardOpen}
              selectable
              selected={selection.has(d.id)}
              onSelectChange={onSelectChange}
              onContextMenu={(e, doc) => {
                e.preventDefault();
                onSelectChange(doc.id, true);
              }}
            />
          ))}
        </div>
      ) : (
        <DocumentTable
          rows={items}
          selection={selection}
          onSelectChange={onSelectChange}
          onOpen={onCardOpen}
          onFavorite={(id, v) => fav.mutate({ id, favorite: v })}
        />
      )}
    </section>
  );

  // ── "All" sections (Continue reading, Recently added) ────────────────
  const allViewSections = filters.section === "all" && filters.q.trim() === "" && (
    <>
      {(continueReading.data?.items ?? []).length > 0 ? (
        <section className="bh-lib__section" aria-label="Continue reading">
          <header className="bh-lib__section-header">
            <h2 className="bh-lib__section-title">Continue reading</h2>
          </header>
          <div className="bh-lib__row">
            {continueReading.data!.items.map((d) => (
              <BookCard key={d.id} doc={d} onOpen={onCardOpen} />
            ))}
          </div>
        </section>
      ) : null}
      {(recent.data?.items ?? []).length > 0 ? (
        <section className="bh-lib__section" aria-label="Recently added">
          <header className="bh-lib__section-header">
            <h2 className="bh-lib__section-title">Recently added</h2>
          </header>
          <div className="bh-lib__row">
            {recent.data!.items.map((d) => (
              <BookCard key={d.id} doc={d} onOpen={onCardOpen} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );

  // ── Bulk action bar ──────────────────────────────────────────────────
  const selSize = selection.size;
  const inTrash = listQuery.lifecycle === "trashed";
  const inArchive = listQuery.lifecycle === "archived";
  const bulkBar = selSize > 0 && (
    <div className="bh-lib__bulk" role="region" aria-label="Bulk actions">
      <span className="bh-lib__bulk-count">{selSize} selected</span>
      <Button variant="ghost" size="sm" onClick={clearSelection}>
        Clear
      </Button>
      <span className="bh-lib__bulk-spacer" />
      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<StarIcon />}
        onClick={() => bulkFavorite(true)}
      >
        Favorite
      </Button>
      {inTrash ? (
        <>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<RestoreIcon />}
            onClick={() => bulkLifecycle("active")}
          >
            Restore
          </Button>
          <Button variant="danger" size="sm" leadingIcon={<TrashIcon />} onClick={bulkDelete}>
            Delete forever
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<ArchiveIcon />}
            onClick={() => bulkLifecycle(inArchive ? "active" : "archived")}
          >
            {inArchive ? "Unarchive" : "Archive"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<TrashIcon />}
            onClick={() => bulkLifecycle("trashed")}
          >
            Trash
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="bh-lib">
      {sidebar}
      <div>
        {toolbar}
        {allViewSections}
        {list}
        {bulkBar}
      </div>
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onComplete={onToast} />
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────

function NavItem({
  icon,
  label,
  count,
  current,
  onClick,
}: {
  readonly icon: ReactElement;
  readonly label: string;
  readonly count?: number;
  readonly current: boolean;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className={`bh-lib__nav-item${current ? " bh-lib__nav-item--current" : ""}`}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", width: 16, height: 16 }}>
        {icon}
      </span>
      <span>{label}</span>
      {count !== undefined ? <span className="bh-lib__nav-item__count">{count}</span> : null}
    </button>
  );
}

function OpenLeafIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path d="M3 5h7v14H3zM11 5h10v14H11z" />
      <path d="M14 9h4M14 12h4" />
    </svg>
  );
}

function DocumentTable({
  rows,
  selection,
  onSelectChange,
  onOpen,
  onFavorite,
}: {
  readonly rows: readonly Documents.Document[];
  readonly selection: ReadonlySet<string>;
  readonly onSelectChange: (id: string, next: boolean) => void;
  readonly onOpen: (id: string) => void;
  readonly onFavorite: (id: string, next: boolean) => void;
}): ReactElement {
  const allSelected = rows.length > 0 && rows.every((r) => selection.has(r.id));
  const someSelected = rows.some((r) => selection.has(r.id));
  return (
    <div className="bh-lib__list" role="table" aria-label="Documents">
      <div className="bh-lib__list-row bh-lib__list-row--head" role="row">
        <Checkbox
          label="Select all"
          checked={allSelected}
          indeterminate={!allSelected && someSelected}
          onChange={(v) => {
            for (const r of rows) onSelectChange(r.id, v);
          }}
        />
        <span role="columnheader">Title</span>
        <span role="columnheader">Type</span>
        <span role="columnheader">Size</span>
        <span role="columnheader">Added</span>
        <span role="columnheader" aria-label="Actions" />
      </div>
      {rows.map((d) => (
        <div key={d.id} className="bh-lib__list-row" role="row">
          <Checkbox
            label={`Select ${d.title}`}
            checked={selection.has(d.id)}
            onChange={(v) => onSelectChange(d.id, v)}
          />
          <button
            type="button"
            onClick={() => onOpen(d.id)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              textAlign: "left",
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              minWidth: 0,
              overflow: "hidden",
            }}
            aria-label={`Open ${d.title}`}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {d.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--bh-color-text-secondary)" }}>
              {d.author ?? "Unknown"}
            </div>
          </button>
          <Badge>{sourceLabel(d.sourceType)}</Badge>
          <span style={{ fontSize: 12, color: "var(--bh-color-text-secondary)" }}>
            {formatBytes(d.fileSizeBytes)}
          </span>
          <span style={{ fontSize: 12, color: "var(--bh-color-text-secondary)" }}>
            {timeAgo(d.createdAt)}
          </span>
          <IconButton
            label={d.isFavorite ? "Unfavorite" : "Favorite"}
            onClick={() => onFavorite(d.id, !d.isFavorite)}
          >
            <StarIcon filled={d.isFavorite} />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

function isSection(s: Section, k: Exclude<Section, { collection: string }>): boolean {
  return typeof s === "string" && s === k;
}

function emptyTitle(f: Filters): string {
  if (f.q.trim()) return "No matches";
  if (typeof f.section === "object") return "This collection is empty";
  switch (f.section) {
    case "favorites":
      return "No favorites yet";
    case "continue":
      return "Nothing to continue";
    case "archive":
      return "Archive is empty";
    case "trash":
      return "Trash is empty";
    default:
      return "Your library is empty";
  }
}
function emptyDescription(f: Filters): string {
  if (f.q.trim()) return "Try a different search term, or adjust filters.";
  if (typeof f.section === "object")
    return "Add books to this collection from any book's details page.";
  switch (f.section) {
    case "favorites":
      return "Books you favorite will appear here.";
    case "continue":
      return "Open a book — anywhere you stop, it'll wait for you here.";
    case "archive":
      return "Archived books are hidden from your main library but kept safe.";
    case "trash":
      return "Trashed books can be restored at any time before permanent deletion.";
    default:
      return "Add your first book — PDF, EPUB, TXT, or Markdown.";
  }
}

function parseFilters(params: URLSearchParams): Filters {
  const section = parseSection(params);
  const sources = (params.get("source") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(
      (s): s is Documents.SourceType =>
        s === "pdf" || s === "epub" || s === "text" || s === "markdown",
    );
  const sortBy =
    (
      ["createdAt", "lastOpenedAt", "title", "author", "progressPercent", "fileSizeBytes"] as const
    ).find((k) => k === params.get("sortBy")) ?? "createdAt";
  const sortOrder = params.get("sortOrder") === "asc" ? "asc" : "desc";
  const view = params.get("view") === "list" ? "list" : "grid";
  return {
    q: params.get("q") ?? "",
    section,
    sources,
    sortBy,
    sortOrder,
    view,
  };
}

function parseSection(p: URLSearchParams): Section {
  const c = p.get("collection");
  if (c) return { collection: c };
  const s = p.get("section");
  if (s === "favorites" || s === "continue" || s === "archive" || s === "trash") return s;
  return "all";
}

function stringifyFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (typeof f.section === "object") p.set("collection", f.section.collection);
  else if (f.section !== "all") p.set("section", f.section);
  if (f.sources.length > 0) p.set("source", f.sources.join(","));
  if (f.sortBy !== "createdAt") p.set("sortBy", f.sortBy);
  if (f.sortOrder !== "desc") p.set("sortOrder", f.sortOrder);
  if (f.view !== "grid") p.set("view", f.view);
  return p.toString();
}

function buildListQuery(f: Filters): Partial<Documents.ListDocumentsQuery> {
  const out: Record<string, unknown> = {
    sortBy: f.sortBy,
    sortOrder: f.sortOrder,
    limit: 48,
  };
  if (f.q.trim()) out["q"] = f.q.trim();
  if (f.sources.length > 0) out["sourceTypes"] = f.sources;
  switch (f.section) {
    case "favorites":
      out["lifecycle"] = "active";
      out["favorite"] = true;
      break;
    case "continue":
      out["lifecycle"] = "active";
      out["hasProgress"] = true;
      out["sortBy"] = "lastOpenedAt";
      break;
    case "archive":
      out["lifecycle"] = "archived";
      break;
    case "trash":
      out["lifecycle"] = "trashed";
      break;
    case "all":
      out["lifecycle"] = "active";
      break;
    default:
      out["lifecycle"] = "active";
      out["collectionId"] = f.section.collection;
  }
  return out as Partial<Documents.ListDocumentsQuery>;
}
