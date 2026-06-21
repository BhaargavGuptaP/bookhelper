"use client";

/**
 * Client entry for `/read/[docId]`.
 *
 * Loads the Library record for display metadata, then mounts the
 * format-agnostic Reader shell with a PDF bootstrap. Non-PDF formats show a
 * graceful "not supported yet" message (only the PDF adapter ships this
 * sprint). The full-screen Reader lives OUTSIDE the app `(shell)` group, so
 * it owns the whole canvas without the app rail.
 */

import "@bookhelper/reader-ui/styles.css";
import "./reader-route.css";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Reader, type ReaderDocMeta } from "@bookhelper/reader-ui";
import { Spinner } from "@bookhelper/ui";
import { useDocument } from "~/lib/library-hooks";
import { ApiError } from "~/lib/api-client";
import { createPdfReaderBootstrap } from "./bootstrap";

export function ReaderRoute({ docId }: { readonly docId: string }): React.JSX.Element {
  const router = useRouter();
  const { data: doc, isLoading, error } = useDocument(docId);

  const isPdf = doc?.sourceType === "pdf";

  const bootstrap = useMemo(() => {
    if (!doc || !isPdf) return null;
    return createPdfReaderBootstrap({
      docId,
      docVersion: doc.ingestStepVersion ?? 1,
      pageCount: doc.pageCount ?? 0,
    });
  }, [doc, isPdf, docId]);

  const docMeta: ReaderDocMeta | null = useMemo(() => {
    if (!doc) return null;
    return {
      docId,
      title: doc.title,
      sourceType: doc.sourceType,
      ...(doc.author ? { author: doc.author } : {}),
      ...(doc.pageCount !== undefined ? { pageCount: doc.pageCount } : {}),
      ...(doc.language ? { language: doc.language } : {}),
    };
  }, [doc, docId]);

  const exit = (): void => router.push(`/library/${docId}`);

  if (isLoading) {
    return (
      <ReaderFrame>
        <Spinner size={28} label="Loading document" />
        <p className="bh-reader-launch__text">Loading…</p>
      </ReaderFrame>
    );
  }

  if (error || !doc || !docMeta) {
    const message =
      error instanceof ApiError && error.status === 404
        ? "This document could not be found."
        : "Something went wrong loading this document.";
    return (
      <ReaderFrame>
        <p className="bh-reader-launch__title">Unable to open</p>
        <p className="bh-reader-launch__text">{message}</p>
        <button type="button" className="bh-reader-launch__button" onClick={exit}>
          Back to library
        </button>
      </ReaderFrame>
    );
  }

  if (!isPdf || !bootstrap) {
    return (
      <ReaderFrame>
        <p className="bh-reader-launch__title">Format not supported yet</p>
        <p className="bh-reader-launch__text">
          The reader currently supports PDF documents. Support for {doc.sourceType.toUpperCase()} is
          coming soon.
        </p>
        <button type="button" className="bh-reader-launch__button" onClick={exit}>
          Back to library
        </button>
      </ReaderFrame>
    );
  }

  return <Reader doc={docMeta} bootstrap={bootstrap} onExit={exit} />;
}

/** Minimal full-screen frame for pre-open states (loading / error). */
function ReaderFrame({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="bh-reader-launch" role="status" aria-live="polite">
      <div className="bh-reader-launch__inner">{children}</div>
    </div>
  );
}
