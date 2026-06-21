/**
 * **Internal pdfjs wrapper** — the *only* place in the package that imports
 * `pdfjs-dist`. Every other module talks to PDF through the narrow surface
 * defined in {@link ./engine.ts}; this file is the bridge.
 *
 * Why isolate the import here:
 *
 *   • `pdfjs-dist` has multiple entry points (modern web, legacy web,
 *     legacy node, ESM, CJS). Choosing the right one and pinning that
 *     choice in one place avoids "works on my machine" failures across
 *     the web app, the core-api worker, and tests.
 *   • Library types are not exported beyond this file — *no* downstream
 *     module needs to know that pages come from `PDFPageProxy` or that
 *     outlines come from `PDFDocumentProxy.getOutline()`.
 *   • If we ever swap engines (pdfium-wasm, mupdf-wasm) we update this
 *     file and nothing else.
 *
 * We use the **legacy** build: it runs in Node ≥ 20 *and* in a browser
 * bundle (the Reader), yielding identical output for everything the adapter
 * needs (metadata, text content, outline, annotations).
 */

// pdfjs-dist ships its own type declarations.
// The legacy build is the one that runs across Node + browser.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// pdfjs needs a `workerSrc` so its fake-worker machinery can dynamic-import
// the worker module that does the actual parsing.
const pdfjsGlobal = pdfjsLib as unknown as {
  GlobalWorkerOptions: { workerSrc: string | null };
};

let workerConfigured = false;

/**
 * Configure pdfjs' worker source **once, lazily**.
 *
 * This is deliberately not done at module-evaluation time: the `node:module`
 * resolution must never be evaluated when this file is bundled for the
 * browser (Next.js would fail to resolve a Node built-in). Doing it lazily —
 * and behind a runtime Node check with a `webpackIgnore` dynamic import —
 * keeps the module bundle-safe.
 *
 *   • Node (tests, core-api ingestion, Tauri): resolve the legacy worker
 *     module path via `createRequire`.
 *   • Browser bundle (Next.js Reader): reference the worker shipped with
 *     pdfjs-dist; the bundler emits it as an asset and rewrites the URL.
 *
 * A host that already set `GlobalWorkerOptions.workerSrc` always wins.
 */
async function configureWorker(): Promise<void> {
  if (workerConfigured) return;
  workerConfigured = true;
  const opts = pdfjsGlobal.GlobalWorkerOptions;
  if (!opts || opts.workerSrc) return;

  const isNode =
    typeof process !== "undefined" &&
    Boolean((process as { versions?: { node?: string } }).versions?.node);

  if (isNode) {
    try {
      const mod = await import(/* webpackIgnore: true */ "node:module");
      const requireFn = mod.createRequire(import.meta.url);
      opts.workerSrc = requireFn.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    } catch {
      // Best-effort — the host shell is expected to override.
      opts.workerSrc = "";
    }
    return;
  }

  try {
    opts.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href;
  } catch {
    // Host (Next.js / Tauri) is expected to configure workerSrc.
  }
}

export type PdfjsDocument =
  Awaited<ReturnType<ReturnType<typeof pdfjsLib.getDocument>["promise"]["then"]>> extends infer T
    ? T extends PromiseLike<infer U>
      ? U
      : T
    : never;

// We use a deliberately broad inline type for clarity rather than the
// labyrinth above. The shape is captured by tests; the cast is local.
export interface PdfjsDocumentProxy {
  readonly numPages: number;
  readonly fingerprints: readonly string[];
  getMetadata(): Promise<{
    readonly info: Readonly<Record<string, unknown>>;
    readonly metadata: { getAll(): Record<string, string> } | null;
  }>;
  getOutline(): Promise<readonly PdfjsOutlineNode[] | null>;
  getPage(pageNumber: number): Promise<PdfjsPageProxy>;
  getPageIndex(ref: PdfjsRef): Promise<number>;
  getDestination(name: string): Promise<unknown[] | null>;
  getPermissions(): Promise<readonly number[] | null>;
  destroy(): Promise<void>;
}

export interface PdfjsPageProxy {
  readonly pageNumber: number;
  readonly view: readonly [number, number, number, number];
  getViewport(opts: { scale: number }): { width: number; height: number };
  getTextContent(opts?: {
    includeMarkedContent?: boolean;
    disableNormalization?: boolean;
  }): Promise<{ items: readonly PdfjsTextItem[] }>;
  getAnnotations(): Promise<readonly PdfjsAnnotation[]>;
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  cleanup(): void;
}

