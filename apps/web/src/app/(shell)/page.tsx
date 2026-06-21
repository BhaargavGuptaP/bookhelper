import type { ReactElement } from "react";
import { Surface } from "~/shell/Surface";
import { EmptyState } from "~/shell/EmptyState";

/**
 * Home — UX-SPECIFICATION §2.0:
 *   "The calm launchpad — resume reading, today's reviews, recent, surfaced
 *   connections. Answers 'what should I do now?' in one glance."
 *
 * Sprint 1 renders the calm empty state — there is no corpus yet, no
 * reviews, no graph. The widgets land alongside the features they
 * aggregate.
 */
export default function HomePage(): ReactElement {
  return (
    <Surface title="Home">
      <EmptyState
        title="Welcome to BookHelper"
        description="This is your launchpad. As you add sources and build a knowledge graph, Home will resume your reading, surface today's reviews, and connect ideas across your library."
      />
    </Surface>
  );
}
