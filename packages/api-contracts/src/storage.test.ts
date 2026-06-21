import { describe, it, expect } from "vitest";
import {
  presignUploadRequest,
  presignUploadResponse,
  allowedUploadMime,
  MAX_UPLOAD_BYTES,
} from "./storage.js";
import { me, tenantId, userId } from "./auth.js";
import { problem } from "./errors.js";
import { readiness, liveness } from "./health.js";

describe("Storage.presignUploadRequest", () => {
  it("accepts a valid request", () => {
    const parsed = presignUploadRequest.parse({
      filename: "book.pdf",
      contentType: "application/pdf",
      sizeBytes: 1024,
    });
    expect(parsed.filename).toBe("book.pdf");
  });

  it("rejects unsupported MIME types", () => {
    expect(() =>
      presignUploadRequest.parse({
        filename: "x.exe",
        contentType: "application/x-msdownload",
        sizeBytes: 100,
      }),
    ).toThrow();
  });

  it("rejects payloads larger than MAX_UPLOAD_BYTES", () => {
    expect(() =>
      presignUploadRequest.parse({
        filename: "x.pdf",
        contentType: "application/pdf",
        sizeBytes: MAX_UPLOAD_BYTES + 1,
      }),
    ).toThrow();
  });

  it("accepts a lower-hex 64-char sha256, rejects other shapes", () => {
    const good = "a".repeat(64);
    expect(() =>
      presignUploadRequest.parse({
        filename: "x.pdf",
        contentType: "application/pdf",
        sizeBytes: 1,
        sha256: good,
      }),
    ).not.toThrow();
    expect(() =>
      presignUploadRequest.parse({
        filename: "x.pdf",
        contentType: "application/pdf",
        sizeBytes: 1,
        sha256: "tooshort",
      }),
    ).toThrow();
  });
});

describe("Storage.presignUploadResponse", () => {
  it("requires method=PUT and a valid URL", () => {
    const ok = presignUploadResponse.parse({
      objectKey: "users/abc/books/xyz.pdf",
      uploadUrl: "https://example.com/x",
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
    expect(ok.method).toBe("PUT");
  });
});

describe("Auth.me", () => {
  it("parses a valid principal", () => {
    const parsed = me.parse({
      id: "u_1",
      email: "ada@example.com",
      displayName: "A",
      tenantId: "t_1",
      role: "member",
      emailVerified: true,
      createdAt: "2025-01-01T00:00:00.000Z",
    });
    // Brand types narrow the strings but runtime values are still strings.
    expect(parsed.id as unknown as string).toBe("u_1");
  });

  it("brands UserId / TenantId at the schema level", () => {
    expect(userId.parse("u_1") as unknown as string).toBe("u_1");
    expect(tenantId.parse("t_1") as unknown as string).toBe("t_1");
  });

  it("rejects invalid emails", () => {
    expect(() =>
      me.parse({
        id: "u_1",
        email: "not-an-email",
        displayName: "A",
        tenantId: "t_1",
        role: "member",
        emailVerified: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("Errors.problem", () => {
  it("requires title + status, allows extension members", () => {
    const p = problem.parse({
      title: "Not found",
      status: 404,
      detail: "Missing",
      code: "E_NOT_FOUND",
      fieldErrors: { id: ["required"] },
    });
    expect(p.status).toBe(404);
    expect((p as { fieldErrors?: unknown }).fieldErrors).toBeDefined();
  });

  it("rejects an out-of-range status", () => {
    expect(() => problem.parse({ title: "x", status: 99 })).toThrow();
  });
});

describe("Health schemas", () => {
  it("liveness pins status='ok'", () => {
    expect(() =>
      liveness.parse({
        status: "ok",
        service: "core-api",
        version: "0.1.0",
        uptimeSeconds: 0,
      }),
    ).not.toThrow();
  });

  it("readiness lists dependency statuses", () => {
    const r = readiness.parse({
      status: "ready",
      service: "core-api",
      version: "0.1.0",
      checkedAt: "2025-01-01T00:00:00.000Z",
      dependencies: [{ name: "postgres", status: "up", latencyMs: 4 }],
    });
    expect(r.dependencies[0]?.status).toBe("up");
  });
});

describe("AllowedUploadMime", () => {
  it("includes PDF and EPUB by spec", () => {
    expect(allowedUploadMime.options).toContain("application/pdf");
    expect(allowedUploadMime.options).toContain("application/epub+zip");
  });
});
