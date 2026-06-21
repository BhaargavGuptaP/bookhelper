/**
 * Test-only helpers. Not exported from the package barrel; tests import
 * directly. Builds a minimal `DocumentSession` shape so the runtime
 * (which only consumes `manifest`) can be wired without pulling a real
 * adapter into Node's test environment.
 */

import {
  emptyCapabilities,
  type DocumentManifest,
  type DocumentSession,
  type LayoutEngine,
  type NavigationEngine,
  type PointLocator,
} from "@bookhelper/reader-core";

export function fakeManifest(overrides: Partial<DocumentManifest> = {}): DocumentManifest {
  return {
    docId: "doc-1",
    docVersion: 1,
    format: "pdf",
    renderMode: "fixed",
    totalChars: 1000,
    blockCount: 10,
    pageCount: 10,
    direction: "ltr",
    ...overrides,
  } as DocumentManifest;
}

const noopLayout: LayoutEngine = {
  measure: () => ({
    from: dummyPoint(),
    to: dummyPoint(),
    blocks: [],
    progress: 0,
  }),
};

const noopNavigation: NavigationEngine = {
  step: () => null,
  resolve: (locator) => ({ target: locator }),
};

function dummyPoint(): PointLocator {
  return {
    kind: "point",
    position: {
      docVersion: 1,
      blockId: "page:1",
      offset: 0,
      globalOffset: 0,
    },
  };
}

export function fakeSession(manifest: DocumentManifest = fakeManifest()): DocumentSession {
  return {
    manifest,
    capabilities: emptyCapabilities,
    layout: noopLayout,
    navigation: noopNavigation,
    getToc: () => undefined,
    blocks: () => [],
    resolveLocator: async (locator) => ({
      locator,
      strategy: "structural" as const,
      healed: false,
    }),
    close: async () => {},
  };
}
