/**
 * Test-only helpers — fixture generation and a faked
 * `PdfjsDocumentProxy` for unit tests that should not pay the cost of
 * spinning up real pdfjs.
 *
 * The fixtures are generated with `pdf-lib` at runtime so we can:
 *
 *   • Avoid committing binary PDFs to the repo.
 *   • Vary metadata, page count, outline, language, etc. per test.
 *   • Match the manifest builder's date parsing against real
 *     producer-emitted dates.
 *
 * `pdf-lib` is the same library the core-api ingestion path already
 * depends on, so the dev dependency is essentially free.
 */

import { PDFDocument, PDFName, PDFString, StandardFonts } from "pdf-lib";
import type {
  PdfjsAnnotation,
  PdfjsDocumentProxy,
  PdfjsOutlineNode,
  PdfjsPageProxy,
  PdfjsTextItem,
} from "./internal/pdfjs.js";

export interface BuildFixtureOptions {
  readonly title?: string;
  readonly author?: string;
  readonly subject?: string;
  readonly keywords?: string;
  readonly producer?: string;
  readonly creator?: string;
  readonly language?: string;
  readonly pageTexts?: readonly string[];
  /** When omitted, defaults to one blank page. */
  readonly pageCount?: number;
}

/** Build a tiny PDF as a Uint8Array. */
export async function buildPdfFixture(options: BuildFixtureOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  if (options.title) doc.setTitle(options.title);
  if (options.author) doc.setAuthor(options.author);
  if (options.subject) doc.setSubject(options.subject);
  if (options.keywords) doc.setKeywords([options.keywords]);
  if (options.producer) doc.setProducer(options.producer);
  if (options.creator) doc.setCreator(options.creator);
  if (options.language) {
    // pdf-lib doesn't expose setLanguage; write directly into the catalog.
    doc.catalog.set(PDFName.of("Lang"), PDFString.of(options.language));
  }
  const texts = options.pageTexts ?? [];
  const pages = options.pageCount ?? Math.max(1, texts.length);
  const font = await doc.embedStandardFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage([300, 400]);
    const text = texts[i];
    if (text) {
      page.drawText(text, { x: 50, y: 350, size: 12, font });
    }
  }
  return await doc.save();
}

// ──────────────────────────────────────────────────────────────────────────
// Fake pdfjs proxy used by unit tests that don't want to load real PDFs.
// ──────────────────────────────────────────────────────────────────────────

export interface FakePageInput {
  readonly text?: readonly PdfjsTextItem[];
  readonly annotations?: readonly PdfjsAnnotation[];
  readonly opcodes?: readonly { fn: number; args: unknown[] }[];
  readonly viewWidth?: number;
  readonly viewHeight?: number;
}

export interface FakeDocOptions {
  readonly numPages?: number;
  readonly info?: Record<string, unknown>;
  readonly permissions?: readonly number[] | null;
  readonly outline?: readonly PdfjsOutlineNode[] | null;
  readonly destinations?: Record<string, unknown[]>;
  readonly pages?: readonly FakePageInput[];
}

export function createFakePdfjsDocument(options: FakeDocOptions = {}): PdfjsDocumentProxy {
  const numPages = options.numPages ?? options.pages?.length ?? 1;
  const pages = options.pages ?? [];
  const destinations = options.destinations ?? {};
  const cleanupSpy = { count: 0 };

  function fakePage(pageNumber: number): PdfjsPageProxy {
    const p = pages[pageNumber - 1] ?? {};
    return {
      pageNumber,
      view: [0, 0, p.viewWidth ?? 300, p.viewHeight ?? 400] as const,
      getViewport: ({ scale }: { scale: number }) => ({
        width: (p.viewWidth ?? 300) * scale,
        height: (p.viewHeight ?? 400) * scale,
      }),
      async getTextContent() {
        return { items: p.text ?? [] };
      },
      async getAnnotations() {
        return p.annotations ?? [];
      },
      async getOperatorList() {
        const fnArray: number[] = [];
        const argsArray: unknown[][] = [];
        for (const op of p.opcodes ?? []) {
          fnArray.push(op.fn);
          argsArray.push(op.args);
        }
        return { fnArray, argsArray };
      },
      cleanup() {
        cleanupSpy.count += 1;
      },
    };
  }

  const doc: PdfjsDocumentProxy = {
    numPages,
    fingerprints: ["fake-fingerprint-1"],
    async getMetadata() {
      return { info: Object.freeze({ ...(options.info ?? {}) }), metadata: null };
    },
    async getOutline() {
      return options.outline ?? null;
    },
    async getPage(pageNumber: number) {
      return fakePage(pageNumber);
    },
    async getPageIndex(ref) {
      // Encode the test page index in the `num` field for convenience.
      return Math.max(0, ref.num - 1);
    },
    async getDestination(name: string) {
      return destinations[name] ?? null;
    },
    async getPermissions() {
      return options.permissions ?? null;
    },
    async destroy() {
      /* no-op */
    },
  };
  return doc;
}
