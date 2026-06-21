"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Documents, Storage } from "@bookhelper/api-contracts";
import { api, sha256Hex } from "./api-client";

/**
 * Library data layer — TanStack Query hooks that wrap the API client.
 *
 * One source of truth per cache key, optimistic updates for the
 * favorite/lifecycle mutations (UX §14 "Instant", with rollback on error).
 */

// ── Keys ──────────────────────────────────────────────────────────────
export const qk = {
  me: () => ["me"] as const,
  facets: () => ["facets"] as const,
  list: (q: Partial<Documents.ListDocumentsQuery>) => ["documents", "list", q] as const,
  doc: (id: string) => ["documents", id] as const,
  activity: (id: string) => ["documents", id, "activity"] as const,
  collections: () => ["collections"] as const,
};

function invalidateLibrary(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: ["documents"] });
  qc.invalidateQueries({ queryKey: ["facets"] });
  qc.invalidateQueries({ queryKey: ["collections"] });
}

// ── Reads ─────────────────────────────────────────────────────────────
export function useDocuments(query: Partial<Documents.ListDocumentsQuery>) {
  return useQuery({
    queryKey: qk.list(query),
    queryFn: ({ signal }) => api.documents.list(query, signal),
  });
}

export function useFacets() {
  return useQuery({ queryKey: qk.facets(), queryFn: ({ signal }) => api.documents.facets(signal) });
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: qk.doc(id ?? ""),
    queryFn: ({ signal }) => api.documents.get(id!, signal),
    enabled: Boolean(id),
  });
}

export function useActivity(id: string | null) {
  return useQuery({
    queryKey: qk.activity(id ?? ""),
    queryFn: () => api.documents.activity(id!),
    enabled: Boolean(id),
  });
}

export function useCollections() {
  return useQuery({ queryKey: qk.collections(), queryFn: () => api.collections.list() });
}

// ── Mutations (with optimistic UI where meaningful) ───────────────────
export function useFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      api.documents.favorite(id, favorite),
    onMutate: async ({ id, favorite }) => {
      await qc.cancelQueries({ queryKey: ["documents"] });
      patchDocs(qc, id, (d) => ({ ...d, isFavorite: favorite }));
    },
    onSettled: () => invalidateLibrary(qc),
  });
}

export function useLifecycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lifecycle }: { id: string; lifecycle: Documents.Lifecycle }) =>
      api.documents.lifecycle(id, lifecycle),
    onMutate: async ({ id, lifecycle }) => {
      await qc.cancelQueries({ queryKey: ["documents"] });
      patchDocs(qc, id, (d) => ({ ...d, lifecycle }));
    },
    onSettled: () => invalidateLibrary(qc),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Documents.UpdateDocumentRequest }) =>
      api.documents.update(id, body),
    onSettled: () => invalidateLibrary(qc),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.documents.delete(id),
    onSettled: () => invalidateLibrary(qc),
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Documents.CreateCollectionRequest) => api.collections.create(body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.collections() });
      qc.invalidateQueries({ queryKey: qk.facets() });
    },
  });
}

export function useRenameCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.collections.rename(id, name),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.collections() }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.collections.delete(id),
    onSettled: () => invalidateLibrary(qc),
  });
}

// ── Upload ────────────────────────────────────────────────────────────
export interface UploadProgress {
  readonly loaded: number;
  readonly total: number;
}

export interface UploadInput {
  readonly file: File;
  readonly onProgress?: (p: UploadProgress) => void;
  readonly collectionIds?: readonly Documents.CollectionId[];
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, onProgress, collectionIds }: UploadInput) => {
      const sha256 = await sha256Hex(file);
      const contentType = inferContentType(file);
      const presign = await api.uploads.presign({
        filename: file.name,
        contentType: contentType as Storage.AllowedUploadMime,
        sizeBytes: file.size,
        sha256,
      });
      await api.uploads.put(presign.uploadUrl, file, presign.headers, (loaded, total) =>
        onProgress?.({ loaded, total }),
      );
      return api.documents.register({
        objectKey: presign.objectKey,
        fileSizeBytes: file.size,
        contentHash: sha256,
        filename: file.name,
        contentType: contentType,
        ...(collectionIds && collectionIds.length > 0
          ? { collectionIds: collectionIds as Documents.CollectionId[] }
          : {}),
      });
    },
    onSettled: () => invalidateLibrary(qc),
  });
}

// ── helpers ───────────────────────────────────────────────────────────
function patchDocs(
  qc: QueryClient,
  id: string,
  patch: (d: Documents.Document) => Documents.Document,
): void {
  // Update any list pages that contain the doc.
  qc.setQueriesData<Documents.DocumentListResponse>({ queryKey: ["documents", "list"] }, (cur) => {
    if (!cur) return cur;
    const next = cur.items.map((d) => (d.id === id ? patch(d) : d));
    return { ...cur, items: next };
  });
  // And the single-doc cache if present.
  qc.setQueryData<Documents.Document | undefined>(qk.doc(id), (cur) => (cur ? patch(cur) : cur));
}

/** Map a File's reported MIME (or filename) into an `AllowedUploadMime`. */
function inferContentType(file: File): string {
  const t = file.type || "";
  if (t === "application/pdf" || t === "application/epub+zip") return t;
  if (t === "text/markdown" || t === "text/x-markdown") return "text/markdown";
  if (t.startsWith("text/")) return "text/plain";
  if (t.startsWith("image/")) return t;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".epub")) return "application/epub+zip";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "text/markdown";
  if (lower.endsWith(".txt")) return "text/plain";
  return "text/plain";
}
