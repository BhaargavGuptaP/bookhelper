-- Sprint 2 — Library schema.
-- Mirrors src/db/schema/library.ts. Enums are stored as TEXT so a future
-- source type (docx, web, audio…) is a contract bump with no destructive
-- enum migration.

CREATE TABLE IF NOT EXISTS "documents" (
  "id"                   text PRIMARY KEY,
  "tenant_id"            text NOT NULL,
  "owner_id"             text NOT NULL,
  "title"                text NOT NULL,
  "author"               text,
  "language"             text,
  "source_type"          text NOT NULL,
  "content_hash"         text NOT NULL,
  "storage_key"          text NOT NULL,
  "cover_storage_key"    text,
  "file_size_bytes"      bigint NOT NULL,
  "page_count"           integer,
  "word_count"           integer,
  "duration_seconds"     integer,
  "ingest_status"        text NOT NULL DEFAULT 'queued',
  "ingest_step_version"  integer NOT NULL DEFAULT 1,
  "ingest_error"         text,
  "lifecycle"            text NOT NULL DEFAULT 'active',
  "is_favorite"          boolean NOT NULL DEFAULT false,
  "progress_percent"     real NOT NULL DEFAULT 0,
  "last_opened_at"       timestamptz,
  "metadata"             jsonb NOT NULL DEFAULT '{"tags":[]}'::jsonb,
  "created_at"           timestamptz NOT NULL DEFAULT now(),
  "updated_at"           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "documents_owner_lifecycle_idx"
  ON "documents" ("tenant_id", "owner_id", "lifecycle", "created_at");
CREATE INDEX IF NOT EXISTS "documents_owner_lastopened_idx"
  ON "documents" ("owner_id", "last_opened_at");
CREATE UNIQUE INDEX IF NOT EXISTS "documents_owner_contenthash_uidx"
  ON "documents" ("owner_id", "content_hash");

CREATE TABLE IF NOT EXISTS "collections" (
  "id"          text PRIMARY KEY,
  "tenant_id"   text NOT NULL,
  "owner_id"    text NOT NULL,
  "name"        text NOT NULL,
  "parent_id"   text,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "collections_owner_idx"
  ON "collections" ("tenant_id", "owner_id", "name");

CREATE TABLE IF NOT EXISTS "document_collections" (
  "document_id"    text NOT NULL,
  "collection_id"  text NOT NULL,
  "owner_id"       text NOT NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("document_id", "collection_id")
);
CREATE INDEX IF NOT EXISTS "doc_collections_collection_idx"
  ON "document_collections" ("collection_id");
CREATE INDEX IF NOT EXISTS "doc_collections_document_idx"
  ON "document_collections" ("document_id");

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id"           text PRIMARY KEY,
  "tenant_id"    text NOT NULL,
  "actor_id"     text NOT NULL,
  "action"       text NOT NULL,
  "document_id"  text,
  "metadata"     jsonb,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "audit_document_idx"
  ON "audit_log" ("tenant_id", "document_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_tenant_idx"
  ON "audit_log" ("tenant_id", "created_at");
