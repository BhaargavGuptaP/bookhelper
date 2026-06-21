import { Module } from "@nestjs/common";
import { DB, type Database } from "../db/db.module.js";
import { ExtractionModule } from "../extraction/extraction.module.js";
import { LibraryRepository } from "./library.repository.js";
import { InMemoryLibraryRepository } from "./library.repository.memory.js";
import { DrizzleLibraryRepository } from "./library.repository.drizzle.js";
import { DocumentsService } from "./documents.service.js";
import { CollectionsService } from "./collections.service.js";
import { ProcessingService } from "./processing.service.js";
import { UploadTokenService } from "./upload-token.service.js";
import { LibraryController } from "./library.controller.js";
import { CollectionsController } from "./collections.controller.js";
import { UploadController } from "./upload.controller.js";

/**
 * Library module — the Sprint 2 deliverable.
 *
 * Wires the application services + controllers, and selects the Library
 * repository adapter at boot:
 *   • DATABASE_URL set → DrizzleLibraryRepository (Postgres).
 *   • DATABASE_URL absent → InMemoryLibraryRepository (dev / tests).
 *
 * The service layer never knows which adapter is bound.
 */
@Module({
  imports: [ExtractionModule],
  controllers: [LibraryController, CollectionsController, UploadController],
  providers: [
    DocumentsService,
    CollectionsService,
    ProcessingService,
    UploadTokenService,
    {
      provide: LibraryRepository,
      inject: [DB],
      useFactory: (db: Database): LibraryRepository =>
        db ? new DrizzleLibraryRepository(db) : new InMemoryLibraryRepository(),
    },
  ],
  exports: [LibraryRepository, DocumentsService, CollectionsService],
})
export class LibraryModule {}
