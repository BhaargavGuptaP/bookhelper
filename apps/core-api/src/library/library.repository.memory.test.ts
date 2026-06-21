import { describe, it, expect, beforeEach } from "vitest";
import { Documents } from "@bookhelper/api-contracts";
import { InMemoryLibraryRepository } from "./library.repository.memory.js";
import type { LibraryContext } from "./library.repository.js";
import { newDocumentId, newCollectionId } from "./ids.js";

/**
 * The in-memory repository is the canonical observable contract for the
 * Library aggregate (the Drizzle adapter must match). These tests pin the
 * tenant-scoping, filtering, sorting, paging, and audit semantics.
 */

const tenantA = "tenant_a" as unknown as LibraryContext["tenantId"];
const tenantB = "tenant_b" as unknown as LibraryContext["tenantId"];
const userA = "user_a" as unknown as LibraryContext["ownerId"];
const userB = "user_b" as unknown as LibraryContext["ownerId"];

const ctxA: LibraryContext = { tenantId: tenantA, ownerId: userA };
const ctxB: LibraryContext = { tenantId: tenantB, ownerId: userB };

function makeDoc(overrides: Partial<Documents.Document> = {}): Documents.Document {
  const now = new Date().toISOString();
  return Documents.document.parse({
    id: newDocumentId() as Documents.DocumentId,
    ownerId: userA,
    tenantId: tenantA,
    title: "Untitled",
    sourceType: "pdf",
    contentHash: "a".repeat(64),
    storageKey: "tenants/a/sources/x.pdf",
    fileSizeBytes: 100,
    ingestStatus: "ready",
    ingestStepVersion: 1,
    lifecycle: "active",
    isFavorite: false,
    progressPercent: 0,
    collectionIds: [],
    metadata: { tags: [] },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } satisfies Documents.Document);
}

