/**
 * Opaque keyset cursor. Encodes the sort value of the last row plus its id
 * (the stable tiebreaker). The contract treats `cursor` as an opaque string,
 * so the exact encoding is private to the server.
 */
export interface CursorPayload {
  /** Stringified sort value of the boundary row. */
  readonly v: string;
  /** Id of the boundary row (tiebreaker). */
  readonly id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as CursorPayload).v === "string" &&
      typeof (parsed as CursorPayload).id === "string"
    ) {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/** The raw value used as the keyset key for a given sort field. */
export function sortValueOf(
  doc: {
    createdAt: string;
    lastOpenedAt?: string;
    title: string;
    author?: string;
    progressPercent: number;
    fileSizeBytes: number;
  },
  sortBy: "createdAt" | "lastOpenedAt" | "title" | "author" | "progressPercent" | "fileSizeBytes",
): string {
  switch (sortBy) {
    case "createdAt":
      return doc.createdAt;
    case "lastOpenedAt":
      return doc.lastOpenedAt ?? "";
    case "title":
      return doc.title.toLocaleLowerCase();
    case "author":
      return (doc.author ?? "").toLocaleLowerCase();
    case "progressPercent":
      return doc.progressPercent.toString().padStart(12, "0");
    case "fileSizeBytes":
      return doc.fileSizeBytes.toString().padStart(20, "0");
  }
}
