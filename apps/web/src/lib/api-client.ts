import { publicEnv } from "~/env";
import type { Auth, Documents, Audit, Storage } from "@bookhelper/api-contracts";

/**
 * Tiny typed API client for the core-api.
 *
 * Sprint 2 is single-tenant dev so we ship a fixed Bearer token in the client
 * — replaced by the SSO flow in a later sprint. Centralizing it here means
 * the upgrade is one file. Every response is parsed into the contract types
 * by the *caller* (the hooks below) — this client just speaks HTTP + JSON.
 */

const BASE = publicEnv.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
const TOKEN =
  (typeof process !== "undefined" ? process.env["NEXT_PUBLIC_DEV_TOKEN"] : undefined) ??
  "dev-token";

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly [k: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails,
    message?: string,
  ) {
    super(message ?? problem.detail ?? problem.title ?? `HTTP ${status}`);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  readonly body?: unknown;
  readonly query?: Record<string, string | number | boolean | undefined | readonly string[]>;
  readonly signal?: AbortSignal;
  /** Override headers (used by the upload PUT). */
  readonly headers?: Record<string, string>;
  /** Skip the JSON parse (used for binary endpoints). */
  readonly raw?: boolean;
  /** Don't attach the Bearer token (used for presigned uploads). */
  readonly skipAuth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : BASE + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        if (v.length > 0) url.searchParams.set(k, v.join(","));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.body && !(opts.body instanceof Blob || opts.body instanceof ArrayBuffer)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(opts.skipAuth ? {} : { Authorization: `Bearer ${TOKEN}` }),
    ...opts.headers,
  };

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body:
      opts.body === undefined
        ? undefined
        : opts.body instanceof Blob || opts.body instanceof ArrayBuffer
          ? (opts.body as BodyInit)
          : JSON.stringify(opts.body),
    signal: opts.signal,
    credentials: "include",
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let problem: ProblemDetails;
    try {
      problem = (await res.json()) as ProblemDetails;
    } catch {
      problem = {
        type: "about:blank",
        title: res.statusText || "Request failed",
        status: res.status,
      };
    }
    throw new ApiError(res.status, problem);
  }

  if (opts.raw) return (await res.arrayBuffer()) as unknown as T;
  return (await res.json()) as T;
}

/** SHA-256 of a Blob, hex-encoded — matches the server's content-hash format. */
export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ─── Typed surface — every method maps to a controller route ─── */

export const api = {
  async me(): Promise<Auth.Me> {
    return request<Auth.Me>("/v1/me");
  },

  documents: {
    list(
      query: Partial<Documents.ListDocumentsQuery>,
      signal?: AbortSignal,
    ): Promise<Documents.DocumentListResponse> {
      return request("/v1/documents", { query: query as never, signal });
    },
    facets(signal?: AbortSignal): Promise<Documents.FacetsResponse> {
      return request("/v1/documents/facets", { signal });
    },
    get(id: string, signal?: AbortSignal): Promise<Documents.Document> {
      return request(`/v1/documents/${id}`, { signal });
    },
    register(body: Documents.RegisterDocumentRequest): Promise<Documents.Document> {
      return request("/v1/documents", { method: "POST", body });
    },
    update(id: string, body: Documents.UpdateDocumentRequest): Promise<Documents.Document> {
      return request(`/v1/documents/${id}`, { method: "PATCH", body });
    },
    favorite(id: string, favorite: boolean): Promise<Documents.Document> {
      return request(`/v1/documents/${id}/favorite`, { method: "POST", body: { favorite } });
    },
    lifecycle(id: string, lifecycle: Documents.Lifecycle): Promise<Documents.Document> {
      return request(`/v1/documents/${id}/lifecycle`, {
        method: "POST",
        body: { lifecycle },
      });
    },
    open(id: string, body: Documents.RecordOpenRequest = {}): Promise<Documents.Document> {
      return request(`/v1/documents/${id}/open`, { method: "POST", body });
    },
    delete(id: string): Promise<void> {
      return request(`/v1/documents/${id}`, { method: "DELETE" });
    },
    activity(id: string): Promise<Audit.DocumentActivityResponse> {
      return request(`/v1/documents/${id}/activity`);
    },
    coverUrl(id: string): string {
      return `${BASE}/v1/documents/${id}/cover`;
    },
    /** Stream the document's original source bytes (Reader content). */
    content(id: string, signal?: AbortSignal): Promise<ArrayBuffer> {
      return request<ArrayBuffer>(`/v1/documents/${id}/content`, { raw: true, signal });
    },
  },

  collections: {
    list(): Promise<Documents.Collection[]> {
      return request("/v1/collections");
    },
    create(body: Documents.CreateCollectionRequest): Promise<Documents.Collection> {
      return request("/v1/collections", { method: "POST", body });
    },
    rename(id: string, name: string): Promise<Documents.Collection> {
      return request(`/v1/collections/${id}`, { method: "PATCH", body: { name } });
    },
    delete(id: string): Promise<void> {
      return request(`/v1/collections/${id}`, { method: "DELETE" });
    },
  },

  uploads: {
    presign(body: Storage.PresignUploadRequest): Promise<Storage.PresignUploadResponse> {
      return request("/v1/uploads/presign", { method: "POST", body });
    },
    /** PUT bytes to the (server-issued) signed URL. Bypasses Bearer auth. */
    put(
      url: string,
      body: Blob,
      headers: Record<string, string>,
      onProgress?: (loaded: number, total: number) => void,
    ): Promise<void> {
      // Use XHR for progress — fetch + ReadableStream upload progress isn't
      // universally supported yet (Chrome 105+, Safari TP).
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
        if (onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded, e.total);
          };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else
            reject(
              new ApiError(xhr.status, {
                type: "about:blank",
                title: xhr.statusText || "Upload failed",
                status: xhr.status,
              }),
            );
        };
        xhr.onerror = () =>
          reject(
            new ApiError(0, {
              type: "about:blank",
              title: "Network error during upload",
              status: 0,
            }),
          );
        xhr.send(body);
      });
    },
  },
};
