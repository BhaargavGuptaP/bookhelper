import type { ReactElement } from "react";
import { Surface } from "~/shell/Surface";
import { EmptyState } from "~/shell/EmptyState";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage(): ReactElement {
  return (
    <Surface title="Analytics">
      <EmptyState
        title="Your reading & learning analytics"
        description="Reading time, retention, and mastery trends — visible after enough activity lands."
      />
    </Surface>
  );
}
