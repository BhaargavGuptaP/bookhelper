import { Injectable } from "@nestjs/common";
import type { Documents, Audit } from "@bookhelper/api-contracts";
import { BadRequestError, NotFoundError } from "@bookhelper/telemetry";
import { LibraryRepository, type LibraryContext } from "./library.repository.js";
import { newAuditId, newCollectionId } from "./ids.js";

/** Collections application service (tenant-scoped). */
@Injectable()
export class CollectionsService {
  constructor(private readonly repo: LibraryRepository) {}

  list(ctx: LibraryContext): Promise<Documents.Collection[]> {
    return this.repo.listCollections(ctx);
  }

  async create(
    ctx: LibraryContext,
    req: Documents.CreateCollectionRequest,
  ): Promise<Documents.Collection> {
    if (req.parentId) {
      const parent = await this.repo.findCollection(ctx, req.parentId);
      if (!parent) throw new BadRequestError(`Unknown parent collection: ${req.parentId}`);
    }
    const created = await this.repo.createCollection(ctx, {
      id: newCollectionId() as Documents.CollectionId,
      name: req.name,
      ...(req.parentId ? { parentId: req.parentId } : {}),
    });
    await this.audit(ctx, "collection.created", created.id);
    return created;
  }

  async rename(
    ctx: LibraryContext,
    id: Documents.CollectionId,
    req: Documents.RenameCollectionRequest,
  ): Promise<Documents.Collection> {
    const updated = await this.repo.renameCollection(ctx, id, req.name);
    if (!updated) throw new NotFoundError("Collection not found.");
    await this.audit(ctx, "collection.renamed", id);
    return updated;
  }

  async delete(ctx: LibraryContext, id: Documents.CollectionId): Promise<void> {
    const ok = await this.repo.deleteCollection(ctx, id);
    if (!ok) throw new NotFoundError("Collection not found.");
    await this.audit(ctx, "collection.deleted", id);
  }

  private async audit(
    ctx: LibraryContext,
    action: Audit.AuditAction,
    collectionId: string,
  ): Promise<void> {
    await this.repo.appendAudit({
      id: newAuditId() as Audit.AuditEntryId,
      tenantId: ctx.tenantId,
      actorId: ctx.ownerId,
      action,
      metadata: { collectionId },
      createdAt: new Date().toISOString(),
    });
  }
}
