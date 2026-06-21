/**
 * Build a `PdfDocumentManifest` from an opened pdfjs document.
 *
 * The builder is split from the adapter factory so it can be unit-tested
 * against a faked `PdfjsDocumentProxy`. It is purely a translation
 * layer: read metadata + permissions, decode dates, fold them into the
 * canonical shape.
 */

import type { DocumentManifest } from "@bookhelper/reader-core";
import {
  PdfPermissionFlag,
  type PdfjsDocumentProxy,
  type PdfjsOutlineNode,
} from "./internal/pdfjs.js";
import {
  pdfWritingDirection,
  type PdfDocumentManifest,
  type PdfManifestMeta,
  type PdfPermissions,
} from "./manifest.js";

export interface BuildManifestInput {
  readonly docId: string;
  readonly doc: PdfjsDocumentProxy;
  readonly outline: readonly PdfjsOutlineNode[] | null;
  readonly pageCount: number;
  readonly totalChars: number;
  readonly blockCount: number;
  readonly docVersion: number;
}

/** Decode the integer permission array pdfjs returns. */
export function decodePermissions(perms: readonly number[] | null): PdfPermissions {
  if (perms === null) {
    // Spec says: when no permissions dict is present, all operations
    // are allowed. We surface that as `null` so consumers can fail open.
    return {
      print: null,
      modify: null,
      copy: null,
      annotate: null,
      fillForms: null,
      accessibilityCopy: null,
      assemble: null,
      printHighQuality: null,
    };
  }
  const has = (flag: number): boolean => perms.includes(flag);
  return {
    print: has(PdfPermissionFlag.PRINT),
    modify: has(PdfPermissionFlag.MODIFY_CONTENTS),
    copy: has(PdfPermissionFlag.COPY),
    annotate: has(PdfPermissionFlag.MODIFY_ANNOTATIONS),
    fillForms: has(PdfPermissionFlag.FILL_INTERACTIVE_FORMS),
    accessibilityCopy: has(PdfPermissionFlag.COPY_FOR_ACCESSIBILITY),
    assemble: has(PdfPermissionFlag.ASSEMBLE),
    printHighQuality: has(PdfPermissionFlag.PRINT_HIGH_QUALITY),
  };
}

/**
 * Parse PDF date strings of the form "D:YYYYMMDDHHmmSSOHH'mm'" or
 * shorter variants into ISO 8601. Returns `undefined` if the input is
 * not parseable rather than throwing — manifest builds shouldn't fail
 * on garbage metadata.
 *
 * Accepts:
 *   • "D:20240115123045Z"
 *   • "D:20240115123045+05'30'"
 *   • Bare "20240115" / partial precision.
 */
export function parsePdfDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  let s = value.trim();
  if (!s) return undefined;
  if (s.startsWith("D:")) s = s.slice(2);
  // Match the base date+time block (length 4..14) first, then optionally
  // a Z or signed offset. Two regexes are clearer than one mega-regex
  // and easier to reason about.
  const baseMatch = /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(s);
  if (!baseMatch) return undefined;
  const [base, y, mo = "01", d = "01", h = "00", mi = "00", se = "00"] = baseMatch;
  const rest = s.slice(base.length);

  let tz = "Z";
  if (rest.length > 0) {
    if (rest[0] === "Z") {
      tz = "Z";
    } else {
      const tzMatch = /^([+-])(\d{2})'?(\d{2})?'?$/.exec(rest);
      if (tzMatch) {
        const [, sign, tzH, tzM = "00"] = tzMatch;
        tz = `${sign}${pad(tzH ?? "00")}:${pad(tzM)}`;
      } else {
        return undefined;
      }
    }
  }
  const iso = `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(se)}${tz}`;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toISOString();
}

function pad(s: string): string {
  return s.length === 1 ? `0${s}` : s;
}

/** Build the manifest. Pure: no I/O beyond what `doc` exposes. */
export async function buildManifest(input: BuildManifestInput): Promise<PdfDocumentManifest> {
  const { docId, doc, outline, pageCount, totalChars, blockCount, docVersion } = input;

  const [metadata, permissions] = await Promise.all([
    safe(() => doc.getMetadata()),
    safe(() => doc.getPermissions()),
  ]);

  const info = (metadata?.info ?? {}) as Record<string, unknown>;
  const decoded: PdfPermissions = decodePermissions(permissions ?? null);

  const title = pickString(info["Title"]);
  const author = pickString(info["Author"]);
  const subject = pickString(info["Subject"]);
  const keywords = pickString(info["Keywords"]);
  const creator = pickString(info["Creator"]);
  const producer = pickString(info["Producer"]);
  const pdfVersion = pickString(info["PDFFormatVersion"]);
  const creationDate = parsePdfDate(info["CreationDate"]);
  const modificationDate = parsePdfDate(info["ModDate"]);
  const language = pickString(info["Language"]);
  const encrypted = Boolean(info["IsEncrypted"]) || permissions !== null;
  const linearized = Boolean(info["IsLinearized"]);

  const pdfMeta: PdfManifestMeta = {
    permissions: decoded,
    encrypted,
    linearized,
    pageCount,
    fingerprints: [...doc.fingerprints],
    ...(pdfVersion ? { pdfVersion } : {}),
    ...(producer ? { producer } : {}),
    ...(creator ? { creator } : {}),
    ...(author ? { author } : {}),
    ...(subject ? { subject } : {}),
    ...(keywords ? { keywords } : {}),
    ...(creationDate ? { creationDate } : {}),
    ...(modificationDate ? { modificationDate } : {}),
  };

  const base: DocumentManifest = {
    docId,
    docVersion,
    format: "pdf",
    renderMode: "fixed",
    totalChars,
    blockCount,
    pageCount,
    ...(title ? { title } : {}),
    ...(language ? { language } : {}),
    direction: pdfWritingDirection,
    meta: { pdf: pdfMeta },
  };

  // The outline existence is reported via capabilities; we don't fold
  // it into the manifest itself (TOC lives on `getToc()`).
  void outline;

  return base as PdfDocumentManifest;
}

function pickString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
}

async function safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    return undefined;
  }
}
