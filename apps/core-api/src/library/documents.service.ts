import { Inject, Injectable, Logger } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Documents, type Audit } from "@bookhelper/api-contracts";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
} from "@bookhelper/telemetry";
import { STORAGE } from "../storage/storage.module.js";
import type { StorageDriver, StoredObject } from "../storage/storage.types.js";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";
import { LibraryRepository, type LibraryContext } from "./library.repository.js";
import { ProcessingService } from "./processing.service.js";
import { sourceTypeForMime } from "./source-type.js";
import { deriveTitleFromFilename } from "../extraction/filename.js";
import { newAuditId, newDocumentId } from "./ids.js";

/** Documents (Library) application service — orchestrates the repository,
 * storage, extraction, and the audit log. All methods are tenant-scoped. */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly repo: LibraryRepository,
    private readonly processing: ProcessingService,
    @Inject(STORAGE) private readonly storage: StorageDriver,
    @Inject(ENV) private readonly env: Env,
  ) {}

  // ── Register (completes a presigned upload) ───────────────────────────
  async register(
    ctx: LibraryContext,
    req: Documents.RegisterDocumentRequest,
  ): Promise<Documents.Document> {
    const sourceType = sourceTypeForMime(req.contentType);

    // Dedup (§2.13): identical bytes already owned → don't reprocess.
    const existing = await this.repo.findByContentHash(ctx, req.contentHash);
    if (existing) {
      await this.safeDelete(req.objectKey);
      throw new ConflictError("This document is already in your library.", {
        extensions: { existingDocumentId: existing.id },
      });
    }

    const stored = await this.fetchUpload(req.objectKey);

    if (stored.size > this.env.MAX_UPLOAD_BYTES) {
      await this.safeDelete(req.objectKey);
      throw new PayloadTooLargeError("This file exceeds the maximum upload size.");
    }
    if (stored.size !== req.fileSizeBytes) {
      await this.safeDelete(req.objectKey);
      throw new BadRequestError("Uploaded size does not match the registered size.");
    }
    const actualHash = createHash("sha256").update(stored.body).digest("hex");
    if (actualHash.toLowerCase() !== req.contentHash.toLowerCase()) {
      await this.safeDelete(req.objectKey);
      throw new BadRequestError("Uploaded content hash does not match.", {
        extensions: { expected: req.contentHash, actual: actualHash },
      });
    }

    const collectionIds = await this.validateCollections(ctx, req.collectionIds);
    const now = new Date().toISOString();
    const title = (req.title ?? deriveTitleFromFilename(req.filename)).trim().slice(0, 500);

    const doc = Documents.document.parse({
      id: newDocumentId() as Documents.DocumentId,
      ownerId: ctx.ownerId,
      tenantId: ctx.tenantId,
      title,
      ...(req.author ? { author: req.author } : {}),
      sourceType,
      contentHash: req.contentHash.toLowerCase(),
      storageKey: req.objectKey,
      fileSizeBytes: stored.size,
      ingestStatus: "extracting",
      ingestStepVersion: 1,
      lifecycle: "active",
      isFavorite: false,
      progressPercent: 0,
      collectionIds,
      metadata: { tags: [] },
      createdAt: now,
      updatedAt: now,
    } satisfies Documents.Document);

    const created = await this.repo.create(ctx, doc);
    await this.recordAudit(ctx, "document.registered", created.id, { sourceType });

    // Background processing hook (inline in Sprint 2 — see ProcessingService).
    return this.processing.process(ctx, created, stored.body, req.filename);
  }

  // ── Reads ─────────────────────────────────────────────────────────────
  list(
    ctx: LibraryContext,
    query: Documents.ListDocumentsQuery,
  ): Promise<Documents.DocumentListResponse> {
    return this.repo.list(ctx, query);
  }

  facets(ctx: LibraryContext): Promise<Documents.FacetsResponse> {
    return this.repo.facets(ctx);
  }

  async get(ctx: LibraryContext, id: Documents.DocumentId): Promise<Documents.Document> {
    const doc = await this.repo.findById(ctx, id);
    if (!doc) throw new NotFoundError("Document not found.");
    return doc;
  }

  // ── Mutations ──────────────────────────────────────────────────────────
  async update(
    ctx: LibraryContext,
    id: Documents.DocumentId,
    req: Documents.UpdateDocumentRequest,
  ): Promise<Documents.Document> {
    if (req.collectionIds) await this.validateCollections(ctx, req.collectionIds);
    const updated = await this.repo.patch(ctx, id, {
      ...(req.title !== undefined ? { title: req.title } : {}),
      ...(req.author !== undefined ? { author: req.author } : {}),
      ...(req.language !== undefined ? { language: req.language } : {}),
      ...(req.metadata !== undefined ? { metadata: req.metadata } : {}),
      ...(req.collectionIds !== undefined ? { collectionIds: req.collectionIds } : {}),
    });
    if (!updated) throw new NotFoundError("Document not found.");
    await this.recordAudit(ctx, "document.updated", id);
    return updated;
  }

  async setFavorite(
    ctx: LibraryContext,
    id: Documents.DocumentId,
    favorite: boolean,
  ): Promise<Documents.Document> {
    const updated = await this.repo.patch(ctx, id, { isFavorite: favorite });
    if (!updated) throw new NotFoundError("Document not found.");
    await this.recordAudit(ctx, favorite ? "document.favorited" : "document.unfavorited", id);
    return updated;
  }

  async setLifecycle(
    ctx: LibraryContext,
    id: Documents.DocumentId,
    lifecycle: Documents.Lifecycle,
  ): Promise<Documents.Document> {
    const current = await this.repo.findById(ctx, id);
    if (!current) throw new NotFoundError("Document not found.");
    const updated = await this.repo.patch(ctx, id, { lifecycle });
    if (!updated) throw new NotFoundError("Document not found.");
    await this.recordAudit(ctx, lifecycleAuditAction(current.lifecycle, lifecycle), id);
    return updated;
  }

  async recordOpen(
    ctx: LibraryContext,
    id: Documents.DocumentId,
    req: Documents.RecordOpenRequest,
  ): Promise<Documents.Document> {
    const updated = await this.repo.patch(ctx, id, {
      lastOpenedAt: new Date().toISOString(),
      ...(req.progressPercent !== undefined ? { progressPercent: req.progressPercent } : {}),
    });
    if (!updated) throw new NotFoundError("Document not found.");
    await this.recordAudit(ctx, "document.opened", id);
    return updated;
  }

  /** Hard delete (purge). Removes the row, the source object, and the cover. */
  async hardDelete(ctx: LibraryContext, id: Documents.DocumentId): Promise<void> {
    const removed = await this.repo.hardDelete(ctx, id);
    if (!removed) throw new NotFoundError("Document not found.");
    await this.safeDelete(removed.storageKey);
    if (removed.coverStorageKey) await this.safeDelete(removed.coverStorageKey);
    await this.recordAudit(ctx, "document.deleted", id);
  }

  async getCover(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<{ bytes: Uint8Array; contentType: string }> {
    const doc = await this.repo.findById(ctx, id);
    if (!doc) throw new NotFoundError("Document not found.");
    if (!doc.coverStorageKey) throw new NotFoundError("This document has no cover image.");
    const obj = await this.storage.get(doc.coverStorageKey);
    return { bytes: obj.body, contentType: obj.contentType ?? "image/jpeg" };
  }

  /**
   * Fetch the original source bytes of a document. Used by the Reader
   * shell to feed the format adapter (PDF, EPUB, …). The caller is
   * already authenticated and scoped by `ctx`, so the tenant/owner
   * check is implicit in `findById`.
   *
   * Returns the bytes + the source content-type. We *recompute* the
   * content-type from the document's `sourceType` rather than trusting
   * the storage metadata — `local.driver` may not have persisted the
   * `*.ct` sidecar for older uploads, and the source type → MIME map
   * is canonical.
   */
  async getContent(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<{
    bytes: Uint8Array;
    contentType: string;
    fileSizeBytes: number;
    sourceType: Documents.SourceType;
  }> {
    const doc = await this.repo.findById(ctx, id);
    if (!doc) throw new NotFoundError("Document not found.");
    const obj = await this.storage.get(doc.storageKey);
    const contentType = obj.contentType ?? mimeForSourceType(doc.sourceType);
    return {
      bytes: obj.body,
      contentType,
      fileSizeBytes: doc.fileSizeBytes,
      sourceType: doc.sourceType,
    };
  }

  async activity(
    ctx: LibraryContext,
    id: Documents.DocumentId,
  ): Promise<Audit.DocumentActivityResponse> {
    const doc = await this.repo.findById(ctx, id);
    if (!doc) throw new NotFoundError("Document not found.");
    const items = await this.repo.listAuditForDocument(ctx, id);
    return { items };
  }

  // ── helpers ─────────────────────────────────────────────────────────────
  private async fetchUpload(objectKey: string): Promise<StoredObject> {
    try {
      return await this.storage.get(objectKey);
    } catch (cause) {
      throw new BadRequestError("Upload not found or expired — please upload again.", { cause });
    }
  }

  private async validateCollections(
    ctx: LibraryContext,
    ids: readonly Documents.CollectionId[] | undefined,
  ): Promise<Documents.CollectionId[]> {
    if (!ids || ids.length === 0) return [];
    const unique = [...new Set(ids)];
    for (const cid of unique) {
      const found = await this.repo.findCollection(ctx, cid);
      if (!found) throw new BadRequestError(`Unknown collection: ${cid}`);
    }
    return unique;
  }

  private async safeDelete(objectKey: string): Promise<void> {
    try {
      await this.storage.delete(objectKey);
    } catch (cause) {
      this.logger.warn(`failed to delete orphan object ${objectKey}: ${String(cause)}`);
    }
  }

  private async recordAudit(
    ctx: LibraryContext,
    action: Audit.AuditAction,
    documentId: Documents.DocumentId,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.repo.appendAudit({
      id: newAuditId() as Audit.AuditEntryId,
      tenantId: ctx.tenantId,
      actorId: ctx.ownerId,
      action,
      documentId,
      ...(metadata ? { metadata } : {}),
      createdAt: new Date().toISOString(),
    });
  }
}

/** Map a `sourceType` to the canonical content-type the adapter expects. */
function mimeForSourceType(sourceType: Documents.SourceType): string {
  switch (sourceType) {
    case "pdf":
      return "application/pdf";
    case "epub":
      return "application/epub+zip";
    case "text":
      return "text/plain";
    case "markdown":
      return "text/markdown";
    default:
      return "application/octet-stream";
  }
}

function lifecycleAuditAction(
  from: Documents.Lifecycle,
  to: Documents.Lifecycle,
): Audit.AuditAction {
  if (to === "archived") return "document.archived";
  if (to === "trashed") return "document.trashed";
  // to === "active"
  return from === "trashed" ? "document.restored" : "document.unarchived";
}
