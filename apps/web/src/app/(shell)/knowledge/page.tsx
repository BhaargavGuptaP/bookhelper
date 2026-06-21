import type { ReactElement } from "react";
import { Surface } from "~/shell/Surface";
import { EmptyState } from "~/shell/EmptyState";

export const metadata = { title: "Knowledge" };

export default function KnowledgePage(): ReactElement {
  return (
    <Surface title="Knowledge">
      <EmptyState
        title="Your knowledge graph"
        description="Concepts, entities, and frameworks extracted from your sources will be explorable here as soon as ingestion lights up."
      />
    </Surface>
  );
}
