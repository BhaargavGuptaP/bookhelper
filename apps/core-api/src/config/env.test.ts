import { describe, it, expect } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv()", () => {
  it("returns sane defaults when env is empty", () => {
    const env = loadEnv({} as NodeJS.ProcessEnv);
    expect(env.NODE_ENV).toBe("development");
    expect(env.CORE_API_PORT).toBe(4000);
    expect(env.STORAGE_DRIVER).toBe("local");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("coerces CORE_API_PORT from string", () => {
    const env = loadEnv({ CORE_API_PORT: "5000" } as NodeJS.ProcessEnv);
    expect(env.CORE_API_PORT).toBe(5000);
  });

  it("rejects invalid CORE_API_PORT", () => {
    expect(() => loadEnv({ CORE_API_PORT: "not-a-port" } as NodeJS.ProcessEnv)).toThrow(
      /Invalid environment/,
    );
  });

  it("requires DATABASE_URL + OIDC in production", () => {
    expect(() => loadEnv({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(
      /OIDC|DATABASE_URL/,
    );
  });

  it("accepts a postgres:// URL", () => {
    const env = loadEnv({
      DATABASE_URL: "postgres://u:p@localhost:5432/bh",
    } as NodeJS.ProcessEnv);
    expect(env.DATABASE_URL).toMatch(/^postgres:\/\//);
  });
});
