import { Injectable, Inject, Logger } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NotFoundError, InternalError } from "@bookhelper/telemetry";
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
 * S3 / Cloudflare R2 storage driver.
 *
 * Single shape works for both — R2 just sets `STORAGE_DRIVER=s3`,
 * `S3_REGION=auto`, and `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`.
 */
@Injectable()
export class S3StorageDriver implements StorageDriver {
  readonly name = "s3" as const;
  private readonly logger = new Logger(S3StorageDriver.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(@Inject(ENV) env: Env) {
    if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new InternalError(
        "S3 driver selected but S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not set.",
      );
    }
    this.client = new S3Client({
      region: env.S3_REGION,
      ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
    this.bucket = env.S3_BUCKET;
  }

  async put(
    objectKey: ObjectKey,
    body: Uint8Array | Buffer,
    opts: { contentType?: string } = {},
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ...(opts.contentType ? { ContentType: opts.contentType } : {}),
      }),
    );
    this.logger.debug(`put ${objectKey} (${body.byteLength} bytes)`);
  }

  async get(objectKey: ObjectKey): Promise<StoredObject> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
      const obj = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
      const body = obj.Body
        ? new Uint8Array(await obj.Body.transformToByteArray())
        : new Uint8Array(0);
      return {
        body,
        contentType: head.ContentType,
        size: body.byteLength,
      };
    } catch (cause) {
      if (cause instanceof NoSuchKey || (cause as { name?: string })?.name === "NotFound") {
        throw new NotFoundError(`Object not found: ${objectKey}`, { cause });
      }
      throw cause;
    }
  }

  async delete(objectKey: ObjectKey): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }

  async presignUpload(params: PresignUploadParams): Promise<PresignedUpload> {
    const expiresIn = params.expiresInSeconds ?? 300;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.objectKey,
      ContentType: params.contentType,
      ...(params.contentLength !== undefined ? { ContentLength: params.contentLength } : {}),
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    return {
      objectKey: params.objectKey,
      uploadUrl,
      method: "PUT",
      headers: { "Content-Type": params.contentType },
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }
}
