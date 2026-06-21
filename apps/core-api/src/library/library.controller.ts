import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { Documents, Audit } from "@bookhelper/api-contracts";
import { ZodBody } from "../common/zod.pipe.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { Principal } from "../auth/auth.types.js";
import { DocumentsService } from "./documents.service.js";
import type { LibraryContext } from "./library.repository.js";

/**
 * Documents (Library) HTTP surface.
 *
 *   POST   /v1/documents                  → register an uploaded source
 *   GET    /v1/documents                  → list (search/filter/sort/paginate)
 *   GET    /v1/documents/facets           → sidebar counts
 *   GET    /v1/documents/:id              → details
 *   PATCH  /v1/documents/:id              → update metadata / collections
 *   POST   /v1/documents/:id/favorite     → favorite/unfavorite
 *   POST   /v1/documents/:id/lifecycle    → active | archived | trashed
 *   POST   /v1/documents/:id/open         → record "opened" + progress
 *   DELETE /v1/documents/:id              → hard delete (purge)
 *   GET    /v1/documents/:id/cover        → streamed cover image
 *   GET    /v1/documents/:id/activity     → audit timeline
 *
 * Every handler resolves the `LibraryContext` from `req.principal` (AuthGuard
 * + @CurrentUser). All responses are validated by zod at the boundary.
 */
@Controller("v1/documents")
export class LibraryController {
  constructor(private readonly docs: DocumentsService) {}

  // ── List / facets / get ─────────────────────────────────────────────
  @Get()
  async list(
    @CurrentUser() user: Principal,
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<Documents.DocumentListResponse> {
    const parsed = Documents.listDocumentsQuery.parse(normalizeListQuery(query));
    return this.docs.list(ctx(user), parsed);
  }

  @Get("facets")
  async facets(@CurrentUser() user: Principal): Promise<Documents.FacetsResponse> {
    return this.docs.facets(ctx(user));
  }

  @Get(":id")
  async get(@CurrentUser() user: Principal, @Param("id") id: string): Promise<Documents.Document> {
    return this.docs.get(ctx(user), id as Documents.DocumentId);
  }

  // ── Register (completes a presigned upload) ──────────────────────────
  @Post()
  @HttpCode(201)
  async register(
    @CurrentUser() user: Principal,
    @Body(new ZodBody(Documents.registerDocumentRequest)) body: Documents.RegisterDocumentRequest,
  ): Promise<Documents.Document> {
    return this.docs.register(ctx(user), body);
  }

  // ── Mutations ────────────────────────────────────────────────────────
  @Patch(":id")
  async update(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body(new ZodBody(Documents.updateDocumentRequest)) body: Documents.UpdateDocumentRequest,
  ): Promise<Documents.Document> {
    return this.docs.update(ctx(user), id as Documents.DocumentId, body);
  }

  @Post(":id/favorite")
  async favorite(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body(new ZodBody(Documents.setFavoriteRequest)) body: Documents.SetFavoriteRequest,
  ): Promise<Documents.Document> {
    return this.docs.setFavorite(ctx(user), id as Documents.DocumentId, body.favorite);
  }

  @Post(":id/lifecycle")
  async lifecycle(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body(new ZodBody(Documents.setLifecycleRequest)) body: Documents.SetLifecycleRequest,
  ): Promise<Documents.Document> {
    return this.docs.setLifecycle(ctx(user), id as Documents.DocumentId, body.lifecycle);
  }

  @Post(":id/open")
  async open(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body(new ZodBody(Documents.recordOpenRequest)) body: Documents.RecordOpenRequest,
  ): Promise<Documents.Document> {
    return this.docs.recordOpen(ctx(user), id as Documents.DocumentId, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: Principal, @Param("id") id: string): Promise<void> {
    return this.docs.hardDelete(ctx(user), id as Documents.DocumentId);
  }

  // ── Cover (binary) ───────────────────────────────────────────────────
  @Get(":id/cover")
  @Header("Cache-Control", "private, max-age=300")
  async cover(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { bytes, contentType } = await this.docs.getCover(ctx(user), id as Documents.DocumentId);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", bytes.byteLength);
    res.end(Buffer.from(bytes));
  }

  // ── Source bytes (binary) ────────────────────────────────────────────
  /**
   * Stream the document's original source bytes back to the Reader.
   *
   *   GET /v1/documents/:id/content   (auth required)
   *
   * Headers set:
   *   • Content-Type: canonical MIME for the source type
   *   • Content-Length: byte length (lets the browser show progress)
   *   • Content-Disposition: inline — the Reader displays, never downloads
   *   • Cache-Control: private + immutable per docVersion (the bytes are
   *     content-addressed by hash; a new ingest produces a new docVersion,
   *     so client caches stay correct)
   *   • X-Doc-Version + X-Source-Type: handy for the Reader UI logs
   *   • Accept-Ranges: bytes (informational — we serve the full body
   *     in this sprint; ranged reads land with the streaming refactor)
   */
  @Get(":id/content")
  @Header("Cache-Control", "private, max-age=0, must-revalidate")
  async content(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { bytes, contentType, fileSizeBytes, sourceType } = await this.docs.getContent(
      ctx(user),
      id as Documents.DocumentId,
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(fileSizeBytes));
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Source-Type", sourceType);
    // Bytes are already in memory (Sprint 2 contract). When the
    // ingestion pipeline moves to streaming we can switch to NestJS's
    // `StreamableFile` without changing the route surface.
    res.end(Buffer.from(bytes));
  }

  // ── Activity ─────────────────────────────────────────────────────────
  @Get(":id/activity")
  async activity(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
  ): Promise<Audit.DocumentActivityResponse> {
    return this.docs.activity(ctx(user), id as Documents.DocumentId);
  }
}

function ctx(user: Principal): LibraryContext {
  return { tenantId: user.tenantId, ownerId: user.userId };
}

/** Coerce query-string scalars to the shape `listDocumentsQuery` expects. */
function normalizeListQuery(
  q: Record<string, string | string[] | undefined>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...q };
  if (typeof q["limit"] === "string") out["limit"] = Number(q["limit"]);
  if (typeof q["favorite"] === "string") out["favorite"] = q["favorite"] === "true";
  if (typeof q["hasProgress"] === "string") out["hasProgress"] = q["hasProgress"] === "true";
  if (typeof q["sourceTypes"] === "string") {
    out["sourceTypes"] = q["sourceTypes"].split(",").filter(Boolean);
  }
  return out;
}
