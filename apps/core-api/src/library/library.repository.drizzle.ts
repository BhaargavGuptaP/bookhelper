import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Auth, Documents, Audit } from "@bookhelper/api-contracts";
import { DB } from "../db/db.module.js";
import { librarySchema } from "../db/schema/index.js";
import {
  LibraryRepository,
  type LibraryContext,
  type DocumentPatch,
} from "./library.repository.js";
import { decodeCursor, encodeCursor, sortValueOf } from "./cursor.js";

/**
 * Postgres adapter (Drizzle) for the Library aggregate.
 *
 * Observable behaviour MUST equal `InMemoryLibraryRepository` — the
 * in-memory adapter is the contract the unit tests pin. Every read and write
 * is scoped by `tenantId + ownerId` (defense in depth; RLS lands later).
 *
 * Sorting uses two-column keyset pagination (sort column + id tiebreak) so
 * pages are stable under concurrent writes.
 */
@Injectable()
export class DrizzleLibraryRepository extends LibraryRepository {
  private readonly t = librarySchema;

  constructor(@Inject(DB) private readonly db: PostgresJsDatabase) {
    super();
  }

  // ── Documents ────────────────────────────────────────────────────────
  async create(ctx: LibraryContext, doc: Documents.Document): Promise<Documents.Document> {
    await this.db.insert(this.t.documents).values(this.toRow(ctx, doc));
    if (doc.collectionIds.length > 0) await this.linkCollections(ctx, doc.id, doc.collectionIds);
    return doc;
  }

