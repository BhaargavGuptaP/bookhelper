import { Injectable } from "@nestjs/common";
import { unzipSync } from "fflate";
import type { Documents } from "@bookhelper/api-contracts";
import { BadRequestError } from "@bookhelper/telemetry";
import type {
  ExtractedCover,
  ExtractionInput,
  ExtractionResult,
  SourceExtractor,
} from "./extractor.types.js";
import { decodeUtf8 } from "./filename.js";

/**
 * EPUB extractor — unzips the container, reads the OPF package document for
 * Dublin Core metadata (title/creator/language) and the embedded cover image.
 *
 * OPF fields are read with targeted regex rather than a full XML parser. This
 * is deliberate and bounded to the well-specified `dc:*`/`<meta>`/`<item>`
 * elements (documented limitation); a malformed EPUB degrades to filename
 * title, never a crash.
 */
@Injectable()
export class EpubExtractor implements SourceExtractor {
  readonly sourceType: Documents.SourceType = "epub";

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(input.bytes);
    } catch (cause) {
      throw new BadRequestError("This EPUB could not be read — the archive is invalid.", { cause });
    }

    const containerXml = files["META-INF/container.xml"];
    if (!containerXml) {
      throw new BadRequestError("This EPUB is missing its container manifest (META-INF).");
    }
    const opfPath = firstMatch(decodeUtf8(containerXml), /full-path="([^"]+)"/i);
    const opfBytes = opfPath ? files[opfPath] : undefined;
    if (!opfPath || !opfBytes) {
      throw new BadRequestError("This EPUB has no readable package document (OPF).");
    }

    const opf = decodeUtf8(opfBytes);
    const title = decodeEntities(firstMatch(opf, /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)?.trim());
    const author = decodeEntities(
      firstMatch(opf, /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i)?.trim(),
    );
    const language = decodeEntities(
      firstMatch(opf, /<dc:language[^>]*>([\s\S]*?)<\/dc:language>/i)?.trim(),
    );

    const cover = this.findCover(opf, opfPath, files);

    return {
      ...(title ? { title: title.slice(0, 200) } : {}),
      ...(author ? { author: author.slice(0, 200) } : {}),
      ...(language ? { language: language.slice(0, 20) } : {}),
      ...(cover ? { cover } : {}),
    };
  }

  private findCover(
    opf: string,
    opfPath: string,
    files: Record<string, Uint8Array>,
  ): ExtractedCover | undefined {
    const baseDir = opfPath.includes("/") ? opfPath.replace(/\/[^/]*$/, "/") : "";

    // Strategy 1: <meta name="cover" content="cover-id" />
    const coverId = firstMatch(opf, /<meta[^>]*name="cover"[^>]*content="([^"]+)"/i);
    // Strategy 2: <item ... properties="cover-image" ... />
    const propItem = firstMatch(opf, /<item[^>]*properties="[^"]*cover-image[^"]*"[^>]*>/i);

    let href: string | undefined;
    let mediaType: string | undefined;

    if (coverId) {
      const itemTag = firstMatch(
        opf,
        new RegExp(`<item[^>]*id="${escapeRegExp(coverId)}"[^>]*>`, "i"),
      );
      if (itemTag) {
        href = firstMatch(itemTag, /href="([^"]+)"/i);
        mediaType = firstMatch(itemTag, /media-type="([^"]+)"/i);
      }
    }
    if (!href && propItem) {
      href = firstMatch(propItem, /href="([^"]+)"/i);
      mediaType = firstMatch(propItem, /media-type="([^"]+)"/i);
    }
    if (!href) return undefined;

    const resolved = resolvePath(baseDir, decodeEntities(href) ?? href);
    const bytes = files[resolved] ?? files[decodeURIComponent(resolved)];
    if (!bytes) return undefined;

    return { bytes, contentType: mediaType ?? inferImageType(resolved) };
  }
}

// ── helpers ──────────────────────────────────────────────────────────────
function firstMatch(input: string, re: RegExp): string | undefined {
  const m = re.exec(input);
  return m?.[1] ?? (m ? m[0] : undefined);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function resolvePath(baseDir: string, href: string): string {
  const parts = (baseDir + href).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

function inferImageType(path: string): string {
  const ext = path.toLowerCase().split(".").pop();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}
