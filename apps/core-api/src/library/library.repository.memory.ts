import { Injectable } from "@nestjs/common";
import type { Auth, Documents, Audit } from "@bookhelper/api-contracts";
import {
  LibraryRepository,
  type LibraryContext,
  type DocumentPatch,
} from "./library.repository.js";
import { decodeCursor, encodeCursor, sortValueOf } from "./cursor.js";

/**
 * In-memory Library repository.
 *
 * The runtime adapter when no DATABASE_URL is configured (local dev) and the
 * substrate for unit/integration tests. It defines the canonical observable
 * behaviour the Drizzle adapter must match.
 */
@Injectable()
export class InMemoryLibraryRepository extends LibraryRepository {
  private readonly docs = new Map<string, Documents.Document>();
  private readonly collections = new Map<string, StoredCollection>();
  private readonly audit: Audit.AuditEntry[] = [];

  private scopeKey(ctx: LibraryContext, id: string): string {
    return `${ctx.tenantId}:${ctx.ownerId}:${id}`;
  }

  private ownedDocs(ctx: LibraryContext): Documents.Document[] {
    return [...this.docs.values()].filter(
      (d) => d.tenantId === ctx.tenantId && d.ownerId === ctx.ownerId,
    );
  }

  // ── Documents ────────────────────────────────────────────────────────
  async create(ctx: LibraryContext, doc: Documents.Document): Promise<Documents.Document> {
    this.docs.set(this.scopeKey(ctx, doc.id), structuredClone(doc));
    return structuredClone(doc);
  }

  async findById(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<Documents.Document | null> {
    const d = this.docs.get(this.scopeKey(ctx, id));
    return d ? structuredClone(d) : null;
  }

  async findByContentHash(
    ctx: LibraryContext,
    contentHash: string,
  ): Promise<Documents.Document | null> {
    const found = this.ownedDocs(ctx).find((d) => d.contentHash === contentHash);
    return found ? structuredClone(found) : null;
  }

  async patch(
    ctx: LibraryContext,
    id: Documents.DocumentId,
    patch: DocumentPatch,
  ): Promise<Documents.Document | null> {
    const key = this.scopeKey(ctx, id);
    const current = this.docs.get(key);
    if (!current) return null;

    const next: Documents.Document = structuredClone(current);
    if (patch.title !== undefined) next.title = patch.title;
    if (patch.author !== undefined) setOptional(next, "author", patch.author);
    if (patch.language !== undefined) setOptional(next, "language", patch.language);
    if (patch.coverStorageKey !== undefined)
      setOptional(next, "coverStorageKey", patch.coverStorageKey);
    if (patch.pageCount !== undefined) setOptional(next, "pageCount", patch.pageCount);
    if (patch.wordCount !== undefined) setOptional(next, "wordCount", patch.wordCount);
    if (patch.durationSeconds !== undefined)
      setOptional(next, "durationSeconds", patch.durationSeconds);
    if (patch.ingestStatus !== undefined) next.ingestStatus = patch.ingestStatus;
    if (patch.ingestStepVersion !== undefined) next.ingestStepVersion = patch.ingestStepVersion;
    if (patch.ingestError !== undefined) setOptional(next, "ingestError", patch.ingestError);
    if (patch.isFavorite !== undefined) next.isFavorite = patch.isFavorite;
    if (patch.lifecycle !== undefined) next.lifecycle = patch.lifecycle;
    if (patch.progressPercent !== undefined) next.progressPercent = patch.progressPercent;
    if (patch.lastOpenedAt !== undefined) setOptional(next, "lastOpenedAt", patch.lastOpenedAt);
    if (patch.collectionIds !== undefined) next.collectionIds = [...patch.collectionIds];
    if (patch.metadata !== undefined) {
      next.metadata = {
        ...next.metadata,
        ...patch.metadata,
        // tags fully replace when provided (not merged).
        tags: patch.metadata.tags ?? next.metadata.tags,
      };
    }
    next.updatedAt = new Date().toISOString();

    this.docs.set(key, next);
    return structuredClone(next);
  }

  async list(
    ctx: LibraryContext,
    query: Documents.ListDocumentsQuery,
  ): Promise<Documents.DocumentListResponse> {
    let rows = this.ownedDocs(ctx).filter((d) => d.lifecycle === query.lifecycle);

    if (query.favorite !== undefined) rows = rows.filter((d) => d.isFavorite === query.favorite);
    if (query.collectionId !== undefined)
      rows = rows.filter((d) => d.collectionIds.includes(query.collectionId!));
    if (query.hasProgress !== undefined)
      rows = rows.filter((d) =>
        query.hasProgress ? d.progressPercent > 0 : d.progressPercent === 0,
      );
    if (query.sourceTypes && query.sourceTypes.length > 0)
      rows = rows.filter((d) => query.sourceTypes!.includes(d.sourceType));
    if (query.q && query.q.trim()) rows = rows.filter((d) => matchesQuery(d, query.q!));

    const total = rows.length;
    rows.sort((a, b) => compareDocs(a, b, query.sortBy, query.sortOrder));

    let startIndex = 0;
    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        const idx = rows.findIndex((d) => d.id === decoded.id);
        if (idx >= 0) startIndex = idx + 1;
      }
    }

