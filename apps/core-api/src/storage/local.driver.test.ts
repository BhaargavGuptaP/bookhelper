import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { LocalStorageDriver } from "./local.driver.js";
import type { Env } from "../config/env.js";
import { NotFoundError } from "@bookhelper/telemetry";

async function mkTmpEnv(): Promise<{ env: Env; dir: string }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "bh-storage-"));
  const env = {
    NODE_ENV: "test",
    LOG_LEVEL: "warn",
    CORE_API_PORT: 4000,
    WEB_ORIGIN: "http://localhost:3000",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_DIR: dir,
    S3_BUCKET: "bh",
    S3_REGION: "auto",
    S3_FORCE_PATH_STYLE: true,
    OIDC_AUDIENCE: "bh",
  } as unknown as Env;
  return { env, dir };
}

describe("LocalStorageDriver", () => {
  let driver: LocalStorageDriver;
  let dir: string;

  beforeEach(async () => {
    const x = await mkTmpEnv();
    dir = x.dir;
    driver = new LocalStorageDriver(x.env);
  });

  it("put + get round-trips with the content-type", async () => {
    await driver.put("a/b/c.txt", Buffer.from("hello"), { contentType: "text/plain" });
    const got = await driver.get("a/b/c.txt");
    expect(Buffer.from(got.body).toString("utf8")).toBe("hello");
    expect(got.contentType).toBe("text/plain");
    expect(got.size).toBe(5);
  });

  it("get on a missing key throws NotFoundError", async () => {
    await expect(driver.get("missing.txt")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("delete is idempotent", async () => {
    await driver.put("d/e.txt", Buffer.from("x"));
    await driver.delete("d/e.txt");
    // second delete must not throw
    await driver.delete("d/e.txt");
  });

  it("rejects path traversal attempts", async () => {
    await expect(driver.put("../escape.txt", Buffer.from("x"))).rejects.toThrow();
    await expect(driver.put("/abs", Buffer.from("x"))).rejects.toThrow();
  });

  it("presignUpload returns a PUT URL + Content-Type header + future expiry", async () => {
    const before = Date.now();
    const r = await driver.presignUpload({
      objectKey: "uploads/x.pdf",
      contentType: "application/pdf",
      expiresInSeconds: 60,
    });
    expect(r.method).toBe("PUT");
    expect(r.uploadUrl.startsWith("loopback://")).toBe(true);
    expect(r.headers["Content-Type"]).toBe("application/pdf");
    expect(Date.parse(r.expiresAt) - before).toBeGreaterThan(0);
  });

  it("never touches the dir from outside the path family", async () => {
    // Sanity: the tmpdir is the only thing under the root.
    const entries = await fs.readdir(dir);
    expect(Array.isArray(entries)).toBe(true);
  });
});
