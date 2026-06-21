/**
 * Test doubles for the Reader shell.
 *
 * We use the **real** reader-core session against a tiny fake
 * `DocumentAdapter`, mirroring the production composition-root pattern (a
 * capturing adapter that exposes the opened `DocumentSession` to the host).
 * This exercises the genuine command bus, store, and lifecycle rather than
 * a mock of them.
 */

import {
  createReaderSession,
  emptyCapabilities,
  type DocumentAdapter,
  type DocumentSession,
  type Locator,
  type LocatorResolution,
  type NavigationResolution,
  type PointLocator,
} from "@bookhelper/reader-core";
import type { OpenedReader, PageContentLoader, ReaderBootstrap, ReaderTocNode } from "../types.js";

function pageLocator(page: number): PointLocator {
  return {
    kind: "point",
    position: { docVersion: 1, blockId: `page:${page}`, offset: 0, globalOffset: 0 },
  };
}

function pageOf(locator: PointLocator): number {
  const id = locator.position.blockId;
  const n = Number.parseInt(String(id).replace("page:", ""), 10);
  return Number.isFinite(n) ? n : 1;
}

interface CapturingAdapter extends DocumentAdapter {
  lastSession: DocumentSession | null;
}

export function makeFakeAdapter(docId: string, pageCount: number): CapturingAdapter {
  const adapter: CapturingAdapter = {
    name: "pdf",
    lastSession: null,
    async open() {
      const session: DocumentSession = {
        manifest: {
          docId,
          docVersion: 1,
          format: "pdf",
          renderMode: "fixed",
          totalChars: pageCount * 200,
          blockCount: pageCount,
          pageCount,
          title: "Fake Document",
        },
        capabilities: {
          ...emptyCapabilities,
          renderModes: ["fixed"],
          layoutModes: ["scroll"],
          toc: true,
          pageNumbers: true,
          selection: true,
          links: true,
          zoom: true,
          copy: true,
          images: true,
        },
        layout: {
          measure: () => ({ from: pageLocator(1), to: pageLocator(1), blocks: [], progress: 0 }),
        },
        navigation: {
          step({ anchor, direction }): NavigationResolution | null {
            const cur = pageOf(anchor);
            const next = direction === "forward" ? cur + 1 : cur - 1;
            if (next < 1 || next > pageCount) return null;
            return { target: pageLocator(next) };
          },
          resolve(locator: PointLocator): NavigationResolution {
            const p = Math.min(Math.max(1, pageOf(locator)), pageCount);
            return { target: pageLocator(p) };
          },
        },
        blocks: () => [],
        resolveLocator: (locator: Locator): LocatorResolution => ({
          locator,
          strategy: "structural",
          healed: false,
        }),
        getToc: () => undefined,
        close: () => {},
      };
      adapter.lastSession = session;
      return session;
    },
  };
  return adapter;
}

export interface FakeBootstrapOptions {
  readonly docId?: string;
  readonly pageCount?: number;
  readonly toc?: readonly ReaderTocNode[];
  /** Override the page content loader. */
  readonly content?: PageContentLoader;
}

export function makeFakeBootstrap(options: FakeBootstrapOptions = {}): ReaderBootstrap {
  const docId = options.docId ?? "doc_test";
  const pageCount = options.pageCount ?? 5;
  const content: PageContentLoader =
    options.content ??
    ((page) => Promise.resolve({ page, paragraphs: [`This is the text of page ${page}.`] }));

  return {
    async open(): Promise<OpenedReader> {
      const adapter = makeFakeAdapter(docId, pageCount);
      const session = createReaderSession({ adapter });
      await session.open({ docId });
      const documentSession = adapter.lastSession;
      if (!documentSession) throw new Error("fake adapter did not open a session");
      return {
        session,
        documentSession,
        content,
        toc: options.toc ?? [],
        pageCount,
      };
    },
  };
}

export const SAMPLE_TOC: readonly ReaderTocNode[] = [
  {
    id: "c1",
    label: "Chapter One",
    depth: 0,
    page: 1,
    children: [{ id: "c1-1", label: "Section 1.1", depth: 1, page: 2, children: [] }],
  },
  { id: "c2", label: "Chapter Two", depth: 0, page: 4, children: [] },
];
