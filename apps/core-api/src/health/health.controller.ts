import { Controller, Get, Inject } from "@nestjs/common";
import { Health } from "@bookhelper/api-contracts";
import { Public } from "../auth/auth.guard.js";
import { DB, type Database } from "../db/db.module.js";
import { STORAGE } from "../storage/storage.module.js";
import type { StorageDriver } from "../storage/storage.types.js";
import { sql } from "drizzle-orm";

/**
 * /healthz (liveness)  — never depends on downstreams.
 * /readyz  (readiness) — checks DB + storage; reports status per dependency.
 *
 * Both routes are `@Public()` so they're reachable without a token (load
 * balancers and Kubernetes probes can't carry one).
 */
@Controller()
export class HealthController {
  private readonly startedAt = Date.now();
  private readonly version = process.env["npm_package_version"] ?? "0.0.0";

  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(STORAGE) private readonly storage: StorageDriver,
  ) {}

  @Public()
  @Get("healthz")
  liveness(): Health.Liveness {
    return Health.liveness.parse({
      status: "ok",
      service: "@bookhelper/core-api",
      version: this.version,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    });
  }

  @Public()
  @Get("readyz")
  async readiness(): Promise<Health.Readiness> {
    const deps: Health.DependencyStatus[] = [];

    // Storage — always present (driver itself is the check).
    deps.push({ name: `storage:${this.storage.name}`, status: "up" });

    // DB — optional in dev; SELECT 1 to verify the pool when configured.
    if (this.db) {
      const t0 = Date.now();
      try {
        await this.db.execute(sql`select 1`);
        deps.push({ name: "postgres", status: "up", latencyMs: Date.now() - t0 });
      } catch (cause) {
        deps.push({
          name: "postgres",
          status: "down",
          message: (cause as Error).message,
        });
      }
    } else {
      deps.push({
        name: "postgres",
        status: "skipped",
        message: "DATABASE_URL not set",
      });
    }

    const allUp = deps.every((d) => d.status !== "down");
    const body: Health.Readiness = {
      status: allUp ? "ready" : "not_ready",
      service: "@bookhelper/core-api",
      version: this.version,
      checkedAt: new Date().toISOString(),
      dependencies: deps,
    };
    return Health.readiness.parse(body);
  }
}
