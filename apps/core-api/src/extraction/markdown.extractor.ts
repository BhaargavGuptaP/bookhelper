import { Injectable } from "@nestjs/common";
import type { Documents } from "@bookhelper/api-contracts";
import type { ExtractionInput, ExtractionResult, SourceExtractor } from "./extractor.types.js";
import { decodeUtf8, deriveTitleFromFilename } from "./filename.js";

/** Markdown extractor: title from the first ATX/Setext H1, word count from the
 * de-marked text, and a short description from the first paragraph. */
@Injectable()
export class MarkdownExtractor implements SourceExtractor {
  readonly sourceType: Documents.SourceType = "markdown";

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const raw = decodeUtf8(input.bytes);
    const title = this.findTitle(raw) ?? deriveTitleFromFilename(input.filename);
    const plain = this.stripMarkdown(raw);
    const wordCount = (plain.match(/\S+/g) ?? []).length;
    const description = plain.replace(/\s+/g, " ").trim().slice(0, 280) || undefined;

    return {
      title: title.slice(0, 200),
      wordCount,
      ...(description ? { description } : {}),
    };
  }

  private findTitle(md: string): string | undefined {
    const lines = md.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] ?? "").trim();
      const atx = /^#\s+(.+?)\s*#*$/.exec(line);
      if (atx?.[1]) return atx[1].trim();
      // Setext: a non-empty line followed by `===`.
      const next = (lines[i + 1] ?? "").trim();
      if (line.length > 0 && /^=+$/.test(next)) return line;
    }
    return undefined;
  }

  private stripMarkdown(md: string): string {
    return md
      .replace(/```[\s\S]*?```/g, " ") // fenced code
      .replace(/`[^`]*`/g, " ") // inline code
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
      .replace(/^[#>\-*+]\s+/gm, "") // markers
      .replace(/[*_~]/g, ""); // emphasis
  }
}