describe("InMemoryLibraryRepository", () => {
  let repo: InMemoryLibraryRepository;

  beforeEach(() => {
    repo = new InMemoryLibraryRepository();
  });

  it("create + findById round-trip; tenant isolation strict", async () => {
    const doc = await repo.create(ctxA, makeDoc({ title: "Hello" }));
    expect(await repo.findById(ctxA, doc.id)).toMatchObject({ title: "Hello" });
    expect(await repo.findById(ctxB, doc.id)).toBeNull();
  });

  it("list filters by lifecycle (default active)", async () => {
    const ts = (n: number) => new Date(2024, 0, n).toISOString();
    await repo.create(
      ctxA,
      makeDoc({ title: "A", contentHash: "1".repeat(64), createdAt: ts(1), updatedAt: ts(1) }),
    );
    await repo.create(
      ctxA,
      makeDoc({
        title: "B",
        contentHash: "2".repeat(64),
        lifecycle: "archived",
        createdAt: ts(2),
        updatedAt: ts(2),
      }),
    );
    const r = await repo.list(ctxA, defaultQuery({}));
    expect(r.items).toHaveLength(1);
    expect(r.items[0]?.title).toBe("A");

    const arch = await repo.list(ctxA, defaultQuery({ lifecycle: "archived" }));
    expect(arch.items).toHaveLength(1);
    expect(arch.items[0]?.title).toBe("B");
  });

  it("list applies q search across title/author/tags/description", async () => {
    await repo.create(
      ctxA,
      makeDoc({
        title: "Domain-Driven Design",
        author: "Evans",
        contentHash: "1".repeat(64),
      }),
    );
    await repo.create(
      ctxA,
      makeDoc({
        title: "Clean Architecture",
        author: "Martin",
        contentHash: "2".repeat(64),
      }),
    );

    const r = await repo.list(ctxA, defaultQuery({ q: "evans" }));
    expect(r.items.map((d) => d.title)).toEqual(["Domain-Driven Design"]);
  });

  it("list sorts and paginates with a deterministic cursor", async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create(
        ctxA,
        makeDoc({
          title: `Doc ${String.fromCharCode(65 + i)}`,
          contentHash: `${i}`.repeat(64),
          createdAt: new Date(2024, 0, i + 1).toISOString(),
          updatedAt: new Date(2024, 0, i + 1).toISOString(),
        }),
      );
    }

    const page1 = await repo.list(
      ctxA,
      defaultQuery({ sortBy: "title", sortOrder: "asc", limit: 2 }),
    );
    expect(page1.items.map((d) => d.title)).toEqual(["Doc A", "Doc B"]);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await repo.list(
      ctxA,
      defaultQuery({
        sortBy: "title",
        sortOrder: "asc",
        limit: 2,
        cursor: page1.nextCursor!,
      }),
    );
    expect(page2.items.map((d) => d.title)).toEqual(["Doc C", "Doc D"]);
  });

  it("favorites + lifecycle transitions update via patch", async () => {
    const d = await repo.create(ctxA, makeDoc());
    const f = await repo.patch(ctxA, d.id, { isFavorite: true });
    expect(f?.isFavorite).toBe(true);
    const a = await repo.patch(ctxA, d.id, { lifecycle: "archived" });
    expect(a?.lifecycle).toBe("archived");
  });

  it("hardDelete returns the removed doc; subsequent get is null", async () => {
    const d = await repo.create(ctxA, makeDoc());
    const removed = await repo.hardDelete(ctxA, d.id);
    expect(removed?.id).toBe(d.id);
    expect(await repo.findById(ctxA, d.id)).toBeNull();
  });

  it("collections: create, list, rename, delete unlinks from documents", async () => {
    const col = await repo.createCollection(ctxA, {
      id: newCollectionId() as Documents.CollectionId,
      name: "Inbox",
    });
    expect((await repo.listCollections(ctxA)).map((c) => c.name)).toEqual(["Inbox"]);
    const d = await repo.create(ctxA, makeDoc({ collectionIds: [col.id] }));
    expect(d.collectionIds).toContain(col.id);
    await repo.deleteCollection(ctxA, col.id);
    const after = await repo.findById(ctxA, d.id);
    expect(after?.collectionIds).toEqual([]);
  });

  it("facets reports lifecycle + favorite counts only on active set", async () => {
    await repo.create(ctxA, makeDoc({ contentHash: "1".repeat(64), isFavorite: true }));
    await repo.create(ctxA, makeDoc({ contentHash: "2".repeat(64), lifecycle: "archived" }));
    await repo.create(ctxA, makeDoc({ contentHash: "3".repeat(64), lifecycle: "trashed" }));
    const f = await repo.facets(ctxA);
    expect(f.active).toBe(1);
    expect(f.archived).toBe(1);
    expect(f.trashed).toBe(1);
    expect(f.favorites).toBe(1);
  });

  it("audit log is per-tenant + per-document, newest first", async () => {
    const d = await repo.create(ctxA, makeDoc());
    await repo.appendAudit({
      id: "aud_1" as never,
      tenantId: tenantA,
      actorId: userA,
      action: "document.registered",
      documentId: d.id,
      createdAt: new Date(2024, 0, 1).toISOString(),
    });
    await repo.appendAudit({
      id: "aud_2" as never,
      tenantId: tenantA,
      actorId: userA,
      action: "document.opened",
      documentId: d.id,
      createdAt: new Date(2024, 0, 2).toISOString(),
    });
    const entries = await repo.listAuditForDocument(ctxA, d.id);
    expect(entries.map((e) => e.action)).toEqual(["document.opened", "document.registered"]);
  });
});

function defaultQuery(
  overrides: Partial<Documents.ListDocumentsQuery> = {},
): Documents.ListDocumentsQuery {
  return Documents.listDocumentsQuery.parse({
    sortBy: "createdAt",
    sortOrder: "desc",
    lifecycle: "active",
    limit: 24,
    ...overrides,
  });
}
