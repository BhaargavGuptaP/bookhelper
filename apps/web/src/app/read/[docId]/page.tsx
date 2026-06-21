import type { ReactElement } from "react";
import { ReaderRoute } from "~/reader/ReaderRoute";

/**
 * `/read/[docId]` — the full-screen Reader.
 *
 * Deliberately a top-level route (sibling to the `(shell)` group) so it
 * takes the whole canvas without the app rail / bottom nav. The root layout
 * still provides ThemeProvider + QueryProvider. All reader logic is client
 * side (`ReaderRoute`), which fetches the document and mounts the shell.
 */
export default async function ReadPage({
  params,
}: {
  readonly params: Promise<{ docId: string }>;
}): Promise<ReactElement> {
  const { docId } = await params;
  return <ReaderRoute docId={docId} />;
}
