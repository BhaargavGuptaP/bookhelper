import type { ReactElement } from "react";
import { Surface } from "~/shell/Surface";
import { BookDetails } from "~/library/BookDetails";

export const metadata = { title: "Book" };

export default async function BookPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  return (
    <Surface title="Book">
      <BookDetails id={id} />
    </Surface>
  );
}
