/**
 * Build a reader-core `Toc` from the PDF's outline.
 *
 * Each outline node resolves to a target page via the destination
 * resolver. Nodes that can't be resolved (the destination references a
 * non-existent page, or the document has no Names dict) are dropped —
 * we never surface clickable TOC entries that go nowhere.
 *
 * The transform is shallow and recursive: pdfjs hands us a tree, we
 * walk it producing `TocEntry`s with stable ids (`toc:<depth>:<n>`)
 * and `PointLocator` anchors at the start of the target page.
 */

import type { Toc, TocEntry } from "@bookhelper/reader-core";
import { resolveDestinationToPage } from "./destinations.js";
import type { PdfjsDocumentProxy, PdfjsOutlineNode } from "./internal/pdfjs.js";
import { type CodecContext, pointAtPageStart } from "./locator-codec.js";

export interface BuildTocInput {
  readonly doc: PdfjsDocumentProxy;
  readonly outline: readonly PdfjsOutlineNode[] | null;
  readonly codec: CodecContext;
}

export async function buildToc(input: BuildTocInput): Promise<Toc | undefined> {
  if (!input.outline || input.outline.length === 0) return undefined;
  const entries = await walk(input.outline, 0, input);
  return entries.length > 0 ? Object.freeze(entries) : undefined;
}

async function walk(
  nodes: readonly PdfjsOutlineNode[],
  depth: number,
  ctx: BuildTocInput,
  prefix = "",
): Promise<readonly TocEntry[]> {
  const out: TocEntry[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i]!;
    const id = `toc:${prefix}${i}`;
    const page = await pageForOutlineNode(ctx.doc, node);
    if (page === null) continue;
    const children = node.items ? await walk(node.items, depth + 1, ctx, `${prefix}${i}:`) : [];
    const entry: TocEntry = {
      id,
      label: (node.title ?? "").trim() || `Page ${page}`,
      depth,
      anchor: pointAtPageStart(ctx.codec, page),
      ...(children.length > 0 ? { children } : {}),
    };
    out.push(entry);
  }
  return out;
}

async function pageForOutlineNode(
  doc: PdfjsDocumentProxy,
  node: PdfjsOutlineNode,
): Promise<number | null> {
  if (typeof node.url === "string" && node.url.length > 0) {
    // External URL outline entries don't have a target page — skip.
    return null;
  }
  if (node.dest === undefined || node.dest === null) return null;
  return resolveDestinationToPage(doc, node.dest);
}
