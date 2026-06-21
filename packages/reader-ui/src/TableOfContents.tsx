"use client";

/**
 * **TableOfContents** — hierarchical outline with expand/collapse, active
 * section tracking, and page navigation. Pure presentation over the
 * host-resolved `ReaderTocNode[]`; navigation dispatches `reader.goto` via
 * `actions.goToPage`. Expansion state lives in the shell chrome so it is
 * remembered while the reader is open.
 */

import { useMemo } from "react";
import { useReaderContext } from "./context.js";
import { ChevronRightIcon } from "./icons.js";
import type { ReaderTocNode } from "./types.js";

/** Find the deepest entry whose page is at/before the current page. */
function computeActiveId(nodes: readonly ReaderTocNode[], currentPage: number): string | null {
  let best: { id: string; page: number } | null = null;
  const walk = (list: readonly ReaderTocNode[]): void => {
    for (const n of list) {
      if (n.page <= currentPage && (!best || n.page >= best.page)) {
        best = { id: n.id, page: n.page };
      }
      if (n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return best ? (best as { id: string }).id : null;
}

export function TableOfContents(): React.JSX.Element {
  const { toc, currentPage, chrome, actions } = useReaderContext();
  const activeId = useMemo(() => computeActiveId(toc, currentPage), [toc, currentPage]);

  if (toc.length === 0) {
    return (
      <div className="bh-reader-toc bh-reader-toc--empty">
        <p className="bh-reader-toc__empty-text">No table of contents for this document.</p>
      </div>
    );
  }

  return (
    <nav className="bh-reader-toc" aria-label="Table of contents">
      <ul className="bh-reader-toc__list" role="tree">
        {toc.map((node) => (
          <TocNode
            key={node.id}
            node={node}
            activeId={activeId}
            expanded={chrome.expandedToc}
            onToggle={actions.toggleTocNode}
            onNavigate={(page) => actions.goToPage(page)}
          />
        ))}
      </ul>
    </nav>
  );
}

function TocNode({
  node,
  activeId,
  expanded,
  onToggle,
  onNavigate,
}: {
  readonly node: ReaderTocNode;
  readonly activeId: string | null;
  readonly expanded: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onNavigate: (page: number) => void;
}): React.JSX.Element {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isActive = node.id === activeId;

  return (
    <li
      className="bh-reader-toc__item"
      role="treeitem"
      aria-level={node.depth + 1}
      aria-selected={isActive}
      aria-expanded={hasChildren ? isOpen : undefined}
      {...(isActive ? { "aria-current": "location" as const } : {})}
    >
      <div
        className="bh-reader-toc__row"
        data-active={isActive || undefined}
        style={{ paddingInlineStart: `${node.depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="bh-reader-toc__twisty"
            aria-label={isOpen ? `Collapse ${node.label}` : `Expand ${node.label}`}
            aria-expanded={isOpen}
            onClick={() => onToggle(node.id)}
            data-open={isOpen || undefined}
          >
            <ChevronRightIcon width={16} height={16} />
          </button>
        ) : (
          <span className="bh-reader-toc__twisty bh-reader-toc__twisty--leaf" aria-hidden="true" />
        )}
        <button
          type="button"
          className="bh-reader-toc__label"
          onClick={() => onNavigate(node.page)}
        >
          <span className="bh-reader-toc__label-text">{node.label}</span>
          <span className="bh-reader-toc__page" aria-hidden="true">
            {node.page}
          </span>
        </button>
      </div>
      {hasChildren && isOpen ? (
        <ul className="bh-reader-toc__list" role="group">
          {node.children.map((child) => (
            <TocNode
              key={child.id}
              node={child}
              activeId={activeId}
              expanded={expanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
