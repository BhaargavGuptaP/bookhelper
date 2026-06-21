/**
 * Storage abstraction (ARCHITECTURE.md §11).
 *
 * The interface is intentionally small — `put`, `get`, `delete`, and the
 * `presignUpload`/`presignDownload` pair (the only flows the BFF cares about
 * for Sprint 1). Drivers (local + s3) implement this; tests use the local
 * driver against a tmpdir.
 */

export type ObjectKey = string;

export interface PresignedUpload {
  readonly objectKey: ObjectKey;
  readonly uploadUrl: string;
  readonly method: "PUT";
  readonly headers: Readonly<Record<string, string>>;
  readonly expiresAt: string; // ISO-8601
}

export interface PresignUploadParams {
  readonly objectKey: ObjectKey;
  readonly contentType: string;
  /** Optional content length (some drivers can encode it into the policy). */
  readonly contentLength?: number;
  /** Seconds until the URL expires. Defaults to 300 (5 min). */
  readonly expiresInSeconds?: number;
}

export interface StoredObject {
  readonly body: Uint8Array;
  readonly contentType: string | undefined;
  readonly size: number;
}

export interface StorageDriver {
  /** Direct upload (server-side; used by tests and small admin paths). */
  put(
    objectKey: ObjectKey,
    body: Uint8Array | Buffer,
    opts?: { contentType?: string },
  ): Promise<void>;

  /** Fetch the full object (server-side). */
  get(objectKey: ObjectKey): Promise<StoredObject>;

  /** Idempotent delete — succeeds even if the object is absent. */
  delete(objectKey: ObjectKey): Promise<void>;

  /** Issue a presigned PUT URL. */
  presignUpload(params: PresignUploadParams): Promise<PresignedUpload>;

  /** Driver identifier — useful for logs/metrics. */
  readonly name: "local" | "s3";
}
