import type { Auth, Documents, Audit } from "@bookhelper/api-contracts";

/**
 * Library persistence port (hexagonal). The service depends on this abstract
 * class; two adapters implement it:
 *   • DrizzleLibraryRepository  — Postgres (production).
 *   • InMemoryLibraryRepository — dev-without-DB + the test substrate.
 *
 * The module picks the adapter at boot based on whether a DB handle exists
 * (db.module returns `null` when DATABASE_URL is unset). Both adapters MUST
 * have identical observable semantics — the in-memory one is the contract the
 * unit tests pin, and the Drizzle one mirrors it in SQL.
 *
 * Every method takes a `LibraryContext` (tenant + owner). Repositories MUST
 * scope every read and write by it — there is no cross-tenant access path.
 */

/** Tenancy scope carried into every repository call. */
export interface LibraryContext {
  readonly tenantId: Auth.TenantId;
  readonly ownerId: Auth.UserId;
}

/** Fields a document may be patched with (the repository merges `metadata`). */
export interface DocumentPatch {
  title?: string;
  author?: string | null;
  language?: string | null;
  metadata?: Partial<Documents.DocumentMetadata>;
  coverStorageKey?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
  durationSeconds?: number | null;
  ingestStatus?: Documents.IngestStatus;
  ingestStepVersion?: number;
  ingestError?: string | null;
  isFavorite?: boolean;
  lifecycle?: Documents.Lifecycle;
  progressPercent?: number;
  lastOpenedAt?: string | null;
  collectionIds?: Documents.CollectionId[];
}

export abstract class LibraryRepository {
  // ── Documents ────────────────────────────────────────────────────────
  abstract create(ctx: LibraryContext, doc: Documents.Document): Promise<Documents.Document>;
  abstract findById(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<Documents.Document | null>;
  abstract findByContentHash(
    ctx: LibraryContext,
    contentHash: string,
  ): Promise<Documents.Document | null>;
  abstract patch(
    ctx: LibraryContext,
    id: Documents.DocumentId,
    patch: DocumentPatch,
  ): Promise<Documents.Document | null>;
  abstract list(
    ctx: LibraryContext,
    query: Documents.ListDocumentsQuery,
  ): Promise<Documents.DocumentListResponse>;
  abstract facets(ctx: LibraryContext): Promise<Documents.FacetsResponse>;
  /** Hard delete. Returns the removed document (for storage cleanup + audit). */
  abstract hardDelete(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<Documents.Document | null>;

  // ── Collections ──────────────────────────────────────────────────────
  abstract createCollection(
    ctx: LibraryContext,
    input: { id: Documents.CollectionId; name: string; parentId?: Documents.CollectionId },
  ): Promise<Documents.Collection>;
  abstract listCollections(ctx: LibraryContext): Promise<Documents.Collection[]>;
  abstract findCollection(
    ctx: LibraryContext,
    id: Documents.CollectionId,
  ): Promise<Documents.Collection | null>;
  abstract renameCollection(
    ctx: LibraryContext,
    id: Documents.CollectionId,
    name: string,
  ): Promise<Documents.Collection | null>;
  /** Delete a collection. Documents are NOT deleted — only unlinked. */
  abstract deleteCollection(ctx: LibraryContext, id: Documents.CollectionId): Promise<boolean>;

  // ── Audit ────────────────────────────────────────────────────────────
  abstract appendAudit(entry: Audit.AuditEntry): Promise<Audit.AuditEntry>;
  abstract listAuditForDocument(
    ctx: LibraryContext,
    documentId: Documents.DocumentId,
  ): Promise<Audit.AuditEntry[]>;
}