export interface PdfjsTextItem {
  readonly str: string;
  readonly dir?: string;
  readonly width?: number;
  readonly height?: number;
  readonly transform?: readonly number[];
  readonly hasEOL?: boolean;
}

export interface PdfjsAnnotation {
  readonly subtype?: string;
  readonly url?: string;
  readonly dest?: unknown;
  readonly rect?: readonly number[];
  readonly id?: string;
  readonly fieldName?: string;
}

export interface PdfjsRef {
  readonly num: number;
  readonly gen: number;
}

export interface PdfjsOutlineNode {
  readonly title: string;
  readonly dest?: string | unknown[] | null;
  readonly url?: string | null;
  readonly items?: readonly PdfjsOutlineNode[];
}

/**
 * Permission flags pdfjs returns (subset; mirrors the PDF spec bit mask).
 * The integer values come from `pdfjsLib.PermissionFlag.*`. We hardcode
 * them so downstream code does not have to import pdfjs.
 */
export const PdfPermissionFlag = {
  PRINT: 4,
  MODIFY_CONTENTS: 8,
  COPY: 16,
  MODIFY_ANNOTATIONS: 32,
  FILL_INTERACTIVE_FORMS: 256,
  COPY_FOR_ACCESSIBILITY: 512,
  ASSEMBLE: 1024,
  PRINT_HIGH_QUALITY: 2048,
} as const;

export type PdfPermissionFlagName = keyof typeof PdfPermissionFlag;

export interface LoadOptions {
  readonly data: Uint8Array;
  readonly password?: string;
  readonly signal?: AbortSignal;
}

/**
 * Load a PDF document. Errors propagate raw — error mapping happens one
 * layer up (in `engine.ts`) so this module stays a thin bridge.
 */
export async function loadPdf(options: LoadOptions): Promise<PdfjsDocumentProxy> {
  const { data, password, signal } = options;

  if (signal?.aborted) {
    throw new DOMException("Open aborted before start", "AbortError");
  }

  await configureWorker();

  // pdfjs holds onto the buffer; we copy so a caller-owned ArrayBuffer
  // can't be mutated under us. The cost is negligible vs. parsing.
  const buf = new Uint8Array(data.byteLength);
  buf.set(data);

  const loadingTask = pdfjsLib.getDocument({
    data: buf,
    ...(password ? { password } : {}),
    // Defensive: pdfjs reads from system fonts when missing, which
    // crashes in Node. Disable that path; we never rasterize here.
    disableFontFace: true,
    useSystemFonts: false,
    // Force in-thread parsing — see the worker note above. The legacy
    // build still tries to spin up a "fake worker" if these aren't set.
    useWorkerFetch: false,
    isEvalSupported: false,
    // disableWorker is the modern option; some pdfjs versions need it
    // passed to the loading task directly. Casting because the public
    // type omits the option even though every legacy build supports it.
  } as unknown as Parameters<typeof pdfjsLib.getDocument>[0]);

  if (signal) {
    const onAbort = (): void => {
      // pdfjs' `destroy()` resolves any pending getDocument with an
      // AbortException.
      void loadingTask.destroy();
    };
    signal.addEventListener("abort", onAbort, { once: true });
  }

  const doc = await loadingTask.promise;
  return doc as unknown as PdfjsDocumentProxy;
}

/**
 * Names pdfjs uses for the error classes we care about (`name` property).
 * We match on `name` rather than `instanceof` so this code does not
 * depend on importing the error classes themselves.
 */
export const PdfjsErrorName = {
  Password: "PasswordException",
  InvalidPDF: "InvalidPDFException",
  Missing: "MissingPDFException",
  Unexpected: "UnexpectedResponseException",
  FormatError: "FormatError",
} as const;

/**
 * The integer fnArray opcode for "paint image XObject" in pdfjs. Used by
 * the image enumerator. Hardcoded because pdfjs exposes these as an
 * internal enum we'd otherwise have to spread library types for.
 *
 * See pdfjs-dist/src/shared/util.js -> OPS.
 */
export const PdfOps = {
  paintImageXObject: 85,
  paintInlineImageXObject: 86,
  paintImageXObjectRepeat: 88,
  paintImageMaskXObject: 83,
} as const;
