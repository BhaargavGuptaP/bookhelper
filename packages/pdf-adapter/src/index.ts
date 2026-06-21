/**
 * `@bookhelper/pdf-adapter` — public surface.
 *
 * The only stable entry point is `createPdfAdapter`. Everything else is
 * either a type the consumer may want to import for typing, or a small
 * pure helper (codec / capability builder) callers can use directly in
 * tests. **pdfjs-dist types never leave this package.**
 */

// Factory + session type
export { createPdfAdapter } from "./adapter.js";
export type { CreatePdfAdapterOptions, PdfDataSource, PdfDocumentSession } from "./adapter.js";

// Manifest
export type { PdfDocumentManifest, PdfManifestMeta, PdfPermissions } from "./manifest.js";
export { isPdfManifest } from "./manifest.js";

// Errors
export { PdfAdapterError, mapPdfError } from "./errors.js";
export type { PdfErrorCode } from "./errors.js";

// Codec
export {
  PDF_BLOCK_PREFIX,
  buildOffsetTable,
  pageBlockId,
  pageOffsetFromPosition,
  parsePageBlockId,
  pointAtPageStart,
  positionFromPageOffset,
} from "./locator-codec.js";
export type { CodecContext, PageOffsetTable } from "./locator-codec.js";

// Text
export { buildPageText, extractPageText, streamText } from "./text.js";
export type { PageText, TextItem } from "./text.js";

// Images
export { listImagesOnPage } from "./images.js";
export type { PdfImageDescriptor, PdfImageKind } from "./images.js";

// Links
export { listLinksOnPage } from "./links.js";
export type { PdfLink } from "./links.js";

// TOC
export { buildToc } from "./toc.js";
export type { BuildTocInput } from "./toc.js";

// Capabilities
export { buildCapabilities, probeCapabilities } from "./capabilities.js";
export type { BuildCapabilitiesInput, CapabilityProbe } from "./capabilities.js";

// Destinations
export { resolveDestinationToPage } from "./destinations.js";

// Navigation helpers (exposed for tests)
export {
  createPdfNavigationEngine,
  flattenChapterPages,
  stepThroughChapters,
} from "./navigation-engine.js";

// Layout
export { createPdfLayoutEngine } from "./layout-engine.js";
