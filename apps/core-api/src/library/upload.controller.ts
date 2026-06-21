import { Body, Controller, Get, HttpCode, Inject, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { randomUUID } from "node:crypto";
import { Storage } from "@bookhelper/api-contracts";
import { BadRequestError, PayloadTooLargeError, UnauthorizedError } from "@bookhelper/telemetry";
import { ZodBody } from "../common/zod.pipe.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Public } from "../auth/auth.guard.js";
import type { Principal } from "../auth/auth.types.js";
import { STORAGE } from "../storage/storage.module.js";
import type { StorageDriver } from "../storage/storage.types.js";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";
import { UploadTokenService } from "./upload-token.service.js";
import { extForSource } from "./source-type.js";
import { sourceTypeForMime } from "./source-type.js";
import { newSourceKey } from "./ids.js";

/**
 * Upload HTTP surface.
 *
 *   POST /v1/uploads/presign            → issue an upload URL + headers
 *   PUT  /v1/storage/local-upload       → DEV-only receiver for the local
 *                                         driver (public; HMAC-token-guarded)
 *
 * Production uses the S3/R2 driver, whose `presignUpload` returns a real
 * presigned PUT URL — the local-upload route is never invoked. In dev the
 * local driver returns an `https://{api}/v1/storage/local-upload?...` URL the
 * web client PUTs to, and the receiver verifies the HMAC token before
 * writing bytes through the same `StorageDriver` interface.
 */
@Controller()
export class UploadController {
  constructor(
    @Inject(STORAGE) private readonly storage: StorageDriver,
    @Inject(ENV) private readonly env: Env,
    private readonly tokens: UploadTokenService,
  ) {}

  @Post("v1/uploads/presign")
  @HttpCode(200)
  async presign(
    @CurrentUser() user: Principal,
    @Body(new ZodBody(Storage.presignUploadRequest)) body: Storage.PresignUploadRequest,
  ): Promise<Storage.PresignUploadResponse> {
    if (body.sizeBytes > this.env.MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeError("File exceeds the maximum upload size.");
    }
    // Map MIME → ext for the key (covers are accepted but not registerable).
    const ext = isImageMime(body.contentType)
      ? body.contentType.split("/").pop()!
      : extForSource(sourceTypeForMime(body.contentType));

    const objectKey = newSourceKey(user.tenantId, ext);
    const presigned = await this.storage.presignUpload({
      objectKey,
      contentType: body.contentType,
      contentLength: body.sizeBytes,
      expiresInSeconds: 600,
    });

    // For the local driver: replace the loopback URL with a real, signed,
    // browser-reachable URL pointing at THIS process.
    let uploadUrl = presigned.uploadUrl;
    if (this.storage.name === "local") {
      const sig = this.tokens.sign(objectKey, body.contentType, presigned.expiresAt);
      const u = new URL("/v1/storage/local-upload", this.env.CORE_API_PUBLIC_URL);
      u.searchParams.set("key", objectKey);
      u.searchParams.set("ct", body.contentType);
      u.searchParams.set("exp", presigned.expiresAt);
      u.searchParams.set("sig", sig);
      uploadUrl = u.toString();
    }

    return {
      objectKey,
      uploadUrl,
      method: "PUT",
      headers: presigned.headers,
      expiresAt: presigned.expiresAt,
    };
  }

  /**
   * DEV upload receiver. Public route (no Authorization header — the browser's
   * fetch() to the presigned URL cannot include one without violating S3
   * semantics). Authenticity is enforced by the HMAC token issued at presign.
   *
   * Body is read with `req.on('data')` so we never need a body parser pipeline
   * specific to binary uploads — and we still bound it at MAX_UPLOAD_BYTES.
   */
  @Put("v1/storage/local-upload")
  @Public()
  @HttpCode(204)
  async localUpload(
    @Req() req: Request,
    @Query("key") key: string,
    @Query("ct") contentType: string,
    @Query("exp") expiresAt: string,
    @Query("sig") sig: string,
  ): Promise<void> {
    if (this.storage.name !== "local") {
      throw new UnauthorizedError("Local upload receiver is disabled.");
    }
    if (!key || !contentType || !expiresAt || !sig) {
      throw new BadRequestError("Missing upload parameters.");
    }
    if (!this.tokens.verify(key, contentType, expiresAt, sig)) {
      throw new UnauthorizedError("Invalid or expired upload token.");
    }

    const body = await readBody(req, this.env.MAX_UPLOAD_BYTES);
    await this.storage.put(key, body, { contentType });
  }

  @Get("v1/uploads/health")
  health(): { ok: true; driver: "local" | "s3"; uploadId: string } {
    return { ok: true, driver: this.storage.name, uploadId: randomUUID() };
  }
}

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

/** Buffer a request body up to `max` bytes. Throws `PayloadTooLargeError`
 * the moment we observe more bytes — never accumulates beyond it. */
function readBody(req: Request, max: number): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > max) {
        req.destroy();
        reject(new PayloadTooLargeError("Upload exceeds the maximum size."));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks, total)));
    req.on("error", (err) => reject(err));
  });
}
