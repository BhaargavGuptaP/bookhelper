import { z } from "zod";

/**
 * Storage — presigned upload contract.
 *
 * ARCHITECTURE.md §11 (and Sprint 1 deliverable "object storage + presigned
 * upload") requires the upload flow to be presigned from the API rather than
 * proxied through it. The client receives a URL + headers, PUTs the blob
 * directly to S3/R2, and then calls back with the resulting object key.
 */

/**
 * Allowed MIME types in Sprint 1. Tightly scoped — we extend this as
 * ingestion grows. Reading the spec: PDF + EPUB are the foundational ones;
 * cover images are accepted for the Library card UI.
 */
export const allowedUploadMime = z.enum([
  "application/pdf",
  "application/epub+zip",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/markdown",
]);
export type AllowedUploadMime = z.infer<typeof allowedUploadMime>;

/** Hard upper bound — server may impose a smaller per-tenant limit. */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MiB

export const presignUploadRequest = z.object({
  /**
   * Client-provided file name. Server treats as untrusted (uses it only to
   * derive an extension/content disposition). The stored key is server-side.
   */
  filename: z.string().min(1).max(512),
  contentType: allowedUploadMime,
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  /**
   * Optional SHA-256 of the payload (hex). Used for idempotency / dedup.
   * The server may reject the eventual PUT if the body's hash mismatches.
   */
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, "must be 64 lower-hex characters")
    .optional(),
});
export type PresignUploadRequest = z.infer<typeof presignUploadRequest>;

export const presignUploadResponse = z.object({
  /** Opaque server-issued object key (the path inside the bucket). */
  objectKey: z.string().min(1),
  /** Presigned URL the client PUTs the bytes to. */
  uploadUrl: z.string().url(),
  /** HTTP method to use against `uploadUrl`. Always PUT for S3/R2. */
  method: z.literal("PUT"),
  /**
   * Headers the client MUST send on the upload — typically Content-Type and,
   * when sha256 is required, x-amz-content-sha256.
   */
  headers: z.record(z.string()),
  /** ISO-8601 expiry of the presigned URL. */
  expiresAt: z.string().datetime(),
});
export type PresignUploadResponse = z.infer<typeof presignUploadResponse>;
