/** Derive a human title from an (untrusted) filename: strip path + extension,
 * turn separators into spaces, collapse whitespace. */
export function deriveTitleFromFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const noExt = base.replace(/\.[a-z0-9]+$/i, "");
  const cleaned = noExt
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 500) : "Untitled";
}

/** Decode bytes as UTF-8, tolerating invalid sequences (never throws). */
export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}