  async findById(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<Documents.Document | null> {
    const rows = await this.db
      .select()
      .from(this.t.documents)
      .where(this.scope(ctx, eq(this.t.documents.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const collectionIds = await this.collectionsFor(id);
    return this.fromRow(row, collectionIds);
  }

  async findByContentHash(
    ctx: LibraryContext,
    contentHash: string,
  ): Promise<Documents.Document | null> {
    const rows = await this.db
      .select()
      .from(this.t.documents)
      .where(this.scope(ctx, eq(this.t.documents.contentHash, contentHash.toLowerCase())))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.fromRow(row, await this.collectionsFor(row.id));
  }

  async patch(
    ctx: LibraryContext,
    id: Documents.DocumentId,
    patch: DocumentPatch,
  ): Promise<Documents.Document | null> {
    const current = await this.findById(ctx, id);
    if (!current) return null;

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.title !== undefined) update["title"] = patch.title;
    if (patch.author !== undefined) update["author"] = patch.author ?? null;
    if (patch.language !== undefined) update["language"] = patch.language ?? null;
    if (patch.coverStorageKey !== undefined)
      update["coverStorageKey"] = patch.coverStorageKey ?? null;
    if (patch.pageCount !== undefined) update["pageCount"] = patch.pageCount ?? null;
    if (patch.wordCount !== undefined) update["wordCount"] = patch.wordCount ?? null;
    if (patch.durationSeconds !== undefined)
      update["durationSeconds"] = patch.durationSeconds ?? null;
    if (patch.ingestStatus !== undefined) update["ingestStatus"] = patch.ingestStatus;
    if (patch.ingestStepVersion !== undefined)
      update["ingestStepVersion"] = patch.ingestStepVersion;
    if (patch.ingestError !== undefined) update["ingestError"] = patch.ingestError ?? null;
    if (patch.isFavorite !== undefined) update["isFavorite"] = patch.isFavorite;
    if (patch.lifecycle !== undefined) update["lifecycle"] = patch.lifecycle;
    if (patch.progressPercent !== undefined) update["progressPercent"] = patch.progressPercent;
    if (patch.lastOpenedAt !== undefined)
      update["lastOpenedAt"] = patch.lastOpenedAt ? new Date(patch.lastOpenedAt) : null;
    if (patch.metadata !== undefined) {
      update["metadata"] = {
        ...current.metadata,
        ...patch.metadata,
        tags: patch.metadata.tags ?? current.metadata.tags,
      };
    }

    await this.db
      .update(this.t.documents)
      .set(update)
      .where(this.scope(ctx, eq(this.t.documents.id, id)));

    if (patch.collectionIds !== undefined) {
      await this.db
        .delete(this.t.documentCollections)
        .where(eq(this.t.documentCollections.documentId, id));
      if (patch.collectionIds.length > 0) {
        await this.linkCollections(ctx, id, patch.collectionIds);
      }
    }

    return this.findById(ctx, id);
  }

  async list(
    ctx: LibraryContext,
    query: Documents.ListDocumentsQuery,
  ): Promise<Documents.DocumentListResponse> {
    const where: SQL[] = [this.scopeBase(ctx), eq(this.t.documents.lifecycle, query.lifecycle)];

    if (query.favorite !== undefined) where.push(eq(this.t.documents.isFavorite, query.favorite));
    if (query.sourceTypes && query.sourceTypes.length > 0)
      where.push(inArray(this.t.documents.sourceType, query.sourceTypes as unknown as string[]));
    if (query.hasProgress !== undefined) {
      where.push(
        query.hasProgress
          ? gt(this.t.documents.progressPercent, 0)
          : eq(this.t.documents.progressPercent, 0),
      );
    }
    if (query.q && query.q.trim()) {
      const needle = `%${query.q.trim().toLowerCase()}%`;
      where.push(
        sql`(lower(${this.t.documents.title}) like ${needle} or lower(coalesce(${this.t.documents.author}, '')) like ${needle})`,
      );
    }
    if (query.collectionId !== undefined) {
      where.push(
        sql`exists (select 1 from ${this.t.documentCollections} dc where dc.document_id = ${this.t.documents.id} and dc.collection_id = ${query.collectionId})`,
      );
    }

    const totalRow = await this.db
      .select({ c: count() })
      .from(this.t.documents)
      .where(and(...where));
    const total = Number(totalRow[0]?.c ?? 0);

    const order = this.orderBy(query.sortBy, query.sortOrder);
    const rows = await this.db
      .select()
      .from(this.t.documents)
      .where(and(...where, this.cursorClause(query)))
      .orderBy(...order)
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const page = rows.slice(0, query.limit);

    const items: Documents.Document[] = [];
    for (const row of page) {
      const collectionIds = await this.collectionsFor(row.id);
      items.push(this.fromRow(row, collectionIds));
    }
    const last = items.at(-1);
    const nextCursor =
      hasMore && last
        ? encodeCursor({ v: sortValueOf(last, query.sortBy), id: last.id })
        : undefined;

    return { items, total, ...(nextCursor ? { nextCursor } : {}) };
  }

  async facets(ctx: LibraryContext): Promise<Documents.FacetsResponse> {
    const rows = await this.db
      .select({
        lifecycle: this.t.documents.lifecycle,
        sourceType: this.t.documents.sourceType,
        isFavorite: this.t.documents.isFavorite,
      })
      .from(this.t.documents)
      .where(this.scopeBase(ctx));

    const bySourceType: Record<string, number> = {};
    const byCollection: Record<string, number> = {};
    let active = 0;
    let archived = 0;
    let trashed = 0;
    let favorites = 0;
    for (const r of rows) {
      if (r.lifecycle === "active") active++;
      else if (r.lifecycle === "archived") archived++;
      else if (r.lifecycle === "trashed") trashed++;
      if (r.isFavorite && r.lifecycle === "active") favorites++;
      if (r.lifecycle === "active") {
        bySourceType[r.sourceType] = (bySourceType[r.sourceType] ?? 0) + 1;
      }
    }

    const colCounts = await this.db
      .select({
        collectionId: this.t.documentCollections.collectionId,
        c: count(),
      })
      .from(this.t.documentCollections)
      .innerJoin(this.t.documents, eq(this.t.documents.id, this.t.documentCollections.documentId))
      .where(and(this.scopeBase(ctx), eq(this.t.documents.lifecycle, "active")))
      .groupBy(this.t.documentCollections.collectionId);
    for (const r of colCounts) byCollection[r.collectionId] = Number(r.c);

    return {
      total: rows.length,
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
    const existing = await this.findById(ctx, id);
    if (!existing) return null;
    await this.db
      .delete(this.t.documentCollections)
      .where(eq(this.t.documentCollections.documentId, id));
    await this.db.delete(this.t.documents).where(this.scope(ctx, eq(this.t.documents.id, id)));
    return existing;
  }

  // ── Collections ──────────────────────────────────────────────────────
  async createCollection(
    ctx: LibraryContext,
    input: { id: Documents.CollectionId; name: string; parentId?: Documents.CollectionId },
  ): Promise<Documents.Collection> {
    const now = new Date();
    await this.db.insert(this.t.collections).values({
      id: input.id,
      tenantId: ctx.tenantId,
      ownerId: ctx.ownerId,
      name: input.name,
      parentId: input.parentId ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.findCollection(ctx, input.id))!;
  }

  async listCollections(ctx: LibraryContext): Promise<Documents.Collection[]> {
    const rows = await this.db
      .select()
      .from(this.t.collections)
      .where(this.scopeBase(ctx, this.t.collections));
    const out: Documents.Collection[] = [];
    for (const r of rows) out.push(await this.collectionFromRow(ctx, r));
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findCollection(
    ctx: LibraryContext,
    id: Documents.CollectionId,
  ): Promise<Documents.Collection | null> {
    const rows = await this.db
      .select()
      .from(this.t.collections)
      .where(
        and(
          eq(this.t.collections.id, id),
          eq(this.t.collections.tenantId, ctx.tenantId),
          eq(this.t.collections.ownerId, ctx.ownerId),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.collectionFromRow(ctx, row);
  }

  async renameCollection(
    ctx: LibraryContext,
    id: Documents.CollectionId,
    name: string,
  ): Promise<Documents.Collection | null> {
    const r = await this.findCollection(ctx, id);
    if (!r) return null;
    await this.db
      .update(this.t.collections)
      .set({ name, updatedAt: new Date() })
      .where(
        and(
          eq(this.t.collections.id, id),
          eq(this.t.collections.tenantId, ctx.tenantId),
          eq(this.t.collections.ownerId, ctx.ownerId),
        ),
      );
    return this.findCollection(ctx, id);
  }

  async deleteCollection(ctx: LibraryContext, id: Documents.CollectionId): Promise<boolean> {
    const found = await this.findCollection(ctx, id);
    if (!found) return false;
    await this.db
      .delete(this.t.documentCollections)
      .where(eq(this.t.documentCollections.collectionId, id));
    await this.db
      .delete(this.t.collections)
      .where(
        and(
          eq(this.t.collections.id, id),
          eq(this.t.collections.tenantId, ctx.tenantId),
          eq(this.t.collections.ownerId, ctx.ownerId),
        ),
      );
    return true;
  }

  // ── Audit ────────────────────────────────────────────────────────────
  async appendAudit(entry: Audit.AuditEntry): Promise<Audit.AuditEntry> {
    await this.db.insert(this.t.auditLog).values({
      id: entry.id,
      tenantId: entry.tenantId,
      actorId: entry.actorId,
      action: entry.action,
      documentId: entry.documentId ?? null,
      metadata: entry.metadata ?? null,
      createdAt: new Date(entry.createdAt),
    });
    return entry;
  }

  async listAuditForDocument(
    ctx: LibraryContext,
    documentId: Documents.DocumentId,
  ): Promise<Audit.AuditEntry[]> {
    const rows = await this.db
      .select()
      .from(this.t.auditLog)
      .where(
        and(eq(this.t.auditLog.tenantId, ctx.tenantId), eq(this.t.auditLog.documentId, documentId)),
      )
      .orderBy(desc(this.t.auditLog.createdAt));
    return rows.map((r) => ({
      id: r.id as Audit.AuditEntryId,
      tenantId: r.tenantId as Auth.TenantId,
      actorId: r.actorId as Auth.UserId,
      action: r.action as Audit.AuditAction,
      documentId: (r.documentId ?? undefined) as Documents.DocumentId | undefined,
      ...(r.metadata ? { metadata: r.metadata as Record<string, unknown> } : {}),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // ── helpers ──────────────────────────────────────────────────────────
  private scopeBase(
    ctx: LibraryContext,
    table: typeof this.t.documents | typeof this.t.collections = this.t.documents,
  ): SQL {
    return and(eq(table.tenantId, ctx.tenantId), eq(table.ownerId, ctx.ownerId))!;
  }
  private scope(ctx: LibraryContext, extra: SQL): SQL {
    return and(this.scopeBase(ctx), extra)!;
  }

  private orderBy(sortBy: Documents.SortField, order: Documents.SortOrder): SQL[] {
    const dir = order === "asc" ? asc : desc;
    const col =
      sortBy === "createdAt"
        ? this.t.documents.createdAt
        : sortBy === "lastOpenedAt"
          ? this.t.documents.lastOpenedAt
          : sortBy === "title"
            ? this.t.documents.title
            : sortBy === "author"
              ? this.t.documents.author
              : sortBy === "progressPercent"
                ? this.t.documents.progressPercent
                : this.t.documents.fileSizeBytes;
    // Stable tiebreak on id ASC.
    return [dir(col), asc(this.t.documents.id)];
  }

  // The full-table key on `id` is always ASC; the `_asc`/`_unused` flag isn't
  // needed there. Returns a SQL fragment composable with WHERE AND.

  private cursorClause(query: Documents.ListDocumentsQuery): SQL {
    if (!query.cursor) return sql`true`;
    const decoded = decodeCursor(query.cursor);
    if (!decoded) return sql`true`;
    const asc_ = query.sortOrder === "asc";
    const cmp = asc_ ? gt : lt;
    const cmpEq = asc_ ? gte : lte;
    const idCmp = asc_ ? gt : gt; // id always asc tiebreak
    // (col > v) OR (col = v AND id > lastId)
    switch (query.sortBy) {
      case "createdAt":
        return or(
          cmp(this.t.documents.createdAt, new Date(decoded.v)),
          and(
            eq(this.t.documents.createdAt, new Date(decoded.v)),
            idCmp(this.t.documents.id, decoded.id),
          ),
        )!;
      case "title":
        return or(
          cmp(sql`lower(${this.t.documents.title})`, decoded.v),
          and(
            eq(sql`lower(${this.t.documents.title})`, decoded.v),
            idCmp(this.t.documents.id, decoded.id),
          ),
        )!;
      case "author":
        return or(
          cmp(sql`lower(coalesce(${this.t.documents.author},''))`, decoded.v),
          and(
            eq(sql`lower(coalesce(${this.t.documents.author},''))`, decoded.v),
            idCmp(this.t.documents.id, decoded.id),
          ),
        )!;
      case "lastOpenedAt":
        return or(
          cmp(this.t.documents.lastOpenedAt, decoded.v ? new Date(decoded.v) : new Date(0)),
          and(
            cmpEq(this.t.documents.lastOpenedAt, decoded.v ? new Date(decoded.v) : new Date(0)),
            idCmp(this.t.documents.id, decoded.id),
          ),
        )!;
      case "progressPercent":
        return or(
          cmp(this.t.documents.progressPercent, Number(decoded.v)),
          and(
            eq(this.t.documents.progressPercent, Number(decoded.v)),
            idCmp(this.t.documents.id, decoded.id),
          ),
        )!;
      case "fileSizeBytes":
        return or(
          cmp(this.t.documents.fileSizeBytes, Number(decoded.v)),
          and(
            eq(this.t.documents.fileSizeBytes, Number(decoded.v)),
            idCmp(this.t.documents.id, decoded.id),
          ),
        )!;
      default:
        return sql`true`;
    }
  }

  private async linkCollections(
    ctx: LibraryContext,
    documentId: string,
    ids: readonly string[],
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .insert(this.t.documentCollections)
      .values(ids.map((cid) => ({ documentId, collectionId: cid, ownerId: ctx.ownerId })))
      .onConflictDoNothing();
  }

  private async collectionsFor(documentId: string): Promise<Documents.CollectionId[]> {
    const rows = await this.db
      .select({ id: this.t.documentCollections.collectionId })
      .from(this.t.documentCollections)
      .where(eq(this.t.documentCollections.documentId, documentId));
    return rows.map((r) => r.id as Documents.CollectionId);
  }

  private async collectionFromRow(
    ctx: LibraryContext,
    r: typeof this.t.collections.$inferSelect,
  ): Promise<Documents.Collection> {
    const docCount = await this.db
      .select({ c: count() })
      .from(this.t.documentCollections)
      .innerJoin(this.t.documents, eq(this.t.documents.id, this.t.documentCollections.documentId))
      .where(
        and(
          eq(this.t.documentCollections.collectionId, r.id),
          eq(this.t.documents.tenantId, ctx.tenantId),
          eq(this.t.documents.ownerId, ctx.ownerId),
          eq(this.t.documents.lifecycle, "active"),
        ),
      );
    return {
      id: r.id as Documents.CollectionId,
      ownerId: r.ownerId as Auth.UserId,
      tenantId: r.tenantId as Auth.TenantId,
      name: r.name,
      ...(r.parentId ? { parentId: r.parentId as Documents.CollectionId } : {}),
      documentCount: Number(docCount[0]?.c ?? 0),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private toRow(ctx: LibraryContext, d: Documents.Document): typeof this.t.documents.$inferInsert {
    return {
      id: d.id,
      tenantId: ctx.tenantId,
      ownerId: ctx.ownerId,
      title: d.title,
      author: d.author ?? null,
      language: d.language ?? null,
      sourceType: d.sourceType,
      contentHash: d.contentHash,
      storageKey: d.storageKey,
      coverStorageKey: d.coverStorageKey ?? null,
      fileSizeBytes: d.fileSizeBytes,
      pageCount: d.pageCount ?? null,
      wordCount: d.wordCount ?? null,
      durationSeconds: d.durationSeconds ?? null,
      ingestStatus: d.ingestStatus,
      ingestStepVersion: d.ingestStepVersion,
      ingestError: d.ingestError ?? null,
      lifecycle: d.lifecycle,
      isFavorite: d.isFavorite,
      progressPercent: d.progressPercent,
      lastOpenedAt: d.lastOpenedAt ? new Date(d.lastOpenedAt) : null,
      metadata: d.metadata,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
    };
  }

  private fromRow(
    r: typeof this.t.documents.$inferSelect,
    collectionIds: Documents.CollectionId[],
  ): Documents.Document {
    return {
      id: r.id as Documents.DocumentId,
      ownerId: r.ownerId as Auth.UserId,
      tenantId: r.tenantId as Auth.TenantId,
      title: r.title,
      ...(r.author ? { author: r.author } : {}),
      ...(r.language ? { language: r.language } : {}),
      sourceType: r.sourceType as Documents.SourceType,
      contentHash: r.contentHash,
      storageKey: r.storageKey,
      ...(r.coverStorageKey ? { coverStorageKey: r.coverStorageKey } : {}),
      fileSizeBytes: Number(r.fileSizeBytes),
      ...(r.pageCount !== null ? { pageCount: r.pageCount } : {}),
      ...(r.wordCount !== null ? { wordCount: r.wordCount } : {}),
      ...(r.durationSeconds !== null ? { durationSeconds: r.durationSeconds } : {}),
      ingestStatus: r.ingestStatus as Documents.IngestStatus,
      ingestStepVersion: r.ingestStepVersion,
      ...(r.ingestError ? { ingestError: r.ingestError } : {}),
      lifecycle: r.lifecycle as Documents.Lifecycle,
      isFavorite: r.isFavorite,
      progressPercent: r.progressPercent,
      ...(r.lastOpenedAt ? { lastOpenedAt: r.lastOpenedAt.toISOString() } : {}),
      collectionIds,
      metadata: (r.metadata as Documents.DocumentMetadata) ?? { tags: [] },
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
