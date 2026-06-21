import type { ReactElement } from "react";
import { Suspense } from "react";
import { Surface } from "~/shell/Surface";
import { LibraryPage } from "~/library/LibraryPage";

export const metadata = { title: "Library" };

export default function Page(): ReactElement {
  return (
    <Surface title="Library">
      {/* useSearchParams() requires a Suspense boundary per Next 15 docs. */}
      <Suspense fallback={null}>
        <LibraryPage />
      </Suspense>
    </Surface>
  );
}
