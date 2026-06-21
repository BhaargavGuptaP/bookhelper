"use client";

import { useCallback, useRef, useState, type ReactElement } from "react";
import { Button, Dialog, type ToastDescriptor } from "@bookhelper/ui";
import { ApiError } from "~/lib/api-client";
import { useUploadDocument, type UploadProgress } from "~/lib/library-hooks";
import { formatBytes } from "./format";
import { UploadIcon } from "./icons";

/**
 * Upload dialog with drag-and-drop, multi-file queue, and per-file progress.
 *
 * UX (UX-SPEC §5 + §14):
 *   • Drop zone is keyboard-actuated (`role="button"`, Space/Enter open the
 *     file picker).
 *   • Each item shows a live progress bar; failures are recoverable (the
 *     error message stays beside the item and the failed item can be removed
 *     without dismissing the dialog).
 *   • Successful uploads are emitted as toasts via the `onComplete` prop so
 *     the dialog can stay open for multi-file workflows.
 */
export interface UploadDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onComplete?: (toast: Omit<ToastDescriptor, "id">) => void;
}

interface QueueItem {
  readonly id: string;
  readonly file: File;
  status: "queued" | "uploading" | "done" | "failed";
  loaded: number;
  total: number;
  error?: string;
}

const ACCEPT =
  ".pdf,.epub,.txt,.md,.markdown,application/pdf,application/epub+zip,text/plain,text/markdown";

export function UploadDialog({ open, onOpenChange, onComplete }: UploadDialogProps): ReactElement {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const next: QueueItem[] = [];
      for (const f of Array.from(files)) {
        if (f.size === 0) continue;
        next.push({
          id: `q_${crypto.randomUUID()}`,
          file: f,
          status: "queued",
          loaded: 0,
          total: f.size,
        });
      }
      if (next.length === 0) return;
      setItems((cur) => [...cur, ...next]);
      // Kick off uploads sequentially to keep the bandwidth share fair.
      void runQueue(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const runQueue = useCallback(
    async (queue: QueueItem[]) => {
      for (const q of queue) {
        setItems((cur) => cur.map((c) => (c.id === q.id ? { ...c, status: "uploading" } : c)));
        try {
          await upload.mutateAsync({
            file: q.file,
            onProgress: ({ loaded, total }: UploadProgress) =>
              setItems((cur) => cur.map((c) => (c.id === q.id ? { ...c, loaded, total } : c))),
          });
          setItems((cur) =>
            cur.map((c) => (c.id === q.id ? { ...c, status: "done", loaded: c.total } : c)),
          );
          onComplete?.({
            title: "Uploaded",
            description: q.file.name,
            tone: "success",
          });
        } catch (err) {
          const msg =
            err instanceof ApiError
              ? (err.problem.detail ?? err.problem.title)
              : err instanceof Error
                ? err.message
                : "Upload failed";
          setItems((cur) =>
            cur.map((c) => (c.id === q.id ? { ...c, status: "failed", error: msg } : c)),
          );
          onComplete?.({
            title: "Upload failed",
            description: `${q.file.name} — ${msg}`,
            tone: "danger",
          });
        }
      }
    },
    [upload, onComplete],
  );

  const onDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add to library"
      description="Drop files here, or browse — PDF, EPUB, TXT, or Markdown."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </>
      }
    >
      <div
        className={`bh-upload__drop${over ? " bh-upload__drop--over" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => fileInput.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInput.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        aria-label="Drop files here, or activate to open the file picker"
      >
        <UploadIcon width={24} height={24} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Drop files here</div>
        <div className="bh-upload__hint">PDF · EPUB · TXT · Markdown · up to 200 MB</div>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.currentTarget.files) addFiles(e.currentTarget.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="bh-upload__list" aria-live="polite">
          {items.map((it) => {
            const pct =
              it.total > 0
                ? Math.min(100, Math.round((it.loaded / it.total) * 100))
                : it.status === "done"
                  ? 100
                  : 0;
            return (
              <li
                key={it.id}
                className={`bh-upload__item${it.status === "failed" ? " bh-upload__item--failed" : ""}`}
              >
                <span className="bh-upload__item-name">{it.file.name}</span>
                <span className="bh-upload__item-meta">
                  {it.status === "done"
                    ? "Done"
                    : it.status === "failed"
                      ? "Failed"
                      : `${pct}% · ${formatBytes(it.loaded)} / ${formatBytes(it.total)}`}
                </span>
                <div className="bh-upload__item-bar" aria-hidden="true">
                  <div className="bh-upload__item-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                {it.error ? <div className="bh-upload__item-error">{it.error}</div> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </Dialog>
  );
}
