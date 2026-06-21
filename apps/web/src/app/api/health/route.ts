import { NextResponse } from "next/server";
import { Health } from "@bookhelper/api-contracts";

/**
 * GET /api/health — liveness for the web app. Lives at the edge / BFF; the
 * `core-api` exposes its own readiness with downstream checks.
 *
 * Returns the canonical Health.liveness shape (api-contracts) — the same
 * envelope every BookHelper service uses.
 */
const startedAt = Date.now();

export function GET(): Response {
  const body: Health.Liveness = {
    status: "ok",
    service: "@bookhelper/web",
    version: process.env["npm_package_version"] ?? "0.0.0",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  };
  // Validate before sending — ensures any drift between code and contract is
  // caught in dev/CI, not in a downstream consumer.
  return NextResponse.json(Health.liveness.parse(body), { status: 200 });
}
