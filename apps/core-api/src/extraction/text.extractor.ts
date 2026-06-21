import { Injectable } from "@nestjs/common";
import type { Documents } from "@bookhelper/api-contracts";
import type { ExtractionInput, ExtractionResult, SourceExtractor } from "./extractor.types.js";
import { decodeUtf8, deriveTitleFromFilename } from "./filename.js";

/** Plain-text extractor: title from the first non-empty line, word count,
 * and a short description. No cover. */
@Injectable()
export class TextExtractor implements SourceExtractor {
  readonly sourceType: Documents.SourceType = "text";

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const text = decodeUtf8(input.bytes);
    const firstLine = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    const wordCount = (text.match(/\S+/g) ?? []).length;
    const description = text.replace(/\s+/g, " ").trim().slice(0, 280) || undefined;

    return {
      title: (firstLine ? firstLine.slice(0, 200) : deriveTitleFromFilename(input.filename)).trim(),
      wordCount,
      ...(description ? { description } : {}),
    };
  }
}
