"use client";

/**
 * PDF Reader composition root.
 *
 * This is the ONE place that knows the document is a PDF. It:
 *   1. fetches the source bytes from `GET /v1/documents/:id/content`,
 *   2. constructs the `@bookhelper/pdf-adapter` adapter over those bytes,
 *   3. registers it with a `ReaderEngine` and opens a `ReaderSession`,
 *   4. captures the opened `DocumentSession` (a thin capturing wrapper) so
 *      the render runtime + content loader can use it,
 *   5. maps the adapter's TOC + page text into the format-agnostic shapes
 *      `@bookhelper/reader-ui` consumes.
 *
 * `@bookhelper/reader-ui` never imports pdf.js or the adapter — all of that
 * lives here, behind the `ReaderBootstrap` seam.
 */

import {
  createReaderEngine,
  type DocumentAdapter,
  type DocumentSession,
  type Toc,
} from "@bookhelper/reader-core";
import {
  createPdfAdapter,
  parsePageBlockId,
  type PdfDocumentSession,
} from "@bookhelper/pdf-adapter";
import type {
  OpenedReader,
  PageContentLoader,
  ReaderBootstrap,
  ReaderTocNode,
} from "@bookhelper/reader-ui";
import { api } from "~/lib/api-client";

export interface PdfBootstrapInput {
  readonly docId: string;
  readonly docVersion: number;
  readonly pageCount: number;
}

/** Build a {@link ReaderBootstrap} for a PDF document. */
export function createPdfReaderBootstrap(input: PdfBootstrapInput): ReaderBootstrap {
  const { docId, docVersion, pageCount } = input;

  return {
    async open(signal: AbortSignal): Promise<OpenedReader> {
      // Capturing adapter: delegates to the PDF adapter but records the
      // opened session so the host can hand it to the render engine.
      let captured: PdfDocumentSession | null = null;
      const base = createPdfAdapter({
        dataSource: async ({ docId: id, signal: sig }) => {
          const buffer = await api.documents.content(id, sig);
          return new Uint8Array(buffer);
        },
        docVersion,
        // Very large PDFs: skip the eager per-page char-count pass so open
        // stays instant; locators lazy-fill on demand.
        lazyOffsetTable: pageCount > 300,
      });
      const adapter: DocumentAdapter = {
        name: base.name,
        async open(openInput) {
          const session = await base.open(openInput);
          captured = session as PdfDocumentSession;
          return session;
        },
      };

      const engine = createReaderEngine();
      engine.registerAdapter({ adapter, matches: ({ format }) => format === "pdf" });
      const session = engine.createSession({ docId, format: "pdf" });
      await session.open({ docId, signal });

      const documentSession: DocumentSession = captured ?? throwOpenFailed();
      const pdfSession = documentSession as PdfDocumentSession;

      const content: PageContentLoader = async (page, sig) => {
        const pageText = await pdfSession.extractPageText(page, sig);
        return { page, paragraphs: toParagraphs(pageText.text) };
      };

      const toc = mapToc(await resolveToc(documentSession));

      return {
        session,
        documentSession,
        content,
        toc,
        pageCount: documentSession.manifest.pageCount ?? pageCount,
      };
    },
  };
}

function throwOpenFailed(): never {
  throw new Error("PDF adapter opened without exposing a document session.");
}

async function resolveToc(session: DocumentSession): Promise<Toc | undefined> {
  if (!session.getToc) return undefined;
  return await Promise.resolve(session.getToc());
}

/** Split a normalized page string into reading paragraphs. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Map reader-core TOC entries to page-resolved reader-ui nodes. */
function mapToc(toc: Toc | undefined): ReaderTocNode[] {
  if (!toc) return [];
  return toc.map(function map(entry): ReaderTocNode {
    const parsed = parsePageBlockId(entry.anchor.position.blockId);
    return {
      id: entry.id,
      label: entry.label,
      depth: entry.depth,
      page: parsed ?? 1,
      children: entry.children ? entry.children.map(map) : [],
    };
  });
}
