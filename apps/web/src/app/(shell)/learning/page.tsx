import type { ReactElement } from "react";
import { Surface } from "~/shell/Surface";
import { EmptyState } from "~/shell/EmptyState";

export const metadata = { title: "Learning" };

export default function LearningPage(): ReactElement {
  return (
    <Surface title="Learning">
      <EmptyState
        title="Review, tutor, and progress"
        description="Today's reviews, AI tutor sessions, and study plans will appear once you have a corpus to learn from."
      />
    </Surface>
  );
}
