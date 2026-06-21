import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UploadDialog } from "./UploadDialog";

/**
 * Mount the dialog inside a fresh QueryClient — the upload mutation reaches
 * for one and would crash otherwise. The mutation itself is unmocked because
 * we don't actually trigger it in these structural checks.
 */
describe("UploadDialog", () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
  });

  it("renders accessible drop zone + title", () => {
    render(
      <QueryClientProvider client={qc}>
        <UploadDialog open onOpenChange={() => {}} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("dialog", { name: /add to library/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /drop files here, or activate to open the file picker/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/PDF · EPUB · TXT · Markdown/)).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const onOpenChange = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <UploadDialog open onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
