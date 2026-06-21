import { randomUUID } from "node:crypto";

/** Prefixed, opaque, globally-unique ids. The prefix aids debugging + log
 * greppability; the contract treats ids as opaque branded strings. */
export const newDocumentId = (): string => `doc_${randomUUID()}`;
export const newCollectionId = (): string => `col_${randomUUID()}`;
export const newAuditId = (): string => `aud_${randomUUID()}`;

/** Server-issued storage key for an uploaded source. Namespaced by tenant so
 * object-store ACLs / lifecycle rules can be applied per tenant. */
export function newSourceKey(tenantId: string, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 8);
  return `tenants/${tenantId}/sources/${randomUUID()}${safeExt ? `.${safeExt}` : ""}`;
}

/** Server-issued storage key for an extracted cover image. */
export function newCoverKey(tenantId: string, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "img";
  return `tenants/${tenantId}/covers/${randomUUID()}.${safeExt}`;
}
