import { Injectable } from "@nestjs/common";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Signs/verifies tokens for the LOCAL presigned-upload mirror.
 *
 * In production the S3/R2 driver issues real presigned URLs and this is never
 * used. In dev, the local driver has no native presigning, so the API exposes
 * a `PUT /v1/storage/local-upload` route guarded by an HMAC token issued at
 * presign time. The signing key is per-process random — sufficient because the
 * route is dev-only and tokens are short-lived (minutes).
 */
@Injectable()
export class UploadTokenService {
  private readonly key = randomBytes(32);

  sign(objectKey: string, contentType: string, expiresAtISO: string): string {
    return createHmac("sha256", this.key)
      .update(`${objectKey}\n${contentType}\n${expiresAtISO}`)
      .digest("hex");
  }

  verify(objectKey: string, contentType: string, expiresAtISO: string, sig: string): boolean {
    const expiresAt = Date.parse(expiresAtISO);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
    const expected = this.sign(objectKey, contentType, expiresAtISO);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(sig, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
