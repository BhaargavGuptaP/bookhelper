import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookCard } from "./BookCard";
import type { Documents } from "@bookhelper/api-contracts";

const sample: Documents.Document = {
  id: "doc_1" as Documents.DocumentId,
  ownerId: "u" as never,
  tenantId: "t" as never,
  title: "The Pragmatic Programmer",
  author: "Hunt & Thomas",
  sourceType: "epub",
  contentHash: "a".repeat(64),
  storageKey: "k",
  fileSizeBytes: 1024,
  ingestStatus: "ready",
  ingestStepVersion: 1,
  lifecycle: "active",
  isFavorite: true,
  progressPercent: 0.42,
  collectionIds: [],
  metadata: { tags: [] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("BookCard", () => {
  it("renders title, author, source badge, and a progress bar", () => {
    render(<BookCard doc={sample} onOpen={() => {}} />);
    // The title appears twice (typographic cover + meta) — `getAllByText` is correct.
    expect(screen.getAllByText("The Pragmatic Programmer").length).toBeGreaterThan(0);
    expect(screen.getByText("Hunt & Thomas")).toBeInTheDocument();
    expect(screen.getByText(/EPUB/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar", { name: /reading progress/i });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
  });

  it("invokes onOpen when activated by keyboard", async () => {
    const onOpen = vi.fn();
    render(<BookCard doc={sample} onOpen={onOpen} />);
    const btn = screen.getByRole("button", { name: /open the pragmatic programmer/i });
    btn.focus();
    await userEvent.keyboard("[Enter]");
    expect(onOpen).toHaveBeenCalledWith("doc_1");
  });

  it("shows a selection checkbox only when selectable", () => {
    const { rerender } = render(<BookCard doc={sample} onOpen={() => {}} />);
    expect(screen.queryByRole("checkbox", { name: /select the pragmatic/i })).toBeNull();
    rerender(<BookCard doc={sample} onOpen={() => {}} selectable />);
    expect(screen.getByRole("checkbox", { name: /select the pragmatic/i })).toBeInTheDocument();
  });
});