    const page = rows.slice(startIndex, startIndex + query.limit).map((d) => structuredClone(d));
    const last = page.at(-1);
    const hasMore = startIndex + query.limit < total;
    const nextCursor =
      hasMore && last
        ? encodeCursor({ v: sortValueOf(last, query.sortBy), id: last.id })
        : undefined;

    return { items: page, total, ...(nextCursor ? { nextCursor } : {}) };
  }

  async facets(ctx: LibraryContext): Promise<Documents.FacetsResponse> {
    const all = this.ownedDocs(ctx);
    const bySourceType: Record<string, number> = {};
    const byCollection: Record<string, number> = {};
    let active = 0;
    let archived = 0;
    let trashed = 0;
    let favorites = 0;

    for (const d of all) {
      if (d.lifecycle === "active") active++;
      else if (d.lifecycle === "archived") archived++;
      else if (d.lifecycle === "trashed") trashed++;
      if (d.isFavorite && d.lifecycle === "active") favorites++;
      if (d.lifecycle === "active") {
        bySourceType[d.sourceType] = (bySourceType[d.sourceType] ?? 0) + 1;
        for (const c of d.collectionIds) byCollection[c] = (byCollection[c] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      active,
      archived,
      trashed,
      favorites,
      bySourceType: bySourceType as Documents.FacetsResponse["bySourceType"],
      byCollection,
    };
  }

  async hardDelete(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<Documents.Document | null> {
    const key = this.scopeKey(ctx, id);
    const doc = this.docs.get(key);
    if (!doc) return null;
    this.docs.delete(key);
    return structuredClone(doc);
  }

  // ── Collections ──────────────────────────────────────────────────────
  async createCollection(
    ctx: LibraryContext,
    input: { id: Documents.CollectionId; name: string; parentId?: Documents.CollectionId },
  ): Promise<Documents.Collection> {
    const now = new Date().toISOString();
    const stored: StoredCollection = {
      id: input.id,
      ownerId: ctx.ownerId,
      tenantId: ctx.tenantId,
      name: input.name,
      ...(input.parentId ? { parentId: input.parentId } : {}),
      createdAt: now,
      updatedAt: now,
    };
    this.collections.set(this.scopeKey(ctx, input.id), stored);
    return this.toCollection(ctx, stored);
  }

  async listCollections(ctx: LibraryContext): Promise<Documents.Collection[]> {
    return [...this.collections.values()]
      .filter((c) => c.tenantId === ctx.tenantId && c.ownerId === ctx.ownerId)
      .map((c) => this.toCollection(ctx, c))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findCollection(
    ctx: LibraryContext,
    id: Documents.CollectionId,
  ): Promise<Documents.Collection | null> {
    const c = this.collections.get(this.scopeKey(ctx, id));
    return c ? this.toCollection(ctx, c) : null;
  }

  async renameCollection(
    ctx: LibraryContext,
    id: Documents.CollectionId,
    name: string,
  ): Promise<Documents.Collection | null> {
    const c = this.collections.get(this.scopeKey(ctx, id));
    if (!c) return null;
    c.name = name;
    c.updatedAt = new Date().toISOString();
    return this.toCollection(ctx, c);
  }

  async deleteCollection(ctx: LibraryContext, id: Documents.CollectionId): Promise<boolean> {
    const existed = this.collections.delete(this.scopeKey(ctx, id));
    if (!existed) return false;
    // Unlink from every document (documents themselves survive).
    for (const d of this.ownedDocs(ctx)) {
      if (d.collectionIds.includes(id)) {
        const key = this.scopeKey(ctx, d.id);
        const stored = this.docs.get(key);
        if (stored) stored.collectionIds = stored.collectionIds.filter((c: string) => c !== id);
      }
    }
    return true;
  }

  // ── Audit ────────────────────────────────────────────────────────────
  async appendAudit(entry: Audit.AuditEntry): Promise<Audit.AuditEntry> {
    this.audit.push(structuredClone(entry));
    return entry;
  }

  async listAuditForDocument(
    ctx: LibraryContext,
    documentId: Documents.DocumentId,
  ): Promise<Audit.AuditEntry[]> {
    return this.audit
      .filter((e) => e.tenantId === ctx.tenantId && e.documentId === documentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((e) => structuredClone(e));
  }

  private toCollection(ctx: LibraryContext, c: StoredCollection): Documents.Collection {
    const documentCount = this.ownedDocs(ctx).filter(
      (d) => d.lifecycle === "active" && d.collectionIds.includes(c.id),
    ).length;
    return { ...c, documentCount };
  }
}

interface StoredCollection {
  id: Documents.CollectionId;
  ownerId: Auth.UserId;
  tenantId: Auth.TenantId;
  name: string;
  parentId?: Documents.CollectionId;
  createdAt: string;
  updatedAt: string;
}

// ── helpers ──────────────────────────────────────────────────────────────
function setOptional<T, K extends keyof T>(obj: T, key: K, value: T[K] | null | undefined): void {
  if (value === null || value === undefined) delete obj[key];
  else obj[key] = value;
}

function matchesQuery(d: Documents.Document, q: string): boolean {
  const needle = q.trim().toLocaleLowerCase();
  const haystack = [
    d.title,
    d.author ?? "",
    d.metadata.description ?? "",
    ...(d.metadata.tags ?? []),
  ]
    .join(" ")
    .toLocaleLowerCase();
  return haystack.includes(needle);
}

function compareDocs(
  a: Documents.Document,
  b: Documents.Document,
  sortBy: Documents.SortField,
  order: Documents.SortOrder,
): number {
  const dir = order === "asc" ? 1 : -1;
  let cmp = 0;
  switch (sortBy) {
    case "createdAt":
      cmp = a.createdAt.localeCompare(b.createdAt);
      break;
    case "lastOpenedAt":
      cmp = (a.lastOpenedAt ?? "").localeCompare(b.lastOpenedAt ?? "");
      break;
    case "title":
      cmp = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      break;
    case "author":
      cmp = (a.author ?? "").localeCompare(b.author ?? "", undefined, { sensitivity: "base" });
      break;
    case "progressPercent":
      cmp = a.progressPercent - b.progressPercent;
      break;
    case "fileSizeBytes":
      cmp = a.fileSizeBytes - b.fileSizeBytes;
      break;
  }
  if (cmp !== 0) return cmp * dir;
  // Stable tiebreaker — always ascending id so cursors are deterministic.
  return a.id.localeCompare(b.id);
}
