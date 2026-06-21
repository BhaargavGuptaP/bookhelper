import { Module } from "@nestjs/common";
import { EXTRACTORS, type SourceExtractor } from "./extractor.types.js";
import { TextExtractor } from "./text.extractor.js";
import { MarkdownExtractor } from "./markdown.extractor.js";
import { PdfExtractor } from "./pdf.extractor.js";
import { EpubExtractor } from "./epub.extractor.js";
import { ExtractionService } from "./extraction.service.js";

/**
 * Extraction module — registers all source extractors and exposes the routing
 * `ExtractionService`. A new format = one extractor class + one line here.
 */
@Module({
  providers: [
    TextExtractor,
    MarkdownExtractor,
    PdfExtractor,
    EpubExtractor,
    {
      provide: EXTRACTORS,
      inject: [TextExtractor, MarkdownExtractor, PdfExtractor, EpubExtractor],
      useFactory: (...extractors: SourceExtractor[]): SourceExtractor[] => extractors,
    },
    ExtractionService,
  ],
  exports: [ExtractionService],
})
export class ExtractionModule {}
