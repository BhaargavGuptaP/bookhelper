import type { ReactElement } from "react";
import { Surface } from "~/shell/Surface";
import { EmptyState } from "~/shell/EmptyState";

export const metadata = { title: "Settings" };

export default function SettingsPage(): ReactElement {
  return (
    <Surface title="Settings">
      <EmptyState
        title="Settings"
        description="Preferences for reading, AI, learning, privacy, appearance, and accessibility will surface here."
      />
    </Surface>
  );
}
