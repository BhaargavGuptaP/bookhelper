/**
 * Test helpers used by reader-core's own tests. Kept inside `src/` so
 * they share the package's strict TypeScript settings, but excluded
 * from the published bundle via the tsup entry (only `index.ts` ships).
 *
 * Why an in-package fake adapter rather than a stub library?
 *   • The DocumentAdapter contract is the single most important seam
 *     in the project — a fake here doubles as a worked example of how
 *     to write one.
 *   • Tests need deterministic behavior; fixture-grade adapters that
 *     do real PDF/EPUB work would couple the platform tests to format
 *     libraries we explicitly chose not to ship in Sprint 3A.
 */

import type {
  AdapterOpenInput,
  DocumentAdapter,
  DocumentSession,
  LocatorResolution,
} from "./adapter.js";
import { emptyCapabilities, type ReaderCapabilities } from "./capabilities.js";
import type { BlockSummary, DocumentManifest } from "./document-model.js";
import type { LayoutEngine, LayoutWindow } from "./layout.js";
import type { Locator, PointLocator } from "./locator.js";
import type { NavigationEngine, NavigationResolution } from "./navigation.js";

const baseManifest: DocumentManifest = Object.freeze({
  docId: "fake-doc",
  docVersion: 1,
  format: "fake",
  renderMode: "reflowable",
  totalChars: 1000,
  blockCount: 4,
});

const point = (blockId: string, offset: number, globalOffset: number): PointLocator => ({
  kind: "point",
  position: { blockId, offset, globalOffset, docVersion: 1 },
});

/** A minimal deterministic adapter for use in unit tests. */
export interface FakeAdapterOptions {
  readonly name?: string;
  readonly manifest?: Partial<DocumentManifest>;
  readonly capabilities?: Partial<ReaderCapabilities>;
  /** Throw from `open()` to simulate an adapter failure. */
  readonly failOnOpen?: boolean;
}

export interface FakeAdapter extends DocumentAdapter {
  /** Last constructed document session, exposed for assertions. */
  readonly lastSession: () => DocumentSession | null;
}

export function createFakeAdapter(options: FakeAdapterOptions = {}): FakeAdapter {
  let lastSession: DocumentSession | null = null;

  const adapter: FakeAdapter = {
    name: options.name ?? "fake",
    async open(input: AdapterOpenInput): Promise<DocumentSession> {
      if (options.failOnOpen) {
        throw new Error("fake adapter intentionally failed to open");
      }
      const manifest: DocumentManifest = { ...baseManifest, ...options.manifest };
      const capabilities: ReaderCapabilities = {
        ...emptyCapabilities,
        renderModes: ["reflowable"],
        layoutModes: ["scroll"],
        selection: true,
        ...options.capabilities,
      };

      const blocks: BlockSummary[] = Array.from({ length: manifest.blockCount }, (_, i) => ({
        blockId: `b${i}`,
        ord: i,
        type: "paragraph",
        charCount: Math.floor(manifest.totalChars / manifest.blockCount),
      }));

      const layout: LayoutEngine = {
        measure(): LayoutWindow {
          return {
            from: point("b0", 0, 0),
            to: point("b1", 0, 250),
            blocks: blocks.slice(0, 2),
            progress: 0.25,
          };
        },
      };

      const navigation: NavigationEngine = {
        step({ anchor, direction }): NavigationResolution | null {
          const idx = blocks.findIndex((b) => b.blockId === anchor.position.blockId);
          const nextIdx = direction === "forward" ? idx + 1 : idx - 1;
          const target = blocks[nextIdx];
          if (!target) return null;
          return {
            target: point(target.blockId, 0, target.ord * 250),
          };
        },
        resolve(loc: PointLocator): NavigationResolution {
          return { target: loc };
        },
      };

      const session: DocumentSession = {
        manifest,
        capabilities,
        layout,
        navigation,
        blocks(): Iterable<BlockSummary> {
          return blocks;
        },
        resolveLocator(loc: Locator): LocatorResolution {
          return { locator: loc, strategy: "native", healed: false };
        },
        close(): void {
          /* no-op */
        },
      };
      lastSession = session;
      void input;
      return session;
    },
    lastSession() {
      return lastSession;
    },
  };
  return adapter;
}
