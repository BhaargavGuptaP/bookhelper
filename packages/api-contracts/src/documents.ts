import { z } from "zod";
import { userId, tenantId } from "./auth.js";

/**
 * Library / Documents contract.
 *
 * Mirrors ARCHITECTURE.md §12 `documents` schema:
 *   documents (id, owner_id, org_id?, title, author, source_type,
 *              content_hash, storage_key, lang, page_count|duration,
 *              ingest_status, ingest_step_version, metadata jsonb)
 *
 * Polymorphism is by `sourceType`. Sprint 2 supports pdf | epub | text |
 * markdown. The discriminator is open-ended (z.enum can grow) — adding a
 * new source type (docx, web, audio, video, note) requires a contract bump
 * but no controller refactor, because the service operates on the union.
 */

// ──────────────────────────────────────────────────────────────────────────
// Branded ids
// ──────────────────────────────────────────────────────────────────────────
export const documentId = z.string().min(1).brand("DocumentId");
export type DocumentId = z.infer<typeof documentId>;

export const collectionId = z.string().min(1).brand("CollectionId");
export type CollectionId = z.infer<typeof collectionId>;

// ──────────────────────────────────────────────────────────────────────────
// Enumerations
// ──────────────────────────────────────────────────────────────────────────
export const sourceType = z.enum(["pdf", "epub", "text", "markdown"]);
export type SourceType = z.infer<typeof sourceType>;

export const ingestStatus = z.enum(["queued", "extracting", "ready", "failed"]);
export type IngestStatus = z.infer<typeof ingestStatus>;

export const lifecycle = z.enum(["active", "archived", "trashed"]);
export type Lifecycle = z.infer<typeof lifecycle>;

export const sortField = z.enum([
  "createdAt",
  "lastOpenedAt",
  "title",
  "author",
  "progressPercent",
  "fileSizeBytes",
]);
export type SortField = z.infer<typeof sortField>;

export const sortOrder = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof sortOrder>;

// ──────────────────────────────────────────────────────────────────────────
// Document — the canonical Library entity
// ──────────────────────────────────────────────────────────────────────────
export const documentMetadata = z
  .object({
    publisher: z.string().max(200).optional(),
    publishedDate: z.string().optional(),
    isbn: z.string().max(40).optional(),
    description: z.string().max(4000).optional(),
    tags: z.array(z.string().min(1).max(40)).default([]),
  })
  .passthrough();
export type DocumentMetadata = z.infer<typeof documentMetadata>;

export const document = z.object({
  id: documentId,
  ownerId: userId,
  tenantId: tenantId,

  title: z.string().min(1).max(500),
  author: z.string().max(200).optional(),
  language: z.string().max(20).optional(),

  sourceType,
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  storageKey: z.string().min(1),
  coverStorageKey: z.string().min(1).optional(),

  fileSizeBytes: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),

  ingestStatus,
  ingestStepVersion: z.number().int().nonnegative().default(1),
  ingestError: z.string().max(2000).optional(),

  lifecycle,
  isFavorite: z.boolean(),

  /** 0..1 from the Reader; 0 until the user opens the doc. */
  progressPercent: z.number().min(0).max(1).default(0),
  lastOpenedAt: z.string().datetime().optional(),

  collectionIds: z.array(collectionId).default([]),
  metadata: documentMetadata.default({ tags: [] }),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Document = z.infer<typeof document>;

// ──────────────────────────────────────────────────────────────────────────
// Register flow — completes the presigned upload by registering the bytes
// the client just PUT. The server *may* download a small head of the file
// to extract metadata, or schedule extraction asynchronously.
// ──────────────────────────────────────────────────────────────────────────
export const registerDocumentRequest = z.object({
  /** Server-issued key from the presignUpload step. */
  objectKey: z.string().min(1),
  /** Bytes actually written (the server verifies via HEAD). */
  fileSizeBytes: z.number().int().positive(),
  /** Same hash supplied to presignUpload (if any). */
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i, "must be lower-hex SHA-256 (64 chars)"),
  /** Original client filename — used for default title + extension. */
  filename: z.string().min(1).max(512),
  /** MIME from the upload step. */
  contentType: z.string().min(1),
  /** Optional client-suggested overrides. */
  title: z.string().min(1).max(500).optional(),
  author: z.string().max(200).optional(),
  collectionIds: z.array(collectionId).optional(),
});
export type RegisterDocumentRequest = z.infer<typeof registerDocumentRequest>;

// ──────────────────────────────────────────────────────────────────────────
// List / search / filter / sort
// ──────────────────────────────────────────────────────────────────────────
export const listDocumentsQuery = z.object({
  /** Phrase match against title, author, tags, description. */
  q: z.string().max(200).optional(),
  sourceTypes: z.array(sourceType).optional(),
  lifecycle: lifecycle.default("active"),
  favorite: z.boolean().optional(),
  collectionId: collectionId.optional(),
  hasProgress: z.boolean().optional(), // for "Continue reading"
  sortBy: sortField.default("createdAt"),
  sortOrder: sortOrder.default("desc"),
  /** Cursor format: `${iso}:${id}` produced by the previous page. */
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(24),
});
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuery>;

export const documentListResponse = z.object({
  items: z.array(document),
  nextCursor: z.string().optional(),
  total: z.number().int().nonnegative().optional(),
});
export type DocumentListResponse = z.infer<typeof documentListResponse>;

export const facetsResponse = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  archived: z.number().int().nonnegative(),
  trashed: z.number().int().nonnegative(),
  favorites: z.number().int().nonnegative(),
  bySourceType: z.record(sourceType, z.number().int().nonnegative()),
  byCollection: z.record(z.string(), z.number().int().nonnegative()),
});
export type FacetsResponse = z.infer<typeof facetsResponse>;

// ──────────────────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────────────────
export const updateDocumentRequest = z
  .object({
    title: z.string().min(1).max(500).optional(),
    author: z.string().max(200).optional(),
    language: z.string().max(20).optional(),
    metadata: documentMetadata.partial().optional(),
    collectionIds: z.array(collectionId).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Patch must include at least one field.",
  });
export type UpdateDocumentRequest = z.infer<typeof updateDocumentRequest>;

export const setFavoriteRequest = z.object({ favorite: z.boolean() });
export type SetFavoriteRequest = z.infer<typeof setFavoriteRequest>;

export const setLifecycleRequest = z.object({ lifecycle });
export type SetLifecycleRequest = z.infer<typeof setLifecycleRequest>;

/** Body for the Reader → Library "I opened this" callback. */
export const recordOpenRequest = z.object({
  /** Optional progress update (Reader may also use its own endpoint). */
  progressPercent: z.number().min(0).max(1).optional(),
});
export type RecordOpenRequest = z.infer<typeof recordOpenRequest>;

// ──────────────────────────────────────────────────────────────────────────
// Collection
// ──────────────────────────────────────────────────────────────────────────
export const collection = z.object({
  id: collectionId,
  ownerId: userId,
  tenantId: tenantId,
  name: z.string().min(1).max(120),
  parentId: collectionId.optional(),
  documentCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Collection = z.infer<typeof collection>;

export const createCollectionRequest = z.object({
  name: z.string().min(1).max(120),
  parentId: collectionId.optional(),
});
export type CreateCollectionRequest = z.infer<typeof createCollectionRequest>;

export const renameCollectionRequest = z.object({
  name: z.string().min(1).max(120),
});
export type RenameCollectionRequest = z.infer<typeof renameCollectionRequest>;
