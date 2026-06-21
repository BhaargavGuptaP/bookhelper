import { z } from "zod";
import { userId, tenantId } from "./auth.js";
import { documentId } from "./documents.js";

/**
 * Audit log — append-only record of significant actions (ARCHITECTURE.md §12).
 *
 * Sprint 2 covers Library actions; we keep the discriminator string-typed and
 * future-extensible (e.g. "reader.opened", "ai.asked", "tutor.session.started").
 */
export const auditAction = z.enum([
  "document.uploaded",
  "document.registered",
  "document.updated",
  "document.favorited",
  "document.unfavorited",
  "document.archived",
  "document.unarchived",
  "document.trashed",
  "document.restored",
  "document.deleted",
  "document.opened",
  "collection.created",
  "collection.renamed",
  "collection.deleted",
  "collection.added_document",
  "collection.removed_document",
]);
export type AuditAction = z.infer<typeof auditAction>;

export const auditEntryId = z.string().min(1).brand("AuditEntryId");
export type AuditEntryId = z.infer<typeof auditEntryId>;

export const auditEntry = z.object({
  id: auditEntryId,
  tenantId: tenantId,
  actorId: userId,
  action: auditAction,
  documentId: documentId.optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type AuditEntry = z.infer<typeof auditEntry>;

export const documentActivityResponse = z.object({
  items: z.array(auditEntry),
});
export type DocumentActivityResponse = z.infer<typeof documentActivityResponse>;
