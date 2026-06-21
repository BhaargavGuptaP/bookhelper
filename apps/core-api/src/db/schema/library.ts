import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  real,
  jsonb,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Library schema (ARCHITECTURE.md §12 `documents`, `collections`, audit).
 *
 * Design notes:
 *  • Enumerated fields (`sourceType`, `ingestStatus`, `lifecycle`, audit
 *    `action`) are stored as `text`, NOT pg enums. The contract (zod) is the
 *    source of truth for the allowed set; using `text` means adding a future
 *    source type (docx, web, audio…) is a contract bump with NO destructive
 *    DB enum migration. This is the "extensible without refactor" requirement.
 *  • Every row carries `tenantId` + `ownerId` — tenancy is enforced in the
 *    repository's WHERE clauses (ARCHITECTURE §17 defense-in-depth; RLS is a
 *    later hardening sprint).
 *  • `metadata` is a jsonb bag matching `documentMetadata` (publisher, isbn,
 *    description, tags, …) so adding metadata fields needs no migration.
 */

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    ownerId: text("owner_id").notNull(),

    title: text("title").notNull(),
    author: text("author"),
    language: text("language"),

    sourceType: text("source_type").notNull(),
    contentHash: text("content_hash").notNull(),
    storageKey: text("storage_key").notNull(),
    coverStorageKey: text("cover_storage_key"),

    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    pageCount: integer("page_count"),
    wordCount: integer("word_count"),
    durationSeconds: integer("duration_seconds"),

    ingestStatus: text("ingest_status").notNull().default("queued"),
    ingestStepVersion: integer("ingest_step_version").notNull().default(1),
    ingestError: text("ingest_error"),

    lifecycle: text("lifecycle").notNull().default("active"),
    isFavorite: boolean("is_favorite").notNull().default(false),

    progressPercent: real("progress_percent").notNull().default(0),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),

    metadata: jsonb("metadata").notNull().default({ tags: [] }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Primary list query: tenant+owner scoped, filtered by lifecycle, ordered.
    index("documents_owner_lifecycle_idx").on(t.tenantId, t.ownerId, t.lifecycle, t.createdAt),
    index("documents_owner_lastopened_idx").on(t.ownerId, t.lastOpenedAt),
    // Dedup: a given owner cannot hold the same bytes twice (§2.13).
    uniqueIndex("documents_owner_contenthash_uidx").on(t.ownerId, t.contentHash),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("collections_owner_idx").on(t.tenantId, t.ownerId, t.name)],
);

export const documentCollections = pgTable(
  "document_collections",
  {
    documentId: text("document_id").notNull(),
    collectionId: text("collection_id").notNull(),
    ownerId: text("owner_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.documentId, t.collectionId] }),
    index("doc_collections_collection_idx").on(t.collectionId),
    index("doc_collections_document_idx").on(t.documentId),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    documentId: text("document_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_document_idx").on(t.tenantId, t.documentId, t.createdAt),
    index("audit_tenant_idx").on(t.tenantId, t.createdAt),
  ],
);

/** Aggregate export consumed by drizzle-kit + the Drizzle repository. */
export const librarySchema = {
  documents,
  collections,
  documentCollections,
  auditLog,
};
