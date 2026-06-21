import { Inject, Injectable } from "@nestjs/common";
import type { Documents } from "@bookhelper/api-contracts";
import {
  EXTRACTORS,
  type ExtractionInput,
  type ExtractionResult,
  type SourceExtractor,
} from "./extractor.types.js";

/** Routes an uploaded source to the extractor registered for its type. */
@Injectable()
export class ExtractionService {
  private readonly byType = new Map<Documents.SourceType, SourceExtractor>();

  constructor(@Inject(EXTRACTORS) extractors: SourceExtractor[]) {
    for (const e of extractors) this.byType.set(e.sourceType, e);
  }

  supports(sourceType: Documents.SourceType): boolean {
    return this.byType.has(sourceType);
  }

  /** Extract metadata + cover. Unknown types (future) yield an empty result
   * rather than throwing — the document is still registered. */
  async extract(
    sourceType: Documents.SourceType,
    input: ExtractionInput,
  ): Promise<ExtractionResult> {
    const extractor = this.byType.get(sourceType);
    if (!extractor) return {};
    return extractor.extract(input);
  }
}
