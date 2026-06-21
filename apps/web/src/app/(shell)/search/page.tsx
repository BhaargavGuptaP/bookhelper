import type { ReactElement } from "react";
import { Surface } from "~/shell/Surface";
import { EmptyState } from "~/shell/EmptyState";

export const metadata = { title: "Search" };

export default function SearchPage(): ReactElement {
  return (
    <Surface title="Search">
      <EmptyState
        title="Search your corpus"
        description="Phrase and semantic search across every source you add. Lands as soon as the library + indexing pipeline are online."
      />
    </Surface>
  );
}
