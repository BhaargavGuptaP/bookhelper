import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Reader } from "./Reader.js";
import { createMemoryReaderStorage } from "./persistence.js";
import { makeFakeBootstrap, SAMPLE_TOC } from "./test/fakes.js";
import type { ReaderDocMeta } from "./types.js";

const doc: ReaderDocMeta = {
  docId: "doc_test",
  title: "Fake Document",
  author: "A. Author",
  sourceType: "pdf",
  pageCount: 5,
};

function renderReader(overrides: Partial<Parameters<typeof Reader>[0]> = {}) {
  const storage = overrides.storage ?? createMemoryReaderStorage();
  const onExit = (overrides.onExit ?? vi.fn()) as ReturnType<typeof vi.fn>;
  const bootstrap = overrides.bootstrap ?? makeFakeBootstrap({ docId: doc.docId, pageCount: 5 });
  render(<Reader doc={doc} bootstrap={bootstrap} onExit={onExit} storage={storage} />);
  return { storage, onExit };
}

describe("<Reader>", () => {
  it("opens the document and renders the reading surface", async () => {
    renderReader();
    // Title in the toolbar.
    expect(await screen.findAllByText("Fake Document")).not.toHaveLength(0);
    // Page 1 content renders once ready.
    expect(await screen.findByText("This is the text of page 1.")).toBeInTheDocument();
    // Toolbar landmark + status bar.
    expect(screen.getByRole("toolbar", { name: "Reader toolbar" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Page 1 of 5");
  });

  it("renders disabled 'Coming soon' affordances for unshipped features", async () => {
    renderReader();
    await screen.findByRole("toolbar", { name: "Reader toolbar" });
    for (const label of ["Search", "Bookmark", "Highlight", "Ask AI"]) {
      const btn = screen.getByRole("button", { name: new RegExp(`${label} — Coming soon`) });
      expect(btn).toBeDisabled();
    }
  });

  it("restores the last-read page from the persisted session record", async () => {
    const storage = createMemoryReaderStorage();
    storage.saveSession(doc.docId, {
      page: 3,
      zoom: 1,
      lastOpenedAt: 1,
      lastClosedAt: 2,
      totalReadingMs: 0,
      updatedAt: 2,
    });
    renderReader({ storage });
    const input = (await screen.findByRole("spinbutton")) as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe("3"));
  });

  it("auto-opens the table of contents on desktop and navigates", async () => {
    const bootstrap = makeFakeBootstrap({ docId: doc.docId, pageCount: 5, toc: SAMPLE_TOC });
    renderReader({ bootstrap });
    const nav = await screen.findByRole("navigation", { name: "Table of contents" });
    expect(within(nav).getByText("Chapter One")).toBeInTheDocument();
    expect(within(nav).getByText("Chapter Two")).toBeInTheDocument();
  });

  it("persists a session record and calls onExit when leaving", async () => {
    const { storage, onExit } = renderReader();
    await screen.findByRole("toolbar", { name: "Reader toolbar" });
    await userEvent.click(screen.getByRole("button", { name: "Back to library" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(storage.loadSession(doc.docId)).not.toBeNull();
  });

  it("surfaces an error state when the bootstrap fails", async () => {
    const failing = {
      open: () => Promise.reject(new Error("network down")),
    };
    renderReader({ bootstrap: failing });
    expect(await screen.findByText("This document couldn’t be opened")).toBeInTheDocument();
    expect(screen.getByText("network down")).toBeInTheDocument();
  });
});
