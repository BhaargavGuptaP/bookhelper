import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Documents } from "@bookhelper/api-contracts";
import { ExtractionService } from "../extraction/extraction.service.js";
import { STORAGE } from "../storage/storage.module.js";
import type { StorageDriver } from "../storage/storage.types.js";
import { LibraryRepository, type LibraryContext } from "./library.repository.js";
import { newCoverKey } from "./ids.js";

/**
 * The "background processing" step of ingestion (no AI in Sprint 2).
 *
 * Sprint 2 runs this INLINE (awaited by register) — files are small and
 * metadata extraction is fast. The seam is deliberate: swapping to a real
 * queue later means enqueuing a job that calls `process()` instead of awaiting
 * it here. No other code changes (ARCHITECTURE §6.3 background processing).
 *
 * Failure is non-fatal: a bad file leaves the document in `failed` with an
 * `ingestError` (recoverable in the UI — UX §14), never throwing past register.
 */
@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    private readonly extraction: ExtractionService,
    private readonly repo: LibraryRepository,
    @Inject(STORAGE) private readonly storage: StorageDriver,
  ) {}

  async process(
    ctx: LibraryContext,
    doc: Documents.Document,
    bytes: Uint8Array,
    filename: string,
  ): Promise<Documents.Document> {
    try {
      const result = await this.extraction.extract(doc.sourceType, { bytes, filename });

      let coverStorageKey: string | undefined;
      if (result.cover) {
        const ext = result.cover.contentType.split("/").pop() ?? "img";
        coverStorageKey = newCoverKey(ctx.tenantId, ext);
        await this.storage.put(coverStorageKey, result.cover.bytes, {
          contentType: result.cover.contentType,
        });
      }

      const updated = await this.repo.patch(ctx, doc.id, {
        ingestStatus: "ready",
        ingestError: null,
        // Prefer extracted title only when the source actually provided one.
        ...(result.title ? { title: result.title } : {}),
        ...(result.author ? { author: result.author } : {}),
        ...(result.language ? { language: result.language } : {}),
        ...(result.pageCount !== undefined ? { pageCount: result.pageCount } : {}),
        ...(result.wordCount !== undefined ? { wordCount: result.wordCount } : {}),
        ...(coverStorageKey ? { coverStorageKey } : {}),
        ...(result.description ? { metadata: { description: result.description } } : {}),
      });
      return updated ?? doc;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Extraction failed.";
      this.logger.warn(`extraction failed for ${doc.id}: ${message}`);
      const failed = await this.repo.patch(ctx, doc.id, {
        ingestStatus: "failed",
        ingestError: message.slice(0, 2000),
      });
      return failed ?? doc;
    }
  }
}
