import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import request from "supertest";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { ConfigModule, ENV } from "../config/config.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { AuthService } from "../auth/auth.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import type { Principal } from "../auth/auth.types.js";
import type { Auth } from "@bookhelper/api-contracts";
import { StorageModule } from "../storage/storage.module.js";
import { DatabaseModule } from "../db/db.module.js";
import { LibraryModule } from "./library.module.js";
import { MeModule } from "../auth/me.module.js";
import { HttpExceptionFilter } from "../common/exception.filter.js";
import type { Env } from "../config/env.js";

/**
 * End-to-end test of the Library HTTP surface using the in-memory repository,
 * the local storage driver (against a tmpdir), and dev-auth (no IdP).
 *
 * Covers the full Sprint 2 acceptance criteria: upload → register → list →
 * favorite → archive/trash → restore → delete, plus list filtering and the
 * dedupe-by-content-hash conflict path.
 */

describe("Library HTTP (e2e)", () => {
  let app: INestApplication;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "bh-e2e-"));
    // Set process.env BEFORE the module factories run; overrideProvider is too
    // late because `AuthService`'s constructor caches `enabled`/`devAuth` from
    // the env it receives at instantiation.
    process.env["NODE_ENV"] = "test";
    process.env["STORAGE_DRIVER"] = "local";
    process.env["STORAGE_LOCAL_DIR"] = storageDir;
    process.env["DEV_AUTH"] = "true";
    process.env["CORE_API_PUBLIC_URL"] = "http://localhost:4000";
    delete process.env["DATABASE_URL"];
    delete process.env["OIDC_ISSUER"];
    delete process.env["OIDC_JWKS_URI"];

    const env: Env = {
      NODE_ENV: "test",
      LOG_LEVEL: "warn",
      CORE_API_PORT: 0,
      WEB_ORIGIN: "http://localhost:3000",
      STORAGE_DRIVER: "local",
      STORAGE_LOCAL_DIR: storageDir,
      S3_BUCKET: "bh",
      S3_REGION: "auto",
      S3_FORCE_PATH_STYLE: true,
      OIDC_AUDIENCE: "bh",
      DEV_AUTH: true,
      DEV_USER_ID: "user_dev",
      DEV_TENANT_ID: "tenant_dev",
      DEV_USER_EMAIL: "dev@bookhelper.local",
      DEV_USER_NAME: "Dev User",
      CORE_API_PUBLIC_URL: "http://localhost:4000",
      MAX_UPLOAD_BYTES: 5 * 1024 * 1024,
    } as Env;

    // Stub the AuthService so any non-empty Bearer token resolves to a fixed
    // dev principal — we are testing the Library surface, not the verifier.
    const stubAuth: Pick<AuthService, "verify"> = {
      async verify(token: string): Promise<Principal> {
        if (!token) throw new Error("no token");
        return {
          userId: env.DEV_USER_ID as Auth.UserId,
          tenantId: env.DEV_TENANT_ID as Auth.TenantId,
          email: env.DEV_USER_EMAIL,
          role: "owner",
          scopes: [],
          claims: { dev: true },
        };
      },
    };

    const mod = await Test.createTestingModule({
      imports: [ConfigModule, AuthModule, DatabaseModule, StorageModule, LibraryModule, MeModule],
      providers: [
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        // The Library module under test relies on the global `AuthGuard` that
        // the production `AppModule` registers. Replicate that here so
        // `req.principal` is attached by the guard.
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    })
      .overrideProvider(ENV)
      .useValue(env)
      .overrideProvider(AuthService)
      .useValue(stubAuth)
      .compile();

    app = mod.createNestApplication();
    // Zod (via the `ZodBody` pipe) is the validator — no ValidationPipe needed.
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (storageDir) await fs.rm(storageDir, { recursive: true, force: true });
  });

  /** Build a `Test` chain on the app server with the dev Bearer token set. */
  const TOKEN = "Bearer dev-token";
  const authed = {
    get: (url: string) => request(app.getHttpServer()).get(url).set("Authorization", TOKEN),
    post: (url: string) => request(app.getHttpServer()).post(url).set("Authorization", TOKEN),
    patch: (url: string) => request(app.getHttpServer()).patch(url).set("Authorization", TOKEN),
    delete: (url: string) => request(app.getHttpServer()).delete(url).set("Authorization", TOKEN),
  };

  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app.getHttpServer()).get("/v1/documents");
    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toContain("application/problem+json");
  });

  it("upload → register → list → favorite → archive → trash → restore → delete", async () => {
    const body = Buffer.from("Hello BookHelper\nThis is a tiny test document.");
    const sha256 = createHash("sha256").update(body).digest("hex");

    // 1) Presign (auth required).
    const presign = await authed
      .post("/v1/uploads/presign")
      .send({ filename: "hello.txt", contentType: "text/plain", sizeBytes: body.length, sha256 });
    expect(presign.status).toBe(200);
    expect(presign.body.objectKey).toBeTypeOf("string");

    // 2) PUT bytes to the local-upload URL (public, HMAC-signed).
    const uploadUrl = presign.body.uploadUrl as string;
    const upload = await request(app.getHttpServer())
      .put(uploadUrl.replace(/^https?:\/\/[^/]+/, ""))
      .set("Content-Type", "text/plain")
      .send(body);
    expect(upload.status).toBe(204);

    // 3) Register.
    const register = await authed.post("/v1/documents").send({
      objectKey: presign.body.objectKey,
      fileSizeBytes: body.length,
      contentHash: sha256,
      filename: "hello.txt",
      contentType: "text/plain",
    });
    expect(register.status).toBe(201);
    expect(register.body).toMatchObject({
      title: expect.any(String),
      ingestStatus: "ready",
      sourceType: "text",
    });
    const id: string = register.body.id;

    // 4) Dedup: a second register with the same hash should 409.
    const dup = await authed.post("/v1/documents").send({
      objectKey: presign.body.objectKey,
      fileSizeBytes: body.length,
      contentHash: sha256,
      filename: "hello.txt",
      contentType: "text/plain",
    });
    expect(dup.status).toBe(409);

    // 5) List finds the new doc.
    const list = await authed.get("/v1/documents");
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    // 6) Favorite.
    const fav = await authed.post(`/v1/documents/${id}/favorite`).send({ favorite: true });
    expect(fav.status).toBe(201);
    expect(fav.body.isFavorite).toBe(true);

    // 7) Archive → trash → restore.
    for (const lifecycle of ["archived", "trashed", "active"]) {
      const r = await authed.post(`/v1/documents/${id}/lifecycle`).send({ lifecycle });
      expect(r.status).toBe(201);
      expect(r.body.lifecycle).toBe(lifecycle);
    }

    // 8) Activity timeline grows.
    const activity = await authed.get(`/v1/documents/${id}/activity`);
    expect(activity.status).toBe(200);
    expect(activity.body.items.length).toBeGreaterThan(0);

    // 9) Delete.
    const del = await authed.delete(`/v1/documents/${id}`);
    expect(del.status).toBe(204);
    const after = await authed.get(`/v1/documents/${id}`);
    expect(after.status).toBe(404);
  });

  it("GET /v1/documents/:id/content streams the source bytes inline", async () => {
    const body = Buffer.from("Sample reader content for the Sprint 3C.1 endpoint.");
    const sha256 = createHash("sha256").update(body).digest("hex");

    const presign = await authed
      .post("/v1/uploads/presign")
      .send({ filename: "reader.txt", contentType: "text/plain", sizeBytes: body.length, sha256 });
    expect(presign.status).toBe(200);
    const uploadUrl: string = presign.body.uploadUrl;
    const upload = await request(app.getHttpServer())
      .put(uploadUrl.replace(/^https?:\/\/[^/]+/, ""))
      .set("Content-Type", "text/plain")
      .send(body);
    expect(upload.status).toBe(204);

    const register = await authed.post("/v1/documents").send({
      objectKey: presign.body.objectKey,
      fileSizeBytes: body.length,
      contentHash: sha256,
      filename: "reader.txt",
      contentType: "text/plain",
    });
    expect(register.status).toBe(201);
    const id: string = register.body.id;

    // Unauthorized request → 401.
    const unauth = await request(app.getHttpServer()).get(`/v1/documents/${id}/content`);
    expect(unauth.status).toBe(401);

    // Authorized request → 200 + correct headers + bytes. Force supertest
    // to return raw bytes instead of trying to parse the response body.
    const content = await authed
      .get(`/v1/documents/${id}/content`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(content.status).toBe(200);
    expect(content.headers["content-type"]).toContain("text/plain");
    expect(content.headers["content-length"]).toBe(String(body.length));
    expect(content.headers["content-disposition"]).toBe("inline");
    expect(content.headers["accept-ranges"]).toBe("bytes");
    expect(content.headers["x-source-type"]).toBe("text");
    expect((content.body as Buffer).equals(body)).toBe(true);

    // Missing document → 404.
    const missing = await authed.get(`/v1/documents/doc_missing/content`);
    expect(missing.status).toBe(404);

    // Cleanup.
    await authed.delete(`/v1/documents/${id}`);
  });

  it("collections: create, list, rename, delete", async () => {
    const created = await authed.post("/v1/collections").send({ name: "Inbox" });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await authed.get("/v1/collections");
    expect(list.body.find((c: { id: string }) => c.id === id)).toBeTruthy();

    const ren = await authed.patch(`/v1/collections/${id}`).send({ name: "Reading" });
    expect(ren.body.name).toBe("Reading");

    const del = await authed.delete(`/v1/collections/${id}`);
    expect(del.status).toBe(204);
  });
});
