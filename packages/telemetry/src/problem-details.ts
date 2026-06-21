/**
 * RFC 9457 — Problem Details for HTTP APIs.
 * https://www.rfc-editor.org/rfc/rfc9457
 *
 * The single error wire-format across BookHelper services. The web BFF, the
 * core API, and (eventually) the AI gateway all emit this shape on failure.
 */

/** Stable type identifier — a URI reference. */
export type ProblemType = string;

/** Base URI under which our typed problems are namespaced. */
export const problemTypeBase = "https://bookhelper.app/problems/" as const;

/**
 * The RFC 9457 envelope. The spec allows arbitrary "extension members" — we
 * keep them inside `extensions` (instead of arbitrary top-level keys) for
 * predictability across consumers.
 */
export interface ProblemDetailsInit {
  /** A URI identifying the problem type. Defaults to "about:blank". */
  readonly type?: ProblemType;
  /** Short, human-readable summary. */
  readonly title: string;
  /** HTTP status code (also written to the response status line). */
  readonly status: number;
  /** Detailed, human-readable explanation specific to this occurrence. */
  readonly detail?: string;
  /** URI that identifies the specific occurrence (e.g. request id). */
  readonly instance?: string;
  /** Stable, machine-readable code your client switches on. */
  readonly code?: string;
  /** Arbitrary structured context. JSON-serializable only. */
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export class ProblemDetails implements ProblemDetailsInit {
  readonly type: ProblemType;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly code?: string;
  readonly extensions: Readonly<Record<string, unknown>>;

  constructor(init: ProblemDetailsInit) {
    this.type = init.type ?? "about:blank";
    this.title = init.title;
    this.status = init.status;
    if (init.detail !== undefined) this.detail = init.detail;
    if (init.instance !== undefined) this.instance = init.instance;
    if (init.code !== undefined) this.code = init.code;
    this.extensions = init.extensions ?? {};
  }

  /**
   * Serialize to the wire JSON. Extension members are FLATTENED onto the
   * top-level object (per RFC 9457 §3.2), but we keep them grouped in
   * memory for ergonomics.
   */
  toJSON(): Record<string, unknown> {
    const out: Record<string, unknown> = {
      type: this.type,
      title: this.title,
      status: this.status,
    };
    if (this.detail !== undefined) out["detail"] = this.detail;
    if (this.instance !== undefined) out["instance"] = this.instance;
    if (this.code !== undefined) out["code"] = this.code;
    for (const [k, v] of Object.entries(this.extensions)) {
      // Don't allow extensions to clobber reserved members.
      if (k in out) continue;
      out[k] = v;
    }
    return out;
  }
}

/** Type-guard for incoming payloads (BFF -> caller, tests). */
export function isProblemDetails(value: unknown): value is ProblemDetailsInit {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["title"] === "string" &&
    typeof v["status"] === "number" &&
    (v["type"] === undefined || typeof v["type"] === "string")
  );
}
