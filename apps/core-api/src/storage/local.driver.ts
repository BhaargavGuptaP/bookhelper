import { Injectable, Inject, Logger } from "@nestjs/common";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NotFoundError } from "@bookhelper/telemetry";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";
import type {
  PresignUploadParams,
  PresignedUpload,
  StorageDriver,
  StoredObject,
  ObjectKey,
} from "./storage.types.js";

/**
 * Local filesystem storage driver — for dev and tests.
 *
 * "Presign" here is a stub: we return a `loopback://` URL the BFF/tests can
 * use, plus an HMAC-signed token so the local upload route can verify
 * authenticity. In dev the actual upload endpoint will be wired in the next
 * sprint; for Sprint 1 we only need a contract-shaped response.
 */
@Injectable()
export class LocalStorageDriver implements StorageDriver {
  readonly name = "local" as const;
  private readonly logger = new Logger(LocalStorageDriver.name);
  private readonly root: string;
  private readonly signingKey: string;

  constructor(@Inject(ENV) env: Env) {
    this.root = path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR);
    // Stable per-process key — fine for dev; never used in prod (s3 driver).
    this.signingKey = crypto.createHash("sha256").update(`local:${this.root}`).digest("hex");
  }

  async put(
    objectKey: ObjectKey,
    body: Uint8Array | Buffer,
    opts: { contentType?: string } = {},
  ): Promise<void> {
    const full = this.resolve(objectKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
    if (opts.contentType) {
      await fs.writeFile(full + ".ct", opts.contentType, "utf8");
    }
    this.logger.debug(`put ${objectKey} (${body.byteLength} bytes)`);
  }

  async get(objectKey: ObjectKey): Promise<StoredObject> {
    const full = this.resolve(objectKey);
    try {
      const [body, ct] = await Promise.all([
        fs.readFile(full),
        fs.readFile(full + ".ct", "utf8").catch(() => undefined),
      ]);
      return {
        body: new Uint8Array(body),
        contentType: ct,
        size: body.byteLength,
      };
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException)?.code === "ENOENT") {
        throw new NotFoundError(`Object not found: ${objectKey}`, { cause });
      }
      throw cause;
    }
  }

  async delete(objectKey: ObjectKey): Promise<void> {
    const full = this.resolve(objectKey);
    await fs.rm(full, { force: true });
    await fs.rm(full + ".ct", { force: true });
  }

  async presignUpload(params: PresignUploadParams): Promise<PresignedUpload> {
    const expiresInSeconds = params.expiresInSeconds ?? 300;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const expiresAtISO = expiresAt.toISOString();

    const token = crypto
      .createHmac("sha256", this.signingKey)
      .update(`${params.objectKey}\n${params.contentType}\n${expiresAtISO}`)
      .digest("hex");

    // The local "upload URL" is a loopback the BFF/tests recognise. The
    // (planned) PUT handler at /v1/storage/local/upload verifies the token.
    const uploadUrl = `loopback://core-api/v1/storage/local/upload?token=${token}`;

    return {
      objectKey: params.objectKey,
      uploadUrl,
      method: "PUT",
      headers: { "Content-Type": params.contentType },
      expiresAt: expiresAtISO,
    };
  }

  /**
   * Sanitize the key and resolve to a path that cannot escape `root`.
   * Throws on any attempted traversal — a defense-in-depth check beyond the
   * higher-level zod validation.
   */
  private resolve(objectKey: ObjectKey): string {
    if (
      !objectKey ||
      objectKey.includes("\0") ||
      objectKey.startsWith("/") ||
      objectKey.includes("..")
    ) {
      throw new Error(`Invalid object key: ${objectKey}`);
    }
    const full = path.resolve(this.root, objectKey);
    if (!full.startsWith(this.root + path.sep) && full !== this.root) {
      throw new Error(`Object key escapes storage root: ${objectKey}`);
    }
    return full;
  }
}
